import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, switchMap, map } from 'rxjs';

export interface UserNotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  preview: string;
  sentAtUtc: string;
  isRead: boolean;
  deepLink: string;
  iconType: string;
  /** Admin-set pill text for announcements; when absent, UI shows "News". */
  categoryLabel?: string | null;
  /** Interpolation params when preview/title are translation keys (e.g. MFA reminder). */
  previewParams?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class MyNotificationsService {
  private readonly baseUrl = '/api/v1/MyNotifications';
  private readonly serverUnreadCount$ = new BehaviorSubject<number>(0);
  /** Incremented when server-side bulk read invalidates cached in-memory lists (e.g. notifications page). */
  private feedsRevision = 0;

  constructor(private http: HttpClient) {}

  getFeedsRevision(): number {
    return this.feedsRevision;
  }

  /** Emits server-side unread count (excludes synthetic MFA row). Header applies MFA badge adjustment. */
  get serverUnreadCount(): Observable<number> {
    return this.serverUnreadCount$.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/unread-count`).pipe(
      tap((c) => this.serverUnreadCount$.next(c))
    );
  }

  getList(filter?: 'all' | 'unread'): Observable<UserNotificationItem[]> {
    const params = filter ? { filter } : undefined;
    return this.http.get<UserNotificationItem[]>(this.baseUrl, params ? { params } : {});
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        const current = this.serverUnreadCount$.value;
        if (current > 0) this.serverUnreadCount$.next(Math.max(0, current - 1));
      })
    );
  }

  /** Marks all real deliveries read (server). Refreshes unread count from API. */
  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/read-all`, {}).pipe(
      switchMap(() => this.getUnreadCount()),
      tap(() => {
        this.feedsRevision++;
      }),
      map(() => void 0)
    );
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }
}
