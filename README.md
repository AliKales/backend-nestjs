# 🛡️ NestJS Raw SQL Authentication Boilerplate

A production-ready, highly secure authentication backend built with NestJS and
raw PostgreSQL. This boilerplate completely bypasses heavy ORMs (like Prisma or
TypeORM) in favor of raw, highly-optimized SQL queries using the `pg` driver.

## ✨ Features

- **No ORM:** Pure, parameterized raw SQL queries for maximum performance and
  control.
- **Stateless JWT Auth:** Short-lived access tokens for secure API requests.
- **Refresh Token Rotation (RTR):** Opaque, stateful refresh tokens that are
  instantly rotated upon use for maximum breach detection.
- **Passwordless OTP Login:** Allow users to log in via a 6-digit email OTP.
- **Real-time Notifications:** Authenticated WebSockets (Socket.io) with private
  Rooms to instantly notify users of security events (e.g., password changes).
- **Strict Validation:** Global pipes with `class-validator` to prevent
  over-posting and mass-assignment attacks.
- **Custom Error Codes:** Standardized JSON error responses (e.g., `AUTH_005`)
  for seamless frontend integration.

## 🛠️ Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL (using `pg` driver)
- **Security:** `bcrypt`, `crypto`, `jsonwebtoken`
- **Realtime:** `@nestjs/websockets`, `socket.io`

## 🛣️ API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/register` | Register a new user account | ❌ |
| `POST` | `/auth/login` | Log in with email and password | ❌ |
| `POST` | `/auth/verify` | Verify email address using OTP | ❌ |
| `POST` | `/auth/refresh-token` | Exchange a refresh token for a new token pair | ❌ |
| `POST` | `/auth/login-otp/request` | Request a passwordless login OTP via email | ❌ |
| `POST` | `/auth/login-otp/verify` | Verify the passwordless login OTP | ❌ |
| `POST` | `/auth/change-password` | Update the current user's password | 🔒 JWT |
| `GET`  | `/auth/delete-account/request` | Request an OTP to confirm account deletion | 🔒 JWT |
| `POST` | `/auth/delete-account/verify` | Verify the OTP and permanently delete the account | 🔒 JWT |

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone [https://github.com/yourusername/appsyla-auth-nestjs.git](https://github.com/yourusername/appsyla-auth-nestjs.git)
cd appsyla-auth-nestjs
npm install
```
