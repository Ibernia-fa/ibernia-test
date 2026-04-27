# Ibernia-portal
To manage the frontend application of the Ibernia financial advisory project.

## Frontend deployment tests and report

On every push to the `feature/iteration-4` branch (and on manual workflow dispatch), GitHub Actions:

- Builds and deploys the frontend Docker image.
- Runs Playwright end-to-end tests in CI mode via `npm run test:e2e:ci`, which produces an HTML report in the `playwright-report` directory at the repository root.
- Uploads the `playwright-report` directory both as a GitHub Actions artifact and as a GitHub Pages artifact.

The HTML report is accessible:

- **As an artifact**: from the corresponding GitHub Actions run under `playwright-e2e-report-<env>` (where `<env>` is `dev` or `prod`).
- **Via URL (GitHub Pages)**: from the GitHub Pages deployment created by the `deploy_test_report` job in the `Build, Push & Deploy (Docker Hub)` workflow (the exact URL is shown in the \"Deploy Playwright report to GitHub Pages\" step output and in the repository's Pages settings).

## Plans and billing (Stripe)

The portal’s **Settings → Plans & Billing** page calls the backend under `/api/v1/billing` (see `src/app/billing/services/billing.service.ts`). **Stripe secret keys and webhook signing secrets** belong only in the **API** repo / server environment, not in the Angular build.

- Configure GitHub **Actions secrets/variables** and the Stripe webhook URL on the **backend** side: [ibernia-backend/docs/BILLING_GITHUB_AND_DOCKER.md](../ibernia-backend/docs/BILLING_GITHUB_AND_DOCKER.md).
- Configure Checkout **success/cancel** URLs in Stripe to match the portal (e.g. `https://dev.ibernia.it/settings/plan-billing?session_id={CHECKOUT_SESSION_ID}` for dev) so the app can run **sync** after return.
