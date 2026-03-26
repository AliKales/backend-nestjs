/**
 * Generates a random numeric OTP string.
 * Defaults to 6 digits.
 */
export function generateOtp(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
}