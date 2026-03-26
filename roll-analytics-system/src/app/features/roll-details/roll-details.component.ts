import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { DatetimePickerComponent } from '../../shared/components/datetime-picker/datetime-picker.component';

interface RollUsageData {
  cycleNo: number;
  plant: string;
  position: string;
  rolledLength: number;
  startDate: string;
  endDate: string;
  diaStart: number;
  diaEnd: number;
  maintCost: number;
  remarks: string;
  spall: string;
  crack: string;
  uniformCirc: string;
  fitForUse: string;
}

@Component({
  selector: 'app-roll-details',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule, DatetimePickerComponent],
  templateUrl: './roll-details.component.html',
  styleUrl: './roll-details.component.scss'
})
export class RollDetailsComponent implements OnInit {
  activeTab = 'dia';
  showEditModal = false;
  openDropdown: string | null = null;
  
  selectedMill = 'E1';
  selectedRoll = 'WR';
  selectedPosition = 'Top';
  
  currentPage = 1;
  readonly itemsPerPage = 5;
  readonly totalPages = 1;

  readonly millOptions = ['E1', 'R1', 'E2', 'R2', 'F1e', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'PR1', 'PR2', 'PR3'];
  readonly rollOptions = ['WR', 'BUR', 'EDGER', 'PINCH'];
  readonly positionOptions = ['Top', 'Bottom'];
  readonly spallOptions = ['Yes', 'No'];
  readonly crackOptions = ['Yes', 'No'];
  readonly uniformCircOptions = ['Good', 'Average', 'Poor'];
  readonly fitForUseOptions = ['Yes', 'No'];

  rollUsageData: RollUsageData[] = [
    {
      cycleNo: 1,
      plant: 'Mill 1',
      position: 'Top',
      rolledLength: 600,
      startDate: '2025-03-11',
      endDate: '2025-01-15',
      diaStart: 483,
      diaEnd: 441,
      maintCost: 0.1,
      remarks: 'Normal wear',
      spall: 'No',
      crack: 'No',
      uniformCirc: 'Good',
      fitForUse: 'Yes'
    },
    {
      cycleNo: 2,
      plant: 'Mill 1',
      position: 'Top',
      rolledLength: 600,
      startDate: '2025-03-15',
      endDate: '2025-01-20',
      diaStart: 441,
      diaEnd: 403,
      maintCost: 0.2,
      remarks: 'High usage',
      spall: 'Yes',
      crack: 'No',
      uniformCirc: 'Average',
      fitForUse: 'Yes'
    },
    {
      cycleNo: 3,
      plant: 'Mill 1',
      position: 'Bottom',
      rolledLength: 600,
      startDate: '2025-02-18',
      endDate: '2025-01-20',
      diaStart: 403,
      diaEnd: 389,
      maintCost: 0.2,
      remarks: 'High usage',
      spall: 'Yes',
      crack: 'Yes',
      uniformCirc: 'Poor',
      fitForUse: 'Yes'
    },
    {
      cycleNo: 4,
      plant: 'Mill 1',
      position: 'Bottom',
      rolledLength: 600,
      startDate: '2025-02-15',
      endDate: '2025-01-20',
      diaStart: 389,
      diaEnd: 361,
      maintCost: 0.3,
      remarks: 'High usage',
      spall: 'No',
      crack: 'Yes',
      uniformCirc: 'Average',
      fitForUse: 'Yes'
    },
    {
      cycleNo: 5,
      plant: 'Mill 1',
      position: 'Top',
      rolledLength: 500,
      startDate: '2025-03-15',
      endDate: '2025-01-20',
      diaStart: 361,
      diaEnd: 360,
      maintCost: 0.2,
      remarks: 'High usage',
      spall: 'No',
      crack: 'No',
      uniformCirc: 'Good',
      fitForUse: 'No'
    }
  ];

  editForm: RollUsageData & { rollChangeTime: string } = {
    cycleNo: 0,
    plant: '',
    position: '',
    rolledLength: 0,
    startDate: '',
    endDate: '',
    diaStart: 0,
    diaEnd: 0,
    maintCost: 0,
    remarks: '',
    spall: '',
    crack: '',
    uniformCirc: '',
    fitForUse: '',
    rollChangeTime: ''
  };

  chartOptions: EChartsOption = {};

  ngOnInit(): void {
    this.initChart();
  }

  initChart(): void {
    this.chartOptions = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 26, 46, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.2)',
        textStyle: {
          color: '#E8F0FE'
        }
      },
      legend: {
        data: ['Current Roll Dia(mm)', 'Avg Grinding(mm)'],
        textStyle: {
          color: '#7B90B8'
        },
        top: 10
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        name: 'Cycles',
        nameLocation: 'middle',
        nameGap: 25,
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        axisLabel: {
          color: '#7B90B8'
        },
        splitLine: {
          show: false
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Diameter(mm)',
          min: 360,
          max: 470,
          axisLabel: {
            color: '#7B90B8'
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.05)'
            }
          },
          nameTextStyle: {
            color: '#7B90B8'
          }
        },
        {
          type: 'value',
          name: 'Avg Grinding(mm)',
          min: 10,
          max: 40,
          axisLabel: {
            color: '#7B90B8'
          },
          splitLine: {
            show: false
          },
          nameTextStyle: {
            color: '#FF8C42'
          }
        }
      ],
      series: [
        {
          name: 'Avg Grinding(mm)',
          type: 'bar',
          yAxisIndex: 1,
          data: [15, 35, 8, 28, 22, 0, 0, 0, 0],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 140, 66, 0.9)' },
                { offset: 1, color: 'rgba(255, 140, 66, 0.3)' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: 35
        },
        {
          name: 'Current Roll Dia(mm)',
          type: 'line',
          yAxisIndex: 0,
          data: [460, 440, 410, 395, 380, null, null, null, null],
          smooth: false,
          lineStyle: {
            color: '#2563EB',
            width: 2.5
          },
          itemStyle: {
            color: '#2563EB'
          },
          endLabel: {
            show: true
          },
          symbol: 'circle',
          symbolSize: 8,
          markPoint: {
            data: [
              {
                type: 'max',
                name: 'Max',
                label: {
                  color: '#00D4FF'
                }
              }
            ],
            itemStyle: {
              color: 'rgba(255, 69, 96, 0.8)'
            }
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37, 99, 235, 0.15)' },
                { offset: 1, color: 'rgba(37, 99, 235, 0)' }
              ]
            }
          }
        }
      ] as any
    };
  }

  toggleDropdown(name: string): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  closeAllDropdowns(): void {
    this.openDropdown = null;
  }

  selectMill(val: string): void {
    this.selectedMill = val;
    this.openDropdown = null;
  }

  selectRoll(val: string): void {
    this.selectedRoll = val;
    this.openDropdown = null;
  }

  selectPosition(val: string): void {
    this.selectedPosition = val;
    this.openDropdown = null;
  }

  openEditModal(): void {
    const lastRow = this.rollUsageData[this.rollUsageData.length - 1];
    this.editForm = { ...lastRow, rollChangeTime: (lastRow as RollUsageData & { rollChangeTime?: string }).rollChangeTime ?? '' };
    this.showEditModal = true;
  }

  saveEdit(): void {
    this.rollUsageData[this.rollUsageData.length - 1] = { ...this.editForm };
    this.showEditModal = false;
  }

  goToPage(n: number): void {
    if (n >= 1 && n <= this.totalPages) {
      this.currentPage = n;
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
  onDocClick(e: Event): void {
    if (!(e.target as HTMLElement).closest('.custom-select')) {
      this.openDropdown = null;
    }
  }
}
