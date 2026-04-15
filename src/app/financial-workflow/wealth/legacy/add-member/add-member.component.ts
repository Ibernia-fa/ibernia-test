import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  NativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil, startWith } from 'rxjs';
import { LegacyHttpService } from '../services/legacy-http.service';
import { FamilyRole, FamilyMemberModel } from '../models/legacy.model';
import { getCompletedYearsAgeAtDate } from 'src/app/shared/utils/client-age-at-reference';
import {
  clientDobValidator,
  formatDigitsToDMY,
  normalizeToDMY,
  onlyDigits,
  parseDMYFromDigits,
} from 'src/app/shared/utils/client-dob-helpers';
import { capitalizeFirstLetter } from 'src/app/shared/utils/capitalize-first-letter';

interface RoleOption {
  value: FamilyRole;
  labelKey: string;
  labelParams?: Record<string, string>;
}

export const ADD_MEMBER_DMY_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  }
};

class AddMemberDmyDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      const digits = value.replace(/\D/g, '').slice(0, 8);
      if (digits.length === 8) {
        const day = Number(digits.slice(0, 2));
        const month = Number(digits.slice(2, 4));
        const year = Number(digits.slice(4, 8));
        const date = new Date(year, month - 1, day);
        if (
          date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day
        ) {
          return date;
        }
        return null;
      }
    }

    return super.parse(value);
  }
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
    MatDatepickerModule,
    TranslateModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: AddMemberDmyDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: MAT_DATE_FORMATS, useValue: ADD_MEMBER_DMY_FORMATS },
  ],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss'
})
export class AddMemberComponent implements AfterViewInit, OnDestroy {
  @ViewChild('roleSelect') roleSelect?: MatSelect;
  @ViewChild('partnerDobInput') private partnerDobInput?: ElementRef<HTMLInputElement>;

  form: FormGroup;
  roleOptions: RoleOption[] = [];
  isSaving = false;
  partnerAge: number | null = null;

  private rolePanelOpenTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly destroy$ = new Subject<void>();

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
      name: [''],
      role: [null, Validators.required],
      partner: this.fb.group({
        firstName: [''],
        lastName: [''],
        dob: [''],
        email: [''],
      }),
    });

    this.buildRoleOptions();

    this.form.get('role')!.valueChanges.pipe(
      startWith(this.form.get('role')!.value),
      takeUntil(this.destroy$),
    ).subscribe((role) => this.applyRoleMode(role as FamilyRole | null));
  }

  ngAfterViewInit(): void {
    this.rolePanelOpenTimer = setTimeout(() => {
      this.rolePanelOpenTimer = null;
      this.roleSelect?.open();
    }, 200);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.rolePanelOpenTimer != null) {
      clearTimeout(this.rolePanelOpenTimer);
    }
  }

  get isPartnerRole(): boolean {
    return this.form.get('role')?.value === FamilyRole.Partner;
  }

  get partnerDobError(): string | null {
    const control = (this.form.get('partner') as FormGroup).get('dob');
    const err = control?.errors?.['dob'];
    return typeof err === 'string' ? err : null;
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

  private applyRoleMode(role: FamilyRole | null): void {
    const nameCtrl = this.form.get('name')!;
    const partner = this.form.get('partner') as FormGroup;

    if (role === FamilyRole.Partner) {
      nameCtrl.clearValidators();
      nameCtrl.reset('', { emitEvent: false });
      nameCtrl.updateValueAndValidity({ emitEvent: false });

      partner.get('firstName')!.setValidators([Validators.required]);
      partner.get('lastName')!.setValidators([Validators.required]);
      partner.get('dob')!.setValidators([Validators.required, clientDobValidator]);
      partner.get('email')!.setValidators([Validators.required, Validators.email]);
    } else {
      partner.reset(
        { firstName: '', lastName: '', dob: '', email: '' },
        { emitEvent: false },
      );
      (['firstName', 'lastName', 'dob', 'email'] as const).forEach((k) => {
        partner.get(k)!.clearValidators();
        partner.get(k)!.updateValueAndValidity({ emitEvent: false });
      });
      this.partnerAge = null;

      if (role != null) {
        nameCtrl.setValidators([Validators.required]);
      } else {
        nameCtrl.clearValidators();
      }
      nameCtrl.updateValueAndValidity({ emitEvent: false });
    }

    partner.updateValueAndValidity({ emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  private static readonly PARTNER_ROLES = new Set([
    FamilyRole.PartnerFather,
    FamilyRole.PartnerMother,
    FamilyRole.PartnerSibling,
  ]);

  onPartnerDobTyping(inputEl: HTMLInputElement): void {
    const raw = inputEl.value;
    const cursor = inputEl.selectionStart ?? raw.length;

    const digitsBeforeCursor = raw
      .slice(0, cursor)
      .replace(/\D/g, '')
      .length;

    const digits = onlyDigits(raw);
    const formatted = formatDigitsToDMY(digits);

    if (formatted !== raw) {
      inputEl.value = formatted;

      let newCursor = digitsBeforeCursor;
      if (digitsBeforeCursor > 2) newCursor += 1;
      if (digitsBeforeCursor > 4) newCursor += 1;

      newCursor = Math.min(newCursor, formatted.length);

      requestAnimationFrame(() => {
        if (document.activeElement === inputEl) {
          inputEl.setSelectionRange(newCursor, newCursor);
        }
      });
    }

    const parsed = parseDMYFromDigits(digits);
    this.partnerAge = parsed.ok ? parsed.age : null;
  }

  onPartnerCalendarChange(value: Date | null): void {
    const partnerGroup = this.form.get('partner') as FormGroup;
    if (!value) {
      this.partnerAge = null;
      partnerGroup.get('dob')?.setValue(null, { emitEvent: false });
      return;
    }
    this.partnerAge = getCompletedYearsAgeAtDate(value, new Date());
    partnerGroup.get('dob')?.setValue(value, { emitEvent: false });

    requestAnimationFrame(() => {
      const formatted = normalizeToDMY(value);
      const el = this.partnerDobInput?.nativeElement;
      if (el) {
        el.value = formatted;
      }
    });
  }

  private fixDate(d: Date): Date {
    const newDate = new Date(d);
    newDate.setHours(12, 0, 0, 0);
    return newDate;
  }

  private resolvePartnerDob(): Date | null {
    const partner = this.form.get('partner') as FormGroup;
    const raw = partner.get('dob')?.value;
    if (raw instanceof Date) {
      return raw;
    }
    if (typeof raw === 'string' && raw) {
      const parsed = parseDMYFromDigits(onlyDigits(raw));
      return parsed.ok ? parsed.date : null;
    }
    return null;
  }

  onSave(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const role = this.form.get('role')!.value as FamilyRole;

    if (!this.data.hasPartner && AddMemberComponent.PARTNER_ROLES.has(role)) {
      this.toastr.error(
        this.translate.instant('LEGACY.PARTNER_ROLE_WITHOUT_PARTNER'),
        this.translate.instant('Error'),
      );
      return;
    }

    this.isSaving = true;

    if (role === FamilyRole.Partner) {
      const pg = this.form.get('partner') as FormGroup;
      const dob = this.resolvePartnerDob();
      if (!dob) {
        pg.get('dob')?.setErrors({ required: true });
        pg.get('dob')?.markAsTouched();
        this.isSaving = false;
        return;
      }

      this.legacyHttp.addFamilyMember(this.data.cashflowId, {
        firstName: capitalizeFirstLetter((pg.get('firstName')!.value ?? '').trim()),
        lastName: capitalizeFirstLetter((pg.get('lastName')!.value ?? '').trim()),
        birthDate: this.fixDate(dob),
        email: (pg.get('email')!.value ?? '').trim(),
        role,
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
      return;
    }

    const name = capitalizeFirstLetter((this.form.get('name')!.value ?? '').trim());

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
