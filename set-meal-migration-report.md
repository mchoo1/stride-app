# Set-Meal Migration Report

> Generated 2026-06-19 from `app/src/lib/sgFoodDb.ts`.
> Purpose: convert 51 set meals from free-text `setIncludes` → structured
> `setComponents: [{itemId, qty}]`. Read-only analysis — no data changed.
> See `STRIDE_WORKLOG.md` task C1.

## Summary

- **51 set meals** across **20 chains**.
- Each set's parts are either **(A) shared sides/drinks** (create once as
  `component_only` items, then reference) or **(B) mains** that mostly already
  exist as à-la-carte items (just link to them).
- **~25 distinct shared side/drink items** to create.

---

## A) Shared sides / drinks to create as `component_only` (by frequency)

| Count | Part |
|------:|------|
| 18 | Regular Drink (generic — see decision #2) |
| 10 | Fries (plain) |
| 9  | Soft Drink |
| 7  | Seasoned Fries |
| 4  | 2 Soft-Boiled Eggs |
| 4  | Coffee or Tea |
| 4  | Curly Fries |
| 4  | Root Beer |
| 4  | PERi-PERi Chips |
| 4  | Crinkle-Cut Fries |
| 4  | Miso Soup |
| 3  | Coleslaw |
| 3  | Honey Butter Biscuit |
| 3  | French Fries |
| 2  | Whipped Potato · Any Cookie or Chips · French Toast · Jolly Rice · Side · Steamed Rice · Kimchi · Beef Bowl |
| 1  | Portuguese Rice · Corn Soup · Onsen Egg |

The mains (Big Mac, McSpicy Burger, Whopper, Chickenjoy, ShackBurger, etc.) are
**1× each** — they already exist as menu items in their chains, so the set links
to the existing entry rather than creating a new one.

---

## B) Set meals by restaurant

### McDonald's (4)
- Big Mac Meal (M) ⟶ [Big Mac, Medium Fries, Regular Drink]
- McSpicy Meal (M) ⟶ [McSpicy Burger, Medium Fries, Regular Drink]
- McChicken Meal (M) ⟶ [McChicken Burger, Medium Fries, Regular Drink]
- Filet-O-Fish Meal (M) ⟶ [Filet-O-Fish, Medium Fries, Regular Drink]

### KFC (3)
- 2-pc Chicken Meal ⟶ [2 Original Recipe Chicken, Regular Whipped Potato, Regular Drink]
- Zinger Burger Meal ⟶ [Zinger Burger, Regular Fries, Regular Drink]
- Snack Plate ⟶ [1 Original Recipe Chicken, Regular Whipped Potato, Coleslaw, Regular Drink]

### Burger King (2)
- Whopper Meal ⟶ [Whopper, Medium Fries, Regular Drink]
- TenderCrisp Meal ⟶ [TenderCrisp Burger, Medium Fries, Regular Drink]

### Subway (2)
- Chicken Breast Sub Meal (6") ⟶ [Chicken Breast 6" Sub, Any Cookie or Chips, Regular Drink]
- Tuna Sub Meal (6") ⟶ [Tuna 6" Sub, Any Cookie or Chips, Regular Drink]

### Ya Kun Kaya Toast (2)
- Set A ⟶ [2 Kaya Butter Toast (Thin), 2 Soft-Boiled Eggs, Coffee or Tea]
- Set B ⟶ [French Toast, 2 Soft-Boiled Eggs, Coffee or Tea]

### A&W (4)
- Mozza Burger Combo ⟶ [Mozza Burger, Curly Fries (Regular), Root Beer (Regular)]
- Double Mozza Burger Combo ⟶ [Double Mozza Burger, Curly Fries (Regular), Root Beer (Regular)]
- Cream Cheese Chicken Combo ⟶ [Cream Cheese Chicken Burger, Curly Fries (Regular), Root Beer (Regular)]
- Coney Dog Combo ⟶ [A&W Coney Dog (Beef), Curly Fries (Regular), Root Beer (Regular)]

### Jollibee (3)
- 1-pc Chickenjoy Meal ⟶ [1-pc Chickenjoy, Regular Jolly Rice, Regular Drink]
- 2-pc Chickenjoy Meal ⟶ [2-pc Chickenjoy, Regular Jolly Rice, Regular Drink]
- Yumburger Meal ⟶ [Yumburger, Regular Fries, Regular Drink]

### Toast Box (2)
- Set A ⟶ [2 Slices Kaya Butter Toast, 2 Soft-Boiled Eggs, Coffee or Tea]
- Set B ⟶ [French Toast, 2 Soft-Boiled Eggs, Coffee or Tea]

### Popeyes (2)
- 2-pc Chicken Meal ⟶ [2-pc Signature Chicken, Regular Side, Regular Drink]
- Chicken Sandwich Meal ⟶ [Chicken Sandwich, Regular Side, Regular Drink]

### Nando's (4)
- 1/4 Chicken Plate — Thigh & Leg ⟶ [1/4 Chicken — Thigh & Leg, PERi-PERi Chips, Coleslaw]
- 1/4 Chicken Plate — Breast & Wing ⟶ [1/4 Chicken — Breast & Wing, PERi-PERi Chips, Coleslaw]
- 1/2 Chicken Plate ⟶ [1/2 Chicken, PERi-PERi Chips, Portuguese Rice]
- Chicken Breast Fillet Burger + Chips ⟶ [Chicken Breast Fillet Burger, PERi-PERi Chips]

### Wingstop (3)
- 6 Classic Wings Combo ⟶ [Classic Wings 6 pc, Seasoned Fries (Regular)]
- 10 Classic Wings Combo ⟶ [Classic Wings 10 pc, Seasoned Fries (Regular)]
- 6 Boneless Wings Combo ⟶ [Boneless Wings 6 pc, Seasoned Fries (Regular)]

### Shake Shack (4)
- ShackBurger Meal ⟶ [ShackBurger, Crinkle Cut Fries, Soft Drink]
- Double ShackBurger Meal ⟶ [Double ShackBurger, Crinkle Cut Fries, Soft Drink]
- SmokeShack Meal ⟶ [SmokeShack, Crinkle Cut Fries, Soft Drink]
- Chick'n Shack Meal ⟶ [Chick'n Shack, Crinkle Cut Fries, Soft Drink]

### Texas Chicken (4)
- 1pc Chicken Meal (Thigh) ⟶ [Original Recipe — Thigh, Seasoned Fries, Honey Butter Biscuit]
- 1pc Chicken Meal (Breast) ⟶ [Original Recipe — Breast, Seasoned Fries, Honey Butter Biscuit]
- Chicken Tenders (3pc) Meal ⟶ [Chicken Tenders 3pc, Seasoned Fries, Honey Butter Biscuit]
- Chicken Sandwich Meal ⟶ [Chicken Sandwich, Seasoned Fries, Soft Drink]

### MOS Burger (4)
- MOS Burger Set ⟶ [MOS Burger, French Fries, Soft Drink]
- Teriyaki Chicken Burger Set ⟶ [Teriyaki Chicken Burger, French Fries, Soft Drink]
- Spicy Chicken Burger Set ⟶ [Spicy Chicken Burger, French Fries, Soft Drink]
- Rice Burger Set ⟶ [Rice Burger — Teriyaki Chicken, Corn Soup, Soft Drink]

### Yoshinoya (4)
- Beef Bowl Set (Regular) ⟶ [Beef Bowl (Regular), Miso Soup]
- Beef Bowl Set (Large) ⟶ [Beef Bowl (Large), Miso Soup]
- Chicken Bowl Set (Regular) ⟶ [Chicken Bowl (Regular), Miso Soup]
- Cheese Beef Bowl Set ⟶ [Cheese Beef Bowl (Regular), Miso Soup, Onsen Egg]

### Bonchon (2)
- Wings & Rice Set (4pc) ⟶ [Wings 4pc, Steamed Rice, Kimchi]
- Drums & Rice Set (4pc) ⟶ [Drums 4pc, Steamed Rice, Kimchi]

### Llaollao (2) — ⚠️ SEE ISSUE #1
- ⟶ [Dave's Single, Medium Fries, Medium Drink]
- Spicy Chicken Combo ⟶ [Spicy Chicken Sandwich, Medium Fries, Medium Drink]

---

## Issues needing a human decision (before migrating)

**1. Data bug — Llaollao.** Llaollao is a *frozen-yogurt* brand, but its entry
holds burger/chicken combos ("Dave's Single", "Spicy Chicken Sandwich" + fries).
This looks like another restaurant's menu (Dave's Hot Chicken / Wendy's) pasted
under the wrong name. Investigate and fix before migrating this one.

**2. Generic "Regular Drink" (18 sets).** A Coke, Root Beer, and coffee differ a
lot in calories. Decide: one shared "Regular Soft Drink (~140 kcal)" placeholder,
or specify per chain. Affects macro accuracy of every combo.

---

## Migration steps (when ready, do 1 chain per session)

1. Create the ~25 shared sides/drinks as `component_only` items (real macros).
2. For each set meal: add `setComponents: [{itemId, qty}]` linking the main
   (existing item) + the shared parts; keep the set's own stored macros
   authoritative; run `computeSetMacros` to reconcile within ±5%.
3. Once a chain is migrated, remove its `setIncludes` lines.
4. Type-check + commit per chain: `data: C1 migrate <chain> set meals`.
