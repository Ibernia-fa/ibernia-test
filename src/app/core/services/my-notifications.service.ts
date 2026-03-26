import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, tap } from 'rxjs';

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
  /** Interpolation params when preview/title are translation keys (e.g. MFA reminder). */
  previewParams?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class MyNotificationsService {
  private readonly baseUrl = '/api/v1/MyNotifications';
  private readonly unreadCount$ = new BehaviorSubject<number>(0);
  private readonly _listsChanged = new Subject<void>();

  /** Emits when read state changes so header + /settings/notifications can reload lists. */
  readonly listsChanged$ = this._listsChanged.asObservable();

  constructor(private http: HttpClient) {}

  get list$(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/unread-count`).pipe(
      tap((c) => this.unreadCount$.next(c))
    );
  }

  getList(filter?: 'all' | 'unread'): Observable<UserNotificationItem[]> {
    const params = filter ? { filter } : undefined;
    return this.http.get<UserNotificationItem[]>(this.baseUrl, params ? { params } : {});
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        const current = this.unreadCount$.value;
        if (current > 0) this.unreadCount$.next(Math.max(0, current - 1));
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/read-all`, {}).pipe(
      tap(() => {
        this.unreadCount$.next(0);
        this._listsChanged.next();
      })
    );
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }
}
