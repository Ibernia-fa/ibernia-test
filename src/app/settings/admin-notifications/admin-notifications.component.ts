import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { NotificationsHttpService, NotificationResponse } from './notifications-http.service';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './admin-notifications.component.html',
  styleUrl: './admin-notifications.component.scss'
})
export class AdminNotificationsComponent implements OnInit {
  dataSource = new MatTableDataSource<NotificationResponse>([]);
  displayedColumns = ['type', 'status', 'channel', 'audienceType', 'createdAt', 'actions'];
  loading = true;

  constructor(
    private navItemService: NavItemService,
    private http: NotificationsHttpService,
    private translate: TranslateService
  ) {
    this.navItemService.currentRouteName = this.translate.instant('LABEL.ADMIN_NOTIFICATIONS');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.list({}).subscribe({
      next: (list) => {
        this.dataSource.data = list;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  send(id: string): void {
    this.http.send(id).subscribe({
      next: () => this.load(),
      error: () => {}
    });
  }

  delete(id: string): void {
    if (confirm(this.translate.instant('CONFIRM.DELETE_NOTIFICATION'))) {
      this.http.delete(id).subscribe({
        next: () => this.load(),
        error: () => {}
      });
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'draft': return 'warn';
      case 'scheduled': return 'accent';
      case 'sent': return 'primary';
      case 'failed': return 'warn';
      default: return '';
    }
  }
}
