import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AgGridAngular } from "ag-grid-angular";
import { ColDef, ColGroupDef, ICellRendererParams } from "ag-grid-community";
import {
  SupplierAnalysisService,
  SupplierPerformanceItem,
  SupplierThinGaugeItem,
} from "../../../app/core/services/performance-analysis.service";

// ── Local view-model interfaces ──────────────────────────────────────────────

interface SupplierPerformanceRow {
  supplier: string;
  avgRolledLength: number;
  avgRolledTonage: number;
  avgUtilization: number;
  avgHourlyTonage: number;
  totalBreakdown: number;
  avgPurchaseCost: number;
  avgCycles: number;
  avgLeadTime: number;
  avgCostPerKm: number;
  rating: number;
}

interface FitnessRow {
  supplier: string;
  hc: number;
  mc: number;
  lc: number;
  thin: number;
  rg: number;
  country: string;
  rolls: number;
}

interface ThicknessRow {
  supplier: string;
  cycle1count: number;
  cycle2count: number;
  cycle3count: number;
  cycle1rating: number;
  cycle2rating: number;
  cycle3rating: number;
  country: string;
  rolls: number;
}

@Component({
  selector: "app-performance-analysis",
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: "./performance-analysis.component.html",
  styleUrl: "./performance-analysis.component.scss",
})
export class PerformanceAnalysisComponent implements OnInit {

  // ── Filter options ────────────────────────────────────────────────────────
  standOptions = ["R1", "R2", "F1-F4", "F5-F7", "Edger", "Pinch"];
  rollTypeOptions: string[] = ["WR", "BUR"];
  selectedStand = "F1-F4";
  selectedRollType = "WR";
  openDropdown: string | null = null;

  // ── Loading / error state ─────────────────────────────────────────────────
  isPerfLoading = false;
  isFitnessLoading = false;
  isThinkerLoading = false;
  errorMessage: string | null = null;

  // ── Table data (populated from API) ──────────────────────────────────────
  rowData: SupplierPerformanceRow[] = [];
  matrixRowData: FitnessRow[] = [];
  matrixThicknessRowData: ThicknessRow[] = [];

  // ── Supplier Performance pagination ──────────────────────────────────────
  saPerfCurrentPage = 1;
  saPerfPageSize = 10;
  saPerfTotalRows = 0;   // driven by API count

  get saPerfTotalPages(): number { return Math.max(1, Math.ceil(this.saPerfTotalRows / this.saPerfPageSize)); }
  get saPerfStartRow(): number { if (this.saPerfTotalRows === 0) return 0; return (this.saPerfCurrentPage - 1) * this.saPerfPageSize + 1; }
  get saPerfEndRow(): number { return Math.min(this.saPerfCurrentPage * this.saPerfPageSize, this.saPerfTotalRows); }
  get saPerfWindowPages(): number[] { return this._windowPages(this.saPerfTotalPages, this.saPerfCurrentPage); }
  get saPerfPaginatedData(): SupplierPerformanceRow[] { return this.rowData; } // API already returns current page

  saPerfGoToPage(page: number): void {
    if (page < 1 || page > this.saPerfTotalPages) return;
    this.saPerfCurrentPage = page;
    this.loadPerformanceData();
  }
  saPerfChangePageSize(size: number): void {
    this.saPerfPageSize = Number(size);
    this.saPerfCurrentPage = 1;
    this.loadPerformanceData();
  }
  saPerfOnExport(): void { this.onExportSupplierPerf(); }

  // ── Fitness Matrix pagination ─────────────────────────────────────────────
  saFitnessCurrentPage = 1;
  saFitnessPageSize = 10;
  saFitnessTotalRows = 0;  // driven by API count

  get saFitnessTotalPages(): number { return Math.max(1, Math.ceil(this.saFitnessTotalRows / this.saFitnessPageSize)); }
  get saFitnessStartRow(): number { if (this.saFitnessTotalRows === 0) return 0; return (this.saFitnessCurrentPage - 1) * this.saFitnessPageSize + 1; }
  get saFitnessEndRow(): number { return Math.min(this.saFitnessCurrentPage * this.saFitnessPageSize, this.saFitnessTotalRows); }
  get saFitnessWindowPages(): number[] { return this._windowPages(this.saFitnessTotalPages, this.saFitnessCurrentPage); }
  get saFitnessPaginatedData(): FitnessRow[] { return this.matrixRowData; } // API already returns current page

  saFitnessGoToPage(page: number): void {
    if (page < 1 || page > this.saFitnessTotalPages) return;
    this.saFitnessCurrentPage = page;
    this.loadFitnessData();
  }
  saFitnessChangePageSize(size: number): void {
    this.saFitnessPageSize = Number(size);
    this.saFitnessCurrentPage = 1;
    this.loadFitnessData();
  }
  saFitnessOnExport(): void { this.onExportFitnessMatrix(); }

  // ── Thin Gauge Matrix pagination ──────────────────────────────────────────
  saThinkerCurrentPage = 1;
  saThinkerPageSize = 10;
  saThinkerTotalRows = 0;  // driven by API count

  get saThinkerTotalPages(): number { return Math.max(1, Math.ceil(this.saThinkerTotalRows / this.saThinkerPageSize)); }
  get saThinkerStartRow(): number { if (this.saThinkerTotalRows === 0) return 0; return (this.saThinkerCurrentPage - 1) * this.saThinkerPageSize + 1; }
  get saThinkerEndRow(): number { return Math.min(this.saThinkerCurrentPage * this.saThinkerPageSize, this.saThinkerTotalRows); }
  get saThinkerWindowPages(): number[] { return this._windowPages(this.saThinkerTotalPages, this.saThinkerCurrentPage); }
  get saThinkerPaginatedData(): ThicknessRow[] { return this.matrixThicknessRowData; } // API already returns current page

  saThinkerGoToPage(page: number): void {
    if (page < 1 || page > this.saThinkerTotalPages) return;
    this.saThinkerCurrentPage = page;
    this.loadThinGaugeData();
  }
  saThinkerChangePageSize(size: number): void {
    this.saThinkerPageSize = Number(size);
    this.saThinkerCurrentPage = 1;
    this.loadThinGaugeData();
  }
  saThinkerOnExport(): void { this.onExportThinkerMatrix(); }

  // ── Legacy pagination vars (kept for template backward compat) ────────────
  get supplierPerfTotalRows(): number { return this.saPerfTotalRows; }
  supplierPerfCurrentPage = 1;
  supplierPerfPageSize = 10;
  get supplierPerfTotalPages(): number { return this.saPerfTotalPages; }
  get supplierPerfPaginatedData(): any[] { return this.rowData; }
  supplierPerfGoToPage(page: number): void { this.saPerfGoToPage(page); }
  supplierPerfGetPageNumbers(): number[] { return this._pageNumbers(this.saPerfTotalPages, this.saPerfCurrentPage); }

  fitnessMatrixCurrentPage = 1;
  fitnessMatrixPageSize = 10;
  get fitnessMatrixTotalRows(): number { return this.saFitnessTotalRows; }
  get fitnessMatrixTotalPages(): number { return this.saFitnessTotalPages; }
  get fitnessMatrixPaginatedData(): any[] { return this.matrixRowData; }
  fitnessMatrixGoToPage(page: number): void { this.saFitnessGoToPage(page); }
  fitnessMatrixGetPageNumbers(): number[] { return this._pageNumbers(this.saFitnessTotalPages, this.saFitnessCurrentPage); }

  thinkerMatrixCurrentPage = 1;
  thinkerMatrixPageSize = 10;
  get thinkerMatrixTotalRows(): number { return this.saThinkerTotalRows; }
  get thinkerMatrixTotalPages(): number { return this.saThinkerTotalPages; }
  get thinkerMatrixPaginatedData(): any[] { return this.matrixThicknessRowData; }
  thinkerMatrixGoToPage(page: number): void { this.saThinkerGoToPage(page); }
  thinkerMatrixGetPageNumbers(): number[] { return this._pageNumbers(this.saThinkerTotalPages, this.saThinkerCurrentPage); }

  // ── AG Grid column definitions ────────────────────────────────────────────
  columnDefs: ColDef[] = [];

  readonly defaultColDef: ColDef = {
    resizable: false,
    sortable: false,
    suppressMovable: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    headerClass: "perf-white-header",
    cellStyle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "13px",
      color: "#E8F0FE",
      fontWeight: "500",
      padding: "0 8px",
    },
  };

  matrixDefaultColDef: ColDef = {
    resizable: false,
    sortable: false,
    suppressMovable: true,
  };

  fitnessColDefs: ColDef[] = [];
  thinkerColDefs: Array<ColDef<ThicknessRow> | ColGroupDef<ThicknessRow>> = [];

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor(private supplierService: SupplierAnalysisService) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    document.addEventListener("click", () => { this.openDropdown = null; });
    this.buildColumnDefs();
    this.buildMatrixColDefs();
    this.buildMatrixColDefs2();
    this.loadAllData();
  }

  // ── Common query params builder ───────────────────────────────────────────
  private baseParams() {
    return {
      roll_type: this.selectedRollType,
      stand_category: this.selectedStand,
    };
  }

  // ── Load all 3 tables (used on filter change) ─────────────────────────────
  loadAllData(): void {
    // Reset pages when filter changes
    this.saPerfCurrentPage = 1;
    this.saFitnessCurrentPage = 1;
    this.saThinkerCurrentPage = 1;
    // Performance and Fitness both use /supplier1 — load once, populate both tables
    this.loadPerformanceData();
    this.loadThinGaugeData();
  }

  // ── Individual table loaders ──────────────────────────────────────────────

  loadPerformanceData(): void {
    this.isPerfLoading = true;
    this.isFitnessLoading = true;
    this.supplierService.getSupplierPerformance({
      ...this.baseParams(),
      page: this.saPerfCurrentPage,
      page_size: this.saPerfPageSize,
    }).subscribe({
      next: (res) => {
        // Supplier Performance table
        this.rowData = res.results.map(this.mapToPerformanceRow);
        this.saPerfTotalRows = res.count;
        this.isPerfLoading = false;
        // Fitness Matrix reuses the same /supplier1 response — no second API call
        this.matrixRowData = res.results.map(this.mapToFitnessRow);
        this.saFitnessTotalRows = res.count;
        this.isFitnessLoading = false;
      },
      error: (err) => {
        console.error('Performance API error:', err);
        this.errorMessage = 'Failed to load supplier performance data.';
        this.isPerfLoading = false;
        this.isFitnessLoading = false;
      },
    });
  }

  loadFitnessData(): void {
    // Fitness matrix uses /supplier1 — same endpoint as performance
    this.isFitnessLoading = true;
    this.supplierService.getFitnessMatrix({
      ...this.baseParams(),
      page: this.saFitnessCurrentPage,
      page_size: this.saFitnessPageSize,
    }).subscribe({
      next: (res) => {
        this.matrixRowData = res.results.map(this.mapToFitnessRow);
        this.saFitnessTotalRows = res.count;
        this.isFitnessLoading = false;
      },
      error: (err) => {
        console.error('Fitness matrix API error:', err);
        this.errorMessage = 'Failed to load fitness matrix data.';
        this.isFitnessLoading = false;
      },
    });
  }

  loadThinGaugeData(): void {
    this.isThinkerLoading = true;
    this.supplierService.getThinGaugeMatrix({
      ...this.baseParams(),
      page: this.saThinkerCurrentPage,
      page_size: this.saThinkerPageSize,
    }).subscribe({
      next: (res) => {
        this.matrixThicknessRowData = res.results.map(this.mapToThicknessRow);
        this.saThinkerTotalRows = res.count;
        this.isThinkerLoading = false;
      },
      error: (err) => {
        console.error('Thin gauge API error:', err);
        this.errorMessage = 'Failed to load thin gauge matrix data.';
        this.isThinkerLoading = false;
      },
    });
  }

  // ── Response mappers ──────────────────────────────────────────────────────

  private mapToPerformanceRow = (item: SupplierPerformanceItem): SupplierPerformanceRow => {
    // /api/supplier1 returns pre-computed averages directly — map flat fields
    return {
      supplier:        item.supplier,
      avgRolledLength: item.avg_rolled_length,
      avgRolledTonage: item.avg_rolled_tonnage,
      avgUtilization:  item.avg_utilization,
      avgHourlyTonage: 0,               // not in API
      totalBreakdown:  item.total_breakdown,
      avgPurchaseCost: item.avg_purchase_cost,
      avgCycles:       item.avg_cycles,
      avgLeadTime:     item.avg_lead_time,
      avgCostPerKm:    item.avg_cost_per_km,
      rating:          item.rating,
    };
  };

  private mapToFitnessRow = (item: SupplierPerformanceItem): FitnessRow => {
    // /api/supplier1 has no cycle_data or country/rolls — use rating for all grades
    // Update hc/mc/lc fields once a dedicated fitness endpoint is available
    return {
      supplier: item.supplier,
      hc:       item.rating,
      mc:       item.rating,
      lc:       item.rating,
      thin:     item.rating,
      rg:       item.rating,
      country:  '',
      rolls:    0,
    };
  };

  private mapToThicknessRow = (item: SupplierThinGaugeItem): ThicknessRow => {
    const cycles = item.cycle_data ?? [];
    return {
      supplier:     item.supplier,
      cycle1count:  cycles[0]?.cycle_coil ?? 0,
      cycle2count:  cycles[1]?.cycle_coil ?? 0,
      cycle3count:  cycles[2]?.cycle_coil ?? 0,
      cycle1rating: +(cycles[0]?.rating ?? 0).toFixed(2),
      cycle2rating: +(cycles[1]?.rating ?? 0).toFixed(2),
      cycle3rating: +(cycles[2]?.rating ?? 0).toFixed(2),
      country:      item.country,
      rolls:        item.rolls,
    };
  };

  // ── Dropdown handlers ─────────────────────────────────────────────────────

  toggleDropdown(name: string, event: Event): void {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  selectStand(value: string): void {
    this.selectedStand = value;
    this.openDropdown = null;
    if (value === 'R1') {
      this.rollTypeOptions = ['WR'];
      this.selectedRollType = 'WR';
    } else if (['R2', 'F1-F4', 'F5-F7'].includes(value)) {
      this.rollTypeOptions = ['WR', 'BUR'];
      this.selectedRollType = 'WR';
    } else if (['Edger', 'Pinch'].includes(value)) {
      this.rollTypeOptions = ['-'];
      this.selectedRollType = '-';
    }
    this.loadAllData();
  }

  selectRollType(value: string): void {
    this.selectedRollType = value;
    this.openDropdown = null;
    this.loadAllData();
  }

  // ── Export helpers ────────────────────────────────────────────────────────

  onExportSupplierPerf(): void {
    const fields = (this.columnDefs || []).map((c: any) => c.field).filter(Boolean);
    const headers = fields.length ? fields : Object.keys(this.rowData[0] || {});
    const rows = this.rowData.map((r: any) => headers.map((h: string) => r[h] ?? ''));
    this.downloadCsv([headers, ...rows], `supplier-performance-${this.today()}.csv`);
  }

  onExportFitnessMatrix(): void {
    const fields = (this.fitnessColDefs || []).map((c: any) => c.field).filter(Boolean);
    const headers = fields.length ? fields : Object.keys(this.matrixRowData[0] || {});
    const rows = this.matrixRowData.map((r: any) => headers.map((h: string) => r[h] ?? ''));
    this.downloadCsv([headers, ...rows], `fitness-matrix-${this.today()}.csv`);
  }

  onExportThinkerMatrix(): void {
    const fields = (this.thinkerColDefs || []).map((c: any) => c.field).filter(Boolean);
    const headers = fields.length ? fields : Object.keys(this.matrixThicknessRowData[0] || {});
    const rows = this.matrixThicknessRowData.map((r: any) => headers.map((h: string) => r[h] ?? ''));
    this.downloadCsv([headers, ...rows], `thinker-matrix-${this.today()}.csv`);
  }

  private downloadCsv(data: any[][], filename: string): void {
    const csv = data.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private today(): string { return new Date().toISOString().slice(0, 10); }

  // ── Pagination helpers ────────────────────────────────────────────────────

  private _windowPages(total: number, current: number): number[] {
    if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 2) return [1, 2, 3];
    if (current >= total - 1) return [total - 2, total - 1, total];
    return [current - 1, current, current + 1];
  }

  private _pageNumbers(total: number, current: number): number[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | string)[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages as number[];
  }

  // ── Cell renderers ────────────────────────────────────────────────────────

  getCellRenderer(field: string) {
    return (params: any) => {
      const colData = this.rowData.map((r: any) => r[field]);
      const max = Math.max(...colData);
      const min = Math.min(...colData);
      const val = params.value;
      const invertFields = ['totalBreakdown', 'avgPurchaseCost', 'avgCostPerKm', 'avgLeadTime'];
      let color: string;
      if (invertFields.includes(field)) {
        color = val === min ? '#00E5A0' : val === max ? '#FF4560' : '#FF8C42';
      } else {
        color = val === max ? '#00E5A0' : val === min ? '#FF4560' : '#FF8C42';
      }
      return `<span style="color:${color};font-weight:600;font-size:13px">${val}</span>`;
    };
  }

  tileCellRenderer = (params: any) => {
    const val = params.value;
    let label: string, bg: string, border: string, color: string;
    if (val >= 80)      { label = 'Best'; bg = 'rgba(0,80,45,0.6)';    border = 'rgba(0,229,160,0.4)';  color = '#00E5A0'; }
    else if (val >= 65) { label = 'Good'; bg = 'rgba(15,45,105,0.65)'; border = 'rgba(96,165,250,0.4)'; color = '#60A5FA'; }
    else if (val >= 50) { label = 'Fair'; bg = 'rgba(95,55,5,0.65)';   border = 'rgba(255,140,66,0.4)'; color = '#FF8C42'; }
    else                { label = 'Poor'; bg = 'rgba(95,15,25,0.65)';  border = 'rgba(255,69,96,0.4)';  color = '#FF4560'; }
    return `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%">
      <div style="width:72px;height:54px;background:${bg};border:1px solid ${border};border-radius:10px;
                  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
        <span style="color:${color};font-size:16px;font-weight:800;line-height:1">${val}</span>
        <span style="color:${color};font-size:10px;font-weight:600;line-height:1">${label}</span>
      </div>
    </div>`;
  };

  tileCellRenderer2 = (params: ICellRendererParams<ThicknessRow, number>) => {
    const val = params.value!;
    let label: string, bg: string, border: string, color: string;
    if (val >= 80)      { label = 'Best'; bg = 'rgba(0,80,45,0.6)';    border = 'rgba(0,229,160,0.4)';  color = '#00E5A0'; }
    else if (val >= 65) { label = 'Good'; bg = 'rgba(15,45,105,0.65)'; border = 'rgba(96,165,250,0.4)'; color = '#60A5FA'; }
    else if (val >= 50) { label = 'Fair'; bg = 'rgba(95,55,5,0.65)';   border = 'rgba(255,140,66,0.4)'; color = '#FF8C42'; }
    else                { label = 'Poor'; bg = 'rgba(95,15,25,0.65)';  border = 'rgba(255,69,96,0.4)';  color = '#FF4560'; }
    return `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%">
      <div style="width:72px;height:54px;background:${bg};border:1px solid ${border};border-radius:10px;
                  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
        <span style="color:${color};font-size:16px;font-weight:800;line-height:1">${val}</span>
        <span style="color:${color};font-size:10px;font-weight:600;line-height:1">${label}</span>
      </div>
    </div>`;
  };

  gradeHeaderRenderer = (params: any) => {
    const subtitles: { [key: string]: string } = {
      HC: 'High Carbon', MC: 'Standard', LC: 'Soft steel',
      THIN: 'Precision required', RG: 'Heavy products',
    };
    return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;">
      <span style="color:#E8F0FE;font-size:13px;font-weight:700;line-height:1.2">${params.displayName}</span>
      <span style="color:#3D5175;font-size:10px;font-weight:600;margin-top:4px;line-height:1">${subtitles[params.displayName] || ''}</span>
    </div>`;
  };

  // ── Column definition builders ────────────────────────────────────────────

  buildColumnDefs(): void {
    this.columnDefs = [
      {
        headerName: 'SUPPLIER', field: 'supplier', pinned: 'left', width: 140,
        headerClass: 'perf-white-header',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start', color: '#FFFFFF', fontWeight: '700', fontSize: '13px', padding: '0 16px' },
      },
      { headerName: 'AVG ROLLED LENGTH (KM)',  field: 'avgRolledLength', flex: 1, headerClass: 'perf-white-header', cellRenderer: this.getCellRenderer('avgRolledLength') },
      { headerName: 'AVG ROLLED TONAGE (TON)', field: 'avgRolledTonage', flex: 1, headerClass: 'perf-white-header', cellRenderer: this.getCellRenderer('avgRolledTonage') },
      { headerName: 'AVG UTILIZATION (%)',     field: 'avgUtilization',  flex: 1, headerClass: 'perf-white-header', cellRenderer: this.getCellRenderer('avgUtilization') },
      { headerName: 'TOTAL BREAKDOWN',         field: 'totalBreakdown',  flex: 1, headerClass: 'perf-white-header', cellRenderer: this.getCellRenderer('totalBreakdown') },
      { headerName: 'AVG PURCHASE COST (MINR)',field: 'avgPurchaseCost', flex: 1, headerClass: 'perf-white-header', cellRenderer: this.getCellRenderer('avgPurchaseCost') },
      { headerName: 'AVG CYCLES',              field: 'avgCycles',       flex: 1, headerClass: 'perf-white-header', cellRenderer: this.getCellRenderer('avgCycles') },
      { headerName: 'AVG LEAD TIME (MO)',      field: 'avgLeadTime',     flex: 1, headerClass: 'perf-white-header', cellRenderer: this.getCellRenderer('avgLeadTime') },
      { headerName: 'AVG COST PER KM',         field: 'avgCostPerKm',    flex: 1, headerClass: 'perf-white-header', cellRenderer: this.getCellRenderer('avgCostPerKm') },
      {
        headerName: 'RATING (/10)', field: 'rating', flex: 1.5, pinned: 'right', lockPinned: true,
        headerClass: 'perf-white-header',
        cellRenderer: (params: any) => {
          const val = params.value;
          const stars = Math.round((val / 100) * 10);   // rating 0-100 → 0-5 stars
          const clampedStars = Math.min(10, Math.max(0, stars));
          return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:2px">
            <span style="color:#FF8C42;font-weight:700;font-size:13px">${val}</span>
            <span style="color:#FF8C42;font-size:11px;letter-spacing:1px">${'★'.repeat(clampedStars)}${'☆'.repeat(10 - clampedStars)}</span>
          </div>`;
        },
      },
    ];
  }

  buildMatrixColDefs(): void {
    const gradeCol = (headerName: string, field: string): ColDef => ({
      headerName, field, flex: 1,
      width: headerName === 'THIN' ? 140 : 120,
      headerComponent: 'agColumnHeader',
      headerComponentParams: {
        template: `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;padding:8px 0;">
          <span style="color:#E8F0FE;font-size:13px;font-weight:700;line-height:1.2">${headerName}</span>
          <span style="color:#3D5175;font-size:10px;font-weight:600;margin-top:4px;">
            ${{ HC: 'High Carbon', MC: 'Standard', LC: 'Soft steel', THIN: 'Precision required', RG: 'Heavy products' }[headerName]}
          </span>
        </div>`,
      },
      cellRenderer: this.tileCellRenderer,
      cellStyle: { padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    });

    this.fitnessColDefs = [
      {
        headerName: 'SUPPLIER', field: 'supplier', pinned: 'left', width: 210,
        headerClass: 'perf-matrix-left-header',
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 20px', color: '#E8F0FE', fontWeight: '700', fontSize: '14px' },
      },
      gradeCol('HC', 'hc'),
      gradeCol('MC', 'mc'),
      gradeCol('LC', 'lc'),
      {
        headerName: 'COUNTRY', field: 'country', width: 140, headerClass: 'perf-matrix-center-header',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7B90B8', fontSize: '13px' },
      },
      {
        headerName: 'ROLLS', field: 'rolls', width: 90, headerClass: 'perf-matrix-center-header',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8F0FE', fontWeight: '700', fontSize: '15px' },
      },
    ];
  }

  buildMatrixColDefs2(): void {
    const countRenderer = (params: ICellRendererParams<ThicknessRow, number>) =>
      `<span style="color:#00D4FF;font-weight:700;font-size:13px;">${params.value ?? ''}</span>`;

    this.thinkerColDefs = [
      {
        headerName: 'SUPPLIER', field: 'supplier', pinned: 'left', width: 210,
        headerClass: 'perf-matrix-left-header',
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 20px', color: '#E8F0FE', fontWeight: '700', fontSize: '14px' },
      },
      {
        headerName: 'CYCLE 1', headerClass: 'cycle-group-header',
        children: [
          { field: 'cycle1count', headerName: 'COUNT', flex: 1, width: 140, headerClass: 'perf-matrix-center-header', cellClass: 'center-cell', type: 'numericColumn', sortable: false, cellRenderer: countRenderer },
          { field: 'cycle1rating', headerName: 'RATING', flex: 1, width: 130, headerClass: 'perf-matrix-center-header', cellClass: 'center-cell', type: 'numericColumn', sortable: false, cellRenderer: this.tileCellRenderer2 },
        ],
      },
      {
        headerName: 'CYCLE 2', headerClass: 'cycle-group-header',
        children: [
          { field: 'cycle2count', headerName: 'COUNT', flex: 1, width: 140, headerClass: 'perf-matrix-center-header', cellClass: 'center-cell', type: 'numericColumn', sortable: false, cellRenderer: countRenderer },
          { field: 'cycle2rating', headerName: 'RATING', flex: 1, width: 130, headerClass: 'perf-matrix-center-header', cellClass: 'center-cell', type: 'numericColumn', sortable: false, cellRenderer: this.tileCellRenderer2 },
        ],
      },
      {
        headerName: 'CYCLE 3', headerClass: 'cycle-group-header',
        children: [
          { field: 'cycle3count', headerName: 'COUNT', flex: 1, width: 140, headerClass: 'perf-matrix-center-header', cellClass: 'center-cell', type: 'numericColumn', sortable: false, cellRenderer: countRenderer },
          { field: 'cycle3rating', headerName: 'RATING', flex: 1, width: 130, headerClass: 'perf-matrix-center-header', cellClass: 'center-cell', type: 'numericColumn', sortable: false, cellRenderer: this.tileCellRenderer2 },
        ],
      },
      {
        headerName: 'COUNTRY', field: 'country', width: 140, headerClass: 'perf-matrix-center-header',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7B90B8', fontSize: '13px' },
      },
      {
        headerName: 'ROLLS', field: 'rolls', width: 90, headerClass: 'perf-matrix-center-header',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8F0FE', fontWeight: '700', fontSize: '15px' },
      },
    ];
  }
}