import { Component, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { ShareReportCredentialsDialogComponent } from './share-report-credentials-dialog/share-report-credentials-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { switchMap, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Client } from 'src/app/clients/models/client';
import { Cashflow } from 'src/app/clients/models/cashflow';
import { FinancialWorkflowService } from '../services/financial-workflow.service';
import { ShareReportHttpService, ClientReportRequest } from './services/share-report.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-share-report',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './share-report.component.html',
  styleUrl: './share-report.component.scss',
})
export class ShareReportComponent {
  reportForm: FormGroup;
  expiryOptions = [7, 14, 30];
  selectedExpiry: number;
  cashflow: Cashflow | null;
  client: Client;
  clientName: string;
  clientEmail: string;
  clientId: string;
  cashflowId: string;
  isLoaderVisible = false;
  isCopying = false;

  constructor(
    private dialogRef: MatDialogRef<ShareReportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    private translate: TranslateService,
    private matDialog: MatDialog,
    private financialWorkflowService: FinancialWorkflowService,
    private shareReportHttpService: ShareReportHttpService) 
  { 
    this.selectedExpiry = this.expiryOptions[0];

    this.reportForm = this.fb.group({
        expiry: [this.selectedExpiry]
    });

    this.getData();
  }

  getData() {
    this.activatedRoute.params
      .pipe(
        switchMap((params) =>
          this.financialWorkflowService.loadClientCashflowMetadata(params)
        ),
        tap(([client, cashflow]) => {
          this.client = client as Client;
          this.cashflow = cashflow as Cashflow;

          const first = this.client.clientDetails?.firstName || '';
          const last = this.client.clientDetails?.lastName || '';
          this.clientName = `${first.charAt(0).toUpperCase()}${first.slice(1).toLowerCase()} ` +
            `${last.charAt(0).toUpperCase()}${last.slice(1).toLowerCase()}`;
          
          this.clientEmail = this.client.clientDetails?.email;
          this.clientId = this.client.id;
          this.cashflowId = this.cashflow.id;
        })
      )
      .subscribe();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  copyLinkAndPassword(): void {
    if (!this.reportForm.valid || !this.clientId || !this.cashflowId) {
      this.toastr.error(this.translate.instant('ERROR.SHARE_REPORT_MISSING_DATA'));
      return;
    }

    const payload: ClientReportRequest = {
      clientId: this.clientId,
      cashflowId: this.cashflowId,
      expiryDays: this.reportForm.value.expiry,
      requestBy: this.client?.financialAdvisor?.advisorId ?? '',
      sendEmail: false,
    };

    this.isCopying = true;
    this.shareReportHttpService.addClientReport(payload).subscribe({
      next: (response) => {
        this.isCopying = false;
        if (!response?.success || !response.shareableUrl?.trim() || !response.password?.trim()) {
          this.toastr.error(this.translate.instant('ERROR.SHARE_REPORT_COPY_FAILED'));
          return;
        }
        const link = response.shareableUrl.trim();
        const password = response.password.trim();
        const text = this.translate.instant('SHARE.COPY_PLAN_ACCESS_BODY', {
          link,
          password,
        });
        const openCredentialsDialog = () => {
          this.matDialog.open(ShareReportCredentialsDialogComponent, {
            width: '520px',
            maxWidth: '95vw',
            data: { shareableUrl: link, password, fullCopyText: text },
            autoFocus: false,
          });
        };
        navigator.clipboard
          .writeText(text)
          .then(() => {
            this.toastr.success(
              this.translate.instant('TOAST.COPIED_TO_CLIPBOARD'),
            );
            openCredentialsDialog();
          })
          .catch(() => {
            this.toastr.info(
              this.translate.instant('TOAST.LINK_CREATED') + ' ' + text,
            );
            openCredentialsDialog();
          });
      },
      error: (error: HttpErrorResponse) => {
        this.isCopying = false;
        console.error('Error:', error);
        this.toastr.error(this.mapShareErrorMessage(error));
      },
    });
  }

  shareReport(): void {
    if (!this.reportForm.valid || !this.clientId || !this.cashflowId) {
      this.toastr.error(this.translate.instant('ERROR.SHARE_REPORT_MISSING_DATA'));
      return;
    }

    if (!this.clientEmail?.trim()) {
      this.toastr.error(this.translate.instant('ERROR.NO_CLIENT_EMAIL'));
      return;
    }

    const payload: ClientReportRequest = {
      clientId: this.clientId,
      cashflowId: this.cashflowId,
      expiryDays: this.reportForm.value.expiry,
      requestBy: this.client?.financialAdvisor?.advisorId ?? '',
      sendEmail: true,
    };

    this.isLoaderVisible = true;

    this.shareReportHttpService.addClientReport(payload).subscribe({
      next: (response) => {
        this.isLoaderVisible = false;
        if (!response?.success) {
          this.toastr.error(this.translate.instant('ERROR.SHARE_REPORT_FAILED'));
          return;
        }
        const name = this.clientName?.trim() || this.translate.instant('SHARE.CLIENT_FALLBACK_NAME');
        this.toastr.success(this.translate.instant('TOAST.PLAN_SHARE_EMAIL_SENT', { name }));
        this.dialogRef.close(true);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoaderVisible = false;
        console.error('Error:', error);
        this.toastr.error(this.mapShareErrorMessage(error));
      },
    });
  }

  private mapShareErrorMessage(error: HttpErrorResponse): string {
    const raw = this.parseErrorBody(error);
    if (raw === 'NO_CLIENT_EMAIL') {
      return this.translate.instant('ERROR.NO_CLIENT_EMAIL');
    }
    if (raw === 'EMAIL_SEND_FAILED' || raw === 'CREATE_FAILED') {
      return this.translate.instant('ERROR.SHARE_REPORT_FAILED');
    }
    return this.translate.instant('ERROR.SHARE_REPORT_FAILED');
  }

  private parseErrorBody(error: HttpErrorResponse): string {
    const body = error?.error;
    if (typeof body === 'string') {
      const trimmed = body.trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed) as { detail?: string };
          return parsed?.detail?.trim() ?? '';
        } catch {
          return trimmed;
        }
      }
      return trimmed.replace(/^"|"$/g, '');
    }
    if (body && typeof body === 'object' && 'detail' in body) {
      return String((body as { detail?: string }).detail ?? '').trim();
    }
    return '';
  }
}

