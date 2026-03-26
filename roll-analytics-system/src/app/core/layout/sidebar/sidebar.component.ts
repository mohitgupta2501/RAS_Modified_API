import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../services/layout.service';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  layoutService = inject(LayoutService);

  readonly version = 'v2.4.1';

  menuItems: MenuItem[] = [
    { path: '/app/home', label: 'Home', icon: 'home' },
    { path: '/app/inventory', label: 'Inventory', icon: 'inventory_2' },
    { path: '/app/roll-analysis', label: 'Roll Analysis', icon: 'analytics' },
    { path: '/app/advance-analysis', label: 'Advance Analysis', icon: 'biotech' },
    { path: '/app/supplier-analysis', label: 'Supplier Analysis', icon: 'leaderboard' },
    { path: '/app/alarms', label: 'Alarms', icon: 'notifications_active' },
    { path: '/app/telegram-logs', label: 'Telegram Logs', icon: 'chat' },
    // { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    // { path: '/roll-details', label: 'Roll Details', icon: 'settings' },
    // { path: '/mill-information', label: 'Mill Information', icon: 'precision_manufacturing' },
    // { path: '/performance', label: 'Performance', icon: 'speed' },
    // { path: '/cost-analysis', label: 'Cost Analysis', icon: 'paid' },
    // { path: '/reports', label: 'Reports', icon: 'summarize' }
  ];

  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  onNavClick(): void {
    this.layoutService.closeMobileSidebar();
  }
}
