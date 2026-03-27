import { HttpException, HttpStatus } from '@nestjs/common';
import { AppErrorCode, AppErrorStatus, ErrorMessages } from '../constants/errors';

export class AppException extends HttpException {
    constructor(errorCode: AppErrorCode, status?: HttpStatus) {
        super(
            {
                message: ErrorMessages[errorCode],
                code: errorCode,
                status: status ?? AppErrorStatus[errorCode],
            },
            status ?? AppErrorStatus[errorCode],
        );
    }
}