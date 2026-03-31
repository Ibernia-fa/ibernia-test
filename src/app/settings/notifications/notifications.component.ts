import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { NotificationPreferencesService, NotificationPreference } from './notification-preferences.service';
import { WebPushService } from './web-push.service';
import { MyNotificationsService, UserNotificationItem } from 'src/app/core/services/my-notifications.service';
import {
  MFA_REMINDER_NOTIFICATION_ID,
  prependMfaReminderNotification,
} from 'src/app/core/mfa-reminder-notification';
import { notificationMatchesSearchQuery } from 'src/app/core/notification-search';
import { CapitalizeFirstPipe } from 'src/app/core/pipes/capitalize-first.pipe';
import { AuthService } from 'src/app/auth/services/auth.service';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatCard,
    MatCardContent,
    MatSlideToggle,
    MatSelectModule,
    MatButtonModule,
    MatDividerModule,
    FormsModule,
    CapitalizeFirstPipe,
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit {
  toggleStatus = true;   // Email News
  toggleStatus1 = true;  // Email Birthdays
  toggleStatus2 = true;  // Push News
  toggleStatus3 = true;  // Push Birthdays
  timezone = 'UTC';
  timezones: string[] = ['UTC', 'Europe/Rome', 'Europe/London', 'Europe/Paris', 'America/New_York'];
  loading = true;
  saving = false;
  pushEnabled = false;

  notifications: UserNotificationItem[] = [];
  notificationsLoading = false;
  notificationSearchQuery = '';
  readonly mfaReminderId = MFA_REMINDER_NOTIFICATION_ID;
  /** One bulk read-all per page visit (component instance). */
  private bulkMarkAllReadRequested = false;

  get filteredNotifications(): UserNotificationItem[] {
    const q = this.notificationSearchQuery.trim().toLowerCase();
    if (!q) return this.notifications;
    return this.notifications.filter((n) =>
      notificationMatchesSearchQuery(n, q, this.translate)
    );
  }

  constructor(
    private navItemService: NavItemService,
    private prefsService: NotificationPreferencesService,
    private webPushService: WebPushService,
    private myNotifications: MyNotificationsService,
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    this.navItemService.currentRouteName = 'Notifications';
  }

  ngOnInit(): void {
    this.loadPreferences();
    this.loadNotifications();
    if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
      try {
        this.timezones = ['UTC', ...Intl.supportedValuesOf('timeZone').filter(t => t.startsWith('Europe/') || t.startsWith('America/')).slice(0, 20)];
      } catch {
        // fallback to curated list
      }
    }
  }

  loadPreferences(): void {
    this.loading = true;
    this.prefsService.get().subscribe({
      next: (p) => {
        this.timezone = p.timezone ?? 'UTC';
        this.toggleStatus = p.categories?.['news']?.email ?? true;
        this.toggleStatus1 = p.categories?.['birthday']?.email ?? true;
        this.toggleStatus2 = p.categories?.['news']?.push ?? true;
        this.toggleStatus3 = p.categories?.['birthday']?.push ?? true;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.webPushService.hasSubscription().subscribe({
      next: (has) => { this.pushEnabled = has; },
      error: () => {}
    });
  }

  savePreferences(): void {
    this.saving = true;
    const prefs: NotificationPreference = {
      userId: '',
      timezone: this.timezone,
      categories: {
        news: { email: this.toggleStatus, push: this.toggleStatus2 },
        birthday: { email: this.toggleStatus1, push: this.toggleStatus3 }
      }
    };
    this.prefsService.update(prefs).subscribe({
      next: () => { this.saving = false; },
      error: () => { this.saving = false; }
    });
  }

  onToggleChange(): void {
    this.savePreferences();
  }

  onTimezoneChange(): void {
    this.savePreferences();
  }

  onPushToggleChange(): void {
    if (this.pushEnabled) {
      this.webPushService.subscribe().subscribe({
        next: (ok) => { this.pushEnabled = ok; },
        error: () => { this.pushEnabled = false; }
      });
    } else {
      this.webPushService.unsubscribe().subscribe({
        next: () => {},
        error: () => { this.pushEnabled = true; }
      });
    }
  }

  loadNotifications(): void {
    this.notificationsLoading = true;
    this.myNotifications.getList().subscribe({
      next: (list) => {
        this.notifications = prependMfaReminderNotification(
          list,
          this.authService.getUserProfile() as Record<string, unknown> | null,
          environment.authority
        );
        this.notificationsLoading = false;
        if (!this.bulkMarkAllReadRequested) {
          this.bulkMarkAllReadRequested = true;
          this.markAllReadExceptSecurityOnPage();
        }
      },
      error: () => (this.notificationsLoading = false)
    });
  }

  /** Marks every server-backed notification read; synthetic MFA row stays unread (not on API). */
  private markAllReadExceptSecurityOnPage(): void {
    this.myNotifications.markAllAsRead().subscribe({
      next: () => {
        for (const n of this.notifications) {
          if (n.id !== MFA_REMINDER_NOTIFICATION_ID) {
            n.isRead = true;
          }
        }
      },
      error: () => {},
    });
  }

  onNotificationClick(n: UserNotificationItem): void {
    if (n.id === MFA_REMINDER_NOTIFICATION_ID) {
      if (n.deepLink?.startsWith('http')) {
        window.open(n.deepLink, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    if (!n.isRead) {
      this.myNotifications.markAsRead(n.id).subscribe({
        next: () => {
          n.isRead = true;
        },
      });
    }
    if (n.deepLink) {
      if (n.deepLink.startsWith('http')) {
        window.open(n.deepLink, '_blank', 'noopener,noreferrer');
      } else {
        this.router.navigateByUrl(n.deepLink);
      }
    }
  }

}
