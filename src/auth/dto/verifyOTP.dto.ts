import { IsString, IsNotEmpty } from "class-validator"

export class VerifyOTPDto {
    @IsString()
    @IsNotEmpty()
    email: string
    
    @IsString()
    @IsNotEmpty()
    otp_code: string
}