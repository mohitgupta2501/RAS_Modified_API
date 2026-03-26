import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import type {
  ColDef,
  ColGroupDef,
  CellClickedEvent,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  ICellRendererParams
} from 'ag-grid-community';
import {
  RollCounts,
  RollService,
  RollRow,
  StandSection
} from '../../../app/core/services/roll.service';

type TabKey = 'all' | 'fm' | 'dc' | 'eg' | 'rm';

interface HomeTab {
  id: TabKey;
  label: string;
  count: number;
  icon: string;
}

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

  tabs: HomeTab[] = [
    { id: 'all', label: 'All', count: 0, icon: 'grid_view' },
    { id: 'rm',  label: 'RM',  count: 0, icon: 'compress' },
    { id: 'fm',  label: 'FM',  count: 0, icon: 'settings' },
    { id: 'eg',  label: 'EG',  count: 0, icon: 'straighten' },
    { id: 'dc',  label: 'DC',  count: 0, icon: 'construction' }
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
    return this.rowData;
  }

  readonly getRowId = (params: GetRowIdParams<RollRow>): string =>
    params.data.rollId;

  onImgError(event: any): void {
    if (event?.target) {
      (event.target as HTMLElement).style.display = 'none';
    }
  }

  // ─── API Call ─────────────────────────────────────────────────────────────

  loadData(options: { showLoading?: boolean; seamless?: boolean } = {}): void {
    const { showLoading = true, seamless = false } = options;

    if (showLoading) {
      this.isLoading = true;
    }
    this.error = null;
    const section = this.sectionMap[this.activeTab];

    this.rollService.getRolls(section, this.currentPage, this.pageSize).subscribe({
      next: ({ count, rows }) => {
        this.apiTotalCount = count;
        this.lastUpdated = new Date();
        this.syncGridData(rows, seamless);

        if (showLoading) {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('API error:', err);
        this.error = 'Failed to load data. Will retry on next refresh.';
        if (showLoading) {
          this.isLoading = false;
        }
      }
    });
  }

  private syncGridData(rows: RollRow[], seamless: boolean): void {
    const previousRows = this.rowData;
    this.rowData = rows;

    if (!this.gridApi) {
      return;
    }

    if (!seamless || previousRows.length === 0) {
      this.gridApi.setRowData(rows);
      return;
    }

    const previousById = new Map(previousRows.map((row) => [row.rollId, row]));
    const nextById = new Map(rows.map((row) => [row.rollId, row]));

    const remove = previousRows.filter((row) => !nextById.has(row.rollId));
    const add = rows.filter((row) => !previousById.has(row.rollId));
    const update = rows.filter((row) => {
      const previous = previousById.get(row.rollId);
      return previous !== undefined && previous !== row;
    });

    this.gridApi.applyTransactionAsync({ remove, update, add });
  }

  private loadTabCounts(): void {
    this.rollService.getRollCounts().subscribe({
      next: (rollCounts) => {
        this.updateTabCounts(rollCounts);
      },
      error: (err) => {
        console.error('Roll counts API error:', err);
      }
    });
  }

  private updateTabCounts(rollCounts: RollCounts): void {
    this.tabs = this.tabs.map((tab) => ({
      ...tab,
      count: rollCounts[this.sectionMap[tab.id]] ?? 0
    }));
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
    BOT:             { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)', color: '#A78BFA' },
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
  // Scrollable cols total = 100+130+110+140+130+140+130+120+150 = 1150px
  // Pinned left (Roll ID) = 140px | Pinned right (Campaign Util.) = 200px
  // Grand total = 1490px

  columnDefs: Array<ColDef<RollRow> | ColGroupDef<RollRow>> = [
    {
      field: 'rollId',
      headerName: 'ROLL ID',
      width: 140,
      //minWidth:  140,
      //maxWidth:  140,
      pinned: 'left',
      lockPinned: true,
      //suppressSizeToFit: true,   // ← prevents this column from being resized to fit
      headerClass: 'center-header',
      cellClass: ['center-cell', 'cursor-pointer'],
      sortable: false,
      cellRenderer: (params: ICellRendererParams<RollRow, string>) =>
        `<span class="roll-id-link">${params.value ?? '-'}</span>`,
      onCellClicked: (params: CellClickedEvent<RollRow>) =>
        this.onRollIdClick(params.data as RollRow)
    },
    {
      field: 'progress',
      headerName: 'CAMPAIGN UTIL.',
      width: 200,
      //minWidth:  200,
      //maxWidth:  200,
      pinned: 'right',
      lockPinned: true,
      //suppressSizeToFit: true,
      headerClass: 'center-header',
      cellClass: 'center-cell',
      sortable: false,
      cellRenderer: this.progressBarRenderer,
      cellStyle: { padding: '0', overflow: 'visible' }
    },
    {
      field: 'stand',
      headerName: 'STAND',
      width: 100,
      //minWidth:  100,
      //maxWidth:  100,
      //suppressSizeToFit: true,
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
      //minWidth:  130,
      //maxWidth:  130,
      //suppressSizeToFit: true,
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
      //minWidth:  110,
      //maxWidth:  110,
      //suppressSizeToFit: true,
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
          //minWidth:  140,
          //maxWidth:  140,
          //suppressSizeToFit: true,
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
          //minWidth:  130,
          //maxWidth:  130,
          //suppressSizeToFit: true,
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
          //minWidth:  140,
          //maxWidth:  140,
          //suppressSizeToFit: true,
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
          //minWidth:  130,
          //maxWidth:  130,
          //suppressSizeToFit: true,
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
      //minWidth:  120,
      //maxWidth:  120,
      //suppressSizeToFit: true,
      headerClass: 'center-header',
      sortable: false,
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
      width: 150,
      //minWidth:  150,
      //maxWidth:  150,
      //suppressSizeToFit: true,
      headerClass: 'center-header',
      cellClass: 'center-cell',
      sortable: false,
      cellRenderer: (params: any) =>
        `<span style="color:#FFFFFF;font-weight:500;font-size:13px;">${params.value || '-'}</span>`
    }
  ];

  // ─── Default Col Def ──────────────────────────────────────────────────────
  // IMPORTANT: Do NOT set flex here — it overrides width/minWidth/maxWidth
  // and causes AG Grid to stretch all columns to fill available space.
  // Each column has explicit width + //suppressSizeToFit to lock its size.
  defaultColDef: ColDef = {
    sortable: false,
    unSortIcon: false,
    suppressHeaderMenuButton: true,
    resizable: false,
    suppressMovable: true,
    // NO flex property here — flex would override column widths
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  private resizeListener = () => {};

  ngOnInit(): void {
    this.loadData();
    this.loadTabCounts();
    this.startAutoRefresh();
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    window.removeEventListener('resize', this.resizeListener);
  }

  // ─── Grid Ready ───────────────────────────────────────────────────────────
  // CRITICAL: Do NOT call sizeColumnsToFit() — it stretches columns to fill
  // the grid width and destroys the fixed-width layout needed for pinning + scroll.
  onGridReady(params: GridReadyEvent<RollRow>): void {
    this.gridApi = params.api;
    // Let AG Grid use the explicit width/minWidth/maxWidth from columnDefs.
    // Do NOT call params.api.sizeColumnsToFit() here.
  }

  // ─── Tab Switching ────────────────────────────────────────────────────────

  setActiveTab(id: string): void {
    this.activeTab = id as TabKey;
    this.currentPage = 1;
    this.loadData();
    this.loadTabCounts();
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
    this.loadData({ showLoading: false, seamless: true });
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