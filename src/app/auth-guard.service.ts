import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { Observable, from } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return from(this.authService.isAuthenticated()).pipe(
      tap(userAuthenticated => {
        if (!userAuthenticated) {
          this.authService.login();
        }
      })
    );
  }
}
