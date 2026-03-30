# Risk Matrix — Ibernia Portal (code-informed)

Risks inferred from **architecture and surface area** in `Ibernia-portal`. Not generic theory.

| Area | Why risky | Probable failure modes | Business impact | User impact | Test intensity | Every release? |
|------|-----------|------------------------|-----------------|-------------|----------------|----------------|
| **OIDC + API auth** | All data paths depend on `getAccessToken()` and interceptor attaching Bearer token | Expired token, silent failure, missing Bearer → 401 loops or empty UI; logout redirect wrong | Advisors cannot work | Blocked | **High** — smoke + auth cases | Yes |
| **NgRx cashflow resolver** | Route waits for `selectedCashflow` to match id (`cashflow.resolver.ts`) | Stuck load, wrong cashflow if store stale, rapid navigation races | Wrong client data shown | Critical financial trust | **High** | Yes |
| **Financial CRUD** | Many PUT/POST/DELETE with body-heavy models (income, expense, pots, funds) | Partial save, duplicate rows on double-submit, wrong totals on charts | Incorrect plans | Misleading advice | **High** | Yes |
| **Reports & scenario APIs** | Heavy computation; query params (`inflationRate`), POST scenario payloads | Timeouts, chart mismatch, scenario lab baseline vs edited confusion | Wrong lifetime view | High stress for users | **High** | Yes |
| **Public questionnaire** | Unauthenticated; interceptor special-cases public URLs; mobile noted in comments | iOS hang if token path wrong; submit failures on bad network | Lost client intake | Poor client experience | **Medium–High** | Yes |
| **Public client report** | Password in POST body; 1h localStorage cache | Stale auth confusion, wrong password UX, token leakage if shared machine | Compliance / trust | Client confusion | **High** | Yes |
| **AI / agentic** | External dependency (`/api/v1/agentic/*`); usage limits in UI | Rate limits, empty analysis, silent errors | Differentiator feature fails | Frustration | **Medium** | Yes if AI ships |
| **Agent chat** | Conversation + message chain | Dropped messages, wrong conversation id | Feature unusable | Frustration | **Medium** | If enabled |
| **Admin notifications** | Role-gated; mass send to advisors | Wrong audience, duplicate sends, XSS in body if not sanitized server-side | Ops / compliance | Spam / trust | **Medium** | If admin code changes |
| **Privacy & data** | Export + account termination | Large exports fail; destructive terminate on wrong account | Legal / GDPR | Irreversible harm | **High** — DEV only | When touched |
| **Routing typo / orphan routes** | `default-preferance`, `ai-reccomendations`, possible missing `authentication/error` | User confusion, broken bookmarks | Support load | Dead ends | **Low–Medium** | Spot-check |
| **MFA reminder** | Synthetic notification depends on Identity claims shape | Missing reminder or wrong deadline text | Security posture | Annoyance or risk | **Low** | No |

### Regression-prone flows (from coupling)

1. **Create client → create cashflow → fill timeline/pots/income → reports** (cross-module).  
2. **Scenario lab** (pulls timeline + pots + income + reports API together).  
3. **Profile questionnaire** (token URL + advisor view responses).  
4. **Settings UserProfile** + header display name (two sources: API vs OIDC).  

---

## Recommended focus for releases touching…

| If you changed… | Re-test heavily |
|-----------------|-----------------|
| `http-request.interceptor.ts` | All API flows + public routes |
| `auth.service.ts` / Identity URLs | Login, logout, token refresh behavior |
| `cashflow.resolver.ts` / cashflow store | All `/cashflows/:id/*` |
| `reports-http.service.ts` / scenario lab | Reports + scenario lab + charts |
| Questionnaire components | Public + advisor sides |
| `plan-billing` | Visual + any new checkout integration (if added later) |
