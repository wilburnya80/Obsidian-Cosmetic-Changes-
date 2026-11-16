@echo off
rem Windows one-step installer. Double-click, or: install.bat "C:\path\to\your\vault" --with-dataview --with-hotkeys
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required ^(free^): https://nodejs.org  -  install it, then run this again.
  pause
  exit /b 1
)
set "VAULT=%~1"
if "%VAULT%"=="" set /p VAULT=Drag your Obsidian vault folder into this window, then press Enter: 
set "VAULT=%VAULT:"=%"
node tools\vault.js install "%VAULT%" %2 %3 %4
pause
