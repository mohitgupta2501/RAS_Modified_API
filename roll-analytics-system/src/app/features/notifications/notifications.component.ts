import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { AlarmService, NotifyAlarm } from '../../core/services/alarm.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Output() closePanel = new EventEmitter<void>();

  notifications: NotifyAlarm[] = [];
  isLoading = false;
  errorMsg = '';

  private pollingSub!: Subscription;

  constructor(private alarmService: AlarmService) {}

  ngOnInit(): void {
    // Poll /api/alarms/notify/ every 5 seconds, starting immediately
    this.pollingSub = interval(5000).pipe(
      startWith(0),
      switchMap(() => this.alarmService.getNotifyAlarms())
    ).subscribe({
      next: (data) => {
        this.notifications = data;
        this.isLoading = false;
        this.errorMsg = '';
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
        this.errorMsg = 'Could not load notifications.';
        this.isLoading = false;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Panel open/close changes are handled — polling already keeps data fresh.
    // No extra fetch needed here.
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
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