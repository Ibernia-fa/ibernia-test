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
import { MaterialModule } from 'src/app/material.module';
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
import { ClientHttpService } from '../client-http.service';
import { catchError, filter, map } from 'rxjs';
import { Client } from '../client';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { DialogComponent } from 'src/app/dialog/dialog.component';
import { trackByHourSegment } from 'angular-calendar/modules/common/util';

@Component({
  selector: 'app-client-list',
  imports: [
    MaterialModule,
    TablerIconsModule,
    MatNativeDateModule,
    NgScrollbarModule,
    AppBreadcrumbComponent,
    RouterModule,
    CommonModule,

    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    ToastrModule,
    Highlight,
    HighlightAuto,
    HighlightLineNumbers,
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
  providers: [DatePipe, ClientHttpService, ToastrService],
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
  dataSource: MatTableDataSource<Client> = new MatTableDataSource(new Array<Client>());
  columnsToDisplay = ['client', 'dob', 'last_updated', 'notes', 'action'];
  columnsToDisplayWithExpand = ['expand', ...this.columnsToDisplay ];
  clientColumnsToDisplayWithCheckbox = ['select', 'name_client', 'dob_client', 'last_updated_client', 'notes_client', 'action_client'];
  partnerColumnsToDisplayWithCheckbox = ['select', 'name_partner', 'dob_partner', 'last_updated_partner', 'notes_partner', 'action_partner'];

  expandedClientElement: Client | null = null;
  expandedPartnerElement: Client | null = null;

  @ViewChild(MatTable, { static: true }) table: MatTable<any> =
    Object.create(null);
  searchText: any;
  
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
  ) {
  }

  ngOnInit() {
    this.getClients();
  }

  rowExpandClicked(element: any, event?: any) {
    if(element.partnerDetail.name) {
      this.expandedClientElement = this.expandedClientElement === element ? null : element
      this.expandedPartnerElement = this.expandedPartnerElement === element && !element?.partnerDetails?.name ? null : element
      event?.stopPropagation();
    }
  }

  getClients() {
    this.clientHttpService.getClients().pipe(
      filter(clients => !!clients)
    ).subscribe((clients) => {
      console.log(clients);
      this.dataSource = new MatTableDataSource(clients)
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(filterValue: string): void {
    if(filterValue) {
      this.clientHttpService.searchClients(filterValue).pipe(
        filter((clients) => !!clients),
        map((clients) => {
          this.dataSource = new MatTableDataSource(clients);
        })
      ).subscribe();
    }
    else {
      this.getClients();
    }
    // this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openDialog(action: string, obj: any): void {
  obj.action = action;
  obj.text = "Are you sure you want to delete this client?"
  const dialogRef = this.dialog.open(DialogComponent, {
    data: obj,
  });
  dialogRef.afterClosed().subscribe((result) => {
    // if (result.event === 'Add') {
    //   this.addRowData(result.data);
    // } else if (result.event === 'Update') {
    //   this.updateRowData(result.data);
    // } else 
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
    this.clientHttpService.deleteClient(client.id).pipe(
      map((res) => {
        this.toastr.success('Client deleted successfully', 'Success!');
        this.getClients();
      }),
      catchError((err) => {
        console.error(err);
        this.toastr.error('An error occured while saving client', 'Error!');
        throw err;
      })
    ).subscribe();
  }
}