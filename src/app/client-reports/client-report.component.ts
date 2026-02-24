import { Component, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ViewReportHttpService } from './services/view-report-http.service';
import { ViewReportPasswordComponent } from './components/view-report-password/view-report-password.component';
import { ViewReportComponent } from './components/view-report/view-report.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-client-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    ViewReportPasswordComponent,
    ViewReportComponent,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './client-report.component.html',
  styleUrl: './client-report.component.scss',
})

export class ClientReportComponent {
  @ViewChild('welcomeDialog') welcomeDialog!: TemplateRef<any>;

  financialSeries: any = null;
  isAuthenticated = false;
  isLoaderVisible: boolean;
  token: string = '';
  password: string = '';
  lifetimePlanName: string;
  advisorName: string;

  consumerQuestion = '';
  consumerAnswer: string | null = null;
  consumerError: string | null = null;
  consumerAskLoading = false;

  private readonly AUTH_KEY_PREFIX = 'report_auth_';
  private readonly EXPIRY_DURATION_MS = 60 * 60 * 1000; // 1 hour

  constructor(
    private dialog: MatDialog,
    private viewReportHttpService: ViewReportHttpService,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      this.token = params['token'];

      if (!this.token) {
        this.toastr.error('Invalid or missing token in URL', 'Error!');
      }

      this.checkExistingAuthentication();
    });

    sessionStorage.setItem('session_active', 'true');
  }

  private checkExistingAuthentication(): void {
    const storedData = localStorage.getItem(this.AUTH_KEY_PREFIX + this.token);
    if (!storedData) return;

    try {
      const { timestamp, password } = JSON.parse(storedData);
      const now = Date.now();

      if (now - timestamp < this.EXPIRY_DURATION_MS) {
        this.password = password;
        this.isAuthenticated = true;

        this.loadReport();
      } else {
        localStorage.removeItem(this.AUTH_KEY_PREFIX + this.token);
      }
    } catch {
      localStorage.removeItem(this.AUTH_KEY_PREFIX + this.token);
    }
  }

  private loadReport(): void {
    this.isLoaderVisible = true;

    if (!this.token || !this.password) {
      this.toastr.error('Missing token or password, cannot load report', 'Error!');
      return;
    }

    this.viewReportHttpService.viewReport(this.token, this.password).subscribe({
      next: (financialSeries: any) => {
        this.financialSeries = financialSeries;
        this.isLoaderVisible = false;
      },
      error: (err: any) => {
        this.isLoaderVisible = false;
        console.log(err);
        this.toastr.error('Unable to load report. Please try again later', 'Error!');
        localStorage.removeItem(this.AUTH_KEY_PREFIX + this.token);
        this.isAuthenticated = false;
      }
    });
  }

  onSubmitPassword(password: string): void {
    this.password = password.trim();
    this.isLoaderVisible = true;

    if (!this.password) {
      this.toastr.error('Please enter a password', 'Error!');
      this.isLoaderVisible = false;
      return;
    }

    // load data
    this.viewReportHttpService.viewReport(this.token, this.password).subscribe({
      next: (financialSeries: any) => {
        this.financialSeries = financialSeries;

        this.lifetimePlanName = this.financialSeries?.cashflow?.name;
        this.advisorName = this.financialSeries?.client?.financialAdvisor?.advisorName;

        // show welcome popup
          if(this.lifetimePlanName && this.advisorName){
            this.dialog.open(this.welcomeDialog, {
            width: '500px',
            disableClose: true
          });
        }
        
        const authData = {
          token: this.token,
          password: this.password,
          timestamp: Date.now()
        };
        localStorage.setItem(this.AUTH_KEY_PREFIX + this.token, JSON.stringify(authData));
      },
      error: (err: any) => {
        this.isLoaderVisible = false;

        if (err.status === 401) {
          this.toastr.error('Incorrect password. Please try again', 'Error!');
        } else if (err.status === 410) {
          this.toastr.error('This link has expired. Please contact support', 'Error!');
        } else if (err.status === 400) {
          this.toastr.error('Invalid or missing link', 'Error!');
        } else {
          this.toastr.error('Unable to load report. Please try again later', 'Error!');
        }
      }
    });
  }

  onContinue(): void {
    this.isAuthenticated = true;
    this.isLoaderVisible = false;
  }

  onConsumerAsk(): void {
    const msg = this.consumerQuestion?.trim();
    if (!msg || !this.token || !this.password) return;
    this.consumerAskLoading = true;
    this.consumerError = null;
    this.consumerAnswer = null;
    this.viewReportHttpService.consumerAsk(this.token, this.password, msg).subscribe({
      next: (res) => {
        this.consumerAskLoading = false;
        if (res.success && res.answer != null) {
          this.consumerAnswer = res.answer;
        } else {
          this.consumerError = res.message ?? 'Unable to get an answer.';
        }
      },
      error: (err) => {
        this.consumerAskLoading = false;
        this.consumerError = err?.error?.message ?? 'Something went wrong. Try again.';
      }
    });
  }
}
