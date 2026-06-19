/**
 * migrate-set-includes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time migration helper: convert free-text `setIncludes: string[]` on
 * SG_RESTAURANTS menu items into structured `setComponents: {itemId, qty}[]`.
 *
 * It does NOT rewrite sgFoodDb.ts directly (too risky on a 12k-line source).
 * Instead it produces a report so a human can apply the changes confidently:
 *
 *   For each set item, it fuzzy-matches every setIncludes label against the
 *   menu items in the SAME restaurant. Matches become setComponents entries;
 *   unmatched labels are flagged as `component_only` items you need to create
 *   (Medium Fries, Regular Coke — parts not sold standalone).
 *
 * Run from the app/ directory:
 *   cd app
 *   npx ts-node -r tsconfig-paths/register --project tsconfig.scripts.json \
 *     scripts/migrate-set-includes.ts > set-meal-migration-report.md
 *
 * Output is Markdown: a paste-ready setComponents block per set item, plus a
 * de-duplicated list of component_only items to create across the whole DB.
 */

import { SG_RESTAURANTS } from '@/lib/sgFoodDb';

// ─── Fuzzy matching ─────────────────────────────────────────────────────────

/** Normalise a label for comparison: lowercase, strip qty words & punctuation. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(\d+\s*x|x\s*\d+|regular|reg|medium|med|large|lrg|small|set|meal|upsize)\b/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Dice coefficient on word-bigrams — cheap, dependency-free similarity 0..1. */
function similarity(a: string, b: string): number {
  const bg = (s: string) => {
    const t = `  ${s} `.split(' ').filter(Boolean);
    const grams = new Set<string>();
    for (let i = 0; i < t.length - 1; i++) grams.add(t[i] + ' ' + t[i + 1]);
    if (grams.size === 0) grams.add(s);
    return grams;
  };
  const A = bg(a), B = bg(b);
  let inter = 0;
  A.forEach(g => { if (B.has(g)) inter++; });
  return (2 * inter) / (A.size + B.size);
}

const MATCH_THRESHOLD = 0.5;

// ─── Migration ──────────────────────────────────────────────────────────────

interface Unmatched { label: string; restaurant: string; setItem: string; }

const lines: string[] = [];
const unmatched: Unmatched[] = [];
let setItemCount = 0;
let fullyMatched = 0;

lines.push('# Set-meal migration report\n');

for (const r of SG_RESTAURANTS) {
  const menu = r.menu ?? [];
  const setItems = menu.filter(m => (m as any).setIncludes?.length);
  if (setItems.length === 0) continue;

  lines.push(`\n## ${r.name} (\`${r.id}\`)\n`);

  for (const item of setItems) {
    setItemCount++;
    const includes: string[] = (item as any).setIncludes;
    const components: { itemId: string; qty: number; from: string }[] = [];
    let allMatched = true;

    for (const label of includes) {
      let best: { id: string; score: number } | null = null;
      for (const candidate of menu) {
        if (candidate.id === item.id) continue; // a set can't contain itself
        const score = similarity(norm(label), norm(candidate.name));
        if (!best || score > best.score) best = { id: candidate.id, score };
      }
      if (best && best.score >= MATCH_THRESHOLD) {
        components.push({ itemId: best.id, qty: 1, from: label });
      } else {
        allMatched = false;
        unmatched.push({ label, restaurant: r.name, setItem: item.name });
      }
    }

    if (allMatched && components.length) fullyMatched++;

    lines.push(`### ${item.name} (\`${item.id}\`)`);
    lines.push('```typescript');
    lines.push('setComponents: [');
    for (const c of components) {
      lines.push(`  { itemId: '${c.itemId}', qty: ${c.qty} },   // ← "${c.from}"`);
    }
    const missing = includes.filter(l => !components.some(c => c.from === l));
    for (const m of missing) {
      lines.push(`  // TODO create component_only item for: "${m}"`);
    }
    lines.push('],');
    lines.push('```\n');
  }
}

// ─── De-duplicated component_only catalogue ─────────────────────────────────

lines.push('\n---\n\n## `component_only` items to create\n');
lines.push('These set parts had no standalone menu item. Create each once as a');
lines.push('`visibility: "component_only"` item (with macros), then reference it.\n');

const byLabel = new Map<string, number>();
for (const u of unmatched) {
  const key = norm(u.label) || u.label.toLowerCase();
  byLabel.set(key, (byLabel.get(key) ?? 0) + 1);
}
const sorted = [...byLabel.entries()].sort((a, b) => b[1] - a[1]);
for (const [label, count] of sorted) {
  lines.push(`- \`${label}\` — referenced ${count}×`);
}

// ─── Summary ────────────────────────────────────────────────────────────────

lines.push('\n---\n\n## Summary\n');
lines.push(`- Set items found: **${setItemCount}**`);
lines.push(`- Fully auto-matched: **${fullyMatched}**`);
lines.push(`- Distinct component_only parts to create: **${sorted.length}**`);
lines.push(`- Match threshold: Dice ≥ ${MATCH_THRESHOLD}\n`);

console.log(lines.join('\n'));
