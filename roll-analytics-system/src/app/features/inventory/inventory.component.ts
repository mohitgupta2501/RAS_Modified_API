import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, ColGroupDef } from 'ag-grid-community';
// import { InventoryService, KpiSummary } from '../../../app/core/services/inventory.service';
// ✅ REPLACE old import
import { InventoryService, KpiApiResponse } from '../../../app/core/services/inventory.service';

// ─────────────────────────────────────────────
// LOCAL INTERFACES matching exact API response fields
// ─────────────────────────────────────────────

// Matches GET /api/inventory/rolls results[]
interface RollInventoryRow {
  roll_id: string;
  stand_category: string;
  diameter: number;
  material_code: string;
  crown_max: number;
  crown_min: number;
  grind_cycles: number;
  shim: number;
  total_weight: number;
  total_coils: number;
  total_length: number;
  supplier: string;
  roll_added_time: string;
}

// Matches GET /api/inventory/chocks results[]
interface ChokeRow {
  chock_id: string;
  total_weight: number;
  total_coils: number;
  total_length: number;
  supplier: string;
}

type ActiveType = 'rolls' | 'choke';

type RollPos = 'T' | 'B' | 'OP' | 'DR';

interface KpiCard {
  id: 'r1' | 'r2' | 'f1f4' | 'f5f7' | 'ed' | 'pinch';
  label: string;
  subLabel: string;
  types: string[];
  wrCount: number;
  burCount: number;
  edCount?: number;
  pinchCount?: number;
  ready: number; 
  totalWeight: string;
  totalLength: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  barGradient: string;
}

interface RollRow {
  stand: string;
  standCategory: 'R1' | 'R2' | 'F1-F4' | 'F5-F7' | 'Edger' | 'Pinch';
  rollNo: string;
  diameter: number;
  matCode: 'SS' | 'FS' | 'HSS' | 'HICHR';
  initCrownMax: number | string;
  initCrownMin: number | string;
  equiCrownMax: number | string;
  equiCrownMin: number | string;
  grindType: '-' | 'CVC' | 'Flat' | 'HSS' | 'HICHR' | 'FS' | 'SS';
  grindIndex: number;
  shim: number;
  accumWeight: number;
  accumSlabs: number;
  accumLength: number;
  supplier: string;
  rollChangeTime: string;
}

interface EntryForm {
  stand: string;
  pos: '' | RollPos;
  rollNo: string;
  diameter: number | null;
  matCode: '' | 'SS' | 'FS' | 'HSS' | 'HICHR';
  initCrownMax: number | null;
  initCrownMin: number | null;
  equiCrownMax: number | null;
  equiCrownMin: number | null;
  grindType: '' | 'CVC' | 'Flat' | 'HSS' | 'HICHR' | 'FS' | 'SS';
  grindIndex: number | null;
  shim: number | null;
  accumWeight: number | null;
  accumSlabs: number | null;
  accumLength: number | null;
  supplier: string;
  rollChangeTime: string;
  rollType: '' | 'Edger Roll' | 'Pinch Roll';
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, AgGridAngular],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly inventoryService = inject(InventoryService);

  activeType: ActiveType = 'rolls';

  openEntryModal = false;
  showToast = false;
  openDropdown: 'rollType' | 'grindType' | null = null;

  isRollLoading = false;
  isChokeLoading = false;

  rollCurrentPage = 1;
  rollPageSize = 10;
  rollTotalRows = 0;

  chokeCurrentPage = 1;
  chokePageSize = 10;
  chokeTotalRows = 0;

  get rollTotalPages(): number {
    return Math.ceil(this.rollTotalRows / this.rollPageSize);
  }

  get rollPaginatedData(): RollInventoryRow[] {
    return this.rollInventoryRowData;
  }

  rollGoToPage(page: number) {
    if (page >= 1 && page <= this.rollTotalPages) {
      this.rollCurrentPage = page;
      this.loadRollInventory();
    }
  }

  rollGetPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.rollTotalPages; i++) pages.push(i);
    return pages;
  }

  get chokeTotalPages(): number {
    return Math.ceil(this.chokeTotalRows / this.chokePageSize);
  }

  get chokePaginatedData(): ChokeRow[] {
    return this.chokeRowData;
  }

  chokeGoToPage(page: number) {
    if (page >= 1 && page <= this.chokeTotalPages) {
      this.chokeCurrentPage = page;
      this.loadChokeInventory();
    }
  }

  chokeGetPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.chokeTotalPages; i++) pages.push(i);
    return pages;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  kpiCards: KpiCard[] = [
    {
      id: 'r1',
      label: 'R1',
      subLabel: 'Roughing\nStand 1',
      types: ['WR', 'BUR'],
      wrCount: 0,
      burCount: 0,
      totalWeight: '0',
      ready: 0,
      totalLength: '0',
      accent: '#FF8C42',
      accentBg: 'rgba(255,140,66,0.12)',
      accentBorder: 'rgba(255,140,66,0.3)',
      barGradient: 'linear-gradient(90deg,#FF8C42,#FF6B00)'
    },
    {
      id: 'r2',
      label: 'R2',
      subLabel: 'Roughing\nStand 2',
      types: ['WR', 'BUR'],
      wrCount: 0,
      burCount: 0,
      ready: 0,
      totalWeight: '0',
      totalLength: '0',
      accent: '#FFA500',
      accentBg: 'rgba(255,165,0,0.12)',
      accentBorder: 'rgba(255,165,0,0.3)',
      barGradient: 'linear-gradient(90deg,#FFA500,#FF8C42)'
    },
    {
      id: 'f1f4',
      label: 'F1 – F4',
      subLabel: 'Finishing\nStands',
      types: ['WR', 'BUR'],
      wrCount: 0,
      burCount: 0,
      totalWeight: '0',
      ready: 0,
      totalLength: '0',
      accent: '#60A5FA',
      accentBg: 'rgba(96,165,250,0.12)',
      accentBorder: 'rgba(96,165,250,0.3)',
      barGradient: 'linear-gradient(90deg,#2563EB,#60A5FA)'
    },
    {
      id: 'f5f7',
      label: 'F5 – F7',
      subLabel: 'Finishing\nStands',
      types: ['WR', 'BUR'],
      wrCount: 0,
      burCount: 0,
      ready: 0,
      totalWeight: '0',
      totalLength: '0',
      accent: '#A78BFA',
      accentBg: 'rgba(167,139,250,0.12)',
      accentBorder: 'rgba(167,139,250,0.3)',
      barGradient: 'linear-gradient(90deg,#7C3AED,#A78BFA)'
    },
    {
      id: 'ed',
      label: 'ED',
      subLabel: 'Edger Rolls',
      types: ['Edger Roll'],
      wrCount: 0,
      burCount: 0,
      edCount: 0,
      ready: 0,
      totalWeight: '0',
      totalLength: '0',
      accent: '#00E5A0',
      accentBg: 'rgba(0,229,160,0.1)',
      accentBorder: 'rgba(0,229,160,0.3)',
      barGradient: 'linear-gradient(90deg,#00E5A0,#00B894)'
    },
    {
      id: 'pinch',
      label: 'Pinch',
      subLabel: 'Pinch Rolls',
      types: ['Pinch Roll'],
      wrCount: 0,
      burCount: 0,
      pinchCount: 0,
      totalWeight: '0',
      ready: 0,
      totalLength: '0',
      accent: '#FF4560',
      accentBg: 'rgba(255,69,96,0.1)',
      accentBorder: 'rgba(255,69,96,0.3)',
      barGradient: 'linear-gradient(90deg,#FF4560,#CC1832)'
    }
  ];

  // ─────────────────────────────────────────────
  // ROLL TABLE COLUMN DEFS
  // All field names updated to match API snake_case response
  // ─────────────────────────────────────────────
  readonly rollInventoryColDefs: Array<ColDef | ColGroupDef> = [
    {
      headerName: 'ROLL ID',
      field: 'roll_id',                    // ✅ was 'rollNo'
      pinned: 'left',
      width: 150,
      lockPinned: true,
      cellRenderer: (params: any) =>
        `<span style="color:#00D4FF;font-weight:700;font-size:13px;cursor:pointer">${params.value}</span>`,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    },
    {
      headerName: 'STAND CATEGORY',
      field: 'stand_category',             // ✅ was 'standCategory'
      width: 150,
      cellRenderer: (params: any) => {
        const val = params.value || '-';
        if (val === '-') {
          return `<span style="color:#3D5175;font-size:13px">-</span>`;
        }
        return `
          <div style="display:flex;align-items:center;
                      justify-content:center;height:100%">
            <span style="
              background: rgba(167,139,250,0.15);
              color: #A78BFA;
              border: 1px solid rgba(167,139,250,0.35);
              border-radius: 8px;
              padding: 4px 14px;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.5px;
              white-space: nowrap;
            ">${val}</span>
          </div>`;
      },
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0'
      }
    },
    {
      headerName: 'DIAMETER [MM]',
      field: 'diameter',                   // ✅ no change
      width: 150,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#E8F0FE',
        fontSize: '13px'
      }
    },
    {
      headerName: 'MATERIAL CODE',
      field: 'material_code',              // ✅ was 'materialCode'
      width: 140,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#E8F0FE',
        fontSize: '13px'
      }
    },
    {
      headerName: 'INIT. CROWN [MM]',
      marryChildren: true,
      children: [
        {
          headerName: 'MAX',
          field: 'crown_max',              // ✅ was 'initCrownMax'
          width: 110,
          cellStyle: {
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            color: '#E8F0FE', fontSize: '13px'
          }
        },
        {
          headerName: 'MIN',
          field: 'crown_min',              // ✅ was 'initCrownMin'
          width: 110,
          cellStyle: {
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            color: '#E8F0FE', fontSize: '13px'
          }
        }
      ]
    } as ColGroupDef,
    {
      headerName: 'GRIND CYCLES',
      field: 'grind_cycles',               // ✅ was 'grindIndex'
      width: 120,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#E8F0FE',
        fontSize: '13px'
      }
    },
    {
      headerName: 'SHIM [MM]',
      field: 'shim',                       // ✅ no change
      width: 110,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#E8F0FE',
        fontSize: '13px'
      }
    },
    {
      headerName: 'TOTAL ACCUMULATION',
      headerClass: 'group-header-white',
      marryChildren: true,
      children: [
        {
          headerName: 'WEIGHT [TON]',
          field: 'total_weight',           // ✅ was 'totalWeight'
          width: 130,
          cellStyle: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#E8F0FE',
            fontSize: '13px'
          }
        },
        {
          headerName: 'COILS',
          field: 'total_coils',            // ✅ was 'totalSlabs' — API returns total_coils
          width: 100,
          cellStyle: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#E8F0FE',
            fontSize: '13px'
          }
        },
        {
          headerName: 'LENGTH [KM]',
          field: 'total_length',           // ✅ was 'totalLength'
          width: 120,
          cellStyle: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#E8F0FE',
            fontSize: '13px'
          }
        }
      ]
    } as ColGroupDef,
    {
      headerName: 'SUPPLIER',
      field: 'supplier',                   // ✅ no change
      width: 130,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#E8F0FE',
        fontSize: '13px'
      }
    },
    {
      headerName: 'ROLL ADDED TIME',
      field: 'roll_added_time',            // ✅ was 'rollGrindTime'
      width: 190,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#E8F0FE',
        fontSize: '13px'
      }
    }
  ];

  readonly rollInventoryDefaultColDef: ColDef = {
    resizable: true,
    sortable: false,
    suppressMovable: false,
    suppressMenu: true
  };

  rollInventoryRowData: RollInventoryRow[] = [];

  onExportRollInventory() {
    const headers = [
      'Roll ID',
      'Stand Category',
      'Diameter [MM]',
      'Material Code',
      'Crown Max',
      'Crown Min',
      'Grind Cycles',
      'Shim [MM]',
      'Total Weight [TON]',
      'Total Coils',
      'Total Length [KM]',
      'Supplier',
      'Roll Added Time'
    ];

    const rows = this.rollInventoryRowData.map((r: any) => [
      r.roll_id,
      r.stand_category,
      r.diameter,
      r.material_code,
      r.crown_max,
      r.crown_min,
      r.grind_cycles,
      r.shim,
      r.total_weight,
      r.total_coils,
      r.total_length,
      r.supplier,
      r.roll_added_time ? r.roll_added_time.replace('T', ' ') : ''
    ]);

    const csv = [headers, ...rows].map((r: any[]) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roll-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  chokeRowData: ChokeRow[] = [];

  // ─────────────────────────────────────────────
  // CHOCK TABLE COLUMN DEFS
  // field names to be confirmed once chock API response is shared
  // ─────────────────────────────────────────────
  readonly chokeColDefs: ColDef[] = [
    {
      headerName: 'CHOCK ID',
      field: 'chock_id',                   // ✅ was 'chokeId' — update if API field differs
      width: 180,
      pinned: 'left',
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00D4FF',
        fontWeight: '700',
        fontSize: '13px'
      }
    },
    {
      headerName: 'WEIGHT (TON)',
      field: 'total_weight',               // ✅ was 'weight' — update if API field differs
      flex: 1,
      minWidth: 130,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#E8F0FE',
        fontWeight: '500',
        fontSize: '13px'
      }
    },
    {
      headerName: 'COILS',
      field: 'total_coils',                // ✅ was 'slabs' — update if API field differs
      flex: 1,
      minWidth: 100,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#E8F0FE',
        fontWeight: '500',
        fontSize: '13px'
      }
    },
    {
      headerName: 'LENGTH (KM)',
      field: 'total_length',               // ✅ was 'length' — update if API field differs
      flex: 1,
      minWidth: 120,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#E8F0FE',
        fontWeight: '500',
        fontSize: '13px'
      }
    },
    {
      headerName: 'SUPPLIER',
      field: 'supplier',                   // ✅ no change
      flex: 1,
      minWidth: 130,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#E8F0FE',
        fontWeight: '500',
        fontSize: '13px'
      }
    }
  ];

  readonly chokeDefaultColDef: ColDef = {
    resizable: false,
    sortable: false,
    suppressMovable: true,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      color: '#E8F0FE'
    }
  };

  onExportChokeInventory() {
    const headers = ['Chock ID', 'Weight (TON)', 'Coils', 'Length (KM)', 'Supplier'];
    const rows = this.chokeRowData.map((r: any) => [
      r.chock_id,
      r.total_weight,
      r.total_coils,
      r.total_length,
      r.supplier
    ]);
    const csv = [headers, ...rows].map((r: any[]) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chock-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  ngOnInit(): void {
    this.loadRollInventory();
    this.loadChokeInventory();
    this.loadRollKpi();
    this.loadChockKpi();
  }

  // ✅ FIXED: uses res.results and res.count to match API response structure
  private loadRollInventory(): void {
    this.isRollLoading = true;
    this.inventoryService.getRollInventory(this.rollCurrentPage, this.rollPageSize).subscribe({
      next: (res: any) => {
        this.rollInventoryRowData = res.results ?? [];
        this.rollTotalRows = res.count ?? 0;
        this.isRollLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load roll inventory:', err);
        this.isRollLoading = false;
      }
    });
  }

  // ✅ FIXED: uses res.results and res.count to match API response structure
  private loadChokeInventory(): void {
    this.isChokeLoading = true;
    this.inventoryService.getChockInventory(this.chokeCurrentPage, this.chokePageSize).subscribe({
      next: (res: any) => {
        this.chokeRowData = res.results ?? [];
        this.chokeTotalRows = res.count ?? 0;
        this.isChokeLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load chock inventory:', err);
        this.isChokeLoading = false;
      }
    });
  }

private loadRollKpi(): void {
  this.inventoryService.getRollKpi().subscribe({
    next: (res: any) => {
      const list = res.kpi_card_list ?? [];
      list.forEach((item: any) => {
        const cat = item.stand_category;

        if (cat === 'F1-4') {
          const card = this.kpiCards.find(c => c.id === 'f1f4');
          if (card) {
            card.ready    = item.ready ?? 0;  // ✅
            card.wrCount  = item.wr    ?? 0;
            card.burCount = item.bur   ?? 0;
          }
        }
        if (cat === 'F5-7') {
          const card = this.kpiCards.find(c => c.id === 'f5f7');
          if (card) {
            card.ready    = item.ready ?? 0;  // ✅
            card.wrCount  = item.wr    ?? 0;
            card.burCount = item.bur   ?? 0;
          }
        }
        if (cat === 'EG') {
          const card = this.kpiCards.find(c => c.id === 'ed');
          if (card) {
            card.ready   = item.ready ?? 0;   // ✅
            card.edCount = item.ready ?? 0;
          }
        }
        if (cat === 'PR') {
          const card = this.kpiCards.find(c => c.id === 'pinch');
          if (card) {
            card.ready      = item.ready ?? 0; // ✅
            card.pinchCount = item.ready ?? 0;
          }
        }
        if (cat === 'R1') {
          const card = this.kpiCards.find(c => c.id === 'r1');
          if (card) {
            card.ready    = item.ready ?? 0;  // ✅
            card.wrCount  = item.wr    ?? 0;
            card.burCount = item.bur   ?? 0;
          }
        }
        if (cat === 'R2') {
          const card = this.kpiCards.find(c => c.id === 'r2');
          if (card) {
            card.ready    = item.ready ?? 0;  // ✅
            card.wrCount  = item.wr    ?? 0;
            card.burCount = item.bur   ?? 0;
          }
        }
      });
    },
    error: (err: any) => console.error('Failed to load roll KPI:', err)
  });
}

private loadChockKpi(): void {
  this.inventoryService.getChockKpi().subscribe({
    next: (res: any) => {
      const list = res.kpi_card_list ?? [];
      list.forEach((item: any) => {
        const cat = item.stand_category;

        if (cat === 'F1-4') {
          const card = this.kpiCards.find(c => c.id === 'f1f4');
          if (card) {
            card.ready    = item.ready ?? 0;  // ✅
            card.wrCount  = item.wr    ?? 0;
            card.burCount = item.bur   ?? 0;
          }
        }
        if (cat === 'F5-7') {
          const card = this.kpiCards.find(c => c.id === 'f5f7');
          if (card) {
            card.ready    = item.ready ?? 0;  // ✅
            card.wrCount  = item.wr    ?? 0;
            card.burCount = item.bur   ?? 0;
          }
        }
        if (cat === 'EG') {
          const card = this.kpiCards.find(c => c.id === 'ed');
          if (card) {
            card.ready   = item.ready ?? 0;   // ✅
            card.edCount = item.ready ?? 0;
          }
        }
        if (cat === 'PR') {
          const card = this.kpiCards.find(c => c.id === 'pinch');
          if (card) {
            card.ready      = item.ready ?? 0; // ✅
            card.pinchCount = item.ready ?? 0;
          }
        }
      });
    },
    error: (err: any) => console.error('Failed to load chock KPI:', err)
  });
}

  entryForm: EntryForm = this.createEmptyForm();
  readonly rollTypeOptions: Array<'Edger Roll' | 'Pinch Roll'> = ['Edger Roll', 'Pinch Roll'];
  readonly grindTypeOptions: Array<'CVC' | 'Flat' | 'HSS' | 'HICHR' | 'FS' | 'SS'> = [
    'CVC', 'Flat', 'HSS', 'HICHR', 'FS', 'SS'
  ];

  getStandCategoryPillStyle(standCategory: RollRow['standCategory']): { [key: string]: string } {
    return {
      background: 'rgba(167,139,250,0.15)',
      color: '#A78BFA',
      border: '1px solid rgba(167,139,250,0.35)'
    };
  }

  setType(type: ActiveType): void {
    this.activeType = type;
  }

  openManualEntry(): void {
    this.openEntryModal = true;
  }

  closeManualEntry(): void {
    this.openEntryModal = false;
    this.resetForm();
  }

  submitEntry(): void {
    this.closeManualEntry();
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3500);
  }

  resetForm(): void {
    this.entryForm = this.createEmptyForm();
  }

  private createEmptyForm(): EntryForm {
    return {
      stand: '',
      pos: '',
      rollNo: '',
      diameter: null,
      matCode: '',
      initCrownMax: null,
      initCrownMin: null,
      equiCrownMax: null,
      equiCrownMin: null,
      grindType: '',
      grindIndex: null,
      shim: null,
      accumWeight: null,
      accumSlabs: null,
      accumLength: null,
      supplier: '',
      rollChangeTime: '',
      rollType: ''
    };
  }

  getGrindTypeBadge(type: RollRow['grindType']): { [key: string]: string } {
    if (type === 'CVC') return { background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#A78BFA' };
    if (type === 'Flat') return { background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)', color: '#00E5A0' };
    if (type === 'HSS') return { background: 'rgba(255,140,66,0.1)', border: '1px solid rgba(255,140,66,0.3)', color: '#FF8C42' };
    if (type === 'HICHR') return { background: 'rgba(255,69,96,0.1)', border: '1px solid rgba(255,69,96,0.3)', color: '#FF4560' };
    if (type === 'FS') return { background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' };
    if (type === 'SS') return { background: 'rgba(123,144,184,0.12)', border: '1px solid rgba(123,144,184,0.3)', color: '#7B90B8' };
    return { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#7B90B8' };
  }

  getPOSBadge(pos: RollPos): { [key: string]: string } {
    if (pos === 'T') return { background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.35)', color: '#00D4FF' };
    if (pos === 'B') return { background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.35)', color: '#A78BFA' };
    if (pos === 'OP') return { background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.35)', color: '#00E5A0' };
    if (pos === 'DR') return { background: 'rgba(255,140,66,0.12)', border: '1px solid rgba(255,140,66,0.35)', color: '#FF8C42' };
    return { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#7B90B8' };
  }

  goToRollDetails(): void {
    this.router.navigate(['/roll-details']);
  }

  toggleDropdown(name: 'rollType' | 'grindType'): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }
}