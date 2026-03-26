
import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import type { CellStyle, ColDef, ColGroupDef, GridOptions } from 'ag-grid-community';
import { forkJoin } from 'rxjs';
import {
  AdvanceAnalysisService,
  WearApiResponse,
  CostApiResponse,
  RollListResponse
} from '../../../app/core/services/advance-analysis.service';

// ─── Component-level row interfaces ──────────────────────────────────────────


interface WearRow {
  cycle: string;
  diaBefore: number;
  diaAfter: number;
  tonnageActual: number;
  tonnagePredicted: number;
  predictedWear: number;
}

interface CostRow {
  cycle: string;
  procurementCost: number;
  indirectCost: string;
  maintCost: string;
  disposalCost: number;
  totalCycle: string;
}

@Component({
  selector: 'app-advance-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './advance-analysis.component.html',
  styleUrl: './advance-analysis.component.scss'
})
export class AdvanceAnalysisComponent implements OnInit {

  // ─── Dropdown state ───────────────────────────────────────────────────────
  openDropdown: string | null = null;

  // ─── Grid Pagination ──────────────────────────────────────────────────────
  wearGridCurrentPage = 1;
  wearGridPageSize = 10;
  wearGridTotalRows = 0;

  costGridCurrentPage = 1;
  costGridPageSize = 10;
  costGridTotalRows = 0;

  // ─── Home-style pagination (prefix: aa) ───────────────────────────────────

  aaWearCurrentPage = 1;
  aaWearPageSize = 10;

  get aaWearTotalRows(): number {
    return this.wearRowData.length;
  }
  get aaWearTotalPages(): number {
    return Math.max(1, Math.ceil(this.aaWearTotalRows / this.aaWearPageSize));
  }
  get aaWearStartRow(): number {
    if (this.aaWearTotalRows === 0) return 0;
    return (this.aaWearCurrentPage - 1) * this.aaWearPageSize + 1;
  }
  get aaWearEndRow(): number {
    return Math.min(this.aaWearCurrentPage * this.aaWearPageSize, this.aaWearTotalRows);
  }
  get aaWearWindowPages(): number[] {
    const total = this.aaWearTotalPages;
    const current = this.aaWearCurrentPage;
    if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 2) return [1, 2, 3];
    if (current >= total - 1) return [total - 2, total - 1, total];
    return [current - 1, current, current + 1];
  }
  get aaWearPaginatedData(): WearRow[] {
    const start = (this.aaWearCurrentPage - 1) * this.aaWearPageSize;
    return this.wearRowData.slice(start, start + this.aaWearPageSize);
  }
  aaWearGoToPage(page: number): void {
    if (page < 1 || page > this.aaWearTotalPages) return;
    this.aaWearCurrentPage = page;
  }
  aaWearChangePageSize(size: number): void {
    this.aaWearPageSize = Number(size);
    this.aaWearCurrentPage = 1;
  }
  aaWearOnExport(): void {
    this.onExportWearGrid();
  }

  aaCostCurrentPage = 1;
  aaCostPageSize = 10;

  get aaCostTotalRows(): number {
    return this.costRowData.length;
  }
  get aaCostTotalPages(): number {
    return Math.max(1, Math.ceil(this.aaCostTotalRows / this.aaCostPageSize));
  }
  get aaCostStartRow(): number {
    if (this.aaCostTotalRows === 0) return 0;
    return (this.aaCostCurrentPage - 1) * this.aaCostPageSize + 1;
  }
  get aaCostEndRow(): number {
    return Math.min(this.aaCostCurrentPage * this.aaCostPageSize, this.aaCostTotalRows);
  }
  get aaCostWindowPages(): number[] {
    const total = this.aaCostTotalPages;
    const current = this.aaCostCurrentPage;
    if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 2) return [1, 2, 3];
    if (current >= total - 1) return [total - 2, total - 1, total];
    return [current - 1, current, current + 1];
  }
  get aaCostPaginatedData(): CostRow[] {
    const start = (this.aaCostCurrentPage - 1) * this.aaCostPageSize;
    return this.costRowData.slice(start, start + this.aaCostPageSize);
  }
  aaCostGoToPage(page: number): void {
    if (page < 1 || page > this.aaCostTotalPages) return;
    this.aaCostCurrentPage = page;
  }
  aaCostChangePageSize(size: number): void {
    this.aaCostPageSize = Number(size);
    this.aaCostCurrentPage = 1;
  }
  aaCostOnExport(): void {
    this.onExportCostGrid();
  }

  // ─── Filter options ───────────────────────────────────────────────────────
  readonly standOptions = ['R1', 'R2', 'F1-F4', 'F5-F7', 'Edger', 'Pinch'];
  rollTypeOptions: string[] = ['WR'];

  // Roll ID list — populated from API (no hardcoded values)
  rollIdOptions: string[] = [];
  filteredRollIds: string[] = [];
  rollIdSearchQuery = '';

  selectedStand = 'R1';
  selectedRollType = 'WR';
  selectedRollId = '';

  filters: { rollId: string } = { rollId: '' };

  private readonly standCategoryApiMap: Record<string, string> = {
  'R1':    'R1',
  'R2':    'R2',
  'F1-F4': 'F1-4',
  'F5-F7': 'F5-7',
  'Edger': 'EG',
  'Pinch': 'PR'
};

  // ─── Roll List pagination (infinite scroll) ───────────────────────────────
  rollListPage = 1;
  rollListPageSize = 20;
  rollListTotal = 0;
  rollListHasMore = false;
  isLoadingRollList = false;

  // ─── Analysis loading / error state ──────────────────────────────────────
  isLoading = false;
  errorMessage: string | null = null;

  // ─── Summary data (from API) ──────────────────────────────────────────────
  wearSummary: WearApiResponse['summary'] | null = null;
  costSummary: CostApiResponse['summary'] | null = null;

  // ─── Grid row data (populated from API) ──────────────────────────────────
  wearRowData: WearRow[] = [];
  costRowData: CostRow[] = [];

  // ─── Shared cell style ────────────────────────────────────────────────────
  private readonly mergedCellBaseStyle: CellStyle = {
    borderRight: '1px solid rgba(255,255,255,0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 12px'
  };

  // ─── WEAR ANALYSIS GRID COLUMNS ───────────────────────────────────────────
  readonly wearColumnDefs: Array<ColDef | ColGroupDef> = [
    {
      headerName: 'CYCLE',
      field: 'cycle',
      width: 100,
      pinned: 'left',
      resizable: false,
      headerClass: 'adv-white-header',
      cellRenderer: (p: any) =>
        `<span style="color:#00D4FF;font-weight:700;font-size:14px">${p.value}</span>`,
      cellStyle: {
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }
    },
    {
      headerName: 'DIAMETER (mm)',
      headerClass: 'adv-white-header',
      marryChildren: true,
      resizable: false,
      children: [
        {
          headerName: 'BEFORE',
          field: 'diaBefore',
          width: 130,
          resizable: false,
          headerClass: 'adv-white-header',
          cellRenderer: (p: any) =>
            `<span style="color:#E8F0FE;font-weight:500;font-size:13px">${p.value}</span>`,
          cellStyle: {
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }
        },
        {
          headerName: 'AFTER',
          field: 'diaAfter',
          width: 130,
          resizable: false,
          headerClass: 'adv-white-header',
          cellRenderer: (p: any) =>
            `<span style="color:#E8F0FE;font-weight:500;font-size:13px">${p.value}</span>`,
          cellStyle: {
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }
        }
      ]
    } as ColGroupDef,
    {
      headerName: 'WEIGHT (Ton)',
      headerClass: 'adv-white-header',
      marryChildren: true,
      resizable: false,
      children: [
        {
          headerName: 'ACTUAL',
          field: 'tonnageActual',
          width: 130,
          resizable: false,
          headerClass: 'adv-white-header',
          cellRenderer: (p: any) =>
            `<span style="color:#E8F0FE;font-weight:500;font-size:13px">${p.value}</span>`,
          cellStyle: {
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }
        },
        {
          headerName: 'PREDICTED',
          field: 'tonnagePredicted',
          width: 130,
          resizable: false,
          headerClass: 'adv-white-header',
          cellRenderer: (p: any) =>
            `<span style="color:#E8F0FE;font-weight:500;font-size:13px">${p.value}</span>`,
          cellStyle: {
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }
        }
      ]
    } as ColGroupDef,
    {
      headerName: 'PREDICTED WEAR (mm)',
      field: 'predictedWear',
      
      flex: 1,
      minWidth: 150,
      resizable: false,
      headerClass: 'adv-white-header',
      cellRenderer: (p: any) =>
        `<span style="color:#E8F0FE;font-weight:500;font-size:13px">${p.value}</span>`,
      cellStyle: {
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }
    }
  ];

  // ─── COST ANALYSIS GRID COLUMNS ───────────────────────────────────────────
  readonly costColumnDefs: ColDef[] = [
    {
      headerName: 'CYCLE',
      field: 'cycle',
      resizable: false,
      width: 90,
      pinned: 'left',
      headerClass: 'adv-white-header',
      cellRenderer: (p: any) =>
        `<span style="color:#00D4FF;font-weight:700;font-size:14px">${p.value}</span>`,
      cellStyle: {
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }
    },
    {
      headerName: 'PROCUREMENT COST',
      field: 'procurementCost',
      resizable: false,
      flex: 1,
      minWidth: 140,
      headerClass: 'adv-white-header',
      rowSpan: (params: any) => (params.data?.cycle === 'C1' ? 7 : 0),
      cellClassRules: {
        'merged-cell': (params: any) => params.data?.cycle === 'C1'
      },
      cellRenderer: (p: any) =>
        p.data?.cycle === 'C1'
          ? `<div style="display:flex;flex-direction:column;align-items:center;
                         justify-content:center;height:100%;gap:4px">
               <span style="color:#E8F0FE;font-size:17px;font-weight:800;line-height:1">
                 ₹ ${p.value}
               </span>
               <span style="color:#3D5175;font-size:10px;font-weight:600;
                            text-transform:uppercase;letter-spacing:0.8px">
                 Total procurement
               </span>
             </div>`
          : '',
      cellStyle: (p: any): CellStyle => ({
        ...this.mergedCellBaseStyle,
        background: '#08102a',
        borderRight: p.data?.cycle === 'C1'
          ? '1px solid rgba(0,212,255,0.1)'
          : this.mergedCellBaseStyle['borderRight']
      })
    },
    {
      headerName: 'INDIRECT COST',
      field: 'indirectCost',
      flex: 1,
      resizable: false,
      minWidth: 120,
      headerClass: 'adv-white-header',
      cellRenderer: (p: any) =>
        `<span style="color:#E8F0FE;font-weight:500;font-size:13px">₹ ${p.value}</span>`,
      cellStyle: {
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }
    },
    {
      headerName: 'MAINTENANCE COST',
      field: 'maintCost',
      flex: 1,
      resizable: false,
      minWidth: 130,
      headerClass: 'adv-white-header',
      cellRenderer: (p: any) =>
        `<span style="color:#E8F0FE;font-weight:500;font-size:13px">₹ ${p.value}</span>`,
      cellStyle: {
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }
    },
    {
      headerName: 'DISPOSAL COST',
      field: 'disposalCost',
      flex: 1,
      resizable: false,
      minWidth: 120,
      headerClass: 'adv-white-header',
      cellRenderer: (p: any) =>
        `<span style="color:#E8F0FE;font-weight:500;font-size:13px">₹ ${p.value}</span>`,
      cellStyle: {
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }
    },
    {
      headerName: 'TOTAL CYCLE COST',
      field: 'totalCycle',
      flex: 1,
      resizable: false,
      minWidth: 130,
      headerClass: 'adv-white-header',
      cellRenderer: (p: any) =>
        `<span style="color:#E8F0FE;font-weight:600;font-size:13px">₹ ${p.value}</span>`,
      cellStyle: {
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }
    }
  ];



  readonly costGridOptions: GridOptions = {
    suppressRowTransform: true,
    rowHeight: 52,
    headerHeight: 44,
    domLayout: 'autoHeight',
    suppressCellFocus: true
  };

  // ─── Constructor ──────────────────────────────────────────────────────────
  constructor(private advanceAnalysisService: AdvanceAnalysisService) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadRollList(true);
  }

  // ─── Roll List (with infinite scroll support) ─────────────────────────────

  /**
   * Fetches roll IDs from /api/roll-list based on current stand + roll type.
   * Pass reset=true to start fresh (page 1), reset=false to append next page.
   */
  loadRollList(reset: boolean = false): void {
    if (this.isLoadingRollList) return;
    this.isLoadingRollList = true;

    if (reset) {
      this.rollListPage = 1;
    }
    const apiStandCategory = this.standCategoryApiMap[this.selectedStand] ?? this.selectedStand;
    this.advanceAnalysisService
      .getRollList(apiStandCategory, this.selectedRollType, this.rollListPage, this.rollListPageSize)
      .subscribe({
        next: (res: any) => {
          const ids = res.roll_list;

          if (reset) {
            this.rollIdOptions = ids;
          } else {
            this.rollIdOptions = [...this.rollIdOptions, ...ids];
          }

          this.rollListTotal = ids.length;
          this.rollListHasMore = false;

          // Refresh filtered list (respects any active search query)
          this.filteredRollIds = this.rollIdSearchQuery
            ? this.rollIdOptions.filter(id =>
                id.toLowerCase().includes(this.rollIdSearchQuery.toLowerCase())
              )
            : [...this.rollIdOptions];

          this.isLoadingRollList = false;

          // Auto-select first roll ID on fresh load and fetch its analysis
          if (reset && this.rollIdOptions.length > 0) {
            this.selectedRollId = this.rollIdOptions[0];
            this.filters.rollId = this.rollIdOptions[0];
            this.fetchAnalysisData();
          }
        },
        error: (err: any) => {
          console.error('Error fetching roll list:', err);
          this.isLoadingRollList = false;
        }
      });
  }

  /**
   * Called on scroll inside the Roll ID dropdown.
   * Loads next page when user scrolls near the bottom.
   */
  onRollIdDropdownScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (nearBottom && this.rollListHasMore && !this.isLoadingRollList) {
      this.rollListPage++;
      this.loadRollList(false);
    }
  }

  // ─── Analysis API Call ────────────────────────────────────────────────────

  /**
   * Fetches wear + cost data in parallel for the selected Roll ID.
   */
  fetchAnalysisData(): void {
    if (!this.selectedRollId) return;

    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      wear: this.advanceAnalysisService.getWearAnalysis(this.selectedRollId),
      cost: this.advanceAnalysisService.getCostAnalysis(this.selectedRollId)
    }).subscribe({
      next: ({ wear, cost }) => {
        // Map Wear API → WearRow
        this.wearRowData = wear.cycles.map(c => ({
          cycle:            c.cycle,
          diaBefore:        c.diameter_before,
          diaAfter:         c.diameter_after,
          tonnageActual:    c.actual_weight,
          tonnagePredicted: c.predicted_weight,
          predictedWear:    c.predicted_wear
        }));
        this.wearSummary = wear.summary;
        this.wearGridTotalRows = this.wearRowData.length;
        this.wearGridCurrentPage = 1;
        this.aaWearCurrentPage = 1;

        // Map Cost API → CostRow
        this.costRowData = cost.cycles.map(c => ({
          cycle:           c.cycle,
          procurementCost: c.procurement_cost,
          indirectCost:    String(c.indirect_cost),
          maintCost:       String(c.maintenance_cost),
          disposalCost:    c.disposal_cost,
          totalCycle:      String(c.total_cycle_cost)
        }));
        this.costSummary = cost.summary;
        this.costGridTotalRows = this.costRowData.length;
        this.costGridCurrentPage = 1;
        this.aaCostCurrentPage = 1;

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching analysis data:', err);
        this.errorMessage = 'Failed to load analysis data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // ─── Wear Grid Pagination ─────────────────────────────────────────────────
  get wearGridTotalPages(): number {
    return Math.ceil(this.wearGridTotalRows / this.wearGridPageSize) || 1;
  }

  get wearGridPaginatedData(): WearRow[] {
    const start = (this.wearGridCurrentPage - 1) * this.wearGridPageSize;
    return this.wearRowData.slice(start, start + this.wearGridPageSize);
  }

  wearGridGoToPage(page: number): void {
    if (page >= 1 && page <= this.wearGridTotalPages) {
      this.wearGridCurrentPage = page;
    }
  }

  wearGridGetPageNumbers(): number[] {
    const total = this.wearGridTotalPages;
    const current = this.wearGridCurrentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  onExportWearGrid(): void {
    const headers = ['cycle', 'diaBefore', 'diaAfter', 'tonnageActual', 'tonnagePredicted', 'predictedWear'];
    const rows = this.wearRowData.map(r => headers.map(h => (r as any)[h] ?? ''));
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    this.downloadCsv(csv, `wear-analysis-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  // ─── Cost Grid Pagination ─────────────────────────────────────────────────
  get costGridTotalPages(): number {
    return Math.ceil(this.costGridTotalRows / this.costGridPageSize) || 1;
  }

  get costGridPaginatedData(): CostRow[] {
    const start = (this.costGridCurrentPage - 1) * this.costGridPageSize;
    return this.costRowData.slice(start, start + this.costGridPageSize);
  }

  costGridGoToPage(page: number): void {
    if (page >= 1 && page <= this.costGridTotalPages) {
      this.costGridCurrentPage = page;
    }
  }

  costGridGetPageNumbers(): number[] {
    const total = this.costGridTotalPages;
    const current = this.costGridCurrentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  onExportCostGrid(): void {
    const headers = ['cycle', 'procurementCost', 'indirectCost', 'maintCost', 'disposalCost', 'totalCycle'];
    const rows = this.costRowData.map(r => headers.map(h => (r as any)[h] ?? ''));
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    this.downloadCsv(csv, `cost-analysis-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  private downloadCsv(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ─── Dropdown helpers ─────────────────────────────────────────────────────
  toggleDropdown(name: string): void {
    this.toggleFilterDropdown(name);
  }

  toggleFilterDropdown(name: string): void {
    const isClosing = this.openDropdown === name;
    this.openDropdown = isClosing ? null : name;

    if (name === 'rollId' && isClosing) {
      this.rollIdSearchQuery = '';
      this.filteredRollIds = [...this.rollIdOptions];
    }
  }

  selectStand(opt: string): void {
    this.selectedStand = opt;
    this.openDropdown = null;

    if (opt === 'R1') {
      this.rollTypeOptions = ['WR'];
      this.selectedRollType = 'WR';
    } else if (['R2', 'F1-F4', 'F5-F7'].includes(opt)) {
      this.rollTypeOptions = ['WR', 'BUR'];
      this.selectedRollType = 'WR';
    } else if (['Edger', 'Pinch'].includes(opt)) {
      this.rollTypeOptions = ['-'];
      this.selectedRollType = '-';
    }

    // Reset roll list and re-fetch
    this.rollIdOptions = [];
    this.filteredRollIds = [];
    this.selectedRollId = '';
    this.filters.rollId = '';
    this.rollIdSearchQuery = '';
    this.wearRowData = [];
    this.costRowData = [];
    this.wearSummary = null;
    this.costSummary = null;
    this.loadRollList(true);
  }

  selectRollType(opt: string): void {
    this.selectedRollType = opt;
    this.openDropdown = null;

    // Reset roll list and re-fetch
    this.rollIdOptions = [];
    this.filteredRollIds = [];
    this.selectedRollId = '';
    this.filters.rollId = '';
    this.rollIdSearchQuery = '';
    this.wearRowData = [];
    this.costRowData = [];
    this.wearSummary = null;
    this.costSummary = null;
    this.loadRollList(true);
  }

  selectRollId(opt: string): void {
    this.selectedRollId = opt;
    this.filters.rollId = opt;
    this.openDropdown = null;
    this.rollIdSearchQuery = '';
    this.filteredRollIds = [...this.rollIdOptions];

    // Fetch analysis for selected roll
    this.fetchAnalysisData();
  }

  selectFilterOption(name: 'rollId', option: string, event: Event): void {
    event.stopPropagation();
    if (name === 'rollId') {
      this.selectRollId(option);
    }
  }

  onRollIdSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.rollIdSearchQuery = query;
    this.filteredRollIds = this.rollIdOptions.filter(id =>
      id.toLowerCase().includes(query)
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!(event.target as HTMLElement).closest('.custom-select')) {
      if (this.openDropdown === 'rollId') {
        this.rollIdSearchQuery = '';
        this.filteredRollIds = [...this.rollIdOptions];
      }
      this.openDropdown = null;
    }
  }
}