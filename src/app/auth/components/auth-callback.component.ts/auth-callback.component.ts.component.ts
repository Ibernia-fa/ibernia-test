import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AUTH_RETURN_URL_KEY } from '../../../auth-guard.service';

@Component({
  selector: 'app-auth-callback',
  template: '',
})
export class AuthCallbackComponent implements OnInit {

  constructor(private router: Router, private AuthService: AuthService) { }

  ngOnInit(): void {
    this.AuthService.finishLogin().then(_ => {
      const returnUrl = sessionStorage.getItem(AUTH_RETURN_URL_KEY);
      sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
      const target = returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/clients';
      this.router.navigateByUrl(target, { replaceUrl: true });
    });
  }

}