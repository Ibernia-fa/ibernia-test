import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';
import { NotificationsHttpService, CreateNotificationRequest } from './notifications-http.service';
import { AdvisorsHttpService, AdvisorSearchResult } from './advisors-http.service';

@Component({
  selector: 'app-notification-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './notification-form.component.html',
  styleUrl: './notification-form.component.scss'
})
export class NotificationFormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  searchControl = new FormControl('');
  searchResults: AdvisorSearchResult[] = [];
  searchLoading = false;
  selectedAdvisors: AdvisorSearchResult[] = [];
  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private http: NotificationsHttpService,
    private advisorsHttp: AdvisorsHttpService,
    private router: Router
  ) {
    this.form = this.fb.group({
      title: [''],
      body: [''],
      channel: ['both'],
      audienceType: ['all'],
      scheduledAt: [null],
      deepLink: ['']
    });
  }

  ngOnInit(): void {
    this.search$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          if (!q || q.length < 2) {
            this.searchResults = [];
            return of([]);
          }
          this.searchLoading = true;
          return this.advisorsHttp.search(q, 20);
        })
      )
      .subscribe({
        next: (list) => {
          this.searchResults = list;
          this.searchLoading = false;
        },
        error: () => (this.searchLoading = false)
      });

    this.searchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((v) => {
      const q = typeof v === 'string' ? v : '';
      this.search$.next(q);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAudienceChange(): void {
    if (this.form.get('audienceType')?.value !== 'selected') {
      this.selectedAdvisors = [];
      this.searchControl.setValue('');
    }
  }

  onAdvisorSelected(event: { option: { value: AdvisorSearchResult } }): void {
    const a = event.option.value;
    if (a && !this.isSelected(a.userId)) {
      this.selectedAdvisors = [...this.selectedAdvisors, a];
    }
    this.searchControl.setValue('', { emitEvent: false });
  }

  isSelected(userId: string): boolean {
    return this.selectedAdvisors.some((a) => a.userId === userId);
  }

  removeAdvisor(userId: string): void {
    this.selectedAdvisors = this.selectedAdvisors.filter((a) => a.userId !== userId);
  }

  submit(): void {
    const v = this.form.value;
    if (v.audienceType === 'selected' && this.selectedAdvisors.length === 0) {
      return; // Don't submit without selected users
    }
    const req: CreateNotificationRequest = {
      type: 'admin',
      templateKey: 'admin_announcement',
      templateData: { title: v.title ?? '', body: v.body ?? '' },
      channel: v.channel || 'both',
      audienceType: v.audienceType || 'all',
      targetUserIds: v.audienceType === 'selected' ? this.selectedAdvisors.map((a) => a.userId) : [],
      status: v.scheduledAt ? 'scheduled' : 'draft',
      scheduledAtUtc: v.scheduledAt ? new Date(v.scheduledAt).toISOString() : undefined,
      deepLink: v.deepLink || undefined
    };
    this.http.create(req).subscribe({
      next: () => this.router.navigate(['/settings/admin-notifications']),
      error: () => {}
    });
  }

  cancel(): void {
    this.router.navigate(['/settings/admin-notifications']);
  }
}
