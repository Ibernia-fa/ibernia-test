import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreService } from 'src/app/services/core.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [CommonModule],
  template: ` <a href="/" class="branding-link">
      <ng-container *ngIf="profileImage; else defaultLogo">
        <img
          [src]="sanitizedImage"
          alt="logo"
          class="brand-logo"
          loading="eager"
          decoding="sync"
        />
      </ng-container>
    </a>

    <!-- width="150" -->
    <ng-template #defaultLogo>
      <img src="./assets/images/logos/ibernia-logo.svg" alt="logo" />
    </ng-template>`,
  styles: [
    `
      .branding-link {
        display: flex;
        align-items: center;
        text-decoration: none;
        gap: 5px;
      }

      .brand-logo {
        // width: 100%;
        max-width: 120px;
        height: auto;
        // width: 50px;
        // height: 50px;
        // object-fit: contain;
        // object-position: center;
        // margin: 0;
        // padding: 0;
        // display: block;
      }
      .power-by-logo {
        display: block;
        width: 120px;
      }
    `,
  ],
})
export class BrandingComponent implements OnChanges {
  @Input() profileImage: string | null = null;
  sanitizedImage: SafeUrl | null = null;
  options = this.settings.getOptions();
  constructor(
    private settings: CoreService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['profileImage']) return;
    if (this.profileImage) {
      this.sanitizedImage = this.sanitizer.bypassSecurityTrustUrl(
        this.profileImage,
      );
    } else {
      this.sanitizedImage = null;
    }
  }
}
