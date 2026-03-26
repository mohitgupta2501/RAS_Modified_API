// import { Component, OnInit, OnDestroy, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { AuthService } from '../../../core/auth/auth.service';
// import { interval, Subscription } from 'rxjs';

// @Component({
//   selector: 'app-verify-otp',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   templateUrl: './verify-otp.component.html',
//   styleUrl: './verify-otp.component.scss'
// })
// export class VerifyOtpComponent implements OnInit, OnDestroy {
//   private readonly authService = inject(AuthService);
//   private readonly router = inject(Router);
//   private timerSub?: Subscription;

//   otpDigits: string[] = ['', '', '', '', '', ''];
//   isLoading = false;
//   errorMessage = '';
//   timerSeconds = 150;
//   email = '';

//   get fullOtp(): string {
//     return this.otpDigits.join('');
//   }

//   get timerDisplay(): string {
//     const m = Math.floor(this.timerSeconds / 60);
//     const s = this.timerSeconds % 60;
//     return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
//   }

//   ngOnInit(): void {
//     this.email = localStorage.getItem('reset_email') || '';
//     this.startTimer();
//   }

//   ngOnDestroy(): void {
//     this.timerSub?.unsubscribe();
//   }

//   startTimer(): void {
//     this.timerSub = interval(1000).subscribe(() => {
//       if (this.timerSeconds > 0) {
//         this.timerSeconds--;
//       }
//     });
//   }

//   onDigitInput(index: number, event: Event): void {
//     const input = event.target as HTMLInputElement;
//     const value = input.value.replace(/\D/g, '').slice(-1);
//     this.otpDigits[index] = value;
//     if (value && index < 5) {
//       const next = input.parentElement?.querySelectorAll('input')[index + 1];
//       next?.focus();
//     }
//   }

//   onDigitKeydown(index: number, event: KeyboardEvent): void {
//     const input = event.target as HTMLInputElement;
//     if (event.key === 'Backspace' && !input.value && index > 0) {
//       this.otpDigits[index - 1] = '';
//       const prev = input.parentElement?.querySelectorAll('input')[index - 1];
//       prev?.focus();
//     }
//   }

//   onOtpPaste(event: ClipboardEvent): void {
//     event.preventDefault();
//     const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
//     for (let i = 0; i < 6; i++) {
//       this.otpDigits[i] = pasted[i] || '';
//     }
//     const first = (event.target as HTMLElement).closest('.otp-inputs')?.querySelectorAll('input')[Math.min(pasted.length, 5)];
//     (first as HTMLInputElement)?.focus();
//   }

//   verifyOtp(): void {
//     if (this.fullOtp.length < 6) return;
//     this.errorMessage = '';
//     this.isLoading = true;
//     this.authService.verifyOtp({ email: this.email, otp: this.fullOtp }).subscribe({
//       next: () => {
//         localStorage.setItem('reset_otp', this.fullOtp);
//         this.router.navigate(['/auth/reset-password']);
//       },
//       error: (e: Error) => {
//         this.isLoading = false;
//         this.errorMessage = e.message || 'Invalid OTP';
//       }
//     });
//   }

//   resendOtp(): void {
//     if (this.timerSeconds > 0) return;
//     this.timerSub?.unsubscribe();
//     this.timerSeconds = 150;
//     this.startTimer();
//     this.authService.sendOtp({ email: this.email }).subscribe();
//   }
// }
import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.scss'
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private timerSub?: Subscription;

  @ViewChildren('otpInput')
  private otpInputs?: QueryList<ElementRef<HTMLInputElement>>;

  readonly otpForm = this.fb.group({
    otp: this.fb.array(
      Array.from({ length: 6 }, () => this.fb.control('', [Validators.required, Validators.pattern(/^\d$/)]))
    )
  });

  isLoading = false;
  errorMessage = '';
  invalidOtpError = false;
  timerSeconds = 150;
  email = '';

  private get otpArray(): FormArray {
    return this.otpForm.get('otp') as FormArray;
  }

  get fullOtp(): string {
    return (this.otpArray.value as string[]).join('');
  }

  get isOtpComplete(): boolean {
    return this.otpArray.controls.every((c) => String(c.value || '').length === 1);
  }

  get otpControls() {
    return this.otpArray.controls;
  }

  get timerDisplay(): string {
    const m = Math.floor(this.timerSeconds / 60);
    const s = this.timerSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  ngOnInit(): void {
    // 💡 Read email saved by forgot-password component
    this.email = localStorage.getItem('reset_email') || '';

    // 💡 Security guard — if email is missing, user skipped forgot-password step
    if (!this.email) {
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.startTimer();
  }

  ngOnDestroy(): void {
    // 💡 Always unsubscribe timer to prevent memory leaks
    this.timerSub?.unsubscribe();
  }

  startTimer(): void {
    this.timerSub = interval(1000).subscribe(() => {
      if (this.timerSeconds > 0) {
        this.timerSeconds--;
      }
    });
  }

  onDigitInput(index: number, rawValue: string): void {
    this.errorMessage = '';
    this.invalidOtpError = false;

    const digits = (rawValue || '').replace(/\D/g, '');
    const chars = digits.split('');

    if (chars.length === 0) {
      this.otpArray.at(index).setValue('');
      return;
    }

    // If user typed/pasted multiple digits into one box (mobile autofill, fast typing), spread across inputs.
    for (let i = 0; i < chars.length && index + i < 6; i++) {
      this.otpArray.at(index + i).setValue(chars[i]);
    }

    const nextIndex = index + chars.length;
    if (nextIndex <= 5) {
      this.focusInput(nextIndex);
    }
  }

  private focusInput(index: number): void {
    const el = this.otpInputs?.get(index)?.nativeElement;
    if (el) {
      el.focus();
      el.select();
    }
  }

  onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const current = String(this.otpArray.at(index).value || '');
      if (current) {
        this.otpArray.at(index).setValue('');
        event.preventDefault();
        return;
      }
      if (!current && index > 0) {
        this.otpArray.at(index - 1).setValue('');
        this.focusInput(index - 1);
        event.preventDefault();
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    for (let i = 0; i < 6; i++) {
      this.otpArray.at(i).setValue(pasted[i] || '');
    }
    this.errorMessage = '';
    this.invalidOtpError = false;
    this.focusInput(Math.min(pasted.length, 5));
  }

  // ── VERIFY OTP ─────────────────────────────────────────────────────
  verifyOtp(): void {
    if (!this.isOtpComplete || this.invalidOtpError) return;

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.verifyOtp({ email: this.email, otp: this.fullOtp }).subscribe({
      next: (res) => {
        // 💡 "res" added back — we need reset_token from the response
        // 💡 Backend returns reset_token after successful OTP verification
        // 💡 Save reset_token — reset-password component will read it
        // 💡 We no longer save the OTP digits themselves
        this.isLoading = false;
        localStorage.setItem('reset_token', res.reset_token);
        this.router.navigate(['/auth/reset-password']);
      },
      error: (e: any) => {
        this.isLoading = false;

        if (e?.status === 400) {
          this.invalidOtpError = true;
          this.errorMessage = 'Invalid OTP. Please try again.';
          return;
        }

        this.errorMessage = e?.message || 'Invalid OTP';
      }
    });
  }

  // ── RESEND OTP ─────────────────────────────────────────────────────
  resendOtp(): void {
    if (this.timerSeconds > 0) return;

    this.timerSub?.unsubscribe();
    this.timerSeconds = 150;
    this.startTimer();

    // 💡 Method renamed from sendOtp() to generateOtp() in auth.service
    // 💡 Error handling added — silent failure was a bug before
    this.authService.generateOtp({ email: this.email }).subscribe({
      error: () => {
        this.errorMessage = 'Failed to resend OTP. Please try again.';
      }
    });
  }
}