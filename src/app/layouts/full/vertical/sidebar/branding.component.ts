import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreService } from 'src/app/services/core.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [CommonModule],
  template: ` <a href="/" class="branding-link">
      <span class="brand-logo-stack">
        <img
          src="assets/images/logos/ibernia-logo.svg"
          alt="Ibernia"
          class="brand-logo brand-logo--default"
          loading="eager"
          fetchpriority="high"
          decoding="sync"
        />
        <img
          *ngIf="profileImage && sanitizedImage"
          [src]="sanitizedImage"
          alt="Company logo"
          class="brand-logo brand-logo--custom"
          loading="eager"
          decoding="sync"
        />
      </span>
    </a>`,
  styles: [
    `
      .branding-link {
        display: flex;
        align-items: center;
        text-decoration: none;
        gap: 5px;
      }

      .brand-logo-stack {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .brand-logo--default {
        display: block;
        max-width: 120px;
        height: auto;
      }

      .brand-logo--custom {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        max-width: 120px;
        max-height: 48px;
        width: auto;
        height: auto;
        object-fit: contain;
      }

      .brand-logo {
        max-width: 120px;
        height: auto;
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
