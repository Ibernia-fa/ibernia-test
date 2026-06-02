# Load-test user pool (DEV / non-production)

Central SQLite store + `pool-cli` for durable test users and lease-safe allocation. k6 scripts read an immutable **pool slice** JSON produced after `lease`.

All load tests in this repo target **dev Identity / dev API** (`dev-identity.ibernia.it`, `dev-api.ibernia.it`). Use **one pool** on disk: `data/user-pool/dev/` (`--env dev`). There is **no** separate production pool, prod-only runners, or `User101–User120` band in this repo — provision and baseline with the same dev scripts below.

## Defaults

| Setting | Value |
|---------|--------|
| Pool env | `dev` (also supported: `qa`, `staging` — separate folders under `data/user-pool/`) |
| DB path | `data/user-pool/{env}/pool.db` (`env` default `dev`) |
| ROPC client | `k6-load-test-client` (`SIGNUP_ROPC_CLIENT_ID`) |
| Identity / API | `https://dev-identity.ibernia.it`, `https://dev-api.ibernia.it` |
| VU mapping | Sticky: `users[(__VU - 1) % N]` when `vus ≤ N` |
| Signup passwords | `AUTO_PASSWORD=indexed` recommended for reproducible ROPC |

### Indexed passwords (`AUTO_PASSWORD=indexed`)

Base form is **`User@{index}`** (e.g. `User@01`, `User@44`, `User@101`). If the string is shorter than **`SIGNUP_INDEXED_PASSWORD_MIN_LEN`** (default **8**), it is padded on the right with **`SIGNUP_INDEXED_PASSWORD_PAD_CHAR`** (default **`!`**).

| Index | Email example | Password |
|-------|----------------|----------|
| 1–99 (2 digits) | `User01@gmail.com` | `User@01!` (padded to 8 chars) |
| 100+ (3 digits) | `User101@gmail.com` | `User@101` (already 8 chars — **no** trailing `!`) |

ROPC and `pool-cli verify-ropc` must use the **exact** password stored in the pool / `lifecycle-users.json`, not a guessed `User@NN!` for every user.

## Lease state machine

```text
active (unleased) ──lease(run_id, expires_at)──► leased
leased ──release(run_id)──► active
leased ──TTL expired──► active (via gc or next lease query)
```

- Only **pool-cli** writes the database (k6 is read-only on slice files).
- One user may be leased by at most one `run_id` at a time.

## Environment variables (k6)

| Variable | Purpose |
|----------|---------|
| `USE_USER_POOL=1` | Load users from `POOL_SLICE_FILE` instead of `lifecycle-users.json` |
| `POOL_SLICE_FILE` | Path to leased slice JSON |
| `SIGNUP_ROPC_CLIENT_ID` | OAuth client (default `k6-load-test-client`) |
| `SIGNUP_ROPC_CLIENT_SECRET` | From env/CI only — never commit |
| `IDENTITY_BASE` / `BASE_URL` | Must be dev hosts unless `ALLOW_NON_DEV=1` |

## pool-cli commands

```powershell
cd load-testing-k6
# Requires Node.js 22.5+ (built-in node:sqlite)

node tools/pool-cli/bin/pool-cli.js import-json lifecycle-users.json --env dev
node tools/pool-cli/bin/pool-cli.js lease --count 20 --run-id my-run --env dev --out data/user-pool/dev/pool-slice-my-run.json
node tools/pool-cli/bin/pool-cli.js release --run-id my-run --env dev
node tools/pool-cli/bin/pool-cli.js stats --env dev
node tools/pool-cli/bin/pool-cli.js gc --env dev
node tools/pool-cli/bin/pool-cli.js export-json --env dev --out lifecycle-users.json
```

## Advisor client accumulation (data realism)

Pool users are **reused** across all k6 runs. Most scripts **POST** clients with a unique **last-name needle** and only **DELETE** that needle in `teardown()`. Clients from older runs **remain** in MongoDB → advisors can reach **500–1500+** clients, which skews `GET /Clients/{advisorId}/all` latency.

**Investigate (read-only):**

```powershell
$env:STS_SECRET = '...'
node tools/pool-cli/bin/pool-cli.js audit-advisor-clients --env dev --verified-only --user-num-min 1 --user-num-max 120 --out reports/journeys/advisor-client-audit-dev.json
```

See **`docs/advisor-client-data-realism.md`**.

## Workflows

### Provision (signup → pool)

```powershell
.\runners\provision-users.ps1 -UserCount 50 -SignupRunTag pool20260518
```

### Post-signup activation (email confirmed + password)

ROPC on dev needs **email confirmed** and the indexed password — **not** lockout disabled. (`User27@gmail.com` ROPC works with lockout still ON in Admin once **User Email Confirmed** is ON.)

| Step | Automate in k6? | How |
|------|-----------------|-----|
| **Password** `User@NN!` | Yes | `AUTO_PASSWORD=indexed` on HTML register (provision default). |
| **Email confirmed** | Yes (new signups) | Default: after POST, k6 **GET**s `ConfirmEmail` redirect. Do not use `-SkipEmailConfirmFollow` unless debugging. |
| **Email confirmed** (old pool users) | Admin only | Identity Admin → user → **User Email Confirmed: ON**. Or re-provision a fresh index band without `-SkipEmailConfirmFollow`. |

After provision, verify logins (requires the **same** ROPC client secret as k6 signup):

```powershell
$env:STS_SECRET = '<dev-k6-load-test-client-secret>'   # or SIGNUP_ROPC_CLIENT_SECRET
node tools/pool-cli/bin/pool-cli.js verify-ropc --env dev --sample 10
```

(`--limit` is an alias for `--sample`.)

If every check fails with **`invalid_client`**, the secret env var is missing or wrong.

**Random `--sample` often hits old broken users** (`User01–40`, `k6user-pool-fresh1-*`). Target a known band instead:

```powershell
node tools/pool-cli/bin/pool-cli.js verify-ropc --env dev --email User44@gmail.com
node tools/pool-cli/bin/pool-cli.js verify-ropc --env dev --email-glob "User5*" --limit 5
```

If verify fails with `invalid_username_or_password`, set **User Email Confirmed: ON** in Admin (main fix for pre-band-3 users). Password should match `User@NN!` from the pool; lockout can stay ON.

### Run full-platform with pool

Lease uses **oldest-first** by default; broken early imports (`k6user-pool-fresh1-*`) are leased before good `User5*` rows unless you filter.

```powershell
# Clear entire pool (e.g. after deleting users in Identity Admin)
node tools/pool-cli/bin/pool-cli.js purge --env dev --yes

# Or deactivate a pattern only
node tools/pool-cli/bin/pool-cli.js deactivate --env dev --email-glob "k6user*"

# Mark your band as ROPC-verified (updates load_tester_verified in pool.db)
node tools/pool-cli/bin/pool-cli.js verify-ropc --env dev --email-glob "User5*" --limit 20

.\runners\run-full-platform.ps1 -Vus 5 -Duration 3m
# Optional narrow band: -EmailGlob "User5*"
# Skip verified gate: -VerifiedOnly:$false
```

Requires `$env:STS_SECRET` or `$env:SIGNUP_ROPC_CLIENT_SECRET`.

### Baseline + consolidated perf (dev pool)

Same pool and secret as full-platform; runners lease users then run the full baseline catalog:

```powershell
$env:STS_SECRET = '<dev-k6-load-test-client-secret>'
.\runners\run-baseline-concurrent-users.ps1 -PoolEnv dev -Users 20 -Duration 30s -ContinueOnError
# Single-user / high-VU catalog: .\runners\run-baseline-single-user.ps1 -PoolEnv dev
```

See **[docs/consolidated-api-performance.md](consolidated-api-performance.md)** for report paths and `-UserNumberMin` / `-UserNumberMax` leasing.

### Verify `lifecycle-users.json` (optional)

Before import or after manual edits, spot-check ROPC against dev Identity (dev hosts only; no `--allow-non-dev`):

```powershell
$env:SIGNUP_ROPC_CLIENT_SECRET = '<dev-k6-load-test-client-secret>'
node tools/verify-lifecycle-ropc.mjs --file lifecycle-users.json --sample 5
```

This complements `pool-cli verify-ropc`, which reads passwords from `pool.db`.

## Non-production guards

- `--env prod` / `--env production` is rejected by pool-cli.
- Hostnames must match dev / qa / staging patterns (`dev-identity.ibernia.it`, `dev-api.ibernia.it`, `localhost`, …) unless **`--allow-non-dev`** on pool-cli (intentional escape hatch only).
- k6 scripts and **`tools/verify-lifecycle-ropc.mjs`** refuse non-dev Identity URLs unless **`ALLOW_NON_DEV=1`** on the k6 run.

## Security

- `pool.db` and slice files are gitignored.
- Do not upload slice JSON with passwords to CI artifacts.
- Client secret stays in environment/secret store only.
