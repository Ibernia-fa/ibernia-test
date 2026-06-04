#Requires -Version 5.1

<#
.SYNOPSIS
  Phase A volume seed — parallel advisor orchestration with isolated run directories.

.DESCRIPTION
  Runs k6 full-platform orchestrator (write SLO + manifest export) per advisor in parallel.
  Supports pool-cli lease (default) or fixed advisors file (-UseFixedAdvisors).

.EXAMPLE
  $env:STS_SECRET = '...'
  .\runners\run-phase-a-volume.ps1 -Scenario S1 -RunId vol-s1-smoke -AdvisorCount 2 -UseFixedAdvisors -VolumeSloGate
#>

param(
  [Alias('Scenario')]
  [string] $VolumeScenario = 'phase-a-write-default',

  [Alias('RunId')]
  [string] $RunTag = '',

  [Alias('AdvisorCount')]
  [int] $Advisors = 0,

  [int] $ClientsPerAdvisor = 0,

  [int] $PlansPerClient = 0,

  [Alias('Concurrency')]
  [int] $ParallelJobs = 0,

  [string] $Duration = '5m',

  [Alias('Env')]
  [string] $PoolEnv = 'dev',

  [int] $Iterations = 1,

  [bool] $SkipTeardown = $true,

  [switch] $NoManifest,

  [bool] $VerifiedOnly = $true,

  [switch] $ContinueOnError,

  [switch] $UseFixedAdvisors,

  [string] $FixedAdvisorsFile = 'data/scenarios/fixed-advisors-dev-20.json',

  [switch] $VolumeSloGate
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$runStartTime = Get-Date
if (-not $RunTag) {
  $RunTag = "phase-a-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
}

# Fixed-advisor S1 writes reuse stable output paths (overwrite manifest, profile, slices).
$stableFixedRunTag = 'S1-write'
if ($UseFixedAdvisors -and $VolumeScenario -eq 'S1') {
  if ($RunTag -ne $stableFixedRunTag) {
    Write-Host "  fixed advisors: reusing stable runTag=$stableFixedRunTag (was RunId=$RunTag)"
  }
  $RunTag = $stableFixedRunTag
}

$poolCli = Join-Path $RepoRoot 'tools/pool-cli/bin/pool-cli.js'
$mergeCli = Join-Path $RepoRoot 'tools/merge-phase-a-manifest.mjs'
$mergeSloCli = Join-Path $RepoRoot 'tools/merge-phase-a-slo.mjs'
$mergeSignoffCli = Join-Path $RepoRoot 'tools/merge-volume-signoff-shards.mjs'
$signoffGenCli = Join-Path $RepoRoot 'tools/generate-volume-signoff.mjs'
$resolveCli = Join-Path $RepoRoot 'tools/resolve-volume-scenario.mjs'
$summaryCli = Join-Path $RepoRoot 'tools/generate-phase-a-summary.mjs'
$writeSliceCli = Join-Path $RepoRoot 'tools/write-pool-slice-one.mjs'
$workerScript = Join-Path $RepoRoot 'runners/scripts/Invoke-PhaseAAdvisorWorker.ps1'

$runRoot = Join-Path $RepoRoot "reports/phase-a/$RunTag"
$manifestsRoot = Join-Path $runRoot 'manifests'
$sloShardsRoot = Join-Path $runRoot 'slo-shards'
$workersRoot = Join-Path $runRoot 'workers'
$logsRoot = Join-Path $runRoot 'logs'
$runMetadataPath = Join-Path $runRoot 'run-metadata.json'
$slicePath = Join-Path $RepoRoot "data/user-pool/$PoolEnv/pool-slice-$RunTag.json"

$secret = $env:SIGNUP_ROPC_CLIENT_SECRET
if (-not $secret) { $secret = $env:STS_SECRET }
if (-not $secret) {
  Write-Error 'Set STS_SECRET or SIGNUP_ROPC_CLIENT_SECRET before running.'
  exit 1
}

# Resolve scenario
$resolveArgs = @($resolveCli, $VolumeScenario, '--iterations', [string]$Iterations)
if ($ClientsPerAdvisor -gt 0) { $resolveArgs += @('--clients', [string]$ClientsPerAdvisor) }
if ($PlansPerClient -gt 0) { $resolveArgs += @('--plans', [string]$PlansPerClient) }
if ($Advisors -gt 0) { $resolveArgs += @('--advisors', [string]$Advisors) }
$scenarioResolved = node @resolveArgs | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$clientsPerAdvisor = [int]$scenarioResolved.clientsPerAdvisor
$plansPerClient = [int]$scenarioResolved.plansPerClient
$iterations = [int]$scenarioResolved.iterations
$advisorsCount = if ($Advisors -gt 0) { $Advisors } else { [int]$scenarioResolved.advisors }
$expectedClients = $advisorsCount * $clientsPerAdvisor * $iterations
$expectedPlans = $advisorsCount * $clientsPerAdvisor * $plansPerClient * $iterations
$expectedShards = $advisorsCount
$manifestProfileFile = $scenarioResolved.manifestProfileFile
$profileOutPath = if ($manifestProfileFile) { Join-Path $RepoRoot $manifestProfileFile } else { '' }

function Resolve-PhaseAMaxDuration {
  param(
    [int] $ClientsPerAdvisor,
    [int] $PlansPerClient
  )
  $clients = [Math]::Max(1, $ClientsPerAdvisor)
  $plans = [Math]::Max(1, $PlansPerClient)
  $units = $clients * $plans
  $seconds = 900 + ($units * 95)
  $minutes = [Math]::Ceiling($seconds / 60.0)
  $minutes = [Math]::Min(300, [Math]::Max(20, $minutes))
  return "${minutes}m"
}

$phaseAMaxDuration = Resolve-PhaseAMaxDuration $clientsPerAdvisor $plansPerClient

# Default: scenario writeParallelJobs (20 for S1–S5), else all advisors in parallel.
# Override with -ParallelJobs N if needed.
$scenarioParallel = 0
if ($scenarioResolved.writeParallelJobs) {
  $scenarioParallel = [int]$scenarioResolved.writeParallelJobs
}
$volumeUnits = $clientsPerAdvisor * $plansPerClient
$concurrency = if ($ParallelJobs -gt 0) {
  $ParallelJobs
} elseif ($scenarioParallel -gt 0) {
  $scenarioParallel
} else {
  $advisorsCount
}
# S4/S5-scale writes: cap parallel advisors unless -ParallelJobs overrides (avoids POST /Clients 500 storms).
if ($ParallelJobs -le 0) {
  if ($volumeUnits -ge 160) {
    $concurrency = [Math]::Min(4, $advisorsCount)
    Write-Host "  volumeUnits=$volumeUnits -> default concurrency=$concurrency (S4/S5 scale)"
  } elseif ($volumeUnits -ge 80) {
    $concurrency = [Math]::Min(8, $advisorsCount)
    Write-Host "  volumeUnits=$volumeUnits -> default concurrency=$concurrency (high-volume scale)"
  }
}
if ($concurrency -gt $advisorsCount) {
  Write-Warning "Concurrency $concurrency exceeds advisor count $advisorsCount; capping at $advisorsCount"
  $concurrency = $advisorsCount
}
$advisorStartStaggerSec = if ($clientsPerAdvisor -ge 15) { 12 } elseif ($clientsPerAdvisor -ge 10) { 8 } else { 0 }
$extractCli = Join-Path $RepoRoot 'tools/extract-phase-a-manifest-from-k6-log.mjs'

if ($advisorsCount -lt 1) { throw 'AdvisorCount must be >= 1' }

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$scenarioJsonPath = Join-Path $runRoot 'scenario-resolved.json'
$volumeSloGate = [bool]$VolumeSloGate.IsPresent

New-Item -ItemType Directory -Path $runRoot, $manifestsRoot, $sloShardsRoot, $workersRoot, $logsRoot -Force | Out-Null
Get-ChildItem -LiteralPath $manifestsRoot -Filter '*.json' -File -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -LiteralPath $sloShardsRoot -Filter '*.json' -File -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue
$signoffShardsRoot = Join-Path $runRoot 'signoff-shards'
New-Item -ItemType Directory -Path $signoffShardsRoot -Force | Out-Null
Get-ChildItem -LiteralPath $signoffShardsRoot -Filter '*.json' -File -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue
[System.IO.File]::WriteAllText(
  $scenarioJsonPath,
  (($scenarioResolved | ConvertTo-Json -Compress -Depth 10) + "`n"),
  $utf8NoBom
)

$userMode = if ($UseFixedAdvisors) { 'fixed' } else { 'pool' }
Write-Host "=== Phase A volume ==="
Write-Host "  scenario=$VolumeScenario runTag=$RunTag userMode=$userMode"
Write-Host "  advisors=$advisorsCount concurrency=$concurrency clientsPerAdvisor=$clientsPerAdvisor plansPerClient=$plansPerClient"
Write-Host "  expectedClients=$expectedClients expectedPlans=$expectedPlans expectedShards=$expectedShards"
Write-Host "  maxDurationPerAdvisor=$phaseAMaxDuration"
if ($profileOutPath) { Write-Host "  profileOut=$profileOutPath" }

$allUsers = @()
$leasedFromPool = $false

if ($UseFixedAdvisors) {
  $fixedPath = Join-Path $RepoRoot $FixedAdvisorsFile
  if (-not (Test-Path -LiteralPath $fixedPath)) {
    throw "Fixed advisors file not found: $fixedPath (copy from fixed-advisors-dev-20.json.example)"
  }
  $allUsers = Get-Content -LiteralPath $fixedPath -Raw | ConvertFrom-Json
  Write-Host "=== fixed advisors: $($allUsers.Count) rows from $fixedPath ==="
} else {
  Write-Host "=== lease $advisorsCount users from pool ==="
  $leaseStart = Get-Date
  $leaseArgs = @('lease', '--count', [string]$advisorsCount, '--run-id', $RunTag, '--env', $PoolEnv, '--out', $slicePath)
  if ($VerifiedOnly) { $leaseArgs += '--verified-only' }
  node $poolCli @leaseArgs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  $allUsers = Get-Content -LiteralPath $slicePath -Raw | ConvertFrom-Json
  $leasedFromPool = $true
  Write-Host "Pool lease OK elapsedSec=$([math]::Round(((Get-Date) - $leaseStart).TotalSeconds, 1)) slice=$slicePath"
}

$userCount = @($allUsers).Count
if ($userCount -lt $advisorsCount) {
  throw "Only $userCount users available but $advisorsCount requested."
}

$userSliceDir = if ($UseFixedAdvisors) {
  Join-Path $RepoRoot 'data/scenarios/user-slices-fixed-dev'
} else {
  Join-Path $RepoRoot "data/user-pool/$PoolEnv/user-slices-$RunTag"
}
New-Item -ItemType Directory -Path $userSliceDir -Force | Out-Null

$runMetaInit = [ordered]@{
  reportType          = 'phase-a-run-metadata'
  runTag              = $RunTag
  poolEnv             = $PoolEnv
  volumeScenario      = $VolumeScenario
  userMode            = $userMode
  advisors            = $advisorsCount
  concurrency         = $concurrency
  writeParallelJobs   = $scenarioParallel
  clientsPerAdvisor   = $clientsPerAdvisor
  plansPerClient      = $plansPerClient
  iterations          = $iterations
  expectedClients     = $expectedClients
  expectedPlans       = $expectedPlans
  expectedShards      = $expectedShards
  manifestProfileFile = $manifestProfileFile
  phaseBScenario      = $scenarioResolved.phaseBScenario
  volumeSloGate       = $volumeSloGate
  runStartTime        = $runStartTime.ToUniversalTime().ToString('o')
  advisorRuns         = @()
}
[System.IO.File]::WriteAllText($runMetadataPath, ($runMetaInit | ConvertTo-Json -Depth 6) + "`n", $utf8NoBom)

$jobs = @()
try {
  for ($i = 0; $i -lt $advisorsCount; $i++) {
    $user = $allUsers[$i]
    $userKey = ('advisor-{0:D2}' -f $i)
    $shardId = $userKey
    $singleSlice = Join-Path $userSliceDir "slice-$userKey.json"

    if ($UseFixedAdvisors) {
      $fixedAbs = Join-Path $RepoRoot $FixedAdvisorsFile
      node $writeSliceCli $fixedAbs $i $singleSlice
    } else {
      node $writeSliceCli $slicePath $i $singleSlice
    }
    if ($LASTEXITCODE -ne 0) { throw "Failed to write user slice for $userKey" }

    $workerOut = Join-Path $workersRoot $userKey
    $workerLog = Join-Path $logsRoot $userKey
    New-Item -ItemType Directory -Path $workerOut, $workerLog -Force | Out-Null

    if ($advisorStartStaggerSec -gt 0 -and $i -gt 0) {
      Start-Sleep -Seconds ($advisorStartStaggerSec * $i)
    }
    Write-Host "Starting job $userKey email=$($user.email) mode=$userMode slice=$singleSlice"
    $jobs += Start-Job -Name $userKey -FilePath $workerScript -ArgumentList @(
      $RepoRoot,
      $singleSlice,
      $user.email,
      $RunTag,
      $shardId,
      $userKey,
      $Duration,
      $workerOut,
      $workerLog,
      $secret,
      $VolumeScenario,
      [string]$clientsPerAdvisor,
      [string]$plansPerClient,
      [bool]$SkipTeardown,
      [bool](-not $NoManifest.IsPresent),
      [bool]$UseFixedAdvisors,
      [bool]$volumeSloGate,
      [string]$i,
      $phaseAMaxDuration
    )

    while (@($jobs | Where-Object { $_.State -eq 'Running' }).Count -ge $concurrency) {
      Start-Sleep -Seconds 3
    }
  }

  Write-Host "=== waiting for $($jobs.Count) advisor jobs ==="
  $results = $jobs | Wait-Job

  Get-ChildItem -LiteralPath $logsRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $k6Log = Join-Path $_.FullName 'k6.log'
    if (Test-Path -LiteralPath $k6Log) {
      & node $extractCli --log $k6Log --repo-root $RepoRoot | Out-Null
    }
  }

  $failed = @{}
  $advisorRuns = @()
  foreach ($r in $results) {
    Receive-Job -Job $r -Keep -ErrorAction SilentlyContinue | Out-Null

    $workerMetaFile = Join-Path (Join-Path $workersRoot $r.Name) 'run-metadata-worker.json'
    $metaExit = $null
    if (Test-Path -LiteralPath $workerMetaFile) {
      $wm = Get-Content -LiteralPath $workerMetaFile -Raw | ConvertFrom-Json
      $metaExit = $wm.exitCode
      $metaStart = $null
      if ($wm.startTime) {
        try { $metaStart = [datetime]::Parse($wm.startTime).ToUniversalTime() } catch { $metaStart = $null }
      }
      $metaStale = ($null -ne $metaStart) -and ($metaStart -lt $runStartTime.ToUniversalTime().AddMinutes(-1))
      if ($metaStale) {
        Write-Warning "Stale worker metadata for $($r.Name) (startTime=$($wm.startTime)); treating as failed"
        $metaExit = $null
      }
      $advisorRuns += [ordered]@{
        advisorKey    = $wm.advisorKey
        shardId       = $wm.shardId
        advisorEmail  = $wm.advisorEmail
        userMode      = $wm.userMode
        poolSliceFile = $wm.poolSliceFile
        exitCode      = $metaExit
        jobState      = $r.State
        jobFailed     = ($null -eq $metaExit) -or ($metaExit -ne 0)
      }
    } else {
      $advisorRuns += [ordered]@{ advisorKey = $r.Name; exitCode = $null; jobState = $r.State; jobFailed = $true }
    }
    $exitCode = $metaExit
    $jobFailed = ($null -eq $exitCode) -or ($exitCode -ne 0)
    if ($jobFailed) { $failed[$r.Name] = $true }
    Write-Host "Job $($r.Name): state=$($r.State) exitCode=$exitCode failed=$jobFailed"
  }

  # Collect shards — each worker folder holds only its own manifest/SLO file (see Invoke-PhaseAAdvisorWorker.ps1).
  $manifestCollected = 0
  $sloCollected = 0
  Get-ChildItem -LiteralPath $workersRoot -Directory | ForEach-Object {
    $advisorKey = $_.Name
    $shardDir = Join-Path $_.FullName 'manifests'
    if (Test-Path -LiteralPath $shardDir) {
      $ownManifest = Get-ChildItem -LiteralPath $shardDir -Filter "*-$advisorKey.json" -File -ErrorAction SilentlyContinue |
        Select-Object -First 1
      if ($ownManifest) {
        Copy-Item -LiteralPath $ownManifest.FullName -Destination (Join-Path $manifestsRoot $ownManifest.Name) -Force
        $manifestCollected++
      } else {
        Write-Warning "No manifest shard for $advisorKey under $shardDir"
      }
    }
    $workerSloDir = Join-Path $_.FullName 'slo-shards'
    if (Test-Path -LiteralPath $workerSloDir) {
      $ownSlo = Get-ChildItem -LiteralPath $workerSloDir -Filter "slo-$advisorKey.json" -File -ErrorAction SilentlyContinue |
        Select-Object -First 1
      if ($ownSlo) {
        Copy-Item -LiteralPath $ownSlo.FullName -Destination (Join-Path $sloShardsRoot $ownSlo.Name) -Force
        $sloCollected++
      } else {
        Write-Warning "No SLO shard for $advisorKey under $workerSloDir"
      }
    }
  }

  $manifestOut = Join-Path $runRoot 'manifest.json'
  $shardFiles = @(Get-ChildItem -LiteralPath $manifestsRoot -Filter '*.json' -ErrorAction SilentlyContinue)
  if ($shardFiles.Count -gt 0) {
    $mergeArgs = @(
      $mergeCli, $manifestsRoot,
      '--run-tag', $RunTag,
      '--out', $manifestOut,
      '--expected-clients', [string]$expectedClients,
      '--expected-plans', [string]$expectedPlans,
      '--expected-shards', [string]$expectedShards,
      '--iterations', [string]$iterations,
      '--scenario-json-file', $scenarioJsonPath
    )
    if ($profileOutPath) { $mergeArgs += @('--profile-out', $profileOutPath) }
    node @mergeArgs
    if ($LASTEXITCODE -ne 0 -and -not $ContinueOnError) { $failed['manifest-merge'] = $true }
  }

  $sloFiles = @(Get-ChildItem -LiteralPath $sloShardsRoot -Filter '*.json' -ErrorAction SilentlyContinue)
  if ($sloFiles.Count -gt 0) {
    node @($mergeSloCli, $sloShardsRoot, '--run-tag', $RunTag, '--out', (Join-Path $runRoot 'slo-summary-fleet.json'), '--expected-shards', [string]$expectedShards)
    if ($LASTEXITCODE -ne 0 -and -not $ContinueOnError) { $failed['slo-merge'] = $true }
    Copy-Item -LiteralPath (Join-Path $runRoot 'slo-summary-fleet.json') -Destination (Join-Path $runRoot 'slo-summary.json') -Force -ErrorAction SilentlyContinue
  }

  $signoffShardsRoot = Join-Path $runRoot 'signoff-shards'
  if (-not (Test-Path -LiteralPath $signoffShardsRoot)) {
    New-Item -ItemType Directory -Path $signoffShardsRoot -Force | Out-Null
  }
  Get-ChildItem -LiteralPath $workersRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $src = Join-Path $_.FullName 'signoff-shards'
    if (Test-Path -LiteralPath $src) {
      Copy-Item -LiteralPath (Join-Path $src '*') -Destination $signoffShardsRoot -Force -ErrorAction SilentlyContinue
    }
  }
  $signoffFiles = @(Get-ChildItem -LiteralPath $signoffShardsRoot -Filter '*.json' -ErrorAction SilentlyContinue)
  if ($signoffFiles.Count -eq 0) {
    Write-Host "=== Retrofill sign-off shards from k6 logs ==="
    node @($signoffGenCli, '--phase-a-run-tag', $RunTag, '--pair-run-tag', $RunTag, '--retro-phase-a', '--expected-shards', [string]$expectedShards)
  } else {
    node @($mergeSignoffCli, $signoffShardsRoot, '--run-tag', $RunTag, '--phase', 'A', '--expected-shards', [string]$expectedShards, '--out', (Join-Path $runRoot 'signoff-fleet.json'), '--slo-fleet', (Join-Path $runRoot 'slo-summary-fleet.json'))
    node @($signoffGenCli, '--phase-a-run-tag', $RunTag, '--pair-run-tag', $RunTag, '--expected-shards', [string]$expectedShards)
  }

  node @($summaryCli, '--run-tag', $RunTag)

  $runEndTime = Get-Date
  $runMetaFinal = [ordered]@{
    reportType          = 'phase-a-run-metadata'
    runTag              = $RunTag
    volumeScenario      = $VolumeScenario
    userMode            = $userMode
    advisors            = $advisorsCount
    concurrency         = $concurrency
    writeParallelJobs   = $scenarioParallel
    clientsPerAdvisor   = $clientsPerAdvisor
    plansPerClient      = $plansPerClient
    expectedClients     = $expectedClients
    expectedPlans       = $expectedPlans
    manifestProfileFile = $manifestProfileFile
    runElapsedSec       = [math]::Round(($runEndTime - $runStartTime).TotalSeconds, 1)
    manifestCollected   = $manifestCollected
    sloCollected        = $sloCollected
    advisorRuns         = $advisorRuns
    failedJobs          = @($failed.Keys)
  }
  [System.IO.File]::WriteAllText($runMetadataPath, ($runMetaFinal | ConvertTo-Json -Depth 8) + "`n", $utf8NoBom)

  if ($failed.Keys.Count -gt 0) {
    Write-Error "Phase A completed with failures: $($failed.Keys -join ', ')"
    exit 1
  }
  Write-Host "=== Phase A complete: $runRoot ==="
} finally {
  if ($leasedFromPool) {
    Write-Host "=== release pool run-id=$RunTag ==="
    node $poolCli release --run-id $RunTag --env $PoolEnv
  }
  $jobs | Remove-Job -Force -ErrorAction SilentlyContinue
}
