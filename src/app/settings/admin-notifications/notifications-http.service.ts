import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface NotificationResponse {
  id: string;
  type: string;
  templateKey: string;
  templateData: Record<string, string>;
  channel: string;
  audienceType: string;
  targetUserIds: string[];
  status: string;
  scheduledAtUtc?: string;
  sentAtUtc?: string;
  expiresAtUtc?: string;
  deepLink?: string;
  createdAt: string;
  deliveryStats?: {
    queued: number;
    sent: number;
    failed: number;
    delivered?: number;
  };
  failedDeliveries?: { userId: string; channel: string; failureReason: string }[];
}

export interface CreateNotificationRequest {
  type?: string;
  templateKey?: string;
  templateData?: Record<string, string>;
  channel?: string;
  audienceType?: string;
  targetUserIds?: string[];
  status?: string;
  scheduledAtUtc?: string;
  expiresAtUtc?: string;
  deepLink?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsHttpService {
  private readonly baseUrl = '/api/v1/Notifications';

  constructor(private http: HttpClient) {}

  list(params?: { status?: string; type?: string; from?: string; to?: string }): Observable<NotificationResponse[]> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.from) httpParams = httpParams.set('from', params.from);
    if (params?.to) httpParams = httpParams.set('to', params.to);
    return this.http.get<unknown>(this.baseUrl, { params: httpParams }).pipe(
      map((raw) => NotificationsHttpService.coerceNotificationList(raw))
    );
  }

  /** MatTableDataSource treats non-arrays as empty; normalize common API wrapper shapes. */
  private static coerceNotificationList(raw: unknown): NotificationResponse[] {
    if (Array.isArray(raw)) return raw as NotificationResponse[];
    if (raw && typeof raw === 'object') {
      const o = raw as Record<string, unknown>;
      if (Array.isArray(o['items'])) return o['items'] as NotificationResponse[];
      if (Array.isArray(o['data'])) return o['data'] as NotificationResponse[];
      if (Array.isArray(o['value'])) return o['value'] as NotificationResponse[];
    }
    return [];
  }

  get(id: string): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.baseUrl}/${id}`);
  }

  create(req: CreateNotificationRequest): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(this.baseUrl, req);
  }

  update(id: string, req: Partial<CreateNotificationRequest>): Observable<NotificationResponse> {
    return this.http.put<NotificationResponse>(`${this.baseUrl}/${id}`, req);
  }

  send(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/send`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
