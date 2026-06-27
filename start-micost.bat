@echo off
setlocal

cd /d "%~dp0"

set "NODE_EXE="
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE_EXE=%LocalAppData%\Programs\nodejs\node.exe"
if not defined NODE_EXE for %%I in (node.exe) do set "NODE_EXE=%%~$PATH:I"

set "NPM_CMD="
if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
if not defined NPM_CMD if exist "%LocalAppData%\Programs\nodejs\npm.cmd" set "NPM_CMD=%LocalAppData%\Programs\nodejs\npm.cmd"
if not defined NPM_CMD for %%I in (npm.cmd) do set "NPM_CMD=%%~$PATH:I"

if not defined NODE_EXE (
  echo Node.js tidak dijumpai. Sila install Node.js dahulu.
  pause
  exit /b 1
)

if not defined NPM_CMD (
  echo npm tidak dijumpai. Sila pastikan Node.js dipasang dengan npm.
  pause
  exit /b 1
)

set "PATH=%~dp0node_modules\.bin;%~dp0frontend\node_modules\.bin;%PATH%"

if not exist "node_modules\.bin\tailwindcss.cmd" (
  echo Menyediakan dependency projek...
  call "%NPM_CMD%" install
  if errorlevel 1 (
    echo Gagal install dependency.
    pause
    exit /b 1
  )
)

echo Membina CSS frontend...
call "%NPM_CMD%" run build
if errorlevel 1 (
  echo Build frontend gagal.
  pause
  exit /b 1
)

echo.
echo MiCoSTSkills akan dibuka di http://localhost:3000
echo Tekan Ctrl+C untuk hentikan backend.
echo.
"%NODE_EXE%" backend\server.js

endlocal
