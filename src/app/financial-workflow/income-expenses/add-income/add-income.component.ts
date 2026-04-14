import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { allCountries } from 'src/app/clients/models/country';
import { parseFormattedNumber } from 'src/app/shared/utils/number-utils';
import { Cycle, EscalationRate } from '../../timeline/models/financial-timeline';
import moment from 'moment';
import { FinancialViewModel } from '../model/income-expense';
import { extractEventId, resolveYear } from 'src/app/shared/utils/event-date-utils';
import { IncomeExpensesHttpService } from '../services/income-expenses-http.service';
import { WithdrawalsContributionsHttpService } from '../../withdrawals-contributions/services/withdrawals-contributions-http.service';
import { FundsViewModel } from '../../withdrawals-contributions/model/withdrawals-contributions';
import { ClientSaving, ComissionType } from '../../saving-pots/models/saving-pots.model';
import { Client } from 'src/app/clients/models/client';
import { formatSavingPotSelectLabel } from 'src/app/shared/utils/saving-pot-select-label';
import { catchError, filter, finalize, switchMap, of, map } from 'rxjs';
import { ThousandSeparatorInputDirective } from 'src/app/directives/thousand-separator-input.directive';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateIncomeExpenseLabelPipe } from 'src/app/core/pipes/translate-income-expense-label.pipe';
import { TranslateEscalationDescriptionPipe } from 'src/app/core/pipes/translate-escalation-description.pipe';
import { getAmountCycleLabel } from 'src/app/shared/utils/amount-cycle-label';
import { resolveEscalationMatch } from 'src/app/shared/utils/escalation-rate-utils';
import { CommonModule } from '@angular/common';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/auth/services/auth.service';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
import { translateTimelineEventDisplayName } from 'src/app/shared/utils/timeline-event-display-name';
import {
  annualEquivalentForIncomeCycle,
  findSalaryIncomeForStatePensionRow,
  roundPercentOf,
} from 'src/app/shared/utils/state-pension-salary-utils';
import {
  IncomeDisplayLabelContext,
  incomeApiDescriptionToDisplayLabel,
  isClientSalaryApiDescription,
  isClientStatePensionApiDescription,
  isClientInheritanceApiDescription,
  isPartnerSalaryApiDescription,
  isPartnerStatePensionApiDescription,
  isPartnerInheritanceApiDescription,
  isSalaryTypeForBonus,
} from 'src/app/shared/utils/income-display-label';
import {
  getCompletedYearsAgeAtDate,
  getPersistedAgeForCalendarYear,
  getProjectionColumnAgeLabel,
} from 'src/app/shared/utils/client-age-at-reference';
import { calendarYearOrEventRefValidator } from 'src/app/shared/utils/calendar-year-or-event-ref.validator';
import {
  recurringEndYearNotSelected,
  resolveCycleDescriptionForRecurringEndGuard,
} from 'src/app/shared/utils/recurring-end-save-guard';

@Component({
  selector: 'app-add-income',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatDialogModule,
    MatInputModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatSliderModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    CommonModule,
    ThousandSeparatorInputDirective,
    TranslateModule,
    TranslateIncomeExpenseLabelPipe,
    TranslateEscalationDescriptionPipe,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './add-income.component.html',
  styleUrl: './add-income.component.scss',
})
export class AddIncomeComponent {
  @ViewChild('amountInput') amountInput?: ElementRef<HTMLInputElement>;
  @ViewChild('bonusAmountInput') bonusAmountInput?: ElementRef<HTMLInputElement>;
  eventsList: any[] = [];
  incomeForm: FormGroup;
  countries = allCountries;
  cycles: Cycle[];
  years: number[] = [];
  escalationRates: EscalationRate[];
  cashflowId: string;
  clientPreferredCurrency: string;
  clientBirthYear: number;
  clientAge: number;
  isEditWorkflow = false;
  selectedIncome: FinancialViewModel | null = null;
  showStartEnd = false;
  selectedEscalationDescription: string | null;
  currentYear: number = new Date().getFullYear();
  isNameEditable: boolean | false;
  incomeTypes: string[] = [];
  isDefaultIncome: boolean = false;
  incomeIcon: string;
  customDescriptionAutoRenamed: string;
  showNameEdit: boolean = false;
  retirementAge: number;
  retirementEventYear: number | null = null;
  retirementYear: number;
  forecastEndYear: number;
  isSaving = false;
  scenarioMode: boolean = false;
  /** Full list as provided by parent (may include Cash). */
  private allSavingPots: ClientSaving[] = [];
  /** Eligible list for inheritance investing UI (non-cash only). */
  clientSavings: { id: string; name: string; ownership?: number | null }[] = [];
  existingContributions: any[] = [];
  private initialFormSnapshot = '';
  showPersonSelector = false;
  editingPerson: 'client' | 'partner' = 'client';
  clientDisplayName = '';
  partnerDisplayName = '';
  private combinedEdit: { client: FinancialViewModel; partner?: FinancialViewModel } | null = null;
  private hasPartner = false;
  private clientFirstName = '';
  private partnerFirstName = '';
  private selectedClient: Client | null = null;
  private pensionReplacementRatePct: number = 50;

  constructor(
    private dialogRef: MatDialogRef<AddIncomeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private incomeExpenseHttpService: IncomeExpensesHttpService,
    private withdrawalsContributionsHttpService: WithdrawalsContributionsHttpService,
    private translate: TranslateService,
    private toastr: ToastrService,
    private auth: AuthService,
    private settingsService: SettingsService,
  ) {
    this.scenarioMode = data.scenarioMode ?? false;
    this.incomeTypes = data.incomeType;
    this.eventsList = data.eventsList ?? [];
    this.allSavingPots = (data.clientSavings ?? []) as ClientSaving[];
    this.selectedClient = data.selectedClient ?? null;
    // Keep the non-cash list for the select, but compute eligibility from the full list (so Cash never qualifies).
    this.clientSavings = this.allSavingPots
      .filter((s) => !this.isCashSavingPotName(s?.name))
      .map((s) => ({
        id: s.id as string,
        name: (s.name ?? '').toString(),
        ownership: s.ownership,
      }));
    this.existingContributions = data.existingContributions ?? [];
    this.cycles = data.amountCycles;
    this.escalationRates = data.escalataionRates;
    const preselectedApi = this.displayLabelToApiDesc(data.preselectedIncomeType ?? '');
    const isPartnerIncome =
      isPartnerSalaryApiDescription(this.selectedIncome?.description) ||
      isPartnerStatePensionApiDescription(this.selectedIncome?.description) ||
      isPartnerInheritanceApiDescription(this.selectedIncome?.description) ||
      isPartnerSalaryApiDescription(preselectedApi) ||
      isPartnerStatePensionApiDescription(preselectedApi) ||
      isPartnerInheritanceApiDescription(preselectedApi);
    const usePartnerBirthDate =
      !!isPartnerIncome && !!data.partnerBirthDate;
    this.applyBirthDateContextForSalaryPerson(usePartnerBirthDate);

    this.clientPreferredCurrency = data.clientPreferredCurrency;
    this.cashflowId = data.cashflowId;
    this.isEditWorkflow = data.isEditWorkflow;
    this.selectedIncome = data.selectedIncome ?? null;
    this.combinedEdit = data.combinedEdit ?? null;
    this.showPersonSelector = !!this.combinedEdit;
    this.clientDisplayName = data.clientFirstName || 'Person 1';
    this.partnerDisplayName = data.partnerFirstName || 'Person 2';
    this.hasPartner = !!data.hasPartner;
    this.clientFirstName = data.clientFirstName || '';
    this.partnerFirstName = data.partnerFirstName || '';
    this.editingPerson =
      isPartnerSalaryApiDescription(this.selectedIncome?.description) ||
      isPartnerStatePensionApiDescription(this.selectedIncome?.description) ||
      isPartnerInheritanceApiDescription(this.selectedIncome?.description)
        ? 'partner'
        : 'client';

    const selDesc = this.selectedIncome?.description ?? '';
    this.isNameEditable =
      !isClientSalaryApiDescription(selDesc) &&
      !isPartnerSalaryApiDescription(selDesc) &&
      !isClientStatePensionApiDescription(selDesc) &&
      !isPartnerStatePensionApiDescription(selDesc) &&
      !isClientInheritanceApiDescription(selDesc) &&
      !isPartnerInheritanceApiDescription(selDesc) &&
      this.selectedIncome?.description != 'Rental income';

    const planEndYear = this.resolvePlanEndYear(data);
    const iterations = planEndYear - data.forecastStartDateYear + 1;

    for (let index = 0; index < iterations; index++) {
      const element = data.forecastStartDateYear + index;
      this.years.push(element);
    }

    this.forecastEndYear = planEndYear;

    const initialIncomeType = data.preselectedIncomeType && this.incomeTypes.includes(data.preselectedIncomeType)
      ? data.preselectedIncomeType
      : this.incomeTypes[0];
    this.incomeForm = this.fb.group({
      description: [this.selectedIncome?.description ?? (initialIncomeType !== 'Custom' ? initialIncomeType : ''), Validators.required],
      incomeType: [initialIncomeType, Validators.required],
      currencySymbol: [this.clientPreferredCurrency, [Validators.required]],
      amount: ['', [Validators.required, this.greaterThanZero()]],
      cycle: [this.cycles[1].id, Validators.required],
      start: [''],
      end: [''],
      escalationRate: [this.escalationRates[0]?.description ?? '', Validators.required],
      customEscalationRate: [''],
      addBonus: [this.selectedIncome?.bonus?.enabled ?? false],
      bonusAmount: [{ value: this.selectedIncome?.bonus?.amount?.amount ?? 0, disabled: true }],
      bonusCycle: [this.selectedIncome?.bonus?.amount?.cycle?.id ?? this.getYearlyCycleId()],
      bonusDate: [this.selectedIncome?.bonus?.bonusDate?.year ?? null],
      investThisAmount: [this.selectedIncome?.investThisAmount ?? false],
      inheritanceTargetPotId: [this.selectedIncome?.inheritanceTargetPotId ?? null],
      inheritancePercentToInvest: [this.selectedIncome?.inheritancePercentToInvest ?? 80]
    });
    this.incomeForm.get('currencySymbol')?.disable();
    this.incomeForm.setValidators(this.endOnOrAfterStartValidator());
    this.incomeForm.updateValueAndValidity({ emitEvent: false });
    this.onCycleValueChange(this.cycles[1].id);

    if (!this.isEditWorkflow) {
      this.customDescriptionAutoRenamed = this.autoRenameCustom();
    }

    if (this.isEditWorkflow && this.selectedIncome) {
      this.onCycleValueChange(this.selectedIncome.amount?.cycle?.id)
      this.incomeForm.get('description')?.patchValue(this.selectedIncome.description);
      const desc = this.selectedIncome.description;
      if (
        isPartnerSalaryApiDescription(desc) ||
        isPartnerStatePensionApiDescription(desc)
      ) {
        this.incomeForm.get('description')?.disable();
      }
      this.incomeForm.get('currencySymbol')?.patchValue(this.clientPreferredCurrency);
      const amountVal = this.selectedIncome.amount?.amount;
      this.incomeForm.get('amount')?.patchValue(amountVal === 0 || amountVal === null || amountVal === undefined ? '' : amountVal);

      // thousand comma seperator (skip when amount is 0 to avoid showing error by default)
      setTimeout(() => {
        const el = this.amountInput?.nativeElement;
        const amount = this.incomeForm.get('amount')?.value;
        if (!el || amount === null || amount === undefined || amount === '') return;
        el.value = Number(amount).toLocaleString('en-US');
        el.dispatchEvent(new Event('blur'));

        const elBonusAmountInput = this.bonusAmountInput?.nativeElement;
        const bonusAmount = this.incomeForm.get('bonusAmount')?.value;
        if (!elBonusAmountInput || bonusAmount === null || bonusAmount === undefined || bonusAmount === '' || Number(bonusAmount) === 0) return;
        elBonusAmountInput.value = Number(bonusAmount).toLocaleString('en-US');
        elBonusAmountInput.dispatchEvent(new Event('blur'));
      });

      this.incomeForm.get('cycle')?.patchValue(this.selectedIncome.amount?.cycle?.id);
      if (this.selectedIncome.startEventId) {
        this.incomeForm.get('start')?.patchValue('event:' + this.selectedIncome.startEventId);
      } else {
        const sy = Number(this.selectedIncome.start?.year);
        const startNum = Number.isFinite(sy) && sy > 0 ? sy : null;
        if (startNum) this.ensureYearInSelectableYears(startNum);
        this.incomeForm.get('start')?.patchValue(startNum);
      }
      if (this.selectedIncome.endEventId) {
        this.incomeForm.get('end')?.patchValue('event:' + this.selectedIncome.endEventId);
      } else {
        const ey = Number(this.selectedIncome.end?.year);
        const endNum = Number.isFinite(ey) && ey > 0 ? ey : null;
        if (endNum) this.ensureYearInSelectableYears(endNum);
        this.incomeForm.get('end')?.patchValue(endNum);
      }

      const matchedEscalation = resolveEscalationMatch(
        this.escalationRates,
        this.selectedIncome!.escalationRate,
      );
      const cycleId = this.selectedIncome.amount?.cycle?.id;
      const cycle = this.cycles.find(x => x.id === cycleId);

      if (cycle?.description === 'One-off') {
        this.incomeForm.get('cycle')?.disable();
      }

      if (matchedEscalation) {
        // Standard escalation rate selected
        this.incomeForm.get('escalationRate')?.patchValue(matchedEscalation.description);
        this.selectedEscalationDescription = matchedEscalation.description;
      } else if (
        this.selectedIncome!.escalationRate &&
        this.selectedIncome!.escalationRate.description === 'Increases at custom rate'
      ) {
        // Custom escalation
        this.escalationRates = this.escalationRates.filter(
          x => x.description !== 'Increases at custom rate'
        );

        // Then add the custom rate value to escalationRates
        this.escalationRates.push({
          description: 'Increases at custom rate',
          value: this.selectedIncome!.escalationRate!.value
        });

        this.incomeForm.get('escalationRate')?.patchValue('Increases at custom rate');
        this.incomeForm.get('customEscalationRate')?.patchValue(this.selectedIncome!.escalationRate!.value);
        this.selectedEscalationDescription = 'Increases at custom rate';

        // Trigger validators for custom rate
        const customControl = this.incomeForm.get('customEscalationRate');
        customControl?.setValidators([Validators.required, Validators.min(0)]);
        customControl?.updateValueAndValidity();
      }

      if (
        isSalaryTypeForBonus(this.selectedIncome?.description) &&
        this.selectedIncome?.bonus
      ) {
        const bonus = this.selectedIncome.bonus;
        const amount = bonus.amount;
        const cycle = amount?.cycle;
        const bonusAmt = amount?.amount ?? 0;

        this.incomeForm.patchValue({
          addBonus: bonus.enabled,
          bonusAmount: bonusAmt === 0 ? '' : bonusAmt,
          bonusCycle: cycle?.id ?? null,
          bonusDate: bonus.bonusDate?.year ?? null
        });

        if (this.selectedIncome.bonus.enabled) {
          this.incomeForm.get('bonusAmount')?.enable();
        }
      }

      if (
        isClientInheritanceApiDescription(this.selectedIncome?.description) ||
        isPartnerInheritanceApiDescription(this.selectedIncome?.description)
      ) {
        const linkedContribution = this.existingContributions.find(
          (c: any) => c.sourceIncomeId === this.selectedIncome?.id
        );
        if (linkedContribution) {
          const incomeAmount = this.selectedIncome.amount?.amount ?? 0;
          const contribAmount = linkedContribution.amount?.amount ?? 0;
          const percent = incomeAmount > 0 ? Math.round((contribAmount / incomeAmount) * 100) : 100;
          this.incomeForm.patchValue({
            investThisAmount: true,
            inheritanceTargetPotId: linkedContribution.associatedSavingPotId,
            inheritancePercentToInvest: Math.min(100, Math.max(1, percent))
          });
        } else if (this.selectedIncome.investThisAmount) {
          this.incomeForm.patchValue({
            investThisAmount: true,
            inheritanceTargetPotId: this.selectedIncome.inheritanceTargetPotId,
            inheritancePercentToInvest: this.selectedIncome.inheritancePercentToInvest ?? 80
          });
        }
      }
    }

    const sd = this.selectedIncome?.description;
    if (
      this.isEditWorkflow &&
      sd != null &&
      (isClientSalaryApiDescription(sd) ||
        isPartnerSalaryApiDescription(sd) ||
        isClientStatePensionApiDescription(sd) ||
        isPartnerStatePensionApiDescription(sd) ||
        sd === 'Rental income' ||
        isClientInheritanceApiDescription(sd) ||
        isPartnerInheritanceApiDescription(sd))
    ) {
      this.onIncomeTypeChange(this.selectedIncome!.description);
    }
    else if (this.isEditWorkflow && this.selectedIncome != null) {
      this.incomeForm.get('incomeType')?.patchValue('Custom');
      this.onIncomeTypeChange('Custom');
    }
    else {
      this.onIncomeTypeChange(initialIncomeType);
    }

    this.setupBonusControlHandlers();
    this.setupInheritanceControlHandlers();
    this.setupOneOffStartEndSync();

    this.setIsDefaultIncome();
    this.setIncomeIcon();
    this.captureInitialFormState();

    // Load replacement rate for state pension prefill (fallback to 50%).
    this.loadPensionReplacementRate();
  }

  autoRenameCustom(): string {
    let baseName = this.incomeForm.get('incomeType')?.value;

    if (baseName == undefined || this.incomeForm.get('incomeType')?.value == "Custom")
      baseName = "Custom income";

    if (baseName !== "Custom income")
      return baseName;

    const existing = this.data.incomes
      ?.filter((e: any) =>
        e.isDefault == false && e.description != "Rental income" && e.description?.toLowerCase() !== 'pension fund'
      ) ?? [];

    if (existing.length === 0 && baseName !== "Custom income") {
      return baseName;
    }

    return `${baseName} #${existing.length + 1}`;
  }

  onAmountInput(rawValue: string) {
    if (!rawValue || rawValue.trim() === '') {
      this.incomeForm.get('amount')?.setValue('', { emitEvent: true });
      return;
    }
    const value = parseFormattedNumber(rawValue, this.translate.currentLang);
    this.incomeForm.get('amount')?.setValue(value, { emitEvent: true });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onEditingPersonChange(person: 'client' | 'partner'): void {
    if (!this.combinedEdit) return;
    this.editingPerson = person;
    if (person === 'client') {
      this.selectedIncome = this.combinedEdit.client;
      this.loadIncomeIntoForm(this.combinedEdit.client);
    } else {
      if (this.combinedEdit.partner) {
        this.selectedIncome = this.combinedEdit.partner;
        this.loadIncomeIntoForm(this.combinedEdit.partner);
      } else {
        this.selectedIncome = null;
        this.loadIncomeIntoFormForNewPartner();
      }
    }
    this.refreshBirthContextFromCurrentDescription();
  }

  private loadIncomeIntoForm(income: FinancialViewModel): void {
    this.incomeForm.patchValue({
      description: income.description,
      incomeType: income.description,
      amount: income.amount?.amount === 0 ? '' : income.amount?.amount,
      cycle: income.amount?.cycle?.id ?? this.cycles[1]?.id,
      start: income.startEventId ? 'event:' + income.startEventId : income.start?.year,
      end: income.endEventId ? 'event:' + income.endEventId : income.end?.year,
      addBonus: income.bonus?.enabled ?? false,
      bonusAmount: income.bonus?.amount?.amount ?? 0,
      bonusCycle: income.bonus?.amount?.cycle?.id ?? this.getYearlyCycleId(),
      bonusDate: income.bonus?.bonusDate?.year ?? null,
    });
    this.onCycleValueChange(income.amount?.cycle?.id ?? this.cycles[1]?.id);
    const matchedEscalation = resolveEscalationMatch(this.escalationRates, income.escalationRate);
    if (matchedEscalation) {
      this.incomeForm.get('escalationRate')?.patchValue(matchedEscalation.description);
      this.selectedEscalationDescription = matchedEscalation.description;
    } else if (income.escalationRate?.description === 'Increases at custom rate') {
      this.escalationRates = this.escalationRates.filter(x => x.description !== 'Increases at custom rate');
      this.escalationRates.push({ description: 'Increases at custom rate', value: income.escalationRate?.value ?? 0 });
      this.incomeForm.get('escalationRate')?.patchValue('Increases at custom rate');
      this.incomeForm.get('customEscalationRate')?.patchValue(income.escalationRate?.value);
      this.selectedEscalationDescription = 'Increases at custom rate';
    }
    this.onIncomeTypeChange(income.description ?? '');
    this.setIncomeIcon();
  }

  private loadIncomeIntoFormForNewPartner(): void {
    const clientDesc = this.combinedEdit?.client.description ?? '';
    const baseType = isSalaryTypeForBonus(clientDesc)
      ? 'Salary (Partner)'
      : 'State pension (Partner)';
    const isSalary = isSalaryTypeForBonus(clientDesc);
    this.updateSalaryRetirementDefaults(true);
    const partnerRetirementEvent = this.findRetirementAgeEventForPerson(true);
    const defaultEnd =
      isSalary && partnerRetirementEvent?.id
        ? 'event:' + partnerRetirementEvent.id
        : this.retirementYear;
    this.incomeForm.patchValue({
      description: baseType,
      incomeType: baseType,
      amount: '',
      cycle: this.cycles[1]?.id,
      start: this.currentYear,
      end: defaultEnd,
      addBonus: false,
      bonusAmount: 0,
      bonusCycle: this.getYearlyCycleId(),
      bonusDate: null,
    });
    this.onCycleValueChange(this.cycles[1]?.id);
    this.onIncomeTypeChange(baseType);
    this.setIncomeIcon();
  }

  onCycleValueChange(event: any) {
    const isOneOff = this.cycles.find(cycle => cycle.id === event)?.description === 'One-off';
    this.showStartEnd = !isOneOff;
    const startCtrl = this.incomeForm.get('start');
    const endCtrl = this.incomeForm.get('end');
    if (!this.showStartEnd) {
      endCtrl?.clearValidators();
      endCtrl?.updateValueAndValidity();
      startCtrl?.setValidators([calendarYearOrEventRefValidator()]);
      startCtrl?.updateValueAndValidity();
    } else {
      endCtrl?.setValidators([calendarYearOrEventRefValidator()]);
      endCtrl?.updateValueAndValidity();
      startCtrl?.setValidators([calendarYearOrEventRefValidator()]);
      startCtrl?.updateValueAndValidity();
    }
    const escalationControl = this.incomeForm.get('escalationRate');
    if (isOneOff) {
      escalationControl?.clearValidators();
    } else {
      escalationControl?.setValidators(Validators.required);
    }
    escalationControl?.updateValueAndValidity();
  }

  getCycleLabel(cycle: Cycle): string {
    return getAmountCycleLabel(cycle, this.translate);
  }

  getTimelineEventLabel(rawName: string): string {
    return translateTimelineEventDisplayName(this.translate, rawName);
  }

  /** Save disabled until form is valid and recurring rows have an end year or event. */
  get isIncomeSaveButtonDisabled(): boolean {
    if (this.isSaving) {
      return true;
    }
    if (this.isEditWorkflow && !this.hasFormChanges()) {
      return true;
    }
    if (this.incomeForm.invalid) {
      return true;
    }
    if (this.showStartEnd) {
      const endRaw = this.incomeForm.get('end')?.value;
      if (!extractEventId(endRaw) && resolveYear(endRaw, this.eventsList) <= 0) {
        return true;
      }
    }
    const cycleId = this.incomeForm.get('cycle')?.value;
    const desc = resolveCycleDescriptionForRecurringEndGuard(this.cycles, cycleId);
    return recurringEndYearNotSelected(
      desc,
      this.incomeForm.get('end')?.value,
      this.eventsList,
    );
  }

  addIncome(): void {
    if (this.isSaving) return;
    if (this.isIncomeSaveButtonDisabled) return;
    this.incomeForm.markAllAsTouched();
    this.incomeForm.markAsDirty();

    if (this.incomeForm.valid) {
      this.isSaving = true;
      const descSubmit = this.incomeForm.get('description')?.value;
      if (isClientSalaryApiDescription(descSubmit)) {
        this.updateSalaryRetirementDefaults(false);
      } else if (isPartnerSalaryApiDescription(descSubmit)) {
        this.updateSalaryRetirementDefaults(true);
      } else if (isClientStatePensionApiDescription(descSubmit)) {
        this.updateSalaryRetirementDefaults(false);
      } else if (isPartnerStatePensionApiDescription(descSubmit)) {
        this.updateSalaryRetirementDefaults(true);
      } else if (isClientInheritanceApiDescription(descSubmit)) {
        this.applyBirthDateContextForSalaryPerson(false);
      } else if (isPartnerInheritanceApiDescription(descSubmit)) {
        this.applyBirthDateContextForSalaryPerson(true);
      }

      const isSalary = isSalaryTypeForBonus(
        this.incomeForm.get('description')?.value,
      );

      const selectedEscDesc = this.incomeForm.get('escalationRate')?.value as string;
      const isCustomEscalation = selectedEscDesc === 'Increases at custom rate';
      const escalationRateValue = isCustomEscalation
        ? this.incomeForm.get('customEscalationRate')?.value
        : this.escalationRates.find((x) => x.description === selectedEscDesc)?.value;
      const matchedRate = isCustomEscalation
        ? undefined
        : this.escalationRates.find((x) => x.description === selectedEscDesc);
      const startVal = this.incomeForm.get('start')?.value;
      const endVal = this.incomeForm.get('end')?.value;
      const startYear = resolveYear(startVal, this.eventsList);
      const endYear = resolveYear(endVal, this.eventsList);
      const startEventId = extractEventId(startVal);
      const endEventId = extractEventId(endVal);

      var income: FinancialViewModel = {
        id: this.isEditWorkflow && this.selectedIncome ? this.selectedIncome.id : null,
        description: this.incomeForm.get('description')?.value,
        amount: {
          amount: this.incomeForm.get('amount')?.value,
          currencySymbol: this.incomeForm.get('currencySymbol')?.value,
          cycle: {
            id: this.incomeForm.get('cycle')?.value ?? '',
            description:
              this.cycles.find(
                (x) => x.id === this.incomeForm.get('cycle')?.value
              )?.description ?? '',
          },
        },
        start: {
          age: startYear
            ? getPersistedAgeForCalendarYear(
                this.resolveBirthDateForAgeCalculations(),
                startYear,
                this.data.forecastStartDate,
                this.data.planDuration,
                this.forecastEndYear,
              )
            : 0,
          year: startYear || 0,
        },
        end: {
          age: endYear
            ? getPersistedAgeForCalendarYear(
                this.resolveBirthDateForAgeCalculations(),
                endYear,
                this.data.forecastStartDate,
                this.data.planDuration,
                this.forecastEndYear,
              )
            : 0,
          year: endYear || 0,
        },
        startEventId,
        endEventId,
        escalationRate: escalationRateValue !== null && escalationRateValue !== ''
          ? matchedRate ?? {
            description: isCustomEscalation
              ? 'Increases at custom rate'
              : selectedEscDesc ?? '',
            value: escalationRateValue
          }
          : {
            description: '',
            value: 0
          },
        isDefault: this.isDefaultIncome,
        isIncomeExpenseSource: this.selectedIncome?.isIncomeExpenseSource ?? true,
        icon: this.incomeIcon,
        bonus: isSalary
          ? {
            enabled: this.incomeForm.get('addBonus')?.value,
            amount: {
              amount: this.incomeForm.get('bonusAmount')?.value ?? 0,
              currencySymbol: this.clientPreferredCurrency,
              cycle: {
                id: this.incomeForm.get('bonusCycle')?.value,
                description:
                  this.cycles.find(x => x.id === this.incomeForm.get('bonusCycle')?.value)?.description ?? ''
              }
            },
            bonusDate:
              this.cycles.find(x => x.id === this.incomeForm.get('bonusCycle')?.value)?.description === 'One-off'
                ? {
                  age:
                    this.incomeForm.get('bonusDate')?.value !== null &&
                    this.incomeForm.get('bonusDate')?.value !== ''
                      ? getPersistedAgeForCalendarYear(
                          this.resolveBirthDateForAgeCalculations(),
                          this.incomeForm.get('bonusDate')?.value,
                          this.data.forecastStartDate,
                          this.data.planDuration,
                          this.forecastEndYear,
                        )
                      : 0,
                  year:
                    this.incomeForm.get('bonusDate')?.value !== null &&
                      this.incomeForm.get('bonusDate')?.value !== ''
                      ? this.incomeForm.get('bonusDate')?.value
                      : 0
                }
                : null
          }
          : null
      };

      if (this.scenarioMode) {
        this.dialogRef.close({
          status: 'Success',
          incomeExpense: null,
          scenarioItem: income
        });
        return;
      }

      var action$ = this.incomeExpenseHttpService.addIncome(
        this.cashflowId,
        income
      );

      if (this.isEditWorkflow && this.selectedIncome)
        action$ = this.incomeExpenseHttpService.updateIncome(
          this.cashflowId,
          income
        );

      action$
        .pipe(
          filter((res) => !!res),
          switchMap((incomeExpense: any) => {
            const isInheritance =
              isClientInheritanceApiDescription(income?.description) ||
              isPartnerInheritanceApiDescription(income?.description);
            const investChecked = !!this.incomeForm.get('investThisAmount')?.value;
            if (!isInheritance) {
              return of(incomeExpense);
            }
            const allIncomes = incomeExpense?.incomes ?? incomeExpense?.Incomes ?? [];
            const savedDesc = income?.description;
            const incomeId = this.isEditWorkflow
              ? this.selectedIncome?.id
              : allIncomes.find(
                  (i: any) =>
                    i.description === savedDesc &&
                    Number(i.amount?.amount) === Number(income.amount.amount) &&
                    i.start?.year === income.start.year
                )?.id;
            if (!incomeId) {
              return of(incomeExpense);
            }
            const linkedContribution = this.existingContributions.find(
              (c: any) => c.sourceIncomeId === incomeId
            );
            if (investChecked) {
              const targetPotId = this.incomeForm.get('inheritanceTargetPotId')?.value;
              const percent = this.incomeForm.get('inheritancePercentToInvest')?.value ?? 80;
              const incomeAmount = this.incomeForm.get('amount')?.value ?? 0;
              const investedAmount = incomeAmount * (percent / 100);
              if (!targetPotId || investedAmount <= 0) {
                return of(incomeExpense);
              }
              const potName = this.clientSavings.find((s) => s.id === targetPotId)?.name ?? 'saving pot';
              const oneOffCycle = this.cycles.find((c) => c.description === 'One-off');
              const contribution: FundsViewModel = {
                id: linkedContribution?.id ?? null,
                associatedSavingPotId: targetPotId,
                description: `Inheritance contribution to ${potName}`,
                amount: {
                  amount: investedAmount,
                  currencySymbol: this.clientPreferredCurrency,
                  cycle: {
                    id: oneOffCycle?.id ?? '',
                    description: oneOffCycle?.description ?? 'One-off',
                  },
                },
                start: income.start,
                end: income.end,
                startEventId: null,
                endEventId: null,
                escalationRate: null,
                contributionType: 1, // Cash: invested amount moves from cash to pot; remainder stays in cash
                hasCommission: false,
                comission: {
                  type: ComissionType.Percentage,
                  amount: { amount: 0, currencySymbol: '', cycle: { id: '', description: '' } },
                  percentage: { amount: 0, currencySymbol: '', cycle: { id: '', description: '' } },
                  escalationRate: { description: '', value: '0' },
                },
                sourceIncomeId: incomeId,
              };
              const contribAction$ = linkedContribution
                ? this.withdrawalsContributionsHttpService.updateContributions(this.cashflowId, contribution)
                : this.withdrawalsContributionsHttpService.addContributions(this.cashflowId, contribution);
              return contribAction$.pipe(
                map(() => incomeExpense),
                catchError((err) => {
                  console.error(err);
                  return of(incomeExpense);
                })
              );
            } else if (linkedContribution) {
              return this.withdrawalsContributionsHttpService.deleteContributions(
                this.cashflowId,
                linkedContribution
              ).pipe(
                map(() => incomeExpense),
                catchError((err) => {
                  console.error(err);
                  return of(incomeExpense);
                })
              );
            }
            return of(incomeExpense);
          }),
          catchError((err) => {
            console.error(err);
            throw err;
          }),
          finalize(() => {
            this.isSaving = false;
          })
        )
        .subscribe((res) => {
          this.dialogRef.close({
            status: 'Success',
            incomeExpense: res,
          });
        });
    } else {
      console.log('Form is invalid');
    }
  }

  get isCustomEscalationSelected(): boolean {
    return this.incomeForm.get('escalationRate')?.value === 'Increases at custom rate';
  }

  onEscalationRateChange(event: MatSelectChange): void {
    const description = (event.value as string) ?? null;

    this.selectedEscalationDescription = description;

    const customControl = this.incomeForm.get('customEscalationRate');

    if (description === 'Increases at custom rate') {
      customControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      customControl?.clearValidators();
      customControl?.setValue(null);
    }

    customControl?.updateValueAndValidity();
  }

  private endOnOrAfterStartValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const startRaw = group.get('start')?.value;
      const endRaw = group.get('end')?.value;
      const start = resolveYear(startRaw, this.eventsList);
      const end = resolveYear(endRaw, this.eventsList);
      const endCtrl = group.get('end');

      if (endCtrl) {
        const existing = endCtrl.errors ?? null;

        if (start > 0 && end > 0 && end < start) {
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

  get incomeTitle(): string {
    if (!this.isEditWorkflow) return 'Add income';
    const desc = this.selectedIncome?.description;
    if (desc) return this.apiDescToDisplayLabel(desc);
    return this.customDescriptionAutoRenamed ?? 'Income';
  }

  private apiDescToDisplayLabel(apiDesc: string): string {
    return incomeApiDescriptionToDisplayLabel(apiDesc, {
      hasPartner: this.hasPartner,
      clientFirstName: this.clientFirstName,
      partnerFirstName: this.partnerFirstName,
    });
  }

  get incomeDisplayLabelContext(): IncomeDisplayLabelContext {
    return {
      hasPartner: this.hasPartner,
      clientFirstName: this.clientFirstName,
      partnerFirstName: this.partnerFirstName,
    };
  }

  /** Whole percent of salary (annualized); null when not applicable or data is insufficient. */
  get statePensionSalaryPctHint(): number | null {
    const desc = this.incomeForm.get('description')?.value;
    if (
      !isClientStatePensionApiDescription(desc) &&
      !isPartnerStatePensionApiDescription(desc)
    ) {
      return null;
    }

    const salary = findSalaryIncomeForStatePensionRow(this.data?.incomes, desc);
    if (!salary) return null;

    const salaryAnnual = annualEquivalentForIncomeCycle(
      Number(salary.amount?.amount ?? 0),
      salary.amount?.cycle?.description,
    );
    if (salaryAnnual == null || !(salaryAnnual > 0)) return null;

    const cycleId = this.incomeForm.get('cycle')?.value;
    const pensionCycle = this.cycles.find((c) => c.id === cycleId);
    const rawAmount = this.incomeForm.get('amount')?.value;
    const pensionNum =
      rawAmount === '' || rawAmount === null || rawAmount === undefined
        ? NaN
        : Number(rawAmount);
    if (!Number.isFinite(pensionNum)) return null;

    const pensionAnnual = annualEquivalentForIncomeCycle(pensionNum, pensionCycle?.description);
    if (pensionAnnual == null) return null;

    return roundPercentOf(pensionAnnual, salaryAnnual);
  }

  isFormSalaryForBonus(): boolean {
    return isSalaryTypeForBonus(this.incomeForm.get('description')?.value);
  }

  private displayLabelToApiDesc(label: string): string {
    if (!this.hasPartner) return label;
    const cName = this.clientFirstName || 'Client';
    const pName = this.partnerFirstName || 'Partner';
    if (label === `Salary ${cName}`) return 'Salary';
    if (label === `Salary ${pName}`) return 'Salary (Partner)';
    if (label === `State pension ${cName}`) return 'State pension';
    if (label === `State pension ${pName}`) return 'State pension (Partner)';
    if (label === `Inheritance ${cName}`) return 'Inheritance';
    if (label === `Inheritance ${pName}`) return 'Inheritance (Partner)';
    return label;
  }

  setIncomeIcon(): void {
    if (this.selectedIncome?.icon != null) {
      this.incomeIcon = this.selectedIncome.icon;
    }
    else if (
      isClientSalaryApiDescription(this.incomeForm.get('description')?.value) ||
      isPartnerSalaryApiDescription(this.incomeForm.get('description')?.value)
    ) {
      this.incomeIcon = 'salary';
    }
    else if (
      isClientStatePensionApiDescription(
        this.incomeForm.get('description')?.value,
      ) ||
      isPartnerStatePensionApiDescription(
        this.incomeForm.get('description')?.value,
      )
    ) {
      this.incomeIcon = 'state-pension';
    }
    else if (this.incomeForm.get("description")?.value == "Rental income") {
      this.incomeIcon = "rental-income";
    }
    else if (
      isClientInheritanceApiDescription(this.incomeForm.get("description")?.value) ||
      isPartnerInheritanceApiDescription(this.incomeForm.get("description")?.value)
    ) {
      this.incomeIcon = "inheritance";
    }
    else {
      this.incomeIcon = "custom-income";
    }
  }

  setIsDefaultIncome(): void {
    if (this.selectedIncome?.isDefault != null) {
      this.isDefaultIncome = this.selectedIncome.isDefault;
    }
    else if (
      isSalaryTypeForBonus(this.incomeForm.get('description')?.value) ||
      isClientStatePensionApiDescription(
        this.incomeForm.get('description')?.value,
      ) ||
      isPartnerStatePensionApiDescription(
        this.incomeForm.get('description')?.value,
      ) ||
      isClientInheritanceApiDescription(this.incomeForm.get('description')?.value) ||
      isPartnerInheritanceApiDescription(this.incomeForm.get('description')?.value)
    ) {
      this.isDefaultIncome = true;
    }
    else {
      this.isDefaultIncome = false;
    }
  }

  onIncomeTypeChange(value: string): void {
    const apiValue = this.displayLabelToApiDesc(value);
    const descriptionCtrl = this.incomeForm.get('description');
    if (!descriptionCtrl) return;

    this.isNameEditable = false;
    this.isDefaultIncome = false;

    const incomeConfig: Record<string, {
      icon: string;
      description?: string;
      editableName?: boolean;
      isDefault?: boolean;
      requireDescription?: boolean;
    }> = {
      'Custom': {
        icon: 'custom-income',
        editableName: true
      },
      'Salary': {
        icon: 'salary',
        description: 'Salary',
        isDefault: true,
        requireDescription: true,
        editableName: false
      },
      'Salary (Partner)': {
        icon: 'salary',
        description: 'Salary (Partner)',
        isDefault: true,
        requireDescription: true,
        editableName: false
      },
      'State pension': {
        icon: 'state-pension',
        description: 'State pension',
        isDefault: true,
        requireDescription: true,
        editableName: false
      },
      'State pension (Partner)': {
        icon: 'state-pension',
        description: 'State pension (Partner)',
        isDefault: true,
        requireDescription: true,
        editableName: false
      },
      'Rental income': {
        icon: 'rental-income',
        description: 'Rental income',
        requireDescription: true,
        editableName: false
      },
      'Inheritance': {
        icon: 'inheritance',
        description: 'Inheritance',
        isDefault: true,
        requireDescription: true,
        editableName: false
      },
      'Inheritance (Partner)': {
        icon: 'inheritance',
        description: 'Inheritance (Partner)',
        isDefault: true,
        requireDescription: true,
        editableName: false
      }
    };

    const sd = this.selectedIncome?.description ?? '';
    const isCustom =
      this.selectedIncome != null &&
      !isClientSalaryApiDescription(sd) &&
      !isPartnerSalaryApiDescription(sd) &&
      !isClientStatePensionApiDescription(sd) &&
      !isPartnerStatePensionApiDescription(sd) &&
      !isClientInheritanceApiDescription(sd) &&
      !isPartnerInheritanceApiDescription(sd) &&
      this.selectedIncome.description != 'Rental income';

    const baseValue = isPartnerSalaryApiDescription(apiValue)
      ? 'Salary'
      : isPartnerStatePensionApiDescription(apiValue)
        ? 'State pension'
        : isPartnerInheritanceApiDescription(apiValue)
          ? 'Inheritance'
          : apiValue;
    const config = isCustom ? incomeConfig["Custom"] : (incomeConfig[apiValue] ?? incomeConfig[baseValue]);
    if (!config || !descriptionCtrl) return;

    this.incomeIcon = config.icon;
    this.isNameEditable = !!config.editableName;
    this.isDefaultIncome = !!config.isDefault;

    if (!this.isEditWorkflow && this.isNameEditable) {
      this.showNameEdit = true;
    } else if (!this.isNameEditable) {
      this.showNameEdit = false;
    }

    if (!this.isEditWorkflow) {
      this.applyDefaultStartEnd(apiValue);
    }

    if (apiValue === 'Inheritance' || apiValue === 'Inheritance (Partner)') {
      const oneOffCycle = this.cycles.find(c => c.description === 'One-off');
      if (oneOffCycle) {
        this.incomeForm.get('cycle')?.setValue(oneOffCycle.id);
        this.incomeForm.get('cycle')?.disable();
        this.onCycleValueChange(oneOffCycle.id);
      }
    } else {
      this.incomeForm.get('cycle')?.enable();
    }

    if (this.isEditWorkflow) {
      if (this.selectedIncome?.description != undefined) {
        descriptionCtrl.setValue(this.selectedIncome?.description, { emitEvent: true });
      }
      else {
        descriptionCtrl.setValue(apiValue, { emitEvent: true });
      }
    }
    else {
      const nextDescription = apiValue === 'Custom'
        ? ''
        : (config.description ?? apiValue);
      descriptionCtrl.setValue(nextDescription, { emitEvent: true });
    }

    if (config.requireDescription || apiValue === 'Custom') {
      descriptionCtrl.setValidators([Validators.required]);
    } else {
      descriptionCtrl.clearValidators();
    }

    descriptionCtrl.updateValueAndValidity();

    // If re-adding State pension (after deletion), prefill net amount from Salary.
    this.prefillStatePensionFromSalaryIfEligible(apiValue);

    this.prefillInheritanceFromLegacyIfEligible(apiValue);
  }

  private loadPensionReplacementRate(): void {
    // Prefer already-cached profile (header sets it), otherwise fetch.
    const cached = this.settingsService.currentUserData?.preferences?.pensionReplacementRate;
    if (cached != null && !Number.isNaN(Number(cached))) {
      this.pensionReplacementRatePct = Number(cached);
      return;
    }

    const user = this.auth.getUserProfile();
    const userId = (user?.sub ?? '').toString().trim();
    if (!userId) return;

    this.settingsService.getUserProfileResponse(userId).subscribe({
      next: (res: any) => {
        const rate = res?.body?.preferences?.pensionReplacementRate;
        if (rate != null && !Number.isNaN(Number(rate))) {
          this.pensionReplacementRatePct = Number(rate);
        }
      },
      error: () => {
        /* ignore; keep fallback */
      },
    });
  }

  private prefillStatePensionFromSalaryIfEligible(apiDesc: string): void {
    if (!isClientStatePensionApiDescription(apiDesc) && !isPartnerStatePensionApiDescription(apiDesc)) return;

    const amountCtrl = this.incomeForm.get('amount');
    const cycleCtrl = this.incomeForm.get('cycle');
    if (!amountCtrl || !cycleCtrl) return;

    // Do not overwrite user-entered value.
    const existing = amountCtrl.value;
    if (existing !== '' && existing !== null && existing !== undefined && Number(existing) > 0) return;

    const incomes: FinancialViewModel[] = (this.data?.incomes ?? []) as FinancialViewModel[];
    const salary = findSalaryIncomeForStatePensionRow(incomes, apiDesc);
    const salaryAmount = Number(salary?.amount?.amount ?? 0);
    if (!(salaryAmount > 0)) return;

    const ratePct = Number(this.pensionReplacementRatePct ?? 50);
    if (!(ratePct > 0)) return;

    const pensionAmount = salaryAmount * (ratePct / 100);
    if (!(pensionAmount > 0)) return;

    amountCtrl.setValue(pensionAmount, { emitEvent: true });

    // Align frequency with salary where possible.
    const salaryCycleId = salary?.amount?.cycle?.id;
    if (salaryCycleId) {
      cycleCtrl.setValue(salaryCycleId, { emitEvent: true });
      this.onCycleValueChange(salaryCycleId);
    }
  }

  private prefillInheritanceFromLegacyIfEligible(apiDesc: string): void {
    if (!isClientInheritanceApiDescription(apiDesc) && !isPartnerInheritanceApiDescription(apiDesc)) return;
    if (this.isEditWorkflow) return;

    const amountCtrl = this.incomeForm.get('amount');
    if (!amountCtrl) return;

    const existing = amountCtrl.value;
    if (existing !== '' && existing !== null && existing !== undefined && Number(existing) > 0) return;

    const prefill = this.data?.legacyInheritancePrefill;
    if (!prefill) return;

    const prefillAmount = isPartnerInheritanceApiDescription(apiDesc)
      ? prefill.partner
      : prefill.client;

    if (prefillAmount > 0) {
      amountCtrl.setValue(prefillAmount, { emitEvent: true });
    }
  }

  toggleNameEdit() {
    this.showNameEdit = !this.showNameEdit;
  }

  private applyDefaultStartEnd(incomeType: string): void {
    const startCtrl = this.incomeForm.get('start');
    const endCtrl = this.incomeForm.get('end');

    if (!startCtrl || !endCtrl) return;

    if (
      isClientSalaryApiDescription(incomeType) ||
      isPartnerSalaryApiDescription(incomeType)
    ) {
      const isPartnerSalary = isPartnerSalaryApiDescription(incomeType);
      this.updateSalaryRetirementDefaults(isPartnerSalary);
      if (!this.isEditWorkflow) {
        startCtrl.setValue(this.currentYear);
      }
      const retirementEvt = this.findRetirementAgeEventForPerson(isPartnerSalary);
      endCtrl.setValue(
        retirementEvt?.id ? 'event:' + retirementEvt.id : this.retirementYear,
      );
    } else if (
      isClientStatePensionApiDescription(incomeType) ||
      isPartnerStatePensionApiDescription(incomeType)
    ) {
      const isPartnerPension = isPartnerStatePensionApiDescription(incomeType);
      this.updateSalaryRetirementDefaults(isPartnerPension);
      startCtrl.setValue(this.retirementYear);
      endCtrl.setValue(this.forecastEndYear);
    } else if (incomeType === 'Inheritance' || incomeType === 'Inheritance (Partner)') {
      const isPartner = isPartnerInheritanceApiDescription(incomeType);
      this.applyBirthDateContextForSalaryPerson(isPartner);
      const inheritanceYear = this.getDefaultInheritanceStartYear();
      this.ensureYearInSelectableYears(inheritanceYear);
      if (!this.isEditWorkflow) {
        startCtrl.setValue(inheritanceYear);
      }
      endCtrl.setValue(inheritanceYear);
    } else {
      if (!this.isEditWorkflow) {
        startCtrl.reset();
        endCtrl.reset();
      }
    }

    startCtrl.updateValueAndValidity();
    endCtrl.updateValueAndValidity();
  }

  private getYearlyCycleId(): string {
    return this.cycles.find(c => c.description === 'Every year')?.id ?? '';
  }

  private resolvePlanEndYear(data: any): number {
    const planEndYear = Number(data?.planEndYear);
    if (Number.isFinite(planEndYear) && planEndYear > 0) {
      return planEndYear;
    }
    const fallback = Number(data?.forecastEndDateYear);
    if (Number.isFinite(fallback) && fallback > 0) {
      return fallback;
    }
    return new Date().getFullYear();
  }

  /**
   * Default one-off year for new Inheritance (client or partner row).
   * Call after `applyBirthDateContextForSalaryPerson` so `clientBirthYear` / `clientAge`
   * match the relevant person at forecast start.
   * Rule: default age60; if person is already 60+ at forecast start, default age = current age + 5.
   */
  private getDefaultInheritanceStartYear(): number {
    const forecastStartYear = Number(this.data?.forecastStartDateYear);
    const refYear =
      Number.isFinite(forecastStartYear) && forecastStartYear > 0
        ? forecastStartYear
        : this.currentYear;

    const birthYear = this.clientBirthYear;
    const ageAtForecastStart = this.clientAge;
    if (
      !Number.isFinite(birthYear) ||
      birthYear <= 0 ||
      !Number.isFinite(ageAtForecastStart)
    ) {
      return refYear + 5;
    }

    const targetAge =
      ageAtForecastStart >= 60 ? ageAtForecastStart + 5 : 60;
    return birthYear + targetAge;
  }

  /** Ensures the mat-select can bind and display the computed default year. */
  private ensureYearInSelectableYears(year: number): void {
    if (!Number.isFinite(year)) return;
    if (!this.years.includes(year)) {
      this.years.push(year);
      this.years.sort((a, b) => a - b);
    }
  }

  onBonusAmountInput(rawValue: string) {
    if (!rawValue || rawValue.trim() === '') {
      this.incomeForm.get('bonusAmount')?.setValue('', { emitEvent: true });
      return;
    }
    const value = parseFormattedNumber(rawValue, this.translate.currentLang);
    this.incomeForm.get('bonusAmount')?.setValue(value, { emitEvent: true });
  }

  get isBonusOneOff(): boolean {
    const bonusCycleId = this.incomeForm.get('bonusCycle')?.value;
    if (!bonusCycleId) return false;

    return this.cycles?.some(
      c => c.id === bonusCycleId && c.description === 'One-off'
    );
  }

  getAgeForYear(year: number): number {
    const birth = this.resolveBirthDateForAgeCalculations();
    const a = getProjectionColumnAgeLabel(
      birth,
      Number(year),
      this.data.forecastStartDate,
      this.data.planDuration,
      this.forecastEndYear,
    );
    return Number.isNaN(a) ? 0 : a;
  }

  getStartYear(): number {
    return resolveYear(this.incomeForm.get('start')?.value, this.eventsList);
  }

  getEndEvents(): any[] {
    const startYear = this.getStartYear();
    return (this.eventsList ?? []).filter((e: any) => (e?.start?.year ?? 0) >= startYear);
  }

  getEndYears(): number[] {
    const startYear = this.getStartYear();
    return (this.years ?? []).filter((y) => y >= startYear);
  }

  hasFormChanges(): boolean {
    return JSON.stringify(this.incomeForm.getRawValue()) !== this.initialFormSnapshot;
  }

  private captureInitialFormState(): void {
    this.initialFormSnapshot = JSON.stringify(this.incomeForm.getRawValue());
    this.incomeForm.markAsPristine();
  }

  /** Timeline labels are e.g. "Retirement Age {name}", not the literal "retirement age". */
  private eventNameIsRetirementAge(name: unknown): boolean {
    return (name ?? '')
      .toString()
      .trim()
      .toLowerCase()
      .startsWith('retirement age');
  }

  private findRetirementAgeEventForPerson(isPartner: boolean): any | null {
    const events = this.eventsList ?? [];
    return (
      events.find(
        (e: any) =>
          this.eventNameIsRetirementAge(e?.name) &&
          !!e?.isPartnerEvent === isPartner,
      ) ?? null
    );
  }

  /**
   * Sets clientBirthYear / clientAge for the person the income row belongs to
   * (main client vs partner), used for age labels and persisted age fields.
   */
  private applyBirthDateContextForSalaryPerson(usePartnerBirthDate: boolean): void {
    const birthDateToUse =
      usePartnerBirthDate && this.data.partnerBirthDate
        ? this.data.partnerBirthDate
        : this.data.clientBirthDate;
    this.clientBirthYear = moment(birthDateToUse).year();
    const birthDate = new Date(birthDateToUse);
    const forecastStart = this.data.forecastStartDate
      ? new Date(this.data.forecastStartDate)
      : new Date(this.data.forecastStartDateYear, 0, 1);
    this.clientAge = getCompletedYearsAgeAtDate(birthDate, forecastStart);
  }

  /**
   * Birth date used for age labels and persisted `age` fields for the current row.
   */
  private resolveBirthDateForAgeCalculations(): Date | string | null {
    const desc = (this.incomeForm.get('description')?.value ??
      this.selectedIncome?.description ??
      '') as string;

    if (isClientInheritanceApiDescription(desc)) {
      return this.data.clientBirthDate;
    }
    if (isPartnerInheritanceApiDescription(desc)) {
      return this.data.partnerBirthDate ?? this.data.clientBirthDate;
    }

    if (this.showPersonSelector && this.combinedEdit) {
      if (this.editingPerson === 'partner' && this.data.partnerBirthDate) {
        return this.data.partnerBirthDate;
      }
      return this.data.clientBirthDate;
    }

    if (
      isPartnerSalaryApiDescription(desc) ||
      isPartnerStatePensionApiDescription(desc)
    ) {
      return this.data.partnerBirthDate ?? this.data.clientBirthDate;
    }

    return this.data.clientBirthDate;
  }

  private refreshBirthContextFromCurrentDescription(): void {
    const desc = (this.incomeForm.get('description')?.value ?? '') as string;
    if (isPartnerSalaryApiDescription(desc)) {
      this.updateSalaryRetirementDefaults(true);
    } else if (isClientSalaryApiDescription(desc)) {
      this.updateSalaryRetirementDefaults(false);
    } else if (isPartnerStatePensionApiDescription(desc)) {
      this.updateSalaryRetirementDefaults(true);
    } else if (isClientStatePensionApiDescription(desc)) {
      this.updateSalaryRetirementDefaults(false);
    } else if (isPartnerInheritanceApiDescription(desc)) {
      this.applyBirthDateContextForSalaryPerson(true);
    } else if (isClientInheritanceApiDescription(desc)) {
      this.applyBirthDateContextForSalaryPerson(false);
    }
  }

  /**
   * Default retirement calendar year and timeline event for salary (and state pension start)
   * for the given person — matches timeline "Retirement Age …" chips, not a generic age.
   */
  private updateSalaryRetirementDefaults(isPartnerSalary: boolean): void {
    this.applyBirthDateContextForSalaryPerson(
      isPartnerSalary && !!this.data.partnerBirthDate,
    );
    const country = (this.data.clientCountryCode ?? '').toUpperCase();
    this.retirementAge = country === 'IT' || country === 'ITALY' ? 67 : 64;
    const evt = this.findRetirementAgeEventForPerson(isPartnerSalary);
    const y = Number(evt?.start?.year);
    this.retirementEventYear = Number.isFinite(y) && y > 0 ? y : null;
    this.retirementYear =
      this.retirementEventYear ?? this.clientBirthYear + this.retirementAge;
  }

  private setupBonusControlHandlers(): void {
    this.incomeForm.get('addBonus')?.valueChanges.subscribe(() => {
      this.syncBonusControlsState();
    });

    this.incomeForm.get('bonusCycle')?.valueChanges.subscribe(() => {
      this.syncBonusDateState();
    });

    this.incomeForm.get('description')?.valueChanges.subscribe(() => {
      this.syncBonusControlsState();
    });

    this.syncBonusControlsState();
  }

  private syncBonusControlsState(): void {
    const desc = this.incomeForm.get('description')?.value;
    const isSalary = isSalaryTypeForBonus(desc);
    const isBonusEnabled = !!this.incomeForm.get('addBonus')?.value;
    const bonusAmount = this.incomeForm.get('bonusAmount');
    const bonusCycle = this.incomeForm.get('bonusCycle');
    const bonusDate = this.incomeForm.get('bonusDate');

    if (!isSalary) {
      this.incomeForm.get('addBonus')?.setValue(false, { emitEvent: false });
      bonusAmount?.setValue(0, { emitEvent: false });
      bonusAmount?.disable({ emitEvent: false });
      bonusAmount?.clearValidators();

      bonusCycle?.setValue(this.getYearlyCycleId(), { emitEvent: false });
      bonusCycle?.clearValidators();

      bonusDate?.setValue(null, { emitEvent: false });
      bonusDate?.clearValidators();
      bonusDate?.updateValueAndValidity({ emitEvent: false });
      bonusAmount?.updateValueAndValidity({ emitEvent: false });
      bonusCycle?.updateValueAndValidity({ emitEvent: false });
      return;
    }

    if (isBonusEnabled) {
      bonusAmount?.enable({ emitEvent: false });
      bonusAmount?.setValidators([Validators.required, this.greaterThanZero()]);
      bonusCycle?.setValidators([Validators.required]);
    } else {
      bonusAmount?.setValue(0, { emitEvent: false });
      bonusAmount?.disable({ emitEvent: false });
      bonusAmount?.clearValidators();

      bonusCycle?.setValue(this.getYearlyCycleId(), { emitEvent: false });
      bonusCycle?.clearValidators();

      bonusDate?.setValue(null, { emitEvent: false });
      bonusDate?.clearValidators();
    }

    this.syncBonusDateState();
    bonusAmount?.updateValueAndValidity({ emitEvent: false });
    bonusCycle?.updateValueAndValidity({ emitEvent: false });
    bonusDate?.updateValueAndValidity({ emitEvent: false });
  }

  private setupInheritanceControlHandlers(): void {
    this.incomeForm.get('investThisAmount')?.valueChanges.subscribe(() => {
      this.syncInheritanceControlsState();
    });
    this.incomeForm.get('incomeType')?.valueChanges.subscribe(() => {
      this.syncInheritanceControlsState();
    });
    this.incomeForm.get('description')?.valueChanges.subscribe(() => {
      this.syncInheritanceControlsState();
    });
    this.syncInheritanceControlsState();
  }

  private setupOneOffStartEndSync(): void {
    this.incomeForm.get('start')?.valueChanges.subscribe((startVal) => {
      if (!this.showStartEnd && startVal != null) {
        this.incomeForm.get('end')?.setValue(startVal, { emitEvent: false });
        this.incomeForm.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  private syncInheritanceControlsState(): void {
    const isInheritance = this.getIsDefaultInheritance();
    const investChecked = !!this.incomeForm.get('investThisAmount')?.value;
    const targetPotCtrl = this.incomeForm.get('inheritanceTargetPotId');
    const percentCtrl = this.incomeForm.get('inheritancePercentToInvest');

    if (!isInheritance) {
      this.incomeForm.get('investThisAmount')?.setValue(false, { emitEvent: false });
      targetPotCtrl?.clearValidators();
      targetPotCtrl?.setValue(null, { emitEvent: false });
      percentCtrl?.clearValidators();
      percentCtrl?.setValue(80, { emitEvent: false });
    } else if (investChecked) {
      targetPotCtrl?.setValidators([Validators.required]);
      percentCtrl?.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
      this.setDefaultInheritanceSavingPot();
    } else {
      targetPotCtrl?.clearValidators();
      targetPotCtrl?.setValue(null, { emitEvent: false });
      percentCtrl?.clearValidators();
      percentCtrl?.setValue(80, { emitEvent: false });
    }
    targetPotCtrl?.updateValueAndValidity({ emitEvent: false });
    percentCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private setDefaultInheritanceSavingPot(): void {
    const targetPotCtrl = this.incomeForm.get('inheritanceTargetPotId');
    if (!targetPotCtrl || targetPotCtrl.value) return;

    const nonCashSavings = this.getNonCashSavingsForInheritance();
    const withValidId = nonCashSavings.filter((pot) => !!pot.id);
    if (!withValidId.length) return;

    let candidates = withValidId;
    if (withValidId.length > 1) {
      const usedPotIds = this.getExistingInheritanceContributionPotIds();
      if (usedPotIds.length > 0) {
        const unused = withValidId.filter(
          (pot) => pot.id && !usedPotIds.includes(pot.id)
        );
        if (unused.length > 0) {
          candidates = unused;
        }
      }
    }

    const defaultPot = this.getLargestPotForInheritance(candidates);
    const potToSelect = defaultPot?.id ? defaultPot : candidates[0];
    const potId = potToSelect?.id;
    if (!potId) return;

    if (this.clientSavings?.length && !this.clientSavings.some((pot) => pot.id === potId)) {
      return;
    }

    // Defer to next tick so mat-select is rendered after @if(isInvestThisAmountChecked) becomes true
    setTimeout(() => {
      if (!targetPotCtrl.value) {
        targetPotCtrl.setValue(potId);
      }
    }, 0);
  }

  onInvestThisAmountChange(event: MatCheckboxChange): void {
    // Only gate the action for default Inheritance.
    if (!this.getIsDefaultInheritance()) return;

    if (event.checked && !this.hasEligibleNonCashSavingPot()) {
      this.toastr.error(
        this.translate.instant('FLOWS.CREATE_SAVING_POT_FIRST'),
        this.translate.instant('LABEL.ERROR'),
        { timeOut: 5000 },
      );
      // Keep the control unchecked/inactive.
      this.incomeForm.get('investThisAmount')?.setValue(false, { emitEvent: true });
    }
  }

  private getNonCashSavingsForInheritance(): ClientSaving[] {
    // Use the full list so changes propagate without relying on the filtered copy.
    return (this.allSavingPots ?? []).filter((s) => !this.isCashSavingPotName(s?.name));
  }

  private getExistingInheritanceContributionPotIds(): string[] {
    return (this.existingContributions ?? [])
      .map((c: any) => c?.associatedSavingPotId)
      .filter((id: string | undefined): id is string => !!id);
  }

  /** For Pension fund: use contributionAmount as fallback when startingPotValue is 0 (common for new pensions) */
  private getLargestPotForInheritance(
    pots: ClientSaving[],
  ): { id: string | null } | null {
    if (!pots.length) return null;
    return pots.reduce((largest, pot) => {
      const potAmount = this.getEffectivePotValueForComparison(pot);
      const largestAmount = this.getEffectivePotValueForComparison(largest);
      return potAmount > largestAmount ? pot : largest;
    });
  }

  private getEffectivePotValueForComparison(pot: Pick<ClientSaving, 'name' | 'startingPotValue' | 'contributionAmount'>): number {
    const starting = Number(pot.startingPotValue?.amount ?? 0);
    if (starting > 0) return starting;
    const isPensionFund = (pot.name ?? '').toLowerCase() === 'pension fund';
    if (isPensionFund && (pot.contributionAmount ?? 0) > 0) {
      return Number(pot.contributionAmount ?? 0);
    }
    return starting;
  }

  get isInheritance(): boolean {
    return this.getIsDefaultInheritance();
  }

  /** Invest this amount checkbox only for default Inheritance type, not Custom with name "Inheritance" */
  private getIsDefaultInheritance(): boolean {
    const incomeType = this.incomeForm.get('incomeType')?.value;
    const description = this.incomeForm.get('description')?.value;
    if (this.isEditWorkflow) {
      return (isClientInheritanceApiDescription(description) ||
        isPartnerInheritanceApiDescription(description)) &&
        this.selectedIncome?.isDefault === true;
    }
    const apiDesc = this.displayLabelToApiDesc(incomeType ?? '');
    return isClientInheritanceApiDescription(apiDesc) || isPartnerInheritanceApiDescription(apiDesc);
  }

  private hasEligibleNonCashSavingPot(): boolean {
    return this.getNonCashSavingsForInheritance().some((p) => !!p?.id);
  }

  getSavingPotSelectLabel(saving: {
    name: string;
    ownership?: number | null;
  }): string {
    return formatSavingPotSelectLabel(
      { name: saving.name, ownership: saving.ownership },
      this.selectedClient,
      this.translate,
    );
  }

  private isCashSavingPotName(name: unknown): boolean {
    return (name ?? '')
      .toString()
      .trim()
      .toLowerCase() === 'cash';
  }

  get isInvestThisAmountChecked(): boolean {
    return !!this.incomeForm.get('investThisAmount')?.value;
  }

  private greaterThanZero(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = Number(control.value);
      if (control.value === '' || control.value === null || control.value === undefined) return null;
      return value > 0 ? null : { greaterThanZero: true };
    };
  }

  private syncBonusDateState(): void {
    const desc = this.incomeForm.get('description')?.value;
    const isSalary = isSalaryTypeForBonus(desc);
    const isBonusEnabled = !!this.incomeForm.get('addBonus')?.value;
    const bonusDateCtrl = this.incomeForm.get('bonusDate');
    const cycleId = this.incomeForm.get('bonusCycle')?.value;
    const cycle = this.cycles.find(c => c.id === cycleId);

    if (isSalary && isBonusEnabled && cycle?.description === 'One-off') {
      bonusDateCtrl?.setValidators([Validators.required]);

      if (!bonusDateCtrl?.value) {
        const existingYear = this.selectedIncome?.bonus?.bonusDate?.year;
        if (existingYear) {
          bonusDateCtrl?.setValue(existingYear, { emitEvent: false });
        }
      }
    } else {
      bonusDateCtrl?.clearValidators();
      bonusDateCtrl?.setValue(null, { emitEvent: false });
    }

    bonusDateCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  onPercentToInvestSliderInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = Number(inputElement.value);
    const val = isNaN(value) ? 80 : Math.min(100, Math.max(1, Math.round(value)));
    this.incomeForm.get('inheritancePercentToInvest')?.setValue(val, { emitEvent: true });
  }

  onPercentToInvestInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const num = Number(raw);
    const val = isNaN(num) ? 80 : Math.min(100, Math.max(1, Math.round(num)));
    this.incomeForm.get('inheritancePercentToInvest')?.setValue(val, { emitEvent: true });
  }

}
