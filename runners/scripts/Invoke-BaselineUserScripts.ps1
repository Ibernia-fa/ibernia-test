#Requires -Version 5.1
<#
  Worker: run full baseline script plan for one pool user (VUS=1).
  Invoked by run-baseline-concurrent-users.ps1 as a background job.
#>
param(
  [string] $RepoRoot,
  [string] $PoolSliceFile,
  [string] $UserEmail,
  [string] $RunId,
  [string] $Duration = '30s',
  [string] $PlanJsonPath,
  [string] $SliceOutDir,
  [string] $LogDir,
  [string] $SpillDir,
  [string] $SlowThresholdMs = '100',
  [string] $SlowCaptureMs = '300',
  [string] $Secret = '',
  [bool] $ContinueOnError = $false
)

$ErrorActionPreference = 'Stop'
Set-Location $RepoRoot

$spillParser = Join-Path $RepoRoot 'tools/parse-perf-spill-from-log.mjs'
$plan = Get-Content -LiteralPath $PlanJsonPath -Raw | ConvertFrom-Json
$poolSliceForK6 = $PoolSliceFile -replace '\\', '/'
$teardownTimeout = '300s'

New-Item -ItemType Directory -Path $SliceOutDir, $LogDir, $SpillDir -Force | Out-Null

$overallExit = 0
foreach ($p in $plan) {
  Write-Host "[${UserEmail}] SCRIPT: $($p.Script)"
  $k6Args = @(
    'run', $p.Script,
    '-e', 'USE_USER_POOL=1',
    '-e', "POOL_SLICE_FILE=$poolSliceForK6",
    '-e', 'SIGNUP_ROPC_CLIENT_ID=k6-load-test-client',
    '-e', 'CONSOLIDATED_PERF=1',
    '-e', "PERF_RUN_ID=$RunId",
    '-e', "PERF_SLICE_ID=$($p.SliceId)",
    '-e', "PERF_SCRIPT_FILE=$($p.Script)",
    '-e', 'PERF_CAPTURE_REQUEST_CONTEXT=1',
    '-e', "PERF_SLOW_CAPTURE_THRESHOLD_MS=$SlowCaptureMs",
    '-e', "MODULE_NAME=$($p.Module)",
    '-e', "SLOW_API_THRESHOLD_MS=$SlowThresholdMs",
    '-e', "ADAPTIVE_HTTP_METHOD=$($p.Method)",
    '-e', 'PERF_ENVIRONMENT=dev-non-production',
    '-e', 'VUS=1',
    '-e', 'K6_DEFAULT_VUS=1',
    '-e', 'TOTAL_REGISTRATIONS=1',
    '-e', 'ITERATIONS=1',
    '-e', "DURATION=$Duration",
    '-e', "MAX_DURATION=$Duration",
    '-e', "TEARDOWN_TIMEOUT=$teardownTimeout",
    '-e', "PERF_USER_LABEL=$UserEmail",
    '-e', "PERF_SLICE_OUT_DIR=$SliceOutDir"
  )
  if ($Secret) {
    $k6Args += @('-e', "SIGNUP_ROPC_CLIENT_SECRET=$Secret")
  }
  if ($p.FileName -eq 'k6-client-full-lifecycle.js') {
    $k6Args += @('-e', 'MAX_DURATION=10m')
  }

  $k6LogFile = Join-Path $LogDir "$($p.SliceId).log"
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    # Tee-Object uses UTF-16 and wraps long lines; UTF-8 StreamWriter keeps __K6_PERF_* JSON parseable.
    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    $writer = [System.IO.StreamWriter]::new($k6LogFile, $false, $utf8NoBom)
    try {
      & k6 @k6Args 2>&1 | ForEach-Object { $writer.WriteLine($_) }
      $code = $LASTEXITCODE
    } finally {
      $writer.Close()
    }
  } finally {
    $ErrorActionPreference = $prevEap
  }
  if (Test-Path -LiteralPath $k6LogFile) {
    node $spillParser $k6LogFile $p.SliceId $SpillDir | Out-Null
  }
  if ($code -ne 0) {
    Write-Host "[${UserEmail}] FAILED: $($p.Script) exit=$code"
    $overallExit = $code
    if (-not $ContinueOnError) { break }
  }
}
Write-Output "BASELINE_USER_EXIT=$overallExit"
exit $overallExit
