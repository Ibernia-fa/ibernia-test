import { Component, ElementRef, ViewChild } from '@angular/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';

@Component({
  selector: 'app-branding',
  standalone: false,
  templateUrl: './branding.component.html',
  styleUrls: ['./branding.component.scss'],
})
export class BrandingComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  profileImage: string | null = null; // Data URL preview

  constructor(
        private navItemService: NavItemService
  ){
    this.navItemService.currentRouteName = 'Branding';
    
  }
  async onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      this.profileImage = await this.fileToDataUrl(file); // show preview
    } finally {
      // allow re-selecting same file next time
      input.value = '';
    }
  }

  clearImage(e: Event) {
    // Do NOT trigger file dialog when clearing
    e.stopPropagation();
    e.preventDefault();
    this.profileImage = null;
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('File read error'));
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}
