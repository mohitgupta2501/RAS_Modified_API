// import { Injectable, inject } from "@angular/core";
// import { HttpClient, HttpErrorResponse } from "@angular/common/http";
// import { Router } from "@angular/router";
// import { BehaviorSubject, Observable, throwError } from "rxjs";
// import { catchError, filter, switchMap, take, tap } from "rxjs/operators";
// import * as forge from "node-forge"; // 💡 Replaced JSEncrypt with node-forge for OAEP support
// import {
//   LoginRequest,
//   LoginResponse,
//   RefreshTokenRequest,
//   RefreshTokenResponse,
//   LogoutRequest,
//   LogoutResponse,
//   GenerateOtpRequest,
//   GenerateOtpResponse,
//   VerifyOtpRequest,
//   VerifyOtpResponse,
//   ResetPasswordRequest,
//   ResetPasswordResponse,
//   UserInfo,
//   UserProfileResponse,
//   ChangePasswordRequest,
//   ChangePasswordResponse,
// } from "./auth.models";
// import { environment } from "../../../environments/environment";

// @Injectable({ providedIn: "root" })
// export class AuthService {
//   private readonly http = inject(HttpClient);
//   private readonly router = inject(Router);
//   private readonly apiUrl = environment.apiUrl;

//   // ── LOCALSTORAGE KEYS ──────────────────────────────────────────────
//   private readonly TOKEN_KEY = "ras_access_token";
//   private readonly REFRESH_KEY = "ras_refresh_token";
//   private readonly USER_KEY = "ras_user";

//   // ── REFRESH TOKEN STATE ────────────────────────────────────────────
//   // 💡 These two variables prevent calling /refresh/ multiple times
//   // 💡 if 5 API calls fail at the same time with 401
//   // 💡 isRefreshing — tracks if a refresh call is already in progress
//   // 💡 refreshToken$ — all waiting requests listen to this and retry together
//   private isRefreshing = false;
//   // ✅ FIX: Changed from private to public so token.interceptor.ts can
//   // subscribe to it and rebuild requests with the new token after refresh.
//   refreshToken$ = new BehaviorSubject<string | null>(null);

//   // ── RSA PUBLIC KEY ─────────────────────────────────────────────────
//   // 💡 Paste your full public key from public_key.pem here
//   // 💡 Keep the -----BEGIN PUBLIC KEY----- and -----END PUBLIC KEY----- lines
//   private readonly PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
// MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAslPmwZJPth6+Nm4DQz2e
// RffOs5Wh38glH8pKXK2itHVj1X2yTjCkOWSBIHH9iTSwsr66Qc8eqBifoK98IamT
// B6XxLT7pKHQJP7XejfQO1jOu66Gi91Afu5b1B++wkwz4eCFzZoMvw938QnDgsNDv
// 8y+p8l8I5gvZ1hLTDbggEGrrrj/t0HoWEPlQZtTsztGDAyQm7Pdn8fmYxGMbp+PQ
// KVwiK2FYYiQb2uw524nzMIqqH07UUhh6iqVrEhNY2RA9xgp44Fn2/QtICypIRbUN
// pQHS08gBhF65iHsZBUHJdnAhlAnRHI+EgzGjaMSe0TAiD1rr91uhBbHoLnvb2YkJ
// EwIDAQAB
// -----END PUBLIC KEY-----`;

//   // ── RSA ENCRYPTION ─────────────────────────────────────────────────
//   // 💡 Uses node-forge with OAEP + SHA-256 padding — matches Android mobile app exactly:
//   // 💡 Android: Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding")
//   // 💡 Returns Base64 encoded string with NO line wrapping — matches Android Base64.NO_WRAP
//   // 💡 Reused for both login and reset password encryption
//   private encryptPassword(password: string): string {
//     const publicKey = forge.pki.publicKeyFromPem(this.PUBLIC_KEY); // 💡 Parse PEM public key

//     const encrypted = publicKey.encrypt(
//       password,
//       "RSA-OAEP",                           // 💡 Matches Android: OAEPWithSHA-256AndMGF1Padding
//       {
//         md: forge.md.sha256.create(),        // 💡 SHA-256 hash — same as Android
//         mgf1: {
//           md: forge.md.sha256.create(),      // 💡 MGF1 with SHA-256 — same as Android
//         },
//       }
//     );

//     return forge.util.encode64(encrypted);   // 💡 Base64 NO_WRAP — same as Android
//   }

//   // ── LOGIN ──────────────────────────────────────────────────────────
//   // 💡 Encrypts password → sends to backend → stores both tokens
//   login(req: LoginRequest): Observable<LoginResponse> {
//     const encryptedPassword = this.encryptPassword(req.password); // 💡 RSA-OAEP encrypt

//     const body = {
//       identifier: req.identifier,  // 💡 backend expects "identifier" not "email"
//       password: encryptedPassword, // 💡 RSA-OAEP encrypted password
//     };

//     return this.http
//       .post<LoginResponse>(`${this.apiUrl}/auth/login/`, body)
//       .pipe(
//         tap((res) => {
//           // 💡 Store both tokens after successful login
//           localStorage.setItem(this.TOKEN_KEY, res.access);
//           localStorage.setItem(this.REFRESH_KEY, res.refresh);
//         }),
//         catchError(this.handleError.bind(this)),
//       );
//   }

//   // ── REFRESH TOKEN ──────────────────────────────────────────────────
//   // 💡 Called automatically by interceptor when access token expires (401)
//   // 💡 Sends refresh token → gets new access + refresh tokens back
//   // 💡 Returns Observable so interceptor can wait for it and retry
//   refreshAccessToken(): Observable<RefreshTokenResponse> {
//     const refresh = localStorage.getItem(this.REFRESH_KEY) || "";

//     const body: RefreshTokenRequest = { refresh };

//     return this.http
//       .post<RefreshTokenResponse>(`${this.apiUrl}/auth/refresh/`, body)
//       .pipe(
//         tap((res) => {
//           localStorage.setItem(this.TOKEN_KEY, res.access);
//           localStorage.setItem(this.REFRESH_KEY, res.refresh);
//         }),
//         catchError((err) => {
//           // 💡 If refresh also fails — both tokens are dead
//           // 💡 Clear everything and send user to login
//           this.forceLogout();
//           return throwError(() => err);
//         }),
//       );
//   }

//   // ── HANDLE 401 WITH REFRESH ────────────────────────────────────────
//   // ✅ FIX: After refreshing, the retried request must use the NEW token.
//   // The old code passed `failedRequest` as an Observable that was already
//   // built with the old token — so even after refresh, it retried with the
//   // expired token and got 401 again.
//   // Now we accept `retryRequest` so the caller (interceptor) builds it
//   // fresh from refreshToken$ AFTER the new token is emitted.
//   handle401WithRefresh(retryRequest: Observable<any>): Observable<any> {
//     if (!this.isRefreshing) {
//       // 💡 No refresh in progress — start one
//       this.isRefreshing = true;
//       this.refreshToken$.next(null); // 💡 Signal that refresh is starting

//       return this.refreshAccessToken().pipe(
//         switchMap((res) => {
//           this.isRefreshing = false;
//           this.refreshToken$.next(res.access); // 💡 Signal all waiting requests with new token
//           return retryRequest;                 // 💡 Retry the original failed request
//         }),
//         catchError((err) => {
//           this.isRefreshing = false;
//           return throwError(() => err);
//         }),
//       );
//     }

//     // 💡 Refresh already in progress — wait for it to finish
//     // 💡 Then retry this request with the new token
//     return this.refreshToken$.pipe(
//       filter((token) => token !== null), // 💡 Wait until new token arrives
//       take(1),                           // 💡 Only take one value then complete
//       switchMap(() => retryRequest),     // 💡 Retry original request
//     );
//   }

//   // ── LOGOUT ─────────────────────────────────────────────────────────
//   // 💡 Step 1 — tell backend to invalidate the refresh token on server
//   // 💡 Step 2 — clear localStorage
//   // 💡 Step 3 — redirect to login
//   logout(): void {
//     const refresh = localStorage.getItem(this.REFRESH_KEY) || "";
//     const body: LogoutRequest = { refresh };

//     // 💡 Call backend logout API — even if it fails, we still clear local data
//     this.http
//       .post<LogoutResponse>(`${this.apiUrl}/auth/logout/`, body)
//       .pipe(
//         catchError(() => throwError(() => null)), // 💡 ignore errors — logout locally anyway
//       )
//       .subscribe({
//         complete: () => this.forceLogout(), // 💡 always clear local data
//       });
//   }

//   // ── FORCE LOGOUT ───────────────────────────────────────────────────
//   // 💡 Clears all local data and redirects to login
//   // 💡 Called on logout AND when refresh token is expired/invalid
//   forceLogout(): void {
//     localStorage.removeItem(this.TOKEN_KEY);
//     localStorage.removeItem(this.REFRESH_KEY);
//     localStorage.removeItem(this.USER_KEY);
//     this.router.navigate(["/auth/login"]);
//   }

//   // ── GENERATE OTP (FORGOT PASSWORD) ────────────────────────────────
//   // 💡 Sends OTP to user's email
//   generateOtp(req: GenerateOtpRequest): Observable<GenerateOtpResponse> {
//     return this.http
//       .post<GenerateOtpResponse>(`${this.apiUrl}/auth/generate-otp/`, req)
//       .pipe(catchError(this.handleError.bind(this)));
//   }

//   // ── VERIFY OTP ─────────────────────────────────────────────────────
//   // 💡 Verifies OTP entered by user
//   // 💡 Backend returns reset_token — save it to localStorage
//   // 💡 reset_token is needed in the next step to reset password
//   verifyOtp(req: VerifyOtpRequest): Observable<VerifyOtpResponse> {
//     return this.http
//       .post<VerifyOtpResponse>(`${this.apiUrl}/auth/verify-otp/`, req)
//       .pipe(
//         tap((res) => {
//           // 💡 Save reset_token — needed for reset password step
//           localStorage.setItem("reset_token", res.reset_token);
//         }),
//         catchError(this.handleError.bind(this)),
//       );
//   }

//   // ── RESET PASSWORD ─────────────────────────────────────────────────
//   // 💡 Encrypts new_password with RSA-OAEP before sending — same as login
//   // 💡 Resets password using reset_token from verify-otp step
//   // 💡 Field names: new_password and reset_token
//   resetPassword(req: ResetPasswordRequest): Observable<ResetPasswordResponse> {
//     const encryptedNewPassword = this.encryptPassword(req.new_password); // 💡 RSA-OAEP encrypt new password

//     const body = {
//       ...req,                                 // 💡 spread all fields (reset_token etc.)
//       new_password: encryptedNewPassword,     // 💡 override new_password with encrypted version
//     };

//     return this.http
//       .post<ResetPasswordResponse>(`${this.apiUrl}/auth/reset-password/`, body)
//       .pipe(
//         tap(() => {
//           // 💡 Clean up reset_token after successful password reset
//           localStorage.removeItem("reset_token");
//           localStorage.removeItem("reset_email");
//         }),
//         catchError(this.handleError.bind(this)),
//       );
//   }

//   // ── USER PROFILE ───────────────────────────────────────────────────
//   // 💡 Fetches the full profile of the currently logged-in user
//   // 💡 Token is automatically attached by token.interceptor.ts
//   // 💡 URL: GET /api/user_management/profile/
//   // 💡 Use full_name from response for display in the navbar
//   getUserProfile(): Observable<UserProfileResponse> {
//     return this.http
//       .get<UserProfileResponse>(`${this.apiUrl}/user_management/profile/`)
//       .pipe(catchError(this.handleError.bind(this)));
//   }

//   // ── CHANGE PASSWORD ────────────────────────────────────────────────
//   // 💡 Allows the logged-in user to change their password
//   // 💡 new_password is RSA-OAEP encrypted before sending — same as login/reset
//   // 💡 reset_token must be obtained first via the verify-otp flow
//   // 💡 URL: POST /api/user_management/profile/
//   changePassword(req: ChangePasswordRequest): Observable<ChangePasswordResponse> {
//     const encryptedNewPassword = this.encryptPassword(req.new_password); // 💡 RSA-OAEP encrypt

//     const body: ChangePasswordRequest = {
//       ...req,                                 // 💡 spread all fields (reset_token etc.)
//       new_password: encryptedNewPassword,     // 💡 override new_password with encrypted version
//     };

//     return this.http
//       .post<ChangePasswordResponse>(`${this.apiUrl}/user_management/profile/`, body)
//       .pipe(
//         tap(() => {
//           // 💡 Clean up reset_token after successful password change
//           localStorage.removeItem("reset_token");
//         }),
//         catchError(this.handleError.bind(this)),
//       );
//   }

//   // ── IS LOGGED IN ───────────────────────────────────────────────────
//   // ✅ FIX: Only return true when token exists AND is not expired.
//   isLoggedIn(): boolean {
//     const token = this.getToken();
//     if (!token) return false;

//     try {
//       const parts = token.split('.');
//       if (parts.length !== 3) {
//         // 💡 Not a JWT — opaque token from backend.
//         // 💡 We can't check expiry, so trust it exists.
//         // 💡 The interceptor will handle 401s via refresh flow.
//         return true;
//       }
//       const payload = JSON.parse(atob(parts[1]));
//       // ✅ Check exp field exists before comparing
//       if (!payload.exp) return true;
//       return payload.exp * 1000 > Date.now();
//     } catch {
//       // 💡 Decoding failed — token is malformed, treat as logged out
//       return false;
//     }
//   }

//   // ── HELPERS ────────────────────────────────────────────────────────
//   getToken(): string | null {
//     return localStorage.getItem(this.TOKEN_KEY);
//   }

//   getRefreshToken(): string | null {
//     return localStorage.getItem(this.REFRESH_KEY);
//   }

//   getCurrentUser(): UserInfo | null {
//     const user = localStorage.getItem(this.USER_KEY);
//     return user ? JSON.parse(user) : null;
//   }

//   // ── CENTRALIZED ERROR HANDLER ──────────────────────────────────────
//   // 💡 All API methods pipe through this
//   // 💡 Converts HTTP error codes into readable messages
//   handleError(error: HttpErrorResponse): Observable<never> {
//     let message = "An unknown error occurred!";

//     if (error.error instanceof ErrorEvent) {
//       // 💡 Client side — no internet, CORS etc.
//       message = "Network error. Please check your connection.";
//     } else {
//       switch (error.status) {
//         case 0:
//           // 💡 Server unreachable — check network/VPN
//           message = "Cannot reach server. Please connect to the correct network.";
//           break;
//         case 400:
//           // 💡 Backend returns "errorMessage" field on failure
//           message = error.error?.errorMessage || "Invalid request data.";
//           break;
//         case 401:
//           // 💡 Wrong credentials or token expired
//           message = error.error?.errorMessage || "Invalid username or password.";
//           break;
//         case 404:
//           message = error.error?.errorMessage || "Resource not found.";
//           break;
//         case 422:
//           message = error.error?.errorMessage || "Validation error.";
//           break;
//         case 500:
//           message = "Server error. Please try again later.";
//           break;
//         default:
//           message = `Error ${error.status}: ${error.error?.errorMessage || error.message}`;
//       }
//     }

//     return throwError(() => new Error(message));
//   }
// }

import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError, filter, switchMap, take, tap } from "rxjs/operators";
import * as forge from "node-forge"; // 💡 Replaced JSEncrypt with node-forge for OAEP support
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  LogoutResponse,
  GenerateOtpRequest,
  GenerateOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UserInfo,
  UserProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from "./auth.models";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  // ── LOCALSTORAGE KEYS ──────────────────────────────────────────────
  private readonly TOKEN_KEY = "ras_access_token";
  private readonly REFRESH_KEY = "ras_refresh_token";
  private readonly USER_KEY = "ras_user";

  // ── REFRESH TOKEN STATE ────────────────────────────────────────────
  // 💡 These two variables prevent calling /refresh/ multiple times
  // 💡 if 5 API calls fail at the same time with 401
  // 💡 isRefreshing — tracks if a refresh call is already in progress
  // 💡 refreshToken$ — all waiting requests listen to this and retry together
  private isRefreshing = false;
  // ✅ FIX: Changed from private to public so token.interceptor.ts can
  // subscribe to it and rebuild requests with the new token after refresh.
  refreshToken$ = new BehaviorSubject<string | null>(null);

  // ── RSA PUBLIC KEY ─────────────────────────────────────────────────
  // 💡 Paste your full public key from public_key.pem here
  // 💡 Keep the -----BEGIN PUBLIC KEY----- and -----END PUBLIC KEY----- lines
  private readonly PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAslPmwZJPth6+Nm4DQz2e
RffOs5Wh38glH8pKXK2itHVj1X2yTjCkOWSBIHH9iTSwsr66Qc8eqBifoK98IamT
B6XxLT7pKHQJP7XejfQO1jOu66Gi91Afu5b1B++wkwz4eCFzZoMvw938QnDgsNDv
8y+p8l8I5gvZ1hLTDbggEGrrrj/t0HoWEPlQZtTsztGDAyQm7Pdn8fmYxGMbp+PQ
KVwiK2FYYiQb2uw524nzMIqqH07UUhh6iqVrEhNY2RA9xgp44Fn2/QtICypIRbUN
pQHS08gBhF65iHsZBUHJdnAhlAnRHI+EgzGjaMSe0TAiD1rr91uhBbHoLnvb2YkJ
EwIDAQAB
-----END PUBLIC KEY-----`;

  // ── RSA ENCRYPTION ─────────────────────────────────────────────────
  // 💡 Uses node-forge with OAEP + SHA-256 padding — matches Android mobile app exactly:
  // 💡 Android: Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding")
  // 💡 Returns Base64 encoded string with NO line wrapping — matches Android Base64.NO_WRAP
  // 💡 Reused for both login and reset password encryption
  private encryptPassword(password: string): string {
    const publicKey = forge.pki.publicKeyFromPem(this.PUBLIC_KEY); // 💡 Parse PEM public key

    const encrypted = publicKey.encrypt(
      password,
      "RSA-OAEP",                           // 💡 Matches Android: OAEPWithSHA-256AndMGF1Padding
      {
        md: forge.md.sha256.create(),        // 💡 SHA-256 hash — same as Android
        mgf1: {
          md: forge.md.sha256.create(),      // 💡 MGF1 with SHA-256 — same as Android
        },
      }
    );

    return forge.util.encode64(encrypted);   // 💡 Base64 NO_WRAP — same as Android
  }

  // ── LOGIN ──────────────────────────────────────────────────────────
  // 💡 Encrypts password → sends to backend → stores both tokens
  login(req: LoginRequest): Observable<LoginResponse> {
    const encryptedPassword = this.encryptPassword(req.password); // 💡 RSA-OAEP encrypt

    const body = {
      identifier: req.identifier,  // 💡 backend expects "identifier" not "email"
      password: encryptedPassword, // 💡 RSA-OAEP encrypted password
    };

    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login/`, body)
      .pipe(
        tap((res) => {
          // 💡 Store both tokens after successful login
          localStorage.setItem(this.TOKEN_KEY, res.access);
          localStorage.setItem(this.REFRESH_KEY, res.refresh);
        }),
        catchError(this.handleError.bind(this)),
      );
  }

  // ── REFRESH TOKEN ──────────────────────────────────────────────────
  // 💡 Called automatically by interceptor when access token expires (401)
  // 💡 Sends refresh token → gets new access + refresh tokens back
  // 💡 Returns Observable so interceptor can wait for it and retry
  refreshAccessToken(): Observable<RefreshTokenResponse> {
    const refresh = localStorage.getItem(this.REFRESH_KEY) || "";

    const body: RefreshTokenRequest = { refresh };

    return this.http
      .post<RefreshTokenResponse>(`${this.apiUrl}/auth/refresh/`, body)
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.access);
          localStorage.setItem(this.REFRESH_KEY, res.refresh);
        }),
        catchError((err) => {
          // 💡 If refresh also fails — both tokens are dead
          // 💡 Clear everything and send user to login
          this.forceLogout();
          return throwError(() => err);
        }),
      );
  }

  // ── REFRESH TOKEN (SILENT — no forceLogout on failure) ─────────────
  // 💡 Used by authGuard to silently attempt a token refresh.
  // 💡 Unlike refreshAccessToken(), this does NOT call forceLogout() on
  // 💡 failure — so it does NOT trigger a navigation to /auth/login
  // 💡 internally. The guard handles the redirect itself, ensuring no
  // 💡 query params (like ?rollId=...) are accidentally appended to the
  // 💡 login URL.
  refreshAccessTokenSilent(): Observable<RefreshTokenResponse> {
    const refresh = localStorage.getItem(this.REFRESH_KEY) || "";
    const body: RefreshTokenRequest = { refresh };

    return this.http
      .post<RefreshTokenResponse>(`${this.apiUrl}/auth/refresh/`, body)
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.access);
          localStorage.setItem(this.REFRESH_KEY, res.refresh);
        }),
        // ✅ No catchError here — let the caller (authGuard) handle failure
      );
  }

  // ── CLEAR TOKENS (without redirect) ───────────────────────────────
  // 💡 Clears localStorage tokens only — no navigation.
  // 💡 Used by authGuard so it can control where to redirect
  // 💡 without triggering forceLogout()'s built-in router.navigate().
  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // ── HANDLE 401 WITH REFRESH ────────────────────────────────────────
  // ✅ FIX: After refreshing, the retried request must use the NEW token.
  // The old code passed `failedRequest` as an Observable that was already
  // built with the old token — so even after refresh, it retried with the
  // expired token and got 401 again.
  // Now we accept `retryRequest` so the caller (interceptor) builds it
  // fresh from refreshToken$ AFTER the new token is emitted.
  handle401WithRefresh(retryRequest: Observable<any>): Observable<any> {
    if (!this.isRefreshing) {
      // 💡 No refresh in progress — start one
      this.isRefreshing = true;
      this.refreshToken$.next(null); // 💡 Signal that refresh is starting

      return this.refreshAccessToken().pipe(
        switchMap((res) => {
          this.isRefreshing = false;
          this.refreshToken$.next(res.access); // 💡 Signal all waiting requests with new token
          return retryRequest;                 // 💡 Retry the original failed request
        }),
        catchError((err) => {
          this.isRefreshing = false;
          return throwError(() => err);
        }),
      );
    }

    // 💡 Refresh already in progress — wait for it to finish
    // 💡 Then retry this request with the new token
    return this.refreshToken$.pipe(
      filter((token) => token !== null), // 💡 Wait until new token arrives
      take(1),                           // 💡 Only take one value then complete
      switchMap(() => retryRequest),     // 💡 Retry original request
    );
  }

  // ── LOGOUT ─────────────────────────────────────────────────────────
  // 💡 Step 1 — tell backend to invalidate the refresh token on server
  // 💡 Step 2 — clear localStorage
  // 💡 Step 3 — redirect to login
  logout(): void {
    const refresh = localStorage.getItem(this.REFRESH_KEY) || "";
    const body: LogoutRequest = { refresh };

    // 💡 Call backend logout API — even if it fails, we still clear local data
    this.http
      .post<LogoutResponse>(`${this.apiUrl}/auth/logout/`, body)
      .pipe(
        catchError(() => throwError(() => null)), // 💡 ignore errors — logout locally anyway
      )
      .subscribe({
        complete: () => this.forceLogout(), // 💡 always clear local data
      });
  }

  // ── FORCE LOGOUT ───────────────────────────────────────────────────
  // 💡 Clears all local data and redirects to login
  // 💡 Called on logout AND when refresh token is expired/invalid
  forceLogout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(["/auth/login"]);
  }

  // ── GENERATE OTP (FORGOT PASSWORD) ────────────────────────────────
  // 💡 Sends OTP to user's email
  generateOtp(req: GenerateOtpRequest): Observable<GenerateOtpResponse> {
    return this.http
      .post<GenerateOtpResponse>(`${this.apiUrl}/auth/generate-otp/`, req)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ── VERIFY OTP ─────────────────────────────────────────────────────
  // 💡 Verifies OTP entered by user
  // 💡 Backend returns reset_token — save it to localStorage
  // 💡 reset_token is needed in the next step to reset password
  verifyOtp(req: VerifyOtpRequest): Observable<VerifyOtpResponse> {
    return this.http
      .post<VerifyOtpResponse>(`${this.apiUrl}/auth/verify-otp/`, req)
      .pipe(
        tap((res) => {
          // 💡 Save reset_token — needed for reset password step
          localStorage.setItem("reset_token", res.reset_token);
        }),
        catchError(this.handleError.bind(this)),
      );
  }

  // ── RESET PASSWORD ─────────────────────────────────────────────────
  // 💡 Encrypts new_password with RSA-OAEP before sending — same as login
  // 💡 Resets password using reset_token from verify-otp step
  // 💡 Field names: new_password and reset_token
  resetPassword(req: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    const encryptedNewPassword = this.encryptPassword(req.new_password); // 💡 RSA-OAEP encrypt new password

    const body = {
      ...req,                                 // 💡 spread all fields (reset_token etc.)
      new_password: encryptedNewPassword,     // 💡 override new_password with encrypted version
    };

    return this.http
      .post<ResetPasswordResponse>(`${this.apiUrl}/auth/reset-password/`, body)
      .pipe(
        tap(() => {
          // 💡 Clean up reset_token after successful password reset
          localStorage.removeItem("reset_token");
          localStorage.removeItem("reset_email");
        }),
        catchError(this.handleError.bind(this)),
      );
  }

  // ── USER PROFILE ───────────────────────────────────────────────────
  // 💡 Fetches the full profile of the currently logged-in user
  // 💡 Token is automatically attached by token.interceptor.ts
  // 💡 URL: GET /api/user_management/profile/
  // 💡 Use full_name from response for display in the navbar
  getUserProfile(): Observable<UserProfileResponse> {
    return this.http
      .get<UserProfileResponse>(`${this.apiUrl}/user_management/profile/`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ── CHANGE PASSWORD ────────────────────────────────────────────────
  // 💡 Allows the logged-in user to change their password
  // 💡 new_password is RSA-OAEP encrypted before sending — same as login/reset
  // 💡 reset_token must be obtained first via the verify-otp flow
  // 💡 URL: POST /api/user_management/profile/
  changePassword(req: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    const encryptedNewPassword = this.encryptPassword(req.new_password); // 💡 RSA-OAEP encrypt

    const body: ChangePasswordRequest = {
      ...req,                                 // 💡 spread all fields (reset_token etc.)
      new_password: encryptedNewPassword,     // 💡 override new_password with encrypted version
    };

    return this.http
      .post<ChangePasswordResponse>(`${this.apiUrl}/user_management/profile/`, body)
      .pipe(
        tap(() => {
          // 💡 Clean up reset_token after successful password change
          localStorage.removeItem("reset_token");
        }),
        catchError(this.handleError.bind(this)),
      );
  }

  // ── IS LOGGED IN ───────────────────────────────────────────────────
  // ✅ FIX: Only return true when token exists AND is not expired.
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        // 💡 Not a JWT — opaque token from backend.
        // 💡 We can't check expiry, so trust it exists.
        // 💡 The interceptor will handle 401s via refresh flow.
        return true;
      }
      const payload = JSON.parse(atob(parts[1]));
      // ✅ Check exp field exists before comparing
      if (!payload.exp) return true;
      return payload.exp * 1000 > Date.now();
    } catch {
      // 💡 Decoding failed — token is malformed, treat as logged out
      return false;
    }
  }

  // ── HELPERS ────────────────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  getCurrentUser(): UserInfo | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  // ── CENTRALIZED ERROR HANDLER ──────────────────────────────────────
  // 💡 All API methods pipe through this
  // 💡 Converts HTTP error codes into readable messages
  handleError(error: HttpErrorResponse): Observable<never> {
    let message = "An unknown error occurred!";

    if (error.error instanceof ErrorEvent) {
      // 💡 Client side — no internet, CORS etc.
      message = "Network error. Please check your connection.";
    } else {
      switch (error.status) {
        case 0:
          // 💡 Server unreachable — check network/VPN
          message = "Cannot reach server. Please connect to the correct network.";
          break;
        case 400:
          // 💡 Backend returns "errorMessage" field on failure
          message = error.error?.errorMessage || "Invalid request data.";
          break;
        case 401:
          // 💡 Wrong credentials or token expired
          message = error.error?.errorMessage || "Invalid username or password.";
          break;
        case 404:
          message = error.error?.errorMessage || "Resource not found.";
          break;
        case 422:
          message = error.error?.errorMessage || "Validation error.";
          break;
        case 500:
          message = "Server error. Please try again later.";
          break;
        default:
          message = `Error ${error.status}: ${error.error?.errorMessage || error.message}`;
      }
    }

    return throwError(() => new Error(message));
  }
}