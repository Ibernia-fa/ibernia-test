#Requires -Version 5.1
<#
.SYNOPSIS
  Remove k6 load-test custom Events (Timeline Goals badges) for all pool users.

.EXAMPLE
  $env:STS_SECRET = '...'
  .\runners\purge-k6-events.ps1
  .\runners\purge-k6-events.ps1 -DryRun
#>
param(
  [Alias('Env')]
  [string] $PoolEnv = 'dev',
  [string] $EmailGlob = '',
  [bool] $VerifiedOnly = $true,
  [switch] $DryRun
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

if (-not $env:STS_SECRET -and -not $env:SIGNUP_ROPC_CLIENT_SECRET) {
  throw 'Set STS_SECRET or SIGNUP_ROPC_CLIENT_SECRET before running.'
}

$cliArgs = @('purge-k6-events', '--env', $PoolEnv)
if ($VerifiedOnly) { $cliArgs += '--verified-only' }
if ($EmailGlob) { $cliArgs += '--email-glob'; $cliArgs += $EmailGlob }
if ($DryRun) { $cliArgs += '--dry-run' }

Write-Host "=== purge k6 custom timeline events (env=$PoolEnv) ==="
node tools/pool-cli/bin/pool-cli.js @cliArgs
