/**
 * import-hawker-centres.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Import the official NEA hawker-centre list into SG_RESTAURANTS as
 * `estimated_menu` outlets, so the app knows what's nearby (GPS + address)
 * without any per-stall fieldwork. Macros come later by attaching generic
 * SG_MACRO_FOODS dishes via macroDbRef + macroSpecificity: 'generic_tagged'.
 *
 * SOURCE (free, Open Data Licence, government-maintained):
 *   NEA Hawker Centres (GEOJSON) — data.gov.sg
 *   https://data.gov.sg/datasets/d_4a086da0a5553be1d89383cd90d07ecd/view
 *   Download the GeoJSON, save it next to this script as `hawker-centres.geojson`.
 *
 * The GeoJSON is a FeatureCollection of Point features; each feature's
 * `properties.Description` is an HTML table containing fields like NAME,
 * ADDRESSBUILDINGNAME, ADDRESSSTREETNAME, ADDRESSPOSTALCODE. We parse those out.
 *
 * Run from the app/ directory:
 *   cd app
 *   # 1. download the GeoJSON into scripts/hawker-centres.geojson first
 *   npx ts-node --project tsconfig.scripts.json scripts/import-hawker-centres.ts \
 *     > ../generated-hawker-centres.ts
 *
 * Output: a paste-ready TypeScript array of SGRestaurant entries. REVIEW it,
 * then merge the entries into SG_RESTAURANTS in app/src/lib/sgFoodDb.ts.
 * This script never writes to sgFoodDb.ts directly (too risky on a 12k-line file).
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Types (subset of SGRestaurant we populate) ──────────────────────────────

interface GeoFeature {
  geometry: { type: string; coordinates: [number, number, ...number[]] };
  properties: Record<string, string>;
}
interface GeoJSON { features: GeoFeature[]; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** data.gov.sg packs attributes into an HTML <th>KEY</th><td>VALUE</td> table. */
function parseDescription(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /<th[^>]*>([^<]*)<\/th>\s*<td[^>]*>([^<]*)<\/td>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out[m[1].trim().toUpperCase()] = m[2].trim();
  return out;
}

/** Stable lowercase slug for the outlet id, e.g. 'hawker_maxwell_fc'. */
function slugify(name: string): string {
  return (
    'hawker_' +
    name
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_')
  );
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/** Lowercase alias variants for GPS fuzzy matching. */
function aliases(name: string): string[] {
  const lower = name.toLowerCase().trim();
  const set = new Set<string>([lower]);
  set.add(lower.replace(/\bfood centre\b/g, 'fc'));
  set.add(lower.replace(/\bmarket\b/g, 'mkt'));
  set.add(lower.replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim());
  return [...set].filter(Boolean);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const file = path.join(__dirname, 'hawker-centres.geojson');
  if (!fs.existsSync(file)) {
    console.error(
      `\nMissing ${file}\n` +
        `Download the NEA Hawker Centres GEOJSON first:\n` +
        `  https://data.gov.sg/datasets/d_4a086da0a5553be1d89383cd90d07ecd/view\n` +
        `Save it as scripts/hawker-centres.geojson, then re-run.\n`,
    );
    process.exit(1);
  }

  const geo: GeoJSON = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const seen = new Set<string>();
  const entries: string[] = [];

  for (const f of geo.features ?? []) {
    const props = parseDescription(f.properties?.Description ?? '');
    const rawName =
      props['NAME'] ||
      props['ADDRESSBUILDINGNAME'] ||
      props['LANDXADDRESSPOINT'] ||
      '';
    if (!rawName) continue;

    const name = titleCase(rawName);
    let id = slugify(rawName);
    if (seen.has(id)) id = `${id}_${seen.size}`; // de-dup collisions
    seen.add(id);

    const [lng, lat] = f.geometry?.coordinates ?? [0, 0];
    const street = titleCase(props['ADDRESSSTREETNAME'] ?? '');
    const postal = props['ADDRESSPOSTALCODE'] ?? '';
    const address = [street, postal && `Singapore ${postal}`]
      .filter(Boolean)
      .join(', ');

    // NOTE: SGRestaurant has no coords/address fields — outlets are matched to
    // Google Places results by `aliases` at runtime. We keep the NEA lat/lng +
    // address in a comment so the data isn't lost (and is ready if a coords
    // field is added later).
    entries.push(
      [
        `  {`,
        `    id: '${id}',`,
        `    name: ${JSON.stringify(name)},`,
        `    emoji: '🍜',`,
        `    cuisine: 'Local & Hawker',`,
        `    outletType: 'hawker',`,
        `    tier: 'estimated_menu',`,
        `    serviceTypes: ['dine_in', 'grab_go'],`,
        `    aliases: ${JSON.stringify(aliases(name))},`,
        `    dietTags: [],`,
        `    priceRange: '$',`,
        `    nutritionUrl: 'https://focos.hpb.gov.sg/eservices/ENCF/',`,
        `    lastUpdated: '${new Date().toISOString().slice(0, 10)}',`,
        `    // NEA ref — address: ${JSON.stringify(address)}; lat: ${lat}; lng: ${lng}`,
        `    // TODO: attach generic dishes via macroDbRef (macroSpecificity: 'generic_tagged')`,
        `    menu: [],`,
        `  },`,
      ].join('\n'),
    );
  }

  console.log(`// Generated from NEA Hawker Centres GEOJSON — ${entries.length} centres`);
  console.log(`// Source: https://data.gov.sg/datasets/d_4a086da0a5553be1d89383cd90d07ecd/view`);
  console.log(`// Review, then merge into SG_RESTAURANTS in app/src/lib/sgFoodDb.ts`);
  console.log(`export const NEA_HAWKER_CENTRES = [`);
  console.log(entries.join('\n'));
  console.log(`];`);
  console.error(`\n✅  Parsed ${entries.length} hawker centres. Review the output before merging.`);
}

main();
