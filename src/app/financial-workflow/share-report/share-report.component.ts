import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

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
  expiryOptions = [7, 14, 30];
  selectedExpiry = 7;
  
  reportForm: FormGroup;
  clientId: string;
  clientName: string;
  cashflowId: string;
  
  constructor(
    private dialogRef: MatDialogRef<ShareReportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private toastr: ToastrService) 
  {
      this.cashflowId = data.cashflowId;
      console.log(data);
    
      this.reportForm = this.fb.group({
        expiry: ['', Validators.required]
      });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  shareReport(): void {
    this.toastr.success('Report generated successfully and shared!');
  }
}

