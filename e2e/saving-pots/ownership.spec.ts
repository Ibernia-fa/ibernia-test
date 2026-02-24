import { test, expect, CF_ID, CLIENT_ID, API_BASE, mockClient, mockSavingPots, mockCashflow } from '../fixtures';

// ─── Shared pot builders ──────────────────────────────────────────────────────

function makePot(overrides: object) {
  return {
    id: `pot-${Math.random().toString(36).slice(2)}`,
    name: 'ISA',
    type: 2, // Investment
    iconUrl: 'cashflow-moneys-icon',
    startingPotValue: { amount: 50000, currency: 'GBP' },
    nominalValue: 50000,
    realValue: 48000,
    realGrowthRate: 3,
    inflationRate: 2.5,
    isGrowing: true,
    returnRate: 5.5,
    realReturn: 3,
    hasPotLocked: false,
    start: { year: 2024, age: 44 },
    end: { year: 2050, age: 70 },
    lockedFrom: null,
    lockedTill: null,
    hasCommission: false,
    comission: null,
    orderNumber: 1,
    ...overrides,
  };
}

// ─── Ownership badge tests ────────────────────────────────────────────────────

test.describe('Saving pots – ownership badge', () => {
  test('shows "Joint" badge when ownership is 0 (Joint)', async ({ savingPotsPage }) => {
    const page = await savingPotsPage({
      hasPartner: true,
      pots: [makePot({ name: 'ISA', ownership: 0 })],
    });

    await expect(page.locator('.ownership-badge').first()).toHaveText('Joint');
  });

  test('shows "Joint" badge when ownership is undefined', async ({ savingPotsPage }) => {
    const page = await savingPotsPage({
      hasPartner: true,
      pots: [makePot({ name: 'ISA', ownership: undefined })],
    });

    await expect(page.locator('.ownership-badge').first()).toHaveText('Joint');
  });

  test('shows client first name badge for Person1 ownership', async ({ savingPotsPage }) => {
    const page = await savingPotsPage({
      hasPartner: false,
      pots: [makePot({ name: 'Pension fund', type: 3, ownership: 1 })],
    });

    // client firstName is "Alice" (from mockClient)
    await expect(page.locator('.ownership-badge').first()).toHaveText('Alice');
  });

  test('shows partner first name badge for Person2 ownership', async ({ savingPotsPage }) => {
    const page = await savingPotsPage({
      hasPartner: true,
      pots: [makePot({ name: 'Investment', ownership: 2 })],
    });

    // partner firstName is "Bob" (from mockClient)
    await expect(page.locator('.ownership-badge').first()).toHaveText('Bob');
  });

  test('shows correct badges for multiple pots with mixed ownership', async ({ savingPotsPage }) => {
    const page = await savingPotsPage({
      hasPartner: true,
      pots: [
        makePot({ name: 'ISA', ownership: 0 }),       // Joint
        makePot({ name: 'Pension fund', type: 3, ownership: 1 }),  // Alice
        makePot({ name: 'Investment', ownership: 2 }), // Bob
      ],
    });

    const badges = page.locator('.ownership-badge');
    await expect(badges).toHaveCount(3);
    await expect(badges.nth(0)).toHaveText('Joint');
    await expect(badges.nth(1)).toHaveText('Alice');
    await expect(badges.nth(2)).toHaveText('Bob');
  });

  test('falls back to "Person 2" when partner has no first name and ownership is Person2', async ({ page }) => {
    // Custom setup: partner with no firstName
    const OIDC_KEY = `oidc.user:https://dev-identity.ibernia.it:b2323429-bc5e-42f1-ac7c-9ece5dd49110`;
    await page.addInitScript(
      ([key, value]) => sessionStorage.setItem(key, value),
      [
        OIDC_KEY,
        JSON.stringify({
          access_token: 'fake.access.token',
          token_type: 'Bearer',
          scope: 'openid email profile roles',
          profile: { sub: 'advisor-001' },
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }),
      ]
    );

    const clientWithUnnamedPartner = {
      ...mockClient(true),
      partnerDetail: { id: 'partner-002', firstName: '', lastName: '', birthDate: '1982-01-01' },
    };

    await page.route(`${API_BASE}/api/v1/cashflows/${CF_ID}`, (r) => r.fulfill({ json: mockCashflow }));
    await page.route(`${API_BASE}/api/v1/Clients/${CLIENT_ID}`, (r) => r.fulfill({ json: clientWithUnnamedPartner }));
    await page.route(`${API_BASE}/api/v1/cashflows/${CF_ID}/saving-pots`, (r) =>
      r.fulfill({ json: mockSavingPots([makePot({ ownership: 2 })]) })
    );
    await page.route(`${API_BASE}/api/v1/cashflows/${CF_ID}/timelines`, (r) => r.fulfill({ json: { events: [], clientEvents: [] } }));
    await page.route(`${API_BASE}/api/v1/settings/amount-cycles`, (r) => r.fulfill({ json: [] }));
    await page.route(`${API_BASE}/api/v1/settings/${CLIENT_ID}/escalation-rates`, (r) => r.fulfill({ json: { escalationRates: [] } }));
    await page.route(`${API_BASE}/api/v1/UserProfile/**`, (r) => r.fulfill({ status: 404, body: '' }));
    await page.route(`${API_BASE}/**`, (r) => r.abort());

    await page.goto(`/cashflows/${CF_ID}/finances`);
    await page.waitForSelector('.ownership-badge', { timeout: 10_000 });

    await expect(page.locator('.ownership-badge').first()).toHaveText('Person 2');
  });
});

// ─── Add-pot dialog: ownership dropdown ──────────────────────────────────────

test.describe('Add-pot dialog – ownership dropdown', () => {
  test('shows Joint and client name options when no partner', async ({ savingPotsPage }) => {
    const page = await savingPotsPage({ hasPartner: false, pots: [] });

    // Open the add-pot dialog by clicking "Add New"
    await page.getByRole('button', { name: /add new/i }).click();
    await page.waitForSelector('mat-dialog-content', { timeout: 5_000 });

    // Open the ownership dropdown
    const ownershipSelect = page.locator('mat-select[formcontrolname="ownership"]');
    await ownershipSelect.click();

    const panel = page.locator('mat-option');
    const texts = await panel.allInnerTexts();
    const trimmed = texts.map((t) => t.trim()).filter(Boolean);

    expect(trimmed).toContain('Joint');
    expect(trimmed).toContain('Alice');
    // Person2 option should NOT be present when there is no partner
    expect(trimmed).not.toContain('Bob');
    expect(trimmed).not.toContain('Person 2');
  });

  test('shows Person2 option when client has a partner', async ({ savingPotsPage }) => {
    const page = await savingPotsPage({ hasPartner: true, pots: [] });

    await page.getByRole('button', { name: /add new/i }).click();
    await page.waitForSelector('mat-dialog-content', { timeout: 5_000 });

    const ownershipSelect = page.locator('mat-select[formcontrolname="ownership"]');
    await ownershipSelect.click();

    const panel = page.locator('mat-option');
    const texts = await panel.allInnerTexts();
    const trimmed = texts.map((t) => t.trim()).filter(Boolean);

    expect(trimmed).toContain('Joint');
    expect(trimmed).toContain('Alice');
    expect(trimmed).toContain('Bob');
  });

  test('saves pot with selected ownership', async ({ page }) => {
    const postedBodies: unknown[] = [];

    const OIDC_KEY = `oidc.user:https://dev-identity.ibernia.it:b2323429-bc5e-42f1-ac7c-9ece5dd49110`;
    await page.addInitScript(
      ([key, value]) => sessionStorage.setItem(key, value),
      [
        OIDC_KEY,
        JSON.stringify({
          access_token: 'fake.access.token',
          token_type: 'Bearer',
          scope: 'openid email profile roles',
          profile: { sub: 'advisor-001' },
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }),
      ]
    );

    // Mock saving-pots: GET returns empty, POST captures body
    await page.route(`${API_BASE}/api/v1/cashflows/${CF_ID}/saving-pots`, async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        postedBodies.push(body);
        await route.fulfill({ json: mockSavingPots([body]) });
      } else {
        await route.fulfill({ json: mockSavingPots([]) });
      }
    });

    await page.route(`${API_BASE}/api/v1/cashflows/${CF_ID}`, (r) => r.fulfill({ json: mockCashflow }));
    await page.route(`${API_BASE}/api/v1/Clients/${CLIENT_ID}`, (r) => r.fulfill({ json: mockClient(true) }));
    await page.route(`${API_BASE}/api/v1/cashflows/${CF_ID}/timelines`, (r) => r.fulfill({ json: { events: [], clientEvents: [] } }));
    await page.route(`${API_BASE}/api/v1/settings/amount-cycles`, (r) => r.fulfill({ json: [] }));
    await page.route(`${API_BASE}/api/v1/settings/${CLIENT_ID}/escalation-rates`, (r) => r.fulfill({ json: { escalationRates: [] } }));
    await page.route(`https://dev-api.ibernia.it/api/v1/UserProfile/**`, (r) => r.fulfill({ status: 404, body: '' }));
    await page.route(`https://dev-api.ibernia.it/**`, (r) => r.abort());

    await page.goto(`/cashflows/${CF_ID}/finances`);
    // No pots on page, wait for the add button instead
    await page.waitForSelector('button', { timeout: 10_000 });

    const p = page;

    await p.getByRole('button', { name: /add new/i }).click();
    await p.waitForSelector('mat-dialog-content', { timeout: 5_000 });

    // Select pot type (required)
    const typeSelect = p.locator('mat-select[formcontrolname="name"]');
    await typeSelect.click();
    await p.locator('mat-option').filter({ hasText: 'ISA' }).click();

    // Select ownership = Person2 (Bob)
    const ownershipSelect = p.locator('mat-select[formcontrolname="ownership"]');
    await ownershipSelect.click();
    await p.locator('mat-option').filter({ hasText: 'Bob' }).click();

    // Fill in amount
    await p.locator('input[formcontrolname="amount"]').fill('25000');

    // Save
    await p.getByRole('button', { name: /save/i }).click();

    // Verify the POST body included ownership = 2 (Person2)
    await p.waitForTimeout(500);
    expect(postedBodies.length).toBeGreaterThan(0);
    const posted = postedBodies[0] as { ownership?: number };
    expect(posted.ownership).toBe(2);
  });
});
