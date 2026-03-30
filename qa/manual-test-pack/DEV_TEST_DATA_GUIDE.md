# DEV Test Data Guide — Ibernia Portal

There are **no committed test accounts or passwords** in this repository. Coordinate with engineering / ops for DEV Identity users and API seed data.

---

## 1. Accounts and roles

| Need | Suggested setup | Used for |
|------|-----------------|----------|
| **Standard advisor** | One primary DEV user | Clients, cashflows, full workflow |
| **Second advisor** (optional) | Another user | Isolation / permissions checks |
| **Administrator** (or `IberniaIdentityAdminAdministrator`) | At least one admin | `AdminGuard` → `/settings/admin-notifications` |
| **MFA off user** (if safe) | User without MFA in claims | MFA synthetic notification in bell (`mfa_enabled` false) |
| **Public access** | No login | `/questionnaire/:token`, `/view/report/:token` |

**Identity URLs** (reference from `environment.production.ts` vs `environment.ts`): production uses `https://identity.ibernia.it`; non-local sample uses `https://dev-identity.ibernia.it`. Use whatever matches your DEV build.

---

## 2. Sample inputs — clients (from `client-add.component.ts`)

- **Names:** `Test`, `User` (avoid real PII on shared DEV).  
- **Email:** Use a disposable pattern `you+devtest1@yourdomain.com`.  
- **DOB:** Valid calendar date; **DDMMYYYY** paste is supported by custom `DmyDateAdapter` — test `01011980` style input.  
- **Inflation:** `0`–`100` (validators); typical `2.5`.  
- **Partner:** Enable partner section only when testing partner validation (required first/last name when block active).  

---

## 3. Edge-case inputs

| Field / area | Try |
|--------------|-----|
| Email | Invalid: `not-an-email`, empty |
| Inflation | `-1`, `101` |
| Dates | Impossible DOB; future DOB if allowed |
| Very long text | Notes / description fields — long Unicode string |
| Questionnaire | Skip required questions; single-option edge cases |
| Report password | Wrong password with valid token |
| Cashflow id | Random UUID in URL `/cashflows/{bad-id}/timeline` |

---

## 4. Realistic scenarios to simulate

1. **New household:** Add client → create “Plan 1” → add timeline goal → add saving pot → add salary → view Lifetime Plan.  
2. **Stress test:** Large number of income lines + expenses → reports still render.  
3. **Scenario planning:** Open Scenario Lab → change inflation/retirement → run simulation → optional create-from-scenario.  
4. **Client intake:** Send questionnaire link → complete as public user → verify advisor sees responses.  
5. **Client deliverable:** Open shared report link → enter password → optional consumer ask.  

---

## 5. Invalid / negative data

- Submit forms empty; submit with only whitespace where not trimmed.  
- Rapid double-click **Save** on creates.  
- Browser **back** after delete — ensure no ghost records in UI.  

---

## 6. Destructive tests (careful)

| Action | Risk | Guidance |
|--------|------|----------|
| **Delete client** | Removes client data | Only on **dedicated** test clients |
| **Delete cashflow** | Removes model | Same |
| **Account termination** (`privacy-data`) | Irreversible for that account | **Never** on shared or prod-like accounts |
| **Admin notification send** | Emails/notifications to real advisors | Use test advisors or mock environment |

---

## 7. Reset / cleanup (from code behavior)

- **Client report auth:** `localStorage` key `report_auth_{token}` — clear for retest of password flow.  
- **Session return URL:** `sessionStorage` key from `AUTH_RETURN_URL_KEY` in `auth-guard.service.ts` — clearing may affect post-login redirect testing.  
- **No repo-documented “reset DB” script** for the portal—ask backend team for DEV data refresh.

---

## 8. API quick reference (for Network tab checks)

- Clients: `/api/v1/Clients/...`  
- Cashflows: `/api/v1/cashflows`, `/api/v1/client/{clientId}/cashflows`  
- Timelines: `/api/v1/cashflows/{id}/timelines/...`  
- Saving pots: `/api/v1/cashflows/{id}/saving-pots`  
- Income/expense: `/api/v1/cashflows/{id}/.../financial/...`  
- Funds: `/api/v1/cashflows/{id}/funds/...`  
- Reports: `/api/v1/Reports/{cashflowId}`  
- Agentic: `/api/v1/agentic/...`  
- Questionnaire: `/api/v1/Questionnaire/...`  
- Client report: `/api/v1/ClientReport/view/report/{token}`  

All are prefixed by `environment.apiUrl` in the running app.
