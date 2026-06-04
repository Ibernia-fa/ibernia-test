#Requires -Version 5.1

<#
  Worker: run Phase A full-platform orchestrator for one advisor (single execution).
#>

param(
  [string] $RepoRoot,
  [string] $PoolSliceFile,
  [string] $UserEmail,
  [string] $RunTag,
  [string] $ShardId = '',
  [string] $AdvisorKey = '',
  [string] $Duration = '5m',
  [string] $RunOutDir,
  [string] $LogDir,
  [string] $Secret = '',
  [string] $VolumeScenario = 'phase-a-write-default',
  [string] $ClientsPerAdvisor = '',
  [string] $PlansPerClient = '',
  [bool] $SkipTeardown = $true,
  [bool] $ExportManifest = $true,
  [bool] $UseFixedAdvisors = $false,
  [bool] $VolumeSloGate = $false,
  [string] $AdvisorIndex = '',
  [string] $MaxDuration = '',
  [bool] $DisableFleetStagger = $false
)

$ErrorActionPreference = 'Stop'
Set-Location $RepoRoot

if (-not $AdvisorKey) { $AdvisorKey = $ShardId }
$workerName = $AdvisorKey
$startTime = Get-Date
$userMode = if ($UseFixedAdvisors) { 'fixed' } else { 'pool' }

function Resolve-PhaseAMaxDuration {
  param(
    [int] $ClientsPerAdvisor,
    [int] $PlansPerClient
  )
  $clients = [Math]::Max(1, $ClientsPerAdvisor)
  $plans = [Math]::Max(1, $PlansPerClient)
  # ~95s per plan build under parallel fleet load + 15m overhead.
  $units = $clients * $plans
  $seconds = 900 + ($units * 95)
  $minutes = [Math]::Ceiling($seconds / 60.0)
  $minutes = [Math]::Min(300, [Math]::Max(20, $minutes))
  return "${minutes}m"
}

$clientsInt = 0
$plansInt = 0
if ($ClientsPerAdvisor) { [void][int]::TryParse($ClientsPerAdvisor, [ref]$clientsInt) }
if ($PlansPerClient) { [void][int]::TryParse($PlansPerClient, [ref]$plansInt) }
$maxDuration = if ($MaxDuration) { $MaxDuration } else { Resolve-PhaseAMaxDuration $clientsInt $plansInt }

New-Item -ItemType Directory -Path $RunOutDir, $LogDir -Force | Out-Null

$k6LogFile = Join-Path $LogDir 'k6.log'
$workerMetaPath = Join-Path $RunOutDir 'run-metadata-worker.json'
$staleLogs = @($workerMetaPath, $k6LogFile)
foreach ($stale in $staleLogs) {
  if (Test-Path -LiteralPath $stale) { Remove-Item -LiteralPath $stale -Force }
}
Get-ChildItem -LiteralPath (Join-Path $RunOutDir 'manifests') -Filter '*.json' -File -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -LiteralPath (Join-Path $RunOutDir 'slo-shards') -Filter '*.json' -File -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue

$k6RestPort = 6570
if ($AdvisorIndex -ne '') {
  $k6RestPort = 6570 + [int]$AdvisorIndex
}

# Multi-client volume (S2+): one k6 process seeds all clients/plans for the advisor sequentially.
$multiClientVolume = $clientsInt -ge 2

Write-Host "[PhaseAWorker] START mode=$userMode advisorKey=$AdvisorKey shardId=$ShardId runTag=$RunTag email=$UserEmail slice=$PoolSliceFile maxDuration=$maxDuration k6RestPort=$k6RestPort multiClientVolume=$multiClientVolume disableFleetStagger=$DisableFleetStagger clientsPerAdvisor=$clientsInt log=$k6LogFile"

$sliceForK6 = $PoolSliceFile -replace '\\', '/'
$repoRootForK6 = $RepoRoot -replace '\\', '/'
# k6 open() resolves from lib/volume-slo.js — use ../config (repo root), not absolute C:/ paths.
$sloConfig = '../config/volume-api-slo.json'
$scenariosConfig = '../config/volume-scenarios.json'

$k6Args = @(
  'run', 'k6/full-platform/k6-full-platform-orchestrator.js',
  '--address', "127.0.0.1:${k6RestPort}",
  '-e', 'SIGNUP_ROPC_CLIENT_ID=k6-load-test-client',
  '-e', 'VUS=1',
  '-e', 'K6_DEFAULT_VUS=1',
  '-e', 'USER_COUNT=1',
  '-e', 'PHASE_A_SINGLE_EXECUTION=1',
  '-e', "MAX_DURATION=$maxDuration",
  '-e', 'HTTP_TIMEOUT=240s',
  '-e', 'VOLUME_SLO=1',
  '-e', 'VOLUME_SLO_PROFILE=write',
  '-e', "VOLUME_SLO_FILE=$sloConfig",
  '-e', "VOLUME_SCENARIOS_FILE=$scenariosConfig",
  '-e', "REPO_ROOT=$repoRootForK6",
  '-e', 'RELAX_CHECKS=1',
  '-e', 'RELAX_HTTP_REQ_FAILED=1',
  '-e', "VOLUME_SCENARIO=$VolumeScenario",
  '-e', "SCENARIO=$VolumeScenario",
  '-e', "PHASE_A_RUN_TAG=$RunTag",
  '-e', "FULL_PLATFORM_RUN_TAG=$RunTag",
  '-e', "VOLUME_SLO_RUN_ID=$RunTag",
  '-e', 'CONSOLIDATED_PERF=1'
)

if ($UseFixedAdvisors) {
  $k6Args += @('-e', 'USE_USER_POOL=0', '-e', "LIFECYCLE_USERS_FILE=$sliceForK6")
} else {
  $k6Args += @('-e', 'USE_USER_POOL=1', '-e', "POOL_SLICE_FILE=$sliceForK6")
}

if ($VolumeSloGate) {
  $k6Args += @('-e', 'VOLUME_SLO_GATE=1')
}

if ($ShardId) { $k6Args += @('-e', "PHASE_A_SHARD_ID=$ShardId") }
if ($AdvisorIndex -ne '') {
  $k6Args += @('-e', "PHASE_A_ADVISOR_INDEX=$AdvisorIndex")
}
if ($ExportManifest) { $k6Args += @('-e', 'PHASE_A_EXPORT_MANIFEST=1') }
if ($SkipTeardown) {
  $k6Args += @('-e', 'FULL_PLATFORM_SKIP_TEARDOWN=1', '-e', 'FULL_PLATFORM_SKIP_CLEANUP=1')
}
$k6Args += @('-e', 'FULL_PLATFORM_PRE_RUN_CLEANUP=1')
if ($UseFixedAdvisors) {
  Remove-Item Env:FULL_PLATFORM_PRE_RUN_CLEANUP_ALL -ErrorAction SilentlyContinue
  $k6Args += @('-e', 'FULL_PLATFORM_PRE_RUN_CLEANUP_ALL=1')
}
if ($ClientsPerAdvisor) {
  $k6Args += @(
    '-e', "PHASE_A_CLIENTS_PER_ADVISOR=$ClientsPerAdvisor",
    '-e', "FULL_PLATFORM_CLIENTS_PER_ADVISOR=$ClientsPerAdvisor"
  )
}
if ($PlansPerClient) {
  $k6Args += @(
    '-e', "PHASE_A_PLANS_PER_CLIENT=$PlansPerClient",
    '-e', "FULL_PLATFORM_PLANS_PER_CLIENT=$PlansPerClient"
  )
}
if ($DisableFleetStagger) {
  $k6Args += @('-e', 'VOLUME_DISABLE_FLEET_STAGGER=1')
}
if ($Secret) { $k6Args += @('-e', "SIGNUP_ROPC_CLIENT_SECRET=$Secret") }

Write-Host "[PhaseAWorker] mode=$userMode VOLUME_SLO_GATE=$VolumeSloGate CONSOLIDATED_PERF=1"

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$writer = [System.IO.StreamWriter]::new($k6LogFile, $false, $utf8NoBom)
$code = 1
$prevEap = $ErrorActionPreference
try {
  # k6 warnings go to stderr; 2>&1 becomes ErrorRecord and must not terminate the worker.
  $ErrorActionPreference = 'Continue'
  & k6 @k6Args 2>&1 | ForEach-Object {
    $line = if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.ToString() } else { "$_" }
    $writer.WriteLine($line)
  }
  $code = $LASTEXITCODE
} finally {
  $ErrorActionPreference = $prevEap
  $writer.Close()
}

if ($ExportManifest -and (Test-Path -LiteralPath $k6LogFile)) {
  $extractCli = Join-Path $RepoRoot 'tools/extract-phase-a-manifest-from-k6-log.mjs'
  & node $extractCli --log $k6LogFile --repo-root $RepoRoot | Out-Null
  $extractCode = $LASTEXITCODE
  if ($extractCode -ne 0 -and $code -eq 0) {
    Write-Warning "[PhaseAWorker] k6 succeeded but no PHASE_A_MANIFEST_SHARD marker in log"
    $code = 2
  }
}

if (Test-Path -LiteralPath $k6LogFile) {
  $signoffDir = Join-Path $RepoRoot "reports/phase-a/$RunTag/signoff-shards"
  New-Item -ItemType Directory -Path $signoffDir -Force | Out-Null
  $signoffOut = Join-Path $signoffDir "signoff-$ShardId.json"
  $signoffCli = Join-Path $RepoRoot 'tools/extract-volume-signoff-from-k6-log.mjs'
  & node $signoffCli --log $k6LogFile --shard-id $ShardId --email $UserEmail --run-tag $RunTag --exit-code $code --out $signoffOut | Out-Null
}

$manifestSrc = Join-Path $RepoRoot "reports/phase-a/$RunTag/manifests"
if (Test-Path -LiteralPath $manifestSrc) {
  $ownManifest = Get-ChildItem -LiteralPath $manifestSrc -Filter "shard-*-$ShardId.json" -File -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($ownManifest) {
    $destManifests = Join-Path $RunOutDir 'manifests'
    New-Item -ItemType Directory -Path $destManifests -Force | Out-Null
    Copy-Item -LiteralPath $ownManifest.FullName -Destination (Join-Path $destManifests $ownManifest.Name) -Force
    if ($code -eq 0 -and $clientsInt -gt 0) {
      $shardJson = Get-Content -LiteralPath $ownManifest.FullName -Raw | ConvertFrom-Json
      $okClients = 0
      if ($shardJson.counts -and $null -ne $shardJson.counts.clients) {
        $okClients = [int]$shardJson.counts.clients
      } elseif ($shardJson.clients) {
        foreach ($c in $shardJson.clients) {
          if ($c.clientId -and -not $c.error) { $okClients++ }
        }
      }
      if ($okClients -lt 1) {
        Write-Warning "[PhaseAWorker] manifest has 0 successful clients (expected $clientsInt); marking job failed"
        $code = 2
      }
    }
  }
}

$sloShardSrc = Join-Path $RepoRoot "reports/phase-a/$RunTag/slo-shards"
if (Test-Path -LiteralPath $sloShardSrc) {
  $ownSlo = Get-ChildItem -LiteralPath $sloShardSrc -Filter "slo-$ShardId.json" -File -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($ownSlo) {
    $destSlo = Join-Path $RunOutDir 'slo-shards'
    New-Item -ItemType Directory -Path $destSlo -Force | Out-Null
    Copy-Item -LiteralPath $ownSlo.FullName -Destination (Join-Path $destSlo $ownSlo.Name) -Force
  }
}

$endTime = Get-Date
$elapsedSec = [math]::Round(($endTime - $startTime).TotalSeconds, 1)

$workerMeta = [ordered]@{
  reportType     = 'phase-a-worker-metadata'
  runTag         = $RunTag
  advisorKey     = $AdvisorKey
  shardId        = $ShardId
  advisorEmail   = $UserEmail
  userMode       = $userMode
  poolSliceFile  = $PoolSliceFile
  volumeScenario = $VolumeScenario
  volumeSloGate  = $VolumeSloGate
  maxDuration    = $maxDuration
  startTime      = $startTime.ToUniversalTime().ToString('o')
  endTime        = $endTime.ToUniversalTime().ToString('o')
  elapsedSec     = $elapsedSec
  exitCode       = $code
  k6LogFile      = $k6LogFile
}
[System.IO.File]::WriteAllText(
  (Join-Path $RunOutDir 'run-metadata-worker.json'),
  ($workerMeta | ConvertTo-Json -Depth 4) + "`n",
  $utf8NoBom
)

Write-Host "[PhaseAWorker] END mode=$userMode advisorKey=$AdvisorKey exitCode=$code elapsedSec=$elapsedSec"
exit $code
