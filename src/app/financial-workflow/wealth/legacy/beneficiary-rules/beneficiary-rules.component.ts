import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';
import { LegacyHttpService } from '../services/legacy-http.service';
import {
  LegacyDashboardModel,
  FamilyMemberModel,
  ScenarioType,
  BeneficiaryRecipientRequest
} from '../models/legacy.model';

interface ScenarioTab {
  type: ScenarioType;
  label: string;
}

interface RecipientRow {
  memberId: string;
  percentage: number;
}

@Component({
  selector: 'app-beneficiary-rules',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatSliderModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './beneficiary-rules.component.html',
  styleUrl: './beneficiary-rules.component.scss'
})
export class BeneficiaryRulesComponent {
  scenarios: ScenarioTab[] = [];
  activeScenario: ScenarioTab | null = null;
  recipients: RecipientRow[] = [];
  isSaving = false;

  constructor(
    private legacyHttp: LegacyHttpService,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<BeneficiaryRulesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      cashflowId: string;
      dashboard: LegacyDashboardModel;
    }
  ) {
    this.buildScenarioTabs();
    if (this.scenarios.length > 0) {
      this.selectScenario(this.scenarios[0]);
    }
  }

  get allMembers(): FamilyMemberModel[] {
    return this.data.dashboard?.familyMembers ?? [];
  }

  /** Coerce slider/input model values to numbers (ngModel can yield strings). */
  private parsePct(value: unknown): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  get totalPercentage(): number {
    return this.recipients.reduce((sum, r) => sum + this.parsePct(r.percentage), 0);
  }

  get isValid(): boolean {
    if (this.recipients.length === 0) {
      return false;
    }
    if (!this.recipients.every(r => !!r.memberId?.trim())) {
      return false;
    }
    return Math.abs(this.totalPercentage - 100) < 0.01;
  }

  /** True when every eligible member already has a row but allocations do not total 100%. */
  get showAdjustPercentagesHint(): boolean {
    return !this.canAddRecipient && !this.isValid && this.recipients.length > 0;
  }

  /** Only one beneficiary → they always receive 100%; no split to edit. */
  get canEditPercentSplit(): boolean {
    return this.recipients.length > 1;
  }

  get eligibleMembers(): FamilyMemberModel[] {
    if (!this.activeScenario) return [];
    return this.getEligibleMembers(this.activeScenario.type);
  }

  get canAddRecipient(): boolean {
    const selectedIds = new Set(this.recipients.map(r => r.memberId).filter(id => !!id));
    return this.eligibleMembers.some(m => !selectedIds.has(m.id));
  }

  getAvailableMembersForRow(rowIndex: number): FamilyMemberModel[] {
    const selectedInOtherRows = new Set(
      this.recipients
        .filter((_, i) => i !== rowIndex)
        .map(r => r.memberId)
        .filter(id => !!id)
    );
    return this.eligibleMembers.filter(m => !selectedInOtherRows.has(m.id));
  }

  private buildScenarioTabs(): void {
    const d = this.data.dashboard;
    const tabs: ScenarioTab[] = [];

    const clientName = d.familyMembers.find(m => m.role === 'Client')?.firstName ?? 'Client';
    const partnerName = d.familyMembers.find(m => m.role === 'Partner')?.firstName ?? 'Partner';

    tabs.push({ type: ScenarioType.ClientDies, label: `If ${clientName} dies` });

    if (d.hasPartner) {
      tabs.push({ type: ScenarioType.PartnerDies, label: `If ${partnerName} dies` });
      tabs.push({ type: ScenarioType.BothDie, label: 'If both die' });
    }

    if (d.familyMembers.some(m => m.role === 'ClientFather' || m.role === 'ClientMother')) {
      tabs.push({ type: ScenarioType.ClientParentsDie, label: `If ${clientName}'s parents die` });
    }

    if (d.hasPartner && d.familyMembers.some(m => m.role === 'PartnerFather' || m.role === 'PartnerMother')) {
      tabs.push({ type: ScenarioType.PartnerParentsDie, label: `If ${partnerName}'s parents die` });
    }

    this.scenarios = tabs;
  }

  selectScenario(tab: ScenarioTab): void {
    this.activeScenario = tab;
    const existing = this.data.dashboard.beneficiaryRules.find(
      r => r.scenario === ScenarioType[tab.type]
    );

    if (existing) {
      this.recipients = existing.recipients.map(r => ({
        memberId: r.memberId,
        percentage: r.percentage
      }));
      if (this.recipients.length === 1) {
        this.recipients[0].percentage = 100;
      }
    } else {
      this.recipients = [];
    }
  }

  addRecipient(): void {
    this.recipients.push({ memberId: '', percentage: 0 });
    this.rebalancePercentagesAfterRowCountChange();
  }

  removeRecipient(index: number): void {
    this.recipients.splice(index, 1);
    this.rebalancePercentagesAfterRowCountChange();
  }

  /**
   * Keeps the total at 100% when the user moves a slider or edits a % field.
   * Leading rows (all but the last) are edited freely within [0,100]; the last row absorbs the remainder.
   * Editing the last row adjusts the second-to-last row instead.
   */
  onRecipientPercentageChange(changedIndex: number): void {
    const n = this.recipients.length;
    if (n === 0) {
      return;
    }
    if (n === 1) {
      this.recipients[0].percentage = 100;
      return;
    }

    const clampPct = (x: unknown) => {
      const v = Math.round(this.parsePct(x));
      return Math.max(0, Math.min(100, v));
    };

    if (changedIndex === n - 1) {
      const sumBeforePrev = this.recipients
        .slice(0, n - 2)
        .reduce((s, r) => s + clampPct(r.percentage), 0);
      let lastVal = clampPct(this.recipients[n - 1].percentage);
      const maxLast = Math.max(0, 100 - sumBeforePrev);
      lastVal = Math.min(lastVal, maxLast);
      this.recipients[n - 1].percentage = lastVal;
      this.recipients[n - 2].percentage = 100 - sumBeforePrev - lastVal;
    } else {
      const othersSum = this.recipients
        .slice(0, n - 1)
        .filter((_, i) => i !== changedIndex)
        .reduce((s, r) => s + clampPct(r.percentage), 0);
      const maxVal = Math.max(0, 100 - othersSum);
      let v = clampPct(this.recipients[changedIndex].percentage);
      v = Math.min(v, maxVal);
      this.recipients[changedIndex].percentage = v;
      const sumFirst = this.recipients
        .slice(0, n - 1)
        .reduce((s, r) => s + clampPct(r.percentage), 0);
      this.recipients[n - 1].percentage = 100 - sumFirst;
    }
  }

  /** After add/remove row, keep a valid 100% split without wiping member picks. */
  private rebalancePercentagesAfterRowCountChange(): void {
    const n = this.recipients.length;
    if (n === 0) {
      return;
    }
    if (n === 1) {
      this.recipients[0].percentage = 100;
      return;
    }
    const sumFirst = this.recipients
      .slice(0, n - 1)
      .reduce((s, r) => s + Math.round(this.parsePct(r.percentage)), 0);
    this.recipients[n - 1].percentage = Math.max(0, Math.min(100, 100 - sumFirst));
  }

  getMemberName(memberId: string): string {
    const m = this.allMembers.find(mem => mem.id === memberId);
    return m ? `${m.firstName} ${m.lastName}`.trim() : '';
  }

  onSave(): void {
    if (!this.activeScenario || !this.isValid) return;

    this.isSaving = true;
    this.legacyHttp.saveBeneficiaryRule(this.data.cashflowId, {
      scenario: this.activeScenario.type,
      recipients: this.recipients.map(r => ({
        memberId: r.memberId,
        percentage: this.parsePct(r.percentage)
      }))
    }).subscribe({
      next: (dashboard) => {
        this.data.dashboard = dashboard;
        this.toastr.success('Beneficiary rule saved', 'Success');
        // Close while overlay is still shown; exit animation is disabled on open so
        // the user lands on Legacy without a visible dialog dismiss.
        this.dialogRef.close({ dashboard: this.data.dashboard });
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Failed to save rule', 'Error');
        this.isSaving = false;
      }
    });
  }

  onDeleteRule(): void {
    if (!this.activeScenario) return;
    this.legacyHttp.deleteBeneficiaryRule(this.data.cashflowId, this.activeScenario.type).subscribe({
      next: (dashboard) => {
        this.data.dashboard = dashboard;
        this.recipients = [];
        this.toastr.success('Rule deleted, defaults will apply', 'Success');
      },
      error: () => this.toastr.error('Failed to delete rule', 'Error')
    });
  }

  onClose(): void {
    this.dialogRef.close({ dashboard: this.data.dashboard });
  }

  private getEligibleMembers(scenario: ScenarioType): FamilyMemberModel[] {
    const members = this.allMembers;
    switch (scenario) {
      case ScenarioType.ClientDies:
        return members.filter(m =>
          m.role === 'Partner' || m.role === 'Child' || m.role === 'ClientSibling');
      case ScenarioType.PartnerDies:
        return members.filter(m =>
          m.role === 'Client' || m.role === 'Child' || m.role === 'PartnerSibling');
      case ScenarioType.BothDie:
        return members.filter(m =>
          m.role === 'Child' || m.role === 'ClientSibling' || m.role === 'PartnerSibling');
      case ScenarioType.ClientParentsDie:
        return members.filter(m =>
          m.role === 'Client' || m.role === 'ClientSibling');
      case ScenarioType.PartnerParentsDie:
        return members.filter(m =>
          m.role === 'Partner' || m.role === 'PartnerSibling');
      default:
        return [];
    }
  }
}
