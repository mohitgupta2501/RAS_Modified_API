import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatetimePickerComponent } from '../../shared/components/datetime-picker/datetime-picker.component';

interface RollInformation {
  name: string;
  position: string;
  rollId: string;
  supplier: string;
  diameter: number;
  rough: string | number;
  crownMin: number;
  crownMax: number;
  totalCycles: number;
  weightTon: number;
  slabs: number;
  lengthKm: number;
  weightTon2: number;
  slabs2: number;
  lengthKm2: number;
  rollChangeTime: string;
}

@Component({
  selector: 'app-mill-information',
  standalone: true,
  imports: [CommonModule, FormsModule, DatetimePickerComponent],
  templateUrl: './mill-information.component.html',
  styleUrl: './mill-information.component.scss'
})
export class MillInformationComponent implements OnInit {
  stands = ['E1', 'R1', 'E2', 'R2', 'F1e', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'PR1', 'PR2', 'PR3'];
  selectedStand = 'E1';
  rollInformation: RollInformation[] = [];
  panelCollapsed = true;

  manualEntryStands = ['E1', 'E2', 'F1e', 'PR1', 'PR2', 'PR3'];
  showManualEntryModal = false;
  showDefectModal = false;
  showDowntimeModal = false;
  showSuccessToast = false;
  openDropdown: string | null = null;

  get showManualEntryButton(): boolean {
    return this.manualEntryStands.includes(this.selectedStand);
  }

  // Manual Entry form
  manualEntryForm = {
    rollId: '',
    rollType: 'WR',
    supplier: '',
    diameterMm: null as number | null,
    roughUra: null as number | null,
    crownMin: null as number | null,
    crownMax: null as number | null,
    totalCycles: null as number | null,
    rollChangeTime: ''
  };
  readonly rollTypeOptions = ['WR', 'BUR', 'IMR', 'Edger Roll', 'Pinch Roll'];

  // Defect form
  defectForm = {
    stand: 'E1',
    type: 'Roll',
    kind: 'WR',
    position: 'Drive Side',
    defect: '',
    reason: '',
    dateTime: ''
  };
  defectOptions = ['Crack', 'Spall', 'Wear', 'Chipping', 'Surface Damage', 'Dimensional Error', 'Other'];
  selectedDefect = '';
  showOtherDefectInput = false;
  otherDefectText = '';
  readonly defectTypeOptions = ['Roll', 'Choke', 'Bearing'];
  readonly kindByType: Record<string, string[]> = {
    Roll: ['WR', 'BUR', 'IMR', 'Edger Roll', 'Pinch Roll'],
    Choke: ['Inner Choke', 'Outer Choke'],
    Bearing: ['Drive Side', 'Operator Side']
  };

  // Downtime form (FIX 3 - Downtime Data table fields)
  downtimeForm = {
    millId: '',
    millSection: 'Roughing',
    startTime: '',       // YYYYMMDDHHmmss
    actualStartTime: '', // YYYYMMDDHHmmss
    plannedDurationHrs: null as number | null,
    actualDurationHrs: null as number | null,
    downtimeType: 'Planned',
    reason: 'Scheduled Maintenance',
    remarks: ''
  };
  readonly millSectionOptions = ['Roughing', 'Edger', 'Finishing', 'Skin Pass'];
  readonly downtimeTypeOptions = ['Planned', 'Un-Planned'];
  readonly downtimeReasonOptions = [
    'Roll/Choke Change', 'Mill Overhaul', 'Bearing Failure', 'Electrical Fault',
    'Mechanical Fault', 'Scheduled Maintenance', 'Other'
  ];
  readonly maxRemarksLength = 50;

  readonly group1: RollInformation[] = [
    { name: 'Edger Roll', position: 'OS', rollId: 'ERO_898', supplier: 'Supplier8', diameter: 1212.25, rough: '-', crownMin: 10.20, crownMax: 125.40, totalCycles: 7, weightTon: 350, slabs: 12, lengthKm: 820, weightTon2: 500, slabs2: 15, lengthKm2: 980, rollChangeTime: '26/02/10 10:35' },
    { name: 'Edger Roll', position: 'DS', rollId: 'ERD_895', supplier: 'Supplier3', diameter: 1523.54, rough: '-', crownMin: 121.10, crownMax: 124.90, totalCycles: 2, weightTon: 180, slabs: 5, lengthKm: 610, weightTon2: 300, slabs2: 9, lengthKm2: 720, rollChangeTime: '26/02/10 10:35' },
    { name: 'Choke', position: 'OST', rollId: 'EROT_455', supplier: 'Supplier3', diameter: 1112.56, rough: '-', crownMin: 119.50, crownMax: 124.00, totalCycles: 5, weightTon: 720, slabs: 18, lengthKm: 1450, weightTon2: 890, slabs2: 22, lengthKm2: 1700, rollChangeTime: '26/01/06 05:45' },
    { name: 'Choke', position: 'DST', rollId: 'EROB_562', supplier: 'Supplier4', diameter: 1025.65, rough: 2.300, crownMin: 122.00, crownMax: 126.30, totalCycles: 4, weightTon: 410, slabs: 10, lengthKm: 980, weightTon2: 600, slabs2: 14, lengthKm2: 1200, rollChangeTime: '26/01/06 05:45' },
    { name: 'Choke', position: 'OSB', rollId: 'ERDT_635', supplier: 'Supplier4', diameter: 1265.89, rough: '-', crownMin: 118.70, crownMax: 123.60, totalCycles: 6, weightTon: 150, slabs: 4, lengthKm: 260, weightTon2: 280, slabs2: 7, lengthKm2: 390, rollChangeTime: '26/02/10 09:59' },
    { name: 'Choke', position: 'DSB', rollId: 'ERDB_562', supplier: 'Supplier5', diameter: 1458.65, rough: '-', crownMin: 121.00, crownMax: 127.00, totalCycles: 1, weightTon: 200, slabs: 6, lengthKm: 310, weightTon2: 350, slabs2: 8, lengthKm2: 470, rollChangeTime: '26/02/10 09:59' }
  ];

  readonly group2: RollInformation[] = [
    { name: 'Work Roll', position: 'Top', rollId: 'WRT_782', supplier: 'Supplier8', diameter: 1212.25, rough: '-', crownMin: 10.20, crownMax: 125.40, totalCycles: 7, weightTon: 350, slabs: 12, lengthKm: 820, weightTon2: 500, slabs2: 15, lengthKm2: 980, rollChangeTime: '26/02/10 10:35' },
    { name: 'Work Roll', position: 'Bottom', rollId: 'WRB_256', supplier: 'Supplier8', diameter: 1212.25, rough: '-', crownMin: 10.20, crownMax: 125.40, totalCycles: 7, weightTon: 350, slabs: 12, lengthKm: 820, weightTon2: 500, slabs2: 15, lengthKm2: 980, rollChangeTime: '26/02/10 10:35' },
    { name: 'Backup Roll', position: 'Top', rollId: 'BRT_856', supplier: 'Supplier8', diameter: 1212.25, rough: '-', crownMin: 10.20, crownMax: 125.40, totalCycles: 7, weightTon: 350, slabs: 12, lengthKm: 820, weightTon2: 500, slabs2: 15, lengthKm2: 980, rollChangeTime: '26/02/10 10:35' },
    { name: 'Backup Roll', position: 'Bottom', rollId: 'BRB_125', supplier: 'Supplier8', diameter: 1212.25, rough: '-', crownMin: 10.20, crownMax: 125.40, totalCycles: 7, weightTon: 350, slabs: 12, lengthKm: 820, weightTon2: 500, slabs2: 15, lengthKm2: 980, rollChangeTime: '26/02/10 10:35' },
    { name: 'Work Choke', position: 'Top', rollId: 'WRTO_265', supplier: 'Supplier8', diameter: 1212.25, rough: '-', crownMin: 10.20, crownMax: 125.40, totalCycles: 7, weightTon: 350, slabs: 12, lengthKm: 820, weightTon2: 500, slabs2: 15, lengthKm2: 980, rollChangeTime: '26/02/10 10:35' },
    { name: 'Work Choke', position: 'Top', rollId: 'WRTD_365', supplier: 'Supplier8', diameter: 1212.25, rough: '-', crownMin: 10.20, crownMax: 125.40, totalCycles: 7, weightTon: 350, slabs: 12, lengthKm: 820, weightTon2: 500, slabs2: 15, lengthKm2: 980, rollChangeTime: '26/02/10 10:35' },
    { name: 'Work Choke', position: 'OS', rollId: 'WRBO_589', supplier: 'Supplier8', diameter: 1212.25, rough: '-', crownMin: 10.20, crownMax: 125.40, totalCycles: 7, weightTon: 350, slabs: 12, lengthKm: 820, weightTon2: 500, slabs2: 15, lengthKm2: 980, rollChangeTime: '26/02/10 10:35' },
    { name: 'Work Choke', position: 'OS', rollId: 'WRBD_365', supplier: 'Supplier8', diameter: 1212.25, rough: '-', crownMin: 10.20, crownMax: 125.40, totalCycles: 7, weightTon: 350, slabs: 12, lengthKm: 820, weightTon2: 500, slabs2: 15, lengthKm2: 980, rollChangeTime: '26/02/10 10:35' },
    { name: 'Backup Choke', position: 'Top', rollId: 'BRTO_356', supplier: 'Supplier3', diameter: 1523.54, rough: '-', crownMin: 121.10, crownMax: 124.90, totalCycles: 2, weightTon: 180, slabs: 5, lengthKm: 610, weightTon2: 300, slabs2: 9, lengthKm2: 720, rollChangeTime: '26/02/10 10:35' },
    { name: 'Backup Choke', position: 'Top', rollId: 'BRTD_658', supplier: 'Supplier3', diameter: 1112.56, rough: '-', crownMin: 119.50, crownMax: 124.00, totalCycles: 5, weightTon: 720, slabs: 18, lengthKm: 1450, weightTon2: 890, slabs2: 22, lengthKm2: 1700, rollChangeTime: '26/01/06 05:45' },
    { name: 'Backup Choke', position: 'Bottom', rollId: 'BRBO_457', supplier: 'Supplier4', diameter: 1025.65, rough: 2.300, crownMin: 122.00, crownMax: 126.30, totalCycles: 4, weightTon: 410, slabs: 10, lengthKm: 980, weightTon2: 600, slabs2: 14, lengthKm2: 1200, rollChangeTime: '26/01/06 05:45' },
    { name: 'Backup Choke', position: 'Bottom', rollId: 'BRBD_235', supplier: 'Supplier4', diameter: 1265.89, rough: '-', crownMin: 118.70, crownMax: 123.60, totalCycles: 6, weightTon: 150, slabs: 4, lengthKm: 260, weightTon2: 280, slabs2: 7, lengthKm2: 390, rollChangeTime: '26/02/10 09:59' }
  ];

  readonly group3: RollInformation[] = [
    { name: 'Pinch Roll', position: 'Top', rollId: 'PRT_568', supplier: 'Supplier8', diameter: 1212.25, rough: '-', crownMin: 10.20, crownMax: 125.40, totalCycles: 7, weightTon: 350, slabs: 12, lengthKm: 820, weightTon2: 500, slabs2: 15, lengthKm2: 980, rollChangeTime: '26/02/10 10:35' },
    { name: 'Pinch Roll', position: 'Bottom', rollId: 'PRB_762', supplier: 'Supplier3', diameter: 1523.54, rough: '-', crownMin: 121.10, crownMax: 124.90, totalCycles: 2, weightTon: 180, slabs: 5, lengthKm: 610, weightTon2: 300, slabs2: 9, lengthKm2: 720, rollChangeTime: '26/02/10 10:35' },
    { name: 'Pinch Roll', position: 'OS', rollId: 'PRTO_455', supplier: 'Supplier3', diameter: 1112.56, rough: '-', crownMin: 119.50, crownMax: 124.00, totalCycles: 5, weightTon: 720, slabs: 18, lengthKm: 1450, weightTon2: 890, slabs2: 22, lengthKm2: 1700, rollChangeTime: '26/01/06 05:45' },
    { name: 'Pinch Roll', position: 'DS', rollId: 'PRTD_562', supplier: 'Supplier4', diameter: 1025.65, rough: 2.300, crownMin: 122.00, crownMax: 126.30, totalCycles: 4, weightTon: 410, slabs: 10, lengthKm: 980, weightTon2: 600, slabs2: 14, lengthKm2: 1200, rollChangeTime: '26/01/06 05:45' },
    { name: 'Pinch Roll', position: 'OS', rollId: 'PRBO_635', supplier: 'Supplier4', diameter: 1265.89, rough: '-', crownMin: 118.70, crownMax: 123.60, totalCycles: 6, weightTon: 150, slabs: 4, lengthKm: 260, weightTon2: 280, slabs2: 7, lengthKm2: 390, rollChangeTime: '26/02/10 09:59' },
    { name: 'Pinch Roll', position: 'DS', rollId: 'PRBD_562', supplier: 'Supplier5', diameter: 1458.65, rough: '-', crownMin: 121.00, crownMax: 127.00, totalCycles: 1, weightTon: 200, slabs: 6, lengthKm: 310, weightTon2: 350, slabs2: 8, lengthKm2: 470, rollChangeTime: '26/02/10 09:59' }
  ];

  readonly group4: RollInformation[] = [
    { name: 'Work Roll', position: 'Top', rollId: 'WRTO_892', supplier: 'Supplier8', diameter: 1212.25, rough: '-', crownMin: 10.20, crownMax: 125.40, totalCycles: 7, weightTon: 350, slabs: 12, lengthKm: 820, weightTon2: 500, slabs2: 15, lengthKm2: 980, rollChangeTime: '26/02/10 10:35' },
    { name: 'Work Roll', position: 'Bottom', rollId: 'WRTD_123', supplier: 'Supplier3', diameter: 1523.54, rough: '-', crownMin: 121.10, crownMax: 124.90, totalCycles: 2, weightTon: 180, slabs: 5, lengthKm: 610, weightTon2: 300, slabs2: 9, lengthKm2: 720, rollChangeTime: '26/02/10 10:35' },
    { name: 'Work Choke', position: 'Top', rollId: 'WRBO_455', supplier: 'Supplier3', diameter: 1112.56, rough: '-', crownMin: 119.50, crownMax: 124.00, totalCycles: 5, weightTon: 720, slabs: 18, lengthKm: 1450, weightTon2: 890, slabs2: 22, lengthKm2: 1700, rollChangeTime: '26/01/06 05:45' },
    { name: 'Work Choke', position: 'Top', rollId: 'WRBD_659', supplier: 'Supplier4', diameter: 1025.65, rough: 2.300, crownMin: 122.00, crownMax: 126.30, totalCycles: 4, weightTon: 410, slabs: 10, lengthKm: 980, weightTon2: 600, slabs2: 14, lengthKm2: 1200, rollChangeTime: '26/01/06 05:45' },
    { name: 'Work Choke', position: 'Bottom', rollId: 'PRBO_635', supplier: 'Supplier4', diameter: 1265.89, rough: '-', crownMin: 118.70, crownMax: 123.60, totalCycles: 6, weightTon: 150, slabs: 4, lengthKm: 260, weightTon2: 280, slabs2: 7, lengthKm2: 390, rollChangeTime: '26/02/10 09:59' },
    { name: 'Work Choke', position: 'Bottom', rollId: 'PRBD_562', supplier: 'Supplier5', diameter: 1458.65, rough: '-', crownMin: 121.00, crownMax: 127.00, totalCycles: 1, weightTon: 200, slabs: 6, lengthKm: 310, weightTon2: 350, slabs2: 8, lengthKm2: 470, rollChangeTime: '26/02/10 09:59' }
  ];

  ngOnInit(): void {
    this.rollInformation = this.getGroupForStand('E1');
    this.defectForm.dateTime = new Date().toISOString().slice(0, 16);
  }

  getGroupForStand(stand: string): RollInformation[] {
    if (['E1', 'E2', 'F1e'].includes(stand)) return [...this.group1];
    if (['R2', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7'].includes(stand)) return [...this.group2];
    if (['PR1', 'PR2', 'PR3'].includes(stand)) return [...this.group3];
    if (stand === 'R1') return [...this.group4];
    return [...this.group1];
  }

  onTabChange(stand: string): void {
    this.selectedStand = stand;
    this.rollInformation = this.getGroupForStand(stand);
  }

  openManualEntryModal(): void {
    if (!this.manualEntryStands.includes(this.selectedStand)) return;
    this.manualEntryForm = {
      rollId: '',
      rollType: 'WR',
      supplier: '',
      diameterMm: null,
      roughUra: null,
      crownMin: null,
      crownMax: null,
      totalCycles: null,
      rollChangeTime: ''
    };
    this.showManualEntryModal = true;
  }

  openDefectModal(): void {
    this.defectForm.stand = this.selectedStand;
    this.defectForm.type = 'Roll';
    this.defectForm.kind = 'WR';
    this.updateDefectPositionOptions();
    this.defectForm.position = this.positionOptionsForDefect[0] || '';
    this.defectForm.reason = '';
    this.selectedDefect = '';
    this.defectForm.dateTime = new Date().toISOString().slice(0, 16);
    this.showOtherDefectInput = false;
    this.otherDefectText = '';
    this.showDefectModal = true;
  }

  openDowntimeModal(): void {
    this.downtimeForm.millId = this.selectedStand;
    this.downtimeForm.millSection = 'Roughing';
    this.downtimeForm.startTime = '';
    this.downtimeForm.actualStartTime = '';
    this.downtimeForm.plannedDurationHrs = null;
    this.downtimeForm.actualDurationHrs = null;
    this.downtimeForm.downtimeType = 'Planned';
    this.downtimeForm.reason = 'Scheduled Maintenance';
    this.downtimeForm.remarks = '';
    this.showDowntimeModal = true;
  }

  get kindOptionsForDefect(): string[] {
    return this.kindByType[this.defectForm.type] || [];
  }

  positionOptionsForDefect: string[] = ['Drive Side', 'Operator Side'];

  private updateDefectPositionOptions(): void {
    const stand = this.defectForm.stand;
    const type = this.defectForm.type;
    if (type === 'Choke') {
      this.positionOptionsForDefect = ['Drive Top', 'Drive Bottom', 'Operator Top', 'Operator Bottom'];
    } else if (type === 'Roll') {
      if (['E1', 'E2', 'F1e'].includes(stand)) {
        this.positionOptionsForDefect = ['Drive Side', 'Operator Side'];
      } else {
        this.positionOptionsForDefect = ['Top', 'Bottom'];
      }
    } else {
      this.positionOptionsForDefect = ['Top', 'Bottom'];
    }
  }

  onDefectTypeChange(): void {
    this.defectForm.kind = this.kindOptionsForDefect[0] || '';
    this.updateDefectPositionOptions();
    this.defectForm.position = this.positionOptionsForDefect[0] || '';
  }

  onDefectStandChange(): void {
    this.updateDefectPositionOptions();
    this.defectForm.position = this.positionOptionsForDefect[0] || '';
  }

  onDefectChange(): void {
    if (this.selectedDefect === 'Other') {
      this.showOtherDefectInput = true;
      this.defectForm.defect = '';
    } else {
      this.showOtherDefectInput = false;
      this.defectForm.defect = this.selectedDefect;
    }
  }

  addCustomDefect(): void {
    const text = this.otherDefectText.trim();
    if (text) {
      const idx = this.defectOptions.indexOf('Other');
      if (idx >= 0) this.defectOptions.splice(idx, 0, text);
      this.selectedDefect = text;
      this.defectForm.defect = text;
      this.showOtherDefectInput = false;
      this.otherDefectText = '';
    }
  }

  toggleDropdown(name: string): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  @HostListener('document:click')
  closeAll(): void {
    this.openDropdown = null;
  }

  get remarksLength(): number {
    return (this.downtimeForm.remarks || '').length;
  }

  submitDowntime(): void {
    this.showDowntimeModal = false;
    this.showSuccessToast = true;
    setTimeout(() => (this.showSuccessToast = false), 3500);
  }
}
