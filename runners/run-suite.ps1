#Requires -Version 5.1
<#
.SYNOPSIS
  Lease pool users once, run one k6 suite, then release.

.PARAMETER Suite
  Suite name: full-platform, clients-lifecycle, timelines (default full-platform).

.PARAMETER Vus
  Virtual users and lease count (default 100).

.PARAMETER PoolEnv
  Pool environment (default dev). Alias: Env.
#>
param(
  [ValidateSet('full-platform', 'clients-lifecycle', 'timelines')]
  [string] $Suite = 'full-platform',
  [int] $Vus = 100,
  [string] $Duration = '3m',
  [Alias('Env')]
  [string] $PoolEnv = 'dev'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$runId = "suite-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$slicePath = Join-Path $RepoRoot "data/user-pool/$PoolEnv/pool-slice-$runId.json"
$poolCli = Join-Path $RepoRoot 'tools/pool-cli/bin/pool-cli.js'

$secret = $env:SIGNUP_ROPC_CLIENT_SECRET
if (-not $secret) { $secret = $env:STS_SECRET }

node $poolCli lease --count $Vus --run-id $runId --env $PoolEnv --out $slicePath
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:K6_DEFAULT_VUS = [string]$Vus
$k6Common = @(
  '-e', 'USE_USER_POOL=1',
  '-e', "POOL_SLICE_FILE=$slicePath",
  '-e', 'SIGNUP_ROPC_CLIENT_ID=k6-load-test-client',
  '-e', "VUS=$Vus",
  '-e', "K6_DEFAULT_VUS=$Vus"
)
if ($secret) { $k6Common += @('-e', "SIGNUP_ROPC_CLIENT_SECRET=$secret") }

$script = switch ($Suite) {
  'full-platform' { 'k6/full-platform/k6-full-platform-orchestrator.js' }
  'clients-lifecycle' { 'k6/clients/k6-client-full-lifecycle.js' }
  'timelines' { 'k6/cashflows-timeline/k6-cashflows-timelines-load.js' }
}

try {
  $k6Args = @('run', $script) + $k6Common
  if ($Suite -eq 'full-platform') {
    $k6Args += @('-e', "DURATION=$Duration", '-e', 'LOAD_MODE=vus')
  }
  & k6 @k6Args
  $exit = $LASTEXITCODE
} finally {
  node $poolCli release --run-id $runId --env $PoolEnv
}
exit $exit
