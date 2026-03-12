import { Component, OnInit } from '@angular/core';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { OrganizationProfilesService } from '../services/organization.profiles.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIf } from '@angular/common';
import { ImageCropDialogComponent } from '../account-preferences/image-crop-dialog/image-crop-dialog.component';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [TranslateModule, MatCard, MatCardContent, NgIf, MatIconModule, MatTooltipModule],
  templateUrl: './branding.component.html',
  styleUrls: ['./branding.component.scss'],
})
export class BrandingComponent implements OnInit {
  profileImage: string | null = null;   // Data URL preview
  backgroundImage: string | null = null;   // Data URL preview
  private initialProfileImage: string | null = null;
  private initialBackgroundImage: string | null = null;
  hasChanges = false;
  isSaving = false;
  isLoading = false;

  constructor(
    private navItemService: NavItemService,
    private orgProfiles: OrganizationProfilesService,
    private auth: AuthService,
    private toastr: ToastrService,
    private dialog: MatDialog
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
        this.initialProfileImage = this.profileImage;
        this.initialBackgroundImage = this.backgroundImage;
        this.hasChanges = false;
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
        this.openCropDialog(dataUrl);
      } else {
        const ok = await this.validateBackgroundMinSize(dataUrl);
        if (ok) {
          this.backgroundImage = dataUrl;
          this.updateHasChanges();
        }
      }
    } finally {
      input.value = '';
    }
  }

  private readonly BACKGROUND_MIN_WIDTH = 1280;
  private readonly BACKGROUND_MIN_HEIGHT = 720;

  private validateBackgroundMinSize(dataUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ok = img.width >= this.BACKGROUND_MIN_WIDTH && img.height >= this.BACKGROUND_MIN_HEIGHT;
        if (!ok) {
          this.toastr.error(
            `Background image must be at least ${this.BACKGROUND_MIN_WIDTH}×${this.BACKGROUND_MIN_HEIGHT}px. Your image is ${img.width}×${img.height}px.`,
            'Image too small'
          );
        }
        resolve(ok);
      };
      img.onerror = () => resolve(false);
      img.src = dataUrl;
    });
  }

  openCropDialog(imageBase64: string): void {
    const dialogRef = this.dialog.open(ImageCropDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        imageBase64,
        cropType: 'company' as const,
        title: 'Crop company logo',
      },
    });

    dialogRef.afterClosed().subscribe((result: string | null) => {
      if (result) {
        this.profileImage = result;
        this.updateHasChanges();
      }
    });
  }

  cropImage(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.profileImage) return;
    this.openCropDialog(this.profileImage);
  }

  clearImage(e: Event, type: 'profile' | 'background') {
    e.stopPropagation();
    e.preventDefault();
    if (type === 'profile') {
      this.profileImage = null;
    } else if (type === 'background') {
      this.backgroundImage = null;
    }
    this.updateHasChanges();
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
          this.orgProfiles.setBrandingLogo(this.profileImage || null);
          this.orgProfiles.setBackgroundImage(this.backgroundImage || null);

          this.toastr.success('Image saved', 'Success!');
          this.initialProfileImage = this.profileImage;
          this.initialBackgroundImage = this.backgroundImage;
          this.hasChanges = false;
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

  private updateHasChanges() {
    this.hasChanges =
      this.profileImage !== this.initialProfileImage ||
      this.backgroundImage !== this.initialBackgroundImage;
  }
}

/** If backend returns bare base64, wrap it as a data URL; otherwise pass through. */
function ensureDataUrl(s: string | null): string | null {
  if (!s) return null;
  return s.startsWith('data:') ? s : `data:image/jpeg;base64,${s}`;
}
