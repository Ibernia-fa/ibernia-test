/**
 * Canonical relationship values for the questionnaire Important People question.
 * Must match backend <see cref="FamilyRelationshipCatalog.QuestionnaireImportantPeopleRoles"/> (FamilyRole names).
 */
export const FAMILY_TREE_QUESTIONNAIRE_RELATIONSHIP_VALUES: readonly string[] = [
  'Partner',
  'Child',
  'ClientFather',
  'ClientMother',
  'PartnerFather',
  'PartnerMother',
  'ClientSibling',
  'PartnerSibling',
] as const;

/** Map legacy questionnaire display values to FamilyRole names. */
export function normalizeQuestionnaireRelationship(raw: string): string {
  const s = (raw || '').trim();
  if (FAMILY_TREE_QUESTIONNAIRE_RELATIONSHIP_VALUES.includes(s)) return s;
  const legacy: Record<string, string> = {
    Mother: 'ClientMother',
    Father: 'ClientFather',
    Husband: 'Partner',
    Wife: 'Partner',
    Son: 'Child',
    Daughter: 'Child',
    Brother: 'ClientSibling',
    Sister: 'ClientSibling',
    Partner: 'Partner',
    Child: 'Child',
    Grandparent: 'ClientMother',
    Grandfather: 'ClientFather',
    Grandmother: 'ClientMother',
    Grandchild: 'Child',
  };
  return legacy[s] ?? s;
}

export function questionnaireRelationshipLabelKey(canonical: string): string {
  switch (canonical) {
    case 'Partner':
      return 'LEGACY.RELATIONSHIP_PARTNER';
    case 'Child':
      return 'LEGACY.RELATIONSHIP_CHILD';
    case 'ClientFather':
    case 'PartnerFather':
      return 'LEGACY.RELATIONSHIP_FATHER_OF';
    case 'ClientMother':
    case 'PartnerMother':
      return 'LEGACY.RELATIONSHIP_MOTHER_OF';
    case 'ClientSibling':
    case 'PartnerSibling':
      return 'LEGACY.RELATIONSHIP_SIBLING_OF';
    default:
      return canonical;
  }
}

export function questionnaireRelationshipLabelParams(
  canonical: string,
  clientFirstName: string,
  partnerFirstName: string,
): Record<string, string> | undefined {
  const c = (clientFirstName || '').trim();
  const p = (partnerFirstName || '').trim();
  if (
    canonical === 'ClientFather' ||
    canonical === 'ClientMother' ||
    canonical === 'ClientSibling'
  ) {
    return { name: c || 'Client' };
  }
  if (
    canonical === 'PartnerFather' ||
    canonical === 'PartnerMother' ||
    canonical === 'PartnerSibling'
  ) {
    return { name: p || 'Partner' };
  }
  return undefined;
}
