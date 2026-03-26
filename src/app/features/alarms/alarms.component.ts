import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlarmService, Alarm, Severity } from '../../../app/core/services/alarm.service';

export type { Severity, Alarm };

@Component({
  selector: 'app-alarms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alarms.component.html',
  styleUrl: './alarms.component.scss'
})
export class AlarmsComponent implements OnInit, OnDestroy {
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

  private paramSub!: Subscription;
  private pollingInterval: any = null;

  constructor(
    private alarmService: AlarmService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Always load paginated alarms on every navigation/param change.
    // The ?from=notifications param is no longer needed for routing logic
    // since both paths now use the same paginated endpoint.
    this.paramSub = this.route.queryParamMap.subscribe(() => {
      this.stopPolling();
      this.alarmsCurrentPage = 1;
      this.searchTerm = '';
      this.loadAlarms();        // ← always hit /api/alarms/?page=1&page_size=10
      this.startPolling();      // ← refresh every 5s
    });
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.stopPolling();
  }

  // ── Polling: refreshes the current page every 5 seconds ──────────────────
  private startPolling(): void {
    this.stopPolling();
    this.pollingInterval = setInterval(() => {
      this.loadAlarms();
    }, 5000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // ── Single data-loading method — paginated API ────────────────────────────
  loadAlarms(): void {
    this.isLoading = true;
    this.errorMsg = '';
    this.alarmService.getAlarms(this.alarmsCurrentPage, this.alarmsPageSize).subscribe({
      next: ({ count, alarms }) => {
        this.alarms = alarms;
        this.alarmsTotalRows = count;   // ← real total from server
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load alarms', err);
        this.errorMsg = 'Failed to load alarms. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // ── Pagination getters ────────────────────────────────────────────────────
  get alarmsTotalPages(): number {
    return Math.ceil(this.alarmsTotalRows / this.alarmsPageSize) || 1;
  }

  get alarmsStartRow(): number {
    if (this.alarmsTotalRows === 0) return 0;
    return (this.alarmsCurrentPage - 1) * this.alarmsPageSize + 1;
  }

  get alarmsEndRow(): number {
    return Math.min(this.alarmsCurrentPage * this.alarmsPageSize, this.alarmsTotalRows);
  }

  get alarmsWindowPages(): number[] {
    const total = this.alarmsTotalPages;
    const current = this.alarmsCurrentPage;
    if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 2) return [1, 2, 3];
    if (current >= total - 1) return [total - 2, total - 1, total];
    return [current - 1, current, current + 1];
  }

  // ── Client-side sort (within current page) ────────────────────────────────
  private get sortedAll(): Alarm[] {
    const data = [...this.alarms];
    if (!this.sortField) return data;
    return data.sort((a, b) => {
      const va = a[this.sortField as keyof Alarm];
      const vb = b[this.sortField as keyof Alarm];
      if (va === vb) return 0;
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return this.sortDir * (cmp < 0 ? -1 : 1);
    });
  }

  get alarmsPaginatedData(): Alarm[] {
    return this.sortedAll;
  }

  // ── Page navigation ───────────────────────────────────────────────────────
  alarmsGoToPage(page: number): void {
    if (page >= 1 && page <= this.alarmsTotalPages) {
      this.alarmsCurrentPage = page;
      this.loadAlarms();
    }
  }

  alarmsChangePageSize(size: number): void {
    this.alarmsPageSize = Number(size);
    this.alarmsCurrentPage = 1;
    this.loadAlarms();
  }

  alarmsOnExport(): void {
    this.onExportAlarms();
  }

  // ── Chip counts ───────────────────────────────────────────────────────────
  // Note: totalCount reflects the full server total; HIGH/MEDIUM/LOW counts
  // reflect only the current page. If you need global counts, add a separate
  // API endpoint or include counts in the API response.
  get totalCount(): number  { return this.alarmsTotalRows; }
  get highCount(): number   { return this.alarms.filter(a => a.severity === 'HIGH').length; }
  get mediumCount(): number { return this.alarms.filter(a => a.severity === 'MEDIUM').length; }
  get lowCount(): number    { return this.alarms.filter(a => a.severity === 'LOW').length; }

  // ── Sorting ───────────────────────────────────────────────────────────────
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

  // ── Export ────────────────────────────────────────────────────────────────
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