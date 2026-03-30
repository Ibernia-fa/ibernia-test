# Bug Report Template — Ibernia Portal

Copy the block below into Jira, Linear, GitHub, or email.

---

## Title
Short, specific: *[Area] Brief behavior — e.g. “Clients: Add client dialog allows submit with invalid email”*

---

## Environment
- **App:** Ibernia Portal (Angular)  
- **Deployment:** DEV  
- **Portal URL:** `https://________________`  
- **Browser + version:** e.g. Chrome 134  
- **OS:** e.g. macOS 15  

---

## Build / commit
- **Frontend build / commit / branch:** _______________  
- **Known API / Identity:** _______________ (if relevant)  

---

## Tester name
_______________

---

## Module
e.g. Clients / Cashflow — Timeline / Settings — Notifications / Public Report / Auth  

---

## Severity
- **S1** — Crash, data loss, security issue, complete blocker  
- **S2** — Major feature broken; no workaround  
- **S3** — Minor feature wrong; workaround exists  
- **S4** — Cosmetic, typo, minor copy  

---

## Priority
(How soon to fix — product decision; **P0** = immediate, **P1** = this sprint, etc.)

---

## Precondition
- Account type: _______________  
- Data required: _______________  
- Feature flags / special setup: _______________  

---

## Steps to reproduce
1.  
2.  
3.  

---

## Expected result
What should happen (observable).  

---

## Actual result
What happened instead (observable).  

---

## Frequency
- [ ] Always  
- [ ] Often  
- [ ] Sometimes  
- [ ] Once  

---

## Screenshot / video evidence
Link or attach: _______________  

---

## Logs / console / network (if relevant)
- **Console errors:**  
- **Failing request:** method + URL + status code  
- **Response body snippet** (no secrets):  

---

## Regression?
- [ ] Yes — worked in: _______________  
- [ ] No  
- [ ] Unknown  

---

## Blocks testing?
- [ ] Yes — cannot test module: _______________  
- [ ] No  

---

## Linked test case ID (optional)
e.g. `APP-018`  

---

## Example bug reports (good quality)

### Example 1 — Functional

**Title:** Reports: Changing inflation on Lifetime Plan does not refresh chart until manual reload  

**Environment:** DEV, Chrome 134, macOS 15  

**Build:** `iber-portal@dev-2026-03-28`  

**Module:** Cashflow — Reports / Lifetime Plan  

**Severity:** S2  

**Precondition:** Cashflow with valid income/expense data; user on `/cashflows/{id}/reports`.  

**Steps:**  
1. Note current chart.  
2. Change inflation in the UI control (if present) or via scenario.  
3. Observe chart without refreshing the browser.  

**Expected:** Chart updates to reflect new inflation or shows loading then new data.  

**Actual:** Chart stays on old series until full page refresh.  

**Network:** `GET .../Reports/{id}?inflationRate=...` returns 200 with new data but UI does not bind.  

**Regression:** Unknown  

**Blocks testing:** No  

---

### Example 2 — Validation

**Title:** Client add: Partner DOB can be submitted empty when partner section expanded  

**Environment:** DEV, Safari 17  

**Module:** Clients — Add client  

**Severity:** S2  

**Precondition:** Add client dialog; “Partner” section enabled.  

**Steps:**  
1. Fill primary client fields.  
2. Expand partner; leave partner DOB empty.  
3. Submit.  

**Expected:** Validation error on partner DOB or partner fields per form rules.  

**Actual:** Form submits; API returns 400 or saves inconsistent data.  

**Evidence:** Screenshot of form state + Network response.  

---

### Example 3 — Public flow

**Title:** Questionnaire: Submit spinner never stops on slow network  

**Environment:** DEV, Chrome, DevTools Slow 3G  

**Module:** Public — Questionnaire  

**Severity:** S2  

**Steps:**  
1. Complete questionnaire on `/questionnaire/{token}`.  
2. Submit.  

**Expected:** Success screen or clear error; `isSubmitting` resets.  

**Actual:** Button stays disabled forever; no error message.  

**Console:** (paste if any)  

---
