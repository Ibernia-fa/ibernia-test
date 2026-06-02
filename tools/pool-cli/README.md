# pool-cli

SQLite-backed user pool for Ibernia k6 load tests (**non-production only**).

- **Default pool:** `--env dev` → `data/user-pool/dev/pool.db`
- **Other env folders:** `qa`, `staging` (same CLI; separate DB per env)
- **`--env prod` is rejected** — there is no production pool in this repo

## Requirements

- **Node.js 22.5+** (uses built-in `node:sqlite` — no native compiler or Visual Studio needed)

## Install

No npm dependencies required. Run directly:

```powershell
node bin/pool-cli.js stats --env dev
```

## Examples

```powershell
node bin/pool-cli.js import-json ../../lifecycle-users.json --env dev
node bin/pool-cli.js stats --env dev
node bin/pool-cli.js lease --count 20 --run-id test1 --env dev --out ../../data/user-pool/dev/pool-slice-test1.json
node bin/pool-cli.js release --run-id test1 --env dev
node bin/pool-cli.js verify-ropc --env dev --sample 3
```

Set `$env:SIGNUP_ROPC_CLIENT_SECRET` (or `$env:STS_SECRET`) before `verify-ropc`.

**Runners:** `runners/provision-users.ps1`, `runners/run-full-platform.ps1`, `runners/run-baseline-concurrent-users.ps1` (all default `-PoolEnv dev`).

See [docs/user-pool.md](../../docs/user-pool.md) for provision, verify, lease, and baseline workflows.
