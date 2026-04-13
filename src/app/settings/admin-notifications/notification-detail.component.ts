import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationsHttpService, NotificationResponse } from './notifications-http.service';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, TranslateModule],
  templateUrl: './notification-detail.component.html',
  styleUrl: './notification-detail.component.scss'
})
export class NotificationDetailComponent implements OnInit {
  notification: NotificationResponse | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private http: NotificationsHttpService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    this.http.get(id).subscribe({
      next: (n) => {
        this.notification = n;
        this.loading = false;
      },
      error: () => {
        this.notification = null;
        this.loading = false;
      }
    });
  }

  objectKeys(obj: Record<string, string>): string[] {
    return Object.keys(obj);
  }

  statusPillClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    const known = ['draft', 'scheduled', 'sent', 'failed', 'partial', 'processing'];
    const key = known.includes(s) ? s : 'default';
    return `admin-status-pill status-${key}`;
  }

  adminStatusLabel(status: string | undefined): string {
    const raw = (status ?? '').trim();
    if (!raw) return '';
    const key = `NOTIFICATION.ADMIN_STATUS.${raw.toLowerCase()}`;
    const t = this.translate.instant(key);
    return t !== key ? t : raw;
  }
}
