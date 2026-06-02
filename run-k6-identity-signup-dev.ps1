<#
.SYNOPSIS
  Runs k6/identity/k6-identity-signup.js on Windows without fragile multi-line pastes (avoids corrupted k6 args).

.DESCRIPTION
  Sets working directory to this repo folder and invokes k6 with a single argument list.
  Set ROPC credentials in the environment first (do not commit secrets):

    $env:SIGNUP_ROPC_CLIENT_ID = 'k6-load-test-client'
    $env:SIGNUP_ROPC_CLIENT_SECRET = '<from Duende Admin>'

  Optional: $env:IDENTITY_BASE, $env:BASE_URL — see k6/identity/k6-identity-signup.js header.
  Use **-ExportLifecycleUsers** to pass **SIGNUP_EXPORT_LIFECYCLE_USERS=1** (merge successful signups into **lifecycle-users.json** after the run).

.EXAMPLE
  .\run-k6-identity-signup-dev.ps1 -SignupIndexOffset 60 -TotalRegistrations 20

.EXAMPLE
  .\run-k6-identity-signup-dev.ps1 -ExportLifecycleUsers
#>
[CmdletBinding()]
param(
    [int] $SignupIndexOffset = 40,
    [int] $TotalRegistrations = 20,
    [ValidateSet('0', '1', 'indexed')]
    [string] $AutoPassword = 'indexed',
    [ValidateRange(0, 1)]
    [int] $SignUpClientLifecycle = 1,
    [switch] $ExportLifecycleUsers
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

if (-not $env:SIGNUP_ROPC_CLIENT_ID -or -not $env:SIGNUP_ROPC_CLIENT_ID.Trim()) {
    Write-Error 'Set $env:SIGNUP_ROPC_CLIENT_ID (e.g. k6-load-test-client) then re-run.'
}

if (-not $env:SIGNUP_ROPC_CLIENT_SECRET -or -not $env:SIGNUP_ROPC_CLIENT_SECRET.Trim()) {
    Write-Error 'Set $env:SIGNUP_ROPC_CLIENT_SECRET for confidential ROPC client, then re-run.'
}

$k6Args = @(
    'run',
    '-e', "AUTO_PASSWORD=$AutoPassword",
    '-e', "SIGNUP_INDEX_OFFSET=$SignupIndexOffset",
    '-e', "TOTAL_REGISTRATIONS=$TotalRegistrations",
    '-e', "SIGNUP_CLIENT_LIFECYCLE=$SignUpClientLifecycle"
)
if ($ExportLifecycleUsers) {
    $k6Args += '-e', 'SIGNUP_EXPORT_LIFECYCLE_USERS=1'
}
$k6Args += 'k6/identity/k6-identity-signup.js'

Write-Host "Running: k6 $($k6Args -join ' ')" -ForegroundColor Cyan
& k6 @k6Args
