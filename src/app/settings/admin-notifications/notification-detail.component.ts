import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsHttpService, NotificationResponse } from './notifications-http.service';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, TranslateModule],
  templateUrl: './notification-detail.component.html'
})
export class NotificationDetailComponent implements OnInit {
  notification: NotificationResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: NotificationsHttpService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http.get(id).subscribe({
        next: (n) => this.notification = n,
        error: () => {}
      });
    }
  }
}
