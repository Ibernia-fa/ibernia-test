# Open Questions & Risks (from codebase review)

Items where behavior is **ambiguous**, **inconsistent**, or **unfinished** in the repo. Validate on DEV and close with engineering.

---

## 1. Routing

### Wildcard redirect vs error page

`app.routes.ts` sets `{ path: '**', redirectTo: 'authentication/error' }`, but **no route definition** for `authentication/error` was found in `app.routes.ts` or child routes in the reviewed files.

- **Risk:** Unknown URLs may land on a **blank** or **broken** route.  
- **Action:** On DEV, visit `/random-path-test-123` and document actual behavior.

---

## 2. Typos in user-facing routes (consistency & bookmarks)

| Route | Note |
|-------|------|
| `/default-preferance` | “preferance” spelling |
| `/settings/ai-reccomendations` | “reccomendations” spelling |

- **Risk:** Broken links in docs or emails if spelled “correctly.”  
- **Action:** Standardize or add redirects (product/engineering decision).

---

## 3. Plans & billing

`plan-billing.component.ts` is **presentational** (cards + “Change plan” button). No payment/subscription API calls appear in that component.

- **Risk:** Testers may expect checkout; clarify whether billing is **out of band** or handled elsewhere.  
- **Action:** PM confirms expected behavior on DEV.

---

## 4. Learn navigation item

`sidebar-data.ts` lists **Learn** with a **commented** route (`#` or no navigation).

- **Risk:** Click does nothing — may be reported as a bug.  
- **Action:** Confirm if intentional placeholder.

---

## 5. Environment-specific DEV URLs

`environment.ts` (non-production sample) points `apiUrl` to `https://localhost:7071`. **Deployed DEV** builds likely use a **different** `environment` file or CI substitution.

- **Risk:** Testers validate wrong API.  
- **Action:** Document **actual** `apiUrl` / `authority` for the DEV deployment you test.

---

## 6. Public API and auth

`http-request.interceptor.ts` skips waiting for token for paths containing `/Questionnaire/view/`, `/Questionnaire/submit/`, `/ClientReport/view/`.

- **Risk:** If backend paths change, public flows could **hang** waiting for auth (comment references iOS).  
- **Action:** Regression-test public flows whenever interceptor changes.

---

## 7. MFA reminder

MFA reminder notification is **synthetic** (not from API list) and depends on claim keys like `mfa_enabled`, `mfa_first_login_utc`.

- **Risk:** If Identity changes claim names, reminder disappears or shows wrong deadline.  
- **Action:** Coordinate with Identity team when claims change.

---

## 8. Automated tests

No `*.spec.ts` files were found under `Ibernia-portal` in this workspace snapshot.

- **Risk:** Regressions rely on manual and CI build success only.  
- **Action:** Track manual coverage via `TEST_CASES.csv` until e2e/unit tests exist.

---

## 9. Backend-only behavior

Validation beyond client-side (e.g. duplicate email, business rules for cashflow delete) is **not fully visible** in the portal source.

- **Action:** When client and server disagree, capture **HTTP status** and **response body** in bug reports.
