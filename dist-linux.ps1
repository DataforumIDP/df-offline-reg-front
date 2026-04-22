$ErrorActionPreference = "Stop"
$UpdateServerUrl = "https://e8c490b0-8f86-49e6-b849-57f0230dd8a5.selstorage.ru/linux/"

# Always run from the front/ directory (where the script lives)
Push-Location $PSScriptRoot

# 1. Build renderer and electron on Windows
Write-Host ">>> Building frontend (renderer + electron)..."
$env:UPDATE_SERVER_URL = $UpdateServerUrl
yarn build:all
if ($LASTEXITCODE -ne 0) { throw "build:all failed" }

# 2. Clean stale Linux artifacts
"release/linux-unpacked","release/__appImage-x64" | ForEach-Object {
    if (Test-Path $_) { Remove-Item $_ -Recurse -Force }
}

# 3. Pre-download electron Linux binary on Windows (TLS works here; app-builder Go binary fails in Docker)
$projectDir = (Get-Location).Path
$electronPkg = Get-Content "node_modules/electron/package.json" -Raw | ConvertFrom-Json
$electronVersion = $electronPkg.version
$electronCacheDir = Join-Path $projectDir ".electron-linux-cache"
New-Item -ItemType Directory -Force -Path $electronCacheDir | Out-Null
$electronFile = "electron-v${electronVersion}-linux-x64.zip"
$electronZipPath = Join-Path $electronCacheDir $electronFile
if (-not (Test-Path $electronZipPath)) {
    Write-Host ">>> Downloading $electronFile from GitHub..."
    $electronUrl = "https://github.com/electron/electron/releases/download/v${electronVersion}/$electronFile"
    Invoke-WebRequest -Uri $electronUrl -OutFile $electronZipPath -UseBasicParsing
    $sizeMB = [Math]::Round((Get-Item $electronZipPath).Length / 1MB, 1)
    Write-Host ">>> Downloaded: ${sizeMB} MB"
} else {
    Write-Host ">>> Electron Linux binary cached: $electronFile"
}

# 4. Wait for Docker to be ready (up to 60 seconds)
Write-Host ">>> Waiting for Docker..."
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
    $info = docker version 2>&1
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 3
}
if ($LASTEXITCODE -ne 0) {
    throw "Docker is not available. Please start Docker Desktop and try again."
}
Write-Host ">>> Docker is ready."

# 5. Package with electron-builder inside Linux (Docker)
# Note: electron cache bind-mounted from Windows so app-builder finds it without downloading
Write-Host ">>> Packaging AppImage in Docker (node:20-slim)..."

docker run --rm `
    -e "UPDATE_SERVER_URL=$UpdateServerUrl" `
    -v "${projectDir}:/project" `
    -v "rega-linux-node_modules:/project/node_modules" `
    -v "${electronCacheDir}:/root/.cache/electron" `
    -v "rega-electron-builder-cache:/root/.cache/electron-builder" `
    -w /project `
    node:20-slim `
    sh -c "apt-get update -qq && apt-get install -y -qq ca-certificates > /dev/null 2>&1 && npm install --legacy-peer-deps > /dev/null 2>&1 && ./node_modules/.bin/electron-builder --linux --config ./build_linux.cjs"

if ($LASTEXITCODE -ne 0) { throw "Docker AppImage build failed" }

Write-Host ">>> Done! AppImage is in release/"
Pop-Location
