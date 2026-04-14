import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  Inject,
  Optional,
  ViewChild,
  AfterViewInit,
  OnInit,
  OnDestroy,
  inject,
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
import { ClientAddComponent } from '../client-add/client-add.component';
import { ClientEditComponent } from '../client-edit/client-edit.component';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { TimeAgoPipe } from 'src/app/pipe/time-ago.pipe';
import { AgeCalculatorPipe } from 'src/app/pipe/age-calculator.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { allCountries } from '../models/country';
import { DefaultPreferanceModule } from 'src/app/default-preferance/default-preferance.module';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
import { DefaultPreferanceComponent } from 'src/app/default-preferance/default-preferance/default-preferance.component';
import { AuthService } from 'src/app/auth/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-client-list',
  imports: [
    TablerIconsModule,
    MatNativeDateModule,
    NgScrollbarModule,
    // AppBreadcrumbComponent,
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
    DefaultPreferanceModule,
    TranslateModule,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ),
    ]),
  ],
})
export class ClientListComponent implements OnInit, AfterViewInit, OnDestroy {
  dataSource: MatTableDataSource<Client> = new MatTableDataSource(
    new Array<Client>(),
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
  user: any;

  /** Advisor name from API profile (set when getUserProfileResponse returns). Used so title stays correct when OIDC is slow or missing given_name. */
  advisorNameFromApi: string | null = null;

  /** Time-based greeting: morning (5–11:59), afternoon (12–17:59), evening (18–4:59). Updated every minute for automatic refresh. */
  currentGreeting = this.getGreetingForLocalTime();

  /** Current local date for display; updated every minute with the greeting. */
  currentDate = new Date();

  /** Angular `DatePipe` locale: matches active UI language so weekday/month names localize. */
  dateLocale: string;

  private readonly destroyRef = inject(DestroyRef);

  private greetingInterval: ReturnType<typeof setInterval> | null = null;

  /** Returns greeting translation key based on user's local hour. */
  private getGreetingForLocalTime(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'GREETING.MORNING';
    if (hour >= 12 && hour < 18) return 'GREETING.AFTERNOON';
    return 'GREETING.EVENING';
  }

  /** Display name for the advisor in the page title. Uses API profile first, then OIDC claims; reads auth on each access so it updates when user loads late (same browser, intermittent missing name). */
  get advisorDisplayName(): string {
    const fromApi = (this.advisorNameFromApi ?? '').trim();
    if (fromApi) return fromApi;
    const u = this.Authservice.getUserProfile();
    if (!u) return 'My';
    const name =
      (u.given_name && String(u.given_name).trim()) ||
      (u.name && String(u.name).trim()) ||
      (u.preferred_username && String(u.preferred_username).trim());
    return name || 'My';
  }

  constructor(
    public dialog: MatDialog,
    public datePipe: DatePipe,
    private router: Router,
    private clientHttpService: ClientHttpService,
    private toastr: ToastrService,
    private settingsService: SettingsService,
    private Authservice: AuthService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {
    this.dateLocale = this.localeFromLang(this.translate.currentLang);
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((e) => {
        this.dateLocale = this.localeFromLang(e.lang);
        this.cdr.markForCheck();
      });
  }

  private localeFromLang(lang: string | undefined): string {
    return lang?.toLowerCase().startsWith('it') ? 'it' : 'en';
  }

  ngOnInit() {
    this.user = this.Authservice.getUserProfile();
    this.getClients(this.user.sub);
    this.checkPrefsAndPrompt();
    this.greetingInterval = setInterval(() => {
      this.currentDate = new Date();
      this.currentGreeting = this.getGreetingForLocalTime();
      this.cdr.markForCheck();
    }, 60_000);
  }

  ngOnDestroy() {
    if (this.greetingInterval) {
      clearInterval(this.greetingInterval);
      this.greetingInterval = null;
    }
  }

  private checkPrefsAndPrompt() {
    this.settingsService.getUserProfileResponse(this.user?.sub).subscribe({
      next: (res) => {
        if (res.status === 204) {
          // preferences missing → open dialog
          const ref = this.dialog.open(DefaultPreferanceComponent, {
            width: '560px',
            maxWidth: '92vw',
            disableClose: true,
            autoFocus: false,
            data: { mode: 'onboarding' },
          });

          ref.afterClosed().subscribe((saved) => {
            if (saved) {
              // this.toastr.success('Default preferences saved', 'Success!');
            }
          });
        }
        if (res.ok && res.body?.firstName != null) {
          this.advisorNameFromApi = (res.body.firstName ?? '').trim() || null;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching user profile', err);
        // optional: you could also open dialog on error if you want
      },
    });
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
    if (!element.partnerDetail?.name || redirect) {
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
        sortState.direction === 'asc' ? 'asc' : 'desc',
      );
    }
    if (sortState.active === 'client') {
      this.clients = this.sortList(
        this.clients,
        'clientDetails.name',
        sortState.direction === 'asc' ? 'asc' : 'desc',
      );
    }

    this.dataSource = new MatTableDataSource(this.clients);
  }

  timeAgo(value: Date | string | number) {
    if (!value) return this.translate.instant('LABEL.INVALID_DATE');

    const date = new Date(value);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return this.translate.instant('TIME.SECONDS_AGO', { value: diffInSeconds });
    } else if (diffInMinutes < 60) {
      return this.translate.instant('TIME.MINUTES_AGO', { value: diffInMinutes });
    } else if (diffInHours < 24) {
      return this.translate.instant('TIME.HOURS_AGO', { value: diffInHours });
    } else {
      return this.translate.instant('TIME.DAYS_AGO', { value: diffInDays });
    }
  }

  sortList<T>(
    list: T[],
    field: string,
    direction: 'asc' | 'desc' = 'asc',
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
  getClients(advisorId: string) {
    this.isLoaderVisible = true;
    this.clientHttpService
      .getClients(advisorId)
      .pipe(
        filter((clients) => {
          this.isLoaderVisible = false;
          return !!clients;
        }),
      )
      .subscribe((clients) => {
        this.dataSource = new MatTableDataSource(clients);
        this.clients = clients;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(filterValue: string): void {
    if (filterValue) {
      this.clientHttpService
        .searchClients(this.user.sub, filterValue)
        .pipe(
          filter((clients) => !!clients),
          map((clients) => {
            this.dataSource = new MatTableDataSource(clients);
            this.clients = clients;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.cdr.markForCheck();
          }),
        )
        .subscribe();
    } else {
      this.getClients(this.user.sub);
    }
    // this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openDialog(action: string, obj: any): void {
    obj.action = action;
    obj.text = this.translate.instant('CONFIRM.DELETE_CLIENT');
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
    const dialogRef = this.dialog.open(ClientAddComponent, {
      width: '612px',
      maxHeight: '90vh',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.action === 'added') {
        this.router.navigate(['/clients/' + result.client.id + '/profile']);
      } else if (result?.action === 'addedWithPlan') {
        // navigation handled inside client-add via AddModelDialogComponent
      }
    });
  }

  redirectToEdit(id: string) {
    const dialogRef = this.dialog.open(ClientEditComponent, {
      width: '612px',
      maxHeight: '90vh',
      disableClose: true,
      data: { clientId: id },
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result?.action === 'updated') {
        this.getClients(this.user.sub);
      }
    });
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
          this.toastr.success(this.translate.instant('TOAST.CLIENT_DELETED'), this.translate.instant('LABEL.SUCCESS'));
          this.getClients(this.user.sub);
        }),
        catchError((err) => {
          console.error(err);
          this.toastr.error(this.translate.instant('TOAST.ERROR_SAVING_CLIENT'), this.translate.instant('LABEL.ERROR'));
          throw err;
        }),
      )
      .subscribe();
  }
}
