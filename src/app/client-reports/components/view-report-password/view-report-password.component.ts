import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-view-report-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './view-report-password.component.html',
  styleUrl: './view-report-password.component.scss',
})

export class ViewReportPasswordComponent {
  @Output() submitPassword = new EventEmitter<string>();
  showPassword = false;
  @Input() onSubmitPassword!: () => void;
  @Input() password = '';
  @Input() isLoaderVisible = false;

  constructor(private toastr: ToastrService) { }

  onSubmit() {
    if (!this.password.trim()) {
      this.toastr.error('Please enter a password', 'Error!');
      return;
    }
    
    this.submitPassword.emit(this.password);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
