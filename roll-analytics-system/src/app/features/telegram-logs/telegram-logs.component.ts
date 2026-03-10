import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type Status = 'Sent' | 'Received';

export interface TelegramLog {
  date: string;
  time: string;
  teleNo: string;
  teleDescription: string;
  outerSystem: string;
  cmmMode: string;
  length: number;
  status: Status;
  user: string;
}

@Component({
  selector: 'app-telegram-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './telegram-logs.component.html',
  styleUrl: './telegram-logs.component.scss'
})
export class TelegramLogsComponent {
  sortField: keyof TelegramLog | '' = '';
  sortDir: 1 | -1 = 1;
  accordionCollapsed = true;
  searchTerm = '';

  telegramCurrentPage = 1;
  telegramPageSize = 10;
  telegramTotalRows: number = 0;

  private readonly rawLogs: TelegramLog[] = [

  // ================= SAP ↔ RAS =================
  { date: '18/02/2026', time: '08:10 AM', teleNo: 'SAP001', teleDescription: 'Supplier Master Added', outerSystem: 'SAP', cmmMode: 'API', length: 0, status: 'Received', user: 'RAS' },
  { date: '18/02/2026', time: '08:12 AM', teleNo: 'SAP002', teleDescription: 'Roll Item Added to Inventory', outerSystem: 'SAP', cmmMode: 'API', length: 0, status: 'Received', user: 'RAS' },
  { date: '18/02/2026', time: '08:15 AM', teleNo: 'SAP003', teleDescription: 'Inventory Stock Update - Roll ID R2345', outerSystem: 'SAP', cmmMode: 'API', length: 0, status: 'Received', user: 'RAS' },

  // ================= RSMS ↔ RAS =================
  { date: '18/02/2026', time: '09:05 AM', teleNo: 'RSMS001', teleDescription: 'Roll Grinding Data Uploaded - Roll R2345', outerSystem: 'RSMS', cmmMode: 'TCP/IP', length: 1024, status: 'Received', user: 'RAS' },
  { date: '18/02/2026', time: '09:20 AM', teleNo: 'RSMS002', teleDescription: 'Roll Surface Roughness Measurement', outerSystem: 'RSMS', cmmMode: 'TCP/IP', length: 850, status: 'Received', user: 'RAS' },
  { date: '18/02/2026', time: '09:25 AM', teleNo: 'RSMS003', teleDescription: 'Roll Diameter After Grinding', outerSystem: 'RSMS', cmmMode: 'TCP/IP', length: 720, status: 'Received', user: 'RAS' },

  // ================= M_L2 ↔ RAS =================
  { date: '18/02/2026', time: '10:00 AM', teleNo: 'ML2001', teleDescription: 'Roll Change Executed - Stand 3', outerSystem: 'M_L2', cmmMode: 'TCP/IP', length: 480, status: 'Received', user: 'RAS' },
  { date: '18/02/2026', time: '10:30 AM', teleNo: 'ML2002', teleDescription: 'Roll Defect Logged - Surface Crack', outerSystem: 'M_L2', cmmMode: 'TCP/IP', length: 690, status: 'Received', user: 'RAS' },
  { date: '18/02/2026', time: '10:45 AM', teleNo: 'ML2003', teleDescription: 'Cobble Event Detected - Stand 2', outerSystem: 'M_L2', cmmMode: 'TCP/IP', length: 520, status: 'Received', user: 'RAS' },

  // ================= PDO / PDI Data Exchange =================
  { date: '18/02/2026', time: '11:05 AM', teleNo: 'ML2004', teleDescription: 'PDI Data Received for Coil C10234', outerSystem: 'M_L2', cmmMode: 'TCP/IP', length: 1400, status: 'Received', user: 'RAS' },
  { date: '18/02/2026', time: '11:12 AM', teleNo: 'ML2005', teleDescription: 'PDO Data Received for Coil C10234', outerSystem: 'M_L2', cmmMode: 'TCP/IP', length: 1100, status: 'Received', user: 'RAS' },

  // ================= Roll Analytics Events =================
  { date: '18/02/2026', time: '12:10 PM', teleNo: 'RAS006', teleDescription: 'Roll Wear Prediction Alert Sent to SAP', outerSystem: 'SAP', cmmMode: 'TCP/IP', length: 410, status: 'Sent', user: 'RAS' },
  { date: '18/02/2026', time: '12:25 PM', teleNo: 'RAS007', teleDescription: 'Roll Scrap Recommendation', outerSystem: 'SAP', cmmMode: 'TCP/IP', length: 390, status: 'Sent', user: 'RAS' },
  { date: '18/02/2026', time: '01:05 PM', teleNo: 'RSMS004', teleDescription: 'Grinding Cycle Completion Confirmation', outerSystem: 'RSMS', cmmMode: 'TCP/IP', length: 275, status: 'Received', user: 'RAS' },
  { date: '18/02/2026', time: '01:30 PM', teleNo: 'ML2005', teleDescription: 'Abnormal Roll Force Detected - Stand 5', outerSystem: 'M_L2', cmmMode: 'TCP/IP', length: 600, status: 'Received', user: 'RAS' }
];

  get logs(): TelegramLog[] {
    const data = this.sortedAll;
    const start = (this.telegramCurrentPage - 1) * this.telegramPageSize;
    return data.slice(start, start + this.telegramPageSize);
  }

  get telegramTotalPages(): number {
    return Math.ceil(this.telegramTotalRows / this.telegramPageSize) || 1;
  }

  get filteredLogs(): TelegramLog[] {
    if (!this.searchTerm) {
      const data = [...this.rawLogs];
      this.telegramTotalRows = data.length;
      return data;
    }
    const s = this.searchTerm.toLowerCase();
    const data = this.rawLogs.filter(log =>
      log.teleNo.toLowerCase().includes(s) ||
      log.teleDescription.toLowerCase().includes(s) ||
      log.outerSystem.toLowerCase().includes(s) ||
      log.status.toLowerCase().includes(s)
    );
    this.telegramTotalRows = data.length;
    return data;
  }

  private get sortedAll(): TelegramLog[] {
    const data = this.filteredLogs;
    if (!this.sortField) return [...data];
    return [...data].sort((a, b) => {
      const va = a[this.sortField as keyof TelegramLog];
      const vb = b[this.sortField as keyof TelegramLog];
      if (va === vb) return 0;
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return this.sortDir * (cmp < 0 ? -1 : 1);
    });
  }

  telegramGoToPage(page: number) {
    if (page >= 1 && page <= this.telegramTotalPages) {
      this.telegramCurrentPage = page;
    }
  }

  telegramGetPageNumbers(): number[] {
    const total = this.telegramTotalPages;
    const current = this.telegramCurrentPage;
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

  get sorted(): TelegramLog[] {
    if (!this.sortField) return [...this.pagedData];
    return [...this.pagedData].sort((a, b) => {
      const va = a[this.sortField as keyof TelegramLog];
      const vb = b[this.sortField as keyof TelegramLog];
      if (va === vb) return 0;
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return this.sortDir * (cmp < 0 ? -1 : 1);
    });
  }

  get pagedData(): TelegramLog[] {
    const start = (this.telegramCurrentPage - 1) * this.telegramPageSize;
    return this.logs.slice(start, start + this.telegramPageSize);
  }

  sort(field: keyof TelegramLog): void {
    if (this.sortField === field) {
      this.sortDir = (this.sortDir === 1 ? -1 : 1) as 1 | -1;
    } else {
      this.sortField = field;
      this.sortDir = 1;
    }
  }

  constructor() {
    this.telegramTotalRows = this.logs.length;
  }

  downloadCsv(): void {
    const headers = ['Date', 'Time', 'Tele.No', 'Tele.Description', 'Outer System', 'Cmm Mode', 'Length', 'Status', 'User'];
    const rows = this.logs.map((r) =>
      [r.date, r.time, r.teleNo, r.teleDescription, r.outerSystem, r.cmmMode, r.length, r.status, r.user]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telegram_logs_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  onExportTelegram() {
    const headers = Object.keys(this.logs[0] || {});
    const rows = this.logs.map((r: any) => headers.map(h => r[h] ?? ''));
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telegram-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
