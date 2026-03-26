import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-rating-cell-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="isRating">
      <div class="rating-cell-wrap">
        <span class="rating-num">{{ value }}</span>
        <div class="rating-stars">
          <span *ngFor="let _ of starArray" class="material-icons star-icon">star</span>
        </div>
      </div>
    </ng-container>
    <ng-container *ngIf="!isRating">{{ value }}</ng-container>
  `
})
export class RatingCellRendererComponent implements ICellRendererAngularComp {
  value: number | string = '';
  isRating = false;
  starArray: number[] = [];

  agInit(params: ICellRendererParams): void {
    this.value = params.value ?? '';
    this.isRating = params.data?.parameter === 'Ratings';
    if (this.isRating && this.value !== '') {
      const n = Math.round(Number(this.value));
      this.starArray = Array(Math.min(10, Math.max(0, n))).fill(0);
    }
  }

  refresh(): boolean {
    return false;
  }
}
