import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { TextFieldModule } from '@angular/cdk/text-field';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';
import { NotificationsHttpService, CreateNotificationRequest } from './notifications-http.service';
import { AdvisorsHttpService, AdvisorSearchResult } from './advisors-http.service';

const MAX_MESSAGE_WORDS = 500;

function countWords(value: unknown): number {
  const s = typeof value === 'string' ? value : '';
  const t = s.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function maxWordsValidator(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const n = countWords(control.value);
    return n > max ? { maxWords: { max, actual: n } } : null;
  };
}

/** Required after trim (blocks whitespace-only). */
function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  const s = (control.value ?? '').toString().trim();
  return s.length > 0 ? null : { required: true };
}

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
    TextFieldModule,
    TranslateModule
  ],
  templateUrl: './notification-form.component.html',
  styleUrl: './notification-form.component.scss'
})
export class NotificationFormComponent implements OnInit, OnDestroy {
  readonly maxMessageWords = MAX_MESSAGE_WORDS;
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
      title: ['', Validators.required],
      body: ['', [Validators.required, maxWordsValidator(MAX_MESSAGE_WORDS)]],
      titleIt: [''],
      bodyIt: ['', [maxWordsValidator(MAX_MESSAGE_WORDS)]],
      categoryLabel: ['', trimmedRequired],
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

  get messageWordCount(): number {
    return countWords(this.form.get('body')?.value);
  }

  get messageWordCountIt(): number {
    return countWords(this.form.get('bodyIt')?.value);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    if (v.audienceType === 'selected' && this.selectedAdvisors.length === 0) {
      return; // Don't submit without selected users
    }
    const labelTrim = (v.categoryLabel ?? '').trim().slice(0, 64);
    const templateData: Record<string, string> = {
      title: v.title ?? '',
      body: v.body ?? '',
      categoryLabel: labelTrim
    };
    const titleIt = (v.titleIt ?? '').trim();
    const bodyIt = (v.bodyIt ?? '').trim();
    if (titleIt) templateData['titleIt'] = titleIt;
    if (bodyIt) templateData['bodyIt'] = bodyIt;
    const req: CreateNotificationRequest = {
      type: 'admin',
      templateKey: 'admin_announcement',
      templateData,
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
