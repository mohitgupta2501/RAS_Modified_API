import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

export interface RollSupplierRow {
  rollId: string;
  rollType: string;
  poDelivery: string;
  actualDelivery: string;
  price: number;
  remarks: string;
  stripBreakage: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  activeTab = 'diameter';
  showBreakageModal = false;
  selectedRollId = '';
  openDropdown: string | null = null;
  selectedItem = 'Roll';
  selectedLocation = 'E1';
  selectedRoll = 'Edger Roll';
  selectedPosition = 'Drive Side';
  selectedSupplier = 'Supplier 1';
  searchQuery = '';

  readonly itemOptions = ['Roll', 'Chock'];
  readonly locationOptions = ['E1', 'R1', 'E2', 'R2', 'F1e', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'PR1', 'PR2', 'PR3'];
  readonly rollOptions = ['Edger Roll', 'WR', 'BUR', 'Pinch Roll'];
  readonly positionOptions = ['Drive Side', 'Operator Side', 'Top', 'Bottom'];

  diameterChartOptions: EChartsOption = {};
  costChartOptions: EChartsOption = {};

  currentPage = 1;
  readonly itemsPerPage = 10;
  totalPages = 1;

  readonly supplierOptions = [
    'Supplier 1', 'Supplier 2', 'Supplier 3', 'Supplier 4', 'Supplier 5',
    'Supplier 6', 'Supplier 7', 'Supplier 8', 'Supplier 9', 'Supplier 10'
  ];

  rollSupplierData: RollSupplierRow[] = [
    {
      rollId: 'WR123',
      rollType: 'WR',
      poDelivery: '2025-03-11',
      actualDelivery: '2025-01-15',
      price: 14.5,
      remarks: 'Warranty 18 month from delivery',
      stripBreakage: true
    },
    {
      rollId: 'IMR58',
      rollType: 'IMR',
      poDelivery: '2025-02-16',
      actualDelivery: '2025-05-20',
      price: 13.7,
      remarks: 'Warranty 18 month from usage starts',
      stripBreakage: true
    },
    {
      rollId: 'BUR354',
      rollType: 'BUR',
      poDelivery: '2025-02-16',
      actualDelivery: '2025-05-20',
      price: 94.2,
      remarks: 'Warranty 18 month from delivery',
      stripBreakage: true
    },
    {
      rollId: 'BUR054',
      rollType: 'BUR',
      poDelivery: '2025-02-16',
      actualDelivery: '2025-03-20',
      price: 96.1,
      remarks: 'Buy back of used roll',
      stripBreakage: true
    },
    {
      rollId: 'IMR516',
      rollType: 'IMR',
      poDelivery: '2025-02-16',
      actualDelivery: '2025-01-20',
      price: 11.9,
      remarks: 'Max. operating temp. 110 degree cels.',
      stripBreakage: true
    }
  ];

  ngOnInit(): void {
    this.totalPages = Math.max(1, Math.ceil(this.rollSupplierData.length / this.itemsPerPage));
    this.buildDiameterChartOptions();
    this.buildCostChartOptions();
  }

  private buildDiameterChartOptions(): void {
    this.diameterChartOptions = {
      backgroundColor: 'transparent',
      legend: {
        data: ['Current Dia.(mm)', 'Best Dia.(mm)', 'Current Roll(%)', 'Best Roll(%)'],
        textStyle: { color: '#7B90B8' },
        top: 0
      },
      grid: { left: 60, right: 60, top: 50, bottom: 50, containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 26, 46, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.2)',
        textStyle: { color: '#E8F0FE' }
      },
      xAxis: {
        type: 'category',
        data: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
        name: 'Cycles',
        nameLocation: 'middle',
        nameGap: 28,
        axisLabel: { color: '#7B90B8' },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitLine: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Utilization (%)',
          min: 0,
          max: 100,
          axisLabel: { color: '#7B90B8' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
          axisLine: { show: false }
        },
        {
          type: 'value',
          name: 'Diameter (mm)',
          min: 360,
          max: 470,
          axisLabel: { color: '#7B90B8' },
          splitLine: { show: false },
          axisLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Current Dia.(mm)',
          type: 'bar',
          yAxisIndex: 1,
          data: [460, 440, 412, 398, 382, '-', '-', '-', '-', '-'],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#7B1FA2' },
                { offset: 1, color: '#9C27B0' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: 18,
          barGap: '10%'
        },
        {
          name: 'Best Dia.(mm)',
          type: 'bar',
          yAxisIndex: 1,
          data: [462, 448, 430, 418, 408, 420, 430, 445, 458, 465],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#2E7D32' },
                { offset: 1, color: '#4CAF50' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: 18
        },
        {
          name: 'Current Roll(%)',
          type: 'line',
          yAxisIndex: 0,
          data: ['-', '-', '-', '-', 40, '-', '-', '-', '-', '-'],
          lineStyle: { color: '#1565C0', width: 2.5 },
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: '#2196F3' },
          smooth: false
        },
        {
          name: 'Best Roll(%)',
          type: 'line',
          yAxisIndex: 0,
          data: [6, 12, 20, 30, 45, 58, 72, 82, 90, 96],
          lineStyle: { color: '#2E7D32', width: 2, type: 'solid' },
          symbol: 'emptyCircle',
          symbolSize: 8,
          itemStyle: { color: '#4CAF50' },
          smooth: false
        }
      ]
    };
  }

  private buildCostChartOptions(): void {
    this.costChartOptions = {
      backgroundColor: 'transparent',
      legend: {
        data: ['Best Avg MINR/Km', 'Avg MINR/Km', 'Avg Cost(MINR)', 'Avg Lead Team(Months)'],
        textStyle: { color: '#7B90B8' },
        top: 0
      },
      grid: { left: 60, right: 60, top: 50, bottom: 50, containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 26, 46, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.2)',
        textStyle: { color: '#E8F0FE' }
      },
      xAxis: {
        type: 'category',
        data: [
          'Supplier 1', 'Supplier 2', 'Supplier 3', 'Supplier 4', 'Supplier 5',
          'Supplier 6', 'Supplier 7', 'Supplier 8', 'Supplier 9', 'Supplier 10'
        ],
        axisLabel: { color: '#7B90B8', rotate: 30 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitLine: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Cost/km',
          min: 0,
          max: 0.8,
          axisLabel: { color: '#7B90B8' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
          axisLine: { show: false }
        },
        {
          type: 'value',
          name: 'Cost/Cycle',
          min: 11,
          max: 20.5,
          axisLabel: { color: '#7B90B8' },
          splitLine: { show: false },
          axisLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Best Avg MINR/Km',
          type: 'line',
          yAxisIndex: 0,
          data: [0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52],
          lineStyle: { type: 'dashed', color: '#1565C0', width: 2 },
          symbol: 'emptyCircle',
          symbolSize: 6,
          itemStyle: { color: '#2196F3' }
        },
        {
          name: 'Avg MINR/Km',
          type: 'bar',
          yAxisIndex: 0,
          data: [0.61, 0.58, 0.55, 0.51, 0.59, 0.63, 0.65, 0.68, 0.7, 0.72],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#1565C0' },
                { offset: 1, color: '#1976D2' }
              ]
            }
          },
          barWidth: 16,
          barGap: '5%'
        },
        {
          name: 'Avg Cost(MINR)',
          type: 'bar',
          yAxisIndex: 0,
          data: [0.5, 0.36, 0.05, 0.23, 0.64, 0.76, 0.57, 0.41, 0.25, 0.59],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#E65100' },
                { offset: 1, color: '#FF9800' }
              ]
            }
          },
          barWidth: 16
        },
        {
          name: 'Avg Lead Team(Months)',
          type: 'bar',
          yAxisIndex: 1,
          data: [19.0, 18.5, 18.0, 18.0, 18.0, 19.0, 17.5, 18.5, 19.0, 20.0],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#6A1B9A' },
                { offset: 1, color: '#9C27B0' }
              ]
            }
          },
          barWidth: 16
        }
      ]
    };
  }

  openBreakageModal(rollId: string): void {
    this.selectedRollId = rollId;
    this.showBreakageModal = true;
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  isDeliveryLate(row: RollSupplierRow): boolean {
    return new Date(row.actualDelivery) > new Date(row.poDelivery);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  toggleDropdown(name: string): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  @HostListener('document:click')
  closeAll(): void {
    this.openDropdown = null;
  }

  selectItem(opt: string): void {
    this.selectedItem = opt;
    this.openDropdown = null;
  }

  selectLocation(opt: string): void {
    this.selectedLocation = opt;
    this.openDropdown = null;
  }

  selectRoll(opt: string): void {
    this.selectedRoll = opt;
    this.openDropdown = null;
  }

  selectPosition(opt: string): void {
    this.selectedPosition = opt;
    this.openDropdown = null;
  }

  selectSupplier(s: string): void {
    this.selectedSupplier = s;
    this.openDropdown = null;
  }
}
