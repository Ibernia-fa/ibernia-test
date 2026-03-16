import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env['BASE_URL'] ?? 'https://test-dev.ibernia.it/';
const LOGIN_URL = `${BASE_URL}`;

// Defaults taken from the manual login plan; can be overridden via env vars
const VALID_EMAIL =
  process.env['IBERNIA_LOGIN_EMAIL'] ?? 'laraib@ngbs.co.uk';
const VALID_PASSWORD =
  process.env['IBERNIA_LOGIN_PASSWORD'] ?? 'hd6$I187g';

async function dismissCookieBanner(page: Page) {
  const cookieButton = page.getByRole('button', { name: /got it!/i });
  await cookieButton.click({ timeout: 5_000 }).catch(() => {});
}

test.describe('Login page', () => {
  test('valid login redirects to dashboard', async ({ page }) => {
    await test.step(`Open URL: ${LOGIN_URL}`, async () => {
      await page.goto(LOGIN_URL);
    });
    await dismissCookieBanner(page);

    // Basic HTTPS/security sanity check
    await expect(page).toHaveURL(/^https:/);

    const emailInput = page.getByLabel('Email', { exact: true });
    const passwordInput = page.getByLabel('Password', { exact: true });
    const loginButton = page.getByRole('button', { name: /login/i });

    await emailInput.fill(VALID_EMAIL);
    await passwordInput.fill(VALID_PASSWORD);
    await Promise.all([page.waitForNavigation(), loginButton.click()]);

    // Expect to land on a dashboard/main area, not stay on the login page
    await expect(page).not.toHaveURL(/login/i);
    await expect(page.url()).toContain(new URL(BASE_URL).host);
  });

  test('invalid login with wrong password shows error and stays on login page', async ({
    page,
  }) => {
    await test.step(`Open URL: ${LOGIN_URL}`, async () => {
      await page.goto(LOGIN_URL);
    });
    await dismissCookieBanner(page);

    const emailInput = page.getByLabel('Email', { exact: true });
    const passwordInput = page.getByLabel('Password', { exact: true });
    const loginButton = page.getByRole('button', { name: /login/i });

    await emailInput.fill(VALID_EMAIL);
    await passwordInput.fill('wrong-password-123!');
    await Promise.all([page.waitForNavigation().catch(() => {}), loginButton.click()]);

    // Should remain on login page
    await expect(page).toHaveURL(/login/i);

    // Error message should be visible and contain the expected text
    await expect(
      page.getByText('Invalid username or password', { exact: false })
    ).toBeVisible();
  });

  test('invalid login with wrong email shows error and stays on login page', async ({
    page,
  }) => {
    await test.step(`Open URL: ${LOGIN_URL}`, async () => {
      await page.goto(LOGIN_URL);
    });
    await dismissCookieBanner(page);

    const emailInput = page.getByLabel('Email', { exact: true });
    const passwordInput = page.getByLabel('Password', { exact: true });
    const loginButton = page.getByRole('button', { name: /login/i });

    await emailInput.fill('nonexistent.user+test@example.com');
    await passwordInput.fill(VALID_PASSWORD);
    await Promise.all([page.waitForNavigation().catch(() => {}), loginButton.click()]);

    // Should remain on login page
    await expect(page).toHaveURL(/login/i);

    await expect(
      page.getByText('Invalid username or password', { exact: false })
    ).toBeVisible();
  });
});
