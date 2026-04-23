import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

/**
 * Loaded in a hidden iframe by oidc-client for automaticSilentRenew.
 * Must match silent_redirect_uri in AuthService idpSettings; register the same URI on the Identity Server client.
 */
@Component({
  selector: 'app-silent-renew-oidc',
  standalone: true,
  template: '',
})
export class SilentRenewOidcComponent implements OnInit {
  constructor(private readonly auth: AuthService) {}

  ngOnInit(): void {
    void this.auth.finishSilentRenew();
  }
}
