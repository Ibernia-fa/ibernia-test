#Requires -Version 5.1
<#
.SYNOPSIS
  Lease N pool users once, then run each k6 domain module sequentially (100 VUs = 100 users per module).

.DESCRIPTION
  Runs one script per Ibernia module. Scripts use USE_USER_POOL + POOL_SLICE_FILE so each VU maps to
  a distinct pool user (User01..UserN). Modules run in order; k6 runs one after another.

.PARAMETER Vus
  Users to lease and concurrent VUs per module (default 100).

.PARAMETER Duration
  Per-module k6 duration (default 5m).

.PARAMETER PoolEnv
  Pool environment (default dev). Alias: Env.

.PARAMETER Modules
  Comma-separated subset: clients,clients-profile,timeline,timeline-financing,events-default,
  events-custom,income,finances,reports,wealth. Default: all.

.PARAMETER ContinueOnError
  Run remaining modules if one k6 exit code is non-zero.

.PARAMETER AdaptiveThrottle
  Enable adaptive latency monitoring and early stop (sets ENABLE_ADAPTIVE_THROTTLE=1, STOP_ON_DEGRADATION=1).

.PARAMETER SkipTimelineFinancing
  Skip timeline-financing module (shorter run).

.PARAMETER ConsolidatedPerf
  Enable cross-module API timing collection and merge a single consolidated report after all modules.

.EXAMPLE
  $env:STS_SECRET = '...'
  .\runners\run-all-modules.ps1 -Vus 100 -Duration 5m

.EXAMPLE
  .\runners\run-all-modules.ps1 -Modules clients,timeline,events-default -Vus 100
#>
param(
  [int] $Vus = 100,
  [string] $Duration = '5m',
  [Alias('Env')]
  [string] $PoolEnv = 'dev',
  [string] $Modules = '',
  [switch] $ContinueOnError,
  [switch] $AdaptiveThrottle,
  [switch] $ConsolidatedPerf,
  [switch] $SkipTimelineFinancing,
  [bool] $VerifiedOnly = $true
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$poolCli = Join-Path $RepoRoot 'tools/pool-cli/bin/pool-cli.js'
$mergeCli = Join-Path $RepoRoot 'tools/merge-consolidated-report.mjs'
$runId = "allmod-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$slicePath = Join-Path $RepoRoot "data/user-pool/$PoolEnv/pool-slice-$runId.json"
$slowThresholdMs = if ($env:SLOW_API_THRESHOLD_MS) { $env:SLOW_API_THRESHOLD_MS } else { '100' }
if ($ConsolidatedPerf) {
  $perfSliceDir = Join-Path $RepoRoot 'reports/consolidated/slices'
  $perfSpillDir = Join-Path $RepoRoot 'reports/consolidated/spill'
  $perfLogDir = Join-Path $RepoRoot 'reports/consolidated/logs'
  $spillParser = Join-Path $RepoRoot 'tools/parse-perf-spill-from-log.mjs'
  New-Item -ItemType Directory -Path $perfSliceDir, $perfSpillDir, $perfLogDir -Force | Out-Null
  Get-ChildItem -LiteralPath $perfSliceDir -Filter '*.json' -File -ErrorAction SilentlyContinue |
    Remove-Item -Force
  Get-ChildItem -LiteralPath $perfSpillDir -Filter '*.json' -File -ErrorAction SilentlyContinue |
    Remove-Item -Force
  Get-ChildItem -LiteralPath $perfLogDir -Filter '*.log' -File -ErrorAction SilentlyContinue |
    Remove-Item -Force
  Write-Host 'ConsolidatedPerf: updates reports/consolidated/consolidated-api-performance.md + .pdf (slices cleared for this run)'
}

$secret = $env:SIGNUP_ROPC_CLIENT_SECRET
if (-not $secret) { $secret = $env:STS_SECRET }
if (-not $secret) {
  Write-Warning 'SIGNUP_ROPC_CLIENT_SECRET / STS_SECRET not set — ROPC may fail.'
}

$allModules = [ordered]@{
  'clients' = @{
    Script = 'k6/clients/k6-client-full-lifecycle.js'
    ExtraEnv = @{
      TOTAL_REGISTRATIONS = [string]$Vus
      MAX_DURATION = '45m'
    }
  }
  'clients-profile' = @{
    Script = 'k6/clients/k6-clients-create-open-profile-smoke.js'
    ExtraEnv = @{ ITERATIONS = '1' }
  }
  'timeline' = @{
    Script = 'k6/cashflows-timeline/k6-cashflows-timelines-load.js'
    ExtraEnv = @{}
  }
  'timeline-financing' = @{
    Script = 'k6/cashflows-timeline/k6-cashflows-timelines-financing-load.js'
    ExtraEnv = @{}
  }
  'events-default' = @{
    Script = 'k6/cashflows-timeline/k6-events-default-load.js'
    ExtraEnv = @{}
  }
  'events-custom' = @{
    Script = 'k6/cashflows-timeline/k6-events-custom-load.js'
    # Dev @ 100 VUs: p95 often ~2–3s; suite uses checks/http_req_failed, not duration SLA
    ExtraEnv = @{ LOAD_MODE = 'vus'; RELAX_SLA = '1' }
  }
  'events-post' = @{
    Script = 'k6/cashflows-timeline/k6-events-post-load.js'
    ExtraEnv = @{}
  }
  'income' = @{
    Script = 'k6/cashflows-income/k6-cashflows-income-get-income-expense-financial-load.js'
    ExtraEnv = @{}
  }
  'finances' = @{
    Script = 'k6/cashflows-finances/k6-cashflows-finances-get-financial-load.js'
    ExtraEnv = @{}
  }
  'reports' = @{
    Script = 'k6/cashflows-reports/k6-cashflows-reports-get-reports-load.js'
    ExtraEnv = @{}
  }
  'wealth' = @{
    Script = 'k6/cashflows-wealth/k6-cashflows-wealth-get-dashboard-load.js'
    ExtraEnv = @{}
  }
}

if ($SkipTimelineFinancing) {
  $allModules.Remove('timeline-financing')
}

$selectedNames = if ($Modules.Trim()) {
  $Modules.Split(',') | ForEach-Object { $_.Trim().ToLower() } | Where-Object { $_ }
} else {
  @($allModules.Keys)
}

$plan = @()
foreach ($name in $selectedNames) {
  if (-not $allModules.Contains($name)) {
    throw "Unknown module '$name'. Valid: $($allModules.Keys -join ', ')"
  }
  $plan += [pscustomobject]@{ Name = $name; Def = $allModules[$name] }
}

if ($plan.Count -eq 0) {
  throw 'No modules selected.'
}

Write-Host "=== run-all-modules: $($plan.Count) module(s), VUS=$Vus, DURATION=$Duration, run-id=$runId ==="
foreach ($m in $plan) {
  Write-Host "  - $($m.Name) -> $($m.Def.Script)"
}

Write-Host "`n=== lease $Vus users ==="
$leaseArgs = @('lease', '--count', $Vus, '--run-id', $runId, '--env', $PoolEnv, '--out', $slicePath)
if ($VerifiedOnly) { $leaseArgs += '--verified-only' }
node $poolCli @leaseArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:K6_DEFAULT_VUS = [string]$Vus
# Teardown re-logins each pool user sequentially; k6 default 60s is too low at 100 VUs.
$teardownSec = [Math]::Max(300, $Vus * 12)
$teardownTimeout = "${teardownSec}s"
Write-Host "teardownTimeout=$teardownTimeout (override: -e TEARDOWN_TIMEOUT=...)"
$results = @()
$overallExit = 0

try {
  foreach ($m in $plan) {
    Write-Host "`n========================================"
    Write-Host "MODULE: $($m.Name)"
    Write-Host "SCRIPT: $($m.Def.Script)"
    Write-Host "========================================`n"

    $k6Args = @(
      'run', $m.Def.Script,
      '-e', 'USE_USER_POOL=1',
      '-e', "POOL_SLICE_FILE=$slicePath",
      '-e', 'SIGNUP_ROPC_CLIENT_ID=k6-load-test-client',
      '-e', "VUS=$Vus",
      '-e', "K6_DEFAULT_VUS=$Vus",
      '-e', "DURATION=$Duration",
      '-e', "TEARDOWN_TIMEOUT=$teardownTimeout"
    )
    if ($AdaptiveThrottle) {
      $maxApiMs = if ($env:MAX_ACCEPTABLE_API_MS) { $env:MAX_ACCEPTABLE_API_MS } else { '500' }
      $k6Args += @(
        '-e', 'ENABLE_ADAPTIVE_THROTTLE=1',
        '-e', 'STOP_ON_DEGRADATION=1',
        '-e', "MAX_ACCEPTABLE_API_MS=$maxApiMs"
      )
    }
    if ($ConsolidatedPerf) {
      $sliceBase = [System.IO.Path]::GetFileNameWithoutExtension($m.Def.Script)
      $k6Args += @(
        '-e', 'CONSOLIDATED_PERF=1',
        '-e', 'PERF_CAPTURE_REQUEST_CONTEXT=1',
        '-e', "PERF_RUN_ID=$runId",
        '-e', "PERF_SLICE_ID=$sliceBase",
        '-e', "PERF_SCRIPT_FILE=$($m.Def.Script)",
        '-e', "MODULE_NAME=$($m.Name)",
        '-e', "SLOW_API_THRESHOLD_MS=$slowThresholdMs"
      )
    }
    if ($secret) {
      $k6Args += @('-e', "SIGNUP_ROPC_CLIENT_SECRET=$secret")
    }
    foreach ($key in $m.Def.ExtraEnv.Keys) {
      $k6Args += @('-e', "$key=$($m.Def.ExtraEnv[$key])")
    }

    if ($ConsolidatedPerf) {
      $sliceBase = [System.IO.Path]::GetFileNameWithoutExtension($m.Def.Script)
      $k6LogFile = Join-Path $perfLogDir "$sliceBase.log"
      $prevEap = $ErrorActionPreference
      $ErrorActionPreference = 'Continue'
      try {
        & k6 @k6Args 2>&1 | Tee-Object -FilePath $k6LogFile
        $code = $LASTEXITCODE
      } finally {
        $ErrorActionPreference = $prevEap
      }
      if (Test-Path -LiteralPath $k6LogFile) {
        node $spillParser $k6LogFile $sliceBase | Out-Null
      }
    } else {
      $prevEap = $ErrorActionPreference
      $ErrorActionPreference = 'Continue'
      try {
        & k6 @k6Args 2>&1
        $code = $LASTEXITCODE
      } finally {
        $ErrorActionPreference = $prevEap
      }
    }
    $results += [pscustomobject]@{ Module = $m.Name; Script = $m.Def.Script; ExitCode = $code }
    if ($code -ne 0) {
      Write-Host "FAILED: $($m.Name) (exit $code)" -ForegroundColor Red
      $overallExit = $code
      if (-not $ContinueOnError) { break }
    } else {
      Write-Host "OK: $($m.Name)" -ForegroundColor Green
    }
  }
} finally {
  Write-Host "`n=== release run-id=$runId ==="
  node $poolCli release --run-id $runId --env $PoolEnv
}

Write-Host "`n=== summary ==="
$results | Format-Table -AutoSize

if ($ConsolidatedPerf) {
  Write-Host "`n=== merge consolidated API performance report ==="
  node $mergeCli --run-id $runId --threshold-ms $slowThresholdMs
  if ($LASTEXITCODE -ne 0) {
    Write-Warning 'Consolidated report merge failed (exit $LASTEXITCODE). Check reports/consolidated/slices/'
  } else {
    Write-Host 'Consolidated report: reports/consolidated/consolidated-api-performance.md + .pdf' -ForegroundColor Cyan
  }
}

if ($overallExit -ne 0 -and -not $ContinueOnError) {
  exit $overallExit
}
if (($results | Where-Object { $_.ExitCode -ne 0 }).Count -gt 0) {
  exit 1
}
exit 0
