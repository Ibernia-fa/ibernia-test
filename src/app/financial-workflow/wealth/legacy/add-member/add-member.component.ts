import {
  AfterViewInit,
  Component,
  Inject,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { LegacyHttpService } from '../services/legacy-http.service';
import { FamilyRole, FamilyMemberModel } from '../models/legacy.model';

interface RoleOption {
  value: FamilyRole;
  labelKey: string;
  labelParams?: Record<string, string>;
}

@Component({
  selector: 'app-add-member',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss'
})
export class AddMemberComponent implements AfterViewInit, OnDestroy {
  @ViewChild('roleSelect') roleSelect?: MatSelect;

  form: FormGroup;
  roleOptions: RoleOption[] = [];
  isSaving = false;

  private rolePanelOpenTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private legacyHttp: LegacyHttpService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<AddMemberComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      cashflowId: string;
      hasPartner: boolean;
      existingMembers: FamilyMemberModel[];
      clientFirstName: string;
      partnerFirstName: string;
    }
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      role: [null, Validators.required]
    });

    this.buildRoleOptions();
  }

  ngAfterViewInit(): void {
    // Defer until after the dialog enter animation so the overlay positions correctly
    this.rolePanelOpenTimer = setTimeout(() => {
      this.rolePanelOpenTimer = null;
      this.roleSelect?.open();
    }, 200);
  }

  ngOnDestroy(): void {
    if (this.rolePanelOpenTimer != null) {
      clearTimeout(this.rolePanelOpenTimer);
    }
  }

  private buildRoleOptions(): void {
    const existing = this.data.existingMembers;
    const hasPartnerMember = existing.some(m => m.role === 'Partner');
    const hasClientFather = existing.some(m => m.role === 'ClientFather');
    const hasClientMother = existing.some(m => m.role === 'ClientMother');
    const hasPartnerFather = existing.some(m => m.role === 'PartnerFather');
    const hasPartnerMother = existing.some(m => m.role === 'PartnerMother');

    const hasPartner = this.data.hasPartner || hasPartnerMember;
    const clientName = this.data.clientFirstName ||
      this.translate.instant('LEGACY.PARENTS_NET_WORTH_MODAL_NAME_FALLBACK_CLIENT');
    const partnerName = this.data.partnerFirstName ||
      this.translate.instant('LEGACY.PARENTS_NET_WORTH_MODAL_NAME_FALLBACK_PARTNER');

    const roles: RoleOption[] = [
      { value: FamilyRole.Child, labelKey: 'LEGACY.RELATIONSHIP_CHILD' },
    ];

    if (!hasPartnerMember) {
      roles.push({ value: FamilyRole.Partner, labelKey: 'LEGACY.RELATIONSHIP_PARTNER' });
    }
    if (!hasClientFather) {
      roles.push({
        value: FamilyRole.ClientFather,
        labelKey: 'LEGACY.RELATIONSHIP_FATHER_OF',
        labelParams: { name: clientName },
      });
    }
    if (!hasClientMother) {
      roles.push({
        value: FamilyRole.ClientMother,
        labelKey: 'LEGACY.RELATIONSHIP_MOTHER_OF',
        labelParams: { name: clientName },
      });
    }

    if (hasPartner) {
      if (!hasPartnerFather) {
        roles.push({
          value: FamilyRole.PartnerFather,
          labelKey: 'LEGACY.RELATIONSHIP_FATHER_OF',
          labelParams: { name: partnerName },
        });
      }
      if (!hasPartnerMother) {
        roles.push({
          value: FamilyRole.PartnerMother,
          labelKey: 'LEGACY.RELATIONSHIP_MOTHER_OF',
          labelParams: { name: partnerName },
        });
      }
    }

    roles.push({
      value: FamilyRole.ClientSibling,
      labelKey: 'LEGACY.RELATIONSHIP_SIBLING_OF',
      labelParams: { name: clientName },
    });

    if (hasPartner) {
      roles.push({
        value: FamilyRole.PartnerSibling,
        labelKey: 'LEGACY.RELATIONSHIP_SIBLING_OF',
        labelParams: { name: partnerName },
      });
    }

    this.roleOptions = roles;
  }

  private static readonly PARTNER_ROLES = new Set([
    FamilyRole.PartnerFather,
    FamilyRole.PartnerMother,
    FamilyRole.PartnerSibling,
  ]);

  onSave(): void {
    if (this.form.invalid) return;

    const { name, role } = this.form.value;

    if (!this.data.hasPartner && AddMemberComponent.PARTNER_ROLES.has(role)) {
      this.toastr.error(
        this.translate.instant('LEGACY.PARTNER_ROLE_WITHOUT_PARTNER'),
        this.translate.instant('Error'),
      );
      return;
    }

    this.isSaving = true;

    this.legacyHttp.addFamilyMember(this.data.cashflowId, {
      firstName: name,
      lastName: '',
      role
    }).subscribe({
      next: (dashboard) => {
        this.toastr.success(
          this.translate.instant('LEGACY.MEMBER_ADDED'),
          this.translate.instant('LABEL.SUCCESS'),
        );
        this.dialogRef.close({ dashboard });
      },
      error: (err) => {
        this.toastr.error(
          err?.error?.message || this.translate.instant('LEGACY.MEMBER_ADD_FAILED'),
          this.translate.instant('Error'),
        );
        this.isSaving = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
