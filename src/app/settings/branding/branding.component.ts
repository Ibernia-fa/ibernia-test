import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { OrganizationProfilesService } from '../services/organization.profiles.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [TranslateModule, MatCard, MatCardContent, NgIf],
  templateUrl: './branding.component.html',
  styleUrls: ['./branding.component.scss'],
})
export class BrandingComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  profileImage: string | null = null;   // Data URL preview
  backgroundImage: string | null = null;   // Data URL preview
  isSaving = false;
  isLoading = false;

  constructor(
    private navItemService: NavItemService,
    private orgProfiles: OrganizationProfilesService,
    private auth: AuthService,
    private toastr: ToastrService
  ) {
    this.navItemService.currentRouteName = 'Branding';
  }

  ngOnInit(): void {
    const user = this.auth.getUserProfile();
    const userId = user?.sub;
    if (!userId) return;

    this.isLoading = true;
    this.orgProfiles.getProfile(userId).subscribe({
      next: (p) => {
        console.log(p);
        this.profileImage = ensureDataUrl(p?.profilePhotoUrl ?? null);
        this.backgroundImage = ensureDataUrl(p?.backgroundPhotoUrl ?? null);
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  async onFileSelected(evt: Event, imageType: 'profile' | 'background') {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await this.fileToDataUrl(file);
    
      if (imageType === 'profile') {
        this.profileImage = dataUrl;
      } else if (imageType === 'background') {
        this.backgroundImage = dataUrl;
      }
    } finally {
      input.value = '';
    }
  }

  clearImage(e: Event, type: 'profile' | 'background') {
    e.stopPropagation();
    e.preventDefault();
    if (type === 'profile') {
      this.profileImage = null;
    } else if (type === 'background') {
      this.backgroundImage = null;
    }
  }

  save() {
    const userId = this.auth.getUserProfile()?.sub;
    if (!userId) {
      this.toastr.error('No user id found. Please sign in again', 'Error!');
      return;
    }

    this.isSaving = true;
    this.orgProfiles
      .saveProfile({ userId, profilePhotoUrl: this.profileImage || "", backgroundPhotoUrl: this.backgroundImage || "" })
      .subscribe({
        next: () => {
          this.orgProfiles.setBrandingLogo(this.profileImage!);
          this.orgProfiles.setBackgroundImage(this.backgroundImage!);

          this.toastr.success('Image saved', 'Success!');
          this.isSaving = false;
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Failed to save image', 'Error!');
          this.isSaving = false;
        },
      });
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

/** If backend returns bare base64, wrap it as a data URL; otherwise pass through. */
function ensureDataUrl(s: string | null): string | null {
  if (!s) return null;
  return s.startsWith('data:') ? s : `data:image/jpeg;base64,${s}`;
}
