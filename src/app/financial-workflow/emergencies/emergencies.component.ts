import { Component, OnInit } from '@angular/core';
import { combineLatest, map, switchMap, tap } from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { EmergenciesHttpService as EmergenciesHttpService } from './services/emergencies-http.service';
import { EmergenciesModel as EmergenciesModel } from './models/emergencies.model';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddEmergenciesComponent } from './add-emergencies/add-emergencies.component';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-emergencies',
   imports: [
      MatSliderModule,
      MatIconModule,
  MatCardModule,
  MatChipsModule
    ],

  templateUrl: './emergencies.component.html',
  styleUrl: './emergencies.component.scss'
})

export class EmergenciesComponent implements OnInit {
  constructor(
    private emergenciesHttpService: EmergenciesHttpService,
    private navItemService: NavItemService,
        private dialog: MatDialog,
        
  ) {
    this.navItemService.currentRouteName = 'Emergencies';
  }

  ngOnInit(): void {
    
  }

  onAddClick(){
        const dialogRef = this.dialog.open(AddEmergenciesComponent, {
          width: '700px',
          disableClose: true,
          data: {
          },
        });
    
        dialogRef.afterClosed().subscribe((result: any) => {
        });
  }
}
