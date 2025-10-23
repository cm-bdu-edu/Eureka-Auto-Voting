@echo off
chcp 65001 >nul
echo ========================================
echo   EUREKA AUTO VOTING
echo ========================================
echo.
echo Dang mo Chrome voi extension...
echo.

REM Tim Chrome
set CHROME_PATH=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH=%LocalAppData%\Google\Chrome\Application\chrome.exe
)

if "%CHROME_PATH%"=="" (
    echo [ERROR] Khong tim thay Chrome!
    echo Vui long cai dat Google Chrome.
    pause
    exit /b
)

REM Lay duong dan thu muc hien tai
set EXTENSION_PATH=%~dp0
set EXTENSION_PATH=%EXTENSION_PATH:~0,-1%

REM URL trang web
set WEB_URL=https://cm-bdu-edu.github.io/Eureka-Auto-Voting/

echo Chrome Path: %CHROME_PATH%
echo Extension Path: %EXTENSION_PATH%
echo Web URL: %WEB_URL%
echo.
echo Dang khoi dong...
echo.

REM Mo Chrome voi extension
start "" "%CHROME_PATH%" --load-extension="%EXTENSION_PATH%" "%WEB_URL%"

timeout /t 3 /nobreak >nul

echo.
echo [OK] Da mo Chrome!
echo.
echo Neu trang web bao "Extension chua duoc load":
echo 1. Nhan F5 de reload trang
echo 2. Hoac dong tab va mo lai: %WEB_URL%
echo.
pause
