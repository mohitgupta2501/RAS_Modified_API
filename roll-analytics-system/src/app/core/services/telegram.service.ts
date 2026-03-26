import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TelegramLogApi {
  id: number;
  created_at: string;
  updated_at: string;
  chat_id: string;
  message: string;
  status: 'SENT' | 'RECEIVED';
  response_message: string;
}

export interface TelegramLogResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TelegramLogApi[];
}

@Injectable({
  providedIn: 'root'
})
export class TelegramService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getLogs(page: number = 1, pageSize?: number): Observable<TelegramLogResponse> {
    let params = new HttpParams().set('page', page.toString());
    if (pageSize) {
      params = params.set('page_size', pageSize.toString());
    }
    return this.http.get<TelegramLogResponse>(`${this.baseUrl}/log/telegram/`, { params });
  }
}