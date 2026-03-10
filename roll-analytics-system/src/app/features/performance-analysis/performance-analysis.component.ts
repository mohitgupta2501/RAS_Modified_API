import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AgGridAngular } from "ag-grid-angular";
import { ColDef, ColGroupDef, ICellRendererParams } from "ag-grid-community";

interface SupplierPerformanceRow {
  supplier: string;
  avgRolledLength: number;
  avgRolledTonage: number;
  avgUtilization: number;
  avgHourlyTonage: number;
  totalBreakdown: number;
  // avgCoolantConc: number;
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
  millOptions = ["R1", "R2", "F1-F4", "F5-F7", "Edger", "Pinch"];
  rollOptions = ["WR", "BUR", ""];
  selectedMill = "F1-F4";
  selectedRoll = "WR";
  openDropdown: string | null = null;

  supplierPerfCurrentPage = 1;
  supplierPerfPageSize = 10;
  supplierPerfTotalRows = 0;

  fitnessMatrixCurrentPage = 1;
  fitnessMatrixPageSize = 10;
  fitnessMatrixTotalRows = 0;

  thinkerMatrixCurrentPage = 1;
  thinkerMatrixPageSize = 10;
  thinkerMatrixTotalRows = 0;

  // AG Grid data
  readonly rowData: SupplierPerformanceRow[] = [
    {
      supplier: "Supplier 1",
      avgRolledLength: 118.5,
      avgRolledTonage: 180,
      avgUtilization: 98,
      avgHourlyTonage: 50,
      totalBreakdown: 2,
      // avgCoolantConc: 80,
      avgPurchaseCost: 80,
      avgCycles: 10.2,
      avgLeadTime: 8.9,
      avgCostPerKm: 8.8,
      rating: 9.5,
    },
    {
      supplier: "Supplier 3",
      avgRolledLength: 111.43,
      avgRolledTonage: 175,
      avgUtilization: 95,
      avgHourlyTonage: 48,
      totalBreakdown: 3,
      // avgCoolantConc: 85,
      avgPurchaseCost: 85,
      avgCycles: 9.9,
      avgLeadTime: 7.2,
      avgCostPerKm: 8.2,
      rating: 8.5,
    },
    {
      supplier: "Supplier 5",
      avgRolledLength: 112.9,
      avgRolledTonage: 170,
      avgUtilization: 92,
      avgHourlyTonage: 45,
      totalBreakdown: 4,
      // avgCoolantConc: 90,
      avgPurchaseCost: 90,
      avgCycles: 8.6,
      avgLeadTime: 9.5,
      avgCostPerKm: 9.3,
      rating: 7.5,
    },
  ];

  readonly columnDefs: ColDef[] = [
    {
      headerName: "SUPPLIER",
      field: "supplier",
      pinned: "left",
      width: 140,
      headerClass: "perf-white-header",
      cellStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: "13px",
        padding: "0 16px",
      },
    },
    {
      headerName: "AVG ROLLED LENGTH (KM)",
      field: "avgRolledLength",
      flex: 1,
      headerClass: "perf-white-header",
      cellRenderer: this.getCellRenderer("avgRolledLength"),
    },
    {
      headerName: "AVG ROLLED TONAGE (TON)",
      field: "avgRolledTonage",
      flex: 1,
      headerClass: "perf-white-header",
      cellRenderer: this.getCellRenderer("avgRolledTonage"),
    },
    {
      headerName: "AVG UTILIZATION (%)",
      field: "avgUtilization",
      flex: 1,
      headerClass: "perf-white-header",
      cellRenderer: this.getCellRenderer("avgUtilization"),
    },
    // {
    //   headerName: 'AVG HOURLY TONAGE (T/HR)',
    //   field: 'avgHourlyTonage',
    //   flex: 1,
    //   headerClass: 'perf-white-header',
    //   cellRenderer: this.getCellRenderer('avgHourlyTonage')
    // },
    {
      headerName: "TOTAL BREAKDOWN",
      field: "totalBreakdown",
      flex: 1,
      headerClass: "perf-white-header",
      cellRenderer: this.getCellRenderer("totalBreakdown"),
    },
    // {
    //   headerName: 'AVG COOLANT CONC (%)',
    //   field: 'avgCoolantConc',
    //   flex: 1,
    //   headerClass: 'perf-white-header',
    //   cellRenderer: this.getCellRenderer('avgCoolantConc')
    // },
    {
      headerName: "AVG PURCHASE COST (MINR)",
      field: "avgPurchaseCost",
      flex: 1,
      headerClass: "perf-white-header",
      cellRenderer: this.getCellRenderer("avgPurchaseCost"),
    },
    {
      headerName: "AVG CYCLES",
      field: "avgCycles",
      flex: 1,
      headerClass: "perf-white-header",
      cellRenderer: this.getCellRenderer("avgCycles"),
    },
    {
      headerName: "AVG LEAD TIME (MO)",
      field: "avgLeadTime",
      flex: 1,
      headerClass: "perf-white-header",
      cellRenderer: this.getCellRenderer("avgLeadTime"),
    },
    {
      headerName: "AVG COST PER KM",
      field: "avgCostPerKm",
      flex: 1,
      headerClass: "perf-white-header",
      cellRenderer: this.getCellRenderer("avgCostPerKm"),
    },
    {
      headerName: "RATING (/10)",
      field: "rating",
      flex: 1.5,
      pinned: "right",
      lockPinned: true,
      headerClass: "perf-white-header",
      cellRenderer: (params: any) => {
        const val = params.value;
        const stars = Math.round(val / 2);
        const filled = "★".repeat(stars);
        const empty = "☆".repeat(5 - stars);
        return `<div style="display:flex;flex-direction:column;align-items:center;
                justify-content:center;height:100%;gap:2px">
          <span style="color:#FF8C42;font-weight:700;font-size:13px">${val}</span>
          <span style="color:#FF8C42;font-size:11px;letter-spacing:1px">${filled}${empty}</span>
        </div>`;
      },
    },
  ];

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

  // --- SHARED MATRIX DATA ---
  matrixRowData: FitnessRow[] = [
    {
      supplier: "Supplier 1",
      hc: 4.8,
      mc: 4.6,
      lc: 4.2,
      thin: 4.9,
      rg: 4.0,
      country: "Germany",
      rolls: 12,
    },
    {
      supplier: "Supplier 2",
      hc: 4.2,
      mc: 4.5,
      lc: 4.7,
      thin: 4.3,
      rg: 4.8,
      country: "Japan",
      rolls: 8,
    },
    {
      supplier: "Supplier 3",
      hc: 4.0,
      mc: 4.2,
      lc: 4.5,
      thin: 3.8,
      rg: 4.6,
      country: "USA",
      rolls: 6,
    },
    {
      supplier: "Supplier 4",
      hc: 4.5,
      mc: 4.4,
      lc: 4.3,
      thin: 4.6,
      rg: 4.1,
      country: "Switzerland",
      rolls: 10,
    },
    {
      supplier: "Supplir 5",
      hc: 4.3,
      mc: 4.5,
      lc: 4.6,
      thin: 4.4,
      rg: 4.7,
      country: "Germany",
      rolls: 5,
    },
  ];

  matrixThicknessRowData: ThicknessRow[] = [
    {
      supplier: "Supplier 1",
      cycle1count: 120,
      cycle2count: 95,
      cycle3count: 140,
      cycle1rating: 4.25,
      cycle2rating: 3.85,
      cycle3rating: 4.6,
      country: "India",
      rolls: 18,
    },
    {
      supplier: "Supplier 2",
      cycle1count: 80,
      cycle2count: 110,
      cycle3count: 105,
      cycle1rating: 3.75,
      cycle2rating: 4.1,
      cycle3rating: 3.95,
      country: "Germany",
      rolls: 22,
    },
    {
      supplier: "Supplier 3",
      cycle1count: 150,
      cycle2count: 130,
      cycle3count: 160,
      cycle1rating: 4.8,
      cycle2rating: 4.55,
      cycle3rating: 4.9,
      country: "Japan",
      rolls: 30,
    },
    {
      supplier: "Supplier 4",
      cycle1count: 60,
      cycle2count: 75,
      cycle3count: 90,
      cycle1rating: 3.2,
      cycle2rating: 3.65,
      cycle3rating: 3.9,
      country: "USA",
      rolls: 12,
    },
    {
      supplier: "Supplier 5",
      cycle1count: 200,
      cycle2count: 185,
      cycle3count: 210,
      cycle1rating: 4.95,
      cycle2rating: 4.7,
      cycle3rating: 4.88,
      country: "China",
      rolls: 40,
    },
  ];

  get supplierPerfTotalPages(): number {
    return Math.ceil(this.supplierPerfTotalRows / this.supplierPerfPageSize);
  }

  get supplierPerfPaginatedData(): any[] {
    const start =
      (this.supplierPerfCurrentPage - 1) * this.supplierPerfPageSize;
    return this.rowData.slice(start, start + this.supplierPerfPageSize);
  }

  supplierPerfGoToPage(page: number) {
    if (page >= 1 && page <= this.supplierPerfTotalPages) {
      this.supplierPerfCurrentPage = page;
    }
  }

  supplierPerfGetPageNumbers(): number[] {
    const total = this.supplierPerfTotalPages;
    const current = this.supplierPerfCurrentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (current > 3) pages.push(-1);
    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages as number[];
  }

  onExportSupplierPerf() {
    const fields = (this.columnDefs || [])
      .map((c: any) => c.field)
      .filter(Boolean);
    const headers = fields.length ? fields : Object.keys(this.rowData[0] || {});
    const rows = this.rowData.map((r: any) => headers.map((h) => r[h] ?? ""));
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supplier-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  get fitnessMatrixTotalPages(): number {
    return Math.ceil(this.fitnessMatrixTotalRows / this.fitnessMatrixPageSize);
  }

  get fitnessMatrixPaginatedData(): any[] {
    const start =
      (this.fitnessMatrixCurrentPage - 1) * this.fitnessMatrixPageSize;
    return this.matrixRowData.slice(start, start + this.fitnessMatrixPageSize);
  }

  fitnessMatrixGoToPage(page: number) {
    if (page >= 1 && page <= this.fitnessMatrixTotalPages) {
      this.fitnessMatrixCurrentPage = page;
    }
  }

  fitnessMatrixGetPageNumbers(): number[] {
    const total = this.fitnessMatrixTotalPages;
    const current = this.fitnessMatrixCurrentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (current > 3) pages.push(-1);
    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages as number[];
  }

  onExportFitnessMatrix() {
    const fields = (this.fitnessColDefs || [])
      .map((c: any) => c.field)
      .filter(Boolean);
    const headers = fields.length
      ? fields
      : Object.keys(this.matrixRowData[0] || {});
    const rows = this.matrixRowData.map((r: any) =>
      headers.map((h) => r[h] ?? ""),
    );
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitness-matrix-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  get thinkerMatrixTotalPages(): number {
    return Math.ceil(this.thinkerMatrixTotalRows / this.thinkerMatrixPageSize);
  }

  get thinkerMatrixPaginatedData(): any[] {
    const start =
      (this.thinkerMatrixCurrentPage - 1) * this.thinkerMatrixPageSize;
    return this.matrixThicknessRowData.slice(
      start,
      start + this.thinkerMatrixPageSize,
    );
  }

  thinkerMatrixGoToPage(page: number) {
    if (page >= 1 && page <= this.thinkerMatrixTotalPages) {
      this.thinkerMatrixCurrentPage = page;
    }
  }

  thinkerMatrixGetPageNumbers(): number[] {
    const total = this.thinkerMatrixTotalPages;
    const current = this.thinkerMatrixCurrentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (current > 3) pages.push(-1);
    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages as number[];
  }

  onExportThinkerMatrix() {
    const fields = (this.thinkerColDefs || [])
      .map((c: any) => c.field)
      .filter(Boolean);
    const headers = fields.length
      ? fields
      : Object.keys(this.matrixRowData[0] || {});
    const rows = this.matrixRowData.map((r: any) =>
      headers.map((h) => r[h] ?? ""),
    );
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thinker-matrix-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  matrixDefaultColDef: ColDef = {
    resizable: false,
    sortable: false,
    suppressMovable: true,
  };

  // --- TILE CELL RENDERER ---
  tileCellRenderer = (params: any) => {
    const val = params.value;
    let label: string, bg: string, border: string, color: string;
    if (val >= 4.6) {
      label = "Best";
      bg = "rgba(0,80,45,0.6)";
      border = "rgba(0,229,160,0.4)";
      color = "#00E5A0";
    } else if (val >= 4.3) {
      label = "Good";
      bg = "rgba(15,45,105,0.65)";
      border = "rgba(96,165,250,0.4)";
      color = "#60A5FA";
    } else if (val >= 4.0) {
      label = "Fair";
      bg = "rgba(95,55,5,0.65)";
      border = "rgba(255,140,66,0.4)";
      color = "#FF8C42";
    } else {
      label = "Poor";
      bg = "rgba(95,15,25,0.65)";
      border = "rgba(255,69,96,0.4)";
      color = "#FF4560";
    }
    return `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%">
      <div style="
        width:72px;height:54px;
        background:${bg};
        border:1px solid ${border};
        border-radius:10px;
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:2px;
      ">
        <span style="color:${color};font-size:16px;font-weight:800;line-height:1">${val}</span>
        <span style="color:${color};font-size:10px;font-weight:600;line-height:1">${label}</span>
      </div>
    </div>`;
  };

  tileCellRenderer2 = (params: ICellRendererParams<ThicknessRow, number>) => {
    const val = params.value!!;
    let label: string, bg: string, border: string, color: string;
    if (val >= 4.6) {
      label = "Best";
      bg = "rgba(0,80,45,0.6)";
      border = "rgba(0,229,160,0.4)";
      color = "#00E5A0";
    } else if (val >= 4.3) {
      label = "Good";
      bg = "rgba(15,45,105,0.65)";
      border = "rgba(96,165,250,0.4)";
      color = "#60A5FA";
    } else if (val >= 4.0) {
      label = "Fair";
      bg = "rgba(95,55,5,0.65)";
      border = "rgba(255,140,66,0.4)";
      color = "#FF8C42";
    } else {
      label = "Poor";
      bg = "rgba(95,15,25,0.65)";
      border = "rgba(255,69,96,0.4)";
      color = "#FF4560";
    }
    return `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%">
      <div style="
        width:72px;height:54px;
        background:${bg};
        border:1px solid ${border};
        border-radius:10px;
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:2px;
      ">
        <span style="color:${color};font-size:16px;font-weight:800;line-height:1">${val}</span>
        <span style="color:${color};font-size:10px;font-weight:600;line-height:1">${label}</span>
      </div>
    </div>`;
  };

  // --- GRADE HEADER RENDERER ---
  gradeHeaderRenderer = (params: any) => {
    const subtitles: { [key: string]: string } = {
      HC: "High Carbon",
      MC: "Standard",
      LC: "Soft steel",
      THIN: "Precision required",
      RG: "Heavy products",
    };
    const subtitle = subtitles[params.displayName] || "";
    return `
    <div style="
      display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      height:100%;width:100%;
    ">
      <span style="color:#E8F0FE;font-size:13px;font-weight:700;line-height:1.2">
        ${params.displayName}
      </span>
      <span style="color:#3D5175;font-size:10px;font-weight:600;margin-top:4px;line-height:1">
        ${subtitle}
      </span>
    </div>`;
  };

  // --- COLUMN DEFS (used by BOTH grids) ---
  fitnessColDefs: ColDef[] = [];
  thinkerColDefs: Array<ColDef<ThicknessRow> | ColGroupDef<ThicknessRow>> = [];

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  selectMill(value: string) {
    this.selectedMill = value;
    this.openDropdown = null;
  }

  selectRoll(value: string) {
    this.selectedRoll = value;
    this.openDropdown = null;
  }

  ngOnInit(): void {
    document.addEventListener("click", () => {
      this.openDropdown = null;
    });
    this.buildMatrixColDefs();
    this.buildMatrixColDefs2();

    this.supplierPerfTotalRows = this.rowData.length;
    this.fitnessMatrixTotalRows = this.matrixRowData.length;
    this.thinkerMatrixTotalRows = this.matrixThicknessRowData.length;
  }

  // Helpers
  getCellRenderer(field: string) {
    return (params: any) => {
      const colData = this.rowData.map((r: any) => r[field]);
      const max = Math.max(...colData);
      const min = Math.min(...colData);
      const val = params.value;
      const invertFields = [
        "totalBreakdown",
        "avgPurchaseCost",
        "avgCostPerKm",
        "avgLeadTime",
      ];
      let color: string;

      if (invertFields.includes(field)) {
        if (val === min) color = "#00E5A0";
        else if (val === max) color = "#FF4560";
        else color = "#FF8C42";
      } else {
        if (val === max) color = "#00E5A0";
        else if (val === min) color = "#FF4560";
        else color = "#FF8C42";
      }

      return `<span style="color:${color};font-weight:600;font-size:13px">${val}</span>`;
    };
  }

  buildMatrixColDefs(): void {
    const gradeCol = (headerName: string, field: string): ColDef => ({
      headerName,
      field,
      flex: 1,
      width: headerName === "THIN" ? 140 : 120,
      headerComponent: "agColumnHeader",
      headerComponentParams: {
        template: `
        <div style="
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          height:100%;width:100%;padding:8px 0;
        ">
          <span style="color:#E8F0FE;font-size:13px;font-weight:700;line-height:1.2">
            ${headerName}
          </span>
          <span style="color:#3D5175;font-size:10px;font-weight:600;margin-top:4px;">
            ${
              {
                HC: "High Carbon",
                MC: "Standard",
                LC: "Soft steel",
                THIN: "Precision required",
                RG: "Heavy products",
              }[headerName]
            }
          </span>
        </div>`,
      },
      cellRenderer: this.tileCellRenderer,
      cellStyle: {
        padding: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    });

    const cols: ColDef[] = [
      {
        headerName: "SUPPLIER",
        field: "supplier",
        pinned: "left",
        width: 210,
        headerClass: "perf-matrix-left-header",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          color: "#E8F0FE",
          fontWeight: "700",
          fontSize: "14px",
        },
      },
      gradeCol("HC", "hc"),
      gradeCol("MC", "mc"),
      gradeCol("LC", "lc"),
      // gradeCol('THIN', 'thin'),
      // gradeCol('RG', 'rg'),
      {
        headerName: "COUNTRY",
        field: "country",
        width: 140,
        headerClass: "perf-matrix-center-header",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#7B90B8",
          fontSize: "13px",
        },
      },
      {
        headerName: "ROLLS",
        field: "rolls",
        width: 90,
        headerClass: "perf-matrix-center-header",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#E8F0FE",
          fontWeight: "700",
          fontSize: "15px",
        },
      },
    ];

    this.fitnessColDefs = cols;
  }

  buildMatrixColDefs2(): void {
    const cols: Array<ColDef<ThicknessRow> | ColGroupDef<ThicknessRow>> = [
      {
        headerName: "SUPPLIER",
        field: "supplier",
        pinned: "left",
        width: 210,
        headerClass: "perf-matrix-left-header",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          color: "#E8F0FE",
          fontWeight: "700",
          fontSize: "14px",
        },
      },
      // cycleCol("Cycle1", 'cycle1count', 'cycle1rating'),
      // cycleCol("Cycle2", 'cycle2count', 'cycle2rating'),
      // cycleCol("Cycle3", 'cycle3count', 'cycle3rating'),
      // gradeCol('THIN', 'thin'),
      // gradeCol('RG', 'rg'),
      {
        headerName: "Cycle 1",
        headerClass: "center-header",
        headerGroupComponent: undefined,
        children: [
          {
            field: "cycle1count",
            headerName: "Count",
            flex: 1,
            width: 140,
            headerClass: "center-header",
            cellClass: "center-cell",
            type: "numericColumn",
            sortable: false,
            cellRenderer: (params: ICellRendererParams<ThicknessRow, number>) =>
              `<span style="color:#00D4FF;font-weight:700;font-size:13px;">${params.value ?? ""}</span>`,
          },
          {
            field: "cycle1rating",
            headerName: "Rating",
            flex: 1,
            width: 130,
            headerClass: "center-header",
            cellClass: "center-cell",
            type: "numericColumn",
            sortable: false,
            cellRenderer: this.tileCellRenderer2,
          },
        ],
      },
      {
        headerName: "Cycle 2",
        headerClass: "center-header",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#7B90B8",
          fontSize: "13px",
        },
        children: [
          {
            field: "cycle2count",
            headerName: "Count",
            flex: 1,
            width: 140,
            headerClass: "center-header",
            cellClass: "center-cell",
            type: "numericColumn",
            sortable: false,
            cellRenderer: (params: ICellRendererParams<ThicknessRow, number>) =>
              `<span style="color:#00D4FF;font-weight:700;font-size:13px;">${params.value ?? ""}</span>`,
          },
          {
            field: "cycle2rating",
            headerName: "Rating",
            flex: 1,
            width: 130,
            headerClass: "center-header",
            cellClass: "center-cell",
            type: "numericColumn",
            sortable: false,
           cellRenderer: this.tileCellRenderer2,
          },
        ],
      },
      {
        headerName: "Cycle 3",
        headerClass: "center-header",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#7B90B8",
          fontSize: "13px",
        },
        children: [
          {
            field: "cycle3count",
            flex: 1,
            headerName: "Count",
            width: 140,
            headerClass: "center-header",
            cellClass: "center-cell",
            type: "numericColumn",
            sortable: false,
            cellRenderer: (params: ICellRendererParams<ThicknessRow, number>) =>
              `<span style="color:#00D4FF;font-weight:700;font-size:13px;">${params.value ?? ""}</span>`,
          },
          {
            field: "cycle3rating",
            flex: 1,
            headerName: "Rating",
            width: 130,
            headerClass: "center-header",
            cellClass: "center-cell",
            type: "numericColumn",
            sortable: false,
            cellRenderer: this.tileCellRenderer2,
          },
        ],
      },

      {
        headerName: "COUNTRY",
        field: "country",
        width: 140,
        headerClass: "perf-matrix-center-header",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#7B90B8",
          fontSize: "13px",
        },
      },
      {
        headerName: "ROLLS",
        field: "rolls",
        width: 90,
        headerClass: "perf-matrix-center-header",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#E8F0FE",
          fontWeight: "700",
          fontSize: "15px",
        },
      },
    ];

    this.thinkerColDefs = cols;
  }
}
