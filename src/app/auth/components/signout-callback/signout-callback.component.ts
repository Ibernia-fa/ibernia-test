import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signout-callback',
  standalone: true,
  template: '',
})
export class SignoutCallbackComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.auth
      .finishLogout()
      .then(() => this.router.navigateByUrl('/clients', { replaceUrl: true }))
      .catch(() =>
        this.auth.clearLocalOidcSession().then(() =>
          this.router.navigateByUrl('/clients', { replaceUrl: true })
        )
      );
  }
}
