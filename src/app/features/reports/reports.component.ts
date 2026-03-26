import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DatetimePickerComponent } from '../../shared/components/datetime-picker/datetime-picker.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatetimePickerComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  selectedFeature = 'ALARMS';
  selectedFormat = 'CSV';
  fromDate = '';
  toDate = '';
  selectedParams: string[] = [];
  showDownloadToast = false;
  openDropdown: string | null = null;

  readonly featureOptions = [
    'ALARMS',
    'TELEGRAM LOGS',
    'PERFORMANCE',
    'MILL INFORMATION',
    'ROLL DETAILS',
    'COST ANALYSIS',
    'ROLL CONDITION'
  ];

  readonly parametersMap: Record<string, string[]> = {
    'ALARMS': ['RCVD TIME', 'Description', 'Parameter', 'Severity'],
    'TELEGRAM LOGS': [
      'Date & Time',
      'Tele.No',
      'Tele.Description',
      'Direction',
      'Outer System',
      'CMM Mode',
      'Length',
      'Status',
      'User'
    ],
    'PERFORMANCE': [
      'Avg Rolled Length',
      'Avg Rolled Tonnage',
      'Avg Utilization',
      'Avg Hourly Tonnage',
      'Total Breakdown',
      'Avg Coolant Conc',
      'Avg Purchase Cost',
      'Avg Cycles',
      'Avg Lead Time',
      'Avg Cost per Km',
      'Ratings'
    ],
    'MILL INFORMATION': [
      'Roll ID',
      'Supplier',
      'Diameter(mm)',
      'Roughness(uRA)',
      'Total Cycles',
      'Crown Min',
      'Crown Max',
      'Current Weight',
      'Current Slabs',
      'Current Length',
      'Cumulative Weight',
      'Cumulative Slabs',
      'Cumulative Length'
    ],
    'ROLL DETAILS': [
      'Roll ID',
      'Seller',
      'Delivery Date',
      'PO Date',
      'PO Price',
      'Min Diameter',
      'Rating',
      'Delivery Days',
      'Cycle No',
      'Rolled Length',
      'Diameter Start',
      'Diameter End',
      'Maint Cost',
      'Spall',
      'Crack',
      'Uniform Circulation',
      'Fit For Use'
    ],
    'COST ANALYSIS': [
      'Cost/Km',
      'Cost/Ton',
      'Cost/Campaign',
      'Roll ID',
      'Activity Type',
      'Duration',
      'Indirect Cost',
      'Remarks'
    ],
    'ROLL CONDITION': [
      'Date',
      'Roll ID',
      'Stand',
      'Spall',
      'Crack',
      'Circulation',
      'Surface Condition',
      'Overall Status',
      'Remarks'
    ]
  };

  availableParams: string[] = [];

  ngOnInit(): void {
    this.updateParameters();
  }

  updateParameters(): void {
    this.availableParams = this.parametersMap[this.selectedFeature] || [];
    this.selectedParams = [...this.availableParams];
  }

  onFeatureChange(): void {
    this.updateParameters();
  }

  toggleParam(param: string): void {
    const idx = this.selectedParams.indexOf(param);
    if (idx > -1) {
      this.selectedParams.splice(idx, 1);
    } else {
      this.selectedParams.push(param);
    }
  }

  isParamSelected(param: string): boolean {
    return this.selectedParams.includes(param);
  }

  selectAll(): void {
    this.selectedParams = [...this.availableParams];
  }

  deselectAll(): void {
    this.selectedParams = [];
  }

  toggleDropdown(name: string): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.openDropdown = null;
  }

  downloadReport(): void {
    if (this.selectedParams.length === 0) return;
    this.showDownloadToast = true;
    setTimeout(() => {
      this.showDownloadToast = false;
    }, 3500);
  }

  resetForm(): void {
    this.selectedFeature = 'ALARMS';
    this.selectedParams = [];
    this.fromDate = '';
    this.toDate = '';
    this.selectedFormat = 'CSV';
    this.updateParameters();
  }
}
