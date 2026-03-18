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
import { FamilyRole, FamilyMemberModel, FAMILY_ROLE_LABELS } from '../models/legacy.model';

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
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      role: [null, Validators.required]
    });

    this.buildRoleOptions();
  }

  private buildRoleOptions(): void {
    const existing = this.data.existingMembers;
    const hasClientFather = existing.some(m => m.role === 'ClientFather');
    const hasClientMother = existing.some(m => m.role === 'ClientMother');
    const hasPartnerFather = existing.some(m => m.role === 'PartnerFather');
    const hasPartnerMother = existing.some(m => m.role === 'PartnerMother');

    const roles: RoleOption[] = [
      { value: FamilyRole.ClientFather, label: "Client's Father", disabled: hasClientFather },
      { value: FamilyRole.ClientMother, label: "Client's Mother", disabled: hasClientMother },
    ];

    if (this.data.hasPartner) {
      roles.push(
        { value: FamilyRole.PartnerFather, label: "Partner's Father", disabled: hasPartnerFather },
        { value: FamilyRole.PartnerMother, label: "Partner's Mother", disabled: hasPartnerMother },
      );
    }

    roles.push(
      { value: FamilyRole.ClientSibling, label: "Client's Sibling", disabled: false },
    );

    if (this.data.hasPartner) {
      roles.push(
        { value: FamilyRole.PartnerSibling, label: "Partner's Sibling", disabled: false },
      );
    }

    roles.push(
      { value: FamilyRole.Child, label: 'Child', disabled: false },
    );

    this.roleOptions = roles;
  }

  onSave(): void {
    if (this.form.invalid) return;

    this.isSaving = true;
    const { firstName, lastName, role } = this.form.value;

    this.legacyHttp.addFamilyMember(this.data.cashflowId, { firstName, lastName, role }).subscribe({
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
