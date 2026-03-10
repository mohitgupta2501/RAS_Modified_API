// export interface LoginRequest {
//   email: string;
//   password: string;
// }

// export interface LoginResponse {
//   accessToken: string;
//   refreshToken: string;
//   user: UserInfo;
// }

// export interface UserInfo {
//   id: string;
//   name: string;
//   email: string;
//   role: string;
//   shift: string;
// }

// export interface ForgotPasswordRequest {
//   email: string;
// }

// export interface VerifyOtpRequest {
//   email: string;
//   otp: string;
// }

// export interface ResetPasswordRequest {
//   email: string;
//   otp: string;
//   newPassword: string;
//   confirmPassword: string;
// }

// // auth.models.ts — ADD these new interfaces

// // What your API returns on error (adjust field names to match your backend)
// export interface ApiError {
//   message: string;
//   statusCode: number;
//   errors?: { field: string; message: string }[];  // for validation errors
// }

// // Generic API wrapper (if your backend wraps responses)
// export interface ApiResponse<T> {
//   data: T;
//   success: boolean;
//   message: string;
// }

// ── LOGIN ──────────────────────────────────────────────────────────
// What we SEND to backend for login
export interface LoginRequest {
  identifier: string;   // backend expects "identifier" not "email"
  password: string;     // RSA encrypted before sending
}

// What backend RETURNS after successful login
export interface LoginResponse {
  access: string;       // short-lived access token
  refresh: string;      // long-lived refresh token
}

// ── REFRESH TOKEN ──────────────────────────────────────────────────
// What we SEND to backend to get a new access token
export interface RefreshTokenRequest {
  refresh: string;      // the long-lived refresh token stored in localStorage
}

// What backend RETURNS after successful token refresh
export interface RefreshTokenResponse {
  access: string;       // new short-lived access token
  refresh: string;      // new long-lived refresh token
}

// ── LOGOUT ─────────────────────────────────────────────────────────
// What we SEND to backend on logout
export interface LogoutRequest {
  refresh: string;      // backend needs refresh token to invalidate it on server
}

// What backend RETURNS after successful logout
export interface LogoutResponse {
  detail: string;       // backend returns a detail message e.g. "Logout successful"
}

// ── USER ───────────────────────────────────────────────────────────
// Shape of the user object stored in localStorage
export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  shift: string;
}

// ── FORGOT PASSWORD / GENERATE OTP ────────────────────────────────
// What we SEND to backend to generate and send OTP to email
// URL: POST /api/auth/generate-otp/
export interface GenerateOtpRequest {
  email: string;
}

// What backend RETURNS after sending OTP
export interface GenerateOtpResponse {
  message: string;      // e.g. "OTP sent to your email"
}

// ── VERIFY OTP ─────────────────────────────────────────────────────
// What we SEND to backend to verify the OTP entered by user
// URL: POST /api/auth/verify-otp/
export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

// What backend RETURNS after OTP is verified successfully
export interface VerifyOtpResponse {
  reset_token: string;  // one-time token used to reset password — save to localStorage
}

// ── RESET PASSWORD ─────────────────────────────────────────────────
// What we SEND to backend to reset the password
// URL: POST /api/auth/reset-password/
export interface ResetPasswordRequest {
  new_password: string;   // new password chosen by user
  reset_token: string;    // token received from verify-otp step
}

// What backend RETURNS after password is reset successfully
export interface ResetPasswordResponse {
  message: string;        // e.g. "Password reset successful"
}

// ── ERROR RESPONSE ─────────────────────────────────────────────────
// Shape of every error response from backend
export interface ApiError {
  errorMessage: string;   // backend always returns "errorMessage" field on failure
}

// ── GENERIC API WRAPPER ────────────────────────────────────────────
// Some APIs wrap their response in this shape
// { data: { ... }, success: true, message: "OK" }
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
}