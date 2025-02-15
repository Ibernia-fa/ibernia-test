import {
  Component,
  Inject,
  Optional,
  ViewChild,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import {
  MatTableDataSource,
  MatTable,
  MatTableModule,
} from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
// import { AppAddKichenSinkComponent } from './add/add.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NgxPaginationModule } from 'ngx-pagination';
import { MatNativeDateModule } from '@angular/material/core';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AppBreadcrumbComponent } from 'src/app/layouts/full/shared/breadcrumb/breadcrumb.component';
import { Router, RouterModule } from '@angular/router';
import { HighlightLineNumbers } from 'ngx-highlightjs/line-numbers';
import { Highlight, HighlightAuto } from 'ngx-highlightjs';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { ClientHttpService } from '../services/client-http.service';
import { catchError, filter, map } from 'rxjs';
import { Client } from '../models/client';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { DialogComponent } from 'src/app/dialog/dialog.component';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { TimeAgoPipe } from 'src/app/pipe/time-ago.pipe';
import { AgeCalculatorPipe } from 'src/app/pipe/age-calculator.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { allCountries } from '../models/country';

@Component({
  selector: 'app-client-list',
  imports: [
    TablerIconsModule,
    MatNativeDateModule,
    NgScrollbarModule,
    AppBreadcrumbComponent,
    RouterModule,
    CommonModule,

    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    ToastrModule,
    TimeAgoPipe,
    MatFormFieldModule,
    AgeCalculatorPipe,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  // imports: [
  //   MatCardModule,
  //   MatTableModule,
  //   MatIconModule,
  //   MatButtonModule,
  //   CommonModule,
  //   MatDividerModule,
  //   AppBreadcrumbComponent,
  //   Highlight,
  //   HighlightAuto,
  //   HighlightLineNumbers,
  // ],
  providers: [
    DatePipe,
    ClientHttpService,
    ToastrService,
    TimeAgoPipe,
    AgeCalculatorPipe,
  ],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class ClientListComponent implements OnInit, AfterViewInit {
  dataSource: MatTableDataSource<Client> = new MatTableDataSource(
    new Array<Client>()
  );
  columnsToDisplay = ['client', 'dob', 'last_updated', 'notes', 'action'];
  columnsToDisplayWithExpand = ['expand', ...this.columnsToDisplay];
  clientColumnsToDisplayWithCheckbox = [
    'select',
    'name_client',
    'dob_client',
    'last_updated_client',
    'notes_client',
    'action_client',
  ];
  partnerColumnsToDisplayWithCheckbox = [
    'select',
    'name_partner',
    'dob_partner',
    'last_updated_partner',
    'notes_partner',
    'action_partner',
  ];

  expandedClientElement: Client | null = null;
  expandedPartnerElement: Client | null = null;
  isLoaderVisible = false;

  @ViewChild(MatTable, { static: true }) table: MatTable<any> =
    Object.create(null);
  @ViewChild(MatSort) sort: MatSort;
  searchText: any;
  clients: Array<Client>;
  // displayedColumns: string[] = [
  //   'client',
  //   'dob',
  //   'lastUpdated',
  //   'notes',
  //   'expandedDetail',
  //   'action',
  // ];

  // isExpandedRow = (index: number, element: any) => element.expanded;
  // toggleRow(element: any) {
  //   // Close all rows
  //   // this.dataSource.forEach(row => (row.expanded = false));
  //   // Expand the current row
  //   element.expanded = !element.expanded;
  // }
  // dataSource = new MatTableDataSource(employees);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator =
    Object.create(null);

  constructor(
    public dialog: MatDialog,
    public datePipe: DatePipe,
    private router: Router,
    private clientHttpService: ClientHttpService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.getClients();
  }

  rowExpandClicked(element: any, event?: any) {
    if (element.partnerDetail.name) {
      this.expandedClientElement =
        this.expandedClientElement === element ? null : element;
      this.expandedPartnerElement =
        this.expandedPartnerElement === element &&
        !element?.partnerDetails?.name
          ? null
          : element;
      event?.stopPropagation();
    }
  }

  clientExpandRowClicked(element: any, redirect: boolean = false) {
    if(!element.partnerDetail?.name || redirect) {
      this.router.navigate(['/clients/' + element.id + '/profile']);
    }
  }

  partnerExpandRowClicked(element: any) {
    this.router.navigate(['/clients/' + element.id + '/profile']);
  }

  announceSortChange(sortState: Sort) {
    // This example uses English messages. If your application supports
    // multiple language, you would internationalize these strings.
    // Furthermore, you can customize the message to add additional
    // details about the values being sorted.
    if (sortState.active === 'last_updated') {
      this.clients = this.sortList(
        this.clients,
        'lastUpdated',
        sortState.direction === 'asc' ? 'asc' : 'desc'
      );
    }
    if (sortState.active === 'client') {
      this.clients = this.sortList(
        this.clients,
        'clientDetails.name',
        sortState.direction === 'asc' ? 'asc' : 'desc'
      );
    }

    this.dataSource = new MatTableDataSource(this.clients);
  }

  timeAgo(value: Date | string | number) {
    console.log(value);
    if (!value) return 'Invalid date';

    const date = new Date(value);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return `${diffInDays} days ago`;
    }
  }

  sortList<T>(
    list: T[],
    field: string,
    direction: 'asc' | 'desc' = 'asc'
  ): T[] {
    const resolveField = (obj: any, path: string) =>
      path.split('.').reduce((value, key) => value[key], obj);

    return list.sort((a, b) => {
      const valueA = resolveField(a, field);
      const valueB = resolveField(b, field);
      const factor = direction === 'asc' ? 1 : -1;

      if (valueA > valueB) return 1 * factor;
      if (valueA < valueB) return -1 * factor;
      return 0;
    });
  }
  getClients() {
    this.isLoaderVisible = true;
    this.clientHttpService
      .getClients()
      .pipe(filter((clients) => {
        this.isLoaderVisible = false;
        return !!clients
      }))
      .subscribe((clients) => {
        console.log(clients);
        this.dataSource = new MatTableDataSource(clients);
        this.clients = clients;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(filterValue: string): void {
    if (filterValue) {
      this.clientHttpService
        .searchClients(filterValue)
        .pipe(
          filter((clients) => !!clients),
          map((clients) => {
            this.dataSource = new MatTableDataSource(clients);
            this.clients = clients;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          })
        )
        .subscribe();
    } else {
      this.getClients();
    }
    // this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openDialog(action: string, obj: any): void {
    obj.action = action;
    obj.text = 'Are you sure you want to delete this client?';
    const dialogRef = this.dialog.open(DialogComponent, {
      data: obj,
      width: '460px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result.event === 'Delete') {
        this.deleteRowData(result.data);
      }
    });
  }

  // tslint:disable-next-line - Disables all
  // addRowData(row_obj: Employee): void {
  // this.dataSource.data.unshift({
  //   id: employees.length + 1,
  //   Name: row_obj.Name,
  //   Position: row_obj.Position,
  //   Email: row_obj.Email,
  //   Mobile: row_obj.Mobile,
  //   DateOfJoining: new Date(),
  //   Salary: row_obj.Salary,
  //   Projects: row_obj.Projects,
  //   imagePath: row_obj.imagePath,
  // });
  // this.dialog.open(AppAddKichenSinkComponent);
  // this.table.renderRows();
  // }

  redirectToAdd() {
    this.router.navigate(['/clients/add']);
  }

  redirectToEdit(id: string) {
    this.router.navigate(['/clients/' + id + '/edit']);
  }

  // tslint:disable-next-line - Disables all
  // updateRowData(row_obj: Employee): boolean | any {
  //   this.dataSource.data = this.dataSource.data.filter((value: any) => {
  //     if (value.id === row_obj.id) {
  //       value.Name = row_obj.Name;
  //       value.Position = row_obj.Position;
  //       value.Email = row_obj.Email;
  //       value.Mobile = row_obj.Mobile;
  //       value.DateOfJoining = row_obj.DateOfJoining;
  //       value.Salary = row_obj.Salary;
  //       value.Projects = row_obj.Projects;
  //       value.imagePath = row_obj.imagePath;
  //     }
  //     return true;
  //   });
  // }

  // // tslint:disable-next-line - Disables all
  deleteRowData(client: Client): boolean | any {
    this.clientHttpService
      .deleteClient(client.id)
      .pipe(
        map((res) => {
          this.toastr.success('Client deleted successfully', 'Success!');
          this.getClients();
        }),
        catchError((err) => {
          console.error(err);
          this.toastr.error('An error occured while saving client', 'Error!');
          throw err;
        })
      )
      .subscribe();
  }
}
