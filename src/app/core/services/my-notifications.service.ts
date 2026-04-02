import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  Subject,
  Subscription,
  timer,
  merge,
  fromEvent,
  EMPTY,
} from 'rxjs';
import { tap, switchMap, map, filter, debounceTime, catchError } from 'rxjs/operators';

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
  /** Last value from GET unread-count (not optimistic mark-as-read); used to detect new notifications. */
  private lastServerUnreadCount: number | null = null;
  /** Emits when server unread count increases — refresh bell list / settings list. */
  private readonly feedStale$ = new Subject<void>();
  readonly notificationFeedStale = this.feedStale$.asObservable();
  private pollSubscription: Subscription | null = null;
  /** Default 45s; also refreshes when the tab becomes visible again. */
  private static readonly DEFAULT_POLL_MS = 5000;

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
      tap((c) => this.applyUnreadCountFromServer(c))
    );
  }

  private applyUnreadCountFromServer(c: number): void {
    if (this.lastServerUnreadCount !== null && c > this.lastServerUnreadCount) {
      this.feedStale$.next();
    }
    this.lastServerUnreadCount = c;
    this.serverUnreadCount$.next(c);
  }

  /**
   * Polls unread count while the app is open (visible tab). Keeps the bell badge in sync without a full refresh.
   * When the count increases, {@link notificationFeedStale} emits so UIs can reload the list.
   */
  startUnreadPolling(intervalMs = MyNotificationsService.DEFAULT_POLL_MS): void {
    this.stopUnreadPolling();
    if (typeof document === 'undefined') {
      return;
    }
    const tick$ = merge(
      timer(0, intervalMs),
      fromEvent(document, 'visibilitychange').pipe(
        filter(() => document.visibilityState === 'visible'),
        debounceTime(400)
      )
    ).pipe(
      filter(() => document.visibilityState === 'visible'),
      switchMap(() => this.getUnreadCount().pipe(catchError(() => EMPTY)))
    );
    this.pollSubscription = tick$.subscribe();
  }

  stopUnreadPolling(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = null;
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
