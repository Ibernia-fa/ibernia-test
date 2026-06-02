#Requires -Version 5.1

<#
.SYNOPSIS
  Phase B volume read journey against a merged Phase A manifest.

.EXAMPLE
  $env:STS_SECRET = '...'
  .\runners\run-phase-b-volume.ps1 -Scenario S1 -RunId S1-vol-20260602 -PhaseARunTag S1-vol-20260602 -UseFixedAdvisors
#>

param(
  [Alias('Scenario')]
  [string] $VolumeScenario = 'phase-b-read-default',

  [Alias('RunId')]
  [string] $RunTag = '',

  [string] $PhaseARunTag = '',

  [string] $ManifestFile = '',

  [int] $Vus = 0,

  [string] $Duration = '10m',

  [Alias('Env')]
  [string] $PoolEnv = 'dev',

  [switch] $UseFixedAdvisors,

  [string] $FixedAdvisorsFile = 'data/scenarios/fixed-advisors-dev-20.json',

  [string] $UsersSliceFile = '',

  [switch] $VolumeSloGate
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$resolveCli = Join-Path $RepoRoot 'tools/resolve-volume-scenario.mjs'
$secret = $env:SIGNUP_ROPC_CLIENT_SECRET
if (-not $secret) { $secret = $env:STS_SECRET }
if (-not $secret) {
  Write-Error 'Set STS_SECRET or SIGNUP_ROPC_CLIENT_SECRET before running.'
  exit 1
}

if (-not $RunTag) {
  $RunTag = "phase-b-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
}
if (-not $PhaseARunTag) { $PhaseARunTag = $RunTag }

$phaseBScenario = $VolumeScenario
$writeCheck = node @($resolveCli, $VolumeScenario) 2>$null | ConvertFrom-Json
if ($writeCheck -and $writeCheck.phaseBScenario -and $writeCheck.profile -eq 'write') {
  $phaseBScenario = $writeCheck.phaseBScenario
  Write-Host "Resolved Phase B scenario from write profile: $phaseBScenario"
}

$phaseBResolved = node @($resolveCli, $phaseBScenario) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$manifestPath = $ManifestFile
if (-not $manifestPath) {
  $manifestPath = "reports/phase-a/$PhaseARunTag/manifest.json"
}
$manifestAbs = Join-Path $RepoRoot ($manifestPath -replace '/', '\')
if (-not (Test-Path -LiteralPath $manifestAbs)) {
  $profileCandidate = $phaseBResolved.manifestProfileFile
  if ($profileCandidate) {
    $manifestAbs = Join-Path $RepoRoot ($profileCandidate -replace '/', '\')
  }
}
if (-not (Test-Path -LiteralPath $manifestAbs)) {
  throw "Manifest not found: $manifestAbs"
}

$vusCount = if ($Vus -gt 0) { $Vus } else { 0 }
if ($vusCount -lt 1 -and $writeCheck -and [int]$writeCheck.advisors -gt 0) {
  $vusCount = [int]$writeCheck.advisors
}
if ($vusCount -lt 1) {
  try {
    $manifestMeta = Get-Content -LiteralPath $manifestAbs -Raw | ConvertFrom-Json
    if ($manifestMeta.advisors) {
      $vusCount = @($manifestMeta.advisors).Count
    }
  } catch {
    Write-Warning "Could not read advisor count from manifest: $($_.Exception.Message)"
  }
}
if ($vusCount -lt 1 -and [int]$phaseBResolved.advisors -gt 0) {
  $vusCount = [int]$phaseBResolved.advisors
}
if ($vusCount -lt 1) { $vusCount = 20 }

$usersFile = $UsersSliceFile
if (-not $usersFile) {
  if ($UseFixedAdvisors) {
    $usersFile = $FixedAdvisorsFile
  } else {
    $usersFile = "data/user-pool/$PoolEnv/pool-slice-$PhaseARunTag.json"
  }
}
$usersAbs = Join-Path $RepoRoot ($usersFile -replace '/', '\')
if (-not (Test-Path -LiteralPath $usersAbs)) {
  throw "Users file not found: $usersAbs"
}

$manifestK6 = ($manifestAbs.Substring($RepoRoot.Length + 1)) -replace '\\', '/'
$usersK6 = ($usersAbs.Substring($RepoRoot.Length + 1)) -replace '\\', '/'
$sloGate = [bool]$VolumeSloGate.IsPresent

Write-Host "=== Phase B volume ==="
Write-Host "  scenario=$phaseBScenario runTag=$RunTag phaseARunTag=$PhaseARunTag vus=$vusCount"
Write-Host "  manifest=$manifestK6 users=$usersK6 sloGate=$sloGate"

$k6Args = @(
  'run', 'k6/journeys/k6-journey-advisor-critical.js',
  '-e', 'PHASE_B_READ_ONLY=1',
  '-e', 'VOLUME_READ_ONLY=1',
  '-e', 'JOURNEY_USE_MANIFEST_IDS=1',
  '-e', "PHASE_B_MANIFEST_FILE=$manifestK6",
  '-e', "SCENARIO_MANIFEST_FILE=$manifestK6",
  '-e', "VOLUME_MANIFEST_FILE=$manifestK6",
  '-e', 'VOLUME_SLO=1',
  '-e', 'VOLUME_SLO_PROFILE=read',
  '-e', "VOLUME_SCENARIO=$phaseBScenario",
  '-e', "SCENARIO=$phaseBScenario",
  '-e', "PHASE_B_RUN_TAG=$RunTag",
  '-e', "VOLUME_SLO_RUN_ID=$RunTag",
  '-e', "VUS=$vusCount",
  '-e', "DURATION=$Duration",
  '-e', 'VOLUME_SLO_FILE=../../config/volume-api-slo.json',
  '-e', 'VOLUME_SCENARIOS_FILE=../../config/volume-scenarios.json',
  '-e', 'SIGNUP_ROPC_CLIENT_ID=k6-load-test-client',
  '-e', "SIGNUP_ROPC_CLIENT_SECRET=$secret",
  '-e', 'CONSOLIDATED_PERF=1'
)

if ($sloGate) { $k6Args += @('-e', 'VOLUME_SLO_GATE=1') }

if ($UseFixedAdvisors) {
  $k6Args += @('-e', 'USE_USER_POOL=0', '-e', "LIFECYCLE_USERS_FILE=$usersK6")
} else {
  $k6Args += @('-e', 'USE_USER_POOL=1', '-e', "POOL_SLICE_FILE=$usersK6")
}

$runRoot = Join-Path $RepoRoot "reports/phase-b/$RunTag"
New-Item -ItemType Directory -Path $runRoot -Force | Out-Null
$k6Log = Join-Path $runRoot 'k6.log'
if (Test-Path -LiteralPath $k6Log) {
  try {
    Remove-Item -LiteralPath $k6Log -Force
  } catch {
    $k6Log = Join-Path $runRoot ("k6-$(Get-Date -Format 'yyyyMMdd-HHmmss').log")
    Write-Warning "Existing k6.log is locked; using $k6Log"
  }
}

$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$writer = [System.IO.StreamWriter]::new($k6Log, $false, $utf8NoBom)
Write-Host "k6 logging to $k6Log (console shows progress + errors only)"
try {
  & k6 @k6Args 2>&1 | ForEach-Object {
    $line = if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.ToString() } else { "$_" }
    $writer.WriteLine($line)
    # k6 progress + real errors only — avoids red stderr flood from __K6_PERF_* console lines
    if ($line -match '^running \(|^advisor_critical_journey\s+\[|level=error|thresholds on metrics') {
      Write-Host $line
    }
  }
  $code = $LASTEXITCODE
} finally {
  $writer.Close()
  $ErrorActionPreference = $prevEap
}

Write-Host "=== Phase B complete exit=$code log=$k6Log ==="
Write-Host "After run: node tools/extract-phase-b-signoff-from-k6-log.mjs --log $k6Log --run-tag $RunTag"
Write-Host "Then: node tools/generate-volume-signoff.mjs --pair-run-tag $PhaseARunTag --phase-a-run-tag $PhaseARunTag --phase-b-run-tag $RunTag --expected-shards $vusCount"

exit $code
