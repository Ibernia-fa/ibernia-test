import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { OrganizationProfilesService } from '../services/organization.profiles.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-branding',
  standalone: false,
  templateUrl: './branding.component.html',
  styleUrls: ['./branding.component.scss'],
})
export class BrandingComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  profileImage: string | null = null;   // Data URL preview
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
        this.profileImage = ensureDataUrl(p?.profilePhotoUrl ?? null);
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  async onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      this.profileImage = await this.fileToDataUrl(file);
    } finally {
      input.value = '';
    }
  }

  clearImage(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    this.profileImage = null;
  }

  save() {
    if (!this.profileImage) {
      this.toastr.error('Please select a logo first.', 'Error!');
      return;
    }
    const userId = this.auth.getUserProfile()?.sub;
    if (!userId) {
      this.toastr.error('No user id found. Please sign in again.', 'Error!');
      return;
    }

    this.isSaving = true;
    this.orgProfiles
      .saveProfile({ userId, profilePhotoUrl: this.profileImage })
      .subscribe({
        next: () => {
          this.toastr.success('Logo saved.', 'Success!');
          this.isSaving = false;

          this.orgProfiles.setBrandingLogo(this.profileImage!);
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Failed to save logo.', 'Error!');
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
