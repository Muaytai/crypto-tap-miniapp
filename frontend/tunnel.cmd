@echo off
REM Путь после winget. Если ошибка «не найден» — проверьте: dir "C:\Program Files*\cloudflared\cloudflared.exe" /s
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:3000
