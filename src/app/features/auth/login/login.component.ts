// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { AuthService } from '../../../core/auth/auth.service';

// function validEmail(email: string): boolean {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// }

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   templateUrl: './login.component.html',
//   styleUrl: './login.component.scss'
// })
// export class LoginComponent {
//   private readonly authService = inject(AuthService);
//   private readonly router = inject(Router);

//   email = '';
//   password = '';
//   rememberMe = false;
//   showPassword = false;
//   isLoading = false;
//   errorMessage = '';

//   login(): void {
//     this.errorMessage = '';
//     if (!this.email || !this.password) {
//       this.errorMessage = 'Please fill all fields';
//       return;
//     }
//     if (!validEmail(this.email)) {
//       this.errorMessage = 'Invalid email format';
//       return;
//     }
//     console.log('Login clicked');
//     this.isLoading = true;
//     this.authService.login({ email: this.email, password: this.password }).subscribe({
//       next: (res) => {
//         console.log('Success:', res);
//         this.router.navigate(['/home']);
//       },
//       error: (e: Error) => {
//         this.isLoading = false;
//         this.errorMessage = e.message || 'Login failed';
//       }
//     });
//   }

//   useDemoCredentials(): void {
//     this.email = 'admin@jindal.com';
//     this.password = 'Admin@123';
//   }
// }
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  login(): void {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill all fields';
      return;
    }

    if (!validEmail(this.email)) {
      this.errorMessage = 'Invalid email format';
      return;
    }

    this.isLoading = true;

    // 💡 "identifier" not "email" — backend expects this field name
    this.authService.login({ identifier: this.email, password: this.password }).subscribe({
      next: () => {
        // 💡 isLoading reset to false before navigating
        // 💡 "res" removed — we don't use the response object here
        // 💡 console.logs removed — not needed in production
        this.isLoading = false;
        this.router.navigate(['/app/home']);
      },
      error: (e: Error) => {
        // 💡 isLoading reset so button becomes clickable again
        this.isLoading = false;
        this.errorMessage = e.message || 'Login failed';
      }
    });
  }

  useDemoCredentials(): void {
    this.email = 'admin@jindal.com';
    this.password = 'Admin@123';
  }
}