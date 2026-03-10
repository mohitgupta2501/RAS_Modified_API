import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  sidebarCollapsed = signal(false);
  mobileSidebarOpen = signal(false);

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }

  toggleMobileSidebar() {
    this.mobileSidebarOpen.update((v) => !v);
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen.set(false);
  }
}
