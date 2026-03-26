import { IsString, IsNotEmpty } from "class-validator";

export class VerifyLoginOtpDto {
    @IsString()
    @IsNotEmpty()
    email: string;
    
    @IsString()
    @IsNotEmpty()
    otp_code: string;
}