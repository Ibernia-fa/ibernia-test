import { Client } from 'src/app/clients/models/client';
import { TranslateService } from '@ngx-translate/core';
import { formatClientPersonDisplayName } from './person-display-name';

export interface SavingPotSelectLabelInput {
  name: string;
  ownership?: number | null;
}

/** Matches SavingPotOwnership / API. */
const POT_OWNERSHIP_JOINT = 0;
const POT_OWNERSHIP_PERSON1 = 1;
const POT_OWNERSHIP_PERSON2 = 2;

/**
 * Label for saving-pot mat-select options (and trigger), e.g. "Investment (Matteo)".
 * With no partner on the client record, returns the translated pot name only.
 */
export function formatSavingPotSelectLabel(
  saving: SavingPotSelectLabelInput,
  client: Client | null | undefined,
  translate: TranslateService,
): string {
  const base = saving.name ?? '';
  if (!client?.partnerDetail) {
    return translate.instant(base);
  }
  const ownership = saving.ownership;
  if (ownership === undefined || ownership === null) {
    return translate.instant(base);
  }
  const translatedBase = translate.instant(base);
  if (ownership === POT_OWNERSHIP_JOINT) {
    return `${translatedBase} (${translate.instant('Joint')})`;
  }
  if (ownership === POT_OWNERSHIP_PERSON1) {
    const n = formatClientPersonDisplayName(client.clientDetails);
    return `${translatedBase} (${n || translate.instant('Client')})`;
  }
  if (ownership === POT_OWNERSHIP_PERSON2) {
    const n = formatClientPersonDisplayName(client.partnerDetail);
    return `${translatedBase} (${n || translate.instant('Partner')})`;
  }
  return translatedBase;
}
