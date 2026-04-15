import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

interface NavItem {
  labelKey: string;
  route: string;
  svgContent: SafeHtml;
}

@Component({
  selector: 'app-cashflow-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './cashflow-nav.component.html',
  styleUrl: './cashflow-nav.component.scss',
})
export class CashflowNavComponent implements OnInit, AfterViewInit {
  cashflowId: string | null = null;
  isReady = false; // gates the template — prevents FOUC
  readonly navItems: NavItem[];

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
  ) {
    // SafeHtml must be produced at runtime via DomSanitizer.
    // Angular strips raw SVG strings from [innerHTML] bindings —
    // bypassSecurityTrustHtml() marks the content as explicitly trusted.
    const safe = (svg: string): SafeHtml =>
      this.sanitizer.bypassSecurityTrustHtml(svg);

    this.navItems = [
      {
        labelKey: 'Goals',
        route: 'timeline',
        svgContent: safe(`
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        `),
      },
      {
        labelKey: 'Money In & Out',
        route: 'income',
        svgContent: safe(`
         <path d="M8.71875 14.3438C8.71875 15.6382 9.76809 16.6875 11.0625 16.6875H12.9375C14.2319 16.6875 15.2812 15.6382 15.2812 14.3438C15.2812 13.0493 14.2319 12 12.9375 12H11.0625C9.76809 12 8.71875 10.9507 8.71875 9.65625C8.71875 8.36184 9.76809 7.3125 11.0625 7.3125H12.9375C14.2319 7.3125 15.2812 8.36184 15.2812 9.65625M12 7.3125V4.5M12 19.5V16.6875M22.2018 2.00944L17.5322 2.418M17.5322 2.418L17.9407 7.08764M17.5322 2.418C20.8382 4.33087 23.0625 7.9057 23.0625 12C23.0625 18.1096 18.1096 23.0625 12 23.0625M1.79817 21.9906L6.46781 21.582M6.46781 21.582L6.05925 16.9124M6.46781 21.582C3.16177 19.6691 0.9375 16.0943 0.9375 12C0.9375 5.89036 5.89036 0.9375 12 0.9375" stroke="currentColor" stroke-width="1.875" stroke-miterlimit="10"/>
        `),
      },
      {
        labelKey: 'Savings',
        route: 'finances',
        svgContent: safe(`
          <path d="M4 3H20C20.5304 3 21.0391 3.21071 21.4142 3.58579C21.7893 3.96086 22 4.46957 22 5V11C22 13.6522 20.9464 16.1957 19.0711 18.0711C17.1957 19.9464 14.6522 21 12 21C10.6868 21 9.38642 20.7413 8.17317 20.2388C6.95991 19.7362 5.85752 18.9997 4.92893 18.0711C3.05357 16.1957 2 13.6522 2 11V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 10L12 14L16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          `),
      },
      {
        labelKey: 'Lifetime Plan',
        route: 'reports',
        svgContent: safe(`
          <path d="M2.54102 2.54102V18.494C2.54102 20.0469 3.8116 21.3175 5.36455 21.3175H21.3175" stroke="currentColor" stroke-width="1.41173" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.36475 16.6586L9.74122 11.5762C10.4471 10.7292 11.7177 10.7292 12.5647 11.4351L13.4118 12.2821C14.1177 12.988 15.3883 12.988 16.2353 12.1409L20.6118 7.05859" stroke="currentColor" stroke-width="1.41173" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
        `),
      },
    ];
  }

  ngOnInit(): void {
    let r: ActivatedRoute | null = this.route;
    while (r) {
      const id = r.snapshot.params['id'];
      if (id) {
        this.cashflowId = id;
        break;
      }
      r = r.parent;
    }
  }

  ngAfterViewInit(): void {
    // Component styles are guaranteed to be in the DOM by this lifecycle hook.
    // Setting isReady here means the template is only rendered once styles
    // are applied — eliminating the flash of unstyled content on page refresh.
    this.isReady = true;
    this.cdr.detectChanges();
  }

  getLink(item: NavItem): string[] {
    return this.cashflowId ? ['/cashflows', this.cashflowId, item.route] : [];
  }
}

// Old Component

// import { Component } from '@angular/core';
// import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { TranslateModule } from '@ngx-translate/core';

// interface NavItem {
//   label: string;
//   route: string;
//   icon: string;
//   iconActive: string;
// }

// @Component({
//   selector: 'app-cashflow-nav',
//   standalone: true,
//   imports: [CommonModule, RouterLink, TranslateModule],
//   templateUrl: './cashflow-nav.component.html',
//   styleUrl: './cashflow-nav.component.scss',
// })
// export class CashflowNavComponent {
//   cashflowId: string | null = null;
//   navItems: NavItem[] = [
//     { label: 'Goals', route: 'timeline', icon: 'assets/images/navigation/goals.png', iconActive: 'assets/images/navigation/goals-active.png' },
//     { label: 'Savings', route: 'finances', icon: 'assets/images/navigation/savings.png', iconActive: 'assets/images/navigation/savings-active.png' },
//     { label: 'Money In & Out', route: 'income', icon: 'assets/images/navigation/money-in-out.png', iconActive: 'assets/images/navigation/money-in-out-active.png' },
//     { label: 'Flows', route: 'withdrawal', icon: 'assets/images/navigation/flows.png', iconActive: 'assets/images/navigation/flows-active.png' },
//     { label: 'Lifetime Plan', route: 'reports', icon: 'assets/images/navigation/lifetime-plan.png', iconActive: 'assets/images/navigation/lifetime-plan-active.png' },
//   ];

//   constructor(
//     private router: Router,
//     private route: ActivatedRoute
//   ) {
//     let r: ActivatedRoute | null = this.route;
//     while (r) {
//       const id = r.snapshot.params['id'];
//       if (id) {
//         this.cashflowId = id;
//         break;
//       }
//       r = r.parent;
//     }
//     this.route.params.subscribe((p) => {
//       if (p['id']) this.cashflowId = p['id'];
//     });
//   }

//   getIconPath(item: NavItem, isActive: boolean): string {
//     return isActive ? item.iconActive : item.icon;
//   }

//   isActive(item: NavItem): boolean {
//     if (!this.cashflowId) return false;
//     const url = this.router.url;
//     const base = `/cashflows/${this.cashflowId}`;
//     if (item.route === 'timeline') return url === `${base}/timeline` || url.startsWith(`${base}/timeline`);
//     if (item.route === 'finances') return url === `${base}/finances` || url.startsWith(`${base}/finances`);
//     if (item.route === 'income') return url === `${base}/income` || url.startsWith(`${base}/income`);
//     if (item.route === 'withdrawal') return url === `${base}/withdrawal` || url.startsWith(`${base}/withdrawal`);
//     if (item.route === 'reports') return url === `${base}/reports` || url.startsWith(`${base}/reports`);
//     return false;
//   }

//   getLink(item: NavItem): string[] {
//     return this.cashflowId ? ['/cashflows', this.cashflowId, item.route] : [];
//   }
// }
