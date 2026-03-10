// import { CommonModule } from '@angular/common';
// import { Component, OnDestroy, OnInit, inject } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { AgGridAngular } from 'ag-grid-angular';
// import type {
//   ColDef,
//   ColGroupDef,
//   CellClickedEvent,
//   GridApi,
//   GridReadyEvent,
//   ICellRendererParams
// } from 'ag-grid-community';

// interface RollRow {
//   rollId: string;
//   stand: string;
//   type: string;
//   position: string;
//   cycleWeight: number;
//   cycleLength: number;
//   cumulWeight: number;
//   cumulLength: number;
//   noOfCycle: number;
//   supplier: string;
//   progress: number; // 0-100
// }

// type TabKey = 'all' | 'roughing' | 'finishing' | 'pinch' | 'edger';

// @Component({
//   selector: 'app-home',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule, AgGridAngular],
//   templateUrl: './home.component.html',
//   styleUrl: './home.component.scss'
// })
// export class HomeComponent implements OnInit, OnDestroy {
//   private readonly router = inject(Router);

//   gridApi?: GridApi<RollRow>;

//   activeTab: TabKey = 'all';

//   tabs = [
//     {
//       id: 'all',
//       label: 'All',
//       count: 43,
//       icon: 'grid_view'
//     },
//     {
//       id: 'roughing',
//       label: 'Roughing',
//       count: 6,
//       icon: 'construction'
//     },
//     {
//       id: 'finishing',
//       label: 'Finishing',
//       count: 28,
//       icon: 'settings'
//     },
//     {
//       id: 'pinch',
//       label: 'Pinch',
//       count: 3,
//       icon: 'compress'
//     },
//     {
//       id: 'edger',
//       label: 'Edger',
//       count: 6,
//       icon: 'straighten'
//     }
//   ];

//   allStands: string[] = [
//     'E1',
//     'R1',
//     'E2',
//     'R2',
//     'F1e',
//     'F1',
//     'F2',
//     'F3',
//     'F4',
//     'F5',
//     'F6',
//     'F7',
//     'PR1',
//     'PR2',
//     'PR3'
//   ];

//   autoRefresh = true;
//   private refreshInterval: ReturnType<typeof setInterval> | undefined;
//   lastUpdated = new Date();

//   showRollModal = false;
//   selectedRoll: RollRow | null = null;

//   currentPage = 1;
//   pageSize = 15;
//   pageSizeOptions: number[] = [10, 15, 20, 25];
//   pageSizeOpen = false;

//   get totalRows(): number {
//     return this.filteredData.length;
//   }

//   get totalPages(): number {
//     return Math.ceil(this.totalRows / this.pageSize) || 1;
//   }

//   get startRow(): number {
//     if (this.totalRows === 0) return 0;
//     return (this.currentPage - 1) * this.pageSize + 1;
//     }

//   get endRow(): number {
//     return Math.min(this.currentPage * this.pageSize, this.totalRows);
//   }

//   get pageNumbers(): number[] {
//     const pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
//     return pages.filter(
//       (p) => p === 1 || p === this.totalPages || Math.abs(p - this.currentPage) <= 1
//     );
//   }

//   onImgError(event: any): void {
//     if (event?.target) {
//       (event.target as HTMLElement).style.display = 'none';
//     }
//   }

//   rowData: RollRow[] = [];

//   progressBarRenderer = (params: any) => {
//     const val = params.value || 0;

//     const barColor = '#00D4FF';
//     const glowColor = 'rgba(0,212,255,0.6)';

//     const container = document.createElement('div');
//     container.style.cssText = `
//       display:flex;
//       align-items:center;
//       gap:8px;
//       height:100%;
//       padding:0 12px;
//       width:100%;
//       box-sizing:border-box;
//     `;

//     const pct = document.createElement('span');
//     pct.style.cssText = `
//       font-size:12px;
//       font-weight:800;
//       color:${barColor};
//       min-width:36px;
//       text-align:right;
//       flex-shrink:0;
//       font-family:Inter,sans-serif;
//       text-shadow:0 0 8px ${glowColor};
//     `;
//     pct.textContent = `${val}%`;

//     const track = document.createElement('div');
//     track.style.cssText = `
//       flex:1;
//       height:8px;
//       background:rgba(255,255,255,0.07);
//       border-radius:8px;
//       overflow:hidden;
//       position:relative;
//       box-shadow:inset 0 1px 3px rgba(0,0,0,0.4);
//     `;

//     const fill = document.createElement('div');
//     fill.style.cssText = `
//       height:100%;
//       width:0%;
//       background:linear-gradient(90deg,${barColor}88,${barColor});
//       border-radius:8px;
//       box-shadow:0 0 10px ${glowColor};
//       transition:width 1.2s cubic-bezier(0.4,0,0.2,1);
//       position:relative;
//       overflow:hidden;
//     `;

//     const shimmer = document.createElement('div');
//     shimmer.style.cssText = `
//       position:absolute;
//       top:0;
//       left:-100%;
//       width:100%;
//       height:100%;
//       background:linear-gradient(90deg,
//         transparent,
//         rgba(255,255,255,0.3),
//         transparent);
//       animation:barShimmer 2s linear infinite;
//     `;

//     fill.appendChild(shimmer);
//     track.appendChild(fill);

//     container.appendChild(pct);
//     container.appendChild(track);

//     setTimeout(() => {
//       fill.style.width = `${val}%`;
//     }, 150);

//     return container;
//   };

//   readonly standColors: Record<string, { bg: string; border: string; color: string }> = {
//     R1: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     R2: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     E1: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     E2: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     F1: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     F2: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     F3: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     F4: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     F5: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     F6: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     F7: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     F1e: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     PR1: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     PR2: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     PR3: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     }
//   };

//   readonly typeColors: Record<string, { bg: string; border: string; color: string }> = {
//     'Work Roll': {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     WR: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     'Backup Roll': {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     BUR: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     'Intermediate Roll': {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     IMR: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     'Edger Roll': {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     'Pinch Roll': {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     'Vertical Roll': {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     }
//   };

//   readonly positionColors: Record<string, { bg: string; border: string; color: string }> = {
//     Top: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     Bottom: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     Bot: {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     'Drive Side': {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     },
//     'Operator Side': {
//       bg: 'rgba(167,139,250,0.15)',
//       border: 'rgba(167,139,250,0.45)',
//       color: '#A78BFA'
//     }
//   };

//   createBadgeCell(
//     value: string,
//     colorMap: Record<string, { bg: string; border: string; color: string }>
//   ): string {
//     const defaultStyle = {
//       bg: 'rgba(255,255,255,0.06)',
//       border: 'rgba(255,255,255,0.1)',
//       color: '#7B90B8'
//     };
//     const style = colorMap[value] || defaultStyle;
//     return `<span style="
//     background:${style.bg};
//     border:1px solid ${style.border};
//     color:${style.color};
//     border-radius:8px;
//     padding:4px 12px;
//     font-size:11px;
//     font-weight:700;
//     letter-spacing:0.5px;
//     white-space:nowrap;
//     display:inline-flex;
//     align-items:center;
//     line-height:1.5;
//   ">${value || ''}</span>`;
//   }

//   columnDefs: Array<ColDef<RollRow> | ColGroupDef<RollRow>> = [
//     {
//       field: 'rollId',
//       headerName: 'ROLL ID',
//       width: 140,
//       pinned: 'left',
//       lockPinned: true,
//       headerClass: 'center-header',
//       cellClass: ['center-cell', 'cursor-pointer'],
//       sortable: false,
//       cellRenderer: (params: ICellRendererParams<RollRow, string>) =>
//         `<span class="roll-id-link">${params.value ?? ''}</span>`,
//       onCellClicked: (params: CellClickedEvent<RollRow>) =>
//         this.onRollIdClick(params.data as RollRow)
//     },
//     {
//       field: 'stand',
//       headerName: 'STAND',
//       width: 100,
//       headerClass: 'center-header',
//       cellClass: 'center-cell',
//       sortable: false,
//       cellRenderer: (params: any) =>
//         this.createBadgeCell(params.value, this.standColors)
//     },
//     {
//       field: 'type',
//       headerName: 'TYPE',
//       width: 130,
//       headerClass: 'center-header',
//       cellClass: 'center-cell',
//       sortable: false,
//       cellRenderer: (params: any) =>
//         this.createBadgeCell(params.value, this.typeColors)
//     },
//     {
//       field: 'position',
//       headerName: 'POSITION',
//       width: 110,
//       headerClass: 'center-header',
//       cellClass: 'center-cell',
//       sortable: false,
//       cellRenderer: (params: any) =>
//         this.createBadgeCell(params.value, this.positionColors)
//     },
//     {
//       headerName: 'CYCLE',
//       headerClass: 'center-header',
//       headerGroupComponent: undefined,
//       children: [
//         {
//           field: 'cycleWeight',
//           headerName: 'WEIGHT (TON)',
//           width: 140,
//           headerClass: 'center-header',
//           cellClass: 'center-cell',
//           type: 'numericColumn',
//           sortable: false,
//           cellRenderer: (params: ICellRendererParams<RollRow, number>) =>
//             `<span style="color:#00D4FF;font-weight:700;font-size:13px;">${params.value ?? ''}</span>`
//         },
//         {
//           field: 'cycleLength',
//           headerName: 'LENGTH (KM)',
//           width: 130,
//           headerClass: 'center-header',
//           cellClass: 'center-cell',
//           type: 'numericColumn',
//           sortable: false,
//           cellRenderer: (params: ICellRendererParams<RollRow, number>) =>
//             `<span style="color:#00D4FF;font-weight:600;font-size:13px;">${params.value ?? ''}</span>`
//         }
//       ]
//     },
//     {
//       headerName: 'CUMULATIVE',
//       headerClass: 'center-header',
//       children: [
//         {
//           field: 'cumulWeight',
//           headerName: 'WEIGHT (TON)',
//           width: 140,
//           headerClass: 'center-header',
//           cellClass: 'center-cell',
//           type: 'numericColumn',
//           sortable: false,
//           cellRenderer: (params: ICellRendererParams<RollRow, number>) =>
//             `<span style="color:#00D4FF;font-weight:700;font-size:13px;">${params.value ?? ''}</span>`
//         },
//         {
//           field: 'cumulLength',
//           headerName: 'LENGTH (KM)',
//           width: 130,
//           headerClass: 'center-header',
//           cellClass: 'center-cell',
//           type: 'numericColumn',
//           sortable: false,
//           cellRenderer: (params: ICellRendererParams<RollRow, number>) =>
//             `<span style="color:#00D4FF;font-weight:600;font-size:13px;">${params.value ?? ''}</span>`
//         }
//       ]
//     },
//     {
//       headerName: 'NO. OF CYCLE',
//       field: 'noOfCycle',
//       width: 120,
//       cellRenderer: (params: any) => {
//         const val = params.value;
//         if (!val && val !== 0) {
//           return `<span style="color:#3D5175;font-size:13px">-</span>`;
//         }
//         return `
//           <div style="
//             display:flex;align-items:center;
//             justify-content:center;height:100%;
//           ">
//             <span style="
//               color:#00D4FF;
//               font-weight:700;
//               font-size:14px;
//             ">${val}</span>
//           </div>`;
//       },
//       cellStyle: {
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center'
//       }
//     },
//     {
//       field: 'supplier',
//       headerName: 'SUPPLIER',
//       width: 120,
//       headerClass: 'center-header',
//       cellClass: 'center-cell',
//       sortable: false,
//       cellRenderer: (params: any) =>
//         `<span style="
//           color:#FFFFFF;
//           font-weight:500;
//           font-size:13px;
//         ">${params.value || ''}</span>`
//     },
//     {
//       field: 'progress',
//       headerName: 'CAMPAIGN UTIL.',
//       width: 180,
//       minWidth: 180,
//       pinned: 'right',
//       lockPinned: true,
//       headerClass: 'center-header',
//       cellClass: 'center-cell',
//       sortable: false,
//       cellRenderer: this.progressBarRenderer,
//       cellStyle: { padding: '0', overflow: 'visible' }
//     }
//   ];

//   defaultColDef: ColDef = {
//     sortable: false,
//     unSortIcon: false,
//     suppressHeaderMenuButton: true,
//     resizable: true,
//     suppressMovable: false,
//     cellStyle: {
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center'
//     }
//   };

//   get filteredData(): RollRow[] {
//     if (this.activeTab === 'all') return this.rowData;
//     if (this.activeTab === 'roughing') {
//       return this.rowData.filter((r) => ['R1', 'R2'].includes(r.stand));
//     }
//     return this.rowData.filter((r) =>
//       ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7'].includes(r.stand)
//     );
//   }

//   ngOnInit(): void {
//     this.startAutoRefresh();
//   }

//   ngOnDestroy(): void {
//     this.stopAutoRefresh();
//   }

//   onGridReady(params: GridReadyEvent<RollRow>): void {
//     this.gridApi = params.api;
//     this.gridApi.setRowData(this.filteredData);
//     this.gridApi.paginationSetPageSize(this.pageSize);
//     this.gridApi.paginationGoToFirstPage();
//   }

//   switchTab(key: TabKey): void {
//     this.activeTab = key;
//     this.currentPage = 1;
//     this.gridApi?.setRowData(this.filteredData);
//     this.gridApi?.paginationGoToFirstPage();
//   }

//   setActiveTab(id: string) {
//     this.activeTab = id as TabKey;
//     this.switchTab(this.activeTab);
//   }

//   toggleAutoRefresh(): void {
//     this.autoRefresh = !this.autoRefresh;
//     if (this.autoRefresh) this.startAutoRefresh();
//     else this.stopAutoRefresh();
//   }

//   private startAutoRefresh(): void {
//     this.stopAutoRefresh();
//     if (!this.autoRefresh) return;
//     this.refreshInterval = setInterval(() => this.updateLiveData(), 5000);
//   }

//   private stopAutoRefresh(): void {
//     if (this.refreshInterval) clearInterval(this.refreshInterval);
//     this.refreshInterval = undefined;
//   }

//   private updateTabCounts(): void {
//   }

//   updateLiveData(): void {
//     this.rowData = this.rowData.map((row) => ({
//       ...row,
//       cycleWeight: row.cycleWeight + Math.floor(Math.random() * 10 - 5),
//       cycleLength: Number((row.cycleLength + (Math.random() * 0.2 - 0.1)).toFixed(1)),
//       progress: Math.min(100, Math.max(0, row.progress + Math.floor(Math.random() * 3 - 1)))
//     }));

//     this.lastUpdated = new Date();
//     this.gridApi?.setRowData(this.filteredData);
//   }

//   onRollIdClick(data: RollRow): void {
//     this.selectedRoll = data;
//     this.showRollModal = true;
//   }

//   navigateToRollDetails(): void {
//     this.showRollModal = false;
//     this.router.navigate(['/roll-details']);
//   }

//   goToPage(p: number): void {
//     if (p < 1 || p > this.totalPages) return;
//     this.currentPage = p;
//     this.gridApi?.paginationGoToPage(p - 1);
//   }

//   onPageSizeChange(): void {
//     this.gridApi?.paginationSetPageSize(Number(this.pageSize));
//     this.currentPage = 1;
//     this.gridApi?.paginationGoToFirstPage();
//   }

//   togglePageSizeDropdown(): void {
//     this.pageSizeOpen = !this.pageSizeOpen;
//   }

//   changePageSize(size: number): void {
//     this.pageSize = size;
//     this.pageSizeOpen = false;
//     this.gridApi?.paginationSetPageSize(Number(this.pageSize));
//     this.currentPage = 1;
//     this.gridApi?.paginationGoToFirstPage();
//   }

//   onExport() {
//     const headers = [
//       'Roll ID',
//       'Stand',
//       'Type',
//       'Position',
//       'Cycle Weight (TON)',
//       'Cycle Length (KM)',
//       'Cumulative Weight (TON)',
//       'Cumulative Length (KM)',
//       'No. of Cycle',
//       'Supplier',
//       'Campaign Util.'
//     ];

//     const rows = this.rowData.map((row: RollRow) => [
//       row.rollId,
//       row.stand,
//       row.type,
//       row.position,
//       row.cycleWeight,
//       row.cycleLength,
//       row.cumulWeight,
//       row.cumulLength,
//       row.noOfCycle,
//       row.supplier,
//       row.progress
//     ]);

//     const csvContent = [headers, ...rows]
//       .map((r) => r.join(','))
//       .join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `roll-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
//     a.click();
//     window.URL.revokeObjectURL(url);
//   }
// }

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import type {
  ColDef,
  ColGroupDef,
  CellClickedEvent,
  GridApi,
  GridReadyEvent,
  ICellRendererParams
} from 'ag-grid-community';
import { RollService, RollRow, StandSection } from '../../../app/core/services/roll.service';

type TabKey = 'all' | 'fm' | 'dc' | 'eg' | 'rm';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AgGridAngular],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly router      = inject(Router);
  private readonly rollService = inject(RollService);

  gridApi?: GridApi<RollRow>;

  // ─── State ────────────────────────────────────────────────────────────────

  activeTab: TabKey = 'all';
  isLoading = false;
  error: string | null = null;
  apiTotalCount = 0;
  rowData: RollRow[] = [];

  autoRefresh = true;
  private refreshInterval: ReturnType<typeof setInterval> | undefined;
  lastUpdated = new Date();

  showRollModal = false;
  selectedRoll: RollRow | null = null;

  currentPage = 1;
  pageSize = 15;
  pageSizeOptions: number[] = [10, 15, 20, 25];
  pageSizeOpen = false;

  // ─── Tab → API section mapping ────────────────────────────────────────────

  private readonly sectionMap: Record<TabKey, StandSection> = {
    all: 'ALL',
    fm:  'FM',
    dc:  'DC',
    eg:  'EG',
    rm:  'RM'
  };

  tabs = [
    { id: 'all', label: 'All', count: 0, icon: 'grid_view' },
    { id: 'fm',  label: 'FM',  count: 0, icon: 'settings' },
    { id: 'dc',  label: 'DC',  count: 0, icon: 'construction' },
    { id: 'eg',  label: 'EG',  count: 0, icon: 'straighten' },
    { id: 'rm',  label: 'RM',  count: 0, icon: 'compress' }
  ];

  // ─── Pagination getters (server-side — driven by API count) ───────────────

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

  get pageNumbers(): number[] {
    const pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    return pages.filter(
      (p) => p === 1 || p === this.totalPages || Math.abs(p - this.currentPage) <= 1
    );
  }

  get filteredData(): RollRow[] {
    return this.rowData; // API already filters by section
  }

  onImgError(event: any): void {
    if (event?.target) {
      (event.target as HTMLElement).style.display = 'none';
    }
  }

  // ─── API Call ─────────────────────────────────────────────────────────────

  loadData(): void {
    this.isLoading = true;
    this.error = null;
    const section = this.sectionMap[this.activeTab];

    this.rollService.getRolls(section, this.currentPage, this.pageSize).subscribe({
      next: ({ count, rows }) => {
        this.apiTotalCount = count;
        this.rowData = rows;
        this.lastUpdated = new Date();

        // Update the count badge on the active tab
        this.tabs = this.tabs.map((t) =>
          t.id === this.activeTab ? { ...t, count } : t
        );

        this.gridApi?.setRowData(this.rowData);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('API error:', err);
        this.error = 'Failed to load data. Will retry on next refresh.';
        this.isLoading = false;
      }
    });
  }

  // ─── Progress Bar Cell Renderer ───────────────────────────────────────────

  progressBarRenderer = (params: any) => {
    const val = params.value || 0;
    const barColor = '#00D4FF';
    const glowColor = 'rgba(0,212,255,0.6)';

    const container = document.createElement('div');
    container.style.cssText = `
      display:flex;align-items:center;gap:8px;height:100%;
      padding:0 12px;width:100%;box-sizing:border-box;
    `;

    const pct = document.createElement('span');
    pct.style.cssText = `
      font-size:12px;font-weight:800;color:${barColor};
      min-width:36px;text-align:right;flex-shrink:0;
      font-family:Inter,sans-serif;text-shadow:0 0 8px ${glowColor};
    `;
    pct.textContent = `${val}%`;

    const track = document.createElement('div');
    track.style.cssText = `
      flex:1;height:8px;background:rgba(255,255,255,0.07);
      border-radius:8px;overflow:hidden;position:relative;
      box-shadow:inset 0 1px 3px rgba(0,0,0,0.4);
    `;

    const fill = document.createElement('div');
    fill.style.cssText = `
      height:100%;width:0%;
      background:linear-gradient(90deg,${barColor}88,${barColor});
      border-radius:8px;box-shadow:0 0 10px ${glowColor};
      transition:width 1.2s cubic-bezier(0.4,0,0.2,1);
      position:relative;overflow:hidden;
    `;

    const shimmer = document.createElement('div');
    shimmer.style.cssText = `
      position:absolute;top:0;left:-100%;width:100%;height:100%;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
      animation:barShimmer 2s linear infinite;
    `;

    fill.appendChild(shimmer);
    track.appendChild(fill);
    container.appendChild(pct);
    container.appendChild(track);
    setTimeout(() => { fill.style.width = `${val}%`; }, 150);

    return container;
  };

  // ─── Badge Color Maps ─────────────────────────────────────────────────────

  readonly standColors: Record<string, { bg: string; border: string; color: string }> = {
    R1:  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    R2:  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    E1:  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    E2:  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    F1:  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    F2:  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    F3:  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    F4:  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    F5:  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    F6:  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    F7:  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    F1e: { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    PR1: { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    PR2: { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    PR3: { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' }
  };

  readonly typeColors: Record<string, { bg: string; border: string; color: string }> = {
    'Work Roll':         { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    WR:                  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    'Backup Roll':       { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    BUR:                 { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    'Intermediate Roll': { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    IMR:                 { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    'Edger Roll':        { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    'Pinch Roll':        { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    'Vertical Roll':     { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' }
  };

  readonly positionColors: Record<string, { bg: string; border: string; color: string }> = {
    Top:             { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    TOP:             { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    Bottom:          { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    BOTTOM:          { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    Bot:             { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    'Drive Side':    { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
    'Operator Side': { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' }
  };

  createBadgeCell(
    value: string,
    colorMap: Record<string, { bg: string; border: string; color: string }>
  ): string {
    const defaultStyle = {
      bg: 'rgba(255,255,255,0.06)',
      border: 'rgba(255,255,255,0.1)',
      color: '#7B90B8'
    };
    const style = colorMap[value] || defaultStyle;
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

  // ─── Column Definitions ───────────────────────────────────────────────────

  columnDefs: Array<ColDef<RollRow> | ColGroupDef<RollRow>> = [
    {
      field: 'rollId',
      headerName: 'ROLL ID',
      width: 140,
      pinned: 'left',
      lockPinned: true,
      headerClass: 'center-header',
      cellClass: ['center-cell', 'cursor-pointer'],
      sortable: false,
      cellRenderer: (params: ICellRendererParams<RollRow, string>) =>
        `<span class="roll-id-link">${params.value ?? '-'}</span>`,
      onCellClicked: (params: CellClickedEvent<RollRow>) =>
        this.onRollIdClick(params.data as RollRow)
    },
    {
      field: 'stand',
      headerName: 'STAND',
      width: 100,
      headerClass: 'center-header',
      cellClass: 'center-cell',
      sortable: false,
      cellRenderer: (params: any) =>
        this.createBadgeCell(params.value, this.standColors)
    },
    {
      field: 'type',
      headerName: 'TYPE',
      width: 130,
      headerClass: 'center-header',
      cellClass: 'center-cell',
      sortable: false,
      cellRenderer: (params: any) =>
        this.createBadgeCell(params.value, this.typeColors)
    },
    {
      field: 'position',
      headerName: 'POSITION',
      width: 110,
      headerClass: 'center-header',
      cellClass: 'center-cell',
      sortable: false,
      cellRenderer: (params: any) =>
        this.createBadgeCell(params.value, this.positionColors)
    },
    {
      headerName: 'CYCLE',
      headerClass: 'center-header',
      headerGroupComponent: undefined,
      children: [
        {
          field: 'cycleWeight',
          headerName: 'WEIGHT (TON)',
          width: 140,
          headerClass: 'center-header',
          cellClass: 'center-cell',
          type: 'numericColumn',
          sortable: false,
          cellRenderer: (params: ICellRendererParams<RollRow, number>) =>
            `<span style="color:#00D4FF;font-weight:700;font-size:13px;">${params.value ?? '-'}</span>`
        },
        {
          field: 'cycleLength',
          headerName: 'LENGTH (KM)',
          width: 130,
          headerClass: 'center-header',
          cellClass: 'center-cell',
          type: 'numericColumn',
          sortable: false,
          cellRenderer: (params: ICellRendererParams<RollRow, number>) =>
            `<span style="color:#00D4FF;font-weight:600;font-size:13px;">${params.value ?? '-'}</span>`
        }
      ]
    },
    {
      headerName: 'CUMULATIVE',
      headerClass: 'center-header',
      children: [
        {
          field: 'cumulWeight',
          headerName: 'WEIGHT (TON)',
          width: 140,
          headerClass: 'center-header',
          cellClass: 'center-cell',
          type: 'numericColumn',
          sortable: false,
          cellRenderer: (params: ICellRendererParams<RollRow, number>) =>
            `<span style="color:#00D4FF;font-weight:700;font-size:13px;">${params.value ?? '-'}</span>`
        },
        {
          field: 'cumulLength',
          headerName: 'LENGTH (KM)',
          width: 130,
          headerClass: 'center-header',
          cellClass: 'center-cell',
          type: 'numericColumn',
          sortable: false,
          cellRenderer: (params: ICellRendererParams<RollRow, number>) =>
            `<span style="color:#00D4FF;font-weight:600;font-size:13px;">${params.value ?? '-'}</span>`
        }
      ]
    },
    {
      headerName: 'NO. OF CYCLE',
      field: 'noOfCycle',
      width: 120,
      headerClass: 'center-header',
      cellRenderer: (params: any) => {
        const val = params.value;
        if (!val && val !== 0) {
          return `<span style="color:#3D5175;font-size:13px">-</span>`;
        }
        return `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;">
            <span style="color:#00D4FF;font-weight:700;font-size:14px;">${val}</span>
          </div>`;
      },
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' }
    },
    {
      field: 'supplier',
      headerName: 'SUPPLIER',
      width: 120,
      headerClass: 'center-header',
      cellClass: 'center-cell',
      sortable: false,
      cellRenderer: (params: any) =>
        `<span style="color:#FFFFFF;font-weight:500;font-size:13px;">${params.value || '-'}</span>`
    },
    {
      field: 'progress',
      headerName: 'CAMPAIGN UTIL.',
      width: 180,
      minWidth: 180,
      pinned: 'right',
      lockPinned: true,
      headerClass: 'center-header',
      cellClass: 'center-cell',
      sortable: false,
      cellRenderer: this.progressBarRenderer,
      cellStyle: { padding: '0', overflow: 'visible' }
    }
  ];

  defaultColDef: ColDef = {
    sortable: false,
    unSortIcon: false,
    suppressHeaderMenuButton: true,
    resizable: true,
    suppressMovable: false,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  onGridReady(params: GridReadyEvent<RollRow>): void {
    this.gridApi = params.api;
    // Data will arrive via loadData() → gridApi.setRowData()
  }

  // ─── Tab Switching ────────────────────────────────────────────────────────

  setActiveTab(id: string): void {
    this.activeTab = id as TabKey;
    this.currentPage = 1;
    this.loadData();
  }

  // ─── Auto Refresh ─────────────────────────────────────────────────────────

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) this.startAutoRefresh();
    else this.stopAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    if (!this.autoRefresh) return;
    this.refreshInterval = setInterval(() => this.updateLiveData(), 5000);
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = undefined;
  }

  updateLiveData(): void {
    this.loadData(); // Real API refresh instead of random mutation
  }

  // ─── Modal ────────────────────────────────────────────────────────────────

  onRollIdClick(data: RollRow): void {
    this.selectedRoll = data;
    this.showRollModal = true;
  }

  navigateToRollDetails(): void {
    this.showRollModal = false;
    this.router.navigate(['/roll-details']);
  }

  // ─── Pagination ───────────────────────────────────────────────────────────

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.loadData();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadData();
  }

  togglePageSizeDropdown(): void {
    this.pageSizeOpen = !this.pageSizeOpen;
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.pageSizeOpen = false;
    this.currentPage = 1;
    this.loadData();
  }

  // ─── Export ───────────────────────────────────────────────────────────────

  onExport(): void {
    const headers = [
      'Roll ID', 'Stand', 'Type', 'Position',
      'Cycle Weight (TON)', 'Cycle Length (KM)',
      'Cumulative Weight (TON)', 'Cumulative Length (KM)',
      'No. of Cycle', 'Supplier', 'Campaign Util.'
    ];

    const rows = this.rowData.map((row: RollRow) => [
      row.rollId, row.stand, row.type, row.position,
      row.cycleWeight, row.cycleLength,
      row.cumulWeight, row.cumulLength,
      row.noOfCycle, row.supplier, row.progress
    ]);

    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roll-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}