import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { DatetimePickerComponent } from '../../shared/components/datetime-picker/datetime-picker.component';

export interface IndirectCostEntry {
  date: string;
  rollId: string;
  activity: string;
  duration: number;
  cost: number;
  remarks: string;
}

export interface ConditionRecord {
  date: string;
  rollId: string;
  stand: string;
  spall: string;
  crack: string;
  circulation: string;
  surface: string;
  remarks: string;
}

@Component({
  selector: 'app-cost-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule, DatetimePickerComponent],
  templateUrl: './cost-analysis.component.html',
  styleUrl: './cost-analysis.component.scss'
})
export class CostAnalysisComponent implements OnInit {
  openEntryForm = false;
  showConditionForm = false;
  accordionCollapsed = true;
  openDropdown: string | null = null;

  selectedMill = 'Mill 1';
  selectedRollType = 'WR';
  selectedSupplier = 'Supplier 1';
  selectedPeriod = 'Monthly';

  readonly millOptions = ['Mill 1', 'Mill 2', 'Mill 3'];
  readonly rollTypeOptions = ['WR', 'BUR', 'IMR', 'Edger Roll', 'Pinch Roll'];
  readonly supplierOptions = ['Supplier 1', 'Supplier 2', 'Supplier 3', 'Supplier 4', 'Supplier 5'];
  readonly periodOptions = ['Current Shift', 'Daily', 'Weekly', 'Monthly'];

  readonly stands = ['E1', 'R1', 'E2', 'R2', 'F1e', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'PR1', 'PR2', 'PR3'];
  readonly activityTypeOptions = [
    'Grinding', 'Polishing', 'Surface Treatment', 'Repair',
    'Roll Change', 'Preventive Maintenance', 'Other'
  ];
  readonly spallOptions = ['Yes', 'No', 'Partial'];
  readonly crackOptions = ['Yes', 'No', 'Surface Only', 'Deep'];
  readonly circulationOptions = ['Good', 'Average', 'Poor', 'Unfit'];
  readonly surfaceOptions = ['Normal', 'Rough', 'Smooth', 'Damaged'];

  // KPI values (for trend badge: current < avg => below average)
  kpiCostPerKm = { current: 0.52, best: 0.38, avg: 0.61 };
  kpiCostPerTon = { current: 0.85, best: 0.62, avg: 0.91 };
  kpiCostPerCampaign = { current: 14.5, best: 11.2, avg: 16.8 };

  entriesData: IndirectCostEntry[] = [
    { date: '19/02/2026 08:30', rollId: 'WR123', activity: 'Grinding', duration: 2, cost: 0.85, remarks: 'Surface grinding after 5th cycle' },
    { date: '18/02/2026 14:00', rollId: 'BUR354', activity: 'Polishing', duration: 1.5, cost: 0.45, remarks: 'Profile correction' },
    { date: '17/02/2026 10:15', rollId: 'IMR58', activity: 'Surface Treatment', duration: 3, cost: 1.2, remarks: 'Anti-wear coating applied' }
  ];

  conditionData: ConditionRecord[] = [
    { date: '19/02/2026 09:00', rollId: 'WR123', stand: 'F1', spall: 'No', crack: 'No', circulation: 'Good', surface: 'Normal', remarks: 'Normal wear pattern' },
    { date: '18/02/2026 15:30', rollId: 'BUR354', stand: 'F3', spall: 'Partial', crack: 'Surface Only', circulation: 'Average', surface: 'Rough', remarks: 'Minor surface degradation observed' },
    { date: '17/02/2026 11:00', rollId: 'ERO_898', stand: 'E1', spall: 'Yes', crack: 'No', circulation: 'Poor', surface: 'Damaged', remarks: 'Immediate inspection needed' },
    { date: '16/02/2026 08:45', rollId: 'IRO_228', stand: 'F5', spall: 'No', crack: 'No', circulation: 'Good', surface: 'Normal', remarks: 'Post grinding check OK' }
  ];

  newEntry: {
    rollId: string;
    activity: string;
    cost: number | undefined;
    date: string;
    duration: number | undefined;
    remarks: string;
  } = {
    rollId: '',
    activity: 'Grinding',
    cost: undefined,
    date: '',
    duration: undefined,
    remarks: ''
  };

  conditionForm: {
    rollId: string;
    stand: string;
    date: string;
    spall: string;
    crack: string;
    circulation: string;
    surface: string;
    remarks: string;
  } = {
    rollId: '',
    stand: 'E1',
    date: '',
    spall: 'No',
    crack: 'No',
    circulation: 'Good',
    surface: 'Normal',
    remarks: ''
  };

  supplierChartOptions: EChartsOption = {};
  trendChartOptions: EChartsOption = {};
  correlationChartOptions: EChartsOption = {};

  get totalIndirectCost(): number {
    return this.entriesData.reduce((sum, e) => sum + e.cost, 0);
  }

  get kpi1BelowAvg(): boolean {
    return this.kpiCostPerKm.current < this.kpiCostPerKm.avg;
  }
  get kpi2BelowAvg(): boolean {
    return this.kpiCostPerTon.current < this.kpiCostPerTon.avg;
  }
  get kpi3BelowAvg(): boolean {
    return this.kpiCostPerCampaign.current < this.kpiCostPerCampaign.avg;
  }

  ngOnInit(): void {
    this.buildSupplierChart();
    this.buildTrendChart();
    this.buildCorrelationChart();
  }

  private buildSupplierChart(): void {
    this.supplierChartOptions = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,26,46,0.95)',
        borderColor: 'rgba(0,212,255,0.2)',
        textStyle: { color: '#E8F0FE' }
      },
      legend: {
        top: 10,
        textStyle: { color: '#7B90B8' },
        data: ['Cost/Km', 'Cost/Ton', 'Best Avg Line']
      },
      grid: { left: 55, right: 55, top: 45, bottom: 35, containLabel: true },
      xAxis: {
        type: 'category',
        data: ['Supplier 1', 'Supplier 2', 'Supplier 3', 'Supplier 4', 'Supplier 5', 'Supplier 6', 'Supplier 7', 'Supplier 8', 'Supplier 9', 'Supplier 10'],
        axisLabel: { color: '#7B90B8' },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitLine: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Cost/Km (MINR)',
          nameTextStyle: { color: '#7B90B8' },
          axisLabel: { color: '#7B90B8' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
        },
        {
          type: 'value',
          name: 'Cost/Ton',
          nameTextStyle: { color: '#A78BFA' },
          axisLabel: { color: '#A78BFA' },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Cost/Km',
          type: 'bar',
          yAxisIndex: 0,
          data: [0.61, 0.58, 0.55, 0.51, 0.59, 0.63, 0.65, 0.68, 0.70, 0.72],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#1565C0' },
                { offset: 1, color: '#42A5F5' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: 16
        },
        {
          name: 'Cost/Ton',
          type: 'bar',
          yAxisIndex: 1,
          data: [0.85, 0.80, 0.75, 0.70, 0.82, 0.90, 0.88, 0.92, 0.95, 0.98],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#6A1B9A' },
                { offset: 1, color: '#AB47BC' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: 16
        },
        {
          name: 'Best Avg Line',
          type: 'line',
          yAxisIndex: 0,
          data: [0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52],
          lineStyle: { type: 'dashed', color: '#00E5A0', width: 2 },
          symbol: 'none'
        }
      ]
    };
  }

  private buildTrendChart(): void {
    this.trendChartOptions = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,26,46,0.95)',
        borderColor: 'rgba(0,212,255,0.2)',
        textStyle: { color: '#E8F0FE' }
      },
      legend: {
        textStyle: { color: '#7B90B8' },
        data: ['Cost/Km', 'Cost/Ton', 'Cost/Campaign']
      },
      grid: { left: 55, right: 30, top: 45, bottom: 35, containLabel: true },
      xAxis: {
        type: 'category',
        data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        axisLabel: { color: '#7B90B8' },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'Cost (MINR)',
        axisLabel: { color: '#7B90B8' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
      },
      series: [
        {
          name: 'Cost/Km',
          type: 'line',
          data: [0.58, 0.55, 0.62, 0.59, 0.61, 0.57, 0.63, 0.60, 0.58, 0.65, 0.61, 0.59],
          lineStyle: { color: '#00D4FF', width: 2.5 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0,212,255,0.15)' },
                { offset: 1, color: 'rgba(0,212,255,0)' }
              ]
            }
          },
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#00D4FF' }
        },
        {
          name: 'Cost/Ton',
          type: 'line',
          data: [0.82, 0.79, 0.85, 0.83, 0.87, 0.80, 0.88, 0.85, 0.82, 0.90, 0.86, 0.83],
          lineStyle: { color: '#A78BFA', width: 2.5 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(167,139,250,0.12)' },
                { offset: 1, color: 'rgba(167,139,250,0)' }
              ]
            }
          },
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#A78BFA' }
        },
        {
          name: 'Cost/Campaign',
          type: 'line',
          data: [13.5, 14.2, 13.8, 15.1, 14.5, 13.9, 15.8, 14.6, 13.2, 16.1, 15.0, 14.3],
          lineStyle: { color: '#FF8C42', width: 2.5 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255,140,66,0.1)' },
                { offset: 1, color: 'rgba(255,140,66,0)' }
              ]
            }
          },
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#FF8C42' }
        }
      ]
    };
  }

  private buildCorrelationChart(): void {
    const scatterData = [[0.61, 98], [0.58, 95], [0.55, 92], [0.51, 88], [0.59, 96], [0.63, 91], [0.65, 89], [0.68, 93], [0.70, 87], [0.72, 90]];
    const suppliers = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'];

    this.correlationChartOptions = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const d = params.data as number[];
          const i = params.dataIndex;
          return `Supplier ${i + 1}<br/>Cost/Km: ${d[0].toFixed(2)} MINR<br/>Utilization: ${d[1]}%`;
        },
        backgroundColor: 'rgba(15,26,46,0.95)',
        borderColor: 'rgba(0,212,255,0.2)',
        textStyle: { color: '#E8F0FE' }
      },
      grid: { left: 60, right: 40, top: 40, bottom: 45, containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Avg MINR/Km',
        min: 0.4,
        max: 0.8,
        axisLabel: { color: '#7B90B8' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        nameTextStyle: { color: '#7B90B8' }
      },
      yAxis: {
        type: 'value',
        name: 'Avg Utilization (%)',
        min: 85,
        max: 100,
        axisLabel: { color: '#7B90B8' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        nameTextStyle: { color: '#7B90B8' }
      },
      series: [
        {
          type: 'scatter',
          data: scatterData,
          symbolSize: (val: number[]) => (val[1] / 5) as number,
          itemStyle: {
            color: (params: any) => {
              const cost = (params.data as number[])[0];
              if (cost < 0.55) return '#00E5A0';
              if (cost < 0.65) return '#FF8C42';
              return '#FF4560';
            }
          },
          label: {
            show: true,
            formatter: (params: any) => suppliers[params.dataIndex],
            color: '#E8F0FE',
            fontSize: 11
          }
        }
      ]
    };
  }

  toggleDropdown(name: string): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  @HostListener('document:click')
  closeAll(): void {
    this.openDropdown = null;
  }

  selectMill(v: string): void { this.selectedMill = v; this.openDropdown = null; }
  selectRollType(v: string): void { this.selectedRollType = v; this.openDropdown = null; }
  selectSupplier(v: string): void { this.selectedSupplier = v; this.openDropdown = null; }
  selectPeriod(v: string): void { this.selectedPeriod = v; this.openDropdown = null; }

  addEntry(): void {
    const e = this.newEntry;
    if (!e.rollId || e.cost == null) return;
    this.entriesData.unshift({
      date: e.date ? this.formatEntryDate(e.date) : new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ''),
      rollId: e.rollId,
      activity: e.activity || 'Grinding',
      duration: e.duration ?? 0,
      cost: e.cost,
      remarks: e.remarks || ''
    });
    this.newEntry = { rollId: '', activity: 'Grinding', cost: undefined, date: '', duration: undefined, remarks: '' };
    this.openEntryForm = false;
  }

  private formatEntryDate(v: string): string {
    if (v.length >= 14) {
      const y = v.slice(0, 4), m = v.slice(4, 6), d = v.slice(6, 8), hh = v.slice(8, 10), mm = v.slice(10, 12);
      return `${d}/${m}/${y} ${hh}:${mm}`;
    }
    return v;
  }

  deleteEntry(i: number): void {
    this.entriesData.splice(i, 1);
  }

  saveCondition(): void {
    const c = this.conditionForm;
    if (!c.rollId || !c.date) return;
    this.conditionData.unshift({
      date: c.date.length >= 14 ? this.formatEntryDate(c.date) : c.date,
      rollId: c.rollId,
      stand: c.stand || 'E1',
      spall: c.spall || 'No',
      crack: c.crack || 'No',
      circulation: c.circulation || 'Good',
      surface: c.surface || 'Normal',
      remarks: c.remarks || ''
    });
    this.conditionForm = { rollId: '', stand: 'E1', date: '', spall: 'No', crack: 'No', circulation: 'Good', surface: 'Normal', remarks: '' };
    this.showConditionForm = false;
  }

  getOverallStatus(row: ConditionRecord): 'CRITICAL' | 'WARNING' | 'GOOD' {
    if (row.spall === 'Yes' || row.crack === 'Yes' || row.circulation === 'Poor' || row.circulation === 'Unfit') return 'CRITICAL';
    if (row.spall === 'Partial' || row.crack === 'Surface Only' || row.circulation === 'Average' || row.surface === 'Rough') return 'WARNING';
    return 'GOOD';
  }
}
