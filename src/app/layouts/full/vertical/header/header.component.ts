import { 
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { navItems } from '../sidebar/sidebar-data';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AppSettings } from 'src/app/config';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from 'src/app/auth/services/auth.service';
import {
  SettingsService,
  UserProfileDto,
  readUserDisplayCache,
  clearUserDisplayCache,
} from 'src/app/default-preferance/services/default-preferance.http.service';
import { HttpResponse } from '@angular/common/http';
import { takeUntil, catchError, of, finalize, Subject, Subscription, filter, map, distinctUntilChanged } from 'rxjs';
import { OrganizationProfilesService } from 'src/app/settings/services/organization.profiles.service';
import { Store } from '@ngrx/store';
import { Client } from 'src/app/clients/models/client';
import { selectedClient } from 'src/app/store/client/client.selectors';
import { selectedCashflow } from 'src/app/store/cashflow/cashflow.selectors';
import { LanguageService } from 'src/app/core/language.service';
import { LanguageLoaderService } from '../../language-loader.service';
import { BrandingComponent } from '../sidebar/branding.component';
import { MyNotificationsService, UserNotificationItem } from 'src/app/core/services/my-notifications.service';
import {
  MFA_REMINDER_NOTIFICATION_ID,
  prependMfaReminderNotification,
  userNeedsMfaReminder,
} from 'src/app/core/mfa-reminder-notification';
import { notificationMatchesSearchQuery } from 'src/app/core/notification-search';
import { CapitalizeFirstPipe } from 'src/app/core/pipes/capitalize-first.pipe';
import { environment } from 'src/environments/environment';

interface notifications {
  id: number;
  img: string;
  title: string;
  subtitle: string;
}

interface profiledd {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
}

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

type LanguageCode = 'en' | 'it';

@Component({
    selector: 'app-header',
    // standalone: true,
    imports: [
        RouterModule,
        CommonModule,
        NgScrollbarModule,
        BrandingComponent,
        TablerIconsModule,
        MatToolbarModule,
        MatButtonModule,
        MatTooltipModule,
        MatMenuModule,
        MatBadgeModule,
        MatDividerModule,
        TranslateModule,
        FormsModule,
        CapitalizeFirstPipe,
    ],
    templateUrl: './header.component.html',
    encapsulation: ViewEncapsulation.None
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() showToggle = true;
  @Input() hideSidebarToggle = false;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  // showFiller = false;
showFiller = false;
  isCashflowRoute = false; // Add this flag
  isSettingsRoute = false;
  settingsPageName = ''; // Current settings section for breadcrumb
  clientProfileLink = ''; // Add this for the link
  planName = ''; // Current cashflow/plan name for breadcrumb
  public selectedLanguage: any = {
    language: 'English',
    code: 'en',
    type: 'US',
    icon: '/assets/images/flag/icon-flag-en.svg',
  };

  public languages: any[] = [
    {
      language: 'English',
      code: 'en',
      type: 'US',
      icon: '/assets/images/flag/icon-flag-en.svg',
    },
    {
      language: 'Español',
      code: 'es',
      icon: '/assets/images/flag/icon-flag-es.svg',
    },
    {
      language: 'Français',
      code: 'fr',
      icon: '/assets/images/flag/icon-flag-fr.svg',
    },
    {
      language: 'German',
      code: 'de',
      icon: '/assets/images/flag/icon-flag-de.svg',
    },
  ];

  userId!: string;
  currentLanguage: LanguageCode = 'en';
  otherLanguage: LanguageCode = 'it';
  // isLanguageSwitching = false;


  @Output() optionsChange = new EventEmitter<AppSettings>();
  private destroy$ = new Subject<void>();
  user: any;
  profileImagePreview: any;
  userprofile: any;
  isLoading: boolean;
  isBrandLogoLoaded: boolean;
  brandingLogo: string | null = null;
  private sub!: Subscription;
  currentClient: Client | null = null;
  clientFirstName: string;
  clientLastName: string;

  /** Last-known display names from sessionStorage (first paint after F5 before GET completes). */
  private hydratedDisplay: { firstName: string; lastName: string } | null = null;

  // Notification center
  userNotifications: UserNotificationItem[] = [];
  unreadCount = 0;
  notificationFilter: 'all' | 'unread' = 'all';
  notificationsLoading = false;
  notificationSearchQuery = '';
  private lastNotificationsFetchAt = 0;
  private readonly NOTIFICATIONS_CACHE_MS = 60000; // 1 min
  /** Matches MyNotificationsService feeds revision last applied to userNotifications. */
  private headerNotificationsFeedsRevision = -1;

  readonly mfaReminderId = MFA_REMINDER_NOTIFICATION_ID;

  @ViewChild('notificationListScroll') notificationListScroll?: ElementRef<HTMLElement>;

  private notificationsMenuOpen = false;
  private notificationVisibilityIo: IntersectionObserver | null = null;
  /** While scrollTop is 0, at most this many non-security unread rows may be auto-marked via visibility. */
  private initialVisibilityMarksRemaining = 2;
  private allowUnlimitedVisibilityOnScroll = false;
  private readonly visibilityMarkInFlight = new Set<string>();

  get filteredUserNotifications(): UserNotificationItem[] {
    const q = this.notificationSearchQuery.trim().toLowerCase();
    if (!q) return this.userNotifications;
    return this.userNotifications.filter((n) =>
      notificationMatchesSearchQuery(n, q, this.translate)
    );
  }

  constructor(
    private settings: CoreService,
    private vsidenav: CoreService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private Authservice: AuthService,
    private settingsService: SettingsService,
    private organizationProfiles: OrganizationProfilesService,
        private router: Router, // Add Router
    private store: Store,
    private languageService: LanguageService,
    private languageLoader: LanguageLoaderService,
    private myNotifications: MyNotificationsService,
    private cdr: ChangeDetectorRef
  ) {
    translate.setDefaultLang('en');
    this.user = this.Authservice.getUserProfile();
    this.hydratedDisplay = this.user?.sub ? readUserDisplayCache(this.user.sub) : null;
    if (this.user?.sub) {
      this.organizationProfiles.hydrateBrandingLogoFromSession(this.user.sub);
    }

    this.loadProfile();
    
    this.settingsService.profileChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadProfile());

    this.settingsService.userData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.store.select(selectedClient)
      .pipe(takeUntil(this.destroy$))
      .subscribe(client => {
        this.currentClient = client;
              if (client?.clientDetails) {
          this.clientFirstName = client.clientDetails.firstName || '';
          this.clientLastName = client.clientDetails.lastName || '';
        } else {
          this.clientFirstName = '';
          this.clientLastName = '';
        }
        // Rebuild link if client changes and we're on cashflow route
        if (client && this.isCashflowRoute) {
          this.buildClientProfileLink();
        }
      });

    this.store.select(selectedCashflow)
      .pipe(takeUntil(this.destroy$))
      .subscribe(cashflow => {
        this.planName = cashflow?.name ?? '';
      });


          this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.checkIfCashflowRoute();
      });
  }

  private setOtherLanguage(): void {
    this.otherLanguage = this.currentLanguage === 'en' ? 'it' : 'en';
  }

  toggleLanguage(language: LanguageCode): void {
    if (!this.userId || language === this.currentLanguage) return;

    this.languageLoader.show();

    this.settingsService
    .updateLanguage(this.userId, language)
    .subscribe({
      next: () => {
        this.currentLanguage = language;
        this.setOtherLanguage();
        this.languageService.use(language);

        setTimeout(() => this.languageLoader.hide(), 300);
      },
      error: err => {
        this.languageLoader.hide();
        console.error('Failed to update language', err);
      }
    });
  }


    private buildClientProfileLink(): void {
    if (this.currentClient?.id) {
      this.clientProfileLink = `/clients/${this.currentClient.id}/profile`;
    } else {
      this.clientProfileLink = ''; // Clear link if no client
    }
  }


  

  private checkIfCashflowRoute(): void {
    const currentUrl = this.router.url;
    // Check if URL matches pattern: /cashflows/:cashflowId/...
    this.isCashflowRoute = /^\/cashflows\/[^\/]+\/.+/.test(currentUrl);
    if (this.isCashflowRoute) {
      this.buildClientProfileLink();
    }
  }

  private static readonly SETTINGS_PAGE_LABELS: Record<string, string> = {
    'account-preferences': 'Account preferences',
    'default-assumptions': 'Default assumptions',
    'plan-billing': 'Plan & billing',
    'security': 'Security',
    'notifications': 'Notifications',
    'branding': 'Branding',
    'help': 'Help',
    'ai-reccomendations': 'AI recommendations',
  };

  private getSettingsPageName(url: string): string {
    const match = url.match(/\/settings\/([^\/\?]+)/);
    const segment = match ? match[1] : '';
    return HeaderComponent.SETTINGS_PAGE_LABELS[segment] || segment.replace(/-/g, ' ') || 'Settings';
  }


    ngOnInit() {
      this.myNotifications.serverUnreadCount
        .pipe(
          takeUntil(this.destroy$),
          map((c) => this.adjustUnreadForMfa(c)),
          distinctUntilChanged()
        )
        .subscribe((n) => {
          this.unreadCount = n;
          this.cdr.markForCheck();
        });
      this.loadUnreadCount();
      this.brandingLogo = this.ensureDataUrl(
        this.organizationProfiles.getBrandingLogoValue(),
      );
      this.isBrandLogoLoaded = true;

      this.organizationProfiles.getProfile(this.user.sub).subscribe({
        next: (p) => {
          const logo = this.ensureDataUrl(p?.profilePhotoUrl ?? null);
          this.brandingLogo = logo;
          this.organizationProfiles.setBrandingLogo(logo, this.user.sub);
        },
        error: (err) => {
          console.error(err);
        },
      });

      this.sub = this.organizationProfiles.brandingLogo$.subscribe((url) => {
        this.brandingLogo = this.ensureDataUrl(url);
      });
    }

    ensureDataUrl(s: string | null): string | null {
      if (!s) return null;
      return s.startsWith('data:') ? s : `data:image/jpeg;base64,${s}`;
    }

    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
      this.sub?.unsubscribe();
    }

    
// Prefer in-memory profile, then sessionStorage (instant after refresh), then OIDC claims.
get displayFirstName(): string {
  const fromCache = (this.settingsService.currentUserData?.firstName ?? '').trim();
  if (fromCache) return fromCache;
  const fromProfile = (this.userprofile?.firstName ?? '').trim();
  if (fromProfile) return fromProfile;
  const fromSession = (this.hydratedDisplay?.firstName ?? '').trim();
  if (fromSession) return fromSession;
  return (this.user?.given_name ?? '').trim();
}

get displayLastName(): string {
  const fromCache = (this.settingsService.currentUserData?.lastName ?? '').trim();
  if (fromCache) return fromCache;
  const fromProfile = (this.userprofile?.lastName ?? '').trim();
  if (fromProfile) return fromProfile;
  const fromSession = (this.hydratedDisplay?.lastName ?? '').trim();
  if (fromSession) return fromSession;
  return (this.user?.family_name ?? '').trim();
}

/** Initials for avatar when no profile picture (e.g. "AC" for Alex Carry) */
get userInitials(): string {
  const first = (this.displayFirstName || '').charAt(0).toUpperCase();
  const last = (this.displayLastName || '').charAt(0).toUpperCase();
  if (first && last) return first + last;
  if (first) return first;
  if (last) return last;
  return '?';
}


    private loadProfile() {
      if (!this.user?.sub) return;
      this.isLoading = true;
  
      this.settingsService.getUserProfileResponse(this.user.sub)
        .pipe(
          // takeUntil(this.destroy$),
          catchError((err) => {
            console.error('getUserProfile failed', err);
            return of(new HttpResponse<UserProfileDto | null>({ status: 500 }));
          }),
          finalize(() => (this.isLoading = false))
        )
        .subscribe((res: HttpResponse<UserProfileDto | null>) => {
          if (res.status === 204) {
            // nothing saved yet; keep defaults
            return;
          }
          if (res.ok && res.body) {
            this.userprofile = res.body;
            const p = res.body;
            if (!p?.userId) return;
            this.userId = p.userId;
            const language = p.preferences?.language;
            this.currentLanguage = language === 'it' ? 'it' : 'en';
            this.setOtherLanguage();
            this.languageService.setFromApi(p.preferences?.language as LanguageCode);
            this.settingsService.setUserData(res.body);

  
            // show backend avatar if present (local preview only)
            if (p.profilePhotoUrl) {
              this.profileImagePreview = p.profilePhotoUrl;
            }
  
            // re-apply validators in case type changed
          }
        });
    }

      logout() {
        if (this.user?.sub) {
          clearUserDisplayCache(this.user.sub);
        }
        this.Authservice.logout();
    }

  get options(): AppSettings {
    return this.settings.getOptions();
  }

  openDialog() {
    const dialogRef = this.dialog.open(AppSearchDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  private emitOptions() {
    this.optionsChange.emit(this.settings.getOptions());
  }

    get clientFullName(): string {
    if (this.clientFirstName && this.clientLastName) {
      return `${this.clientFirstName} ${this.clientLastName}`;
    } else if (this.clientFirstName) {
      return this.clientFirstName;
    } else if (this.clientLastName) {
      return this.clientLastName;
    }
    return 'Client'; // Fallback text
  }

  setlightDark(theme: string) {
    this.settings.setOptions({ theme });
    this.emitOptions();
  }

  loadUnreadCount(): void {
    this.myNotifications.refreshUnreadCount();
  }

  onBellMenuOpened(): void {
    this.notificationsMenuOpen = true;
    this.resetNotificationModalVisibilityState();
    this.onNotificationMenuOpened();
  }

  onBellMenuClosed(): void {
    this.notificationsMenuOpen = false;
    this.teardownNotificationVisibilityObserver();
    this.visibilityMarkInFlight.clear();
  }

  onNotificationListScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el.scrollTop > 2) {
      this.allowUnlimitedVisibilityOnScroll = true;
    }
  }

  onNotificationSearchQueryChange(): void {
    if (!this.notificationsMenuOpen) return;
    this.rebindNotificationVisibilityObserver();
  }

  private resetNotificationModalVisibilityState(): void {
    this.initialVisibilityMarksRemaining = 2;
    this.allowUnlimitedVisibilityOnScroll = false;
    this.visibilityMarkInFlight.clear();
    this.teardownNotificationVisibilityObserver();
  }

  private rebindNotificationVisibilityObserver(): void {
    this.initialVisibilityMarksRemaining = 2;
    this.allowUnlimitedVisibilityOnScroll = false;
    this.visibilityMarkInFlight.clear();
    this.teardownNotificationVisibilityObserver();
    this.scheduleNotificationVisibilitySetup();
  }

  private scheduleNotificationVisibilitySetup(): void {
    setTimeout(() => this.setupNotificationVisibilityObserver(), 0);
    setTimeout(() => this.setupNotificationVisibilityObserver(), 100);
  }

  private teardownNotificationVisibilityObserver(): void {
    this.notificationVisibilityIo?.disconnect();
    this.notificationVisibilityIo = null;
  }

  private setupNotificationVisibilityObserver(): void {
    this.teardownNotificationVisibilityObserver();
    if (!this.notificationsMenuOpen || this.notificationsLoading) return;
    let root: HTMLElement | undefined = this.notificationListScroll?.nativeElement;
    if (!root && typeof document !== 'undefined') {
      root =
        (document.querySelector(
          '.notification-menu-panel .notification-list-scroll'
        ) as HTMLElement | null) ?? undefined;
    }
    if (!root) return;
    const buttons = root.querySelectorAll<HTMLElement>('.notification-item[data-notification-id]');
    if (!buttons.length) return;

    const minRatio = 0.35;
    this.notificationVisibilityIo = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(
          (e) => e.isIntersecting && e.intersectionRatio >= minRatio
        );
        visible.sort((a, b) => {
          const aId = a.target.getAttribute('data-notification-id') ?? '';
          const bId = b.target.getAttribute('data-notification-id') ?? '';
          const ia = this.filteredUserNotifications.findIndex((x) => x.id === aId);
          const ib = this.filteredUserNotifications.findIndex((x) => x.id === bId);
          return (ia === -1 ? 9999 : ia) - (ib === -1 ? 9999 : ib);
        });
        for (const entry of visible) {
          const id = entry.target.getAttribute('data-notification-id');
          if (!id || id === MFA_REMINDER_NOTIFICATION_ID) continue;
          const n = this.filteredUserNotifications.find((x) => x.id === id);
          if (!n || n.isRead) continue;
          if (this.visibilityMarkInFlight.has(n.id)) continue;
          const canSpendBudget =
            this.allowUnlimitedVisibilityOnScroll || this.initialVisibilityMarksRemaining > 0;
          if (!canSpendBudget) continue;
          if (!this.allowUnlimitedVisibilityOnScroll) {
            this.initialVisibilityMarksRemaining--;
          }
          this.markNotificationReadIfEligible(n);
        }
        this.cdr.markForCheck();
      },
      { root, rootMargin: '0px', threshold: [0, minRatio, 0.6, 1] }
    );

    buttons.forEach((el) => this.notificationVisibilityIo!.observe(el));
  }

  private markNotificationReadIfEligible(n: UserNotificationItem): void {
    if (n.id === MFA_REMINDER_NOTIFICATION_ID || n.isRead) return;
    if (this.visibilityMarkInFlight.has(n.id)) return;
    this.visibilityMarkInFlight.add(n.id);
    this.myNotifications.markAsRead(n.id).subscribe({
      next: () => {
        n.isRead = true;
        this.visibilityMarkInFlight.delete(n.id);
        this.cdr.markForCheck();
      },
      error: () => this.visibilityMarkInFlight.delete(n.id),
    });
  }

  private mergeNotificationsList(list: UserNotificationItem[]): UserNotificationItem[] {
    return prependMfaReminderNotification(
      list,
      this.Authservice.getUserProfile() as Record<string, unknown> | null,
      environment.authority
    );
  }

  private adjustUnreadForMfa(serverCount: number): number {
    const profile = this.Authservice.getUserProfile() as Record<string, unknown> | null;
    return userNeedsMfaReminder(profile) ? serverCount + 1 : serverCount;
  }

  onNotificationMenuOpened(): void {
    this.notificationSearchQuery = '';
    const now = Date.now();
    const hasCache = this.userNotifications.length > 0;
    const cacheFresh = now - this.lastNotificationsFetchAt < this.NOTIFICATIONS_CACHE_MS;
    const serviceRev = this.myNotifications.getFeedsRevision();
    const cacheMatchesFeeds = this.headerNotificationsFeedsRevision === serviceRev;

    if (hasCache && cacheFresh && cacheMatchesFeeds) {
      this.scheduleNotificationVisibilitySetup();
      return;
    }

    this.notificationsLoading = !hasCache; // Only show loading if no cache
    this.myNotifications.getList(this.notificationFilter).subscribe({
      next: (list) => {
        this.userNotifications = this.mergeNotificationsList(list);
        this.notificationsLoading = false;
        this.lastNotificationsFetchAt = Date.now();
        this.headerNotificationsFeedsRevision = this.myNotifications.getFeedsRevision();
        this.scheduleNotificationVisibilitySetup();
      },
      error: () => (this.notificationsLoading = false)
    });
  }

  setNotificationFilter(filter: 'all' | 'unread', event?: Event): void {
    event?.stopPropagation();
    if (this.notificationFilter === filter) return;
    this.notificationFilter = filter;
    this.notificationSearchQuery = '';
    this.notificationsLoading = true;
    this.lastNotificationsFetchAt = 0;
    this.myNotifications.getList(filter).subscribe({
      next: (list) => {
        this.userNotifications = this.mergeNotificationsList(list);
        this.notificationsLoading = false;
        this.lastNotificationsFetchAt = Date.now();
        this.headerNotificationsFeedsRevision = this.myNotifications.getFeedsRevision();
        this.cdr.markForCheck();
        if (this.notificationsMenuOpen) {
          this.rebindNotificationVisibilityObserver();
        }
      },
      error: () => {
        this.notificationsLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onNotificationClick(n: UserNotificationItem): void {
    if (n.id === MFA_REMINDER_NOTIFICATION_ID) {
      if (n.deepLink?.startsWith('http')) {
        window.open(n.deepLink, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    if (!n.isRead) {
      this.markNotificationReadIfEligible(n);
    }
    if (n.deepLink) {
      if (n.deepLink.startsWith('http')) {
        window.open(n.deepLink, '_blank', 'noopener,noreferrer');
      } else {
        this.router.navigateByUrl(n.deepLink);
      }
    }
  }

  changeLanguage(lang: any): void {
    this.translate.use(lang.code);
    this.selectedLanguage = lang;
  }

  notifications: notifications[] = [
    {
      id: 1,
      img: '/assets/images/profile/user-1.jpg',
      title: 'Roman Joined thes Team!',
      subtitle: 'Congratulate him',
    },
    {
      id: 2,
      img: '/assets/images/profile/user-2.jpg',
      title: 'New message received',
      subtitle: 'Salma sent you new message',
    },
    {
      id: 3,
      img: '/assets/images/profile/user-3.jpg',
      title: 'New Payment received',
      subtitle: 'Check your earnings',
    },
    {
      id: 4,
      img: '/assets/images/profile/user-4.jpg',
      title: 'Jolly completed tasks',
      subtitle: 'Assign her new tasks',
    },
    {
      id: 5,
      img: '/assets/images/profile/user-5.jpg',
      title: 'Roman Joined the Team!',
      subtitle: 'Congratulatse him',
    },
  ];

  profiledd: profiledd[] = [
    {
      id: 1,
      img: '/assets/images/svgs/icon-account.svg',
      title: 'My Profile',
      subtitle: 'Account Settings',
      link: '/',
    },
    {
      id: 2,
      img: '/assets/images/svgs/icon-inbox.svg',
      title: 'My Inbox',
      subtitle: 'Messages & Email',
      link: '/apps/email/inbox',
    },
    {
      id: 3,
      img: '/assets/images/svgs/icon-tasks.svg',
      title: 'My Tasks',
      subtitle: 'To-do and Daily Tasks',
      link: '/apps/taskboard',
    },
  ];

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
      title: 'Todo App',
      subtitle: 'Completed task',
      link: '/apps/todo',
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
      title: 'Conatct List',
      subtitle: 'Create new contact',
      link: '/apps/contact-list',
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
}

@Component({
  selector: 'search-dialog',
  imports: [
    RouterModule,
    TablerIconsModule,
    FormsModule,
    MatFormFieldModule,
    MatDividerModule,
    MatDialogModule,
    MatToolbarModule,
  ],
  templateUrl: 'search-dialog.component.html',
})
export class AppSearchDialogComponent {
  searchText: string = '';
  navItems = navItems;

  navItemsData = navItems.filter((navitem) => navitem.displayName);

  // filtered = this.navItemsData.find((obj) => {
  //   return obj.displayName == this.searchinput;
  // });
}
