import { Component, OnDestroy, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../auth/auth.service';
import { filter, map, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnDestroy {
  layoutService = inject(LayoutService);
  authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly el = inject(ElementRef);
  private readonly subs = new Subscription();

  readonly shiftLabel = 'Shift A  ·  Mon, 19 Feb 2025';
  readonly shiftTime = '06:00 – 14:00';
  unreadCount = 4;
  userMenuOpen = false;

  pageTitle = 'Dashboard';
  pageIcon = 'analytics';

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  constructor() {
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
          this.pageIcon = icon ?? 'analytics';
          document.title = `RAS | ${this.pageTitle}`;
        })
    );
  }

  toggleMobileSidebar(): void {
    this.layoutService.toggleMobileSidebar();
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    this.userMenuOpen = false;
    this.authService.logout();
  }

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
