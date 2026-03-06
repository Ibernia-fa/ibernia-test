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
import { filter, startWith, takeUntil, take } from 'rxjs';
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
  brandingLogo: string | null = null;
  isBrandLogoLoaded = false;

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        startWith(null)
      )
      .subscribe(() => {
        const url = this.router.url.split('?')[0];
        this.isSettings = url.startsWith('/settings');
      });

    const userId = this.authService.getUserProfile()?.sub;
    if (userId) {
      // Use cached logo immediately if available (e.g. from header or previous load)
      this.organizationProfiles.brandingLogo$
        .pipe(take(1))
        .subscribe((url) => {
          const cached = this.ensureDataUrl(url);
          if (cached) {
            this.brandingLogo = cached;
            this.isBrandLogoLoaded = true;
          }
        });

      this.organizationProfiles
        .getProfile(userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (p) => {
            const logo = this.ensureDataUrl(p?.profilePhotoUrl ?? null);
            this.brandingLogo = logo;
            this.isBrandLogoLoaded = true;
            this.organizationProfiles.setBrandingLogo(logo);
          },
          error: () => {
            this.isBrandLogoLoaded = true;
          },
        });
      this.organizationProfiles.brandingLogo$
        .pipe(takeUntil(this.destroy$))
        .subscribe((url) => {
          const logo = this.ensureDataUrl(url);
          if (logo) {
            this.brandingLogo = logo;
            this.isBrandLogoLoaded = true;
          }
        });
    } else {
      this.isBrandLogoLoaded = true;
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