import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './layouts/full/vertical/footer/footer.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet,
      FooterComponent
    ],
    templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Ibernia';
}
