// import { Routes } from '@angular/router';
// import { authGuard } from './core/auth/auth.guard';

// export const routes: Routes = [
//   {
//     path: 'auth',
//     children: [
//       {
//         path: 'login',
//         loadComponent: () =>
//           import('./features/auth/login/login.component').then(
//             (m) => m.LoginComponent
//           )
//       },
//       {
//         path: 'forgot-password',
//         loadComponent: () =>
//           import('./features/auth/forgot-password/forgot-password.component').then(
//             (m) => m.ForgotPasswordComponent
//           )
//       },
//       {
//         path: 'verify-otp',
//         loadComponent: () =>
//           import('./features/auth/verify-otp/verify-otp.component').then(
//             (m) => m.VerifyOtpComponent
//           )
//       },
//       {
//         path: 'reset-password',
//         loadComponent: () =>
//           import('./features/auth/reset-password/reset-password.component').then(
//             (m) => m.ResetPasswordComponent
//           )
//       },
//       { path: '', redirectTo: 'login', pathMatch: 'full' }
//     ]
//   },
//   { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
//   {
//     path: 'app',
//     loadComponent: () =>
//       import('./core/layout/layout/layout.component').then(
//         (m) => m.LayoutComponent
//       ),
//     canActivate: [authGuard],
//     children: [
//       {
//         path: 'home',
//         title: 'Home',
//         data: { icon: 'home' },
//         loadComponent: () =>
//           import('./features/home/home.component').then((m) => m.HomeComponent)
//       },
//       {
//         path: 'inventory',
//         title: 'Inventory',
//         data: { icon: 'inventory_2' },
//         loadComponent: () =>
//           import('./features/inventory/inventory.component').then(
//             (m) => m.InventoryComponent
//           )
//       },
//       {
//         path: 'roll-analysis',
//         title: 'Roll Analysis',
//         data: { icon: 'analytics' },
//         loadComponent: () =>
//           import('./features/roll-analysis/roll-analysis.component').then(
//             (m) => m.RollAnalysisComponent
//           )
//       },
//       {
//         path: 'telegram-logs',
//         title: 'Telegram Logs',
//         data: { icon: 'chat' },
//         loadComponent: () =>
//           import('./features/telegram-logs/telegram-logs.component').then(
//             (m) => m.TelegramLogsComponent
//           )
//       },
//       {
//         path: 'alarms',
//         title: 'Alarms',
//         data: { icon: 'notifications_active' },
//         loadComponent: () =>
//           import('./features/alarms/alarms.component').then(
//             (m) => m.AlarmsComponent
//           )
//       },
//       {
//         path: 'supplier-analysis',
//         title: 'Supplier Analysis',
//         data: { icon: 'leaderboard' },
//         loadComponent: () =>
//           import('./features/performance-analysis/performance-analysis.component').then(
//             (m) => m.PerformanceAnalysisComponent
//           )
//       },
//       {
//         path: 'advance-analysis',
//         title: 'Advance Analysis',
//         data: { icon: 'biotech' },
//         loadComponent: () =>
//           import('./features/advance-analysis/advance-analysis.component').then(
//             (m) => m.AdvanceAnalysisComponent
//           )
//       },
//       // {
//       //   path: 'notifications',
//       //   title: 'Notifications',
//       //   data: { icon: 'notifications' },
//       //   loadComponent: () =>
//       //     import('./features/notifications/notifications.component').then(
//       //       (m) => m.NotificationsComponent
//       //     )
//       // },
//       { path: '', redirectTo: 'home', pathMatch: 'full' }
//     ]
//   },
//   { path: '**', redirectTo: 'auth/login', pathMatch: 'full' }
// ];
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (m) => m.LoginComponent
          )
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent
          )
      },
      {
        path: 'verify-otp',
        loadComponent: () =>
          import('./features/auth/verify-otp/verify-otp.component').then(
            (m) => m.VerifyOtpComponent
          )
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent
          )
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'app',
    loadComponent: () =>
      import('./core/layout/layout/layout.component').then(
        (m) => m.LayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        title: 'Home',
        data: { icon: 'home' },
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent)
      },
      {
        path: 'inventory',
        title: 'Inventory',
        data: { icon: 'inventory_2' },
        loadComponent: () =>
          import('./features/inventory/inventory.component').then(
            (m) => m.InventoryComponent
          )
      },
      {
        path: 'roll-analysis',
        title: 'Roll Analysis',
        data: { icon: 'analytics' },
        loadComponent: () =>
          import('./features/roll-analysis/roll-analysis.component').then(
            (m) => m.RollAnalysisComponent
          )
      },
      {
        path: 'telegram-logs',
        title: 'Telegram Logs',
        data: { icon: 'chat' },
        loadComponent: () =>
          import('./features/telegram-logs/telegram-logs.component').then(
            (m) => m.TelegramLogsComponent
          )
      },
      {
        path: 'alarms',
        title: 'Alarms',
        data: { icon: 'notifications_active' },
        loadComponent: () =>
          import('./features/alarms/alarms.component').then(
            (m) => m.AlarmsComponent
          )
      },
      {
        path: 'supplier-analysis',
        title: 'Supplier Analysis',
        data: { icon: 'leaderboard' },
        loadComponent: () =>
          import('./features/performance-analysis/performance-analysis.component').then(
            (m) => m.PerformanceAnalysisComponent
          )
      },
      {
        path: 'advance-analysis',
        title: 'Advance Analysis',
        data: { icon: 'biotech' },
        loadComponent: () =>
          import('./features/advance-analysis/advance-analysis.component').then(
            (m) => m.AdvanceAnalysisComponent
          )
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'auth/login', pathMatch: 'full' }
];