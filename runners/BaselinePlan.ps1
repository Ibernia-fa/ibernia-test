# Shared baseline script plan (domain module order).
# Dot-source from run-baseline-single-user.ps1 and run-baseline-concurrent-users.ps1

function Write-JsonFileUtf8NoBom {
  param(
    [Parameter(Mandatory)]
    [string] $Path,
    [Parameter(Mandatory)]
    $Data,
    [int] $Depth = 10,
    # Pool slices must be JSON arrays; PS unwraps single-element arrays when passing -Data @($user).
    [switch] $AsJsonArray
  )
  $json = if ($Data -is [string]) {
    $Data
  } elseif ($AsJsonArray) {
    ConvertTo-Json -InputObject @($Data) -Depth $Depth
  } else {
    ConvertTo-Json -InputObject $Data -Depth $Depth
  }
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  [System.IO.File]::WriteAllText($Path, $json, [System.Text.UTF8Encoding]::new($false))
}

function Get-BaselineDomainDirs {
  return @(
    @{ Module = 'clients'; Path = 'k6/clients' },
    @{ Module = 'clients-profile'; Path = 'k6/clients-profile' },
    @{ Module = 'timeline'; Path = 'k6/cashflows-timeline' },
    @{ Module = 'income'; Path = 'k6/cashflows-income' },
    @{ Module = 'finances'; Path = 'k6/cashflows-finances' },
    @{ Module = 'reports'; Path = 'k6/cashflows-reports' },
    @{ Module = 'wealth'; Path = 'k6/cashflows-wealth' }
  )
}

function Get-ModuleTagFromScriptName {
  param([string] $FileName, [string] $DefaultModule)
  $base = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
  if ($base -eq 'k6-client-full-lifecycle') { return 'clients' }
  if ($base -match '^k6-events-(.+)$') {
    $tail = $Matches[1] -replace '-load$', ''
    return "events-$tail"
  }
  if ($base -match 'timelines-financing') { return 'timeline-financing' }
  if ($base -match 'timelines|timeline') { return 'timeline' }
  if ($base -match '^k6-clients-profile-') { return 'clients-profile' }
  if ($base -match '^k6-clients-') { return 'clients' }
  if ($base -match '^k6-cashflows-finances-') { return 'finances' }
  if ($base -match '^k6-cashflows-income-') { return 'income' }
  if ($base -match '^k6-cashflows-reports-') { return 'reports' }
  if ($base -match '^k6-cashflows-wealth-') { return 'wealth' }
  return $DefaultModule
}

function Get-HttpMethodFromScript {
  param([string] $ScriptPath)
  $content = Get-Content -LiteralPath $ScriptPath -Raw -ErrorAction SilentlyContinue
  if ($content -match "method:\s*'([A-Z]+)'") { return $Matches[1] }
  if ($content -match 'method:\s*"([A-Z]+)"') { return $Matches[1] }
  return 'GET'
}

function Get-BaselineScriptPlan {
  param([string] $RepoRoot)
  $plan = @()
  foreach ($d in Get-BaselineDomainDirs) {
    $dir = Join-Path $RepoRoot $d.Path
    if (-not (Test-Path $dir)) { continue }
    Get-ChildItem -LiteralPath $dir -Filter 'k6*.js' -File | Sort-Object Name | ForEach-Object {
      $name = $_.Name
      if ($name -notmatch '-load\.js$' -and $name -ne 'k6-client-full-lifecycle.js') { return }
      $rel = ($_.FullName.Substring($RepoRoot.Length + 1) -replace '\\', '/')
      $sliceId = [System.IO.Path]::GetFileNameWithoutExtension($name)
      $modTag = Get-ModuleTagFromScriptName -FileName $name -DefaultModule $d.Module
      $method = Get-HttpMethodFromScript -ScriptPath $_.FullName
      $plan += [pscustomobject]@{
        Script   = $rel
        SliceId  = $sliceId
        Module   = $modTag
        Method   = $method
        FileName = $name
      }
    }
  }
  return $plan
}
