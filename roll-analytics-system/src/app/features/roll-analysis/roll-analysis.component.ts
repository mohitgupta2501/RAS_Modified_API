import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import * as echarts from 'echarts';
import { DatetimePickerComponent } from '../../shared/components/datetime-picker/datetime-picker.component';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridOptions } from 'ag-grid-community';

interface RollUsageData {
  cycleNo: number;
  stand: string;
  position: string;
  rolledLength: number;
  rolledWeight: number;
  cycleStartDate: string;
  cycleEndDate: string;
  diameterStart: number;
  diameterEnd: number;
  maintCost: number;
  remarks: string;
  spall: string;
  crack: string;
  uniformCirculation: string;
  fitForUse: string;
}

@Component({
  selector: 'app-roll-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule, DatetimePickerComponent, AgGridAngular],
  templateUrl: './roll-analysis.component.html',
  styleUrl: './roll-analysis.component.scss'
})
export class RollAnalysisComponent implements OnInit {
  // Breadcrumb + layout are static in template

  // Filter bar dropdown state
  openDropdown: string | null = null;

  readonly standOptions = ['R1', 'R2', 'F1-F4', 'F5-F7', 'Edger', 'Pinch'];
  readonly rollTypeOptions = ['WR', 'BUR'];
  rollIdOptions: string[] = ['WR123', 'WR456', 'VR789', 'BR001', 'BR002'];
  filteredRollIds: string[] = ['WR123', 'WR456', 'VR789', 'BR001', 'BR002'];
  rollIdSearchQuery: string = '';

  selectedStand = 'R1';
  selectedRollType = 'WR';
  selectedRollId = 'WR123';

  filters: { rollId: string } = { rollId: this.selectedRollId };

  // KPI mock data is rendered directly in template from hardcoded values

  // Charts
  diameterChartOptions: EChartsOption = {};
  utilizationChartOptions: EChartsOption = {};

  // Roll usage table + modal (copied pattern from Roll Details)
  activeTab: 'dia' | 'usage' = 'usage';
  showEditModal = false;
  showDefectModal = false;
  showToast = false;
  toastMessage = 'Cycle updated successfully';

  currentPage = 1;
  readonly itemsPerPage = 5;
  readonly totalPages = 1;

  rollUsageCurrentPage = 1;
  rollUsagePageSize = 10;
  rollUsageTotalRows = 0;

  readonly spallOptions = ['Yes', 'No'];
  readonly crackOptions = ['Yes', 'No'];
  readonly uniformCircOptions = ['Good', 'Average', 'Poor'];
  readonly fitForUseOptions = ['Yes', 'No'];

  rollUsageData: RollUsageData[] = [
		{
			cycleNo: 1,
			stand: 'F1',
			position: 'Top',
			rolledLength: 600,
			rolledWeight: 1251,
			cycleStartDate: '2025-01-11 08:00',
			cycleEndDate: '2025-01-15 16:30',
			diameterStart: 483,
			diameterEnd: 441,
			maintCost: 0.1,
			remarks: 'Normal wear',
			spall: 'No',
			crack: 'No',
			uniformCirculation: 'Good',
			fitForUse: 'Yes'
		},
		{
			cycleNo: 2,
			stand: 'F1',
			position: 'Top',
			rolledLength: 600,
			rolledWeight: 1180,
			cycleStartDate: '2025-01-17 06:00',
			cycleEndDate: '2025-01-20 18:30',
			diameterStart: 441,
			diameterEnd: 403,
			maintCost: 0.2,
			remarks: 'High usage',
			spall: 'Yes',
			crack: 'No',
			uniformCirculation: 'Average',
			fitForUse: 'Yes'
		},
		{
			cycleNo: 3,
			stand: 'F1',
			position: 'Bottom',
			rolledLength: 600,
			rolledWeight: 976,
			cycleStartDate: '2025-01-22 10:00',
			cycleEndDate: '2025-01-24 16:30',
			diameterStart: 403,
			diameterEnd: 389,
			maintCost: 0.2,
			remarks: 'High usage',
			spall: 'Yes',
			crack: 'Yes',
			uniformCirculation: 'Poor',
			fitForUse: 'Yes'
		},
		{
			cycleNo: 4,
			stand: 'F1',
			position: 'Bottom',
			rolledLength: 600,
			rolledWeight: 968,
			cycleStartDate: '2025-02-15 14:00',
			cycleEndDate: '2025-02-20 20:00',
			diameterStart: 389,
			diameterEnd: 361,
			maintCost: 0.3,
			remarks: 'High usage',
			spall: 'No',
			crack: 'Yes',
			uniformCirculation: 'Average',
			fitForUse: 'Yes'
		},
		{
			cycleNo: 5,
			stand: 'F1',
			position: 'Top',
			rolledLength: 500,
			rolledWeight: 890,
			cycleStartDate: '2025-03-15 12:00 ',
			cycleEndDate: '2025-03-20 16:00',
			diameterStart: 361,
			diameterEnd: 360,
			maintCost: 0.2,
			remarks: 'High usage',
			spall: 'No',
			crack: 'No',
			uniformCirculation: 'Good',
			fitForUse: 'No'
		}
	];

  get rollUsageTotalPages(): number {
    return Math.max(1, Math.ceil(this.rollUsageTotalRows / this.rollUsagePageSize));
  }

  get rollUsageStartRow(): number {
    if (this.rollUsageTotalRows === 0) return 0;
    return (this.rollUsageCurrentPage - 1) * this.rollUsagePageSize + 1;
  }

  get rollUsageEndRow(): number {
    if (this.rollUsageTotalRows === 0) return 0;
    return Math.min(this.rollUsageCurrentPage * this.rollUsagePageSize, this.rollUsageTotalRows);
  }

  get rollUsagePaginatedData() {
    const start = (this.rollUsageCurrentPage - 1) * this.rollUsagePageSize;
    return this.rollUsageRowData.slice(start, start + this.rollUsagePageSize);
  }

  rollUsageGoToPage(page: number): void {
    const total = this.rollUsageTotalPages;
    if (page < 1 || page > total) return;
    this.rollUsageCurrentPage = page;
  }

  rollUsageGetPageNumbers(): (number | '...')[] {
    const total = this.rollUsageTotalPages;
    const current = this.rollUsageCurrentPage;

    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | '...')[] = [];
    const showLeftEllipsis = current > 4;
    const showRightEllipsis = current < total - 3;

    pages.push(1);

    if (showLeftEllipsis) pages.push('...');

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let p = start; p <= end; p++) pages.push(p);

    if (showRightEllipsis) pages.push('...');

    pages.push(total);
    return pages;
  }

  onExportRollUsage(): void {
    const rows = this.rollUsageRowData;
    if (!rows || rows.length === 0) return;

    const columnDefs = this.rollUsageColumnDefs;
    const headers: string[] = [];
    const fields: string[] = [];

    for (const col of columnDefs) {
      const field = (col as any).field as string | undefined;
      if (!field) continue;
      fields.push(field);
      headers.push(((col as any).headerName ?? field) as string);
    }

    const escape = (val: unknown): string => {
      const s = val === null || val === undefined ? '' : String(val);
      const escaped = s.replace(/"/g, '""');
      return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
    };

    const csvLines: string[] = [];
    csvLines.push(headers.map(escape).join(','));
    for (const row of rows) {
      csvLines.push(fields.map((f) => escape((row as any)[f])).join(','));
    }

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roll-usage.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  rollUsageRowData = [
		{
			cycleNo: 1,
			stand: 'F1',
			position: 'Top',
			rolledLength: 600,
			rolledWeight: 1251,
			cycleStartDate: '2025-01-11 08:00',
			cycleEndDate: '2025-01-15 16:30',
			diameterStart: 483,
			diameterEnd: 441,
			maintCost: 0.1,
			remarks: 'Normal wear',
			spall: 'No',
			crack: 'No',
			uniformCirculation: 'Good',
			fitForUse: 'Yes'
		},
		{
			cycleNo: 2,
			stand: 'F1',
			position: 'Top',
			rolledLength: 600,
			rolledWeight: 1180,
			cycleStartDate: '2025-01-17 06:00',
			cycleEndDate: '2025-01-20 18:30',
			diameterStart: 441,
			diameterEnd: 403,
			maintCost: 0.2,
			remarks: 'High usage',
			spall: 'Yes',
			crack: 'No',
			uniformCirculation: 'Average',
			fitForUse: 'Yes'
		},
		{
			cycleNo: 3,
			stand: 'F1',
			position: 'Bottom',
			rolledLength: 600,
			rolledWeight: 976,
			cycleStartDate: '2025-01-22 10:00',
			cycleEndDate: '2025-01-24 16:30',
			diameterStart: 403,
			diameterEnd: 389,
			maintCost: 0.2,
			remarks: 'High usage',
			spall: 'Yes',
			crack: 'Yes',
			uniformCirculation: 'Poor',
			fitForUse: 'Yes'
		},
		{
			cycleNo: 4,
			stand: 'F1',
			position: 'Bottom',
			rolledLength: 600,
			rolledWeight: 968,
			cycleStartDate: '2025-02-15 14:00',
			cycleEndDate: '2025-02-20 20:00',
			diameterStart: 389,
			diameterEnd: 361,
			maintCost: 0.3,
			remarks: 'High usage',
			spall: 'No',
			crack: 'Yes',
			uniformCirculation: 'Average',
			fitForUse: 'Yes'
		},
		{
			cycleNo: 5,
			stand: 'F1',
			position: 'Top',
			rolledLength: 500,
			rolledWeight: 890,
			cycleStartDate: '2025-03-15 12:00 ',
			cycleEndDate: '2025-03-20 16:00',
			diameterStart: 361,
			diameterEnd: 360,
			maintCost: 0.2,
			remarks: 'High usage',
			spall: 'No',
			crack: 'No',
			uniformCirculation: 'Good',
			fitForUse: 'No'
		}
	];

  readonly rollUsageColumnDefs: ColDef[] = [
		{
			headerName: 'CYCLE',
			field: 'cycleNo',
			width: 100,
			pinned: 'left',
			cellRenderer: (params: any) =>
				`<span style="color:#00D4FF;font-weight:700;font-size:14px">${params.value}</span>`
		},
		{
			headerName: 'STAND',
			field: 'stand',
			width: 100,
			cellStyle: {
				color: '#FFF',
				fontSize: '13px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center'
			}
		},
		{
			headerName: 'POSITION',
			field: 'position',
			width: 110
			// cellRenderer: (params: any) => {
			// 	const color = params.value === 'Top' ? '#00D4FF' : '#A78BFA';
			// 	return `<span style="color:${color};font-weight:600;font-size:13px">${params.value}</span>`;
			// }
		},
		{
			headerName: 'ROLLED LENGTH (KM)',
			field: 'rolledLength',
			width: 130,
			cellStyle: {
				color: '#FFF',
				fontWeight: '700',
				fontSize: '13px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center'
			}
		},
		{
			headerName: 'ROLLED WEIGHT (TONS)',
			field: 'rolledWeight',
			width: 130,
			cellStyle: {
				color: '#FFF',
				fontWeight: '700',
				fontSize: '13px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center'
			}
		},
		{
			headerName: 'CYCLE START DATE',
			field: 'cycleStartDate',
			width: 150,
			cellStyle: {
				color: '#FFF',
				fontSize: '13px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center'
			}
		},
		{
			headerName: 'CYCLE END DATE',
			field: 'cycleEndDate',
			width: 140,
			cellStyle: {
				color: '#FFF',
				fontSize: '13px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center'
			}
		},
		{
			headerName: 'IN DIAMETER (MM)',
			field: 'diameterStart',
			width: 145
			// cellRenderer: (params: any) =>
			// 	`<span style="color:#00E5A0;font-weight:600;font-size:13px">${params.value}</span>`
		},
		{
			headerName: 'OUT DIAMETER (MM)',
			field: 'diameterEnd',
			width: 135
			// cellRenderer: (params: any) =>
			// 	`<span style="color:#FF8C42;font-weight:600;font-size:13px">${params.value}</span>`
		},
		{
			headerName: 'MAINT COST (MINR)',
			field: 'maintCost',
			width: 150
			// cellRenderer: (params: any) =>
			// 	`<span style="color:#FF4560;font-weight:600;font-size:13px">${params.value}</span>`
		},
		{
			headerName: 'REMARKS',
			field: 'remarks',
			flex: 1,
			minWidth: 120,
			cellStyle: {
				color: '#FFF',
				fontSize: '13px',
				display: 'flex',
				alignItems: 'center'
			}
		},
		{
			headerName: 'SPALL',
			field: 'spall',
			width: 90
			// cellRenderer: (params: any) => {
			// 	const isYes = params.value === 'Yes';
			// 	const color = isYes ? '#FF4560' : '#00E5A0';
			// 	return `<span style="color:${color};font-weight:600;font-size:13px">${params.value}</span>`;
			// }
		},
		{
			headerName: 'CRACK',
			field: 'crack',
			width: 90
			// cellRenderer: (params: any) => {
			// 	const isYes = params.value === 'Yes';
			// 	const color = isYes ? '#FF4560' : '#00E5A0';
			// 	return `<span style="color:${color};font-weight:600;font-size:13px">${params.value}</span>`;
			// }
		},
		{
			headerName: 'UNIFORM CIRCULATION',
			field: 'uniformCirculation',
			width: 170
			// cellRenderer: (params: any) => {
			// 	const colorMap: any = {
			// 		Good: '#00E5A0',
			// 		Average: '#FF8C42',
			// 		Poor: '#FF4560'
			// 	};
			// 	const color = colorMap[params.value] || '#FFF';
			// 	return `<span style="color:${color};font-weight:600;font-size:13px">${params.value}</span>`;
			// }
		},
		{
			headerName: 'FIT FOR USE',
			field: 'fitForUse',
			width: 110,
			pinned: 'right',
			cellRenderer: (params: any) => {
				const isYes = params.value === 'Yes';
				const color = isYes ? '#00E5A0' : '#FF4560';
				return `<span style="color:${color};font-weight:600;font-size:13px">${params.value}</span>`;
			}
		}
	];

  readonly defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    suppressMovable: true,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '13px',
      color: '#ffffff',
      padding: '0 16px',
      lineHeight: '1.4'
    }
  };

  readonly gridOptions: GridOptions = {
    rowHeight: 52,
    headerHeight: 44,
    domLayout: 'autoHeight',
    suppressCellFocus: true,
    pagination: true,
    paginationPageSize: 10,
    suppressPaginationPanel: true,
    suppressHorizontalScroll: false,
    suppressColumnVirtualisation: true,
    rowClass: 'custom-row'
  };

  editCycleData = {
    rolledLength: null as number | null,
    maintCost: null as number | null,
    rollChangeTime: '',
    remarks: ''
  };

  defectForm = {
    spall: 'No',
    crack: 'No',
    uniformCirculation: 'Good',
    fitForUse: 'No'
  };

  openDefectDropdown: string | null = null;

  ngOnInit(): void {
    this.rollUsageTotalRows = this.rollUsageRowData.length;
    this.buildDiameterChart();
    this.buildUtilizationChart();
  }

  private buildDiameterChart(): void {
    this.diameterChartOptions = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 26, 46, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.2)',
        textStyle: { color: '#E8F0FE' }
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#7B90B8' }
      },
      grid: {
        left: '6%',
        right: '6%',
        top: '10%',
        bottom: '16%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
        axisLabel: { color: '#7B90B8' },
        axisLine: { lineStyle: { color: '#1A2844' } }
      },
      yAxis: [
        {
          type: 'value',
          nameTextStyle: { color: '#7B90B8' },
          axisLabel: { color: '#7B90B8', formatter: (value: number) => `${value} mm` },     
          splitLine: { lineStyle: { color: 'rgba(26,40,68,0.8)' } }
        },
        {
          type: 'value',
          nameTextStyle: { color: '#7B90B8' },
          axisLabel: { color: '#7B90B8', formatter: (value: number) => `${value} Tons` },
          splitLine: { show: false },
          position: 'right'
        }
      ],
      series: [
        {
          name: 'Diameter',
          type: 'bar',
          emphasis: { focus: 'series' },
          data: [3000, 2760, 2510, 2280, 2020, 1775, 1520],
          itemStyle: { color: '#3b82f6' },
          yAxisIndex: 0
        },
        {
          name: 'New Diameter',
          type: 'bar',
          stack: 'Ad',
          emphasis: { focus: 'series' },
          data: [2760, 2510, 2280, 2020, 1775, 1520, 1285],
          itemStyle: { color: '#84cc16' },
          yAxisIndex: 0
        },
        {
          name: 'Grind',
          type: 'bar',
          stack: 'Ad',
          emphasis: { focus: 'series' },
          data: [35, 40, 25, 45, 30, 30, 28],
          itemStyle: { color: '#6b7280' },
          yAxisIndex: 0
        },
        {
          name: 'Wear',
          type: 'bar',
          stack: 'Ad',
          emphasis: { focus: 'series' },
          data: [205, 210, 205, 215, 215, 225, 207],
          itemStyle: { color: '#FF8C42' },
          yAxisIndex: 0
        },
        {
          name: 'Rolled TON',
          type: 'line',
          yAxisIndex: 1,
          data: [1251, 1180, 976, 968, 890, 820, 750],
          lineStyle: { color: '#00D4FF', width: 2 },
          itemStyle: { color: '#00D4FF' },
          symbol: 'circle',
          symbolSize: 6,
          smooth: true
        }
      ]
    };
  }

  private buildUtilizationChart(): void {
    this.utilizationChartOptions = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 26, 46, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.2)',
        textStyle: { color: '#E8F0FE' }
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#7B90B8' }
      },
      grid: {
        left: '6%',
        right: '6%',
        top: '10%',
        bottom: '16%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
        axisLabel: { color: '#7B90B8' },
        axisLine: { lineStyle: { color: '#1A2844' } }
      },
      yAxis: {
        type: 'value',
        nameTextStyle: { color: '#7B90B8' },
        min: 0,
        max: 100,
        axisLabel: {
          color: '#7B90B8',
          formatter: '{value}%'
        },
        splitLine: { lineStyle: { color: 'rgba(26,40,68,0.8)' } }
      },
      series: [
        {
          name: 'Utilization',
          type: 'line',
          smooth: true,
          data: [73, 70, 90, 85, 77, 95, 80],
          lineStyle: { color: '#00D4FF', width: 2 },
          itemStyle: { color: '#00D4FF' },
          symbol: 'circle',
          symbolSize: 6,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,212,255,0.2)' },
              { offset: 1, color: 'rgba(0,212,255,0.0)' }
            ])
          }
        }
      ]
    };
  }

  // Dropdown helpers
  toggleDropdown(name: string): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  toggleFilterDropdown(name: 'rollId'): void {
    if (this.openDropdown === name) {
      this.openDropdown = null;
      this.resetRollIdSearch();
      return;
    }

    this.openDropdown = name;
    if (name === 'rollId') {
      this.filteredRollIds = [...this.rollIdOptions];
      this.rollIdSearchQuery = '';
    }
  }

  onRollIdSearchInput(value: string): void {
    this.rollIdSearchQuery = value;
    const q = value.trim().toLowerCase();
    if (!q) {
      this.filteredRollIds = [...this.rollIdOptions];
      return;
    }
    this.filteredRollIds = this.rollIdOptions.filter((id) => id.toLowerCase().includes(q));
  }

  private resetRollIdSearch(): void {
    this.rollIdSearchQuery = '';
    this.filteredRollIds = [...this.rollIdOptions];
  }

  selectStand(stand: string): void {
    this.selectedStand = stand;
    this.openDropdown = null;
  }

  selectRollType(type: string): void {
    this.selectedRollType = type;
    this.openDropdown = null;
  }

  selectFilterOption(field: 'rollId', value: string): void {
    this.selectedRollId = value;
    this.filters.rollId = value;
    this.openDropdown = null;
    this.resetRollIdSearch();
  }

  toggleDefectDropdown(name: string, event: Event): void {
    event.stopPropagation();
    this.openDefectDropdown = this.openDefectDropdown === name ? null : name;
  }

  selectDefectOption(
    field: 'spall' | 'crack' | 'uniformCirculation' | 'fitForUse',
    value: string,
    event: Event
  ): void {
    event.stopPropagation();
    this.defectForm[field] = value as any;
    this.openDefectDropdown = null;
  }

  // Roll usage edit modal
  openEditModal(): void {
    const lastRow = this.rollUsageData[this.rollUsageData.length - 1];
    this.editCycleData = {
      rolledLength: lastRow.rolledLength,
      maintCost: lastRow.maintCost,
      rollChangeTime:
        (lastRow as RollUsageData & { rollChangeTime?: string }).rollChangeTime ?? '',
      remarks: lastRow.remarks
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.resetEditForm();
  }

  private resetEditForm(): void {
    this.editCycleData = {
      rolledLength: null,
      maintCost: null,
      rollChangeTime: '',
      remarks: ''
    };
  }

  saveEdit(): void {
    const lastIndex = this.rollUsageData.length - 1;
    const lastRow = this.rollUsageData[lastIndex];

    this.rollUsageData[lastIndex] = {
      ...lastRow,
      rolledLength: this.editCycleData.rolledLength ?? lastRow.rolledLength,
      maintCost: this.editCycleData.maintCost ?? lastRow.maintCost,
      remarks: this.editCycleData.remarks
    };
    this.showEditModal = false;
    this.toastMessage = 'Cycle updated successfully';
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3500);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!(event.target as HTMLElement).closest('.custom-select')) {
      this.openDropdown = null;
    }
  }

  // Defect modal
  openDefectModal(): void {
    this.showDefectModal = true;
    this.openDefectDropdown = null;
  }

  closeDefectModal(): void {
    this.showDefectModal = false;
    this.openDefectDropdown = null;
  }

  saveDefect(): void {
    this.closeDefectModal();
    this.toastMessage = 'Defect logged successfully';
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
      this.toastMessage = 'Cycle updated successfully';
    }, 3500);
  }
}

