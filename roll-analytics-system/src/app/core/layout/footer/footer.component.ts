import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AlarmService, Alarm } from '../../services/alarm.service';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit, OnDestroy {
  popupOpen = false;
  currentTime = '';
  latestAlarmText = '';

  private timeInterval: any;
  private alarmSub!: Subscription;

  alarms: Alarm[] = [];

  constructor(private alarmService: AlarmService) {}

  get highCount(): number {
    return this.alarms.filter(a => a.severity === 'HIGH').length;
  }

  get medCount(): number {
    return this.alarms.filter(a => a.severity === 'MEDIUM').length;
  }

  get lowCount(): number {
    return this.alarms.filter(a => a.severity === 'LOW').length;
  }

  togglePopup(): void {
    this.popupOpen = !this.popupOpen;
  }

  ngOnInit(): void {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);

    // Poll /api/alarms/latest/ every 30 seconds, starting immediately
    this.alarmSub = interval(5000).pipe(
      startWith(0),
      switchMap(() => this.alarmService.getLatestAlarms())
    ).subscribe({
      next: (data) => {
        this.alarms = data;
        if (data.length > 0) {
          const latest = data[0];
          this.latestAlarmText = `${latest.date} | ${latest.time} | ${latest.description}`;
        } else {
          this.latestAlarmText = '';
        }
      },
      error: (err) => {
        console.error('Failed to load latest alarms for footer', err);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    if (this.alarmSub) {
      this.alarmSub.unsubscribe();
    }
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-GB');
  }
}