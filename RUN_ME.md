# RUN ME — exact steps to verify & save the Stride work

> Do these on your own computer (Windows). Open **PowerShell** for the commands.
> Part A is the essential bit. Parts B and C can wait.

---

## PART A — Verify & save (do this first)

**1. Make the files real (not online-only).**
File Explorer → right-click `C:\Users\user\OneDrive\Fitness App` →
**"Always keep on this device"** → wait for the green tick.

**2. Go to the app folder.**
```powershell
cd "C:\Users\user\OneDrive\Fitness App\app"
```

**3. Install dependencies (safe even if already installed).**
```powershell
npm install
```

**4. Type-check (the test I could not run for you).**
```powershell
npm run typecheck
```
✅ Pass = it prints nothing and returns to the prompt.
❌ If it lists errors, stop and send them to me.

**5. Save to version history (commit). Run from the repo ROOT:**
```powershell
cd "C:\Users\user\OneDrive\Fitness App"
git add -A
git commit -m "feat(db): macroSpecificity, setComponents, community corroboration + 60 hawker dishes + 2-week data plan"
```
(Optional, if you use GitHub: `git push`)

**After step 5, all the work is verified and saved. You can stop here.**

---

## PART B — Finish hawker-centre locations (optional)

**6. Download the government file.**
Browser → https://data.gov.sg/datasets/d_4a086da0a5553be1d89383cd90d07ecd/view
→ **Download** → save as exactly:
`C:\Users\user\OneDrive\Fitness App\app\scripts\hawker-centres.geojson`

**7. Generate the entries.**
```powershell
cd "C:\Users\user\OneDrive\Fitness App\app"
npm run import:hawkers > ..\generated-hawker-centres.ts
```

**8. Review & merge.**
Open `generated-hawker-centres.ts` (repo root), skim it, paste the centres you
want into the `SG_RESTAURANTS` array in `app\src\lib\sgFoodDb.ts`.
Then repeat steps 4 and 5 (typecheck + commit).

---

## PART C — Start the automated daily helper (partner's computer)

**9.** Open Cowork on the `Fitness App` folder → paste the prompt from
`STRIDE_2WEEK_PLAN.md` (section 2) → say:
*"Run this every day at 2am for two weeks."*
Leave that laptop on and awake. Check `STRIDE_RUN_LOG.md` each morning.

---

### Quick reference — all the npm commands
| Command | What it does |
|---|---|
| `npm run typecheck` | Checks the code compiles (no errors = good) |
| `npm run import:hawkers` | Turns the GeoJSON into pasteable centre entries |
| `npm run migrate:sets` | Set-meal migration report (Phase A) |
| `npm run seed:dry` | Preview what would be written to Firestore |
| `npm run seed` | Actually write the database to Firestore |
