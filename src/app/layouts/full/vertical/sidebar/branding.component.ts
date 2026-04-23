import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreService } from 'src/app/services/core.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [CommonModule],
  template: ` <a href="/" class="branding-link">
    <img
      src="assets/images/logos/ibernia-logo.svg"
      alt="Ibernia"
      class="brand-layer"
      [class.brand-logo--default-hidden]="!!profileImage"
      loading="eager"
      fetchpriority="high"
      decoding="sync"
    />

    <img
      *ngIf="profileImage && sanitizedImage"
      [src]="sanitizedImage"
      alt="Company logo"
      class="brand-layer brand-logo--custom"
      loading="eager"
      decoding="sync"
    />
  </a>`,
  styles: [
    `
      .branding-link {
        max-width: 160px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }
      .branding-link:focus-visible {
        outline: none;
        border: none;
      }
      .brand-layer {
        width: 100%;
        max-width: 154px;
        height: auto;
        // height: 52px;
        // object-fit: cover;
        // object-position: center;
      }
      .brand-layer.brand-logo--custom {
        width: 100%;
        max-width: 154px;
        height: 48px;
        object-fit: cover;
        object-position: center;
      }
      // :host {
      //   display: block;
      //   max-width: 100%;
      //   min-width: 0;
      // }

      // .branding-link {
      //   display: flex;
      //   align-items: center;
      //   text-decoration: none;
      //   gap: 5px;
      //   max-width: 100%;
      //   min-width: 0;
      // }

      /* Same grid cell = no absolute centering (avoids wrong x/y before parent has size or while data-URL decodes) */
      // .brand-logo-stack {
      //   display: grid;
      //   grid-template-columns: minmax(0, 160px);
      //   grid-template-rows: auto;
      //   justify-items: start;
      //   align-items: center;
      //   width: fit-content;
      //   max-width: 100%;
      //   min-height: 40px;
      //   overflow: hidden;
      // }

      // .brand-layer {
      //   grid-area: 1 / 1;
      //   display: block;
      //   max-width: 100%;
      //   width: auto;
      //   height: auto;
      //   max-height: 48px;
      //   object-fit: contain;
      //   object-position: left center;
      // }

      // .brand-logo--default {
      //   max-width: 160px;
      // }

      /* In DOM for instant swap when custom is removed; invisible while custom shows */
      .brand-logo--default-hidden {
        // opacity: 0;
        // visibility: hidden;
        display: none;
      }

      // .power-by-logo {
      //   display: block;
      //   width: 120px;
      // }
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
