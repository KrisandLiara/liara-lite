# Creates Liara Lite and Liara Full desktop shortcuts
# Run: .\scripts\Create-Desktop-Shortcuts.ps1

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$desktop = [Environment]::GetFolderPath("Desktop")

$batLite = Join-Path $repoRoot "scripts\Start-Liara-Lite.bat"
$batFull = Join-Path $repoRoot "scripts\Start-Liara-Full.bat"

if (-not (Test-Path $batLite)) {
  Write-Host "ERROR: Start-Liara-Lite.bat not found at $batLite" -ForegroundColor Red
  exit 1
}
if (-not (Test-Path $batFull)) {
  Write-Host "ERROR: Start-Liara-Full.bat not found at $batFull" -ForegroundColor Red
  exit 1
}

$WshShell = New-Object -ComObject WScript.Shell

# Liara Lite shortcut
$lnkLite = Join-Path $desktop "Liara Lite.lnk"
$sLite = $WshShell.CreateShortcut($lnkLite)
$sLite.TargetPath = $batLite
$sLite.WorkingDirectory = $repoRoot
$sLite.Description = "Start Liara Lite (Import → Enrich → Explore)"
$sLite.Save()
Write-Host "Created: $lnkLite" -ForegroundColor Green

# Liara Full shortcut
$lnkFull = Join-Path $desktop "Liara Full.lnk"
$sFull = $WshShell.CreateShortcut($lnkFull)
$sFull.TargetPath = $batFull
$sFull.WorkingDirectory = $repoRoot
$sFull.Description = "Start Liara Full (Supabase + Backend + Frontend)"
$sFull.Save()
Write-Host "Created: $lnkFull" -ForegroundColor Green

Write-Host ""
Write-Host "Done. Shortcuts are on your Desktop." -ForegroundColor Cyan
