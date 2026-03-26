import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ─── Roll List Interfaces ─────────────────────────────────────────────────────

export interface RollListItem {
  roll_id: string;
}

export interface RollListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RollListItem[];
}

// ─── Wear Analysis Interfaces ─────────────────────────────────────────────────

export interface WearSummary {
  overall_utilization: number;
  recent_tonnage: number;
  cycle_prediction: number;
  roll_status: string;
}

export interface WearCycle {
  cycle: string;
  diameter_before: number;
  diameter_after: number;
  actual_weight: number;
  predicted_weight: number;
  predicted_wear: number;
}

export interface WearApiResponse {
  summary: WearSummary;
  cycles: WearCycle[];
}

// ─── Cost Analysis Interfaces ─────────────────────────────────────────────────

export interface CostSummary {
  cost_per_ton: number;
  cost_per_length: number;
  cost_per_cycle: number;
  total_cost: number;
}

export interface CostCycle {
  cycle: string;
  procurement_cost: number;
  indirect_cost: number;
  maintenance_cost: number;
  disposal_cost: number;
  total_cycle_cost: number;
}

export interface CostApiResponse {
  summary: CostSummary;
  cycles: CostCycle[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class AdvanceAnalysisService {

  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/roll-list
   * Returns paginated roll list filtered by stand category and roll type.
   */
  getRollList(
    standCategory: string,
    rollType: string,
    page: number,
    pageSize: number
  ): Observable<RollListResponse> {
    const params = new HttpParams()
      .set('stand_category', standCategory)
      .set('roll_type', rollType)
      .set('page', page.toString())
      .set('page_size', pageSize.toString());
    return this.http.get<RollListResponse>(`${this.baseUrl}/roll-list`, { params });
  }

  /**
   * GET /api/roll-analysis/{roll_id}/wear
   * Returns roll wear analysis by cycle.
   */
  getWearAnalysis(rollId: string): Observable<WearApiResponse> {
    return this.http.get<WearApiResponse>(`${this.baseUrl}/roll-analysis/${rollId}/wear`);
  }

  /**
   * GET /api/roll-analysis/{roll_id}/cost
   * Returns roll cost analysis by cycle.
   */
  getCostAnalysis(rollId: string): Observable<CostApiResponse> {
    return this.http.get<CostApiResponse>(`${this.baseUrl}/roll-analysis/${rollId}/cost`);
  }
}