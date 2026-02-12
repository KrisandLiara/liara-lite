@echo off
title Liara Lite
echo.
echo  ============================================
echo   Liara Lite - Import, Enrich, Explore
echo  ============================================
echo.

cd /d "%~dp0.."
if not exist "package.json" (
  echo ERROR: package.json not found. Run this from the Liara repo root.
  pause
  exit /b 1
)

echo Starting backend + frontend (no Supabase/Docker required)...
echo.
echo When ready, open: http://localhost:8080
echo.
echo Press Ctrl+C to stop.
echo.

call npm run liara:lite:app
if errorlevel 1 pause
