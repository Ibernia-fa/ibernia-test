#Requires -Version 5.1
<#
.SYNOPSIS
  Lease N pool users, run any k6 script with VUS=N, then release.

.PARAMETER Script
  Path to k6 script under load-testing-k6 (e.g. k6/clients/k6-clients-list-load.js).

.PARAMETER Vus
  Virtual users and lease count (default 100).

.PARAMETER Duration
  Optional -e DURATION=... for scripts that use it.

.PARAMETER PoolEnv
  Pool environment (default dev). Alias: Env.

.EXAMPLE
  $env:STS_SECRET = '...'
  .\runners\run-k6.ps1 -Script k6/clients/k6-clients-list-load.js -Vus 100 -Duration 5m
#>
param(
  [Parameter(Mandatory = $true)]
  [string] $Script,
  [int] $Vus = 100,
  [string] $Duration = '',
  [Alias('Env')]
  [string] $PoolEnv = 'dev',
  [string] $EmailGlob = '',
  [bool] $VerifiedOnly = $true
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

if (-not (Test-Path $Script)) {
  throw "Script not found: $Script"
}

$runId = "k6-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$slicePath = Join-Path $RepoRoot "data/user-pool/$PoolEnv/pool-slice-$runId.json"
$poolCli = Join-Path $RepoRoot 'tools/pool-cli/bin/pool-cli.js'

$secret = $env:SIGNUP_ROPC_CLIENT_SECRET
if (-not $secret) { $secret = $env:STS_SECRET }
if (-not $secret) {
  Write-Warning 'SIGNUP_ROPC_CLIENT_SECRET / STS_SECRET not set.'
}

$env:K6_DEFAULT_VUS = [string]$Vus

Write-Host "=== lease $Vus users (run-id=$runId) ==="
$leaseArgs = @('lease', '--count', $Vus, '--run-id', $runId, '--env', $PoolEnv, '--out', $slicePath)
if ($EmailGlob) { $leaseArgs += @('--email-glob', $EmailGlob) }
if ($VerifiedOnly) { $leaseArgs += '--verified-only' }
node $poolCli @leaseArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

try {
  $k6Args = @(
    'run', $Script,
    '-e', 'USE_USER_POOL=1',
    '-e', "POOL_SLICE_FILE=$slicePath",
    '-e', 'SIGNUP_ROPC_CLIENT_ID=k6-load-test-client',
    '-e', "VUS=$Vus",
    '-e', "K6_DEFAULT_VUS=$Vus"
  )
  if ($Duration) { $k6Args += @('-e', "DURATION=$Duration") }
  if ($secret) { $k6Args += @('-e', "SIGNUP_ROPC_CLIENT_SECRET=$secret") }

  Write-Host "=== k6 $Script (VUS=$Vus) ==="
  & k6 @k6Args
  $exit = $LASTEXITCODE
} finally {
  Write-Host "=== release run-id=$runId ==="
  node $poolCli release --run-id $runId --env $PoolEnv
}
exit $exit
