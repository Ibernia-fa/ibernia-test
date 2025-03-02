import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddIncomeComponent } from './add-income/add-income.component';
import { AddExpenseComponent } from './add-expense/add-expense.component';

@Component({
  selector: 'app-income-expenses',
  imports: [
    MatDialogModule,
    CommonModule
  ],
  templateUrl: './income-expenses.component.html',
  styleUrl: './income-expenses.component.scss'
})
export class IncomeExpensesComponent {

  constructor(private dialog: MatDialog) {

  }


  newIncomeClicked() {
    const dialogRef = this.dialog.open(AddIncomeComponent, {
      width: '700px',
      disableClose: true,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }

  newExpenseClicked() {
    const dialogRef = this.dialog.open(AddExpenseComponent, {
      width: '700px',
      disableClose: true,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }
}
