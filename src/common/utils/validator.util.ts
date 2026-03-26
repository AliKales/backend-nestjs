/**
 * Validates an email address using a standard regex pattern.
 */
export function validateEmail(email: string) {
    // Checks for: [text] @ [text] . [text]
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates a password against strong security policies.
 * Returns array of string containing errors
 */
export function validatePassword(password: string) {
    const errors: string[] = [];

    if (password.length < 6) {
        errors.push('Password must be at least 6 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number.');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character.');
    }

    return errors
}