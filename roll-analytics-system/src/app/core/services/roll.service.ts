import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface RollRow {
  rollId: string;
  stand: string;
  type: string;
  position: string;
  cycleWeight: number;
  cycleLength: number;
  cumulWeight: number;
  cumulLength: number;
  noOfCycle: number;
  supplier: string;
  progress: number;
}

export interface RollApiResult {
  count: number;
  rows: RollRow[];
}

// ─── Internal API shape (what backend actually returns) ───────────────────────

interface ApiRollItem {
  roll_id: string | null;
  stand: string | null;
  type: string | null;
  position: string | null;
  cycle: { weight: number; length: number } | null;
  cumulative: { weight: number; length: number } | null;
  cycles: number | null;
  supplier: string | null;
  campaign_utilization: number | null;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiRollItem[];
}

// ─── Valid stand section values matching the API path param ──────────────────

export type StandSection = 'ALL' | 'FM' | 'DC' | 'EG' | 'RM';

@Injectable({ providedIn: 'root' })
export class RollService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://10.139.199.250:8000';

  /**
   * Fetch roll data for a given stand section with server-side pagination.
   * @param section  - One of: ALL | FM | DC | EG | RM
   * @param page     - Page number (1-based)
   * @param pageSize - Number of rows per page
   */
  getRolls(
    section: StandSection = 'ALL',
    page: number = 1,
    pageSize: number = 15
  ): Observable<RollApiResult> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    return this.http
      .get<ApiResponse>(`${this.baseUrl}/api/home/runtime/${section}`, { params })
      .pipe(
        map((res) => ({
          count: res.count ?? 0,
          rows: (res.results ?? []).map((item) => this.mapToRollRow(item))
        }))
      );
  }

  // ─── Private mapper: API snake_case → component camelCase ──────────────────

  private mapToRollRow(item: ApiRollItem): RollRow {
    return {
      rollId:      item.roll_id                              ?? '-',
      stand:       item.stand                                ?? '-',
      type:        item.type                                 ?? '-',
      position:    item.position                             ?? '-',
      cycleWeight: parseFloat((item.cycle?.weight      ?? 0).toFixed(2)),
      cycleLength: parseFloat((item.cycle?.length      ?? 0).toFixed(2)),
      cumulWeight: parseFloat((item.cumulative?.weight ?? 0).toFixed(2)),
      cumulLength: parseFloat((item.cumulative?.length ?? 0).toFixed(2)),
      noOfCycle:   item.cycles                               ?? 0,
      supplier:    item.supplier                             ?? '-',
      progress:    item.campaign_utilization                 ?? 0
    };
  }
}