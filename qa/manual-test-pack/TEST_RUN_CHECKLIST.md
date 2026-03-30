# Test Run Checklist — Quick pass (DEV)

Use this for a **fast confidence run**. For full coverage, use `TEST_CASES.csv`.  
Check boxes when verified on **DEV**.

**Tester:** _______________ **Date:** _______________ **Build:** _______________

---

## Environment & auth

- [ ] DEV portal loads without blank screen
- [ ] Unauthenticated user hitting `/clients` is sent to Identity login
- [ ] After login, user reaches app and API calls include bearer token (Network tab)
- [ ] Logout ends session; protected routes require login again

---

## Clients

- [ ] Client list loads
- [ ] Search / filter works (if applicable)
- [ ] Add client opens dialog
- [ ] Validation shows for missing required fields (name, email, DOB, etc.)
- [ ] Valid add creates client and appears in list
- [ ] Open client profile (`/clients/{id}/profile`)
- [ ] Edit client saves and UI refreshes
- [ ] Create new cashflow / model from profile with valid data
- [ ] Navigate into new cashflow workspace

---

## Cashflow — core tabs (same cashflow ID)

- [ ] **Goals** (`…/timeline`) loads timeline / events
- [ ] Add event (or equivalent) saves and appears
- [ ] **Savings** (`…/finances`) loads pots; add/edit pot works
- [ ] **Money In & Out** (`…/income`) loads; add income and expense works
- [ ] **Flows** (`…/withdrawal`) loads; add withdrawal/contribution works
- [ ] **Lifetime Plan** (`…/reports`) loads chart/report
- [ ] Secondary areas reachable: **Protection** (emergencies), **Wealth**, **AI Recommendations**, **Agent Chat** (spot-check at least two)

---

## Scenario & AI (if product-critical on DEV)

- [ ] Scenario lab page opens and simulation runs without crash
- [ ] AI Recommendations: usage shows; run analysis (or clear error if service down)
- [ ] Agent chat: send a message and receive response (or structured error)

---

## Questionnaire & public report

- [ ] Advisor can generate questionnaire link from profile (if applicable)
- [ ] Public questionnaire URL loads without login; submit succeeds
- [ ] Shared client report URL (`/view/report/:token`) loads; password works; report renders

---

## Settings

- [ ] Account preferences load and save
- [ ] Default assumptions load and save
- [ ] Plans & billing page displays plans (informational)
- [ ] Notifications settings load and save
- [ ] Privacy & data: **avoid** destructive actions unless using disposable account
- [ ] Security link opens Identity password/MFA page in new tab
- [ ] Admin Notifications: **only if admin** — list loads; create/send smoke OR confirm redirect for non-admin

---

## Notifications & UX

- [ ] Header notification bell: list + unread behavior
- [ ] Switch language EN/IT on key screen — strings update
- [ ] Toggle light/dark theme — layout remains usable
- [ ] Simulate offline or failed save — user sees error (toast/message), no infinite spinner

---

## Data integrity

- [ ] After creating/editing data, **refresh** page — persisted data matches
- [ ] Switching client/cashflow updates header/breadcrumb context correctly

---

## Done

- [ ] Failures logged with `BUG_REPORT_TEMPLATE.md`
- [ ] `TEST_EXECUTION_TRACKER.csv` updated
- [ ] CSV / tool updated with Actual Result + Status for executed rows
