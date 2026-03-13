import { Page } from '@playwright/test';
import { test, expect } from './fixtures';

type AgeYear = {
  age: number;
  year: number;
};

type NetAmount = {
  currencySymbol: string;
  amount: number;
  cycle: { id: string; description: string } | null;
};

type SavingPot = {
  id: string | null;
  name: string;
  type: number;
  iconUrl: string;
  startingPotValue: NetAmount;
  nominalValue: number;
  realValue: number;
  realGrowthRate: number;
  inflationRate: number;
  isGrowing: boolean;
  returnRate: number;
  realReturn: number;
  hasPotLocked: boolean;
  start: AgeYear;
  end: AgeYear;
  lockedFrom: AgeYear;
  lockedTill: AgeYear;
  hasCommission: boolean;
  comission: {
    type: number;
    amount: NetAmount;
    percentage: NetAmount;
    escalationRate: { description: string; value: string };
  };
  orderNumber: number;
  ownership: number;
};

function buildTestSavingPot(overrides: Partial<SavingPot> = {}): SavingPot {
  const baseAge: AgeYear = { age: 40, year: 2025 };
  const baseAmount: NetAmount = {
    currencySymbol: '£',
    amount: 10_000,
    cycle: null,
  };

  return {
    id: 'pot-1',
    name: 'Emergency fund',
    type: 1,
    iconUrl: 'cashflow-moneys-icon',
    startingPotValue: baseAmount,
    nominalValue: baseAmount.amount,
    realValue: baseAmount.amount,
    realGrowthRate: 0,
    inflationRate: 2.5,
    isGrowing: true,
    returnRate: 2.5,
    realReturn: 2.5,
    hasPotLocked: false,
    start: baseAge,
    end: { age: 60, year: 2045 },
    lockedFrom: baseAge,
    lockedTill: baseAge,
    hasCommission: false,
    comission: {
      type: 0,
      amount: { ...baseAmount, currencySymbol: '£' },
      percentage: { ...baseAmount, currencySymbol: '%' },
      escalationRate: { description: 'None', value: '0' },
    },
    orderNumber: 0,
    ownership: 1,
    ...overrides,
  };
}

test.describe('Saving pots flow (advisor portal)', () => {
  test('opens Ibernia portal and shows saving pots for a client cashflow', async ({
    savingPotsPage,
  }) => {
    const pots: SavingPot[] = [buildTestSavingPot()];

    const page: Page = await savingPotsPage({
      hasPartner: true,
      pots,
    });

    // Basic smoke checks that mimic a manual advisor check
    await expect(page.getByText('Emergency fund')).toBeVisible();
    await expect(page.locator('.ownership-badge')).toHaveCount(1);
  });
});

