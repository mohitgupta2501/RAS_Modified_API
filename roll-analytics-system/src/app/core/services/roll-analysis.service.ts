import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RollListResponse {
  roll_list: string[];
}

export interface RollUsageCycleData {
  cycle: number;
  stand: string;
  position: string;
  rolled_length: number;
  rolled_weight: number;
  cycle_start_date: string;
  cycle_end_date: string;
  in_diameter: number;
  out_diameter: number;
  maint_cost: number;
  remarks: string;
  spall: string;
  crack: string;
  uniform_circulation: string;
  fit_for_use: string;
}


export interface RollUsageResponse {
  roll_id: string;
  usage: RollUsageCycleData[];
}
// ─── Roll Analysis Response Interfaces ───────────────────────────────────────

export interface RollMetric {
  title: string;
  unit: string;
  value: number | string;
}

export interface ChartSeries {
  key: string;
  label: string;
  unit: string;
  type: string;
  data: number[];
}

export interface ChartAxis {
  key: string;
  label: string;
  unit: string;
  data: string[];
}

export interface DiameterConsumptionChart {
  xAxis: ChartAxis;
  yAxisLeft: ChartSeries[];   // newDiameter, grind, wear
  yAxisRight: ChartSeries[];  // rolledTons
}

export interface UtilizationChart {
  xAxis: ChartAxis;
  yAxisLeft: ChartSeries[];   // utilization
  yAxisRight: never[];
}

export interface RollAnalysisData {
  rollInfo: {
    rollId: string;
    stand: string;
    stand_category: string;
    type: string;
    metrics: RollMetric[];
  };
  charts: {
    diameterConsumption: DiameterConsumptionChart;
    utilization: UtilizationChart;
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class RollAnalysisService {
  private readonly PLATFORM = 'web';
  private readonly baseUrl = environment.apiUrl;

  // Stand category UI label → API value mapping
  private readonly standCategoryMap: Record<string, string> = {
    'Edger': 'EG',
    'Pinch': 'PR',
    'F1-F4': 'F1-4',
    'F5-F7': 'F5-7',
    'R1': 'R1',
    'R2': 'R2'
  };

  constructor(private http: HttpClient) {}

  mapStandCategory(uiValue: string): string {
    return this.standCategoryMap[uiValue] ?? uiValue;
  }

  getRollList(
    standCategory: string,
    rollType: string,
    page: number = 1,
    pageSize: number = 50
  ): Observable<RollListResponse> {
    const params = new HttpParams()
      .set('stand_category', this.mapStandCategory(standCategory))
      .set('roll_type', rollType)
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    return this.http.get<RollListResponse>(`${this.baseUrl}/roll-list`, { params });
  }

  getRollUsage(rollId: string): Observable<RollUsageResponse> {
  return this.http.get<RollUsageResponse>(`${this.baseUrl}/roll-analysis/${rollId}/usage`);
}

  getRollAnalysis(rollId: string): Observable<RollAnalysisData> {
    const params = new HttpParams().set('platform', this.PLATFORM);
    return this.http.get<RollAnalysisData>(`${this.baseUrl}/roll-analysis/${rollId}`, { params });
  }
}