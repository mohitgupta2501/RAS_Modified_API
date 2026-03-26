import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // ✅ CASE 1: Access token is still valid — allow immediately
  if (authService.isLoggedIn()) {
    return of(true);
  }

  // ✅ CASE 2: Access token expired BUT refresh token exists —
  // silently refresh BEFORE blocking navigation.
  // Use refreshAccessTokenSilent() which does NOT call forceLogout() internally.
  // The old refreshAccessToken() called forceLogout() on failure which caused
  // Angular to navigate to /auth/login and carry the rollId query param with it,
  // producing URLs like: /auth/login?rollId=ROLL-0006
  const refreshToken = authService.getRefreshToken();
  if (refreshToken) {
    return authService.refreshAccessTokenSilent().pipe(
      map(() => true),  // refresh succeeded — allow navigation
      catchError(() => {
        // Both tokens dead — clear storage and go to login with NO query params
        authService.clearTokens();
        router.navigate(['/auth/login'], { queryParams: {} });
        return of(false);
      })
    );
  }

  // ✅ CASE 3: No tokens at all — go to login with NO query params
  router.navigate(['/auth/login'], { queryParams: {} });
  return of(false);
};