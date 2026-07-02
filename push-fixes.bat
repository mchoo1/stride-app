@echo off
echo Staging and committing all fixes...
cd /d "%~dp0"
git add -A
git commit -m "fix: B5 toast, B6 dismiss, B7 sign-out, water tracking UI on dashboard"
echo.
echo Pushing to GitHub...
git push
if %errorlevel% equ 0 (
    echo.
    echo Done! Vercel will auto-deploy in ~1 minute.
) else (
    echo.
    echo Push failed. You may need to authenticate with GitHub first.
)
pause
