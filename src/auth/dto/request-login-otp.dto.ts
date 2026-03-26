import { IsNotEmpty, IsString } from "class-validator";

export class RequestLoginOtpDto {
    @IsString()
    @IsNotEmpty()
    email: string;
}