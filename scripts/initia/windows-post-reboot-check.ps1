$ErrorActionPreference = "Stop"

$dockerExe = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
$ubuntuExe = "$env:LOCALAPPDATA\Microsoft\WindowsApps\ubuntu2404.exe"

Write-Host "== DripFi Initia Windows Check ==" -ForegroundColor Cyan
Write-Host ""

Write-Host "WSL runtime:" -ForegroundColor Yellow
try {
  wsl --version
} catch {
  Write-Host "WSL is not ready yet." -ForegroundColor Red
}

Write-Host ""
Write-Host "Installed distros:" -ForegroundColor Yellow
try {
  wsl -l -v
} catch {
  Write-Host "No WSL distro is ready yet." -ForegroundColor Red
}

Write-Host ""
Write-Host "Docker status:" -ForegroundColor Yellow
if (Test-Path $dockerExe) {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $dockerExe info *> $null
  $dockerExitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousErrorActionPreference

  if ($dockerExitCode -eq 0) {
    Write-Host "Docker daemon is ready." -ForegroundColor Green
  } else {
    Write-Host "Docker Desktop is installed but the daemon is not ready yet. Open Docker Desktop and wait until it says Running." -ForegroundColor DarkYellow
  }
} else {
  Write-Host "Docker Desktop binary not found." -ForegroundColor Red
}

Write-Host ""
Write-Host "Next commands:" -ForegroundColor Yellow
Write-Host "1. Run Ubuntu once to finish Linux user setup:"
Write-Host "   $ubuntuExe"
Write-Host "2. Enter WSL inside this repo:"
Write-Host "   wsl -d Ubuntu-24.04 --cd /mnt/e/DripFi"
Write-Host "3. Bootstrap Initia tooling:"
Write-Host "   bash scripts/initia/bootstrap-wsl.sh"
Write-Host "4. Follow the DripFi rollout guide:"
Write-Host "   scripts/initia/launch-dripfi-rollup.md"
