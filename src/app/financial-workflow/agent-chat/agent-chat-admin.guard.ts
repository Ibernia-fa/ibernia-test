import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { AuthService } from 'src/app/auth/services/auth.service';

const ADMIN_ROLES = ['Administrator', 'IberniaIdentityAdminAdministrator'] as const;

@Injectable({ providedIn: 'root' })
export class AgentChatAdminGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    for (const role of ADMIN_ROLES) {
      if (await this.auth.hasRole(role)) {
        return true;
      }
    }
    const id = route.parent?.paramMap.get('id');
    if (id) {
      void this.router.navigate(['/cashflows', id, 'timeline']);
    } else {
      void this.router.navigate(['/clients']);
    }
    return false;
  }
}
