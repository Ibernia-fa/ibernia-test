import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  OnChanges,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { Client, Details } from 'src/app/clients/models/client';
import { LegacyHttpService } from './services/legacy-http.service';
import {
  LegacyDashboardModel,
  FamilyMemberModel,
  ScenarioResultModel,
  ScenarioType,
  FamilyRole,
  FAMILY_ROLE_LABELS,
} from './models/legacy.model';
import { AddMemberComponent } from './add-member/add-member.component';
import { BeneficiaryRulesComponent } from './beneficiary-rules/beneficiary-rules.component';
import { TaxSettingsComponent } from './tax-settings/tax-settings.component';
import { EditParentEstateComponent } from './edit-parent-estate/edit-parent-estate.component';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
import { Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import * as ClientActions from 'src/app/store/client/client.actions';

@Component({
  selector: 'app-legacy',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    CurrencySymbolPipe,
    TranslateModule,
  ],
  templateUrl: './legacy.component.html',
  styleUrl: './legacy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyComponent
  implements OnInit, OnChanges, AfterViewChecked, OnDestroy
{
  @Input() cashflowId!: string;
  @Input() clientData: Details | null = null;
  @Input() selectedClient: Client | null = null;

  @ViewChild('treeBody') treeBodyRef?: ElementRef<HTMLElement>;
  @ViewChild('clientAvatar') clientAvatarRef?: ElementRef<HTMLElement>;
  @ViewChild('partnerAvatar') partnerAvatarRef?: ElementRef<HTMLElement>;
  @ViewChild('coupleLine') coupleLineRef?: ElementRef<HTMLElement>;
  @ViewChild('coupleLink') coupleLinkRef?: ElementRef<HTMLElement>;
  @ViewChild('clientMainNode') clientMainNodeRef?: ElementRef<HTMLElement>;
  @ViewChild('partnerMainNode') partnerMainNodeRef?: ElementRef<HTMLElement>;
  @ViewChild('clientParentsPair') clientParentsPairRef?: ElementRef<HTMLElement>;
  @ViewChild('partnerParentsPair') partnerParentsPairRef?: ElementRef<HTMLElement>;
  @ViewChild('clientParentsLine') clientParentsLineRef?: ElementRef<HTMLElement>;
  @ViewChild('partnerParentsLine') partnerParentsLineRef?: ElementRef<HTMLElement>;
  @ViewChild('clientBranchParents') clientBranchParentsRef?: ElementRef<HTMLElement>;
  @ViewChild('partnerBranchParents') partnerBranchParentsRef?: ElementRef<HTMLElement>;
  @ViewChild('clientHeartEstateLine') clientHeartEstateLineRef?: ElementRef<HTMLElement>;
  @ViewChild('partnerHeartEstateLine') partnerHeartEstateLineRef?: ElementRef<HTMLElement>;
  @ViewChild('familyTree') familyTreeRef?: ElementRef<HTMLElement>;
  @ViewChild('childrenSection') childrenSectionRef?: ElementRef<HTMLElement>;
  @ViewChild('heartChildrenLine') heartChildrenLineRef?: ElementRef<HTMLElement>;
  @ViewChild('clientBranch') clientBranchRef?: ElementRef<HTMLElement>;
  @ViewChild('partnerBranch') partnerBranchRef?: ElementRef<HTMLElement>;

  isLoading = false;
  dashboard: LegacyDashboardModel | null = null;
  activeScenario: ScenarioType | null = null;
  scenarioResult: ScenarioResultModel | null = null;
  markedDeceased = new Set<string>();

  private rafId: number | null = null;
  private mutationObs?: MutationObserver;
  private resizeObs?: ResizeObserver;
  private observedElement?: HTMLElement;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private legacyHttp: LegacyHttpService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private ngZone: NgZone,
    private settingsService: SettingsService,
    private store: Store,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.settingsService.profileChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.cashflowId) {
          this.clearScenario();
          this.loadDashboard();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.mutationObs?.disconnect();
    this.resizeObs?.disconnect();
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  ngAfterViewChecked(): void {
    this.ensureTreeObserver();
    this.scheduleLineUpdate();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.scheduleLineUpdate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cashflowId'] && !changes['cashflowId'].firstChange) {
      this.loadDashboard();
    }
  }

  // ── Tree Layout Helpers ────────────────────────────────────────

  get clientMember(): FamilyMemberModel | undefined {
    return this.dashboard?.familyMembers.find((m) => m.role === 'Client');
  }

  get partnerMember(): FamilyMemberModel | undefined {
    return this.dashboard?.familyMembers.find((m) => m.role === 'Partner');
  }

  get clientParents(): FamilyMemberModel[] {
    return (
      this.dashboard?.familyMembers.filter(
        (m) => m.role === 'ClientFather' || m.role === 'ClientMother',
      ) ?? []
    );
  }

  get partnerParents(): FamilyMemberModel[] {
    return (
      this.dashboard?.familyMembers.filter(
        (m) => m.role === 'PartnerFather' || m.role === 'PartnerMother',
      ) ?? []
    );
  }

  get clientSiblings(): FamilyMemberModel[] {
    return (
      this.dashboard?.familyMembers.filter((m) => m.role === 'ClientSibling') ??
      []
    );
  }

  get partnerSiblings(): FamilyMemberModel[] {
    return (
      this.dashboard?.familyMembers.filter(
        (m) => m.role === 'PartnerSibling',
      ) ?? []
    );
  }

  get children(): FamilyMemberModel[] {
    return (
      this.dashboard?.familyMembers.filter((m) => m.role === 'Child') ?? []
    );
  }

  get otherMembers(): FamilyMemberModel[] {
    return (
      this.dashboard?.familyMembers.filter((m) => m.role === 'Other') ?? []
    );
  }

  get hasPartner(): boolean {
    return this.dashboard?.hasPartner ?? false;
  }

  /** Includes tree-only (questionnaire) partner before client profile is completed. */
  get treeHasPartner(): boolean {
    return this.hasPartner || !!this.partnerMember;
  }

  /**
   * Questionnaire can add partner-branch relatives while the plan is still single-client
   * (placeholder partner only). Those members cannot be removed or used in partner scenarios
   * until the formal partner profile exists.
   */
  get partnerSideRelativesLocked(): boolean {
    return this.treeHasPartner && !this.hasPartner;
  }

  get familyBranchUseFlexGrow(): boolean {
    if (!this.dashboard) return true;
    if (!this.treeHasPartner) return true;
    const hasExtraMembers =
      this.clientParents.length > 0 ||
      this.partnerParents.length > 0 ||
      this.clientSiblings.length > 0 ||
      this.partnerSiblings.length > 0 ||
      this.children.length > 0 ||
      this.otherMembers.length > 0;
    return hasExtraMembers;
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

  get showTaxOnClientBranch(): boolean {
    return (
      this.activeScenario === ScenarioType.ClientParentsDie &&
      !!this.scenarioResult &&
      this.scenarioResult.totalTax > 0
    );
  }

  get showTaxOnPartnerBranch(): boolean {
    return (
      this.activeScenario === ScenarioType.PartnerParentsDie &&
      !!this.scenarioResult &&
      this.scenarioResult.totalTax > 0
    );
  }

  get showTaxOnChildrenSection(): boolean {
    return (
      this.activeScenario === ScenarioType.BothDie &&
      !!this.scenarioResult &&
      this.scenarioResult.totalTax > 0
    );
  }

  get isOnlyClientDeceased(): boolean {
    return this.activeScenario === ScenarioType.ClientDies;
  }

  get isOnlyPartnerDeceased(): boolean {
    return this.activeScenario === ScenarioType.PartnerDies;
  }

  get showTaxOnCoupleLink(): boolean {
    return (
      (this.activeScenario === ScenarioType.ClientDies ||
        this.activeScenario === ScenarioType.PartnerDies) &&
      !!this.scenarioResult &&
      this.scenarioResult.totalTax > 0
    );
  }

  // ── Scenario Helpers ───────────────────────────────────────────

  isDeceased(memberId: string): boolean {
    return this.markedDeceased.has(memberId);
  }

  getMemberInheritance(memberId: string) {
    return this.scenarioResult?.beneficiaryShares?.find(
      (s) => s.memberId === memberId,
    );
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
      },
    });
  }

  selectScenario(scenario: ScenarioType): void {
    const ids = this.getScenarioMemberIds(scenario);
    const allAlreadyMarked =
      ids.length > 0 && ids.every((id) => this.markedDeceased.has(id));

    if (allAlreadyMarked) {
      ids.forEach((id) => this.markedDeceased.delete(id));

      const remainingScenario = this.resolveScenarioFromDeceased();

      if (remainingScenario) {
        this.activeScenario = remainingScenario;
        this.legacyHttp
          .simulateScenario(this.cashflowId, remainingScenario)
          .subscribe({
            next: (result) => {
              this.scenarioResult = result;
              this.cdr.markForCheck();
            },
            error: (err) => {
              this.toastr.error(
                err?.error?.message || 'Failed to simulate scenario',
                'Error',
              );
              this.activeScenario = null;
              this.scenarioResult = null;
              this.markedDeceased.clear();
              this.cdr.markForCheck();
            },
          });
      } else {
        this.activeScenario = null;
        this.scenarioResult = null;
        this.cdr.markForCheck();
      }
      return;
    }

    ids.forEach((id) => this.markedDeceased.add(id));

    const effectiveScenario = this.resolveScenarioFromDeceased() ?? scenario;

    this.activeScenario = effectiveScenario;
    this.legacyHttp
      .simulateScenario(this.cashflowId, effectiveScenario)
      .subscribe({
        next: (result) => {
          this.scenarioResult = result;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.toastr.error(
            err?.error?.message || 'Failed to simulate scenario',
            'Error',
          );
          ids.forEach((id) => this.markedDeceased.delete(id));
          if (this.markedDeceased.size === 0) {
            this.activeScenario = null;
            this.scenarioResult = null;
          }
          this.cdr.markForCheck();
        },
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

    const allClientParentsDead =
      this.clientParents.length > 0 &&
      this.clientParents.every((p) => this.markedDeceased.has(p.id));
    if (allClientParentsDead) return ScenarioType.ClientParentsDie;

    const allPartnerParentsDead =
      this.partnerParents.length > 0 &&
      this.partnerParents.every((p) => this.markedDeceased.has(p.id));
    if (allPartnerParentsDead) return ScenarioType.PartnerParentsDie;

    return null;
  }

  private getScenarioMemberIds(scenario: ScenarioType): string[] {
    const members = this.dashboard?.familyMembers ?? [];
    switch (scenario) {
      case ScenarioType.ClientDies:
        return members.filter((m) => m.role === 'Client').map((m) => m.id);
      case ScenarioType.PartnerDies:
        return members.filter((m) => m.role === 'Partner').map((m) => m.id);
      case ScenarioType.BothDie:
        return members
          .filter((m) => m.role === 'Client' || m.role === 'Partner')
          .map((m) => m.id);
      case ScenarioType.ClientParentsDie:
        return members
          .filter((m) => m.role === 'ClientFather' || m.role === 'ClientMother')
          .map((m) => m.id);
      case ScenarioType.PartnerParentsDie:
        return members
          .filter(
            (m) => m.role === 'PartnerFather' || m.role === 'PartnerMother',
          )
          .map((m) => m.id);
      default:
        return [];
    }
  }

  isPartnerSideRelative(member: FamilyMemberModel): boolean {
    return (
      member.role === 'PartnerFather' ||
      member.role === 'PartnerMother' ||
      member.role === 'PartnerSibling'
    );
  }

  onClickParentMember(member: FamilyMemberModel): void {
    const isClientSide =
      member.role === 'ClientFather' || member.role === 'ClientMother';
    if (!isClientSide && this.partnerSideRelativesLocked) {
      return;
    }
    const scenario = isClientSide
      ? ScenarioType.ClientParentsDie
      : ScenarioType.PartnerParentsDie;
    this.selectScenario(scenario);
  }

  onClickClient(): void {
    this.selectScenario(ScenarioType.ClientDies);
  }

  onClickPartner(): void {
    if (!this.hasPartner) {
      this.onOpenCompletePartnerProfile();
      return;
    }
    this.selectScenario(ScenarioType.PartnerDies);
  }

  onClickCouple(): void {
    if (!this.hasPartner) {
      this.toastr.warning(
        this.translate.instant('LEGACY.COMPLETE_PARTNER_FOR_JOINT_SCENARIOS'),
      );
      return;
    }
    this.selectScenario(ScenarioType.BothDie);
  }

  onOpenCompletePartnerProfile(event?: Event): void {
    event?.stopPropagation();
    const pm = this.partnerMember;
    if (!pm || this.hasPartner) return;
    const dialogRef = this.dialog.open(AddMemberComponent, {
      width: '612px',
      disableClose: true,
      autoFocus: false,
      data: {
        cashflowId: this.cashflowId,
        hasPartner: this.treeHasPartner,
        existingMembers: this.dashboard?.familyMembers ?? [],
        clientFirstName: this.clientMember?.firstName ?? '',
        partnerFirstName: pm.firstName ?? '',
        completePlaceholderPartnerMemberId: pm.id,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.dashboard) {
        this.dashboard = result.dashboard;
        this.clearScenario();
        const clientId =
          (result.dashboard as LegacyDashboardModel).client?.id ??
          this.selectedClient?.id;
        if (clientId) {
          this.store.dispatch(ClientActions.loadClient({ clientId }));
        }
      }
    });
  }

  onAddMember(): void {
    const hadPartner = this.hasPartner;

    const dialogRef = this.dialog.open(AddMemberComponent, {
      width: '612px',
      disableClose: true,
      autoFocus: false,
      data: {
        cashflowId: this.cashflowId,
        hasPartner: this.treeHasPartner,
        existingMembers: this.dashboard?.familyMembers ?? [],
        clientFirstName: this.clientMember?.firstName ?? '',
        partnerFirstName: this.partnerMember?.firstName ?? '',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.dashboard) {
        this.dashboard = result.dashboard;
        this.clearScenario();

        const partnerJustAdded = !hadPartner && (result.dashboard as LegacyDashboardModel).hasPartner;
        if (partnerJustAdded) {
          const clientId = (result.dashboard as LegacyDashboardModel).client?.id;
          if (clientId) {
            this.store.dispatch(ClientActions.loadClient({ clientId }));
          }
        }
      }
    });
  }

  onRemoveMember(member: FamilyMemberModel): void {
    if (this.partnerSideRelativesLocked && this.isPartnerSideRelative(member)) {
      return;
    }
    this.legacyHttp.removeFamilyMember(this.cashflowId, member.id).subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.clearScenario();
        this.toastr.success('Member removed', 'Success');
      },
      error: () => this.toastr.error('Failed to remove member', 'Error'),
    });
  }

  onEditPartnerParentsEstate(): void {
    if (this.partnerSideRelativesLocked) return;
    this.onEditParentEstate('partner');
  }

  onEditParentEstate(side: 'client' | 'partner'): void {
    const current =
      side === 'client'
        ? (this.dashboard?.parentEstates?.clientParentsNetWorth ?? 0)
        : (this.dashboard?.parentEstates?.partnerParentsNetWorth ?? 0);

    const personFirstName = (
      side === 'client'
        ? (this.clientMember?.firstName ||
            this.selectedClient?.clientDetails?.firstName ||
            this.clientData?.firstName ||
            '')
        : (this.partnerMember?.firstName ||
            this.selectedClient?.partnerDetail?.firstName ||
            '')
    ).trim();

    const dialogRef = this.dialog.open(EditParentEstateComponent, {
      width: '612px',
      disableClose: true,
      data: {
        cashflowId: this.cashflowId,
        side,
        currentValue: current,
        currency: this.currency,
        personFirstName,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.dashboard) {
        this.dashboard = result.dashboard;
        this.clearScenario();
      }
    });
  }

  onOpenBeneficiaryRules(): void {
    const dialogRef = this.dialog.open(BeneficiaryRulesComponent, {
      width: '612px',
      disableClose: true,
      data: {
        cashflowId: this.cashflowId,
        dashboard: this.dashboard,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.dashboard) {
        this.dashboard = result.dashboard;
        this.clearScenario();
      }
    });
  }

  onOpenTaxSettings(): void {
    const dialogRef = this.dialog.open(TaxSettingsComponent, {
      width: '612px',
      disableClose: true,
      data: {
        cashflowId: this.cashflowId,
        taxSettings: this.dashboard?.taxSettings,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.dashboard) {
        this.dashboard = result.dashboard;
        this.clearScenario();
      }
    });
  }

  private ensureTreeObserver(): void {
    const familyEl = this.familyTreeRef?.nativeElement;
    if (!familyEl || familyEl === this.observedElement) return;

    this.mutationObs?.disconnect();
    this.resizeObs?.disconnect();
    this.observedElement = familyEl;

    this.ngZone.runOutsideAngular(() => {
      this.mutationObs = new MutationObserver(() =>
        this.scheduleLineUpdate(),
      );
      this.mutationObs.observe(familyEl, {
        childList: true,
        subtree: true,
      });

      this.resizeObs = new ResizeObserver(() =>
        this.scheduleLineUpdate(),
      );
      this.resizeObs.observe(familyEl);
    });
  }

  private scheduleLineUpdate(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.balanceBranches();
      this.updateCoupleLine();
      this.updateParentPairLine(
        this.clientParentsPairRef,
        this.clientParentsLineRef,
      );
      this.updateParentPairLine(
        this.partnerParentsPairRef,
        this.partnerParentsLineRef,
      );
      this.updateHeartEstateLine(
        this.clientBranchParentsRef,
        this.clientHeartEstateLineRef,
      );
      this.updateHeartEstateLine(
        this.partnerBranchParentsRef,
        this.partnerHeartEstateLineRef,
      );
      this.updateHeartChildrenLine();
    });
  }

  private updateCoupleLine(): void {
    if (
      !this.treeBodyRef?.nativeElement ||
      !this.clientAvatarRef?.nativeElement ||
      !this.partnerAvatarRef?.nativeElement ||
      !this.coupleLineRef?.nativeElement
    ) {
      return;
    }

    const clientNode = this.clientMainNodeRef?.nativeElement;
    const partnerNode = this.partnerMainNodeRef?.nativeElement;
    if (clientNode && partnerNode) {
      this.renderer.removeStyle(clientNode, 'min-height');
      this.renderer.removeStyle(partnerNode, 'min-height');

      const maxH = Math.max(
        clientNode.offsetHeight,
        partnerNode.offsetHeight,
      );
      this.renderer.setStyle(clientNode, 'min-height', `${maxH}px`);
      this.renderer.setStyle(partnerNode, 'min-height', `${maxH}px`);
    }

    if (this.coupleLinkRef?.nativeElement) {
      this.renderer.removeStyle(this.coupleLinkRef.nativeElement, 'margin-bottom');
    }

    const treeRect =
      this.treeBodyRef.nativeElement.getBoundingClientRect();
    const clientRect =
      this.clientAvatarRef.nativeElement.getBoundingClientRect();
    const partnerRect =
      this.partnerAvatarRef.nativeElement.getBoundingClientRect();

    const clientCenterY =
      clientRect.top + clientRect.height / 2 - treeRect.top;
    const partnerCenterY =
      partnerRect.top + partnerRect.height / 2 - treeRect.top;
    const lineY = (clientCenterY + partnerCenterY) / 2;

    const clientRight = clientRect.right - treeRect.left;
    const partnerLeft = partnerRect.left - treeRect.left;

    const line = this.coupleLineRef.nativeElement;
    this.renderer.setStyle(line, 'top', `${lineY}px`);
    this.renderer.setStyle(line, 'left', `${clientRight}px`);
    this.renderer.setStyle(
      line,
      'width',
      `${partnerLeft - clientRight}px`,
    );

    if (this.coupleLinkRef?.nativeElement) {
      const linkHeight =
        this.coupleLinkRef.nativeElement.offsetHeight;
      const marginBottom = Math.max(
        0,
        treeRect.height - lineY - linkHeight / 2,
      );
      this.renderer.setStyle(
        this.coupleLinkRef.nativeElement,
        'margin-bottom',
        `${marginBottom}px`,
      );

      const treeRect2 =
        this.treeBodyRef.nativeElement.getBoundingClientRect();
      const clientRect2 =
        this.clientAvatarRef.nativeElement.getBoundingClientRect();
      const partnerRect2 =
        this.partnerAvatarRef.nativeElement.getBoundingClientRect();

      const lineY2 =
        (clientRect2.top + clientRect2.height / 2 - treeRect2.top +
         (partnerRect2.top + partnerRect2.height / 2 - treeRect2.top)) / 2;
      const clientRight2 = clientRect2.right - treeRect2.left;
      const partnerLeft2 = partnerRect2.left - treeRect2.left;

      this.renderer.setStyle(line, 'top', `${lineY2}px`);
      this.renderer.setStyle(line, 'left', `${clientRight2}px`);
      this.renderer.setStyle(line, 'width', `${partnerLeft2 - clientRight2}px`);
    }
  }

  private updateParentPairLine(
    pairRef: ElementRef<HTMLElement> | undefined,
    lineRef: ElementRef<HTMLElement> | undefined,
  ): void {
    if (!pairRef?.nativeElement || !lineRef?.nativeElement) return;

    const pairEl = pairRef.nativeElement;
    const avatars = pairEl.querySelectorAll('.node-avatar');
    if (avatars.length < 2) return;

    const first = avatars[0] as HTMLElement;
    const last = avatars[avatars.length - 1] as HTMLElement;
    const pairRect = pairEl.getBoundingClientRect();
    const firstRect = first.getBoundingClientRect();
    const lastRect = last.getBoundingClientRect();

    const firstCenterY =
      firstRect.top + firstRect.height / 2 - pairRect.top;
    const lastCenterY =
      lastRect.top + lastRect.height / 2 - pairRect.top;
    const lineY = (firstCenterY + lastCenterY) / 2;

    const lineLeft = firstRect.right - pairRect.left;
    const lineWidth = lastRect.left - pairRect.left - lineLeft;

    const line = lineRef.nativeElement;
    this.renderer.setStyle(line, 'top', `${lineY}px`);
    this.renderer.setStyle(line, 'left', `${lineLeft}px`);
    this.renderer.setStyle(line, 'width', `${lineWidth}px`);

    const heart = pairEl.querySelector('.pair-heart') as HTMLElement;
    if (heart) {
      this.renderer.setStyle(heart, 'padding-top', '0');
      const heartH = heart.offsetHeight;
      this.renderer.setStyle(
        heart,
        'margin-top',
        `${lineY - heartH / 2}px`,
      );
    }
  }

  private updateHeartEstateLine(
    branchParentsRef: ElementRef<HTMLElement> | undefined,
    lineRef: ElementRef<HTMLElement> | undefined,
  ): void {
    if (!branchParentsRef?.nativeElement || !lineRef?.nativeElement) return;

    const container = branchParentsRef.nativeElement;
    const estate = container.querySelector(
      '.parent-estate',
    ) as HTMLElement;
    if (!estate) return;

    const heart = container.querySelector('.new-heart-icon-sm') as HTMLElement;
    const anchor = (heart ??
      container.querySelector('.couple-pair .tree-node')) as HTMLElement;
    if (!anchor) return;

    const containerRect = container.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const estateRect = estate.getBoundingClientRect();

    const anchorCenterX =
      anchorRect.left + anchorRect.width / 2 - containerRect.left;
    const top = anchorRect.bottom - containerRect.top;
    const bottom = estateRect.top - containerRect.top;

    const line = lineRef.nativeElement;
    this.renderer.setStyle(line, 'left', `${anchorCenterX}px`);
    this.renderer.setStyle(line, 'top', `${top}px`);
    this.renderer.setStyle(
      line,
      'height',
      `${Math.max(0, bottom - top)}px`,
    );
  }

  private updateHeartChildrenLine(): void {
    if (
      !this.familyTreeRef?.nativeElement ||
      !this.childrenSectionRef?.nativeElement ||
      !this.heartChildrenLineRef?.nativeElement
    ) {
      return;
    }

    const familyEl = this.familyTreeRef.nativeElement;
    const familyRect = familyEl.getBoundingClientRect();
    const bTop = familyEl.clientTop;
    const bLeft = familyEl.clientLeft;

    let anchorCenterX: number;
    let anchorBottom: number;

    if (this.coupleLinkRef?.nativeElement) {
      const heart = this.coupleLinkRef.nativeElement.querySelector(
        '.new-heart-icon',
      ) as HTMLElement;
      if (!heart) return;

      const heartRect = heart.getBoundingClientRect();
      anchorCenterX =
        heartRect.left + heartRect.width / 2 - familyRect.left - bLeft;
      anchorBottom = heartRect.bottom - familyRect.top - bTop;
    } else if (this.clientMainNodeRef?.nativeElement) {
      const nodeRect =
        this.clientMainNodeRef.nativeElement.getBoundingClientRect();
      anchorCenterX =
        nodeRect.left + nodeRect.width / 2 - familyRect.left - bLeft;
      anchorBottom = nodeRect.bottom - familyRect.top - bTop;
    } else {
      this.renderer.removeStyle(
        this.childrenSectionRef.nativeElement,
        'transform',
      );
      return;
    }

    const familyCenterX = familyEl.clientWidth / 2;
    const offset = anchorCenterX - familyCenterX;
    this.renderer.setStyle(
      this.childrenSectionRef.nativeElement,
      'transform',
      `translateX(${offset}px)`,
    );

    const childVline =
      this.childrenSectionRef.nativeElement.querySelector(
        '.child-vline',
      ) as HTMLElement;
    if (!childVline) return;

    const vlineRect = childVline.getBoundingClientRect();
    const vlineTop = vlineRect.top - familyRect.top - bTop;

    const line = this.heartChildrenLineRef.nativeElement;
    this.renderer.setStyle(line, 'left', `${anchorCenterX}px`);
    this.renderer.setStyle(line, 'top', `${anchorBottom}px`);
    this.renderer.setStyle(
      line,
      'height',
      `${Math.max(0, vlineTop - anchorBottom + 1)}px`,
    );
  }

  private balanceBranches(): void {
    const clientPair = this.clientParentsPairRef?.nativeElement;
    const partnerPair = this.partnerParentsPairRef?.nativeElement;
    const clientBranch = this.clientBranchRef?.nativeElement;
    const partnerBranch = this.partnerBranchRef?.nativeElement;

    if (clientPair) this.renderer.removeStyle(clientPair, 'margin-bottom');
    if (partnerPair) this.renderer.removeStyle(partnerPair, 'margin-bottom');

    if (!clientPair || !partnerPair || !clientBranch || !partnerBranch) return;

    const clientHeight = clientBranch.offsetHeight;
    const partnerHeight = partnerBranch.offsetHeight;
    const diff = Math.abs(clientHeight - partnerHeight);

    if (diff < 1) return;

    if (clientHeight > partnerHeight) {
      this.renderer.setStyle(partnerPair, 'margin-bottom', `${diff}px`);
    } else {
      this.renderer.setStyle(clientPair, 'margin-bottom', `${diff}px`);
    }
  }

  private clearScenario(): void {
    this.activeScenario = null;
    this.scenarioResult = null;
    this.markedDeceased.clear();
    this.cdr.markForCheck();
  }
}
