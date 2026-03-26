import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatInputModule } from '@angular/material/input';
import { ToastrService } from 'ngx-toastr';
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
    CommonModule, FormsModule, MatDialogModule,
    MatFormFieldModule, MatSelectModule, MatIconModule,
    MatSliderModule, MatInputModule
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

  get totalPercentage(): number {
    return this.recipients.reduce((sum, r) => sum + (r.percentage || 0), 0);
  }

  get isValid(): boolean {
    return this.recipients.length > 0 && Math.abs(this.totalPercentage - 100) < 0.01;
  }

  get eligibleMembers(): FamilyMemberModel[] {
    if (!this.activeScenario) return [];
    return this.getEligibleMembers(this.activeScenario.type);
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
    } else {
      this.recipients = [];
    }
  }

  addRecipient(): void {
    this.recipients.push({ memberId: '', percentage: 0 });
  }

  removeRecipient(index: number): void {
    this.recipients.splice(index, 1);
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
        percentage: r.percentage
      }))
    }).subscribe({
      next: (dashboard) => {
        this.data.dashboard = dashboard;
        this.toastr.success('Beneficiary rule saved', 'Success');
        this.isSaving = false;
        this.selectScenario(this.activeScenario!);
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
