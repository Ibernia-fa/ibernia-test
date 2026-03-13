import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  iconActive: string;
}

@Component({
  selector: 'app-cashflow-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './cashflow-nav.component.html',
  styleUrl: './cashflow-nav.component.scss',
})
export class CashflowNavComponent {
  cashflowId: string | null = null;
  navItems: NavItem[] = [
    { label: 'Goals', route: 'timeline', icon: 'assets/images/navigation/goals.png', iconActive: 'assets/images/navigation/goals-active.png' },
    { label: 'Savings', route: 'finances', icon: 'assets/images/navigation/savings.png', iconActive: 'assets/images/navigation/savings-active.png' },
    { label: 'Money In & Out', route: 'income', icon: 'assets/images/navigation/money-in-out.png', iconActive: 'assets/images/navigation/money-in-out-active.png' },
    { label: 'Flows', route: 'withdrawal', icon: 'assets/images/navigation/flows.png', iconActive: 'assets/images/navigation/flows-active.png' },
    { label: 'Lifetime Plan', route: 'reports', icon: 'assets/images/navigation/lifetime-plan.png', iconActive: 'assets/images/navigation/lifetime-plan-active.png' },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    let r: ActivatedRoute | null = this.route;
    while (r) {
      const id = r.snapshot.params['id'];
      if (id) {
        this.cashflowId = id;
        break;
      }
      r = r.parent;
    }
    this.route.params.subscribe((p) => {
      if (p['id']) this.cashflowId = p['id'];
    });
  }

  getIconPath(item: NavItem, isActive: boolean): string {
    return isActive ? item.iconActive : item.icon;
  }

  isActive(item: NavItem): boolean {
    if (!this.cashflowId) return false;
    const url = this.router.url;
    const base = `/cashflows/${this.cashflowId}`;
    if (item.route === 'timeline') return url === `${base}/timeline` || url.startsWith(`${base}/timeline`);
    if (item.route === 'finances') return url === `${base}/finances` || url.startsWith(`${base}/finances`);
    if (item.route === 'income') return url === `${base}/income` || url.startsWith(`${base}/income`);
    if (item.route === 'withdrawal') return url === `${base}/withdrawal` || url.startsWith(`${base}/withdrawal`);
    if (item.route === 'reports') return url === `${base}/reports` || url.startsWith(`${base}/reports`);
    return false;
  }

  getLink(item: NavItem): string[] {
    return this.cashflowId ? ['/cashflows', this.cashflowId, item.route] : [];
  }
}
