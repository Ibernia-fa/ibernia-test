import { TranslateService } from '@ngx-translate/core';
import { Client } from 'src/app/clients/models/client';
import { formatClientPersonDisplayName } from './person-display-name';

/** Matches backend SavingPotOwnership. */
export const LifetimePlanPotOwnership = {
  Joint: 0,
  Person1: 1,
  Person2: 2,
} as const;

export const LIFETIME_PLAN_SERIES_NAME_EXCLUSIONS = new Set([
  'Shortfall',
  'Emergency Expense',
  'Current Account (Negative)',
]);

export interface SeriesWithOptionalOwnership {
  name: string;
  ownership?: number | null;
}

/**
 * Legend + tooltip labels: "Investment (Anna)", "Pension fund (Joint)", etc.
 * Uses API `name` + optional `ownership` when the plan has a partner.
 */
export function formatLifetimePlanSeriesDisplayName(
  series: SeriesWithOptionalOwnership,
  client: Client | null | undefined,
  translate: TranslateService,
): string {
  const base = series.name;
  if (LIFETIME_PLAN_SERIES_NAME_EXCLUSIONS.has(base)) {
    return base;
  }
  if (!client?.partnerDetail) {
    return base;
  }
  if (series.ownership === undefined || series.ownership === null) {
    return base;
  }

  const o = series.ownership;
  if (o === LifetimePlanPotOwnership.Joint) {
    return `${base} (${translate.instant('Joint')})`;
  }
  if (o === LifetimePlanPotOwnership.Person1) {
    const n = formatClientPersonDisplayName(client.clientDetails);
    return `${base} (${n || translate.instant('Client')})`;
  }
  if (o === LifetimePlanPotOwnership.Person2) {
    const n = formatClientPersonDisplayName(client.partnerDetail);
    return `${base} (${n || translate.instant('Partner')})`;
  }
  return base;
}
