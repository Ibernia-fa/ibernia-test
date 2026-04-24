# Ibernia - Engineer Test Plan

**Environment:** https://dev.ibernia.it | API: https://dev-api.ibernia.it | Identity: https://dev-identity.ibernia.it | Admin: https://dev-admin.ibernia.it
**Goal:** Comprehensive functional, integration, edge-case, and regression testing across every feature area.

> Do NOT use the admin account. Create your own account for testing.
> For admin-specific tests (sections 11.4, 11.5), request the admin role to be assigned to your account via the Identity Admin UI, or create a second test account with admin privileges.

---

## 1. Registration, Authentication, and Session Management

### 1.0 User Registration

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.0.1 | Registration page | Open app, click Register on login page | Registration form loads with name, email, password fields |
| 1.0.2 | Valid registration | Fill all fields with valid data (email: your real email, password: min 8 chars) | Account created, redirect to confirmation page |
| 1.0.3 | Duplicate email | Try registering with the same email again | Error: email already taken |
| 1.0.4 | Weak password | Try registering with password "123" | Validation error: password too short/weak |
| 1.0.5 | Empty required fields | Submit with blank name or email | Validation errors shown |
| 1.0.6 | Email confirmation | Check inbox for confirmation email, click link | Account confirmed, can now sign in |
| 1.0.7 | Login before confirmation | Try signing in before confirming email | Error or prompt to confirm email |
| 1.0.8 | MFA grace period | Sign in without 2FA after confirmation | Login succeeds; 7-day grace window starts; MFA reminder notification appears in-app |
| 1.0.9 | MFA grace expiry | (If testable) After 7 days without enabling 2FA | User is signed out and shown MFA required page |

### 1.1 OIDC Login Flow

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.1.1 | Fresh login | Clear all cookies/storage, open app | Redirect to Identity login page |
| 1.1.2 | Successful login | Enter your registered credentials | Auth code exchanged, token in `sessionStorage`, redirect to `/clients` |
| 1.1.3 | Invalid credentials | Enter wrong password | Error message on Identity login page, no token stored |
| 1.1.4 | Return URL preserved | Navigate to `/cashflows/abc/reports` while unauthenticated | After login, redirected to the originally requested URL |
| 1.1.5 | Token contents | After login, decode access token (jwt.io) | Contains `sub`, `role`, `scope` includes `ibernia_api`, `email`, `profile` |

### 1.2 Token Lifecycle

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.2.1 | Token expiry | Wait for `expires_at` or set clock forward | Silent renew attempt; if fails, redirect to login |
| 1.2.2 | Manual session clear | Delete `oidc.user:*` from sessionStorage, click any nav link | Redirected to login |
| 1.2.3 | Concurrent tabs | Login in tab A, open tab B to same app | Tab B should pick up the session (shared storage) |

### 1.3 Logout

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.3.1 | Normal logout | Click sign out | `sessionStorage` cleared, redirect to Identity logout, then to `/signout-callback-oidc` |
| 1.3.2 | Post-logout access | After logout, navigate to `/clients` directly | Redirect to login |

### 1.4 Role-Based Access

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.4.1 | Non-admin cannot see admin nav | Login as your test user (no admin role), go to Settings | "Admin Notifications" and "Identity Admin" NOT visible in sidebar |
| 1.4.2 | Non-admin guard redirect | Navigate directly to `/settings/admin-notifications` | Redirect to `/settings/notifications` |
| 1.4.3 | Admin sees admin nav | Login as a user with admin role assigned, go to Settings | "Admin Notifications" and "Identity Admin" visible in sidebar |
| 1.4.4 | Admin accesses admin notifications | Navigate to `/settings/admin-notifications` as admin | Page loads with notification management |
| 1.4.5 | 2FA setup | Settings > Security > enable authenticator | QR code displayed, TOTP enrollment works |
| 1.4.6 | 2FA login | Logout, login again | 2FA prompt appears, TOTP code required |
| 1.4.7 | Recovery codes | Generate recovery codes during 2FA setup | Codes shown; one code can be used to login if authenticator unavailable |
| 1.4.8 | Disable 2FA | Disable authenticator in Security settings | 2FA disabled, next login skips TOTP |

---

## 2. Client Management

### 2.1 Client List

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.1.1 | Empty state | Login after data cleanup | Empty client list with "Add Client" option visible |
| 2.1.2 | Search with no results | Type a random string in search | "No results" or empty table |

### 2.2 Create Client

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.2.1 | Valid creation | Fill all required fields (name, DOB, email, currency), save | `POST /api/v1/Clients` returns 200, client in list |
| 2.2.2 | Missing required fields | Leave name blank, try to save | Validation error, not submitted |
| 2.2.3 | Duplicate email | Create two clients with same email | Verify behavior (allowed or rejected) |
| 2.2.4 | Special characters | Client name with accents, apostrophes (e.g. "O'Brien", "Muller") | Saved correctly, displayed correctly |

### 2.3 Edit Client

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.3.1 | Edit name | Change client name, save | `PUT /api/v1/Clients` succeeds, name updated in list |
| 2.3.2 | Edit DOB | Change date of birth | Updated; affects age calculations in reports |

### 2.4 Delete Client

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.4.1 | Delete client | Delete a client | `DELETE /api/v1/Clients/{id}` succeeds, removed from list |
| 2.4.2 | Delete client with plans | Create a plan, then delete the client | Verify cascading behavior (plans also removed or error) |

### 2.5 Client Profile

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.5.1 | View profile | Click client in list | Profile page loads with client details |
| 2.5.2 | Add plan from profile | Click add plan/model | Dialog opens, plan created |
| 2.5.3 | Multiple plans | Create 2+ plans for one client | All listed, can switch between them |

---

## 3. Financial Workflow - Timeline

### 3.1 Timeline Screen

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 3.1.1 | Initial load | Navigate to `/cashflows/{id}/timeline` | Chart renders, default event chips visible (Birth, Retirement, etc.) |
| 3.1.2 | Default events present | Check draggable chips area | 5 default events with correct icons from seed data |

### 3.2 Event Drag and Drop

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 3.2.1 | Birth event (placeholder) | Drag Birth chip to chart | Drops directly without popup (`IsPlaceHolder: true`) |
| 3.2.2 | Non-placeholder event | Drag Retirement to chart | Popup opens with form fields |
| 3.2.3 | Fill event details | Complete popup form, save | `POST /api/v1/cashflows/{id}/timelines/events` succeeds, event on chart |
| 3.2.4 | Delete event | Open a plan and go to Timeline. Click a chip or marker already on the chart (not only a chip in the top row). A cross (remove) icon appears for that chip; click it to delete the chip from the chart | Chip no longer on chart; `DELETE /api/v1/cashflows/{id}/timelines/events/{eventId}` succeeds |

Car **Financing** opens the **loan calculator** (vehicle-oriented fields and flow). Home **Financing** opens the **mortgage calculator** (property price and its own validation). Treat them as separate scenarios; neither replaces the other.

### 3.3 Financing Events

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 3.3.1 | Add financing event | Add a mortgage/financing event | `POST /api/v1/cashflows/{id}/timelines/events/financing` succeeds |
| 3.3.2 | Delete financing event | Remove it | `DELETE /api/v1/cashflows/{id}/timelines/events/financing/{id}` succeeds |

---

## 4. Financial Workflow - Savings (Pots)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 4.1 | Empty state | New plan, navigate to Savings | Empty or default state |
| 4.2 | Add saving pot | Click add, fill details, save | `POST /api/v1/cashflows/{id}/saving-pots` succeeds |
| 4.3 | Edit saving pot | Change amount or name | `PUT /api/v1/cashflows/{id}/saving-pots` succeeds |
| 4.4 | Delete saving pot | Remove a pot | `DELETE /api/v1/cashflows/{id}/saving-pots` succeeds |
| 4.5 | Multiple pots | Add 3+ pots | All listed, totals calculated |

---

## 5. Financial Workflow - Income and Expenses

### 5.1 Income

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 5.1.1 | Add income | Fill income form, save | `POST /api/v1/cashflows/{id}/financial/income` succeeds |
| 5.1.2 | Edit income | Change amount | `PUT /api/v1/cashflows/{id}/financial/income` succeeds |
| 5.1.3 | Delete income | Remove income item | `DELETE /api/v1/cashflows/{id}/financial/income` succeeds |
| 5.1.4 | Amount cycles | Verify yearly/monthly options populated from seed data | Dropdown shows seeded cycles |

### 5.2 Expenses

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 5.2.1 | Add expense | Fill expense form, save | `POST /api/v1/cashflows/{id}/financial/expense` succeeds |
| 5.2.2 | Edit expense | Change amount | `PUT /api/v1/cashflows/{id}/financial/expense` succeeds |
| 5.2.3 | Delete expense | Remove expense item | `DELETE /api/v1/cashflows/{id}/financial/expense` succeeds |

---

## 6. Financial Workflow - Flows (Withdrawals and Contributions)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 6.1 | Add contribution | Fill form, save | `POST /api/v1/cashflows/{id}/funds/contributions` succeeds |
| 6.2 | Edit contribution | Change amount | `PUT /api/v1/cashflows/{id}/funds/contributions` succeeds |
| 6.3 | Delete contribution | Remove | `DELETE /api/v1/cashflows/{id}/funds/contributions` succeeds |
| 6.4 | Add withdrawal | Fill form, save | `POST /api/v1/cashflows/{id}/funds/withdrawals` succeeds |
| 6.5 | Edit withdrawal | Change amount | `PUT /api/v1/cashflows/{id}/funds/withdrawals` succeeds |
| 6.6 | Delete withdrawal | Remove | `DELETE /api/v1/cashflows/{id}/funds/withdrawals` succeeds |

---

## 7. Financial Workflow - Reports (Lifetime Plan)

### 7.1 Single Plan View

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 7.1.1 | Report loads | Navigate to Lifetime Plan tab | `POST /api/v1/Reports/{id}` called, stacked bar chart renders |
| 7.1.2 | Hover tooltip | Hover over a bar | Shows year, age, breakdown by category |
| 7.1.3 | Scenario Lab button visible | Check below chart area | "Scenario Lab" button present |

### 7.2 Plan Comparison

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 7.2.1 | Enter comparison mode | Click Compare, select another plan | Comparison line chart appears |
| 7.2.2 | Bar charts hidden | In comparison mode | Both individual bar charts hidden |
| 7.2.3 | Scenario Lab hidden | In comparison mode | Scenario Lab button not visible |
| 7.2.4 | X-axis shows ages | Check x-axis labels | Shows client ages (34, 35, 36...), not years |
| 7.2.5 | Tooltip correctness | Hover on chart point | Shows "Age: 34 | Year: 2026" with values for both plans |
| 7.2.6 | Line colors | Verify two plans distinguishable | Plan A: blue (#5D87FF), Plan B: orange (#FA896B) |
| 7.2.7 | Deficit styling | If a plan goes negative | Line changes to dashed for negative values |
| 7.2.8 | Exit comparison | Click "Exit Comparison" | Returns to single bar chart, Scenario Lab button reappears |
| 7.2.9 | Compare plans with different date ranges | Plans with different start/end years | Both aligned on common years, missing years show 0 |

### 7.3 Scenario Lab

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 7.3.1 | Open Scenario Lab | Click Scenario Lab from reports | Scenario Lab screen loads |
| 7.3.2 | Run a scenario | Configure and run | `POST /api/v1/Reports/{id}/scenario` returns modified projections |

---

## 8. Financial Workflow - Protection (Emergencies)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 8.1 | Initial state | Navigate to Protection | Default emergencies created via `EmergenciesService.AddDefaultEmergencies` |
| 8.2 | Protection score | Check score display | Score calculated and visible |
| 8.3 | Add emergency | Add a new emergency item | `POST /api/v1/emergencies` succeeds |
| 8.4 | Edit emergency | Modify amount | `PUT /api/v1/emergencies` succeeds |
| 8.5 | Delete emergency | Remove item | `DELETE /api/v1/emergencies/{id}` succeeds |
| 8.6 | Simulate emergency | Click simulate | `POST /api/v1/emergencies/simulate` returns simulation results |

---

## 9. Financial Workflow - Wealth

### 9.1 Net Worth Tab

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 9.1.1 | Load wealth screen | Navigate to Wealth | Net Worth tab active |
| 9.1.2 | Add asset | Fill asset form, save | `POST /api/v1/wealth/{id}/assets` succeeds |
| 9.1.3 | Edit asset | Change value | `PUT /api/v1/wealth/{id}/assets` succeeds |
| 9.1.4 | Delete asset | Remove | `DELETE /api/v1/wealth/{id}/assets/{assetId}` succeeds |
| 9.1.5 | Add liability | Fill form, save | `POST /api/v1/wealth/{id}/liabilities` succeeds |
| 9.1.6 | Edit liability | Change value | `PUT /api/v1/wealth/{id}/liabilities` succeeds |
| 9.1.7 | Delete liability | Remove | `DELETE /api/v1/wealth/{id}/liabilities/{liabilityId}` succeeds |
| 9.1.8 | Net worth calculation | Add assets and liabilities | Net worth = total assets - total liabilities |

### 9.2 Legacy Tab

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 9.2.1 | Switch to Legacy | Click Legacy tab | Legacy screen loads |
| 9.2.2 | Add family member | Add member | `POST /api/v1/legacy/{id}/members` succeeds |
| 9.2.3 | Edit member | Modify details | `PUT /api/v1/legacy/{id}/members` succeeds |
| 9.2.4 | Delete member | Remove | `DELETE /api/v1/legacy/{id}/members/{memberId}` succeeds |
| 9.2.5 | Update tax settings | Change tax config | `PUT /api/v1/legacy/{id}/tax-settings` succeeds |
| 9.2.6 | Update beneficiary rules | Set rules | `PUT /api/v1/legacy/{id}/beneficiary-rules` succeeds |
| 9.2.7 | Simulate scenario | Run Client Dies simulation | `GET /api/v1/legacy/{id}/simulate/ClientDies` returns results |
| 9.2.8 | Simulate Partner Dies | Run Partner Dies | Results differ from Client Dies |
| 9.2.9 | Simulate Both Die | Run Both Die | Correct combined results |
| 9.2.10 | Parent estate | Update parent estate | `PUT /api/v1/legacy/{id}/parent-estates` succeeds |

---

## 10. Financial Workflow - AI Features

### 10.1 AI Recommendations

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 10.1.1 | Load AI Recommendations | Navigate to AI Recommendations | Screen loads with usage info |
| 10.1.2 | Get plan analysis | Request analysis | `POST /api/v1/agentic/plan` returns AI-generated insights |
| 10.1.3 | View saved insights | Check insights list | `GET /api/v1/agentic/insights/{cashflowId}` returns any previously saved |
| 10.1.4 | Submit feedback | Rate an insight | `POST /api/v1/agentic/feedback` succeeds |

### 10.2 Agent Chat

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 10.2.1 | Start conversation | Open Agent Chat, send message | `POST /api/v1/agentic/conversations` creates session |
| 10.2.2 | Multi-turn chat | Send follow-up messages | `POST /api/v1/agentic/conversations/{id}/messages` returns context-aware responses |
| 10.2.3 | Conversation history | Navigate away and back | `GET /api/v1/agentic/conversations` lists previous conversations |
| 10.2.4 | View conversation | Click a previous conversation | `GET /api/v1/agentic/conversations/{id}` loads full history |

### 10.3 School

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 10.3.1 | Load school | Navigate to School in sidebar | Educational content/slides load |

---

## 11. Settings

### 11.1 Account Preferences

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 11.1.1 | View preferences | Navigate to Account Preferences | Profile info loaded |
| 11.1.2 | Edit name/bio | Change and save | `PUT /api/v1/UserProfile` succeeds |
| 11.1.3 | Upload profile photo | Upload an image | Photo saved and displayed |
| 11.1.4 | Change language | Switch language | `PATCH /api/v1/UserProfile/{id}/language` succeeds, UI updates |

### 11.2 Default Assumptions

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 11.2.1 | View defaults | Navigate to Default Assumptions | Current defaults loaded |
| 11.2.2 | Edit defaults | Change values, save | Saved successfully |

### 11.3 Notifications

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 11.3.1 | View notification preferences | Navigate to Notifications | Preference toggles loaded |
| 11.3.2 | Toggle preferences | Enable/disable channels | `PUT /api/v1/NotificationPreferences` succeeds |
| 11.3.3 | View my notifications | Check bell icon / notifications list | `GET /api/v1/MyNotifications` returns list |
| 11.3.4 | Mark as read | Click a notification | `PATCH /api/v1/MyNotifications/{id}/read` succeeds |
| 11.3.5 | Mark all read | Click mark all | `PATCH /api/v1/MyNotifications/read-all` succeeds |
| 11.3.6 | Unread count | Check badge on bell icon | `GET /api/v1/MyNotifications/unread-count` matches badge |

### 11.4 Admin Notifications (Admin only)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 11.4.1 | List notifications | Navigate to Admin Notifications | `GET /api/v1/Notifications` returns list |
| 11.4.2 | Create notification | Fill form, save | `POST /api/v1/Notifications` succeeds |
| 11.4.3 | Edit notification | Modify and save | `PUT /api/v1/Notifications/{id}` succeeds |
| 11.4.4 | Send notification | Click send | `POST /api/v1/Notifications/{id}/send` succeeds |
| 11.4.5 | Delete notification | Remove | `DELETE /api/v1/Notifications/{id}` succeeds |
| 11.4.6 | View detail | Click on notification | `GET /api/v1/Notifications/{id}` loads detail |

### 11.5 AI Settings (Admin only)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 11.5.1 | View AI settings | Navigate to AI Recommendations in settings | Guidelines page loads |
| 11.5.2 | System prompt tab | Click System Prompt tab (admin only) | `GET /api/v1/admin/system-prompt` loads current prompt |
| 11.5.3 | Edit system prompt | Modify and save | `PUT /api/v1/admin/system-prompt` succeeds |

### 11.6 Branding

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 11.6.1 | View branding | Navigate to Branding | Current branding settings loaded |
| 11.6.2 | Edit branding | Change logo/colors | Saved and reflected in UI |

### 11.7 Privacy and Data

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 11.7.1 | View privacy settings | Navigate to Privacy & Data | Page loads |
| 11.7.2 | Export data | Request data export | `GET /api/v1/DataPrivacy/export/{advisorId}` returns downloadable data |
| 11.7.3 | Consent history | Check consent log | `GET /api/v1/Consent/history` returns entries |

### 11.8 Other Settings

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 11.8.1 | Plans and Billing | Navigate to Plans & Billing | Page loads |
| 11.8.2 | Help and Contact | Navigate to Help | Page loads with contact info |
| 11.8.3 | Security (external) | Click Security | Redirects to Identity Server `Manage/ChangePassword` with `returnUrl` back to portal |
| 11.8.4 | Password change | Change password on Identity page | Password updated, can sign in with new password |
| 11.8.5 | Password reset flow | From login page, click "Forgot password", enter email | Reset email received, link works, password changed |

---

## 12. Questionnaire (Public)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 12.1 | Create questionnaire | From client profile, create questionnaire link | `POST /api/v1/Questionnaire/create` returns token/link |
| 12.2 | View questionnaire (public) | Open `/questionnaire/{token}` in incognito | `GET /api/v1/Questionnaire/view/{token}` loads form without auth |
| 12.3 | Submit questionnaire | Fill and submit | `POST /api/v1/Questionnaire/submit/{token}` succeeds |
| 12.4 | View responses | From client profile, view responses | Submitted answers displayed |
| 12.5 | Invalid token | Open `/questionnaire/invalid-token` | Error message or empty state |
| 12.6 | Questions from seed | Check question content | 6 questions with 39 options from seed data |

---

## 13. Client Report Sharing (Public)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 13.1 | Generate share link | From report, click Share | Link generated with token |
| 13.2 | Open shared report (public) | Open `/view/report/{token}` in incognito | `POST /api/v1/ClientReport/view/report/{token}` renders report |
| 13.3 | Password protection | If password set, enter password | Correct password grants access |
| 13.4 | Invalid token | Open `/view/report/invalid` | Error or access denied |

---

## 14. Web Push Notifications

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 14.1 | VAPID key | Check subscription setup | `GET /api/v1/WebPush/vapid-public-key` returns key |
| 14.2 | Subscribe | Allow browser notifications | `POST /api/v1/WebPush/subscribe` succeeds |
| 14.3 | Check subscription | Verify | `GET /api/v1/WebPush/has-subscription` returns true |
| 14.4 | Unsubscribe | Disable notifications | `DELETE /api/v1/WebPush/unsubscribe` succeeds |

---

## 15. API Edge Cases and Error Handling

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 15.1 | Non-existent client | `GET /api/v1/Clients/non-existent-id` | 404 or appropriate error |
| 15.2 | Non-existent cashflow | `GET /api/v1/cashflows/non-existent-id` | 404 or appropriate error |
| 15.3 | Unauthorized API call | Call any API endpoint without token | 401 Unauthorized |
| 15.4 | Non-admin calling admin endpoint | Call `GET /api/v1/admin/system-prompt` without admin role | 403 Forbidden |
| 15.5 | Rate limiting (sensitive) | Call `POST /api/v1/DataPrivacy/erasure-request/{id}` > 10 times in 1 min | 429 Too Many Requests |
| 15.6 | Rate limiting (anonymous) | Call `POST /api/v1/agentic/consumer/ask` > 20 times in 1 min | 429 Too Many Requests |
| 15.7 | Malformed JSON body | `POST /api/v1/Clients` with invalid JSON | 400 Bad Request |
| 15.8 | Empty required fields | `POST /api/v1/Clients` with empty body | 400 or validation error |
| 15.9 | CORS preflight | Send OPTIONS from different origin | Appropriate CORS headers returned |
| 15.10 | Health check | `GET /health` without auth | 200 OK |

---

## 16. Organization Profiles

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 16.1 | Get org profile | After login | `GET /api/v1/Organizations/profiles/{userId}` returns profile |
| 16.2 | Create org profile | If none exists | `POST /api/v1/Organizations/profiles` creates one |

---

## 17. Cashflow Copy and Scenario Creation

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 17.1 | Copy cashflow | Duplicate an existing plan | `POST /api/v1/cashflows/copy` creates a copy with all data |
| 17.2 | Create from scenario | Create plan from scenario lab result | `POST /api/v1/cashflows/create-from-scenario` succeeds |

---

## 18. Cross-Browser and Responsive

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 18.1 | Chrome desktop | Full test flow | Works |
| 18.2 | Firefox desktop | Key flows (login, client CRUD, reports) | Works |
| 18.3 | Safari desktop | Key flows | Works |
| 18.4 | Tablet viewport | Resize to 768px width, test navigation | Responsive layout, no broken elements |
| 18.5 | Mobile viewport | Resize to 375px width | Sidebar collapses, content readable |

---

## 19. Data Cleanup Verification

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 19.1 | MongoDB seed data | Query Atlas `IberniaDb` | AmountCycle: 3, EscalationRate: 2, Event: 5, NotificationTemplate: 12, Question: 6, QuestionOption: 39 |
| 19.2 | MongoDB transactional data gone | Check Client, Cashflow, etc. collections | Don't exist or empty |
| 19.3 | PostgreSQL users | `SELECT COUNT(*) FROM "Users"` | At least 1 (admin + registered test users) |
| 19.4 | PostgreSQL grants cleared | `SELECT COUNT(*) FROM "PersistedGrants"` | 0 |
| 19.5 | PostgreSQL logs cleared | `SELECT COUNT(*) FROM "Log"` and `"AuditLog"` | 0 each |
| 19.6 | PostgreSQL OIDC config intact | `SELECT COUNT(*) FROM "Clients"` | 3+ |
| 19.7 | New data flows into clean DB | Create client, plan, add data, check MongoDB | New documents in Client, Cashflow, etc. collections |

---

## 20. Service Worker (PWA)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 20.1 | SW registered | Check DevTools > Application > Service Workers | `ngsw-worker.js` registered (production builds only) |
| 20.2 | Offline behavior | Go offline after initial load | Cached shell loads; API calls show appropriate errors |

---

**Pass criteria:** All scenarios pass without unhandled exceptions, 500 errors, or blank screens. API responses match expected status codes. Data integrity verified post-cleanup.
