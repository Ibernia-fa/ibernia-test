# Ibernia load tests (k6) — Identity signup (+ optional API client lifecycle)

This folder contains **k6** scripts for **dev Identity** registration load testing, with an optional follow-up flow on **Ibernia.Api** (create / update / delete clients) using **per-user** tokens (JWT or ROPC). Separate **smoke** scripts exercise **machine-to-machine** (`client_credentials`) tokens.

**Typical split:** run **`k6/identity/k6-identity-signup.js`** once to create users (omit **`SIGNUP_CLIENT_LIFECYCLE`** if you only want signups). For repeated client API load on **existing** users, use **`CLIENT_LIFECYCLE_ONLY=1`** with **`lifecycle-users.json`** (same script; no HTML signup).

**User pool (SQLite + leases, dev only):** one store at **`data/user-pool/dev/`** — provision with **`runners/provision-users.ps1`**, then **`runners/run-full-platform.ps1`**, **`runners/run-suite.ps1`**, or baseline runners **`run-baseline-concurrent-users.ps1`** / **`run-baseline-single-user.ps1`** (`-PoolEnv dev`). All scripts that call **`loadLifecycleUsers()`** / **`readAllLifecycleUsersAtInit`** also accept **`USE_USER_POOL=1`** + **`POOL_SLICE_FILE`**. See **[docs/user-pool.md](docs/user-pool.md)** and **`tools/pool-cli/`**.

**Adaptive throttling (opt-in):** per-API latency JSON/markdown reports and graceful early stop when sustained latency exceeds **`MAX_ACCEPTABLE_API_MS`** (default **500**). See **[docs/adaptive-throttling.md](docs/adaptive-throttling.md)** and **`runners/run-all-modules.ps1 -AdaptiveThrottle`**.

**Consolidated API performance (opt-in):** one cross-module report at **`reports/consolidated/consolidated-api-performance.md`** and **`.pdf`** (updated each run). See **[docs/consolidated-api-performance.md](docs/consolidated-api-performance.md)**, **`runners/run-baseline-single-user.ps1`**, or **`runners/run-all-modules.ps1 -ConsolidatedPerf`**.

**Implementation reference (full automation map):** **[docs/load-testing-automation-implementation.md](docs/load-testing-automation-implementation.md)** — architecture, script patterns, runners, pool, reporting, and CI.

---

## What is in this folder

**Layout:** shared helpers in **`lib/`**; Identity / OAuth utilities in **`k6/identity/`**; machine **Bearer** smoke in **`k6/api-smoke/`**; **full sequential DEV journey** in **`k6/full-platform/`**; Clients API load tests in **`k6/clients/`** (plus **`k6/clients-profile/`** for profile surface); cashflow domains under **`k6/cashflows-*/`**, including **`k6/cashflows-timeline/`** for **Events** and **GET …/timelines** scripts.

| Path | Purpose |
|------|--------|
| [`k6/full-platform/k6-full-platform-orchestrator.js`](k6/full-platform/k6-full-platform-orchestrator.js) | **Orchestrator:** lifecycle or **HTML signup** → **`load_tester`** ROPC → sequential Clients → Profile → Timeline → Events → Income → Finances → Reports → Wealth → **cleanup**; **`LOAD_MODE`**, combined summary JSON. See [`k6/full-platform/orchestrator.env.example`](k6/full-platform/orchestrator.env.example). |
| [`lib/k6-full-platform-phases.js`](lib/k6-full-platform-phases.js) | Shared **`executeFullPlatformSequence`** + optional **`probeModulesAccess`** (402 diagnostics). |
| [`lib/k6-identity-html-register.js`](lib/k6-identity-html-register.js) | **`performHtmlSignup`** / **`signupUser`** export: minimal **GET/POST** `/Account/Register` flow for orchestration (DEV). |
| [`lib/k6-client-lifecycle.js`](lib/k6-client-lifecycle.js) | Shared module: **`runSignupClientLifecycle`** (signup / lifecycle-only flows), **`lifecycleLoginAcquireToken`**, **`acquireLoadTesterToken`**, **`validateLoadTesterClaim`**, **`mergeLifecycleUserRowsByEmail`**, **`persistLifecycleUser`**, **`loadLifecycleUsers`** (also reads **`POOL_SLICE_FILE`** when **`USE_USER_POOL=1`**), **`refreshTokenIfNeeded`**, **`signupUser`** (HTML register), **`resolveAdvisorSub`**, **`buildClientModel`**, **`parseClientCreateResponse`**, **`parseJwtPayload`**, **`fetchPasswordGrantToken`**. Auth helpers live under **`lib/auth/`**. |
| [`tools/pool-cli/`](tools/pool-cli/) | **User pool CLI:** SQLite store, **`import-json`**, **`lease`**, **`release`**, **`stats`**, **`gc`**, **`verify-ropc`**. |
| [`tools/verify-lifecycle-ropc.mjs`](tools/verify-lifecycle-ropc.mjs) | Dev-only ROPC spot-check for **`lifecycle-users.json`** before **`import-json`** (see [docs/user-pool.md](docs/user-pool.md)). |
| [`docs/user-pool.md`](docs/user-pool.md) | User pool architecture and env vars. |
| [`runners/`](runners/) | **`provision-users.ps1`**, **`run-full-platform.ps1`**, **`run-suite.ps1`**, **`run-baseline-concurrent-users.ps1`**, **`run-baseline-single-user.ps1`**, **`run-all-modules.ps1`**. |
| [`lib/k6-load-cleanup.js`](lib/k6-load-cleanup.js) | **`deleteClientsAndPlansByLastNameNeedle`**, **`deleteCustomEventsByNameNeedle`** — teardown helpers (**GET …/Clients/{advisorId}/all**, **GET …/client/{clientId}/cashflows**) because k6 **`teardown()`** cannot read per-VU **`globalThis`**. |
| [`k6/clients/k6-client-full-lifecycle.js`](k6/clients/k6-client-full-lifecycle.js) | **Dedicated** Clients API load test: same business steps as the lib, but HTTP tags **`client_create_no_partner`**, **`client_update_no_partner`**, … for dashboards; **`finally`**-based delete cleanup. Uses **`lifecycle-users.json`** only (does not run HTML signup). |
| [`k6/clients/k6-clients-list-load.js`](k6/clients/k6-clients-list-load.js) | **`setup()`** row **0** login + **`runTag`**. **First iteration per VU** (concurrent): **POST** two clients (**`listseed{runTag}-vu{VU}-0|1`**), verify **GET …/all**; cache **`globalThis.__k6ClientsListSeedByVu`**. Load **`clients_list_all`**. **`teardown()`** — **`lib/k6-load-cleanup.js`** (needle **`listseed{runTag}`**). **`VUS`**, **`DURATION`**, **`gracefulStop`**. |
| [`k6/clients/k6-clients-search-load.js`](k6/clients/k6-clients-search-load.js) | **`setup()`** — row **0** login + **`runTag`** only. **First iteration per VU** (concurrent): **POST** client (`uniqueTag` **`k6srch{runTag}vu{VU}`**), verify **`GET …/search`**, cache on **`globalThis.__k6ClientsSearchByVu`**. Load **`clients_search`**. **`teardown()`** — **`GET …/Clients/{advisorId}/all`**, **DELETE** clients whose last name contains **`k6srch{runTag}`** (per-VU state is not visible in teardown on k6). Same env as list load. |
| [`k6/clients/k6-client-and-plans-per-user-load.js`](k6/clients/k6-client-and-plans-per-user-load.js) | Per user (shared-iterations): **one** **`POST /api/v1/Clients`** then **two** **`POST /api/v1/cashflows`** (plans), then deletes cashflows + client. Tags **`client_plans_*`**. Needs **`client_profile`** + **`cashflow`** modules; optional **`RELAX_CASHFLOW_MODULE`**. Same **`lifecycle-users.json`** / ROPC as full lifecycle. |
| [`k6/clients/k6-clients-get-by-id-seeded-load.js`](k6/clients/k6-clients-get-by-id-seeded-load.js) | **`setup()`** login + **`runTag`**. **First iteration per VU** (concurrent): seed client **`k6getid{runTag}vu{VU}`**, verify **GET by id**; load **`clients_get_by_id`**. **`teardown()`** — cleanup lib, needle **`k6getid{runTag}`**. Row **0** / ROPC. |
| [`k6/clients/k6-clients-get-by-id-load.js`](k6/clients/k6-clients-get-by-id-load.js) | Same **GET /Clients/{id}** endpoint with **screen-oriented** metrics + **`handleSummary`** → **`k6/clients/reports/k6-clients-get-by-id-load-report.json`**; seed tag **`k6cgetid{runTag}…`** (see **`common-clients-screen.js`**). |
| [`k6/clients/k6-clients-get-by-cashflow-id-load.js`](k6/clients/k6-clients-get-by-cashflow-id-load.js) | **`setup()`** login + **`runTag`**. **First iteration per VU** (concurrent): client + cashflow + verify **GET …/Clients/cashflow/{id}`**; load **`clients_get_by_cashflow_id`**. **`teardown()`** — cleanup lib, needle **`k6getcf{runTag}`**. **`client_profile`** + **`cashflow`**. Row **0**. |
| [`k6/cashflows-timeline/k6-cashflows-timelines-load.js`](k6/cashflows-timeline/k6-cashflows-timelines-load.js) | **`setup()`** logs + **`runTag`**. **First iteration per VU** (concurrent): client + cashflow + verify **GET …/timelines**; **`globalThis.__k6CashflowsTimelinesSeedByVu`**. **`constant-vus`**, **`vus` = row count**. **`teardown()`** — re-login each row, **`lib/k6-load-cleanup.js`** (needle **`k6tl-{runTag}`**). **`LIFECYCLE_MAX_USERS`**. Modules **`client_profile`**, **`cashflow`**, **`goals`**. |
| [`k6/cashflows-timeline/k6-cashflows-timelines-financing-load.js`](k6/cashflows-timeline/k6-cashflows-timelines-financing-load.js) | Same concurrent seed + **`runTag`** + cleanup lib as timelines load, but **GET …/timelines/financing** (tag **`cashflows_timelines_financing_get`**). Last-name needle **`k6tlf-{runTag}`**. Same modules. |
| [`k6/cashflows-timeline/k6-events-default-load.js`](k6/cashflows-timeline/k6-events-default-load.js) | **Timeline / Events:** read-only **`GET /api/v1/Events/default`**. **`setup()`** logs only. **First iteration per VU** — login + verify (**200** + array or **204**), concurrent; **`globalThis.__k6EventsDefaultSeedByVu`**. **`constant-vus`**, **`vus` = row count**. **Goals**; optional **`LIFECYCLE_MAX_USERS`**, **`RELAX_GOALS_MODULE`**. No teardown. |
| [`k6/cashflows-timeline/k6-events-custom-load.js`](k6/cashflows-timeline/k6-events-custom-load.js) | **`GET /api/v1/Events/custom`**: **`LOAD_MODE=vus`** or **`arrival`**; SLA / **`STRICT_PAYLOAD`** / **`X-Correlation-Id`**; **`handleSummary`** → **`k6/cashflows-timeline/reports/k6-events-custom-summary.json`** (override with **`SUMMARY_JSON_PATH`**). |
| [`k6/cashflows-timeline/k6-events-custom-seeded-load.js`](k6/cashflows-timeline/k6-events-custom-seeded-load.js) | **Journey + load:** client → cashflow → **POST Events** → verify **GET …/Events/custom**; load **`events_custom_seeded_get`**. **`teardown()`** — **`deleteCustomEventsByNameNeedle`** + **`deleteClientsAndPlansByLastNameNeedle`** (**`k6ce{runTag}`**). |
| [`k6/cashflows-timeline/k6-events-post-load.js`](k6/cashflows-timeline/k6-events-post-load.js) | **`POST /api/v1/Events`** + **DELETE**: per-VU seed probe, then iterations **POST** / **DELETE**. **`vus` = row count**. **`POST_EVENT_TYPE`**. **Goals**. |
| [`k6/cashflows-timeline/k6-events-post-delete-after-plan-load.js`](k6/cashflows-timeline/k6-events-post-delete-after-plan-load.js) | Client + cashflow + **POST/DELETE Events** under load; **`teardown()`** needle **`k6epd-{runTag}`**. Tags **`events_epd_*`**. Modules **`client_profile`**, **`cashflow`**, **`goals`**. |
| [`k6/cashflows-timeline/k6-cashflows-timeline-suite-load.js`](k6/cashflows-timeline/k6-cashflows-timeline-suite-load.js) | **Combined** parallel **`constant-vus`** scenarios (row **0** token): **GET** default + custom **Events**, **POST** + **DELETE** Events. Writes **`k6/cashflows-timeline/reports/cashflows-timeline-load-report.json`**. |
| [`k6/clients/k6-clients-create-open-profile-smoke.js`](k6/clients/k6-clients-create-open-profile-smoke.js) | **Smoke:** **one VU per row** in **`lifecycle-users.json`** (e.g. **20 users ⇒ 20 VUs**), each: login → **`POST /api/v1/Clients`** → **`GET /api/v1/Clients/{id}`** → **`DELETE`**. Uses executor **`per-vu-iterations`** so **`-e ITERATIONS=1`** is valid with many VUs. Optional **`-e LIFECYCLE_MAX_USERS=20`**, **`-e SCENARIO_MAX_DURATION=…`** (default **10m**). Same ROPC/JWT env as get-by-id load. |
| [`k6/identity/k6-ropc-token-inspect.js`](k6/identity/k6-ropc-token-inspect.js) | One-shot **ROPC** call + safe summary of **`access_token`** / **`id_token`** shape (JWT vs opaque, subject claims) — automates the manual jwt.io check; **`INSPECT_EMAIL`** / **`INSPECT_PASSWORD`** required. |
| [`k6/identity/k6-client-credentials-token-smoke.js`](k6/identity/k6-client-credentials-token-smoke.js) | Smoke: **`client_credentials`** → `POST {IDP_URL}/connect/token`. Supports **`TOKEN_AUTH=basic`**. Use to verify a **confidential** load-test client and scope. |
| [`k6/api-smoke/k6-dev-api-bearer-smoke.js`](k6/api-smoke/k6-dev-api-bearer-smoke.js) | Smoke: machine token + **`GET`** with **`Authorization: Bearer`**. Use **`API_PATH`** (e.g. Swagger JSON) or **`ADVISOR_ID`** for **`GET /api/v1/Clients/{advisorId}/all`**. |
| [`lifecycle-users.example.json`](lifecycle-users.example.json) | Template for **`lifecycle-users.json`** (`email` + `password` and/or `token`). |
| [`README.md`](README.md) | This document. |
| [`.gitignore`](.gitignore) | Ignores local secrets and state: **`lifecycle-users.json`**, **`users.json`**, **`k6-signup-band-state.json`**, **`data/user-pool/**/*.db`**, pool slice JSON. |

**Optional local files** (not committed; create when needed):

- **`lifecycle-users.json`** — copy from `lifecycle-users.example.json`; required for **`CLIENT_LIFECYCLE_ONLY=1`**.
- **`identity-user-sub-map.json`** — optional map `email` → Identity **UserId**; see `lib/k6-client-lifecycle.js` header and section below.

---

## Machine client smoke tests (`client_credentials`)

Use these to verify **Duende** client + **`ibernia_api`** scope and **Bearer** access to the API. The OAuth client and secret must exist on the **same** Identity deployment as **`IDP_URL`** (e.g. client created in **[dev admin](https://dev-admin.ibernia.it)** → use **`https://dev-identity.ibernia.it`**, not **`https://identity.ibernia.it`**, or you will get **`invalid_client`**).

**Token only:**

```powershell
cd C:\Users\gulle\source\repos\load-testing-k6
k6 run -e CLIENT_ID=k6-load-test-client -e CLIENT_SECRET="YOUR_SECRET" -e SCOPE=ibernia_api -e IDP_URL=https://dev-identity.ibernia.it k6/identity/k6-client-credentials-token-smoke.js
```

**Token + GET (e.g. Swagger document):**

```powershell
k6 run -e CLIENT_ID=k6-load-test-client -e CLIENT_SECRET="YOUR_SECRET" -e SCOPE=ibernia_api `
  -e IDP_URL=https://dev-identity.ibernia.it -e API_URL=https://dev-api.ibernia.it `
  -e API_PATH=/swagger/v1/swagger.json k6/api-smoke/k6-dev-api-bearer-smoke.js
```

**Note:** Tenant APIs such as **`/api/v1/Clients/{advisorId}/all`** often return **403** for a **machine** token; **user** tokens (lifecycle scripts) are for advisor-scoped CRUD.

### Dev API: Stripe module bypass (`load_tester` + `k6-load-test-client`)

When **Ibernia.Api** has **Stripe enabled** and module gates (`[RequireModule]`) apply, **user** tokens obtained with OAuth client **`k6-load-test-client`** (ROPC or code flow) must meet the API’s **`LoadTesting`** settings:

| API setting | Typical dev (`appsettings.Development.json` / `appsettings.Dev.json`) |
|-------------|------------------------------------------------------------------------|
| `LoadTesting:AllowModuleEntitlementBypass` | `true` on dev hosts |
| `LoadTesting:RequireLoadTesterClaimForBypass` | `true` → access token must include claim **`load_tester=true`** (issued by STS for that client on non–production-like STS hosts) |

**Operational checklist**

1. **Identity DB:** The **`ibernia_api`** API scope must list **`load_tester`** as a user claim (seed in `identityserverdata.json` is updated; existing DBs pick it up when Admin seed / migration helpers run the additive scope-claim merge).
2. **STS + API deploy together** when you turn **`RequireLoadTesterClaimForBypass`** on, or ROPC tokens will miss the claim until users re-authenticate.
3. **Verify a token:** run [`k6/identity/k6-ropc-token-inspect.js`](k6/identity/k6-ropc-token-inspect.js) or decode JWT — look for **`load_tester`** when using **`SIGNUP_ROPC_CLIENT_ID=k6-load-test-client`** (or your ROPC client id) against the same **`IDENTITY_BASE`** as the API’s authority.

**Production:** API host **`Production`** / **`Prod`** never applies this bypass, regardless of config.

---

## Full-platform orchestrator (DEV)

End-to-end **one script** path across Clients, profile **PUT**, cashflow/timelines, Events, income/financial, Reports, Wealth, then **cleanup** — see **[`k6/full-platform/k6-full-platform-orchestrator.js`](k6/full-platform/k6-full-platform-orchestrator.js)** and **[`k6/full-platform/orchestrator.env.example`](k6/full-platform/orchestrator.env.example)**.

**Typical flow:** seed users with **`runners/provision-users.ps1`** (or **`k6/identity/k6-identity-signup.js`** + **`pool-cli import-json`**), then **`runners/run-full-platform.ps1`**. Legacy: run the orchestrator against **`lifecycle-users.json`** without the pool. Alternatively, **`FULL_PLATFORM_HTML_SIGNUP=1`** registers inside the orchestrator and can append merged rows when **`FULL_PLATFORM_APPEND_LIFECYCLE_EXPORT=1`**.

---

## Identity signup (`k6/identity/k6-identity-signup.js`)

- Default host: **`https://dev-identity.ibernia.it`** (`IDENTITY_BASE`). Refuses other hosts unless **`ALLOW_NON_DEV=1`**.
- **Count mode (default):** **`USER_COUNT`** or **`TOTAL_REGISTRATIONS`** signups, `shared-iterations`, emails like **`User01@gmail.com`** or **`k6user-{SIGNUP_RUN_TAG}-01@example.test`** when **`EMAIL_GENERATION_MODE=k6user`** (see script header).
- **Parallel cap:** optional **`SIGNUP_BATCH_SIZE`** limits concurrent **`VUS`** for HTML POST bursts.
- **Bands:** use **`SIGNUP_INDEX_OFFSET`**, **`SIGNUP_BAND_STATE=persistent`**, **`SIGNUP_PREVIOUS_MAX_INDEX`**, etc. (documented in the script header).

**Passwords (pick one):**

| Mode | Env | Result |
|------|-----|--------|
| Random per user (default) | `AUTO_PASSWORD=1` or omit | Strong random password per signup (not saved) |
| **Indexed per user** | **`AUTO_PASSWORD=indexed`** | Base **`User@01`**, **`User@02`**, … then pad to **`SIGNUP_INDEXED_PASSWORD_MIN_LEN`** (default **8**) with **`SIGNUP_INDEXED_PASSWORD_PAD_CHAR`** (default **`!`**) — e.g. **`User@01!`** (STS `Password:RequiredLength` is often **8**; bare **`User@01`** is only 7 characters) |
| Same for everyone | `AUTO_PASSWORD=0` + `SIGNUP_PASSWORD=…` | One shared password |

**Indexed passwords** (matches your `User@NN` convention):

```powershell
cd C:\Users\gulle\source\repos\load-testing-k6
k6 run -e AUTO_PASSWORD=indexed -e SIGNUP_INDEX_OFFSET=0 k6/identity/k6-identity-signup.js
```

**Default random** (no env):

```powershell
cd C:\Users\gulle\source\repos\load-testing-k6
k6 run k6/identity/k6-identity-signup.js
```

### Export `lifecycle-users.json` after signup (optional)

Set **`SIGNUP_EXPORT_LIFECYCLE_USERS=1`**. On script start, k6 reads **`LIFECYCLE_EXPORT_FILE`** (default: **`lifecycle-users.json`**, same as **`LIFECYCLE_USERS_FILE`** if unset). After the run, **if at least one** HTML signup succeeded, rows are merged (baseline + new). Each new row includes **`email`** and **`password`**; with **`POST_SIGNUP_ACQUIRE_LOAD_TESTER_TOKEN=1`** and a successful ROPC + claim check, rows may also include **`token`**, **`advisorId`**, **`identityUserId`**, **`createdAt`**. If **every** signup failed (e.g. duplicate email), the JSON file is **not** rewritten. Opt-in only; file still must stay out of git.

```powershell
k6 run -e SIGNUP_EXPORT_LIFECYCLE_USERS=1 -e POST_SIGNUP_ACQUIRE_LOAD_TESTER_TOKEN=1 -e SIGNUP_CLIENT_LIFECYCLE=1 -e SIGNUP_ROPC_CLIENT_ID=k6-load-test-client -e SIGNUP_ROPC_CLIENT_SECRET=YOUR_SECRET_IF_CONFIDENTIAL k6/identity/k6-identity-signup.js
```

(Replace the client id/secret placeholders with real values from Identity Admin. Omit **`-e SIGNUP_ROPC_CLIENT_SECRET=…`** if the client is public.)

---

## Signup + API client lifecycle (optional)

After each **successful** HTML signup, the script can:

1. Obtain a **Bearer** token via **Resource Owner Password** (`POST …/connect/token`) with the signup **email/password**.
2. **Create** a client **without** partner → **PUT** update → **DELETE**.
3. **Create** a client **with** partner → **PUT** → **DELETE**.

Enable:

```powershell
k6 run -e SIGNUP_CLIENT_LIFECYCLE=1 -e SIGNUP_ROPC_CLIENT_ID=YOUR_REAL_CLIENT_ID_FROM_ADMIN k6/identity/k6-identity-signup.js
```

**Required:** `SIGNUP_ROPC_CLIENT_ID` (and optionally `SIGNUP_ROPC_CLIENT_SECRET`) for a client that allows **`grant_type=password`** on your STS.

When dev STS returns a **redirect** to **`Account/ConfirmEmail`** after register, k6 **GET**s that URL automatically (register **`POST`** uses **`redirects:0`**, so the browser-style redirect would otherwise be skipped and **ROPC** could fail with **`invalid_username_or_password`** until email is confirmed). Set **`SKIP_REGISTER_EMAIL_CONFIRM_FOLLOW=1`** to disable that follow-up GET.

**Common optional env:** `BASE_URL` (API, default `https://dev-api.ibernia.it`), **`SIGNUP_ROPC_SCOPE`** (must include your API scope; use e.g. **`openid profile email roles ibernia_api`** to match Duende **`ibernia_api`**), **`SIGNUP_ROPC_TOKEN_AUTH=basic`** when the ROPC client uses Duende **client_secret_basic** and **`invalid_client`** persists with the default form **post** style, `CLIENT_API_EMAIL_DOMAIN` (synthetic client/partner emails, default `example.com`), `CLIENT_LIFECYCLE_THINK_SEC`, `RELAX_CHECKS`, `RELAX_HTTP_REQ_FAILED`, `LOG_FAILED_HTTP`.

**Identity UserId map:** optional `identity-user-sub-map.json` — lowercase email → Identity **UserId**. When an entry exists, lifecycle **`check()`**s it against the JWT **`sub`**. After you **delete and recreate** load-test users, **clear the map** (`{}`) or **re-fill** from Identity Admin; stale GUIDs would fail that check. If the file is empty or missing, **`sub`** comes only from the token (normal for ROPC). Set **`IDENTITY_SUB_MAP_FILE`** to another path if needed.

---

## Client lifecycle only (existing users, no signup)

Create **`lifecycle-users.json`** from the example. Each row: **`email`** plus **`token`** (recommended: paste JWT from portal DevTools → Network → `Authorization: Bearer …`) and/or **`password`** for ROPC.

- **All rows have `token`:** no **`SIGNUP_ROPC_CLIENT_ID`** needed (best for dev when ROPC is disabled).  
- **Any row missing `token`:** set **`SIGNUP_ROPC_CLIENT_ID`** to the real **ClientId** from Identity Admin (not a readme placeholder) and, for **confidential** clients (e.g. **`k6-load-test-client`** in many setups), **`SIGNUP_ROPC_CLIENT_SECRET`** from Identity Admin → Clients → **Secrets**. Without the secret, STS often returns **`invalid_client`** (HTTP 400), not `invalid_grant`. If the client is **client_secret_basic**, add **`-e SIGNUP_ROPC_TOKEN_AUTH=basic`**.

The run skips Identity register and executes **client CRUD×2** per iteration; user is **`lifecycleUsers[iterationInTest % N]`**; **`VUS`** is capped by the pool size.

```powershell
cd C:\Users\gulle\source\repos\load-testing-k6
Copy-Item lifecycle-users.example.json lifecycle-users.json
# Edit lifecycle-users.json — passwords must match signup (indexed → `User@01!`… with default min length 8), or paste JWT in "token"; do not commit.
k6 run -e CLIENT_LIFECYCLE_ONLY=1 -e SIGNUP_ROPC_CLIENT_ID=YOUR_REAL_CLIENT_ID_FROM_ADMIN -e SIGNUP_ROPC_CLIENT_SECRET=YOUR_REAL_SECRET_IF_NEEDED -e TOTAL_REGISTRATIONS=20 k6/identity/k6-identity-signup.js
```

When **every** row has a valid **`token`** (paste from portal, optional `Bearer ` prefix — it is stripped), you can omit **`SIGNUP_ROPC_CLIENT_ID`**. The committed **example** uses **password-only** so a straight copy + password edit works with ROPC.

**Already ran signup for `User01@gmail.com`–`User20@gmail.com`?** Build **`lifecycle-users.json`** with one row per address. Passwords must match how you signed up: **`SIGNUP_PASSWORD`** (same on every row), **`User@01!`…`User@20!`** with default indexed padding (or your **`MIN_LEN` / `PAD_CHAR`**), or per-user **`token`** if you used random passwords. Quick generator for **indexed** signup (PowerShell, same rules as k6 default):

```powershell
cd C:\Users\gulle\source\repos\load-testing-k6
(1..20 | ForEach-Object {
  $idx = '{0:D2}' -f $_
  $pw = "User@$idx"
  while ($pw.Length -lt 8) { $pw += '!' }
  [pscustomobject]@{ email = "User$idx@gmail.com"; password = $pw }
}) | ConvertTo-Json -Depth 3 | Set-Content lifecycle-users.json -Encoding utf8
k6 run -e CLIENT_LIFECYCLE_ONLY=1 -e SIGNUP_ROPC_CLIENT_ID=YOUR_REAL_CLIENT_ID_FROM_ADMIN -e TOTAL_REGISTRATIONS=20 k6/identity/k6-identity-signup.js
```

Details and defaults are in the **file header** of `k6/identity/k6-identity-signup.js` and `lib/k6-client-lifecycle.js`.

---

## Full Clients lifecycle load test (`k6/clients/k6-client-full-lifecycle.js`)

Separate entry point for **metrics-friendly** tags (`client_*`) and explicit **orphan cleanup** on delete failure. Same **`lifecycle-users.json`** and Identity/API env vars as **`CLIENT_LIFECYCLE_ONLY`**, but **`k6/identity/k6-identity-signup.js`** is unchanged.

If each row has **`password`** but no **`token`**, you **must** pass **`SIGNUP_ROPC_CLIENT_ID`** (and **`SIGNUP_ROPC_CLIENT_SECRET`** when the ROPC client is confidential), same as lifecycle-only signup. If every row has a JWT **`token`**, ROPC env vars are not required.

```powershell
cd C:\Users\gulle\source\repos\load-testing-k6
k6 run -e SIGNUP_ROPC_CLIENT_ID=YOUR_ROPC_CLIENT_ID -e SIGNUP_ROPC_CLIENT_SECRET="YOUR_SECRET" -e TOTAL_REGISTRATIONS=20 -e VUS=10 k6/clients/k6-client-full-lifecycle.js
```

- **`TOTAL_REGISTRATIONS`** — iterations (capped by user pool size).  
- **`VUS`** — parallel VUs (capped by pool size and iterations). For **20** load-test users in **`lifecycle-users.json`**, use e.g. **`-e TOTAL_REGISTRATIONS=20 -e VUS=20`** (or lower **`VUS`** to reduce parallelism).  
- **`RELAX_CHECKS`**, **`RELAX_HTTP_REQ_FAILED`**, **`MAX_DURATION`**, **`CLIENT_LIFECYCLE_THINK_SEC`** — same semantics as other scripts.
- **`RELAX_CLIENT_PROFILE_MODULE=1`** — if **`POST /api/v1/Clients`** returns **402** `module_not_active` / **`client_profile`**, treat creates as **skipped** (checks pass, no update/delete) and relax **`http_req_failed`** like **`RELAX_HTTP_REQ_FAILED=1`**. Not for CI when you expect real CRUD.
- **`LIFECYCLE_VERBOSE=1`** — log when advisor id is taken from **`identity-user-sub-map.json`** or row **`advisorId`** instead of the JWT (see `lib/k6-client-lifecycle.js`; default is quiet for those fallbacks).

---

## CI / automation

- Install **k6** on the agent, `cd` to this folder, run the same **`k6 run -e …`** commands.  
- Pass **`CLIENT_SECRET`**, **`SIGNUP_ROPC_CLIENT_SECRET`**, and **`lifecycle-users.json`** content via **secret variables** or a secure file mount — **do not** commit them.  
- Use **`ALLOW_NON_DEV=1`** only if you intentionally target non-dev hosts.

---

## Safety

- Creates **real** Identity users (and optional API rows) on the configured environments.
- Do **not** commit secrets. Optional local files are listed in `.gitignore`.
