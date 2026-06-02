#Requires -Version 5.1
<#
.SYNOPSIS
  Single-user baseline across all k6 APIs in domain folders; one consolidated timing report.

.DESCRIPTION
  Leases one pool user, runs every k6 *-load.js script (and k6-client-full-lifecycle.js) under:
  k6/clients, k6/clients-profile, k6/cashflows-timeline, k6/cashflows-income, k6/cashflows-finances,
  k6/cashflows-reports, k6/cashflows-wealth (in that order).

  Each script writes a unique perf slice; merge produces consolidated-api-performance.md/json
  with catalog coverage for missing APIs.

.PARAMETER Duration
  Per-script k6 duration for looping scenarios (default 30s).

.PARAMETER PoolEnv
  Pool environment (default dev).

.PARAMETER ContinueOnError
  Continue if a script exits non-zero.

.PARAMETER Vus
  Pool users to lease and concurrent VUs per script (default 1). Use 100 for full concurrent load across every API script.

.EXAMPLE
  $env:STS_SECRET = '...'
  .\runners\run-baseline-single-user.ps1

.EXAMPLE
  # All ~57 API scripts, 100 VUs each, one consolidated report
  .\runners\run-baseline-single-user.ps1 -Vus 100 -Duration 5m -ContinueOnError
#>
param(
  [int] $Vus = 1,
  [string] $Duration = '30s',
  [Alias('Env')]
  [string] $PoolEnv = 'dev',
  [switch] $ContinueOnError,
  [bool] $VerifiedOnly = $true
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot
. (Join-Path $PSScriptRoot 'BaselinePlan.ps1')

$poolCli = Join-Path $RepoRoot 'tools/pool-cli/bin/pool-cli.js'
$mergeCli = Join-Path $RepoRoot 'tools/merge-consolidated-report.mjs'
$runId = "baseline-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$slicePath = Join-Path $RepoRoot "data/user-pool/$PoolEnv/pool-slice-$runId.json"
$perfSliceDir = Join-Path $RepoRoot 'reports/consolidated/slices'
$perfSpillDir = Join-Path $RepoRoot 'reports/consolidated/spill'
$perfLogDir = Join-Path $RepoRoot 'reports/consolidated/logs'
$spillParser = Join-Path $RepoRoot 'tools/parse-perf-spill-from-log.mjs'
$consolidatedReportMd = Join-Path $RepoRoot 'reports/consolidated/consolidated-api-performance.md'
$slowThresholdMs = if ($env:SLOW_API_THRESHOLD_MS) { $env:SLOW_API_THRESHOLD_MS } else { '100' }
$slowCaptureMs = if ($env:PERF_SLOW_CAPTURE_THRESHOLD_MS) { $env:PERF_SLOW_CAPTURE_THRESHOLD_MS } else { '300' }

New-Item -ItemType Directory -Path $perfSliceDir -Force | Out-Null
New-Item -ItemType Directory -Path $perfSpillDir -Force | Out-Null
New-Item -ItemType Directory -Path $perfLogDir -Force | Out-Null
Get-ChildItem -LiteralPath $perfSliceDir -Filter '*.json' -File -ErrorAction SilentlyContinue |
  Remove-Item -Force
Get-ChildItem -LiteralPath $perfSpillDir -Filter '*.json' -File -ErrorAction SilentlyContinue |
  Remove-Item -Force
Get-ChildItem -LiteralPath $perfLogDir -Filter '*.log' -File -ErrorAction SilentlyContinue |
  Remove-Item -Force
Write-Host "Consolidated report (updated in place): reports/consolidated/consolidated-api-performance.md + .pdf"

$secret = $env:SIGNUP_ROPC_CLIENT_SECRET
if (-not $secret) { $secret = $env:STS_SECRET }
if (-not $secret) {
  Write-Error @'
SIGNUP_ROPC_CLIENT_SECRET (or STS_SECRET) is not set in this PowerShell session.
ROPC login will fail with oauth=invalid_client for every script.

Before running:
  cd C:\Users\gulle\source\repos\load-testing-k6
  $env:STS_SECRET = '<secret from Identity Admin → Clients → k6-load-test-client → Secrets>'

Then re-run: .\runners\run-baseline-single-user.ps1 -ContinueOnError
'@
  exit 1
}
Write-Host 'ROPC client secret: set (SIGNUP_ROPC_CLIENT_SECRET / STS_SECRET)' -ForegroundColor DarkGray

$plan = Get-BaselineScriptPlan -RepoRoot $RepoRoot

if ($plan.Count -eq 0) {
  throw 'No baseline scripts found in domain folders.'
}

if ($Vus -lt 1) { throw 'Vus must be >= 1' }

Write-Host "=== baseline-all-apis: $($plan.Count) script(s), VUS=$Vus, DURATION=$Duration, run-id=$runId ==="
foreach ($p in $plan) {
  Write-Host "  - [$($p.Module)] $($p.Script)"
}

Write-Host "`n=== lease $Vus user(s) ==="
$leaseArgs = @('lease', '--count', [string]$Vus, '--run-id', $runId, '--env', $PoolEnv, '--out', $slicePath)
if ($VerifiedOnly) { $leaseArgs += '--verified-only' }
node $poolCli @leaseArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$userLabel = ''
try {
  $leased = Get-Content -LiteralPath $slicePath -Raw | ConvertFrom-Json
  if ($leased -and $leased.Count -ge 1 -and $leased[0].email) {
    $userLabel = $leased[0].email
  }
} catch { }

$teardownSec = [Math]::Max(300, $Vus * 12)
$teardownTimeout = "${teardownSec}s"
Write-Host "teardownTimeout=$teardownTimeout"
$results = @()
$overallExit = 0

try {
  foreach ($p in $plan) {
    Write-Host "`n========================================"
    Write-Host "SCRIPT: $($p.Script)  module=$($p.Module)  slice=$($p.SliceId)"
    Write-Host "========================================`n"

    $vuStr = [string]$Vus
    $extra = @{
      TOTAL_REGISTRATIONS = $vuStr
      ITERATIONS          = $vuStr
      VUS                 = $vuStr
      K6_DEFAULT_VUS      = $vuStr
      SUITE_VUS           = $vuStr
    }
    if ($p.FileName -eq 'k6-client-full-lifecycle.js') {
      $extra['MAX_DURATION'] = if ($Vus -ge 100) { '45m' } else { '10m' }
    }
    if ($p.FileName -match 'create-open-profile-smoke') {
      $extra['ITERATIONS'] = '1'
    }

    $k6Args = @(
      'run', $p.Script,
      '-e', 'USE_USER_POOL=1',
      '-e', "POOL_SLICE_FILE=$slicePath",
      '-e', 'SIGNUP_ROPC_CLIENT_ID=k6-load-test-client',
      '-e', 'CONSOLIDATED_PERF=1',
      '-e', "PERF_RUN_ID=$runId",
      '-e', "PERF_SLICE_ID=$($p.SliceId)",
      '-e', "PERF_SCRIPT_FILE=$($p.Script)",
      '-e', 'PERF_CAPTURE_REQUEST_CONTEXT=1',
      '-e', "PERF_SLOW_CAPTURE_THRESHOLD_MS=$slowCaptureMs",
      '-e', "MODULE_NAME=$($p.Module)",
      '-e', "SLOW_API_THRESHOLD_MS=$slowThresholdMs",
      '-e', "ADAPTIVE_HTTP_METHOD=$($p.Method)",
      '-e', "VUS=$vuStr",
      '-e', "K6_DEFAULT_VUS=$vuStr",
      '-e', "DURATION=$Duration",
      '-e', "MAX_DURATION=$Duration",
      '-e', "TEARDOWN_TIMEOUT=$teardownTimeout"
    )
    if ($Vus -eq 1) {
      $k6Args += @('-e', 'BASELINE_SINGLE_USER_RUN=1')
      if ($userLabel) {
        $k6Args += @('-e', "PERF_USER_LABEL=$userLabel")
      }
    }
    if ($secret) {
      $k6Args += @('-e', "SIGNUP_ROPC_CLIENT_SECRET=$secret")
    }
    foreach ($key in $extra.Keys) {
      $k6Args += @('-e', "$key=$($extra[$key])")
    }

    $k6LogFile = Join-Path $perfLogDir "$($p.SliceId).log"
    # k6 logs to stderr; with $ErrorActionPreference Stop, PowerShell aborts before k6 finishes.
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
      & k6 @k6Args 2>&1 | Tee-Object -FilePath $k6LogFile
      $code = $LASTEXITCODE
    } finally {
      $ErrorActionPreference = $prevEap
    }
    if (Test-Path -LiteralPath $k6LogFile) {
      node $spillParser $k6LogFile $p.SliceId | Out-Null
    }
    $results += [pscustomobject]@{ Script = $p.Script; Module = $p.Module; ExitCode = $code }
    if ($code -ne 0) {
      Write-Host "FAILED: $($p.Script) (exit $code)" -ForegroundColor Red
      $overallExit = $code
      if (-not $ContinueOnError) { break }
    } else {
      Write-Host "OK: $($p.Script)" -ForegroundColor Green
    }
  }
} finally {
  Write-Host "`n=== release run-id=$runId ==="
  node $poolCli release --run-id $runId --env $PoolEnv
}

Write-Host "`n=== merge consolidated API performance report ==="
node $mergeCli --run-id $runId --threshold-ms $slowThresholdMs --slow-capture-ms $slowCaptureMs
if ($LASTEXITCODE -ne 0) {
  Write-Warning "Merge failed (exit $LASTEXITCODE). Slices: reports/consolidated/slices/"
} else {
  Write-Host "Report: $consolidatedReportMd" -ForegroundColor Cyan
}

Write-Host "`n=== summary ($($results.Count) scripts) ==="
$results | Format-Table -AutoSize

if ($overallExit -ne 0 -and -not $ContinueOnError) { exit $overallExit }
if (($results | Where-Object { $_.ExitCode -ne 0 }).Count -gt 0) { exit 1 }
exit 0
