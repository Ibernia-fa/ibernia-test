import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreService } from 'src/app/services/core.service';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [CommonModule],
  // template: `
  //   <a href="/" class="logodark">
  //     <!-- src="./assets/images/logos/dark-logo.svg" -->
  //     <img
  //       src="./assets/images/logos/logo.png"
  //       class="align-middle m-2"
  //       alt="logo"
  //     />
  //   </a>

  //   <a href="/" class="logolight">
  //     <!-- src="./assets/images/logos/light-logo.svg" -->
  //     <img
  //       src="./assets/images/logos/logo.png"
  //       class="align-middle m-2"
  //       alt="logo"
  //     />
  //   </a>
  // `,
  template: `
    <a href="/" class="branding-link">
      <ng-container *ngIf="profileImage; else defaultLogo">
        <img
          [src]="profileImage"
          alt="logo"
          class="brand-logo"
        />
        <span class="powered-text">Powered by Ibernia.</span>
      </ng-container>
    </a>

    <ng-template #defaultLogo>
      <img
        width="150"
        src="./assets/images/logos/1.png"
        alt="logo"
      />
    </ng-template>`,
    styles: [`
    .branding-link {
      display: flex;
      align-items: flex-end;
      text-decoration: none;
      gap: 5px;
    }

    .brand-logo {
      width: 50px;
      height: 50px;
      object-fit: contain;
      object-position: center;
      margin: 0;
      padding: 0;
      display: block;
    }

    .powered-text {
      font-size: 0.7rem;
      color: #a2a2a2;
      white-space: nowrap;
      text-decoration: none;
      margin: 0;
      padding: 0;
      line-height: 1;
      position: relative;
      bottom: 0;
    }
  `]
})
export class BrandingComponent {
  @Input() profileImage: string | null = null;
  options = this.settings.getOptions();
  constructor(private settings: CoreService) {}
}
