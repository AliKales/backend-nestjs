import { HttpException, HttpStatus } from '@nestjs/common';
import { AppErrorCode, ErrorMessages } from '../constants/errors';

export class AppException extends HttpException {
    constructor(errorCode: AppErrorCode, status: HttpStatus = HttpStatus.BAD_REQUEST) {
        super(
            {
                message: ErrorMessages[errorCode],
                code: errorCode,
            },
            status,
        );
    }
}