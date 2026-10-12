$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$env:NEXT_DIST_DIR = '.next-oauth-local'
$nodePath = (Get-Command node).Source
$nodeArgs = @('-r', ('"' + (Join-Path $projectRoot 'scripts/next-realpath-shim.cjs') + '"'), ('"' + (Join-Path $projectRoot 'node_modules/next/dist/bin/next') + '"'), 'dev', '-p', '3000', '-H', '127.0.0.1')
$server = Start-Process -FilePath $nodePath -ArgumentList $nodeArgs -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 't046-server.log') -RedirectStandardError (Join-Path $PSScriptRoot 't046-server-error.log') -PassThru
Write-Output "Canonical local server started PID $($server.Id); existing preview preserved."
