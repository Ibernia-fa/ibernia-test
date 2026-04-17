import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CashflowNavComponent } from '../cashflow-nav/cashflow-nav.component';
import { MatCardModule } from '@angular/material/card';

const NAV_ROUTES = ['timeline', 'finances', 'income', 'withdrawal', 'reports'];

@Component({
  selector: 'app-cashflow-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, CashflowNavComponent, MatCardModule],
  templateUrl: './cashflow-layout.component.html',
  styleUrl: './cashflow-layout.component.scss',
})
export class CashflowLayoutComponent {
  constructor(private router: Router) {}

  get showNav(): boolean {
    const url = this.router.url;
    return NAV_ROUTES.some((r) => url.includes(`/${r}`));
  }
}
