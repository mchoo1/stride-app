/**
 * FoodIcon — category icon set for menu items across the Eat page.
 * Original line-art (no brand assets), matches the Stride design system.
 * Replaces ad-hoc emoji with a consistent icon language; emoji stays as a
 * fallback wherever an item's own `emoji` field is shown instead of this.
 *
 * Usage:
 *   <FoodIcon name={categoryToIcon(item.category, item.name)} size={20} />
 *
 * All icons share a 0 0 80 90 viewBox so they drop in at any size without
 * re-centering. Stroke color follows `currentColor` — set text color on the
 * wrapping element (or pass className) to theme it.
 */

export type FoodIconName =
  | 'burger'
  | 'chicken'
  | 'rice'
  | 'noodles'
  | 'drink'
  | 'coffee'
  | 'dessert'
  | 'salad'
  | 'default';

interface FoodIconProps {
  name: FoodIconName;
  size?: number;
  className?: string;
  title?: string;
}

export default function FoodIcon({ name, size = 24, className, title }: FoodIconProps) {
  const icon = ICONS[name] ?? ICONS.default;
  return (
    <svg
      viewBox="0 0 80 90"
      width={size}
      height={size}
      className={className}
      style={{ flexShrink: 0, display: 'block' }}
      fill="none"
      stroke="currentColor"
      strokeWidth={6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {icon}
    </svg>
  );
}

const ICONS: Record<FoodIconName, JSX.Element> = {
  burger: (
    <g>
      <path d="M8 22 A32 20 0 0 1 72 22 Z" fillOpacity={0.15} fill="currentColor" />
      <line x1="6" y1="34" x2="74" y2="34" />
      <path
        d="M6 46 q34 14 68 0 v4 a10 10 0 0 1 -10 10 h-48 a10 10 0 0 1 -10 -10 Z"
        fill="#fff"
      />
      <circle cx="24" cy="14" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="40" cy="10" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="56" cy="14" r="1.6" fill="currentColor" stroke="none" />
    </g>
  ),
  chicken: (
    <g>
      <path
        d="M20 20 a18 18 0 1 1 24 24 l-6 6 a8 8 0 1 1 -12 -12 l-6 -18 Z"
        fill="#fff"
      />
      <line x1="30" y1="52" x2="20" y2="66" />
      <line x1="38" y1="50" x2="30" y2="68" />
    </g>
  ),
  rice: (
    <g>
      <path d="M8 34 h64 a32 30 0 0 1 -64 0 Z" fillOpacity={0.15} fill="currentColor" />
      <path d="M14 30 q26 -16 52 0" fill="none" />
      <path d="M46 8 l22 12 M52 6 l20 14" />
    </g>
  ),
  noodles: (
    <g>
      <path d="M8 34 h64 a32 30 0 0 1 -64 0 Z" fillOpacity={0.15} fill="currentColor" />
      <path d="M16 30 q8 -14 16 0 q8 -14 16 0 q8 -14 16 0" fill="none" />
      <path d="M50 6 l14 20 M58 4 l10 22" />
    </g>
  ),
  drink: (
    <g>
      <path d="M16 18 h48 l-6 52 a6 6 0 0 1 -6 6 h-18 a6 6 0 0 1 -6 -6 Z" fill="#fff" />
      <line x1="14" y1="18" x2="66" y2="18" />
      <line x1="44" y1="6" x2="52" y2="20" />
    </g>
  ),
  coffee: (
    <g>
      <path d="M12 26 h44 v18 a20 20 0 0 1 -44 0 Z" fill="#fff" />
      <path d="M56 30 h8 a8 8 0 0 1 0 16 h-6" />
      <path d="M22 12 q4 6 0 12 M34 12 q4 6 0 12" />
    </g>
  ),
  dessert: (
    <g>
      <path d="M28 70 l12 -30 h-24 Z" fill="#fff" />
      <path
        d="M22 40 q-6 -14 8 -16 q2 -14 16 -8 q14 -2 12 12 q10 6 -2 14 Z"
        fillOpacity={0.15}
        fill="currentColor"
      />
    </g>
  ),
  salad: (
    <g>
      <path d="M8 40 h64 a32 28 0 0 1 -64 0 Z" fillOpacity={0.15} fill="currentColor" />
      <path d="M24 34 q-8 -18 6 -22 M40 32 q0 -22 0 -24 M56 34 q8 -18 -6 -22" fill="none" />
    </g>
  ),
  // Generic plate + fork/knife — fallback for categories with no clean visual match
  // (Sides, Sets, Combos, Pizza, Sushi, and anything keyword matching misses).
  default: (
    <g>
      <circle cx="40" cy="40" r="26" fillOpacity={0.15} fill="currentColor" />
      <line x1="16" y1="14" x2="16" y2="66" />
      <line x1="10" y1="14" x2="10" y2="30" />
      <line x1="22" y1="14" x2="22" y2="30" />
      <path d="M62 14 v22 a6 6 0 0 1 -6 6 v24" />
    </g>
  ),
};

/**
 * Maps an SGMenuItem's category (and optionally its name, for a second pass
 * when the category alone is too generic — "Sides", "Sets", "Mains", etc.)
 * to one of the 8 illustrated icons, or 'default' when nothing matches.
 *
 * Ordered by specificity: coffee/dessert are checked before the broader
 * drink/burger buckets so "Hot Coffee" doesn't fall into 'drink' and
 * "Pretzels" doesn't fall into 'burger' via a stray substring match.
 */
export function categoryToIcon(category: string, name?: string): FoodIconName {
  const haystack = `${category} ${name ?? ''}`.toLowerCase();

  const buckets: [FoodIconName, string[]][] = [
    ['coffee', ['coffee', 'espresso', 'latte', 'frappuccino', 'kopi', 'cappuccino', 'mocha']],
    [
      'dessert',
      [
        'dessert', 'cake', 'doughnut', 'donut', 'waffle', 'ice cream', 'gelato',
        'pastry', 'bakery', 'pretzel', 'açaí', 'acai', 'sweet', 'cookie', 'kueh',
      ],
    ],
    ['chicken', ['chicken', 'wing', 'nugget', 'chickenjoy', 'drumstick']],
    ['noodles', ['noodle', 'pasta', 'spaghetti', 'ramen', 'mee ', 'mee)', 'lo mein']],
    ['rice', ['rice', 'bento', 'biryani', 'nasi', 'bowl set']],
    ['salad', ['salad', 'greens']],
    ['burger', ['burger', 'sandwich', 'sub', 'wrap', 'burrito', 'toast', 'flatbread']],
    [
      'drink',
      [
        'drink', 'beverage', 'juice', 'smoothie', 'shake', 'soda', 'tea',
        'frappe', 'sparkling',
      ],
    ],
  ];

  for (const [icon, keywords] of buckets) {
    if (keywords.some((kw) => haystack.includes(kw))) return icon;
  }
  return 'default';
}
