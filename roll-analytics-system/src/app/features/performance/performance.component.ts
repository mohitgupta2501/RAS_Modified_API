import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PerformanceData {
  parameter: string;
  units: string;
  v1: number;
  v2: number;
  v3: number;
}

const LOWER_IS_BETTER_PARAMS = [
  'Total Breakdown',
  'Avg Lead Time',
  'Avg Cost per Km',
  'Avg Purchase Cost'
];

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './performance.component.html',
  styleUrl: './performance.component.scss'
})
export class PerformanceComponent {
  isMillStats = false;
  openDropdown: string | null = null;
  selectedMill = 'E1';
  selectedSupplier = 'Supplier 1';
  selectedItem = 'Roll';
  selectedGrade = 'SS304';
  selectedRoll = 'WR';
  panelCollapsed = true;

  sortField: string = '';
  sortDir: 1 | -1 = 1;

  readonly millOptions = ['E1', 'R1', 'E2', 'R2', 'F1e', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'PR1', 'PR2', 'PR3'];
  readonly supplierOptions = ['Supplier 1', 'Supplier 3', 'Supplier 5'];
  readonly itemOptions = ['Roll', 'Choke'];
  readonly gradeOptions = ['SS304', 'SS316', 'MS', 'HSLA', 'IF Steel', 'API Grade'];
  readonly rollOptions = ['WR', 'BUR', 'Edger', 'Pinch'];

  readonly millStatsData: PerformanceData[] = [
    { parameter: 'Avg Rolled Length', units: 'Km', v1: 118.5, v2: 111.43, v3: 112.9 },
    { parameter: 'Avg Rolled Tonage', units: 'Ton/mm', v1: 180, v2: 175, v3: 170 },
    { parameter: 'Avg Utilization', units: '%', v1: 98, v2: 95, v3: 92 },
    { parameter: 'Avg Hourly Tonage', units: 'Ton/Hr', v1: 50, v2: 48, v3: 45 },
    { parameter: 'Total Breakdown', units: 'Count', v1: 2, v2: 3, v3: 4 },
    { parameter: 'Avg Coolant Conc', units: '%', v1: 80, v2: 85, v3: 90 },
    { parameter: 'Avg Purchase Cost', units: 'MINR', v1: 80, v2: 85, v3: 90 },
    { parameter: 'Avg Cycles', units: 'Count', v1: 10.2, v2: 9.9, v3: 8.6 },
    { parameter: 'Avg Lead Time', units: 'Months', v1: 8.9, v2: 7.2, v3: 9.5 },
    { parameter: 'Avg Cost per Km', units: 'MINR/Km', v1: 8.8, v2: 8.2, v3: 9.3 },
    { parameter: 'Ratings', units: '/10', v1: 9.2, v2: 8.8, v3: 7.9 }
  ];

  readonly supplierStatsData: PerformanceData[] = [
    { parameter: 'Avg Rolled Length', units: 'Km', v1: 118.5, v2: 111.43, v3: 112.9 },
    { parameter: 'Avg Rolled Tonage', units: 'Ton/mm', v1: 180, v2: 175, v3: 170 },
    { parameter: 'Avg Utilization', units: '%', v1: 98, v2: 95, v3: 92 },
    { parameter: 'Avg Hourly Tonage', units: 'Ton/Hr', v1: 50, v2: 48, v3: 45 },
    { parameter: 'Total Breakdown', units: 'Count', v1: 2, v2: 3, v3: 4 },
    { parameter: 'Avg Coolant Conc', units: '%', v1: 80, v2: 85, v3: 90 },
    { parameter: 'Avg Purchase Cost', units: 'MINR', v1: 80, v2: 85, v3: 90 },
    { parameter: 'Avg Cycles', units: 'Count', v1: 10.2, v2: 9.9, v3: 8.6 },
    { parameter: 'Avg Lead Time', units: 'Months', v1: 8.9, v2: 7.2, v3: 9.5 },
    { parameter: 'Avg Cost per Km', units: 'MINR/Km', v1: 8.8, v2: 8.2, v3: 9.3 },
    { parameter: 'Ratings', units: '/10', v1: 9.5, v2: 8.5, v3: 7.5 }
  ];

  get dynamicLabel(): string {
    return this.isMillStats ? 'MILL' : 'SUPPLIER';
  }

  get currentHeaders(): string[] {
    if (this.isMillStats) {
      return ['Mill 1', 'Mill 2', 'Mill 3'];
    } else {
      return ['Supplier 1', 'Supplier 3', 'Supplier 5'];
    }
  }

  get currentData(): PerformanceData[] {
    return this.isMillStats ? this.millStatsData : this.supplierStatsData;
  }

  get sortedData(): PerformanceData[] {
    if (!this.sortField) return [...this.currentData];
    return [...this.currentData].sort((a, b) => {
      let va: any;
      let vb: any;

      if (this.sortField === 'parameter') {
        va = a.parameter;
        vb = b.parameter;
      } else if (this.sortField === 'units') {
        va = a.units;
        vb = b.units;
      } else if (this.sortField === 'v1') {
        va = a.v1;
        vb = b.v1;
      } else if (this.sortField === 'v2') {
        va = a.v2;
        vb = b.v2;
      } else if (this.sortField === 'v3') {
        va = a.v3;
        vb = b.v3;
      } else {
        return 0;
      }

      if (va === vb) return 0;
      if (typeof va === 'number' && typeof vb === 'number') {
        return this.sortDir * (va - vb);
      }
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return this.sortDir * (cmp < 0 ? -1 : 1);
    });
  }

  toggleMode(): void {
    this.isMillStats = !this.isMillStats;
    this.sortField = '';
    this.sortDir = 1;
  }

  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = (this.sortDir === 1 ? -1 : 1) as 1 | -1;
    } else {
      this.sortField = field;
      this.sortDir = 1;
    }
  }

  getStars(val: number): string {
    const stars = Math.round(val / 2);
    const filled = '★'.repeat(Math.min(stars, 5));
    const empty = '☆'.repeat(5 - Math.min(stars, 5));
    return filled + empty;
  }

  getValueColor(row: PerformanceData, col: 'v1' | 'v2' | 'v3'): string {
    const vals = [row.v1, row.v2, row.v3].map(Number).filter(v => !isNaN(v));
    if (vals.length === 0) return '#E8F0FE';
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const val = Number(row[col]);
    if (!Number.isFinite(val)) return '#E8F0FE';
    const upperBound = avg * 1.05;
    const lowerBound = avg * 0.95;
    const isLowerBetter = LOWER_IS_BETTER_PARAMS.includes(row.parameter);

    if (isLowerBetter) {
      if (val < lowerBound) return '#00E5A0';
      if (val > upperBound) return '#FF4560';
      return '#FF8C42';
    } else {
      if (val > upperBound) return '#00E5A0';
      if (val < lowerBound) return '#FF4560';
      return '#FF8C42';
    }
  }

  toggleDropdown(name: string): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  @HostListener('document:click')
  closeAll(): void {
    this.openDropdown = null;
  }

  selectMill(opt: string): void {
    this.selectedMill = opt;
    this.openDropdown = null;
  }

  selectSupplier(opt: string): void {
    this.selectedSupplier = opt;
    this.openDropdown = null;
  }

  selectItem(opt: string): void {
    this.selectedItem = opt;
    this.openDropdown = null;
  }

  selectGrade(opt: string): void {
    this.selectedGrade = opt;
    this.openDropdown = null;
  }

  selectRoll(opt: string): void {
    this.selectedRoll = opt;
    this.openDropdown = null;
  }
}
