// import { inject } from '@angular/core';
// import {
//   HttpInterceptorFn,
//   HttpRequest,
//   HttpHandlerFn,
//   HttpErrorResponse
// } from '@angular/common/http';
// import { catchError, switchMap, throwError } from 'rxjs';
// import { AuthService } from './auth.service';

// export const tokenInterceptor: HttpInterceptorFn = (
//   req: HttpRequest<unknown>,
//   next: HttpHandlerFn
// ) => {
//   const authService = inject(AuthService);

//   // ── HELPER ─────────────────────────────────────────────────────────
//   // 💡 Clones the request and attaches the Bearer token to the header
//   // 💡 We clone because HTTP requests are immutable — cannot modify directly
//   const addToken = (request: HttpRequest<unknown>, token: string) => {
//     return request.clone({
//       setHeaders: {
//         Authorization: `Bearer ${token}`
//       }
//     });
//   };

//   // ── ATTACH TOKEN ───────────────────────────────────────────────────
//   // 💡 Get current access token from localStorage
//   // 💡 If token exists — attach it, if not — send request as-is
//   const token = authService.getToken();
//   const authReq = token ? addToken(req, token) : req;

//   // ── SEND REQUEST + CATCH ERRORS ────────────────────────────────────
//   return next(authReq).pipe(
//     catchError((error: HttpErrorResponse) => {

//       // ── HANDLE 401 — ACCESS TOKEN EXPIRED ──────────────────────────
//       // 💡 401 means access token is expired or invalid
//       // 💡 BUT — we skip this if the failing request IS the refresh API
//       // 💡 otherwise we get infinite loop:
//       // 💡 refresh fails → 401 → tries to refresh again → 401 → forever
//       if (error.status === 401 && !req.url.includes('/auth/refresh/')) {

//         // 💡 Try to get new tokens using the refresh token
//         return authService.refreshAccessToken().pipe(
//           switchMap(res => {
//             // 💡 Refresh succeeded — got new access token
//             // 💡 Retry the original failed request with the new token
//             // 💡 User never knows the token expired — seamless experience
//             return next(addToken(req, res.access));
//           }),
//           catchError(refreshError => {
//             // 💡 Refresh token also expired or invalid
//             // 💡 Nothing we can do — force logout
//             // 💡 Clears localStorage + redirects to login page
//             authService.forceLogout();
//             return throwError(() => refreshError);
//           })
//         );
//       }

//       // ── ALL OTHER ERRORS ───────────────────────────────────────────
//       // 💡 400, 403, 404, 500 etc — just pass the error through
//       // 💡 The component's error handler will show the message
//       return throwError(() => error);
//     })
//   );
// };

import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const tokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  // ── HELPER ─────────────────────────────────────────────────────────
  const addToken = (request: HttpRequest<unknown>, token: string) => {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  };

  // ── ATTACH CURRENT TOKEN ───────────────────────────────────────────
  const token = authService.getToken();
  const authReq = token ? addToken(req, token) : req;

  // ── SEND REQUEST + CATCH ERRORS ────────────────────────────────────
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      // ── HANDLE 401 — ACCESS TOKEN EXPIRED ──────────────────────────
      if (
        error.status === 401 &&
        !req.url.includes('/auth/refresh/') &&
        !req.url.includes('/auth/logout/')
      ) {
        // ✅ FIX: Build the retry Observable so it reads the new token
        // AFTER refresh emits it — not the old token captured before refresh.
        // Without this, the retried request used the expired token again.
        const retryWithNewToken$ = authService.refreshToken$.pipe(
          filter(newToken => newToken !== null),
          take(1),
          switchMap(newToken => next(addToken(req, newToken!)))
        );

        return authService.handle401WithRefresh(retryWithNewToken$).pipe(
          catchError(refreshError => {
            authService.forceLogout();
            return throwError(() => refreshError);
          })
        );
      }

      // ── ALL OTHER ERRORS ───────────────────────────────────────────
      return throwError(() => error);
    })
  );
};