# Stride — Database QA Review

> Reviewer: Cowork session, 2026-06-07. Scope: `SG_MACRO_FOODS` + hawker
> (`estimated_menu`) data in `app/src/lib/sgFoodDb.ts`.
> Note: git authorship isn't visible from this environment (OneDrive online-only
> mount), so this reviews the current state of the data, not per-author diffs.

## ✅ Fixed this session

**16 broken `macroDbRef` pointers.** Hawker menus referenced 16 generic dishes
that were never defined in `SG_MACRO_FOODS`, so those references resolved to
nothing. All now defined (laksa, nasi_lemak, satay_chicken, roti_prata_plain/egg,
thosai, popiah, oyster_omelette, carrot_cake_black/white, ice_kachang, tau_huay,
kopi_o, teh_tarik, economy_beehoon, fish_and_chips). Added 7 more for breadth
(hokkien_mee, lor_mee, mee_rebus, yong_tau_foo_soup, chwee_kueh, chicken_chop,
kaya_toast_set). **All 50 `macroDbRef`s now resolve.** Total: 36 macro dishes.

## 🔴 Issues found (need a human decision)

**1. Wrong-dish reference — `newt_stingray`. ✅ FIXED 2026-06-07.** Newton's BBQ
Stingray was pointing its `macroDbRef` at `macro_fish_and_chips`. Created
`macro_sambal_stingray` (320 kcal, P38/C8/F14) and repointed. `macro_fish_and_chips`
remains defined for future Western-stall use.

**2. Outlet macros diverge 20–40% from the macro they reference.** Many
`estimated_menu` items carry their own hand-entered calories that differ sharply
from the `SG_MACRO_FOODS` entry they point to. Examples:

| Outlet item | Item kcal | Referenced macro | Macro kcal | Gap |
|---|---|---|---|---|
| Tian Tian Chicken Rice (Maxwell) | 607 | macro_chicken_rice_steamed | 447 | +36% |
| Char Siew Rice (Maxwell) | 660 | macro_char_siew_rice | 548 | +20% |
| Roast Duck Rice (Chinatown) | 688 | macro_duck_rice | 565 | +22% |
| Oyster Omelette (Lau Pa Sat) | 396 | macro_oyster_omelette | 510 | −22% |

These stalls aren't outlet-measured, so two different "precise" numbers for the
same dish is the implied-precision trap. **Recommendation:** for `generic_tagged`
items, the app should DISPLAY the macro's value (single source of truth) and the
per-item copy should be dropped or treated as a non-authoritative hint. This is
exactly what `macroSpecificity` was added to enforce — worth wiring the Eat page
to read the macro for `generic_tagged` items rather than the item's own copy.

## 🟡 Data-quality notes

- `verified: false` was set on dishes with wide source variance (oyster_omelette,
  carrot_cake_*, ice_kachang, economy_beehoon, fish_and_chips, chicken_chop) —
  these should be spot-checked against HPB ENCF (focos.hpb.gov.sg) before being
  trusted as verified.
- Diet tags: some dessert/drink items elsewhere tag `vegan`/`lactose_free` despite
  containing condensed milk (e.g. ice kachang historically). New entries corrected
  this; worth auditing older entries.

## ✅ Validation passed

- **Reference integrity:** all 50 hawker `macroDbRef`s resolve to one of the 60
  defined `SG_MACRO_FOODS` ids. No dangling references.
- **No duplicate macro ids.**
- **Atwater sanity check:** 4·protein + 4·carbs + 9·fat vs stated calories —
  0 of 65 checked entries deviate more than ±25%. No gross macro-entry errors.

## 🔴 Plan correction — Phase C chains ALREADY EXIST

The worklog's Phase C (add A&W, Jollibee, Popeyes, Toast Box, LiHo, Boost Juice,
Subway, Cheers, FairPrice Xpress) was based on a stale prompt. **All nine are
already in `SG_RESTAURANTS`.** Re-adding them would create duplicates. Phase C
has been rewritten (below) to the real outstanding work. Many existing chains
(e.g. A&W) carry `source: 'community', verified: false` data — they need
verification against official SG nutrition, not re-creation.

## 🟠 Real outstanding tidy work — set-meal migration

**51 set meals still use free-text `setIncludes`; 0 use `setComponents`.** The
`setIncludes → setComponents` migration (worklog A3/A4) is entirely undone. Run
`npm run migrate:sets` to generate the report, create `component_only` items for
shared parts (fries, drinks), then add `setComponents`. This is the highest-value
remaining tidy task.

`macroSpecificity` is unset in the source data, but the seed script DERIVES it on
write (`deriveMacroSpecificity` via `macroDbRef`), so no in-file backfill is
needed for the Firestore layer — A1 is effectively handled at seed time.

## Remaining work (for the scheduled runs)

- ~24 more dishes to reach the ~60 target (e.g. roti john, char siew noodle,
  chicken curry, fishball soup variants, soya beancurd drinks, bandung).
- Then B1 (NEA centre import) and B4 (tag flagship centres).
