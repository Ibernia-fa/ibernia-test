import { Injectable } from '@angular/core';

/** Keeps the "New" label visible for a short time after a notification is marked read (visibility / API). */
@Injectable({ providedIn: 'root' })
export class NotificationNewLabelGraceService {
  readonly graceMs = 4000;
  private readonly visibleUntilById = new Map<string, number>();

  shouldShowNewLabel(notificationId: string, isRead: boolean): boolean {
    if (!isRead) return true;
    const until = this.visibleUntilById.get(notificationId);
    return until != null && Date.now() < until;
  }

  recordMarkedRead(notificationId: string): void {
    this.visibleUntilById.set(notificationId, Date.now() + this.graceMs);
  }
}
