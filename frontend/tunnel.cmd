@echo off
setlocal
REM Сначала PATH (после winget/choco или ручной установки), затем типичные пути Windows.
where cloudflared >nul 2>&1
if %errorlevel% equ 0 (
  cloudflared tunnel --url http://127.0.0.1:3000
  goto :eof
)
if exist "C:\tools\cloudflared\cloudflared-windows-amd64.exe" (
  "C:\tools\cloudflared\cloudflared-windows-amd64.exe" tunnel --url http://127.0.0.1:3000
  goto :eof
)
if exist "C:\tools\cloudflared\cloudflared.exe" (
  "C:\tools\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:3000
  goto :eof
)
if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" (
  "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:3000
  goto :eof
)
if exist "%ProgramFiles%\cloudflared\cloudflared.exe" (
  "%ProgramFiles%\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:3000
  goto :eof
)
echo [tunnel] cloudflared не найден. Установите: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
echo Затем добавьте папку с cloudflared.exe в PATH и откройте новый терминал, либо положите exe в "Program Files ^(x86^)\cloudflared\".
exit /b 1
