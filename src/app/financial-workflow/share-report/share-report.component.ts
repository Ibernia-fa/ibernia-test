import { Component, Inject, OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { switchMap, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Client } from 'src/app/clients/models/client';
import { Cashflow } from 'src/app/clients/models/cashflow';
import { FinancialWorkflowService } from '../services/financial-workflow.service';
import { ShareReportHttpService, ClientReportRequest } from './services/share-report.service';

@Component({
  selector: 'app-share-report',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule
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
  
  constructor(
    private dialogRef: MatDialogRef<ShareReportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
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
          this.clientName = this.client.clientDetails?.firstName + " " + this.client.clientDetails.lastName;
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

  shareReport(): void {
    if (!this.reportForm.valid || !this.clientId || !this.cashflowId) {
      this.toastr.error('Missing required data to share the report.', 'Error!');
      return;
    }

    const payload: ClientReportRequest = {
      clientId: this.clientId,
      cashflowId: this.cashflowId,
      expiryDays: this.reportForm.value.expiry,
      requestBy: '68ffab8cb56a1334d8b24d8f' // todo get current user id
    };

    this.isLoaderVisible = true;

    this.shareReportHttpService.addClientReport(payload).subscribe({
      next: (response) => {
        this.isLoaderVisible = false;
        this.toastr.success(
          `Link and password successfully sent to ${this.clientName || 'client'}.`
        );
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.isLoaderVisible = false;
        console.error('Error:', error);
        this.toastr.error('Failed to share the report. Please try again.', 'Error!');
      },
    });
  }
}

