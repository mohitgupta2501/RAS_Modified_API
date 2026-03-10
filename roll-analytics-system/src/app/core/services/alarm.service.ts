import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// ── Nested API shape (shared by all endpoints) ────────────────────────────────
export interface AlarmDefinitionDetail {
  alarm_id: string;
  created_at: string;
  updated_at: string;
  description: string;
  source: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  parameter_name: string;
  threshold_low: number;
  threshold_high: number;
  comparison_type: string;
  is_active: boolean;
  remarks: string;
}

export interface AlarmApiItem {
  id: number;
  alarm_definition: string;
  alarm_definition_detail: AlarmDefinitionDetail;
  status: 'ACTIVE' | 'CLEARED' | 'ACKNOWLEDGED';
  triggered_value: number;
  acknowledged_at: string | null;
  cleared_at: string | null;
  acknowledged_by: number | null;
  acknowledged_by_detail: { id: number; username: string } | null;
  remarks: string;
}

// ── Paginated response shape  (GET /api/alarms/) ──────────────────────────────
export interface AlarmApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AlarmApiItem[];
}

// ── Flat models consumed by components ────────────────────────────────────────
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Alarm {
  id: number;
  date: string;
  time: string;
  description: string;
  parameter: string;
  severity: Severity;
  status: string;
}

export interface NotifyAlarm {
  id: number;
  message: string;
  time: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  icon: string;
  read: boolean;
}

// ── Pure helper functions ─────────────────────────────────────────────────────

function severityToType(s: string): 'danger' | 'warning' | 'success' | 'info' {
  if (s === 'HIGH')   return 'danger';
  if (s === 'MEDIUM') return 'warning';
  return 'info';
}

function severityToIcon(s: string): string {
  if (s === 'HIGH')   return 'error';
  if (s === 'MEDIUM') return 'warning';
  return 'info';
}

function parseDateTime(isoString: string): { date: string; time: string } {
  if (!isoString) return { date: '—', time: '—' };
  const d = new Date(isoString);
  const date = d.toLocaleDateString('en-GB');                                     // 10/03/2026
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); // 11:42
  return { date, time };
}

function mapToAlarm(item: AlarmApiItem): Alarm {
  const detail = item.alarm_definition_detail;
  const { date, time } = parseDateTime(detail.created_at);
  return {
    id:          item.id,
    date,
    time,
    description: detail.description,
    parameter:   detail.parameter_name,
    severity:    detail.severity as Severity,
    status:      item.status
  };
}

function mapToNotifyAlarm(item: AlarmApiItem): NotifyAlarm {
  const detail = item.alarm_definition_detail;
  const { time } = parseDateTime(detail.created_at);
  return {
    id:      item.id,
    message: detail.description,
    time,
    type:    severityToType(detail.severity),
    icon:    severityToIcon(detail.severity),
    read:    item.status === 'ACKNOWLEDGED' || item.status === 'CLEARED'
  };
}

// ── Extract items from either paginated OR plain-array response ───────────────
function extractItems(res: AlarmApiResponse | AlarmApiItem[]): AlarmApiItem[] {
  return Array.isArray(res) ? res : res.results ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AlarmService {

  // ── Your backend IP ───────────────────────────────────────────────────────
  private baseUrl = 'http://10.139.199.250:8000';

  constructor(private http: HttpClient) {}

  private get authHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // ── 1. GET /api/alarms/?page=1&page_size=100 ──────────────────────────────
  //    Paginated  →  used by AlarmsComponent (full table)
  getAlarms(page = 1, pageSize = 100): Observable<Alarm[]> {
    return this.http
      .get<AlarmApiResponse>(
        `${this.baseUrl}/api/alarms/?page=${page}&page_size=${pageSize}`,
        { headers: this.authHeaders }
      )
      .pipe(map(res => extractItems(res).map(mapToAlarm)));
  }

  // ── 2. GET /api/alarms/latest/ ────────────────────────────────────────────
  //    May be paginated or plain array  →  used by FooterComponent
  getLatestAlarms(): Observable<Alarm[]> {
    return this.http
      .get<AlarmApiResponse | AlarmApiItem[]>(
        `${this.baseUrl}/api/alarms/latest/`,
        { headers: this.authHeaders }
      )
      .pipe(map(res => extractItems(res as AlarmApiResponse).map(mapToAlarm)));
  }

  // ── 3. GET /api/alarms/notify/ ────────────────────────────────────────────
  //    Returns a PLAIN ARRAY (not paginated)  →  used by NotificationComponent
  getNotifyAlarms(): Observable<NotifyAlarm[]> {
    return this.http
      .get<AlarmApiItem[]>(                          // ← typed as plain array
        `${this.baseUrl}/api/alarms/notify/`,
        { headers: this.authHeaders }
      )
      .pipe(map(items => items.map(mapToNotifyAlarm)));
  }

  // ── 4. PATCH /api/alarms/{id}/ ────────────────────────────────────────────
  //    Acknowledge / update an alarm
  patchAlarm(id: number, payload: Partial<AlarmApiItem>): Observable<AlarmApiItem> {
    return this.http.patch<AlarmApiItem>(
      `${this.baseUrl}/api/alarms/${id}/`,
      payload,
      { headers: this.authHeaders }
    );
  }
}