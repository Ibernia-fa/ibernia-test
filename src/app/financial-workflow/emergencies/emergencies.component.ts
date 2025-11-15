import { Component, OnInit } from '@angular/core';
import { combineLatest, map, switchMap, tap } from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { EmergenciesHttpService as EmergenciesHttpService } from './services/emergencies-http.service';
import { EmergenciesModel as EmergenciesModel } from './models/emergencies.model';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
@Component({
  selector: 'app-emergencies',
   imports: [
      MatSliderModule,
  MatCardModule
    ],

  templateUrl: './emergencies.component.html',
  styleUrl: './emergencies.component.scss'
})

export class EmergenciesComponent implements OnInit {
  constructor(
    private emergenciesHttpService: EmergenciesHttpService,
    private navItemService: NavItemService
  ) {
    this.navItemService.currentRouteName = 'Emergencies';
  }

  ngOnInit(): void {
    
  }
}
