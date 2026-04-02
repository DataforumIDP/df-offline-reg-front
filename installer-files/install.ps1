#Requires -Version 5.0
<#
.SYNOPSIS
    Installs the latest version of Nova Rega.
.EXAMPLE
    iex (iwr https://dataforum.pro/rega/install.ps1 -UseBasicParsing).Content
#>

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$base = 'https://e8c490b0-8f86-49e6-b849-57f0230dd8a5.selstorage.ru/windows'

Write-Host 'Scanning...' -ForegroundColor Cyan

$url   = "$base/Dataforum%20Rega%20Setup.exe"
$setup = "$env:TEMP\nova-rega-setup.exe"

Write-Host "Loading: $url" -ForegroundColor Cyan
Invoke-WebRequest $url -OutFile $setup -UseBasicParsing

Write-Host 'Installing...' -ForegroundColor Cyan
# /S — silent installation (NSIS silent flag)
$proc = Start-Process $setup '/S' -Wait -PassThru

if ($proc.ExitCode -eq 0) {
    Write-Host 'Nova Rega installed successfully.' -ForegroundColor Green
} else {
    Write-Host "Installer exited with code $($proc.ExitCode)" -ForegroundColor Red
}

Remove-Item $setup -Force -ErrorAction SilentlyContinue
