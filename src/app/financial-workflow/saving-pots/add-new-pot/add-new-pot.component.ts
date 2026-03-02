import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { allCountries } from 'src/app/clients/models/country';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {
  Cycle,
  EscalationRate,
} from '../../timeline/models/financial-timeline';
import moment from 'moment';
import { SavingsPotsHttpService } from '../services/savings-pots-http.service';
import {
  ClientSaving,
  ComissionType,
  SavingPotOwnership,
  SavingPotType,
} from '../models/saving-pots.model';
import { catchError, filter } from 'rxjs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-add-new-pot',
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatSliderModule,
    TablerIconsModule,
    MatCheckboxModule,
    ThousandSeparatorPipe,
    ThousandSeparatorInputDirective,
    TranslateModule,
  ],
  templateUrl: './add-new-pot.component.html',
  styleUrl: './add-new-pot.component.scss',
})
export class AddNewPotComponent {
  @ViewChild('amountInput') amountInput?: ElementRef<HTMLInputElement>;
  @ViewChild('renameInputRef') renameInputRef?: ElementRef<HTMLInputElement>;
  savingsForm: FormGroup;
  years: number[] = [];
  countries = allCountries;
  clientPreferredCurrency: string;
  clientBirthYear: number;
  clientAge: number;
  retirementAge: number = 65;  // The year when retiring
  retirementAgeValue: number = 65;  // The age at retirement
  cycles: Cycle[];
  escalationRates: EscalationRate[];
  eventsList: any;
  cashflowId: string;
  formattedReturnRate: string = '';
  formattedCommissionPercentage: string = '';
  selectedName: string = '';
  selectedNameIconUrl: string = '';
  inflationRate = 0;
  isEditWorkflow = false;
  selectedPot: ClientSaving;
  savingPotType= SavingPotType
  selectedEscalationDescription: string | null = null;
  editDialogTitle: string = '';
  isRenamingEntry: boolean = false;
  renamedCustomName: string = '';
  existingSavingPots: any[] = [];
  showNameEdit: boolean = false;
  hasPartner: boolean = false;
  clientFirstName: string = '';
  partnerFirstName: string = '';
  SavingPotOwnership = SavingPotOwnership;
  savingPotValues = [
    {
      name: 'Cash',
      iconUrl: 'cashflow-moneys-icon',
      type: SavingPotType.Cash,
    },
    {
      name: 'Investment',
      iconUrl: 'cashflow-investment-icon',
      type: SavingPotType.Investment,
    },
    {
      name: 'Pension fund',
      iconUrl: 'cashflow-pension-icon',
      type: SavingPotType.PensionFund,
    },
  ];
  forecastEndDateYear: any;
  forecastStartDateYear: any;
  isCashPotEditMode: boolean;
  userReturnRate: any = 3.5;
  loggedInUserPreferences: any;
  comissionTypes = [
    { label: 'Amount', value: ComissionType.Amount },
    { label: 'Percentage', value: ComissionType.Percentage },
    { label: 'Both', value: ComissionType.Both },
  ];
  loggedInUserComissionType: string | undefined;
  isAddComissionChecked: any;
  currentYear: number = new Date().getFullYear();
  amount: number | null;
  private readonly allOwnershipOptions: SavingPotOwnership[] = [
    SavingPotOwnership.Joint,
    SavingPotOwnership.Person1,
    SavingPotOwnership.Person2
  ];

  constructor(
    private dialogRef: MatDialogRef<AddNewPotComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private savingPotsHttpService: SavingsPotsHttpService,
    private translate: TranslateService
  ) {
    this.loggedInUserPreferences = data.loggedInUserPreferences;
    const infl = Number(data.inflationRate);
    this.inflationRate = Number.isFinite(infl) ? infl : 0;
    this.cycles = data.amountCycles;
    this.escalationRates = data.escalataionRates;
    this.eventsList = data.eventsList;
    this.existingSavingPots = data.existingSavingPots || [];  // Get existing pots for smart defaults
    this.hasPartner = data.hasPartner ?? false;
    this.clientFirstName = data.clientFirstName ?? '';
    this.partnerFirstName = data.partnerFirstName ?? '';
    this.clientBirthYear = moment(data.clientBirthDate).year();
    this.userReturnRate = data.returnRate;
    const birthDate = new Date(data.clientBirthDate);
    const forecastStart = new Date(data.forecastStartDateYear, 0, 1);
    let age = forecastStart.getFullYear() - birthDate.getFullYear();
    const monthDiff = forecastStart.getMonth() - birthDate.getMonth();
    const dayDiff = forecastStart.getDate() - birthDate.getDate();
    this.loggedInUserComissionType = this.comissionTypes.find(x => x.value == this.loggedInUserPreferences?.comissionType)?.label.toLowerCase();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    this.clientAge = age
    if(data.forecastStartDateYear - this.clientBirthYear > this.clientAge) this.clientBirthYear =  this.clientBirthYear+1

    // Extract retirement age from events if available
    const retirementEvent = this.eventsList?.find((e: any) => 
      e.name?.toLowerCase().includes('retirement') || 
      e.name?.toLowerCase().includes('pensione')
    );
    if (retirementEvent) {
      this.retirementAgeValue = retirementEvent.start.age;  // Store the age (e.g., 64)
      this.retirementAge = retirementEvent.start.age + this.clientBirthYear;  // Store the year
    }

    this.clientPreferredCurrency = data.clientPreferredCurrency;
    this.cashflowId = data.cashflowId;
    this.isEditWorkflow = data.isEditWorkflow;
    this.selectedPot = data.event
    this.forecastStartDateYear = data.forecastStartDateYear;
    this.forecastEndDateYear = data.forecastEndDateYear;

    // Determine if this is a Cash pot edit mode EARLY (before form creation)
    if (this.isEditWorkflow) {
      this.isCashPotEditMode = (this.selectedPot?.name ?? '').trim().toLowerCase() === 'cash';
    }

    // Set edit dialog title if in edit mode
    if (this.isEditWorkflow && this.selectedPot) {
      this.editDialogTitle = `Edit ${this.selectedPot.name}`;
    }

    const endYear = data.forecastEndDateYear + 1;
    const iterations = endYear - data.forecastStartDateYear + 1;

    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    // Determine default type based on smart logic (Cases 1-4)
    let defaultType = 'Investment';  // Default fallback
    if (!this.isEditWorkflow) {
      defaultType = this.getSmartDefaultType();
    } else {
      // In edit mode, use the current pot's type
      defaultType = this.selectedPot?.name || 'Investment';
    }

    this.savingsForm = this.fb.group({
      name: [defaultType, Validators.required],
      currency: [this.clientPreferredCurrency, Validators.required],
      amount: [0, [Validators.required, this.minPositiveValue()]],
      customName: [''],  // For Custom pots
      returnRate: [this.userReturnRate],
      // lockPot: [true],
      lockPot: [defaultType === 'Pension fund'],  // Auto-check for Pension fund only
      start: [data.forecastStartDateYear, Validators.required],
      end: [data.forecastEndDateYear-1, Validators.required],
      // Commissions always start unchecked - user must manually enable
      commissions: [false],
      commissionType: [this.loggedInUserComissionType || 'amount'],
      commissionCurrency: [this.clientPreferredCurrency],
      commissionAmount: [this.loggedInUserPreferences?.comissionAmount || 0],
      commissionCycle: [this.loggedInUserPreferences?.comissionCycle || this.cycles[2]?.id],
      commissionPercentageCurrency: [this.clientPreferredCurrency],
      commissionPercentageCycle: [this.loggedInUserPreferences?.comissionPercentageCycle || this.cycles[2]?.id],
      commissionPercentage: [this.loggedInUserPreferences?.comissionPercentage || 0],
      escalationRate: [''],
      customEscalationRate: [''],
      // Pension fund specific fields
      contributionAmount: [0],
      contributionFrequency: [1],  // Monthly (1) by default
      contributionStartDate: [data.forecastStartDateYear],  // This year
      contributionEndDate: [this.retirementAge],  // Retirement year
      ownership: [SavingPotOwnership.Joint]
    });

  this.savingsForm.setValidators(this.endOnOrAfterStartValidator());

    this.savingsForm.get('currency')?.disable();
    this.savingsForm.get('commissionCurrency')?.disable();


    this.savingsForm.get('returnRate')?.valueChanges.subscribe((value) => {
      this.formattedReturnRate = this.formatWithPercentage(value);
    });

    // Keep the local amount property in sync with the form control
    const amountControl = this.savingsForm.get('amount');
    this.amount = (amountControl?.value ?? null) as number | null;
    amountControl?.valueChanges.subscribe((value) => {
      this.amount = (value ?? null) as number | null;
    });
    
    // Set up initial validators for Pension fund fields if default type is Pension fund
    this.updatePensionFundValidators(defaultType);
    
    if(this.isEditWorkflow) {
      this.patchFormValues();
      if (this.isCashPotEditMode) {
        // Freeze the Type as Cash and don’t emit changes
        this.savingsForm.get('name')?.setValue('Cash', { emitEvent: false });
        this.savingsForm.get('name')?.disable({ emitEvent: false });
        this.selectedNameIconUrl = 'cashflow-moneys-icon';
      }
    }

    this.syncOwnershipForSelectedType();
  }


  // Custom validator to ensure value is 0 or greater
  minPositiveValue(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = control.value;
      if (value === null || value === '' || value === undefined) {
        return null; // Let Validators.required handle empty values
      }
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      
      // Allow 0 or positive for all saving pots
      return numValue >= 0 ? null : { minPositiveValue: { value: control.value } };
    };
  }

  onAmountFocus(e: Event) {
  // show raw (no commas) while typing
  const c = this.savingsForm.get('amount')!;
  (e.target as HTMLInputElement).value = (c.value ?? '').toString();
}

onAmountBlur(e: Event) {
  const c = this.savingsForm.get('amount')!;
  const rawValue = (e.target as HTMLInputElement).value;
  const num = parseFormattedNumber(rawValue);
  c.setValue(num, { emitEvent: false }); // model stays numeric

  const locale = this.translate.currentLang === 'it' ? 'it-IT' : 'en-US';
  (e.target as HTMLInputElement).value = num.toLocaleString(locale);
}


  patchFormValues() {
    this.isAddComissionChecked = this.selectedPot?.hasCommission;
    var savingPotValue = this.savingPotValues.find(x => x.name === this.selectedPot.name);
        if(savingPotValue) {
      this.savingsForm.get('name')?.patchValue(savingPotValue.name)
    }
    else {
      this.savingsForm.get('name')?.patchValue('Custom');
      this.onNameValueChange('Custom');
      this.savingsForm.get('customName')?.patchValue(this.selectedPot.name);
    }
    // --- Type (name) ---
    if (this.isCashPotEditMode) {
      // Keep it Cash, do not touch customName control
      const savingPotValue = this.savingPotValues.find(x => x.name === this.selectedPot.name);
      if (savingPotValue) {
        this.savingsForm.get('name')?.patchValue(savingPotValue.name, { emitEvent: false });
      } else {
        this.savingsForm.get('name')?.patchValue('Custom', { emitEvent: false });
        this.onNameValueChange('Custom'); // will add customName control
        this.savingsForm.get('customName')?.patchValue(this.selectedPot.name, { emitEvent: false });
      }
    }

    // --- The rest of fields (unchanged behavior) ---
    this.savingsForm.get('currency')?.patchValue(this.selectedPot.startingPotValue.currencySymbol, { emitEvent: false });
    this.savingsForm.get('amount')?.patchValue(this.selectedPot.startingPotValue.amount, { emitEvent: false });
    this.savingsForm.get('amount')?.updateValueAndValidity(); // Force re-validation after patching
    this.amount = (this.savingsForm.get('amount')?.value ?? null) as number | null;
    // Ensure thousandSeparatorInput formats the patched value (it formats on blur)
    setTimeout(() => {
      const el = this.amountInput?.nativeElement;
      if (!el || this.amount === null || this.amount === undefined) return;
      el.value = this.amount.toLocaleString('en-US');
      el.dispatchEvent(new Event('blur'));
    });
    // this.savingsForm.get('returnRate')?.patchValue(this.selectedPot.returnRate, { emitEvent: false });
    this.savingsForm.get('returnRate')?.patchValue(
      this.round2(this.selectedPot.returnRate),
      { emitEvent: false }
    );
    this.savingsForm.get('lockPot')?.patchValue(this.selectedPot.hasPotLocked, { emitEvent: false });
    this.savingsForm.get('start')?.patchValue(this.selectedPot.lockedFrom?.year ?? this.forecastStartDateYear, { emitEvent: false });
    this.savingsForm.get('end')?.patchValue(this.selectedPot.lockedTill?.year ?? (this.forecastEndDateYear - 1), { emitEvent: false });
    
    // Patch Pension fund specific fields if applicable
    if (this.selectedPot.name === 'Pension fund') {
      this.savingsForm.get('contributionAmount')?.patchValue(this.selectedPot.contributionAmount, { emitEvent: false });
      this.savingsForm.get('contributionFrequency')?.patchValue(this.selectedPot.contributionFrequency, { emitEvent: false });
      this.savingsForm.get('contributionStartDate')?.patchValue(this.selectedPot.contributionStartDate?.year, { emitEvent: false });
      this.savingsForm.get('contributionEndDate')?.patchValue(this.selectedPot.contributionEndDate?.year, { emitEvent: false });
    }
    
    this.savingsForm.get('ownership')?.patchValue(this.selectedPot.ownership ?? SavingPotOwnership.Joint, { emitEvent: false });
    this.savingsForm.get('commissions')?.patchValue(this.selectedPot.hasCommission, { emitEvent: false });

    let selectedComissionType = 'amount';
    if (this.selectedPot.comission.type === ComissionType.Percentage) selectedComissionType = 'percentage';
    if (this.selectedPot.comission.type === ComissionType.Both) selectedComissionType = 'both';
    this.savingsForm.get('commissionType')?.patchValue(selectedComissionType, { emitEvent: false });

    if (this.selectedPot.comission.type === ComissionType.Amount || this.selectedPot.comission.type === ComissionType.Both) {
      this.savingsForm.get('commissionCurrency')?.patchValue(this.selectedPot.comission.amount.currencySymbol, { emitEvent: false });
      this.savingsForm.get('commissionAmount')?.patchValue(this.selectedPot.comission.amount.amount, { emitEvent: false });
      this.savingsForm.get('commissionCycle')?.patchValue(this.selectedPot.comission.amount.cycle?.id, { emitEvent: false });
    }
    if (this.selectedPot.comission.type === ComissionType.Percentage || this.selectedPot.comission.type === ComissionType.Both) {
      this.savingsForm.get('commissionPercentageCurrency')?.patchValue(this.selectedPot.comission.percentage?.currencySymbol, { emitEvent: false });
      this.savingsForm.get('commissionPercentageCycle')?.patchValue(this.selectedPot.comission.percentage?.cycle?.id, { emitEvent: false });
      this.savingsForm.get('commissionPercentage')?.patchValue(this.selectedPot.comission.percentage?.amount, { emitEvent: false });
    }

    const matchedEscalation =
      this.escalationRates.find(
        x =>
          x.value === this.selectedPot.comission.escalationRate?.value &&
          x.description === this.selectedPot.comission.escalationRate?.description
      ) ??
      this.escalationRates.find(
        x => x.value === this.selectedPot.comission.escalationRate?.value
      );

    if (matchedEscalation) {
      this.savingsForm.get('escalationRate')?.patchValue(matchedEscalation.value, { emitEvent: false });
      this.selectedEscalationDescription = matchedEscalation.description;
    } else if (
      this.selectedPot.comission.escalationRate &&
      this.selectedPot.comission.escalationRate.description === 'Increases at custom rate'
    ) {
      this.escalationRates = this.escalationRates.filter(x => x.description !== 'Increases at custom rate');
      this.escalationRates.push({
        description: 'Increases at custom rate',
        value: this.selectedPot?.comission?.escalationRate?.value,
      });
      this.savingsForm.get('escalationRate')?.patchValue(this.selectedPot.comission.escalationRate.value, { emitEvent: false });
      this.savingsForm.get('customEscalationRate')?.patchValue(this.selectedPot.comission.escalationRate.value, { emitEvent: false });
      this.selectedEscalationDescription = 'Increases at custom rate';

      const customControl = this.savingsForm.get('customEscalationRate');
      customControl?.setValidators([Validators.required, Validators.min(0)]);
      customControl?.updateValueAndValidity({ emitEvent: false });
    }

    // Force form to recalculate validity after all patches are applied
    this.savingsForm.updateValueAndValidity();
  }

  ngOnInit() {
    this.updateFormattedValue('returnRate');
  }

  /**
   * Implements smart default pot type selection based on existing pots
   * Case 1: Existing pot: Cash → New pot default: Investment
   * Case 2: Existing pot: Cash, Investment → New pot default: Pension fund
   * Case 3: Existing pot: Cash, Pension fund → New pot default: Investment
   * Case 4: Existing pot: Cash, Investment, Pension fund or more → New pot default: Custom
   */
  getSmartDefaultType(): string {
    if (!this.existingSavingPots || this.existingSavingPots.length === 0) {
      return 'Investment';  // Default if no existing pots
    }

    // Get unique pot types from existing pots
    const existingTypes = new Set(
      this.existingSavingPots.map((pot: any) => pot.name)
    );

    const hasCash = existingTypes.has('Cash');
    const hasInvestment = existingTypes.has('Investment');
    const hasPension = existingTypes.has('Pension fund');

    // Case 4: Multiple types already exist
    if (existingTypes.size >= 3) {
      return 'Custom';
    }

    // Case 1: Only Cash exists
    if (existingTypes.size === 1 && hasCash) {
      return 'Investment';
    }

    // Case 2: Cash and Investment exist
    if (existingTypes.size === 2 && hasCash && hasInvestment) {
      return 'Pension fund';
    }

    // Case 3: Cash and Pension fund exist
    if (existingTypes.size === 2 && hasCash && hasPension) {
      return 'Investment';
    }

    // Default fallback
    return 'Investment';
  }
  
  closeDialog(): void {
    this.dialogRef.close();
  }

  get displayPotName(): string {
    if (!this.savingsForm) return '';
    const name = (this.savingsForm.get('name')?.value ?? '').toString();

    if (name === 'Custom') {
      const customName = (this.savingsForm.get('customName')?.value ?? '').toString().trim();
      return customName || this.selectedPot?.name || 'Custom';
    }

    return name || this.selectedPot?.name || '';
  }

  get canEditName(): boolean {
    return this.isEditWorkflow && this.savingsForm?.get('name')?.value === 'Custom';
  }

  toggleNameEdit(): void {
    this.showNameEdit = !this.showNameEdit;
  }

  /** Number of existing pots with name "Cash". */
  get cashPotCount(): number {
    return (this.existingSavingPots || []).filter(
      (p: { name?: string }) => (p?.name ?? '').trim().toLowerCase() === 'cash'
    ).length;
  }

  /** Allowed to add a Cash pot: no partner => at most 1; has partner => up to 3. */
  get canAddCashPot(): boolean {
    return this.availableCashOwnerships.length > 0;
  }

  get isCashTypeSelected(): boolean {
    return (this.savingsForm?.get('name')?.value ?? '').toString().trim().toLowerCase() === 'cash';
  }

  get showCashOwnershipFilter(): boolean {
    return this.hasPartner && this.isCashTypeSelected;
  }

  get availableCashOwnerships(): SavingPotOwnership[] {
    const baseOptions = this.hasPartner
      ? this.allOwnershipOptions
      : [SavingPotOwnership.Person1];

    const used = this.getUsedCashOwnerships();
    return baseOptions.filter((ownership) => !used.has(ownership));
  }

  isOwnershipAvailableForCash(ownership: SavingPotOwnership): boolean {
    return this.availableCashOwnerships.includes(ownership);
  }

  private getUsedCashOwnerships(): Set<SavingPotOwnership> {
    const isEditingCash = this.isEditWorkflow && this.isCashPotEditMode;
    const currentId = isEditingCash ? this.selectedPot?.id : null;
    const used = new Set<SavingPotOwnership>();

    (this.existingSavingPots || []).forEach((pot: any) => {
      const isCash = (pot?.name ?? '').toString().trim().toLowerCase() === 'cash';
      if (!isCash) return;
      if (currentId && pot?.id === currentId) return;

      used.add((pot?.ownership ?? SavingPotOwnership.Joint) as SavingPotOwnership);
    });

    return used;
  }

  private syncOwnershipForSelectedType(): void {
    const ownershipControl = this.savingsForm.get('ownership');
    if (!ownershipControl) return;

    if (!this.isCashTypeSelected) {
      // For non-cash pots keep current behavior/default.
      return;
    }

    const current = ownershipControl.value as SavingPotOwnership;
    if (this.isOwnershipAvailableForCash(current)) {
      ownershipControl.setErrors(null);
      return;
    }

    const fallback = this.availableCashOwnerships[0];
    if (fallback != null) {
      ownershipControl.patchValue(fallback, { emitEvent: false });
      ownershipControl.setErrors(null);
    } else {
      ownershipControl.setErrors({ duplicateCashOwnership: true });
    }
  }

  onNameValueChange(name: any) {
    this.selectedName = name;
    this.renamedCustomName = '';  // Reset renamed value when type changes
    this.isRenamingEntry = false;  // Reset rename mode
    
    if (name === 'Custom') {
      this.savingsForm.addControl(
        'customName',
        new FormControl('', [Validators.required])
      );
      this.savingsForm.updateValueAndValidity();
      this.selectedNameIconUrl = 'custom-option-icon'
    } else {
      this.savingsForm.removeControl('customName');
      this.savingsForm.updateValueAndValidity();

      const cusEvent = this.savingPotValues.find(
        (customEvent) => customEvent.name === name
      );
      this.selectedNameIconUrl = cusEvent?.iconUrl ?? '';
    }
    
    // Auto-tick lockPot for Pension fund, untick for other types
    if (name === 'Pension fund') {
      this.savingsForm.get('lockPot')?.setValue(true);
    } else {
      this.savingsForm.get('lockPot')?.setValue(false);
    }

    // Update Pension fund field validators based on type
    this.updatePensionFundValidators(name);
    this.syncOwnershipForSelectedType();
  }
  
  // Update validators for Pension fund specific fields
  private updatePensionFundValidators(potType: string): void {
    const contributionAmountControl = this.savingsForm.get('contributionAmount');
    const contributionStartControl = this.savingsForm.get('contributionStartDate');
    const contributionEndControl = this.savingsForm.get('contributionEndDate');
    const commissionsControl = this.savingsForm.get('commissions');
    
    if (potType === 'Pension fund') {
      // Make Pension fund fields required
      contributionAmountControl?.setValidators([Validators.required, this.minPositiveValue()]);
      contributionStartControl?.setValidators([Validators.required]);
      contributionEndControl?.setValidators([Validators.required]);
      
      // Do NOT auto-check commissions - user must manually enable it
    } else {
      // Clear validators for non-Pension fund types
      contributionAmountControl?.setValidators([]);
      contributionStartControl?.setValidators([]);
      contributionEndControl?.setValidators([]);
    }
    
    contributionAmountControl?.updateValueAndValidity();
    contributionStartControl?.updateValueAndValidity();
    contributionEndControl?.updateValueAndValidity();
  }

  toggleRenameEntry(): void {
    this.isRenamingEntry = !this.isRenamingEntry;
    if (this.isRenamingEntry) {
      // Initialize with current custom name
      this.renamedCustomName = this.savingsForm.get('customName')?.value || '';
      // Auto-focus and select text for rename input
      setTimeout(() => {
        if (this.renameInputRef) {
          this.renameInputRef.nativeElement.focus();
          this.renameInputRef.nativeElement.select();
        }
      }, 0);
    }
  }

  saveRenamedEntry(): void {
    const currentValue = this.savingsForm.get('customName')?.value?.trim();
    if (currentValue) {
      this.renamedCustomName = currentValue;
      this.isRenamingEntry = false;
      // Update the dialog title if it's in edit mode
      if (this.isEditWorkflow) {
        this.editDialogTitle = `Edit ${currentValue}`;
      }
    }
  }

  isLockPotChanged(event: any) {
    if (event) {
      this.savingsForm.get('start')?.setValidators(Validators.required);
      this.savingsForm.get('start')?.updateValueAndValidity();
      this.savingsForm.get('end')?.setValidators(Validators.required);
      this.savingsForm.get('end')?.updateValueAndValidity();

      this.savingsForm.get('end')?.patchValue(this.eventsList[0].start.year > 0 ? this.eventsList[0].start.year : this.forecastStartDateYear)
    } else {
      this.savingsForm.get('start')?.removeValidators(Validators.required);
      this.savingsForm.get('start')?.updateValueAndValidity();
      this.savingsForm.get('end')?.removeValidators(Validators.required);
      this.savingsForm.get('end')?.updateValueAndValidity();

      this.savingsForm.get('end')?.patchValue(this.forecastEndDateYear)
    }
  }

  isCommissionsChanged(event: any) {
    this.isAddComissionChecked = event;
    this.savingsForm
    .get('commissionType')
    ?.setValue(this.loggedInUserComissionType || 'amount');

    if (event) {
      this.savingsForm
        .get('commissionCurrency')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionAmount')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionType')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCycle')
        ?.setValidators(Validators.required);
        this.savingsForm
        .get('commissionCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('escalationRate')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('escalationRate')
        ?.setValue(this.escalationRates[1].value);

      // Populate commission values from Default Preferences
      if (this.loggedInUserPreferences?.comissionAmount) {
        this.savingsForm.get('commissionAmount')?.setValue(this.loggedInUserPreferences.comissionAmount);
      }
      if (this.loggedInUserPreferences?.comissionPercentage) {
        this.savingsForm.get('commissionPercentage')?.setValue(this.loggedInUserPreferences.comissionPercentage);
      }
      if (this.loggedInUserPreferences?.comissionCycle) {
        this.savingsForm.get('commissionCycle')?.setValue(this.loggedInUserPreferences.comissionCycle);
      }
      if (this.loggedInUserPreferences?.comissionPercentageCycle) {
        this.savingsForm.get('commissionPercentageCycle')?.setValue(this.loggedInUserPreferences.comissionPercentageCycle);
      }

      this.savingsForm.get('commissionCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionAmount')?.updateValueAndValidity();
      this.savingsForm.get('commissionType')?.updateValueAndValidity();
      this.savingsForm.get('commissionCycle')?.updateValueAndValidity();
      this.savingsForm.get('escalationRate')?.updateValueAndValidity();
    } else {
      this.savingsForm
        .get('commissionCurrency')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionAmount')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionType')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionCycle')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('escalationRate')
        ?.removeValidators(Validators.required);

      this.savingsForm.get('commissionCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionAmount')?.updateValueAndValidity();
      this.savingsForm.get('commissionType')?.updateValueAndValidity();
      this.savingsForm.get('commissionCycle')?.updateValueAndValidity();
      this.savingsForm.get('escalationRate')?.updateValueAndValidity();
    }
  }

  // onSliderChange(value: any) {
  //   if (!isNaN(value)) {
  //     this.savingsForm.get('returnRate')?.setValue(value, { emitEvent: true });
  //   }
  // }

get isCustomEscalationSelected(): boolean {
  const selectedValue = this.savingsForm.get('escalationRate')?.value;


  // Find exact match by both value and description
  return this.escalationRates.some(e =>
    e.value === selectedValue && e.description === 'Increases at custom rate'
  );
}

  get isOneOff(): boolean {
    // const selectedValue = this.savingsForm.get('escalationRate')?.value;
    return this.cycles.find(cycle => cycle.id === this.savingsForm.get('commissionCycle')?.value)?.description === 'One-off';
  }




onEscalationRateChange(event: MatSelectChange): void {
  const selectedOption = event.source.selected;

  let description: string | null = null;

  if (Array.isArray(selectedOption)) {
    description = selectedOption[0]?.viewValue ?? null;
  } else {
    description = selectedOption?.viewValue ?? null;
  }

  this.selectedEscalationDescription = description;

  const customControl = this.savingsForm.get('customEscalationRate');

  if (description === 'Increases at custom rate') {
    customControl?.setValidators([Validators.required, Validators.min(0)]);
  } else {
    customControl?.clearValidators();
    customControl?.setValue(null); // Optionally reset field
  }

  customControl?.updateValueAndValidity();
}

  onInputChange(event: any, controlName: string) {
    let value = event.target.value.replace('%', '').trim();
    if (!isNaN(value) && value !== '') {
      this.savingsForm
        .get(controlName)
        ?.setValue(parseFloat(value), { emitEvent: true });
    }
  }

  onInputBlur(event: any, controlName: string) {
    let value = this.savingsForm.get(controlName)?.value || 0;
    this.savingsForm.get(controlName)?.setValue(value, { emitEvent: true });
    this.updateFormattedValue(controlName);
  }

  updateFormattedValue(controlName: string) {
    let value = this.savingsForm.get(controlName)?.value || 0;
    if(controlName === 'returnRate') {
      this.formattedReturnRate = this.formatWithPercentage(value);
    }
    if(controlName === 'commissionPercentage') {
      this.formattedCommissionPercentage = this.formatWithPercentage(value);
    }
  }

  onAmountInput(rawValue: string) {
    const value = parseFormattedNumber(rawValue ?? '');
    this.savingsForm.get('amount')?.setValue(value, { emitEvent: true });
    this.amount = value;
  }
  formatWithPercentage(value: number | string): string {
    return value !== null && value !== '' ? `${value}%` : '0%';
  }

  saveCashflow(): void {
    this.savingsForm.markAllAsTouched();
    const isCustomEscalation = this.selectedEscalationDescription === 'Increases at custom rate';
    const selectedEscalationRateValue = isCustomEscalation
      ? this.savingsForm.get('customEscalationRate')?.value
      : this.savingsForm.get('escalationRate')?.value;
 const rr = this.round2(this.savingsForm.get('returnRate')?.value ?? 0);
  const real = this.savingsForm.get('name')?.value !== 'Cash'
    ? this.round2(rr - this.inflationRate)
    : 0;
    const isPotLocked = this.savingsForm.get('lockPot')?.value;
    if (this.isCashTypeSelected) {
      const selectedOwnership =
        (this.savingsForm.get('ownership')?.value ?? SavingPotOwnership.Joint) as SavingPotOwnership;
      if (!this.isOwnershipAvailableForCash(selectedOwnership)) {
        this.savingsForm.get('ownership')?.setErrors({ duplicateCashOwnership: true });
        this.savingsForm.markAllAsTouched();
        return;
      }
    }

    if (this.savingsForm.valid) {
      var clientSaving: ClientSaving = {
        id: this.isEditWorkflow ? this.selectedPot.id : null,
        name: this.savingsForm.get('name')?.value !== 'Custom'
        ? this.savingsForm.get('name')?.value
        : this.savingsForm.get('customName')?.value,
        isGrowing: false,
        nominalValue: 0,
        realValue: 0,
        realGrowthRate: 0,
        inflationRate: this.inflationRate ??  0,
        startingPotValue: {
          amount: this.savingsForm.get('amount')?.value,
          currencySymbol: this.savingsForm.get('currency')?.value,
          cycle: {
            id: '',
            description: '',
          },
        },
        comission: {
          amount: {
            amount: (this.isAddComissionChecked && this.savingsForm.get('commissionAmount')?.value) ? 
            this.savingsForm.get('commissionAmount')?.value : 0,
            currencySymbol:
             ( this.isAddComissionChecked && this.savingsForm.get('commissionCurrency')?.value) ? 
             this.savingsForm.get('commissionCurrency')?.value : '',
            cycle:
              ( this.isAddComissionChecked
                && this.savingsForm.get('commissionCycle')?.value !== null &&
              this.savingsForm.get('commissionCycle')?.value !== '')
                ? this.cycles.find(x => x.id === this.savingsForm.get('commissionCycle')?.value) ??
                this.savingsForm.get('commissionCycle')?.value
                : null,
          },
          percentage: {
            amount:   ( this.isAddComissionChecked
                &&  this.savingsForm.get('commissionPercentage')?.value) ? 
                this.savingsForm.get('commissionPercentage')?.value :  0,
            currencySymbol:
              ( this.isAddComissionChecked
                &&  this.savingsForm.get('commissionPercentageCurrency')?.value) ? 
                this.savingsForm.get('commissionPercentageCurrency')?.value : '',
            cycle:
               ( this.isAddComissionChecked
                && this.savingsForm.get('commissionPercentageCycle')?.value !== null &&
              this.savingsForm.get('commissionPercentageCycle')?.value !== '')
                ? this.cycles.find(x => x.id === this.savingsForm.get('commissionPercentageCycle')?.value) ??
                this.savingsForm.get('commissionPercentageCycle')?.value
                : {
                    id: '',
                    description: '',
                  },
          },
  escalationRate:
  selectedEscalationRateValue !== null && selectedEscalationRateValue !== ''
    ? this.escalationRates.find(x => x.value === selectedEscalationRateValue) ??
      {
        description: this.selectedEscalationDescription ?? selectedEscalationRateValue,
        value: selectedEscalationRateValue
      }
    : {
        description: '',
        value: 0
      },
          type: ( this.isAddComissionChecked
                &&  this.savingsForm.get('commissionType')?.value === 'amount')
            ? ComissionType.Amount
            :  ( this.isAddComissionChecked
                && this.savingsForm.get('commissionType')?.value === 'percentage')
            ? ComissionType.Percentage : ComissionType.Both,
        },
        hasCommission: this.savingsForm.get('commissions')?.value,
        orderNumber: this.isEditWorkflow ? this.selectedPot.orderNumber : 0,
        hasPotLocked: this.savingsForm.get('lockPot')?.value,
        iconUrl: this.savingsForm.get('name')?.value !== 'Custom'
          ? this.savingPotValues.find(
            (x) => this.savingsForm.get('name')?.value === x.name
          )?.iconUrl ?? 'cashflow-moneys-icon'
          : 'custom-option-icon',
        start: {
          age:
            this.forecastStartDateYear != null
              ? this.forecastStartDateYear - this.clientBirthYear
              : 0,
          year:
            this.forecastStartDateYear != null
              ? this.forecastStartDateYear
              : 0,
        },
        lockedFrom: {
          age:
            isPotLocked && this.savingsForm.get('start')?.value !== null &&
            this.savingsForm.get('start')?.value !== ''
              ? this.savingsForm.get('start')?.value - this.clientBirthYear
              : 0,
          year:
            isPotLocked &&  this.savingsForm.get('start')?.value !== null &&
            this.savingsForm.get('start')?.value !== ''
              ? this.savingsForm.get('start')?.value
              : 0,
        },
        lockedTill: {
          age:
             isPotLocked && this.savingsForm.get('end')?.value !== null &&
            this.savingsForm.get('end')?.value !== ''
              ? this.savingsForm.get('end')?.value - this.clientBirthYear
              : 0,
          year:
             isPotLocked && this.savingsForm.get('end')?.value !== null &&
            this.savingsForm.get('end')?.value !== ''
              ? this.savingsForm.get('end')?.value
              : 0,
        },
        end: {
          age:
            this.forecastEndDateYear != null
              ? this.forecastEndDateYear - this.clientBirthYear
              : 0,
          year:
            this.forecastEndDateYear != null
              ? this.forecastEndDateYear
              : 0,
        },
        // returnRate: this.savingsForm.get('name')?.value !== 'Cash' ? this.savingsForm.get('returnRate')?.value : 0,
          returnRate: this.savingsForm.get('name')?.value !== 'Cash' ? rr : 0,
        type:
        this.savingsForm.get('name')?.value === 'Cash' ||
        this.savingsForm.get('customName')?.value === 'Cash'
          ? SavingPotType.Cash
          : this.savingPotValues.find(
              (x) => this.savingsForm.get('name')?.value === x.name
            )?.type ?? SavingPotType.Other,
        // realReturn: this.savingsForm.get('name')?.value !== 'Cash' ?
        //   this.savingsForm.get('returnRate')?.value - this.inflationRate : 0,
        realReturn: real,
        // Pension fund specific fields
        contributionAmount: this.savingsForm.get('name')?.value === 'Pension fund' 
          ? this.savingsForm.get('contributionAmount')?.value 
          : null,
        contributionFrequency: this.savingsForm.get('name')?.value === 'Pension fund'
          ? this.savingsForm.get('contributionFrequency')?.value
          : null,
        contributionStartDate: this.savingsForm.get('name')?.value === 'Pension fund'
          ? {
              year: this.savingsForm.get('contributionStartDate')?.value,
              age: (this.savingsForm.get('contributionStartDate')?.value || 0) - this.clientBirthYear
            }
          : null,
        contributionEndDate: this.savingsForm.get('name')?.value === 'Pension fund'
          ? {
              year: this.savingsForm.get('contributionEndDate')?.value,
              age: (this.savingsForm.get('contributionEndDate')?.value || 0) - this.clientBirthYear
            }
          : null,
        retirementAge: this.savingsForm.get('name')?.value === 'Pension fund'
          ? this.retirementAge
          : null,
        ownership: this.hasPartner ? (this.savingsForm.get('ownership')?.value ?? SavingPotOwnership.Joint) : SavingPotOwnership.Joint
      };
      const function$ = !this.isEditWorkflow ? this.savingPotsHttpService
      .addNewSavingPot(this.cashflowId, clientSaving) :
      this.savingPotsHttpService
        .addNewSavingPot(this.cashflowId, clientSaving)

      function$
        .pipe(
          filter((res) => !!res),
          catchError((err) => {
            console.error(err);
            throw err;
          })
        )
        .subscribe((res) => {
          this.dialogRef.close({
            status: 'Success',
            savingPot: res,
          });
        });
    }
  }

  onCommissionTypeControlClicked(amountType: string) {
    this.savingsForm.get('commissionType')?.setValue(amountType)

    if(amountType === 'both') {
      this.savingsForm
        .get('commissionType')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCurrency')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionAmount')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCycle')
        ?.setValidators(Validators.required);
        this.savingsForm
        .get('commissionCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionPercentage')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValidators(Validators.required);
        this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('escalationRate')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('escalationRate')
        ?.setValue(this.escalationRates[1].value);

      this.savingsForm.get('commissionCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionAmount')?.updateValueAndValidity();
      this.savingsForm.get('commissionType')?.updateValueAndValidity();
      this.savingsForm.get('commissionCycle')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentageCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentageCycle')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentage')?.updateValueAndValidity();
      this.savingsForm.get('escalationRate')?.updateValueAndValidity();
      this.updateFormattedValue('commissionPercentage')

    }

    if(amountType === 'amount') {
      this.savingsForm
        .get('commissionType')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCurrency')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionAmount')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCycle')
        ?.setValidators(Validators.required);
        this.savingsForm
        .get('commissionCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionPercentage')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCycle')
        ?.removeValidators(Validators.required);
        this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('escalationRate')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('escalationRate')
        ?.setValue(this.escalationRates[1].value);

      this.savingsForm.get('commissionCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionAmount')?.updateValueAndValidity();
      this.savingsForm.get('commissionType')?.updateValueAndValidity();
      this.savingsForm.get('commissionCycle')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentageCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentageCycle')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentage')?.updateValueAndValidity();
      this.savingsForm.get('escalationRate')?.updateValueAndValidity();
    }


    if(amountType === 'percentage') {
      this.savingsForm
        .get('commissionType')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionCurrency')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionAmount')
        ?.removeValidators(Validators.required);
      this.savingsForm
        .get('commissionCycle')
        ?.removeValidators(Validators.required);
        this.savingsForm
        .get('commissionCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCurrency')
        ?.setValue(this.clientPreferredCurrency);
      this.savingsForm
        .get('commissionPercentage')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValidators(Validators.required);
        this.savingsForm
        .get('commissionPercentageCycle')
        ?.setValue(this.cycles[2].id);
      this.savingsForm
        .get('escalationRate')
        ?.setValidators(Validators.required);
      this.savingsForm
        .get('escalationRate')
        ?.setValue(this.escalationRates[1].value);

      this.savingsForm.get('commissionCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionAmount')?.updateValueAndValidity();
      this.savingsForm.get('commissionType')?.updateValueAndValidity();
      this.savingsForm.get('commissionCycle')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentageCurrency')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentageCycle')?.updateValueAndValidity();
      this.savingsForm.get('commissionPercentage')?.updateValueAndValidity();
      this.savingsForm.get('escalationRate')?.updateValueAndValidity();
      this.updateFormattedValue('commissionPercentage')

    }
  }

  blockComma(e: KeyboardEvent) {
  if (e.key === ',') e.preventDefault();
}

      private endOnOrAfterStartValidator(): ValidatorFn {
      return (group: AbstractControl) => {
        const start = group.get('start')?.value;
        const end   = group.get('end')?.value;
        const endCtrl = group.get('end');
    
        // Only validate when both are present (or when end is present)
        if (endCtrl) {
          const existing = endCtrl.errors ?? null;
    
          if (start != null && start !== '' && end != null && end !== '' && end < start) {
            // attach/merge the error onto the END control
            endCtrl.setErrors({ ...(existing ?? {}), endBeforeStart: true });
          } else {
            // remove just our error, keep any others
            if (existing && 'endBeforeStart' in existing) {
              const { endBeforeStart, ...rest } = existing;
              endCtrl.setErrors(Object.keys(rest).length ? rest : null);
            }
          }
        }
        return null;
      };
    }

    onReturnRateInput(event: Event) {
  // when typing, ensure the control holds a number (so slider updates smoothly)
  const raw = (event.target as HTMLInputElement).value;
  const num = Number(raw);
  const val = isNaN(num) ? 0 : this.round2(num);
  this.savingsForm.get('returnRate')?.setValue(val, { emitEvent: true });

}

// onSliderChange(val: number) {
//   // coerce to number and push into the form control
//   const num = Number(val);
//   this.savingsForm.get('returnRate')?.setValue(isNaN(num) ? 0 : num, { emitEvent: true });
// }

onSliderInput(event: Event): void {
  const inputElement = event.target as HTMLInputElement;
  const value = Number(inputElement.value);

  const val = isNaN(value) ? 0 : this.round2(value);
  this.savingsForm.get('returnRate')?.setValue(val, { emitEvent: true });
}

private round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

}

