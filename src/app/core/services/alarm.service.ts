import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment'; // ✅ added

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
  const date = d.toLocaleDateString('en-GB');
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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

  // ✅ No hardcoded IP — reads from environment.apiUrl
  // Change IP only in proxy.conf.json (dev) or environment.prod.ts (prod)
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private get authHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // ── 1. GET /api/alarms/?page=1&page_size=10 ───────────────────────────────
  //    True server-side pagination → page & page_size sent on every call
  //    Returns { count, alarms } so component knows the real total
  getAlarms(page = 1, pageSize = 10): Observable<{ count: number; alarms: Alarm[] }> {
    return this.http
      .get<AlarmApiResponse>(
        `${this.baseUrl}/alarms/?page=${page}&page_size=${pageSize}`, // ✅ removed duplicate /api
        { headers: this.authHeaders }
      )
      .pipe(
        map(res => ({
          count:  res.count,
          alarms: extractItems(res).map(mapToAlarm)
        }))
      );
  }

  // ── 2. GET /api/alarms/latest/ ────────────────────────────────────────────
  //    Plain array response → used by FooterComponent
  getLatestAlarms(): Observable<Alarm[]> {
    return this.http
      .get<AlarmApiItem[]>(
        `${this.baseUrl}/alarms/latest/`, // ✅ removed duplicate /api
        { headers: this.authHeaders }
      )
      .pipe(map(items => items.map(mapToAlarm)));
  }

  // ── 3. GET /api/alarms/notify/ ────────────────────────────────────────────
  //    Plain array response → used by NotificationComponent
  getNotifyAlarms(): Observable<NotifyAlarm[]> {
    return this.http
      .get<AlarmApiItem[]>(
        `${this.baseUrl}/alarms/notify/`, // ✅ removed duplicate /api
        { headers: this.authHeaders }
      )
      .pipe(map(items => items.map(mapToNotifyAlarm)));
  }

  // ── 4. PATCH /api/alarms/{id}/ ────────────────────────────────────────────
  //    Acknowledge / update an alarm
  patchAlarm(id: number, payload: Partial<AlarmApiItem>): Observable<AlarmApiItem> {
    return this.http.patch<AlarmApiItem>(
      `${this.baseUrl}/alarms/${id}/`, // ✅ removed duplicate /api
      payload,
      { headers: this.authHeaders }
    );
  }
}