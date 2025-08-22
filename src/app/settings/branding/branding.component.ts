import { Component } from '@angular/core';

@Component({
  selector: 'app-branding',
  standalone: false,
  
  templateUrl: './branding.component.html',
styleUrls: ['./branding.component.scss'],
})



export class BrandingComponent {
  profileImage: string | ArrayBuffer | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => this.profileImage = reader.result;
    if (file) reader.readAsDataURL(file);
  }
}
