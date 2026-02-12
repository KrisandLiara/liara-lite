param(
  [string]$SourceRef = "liara-lite",
  [string]$Dest = "C:\Liara\liara-lite-public",
  [string]$PublicRepoUrl = "https://github.com/KrisandLiara/liara-lite.git",
  [string]$Branch = "main",
  [string]$Message = "",
  [switch]$AllowDirty
)

$ErrorActionPreference = "Stop"

function Fail($msg) {
  Write-Host "ERROR: $msg" -ForegroundColor Red
  exit 1
}

function Info($msg) {
  Write-Host $msg -ForegroundColor Cyan
}

function Ok($msg) {
  Write-Host $msg -ForegroundColor Green
}

function Ensure-Git {
  try { git --version | Out-Null } catch { Fail "git is not available in PATH." }
}

Ensure-Git

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

Info "Publishing Liara Lite snapshot..."
Info "  SourceRef: $SourceRef"
Info "  Dest:      $Dest"
Info "  Public:    $PublicRepoUrl"
Info "  Branch:    $Branch"

# Validate ref exists
try { git rev-parse --verify $SourceRef | Out-Null } catch { Fail "Ref '$SourceRef' not found. (Tip: run 'git branch' and confirm it exists.)" }

# Safety: warn if working tree is dirty (not included by git archive, but usually indicates accidental local state)
$dirty = git status --porcelain=v1
if (-not $AllowDirty -and $dirty) {
  Fail "Working tree is not clean. Commit/stash your changes, or rerun with -AllowDirty."
}

# Prepare destination
if (Test-Path $Dest) {
  Info "Removing existing dest folder..."
  Remove-Item -Recurse -Force $Dest
}
New-Item -ItemType Directory -Path $Dest | Out-Null

# Export tracked files only from the ref
$zip = Join-Path $Dest "lite.zip"
Info "Exporting tracked files via git archive..."
git archive --format=zip -o $zip $SourceRef | Out-Null

Info "Extracting..."
Expand-Archive -Force $zip $Dest
Remove-Item $zip -Force

Set-Location $Dest

# Init (or reuse) a git repo in the dest
if (-not (Test-Path (Join-Path $Dest ".git"))) {
  Info "Initializing new git repo..."
  git init -b $Branch | Out-Null
}

# Ensure remote is set
$existingOrigin = $null
try { $existingOrigin = (git remote get-url origin 2>$null) } catch { $existingOrigin = $null }
if ($existingOrigin) {
  git remote set-url origin $PublicRepoUrl | Out-Null
} else {
  git remote add origin $PublicRepoUrl | Out-Null
}

# Commit + push
git add -A | Out-Null

if (-not $Message) {
  $Message = "Liara Lite publish $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

$staged = git diff --cached --name-only
if ($staged) {
  git commit -m $Message | Out-Null
  Ok "Committed: $Message"
} else {
  Info "No file changes to commit (already up to date)."
}

Info "Pushing to public repo..."
git push -u origin $Branch | Out-Null
Ok "Done. Public repo updated."

