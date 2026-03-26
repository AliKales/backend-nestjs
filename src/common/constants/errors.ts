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