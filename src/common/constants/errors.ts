import { HttpStatus } from "@nestjs/common";

export enum AppErrorCode {
    // Auth Errors
    INVALID_EMAIL = 'AUTH_001',
    INVALID_PASSWORD_FORMAT = 'AUTH_002',
    INVALID_CREDENTIALS = 'AUTH_003',
    EMAIL_ALREADY_EXISTS = 'AUTH_004',
    EMAIL_NOT_VERIFIED = 'AUTH_005',
    OTP_EXPIRED = 'AUTH_006',
    OTP_INVALID = 'AUTH_007',
    REFRESH_TOKEN_EXPIRED = 'AUTH_008',
    REFRESH_TOKEN_INVALID = 'AUTH_009',
    PASSWORD_LENGTH = 'AUTH_010',
    INVALID_LOGIN_ATTEMPT = 'AUTH_011',
    INVALID_VERIFICATION_ATTEMPT = 'AUTH_012',

    // User Errors
    USER_NOT_FOUND = 'USER_001',
    PASSWORD_SAME_AS_OLD = 'USER_002',
    PASSWORD_CHANGE_TOO_FREQUENT = 'USER_003',
    INCORRECT_CURRENT_PASSWORD = 'USER_004',

    // System Errors
    INTERNAL_ERROR = 'SYS_001',
    DATABASE_ERROR = 'SYS_002',
}

export const ErrorMessages: Record<AppErrorCode, string> = {
    [AppErrorCode.INVALID_EMAIL]: 'Please provide a valid email address.',
    [AppErrorCode.INVALID_PASSWORD_FORMAT]: 'Password does not meet security requirements.',
    [AppErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
    [AppErrorCode.EMAIL_ALREADY_EXISTS]: 'This email is already registered.',
    [AppErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email address first.',
    [AppErrorCode.OTP_EXPIRED]: 'Verification code has expired.',
    [AppErrorCode.OTP_INVALID]: 'Invalid verification code.',
    [AppErrorCode.REFRESH_TOKEN_EXPIRED]: 'Session expired. Please log in again.',
    [AppErrorCode.REFRESH_TOKEN_INVALID]: 'Invalid session token.',
    [AppErrorCode.PASSWORD_LENGTH]: 'Password must be at least 6 characters long.',
    [AppErrorCode.INVALID_LOGIN_ATTEMPT]: 'Invalid login attempt.',
    [AppErrorCode.INVALID_VERIFICATION_ATTEMPT]: 'Invalid verification attempt.',
    [AppErrorCode.USER_NOT_FOUND]: 'User account not found.',
    [AppErrorCode.PASSWORD_SAME_AS_OLD]: 'New password cannot be the same as the old one.',
    [AppErrorCode.PASSWORD_CHANGE_TOO_FREQUENT]: 'You recently changed your password. Please wait 5 minutes before changing it again.',
    [AppErrorCode.INCORRECT_CURRENT_PASSWORD]: 'Incorrect current password.',
    [AppErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred.',
    [AppErrorCode.DATABASE_ERROR]: 'A database error occurred.',
};

export const AppErrorStatus: Record<AppErrorCode, number> = {
    // Auth Errors
    [AppErrorCode.INVALID_EMAIL]: HttpStatus.BAD_REQUEST,            // 400
    [AppErrorCode.INVALID_PASSWORD_FORMAT]: HttpStatus.BAD_REQUEST,  // 400
    [AppErrorCode.PASSWORD_LENGTH]: HttpStatus.BAD_REQUEST,          // 400
    [AppErrorCode.INVALID_CREDENTIALS]: HttpStatus.UNAUTHORIZED,     // 401
    [AppErrorCode.INVALID_LOGIN_ATTEMPT]: HttpStatus.UNAUTHORIZED,   // 401
    [AppErrorCode.EMAIL_ALREADY_EXISTS]: HttpStatus.CONFLICT,        // 409
    [AppErrorCode.EMAIL_NOT_VERIFIED]: HttpStatus.FORBIDDEN,         // 403
    [AppErrorCode.OTP_EXPIRED]: HttpStatus.GONE,                     // 410 (or 400)
    [AppErrorCode.OTP_INVALID]: HttpStatus.BAD_REQUEST,              // 400
    [AppErrorCode.REFRESH_TOKEN_EXPIRED]: HttpStatus.UNAUTHORIZED,   // 401
    [AppErrorCode.REFRESH_TOKEN_INVALID]: HttpStatus.UNAUTHORIZED,   // 401
    [AppErrorCode.INVALID_VERIFICATION_ATTEMPT]: HttpStatus.BAD_REQUEST, // 400

    // User Errors
    [AppErrorCode.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,             // 404
    [AppErrorCode.PASSWORD_SAME_AS_OLD]: HttpStatus.BAD_REQUEST,     // 400
    [AppErrorCode.PASSWORD_CHANGE_TOO_FREQUENT]: HttpStatus.TOO_MANY_REQUESTS, // 429
    [AppErrorCode.INCORRECT_CURRENT_PASSWORD]: HttpStatus.UNAUTHORIZED, // 401

    // System Errors
    [AppErrorCode.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR, // 500
    [AppErrorCode.DATABASE_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR, // 500
};