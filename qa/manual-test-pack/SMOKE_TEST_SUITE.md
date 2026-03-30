# Smoke Test Suite — Run before deeper testing

**Goal:** Minimum path that proves DEV is usable. If **any** case fails, stop and fix or file a bug before full regression.

**Time box:** ~15–25 minutes for an experienced tester.

Map to CSV IDs in `TEST_CASES.csv`.

---

## Smoke cases (must pass)

| ID | What to verify |
|----|----------------|
| **APP-001** | DEV portal loads |
| **APP-008** | Unauthenticated user is redirected to Identity for protected route |
| **APP-009** | Login completes and app loads |
| **APP-011** | API requests carry Bearer token after login |
| **APP-013** | Client list loads |
| **APP-017** | Add client dialog opens |
| **APP-022** | Add client succeeds (or use existing client if add blocked) |
| **APP-023** | Client profile opens |
| **APP-032** | Create cashflow / model from profile succeeds |
| **APP-034** | Navigate cashflow sub-routes (at least timeline + reports) |
| **APP-036** | Timeline loads |
| **APP-040** | Finances / saving pots load |
| **APP-043** | Income & expenses load |
| **APP-047** | Withdrawals / funds load |
| **APP-051** | Lifetime Plan / reports chart loads |
| **APP-029** | *(If token available)* Public questionnaire loads **OR** skip with note |
| **APP-086** | *(If token available)* Public report loads **OR** skip with note |

---

## Optional same-session smoke (if time)

- **APP-010** Logout  
- **APP-065** AI analyze (if AI enabled on DEV)  
- **APP-070** Settings account preferences open  

---

## Smoke exit criteria

- [ ] No **S1** / **S2** issues in smoke path  
- [ ] **Identity** and **API** URLs match the intended DEV stack  

If smoke fails: record in `TEST_EXECUTION_TRACKER.csv` and notify the team before continuing.
