# Feature Inventory — Ibernia Portal

Derived from `Ibernia-portal/src` (Angular). Paths are app routes unless noted.

---

## Onboarding & first-run

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Default preferences wizard | Single-route onboarding | `/default-preferance` → `DefaultPreferanceComponent` | P2 | Medium | Full path once per release |
| Post-login redirect | Return URL in `sessionStorage` after OIDC | `auth-guard.service.ts` (`AUTH_RETURN_URL_KEY`) | P2 | Low | Spot-check |

---

## Authentication & access

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| OIDC login | Redirect to Identity, callback `/signin-oidc` | `auth.service.ts`, `AuthRoutingModule` → `AuthCallbackComponent` | P0 | Medium | Every build |
| Logout | End session + post-logout redirect | `logout()`, `signout-callback-oidc` | P0 | Low | Every build |
| Route protection | `AuthGuard` on `/clients`, `/cashflows`, `/default-preferance` parent | `app.routes.ts` | P0 | Low | Smoke |
| API authorization | `Authorization: Bearer` on protected calls | `http-request.interceptor.ts` | P0 | Medium | Smoke + sample APIs |
| Role checks | `hasRole('Administrator' \| 'IberniaIdentityAdminAdministrator')` | `auth.service.ts`, `admin-guard.service.ts`, `full.component.ts` | P1 | Medium | Admin flows |

---

## Clients & profile (home)

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Client list | Table, search, sort, expandable rows, loading | `client-list.component.ts`, `GET .../Clients/{advisorId}/all`, `/search` | P0 | High | Full |
| Add client | Dialog form: names, DOB, email, inflation, partner optional | `client-add.component.ts`, `POST /api/v1/Clients` | P0 | High | Full + validation |
| Edit / delete client | Dialog + API | `client-edit.component.ts`, `PUT`/`DELETE` | P1 | Medium | Full |
| Client profile | Cashflow cards, sort, edit client, questionnaire | `profile.component.ts` | P0 | High | Full |
| Create cashflow | Add model dialog: name, duration, inflation | `add-model-dialog.component.ts`, `POST /api/v1/cashflows` | P0 | Medium | Full |
| Copy / delete cashflow | Profile actions | `cashflow-http.service.ts` `copy`, `delete` | P1 | Medium | Regression |

---

## Questionnaire

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Advisor: create link | Choose questions, get token & URL | `QuestionnaireHttpService.createLink`, profile dialogs | P1 | Medium | Full |
| Advisor: view responses | Client responses dialog | `GET .../Questionnaire/client/{clientId}` | P1 | Medium | Full |
| Public: fill survey | `/questionnaire/:token`, intro, steps, submit | `client-questionnaire.component.ts`, public interceptor paths | P0 | High | Full |

---

## Cashflow workspace

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Resolver / store | Load cashflow into NgRx before child routes | `cashflow.resolver.ts`, `CashflowEffects` | P1 | Medium | Smoke + navigation |
| Bottom nav (primary) | Goals, Savings, Money In & Out, Flows, Lifetime Plan | `cashflow-nav.component.ts` → `timeline`, `finances`, `income`, `withdrawal`, `reports` | P0 | Medium | Full |
| Layout nav visibility | Nav hidden on routes outside five primary tabs | `cashflow-layout.component.ts` (`NAV_ROUTES`) | P2 | Low | Spot-check |
| Sidebar (secondary) | Protection, Wealth, Learn, Insights, AI Chat | `sidebar-data.ts` | P1 | Medium | Full |

### Timeline (Goals)

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Timeline & events | GET/POST/PUT/DELETE timelines & events | `timeline-http.service.ts` | P0 | High | Full |
| Mortgage calculators | Dialogs | `mortgage-calculator*.component.ts` | P2 | Medium | Spot-check |

### Savings (Finances)

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Saving pots CRUD | Pots per cashflow | `savings-pots-http.service.ts` | P0 | High | Full |

### Income & expenses

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Income/expense CRUD | Financial lines | `income-expenses-http.service.ts` | P0 | High | Full |

### Withdrawals & contributions (Flows)

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Funds CRUD | Withdrawals & contributions | `withdrawals-contributions-http.service.ts` | P0 | High | Full |

### Reports & scenario

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Lifetime plan charts | GET report, forecast POST, comparison UI | `reports-http.service.ts`, `reports.component.ts` | P0 | High | Full |
| Scenario lab | Sliders, simulate, create-from-scenario | `scenario-lab.component.ts`, `ReportsHttpService.getReportScenario`, `CashflowHttpService.createFromScenario` | P1 | High | Regression |

### Emergencies (Protection)

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Emergencies + simulate | `emergencies-http.service.ts` | P1 | High | Full |

### Wealth & legacy

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Assets & liabilities | `wealth-http.service.ts` | P1 | High | Full |
| Legacy members, tax, beneficiary | `legacy-http.service.ts` | P2 | High | Targeted |

### AI & chat

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| AI recommendations | Usage, analyze, feedback | `ai-recommendations-http.service.ts`, `/api/v1/agentic/*` | P0/P1 | High | Full |
| Agent chat | Conversations + messages | `agent-chat-http.service.ts` | P1 | Medium | Full |

---

## Settings

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Account preferences | Profile, photo crop | `account-preferences.component.ts`, `SettingsService` UserProfile | P0 | Medium | Full |
| Default assumptions | Defaults for planning | `default-assumptions.component.ts` | P1 | Medium | Full |
| Plans & billing | Pricing cards (mostly static) | `plan-billing.component.html` | P2 | Low | Visual + buttons |
| Notifications | Preferences + web push | `notifications/`, `notification-preferences.service.ts`, `web-push.service.ts` | P1 | Medium | Full |
| Branding | Org branding | `branding.component.ts`, `organization.profiles.service.ts` | P2 | Medium | Spot-check |
| Help & contact | Static / links | `help-and-contact.component.ts` | P2 | Low | Smoke |
| Privacy & data | Export, account termination | `privacy-data.component.ts`, `data-privacy.service.ts` | P1 | High | Careful on DEV |
| AI recommendations (settings) | Duplicate entry point | Route `/settings/ai-reccomendations` (typo) | P2 | Low | Consistency check |
| Admin notifications | CRUD + send (admin roles) | `admin-notifications/*`, `AdminGuard` | P1 | High | Role-based |
| External Security | Opens Identity change password | `settings-nav-config.ts` `external: true` | P1 | Low | Link opens |
| External Identity Admin | Opens `adminUrl` | `settings-nav-config.ts` | P2 | Low | Link opens |

---

## Public & shared links

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Client report | Password, 1h localStorage, consumer ask | `client-report.component.ts`, `view-report-http.service.ts` | P0 | High | Full |

---

## Notifications (in-app)

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Bell + list | Unread count, mark read, MFA synthetic | `my-notifications.service.ts`, `mfa-reminder-notification.ts`, `header.component.ts` | P1 | Medium | Full |

---

## Localization & language

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| EN / IT | Header language, translations | `LanguageService`, `TranslateModule` | P1 | Medium | Spot-check key screens |

---

## Theme & layout

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Light / dark | `dark-theme` / `light-theme` on `document.documentElement` | `full.component.ts`, `header.component.ts` `setlightDark` | P2 | Low | Spot-check |

---

## Error handling & resilience

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Public API paths without auth wait | Questionnaire + client report view | `isPublicNoAuthRequest` in interceptor | P1 | Medium | Public flows |
| Missing/invalid routes | `**` redirect | `app.routes.ts` | P1 | Low | See OPEN_QUESTIONS |
| Toasts | User feedback | `ToastrService` across features | P2 | Low | Spot-check |

---

## Admin / internal

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Admin notifications | Same as settings admin section | Above | P1 | High | With admin account |

---

## Subscription / billing

| Feature | Description | Code hints | Priority | Complexity | Test depth |
|---------|-------------|------------|----------|------------|------------|
| Plans UI | Informational pricing; “Change plan” button present | `plan-billing.component.*` — **no payment API in this component** | P2 | Low | Visual; confirm with PM if checkout exists elsewhere |

---

## Feature flags

No dedicated feature-flag service was found in the portal source; behavior is driven by **environment** URLs and **user roles**.
