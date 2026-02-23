import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  template: '',
})
export class AuthCallbackComponent implements OnInit {

  constructor(private router: Router, private AuthService: AuthService) { }

  ngOnInit(): void {
    this.AuthService.finishLogin().then(_ => {
      this.router.navigate(['/clients'], { replaceUrl: true });
    })
  }

}