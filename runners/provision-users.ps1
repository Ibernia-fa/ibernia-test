#Requires -Version 5.1
<#
.SYNOPSIS
  HTML signup batch -> lifecycle-users.json -> pool-cli import (DEV non-prod).

.PARAMETER UserCount
  Number of users to register (default 20).

.PARAMETER SignupRunTag
  Label for export file lifecycle-users-{tag}.json (default timestamp). Emails are User01@, User02@, ...

.PARAMETER SignupIndexOffset
  Skip N indices so the first email is User{N+1}@… (e.g. 20 → User21@gmail.com). Default 0 → User01..

.PARAMETER PoolEnv
  Pool environment: dev, qa, staging (default dev). Alias: Env.

.PARAMETER SignupBatchSize
  Max concurrent HTML signups. Default 0 = all UserCount in parallel (e.g. 20 users => 20 VUs).
  Set to 1-5 only if dev Identity struggles under burst load.

.PARAMETER SkipEmailConfirmFollow
  Skip GET /Account/ConfirmEmail after register (not recommended). Default: follow redirect so
  EmailConfirmed is set and ROPC works without manual Admin toggles.

.EXAMPLE
  .\runners\provision-users.ps1 -UserCount 50 -SignupRunTag pool20260518
#>
param(
  [int] $UserCount = 20,
  [string] $SignupRunTag = '',
  [int] $SignupIndexOffset = 0,
  [Alias('Env')]
  [string] $PoolEnv = 'dev',
  [int] $SignupBatchSize = 0,
  [switch] $SkipEmailConfirmFollow
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

if (-not $SignupRunTag) {
  $SignupRunTag = "pool$(Get-Date -Format 'yyyyMMdd-HHmmss')"
}

$exportFile = "lifecycle-users-$SignupRunTag.json"

# 0 => one VU per user (full parallel). Otherwise cap concurrency (e.g. 3 or 5).
$signupParallelVus = if ($SignupBatchSize -le 0) { $UserCount } else { [Math]::Min($SignupBatchSize, $UserCount) }
$vuStaggerSec = if ($signupParallelVus -ge $UserCount) { '0' } else { '0.1' }

$k6Args = @(
  'run', 'k6/identity/k6-identity-signup.js',
  '-e', "USER_COUNT=$UserCount",
  '-e', 'EMAIL_GENERATION_MODE=prefix_index',
  '-e', 'EMAIL_LOCAL_PREFIX=User',
  '-e', 'EMAIL_DOMAIN=gmail.com',
  '-e', 'EMAIL_PAD=2',
  '-e', "LIFECYCLE_EXPORT_FILE=$exportFile",
  '-e', 'AUTO_PASSWORD=indexed',
  '-e', 'SIGNUP_EXPORT_LIFECYCLE_USERS=1',
  '-e', 'POST_SIGNUP_ACQUIRE_LOAD_TESTER_TOKEN=1',
  '-e', 'SIGNUP_ROPC_CLIENT_ID=k6-load-test-client',
  '-e', 'LOG_FAILED_HTTP=1',
  '-e', "VUS=$signupParallelVus",
  '-e', "SIGNUP_BATCH_SIZE=$signupParallelVus",
  '-e', "VU_STAGGER_SEC=$vuStaggerSec",
  '-e', 'RELAX_CHECKS=1'
)

if ($SkipEmailConfirmFollow) {
  $k6Args += @('-e', 'SKIP_REGISTER_EMAIL_CONFIRM_FOLLOW=1')
}

if ($SignupIndexOffset -gt 0) {
  $k6Args += @('-e', "SIGNUP_INDEX_OFFSET=$SignupIndexOffset")
}

if ($env:SIGNUP_ROPC_CLIENT_SECRET) {
  $k6Args += @('-e', "SIGNUP_ROPC_CLIENT_SECRET=$($env:SIGNUP_ROPC_CLIENT_SECRET)")
} elseif ($env:STS_SECRET) {
  $k6Args += @('-e', "SIGNUP_ROPC_CLIENT_SECRET=$($env:STS_SECRET)")
} else {
  Write-Warning 'SIGNUP_ROPC_CLIENT_SECRET / STS_SECRET not set - token acquisition may fail.'
}

$logFile = Join-Path $env:TEMP "k6-signup-$SignupRunTag.log"
Write-Host "=== k6 identity signup (UserCount=$UserCount, tag=$SignupRunTag, parallelVus=$signupParallelVus) ==="
Write-Host "Log: $logFile"
# Start-Process redirects avoid PowerShell NativeCommandError text in the log file.
$logErr = "$logFile.err"
if (Test-Path $logFile) { Remove-Item -Force $logFile }
if (Test-Path $logErr) { Remove-Item -Force $logErr }
$k6Exe = (Get-Command k6 -ErrorAction Stop).Source
$p = Start-Process -FilePath $k6Exe -ArgumentList $k6Args -Wait -PassThru -NoNewWindow `
  -RedirectStandardOutput $logFile -RedirectStandardError $logErr
$k6Exit = $p.ExitCode
if (Test-Path $logErr) {
  $errBody = Get-Content -Path $logErr -Raw -Encoding utf8
  if ($errBody -and $errBody.Trim().Length -gt 0) {
    Add-Content -Path $logFile -Value $errBody -Encoding utf8
  }
  Remove-Item -Force $logErr
}
if (Test-Path $logFile) {
  # Normalize UTF-16 logs from Start-Process redirects to UTF-8 for node merge tool.
  $bytes = [System.IO.File]::ReadAllBytes($logFile)
  if ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
    $text = [System.Text.Encoding]::Unicode.GetString($bytes, 2, $bytes.Length - 2)
    [System.IO.File]::WriteAllText($logFile, $text, [System.Text.UTF8Encoding]::new($false))
  }
  Get-Content -Path $logFile -Encoding utf8 | Write-Host
}

$lifecycleFile = Join-Path $RepoRoot $exportFile
if (-not (Test-Path $lifecycleFile)) {
  $mergeTool = Join-Path $RepoRoot 'tools/merge-lifecycle-export-from-k6-log.mjs'
  Write-Host "=== merge lifecycle export from k6 log ==="
  node $mergeTool --log $logFile --out $lifecycleFile --baseline $lifecycleFile
  if ($LASTEXITCODE -ne 0) {
    Write-Error @"
Signup did not create $exportFile (handleSummary and log merge both empty).

k6 exit code: $k6Exit
Log: $logFile

Common causes:
  - All HTML registrations failed (see LOG_FAILED_HTTP lines in the log)
  - dev Identity rejected @example.test emails (this script uses gmail.com)
  - SMTP throttling on dev (lower -SignupBatchSize to 2)
  - Duplicate emails (raise -SignupIndexOffset or delete existing UserNN accounts)

Try a single signup smoke test:
  k6 run -e USER_COUNT=1 -e EMAIL_LOCAL_PREFIX=User -e EMAIL_DOMAIN=gmail.com `
    -e LOG_FAILED_HTTP=1 -e SIGNUP_BATCH_SIZE=1 -e SIGNUP_EXPORT_LIFECYCLE_USERS=1 `
    k6/identity/k6-identity-signup.js
"@
  }
}

Write-Host "=== pool-cli import-json ($exportFile) ==="
node (Join-Path $RepoRoot 'tools/pool-cli/bin/pool-cli.js') import-json $lifecycleFile --env $PoolEnv
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

node (Join-Path $RepoRoot 'tools/pool-cli/bin/pool-cli.js') stats --env $PoolEnv
Write-Host "Done. Pool updated for env=$PoolEnv"
if ($k6Exit -ne 0) {
  Write-Warning "k6 exited with code $k6Exit (often ROPC/check thresholds). Pool import succeeded if stats show users."
}
