import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private smtpFrom: string

    constructor(private readonly configService: ConfigService) {
        this.smtpFrom = this.configService.get<string>('SMTP_FROM') ?? ""

        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: Number(this.configService.get<string>('SMTP_PORT')),
            secure: false,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    async sendVerificationEmail(to: string, otp: string) {
        const mailOptions = {
            from: `Hablo Talk <${this.smtpFrom}>`,
            to,
            subject: 'Verify your Email Address',
            text: `Welcome! Your verification code is: ${otp}. It expires in 30 minutes.`,
        };

        await this.transporter.sendMail(mailOptions);
    }

    async sendLoginOtpEmail(to: string, otp: string) {
        const mailOptions = {
            from: `Hablo Talk <${this.smtpFrom}>`,
            to,
            subject: 'Your Login Code',
            text: `Your login code is: ${otp}. It expires in 30 minutes. Do not share this with anyone.`,
        };

        await this.transporter.sendMail(mailOptions);
    }

    async sendAccountDeleteOtp(to: string, otp: string) {
        const mailOptions = {
            from: `Hablo Talk <${this.smtpFrom}>`,
            to,
            subject: 'OTP Code For Account Deleting',
            text: `Your OTP code for deleting your account: ${otp}. It expires in 30 minutes. Do not share this with anyone.`,
        };

        await this.transporter.sendMail(mailOptions);
    }

    async sendLoginNotification(to: string) {
        const mailOptions = {
            from: `Hablo Talk <${this.smtpFrom}>`,
            to,
            subject: 'New Login to Your Account',
            text: `We noticed a new login to your account at ${new Date().toLocaleString()}. If this wasn't you, please reset your password immediately.`,
        };

        await this.transporter.sendMail(mailOptions);
    }

    async sendPasswordChangeNotification(to: string) {
        const mailOptions = {
            from: `Hablo Talk <${this.smtpFrom}>`,
            to,
            subject: 'Your password changed',
            text: `We noticed that your password has been changed at ${new Date().toLocaleString()}. If this wasn't you, please reset your password immediately.`,
        };

        await this.transporter.sendMail(mailOptions);
    }
}
