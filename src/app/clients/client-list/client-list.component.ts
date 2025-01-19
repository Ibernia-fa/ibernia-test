import {
  Component,
  Inject,
  Optional,
  ViewChild,
  AfterViewInit,
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
export interface PeriodicElement {
  name: string;
  position: string;
  id: number;
  project: string;
  symbol: string;
  description: string;
}
const ELEMENT_DATA: PeriodicElement[] = [
  {
    id: 1,
    position: 'Front end Developer',
    name: 'Andrew McDownland',
    project: 'Elite Admin',
    symbol: 'H',
    description:
      'Hydrogen is a chemical element with symbol H and atomic number 1. With a standard atomic weight of 1.008, hydrogen is the lightest element on the periodic table.',
  },
  {
    id: 2,
    position: 'Web Designer',
    name: 'Helium',
    project: 'Real Homes Theme',
    symbol: 'He',
    description:
      'Helium is a chemical element with symbol He and atomic number 2. It is a colorless, odorless, tasteless, non-toxic, inert, monatomic gas, the first in the noble gas group in the periodic table. Its boiling point is the lowest among all the elements.',
  },
  {
    id: 3,
    position: 'Project Manager',
    name: 'Lithium',
    project: 'MedicalPro Theme',
    symbol: 'Li',
    description:
      'Lithium is a chemical element with symbol Li and atomic number 3. It is a soft, silvery-white alkali metal. Under standard conditions, it is the lightest metal and the lightest solid element.',
  },
  {
    id: 4,
    position: 'Medical Assistant',
    name: 'Beryllium',
    project: 'Hosting Press HTML ',
    symbol: 'Be',
    description:
      'Beryllium is a chemical element with symbol Be and atomic number 4. It is a relatively rare element in the universe, usually occurring as a product of the spallation of larger atomic nuclei that have collided with cosmic rays.',
  },
  {
    id: 5,
    position: 'Librarian',
    name: 'Boron',
    project: 'Flexy Admin',
    symbol: 'B',
    description:
      'Boron is a chemical element with symbol B and atomic number 5. Produced entirely by cosmic ray spallation and supernovae and not by stellar nucleosynthesis, it is a low-abundance element in the Solar system and in the Earths crust.',
  },
];

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
  providers: [DatePipe],
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
export class ClientListComponent implements AfterViewInit {
  dataSource = new MatTableDataSource(ELEMENT_DATA);
  columnsToDisplay = ['id', 'name', 'project', 'symbol', 'position', 'action'];
  columnsToDisplayWithExpand = ['expand', ...this.columnsToDisplay];
  columnsToDisplayWithCheckbox = ['select', ...this.columnsToDisplay];

  expandedElement: PeriodicElement | null = null;

  @ViewChild(MatTable, { static: true }) table: MatTable<any> =
    Object.create(null);
  searchText: any;
  displayedColumns: string[] = [
    '#',
    'name',
    'email',
    'mobile',
    'date of joining',
    'salary',
    'projects',
    'action',
  ];
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
    private router: Router
  ) {}

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openDialog(action: string, obj: any): void {
  // obj.action = action;
  // const dialogRef = this.dialog.open(AppKichenSinkDialogContentComponent, {
  //   data: obj,
  // });
  // dialogRef.afterClosed().subscribe((result) => {
  //   if (result.event === 'Add') {
  //     this.addRowData(result.data);
  //   } else if (result.event === 'Update') {
  //     this.updateRowData(result.data);
  //   } else if (result.event === 'Delete') {
  //     this.deleteRowData(result.data);
  //   }
  // });
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
  // deleteRowData(row_obj: Employee): boolean | any {
  //   this.dataSource.data = this.dataSource.data.filter((value: any) => {
  //     return value.id !== row_obj.id;
  //   });
  // }
}

// @Component({
//     // tslint:disable-next-line: component-selector
//     selector: 'app-dialog-content',
//     imports: [MatDialogModule, FormsModule, MaterialModule],
//     providers: [DatePipe],
//     templateUrl: 'kichen-sink-dialog-content.html'
// })
// // tslint:disable-next-line: component-class-suffix
// export class AppKichenSinkDialogContentComponent {
//   action: string;
//   // tslint:disable-next-line - Disables all
//   local_data: any;
//   selectedImage: any = '';
//   joiningDate: any = '';

//   constructor(
//     public datePipe: DatePipe,
//     public dialogRef: MatDialogRef<AppKichenSinkDialogContentComponent>,
//     // @Optional() is used to prevent error if no data is passed
//     @Optional() @Inject(MAT_DIALOG_DATA) public data: Employee
//   ) {
//     this.local_data = { ...data };
//     this.action = this.local_data.action;
//     if (this.local_data.DateOfJoining !== undefined) {
//       this.joiningDate = this.datePipe.transform(
//         new Date(this.local_data.DateOfJoining),
//         'yyyy-MM-dd'
//       );
//     }
//     if (this.local_data.imagePath === undefined) {
//       this.local_data.imagePath = 'assets/images/profile/user-1.jpg';
//     }
//   }

//   doAction(): void {
//     this.dialogRef.close({ event: this.action, data: this.local_data });
//   }
//   closeDialog(): void {
//     this.dialogRef.close({ event: 'Cancel' });
//   }

//   selectFile(event: any): void {
//     if (!event.target.files[0] || event.target.files[0].length === 0) {
//       // this.msg = 'You must select an image';
//       return;
//     }
//     const mimeType = event.target.files[0].type;
//     if (mimeType.match(/image\/*/) == null) {
//       // this.msg = "Only images are supported";
//       return;
//     }
//     // tslint:disable-next-line - Disables all
//     const reader = new FileReader();
//     reader.readAsDataURL(event.target.files[0]);
//     // tslint:disable-next-line - Disables all
//     reader.onload = (_event) => {
//       // tslint:disable-next-line - Disables all
//       this.local_data.imagePath = reader.result;
//     };
//   }
// }
