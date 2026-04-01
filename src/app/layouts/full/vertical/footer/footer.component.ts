import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, TranslateModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  showFaqLink = true;
  readonly termsUrl = 'https://ibernia.app/terms';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.showFaqLink = !e.urlAfterRedirects.startsWith('/questionnaire/');
      });
  }
}
