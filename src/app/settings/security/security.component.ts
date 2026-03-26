import { Component } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [TranslateModule, MatCard, MatCardContent, MatButtonModule],
  templateUrl: './security.component.html',
  styleUrl: './security.component.scss'
})
export class SecurityComponent {
  private readonly authorityBase = environment.authority.replace(/\/$/, '');

  readonly changePasswordUrl = `${this.authorityBase}/Manage/ChangePassword`;
  readonly twoFactorUrl = `${this.authorityBase}/Manage/TwoFactorAuthentication`;
}
