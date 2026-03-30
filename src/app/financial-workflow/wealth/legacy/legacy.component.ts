import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { Client, Details } from 'src/app/clients/models/client';
import { LegacyHttpService } from './services/legacy-http.service';
import {
  LegacyDashboardModel,
  FamilyMemberModel,
  ScenarioResultModel,
  ScenarioType,
  FamilyRole,
  FAMILY_ROLE_LABELS
} from './models/legacy.model';
import { AddMemberComponent } from './add-member/add-member.component';
import { BeneficiaryRulesComponent } from './beneficiary-rules/beneficiary-rules.component';
import { TaxSettingsComponent } from './tax-settings/tax-settings.component';
import { EditParentEstateComponent } from './edit-parent-estate/edit-parent-estate.component';

@Component({
  selector: 'app-legacy',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    CurrencySymbolPipe
  ],
  templateUrl: './legacy.component.html',
  styleUrl: './legacy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyComponent implements OnInit, OnChanges {
  @Input() cashflowId!: string;
  @Input() clientData: Details | null = null;
  @Input() selectedClient: Client | null = null;

  isLoading = false;
  dashboard: LegacyDashboardModel | null = null;
  activeScenario: ScenarioType | null = null;
  scenarioResult: ScenarioResultModel | null = null;
  markedDeceased = new Set<string>();

  constructor(
    private legacyHttp: LegacyHttpService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cashflowId'] && !changes['cashflowId'].firstChange) {
      this.loadDashboard();
    }
  }

  // ── Tree Layout Helpers ────────────────────────────────────────

  get clientMember(): FamilyMemberModel | undefined {
    return this.dashboard?.familyMembers.find(m => m.role === 'Client');
  }

  get partnerMember(): FamilyMemberModel | undefined {
    return this.dashboard?.familyMembers.find(m => m.role === 'Partner');
  }

  get clientParents(): FamilyMemberModel[] {
    return this.dashboard?.familyMembers.filter(m =>
      m.role === 'ClientFather' || m.role === 'ClientMother') ?? [];
  }

  get partnerParents(): FamilyMemberModel[] {
    return this.dashboard?.familyMembers.filter(m =>
      m.role === 'PartnerFather' || m.role === 'PartnerMother') ?? [];
  }

  get clientSiblings(): FamilyMemberModel[] {
    return this.dashboard?.familyMembers.filter(m => m.role === 'ClientSibling') ?? [];
  }

  get partnerSiblings(): FamilyMemberModel[] {
    return this.dashboard?.familyMembers.filter(m => m.role === 'PartnerSibling') ?? [];
  }

  get children(): FamilyMemberModel[] {
    return this.dashboard?.familyMembers.filter(m => m.role === 'Child') ?? [];
  }

  get otherMembers(): FamilyMemberModel[] {
    return this.dashboard?.familyMembers.filter(m => m.role === 'Other') ?? [];
  }

  get hasPartner(): boolean {
    return this.dashboard?.hasPartner ?? false;
  }

  get showClientBranch(): boolean {
    return this.clientParents.length > 0 || this.clientSiblings.length > 0;
  }

  get showPartnerBranch(): boolean {
    return this.partnerParents.length > 0 || this.partnerSiblings.length > 0;
  }

  get currency(): string {
    return this.clientData?.preferredCurrency ?? 'USD';
  }

  // ── Scenario Helpers ───────────────────────────────────────────

  isDeceased(memberId: string): boolean {
    return this.markedDeceased.has(memberId);
  }

  getMemberInheritance(memberId: string) {
    return this.scenarioResult?.beneficiaryShares?.find(s => s.memberId === memberId);
  }

  getMemberBaseAmount(member: FamilyMemberModel): number {
    if (member.role === 'Client') return this.dashboard?.clientNetWorth ?? 0;
    if (member.role === 'Partner') return this.dashboard?.partnerNetWorth ?? 0;
    return 0;
  }

  isScenarioActive(scenario: ScenarioType): boolean {
    return this.activeScenario === scenario;
  }

  // ── Actions ────────────────────────────────────────────────────

  loadDashboard(): void {
    if (!this.cashflowId) return;
    this.isLoading = true;
    this.legacyHttp.getDashboard(this.cashflowId).subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastr.error('Failed to load legacy data', 'Error');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  selectScenario(scenario: ScenarioType): void {
    const ids = this.getScenarioMemberIds(scenario);
    const allAlreadyMarked = ids.length > 0 && ids.every(id => this.markedDeceased.has(id));

    if (allAlreadyMarked) {
      ids.forEach(id => this.markedDeceased.delete(id));

      const remainingScenario = this.resolveScenarioFromDeceased();

      if (remainingScenario) {
        this.activeScenario = remainingScenario;
        this.legacyHttp.simulateScenario(this.cashflowId, remainingScenario).subscribe({
          next: (result) => {
            this.scenarioResult = result;
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.toastr.error(err?.error?.message || 'Failed to simulate scenario', 'Error');
            this.activeScenario = null;
            this.scenarioResult = null;
            this.markedDeceased.clear();
            this.cdr.markForCheck();
          }
        });
      } else {
        this.activeScenario = null;
        this.scenarioResult = null;
        this.cdr.markForCheck();
      }
      return;
    }

    ids.forEach(id => this.markedDeceased.add(id));

    const effectiveScenario = this.resolveScenarioFromDeceased() ?? scenario;

    this.activeScenario = effectiveScenario;
    this.legacyHttp.simulateScenario(this.cashflowId, effectiveScenario).subscribe({
      next: (result) => {
        this.scenarioResult = result;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Failed to simulate scenario', 'Error');
        ids.forEach(id => this.markedDeceased.delete(id));
        if (this.markedDeceased.size === 0) {
          this.activeScenario = null;
          this.scenarioResult = null;
        }
        this.cdr.markForCheck();
      }
    });
  }

  private resolveScenarioFromDeceased(): ScenarioType | null {
    if (this.markedDeceased.size === 0) return null;

    const clientId = this.clientMember?.id;
    const partnerId = this.partnerMember?.id;
    const clientDead = !!clientId && this.markedDeceased.has(clientId);
    const partnerDead = !!partnerId && this.markedDeceased.has(partnerId);

    if (clientDead && partnerDead) return ScenarioType.BothDie;
    if (clientDead) return ScenarioType.ClientDies;
    if (partnerDead) return ScenarioType.PartnerDies;

    const allClientParentsDead = this.clientParents.length > 0
      && this.clientParents.every(p => this.markedDeceased.has(p.id));
    if (allClientParentsDead) return ScenarioType.ClientParentsDie;

    const allPartnerParentsDead = this.partnerParents.length > 0
      && this.partnerParents.every(p => this.markedDeceased.has(p.id));
    if (allPartnerParentsDead) return ScenarioType.PartnerParentsDie;

    return null;
  }

  private getScenarioMemberIds(scenario: ScenarioType): string[] {
    const members = this.dashboard?.familyMembers ?? [];
    switch (scenario) {
      case ScenarioType.ClientDies:
        return members.filter(m => m.role === 'Client').map(m => m.id);
      case ScenarioType.PartnerDies:
        return members.filter(m => m.role === 'Partner').map(m => m.id);
      case ScenarioType.BothDie:
        return members.filter(m => m.role === 'Client' || m.role === 'Partner').map(m => m.id);
      case ScenarioType.ClientParentsDie:
        return members.filter(m => m.role === 'ClientFather' || m.role === 'ClientMother').map(m => m.id);
      case ScenarioType.PartnerParentsDie:
        return members.filter(m => m.role === 'PartnerFather' || m.role === 'PartnerMother').map(m => m.id);
      default:
        return [];
    }
  }

  onClickParentMember(member: FamilyMemberModel): void {
    const memberId = member.id;

    if (this.markedDeceased.has(memberId)) {
      this.markedDeceased.delete(memberId);
    } else {
      this.markedDeceased.add(memberId);
    }

    const isClientSide = member.role === 'ClientFather' || member.role === 'ClientMother';
    const scenario = isClientSide ? ScenarioType.ClientParentsDie : ScenarioType.PartnerParentsDie;
    const parentMembers = isClientSide ? this.clientParents : this.partnerParents;

    const allParentsDead = parentMembers.length > 0
      && parentMembers.every(p => this.markedDeceased.has(p.id));

    if (allParentsDead) {
      this.activeScenario = scenario;
      this.legacyHttp.simulateScenario(this.cashflowId, scenario).subscribe({
        next: (result) => {
          this.scenarioResult = result;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.toastr.error(err?.error?.message || 'Failed to simulate scenario', 'Error');
          parentMembers.forEach(p => this.markedDeceased.delete(p.id));
          this.activeScenario = null;
          this.scenarioResult = null;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.activeScenario = null;
      this.scenarioResult = null;
      this.cdr.markForCheck();
    }
  }

  onClickClient(): void {
    this.selectScenario(ScenarioType.ClientDies);
  }

  onClickPartner(): void {
    this.selectScenario(ScenarioType.PartnerDies);
  }

  onClickCouple(): void {
    this.selectScenario(ScenarioType.BothDie);
  }

  onAddMember(): void {
    const dialogRef = this.dialog.open(AddMemberComponent, {
      width: '450px',
      disableClose: true,
      data: {
        cashflowId: this.cashflowId,
        hasPartner: this.hasPartner,
        existingMembers: this.dashboard?.familyMembers ?? [],
        clientFirstName: this.clientMember?.firstName ?? '',
        partnerFirstName: this.partnerMember?.firstName ?? '',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.dashboard) {
        this.dashboard = result.dashboard;
        this.clearScenario();
      }
    });
  }

  onRemoveMember(member: FamilyMemberModel): void {
    this.legacyHttp.removeFamilyMember(this.cashflowId, member.id).subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.clearScenario();
        this.toastr.success('Member removed', 'Success');
      },
      error: () => this.toastr.error('Failed to remove member', 'Error')
    });
  }

  onEditParentEstate(side: 'client' | 'partner'): void {
    const current = side === 'client'
      ? this.dashboard?.parentEstates?.clientParentsNetWorth ?? 0
      : this.dashboard?.parentEstates?.partnerParentsNetWorth ?? 0;

    const dialogRef = this.dialog.open(EditParentEstateComponent, {
      width: '400px',
      disableClose: true,
      data: {
        cashflowId: this.cashflowId,
        side,
        currentValue: current,
        currency: this.currency
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.dashboard) {
        this.dashboard = result.dashboard;
        this.clearScenario();
      }
    });
  }

  onOpenBeneficiaryRules(): void {
    const dialogRef = this.dialog.open(BeneficiaryRulesComponent, {
      width: '600px',
      disableClose: true,
      data: {
        cashflowId: this.cashflowId,
        dashboard: this.dashboard
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.dashboard) {
        this.dashboard = result.dashboard;
        this.clearScenario();
      }
    });
  }

  onOpenTaxSettings(): void {
    const dialogRef = this.dialog.open(TaxSettingsComponent, {
      width: '450px',
      disableClose: true,
      data: {
        cashflowId: this.cashflowId,
        taxSettings: this.dashboard?.taxSettings
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.dashboard) {
        this.dashboard = result.dashboard;
        this.clearScenario();
      }
    });
  }

  private clearScenario(): void {
    this.activeScenario = null;
    this.scenarioResult = null;
    this.markedDeceased.clear();
    this.cdr.markForCheck();
  }
}
