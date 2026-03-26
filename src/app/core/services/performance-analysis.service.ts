import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── Request params ──────────────────────────────────────────────────────────

export interface SupplierQueryParams {
  roll_type: string;
  stand_category: string;
  page?: number;
  page_size?: number;
}

// ── Response shapes (matching Swagger) ──────────────────────────────────────

// /api/supplier1 flat response (performance table)
export interface SupplierPerformanceItem {
  supplier: string;
  avg_rolled_length: number;
  avg_rolled_tonnage: number;
  avg_utilization: number;
  total_breakdown: number;
  avg_purchase_cost: number;
  avg_cycles: number;
  avg_lead_time: number;
  avg_cost_per_km: number;
  rating: number;
}

// /api/supplier3 response (thin gauge matrix - has cycle_data)
export interface SupplierThinGaugeItem {
  supplier: string;
  country: string;
  rolls: number;
  max_cycle: number;
  cycle_data: CycleDataItem[];
}

export interface CycleDataItem {
  cycle: number;
  cycle_weight: number;
  cycle_length: number;
  cycle_cost: number;
  cycle_defect: number;
  cycle_coil: number;
  rating: number;
}

export interface PaginatedResponse<T> {
  count: number;
  current_page: number;
  total_pages: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

// ── Stand category mapping ───────────────────────────────────────────────────
// UI label  →  backend value
export const STAND_CATEGORY_MAP: Record<string, string> = {
  'R1':    'R1',
  'R2':    'R2',
  'F1-F4': 'F1-4',
  'F5-F7': 'F5-7',
  'Edger': 'EG',
  'Pinch': 'PR',
};

@Injectable({
  providedIn: 'root',
})
export class SupplierAnalysisService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── /api/supplier1  →  Supplier Performance Comparison ──────────────────
  getSupplierPerformance(
    params: SupplierQueryParams
  ): Observable<PaginatedResponse<SupplierPerformanceItem>> {
    return this.http.get<PaginatedResponse<SupplierPerformanceItem>>(
      `${this.baseUrl}/supplier-ratings`,
      { params: this.buildParams(params) }
    );
  }

  // ── /api/supplier1  →  Fitness Matrix (same endpoint, different consumer) ─
  getFitnessMatrix(
    params: SupplierQueryParams
  ): Observable<PaginatedResponse<SupplierPerformanceItem>> {
    return this.http.get<PaginatedResponse<SupplierPerformanceItem>>(
      `${this.baseUrl}/supplier-ratings`,
      { params: this.buildParams(params) }
    );
  }

  // ── /api/supplier3  →  Thin Gauge Matrix ────────────────────────────────
  getThinGaugeMatrix(
    params: SupplierQueryParams
  ): Observable<PaginatedResponse<SupplierThinGaugeItem>> {
    return this.http.get<PaginatedResponse<SupplierThinGaugeItem>>(
      `${this.baseUrl}/supplier3`,
      { params: this.buildParams(params) }
    );
  }

  // ── Helper: build HttpParams and map stand_category ─────────────────────
  private buildParams(params: SupplierQueryParams): HttpParams {
    const mappedStand = STAND_CATEGORY_MAP[params.stand_category] ?? params.stand_category;

    // Edger (EG) and Pinch (PR) have no roll type — backend expects no roll_type param
    let httpParams = new HttpParams().set('stand_category', mappedStand);
    if (params.roll_type && params.roll_type !== '-') {
      httpParams = httpParams.set('roll_type', params.roll_type);
    }

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.page_size !== undefined) {
      httpParams = httpParams.set('page_size', params.page_size.toString());
    }

    return httpParams;
  }
}