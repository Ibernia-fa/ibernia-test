import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ClientHttpService } from '../client-http.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Client } from '../client';
import { map, switchMap } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-profile',
  imports: [
    MatCardModule,
    TablerIconsModule,
    CommonModule,
    MatButtonModule
  ],
  providers: [
    ClientHttpService,
    RouterModule,
    DatePipe
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {

  clientId: string;
  client: Client;
  constructor(private clientHttpService: ClientHttpService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.getClient()    
  }

  onEditClicked() {
    this.router.navigate(['/clients/' + this.clientId + '/edit'])
  }
  getClient() {
      this.activatedRoute.params.pipe(
        switchMap((params) => {
          this.clientId = params['id']
          return this.clientHttpService.getClient(this.clientId);
        }),
        map((res) => {
          this.client = res;
        })
      ).subscribe()
    }

}
