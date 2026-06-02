#Requires -Version 5.1
<#
.SYNOPSIS
  Lease users from pool -> run full-platform orchestrator -> release lease.

.PARAMETER Vus
  Virtual users (default 100). Must be <= leased pool size.

.PARAMETER Duration
  k6 duration (default 3m).

.PARAMETER PoolEnv
  Pool environment (default dev). Alias: Env.

.PARAMETER EmailGlob
  Only lease users matching this SQLite GLOB (e.g. "User5*" for band 50-59).

.PARAMETER VerifiedOnly
  Only lease users with load_tester_verified=1 (run verify-ropc on your band first).

.EXAMPLE
  $env:STS_SECRET = '...'
  .\runners\run-full-platform.ps1 -Vus 5 -Duration 3m
#>
param(
  [int] $Vus = 100,
  [string] $Duration = '3m',
  [Alias('Env')]
  [string] $PoolEnv = 'dev',
  [string] $LoadMode = 'vus',
  [string] $EmailGlob = '',
  [bool] $VerifiedOnly = $true
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$runId = "fp-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$slicePath = Join-Path $RepoRoot "data/user-pool/$PoolEnv/pool-slice-$runId.json"
$poolCli = Join-Path $RepoRoot 'tools/pool-cli/bin/pool-cli.js'

$secret = $env:SIGNUP_ROPC_CLIENT_SECRET
if (-not $secret) { $secret = $env:STS_SECRET }
if (-not $secret) {
  Write-Warning 'SIGNUP_ROPC_CLIENT_SECRET / STS_SECRET not set.'
}

Write-Host "=== lease $Vus users (run-id=$runId) ==="
$leaseArgs = @(
  'lease', '--count', $Vus, '--run-id', $runId, '--env', $PoolEnv, '--out', $slicePath
)
if ($EmailGlob) { $leaseArgs += @('--email-glob', $EmailGlob) }
if ($VerifiedOnly) { $leaseArgs += '--verified-only' } else { Write-Warning 'Leasing unverified users; ROPC may fail for unconfirmed emails.' }
node $poolCli @leaseArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

try {
  $k6Args = @(
    'run', 'k6/full-platform/k6-full-platform-orchestrator.js',
    '-e', 'USE_USER_POOL=1',
    '-e', "POOL_SLICE_FILE=$slicePath",
    '-e', 'SIGNUP_ROPC_CLIENT_ID=k6-load-test-client',
    '-e', "VUS=$Vus",
    '-e', "DURATION=$Duration",
    '-e', "LOAD_MODE=$LoadMode"
  )
  if ($secret) {
    $k6Args += @('-e', "SIGNUP_ROPC_CLIENT_SECRET=$secret")
  }
  $env:K6_DEFAULT_VUS = [string]$Vus
  $k6Args += @('-e', "K6_DEFAULT_VUS=$Vus", '-e', "USER_COUNT=$Vus")
  Write-Host '=== k6 full-platform orchestrator ==='
  & k6 @k6Args
  $exit = $LASTEXITCODE
} finally {
  Write-Host "=== release run-id=$runId ==="
  node $poolCli release --run-id $runId --env $PoolEnv
}
exit $exit
