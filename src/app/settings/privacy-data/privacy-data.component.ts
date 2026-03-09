import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, EMPTY } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { NgIf, NgFor, DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from 'src/app/auth/services/auth.service';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import {
  DataPrivacyService,
  RetentionStatusModel,
} from './data-privacy.service';

@Component({
  selector: 'app-privacy-data',
  templateUrl: './privacy-data.component.html',
  styleUrls: ['./privacy-data.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    TranslateModule,
  ],
})
export class PrivacyDataComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  user: any;
  retentionStatus: RetentionStatusModel | null = null;
  isLoading = false;
  isExporting = false;
  isTerminating = false;
  showTerminateConfirm = false;

  constructor(
    private privacyService: DataPrivacyService,
    private auth: AuthService,
    private navItemService: NavItemService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {
    this.navItemService.currentRouteName = 'Privacy & Data';
  }

  ngOnInit(): void {
    this.user = this.auth.getUserProfile();
    this.loadRetentionStatus();
  }

  private loadRetentionStatus(): void {
    if (!this.user?.sub) return;
    this.isLoading = true;

    this.privacyService
      .getDataInventory(this.user.sub)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Failed to load retention status', err);
          return EMPTY;
        }),
        finalize(() => (this.isLoading = false))
      )
      .subscribe((status) => {
        this.retentionStatus = status;
      });
  }

  exportMyData(): void {
    if (!this.user?.sub) return;
    this.isExporting = true;

    this.privacyService
      .exportAdvisorData(this.user.sub)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Export failed', err);
          this.toastr.error('Failed to export data', 'Error');
          return EMPTY;
        }),
        finalize(() => (this.isExporting = false))
      )
      .subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ibernia-data-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastr.success('Data exported successfully', 'Success');
      });
  }

  terminateAccount(): void {
    this.isTerminating = true;

    this.privacyService
      .terminateAccount()
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Account termination failed', err);
          this.toastr.error('Failed to process account closure request', 'Error');
          return EMPTY;
        }),
        finalize(() => (this.isTerminating = false))
      )
      .subscribe((response) => {
        this.showTerminateConfirm = false;
        this.toastr.success(response.message, 'Account Closure Initiated');
        this.loadRetentionStatus();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
