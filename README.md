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
