import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

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

export interface RollCounts {
  ALL: number;
  FM: number;
  DC: number;
  EG: number;
  RM: number;
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

export type StandSection = 'ALL' | 'RM' | 'FM' | 'EG' | 'DC';

@Injectable({ providedIn: 'root' })
export class RollService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

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
      .get<ApiResponse>(`${this.baseUrl}/home/runtime/${section}`, { params })
      .pipe(
        map((res) => ({
          count: res.count ?? 0,
          rows: (res.results ?? []).map((item) => this.mapToRollRow(item))
        }))
      );
  }

  getRollCounts(): Observable<RollCounts> {
    return this.http
      .get<Partial<RollCounts>>(`${this.baseUrl}/home/runtime/counts`)
      .pipe(
        map((counts) => ({
          ALL: counts.ALL ?? 0,
          FM: counts.FM ?? 0,
          DC: counts.DC ?? 0,
          EG: counts.EG ?? 0,
          RM: counts.RM ?? 0
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
