# QA Manager Summary — Ibernia Portal Manual Pack

**Generated from:** `Ibernia-portal` (Angular) codebase review + `TEST_CASES.csv`  
**Date:** 2026-03-30  

---

## Totals

| Metric | Value |
|--------|------:|
| **Total test cases** | **168** |
| **Unique IDs** | APP-001 – APP-168 |

---

## Cases by priority

| Priority | Count | Suggested meaning |
|----------|------:|-------------------|
| **P0** | 32 | Block release if failed |
| **P1** | 58 | Fix before release or waive |
| **P2** | 74 | Schedule / best effort |
| **P3** | 4 | Optional / documentation |

---

## Cases by module (CSV labels)

Modules are **granular** in the sheet (e.g. “Clients” vs “Profile”). For **planning**, aggregate mentally:

| Aggregate area | Approx. cases (rows) | Notes |
|------------------|---------------------:|-------|
| **Clients + profile + client add** | ~25 | Includes questionnaire advisor rows |
| **Auth + setup + HTTP** | ~15 | Includes interceptor notes |
| **Cashflow + nav + store** | ~12 | Resolver, layout, sidebar |
| **Timeline + mortgage** | ~8 | |
| **Savings / finances** | ~4 | |
| **Income & expenses** | ~6 | |
| **Withdrawals / flows** | ~5 | |
| **Reports + scenario lab** | ~10 | |
| **Emergencies** | ~5 | |
| **Wealth + legacy** | ~9 | |
| **AI + agent chat + settings AI** | ~8 | |
| **Settings (all)** | ~15 | Account, billing, branding, privacy, etc. |
| **Notifications (in-app + admin)** | ~9 | |
| **Public: questionnaire + client report** | ~10 | |
| **Localization + theme + UX** | ~4 | |
| **Error / recovery / data integrity / regression** | ~10 | |
| **Misc** (header, sidebar, accessibility, feature flags) | ~8 | |

*Exact per-label counts: run `TEST_CASES.csv` pivot in Sheets or script.*

---

## Top 10 highest-risk flows (test first / every release)

1. OIDC login + Bearer token on API (`APP-008`–`APP-011`).  
2. Client list + add client + validation (`APP-013`–`APP-022`).  
3. Profile + create cashflow (`APP-023`, `APP-032`).  
4. Cashflow navigation + timeline + reports load (`APP-034`–`APP-036`, `APP-051`).  
5. Saving pots + income/expense + funds (`APP-040`–`APP-050`).  
6. NgRx cashflow resolver / wrong-id handling (`APP-033`, `APP-145`).  
7. Public questionnaire token load + submit (`APP-029`–`APP-031`).  
8. Public client report password + view (`APP-086`–`APP-089`).  
9. AI plan analysis + usage (`APP-064`–`APP-065`).  
10. Settings account + privacy (destructive careful) (`APP-070`, `APP-077`).  

---

## Recommended team split (5 testers)

| Tester | Owns (primary) | CSV hint |
|--------|----------------|----------|
| **T1** | Auth, setup, clients list/CRUD, profile | APP-001–025, profile-related |
| **T2** | Cashflow nav, timeline, savings, income/expense, withdrawals | APP-032–050 |
| **T3** | Reports, scenario lab, emergencies, wealth/legacy | APP-051–063 |
| **T4** | AI recommendations, agent chat, notifications, header UX | APP-064–069, APP-080–082 |
| **T5** | Settings (all), admin notifications (if admin), public questionnaire + report | APP-070–089, questionnaire |

**Overlap:** T1+T2 together run **smoke** (`SMOKE_TEST_SUITE.md`) on day one.

---

## Suggested order (3–5 people, one sprint)

1. **Day 1 morning:** Smoke suite — **everyone** on call until green.  
2. **Day 1–2:** T1–T2 complete core client + cashflow CRUD.  
3. **Day 2–3:** T3 financial depth + T4 AI/notifications.  
4. **Day 3–4:** T5 settings + public links + admin.  
5. **Day 5:** Regression tier A (`REGRESSION_TEST_SUITE.md`) + bug retest.

---

## Smoke vs full regression (effort)

| Pack | Approx. cases | Time (indicative) |
|------|---------------|-------------------|
| **Smoke** (`SMOKE_TEST_SUITE.md`) | ~15–18 steps | 15–25 min |
| **Regression Tier A** | ~55–70 IDs | 2–4 hours |
| **Full CSV** | 168 | 3–5+ days one person; parallelize |

---

## Areas for founder / PM review personally

1. **Plans & billing** — informational UI vs real checkout (`plan-billing.component.html`).  
2. **AI recommendations** — product copy, limits (`usageLimit` default 5 in UI), terms link.  
3. **Privacy & account termination** — destructive; verify messaging before wide testing.  
4. **Public client report** — password UX and consumer “ask” feature.  
5. **Route typos** (`default-preferance`, `ai-reccomendations`) — brand/SEO impact.  

---

## Trackability

- **Per-module completion:** filter `TEST_CASES.csv` by **Module** column.  
- **Per-tester:** **Tester** column + `TEST_EXECUTION_TRACKER.csv`.  
- **High-risk untested:** filter **Priority** = P0 and **Status** = Not Run.  

---

## Files in this pack

| File | Purpose |
|------|---------|
| `MASTER_TEST_PLAN.md` | How to run testing |
| `FEATURE_INVENTORY.md` | What exists in the product |
| `TEST_CASES.csv` | Executable cases |
| `TEST_RUN_CHECKLIST.md` | Quick checkbox pass |
| `BUG_REPORT_TEMPLATE.md` | Defect logging |
| `TEST_EXECUTION_TRACKER.csv` | Progress rollup |
| `RISK_MATRIX.md` | Risk-based focus |
| `DEV_TEST_DATA_GUIDE.md` | Data & accounts |
| `SMOKE_TEST_SUITE.md` | Minimal gate |
| `REGRESSION_TEST_SUITE.md` | Release regression |
| `OPEN_QUESTIONS_AND_RISKS.md` | Ambiguous / gaps |
| `QA_MANAGER_SUMMARY.md` | This document |
