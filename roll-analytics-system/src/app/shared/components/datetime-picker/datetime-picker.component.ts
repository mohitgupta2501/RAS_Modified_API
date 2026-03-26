import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  OnChanges,
  SimpleChanges,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-datetime-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './datetime-picker.component.html',
  styleUrl: './datetime-picker.component.scss'
})
export class DatetimePickerComponent implements OnChanges {
  constructor(private el: ElementRef<HTMLElement>) {}
  @Input() label = '';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  selectedDay: number | null = null;
  selectedHour = 0;
  selectedMinute = 0;
  showMonthView = false;

  readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  readonly dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  readonly hours = Array.from({ length: 24 }, (_, i) => i);
  readonly minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      if (this.value) {
        this.parseValue(this.value);
      } else {
        this.selectedDay = null;
        this.selectedHour = 0;
        this.selectedMinute = 0;
      }
    }
  }

  get calendarDays(): (number | null)[] {
    const first = new Date(this.currentYear, this.currentMonth, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const result: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }

  get displayValue(): string {
    if (!this.selectedDay) return '';
    const y = this.currentYear;
    const m = this.currentMonth + 1;
    const d = this.selectedDay;
    const hh = this.selectedHour;
    const mm = this.selectedMinute;
    return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const today = new Date();
    return (
      this.currentYear === today.getFullYear() &&
      this.currentMonth === today.getMonth() &&
      day === today.getDate()
    );
  }

  isSelected(day: number | null): boolean {
    return day !== null && day === this.selectedDay;
  }

  selectDay(day: number | null): void {
    if (day) {
      this.selectedDay = day;
      this.updateValue();
    }
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  toggleMonthView(): void {
    this.showMonthView = !this.showMonthView;
  }

  setToday(): void {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
    this.selectedDay = now.getDate();
    this.selectedHour = now.getHours();
    this.selectedMinute = Math.floor(now.getMinutes() / 5) * 5;
    this.updateValue();
  }

  clearValue(): void {
    this.selectedDay = null;
    this.selectedHour = 0;
    this.selectedMinute = 0;
    this.valueChange.emit('');
  }

  togglePicker(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.value) {
      this.parseValue(this.value);
    }
    if (this.isOpen && this.selectedDay === null) {
      const now = new Date();
      this.currentYear = now.getFullYear();
      this.currentMonth = now.getMonth();
    }
  }

  applyValue(): void {
    this.isOpen = false;
  }

  updateValue(): void {
    if (this.selectedDay === null) return;
    const y = this.currentYear;
    const m = this.currentMonth + 1;
    const d = this.selectedDay;
    const hh = this.selectedHour;
    const mm = this.selectedMinute;
    const val = `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}00`;
    this.valueChange.emit(val);
  }

  private parseValue(v: string): void {
    if (!v || v.length < 12) return;
    const isCompact = /^\d{14}/.test(v);
    if (isCompact) {
      const y = parseInt(v.slice(0, 4), 10);
      const m = parseInt(v.slice(4, 6), 10) - 1;
      const d = parseInt(v.slice(6, 8), 10);
      const hh = parseInt(v.slice(8, 10), 10);
      const mm = parseInt(v.slice(10, 12), 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        this.currentYear = y;
        this.currentMonth = m;
        this.selectedDay = d;
        this.selectedHour = isNaN(hh) ? 0 : Math.min(23, hh);
        this.selectedMinute = isNaN(mm) ? 0 : this.minutes.reduce((a, b) => (Math.abs(b - mm) < Math.abs(a - mm) ? b : a));
      }
    } else {
      const date = new Date(v);
      if (!isNaN(date.getTime())) {
        this.currentYear = date.getFullYear();
        this.currentMonth = date.getMonth();
        this.selectedDay = date.getDate();
        this.selectedHour = date.getHours();
        this.selectedMinute = this.minutes.reduce((a, b) => (Math.abs(b - date.getMinutes()) < Math.abs(a - date.getMinutes()) ? b : a));
      }
    }
  }

  @HostListener('document:click', ['$event'])
  closeOnOutside(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }
}
