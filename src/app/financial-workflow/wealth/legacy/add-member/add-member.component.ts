import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { LegacyHttpService } from '../services/legacy-http.service';
import { FamilyRole, FamilyMemberModel } from '../models/legacy.model';

interface RoleOption {
  value: FamilyRole;
  label: string;
  disabled: boolean;
}

@Component({
  selector: 'app-add-member',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule
  ],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss'
})
export class AddMemberComponent {
  form: FormGroup;
  roleOptions: RoleOption[] = [];
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private legacyHttp: LegacyHttpService,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<AddMemberComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      cashflowId: string;
      hasPartner: boolean;
      existingMembers: FamilyMemberModel[];
    }
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      role: [null, Validators.required]
    });

    this.buildRoleOptions();
  }

  private buildRoleOptions(): void {
    const existing = this.data.existingMembers;
    const hasPartnerMember = existing.some(m => m.role === 'Partner');
    const hasClientFather = existing.some(m => m.role === 'ClientFather');
    const hasClientMother = existing.some(m => m.role === 'ClientMother');
    const hasPartnerFather = existing.some(m => m.role === 'PartnerFather');
    const hasPartnerMother = existing.some(m => m.role === 'PartnerMother');

    const hasPartner = this.data.hasPartner || hasPartnerMember;

    const roles: RoleOption[] = [
      { value: FamilyRole.Child, label: 'Child', disabled: false },
      { value: FamilyRole.Partner, label: 'Partner', disabled: hasPartner },
      { value: FamilyRole.ClientFather, label: 'Father', disabled: hasClientFather },
      { value: FamilyRole.ClientMother, label: 'Mother', disabled: hasClientMother },
    ];

    if (hasPartner) {
      roles.push(
        { value: FamilyRole.PartnerFather, label: "Partner's father", disabled: hasPartnerFather },
        { value: FamilyRole.PartnerMother, label: "Partner's mother", disabled: hasPartnerMother },
      );
    }

    roles.push(
      { value: FamilyRole.ClientSibling, label: 'Sibling', disabled: false },
    );

    if (hasPartner) {
      roles.push(
        { value: FamilyRole.PartnerSibling, label: "Partner's sibling", disabled: false },
      );
    }

    roles.push(
      { value: FamilyRole.Other, label: 'Other', disabled: false },
    );

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
      this.toastr.error('Cannot add a partner-related member when no partner exists', 'Error');
      return;
    }

    this.isSaving = true;

    this.legacyHttp.addFamilyMember(this.data.cashflowId, {
      firstName: name,
      lastName: '',
      role
    }).subscribe({
      next: (dashboard) => {
        this.toastr.success('Member added', 'Success');
        this.dialogRef.close({ dashboard });
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Failed to add member', 'Error');
        this.isSaving = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
