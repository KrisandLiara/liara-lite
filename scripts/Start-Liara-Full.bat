@echo off
title Liara Full
echo.
echo  ============================================
echo   Liara Full - Supabase + Backend + Frontend
echo  ============================================
echo.

cd /d "%~dp0.."
if not exist "package.json" (
  echo ERROR: package.json not found. Run this from the Liara repo root.
  pause
  exit /b 1
)

echo Make sure Docker Desktop is running (Supabase needs it).
echo.
echo Starting Supabase, backend, and frontend...
echo.
echo When ready, open: http://localhost:8080
echo.
echo Press Ctrl+C to stop.
echo.

call npm run liara
if errorlevel 1 pause
