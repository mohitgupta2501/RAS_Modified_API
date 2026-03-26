// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// export type Status = 'Sent' | 'Received';

// export interface TelegramLog {
//   date: string;
//   time: string;
//   teleNo: string;
//   teleDescription: string;
//   outerSystem: string;
//   cmmMode: string;
//   length: number;
//   status: Status;
//   user: string;
//   direction: 'Send' | 'Receive';
// }

// @Component({
//   selector: 'app-telegram-logs',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './telegram-logs.component.html',
//   styleUrl: './telegram-logs.component.scss'
// })
// export class TelegramLogsComponent {
//   sortField: keyof TelegramLog | '' = '';
//   sortDir: 1 | -1 = 1;
//   accordionCollapsed = true;
//   searchTerm = '';

//   telegramCurrentPage = 1;
//   telegramPageSize = 10;
//   telegramTotalRows: number = 0;

//   private readonly rawLogs: TelegramLog[] = [

//   // ================= SAP ↔ RAS =================
//   { date: '18/02/2026', time: '08:10 AM', teleNo: 'SAP001', teleDescription: 'Supplier Master Added', outerSystem: 'SAP', cmmMode: 'API', length: 0, status: 'Received', user: 'RAS', direction: 'Receive' },
//   { date: '18/02/2026', time: '08:12 AM', teleNo: 'SAP002', teleDescription: 'Roll Item Added to Inventory', outerSystem: 'SAP', cmmMode: 'API', length: 0, status: 'Received', user: 'RAS', direction: 'Receive' },
//   { date: '18/02/2026', time: '08:15 AM', teleNo: 'SAP003', teleDescription: 'Inventory Stock Update - Roll ID R2345', outerSystem: 'SAP', cmmMode: 'API', length: 0, status: 'Received', user: 'RAS', direction: 'Receive' },

//   // ================= RSMS ↔ RAS =================
//   { date: '18/02/2026', time: '09:05 AM', teleNo: 'RSMS001', teleDescription: 'Roll Grinding Data Uploaded - Roll R2345', outerSystem: 'RSMS', cmmMode: 'TCP/IP', length: 1024, status: 'Received', user: 'RAS', direction: 'Receive' },
//   { date: '18/02/2026', time: '09:20 AM', teleNo: 'RSMS002', teleDescription: 'Roll Surface Roughness Measurement', outerSystem: 'RSMS', cmmMode: 'TCP/IP', length: 850, status: 'Received', user: 'RAS', direction: 'Receive' },
//   { date: '18/02/2026', time: '09:25 AM', teleNo: 'RSMS003', teleDescription: 'Roll Diameter After Grinding', outerSystem: 'RSMS', cmmMode: 'TCP/IP', length: 720, status: 'Received', user: 'RAS', direction: 'Receive' },

//   // ================= M_L2 ↔ RAS =================
//   { date: '18/02/2026', time: '10:00 AM', teleNo: 'ML2001', teleDescription: 'Roll Change Executed - Stand 3', outerSystem: 'M_L2', cmmMode: 'TCP/IP', length: 480, status: 'Received', user: 'RAS', direction: 'Receive' },
//   { date: '18/02/2026', time: '10:30 AM', teleNo: 'ML2002', teleDescription: 'Roll Defect Logged - Surface Crack', outerSystem: 'M_L2', cmmMode: 'TCP/IP', length: 690, status: 'Received', user: 'RAS', direction: 'Receive' },
//   { date: '18/02/2026', time: '10:45 AM', teleNo: 'ML2003', teleDescription: 'Cobble Event Detected - Stand 2', outerSystem: 'M_L2', cmmMode: 'TCP/IP', length: 520, status: 'Received', user: 'RAS', direction: 'Receive' },

//   // ================= PDO / PDI Data Exchange =================
//   { date: '18/02/2026', time: '11:05 AM', teleNo: 'ML2004', teleDescription: 'PDI Data Received for Coil C10234', outerSystem: 'M_L2', cmmMode: 'TCP/IP', length: 1400, status: 'Received', user: 'RAS', direction: 'Receive' },
//   { date: '18/02/2026', time: '11:12 AM', teleNo: 'ML2005', teleDescription: 'PDO Data Received for Coil C10234', outerSystem: 'M_L2', cmmMode: 'TCP/IP', length: 1100, status: 'Received', user: 'RAS', direction: 'Receive' },

//   // ================= Roll Analytics Events =================
//   { date: '18/02/2026', time: '12:10 PM', teleNo: 'RAS006', teleDescription: 'Roll Wear Prediction Alert Sent to SAP', outerSystem: 'SAP', cmmMode: 'TCP/IP', length: 410, status: 'Sent', user: 'RAS', direction: 'Send' },
//   { date: '18/02/2026', time: '12:25 PM', teleNo: 'RAS007', teleDescription: 'Roll Scrap Recommendation', outerSystem: 'SAP', cmmMode: 'TCP/IP', length: 390, status: 'Sent', user: 'RAS', direction: 'Send' },
//   { date: '18/02/2026', time: '01:05 PM', teleNo: 'RSMS004', teleDescription: 'Grinding Cycle Completion Confirmation', outerSystem: 'RSMS', cmmMode: 'TCP/IP', length: 275, status: 'Received', user: 'RAS', direction: 'Receive' },
//   { date: '18/02/2026', time: '01:30 PM', teleNo: 'ML2005', teleDescription: 'Abnormal Roll Force Detected - Stand 5', outerSystem: 'M_L2', cmmMode: 'TCP/IP', length: 600, status: 'Received', user: 'RAS', direction: 'Receive' }
// ];

//   get logs(): TelegramLog[] {
//     const data = this.sortedAll;
//     const start = (this.telegramCurrentPage - 1) * this.telegramPageSize;
//     return data.slice(start, start + this.telegramPageSize);
//   }

//   get telegramTotalPages(): number {
//     return Math.ceil(this.telegramTotalRows / this.telegramPageSize) || 1;
//   }

//   get filteredLogs(): TelegramLog[] {
//     if (!this.searchTerm) {
//       const data = [...this.rawLogs];
//       this.telegramTotalRows = data.length;
//       return data;
//     }
//     const s = this.searchTerm.toLowerCase();
//     const data = this.rawLogs.filter(log =>
//       log.teleNo.toLowerCase().includes(s) ||
//       log.teleDescription.toLowerCase().includes(s) ||
//       log.outerSystem.toLowerCase().includes(s) ||
//       log.status.toLowerCase().includes(s)
//     );
//     this.telegramTotalRows = data.length;
//     return data;
//   }

//   private get sortedAll(): TelegramLog[] {
//     const data = this.filteredLogs;
//     if (!this.sortField) return [...data];
//     return [...data].sort((a, b) => {
//       const va = a[this.sortField as keyof TelegramLog];
//       const vb = b[this.sortField as keyof TelegramLog];
//       if (va === vb) return 0;
//       const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
//       return this.sortDir * (cmp < 0 ? -1 : 1);
//     });
//   }

//   telegramGoToPage(page: number) {
//     if (page >= 1 && page <= this.telegramTotalPages) {
//       this.telegramCurrentPage = page;
//     }
//   }

//   telegramGetPageNumbers(): number[] {
//     const total = this.telegramTotalPages;
//     const current = this.telegramCurrentPage;
//     if (total <= 7) {
//       return Array.from({ length: total }, (_, i) => i + 1);
//     }
//     const pages: (number | string)[] = [1];
//     if (current > 3) pages.push(-1);
//     for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
//       pages.push(i);
//     }
//     if (current < total - 2) pages.push(-1);
//     pages.push(total);
//     return pages as number[];
//   }

//   get sorted(): TelegramLog[] {
//     if (!this.sortField) return [...this.pagedData];
//     return [...this.pagedData].sort((a, b) => {
//       const va = a[this.sortField as keyof TelegramLog];
//       const vb = b[this.sortField as keyof TelegramLog];
//       if (va === vb) return 0;
//       const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
//       return this.sortDir * (cmp < 0 ? -1 : 1);
//     });
//   }

//   get pagedData(): TelegramLog[] {
//     const start = (this.telegramCurrentPage - 1) * this.telegramPageSize;
//     return this.logs.slice(start, start + this.telegramPageSize);
//   }

//   sort(field: keyof TelegramLog): void {
//     if (this.sortField === field) {
//       this.sortDir = (this.sortDir === 1 ? -1 : 1) as 1 | -1;
//     } else {
//       this.sortField = field;
//       this.sortDir = 1;
//     }
//   }

//   constructor() {
//     this.telegramTotalRows = this.logs.length;
//   }

//   downloadCsv(): void {
//     const headers = ['Date', 'Time', 'Tele.No', 'Tele.Description', 'Outer System', 'Cmm Mode', 'Length', 'Status', 'User'];
//     const rows = this.logs.map((r) =>
//       [r.date, r.time, r.teleNo, r.teleDescription, r.outerSystem, r.cmmMode, r.length, r.status, r.user]
//         .map((c) => `"${String(c).replace(/"/g, '""')}"`)
//         .join(',')
//     );
//     const csv = [headers.join(','), ...rows].join('\r\n');
//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'telegram_logs_export.csv';
//     a.click();
//     URL.revokeObjectURL(url);
//   }

//   onExportTelegram() {
//     const headers = Object.keys(this.logs[0] || {});
//     const rows = this.logs.map((r: any) => headers.map(h => r[h] ?? ''));
//     const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
//     const blob = new Blob([csv], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `telegram-logs-${new Date().toISOString().slice(0, 10)}.csv`;
//     a.click();
//     window.URL.revokeObjectURL(url);
//   }
// }


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { TelegramService, TelegramLogApi } from '../../../app/core/services/telegram.service';

@Component({
  selector: 'app-telegram-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './telegram-logs.component.html',
  styleUrl: './telegram-logs.component.scss'
})
export class TelegramLogsComponent implements OnInit {

  gridApi?: GridApi<TelegramLogApi>;
  sortField: keyof TelegramLogApi | '' = '';
  sortDir: 1 | -1 = 1;
  accordionCollapsed = true;
  searchTerm = '';
  isLoading = false;
  errorMessage = '';

  currentPage = 1;
  pageSize = 10;
  apiTotalCount = 0;

  private rawLogs: TelegramLogApi[] = [];

  readonly statusColors: Record<string, { bg: string; border: string; color: string }> = {
    SENT:     { bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.45)', color: '#34D399' },
    RECEIVED: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.45)', color: '#3B82F6' }
  };

  telegramColDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      headerClass: 'center-header',
      cellClass: 'center-cell'
    },
    {
      field: 'created_at',
      headerName: 'CREATED AT',
      width: 180,
      headerClass: 'center-header',
      cellClass: 'center-cell',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        return date.toLocaleString();
      }
    },
    {
      field: 'chat_id',
      headerName: 'CHAT ID',
      width: 150,
      headerClass: 'center-header',
      cellClass: 'center-cell'
    },
    {
      field: 'message',
      headerName: 'MESSAGE',
      flex: 1,
      headerClass: 'center-header',
      cellClass: 'center-cell'
    },
    {
      field: 'status',
      headerName: 'STATUS',
      width: 120,
      headerClass: 'center-header',
      cellClass: 'center-cell',
      cellRenderer: (params: any) => this.createBadgeCell(params.value, this.statusColors)
    },
    {
      field: 'response_message',
      headerName: 'RESPONSE MESSAGE',
      flex: 1,
      headerClass: 'center-header',
      cellClass: 'center-cell'
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: false,
    suppressMovable: true,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  constructor(private telegramService: TelegramService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  onGridReady(params: GridReadyEvent<TelegramLogApi>): void {
    this.gridApi = params.api;
  }

  createBadgeCell(
    value: string,
    colorMap: Record<string, { bg: string; border: string; color: string }>
  ): string {
    const defaultStyle = {
      bg: 'rgba(255,255,255,0.06)',
      border: 'rgba(255,255,255,0.1)',
      color: '#7B90B8'
    };
    const style = colorMap[value?.toUpperCase()] || defaultStyle;
    return `<span style="
      background:${style.bg};
      border:1px solid ${style.border};
      color:${style.color};
      border-radius:8px;
      padding:4px 12px;
      font-size:11px;
      font-weight:700;
      letter-spacing:0.5px;
      white-space:nowrap;
      display:inline-flex;
      align-items:center;
      line-height:1.5;
    ">${value || '-'}</span>`;
  }

  // ─── Home-style pagination API ─────────────────────────────────────────────

  get totalRows(): number {
    return this.apiTotalCount;
  }

  get totalPages(): number {
    return Math.ceil(this.totalRows / this.pageSize) || 1;
  }

  get startRow(): number {
    if (this.totalRows === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRow(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRows);
  }

  get windowPages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 2) return [1, 2, 3];
    if (current >= total - 1) return [total - 2, total - 1, total];
    return [current - 1, current, current + 1];
  }

  loadLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.telegramService.getLogs(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.rawLogs = res.results;
        this.apiTotalCount = res.count;
        this.isLoading = false;
        this.gridApi?.setRowData(this.rawLogs);
      },
      error: (err) => {
        this.errorMessage = 'Failed to load telegram logs.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  // ─── Filtering ───────────────────────────────────────────
  get filteredLogs(): TelegramLogApi[] {
    if (!this.searchTerm) return [...this.rawLogs];
    const s = this.searchTerm.toLowerCase();
    return this.rawLogs.filter(log =>
      log.chat_id.toLowerCase().includes(s) ||
      log.message.toLowerCase().includes(s) ||
      log.status.toLowerCase().includes(s) ||
      log.response_message?.toLowerCase().includes(s)
    );
  }

  // ─── Sorting ─────────────────────────────────────────────
  private get sortedAll(): TelegramLogApi[] {
    const data = this.filteredLogs;
    if (!this.sortField) return data;
    return [...data].sort((a, b) => {
      const va = a[this.sortField as keyof TelegramLogApi];
      const vb = b[this.sortField as keyof TelegramLogApi];
      if (va === vb) return 0;
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return this.sortDir * (cmp < 0 ? -1 : 1);
    });
  }

  get sorted(): TelegramLogApi[] {
    return this.sortedAll;
  }

  get tlPaginatedData(): TelegramLogApi[] {
    return this.sortedAll;
  }

  sort(field: keyof TelegramLogApi): void {
    if (this.sortField === field) {
      this.sortDir = (this.sortDir === 1 ? -1 : 1) as 1 | -1;
    } else {
      this.sortField = field;
      this.sortDir = 1;
    }
  }

  // ─── Pagination ───────────────────────────────────────────
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadLogs();
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
    this.loadLogs();
  }

  onExport(): void {
    const headers = ['ID', 'Created At', 'Chat ID', 'Message', 'Status', 'Response Message'];
    const rows = this.rawLogs.map(r => [
      r.id,
      r.created_at,
      r.chat_id,
      r.message,
      r.status,
      r.response_message
    ].map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telegram-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}