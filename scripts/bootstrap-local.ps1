[CmdletBinding()]
param(
  [int]$Port = 3000,
  [switch]$SkipTests,
  [switch]$ForceInstall
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "[bootstrap] Project: $root"

# Stop only Node processes whose command line belongs to this project.
try {
  $projectPattern = [regex]::Escape($root)
  $owned = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine -match $projectPattern }
  foreach ($process in $owned) {
    Write-Host "[bootstrap] Stopping project Node process PID $($process.ProcessId)"
    Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
  }
} catch {
  Write-Warning "Could not inspect/stop a project process: $($_.Exception.Message)"
}

$nodeModules = Join-Path $root 'node_modules'
 $nextBinary = Join-Path $root 'node_modules\.bin\next.cmd'
if ((Test-Path $nextBinary) -and -not $ForceInstall) {
  Write-Host '[bootstrap] Existing NEXT_READY detected; skipping npm ci (use -ForceInstall to reinstall).'
} elseif (Test-Path $nodeModules) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backup = Join-Path $root ".node_modules-backup-$stamp"
  try {
    Move-Item -LiteralPath $nodeModules -Destination $backup -Force
    Write-Host "[bootstrap] Preserved existing node_modules at $backup"
  } catch {
    throw "Cannot move node_modules. Close editors/terminals using this project or reboot Windows, then rerun. Details: $($_.Exception.Message)"
  }
}

if (-not (Test-Path $nextBinary) -or $ForceInstall) {
  Write-Host '[bootstrap] Installing dependencies from package-lock.json'
  & npm.cmd ci --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
}

if (-not (Test-Path (Join-Path $root 'node_modules\.bin\next.cmd'))) {
  throw 'Next binary is missing after npm ci; dependency installation is incomplete.'
}
Write-Host '[bootstrap] NEXT_READY'

if (-not $SkipTests) {
  & npm.cmd test
  if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
  & npm.cmd run typecheck
  if ($LASTEXITCODE -ne 0) { throw "typecheck failed with exit code $LASTEXITCODE" }
  & npm.cmd run lint
  if ($LASTEXITCODE -ne 0) { throw "lint failed with exit code $LASTEXITCODE" }
}

$envFile = Join-Path $root '.env.local'
$hasKey = (Test-Path $envFile) -and (((Get-Content $envFile -Raw) -match '(?m)^TYPHOON_OCR_API_KEY=.+$'))
if (-not $hasKey) { Write-Warning 'TYPHOON_OCR_API_KEY is missing from .env.local; OCR will remain blocked.' }

$log = Join-Path $root 'evidence\local-server.log'
$errorLog = Join-Path $root 'evidence\local-server-error.log'
New-Item -ItemType Directory -Path (Split-Path $log) -Force | Out-Null
$server = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','dev','--','-p',$Port) -WorkingDirectory $root -RedirectStandardOutput $log -RedirectStandardError $errorLog -PassThru -WindowStyle Hidden
$url = "http://localhost:$Port"
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 1
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) { $ready = $true; break }
  } catch { }
  if ($server.HasExited) { break }
}
if (-not $ready) {
  $tail = if (Test-Path $log) { (Get-Content $log -Tail 30) -join "`n" } else { '' }
  if (Test-Path $errorLog) { $tail += "`n" + ((Get-Content $errorLog -Tail 30) -join "`n") }
  throw "Local server did not become ready. Check $log`n$tail"
}
Write-Host "[bootstrap] LOCAL_READY $url"
Write-Host "[bootstrap] Import the supplied PDF and then run: npm run test:e2e; node scripts/finish-task.mjs T-032"
