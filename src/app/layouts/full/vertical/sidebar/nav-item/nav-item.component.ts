import {
  Component,
  HostBinding,
  Input,
  OnInit,
  OnChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { NavItem } from './nav-item';
import { ActivatedRoute, Router } from '@angular/router';
import { NavService } from '../../../../../services/nav.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { identitySecurityManageUrl } from 'src/app/core/identity-security-url';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { NavItemService } from '../../../nav-item.service';
import { Store } from '@ngrx/store';
import { selectedCashflow } from 'src/app/store/cashflow/cashflow.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, tap } from 'rxjs';

@Component({
  selector: 'app-nav-item',
  imports: [
    TranslateModule,
    TablerIconsModule,
    MaterialModule,
    CommonModule,
    MatRippleModule,
  ],
  templateUrl: './nav-item.component.html',
  styleUrls: [],
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ]),
  ],
})
export class AppNavItemComponent implements OnChanges {
  /** First path segment after `/cashflows/:id/` where the Plan item stays active. */
  private static readonly LIFETIME_PLAN_CASHFLOW_SEGMENTS = new Set([
    'timeline',
    'finances',
    'income',
    'withdrawal',
    'reports',
    'scenario-lab',
  ]);

  @Output() toggleMobileLink: any = new EventEmitter<void>();
  @Output() notify: EventEmitter<boolean> = new EventEmitter<boolean>();

  expanded: any = false;
  disabled: any = false;
  twoLines: any = false;
  selectedCashflowId: string;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;
  @Input() item: NavItem | any;
  @Input() depth: any;
  @Input() showLabel: boolean = false;
  @Input() label: string = '';


  constructor(public navService: NavService, public router: Router, public navItem: NavItemService,
    private store: Store,
    private translate: TranslateService,
  ) {
    if (this.depth === undefined) {
      this.depth = 0;
    }
    this.store.select(selectedCashflow).pipe(
      takeUntilDestroyed(),
      filter(cashflow => !!cashflow),
      tap((cashflow) => this.selectedCashflowId = cashflow.id)
    ).subscribe();
  }

  ngOnChanges() {
    const url = this.navService.currentUrl() ?? this.router.url.split('?')[0];
    if (this.item.route && url) {
      this.expanded = url.indexOf(`/${this.item.route}`) === 0;
      this.ariaExpanded = this.expanded;
    }
  }

  /**
   * Determines whether this nav item should be highlighted as "active".
   * Highlighting must be based on the route (not displayName), because
   * displayName can be translated/changed independently of navigation.
   */
  isItemActive(item: NavItem | any): boolean {
    if (!item) return false;

    // If this is a group item, highlight it if any child is active.
    if (item.children?.length) {
      return item.children.some((child: NavItem | any) => this.isItemActive(child));
    }

    const url = this.navService.currentUrl() ?? this.router.url.split('?')[0];
    if (!url || !item.route) return false;

    const currentPath = String(url).split('?')[0].split('#')[0];

    // Lifetime Plan hub: highlight on plan sub-routes (excludes emergencies, wealth-only routes, etc.).
    if (this.isLifetimePlanHubNavItem(item) && this.selectedCashflowId) {
      const base = `/cashflows/${this.selectedCashflowId}`;
      if (currentPath === base || currentPath.startsWith(`${base}/`)) {
        const rest =
          currentPath === base ? '' : currentPath.slice(base.length + 1);
        const firstSegment = rest.split('/')[0] ?? '';
        if (
          firstSegment &&
          AppNavItemComponent.LIFETIME_PLAN_CASHFLOW_SEGMENTS.has(firstSegment)
        ) {
          return true;
        }
      }
    }

    let resolvedRoute = String(item.route);

    // Resolve dynamic route params used by this project (ex: {cashflowId}).
    if (resolvedRoute.includes('{cashflowId}') && this.selectedCashflowId) {
      resolvedRoute = resolvedRoute.replace('{cashflowId}', this.selectedCashflowId);
    }

    // Normalize leading slash because nav item routes are often relative.
    if (!resolvedRoute.startsWith('/')) {
      resolvedRoute = `/${resolvedRoute}`;
    }

    return (
      currentPath === resolvedRoute ||
      currentPath.startsWith(`${resolvedRoute}/`) ||
      currentPath.startsWith(resolvedRoute)
    );
  }

  /** Sidebar "Plan" / Lifetime Plan hub: one entry for the whole cashflow area. */
  private isLifetimePlanHubNavItem(item: NavItem | any): boolean {
    return (
      !!item?.navCap &&
      typeof item?.route === 'string' &&
      item.route.includes('{cashflowId}/reports')
    );
  }

  onItemSelected(item: NavItem) {
    if (item.nonNavigable) {
      return;
    }

    if (!item.children || !item.children.length) {
      var newRoute = item.route;

      if (item?.route?.includes('{cashflowId}') && this.selectedCashflowId) {
        newRoute = item.route.replace('{cashflowId}', this.selectedCashflowId);
      }

      if (newRoute?.startsWith('http://') 
          || newRoute?.startsWith('https://')) {
        const url = new URL(newRoute);
      
        if (url.hostname === window.location.hostname) {
          this.router.navigateByUrl(url.pathname + url.search);
        } else {
          window.location.href = newRoute;
        }
      } else {
        this.router.navigate([newRoute]);
      }
    }

    if (item.children && item.children.length) {
      this.expanded = !this.expanded;
    }
    
    //scroll
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
    
    if (!this.expanded) {
      if (window.innerWidth < 1024) {
        this.notify.emit();
      }
    }
  }

  onSubItemSelected(item: NavItem) {
    if (!item.children || !item.children.length) {
      if (this.expanded && window.innerWidth < 1024) {
        this.notify.emit();
      }
    }
  }

  onExternalLinkClick(item: NavItem) {
    let url = item.route;
    if (item.identitySecurityUrl) {
      url = identitySecurityManageUrl(this.translate.currentLang || undefined);
    }
    if (!url) return;
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  }
}
