import { BreakpointObserver, MediaMatcher } from '@angular/cdk/layout';
import {
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  OnDestroy,
} from '@angular/core';
import { Subscription, Subject, takeUntil } from 'rxjs';
import {
  MatSidenav,
  MatSidenavContent,
  MatSidenavModule,
} from '@angular/material/sidenav';
import { CoreService } from 'src/app/services/core.service';
import { AppSettings } from 'src/app/config';
import { filter } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { navItems, navItemslower } from './vertical/sidebar/sidebar-data';
import { NavService } from '../../services/nav.service';
import { AppNavItemComponent } from './vertical/sidebar/nav-item/nav-item.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './vertical/sidebar/sidebar.component';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { TablerIconsModule } from 'angular-tabler-icons';
import { HeaderComponent } from './vertical/header/header.component';
import { AppHorizontalHeaderComponent } from './horizontal/header/header.component';
import { AppHorizontalSidebarComponent } from './horizontal/sidebar/sidebar.component';
import { CustomizerComponent } from './shared/customizer/customizer.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import {
  navItems as mainNavItems,
  navItemslower as mainLower,
} from './vertical/sidebar/sidebar-data';
import {
  settingsNavItems,
  settingsLowerNavItems,
} from './vertical/sidebar/settings-nav-config';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ShareReportComponent } from 'src/app/financial-workflow/share-report/share-report.component';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectedClient } from 'src/app/store/client/client.selectors';
import { Client } from 'src/app/clients/models/client';
import { TranslateModule } from '@ngx-translate/core';
import { OrganizationProfilesService } from 'src/app/settings/services/organization.profiles.service';
import { AuthService } from 'src/app/auth/services/auth.service';

const MOBILE_VIEW = 'screen and (max-width: 768px)';
const TABLET_VIEW = 'screen and (min-width: 769px) and (max-width: 1024px)';
const MONITOR_VIEW = 'screen and (min-width: 1024px)';
const BELOWMONITOR = 'screen and (max-width: 1023px)';

// for mobile app sidebar
interface apps {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
}

interface quicklinks {
  id: number;
  title: string;
  link: string;
}

@Component({
  selector: 'app-full',
  imports: [
    RouterModule,
    AppNavItemComponent,
    CommonModule,
    SidebarComponent,
    NgScrollbarModule,
    TablerIconsModule,
    HeaderComponent,
    AppHorizontalHeaderComponent,
    AppHorizontalSidebarComponent,
    CustomizerComponent,
    MatSidenavModule,
    MatExpansionModule,
    MatDividerModule,
    MatListModule,
    MatDialogModule,
    TranslateModule,
  ],
  templateUrl: './full.component.html',
  styleUrls: [],
  encapsulation: ViewEncapsulation.None,
})
export class FullComponent implements OnInit, OnDestroy {
  navItems = navItems;
  navItemslower = navItemslower;
  isSettings = false;
  isCashflowRoute = false;
  @ViewChild('leftsidenav')
  public sidenav: MatSidenav;
  resView = false;
  @ViewChild('content', { static: true }) content!: MatSidenavContent;
  //get options from service
  options = this.settings.getOptions();
  private layoutChangesSubscription = Subscription.EMPTY;
  private isMobileScreen = false;
  private isContentWidthFixed = true;
  private isCollapsedWidthFixed = false;
  private htmlElement!: HTMLHtmlElement;
  hideSidebar = false;
  backgroundImage: string | null = null;
  backgroundImageReady = false;
  readonly defaultBackgroundImage =
    'assets/images/backgrounds/background-img.png';
  private destroy$ = new Subject<void>();

  client$: Observable<Client | null>;
  clientName = '';

  get isOver(): boolean {
    return this.isMobileScreen;
  }

  get isTablet(): boolean {
    return this.resView;
  }

  /** User-uploaded org background — disable frosted overlay so the photo stays sharp. */
  get usesCustomBackground(): boolean {
    const s = this.backgroundImage?.trim();
    return !!s;
  }

  // for mobile app sidebar
  apps: apps[] = [
    {
      id: 1,
      img: '/assets/images/svgs/icon-dd-chat.svg',
      title: 'Chat Application',
      subtitle: 'Messages & Emails',
      link: '/apps/chat',
    },
    {
      id: 2,
      img: '/assets/images/svgs/icon-dd-cart.svg',
      title: 'eCommerce App',
      subtitle: 'Buy a Product',
      link: '/apps/email/inbox',
    },
    {
      id: 3,
      img: '/assets/images/svgs/icon-dd-invoice.svg',
      title: 'Invoice App',
      subtitle: 'Get latest invoice',
      link: '/apps/invoice',
    },
    {
      id: 4,
      img: '/assets/images/svgs/icon-dd-date.svg',
      title: 'Calendar App',
      subtitle: 'Get Dates',
      link: '/apps/calendar',
    },
    {
      id: 5,
      img: '/assets/images/svgs/icon-dd-mobile.svg',
      title: 'Contact Application',
      subtitle: '2 Unsaved Contacts',
      link: '/apps/contacts',
    },
    {
      id: 6,
      img: '/assets/images/svgs/icon-dd-lifebuoy.svg',
      title: 'Tickets App',
      subtitle: 'Create new ticket',
      link: '/apps/tickets',
    },
    {
      id: 7,
      img: '/assets/images/svgs/icon-dd-message-box.svg',
      title: 'Email App',
      subtitle: 'Get new emails',
      link: '/apps/email/inbox',
    },
    {
      id: 8,
      img: '/assets/images/svgs/icon-dd-application.svg',
      title: 'Courses',
      subtitle: 'Create new course',
      link: '/apps/courses',
    },
  ];

  quicklinks: quicklinks[] = [
    {
      id: 1,
      title: 'Pricing Page',
      link: '/theme-pages/pricing',
    },
    {
      id: 2,
      title: 'Authentication Design',
      link: '/authentication/login',
    },
    {
      id: 3,
      title: 'Register Now',
      link: '/authentication/side-register',
    },
    {
      id: 4,
      title: '404 Error Page',
      link: '/authentication/error',
    },
    {
      id: 5,
      title: 'Notes App',
      link: '/apps/notes',
    },
    {
      id: 6,
      title: 'Employee App',
      link: '/apps/employee',
    },
    {
      id: 7,
      title: 'Todo Application',
      link: '/apps/todo',
    },
    {
      id: 8,
      title: 'Treeview',
      link: '/theme-pages/treeview',
    },
  ];

  constructor(
    private settings: CoreService,
    private mediaMatcher: MediaMatcher,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private navService: NavService,
    private dialog: MatDialog,
    private store: Store,
    private organizationProfiles: OrganizationProfilesService,
    private Authservice: AuthService,
  ) {
    this.client$ = this.store.select(selectedClient);

    this.htmlElement = document.querySelector('html')!;
    this.layoutChangesSubscription = this.breakpointObserver
      .observe([MOBILE_VIEW, TABLET_VIEW, MONITOR_VIEW, BELOWMONITOR])
      .subscribe((state) => {
        // SidenavOpened must be reset true when layout changes
        this.options.sidenavOpened = true;
        this.isMobileScreen = state.breakpoints[BELOWMONITOR];
        if (this.options.sidenavCollapsed == false) {
          this.options.sidenavCollapsed = state.breakpoints[TABLET_VIEW];
        }
        this.isContentWidthFixed = state.breakpoints[MONITOR_VIEW];
        this.resView = state.breakpoints[BELOWMONITOR];
      });

    // Initialize project theme with options
    this.receiveOptions(this.options);

    // Set initial route state (for direct load/refresh on cashflow routes)
    this.isCashflowRoute = this.router.url.startsWith('/cashflows');

    // This is for scroll to top
    // this.router.events
    //   .pipe(filter((event) => event instanceof NavigationEnd))
    //   .subscribe((e) => {
    //     var currentRoute = e.urlAfterRedirects;
    //     this.hideSidebar = this.options.sidebarHiddenOnRoutes.find((x) =>
    //       currentRoute.includes(x)
    //     )
    //       ? true
    //       : false;

    //     this.content?.scrollTo({ top: 0 });
    //   });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const currentRoute = e.urlAfterRedirects;

        // keep your existing hideSidebar logic
        this.hideSidebar = this.options.sidebarHiddenOnRoutes.some((x) =>
          currentRoute.includes(x),
        );

        // NEW: detect settings
        this.isSettings = currentRoute.startsWith('/settings');

        // Detect cashflow routes (footer is hidden, so no bottom padding needed)
        this.isCashflowRoute = currentRoute.startsWith('/cashflows');

        // swap menu sources
        if (this.isSettings) {
          this.navItems = settingsNavItems;
          const allLower = settingsLowerNavItems ?? [];
          this.navItemslower = allLower.filter((item) => item.displayName !== 'Admin Notifications');
          Promise.all([
            this.Authservice.hasRole('Administrator'),
            this.Authservice.hasRole('IberniaIdentityAdminAdministrator')
          ]).then(([admin, idAdmin]) => {
            this.navItemslower = (admin || idAdmin) ? allLower : allLower.filter((item) => item.displayName !== 'Admin Notifications');
          }); // or [] if you don’t have a lower list
        } else {
          this.navItems = mainNavItems;
          this.navItemslower = mainLower;
        }

        this.content?.scrollTo({ top: 0 });
      });

    const uid = this.Authservice.getUserProfile()?.sub;
    if (uid) {
      this.organizationProfiles.hydrateBrandingLogoFromSession(uid);
    }
  }

  ngOnInit(): void {
    this.client$.subscribe((client) => {
      if (client) {
        this.clientName = client.clientDetails?.firstName;
      }
    });
    this.loadBackgroundImage();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.layoutChangesSubscription.unsubscribe();
  }

  toggleCollapsed() {
    this.isContentWidthFixed = false;
    this.options.sidenavCollapsed = !this.options.sidenavCollapsed;
    this.resetCollapsedState();
  }

  resetCollapsedState(timer = 400) {
    setTimeout(() => this.settings.setOptions(this.options), timer);
  }

  onSidenavClosedStart() {
    this.isContentWidthFixed = false;
  }

  onSidenavOpenedChange(isOpened: boolean) {
    this.isCollapsedWidthFixed = !this.isOver;
    this.options.sidenavOpened = isOpened;
    this.settings.setOptions(this.options);
  }

  receiveOptions(options: AppSettings): void {
    this.toggleDarkTheme(options);
    this.toggleColorsTheme(options);
  }

  toggleDarkTheme(options: AppSettings) {
    if (options.theme === 'dark') {
      this.htmlElement.classList.add('dark-theme');
      this.htmlElement.classList.remove('light-theme');
    } else {
      this.htmlElement.classList.remove('dark-theme');
      this.htmlElement.classList.add('light-theme');
    }
  }

  toggleColorsTheme(options: AppSettings) {
    // Remove any existing theme class dynamically
    this.htmlElement.classList.forEach((className) => {
      if (className.endsWith('_theme')) {
        this.htmlElement.classList.remove(className);
      }
    });

    // Add the selected theme class
    this.htmlElement.classList.add(options.activeTheme);
  }

  onUpgradeClick() {
    this.router.navigate(['/settings/plan-billing']);
  }

  openShareModal() {
    const dialogRef = this.dialog.open(ShareReportComponent, {
      width: '612px',
      disableClose: true,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }

  private loadBackgroundImage(): void {
    const userId = this.Authservice.getUserProfile()?.sub;
    if (!userId) return;

    this.organizationProfiles
      .getProfile(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => {
          this.backgroundImage = this.ensureDataUrl(
            p?.backgroundPhotoUrl ?? null,
          );
          this.backgroundImageReady = true;
        },
        error: (err) => {
          console.error(err);
          this.backgroundImageReady = true;
        },
      });

    this.organizationProfiles.backgroundImage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((url) => {
        this.backgroundImage = this.ensureDataUrl(url);
        this.backgroundImageReady = true;
      });
  }

  private ensureDataUrl(s: string | null): string | null {
    if (!s) return null;
    return s.startsWith('data:') ? s : `data:image/jpeg;base64,${s}`;
  }
}
