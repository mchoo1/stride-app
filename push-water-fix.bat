@echo off
echo Cleaning up git locks and committing water tracker...
cd /d "%~dp0"

:: Remove stale lock files left by previous git run
if exist ".git\HEAD.lock" del /f ".git\HEAD.lock"
if exist ".git\index.lock" del /f ".git\index.lock"

:: Commit the staged water tracker change
git commit -m "fix: add water tracking UI to dashboard (widget + quick-add buttons)"
if %errorlevel% neq 0 (
    echo.
    echo Commit failed - check above for errors.
    pause
    exit /b 1
)

:: Push to GitHub
echo.
echo Pushing to GitHub...
git push
if %errorlevel% equ 0 (
    echo.
    echo Done! Vercel will auto-deploy in ~1 minute.
) else (
    echo.
    echo Push failed. You may need to authenticate with GitHub.
)
pause
