import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 💡 Temporary debug — remove after fixing
  console.log('Guard check — isLoggedIn:', authService.isLoggedIn());
  console.log('Token in storage:', localStorage.getItem('ras_access_token'));

  if (authService.isLoggedIn()) {
    return true;
  }
  router.navigate(['/auth/login']);
  return false;
};