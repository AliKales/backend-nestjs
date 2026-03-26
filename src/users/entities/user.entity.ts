export class User {
    id: string;
    email: string;
    password_hash: string;
    is_verified: boolean;
    created_at: Date;
    last_signin_at: Date;
    last_password_change_at: Date;
}