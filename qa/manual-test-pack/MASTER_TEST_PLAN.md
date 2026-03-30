# Master Test Plan — Ibernia Portal (Angular)

## 1. Objective

Validate the **Ibernia Portal** (`Ibernia-portal/`) on the **DEV** deployment end-to-end: advisor workflows (clients, cashflow models, financial planning), public flows (client questionnaire, shared lifetime report), settings, notifications, and integrations with **Identity** (OIDC) and the **backend API**.

This plan is written for **product, design, engineering, and ops**—not only dedicated QA.

---

## 2. Scope

### In scope

- **Authentication**: OIDC code flow (`oidc-client`), `AuthGuard`, bearer tokens on API calls (`http-request.interceptor.ts`).
- **Clients**: list, search, sort, add/edit/delete (`/api/v1/Clients/...`).
- **Client profile**: cashflow models, questionnaire link & responses, copy/delete cashflow.
- **Cashflow workspace** (`/cashflows/:id/...`): timeline, savings pots, income & expenses, withdrawals & contributions, reports, scenario lab, emergencies, wealth & legacy, AI recommendations, agent chat.
- **Settings** (`/settings/...`): account preferences, default assumptions, plan & billing (informational UI), notifications (prefs + web push), branding, help, privacy & data, AI recommendations (settings route), admin notifications (role-gated).
- **Onboarding / defaults**: `/default-preferance` (spelling as in code).
- **Public routes** (no login): `/questionnaire/:token`, `/view/report/:token` (client report with password).
- **Localization**: `LanguageService` — at least **en** / **it** (`header.component.ts`).
- **Theme**: light/dark via `CoreService` / header.
- **In-app notifications**: header bell, MFA synthetic reminder when claims indicate MFA off (`mfa-reminder-notification.ts`).

### Out of scope (unless DEV explicitly includes them)

- **Identity Server** UI and **Admin** site internals (only verify external links open).
- **Backend business rules** not visible in the portal (validate behavior, not ledger math correctness beyond obvious errors).
- **Automated tests**: this repo’s Angular app has **no `*.spec.ts` tests** in the workspace snapshot—manual execution is the source of truth for this pack.

---

## 3. Environment

| Item | DEV (typical) | Source in repo |
|------|----------------|----------------|
| **Portal** | URL provided by your team (e.g. `https://dev-app.ibernia.it`) | Deployed build of `Ibernia-portal` |
| **API** | Must match the build’s `environment.apiUrl` | `src/environments/environment.ts` uses `https://localhost:7071` for local builds; **DEV server build should point at the DEV API** (confirm with engineering) |
| **Identity (OIDC)** | e.g. `https://dev-identity.ibernia.it` | `environment.authority` (non-production sample in `environment.ts`) |
| **Admin** | e.g. `https://dev-admin.ibernia.it` | `environment.adminUrl` |

**Assumption**: Each tester receives the **exact DEV portal URL**, **test accounts**, and confirmation of **which API and Identity** the build targets.

---

## 4. Setup assumptions

1. **Browser**: Current Chrome, Safari, or Firefox; cookies and local storage allowed for the app origin.
2. **Network**: Stable connection; for error tests, use DevTools **Offline** or throttling.
3. **Time**: Tests that depend on **token expiry** may need coordination with engineering or long idle periods.
4. **Data**: Use **non-production** clients and cashflows; avoid destructive actions on shared DEV data unless agreed.

---

## 5. Test data assumptions

See **`DEV_TEST_DATA_GUIDE.md`**. There are **no committed test user credentials** in the repo—accounts and roles must be supplied by your team.

---

## 6. Roles

| Role | Typical use in app |
|------|---------------------|
| **Advisor** (standard) | Full app except admin notifications creation. |
| **Administrator** or **IberniaIdentityAdminAdministrator** | Access to **Settings → Admin Notifications** (`AdminGuard`). |
| **Public user** | Only `/questionnaire/:token` and `/view/report/:token` (no OIDC session). |

---

## 7. Risk-based priority

1. **P0**: Login, client list, create client, create cashflow, core cashflow tabs (timeline, finances, income, flows, reports), AI analyze if product-critical, public questionnaire submit, public report view.
2. **P1**: Edit/delete, scenario lab, emergencies, wealth, notifications, settings that persist data, admin notifications (if role available).
3. **P2**: Edge cases, theme, performance spot-checks, legacy detail screens.
4. **P3**: Nice-to-have UX (accessibility spot checks, feature-flag documentation case).

---

## 8. Pass / fail

| Result | Meaning |
|--------|---------|
| **Pass** | Steps can be completed; **observed** outcome matches expected; no blocking defect. |
| **Fail** | Observed outcome differs from expected; log a bug with **Severity**. |
| **Blocked** | Cannot execute (no account, env down, dependency missing)—note in tracker. |
| **Not Run** | Not yet executed. |

---

## 9. How to execute testing

1. Read **`SMOKE_TEST_SUITE.md`** first; **all smoke cases must pass** before deep testing.
2. Pick a **module** from **`FEATURE_INVENTORY.md`** or execute rows in **`TEST_CASES.csv`** assigned to you.
3. For each case: perform **Steps**, compare to **Expected Result**, fill **Actual Result** and **Status** in the CSV (or your imported tool).
4. Attach **Evidence Link** (screenshot, Loom, or Cloud link) for failures or important passes.
5. Record **Build/Commit** or deployment label if known.

---

## 10. How to log defects

Use **`BUG_REPORT_TEMPLATE.md`**. Link the bug from the **Bug Link** column in `TEST_CASES.csv`.

**Severity** (if failed): e.g. **S1** crash/data loss, **S2** major feature broken, **S3** minor, **S4** cosmetic.

---

## 11. How to mark progress

1. Update **`TEST_EXECUTION_TRACKER.csv`** per person or per sprint: counts of Passed / Failed / Blocked / Not Run, **Bugs Raised**, **Retest Needed**.
2. Optionally maintain **percentage complete** per module:  
   `Passed / (Passed + Failed + Blocked + Not Run)` for rows in that module.

---

## 12. Recommended order (fresh tester)

1. Smoke suite (`SMOKE_TEST_SUITE.md`).
2. **Auth** → **Clients** (list, add client, profile).
3. **Create cashflow** from profile → **Cashflow nav** (timeline → finances → income → withdrawal → reports).
4. **Scenario lab** or **AI** (product priority).
5. **Settings** (account, notifications, privacy—careful with destructive actions).
6. **Public flows** (questionnaire link, report link)—use dedicated test tokens.
7. **Regression suite** (`REGRESSION_TEST_SUITE.md`) before release.

---

## 13. References

- Routes: `src/app/app.routes.ts`, `financial-workflow.routes.ts`, `settings/setting-routing.module.ts`.
- API prefix: requests go to `environment.apiUrl` + relative path (see `http-request.interceptor.ts`).

---

## 14. Document control

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-03-30 | Initial pack from codebase review |
