# Stride — Pre-Flight (run once on a real machine before scheduling)

These two steps can't be done from Cowork's sandbox (OneDrive serves the repo as
online-only files the Linux sandbox can't open). Run them locally where the files
are materialised. ~5 minutes.

## 1. Make sure the files are downloaded (not online-only)

In File Explorer, right-click the `Fitness App` folder → **"Always keep on this
device"**. Wait for the green check. This is what lets `node`/`git` read them.

## 2. Verify the schema changes compile

```bash
cd "Fitness App/app"
npm install          # if you haven't recently
npm run typecheck    # tsc --noEmit — should print nothing and exit 0
```

If `typecheck` is clean, the schema groundwork is good. If it errors, the errors
will be in the files changed this round:
`src/lib/firestoreFoodDb.ts`, `src/lib/sgFoodDb.ts`,
`scripts/seed-sg-food-db.ts`, `scripts/import-hawker-centres.ts`,
`scripts/migrate-set-includes.ts`.

## 3. Commit the foundation

```bash
cd "Fitness App"          # repo root
git add -A
git commit -m "feat(db): macroSpecificity, setComponents, community corroboration + 2-week data plan"
git push                  # optional
```

This gives the scheduled runs a clean, known-good starting point so each night's
work is a small reviewable diff on top.

## 4. Schedule the daily task (his Cowork)

Open Cowork on the `Fitness App` OneDrive folder, paste the prompt from
`STRIDE_2WEEK_PLAN.md` §2, and say *"Run this every day at 2am for two weeks."*
Leave the laptop on and awake. Review `STRIDE_RUN_LOG.md` each day.

---

## What's in this commit (already done in the repo)

- Schema: `MacroSpecificity`, `SetComponent`, new `FirestoreMeal` fields, helpers
  (`deriveMacroSpecificity`, `computeSetMacros`, `evaluateCommunityCorroboration`),
  `GENERIC_TAGGED_CAVEAT`; `SGMenuItem` mirrors the field flags.
- Seed script populates the new fields.
- Scripts: NEA hawker-centre import, set-meal migration report.
- Docs: `DATABASE_SCHEMA.md`, `stride-schema-diagram.svg`.
- Plan: `STRIDE_2WEEK_PLAN.md`, `STRIDE_WORKLOG.md`, `STRIDE_RUN_LOG.md`.
- npm aliases: `typecheck`, `seed`, `seed:dry`, `import:hawkers`, `migrate:sets`.

All new fields are optional, so the typecheck in step 2 should pass as-is.
