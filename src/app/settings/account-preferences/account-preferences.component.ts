import { Component } from '@angular/core';

@Component({
  selector: 'app-account-preferences',
  standalone: false,
  
  templateUrl: './account-preferences.component.html',
  styleUrls: ['./account-preferences.component.scss'],
})
export class AccountPreferencesComponent {
  profileImage: string | ArrayBuffer | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => this.profileImage = reader.result;
    if (file) reader.readAsDataURL(file);
  }
}
