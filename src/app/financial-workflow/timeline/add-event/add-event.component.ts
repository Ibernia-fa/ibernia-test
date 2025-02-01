import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
interface Food {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-add-event',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-event.component.html',
  styleUrl: './add-event.component.scss',
})
export class AddEventComponent {
  foods: Food[] = [
    { value: '0', viewValue: '1' },
    { value: '1', viewValue: '2' },
    { value: '2', viewValue: '3' },
  ];
}
