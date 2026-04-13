import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subject } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { filter, startWith, takeUntil } from 'rxjs';
import { BrandingComponent } from './branding.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from 'src/app/auth/services/auth.service';
import { OrganizationProfilesService } from 'src/app/settings/services/organization.profiles.service';

@Component({
  selector: 'app-sidebar',
  imports: [
    TablerIconsModule,
    BrandingComponent,
    CommonModule,
    MatButtonModule,
  ],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private organizationProfiles = inject(OrganizationProfilesService);
  private destroy$ = new Subject<void>();

  @Input() showToggle = true;
  @Input() sidenavCollapsed = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  isSettings = false;
  /** Organization-uploaded logo; when null, sidebar uses static SVG fallbacks. */
  brandingLogo: string | null = null;

  /**
   * Stable asset URLs for default sidebar logos. Both images stay mounted; only CSS
   * visibility toggles with the sidebar so the browser does not reload on collapse/expand.
   */
  readonly staticExpandedLogoSrc =
    'assets/images/logos/sidebar-fallback-logo.svg';
  readonly staticCollapsedLogoSrc =
    'assets/images/logos/sidebar-mini-fallback-icon.svg';

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        startWith(null),
      )
      .subscribe(() => {
        const url = this.router.url.split('?')[0];
        this.isSettings = url.startsWith('/settings');
      });

    const userId = this.authService.getUserProfile()?.sub;
    if (userId) {
      const immediate = this.ensureDataUrl(
        this.organizationProfiles.getBrandingLogoValue(),
      );
      if (immediate) {
        this.brandingLogo = immediate;
      }

      this.organizationProfiles
        .getProfile(userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (p) => {
            const logo = this.ensureDataUrl(p?.profilePhotoUrl ?? null);
            this.brandingLogo = logo;
            this.organizationProfiles.setBrandingLogo(logo, userId);
          },
          error: () => {},
        });

      this.organizationProfiles.brandingLogo$
        .pipe(takeUntil(this.destroy$))
        .subscribe((url) => {
          const logo = this.ensureDataUrl(url);
          this.brandingLogo = logo;
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private ensureDataUrl(s: string | null): string | null {
    if (!s) return null;
    return s.startsWith('data:') ? s : `data:image/jpeg;base64,${s}`;
  }
}
