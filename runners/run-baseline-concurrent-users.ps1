#Requires -Version 5.1
<#
.SYNOPSIS
  Run full API baseline with N pool users in parallel; each user runs ALL scripts for ALL modules.

.DESCRIPTION
  Leases N users, starts one background job per user (VUS=1 each, full script plan).
  Merges slices + slow-request spills into consolidated-api-performance.md/json/pdf.

.PARAMETER Users
  Concurrent users (default 20). Each runs the complete ~57-script catalog.

.PARAMETER UserNumberMin
  Lease pool users with numeric suffix >= this (e.g. 80 for User80@gmail.com). Inclusive.

.PARAMETER UserNumberMax
  Lease pool users with numeric suffix <= this (e.g. 99 for 20 users: 80-99). Inclusive.

.PARAMETER Duration
  Per-script k6 duration (default 30s).

.EXAMPLE
  $env:STS_SECRET = '...'
  .\runners\run-baseline-concurrent-users.ps1 -Users 20 -Duration 30s -ContinueOnError

.EXAMPLE
  # Sequential User80 through User99 (20 users)
  .\runners\run-baseline-concurrent-users.ps1 -Users 20 -UserNumberMin 80 -UserNumberMax 99 -ContinueOnError
#>
param(
  [int] $Users = 20,
  [int] $UserNumberMin = 0,
  [int] $UserNumberMax = 0,
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
$writeSliceCli = Join-Path $RepoRoot 'tools/write-pool-slice-one.mjs'
$workerScript = Join-Path $RepoRoot 'runners/scripts/Invoke-BaselineUserScripts.ps1'
$runId = "concurrent-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$slicePath = Join-Path $RepoRoot "data/user-pool/$PoolEnv/pool-slice-$runId.json"
$runRoot = Join-Path $RepoRoot "reports/consolidated/runs/$runId"
$slicesRoot = Join-Path $runRoot 'slices'
$logsRoot = Join-Path $runRoot 'logs'
$spillRoot = Join-Path $runRoot 'spill'
$planJson = Join-Path $runRoot 'baseline-plan.json'
$slowThresholdMs = if ($env:SLOW_API_THRESHOLD_MS) { $env:SLOW_API_THRESHOLD_MS } else { '100' }
$slowCaptureMs = if ($env:PERF_SLOW_CAPTURE_THRESHOLD_MS) { $env:PERF_SLOW_CAPTURE_THRESHOLD_MS } else { '300' }

if ($Users -lt 1) { throw 'Users must be >= 1' }

$secret = $env:SIGNUP_ROPC_CLIENT_SECRET
if (-not $secret) { $secret = $env:STS_SECRET }
if (-not $secret) {
  Write-Error 'Set STS_SECRET or SIGNUP_ROPC_CLIENT_SECRET before running.'
  exit 1
}

$plan = Get-BaselineScriptPlan -RepoRoot $RepoRoot
if ($plan.Count -eq 0) { throw 'No baseline scripts found.' }

New-Item -ItemType Directory -Path $runRoot, $slicesRoot, $logsRoot, $spillRoot -Force | Out-Null
Write-JsonFileUtf8NoBom -Path $planJson -Data $plan -Depth 6

Write-Host "=== concurrent baseline: $($plan.Count) scripts x $Users users, DURATION=$Duration, run-id=$runId ==="

Write-Host "`n=== lease $Users users ==="
$leaseArgs = @('lease', '--count', [string]$Users, '--run-id', $runId, '--env', $PoolEnv, '--out', $slicePath)
if ($VerifiedOnly) { $leaseArgs += '--verified-only' }
if ($UserNumberMin -gt 0) { $leaseArgs += @('--user-num-min', [string]$UserNumberMin) }
if ($UserNumberMax -gt 0) { $leaseArgs += @('--user-num-max', [string]$UserNumberMax) }
if ($UserNumberMin -gt 0 -or $UserNumberMax -gt 0) {
  $leaseArgs += @('--order', 'user-number')
  if (-not ($leaseArgs -contains '--email-glob')) {
    $leaseArgs += @('--email-glob', 'User*@*')
  }
}
node $poolCli @leaseArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$allUsers = Get-Content -LiteralPath $slicePath -Raw | ConvertFrom-Json
if ($allUsers.Count -lt $Users) {
  throw "Pool slice has $($allUsers.Count) users but $Users requested."
}

$userSliceDir = Join-Path $RepoRoot "data/user-pool/$PoolEnv/user-slices-$runId"
New-Item -ItemType Directory -Path $userSliceDir -Force | Out-Null
$jobs = @()

try {
  for ($i = 0; $i -lt $Users; $i++) {
    $user = $allUsers[$i]
    $email = $user.email
    $userKey = ('user-{0:D2}' -f $i)
    $singleSlice = Join-Path $userSliceDir "pool-slice-$userKey.json"
    node $writeSliceCli $slicePath $i $singleSlice
    if ($LASTEXITCODE -ne 0) { throw "Failed to write pool slice for $userKey ($email)" }

    $sliceOut = Join-Path $slicesRoot $userKey
    $logOut = Join-Path $logsRoot $userKey
    $spillOut = Join-Path $spillRoot $userKey
    New-Item -ItemType Directory -Path $sliceOut, $logOut, $spillOut -Force | Out-Null

    Write-Host "Starting job $userKey : $email"
    $jobs += Start-Job -Name $userKey -FilePath $workerScript -ArgumentList @(
      $RepoRoot,
      $singleSlice,
      $email,
      $runId,
      $Duration,
      $planJson,
      $sliceOut,
      $logOut,
      $spillOut,
      $slowThresholdMs,
      $slowCaptureMs,
      $secret,
      [bool]$ContinueOnError
    )
  }

  $scriptTotal = $plan.Count
  $etaMin = [Math]::Ceiling(($scriptTotal * 35) / 60)
  Write-Host "`n=== waiting for $($jobs.Count) user jobs ($scriptTotal scripts each, ~$etaMin+ min per user; no output until a job finishes) ==="
  Write-Host "Progress polls every 60s (slice files under $slicesRoot)"
  while ($true) {
    $running = @($jobs | Where-Object { $_.State -eq 'Running' })
    if ($running.Count -eq 0) { break }
    $parts = @()
    foreach ($j in $running) {
      $sliceOut = Join-Path $slicesRoot $j.Name
      $n = @(Get-ChildItem -LiteralPath $sliceOut -Filter '*.json' -File -ErrorAction SilentlyContinue).Count
      $parts += "$($j.Name):$n/$scriptTotal"
    }
    $done = @($jobs | Where-Object { $_.State -ne 'Running' }).Count
    Write-Host ("  [{0}] done={1}/{2} running | {3}" -f (Get-Date -Format 'HH:mm:ss'), $done, $jobs.Count, ($parts -join ' '))
    Start-Sleep -Seconds 60
  }
  $results = $jobs | Wait-Job
  $failed = @()
  foreach ($j in $results) {
    $out = Receive-Job -Job $j
    if ($out) { $out | ForEach-Object { Write-Host $_ } }
    $userExit = 0
    if ($out) {
      $line = @($out) | Where-Object { $_ -match '^BASELINE_USER_EXIT=' } | Select-Object -Last 1
      if ($line -match '^BASELINE_USER_EXIT=(\d+)$') {
        $userExit = [int]$Matches[1]
      }
    }
    if ($j.State -eq 'Failed' -or $userExit -ne 0) {
      $failed += $j.Name
    }
    Remove-Job -Job $j -Force
  }
  if ($failed.Count) {
    Write-Host "FAILED user jobs: $($failed -join ', ')" -ForegroundColor Red
  }
} finally {
  Write-Host "`n=== release run-id=$runId ==="
  node $poolCli release --run-id $runId --env $PoolEnv
  Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue
}

Write-Host "`n=== merge consolidated report ==="
node $mergeCli --run-id $runId --threshold-ms $slowThresholdMs --slow-capture-ms $slowCaptureMs --slices-dir $slicesRoot --spill-dir $spillRoot
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Report: reports/consolidated/consolidated-api-performance.md (run artifacts: $runRoot)"
exit 0
