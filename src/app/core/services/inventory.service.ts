import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ─────────────────────────────────────────────
// RESPONSE INTERFACES
// ─────────────────────────────────────────────

export interface RollInventoryRow {
  roll_id: string;
  stand_category: string;
  diameter: number;
  material_code: string;
  crown_max: number;
  crown_min: number;
  grind_cycles: number;
  shim: number;
  total_weight: number;
  total_coils: number;
  total_length: number;
  supplier: string;
  roll_added_time: string;
}

export interface ChokeRow {
  chock_id: string;
  total_weight: number;
  total_coils: number;
  total_length: number;
  supplier: string;
}

export interface KpiSummary {
  stand_category: string;
  ready: number;
  wr?: number;
  bur?: number;
}

// BUG FIX #1: KpiApiResponse used for BOTH roll and chock KPI endpoints
export interface KpiApiResponse {
  kpi_card_list: KpiSummary[];
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// ─────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly http = inject(HttpClient);

  // Strip trailing '/api' so URLs like `${baseUrl}/api/inventory/...` resolve correctly
  // In dev:  environment.apiUrl = '/api'  → baseUrl = ''  → /api/inventory/...
  // In prod: environment.apiUrl = 'http://192.168.99.1:8000/api' → baseUrl = 'http://192.168.99.1:8000'
  private readonly baseUrl = environment.apiUrl.replace(/\/api$/, '');

  private get jsonHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // ──────────────────────────────────────────
  // ROLL KPI
  // GET /api/inventory/rolls/kpi
  // ──────────────────────────────────────────

  getRollKpi(): Observable<KpiApiResponse> {
    return this.http
      .get<KpiApiResponse>(`${this.baseUrl}/api/inventory/rolls/kpi`, {
        headers: this.jsonHeaders
      })
      .pipe(catchError((error: any) => this.handleError(error)));
  }

  // ──────────────────────────────────────────
  // CHOCK KPI
  // GET /api/inventory/chocks/kpi
  // BUG FIX #1: was Observable<KpiSummary[]> — now correctly typed as
  // Observable<KpiApiResponse> so res.kpi_card_list is accessible in the component
  // ──────────────────────────────────────────

  getChockKpi(): Observable<KpiApiResponse> {
    return this.http
      .get<KpiApiResponse>(`${this.baseUrl}/api/inventory/chocks/kpi`, {
        headers: this.jsonHeaders
      })
      .pipe(catchError((error: any) => this.handleError(error)));
  }

  // ──────────────────────────────────────────
  // ROLL INVENTORY
  // GET /api/inventory/rolls?page=1&page_size=10
  // ──────────────────────────────────────────

  getRollInventory(
    page: number = 1,
    page_size: number = 10
  ): Observable<PaginatedResponse<RollInventoryRow>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', page_size.toString());

    return this.http
      .get<PaginatedResponse<RollInventoryRow>>(
        `${this.baseUrl}/api/inventory/rolls`,
        { headers: this.jsonHeaders, params }
      )
      .pipe(catchError((error: any) => this.handleError(error)));
  }

  // ──────────────────────────────────────────
  // CHOCK INVENTORY
  // GET /api/inventory/chocks?page=1&page_size=10
  // ──────────────────────────────────────────

  getChockInventory(
    page: number = 1,
    page_size: number = 10
  ): Observable<PaginatedResponse<ChokeRow>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', page_size.toString());

    return this.http
      .get<PaginatedResponse<ChokeRow>>(
        `${this.baseUrl}/api/inventory/chocks`,
        { headers: this.jsonHeaders, params }
      )
      .pipe(catchError((error: any) => this.handleError(error)));
  }

  // ──────────────────────────────────────────
  // HELPER — trigger browser CSV download
  // ──────────────────────────────────────────

  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ──────────────────────────────────────────
  // ERROR HANDLER
  // ──────────────────────────────────────────

  private handleError(error: any): Observable<never> {
    let message = 'An unexpected error occurred.';

    if (error.status === 0) {
      message = 'Network error — please check your connection.';
    } else if (error.status === 401) {
      message = 'Unauthorized — please log in again.';
    } else if (error.status === 403) {
      message = 'Forbidden — you do not have access to this resource.';
    } else if (error.status === 404) {
      message = 'Resource not found.';
    } else if (error.status >= 500) {
      message = 'Server error — please try again later.';
    } else if (error.error?.message) {
      message = error.error.message;
    }

    console.error('[InventoryService]', error);
    return throwError(() => new Error(message));
  }
}