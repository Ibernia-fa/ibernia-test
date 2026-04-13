// ── Enums ────────────────────────────────────────────────────────

export enum FamilyRole {
  Client = 0,
  Partner = 1,
  ClientFather = 2,
  ClientMother = 3,
  PartnerFather = 4,
  PartnerMother = 5,
  ClientSibling = 6,
  PartnerSibling = 7,
  Child = 8,
  Other = 9
}

export const FAMILY_ROLE_LABELS: Record<number, string> = {
  [FamilyRole.Client]: 'Client',
  [FamilyRole.Partner]: 'Partner',
  [FamilyRole.ClientFather]: 'Father',
  [FamilyRole.ClientMother]: 'Mother',
  [FamilyRole.PartnerFather]: "Partner's father",
  [FamilyRole.PartnerMother]: "Partner's mother",
  [FamilyRole.ClientSibling]: 'Sibling',
  [FamilyRole.PartnerSibling]: "Partner's sibling",
  [FamilyRole.Child]: 'Child',
  [FamilyRole.Other]: 'Other'
};

export enum ScenarioType {
  ClientDies = 1,
  PartnerDies = 2,
  BothDie = 3,
  ClientParentsDie = 4,
  PartnerParentsDie = 5
}

// ── Dashboard ────────────────────────────────────────────────────

export interface LegacyDashboardModel {
  id: string;
  familyMembers: FamilyMemberModel[];
  parentEstates: ParentEstatesModel;
  taxSettings: TaxSettingsModel;
  beneficiaryRules: BeneficiaryRuleModel[];
  hasPartner: boolean;
  clientNetWorth: number;
  partnerNetWorth: number;
  client?: { id: string; name: string };
  cashflow?: { id: string };
}

// ── Family Member ────────────────────────────────────────────────

export interface FamilyMemberModel {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AddFamilyMemberRequest {
  firstName: string;
  lastName: string;
  role: FamilyRole;
}

export interface UpdateFamilyMemberRequest {
  id: string;
  firstName: string;
  lastName: string;
}

// ── Parent Estates ───────────────────────────────────────────────

export interface ParentEstatesModel {
  clientParentsNetWorth: number;
  partnerParentsNetWorth: number;
}

export interface UpdateParentEstateRequest {
  side: 'client' | 'partner';
  jointNetWorth: number;
}

// ── Tax Settings ─────────────────────────────────────────────────

export interface TaxSettingsModel {
  partnerTaxRate: number;
  childTaxRate: number;
  siblingTaxRate: number;
}

export interface UpdateTaxSettingsRequest {
  partnerTaxRate: number;
  childTaxRate: number;
  siblingTaxRate: number;
}

// ── Beneficiary Rules ────────────────────────────────────────────

export interface BeneficiaryRuleModel {
  id: string;
  scenario: string;
  recipients: BeneficiaryRecipientModel[];
  totalPercentage: number;
  isDefault: boolean;
}

export interface BeneficiaryRecipientModel {
  memberId: string;
  memberName: string;
  percentage: number;
}

export interface SaveBeneficiaryRuleRequest {
  scenario: ScenarioType;
  recipients: BeneficiaryRecipientRequest[];
}

export interface BeneficiaryRecipientRequest {
  memberId: string;
  percentage: number;
}

// ── Scenario Simulation ──────────────────────────────────────────

export interface ScenarioResultModel {
  scenario: string;
  grossEstate: number;
  totalTax: number;
  totalDistributed: number;
  beneficiaryShares: BeneficiaryShareModel[];
  deceasedMemberIds: string[];
}

export interface BeneficiaryShareModel {
  memberId: string;
  memberName: string;
  percentage: number;
  grossShare: number;
  taxClass: string;
  taxRate: number;
  taxAmount: number;
  netReceived: number;
  originalAmount: number;
  finalTotal: number;
}
