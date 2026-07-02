@echo off
echo Pushing B8 fix: Terms and Privacy links on register screen...
cd /d "%~dp0"

if exist ".git\HEAD.lock" del /f ".git\HEAD.lock"
if exist ".git\index.lock" del /f ".git\index.lock"

git add app/src/app/register/PageClient.tsx app/src/app/terms/page.tsx app/src/app/privacy/page.tsx
git commit -m "fix: B8 add Terms and Privacy consent links to register screen"
if %errorlevel% neq 0 (
    echo Commit failed.
    pause & exit /b 1
)

git push
if %errorlevel% equ 0 (
    echo Done! Vercel will auto-deploy in ~1 minute.
) else (
    echo Push failed.
)
pause
