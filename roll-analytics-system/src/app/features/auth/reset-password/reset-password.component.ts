// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { AuthService } from '../../../core/auth/auth.service';

// @Component({
//   selector: 'app-reset-password',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   templateUrl: './reset-password.component.html',
//   styleUrl: './reset-password.component.scss'
// })
// export class ResetPasswordComponent {
//   private readonly authService = inject(AuthService);
//   private readonly router = inject(Router);

//   newPassword = '';
//   confirmPassword = '';
//   showNew = false;
//   showConfirm = false;
//   isLoading = false;
//   isSuccess = false;
//   errorMessage = '';
//   redirectCountdown = 3;
//   email = '';
//   otp = '';

//   constructor() {
//     this.email = localStorage.getItem('reset_email') || '';
//     this.otp = localStorage.getItem('reset_otp') || '';

//     // ✅ CRITICAL FIX 2 — Added these 3 lines
//     // If someone opens this page directly without completing the OTP flow,
//     // email and otp will be empty — redirect them back to start
//     if (!this.email || !this.otp) {
//       this.router.navigate(['/auth/forgot-password']);
//     }
//   }

//   get strengthScore(): number {
//     const p = this.newPassword;
//     let score = 0;
//     if (/[A-Z]/.test(p)) score++;
//     if (/[a-z]/.test(p)) score++;
//     if (/[0-9]/.test(p)) score++;
//     if (/[^a-zA-Z0-9]/.test(p)) score++;
//     if (p.length >= 8) score++;
//     return score;
//   }

//   get strength(): 'Weak' | 'Fair' | 'Good' | 'Strong' {
//     const s = this.strengthScore;
//     if (s <= 1) return 'Weak';
//     if (s <= 2) return 'Fair';
//     if (s <= 3) return 'Good';
//     return 'Strong';
//   }

//   get segmentActive(): number {
//     const s = this.strengthScore;
//     if (s <= 1) return 1;
//     if (s <= 2) return 2;
//     if (s <= 3) return 3;
//     return 4;
//   }

//   get canSubmit(): boolean {
//     return (
//       this.strengthScore >= 3 &&
//       this.newPassword === this.confirmPassword &&
//       this.newPassword.length >= 8
//     );
//   }

//   get hasMinLength(): boolean { return this.newPassword.length >= 8; }
//   get hasUpper(): boolean { return /[A-Z]/.test(this.newPassword); }
//   get hasNumber(): boolean { return /[0-9]/.test(this.newPassword); }
//   get hasSpecial(): boolean { return /[^a-zA-Z0-9]/.test(this.newPassword); }

//   resetPassword(): void {
//     if (!this.canSubmit) return;
//     this.errorMessage = '';
//     this.isLoading = true;
//     this.authService
//       .resetPassword({
//         email: this.email,
//         otp: this.otp,
//         newPassword: this.newPassword,
//         confirmPassword: this.confirmPassword
//       })
//       .subscribe({
//         next: () => {
//           this.isLoading = false;
//           this.isSuccess = true;
//           localStorage.removeItem('reset_email');
//           localStorage.removeItem('reset_otp');
//           const id = setInterval(() => {
//             this.redirectCountdown--;
//             if (this.redirectCountdown < 0) {
//               clearInterval(id);
//               this.router.navigate(['/auth/login']);
//             }
//           }, 1000);
//         },
//         error: (e: Error) => {
//           this.isLoading = false;
//           this.errorMessage = e.message || 'Failed to reset password';
//         }
//       });
//   }
// }

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  showNew = false;
  showConfirm = false;
  isLoading = false;
  isSuccess = false;
  errorMessage = '';
  redirectCountdown = 3;

  // 💡 reset_token comes from verify-otp step — backend uses it to authorize reset
  // 💡 reset_email is used to show the user which email is being reset
  resetToken = '';
  email = '';

  readonly passwordForm = this.fb.group(
    {
      new_password: ['', [Validators.required, this.passwordStrengthValidator]],
      confirm_password: ['', [Validators.required]]
    },
    { validators: [this.passwordMatchValidator] }
  );

  constructor() {
    // 💡 Read reset_token saved by verify-otp component after OTP verification
    this.resetToken = localStorage.getItem('reset_token') || '';

    // 💡 Read email saved by forgot-password component
    this.email = localStorage.getItem('reset_email') || '';

    // 💡 SECURITY GUARD — if someone opens this page directly
    // 💡 without going through forgot-password → verify-otp flow,
    // 💡 reset_token will be empty — redirect them back to start
    if (!this.resetToken || !this.email) {
      this.router.navigate(['/auth/forgot-password']);
    }
  }

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const p = String(control.value || '');
    const errors: Record<string, boolean> = {};

    if (p.length < 8) errors['minLength'] = true;
    if (!/[A-Z]/.test(p)) errors['uppercase'] = true;
    if (!/[0-9]/.test(p)) errors['number'] = true;
    if (!/[^a-zA-Z0-9]/.test(p)) errors['special'] = true;

    return Object.keys(errors).length ? errors : null;
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('new_password')?.value;
    const confirmPassword = group.get('confirm_password')?.value;

    if (!newPassword || !confirmPassword) return null;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  get newPasswordCtrl() {
    return this.passwordForm.get('new_password');
  }

  get confirmPasswordCtrl() {
    return this.passwordForm.get('confirm_password');
  }

  // ── PASSWORD STRENGTH ──────────────────────────────────────────────
  get strengthScore(): number {
    const p = String(this.newPasswordCtrl?.value || '');
    let score = 0;
    if (/[A-Z]/.test(p)) score++;       // has uppercase
    if (/[a-z]/.test(p)) score++;       // has lowercase
    if (/[0-9]/.test(p)) score++;       // has number
    if (/[^a-zA-Z0-9]/.test(p)) score++; // has special character
    if (p.length >= 8) score++;          // has min length
    return score;
  }

  get strength(): 'Weak' | 'Fair' | 'Good' | 'Strong' {
    const s = this.strengthScore;
    if (s <= 1) return 'Weak';
    if (s <= 2) return 'Fair';
    if (s <= 3) return 'Good';
    return 'Strong';
  }

  get segmentActive(): number {
    const s = this.strengthScore;
    if (s <= 1) return 1;
    if (s <= 2) return 2;
    if (s <= 3) return 3;
    return 4;
  }

  get canSubmit(): boolean {
    return this.passwordForm.valid;
  }

  // ── PASSWORD REQUIREMENT FLAGS ─────────────────────────────────────
  get hasMinLength(): boolean { return String(this.newPasswordCtrl?.value || '').length >= 8; }
  get hasUpper(): boolean { return /[A-Z]/.test(String(this.newPasswordCtrl?.value || '')); }
  get hasNumber(): boolean { return /[0-9]/.test(String(this.newPasswordCtrl?.value || '')); }
  get hasSpecial(): boolean { return /[^a-zA-Z0-9]/.test(String(this.newPasswordCtrl?.value || '')); }

  // ── RESET PASSWORD ─────────────────────────────────────────────────
  resetPassword(): void {
    if (!this.canSubmit) return;

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.resetPassword({
      new_password: String(this.newPasswordCtrl?.value || ''),
      reset_token: this.resetToken
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSuccess = true;

        // 💡 Clean up all password reset related data from localStorage
        // 💡 reset_token and reset_email no longer needed after successful reset
        localStorage.removeItem('reset_token');
        localStorage.removeItem('reset_email');

        // 💡 Countdown timer before redirecting to login
        const id = setInterval(() => {
          this.redirectCountdown--;
          if (this.redirectCountdown < 0) {
            clearInterval(id);
            this.router.navigate(['/auth/login']);
          }
        }, 1000);
      },
      error: (e: Error) => {
        this.isLoading = false;
        this.errorMessage = e.message || 'Failed to reset password';
      }
    });
  }
}