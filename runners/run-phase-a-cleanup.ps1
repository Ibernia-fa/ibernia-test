#Requires -Version 5.1
<#
.SYNOPSIS
  Generate a Phase A cleanup plan from a merged manifest (does not delete clients or plans).

.DESCRIPTION
  Reads reports/phase-a/{RunTag}/manifest.json and writes cleanup-plan.json listing uniqueTag needles
  per advisor/client. This runner does NOT perform HTTP deletes — use the plan for manual follow-up,
  pool-cli, or re-run the full-platform orchestrator with FULL_PLATFORM_SKIP_TEARDOWN=0.

.PARAMETER RunTag
  Phase A run tag (directory under reports/phase-a/).

.PARAMETER ManifestFile
  Override path to merged manifest JSON.

.EXAMPLE
  $env:STS_SECRET = '...'
  .\runners\run-phase-a-cleanup.ps1 -RunTag phase-a-20260602-120000
#>
param(
  [Parameter(Mandatory = $true)]
  [string] $RunTag,
  [string] $ManifestFile = '',
  [Alias('Env')]
  [string] $PoolEnv = 'dev'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

if (-not $ManifestFile) {
  $ManifestFile = Join-Path $RepoRoot "reports/phase-a/$RunTag/manifest.json"
}
if (-not (Test-Path -LiteralPath $ManifestFile)) {
  Write-Error "Manifest not found: $ManifestFile"
  exit 1
}

$manifest = Get-Content -LiteralPath $ManifestFile -Raw | ConvertFrom-Json
$advisors = @($manifest.advisors)
if (-not $advisors.Count) {
  Write-Warning 'Manifest has no advisors — nothing to clean.'
  exit 0
}

Write-Host "=== Phase A cleanup: runTag=$RunTag advisors=$($advisors.Count) clients=$($manifest.totals.clients) ==="
Write-Host "Manifest: $ManifestFile"
Write-Host 'NOTE: Per-advisor k6 cleanup requires matching pool credentials. Use pool-cli or run orchestrator with skipTeardown=0 for automated delete.'

# Emit cleanup plan JSON for manual or scripted follow-up (no k6 traffic from this runner).
$planPath = Join-Path $RepoRoot "reports/phase-a/$RunTag/cleanup-plan.json"
$needles = @()
foreach ($a in $advisors) {
  foreach ($c in @($a.clients)) {
    if ($c.uniqueTag) {
      $needles += [ordered]@{
        advisorSub = $a.advisorSub
        advisorEmail = $a.advisorEmail
        clientId = $c.clientId
        uniqueTag = $c.uniqueTag
        planCount = @($c.cashflows).Count
      }
    }
  }
}

$plan = [ordered]@{
  reportType = 'phase-a-cleanup-plan'
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  runTag = $RunTag
  manifestFile = $ManifestFile
  needles = $needles
  instructions = @(
    'Re-run full-platform orchestrator with FULL_PLATFORM_SKIP_TEARDOWN=0 for each advisor, or',
    'Use deleteClientsAndPlansByLastNameNeedle via k6-load-cleanup with each uniqueTag needle.'
  )
}

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($planPath, ($plan | ConvertTo-Json -Depth 8) + "`n", $utf8NoBom)
Write-Host "Wrote cleanup plan: $planPath ($($needles.Count) client needle(s))"
