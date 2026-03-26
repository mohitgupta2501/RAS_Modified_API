import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AlarmService, NotifyAlarm } from '../../services/alarm.service'; // ← corrected relative path

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Output() closePanel = new EventEmitter<void>();

  notifications: NotifyAlarm[] = [];
  isLoading = false;
  errorMsg = '';

  constructor(private alarmService: AlarmService) {}

  ngOnInit(): void {
    // Load once on init so the bell badge count shows immediately
    this.fetchNotifications();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-fetch fresh data every time the panel is opened
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.fetchNotifications();
    }
  }

  private fetchNotifications(): void {
    this.isLoading = true;
    this.errorMsg = '';

    this.alarmService.getNotifyAlarms().subscribe({
      next: (data) => {
        this.notifications = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
        this.errorMsg = 'Could not load notifications.';
        this.isLoading = false;
      }
    });
  }

  get unreadNotifs(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markRead(n: NotifyAlarm): void {
    n.read = true;
    // Uncomment to persist to backend:
    // this.alarmService.patchAlarm(n.id, { status: 'ACKNOWLEDGED' }).subscribe();
  }

  markAllRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  clearAll(): void {
    this.notifications = [];
  }
}