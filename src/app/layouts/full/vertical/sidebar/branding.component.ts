import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';

@Component({
  selector: 'app-branding',
  imports: [],
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
    <a href="/">
      <img width="150px" src="./assets/images/logos/1.png" alt="logo" />
    </a>
  `,
})
export class BrandingComponent {
  options = this.settings.getOptions();
  constructor(private settings: CoreService) {}
}
