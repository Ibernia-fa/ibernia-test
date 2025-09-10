import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { filter, startWith } from 'rxjs';
import { NavItem } from './nav-item/nav-item';
import { settingsNavItems } from './settings-nav-config';
import { navItems as mainNavItems } from './sidebar-data';
import { AppNavItemComponent } from './nav-item/nav-item.component';
import { CommonModule } from '@angular/common';
@Component({
    selector: 'app-sidebar',
    imports: [
      TablerIconsModule,
      AppNavItemComponent,
      CommonModule
    ],
    templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
   private router = inject(Router);
  constructor() { }
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();
  isSettings = false;
  items: NavItem[] = [];
  ngOnInit(): void { 

        this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        startWith(null) // triggers once on init
      )
      .subscribe(() => {
        const url = this.router.url.split('?')[0];
        this.isSettings = url.startsWith('/settings');
        // this.items = this.isSettings ? settingsNavItems : mainNavItems;
      });
  }
  
}