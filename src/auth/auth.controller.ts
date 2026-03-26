import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOTPDto } from './dto/verifyOTP.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestLoginOtpDto } from './dto/request-login-otp.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';
import { ChangePasswordDto } from './dto/change-password-dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DeleteAccountDto } from './dto/delete-account.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("register")
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto)
    }

    @Post("login")
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto)
    }

    @Post("verify")
    async verify(@Body() verifyDto: VerifyOTPDto) {
        return this.authService.verifyEmail(verifyDto)
    }

    @Post("refresh-token")
    async refreshToken(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshTokens(dto)
    }

    @Post('login-otp/request')
    async requestLoginOtp(@Body() dto: RequestLoginOtpDto) {
        return this.authService.requestLoginOtp(dto);
    }

    @Post('login-otp/verify')
    async verifyLoginOtp(@Body() dto: VerifyLoginOtpDto) {
        return this.authService.verifyLoginOtp(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    async changePassword(
        @GetUser('sub') userId: string,
        @Body() dto: ChangePasswordDto
    ) {
        return this.authService.changePassword(userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('delete-account/request')
    async deleteAccountRequest(
        @GetUser('sub') userId: string,
    ) {
        return this.authService.requestDeleteAccount(userId)
    }

    @UseGuards(JwtAuthGuard)
    @Post('delete-account/verify')
    async deleteAccountVerify(
        @GetUser() user: any,
        @Body() dto: DeleteAccountDto
    ) {
        return this.authService.verifyDeleteAccount(user.sub, user.email, dto)
    }
}
