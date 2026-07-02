# Stride — 2-Week Unattended Data Plan (for partner's Cowork)

This plan lets a Claude Cowork session make steady daily progress on the Stride
food database while you're away, with no coordination needed. It has three parts:

1. **Strategy** — what gets done and in what order.
2. **The daily prompt** — paste this verbatim into a scheduled task.
3. **How to schedule it** — set it once, runs itself.

---

## 1. Strategy

The work is a queue in `STRIDE_WORKLOG.md`, ordered **tidy → hawker foundation →
chains**:

- **Phase A (A1–A4):** apply the new schema fields to existing data — backfill
  `macroSpecificity`, then migrate set meals from free-text `setIncludes` to
  structured `setComponents` (creating `component_only` parts).
- **Phase B (B1–B4) — hawker foundation:** import the official NEA hawker-centre
  list (one script → ~123 centres), build a generic HPB dish base in
  `SG_MACRO_FOODS` (~60 dishes), then tag a few flagship centres to it. This is
  the efficient path: research dishes once, every centre becomes near-free.
- **Phase C (C1–C9) — Tier-1 chains:** add one outlet per run (A&W, Jollibee,
  Popeyes, Toast Box, LiHo, Boost Juice, Subway), then grab & go (Cheers,
  FairPrice Xpress).

**One task per day.** ~17 tasks over the two weeks, with slack for verification. The
recurring prompt reads the worklog, does the first unchecked task, verifies,
checks it off, and commits — so it's fully resumable and a cold session always
knows where it left off. No task depends on a human reply.

**Guardrails baked in:** every run ends with a QA gate (type-check, required
fields present, `generic_tagged` never claims `stride_approved`, git commit).

---

## 2. The daily prompt (paste this into the scheduled task)

```
You are continuing data work on the Stride fitness app. This is an unattended
scheduled run — do exactly ONE task, verify it, then stop. Do not ask me
questions; make the sensible choice, note it, and proceed.

SETUP (every run):
1. Confirm the working folder is the OneDrive "Fitness App" repo. If it's not
   mounted, append a FAILED line to STRIDE_RUN_LOG.md (see step 11) and stop.
1a. RECOVERY CHECK — a previous run may have failed mid-task. Run `git status`.
   If there are uncommitted changes:
     - If they form a complete, correct task, run the QA gate and commit them
       (don't start a new task this run).
     - If they're partial/broken, run `git checkout -- .` to discard them and
       start the current task fresh. Note this in the run log.
2. Read these for context, in order:
   - CLAUDE.md (app overview + conventions)
   - DATABASE_SCHEMA.md (schema, incl. the new fields: macroSpecificity,
     setComponents, visibility, and the median-±10% community rule)
   - stride_food_db_prompt.md (the data-entry conventions + SGMenuItem schema)
   - STRIDE_WORKLOG.md (the task queue)
3. The source of truth for data is app/src/lib/sgFoodDb.ts. The Firestore types
   are app/src/lib/firestoreFoodDb.ts. The seed script is
   app/scripts/seed-sg-food-db.ts.

DO THE WORK:
4. In STRIDE_WORKLOG.md, find the FIRST unchecked task and do ONLY that one.
   - For Phase B (hawker foundation): import the NEA hawker-centre GEOJSON via
     scripts/import-hawker-centres.ts, and build the generic dish base in
     SG_MACRO_FOODS from HPB ENCF (https://focos.hpb.gov.sg/eservices/ENCF/).
   - For Phase C (tidy existing chains — they already exist, do NOT re-add):
     either migrate one chain's set meals from setIncludes to setComponents, or
     verify a community-sourced chain against its official SG nutrition page and
     flip verified:true on match. Only ADD a chain if it's genuinely missing AND
     official SG data exists. When adding/verifying, record per item: serving
     size, price, calories, protein, carbs, fat, fibre/sodium if available. Set the
     new fields: macroSpecificity ('outlet_specific' for chains; 'generic_tagged'
     + macroDbRef + the estimate caveat for hawker stalls), and setComponents for
     any set meals (create component_only items for parts not sold standalone).
     Add the entry to SG_RESTAURANTS in sgFoodDb.ts following the exact schema in
     stride_food_db_prompt.md. Add any missing SG_MACRO_FOODS entries.
   - For Phase A (tidying): follow the task's specific instructions.
   - If a task is too large for one run, do a coherent slice, note exactly where
     you stopped in the task's checklist line, and leave it unchecked.

VERIFY (the QA gate in STRIDE_WORKLOG.md):
5. Run `cd app && npx tsc --noEmit` — fix any type errors you introduced.
6. Confirm every new/changed item has: source, verified, confidence,
   macroSpecificity, and (for sets) setComponents + a stored macro total.
   Confirm no generic_tagged item is marked stride_approved.
7. Spot-check 2–3 macro values against the source. Flag estimates vs verified.

CLOSE OUT:
8. Check off the completed task in STRIDE_WORKLOG.md with a one-line note + date,
   and append one line to its "Progress log" section.
9. Commit: `git add -A && git commit -m "data: <task id> <short description>"`.
10. Write a 3–5 line summary of what you did, what you verified, the source URL(s)
    used, and any item you were unsure about.
11. AUDIT LOG (always — even on failure). Append ONE line to STRIDE_RUN_LOG.md:
    `YYYY-MM-DD HH:MM | <task id> | DONE | <commit hash> | <one-line note>`
    Use status FAILED (with the reason) if you could not complete or commit a
    task this run, BLOCKED if data couldn't be found, RECOVERED if step 1a
    cleaned up a prior run. This file is the audit trail the team reviews — never
    skip it. Then stop.

IMPORTANT:
- Never invent macro numbers. If official data can't be found for an outlet,
  log it as BLOCKED, skip it, and move to the next unchecked task instead.
- Never modify a user's food-log history or the Firestore schema types.
- Keep changes scoped to the one task. Do not refactor unrelated code.
- If anything fails (type errors you can't fix, tool errors, missing files),
  STOP, leave the repo clean (`git checkout -- .` if mid-edit), and write a
  FAILED line to STRIDE_RUN_LOG.md so the next run resumes cleanly.
```

---

## 3. How to schedule it

In **his** Claude Cowork (the data lives in his OneDrive copy of the repo):

1. Open Cowork with the "Fitness App" OneDrive folder selected.
2. Start a message with the daily prompt above, then ask Cowork to **run it on a
   schedule** — e.g. *"Run this every day at 2am for the next two weeks."*
   Cowork's scheduling will set up the recurring task (cron `0 2 * * *`).
3. He reviews the commit + short summary at his leisure the next day. If a run
   reports it couldn't find data or hit a type error, that's the only time he
   needs to step in.

**Why 2am (or any early-morning hour):** the task runs locally, so pick a time
the laptop is **on but not in use** — it won't compete with his active work and
the results are waiting for him in the morning. Good options: `0 2 * * *` (2am
daily) or `0 5 * * *` (5am daily).

**Requirement:** the computer must be powered on and awake at the scheduled time
(disable sleep, or leave it plugged in and awake overnight). If the machine is
asleep at 2am the run is skipped — the queue just resumes the next night, so a
missed day only stretches the 14 tasks by a day.

**Tip:** keep it to one task/day. It's slower but each commit is small, reviewable,
and safe to revert — much better than a 14-outlet mega-run that's hard to audit.

---

## What's already done (so the queue starts clean)

The schema groundwork is complete and committed-ready in the repo:
- `firestoreFoodDb.ts` — `MacroSpecificity`, `SetComponent`, the new `FirestoreMeal`
  fields, and helpers `deriveMacroSpecificity`, `computeSetMacros`,
  `evaluateCommunityCorroboration`, plus `GENERIC_TAGGED_CAVEAT`.
- `sgFoodDb.ts` — `SGMenuItem` gains `setComponents`, `visibility`,
  `macroSpecificity`; `setIncludes` is `@deprecated`.
- `seed-sg-food-db.ts` — populates the new fields on every seeded meal.
- `DATABASE_SCHEMA.md` — documents all of the above.
- `scripts/migrate-set-includes.ts` — generates the set-meal migration report
  used by task A2/A3.

All new fields are **optional**, so the app type-checks as-is; the worklog is
about populating them and adding outlets.
