// import { Component, Inject } from '@angular/core';
// import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
// import {MatCheckboxModule} from '@angular/material/checkbox';

// @Component({
//   selector: 'app-compare-cashflows',
//   imports: [
//     MatCheckboxModule,
//   ],
//   templateUrl: './compare-cashflows.component.html',
//   styleUrl: './compare-cashflows.component.scss'
// })
// export class CompareCashflowsComponent {
//   cashFlows: any;
// constructor(
//       private dialogRef: MatDialogRef<CompareCashflowsComponent>,
//       @Inject(MAT_DIALOG_DATA) public data: any,
// ){
//   this.cashFlows = data.cashflows
//   console.log('data in com', this.cashFlows);
// }

//     closeDialog(): void {
//     this.dialogRef.close();
//   }
// }
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cashflow } from 'src/app/clients/models/cashflow';
import { TranslateModule } from '@ngx-translate/core';

interface CompareDialogData {
  cashflows: Cashflow[];
  baseCashflowId: string;
}

@Component({
  selector: 'app-compare-cashflows',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatRadioModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './compare-cashflows.component.html',
  styleUrl: './compare-cashflows.component.scss'
})
export class CompareCashflowsComponent {
  baseCashflow: Cashflow | null = null;
  otherCashflows: Cashflow[] = [];
  selectedOtherId: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<CompareCashflowsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompareDialogData
  ) {
    const all = data.cashflows || [];
    this.baseCashflow = all.find(c => c.id === data.baseCashflowId) ?? null;
    this.otherCashflows = all.filter(c => c.id !== data.baseCashflowId);

    // Preselect first other plan if any
    if (this.otherCashflows.length > 0) {
      this.selectedOtherId = this.otherCashflows[0].id;
    }

    console.log('baseCashflow', this.baseCashflow);
    console.log('otherCashflows', this.otherCashflows);
  }

  closeDialog(): void {
    this.dialogRef.close({
  baseId: this.data.baseCashflowId,
  compareWithId: this.selectedOtherId
});
  }

  save(): void {
    if (!this.selectedOtherId) {
      return;
    }
    // send only the other plan id back to parent
    this.dialogRef.close(this.selectedOtherId);
  }
}
