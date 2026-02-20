import { test as base, Page } from '@playwright/test';

// ─── Constants ───────────────────────────────────────────────────────────────
export const CF_ID = 'cf-001';
export const CLIENT_ID = 'client-001';
// Matches environment.development.ts (used by `npm start`)
export const API_BASE = 'https://dev-api.ibernia.it';

// oidc-client stores the user object in sessionStorage under this key.
// Key format: oidc.user:{authority}:{client_id} — must match environment.development.ts
const OIDC_KEY = `oidc.user:https://dev-identity.ibernia.it:b2323429-bc5e-42f1-ac7c-9ece5dd49110`;

const FAKE_OIDC_USER = JSON.stringify({
  id_token: 'fake.id.token',
  session_state: null,
  access_token: 'fake.access.token',
  refresh_token: null,
  token_type: 'Bearer',
  scope: 'openid email profile roles',
  profile: {
    sub: 'advisor-001',
    name: 'Test Advisor',
    email: 'advisor@test.com',
    roles: ['FinancialAdvisor'],
  },
  expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
});

// ─── Shared mock data ─────────────────────────────────────────────────────────

export const mockCashflow = {
  id: CF_ID,
  name: 'Test Cashflow',
  inflationRate: 2.5,
  client: { id: CLIENT_ID, firstName: 'Alice', lastName: 'Smith' },
  financialAdvisor: { id: 'adv-001' },
};

export function mockClient(hasPartner: boolean) {
  return {
    id: CLIENT_ID,
    clientDetails: {
      id: CLIENT_ID,
      firstName: 'Alice',
      lastName: 'Smith',
      birthDate: '1980-01-01',
      preferredCurrency: 'GBP',
      inflationRate: 2.5,
    },
    partnerDetail: hasPartner
      ? {
          id: 'partner-001',
          firstName: 'Bob',
          lastName: 'Smith',
          birthDate: '1982-06-15',
        }
      : null,
  };
}

export function mockSavingPots(pots: object[]) {
  return {
    id: 'sp-001',
    totalSavings: 100000,
    totalGwothRate: 3,
    clientSavings: pots,
    client: { id: CLIENT_ID },
    cashflow: { id: CF_ID },
    financialAdvisor: { id: 'adv-001' },
  };
}

const EMPTY_TIMELINE = { events: [], clientEvents: [] };
const EMPTY_CYCLES = [];
const EMPTY_ESCALATION = { escalationRates: [] };
const EMPTY_USER_PROFILE = null;

// ─── Fixture type ─────────────────────────────────────────────────────────────

type Fixtures = {
  /** Navigate to saving pots page with all APIs pre-mocked */
  savingPotsPage: (options: {
    hasPartner: boolean;
    pots: object[];
  }) => Promise<Page>;
};

// ─── Extended test fixture ────────────────────────────────────────────────────

export const test = base.extend<Fixtures>({
  savingPotsPage: async ({ page }, use) => {
    await use(async ({ hasPartner, pots }) => {
      // 1. Inject fake OIDC user into sessionStorage before Angular boots
      await page.addInitScript(
        ([key, value]) => {
          sessionStorage.setItem(key, value);
        },
        [OIDC_KEY, FAKE_OIDC_USER]
      );

      // 2. Mock all backend API calls
      await page.route(`${API_BASE}/api/v1/cashflows/${CF_ID}`, (route) =>
        route.fulfill({ json: mockCashflow })
      );
      await page.route(`${API_BASE}/api/v1/Clients/${CLIENT_ID}`, (route) =>
        route.fulfill({ json: mockClient(hasPartner) })
      );
      await page.route(
        `${API_BASE}/api/v1/cashflows/${CF_ID}/saving-pots`,
        (route) => route.fulfill({ json: mockSavingPots(pots) })
      );
      await page.route(
        `${API_BASE}/api/v1/cashflows/${CF_ID}/timelines`,
        (route) => route.fulfill({ json: EMPTY_TIMELINE })
      );
      await page.route(
        `${API_BASE}/api/v1/settings/amount-cycles`,
        (route) => route.fulfill({ json: EMPTY_CYCLES })
      );
      await page.route(
        `${API_BASE}/api/v1/settings/${CLIENT_ID}/escalation-rates`,
        (route) => route.fulfill({ json: EMPTY_ESCALATION })
      );
      // Catch-all for UserProfile and any other calls
      await page.route(`${API_BASE}/api/v1/UserProfile/**`, (route) =>
        route.fulfill({ status: 404, body: '' })
      );
      await page.route(`${API_BASE}/**`, (route) => {
        // Let through mocked routes; abort unknown ones so they don't hang
        route.abort();
      });

      // 3. Navigate to saving pots page
      await page.goto(`/cashflows/${CF_ID}/finances`);

      // 4. Wait for the pot list to appear (or spinner to disappear)
      await page.waitForSelector('.ownership-badge', { timeout: 10_000 });

      return page;
    });
  },
});

export { expect } from '@playwright/test';
