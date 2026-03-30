# Regression Test Suite — Repeated-release pack

Run on **DEV** (or staging) **before each release** or after any change to auth, HTTP, cashflow store, reports, or financial CRUD.

This is a **subset** of `TEST_CASES.csv` chosen for **high business impact** and **regression-prone coupling**.

---

## Tier A — Always (core product)

| ID | Area |
|----|------|
| APP-008 – APP-012 | Auth (login, logout, token, session edge) |
| APP-013 – APP-025 | Clients list, add, validation, profile, edit |
| APP-032 – APP-035 | Cashflow create + navigation + layout |
| APP-036 – APP-038 | Timeline load + add/delete event |
| APP-040 – APP-042 | Saving pots |
| APP-043 – APP-046 | Income & expenses |
| APP-047 – APP-050 | Withdrawals & contributions |
| APP-051 – APP-053 | Reports / lifetime plan |
| APP-070 – APP-073 | Settings: account, defaults, notifications prefs |
| APP-096 – APP-097 | Refresh persistence + client/cashflow consistency |

---

## Tier B — Each release when area touched

| ID | When to include |
|----|-----------------|
| APP-054 – APP-056 | Scenario lab / reports scenario API changed |
| APP-057 – APP-059 | Emergencies changed |
| APP-060 – APP-063 | Wealth / legacy changed |
| APP-064 – APP-066 | AI recommendations changed |
| APP-068 – APP-069 | Agent chat changed |
| APP-027 – APP-031 | Questionnaire advisor + public changed |
| APP-086 – APP-089 | Client report changed |
| APP-083 – APP-084 | Admin notifications / roles changed |

---

## Tier C — Periodic / monthly

| ID | Note |
|----|------|
| APP-090 – APP-092 | i18n + theme |
| APP-093 – APP-095 | Error handling + empty states |
| APP-098 | Performance spot-check with large list |

---

## How to mark regression runs

1. In `TEST_EXECUTION_TRACKER.csv`, add a row: **Module** = `Regression`, **Test Case ID Range** = e.g. `APP-008–APP-097` + selected Tier B.  
2. Set **Execution Status** = `Complete` only when all included cases are Pass or documented Waived.

---

## Estimated effort

- **Tier A only:** ~2–4 hours manual (depending on data setup).  
- **Tier A + B (selected):** +1–3 hours.  

Parallelize by module across testers (see `QA_MANAGER_SUMMARY.md`).
