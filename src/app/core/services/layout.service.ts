import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  sidebarCollapsed = signal(false);
  mobileSidebarOpen = signal(false);
  notificationOpen = signal(false);

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }

  toggleMobileSidebar() {
    this.mobileSidebarOpen.update((v) => !v);
  }

  toggleNotification() {
    this.notificationOpen.update((v) => !v);
  }

  closeNotification() {
    this.notificationOpen.set(false);
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen.set(false);
  }
}
