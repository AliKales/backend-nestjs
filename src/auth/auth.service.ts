import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/entities/user.entity';
import { UserCols } from 'src/users/entities/user.enum';
import { Tables } from 'src/database/database.tables';
import { RefreshTokenCols } from './entities/refresh-token.enum';
import { EmailService } from 'src/email/email.service';
import { generateOtp } from 'src/common/utils/otp.util';
import { OtpCols } from './entities/otp.enum';
import { VerifyOTPDto } from './dto/verifyOTP.dto';
import { Otp } from './entities/otp.entity';
import { modifyDate } from 'src/common/utils/date.util';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { validateEmail, validatePassword } from 'src/common/utils/validator.util';
import { RequestLoginOtpDto } from './dto/request-login-otp.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';
import { ChangePasswordDto } from './dto/change-password-dto';
import { AppErrorCode } from 'src/common/constants/errors';
import { AppException } from 'src/common/exceptions/app.exception';
import { RealtimeGateway } from 'src/realtime/realtime/realtime.gateway';
import { createRealtimePayload, RealtimeMessageCodes } from 'src/common/constants/realtime';
import { DeleteAccountDto } from './dto/delete-account.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly db: DatabaseService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
        private readonly realtime: RealtimeGateway,
    ) { }

    async login(dto: LoginDto) {
        if (!validateEmail(dto.email)) {
            throw new AppException(AppErrorCode.INVALID_EMAIL, HttpStatus.BAD_REQUEST)
        }
        if (dto.password.length < 6) {
            throw new AppException(AppErrorCode.PASSWORD_LENGTH, HttpStatus.BAD_REQUEST)
        }

        // We return email from DB and we do not use email from request to send emails in order to avoid potential hacking
        const userRequest = await this.db.select(Tables.USERS, { [UserCols.EMAIL]: dto.email }, [UserCols.ID, UserCols.EMAIL, UserCols.IS_VERIFIED, UserCols.PASSWORD_HASH])
        const user = userRequest.rows[0] as User | null | undefined

        if (!user) {
            throw new AppException(AppErrorCode.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED)
        }

        const isPassValid = await bcrypt.compare(dto.password, user.password_hash)
        if (!isPassValid) {
            throw new AppException(AppErrorCode.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED)
        }

        if (!user.is_verified) {
            const otpRequest = await this.db.select(Tables.OTPS, { [OtpCols.USER_ID]: user.id })
            const otpResponse = otpRequest.rows[0] as Otp | null | undefined

            if (otpResponse && new Date() > modifyDate(otpResponse.expires_at, -5, "minute")) {
                await this.deleteOTP(otpResponse.id)
                const createdOtp = await this.createOTP(user.id, user.email)

                this.emailService.sendVerificationEmail(user.email, createdOtp.otp).catch(console.error);
            }

            throw new AppException(AppErrorCode.EMAIL_NOT_VERIFIED, HttpStatus.UNAUTHORIZED)
        }

        const responseToken = await this.createToken(user.id, user.email)

        // We send to email from DB
        // User should not touch email sending function
        this.emailService.sendLoginNotification(user.email).catch(console.error);
        this.realtime.sendToUser(user.id, createRealtimePayload(RealtimeMessageCodes.LOGGED_IN))

        return { message: "Logged in", token: responseToken }

    }

    async register(dto: RegisterDto) {
        if (!validateEmail(dto.email)) {
            throw new AppException(AppErrorCode.INVALID_EMAIL, HttpStatus.BAD_REQUEST)
        }
        const passwordValidationErrors = validatePassword(dto.password)
        if (passwordValidationErrors.length > 0) {
            throw new BadRequestException(passwordValidationErrors.join(' - '));
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(dto.password, saltRounds);

        try {
            const result = await this.db.insert(Tables.USERS, { [UserCols.EMAIL]: dto.email, [UserCols.PASSWORD_HASH]: passwordHash }, [UserCols.ID, UserCols.EMAIL, UserCols.CREATED_AT]);
            const newUser = result.rows[0] as User | null | undefined;

            if (!newUser) {
                throw new AppException(AppErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
            }

            const otpResponse = await this.createOTP(newUser.id, newUser.email)

            this.emailService.sendVerificationEmail(newUser.email, otpResponse.otp).catch(console.error);

            return {
                message: 'Registration successful. Please check your email for the OTP.',
            };
        } catch (error) {
            console.error(error);

            if (error.code === '23505') {
                throw new AppException(AppErrorCode.EMAIL_ALREADY_EXISTS, HttpStatus.CONFLICT)
            }
            throw new AppException(AppErrorCode.DATABASE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async requestLoginOtp(dto: RequestLoginOtpDto) {
        if (!validateEmail(dto.email)) {
            throw new AppException(AppErrorCode.INVALID_EMAIL, HttpStatus.BAD_REQUEST)
        }

        // We return email from DB and we do not use email from request to send emails in order to avoid potential hacking
        const userSelectResponse = await this.db.select(Tables.USERS, { [UserCols.EMAIL]: dto.email }, [UserCols.ID, UserCols.EMAIL, UserCols.IS_VERIFIED])
        const user = userSelectResponse.rows[0] as User | null | undefined

        // We do not say that user doesn't exist otherwise hackers can use this data to find emails used
        if (!user || user.is_verified === false) {
            return { message: 'If this email is registered and verified, a login code has been sent.' };
        }

        const otpSelectResponse = await this.db.select(Tables.OTPS, { [OtpCols.USER_ID]: user.id }, [OtpCols.ID, OtpCols.EXPIRES_AT])
        const lastOtp = otpSelectResponse.rows[0] as Otp | null | undefined

        // If a code already sent and not expired
        // We check five minute before of expire_at to prevent potential bugs
        if (lastOtp && new Date() < modifyDate(lastOtp.expires_at, -5, "minute")) {
            return { message: 'If this email is registered and verified, a login code has been sent.' };
        }

        if (lastOtp) {
            await this.deleteOTP(lastOtp.id)
        }

        const createdOtp = await this.createOTP(user.id, user.email)

        // We send to email from DB
        // User should not touch email sending function
        this.emailService.sendLoginOtpEmail(user.email, createdOtp.otp).catch(console.error);

        return { message: 'If this email is registered and verified, a login code has been sent.' };
    }

    async verifyLoginOtp(dto: VerifyLoginOtpDto) {
        if (!validateEmail(dto.email)) {
            throw new AppException(AppErrorCode.INVALID_EMAIL, HttpStatus.BAD_REQUEST)
        }
        if (dto.otp_code.length !== 6) {
            throw new AppException(AppErrorCode.OTP_INVALID, HttpStatus.BAD_REQUEST)
        }

        const record = await this.getUserAndOTP(undefined, dto.email);

        if (!record) throw new AppException(AppErrorCode.INVALID_LOGIN_ATTEMPT, HttpStatus.UNAUTHORIZED)
        if (record.otp_code !== dto.otp_code) throw new AppException(AppErrorCode.OTP_INVALID, HttpStatus.BAD_REQUEST)
        if (new Date() > record.expires_at) throw new AppException(AppErrorCode.OTP_INVALID, HttpStatus.BAD_REQUEST)

        await this.deleteOTP(record.otp_id)

        const token = await this.createToken(record.id, record.email)

        this.emailService.sendLoginNotification(record.email).catch(console.error);
        this.realtime.sendToUser(record.id, createRealtimePayload(RealtimeMessageCodes.LOGGED_IN))

        return { message: "Logged in", token: token }
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const { old_password, new_password } = dto;

        const userRequest = await this.db.select(Tables.USERS, { [UserCols.ID]: userId }, [UserCols.EMAIL, UserCols.PASSWORD_HASH, UserCols.LAST_PASSWORD_CHANGE_AT])
        const user = userRequest.rows[0] as User | null | undefined

        if (!user) {
            throw new AppException(AppErrorCode.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED)
        }

        if (user.last_password_change_at && new Date() < modifyDate(user.last_password_change_at, 5, "minute")) {
            throw new AppException(AppErrorCode.PASSWORD_CHANGE_TOO_FREQUENT, HttpStatus.BAD_REQUEST);
        }

        const isOldPasswordValid = await bcrypt.compare(old_password, user.password_hash)
        if (!isOldPasswordValid) {
            throw new AppException(AppErrorCode.INCORRECT_CURRENT_PASSWORD, HttpStatus.UNAUTHORIZED)
        }

        if (old_password !== new_password) {
            throw new AppException(AppErrorCode.PASSWORD_SAME_AS_OLD, HttpStatus.BAD_REQUEST)
        }

        const passwordValidationErrors = validatePassword(new_password)
        if (passwordValidationErrors.length > 0) {
            throw new BadRequestException(passwordValidationErrors.join(' - '));
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(new_password, saltRounds);

        await this.db.update(Tables.USERS, { [UserCols.PASSWORD_HASH]: passwordHash, [UserCols.LAST_PASSWORD_CHANGE_AT]: new Date() }, { [UserCols.ID]: userId })

        // Log out all devices
        this.db.delete(Tables.REFRESH_TOKENS, { [RefreshTokenCols.USER_ID]: userId }).catch(console.error)

        this.emailService.sendPasswordChangeNotification(user.email)

        const token = await this.createToken(userId, user.email)

        return { message: "Password changed", token: token }
    }

    async requestDeleteAccount(userId: string) {
        const userRequest = await this.db.select(Tables.USERS, { [UserCols.ID]: userId }, [UserCols.EMAIL, UserCols.ID])
        const user = userRequest.rows[0] as User | null | undefined

        if (!user) {
            throw new AppException(AppErrorCode.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED)
        }

        const otpSelectResponse = await this.db.select(Tables.OTPS, { [OtpCols.USER_ID]: user.id }, [OtpCols.ID, OtpCols.EXPIRES_AT])
        const lastOtp = otpSelectResponse.rows[0] as Otp | null | undefined

        // If a code already sent and not expired
        // We check five minute before of expire_at to prevent potential bugs
        if (lastOtp && new Date() < modifyDate(lastOtp.expires_at, -5, "minute")) {
            return { message: 'OTP code already sent to your mail' };
        }

        const createdOtp = await this.createOTP(user.id, user.email)

        // We send to email from DB
        // User should not touch email sending function
        this.emailService.sendAccountDeleteOtp(user.email, createdOtp.otp).catch(console.error);

        return { message: 'OTP code sent to your mail' };
    }

    async verifyDeleteAccount(userId: string, email: string, dto: DeleteAccountDto) {
        if (dto.otp_code.length !== 6) {
            throw new AppException(AppErrorCode.OTP_INVALID, HttpStatus.BAD_REQUEST)
        }

        const record = await this.getUserAndOTP(undefined, email);

        if (!record) throw new AppException(AppErrorCode.INVALID_LOGIN_ATTEMPT, HttpStatus.UNAUTHORIZED)
        if (record.otp_code !== dto.otp_code) throw new AppException(AppErrorCode.OTP_INVALID, HttpStatus.BAD_REQUEST)
        if (new Date() > record.expires_at) throw new AppException(AppErrorCode.OTP_INVALID, HttpStatus.BAD_REQUEST)

        return await this.deleteAccount(userId)
    }

    async deleteAccount(userId: string) {
        await this.db.delete(Tables.USERS, { [UserCols.ID]: userId })

        return { message: 'Account is deleted' }
    }

    async refreshTokens(dto: RefreshTokenDto) {
        const { refresh_token } = dto

        const responseQueryRefreshToken = await this.db.delete(Tables.REFRESH_TOKENS, { [RefreshTokenCols.TOKEN]: refresh_token }, '*')
        const tokenRecord = responseQueryRefreshToken.rows[0] as RefreshToken | null | undefined

        if (!tokenRecord) {
            throw new AppException(AppErrorCode.REFRESH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED)
        }
        if (new Date() > tokenRecord.refresh_token_expires_at) {
            throw new AppException(AppErrorCode.REFRESH_TOKEN_EXPIRED, HttpStatus.UNAUTHORIZED)
        }

        const responseQueryUser = await this.db.select(Tables.USERS, { [UserCols.ID]: tokenRecord.user_id }, [UserCols.ID, UserCols.EMAIL])
        const userRecord = responseQueryUser.rows[0] as User | null | undefined

        if (!userRecord) {
            throw new AppException(AppErrorCode.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED)
        }

        const token = await this.createToken(userRecord.id, userRecord.email)

        return { message: "Tokens refreshed", token: token }
    }

    async verifyEmail(verifyDto: VerifyOTPDto) {
        const record = await this.getUserAndOTP(undefined, verifyDto.email);

        if (!record) throw new AppException(AppErrorCode.INVALID_VERIFICATION_ATTEMPT, HttpStatus.UNAUTHORIZED)
        if (record.otp_code !== verifyDto.otp_code) throw new AppException(AppErrorCode.OTP_INVALID, HttpStatus.UNAUTHORIZED)
        if (new Date() > record.expires_at) throw new AppException(AppErrorCode.OTP_EXPIRED, HttpStatus.UNAUTHORIZED)

        await this.db.update(Tables.USERS, { [UserCols.IS_VERIFIED]: true }, { [UserCols.ID]: record.id })

        await this.deleteOTP(record.otp_id)

        const responseToken = await this.createToken(record.id, record.email)

        return { message: 'Email verified successfully!', token: responseToken };
    }

    async getUserAndOTP(userId?: string, userEmail?: string) {
        if (!userId && !userEmail) {
            throw new BadRequestException("getUserAndOTP needs either userId or userEmail")
        }
        const isUserId = userId !== undefined
        const query = `
        SELECT u.${UserCols.ID}, u.${UserCols.EMAIL}, o.${OtpCols.OTP_CODE}, o.${OtpCols.EXPIRES_AT}, o.${OtpCols.ID} as otp_id
        FROM ${Tables.USERS} u
        JOIN ${Tables.OTPS} o ON u.${UserCols.ID} = o.${OtpCols.USER_ID}
        WHERE u.${isUserId ? UserCols.ID : UserCols.EMAIL} = $1 LIMIT 1;
      `;
        const result = await this.db.query(query, [userId ?? userEmail]);
        return result.rows[0] as {
            otp_code: string,
            otp_id: string,
            expires_at: Date,
            id: string,
            email: string
        } | null | undefined;
    }

    async createToken(userId: string, email: string) {
        const payload = { sub: userId, email: email }
        const accessToken = await this.jwtService.signAsync(payload);

        const refreshToken = crypto.randomBytes(32).toString("hex")

        const refreshExpiresAt = new Date()
        refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7)

        await this.db.insert(Tables.REFRESH_TOKENS, { [RefreshTokenCols.TOKEN]: refreshToken, [RefreshTokenCols.USER_ID]: userId, [RefreshTokenCols.EXPIRES_AT]: refreshExpiresAt })

        const decodedToken = this.jwtService.decode(accessToken) as { exp: number };
        const accessExpiresAt = new Date(decodedToken.exp * 1000);

        return {
            access_token: accessToken,
            access_token_expires_at: accessExpiresAt.toISOString(),
            refresh_token: refreshToken,
            refresh_token_expires_at: refreshExpiresAt.toISOString(),
            user_id: userId,
            email: email,
        }
    }

    private async deleteOTP(id: string) {
        await this.db.delete(Tables.OTPS, { [OtpCols.ID]: id })
    }

    private async createOTP(userId: string, email: string) {
        const otpCode = generateOtp();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        await this.db.insert(Tables.OTPS, { [OtpCols.USER_ID]: userId, [OtpCols.OTP_CODE]: otpCode, [OtpCols.EXPIRES_AT]: expiresAt });

        return {
            otp: otpCode,
            expiresAt: expiresAt
        }
    }
}
