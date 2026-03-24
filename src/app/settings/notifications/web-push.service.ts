import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, switchMap, catchError, of } from 'rxjs';

export interface WebPushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable({ providedIn: 'root' })
export class WebPushService {
  private readonly baseUrl = '/api/v1/WebPush';

  constructor(private http: HttpClient) {}

  /** VAPID public key - fetched from backend or set manually. */
  private vapidPublicKey = '';

  setVapidPublicKey(key: string): void {
    this.vapidPublicKey = key;
  }

  /** Check if the current user has a push subscription. */
  hasSubscription(): Observable<boolean> {
    return this.http.get<{ hasSubscription: boolean }>(`${this.baseUrl}/has-subscription`).pipe(
      map((r) => r?.hasSubscription ?? false),
      catchError(() => of(false))
    );
  }

  /** Fetch VAPID public key from backend. Call before subscribe() if not set. */
  loadVapidPublicKey(): Observable<string> {
    return this.http.get<{ publicKey: string }>(`${this.baseUrl}/vapid-public-key`).pipe(
      map((r) => {
        this.vapidPublicKey = r?.publicKey ?? '';
        return this.vapidPublicKey;
      })
    );
  }

  /** Request notification permission and subscribe. Returns true if subscribed successfully. */
  subscribe(): Observable<boolean> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return new Observable((obs) => {
        obs.next(false);
        obs.complete();
      });
    }

    const key$ = this.vapidPublicKey
      ? new Observable<string>((o) => { o.next(this.vapidPublicKey); o.complete(); })
      : this.loadVapidPublicKey();

    return key$.pipe(
      switchMap(() => from(this.requestPermissionAndSubscribe())),
      switchMap((sub) => {
        if (!sub) return new Observable<boolean>((o) => { o.next(false); o.complete(); });
        const json = sub.toJSON();
        const keys = (json as any).keys ?? {};
        const payload = {
          endpoint: sub.endpoint,
          p256dh: keys['p256dh'] ?? '',
          auth: keys['auth'] ?? ''
        };
        return this.http.post<unknown>(`${this.baseUrl}/subscribe`, payload).pipe(
          switchMap(() => new Observable<boolean>((o) => { o.next(true); o.complete(); }))
        );
      })
    );
  }

  unsubscribe(endpoint?: string): Observable<void> {
    const url = endpoint ? `${this.baseUrl}/unsubscribe?endpoint=${encodeURIComponent(endpoint)}` : `${this.baseUrl}/unsubscribe`;
    return this.http.delete<void>(url);
  }

  private async requestPermissionAndSubscribe(): Promise<PushSubscription | null> {
    if (Notification.permission === 'denied') return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    if (!this.vapidPublicKey) {
      console.warn('WebPush: VAPID public key not set. Call setVapidPublicKey() or configure from backend.');
      return null;
    }

    const reg = await this.getServiceWorkerRegistration();
    if (!reg) return null;

    const key = this.urlBase64ToUint8Array(this.vapidPublicKey);
    // Cast: TS lib uses Uint8Array<ArrayBufferLike>; Push API expects BufferSource with ArrayBuffer.
    return reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key as BufferSource
    });
  }

  /** Get service worker registration. Registers sw-push.js if none exists (e.g. dev mode without ngsw). */
  private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    try {
      if (navigator.serviceWorker.controller) {
        return await navigator.serviceWorker.ready;
      }
      await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
      return await navigator.serviceWorker.ready;
    } catch (e) {
      console.warn('WebPush: Failed to get service worker registration', e);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const output = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
    return output;
  }
}
