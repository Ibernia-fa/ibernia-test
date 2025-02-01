import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ClientHttpService } from '../client-http.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Client } from '../client';
import { map, switchMap } from 'rxjs';
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
interface Food {
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
  ],
  providers: [ClientHttpService, RouterModule, DatePipe, AgeCalculatorPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  clientId: string;
  client: Client;
  constructor(
    private dialog: MatDialog,
    private clientHttpService: ClientHttpService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.getClient();
  }

  onEditClicked() {
    this.router.navigate(['/clients/' + this.clientId + '/edit']);
  }
  getClient() {
    this.activatedRoute.params
      .pipe(
        switchMap((params) => {
          this.clientId = params['id'];
          return this.clientHttpService.getClient(this.clientId);
        }),
        map((res) => {
          this.client = res;
        })
      )
      .subscribe();
  }

  newModelClicked() {

    const dialogRef = this.dialog.open(
      AddModelDialogComponent,
      {
        width: '600px',
        disableClose: true,
        data: {
          client: this.client
        }
      }
    );

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }

  foods: Food[] = [
    { value: 'steak-0', viewValue: 'Steak' },
    { value: 'pizza-1', viewValue: 'Pizza' },
    { value: 'tacos-2', viewValue: 'Tacos' },
  ];
}
