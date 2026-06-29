@echo off
echo === Stride Bug Fixes v2 — Committing and pushing ===
cd /d "%~dp0"
git add -A
git commit -m "fix: Remove AI scan tabs, add restaurant logos, ala carte default, fix search, log nav, manual activity entry, set meal builder, filter chips

- log/PageClient: Remove Scan tab (Food + Activity only)
- log/food/PageClient: Remove AI Scan modal; fix search to match restaurant names (e.g. 'mcdonald' returns McDonald's items); accept URL params for pre-fill from Eat page; set meal builder (add more items from same restaurant before logging)
- log/activity/PageClient: Add always-visible Manual Entry form at top; remove Manual from mode tabs
- DashboardClient: Filter chips now navigate to /eat?open_filter=1&... to auto-open FilterSheet; Popular meal + button passes meal data to /log/food via URL params
- EatPageClient: RestaurantLogo component using Clearbit CDN with initial fallback; read open_filter=1 URL param to auto-open FilterSheet; ala carte only by default (set meals hidden, toggled in FilterSheet); collapsed card shows all macros (cal/P/C/F) + from price; restaurant name search in Meals tab; log button navigates to /log/food with pre-filled data; FilterSheet Add 'Include set meals' toggle; fix delivery links"
git push origin main
echo === Done! Vercel will auto-deploy ===
pause
