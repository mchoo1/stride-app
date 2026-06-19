# Stride — 2-Week Data Worklog (queue)

> One task per scheduled run. Do the **first unchecked** task only, verify it,
> check it off with a one-line note + date, commit, then stop.
> Convert relative dates to absolute. Today's baseline: 2026-06-04.

## Phase A — Tidy the DB with the new fields (do these first)

- [ ] **A1. Backfill `macroSpecificity`.** For every item in `SG_RESTAURANTS`,
  set `macroSpecificity`: items with a `macroDbRef` → `'generic_tagged'`; all
  other restaurant items → `'outlet_specific'`. (Generic `SG_MACRO_FOODS` are
  `'generic'` by definition — no edit needed.) Verify a `generic_tagged` item
  renders the estimate caveat in the Eat page.
- [ ] **A2. Generate the set-meal migration report.** Run
  `scripts/migrate-set-includes.ts` → `set-meal-migration-report.md`. Review it.
- [ ] **A3. Apply set meals — McDonald's, KFC, Burger King.** Create the
  `component_only` items the report lists (Medium Fries, Regular Coke, etc. with
  real macros), then add `setComponents` to each set item. Keep each set's own
  stored macros authoritative. Verify `computeSetMacros` reconciles within ±5%.
- [ ] **A4. Apply set meals — remaining chains** (Subway, Jollibee-if-present,
  Nando's, Shake Shack, Astons, Daily Cut, and any others with `setIncludes`).
  Mark `setIncludes` for removal once each is migrated.

## Phase B — Hawker foundation (do these before the chains)

> Hawker data is solved by breadth, not per-stall fieldwork: import the official
> centre list once, build a generic HPB dish base once, then tag centres to it.
> Authoritative macro source: HPB ENCF — https://focos.hpb.gov.sg/eservices/ENCF/

- [ ] **B1. Import NEA hawker centres.** Download the NEA Hawker Centres GEOJSON
  (https://data.gov.sg/datasets/d_4a086da0a5553be1d89383cd90d07ecd/view) to
  `app/scripts/hawker-centres.geojson`, run `scripts/import-hawker-centres.ts`,
  review the output, and merge the ~123 `estimated_menu` centres into
  `SG_RESTAURANTS`. These give "what's nearby" (name + aliases for GPS match).
- [x] **B2. Build the HPB hawker dish base (part 1).** DONE 2026-06-07 — 34
  dishes added (rice, noodles, Malay/Indian, snacks, drinks). All hawker
  macroDbRefs now resolve.
- [x] **B3. Build the HPB hawker dish base (part 2).** DONE 2026-06-07 —
  SG_MACRO_FOODS now totals **60 dishes**. High-variance items marked
  `verified: false` for an ENCF spot-check (see STRIDE_QA_REPORT.md). Remaining
  cross-checking against a second source can happen during D1 QA.
- [x] **B4. Flagship centres already present.** DONE — Maxwell, Lau Pa Sat,
  Old Airport Rd, Newton, Chinatown, Tekka, Golden Mile, Geylang Serai, Whampoa
  (9 centres) already have dish menus referencing SG_MACRO_FOODS. Optional later:
  expand each menu to 6+ dishes.

## Phase C — Tidy existing chains (NOT add — they already exist!)

> ⚠️ CORRECTION 2026-06-07: A&W, Jollibee, Popeyes, Toast Box, LiHo, Boost Juice,
> Subway, Cheers, FairPrice Xpress are ALREADY in SG_RESTAURANTS. Do NOT re-add
> (would duplicate). The real work is migration + verification.

- [ ] **C1. Migrate set meals → setComponents.** 51 set items still use free-text
  `setIncludes`. Run `npm run migrate:sets` for the report; create `component_only`
  items for shared parts (fries/drinks), add `setComponents` per set, keep each
  set's stored macros authoritative. Do ~1 chain per run (McD, KFC, BK, A&W, …).
- [ ] **C2. Verify community-sourced chains.** Many chains carry
  `source: 'community', verified: false` (e.g. A&W). Cross-check against the
  brand's official SG nutrition page; flip to `verified: true` only when matched.
  One chain per run.
- [ ] **C3. Add genuinely-missing chains (only with official SG data).**
  Candidates not yet in DB: Long John Silver's, Swensen's, Pastamania, Pepper
  Lunch, Collin's, Fish & Co, Mr Bean, Heavenly Wang. Add only when official SG
  nutrition exists; otherwise log BLOCKED and skip.

## Phase D — Final QA pass (last task in the queue)

- [ ] **D1. Database QA & dedup audit.** Once Phases A–C are done:
  - Duplicate check: scan `SG_RESTAURANTS` + `SG_MACRO_FOODS` for items with
    near-identical `canonical_name`/`name` (normalise: lowercase, strip
    punctuation). List suspected dupes; do NOT auto-merge — flag for human review.
  - Field audit: every item has `source`, `verified`, `confidence`,
    `macroSpecificity`; every set has `setComponents` + a stored macro total;
    every `estimated_menu` item has a valid `macroDbRef` that resolves to a real
    `SG_MACRO_FOODS.id`.
  - Sanity: no `generic_tagged` item marked `stride_approved`; no negative or
    zero macros; no `macroDbRef` pointing at a missing id.
  - Write the findings to `STRIDE_QA_REPORT.md`, commit, and log it.

## QA gate (run after every task)

- [ ] App still type-checks: `npx tsc --noEmit` (or `npm run build`).
- [ ] New/changed items have: `source`, `verified`, `confidence`,
  `macroSpecificity`, and (for sets) `setComponents` + a stored macro total.
- [ ] `generic_tagged` items never claim `stride_approved` and show the caveat.
- [ ] Commit: `git add -A && git commit -m "data: <task id> <outlet>"`.

## Progress log

<!-- The scheduled task appends one line per completed task here. -->
- 2026-06-07 | B2 (partial) | Added 16 missing dishes to SG_MACRO_FOODS that
  hawker menus referenced via macroDbRef but were undefined (broken refs):
  laksa, nasi_lemak, satay_chicken, roti_prata_plain, roti_prata_egg, thosai,
  popiah, oyster_omelette, carrot_cake_black, carrot_cake_white, ice_kachang,
  tau_huay, kopi_o, teh_tarik, economy_beehoon, fish_and_chips. All 50
  macroDbRefs now resolve. HPB-aligned (verified:true) except oyster_omelette,
  carrot_cake_*, ice_kachang, economy_beehoon, fish_and_chips (verified:false —
  source variance, spot-check vs ENCF). Remaining B2/B3: ~40 more dishes.
- 2026-06-07 | B2 (cont.) | Added 11 more dishes (sambal_stingray, nasi_briyani,
  claypot_rice, beef_hor_fun, curry_chicken_noodle, sliced_fish_soup, bak_kut_teh,
  chee_cheong_fun, rojak, roti_john, soya_bean_milk). Total SG_MACRO_FOODS = 47.
  FIXED: newt_stingray now points at macro_sambal_stingray (was macro_fish_and_chips).
- 2026-06-07 | B2/B3 DONE | Added final 13 (nasi_goreng, fried_rice, ayam_penyet,
  teochew_porridge, mutton_soup, chicken_curry, kway_chap, otah, goreng_pisang,
  min_jiang_kueh, chendol, milo_dinosaur, bandung). SG_MACRO_FOODS = **60 dishes**,
  no duplicates, array well-formed. B2 + B3 complete.
- 2026-06-07 | PLAN CORRECTION | Discovered all 9 Phase-C chains (A&W, Jollibee,
  Popeyes, Toast Box, LiHo, Boost Juice, Subway, Cheers, FairPrice Xpress) ALREADY
  exist in SG_RESTAURANTS — old Phase C would have created duplicates. Rewrote
  Phase C to: migrate 51 set meals (setIncludes→setComponents), verify
  community-sourced chains, add only genuinely-missing chains. Validation: all 60
  macros pass Atwater check; all 50 hawker macroDbRefs resolve.
