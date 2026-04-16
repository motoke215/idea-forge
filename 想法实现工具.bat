@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
echo ========================================
echo    Idea Forge Starting...
echo ========================================
start cmd /k "npm run dev"
timeout /t 3 >nul
start http://localhost:6177
pause
