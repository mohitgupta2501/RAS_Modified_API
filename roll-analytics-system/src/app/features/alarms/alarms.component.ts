import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlarmService, Alarm, Severity } from '../../../app/core/services/alarm.service';

export type { Severity, Alarm };

@Component({
  selector: 'app-alarms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alarms.component.html',
  styleUrl: './alarms.component.scss'
})
export class AlarmsComponent implements OnInit {
  sortField: keyof Alarm | '' = '';
  sortDir: 1 | -1 = 1;
  panelCollapsed = true;
  searchTerm = '';
  isLoading = true;
  errorMsg = '';

  alarmsCurrentPage = 1;
  alarmsPageSize = 10;
  alarmsTotalRows = 0;

  alarms: Alarm[] = [];

  constructor(private alarmService: AlarmService) {}

  ngOnInit(): void {
    this.alarmService.getAlarms().subscribe({
      next: (data) => {
        this.alarms = data;
        this.alarmsTotalRows = data.length;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load alarms', err);
        this.errorMsg = 'Failed to load alarms. Please try again.';
        this.isLoading = false;
      }
    });
  }

  get alarmsTotalPages(): number {
    return Math.ceil(this.alarmsTotalRows / this.alarmsPageSize) || 1;
  }

  get filteredAlarms(): Alarm[] {
    if (!this.searchTerm) {
      const data = [...this.alarms];
      this.alarmsTotalRows = data.length;
      return data;
    }
    const s = this.searchTerm.toLowerCase();
    const data = this.alarms.filter(a =>
      a.description.toLowerCase().includes(s) ||
      a.parameter.toLowerCase().includes(s) ||
      a.severity.toLowerCase().includes(s)
    );
    this.alarmsTotalRows = data.length;
    return data;
  }

  private get sortedAll(): Alarm[] {
    const data = this.filteredAlarms;
    if (!this.sortField) return [...data];
    return [...data].sort((a, b) => {
      const va = a[this.sortField as keyof Alarm];
      const vb = b[this.sortField as keyof Alarm];
      if (va === vb) return 0;
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return this.sortDir * (cmp < 0 ? -1 : 1);
    });
  }

  get sorted(): Alarm[] {
    const start = (this.alarmsCurrentPage - 1) * this.alarmsPageSize;
    return this.sortedAll.slice(start, start + this.alarmsPageSize);
  }

  alarmsGoToPage(page: number): void {
    if (page >= 1 && page <= this.alarmsTotalPages) {
      this.alarmsCurrentPage = page;
    }
  }

  alarmsGetPageNumbers(): number[] {
    const total = this.alarmsTotalPages;
    const current = this.alarmsCurrentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages as number[];
  }

  get totalCount(): number {
    return this.alarms.length;
  }

  get highCount(): number {
    return this.alarms.filter(a => a.severity === 'HIGH').length;
  }

  get mediumCount(): number {
    return this.alarms.filter(a => a.severity === 'MEDIUM').length;
  }

  get lowCount(): number {
    return this.alarms.filter(a => a.severity === 'LOW').length;
  }

  sort(field: keyof Alarm): void {
    if (this.sortField === field) {
      this.sortDir = (this.sortDir === 1 ? -1 : 1) as 1 | -1;
    } else {
      this.sortField = field;
      this.sortDir = 1;
    }
  }

  togglePanel(): void {
    this.panelCollapsed = !this.panelCollapsed;
  }

  downloadCsv(): void {
    const headers = ['Date', 'Time', 'Description', 'Parameter', 'Severity'];
    const rows = this.alarms.map(a =>
      [a.date, a.time, a.description, a.parameter, a.severity]
        .map(c => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alarms_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  onExportAlarms(): void {
    const headers = ['date', 'time', 'description', 'parameter', 'severity'];
    const rows = this.alarms.map((r: any) => headers.map(h => r[h] ?? ''));
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alarms-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}