import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from 'src/app/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  /** Roles that grant access to Admin Notifications */
  private static readonly AdminRoles = ['Administrator', 'IberniaIdentityAdminAdministrator'];

  async canActivate(): Promise<boolean> {
    for (const role of AdminGuard.AdminRoles) {
      if (await this.auth.hasRole(role)) return true;
    }
    this.router.navigate(['/settings/notifications']);
    return false;
  }
}
