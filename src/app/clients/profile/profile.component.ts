import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ClientHttpService } from '../services/client-http.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Client } from '../models/client';
import { catchError, combineLatest, combineLatestWith, distinctUntilChanged, filter, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AgeCalculatorPipe } from 'src/app/pipe/age-calculator.pipe';
import { MatDialog } from '@angular/material/dialog';
import { AddModelDialogComponent } from './add-model-dialog/add-model-dialog.component';
import { CashflowHttpService } from '../services/cashflow-http.service';
import { Cashflow } from '../models/cashflow';
import { TimeAgoPipe } from 'src/app/pipe/time-ago.pipe';
import { DialogComponent } from 'src/app/dialog/dialog.component';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { EditModelDialogComponent } from './edit-model-dialog/edit-model-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { selectedClient } from 'src/app/store/client/client.selectors';
import * as ClientActions from 'src/app/store/client/client.actions';
import * as CashflowActions from 'src/app/store/cashflow/cashflow.actions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
interface SortDescriptor {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-profile',
  imports: [
    MatCardModule,
    TablerIconsModule,
    CommonModule,
    MatButtonModule,
    AgeCalculatorPipe,
    MatMenuModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    TimeAgoPipe,
    ToastrModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  providers: [RouterModule, DatePipe, AgeCalculatorPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  clientId: string;
  client: Client | null;
  cashflows: Array<Cashflow> = [];
  isLoaderVisible = true;

  constructor(
    private dialog: MatDialog,
    private clientHttpService: ClientHttpService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private cashflowHttpService: CashflowHttpService,
    private store: Store
  ) {
    this.getClient();
  }

  onEditClicked() {
    this.router.navigate(['/clients/' + this.clientId + '/edit']);
  }

  onSortByValueChange(event: any)
  {
    console.log({event})
    if(event === 'asc') {
      this.cashflows.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    } else {
      this.cashflows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  }

  getClient() {
    this.activatedRoute.params
      .pipe(
        switchMap((params) => {
          this.clientId = params['id']
          return this.cashflowHttpService.getByClientId(this.clientId)
        }),
        combineLatestWith(this.store.select(selectedClient).pipe(takeUntilDestroyed())),
        tap(([cashflows, client]) => {
          console.log(client);
          if(!client || client.id !== this.clientId) {
            this.store.dispatch(ClientActions.loadClient({clientId: this.clientId}))
          }
        }),
        filter(([cashflows, client]) => !!client && client.id === this.clientId),
        map(([cashflows, client]) => {
          console.log('clinet', this.client)
          this.client = client;
          this.cashflows = cashflows;
          this.isLoaderVisible = false;
        })
      )
      .subscribe();
  }

  loadCashflowToStore(cashflowId : any) {
    var cashflow = this.cashflows.find(cashflow => cashflow.id === cashflowId)
    console.log(cashflow);
    if(cashflow)
      this.store.dispatch(CashflowActions.selectCashflow({cashflow}));
  }

  getCashflows() {
    this.isLoaderVisible = true;
    this.cashflowHttpService.getByClientId(this.clientId).pipe(
      tap((cashflows: Cashflow[]) => {
        this.cashflows = cashflows;
        this.isLoaderVisible = false;
      })
    ).subscribe();
  }

  newModelClicked() {

    const dialogRef = this.dialog.open(
      AddModelDialogComponent,
      {
        width: '600px',
        disableClose: true,
        data: this.client
      }
    );

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }

  onEditModelClicked(cashflowId: string) {
    const dialogRef = this.dialog.open(
      EditModelDialogComponent,
      {
        width: '600px',
        disableClose: true,
        data: this.cashflows.find(cashflow => cashflow.id === cashflowId)
      }
    );

    dialogRef.afterClosed().subscribe((result: any) => {
      this.getCashflows();
      console.log('Dialog closed with result:', result);
    });
  }
  
  onCopyModelClicked(cashflow: Cashflow) {

    // const cashflow: Cashflow = {
    //   id: '',
    //   description: this.form.get('description')?.value,
    //   name: this.form.get('name')?.value,
    //   clientBirthDate: this.clientData.clientDetails.birthDate,
    //   client: {
    //     id: this.clientData.id,
    //     name: this.clientData.clientDetails.name
    //   },
    //   financialAdvisor: this.clientData.financialAdvisor,
    //   createdAt: new Date(),
    //   updatedAt: new Date()
    // };
    this.isLoaderVisible = true;
    cashflow.id = ''
    this.cashflowHttpService.createCashflow(cashflow).pipe(
      filter(res => !!res),
      catchError((err) => {
        console.error("An error occurred while cloning cashflow", err);
        this.toastr.error('An error occurred while cloning model');
        throw err;
      })
    ).subscribe((res) => {
      this.toastr.success('Model Cloned Successfully');
      this.getCashflows();
    });
  }
  
  onDeleteModelClicked(cashflowId: string) {
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        action: 'Delete',
        text: 'Are you sure you want to delete this model?',
        cashflowId
      },
      width: '460px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
      if (result.event === 'Delete') {
        this.deleteModel(result.data.cashflowId);
      }
    });
  }

  deleteModel(cashflowId: string) {
    this.isLoaderVisible = true;
    this.cashflowHttpService
          .deleteCashflow(cashflowId)
          .pipe(
            map((res) => {
              this.toastr.success('Client deleted successfully', 'Success!');
              this.getCashflows();
            }),
            catchError((err) => {
              console.error(err);
              this.toastr.error('An error occured while saving client', 'Error!');
              throw err;
            })
          )
          .subscribe();
  }

  sortDescriptors: SortDescriptor[] = [
    { value: 'asc', viewValue: 'Ascending' },
    { value: 'desc', viewValue: 'Descending' },
  ];
}
