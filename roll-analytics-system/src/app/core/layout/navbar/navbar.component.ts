// import { Component, OnDestroy, OnInit, inject, HostListener, ElementRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
// import { LayoutService } from '../../services/layout.service';
// import { AuthService } from '../../auth/auth.service';
// import { UserProfileResponse } from '../../auth/auth.models';
// import { AlarmService } from '../../services/alarm.service';
// import { filter, map, switchMap, startWith, Subscription } from 'rxjs';
// import { interval } from 'rxjs';

// @Component({
//   selector: 'app-navbar',
//   standalone: true,
//   imports: [CommonModule, RouterLink],
//   templateUrl: './navbar.component.html',
//   styleUrl: './navbar.component.scss'
// })
// export class NavbarComponent implements OnInit, OnDestroy {
//   layoutService = inject(LayoutService);
//   authService   = inject(AuthService);
//   private readonly router       = inject(Router);
//   private readonly route        = inject(ActivatedRoute);
//   private readonly el           = inject(ElementRef);
//   private readonly alarmService = inject(AlarmService);
//   private readonly subs         = new Subscription();

//   // ── NAVBAR STATE ───────────────────────────────────────────────────
//   readonly shiftLabel = 'Shift A  ·  Mon, 19 Feb 2025';
//   readonly shiftTime  = '06:00 – 14:00';
//   unreadCount  = 0;           // ← driven by notify poll now (was hardcoded 4)
//   userMenuOpen = false;
//   pageTitle    = 'Dashboard';
//   pageIcon     = 'analytics';

//   // ── USER PROFILE ───────────────────────────────────────────────────
//   userProfile: UserProfileResponse | null = null;

//   // ── COMPUTED DISPLAY GETTERS ───────────────────────────────────────
//   get displayName(): string {
//     return this.userProfile?.full_name
//       || this.authService.getCurrentUser()?.name
//       || 'User';
//   }

//   get avatarInitials(): string {
//     return this.displayName.slice(0, 2).toUpperCase();
//   }

//   get displayEmail(): string {
//     return this.userProfile?.email
//       || this.authService.getCurrentUser()?.email
//       || '';
//   }

//   constructor() {
//     // ── ROUTE TITLE + ICON TRACKING ──────────────────────────────────
//     this.subs.add(
//       this.router.events
//         .pipe(
//           filter((e): e is NavigationEnd => e instanceof NavigationEnd),
//           map(() => {
//             let r: ActivatedRoute | null = this.route;
//             while (r?.firstChild) r = r.firstChild;
//             return {
//               title: r?.snapshot.title,
//               icon: (r?.snapshot.data as { icon?: string } | undefined)?.icon
//             };
//           })
//         )
//         .subscribe(({ title, icon }) => {
//           this.pageTitle = title ?? 'Dashboard';
//           this.pageIcon  = icon  ?? 'analytics';
//           document.title = `RAS | ${this.pageTitle}`;
//         })
//     );
//   }

//   ngOnInit(): void {
//     this.loadUserProfile();
//     this.startNotifyPolling();
//   }

//   // ── NOTIFY POLLING — every 5s, drives bell badge ──────────────────
//   // This lives here (always-alive navbar) so /api/alarms/notify/ is
//   // always hitting regardless of whether the panel is open or not.
//   private startNotifyPolling(): void {
//     this.subs.add(
//       interval(5000).pipe(
//         startWith(0),
//         switchMap(() => this.alarmService.getNotifyAlarms())
//       ).subscribe({
//         next: (notifications) => {
//           this.unreadCount = notifications.filter(n => !n.read).length;
//         },
//         error: (err) => console.error('Notify poll failed:', err)
//       })
//     );
//   }

//   // ── LOAD USER PROFILE ──────────────────────────────────────────────
//   private loadUserProfile(): void {
//     this.subs.add(
//       this.authService.getUserProfile().subscribe({
//         next:  (profile) => { this.userProfile = profile; },
//         error: () => {}
//       })
//     );
//   }

//   // ── SIDEBAR ────────────────────────────────────────────────────────
//   toggleMobileSidebar(): void {
//     this.layoutService.toggleMobileSidebar();
//   }

//   // ── USER DROPDOWN ──────────────────────────────────────────────────
//   toggleUserMenu(): void {
//     this.userMenuOpen = !this.userMenuOpen;
//   }

//   // ── LOGOUT ─────────────────────────────────────────────────────────
//   logout(): void {
//     this.userMenuOpen = false;
//     this.authService.logout();
//   }

//   // ── CLOSE USER MENU ON OUTSIDE CLICK ──────────────────────────────
//   @HostListener('document:click', ['$event'])
//   onDocumentClick(event: MouseEvent): void {
//     if (!this.el.nativeElement.contains(event.target)) {
//       this.userMenuOpen = false;
//     }
//   }

//   ngOnDestroy(): void {
//     this.subs.unsubscribe();
//   }
// }

import { Component, OnDestroy, OnInit, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../auth/auth.service';
import { UserProfileResponse } from '../../auth/auth.models';
import { AlarmService } from '../../services/alarm.service';
import { filter, map, switchMap, startWith, Subscription } from 'rxjs';
import { interval } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  layoutService = inject(LayoutService);
  authService   = inject(AuthService);
  private readonly router       = inject(Router);
  private readonly route        = inject(ActivatedRoute);
  private readonly el           = inject(ElementRef);
  private readonly alarmService = inject(AlarmService);
  private readonly subs         = new Subscription();

  // ── NAVBAR STATE ───────────────────────────────────────────────────
  shiftLabel = '';
  shiftTime  = '';
  unreadCount  = 0;
  userMenuOpen = false;
  pageTitle    = 'Dashboard';
  pageIcon     = 'analytics';

  // ── USER PROFILE ───────────────────────────────────────────────────
  userProfile: UserProfileResponse | null = null;

  // ── COMPUTED DISPLAY GETTERS ───────────────────────────────────────
  get displayName(): string {
    return this.userProfile?.full_name
      || this.authService.getCurrentUser()?.name
      || 'User';
  }

  get avatarInitials(): string {
    return this.displayName.slice(0, 2).toUpperCase();
  }

  get displayEmail(): string {
    return this.userProfile?.email
      || this.authService.getCurrentUser()?.email
      || '';
  }

  constructor() {
    // ── ROUTE TITLE + ICON TRACKING ──────────────────────────────────
    this.subs.add(
      this.router.events
        .pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd),
          map(() => {
            let r: ActivatedRoute | null = this.route;
            while (r?.firstChild) r = r.firstChild;
            return {
              title: r?.snapshot.title,
              icon: (r?.snapshot.data as { icon?: string } | undefined)?.icon
            };
          })
        )
        .subscribe(({ title, icon }) => {
          this.pageTitle = title ?? 'Dashboard';
          this.pageIcon  = icon  ?? 'analytics';
          document.title = `RAS | ${this.pageTitle}`;
        })
    );
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.startNotifyPolling();
    this.startShiftClock();
  }

  // ── SHIFT + CLOCK — updates every second ──────────────────────────
  private startShiftClock(): void {
    // Run immediately, then every second
    this.updateShiftInfo();
    this.subs.add(
      interval(1000).subscribe(() => this.updateShiftInfo())
    );
  }

  /**
   * Determines current shift based on hour:
   *  Shift A (Morning)   → 06:00 – 14:00
   *  Shift B (Afternoon) → 14:00 – 22:00
   *  Shift C (Night)     → 22:00 – 06:00 (crosses midnight)
   */
  private updateShiftInfo(): void {
    const now   = new Date();
    const hour  = now.getHours();

    // ── Shift detection ──────────────────────────────────────────────
    let shiftName: string;
    let shiftRange: string;

    if (hour >= 6 && hour < 14) {
      shiftName  = 'Shift A';
      shiftRange = '06:00 – 14:00';
    } else if (hour >= 14 && hour < 22) {
      shiftName  = 'Shift B';
      shiftRange = '14:00 – 22:00';
    } else {
      shiftName  = 'Shift C';
      shiftRange = '22:00 – 06:00';
    }

    // ── Date formatting  e.g. "Mon, 24 Mar 2025" ────────────────────
    const dateStr = now.toLocaleDateString('en-GB', {
      weekday: 'short',
      day:     '2-digit',
      month:   'short',
      year:    'numeric'
    });

    // ── Live time  e.g. "06:32:10 AM" ───────────────────────────────
    const timeStr = now.toLocaleTimeString('en-US', {
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    // ── Bind to template ─────────────────────────────────────────────
    this.shiftLabel = `${shiftName}  ·  ${dateStr}`;
    this.shiftTime  = `${shiftRange}  |  ${timeStr}`;
  }

  // ── NOTIFY POLLING — every 5s, drives bell badge ──────────────────
  private startNotifyPolling(): void {
    this.subs.add(
      interval(5000).pipe(
        startWith(0),
        switchMap(() => this.alarmService.getNotifyAlarms())
      ).subscribe({
        next: (notifications) => {
          this.unreadCount = notifications.filter(n => !n.read).length;
        },
        error: (err) => console.error('Notify poll failed:', err)
      })
    );
  }

  // ── LOAD USER PROFILE ──────────────────────────────────────────────
  private loadUserProfile(): void {
    this.subs.add(
      this.authService.getUserProfile().subscribe({
        next:  (profile) => { this.userProfile = profile; },
        error: () => {}
      })
    );
  }

  // ── SIDEBAR ────────────────────────────────────────────────────────
  toggleMobileSidebar(): void {
    this.layoutService.toggleMobileSidebar();
  }

  // ── USER DROPDOWN ──────────────────────────────────────────────────
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  // ── LOGOUT ─────────────────────────────────────────────────────────
  logout(): void {
    this.userMenuOpen = false;
    this.authService.logout();
  }

  // ── CLOSE USER MENU ON OUTSIDE CLICK ──────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.userMenuOpen = false;
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}