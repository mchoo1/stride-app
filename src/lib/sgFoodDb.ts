/**
 * Singapore Food Database
 * ─────────────────────────────────────────────────────────────────────────────
 * Central data store for restaurant chains, grab & go options, grocery
 * ingredients, and recipe suggestions available in Singapore.
 *
 * HOW TO ADD DATA
 * ───────────────
 * 1. Find the correct section below (restaurants / grab_go / ingredients / recipes)
 * 2. Copy a neighbouring entry as a template
 * 3. Source macro data from the brand's official Singapore nutrition page
 *    or Singapore Health Promotion Board (HPB) data where available
 * 4. Set `lastVerified` to today's date (YYYY-MM-DD)
 * 5. Add the brand's common name variations to `aliases` (all lowercase)
 *    so GPS fuzzy-matching works: "mcdonald's clementi" matches alias "mcdonald"
 *
 * SOURCES (preferred, in order)
 * ───────────────────────────────
 * 1. Brand's official Singapore nutrition PDF / webpage
 * 2. HPB Healthy Eating in Singapore database (hpb.gov.sg)
 * 3. USDA FoodData Central (for packaged goods)
 * 4. Open Food Facts (barcode-verified packaged items)
 * 5. Community-verified estimates (mark `verified: false`)
 */

import type { DietaryFlag } from '@/types';

// ─── Enums & literals ────────────────────────────────────────────────────────

/**
 * How an outlet serves food. An outlet can support multiple modes.
 * Used for filtering on the Eat page — not tied to any UI tab.
 *
 *   dine_in  — has seating; guests eat on-premise (restaurants, hawker centres, cafes)
 *   grab_go  — counter/kiosk service; food is taken away (bubble tea, bakeries, 7-Eleven)
 *   delivery — available via delivery platforms (GrabFood, foodpanda, etc.) — future use
 *
 * Most outlets support both dine_in and grab_go. Pure kiosks are grab_go only.
 * Tag delivery only when the outlet is confirmed on a delivery platform.
 */
export type ServiceType = 'dine_in' | 'grab_go' | 'delivery';

/** Price tier display */
export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

/** Data verification status */
export type VerifiedSource =
  | 'official_sg'        // brand's own Singapore nutrition page
  | 'hpb'               // Health Promotion Board SG
  | 'usda'              // USDA FoodData Central
  | 'open_food_facts'   // Open Food Facts (barcode scan)
  | 'community'         // community estimate — less reliable
  | 'ai_estimate';      // AI-generated estimate — should be replaced

/**
 * Restaurant database completeness tier.
 * Drives section ordering and UI indicators on the Eat page.
 *   full_menu      — verified menu with exact prices, macros, diet tags (chain / QSR)
 *   estimated_menu — place is known but nutrition pulled from SG_MACRO_FOODS reference DB (hawkers)
 *   place_only     — GPS-detected place with no DB match at all (runtime fallback)
 */
export type RestaurantTier = 'full_menu' | 'estimated_menu' | 'place_only';

// ─── Menu item ───────────────────────────────────────────────────────────────

export interface SGMenuItem {
  /** Unique ID — format: `{restaurantId}_{slug}`, e.g. `mcd_mcchicken` */
  id: string;

  /** Display name exactly as it appears on the menu */
  name: string;

  /** Single emoji that best represents this item */
  emoji: string;

  /** Price in SGD (use standard menu price, not promotional) */
  price: number;

  // ── Macros (per standard serving unless noted in `servingNote`) ──────────
  calories: number;     // kcal
  protein:  number;     // g
  carbs:    number;     // g
  fat:      number;     // g
  fibre?:   number;     // g  — optional
  sugar?:   number;     // g  — optional
  sodium?:  number;     // mg — optional

  /** e.g. "per burger (177g)", "per 100ml" — omit if standard full serving */
  servingNote?: string;

  /**
   * Menu section this item belongs to.
   * Examples: "Burgers", "Chicken", "Sides", "Breakfast",
   *           "Drinks", "Desserts", "Meals", "Snacks", "Vegetarian"
   */
  category: string;

  /** Dietary flags this item fully satisfies */
  compatibleWith: DietaryFlag[];

  /** Show a ⭐ Popular badge on this item */
  isPopular?: boolean;

  /** One-line description shown in expanded menu view */
  description?: string;

  /** URL to product image (CDN or brand site) */
  imageUrl?: string;

  /** ISO date macros were last cross-checked against the official source */
  lastVerified?: string;

  /** Where the macro data came from */
  source?: VerifiedSource;

  /** Set false if data is an estimate and needs verification */
  verified?: boolean;

  /**
   * Reference to SG_MACRO_FOODS entry that this item's macros are based on.
   * Used for tier 2 (estimated_menu) items so macros can be kept in sync
   * by updating the macro food entry rather than every restaurant menu.
   */
  macroDbRef?: string;

  /**
   * Confidence level for the macro data.
   *   verified   — cross-checked against official source
   *   estimated  — derived from SG_MACRO_FOODS HPB/community reference
   *   community  — user-submitted, needs review
   */
  confidence?: 'verified' | 'estimated' | 'community';
}

// ─── Restaurant / chain ───────────────────────────────────────────────────────

export interface SGRestaurant {
  /**
   * Unique ID — use brand slug, e.g. `mcd`, `kfc`, `old_chang_kee`
   * For multiple branches of the same chain, use one entry with all aliases.
   */
  id: string;

  /** Official brand name as displayed in the app */
  name: string;

  /** Single emoji representing the brand */
  emoji: string;

  /**
   * Cuisine category displayed as a subtitle.
   * Examples: "Fast Food", "Local & Hawker", "Cafe", "Bakery",
   *           "Bubble Tea", "Japanese", "Korean", "Western"
   */
  cuisine: string;

  /**
   * How this outlet serves food. Use an array — most outlets support multiple modes.
   * See ServiceType for valid values and guidance on when to use each.
   *
   * Examples:
   *   McDonald's:     ['dine_in', 'grab_go']   — seats + counter takeaway
   *   Gong Cha:       ['grab_go']              — kiosk, no seating
   *   Maxwell FC:     ['dine_in', 'grab_go']   — eat there or tapau
   *   Future:         ['dine_in', 'delivery']  — once GrabFood link confirmed
   */
  serviceTypes: ServiceType[];

  /**
   * Lowercase partial strings used to fuzzy-match Google Places results.
   * "McDonald's Clementi" should match alias "mcdonald".
   * Include common misspellings and abbreviations.
   * Examples: ["mcdonald", "mcdonalds", "mcd"]
   */
  aliases: string[];

  /** Full menu — add as many items as available, grouped by category */
  menu: SGMenuItem[];

  /**
   * Dietary flags the restaurant broadly supports
   * (e.g. a halal-certified chain gets ['halal']).
   * Individual menu items override this with their own `compatibleWith`.
   */
  dietTags: DietaryFlag[];

  /** URL to the brand's official Singapore nutrition information page */
  nutritionUrl?: string;

  /** General price tier */
  priceRange: PriceRange;

  /** ISO date the restaurant entry was last updated */
  lastUpdated?: string;

  /**
   * Database tier — controls section placement on the Eat page.
   * Defaults to 'full_menu' for all chains that have a verified menu array.
   * Set 'estimated_menu' for hawkers / local places where items reference SG_MACRO_FOODS.
   */
  tier: RestaurantTier;
}

// ─── Grocery ingredient ───────────────────────────────────────────────────────

export interface SGIngredient {
  /** Unique ID — format: `ing_{slug}`, e.g. `ing_chicken_breast` */
  id: string;

  /** Display name, e.g. "Chicken Breast (skinless)" */
  name: string;

  /** Single emoji */
  emoji: string;

  /**
   * Primary store this ingredient is sourced from.
   * Examples: "FairPrice", "Cold Storage", "Giant", "Sheng Siong",
   *           "Redmart", "Don Don Donki"
   */
  store: string;

  /** Price in SGD per `unit` */
  price: number;

  /**
   * Unit the price and macros apply to.
   * Examples: "100g", "1 pack (500g)", "6 eggs", "1 litre"
   */
  unit: string;

  // ── Macros per stated unit ────────────────────────────────────────────────
  calories: number;
  protein:  number;
  carbs:    number;
  fat:      number;
  fibre?:   number;

  /** Dietary flags this ingredient satisfies */
  compatibleWith: DietaryFlag[];

  /** ISO date price was last checked in-store */
  lastVerified?: string;

  /** Where the macro data came from */
  source?: VerifiedSource;

  /** Set false if data is an estimate and needs verification */
  verified?: boolean;
}

// ─── Recipe ──────────────────────────────────────────────────────────────────

export interface SGRecipeIngredient {
  /** References `SGIngredient.id` */
  ingredientId: string;

  /**
   * How many of the ingredient's `unit` this recipe uses.
   * e.g. if unit is "100g" and quantity is 2.5, recipe uses 250g
   */
  quantity: number;

  /** Preparation note shown to the user, e.g. "diced", "shredded", "room temp" */
  note?: string;
}

export interface SGRecipe {
  /** Unique ID — format: `rec_{slug}`, e.g. `rec_chicken_rice` */
  id: string;

  /** Recipe name shown as the card title */
  name: string;

  /** Single emoji representing the dish */
  emoji: string;

  /** One-sentence description of the dish */
  description: string;

  /** Number of servings the recipe yields */
  servings: number;

  /** Preparation time in minutes (chopping, marinating — not cooking) */
  prepMins: number;

  /** Active cooking time in minutes */
  cookMins: number;

  /**
   * Recipe category for filtering.
   * Examples: "High Protein", "Budget Meal", "Meal Prep",
   *           "Low Carb", "Vegetarian", "Quick & Easy"
   */
  category: string;

  /**
   * Cuisine type for display.
   * Examples: "Local", "Western", "Japanese", "Korean", "Mediterranean"
   */
  cuisine: string;

  /** Ordered list of ingredients with quantities */
  ingredients: SGRecipeIngredient[];

  /**
   * Step-by-step cooking instructions.
   * Each string is one numbered step shown to the user.
   */
  steps: string[];

  /** Dietary flags this recipe fully satisfies */
  compatibleWith: DietaryFlag[];

  /**
   * Pre-calculated macros per serving.
   * Should match the sum of (ingredient macros × quantity) ÷ servings.
   * Keep in sync when ingredients change.
   */
  macrosPerServing: {
    calories: number;
    protein:  number;
    carbs:    number;
    fat:      number;
    fibre?:   number;
  };

  /**
   * Cost per serving in SGD.
   * Should match sum of (ingredient price × quantity) ÷ servings.
   * Keep in sync when ingredients change.
   */
  costPerServing: number;

  /**
   * Searchable tags.
   * Examples: ["meal prep", "quick", "high protein", "freezer friendly"]
   */
  tags: string[];

  /** ISO date recipe was added or last reviewed */
  lastUpdated?: string;
}

// ─── Macro food reference database (Tier 3) ──────────────────────────────────
//
// SG_MACRO_FOODS is a standalone table of common Singaporean food items with
// HPB / USDA verified macros. It serves two purposes:
//   1. Tier 2 hawker restaurant entries reference it via SGMenuItem.macroDbRef
//   2. It can be queried independently for quick macro lookup in the food log
//
// Source priority: HPB → USDA → community verified

export interface SGMacroFood {
  /** Unique ID — format: `macro_{slug}`, e.g. `macro_chicken_rice` */
  id: string;

  /** Display name */
  name: string;

  /** Single emoji */
  emoji: string;

  /**
   * Lowercase aliases for search / matching.
   * Include common Singlish / shorthand names.
   */
  aliases: string[];

  // ── Macros per standard serving ───────────────────────────────────────────
  calories:  number;  // kcal
  protein:   number;  // g
  carbs:     number;  // g
  fat:       number;  // g
  fibre?:    number;  // g
  sodium?:   number;  // mg

  /** Grams in one standard serving, e.g. 380 */
  servingG?: number;

  /** Human-readable serving description, e.g. "1 plate (~380g)" */
  servingNote?: string;

  /** Typical hawker / coffee shop price in SGD */
  typicalPriceSgd?: number;

  /** Data source */
  source: VerifiedSource;
  verified: boolean;
  lastVerified?: string;

  /** Dietary flags this dish satisfies */
  dietTags: DietaryFlag[];
}

// ─── Search result types ──────────────────────────────────────────────────────

export interface RestaurantSearchResult {
  restaurant: SGRestaurant;
  /** Menu items within this restaurant that matched the query */
  matchedItems: SGMenuItem[];
}

export interface MenuItemSearchResult {
  restaurant: SGRestaurant;
  item:       SGMenuItem;
}

// ─── Data arrays (populate below) ────────────────────────────────────────────

/**
 * All restaurant and grab & go chains.
 * Sorted alphabetically within each `tab` category.
 *
 * TODO — Phase 1 (restaurant):
 *   McDonald's SG, KFC SG, Burger King SG, Subway SG, A&W SG, Jollibee SG,
 *   Popeyes SG, Sakae Sushi, Sushi Express, Pepper Lunch, Fish & Co, Poulet
 *
 * TODO — Phase 1 (grab_go):
 *   Old Chang Kee, Ya Kun Kaya Toast, BreadTalk, Toast Box, Bengawan Solo,
 *   Gong Cha, LiHo, Each A Cup, 7-Eleven SG, Cheers, FairPrice Xpress
 */
export const SG_RESTAURANTS: SGRestaurant[] = [

  // ════════════════════════════════════════════════════════════════════════
  // RESTAURANT TAB
  // ════════════════════════════════════════════════════════════════════════

  {
    id: 'mcd',
    name: "McDonald's",
    emoji: '🍔',
    cuisine: 'Fast Food',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'full_menu',
    aliases: ['mcdonald', 'mcdonalds', "mcdonald's", 'mcd', 'mac'],
    dietTags: ['halal'],
    priceRange: '$',
    nutritionUrl: 'https://www.mcdonalds.com.sg/nutrition/',
    lastUpdated: '2026-04-18',
    menu: [
      // ── Burgers ─────────────────────────────────────────────────────────
      {
        id: 'mcd_big_mac',
        name: 'Big Mac',
        emoji: '🍔',
        price: 8.30,
        calories: 550,
        protein: 25,
        carbs: 44,
        fat: 30,
        fibre: 3,
        sodium: 820,
        category: 'Burgers',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Two beef patties, special sauce, lettuce, cheese, pickles, onions on a sesame seed bun.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'mcd_mcchicken',
        name: 'McChicken',
        emoji: '🍗',
        price: 5.80,
        calories: 390,
        protein: 16,
        carbs: 41,
        fat: 19,
        fibre: 2,
        sodium: 660,
        category: 'Burgers',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Crispy chicken patty, mayo, shredded lettuce.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'mcd_mcspicy',
        name: 'McSpicy',
        emoji: '🌶️',
        price: 8.00,
        calories: 500,
        protein: 23,
        carbs: 45,
        fat: 25,
        fibre: 2,
        sodium: 940,
        category: 'Burgers',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Singapore-exclusive spicy crispy chicken burger.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'mcd_filet_o_fish',
        name: 'Filet-O-Fish',
        emoji: '🐟',
        price: 5.80,
        calories: 390,
        protein: 15,
        carbs: 37,
        fat: 20,
        sodium: 570,
        category: 'Burgers',
        compatibleWith: ['halal'],
        description: 'Fish fillet, cheese, tartar sauce on steamed bun.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      // ── Breakfast ────────────────────────────────────────────────────────
      {
        id: 'mcd_egg_mcmuffin',
        name: 'Egg McMuffin',
        emoji: '🥚',
        price: 5.20,
        calories: 310,
        protein: 18,
        carbs: 30,
        fat: 13,
        fibre: 2,
        sodium: 750,
        category: 'Breakfast',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Egg, Canadian bacon, cheese on toasted English muffin.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'mcd_hotcakes',
        name: 'Hotcakes',
        emoji: '🥞',
        price: 4.50,
        calories: 490,
        protein: 10,
        carbs: 87,
        fat: 12,
        fibre: 2,
        sodium: 780,
        category: 'Breakfast',
        compatibleWith: ['halal', 'vegetarian'],
        description: '3 fluffy pancakes with butter and maple syrup.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      // ── Chicken & Sides ──────────────────────────────────────────────────
      {
        id: 'mcd_mcwings',
        name: 'McWings (4 pcs)',
        emoji: '🍗',
        price: 6.00,
        calories: 330,
        protein: 27,
        carbs: 15,
        fat: 18,
        sodium: 720,
        category: 'Chicken & Sides',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Crispy marinated chicken wings.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'mcd_fries_m',
        name: 'French Fries (M)',
        emoji: '🍟',
        price: 3.20,
        calories: 340,
        protein: 4,
        carbs: 46,
        fat: 15,
        fibre: 3,
        sodium: 230,
        category: 'Chicken & Sides',
        compatibleWith: ['halal', 'vegetarian', 'vegan'],
        isPopular: true,
        servingNote: 'Medium (117g)',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      // ── Drinks ───────────────────────────────────────────────────────────
      {
        id: 'mcd_milo',
        name: 'Milo (M)',
        emoji: '🥛',
        price: 2.50,
        calories: 150,
        protein: 4,
        carbs: 26,
        fat: 4,
        category: 'Drinks',
        compatibleWith: ['halal', 'vegetarian'],
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      // ── Desserts ─────────────────────────────────────────────────────────
      {
        id: 'mcd_apple_pie',
        name: 'Apple Pie',
        emoji: '🥧',
        price: 1.80,
        calories: 250,
        protein: 3,
        carbs: 34,
        fat: 12,
        fibre: 2,
        category: 'Desserts',
        compatibleWith: ['halal', 'vegetarian'],
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'mcd_cone',
        name: 'Vanilla Soft Serve Cone',
        emoji: '🍦',
        price: 0.50,
        calories: 150,
        protein: 4,
        carbs: 23,
        fat: 5,
        category: 'Desserts',
        compatibleWith: ['halal', 'vegetarian'],
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'kfc',
    name: 'KFC',
    emoji: '🍗',
    cuisine: 'Fast Food',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'full_menu',
    aliases: ['kfc', 'kentucky fried chicken', 'kentucky'],
    dietTags: ['halal'],
    priceRange: '$',
    nutritionUrl: 'https://www.kfc.com.sg/nutrition',
    lastUpdated: '2026-04-18',
    menu: [
      // ── Chicken ──────────────────────────────────────────────────────────
      {
        id: 'kfc_orig_1pc',
        name: 'Original Recipe Chicken (1 pc)',
        emoji: '🍗',
        price: 3.80,
        calories: 320,
        protein: 29,
        carbs: 13,
        fat: 17,
        sodium: 780,
        category: 'Chicken',
        compatibleWith: ['halal'],
        isPopular: true,
        description: "Colonel's secret 11 herbs & spices, pressure-cooked.",
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'kfc_crispy_1pc',
        name: 'Hot & Crispy Chicken (1 pc)',
        emoji: '🍗',
        price: 3.80,
        calories: 330,
        protein: 27,
        carbs: 16,
        fat: 18,
        sodium: 800,
        category: 'Chicken',
        compatibleWith: ['halal'],
        description: 'Extra crispy seasoned coating.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'kfc_popcorn',
        name: 'Popcorn Chicken (Regular)',
        emoji: '🍿',
        price: 4.50,
        calories: 280,
        protein: 16,
        carbs: 24,
        fat: 13,
        sodium: 640,
        category: 'Chicken',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Bite-sized crispy chicken bites.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      // ── Burgers ──────────────────────────────────────────────────────────
      {
        id: 'kfc_zinger',
        name: 'Zinger Burger',
        emoji: '🌶️',
        price: 7.20,
        calories: 500,
        protein: 28,
        carbs: 46,
        fat: 23,
        sodium: 1020,
        category: 'Burgers',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Spicy fillet burger with lettuce and mayo.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'kfc_twister',
        name: 'Twister (Original)',
        emoji: '🌯',
        price: 6.50,
        calories: 430,
        protein: 22,
        carbs: 42,
        fat: 18,
        sodium: 870,
        category: 'Burgers',
        compatibleWith: ['halal'],
        description: 'Crispy chicken strip wrap with lettuce, cheese and sauce.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      // ── Sides ────────────────────────────────────────────────────────────
      {
        id: 'kfc_coleslaw',
        name: 'Coleslaw',
        emoji: '🥗',
        price: 1.50,
        calories: 110,
        protein: 1,
        carbs: 15,
        fat: 6,
        fibre: 2,
        category: 'Sides',
        compatibleWith: ['halal', 'vegetarian'],
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'kfc_mashed_potato',
        name: 'Mashed Potato',
        emoji: '🥔',
        price: 2.00,
        calories: 130,
        protein: 2,
        carbs: 21,
        fat: 4,
        category: 'Sides',
        compatibleWith: ['halal', 'vegetarian'],
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'kfc_corn',
        name: 'Corn on the Cob',
        emoji: '🌽',
        price: 2.50,
        calories: 100,
        protein: 4,
        carbs: 18,
        fat: 2,
        fibre: 3,
        category: 'Sides',
        compatibleWith: ['halal', 'vegetarian'],
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'bk',
    name: 'Burger King',
    emoji: '👑',
    cuisine: 'Fast Food',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'full_menu',
    aliases: ['burger king', 'burgerking', 'bk'],
    dietTags: ['halal'],
    priceRange: '$$',
    nutritionUrl: 'https://www.burgerking.com.sg/menu',
    lastUpdated: '2026-04-18',
    menu: [
      // ── Burgers ──────────────────────────────────────────────────────────
      {
        id: 'bk_whopper',
        name: 'Whopper',
        emoji: '🍔',
        price: 9.40,
        calories: 660,
        protein: 33,
        carbs: 49,
        fat: 40,
        fibre: 2,
        sodium: 1080,
        category: 'Burgers',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Flame-grilled beef, tomato, lettuce, mayo, pickle, onion.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'bk_double_whopper',
        name: 'Double Whopper',
        emoji: '🍔',
        price: 11.40,
        calories: 870,
        protein: 51,
        carbs: 49,
        fat: 57,
        sodium: 1350,
        category: 'Burgers',
        compatibleWith: ['halal'],
        description: 'Two flame-grilled beef patties with all the works.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'bk_chicken_royale',
        name: 'Chicken Royale',
        emoji: '🍗',
        price: 7.90,
        calories: 440,
        protein: 19,
        carbs: 40,
        fat: 25,
        sodium: 770,
        category: 'Burgers',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Crispy chicken fillet, lettuce, mayo.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'bk_mushroom_swiss',
        name: 'Mushroom Swiss Burger',
        emoji: '🍄',
        price: 8.90,
        calories: 590,
        protein: 36,
        carbs: 43,
        fat: 32,
        sodium: 990,
        category: 'Burgers',
        compatibleWith: ['halal'],
        description: 'Flame-grilled beef with Swiss cheese and mushroom sauce.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      // ── Sides ────────────────────────────────────────────────────────────
      {
        id: 'bk_onion_rings',
        name: 'Onion Rings (Regular)',
        emoji: '🧅',
        price: 3.20,
        calories: 330,
        protein: 5,
        carbs: 42,
        fat: 16,
        fibre: 2,
        sodium: 510,
        category: 'Sides',
        compatibleWith: ['halal', 'vegetarian'],
        isPopular: true,
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'bk_fries_m',
        name: 'Classic Fries (M)',
        emoji: '🍟',
        price: 3.00,
        calories: 310,
        protein: 4,
        carbs: 44,
        fat: 14,
        sodium: 470,
        category: 'Sides',
        compatibleWith: ['halal', 'vegetarian', 'vegan'],
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      // ── Desserts ─────────────────────────────────────────────────────────
      {
        id: 'bk_sundae',
        name: 'Chocolate Sundae',
        emoji: '🍫',
        price: 2.50,
        calories: 250,
        protein: 5,
        carbs: 38,
        fat: 9,
        category: 'Desserts',
        compatibleWith: ['halal', 'vegetarian'],
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'subway',
    name: 'Subway',
    emoji: '🥖',
    cuisine: 'Sandwiches',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'full_menu',
    aliases: ['subway'],
    dietTags: ['halal'],
    priceRange: '$$',
    nutritionUrl: 'https://www.subway.com/en-SG/MenuNutrition/Menu',
    lastUpdated: '2026-04-18',
    menu: [
      // ── 6-inch Subs ──────────────────────────────────────────────────────
      {
        id: 'sub_chicken_breast',
        name: 'Chicken Breast (6")',
        emoji: '🍗',
        price: 7.50,
        calories: 350,
        protein: 24,
        carbs: 47,
        fat: 5,
        fibre: 4,
        sodium: 700,
        category: '6-inch Subs',
        compatibleWith: ['halal'],
        isPopular: true,
        servingNote: 'On 9-grain wheat with standard veggies, no sauce',
        description: 'Tender oven-roasted chicken breast fillet.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'sub_roast_beef',
        name: 'Roast Beef (6")',
        emoji: '🥩',
        price: 7.50,
        calories: 330,
        protein: 22,
        carbs: 45,
        fat: 5,
        fibre: 4,
        sodium: 680,
        category: '6-inch Subs',
        compatibleWith: ['halal'],
        servingNote: 'On 9-grain wheat with standard veggies, no sauce',
        description: 'Sliced roast beef, a good source of iron.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'sub_tuna',
        name: 'Tuna (6")',
        emoji: '🐟',
        price: 7.90,
        calories: 430,
        protein: 20,
        carbs: 46,
        fat: 14,
        fibre: 4,
        sodium: 780,
        category: '6-inch Subs',
        compatibleWith: ['halal'],
        isPopular: true,
        servingNote: 'On 9-grain wheat with standard veggies, no sauce',
        description: 'Tuna mixed with mayo.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'sub_veggie_delight',
        name: 'Veggie Delight (6")',
        emoji: '🥗',
        price: 6.50,
        calories: 230,
        protein: 10,
        carbs: 43,
        fat: 2,
        fibre: 5,
        sodium: 430,
        category: '6-inch Subs',
        compatibleWith: ['halal', 'vegetarian'],
        servingNote: 'On 9-grain wheat with standard veggies, no sauce',
        description: 'Fresh crisp veggies piled high.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'sub_egg_mayo',
        name: 'Egg Mayo (6")',
        emoji: '🥚',
        price: 6.50,
        calories: 380,
        protein: 18,
        carbs: 46,
        fat: 12,
        fibre: 4,
        sodium: 760,
        category: '6-inch Subs',
        compatibleWith: ['halal', 'vegetarian'],
        description: 'Creamy egg mayo filling.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      {
        id: 'sub_meatball',
        name: 'Meatball Marinara (6")',
        emoji: '🍝',
        price: 7.50,
        calories: 430,
        protein: 22,
        carbs: 49,
        fat: 15,
        fibre: 4,
        sodium: 960,
        category: '6-inch Subs',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Meatballs in marinara sauce, topped with cheese.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      // ── Footlong Subs ────────────────────────────────────────────────────
      {
        id: 'sub_chicken_breast_ft',
        name: 'Chicken Breast (Footlong)',
        emoji: '🍗',
        price: 12.00,
        calories: 700,
        protein: 48,
        carbs: 94,
        fat: 10,
        fibre: 8,
        sodium: 1400,
        category: 'Footlong Subs',
        compatibleWith: ['halal'],
        servingNote: 'On 9-grain wheat with standard veggies, no sauce',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
      // ── Salads ───────────────────────────────────────────────────────────
      {
        id: 'sub_chicken_salad',
        name: 'Chicken Breast Salad',
        emoji: '🥗',
        price: 8.50,
        calories: 150,
        protein: 22,
        carbs: 10,
        fat: 3,
        fibre: 3,
        sodium: 500,
        category: 'Salads',
        compatibleWith: ['halal', 'gluten_free'],
        description: 'All the flavour, none of the bread.',
        source: 'official_sg',
        verified: true,
        lastVerified: '2026-04-18',
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // GRAB & GO TAB
  // ════════════════════════════════════════════════════════════════════════

  {
    id: 'old_chang_kee',
    name: 'Old Chang Kee',
    emoji: '🥟',
    cuisine: 'Local Snacks',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'full_menu',
    aliases: ['old chang kee', 'ock', 'old chang'],
    dietTags: ['halal'],
    priceRange: '$',
    nutritionUrl: 'https://www.oldchangkee.com',
    lastUpdated: '2026-04-18',
    menu: [
      {
        id: 'ock_curry_puff_chicken',
        name: 'Curry Puff (Chicken)',
        emoji: '🥟',
        price: 1.50,
        calories: 210,
        protein: 6,
        carbs: 24,
        fat: 10,
        fibre: 1,
        sodium: 380,
        category: 'Curry Puffs',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Flaky pastry filled with spiced chicken and potato.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'ock_curry_puff_egg',
        name: 'Curry Puff (Egg)',
        emoji: '🥚',
        price: 1.50,
        calories: 200,
        protein: 5,
        carbs: 23,
        fat: 10,
        fibre: 1,
        sodium: 340,
        category: 'Curry Puffs',
        compatibleWith: ['halal', 'vegetarian'],
        description: 'Flaky pastry filled with egg and potato.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'ock_chicken_roll',
        name: "Chicken 'O'",
        emoji: '🍢',
        price: 1.50,
        calories: 180,
        protein: 8,
        carbs: 17,
        fat: 9,
        sodium: 310,
        category: 'Rolls & Sticks',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Crispy batter-coated chicken on a stick.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'ock_otah_stick',
        name: 'Otah Stick',
        emoji: '🐟',
        price: 1.20,
        calories: 90,
        protein: 9,
        carbs: 3,
        fat: 4,
        sodium: 280,
        category: 'Rolls & Sticks',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Grilled spiced fish cake on a stick.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'ock_curry_puff_sardine',
        name: 'Curry Puff (Sardine)',
        emoji: '🐟',
        price: 1.50,
        calories: 215,
        protein: 7,
        carbs: 22,
        fat: 11,
        sodium: 400,
        category: 'Curry Puffs',
        compatibleWith: ['halal'],
        description: 'Flaky pastry with sardine and potato filling.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'ock_nuggets',
        name: 'Chicken Nuggets (6 pcs)',
        emoji: '🍗',
        price: 3.50,
        calories: 250,
        protein: 16,
        carbs: 18,
        fat: 12,
        sodium: 560,
        category: 'Snacks',
        compatibleWith: ['halal'],
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'ya_kun',
    name: 'Ya Kun Kaya Toast',
    emoji: '🍞',
    cuisine: 'Local Cafe',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'full_menu',
    aliases: ['ya kun', 'yakun', 'ya kun kaya'],
    dietTags: [],
    priceRange: '$',
    nutritionUrl: 'https://www.yakun.com',
    lastUpdated: '2026-04-18',
    menu: [
      {
        id: 'yk_kaya_toast_thin',
        name: 'Kaya Butter Toast (Thin)',
        emoji: '🍞',
        price: 2.20,
        calories: 200,
        protein: 5,
        carbs: 28,
        fat: 8,
        fibre: 1,
        category: 'Toast',
        compatibleWith: ['vegetarian'],
        isPopular: true,
        description: 'Classic thin white bread toasted with kaya and butter.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'yk_kaya_toast_thick',
        name: 'Kaya Butter Toast (Thick)',
        emoji: '🍞',
        price: 2.50,
        calories: 230,
        protein: 6,
        carbs: 33,
        fat: 9,
        fibre: 1,
        category: 'Toast',
        compatibleWith: ['vegetarian'],
        isPopular: true,
        description: 'Thick-cut toast with generous kaya and butter.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'yk_french_toast',
        name: 'French Toast',
        emoji: '🍳',
        price: 3.50,
        calories: 320,
        protein: 8,
        carbs: 38,
        fat: 16,
        fibre: 1,
        category: 'Toast',
        compatibleWith: ['vegetarian'],
        description: 'Deep-fried egg-coated toast with kaya and butter.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'yk_soft_eggs',
        name: 'Soft-Boiled Eggs (2 pcs)',
        emoji: '🥚',
        price: 2.00,
        calories: 130,
        protein: 10,
        carbs: 1,
        fat: 10,
        sodium: 300,
        category: 'Eggs',
        compatibleWith: ['vegetarian', 'gluten_free'],
        isPopular: true,
        description: 'Traditional half-boiled eggs with soy sauce and pepper.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'yk_kopi',
        name: 'Kopi (Coffee with Condensed Milk)',
        emoji: '☕',
        price: 1.80,
        calories: 85,
        protein: 1,
        carbs: 13,
        fat: 3,
        category: 'Drinks',
        compatibleWith: ['vegetarian'],
        isPopular: true,
        description: 'Traditional local coffee brewed with a sock filter.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'yk_teh',
        name: 'Teh (Tea with Condensed Milk)',
        emoji: '🍵',
        price: 1.80,
        calories: 90,
        protein: 1,
        carbs: 15,
        fat: 3,
        category: 'Drinks',
        compatibleWith: ['vegetarian'],
        description: 'Strong black tea with condensed milk.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'yk_set_a',
        name: 'Set A (2 Toast + 2 Eggs + Drink)',
        emoji: '🍽️',
        price: 6.50,
        calories: 455,
        protein: 17,
        carbs: 57,
        fat: 21,
        category: 'Sets',
        compatibleWith: ['vegetarian'],
        isPopular: true,
        description: 'The classic Singapore breakfast set.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'breadtalk',
    name: 'BreadTalk',
    emoji: '🥐',
    cuisine: 'Bakery',
    serviceTypes: ['grab_go'],
    tier: 'full_menu',
    aliases: ['breadtalk', 'bread talk'],
    dietTags: ['halal'],
    priceRange: '$',
    nutritionUrl: 'https://www.breadtalk.com.sg',
    lastUpdated: '2026-04-18',
    menu: [
      {
        id: 'bt_floss_bun',
        name: 'Pork Floss Bun',
        emoji: '🥐',
        price: 2.20,
        calories: 280,
        protein: 8,
        carbs: 42,
        fat: 9,
        fibre: 1,
        sodium: 440,
        category: 'Savoury Buns',
        compatibleWith: [],
        isPopular: true,
        description: "BreadTalk's iconic signature — soft bun topped with pork floss.",
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'bt_cheese_sausage',
        name: 'Cheese Sausage Bun',
        emoji: '🌭',
        price: 2.50,
        calories: 310,
        protein: 10,
        carbs: 39,
        fat: 13,
        sodium: 520,
        category: 'Savoury Buns',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Soft bun with chicken sausage and melted cheese.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'bt_tuna_mayo',
        name: 'Tuna Mayo Bun',
        emoji: '🐟',
        price: 2.20,
        calories: 270,
        protein: 10,
        carbs: 36,
        fat: 10,
        sodium: 410,
        category: 'Savoury Buns',
        compatibleWith: ['halal'],
        description: 'Soft roll filled with creamy tuna mayo.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'bt_cocktail_bun',
        name: 'Cocktail Bun',
        emoji: '🫐',
        price: 2.00,
        calories: 250,
        protein: 7,
        carbs: 37,
        fat: 9,
        fibre: 1,
        category: 'Sweet Buns',
        compatibleWith: ['halal', 'vegetarian'],
        description: 'Soft bun with sweet coconut and butter filling.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'bt_raisin_walnut_slice',
        name: 'Raisin Walnut Loaf (per slice)',
        emoji: '🍞',
        price: 1.50,
        calories: 120,
        protein: 3,
        carbs: 19,
        fat: 4,
        fibre: 1,
        category: 'Loaves',
        compatibleWith: ['halal', 'vegetarian'],
        description: 'Dense loaf slice with raisins and walnuts.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'bt_chicken_floss',
        name: 'Chicken Floss Bun',
        emoji: '🥐',
        price: 2.20,
        calories: 270,
        protein: 9,
        carbs: 41,
        fat: 8,
        sodium: 410,
        category: 'Savoury Buns',
        compatibleWith: ['halal'],
        description: 'Same great format as the classic floss bun, using halal chicken floss.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'gong_cha',
    name: 'Gong Cha',
    emoji: '🧋',
    cuisine: 'Bubble Tea',
    serviceTypes: ['grab_go'],
    tier: 'full_menu',
    aliases: ['gong cha', 'gongcha', 'gong-cha'],
    dietTags: ['halal', 'vegetarian'],
    priceRange: '$',
    nutritionUrl: 'https://www.gong-cha-sg.com',
    lastUpdated: '2026-04-18',
    menu: [
      {
        id: 'gc_milk_tea_m',
        name: 'Milk Tea (M, 0% sugar)',
        emoji: '🧋',
        price: 4.20,
        calories: 150,
        protein: 3,
        carbs: 27,
        fat: 3,
        category: 'Milk Tea',
        compatibleWith: ['halal', 'vegetarian'],
        isPopular: true,
        servingNote: 'Medium (500ml), 0% sugar, 100% ice',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'gc_brown_sugar_m',
        name: 'Brown Sugar Milk Tea (M)',
        emoji: '🍮',
        price: 5.50,
        calories: 280,
        protein: 3,
        carbs: 56,
        fat: 4,
        category: 'Milk Tea',
        compatibleWith: ['halal', 'vegetarian'],
        isPopular: true,
        servingNote: 'Medium (500ml)',
        description: 'Rich brown sugar syrup with fresh milk.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'gc_taro_m',
        name: 'Taro Milk Tea (M)',
        emoji: '🟣',
        price: 5.00,
        calories: 240,
        protein: 3,
        carbs: 45,
        fat: 4,
        category: 'Milk Tea',
        compatibleWith: ['halal', 'vegetarian'],
        isPopular: true,
        servingNote: 'Medium (500ml)',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'gc_matcha_latte_m',
        name: 'Matcha Latte (M)',
        emoji: '🍵',
        price: 5.00,
        calories: 180,
        protein: 4,
        carbs: 30,
        fat: 5,
        category: 'Specialty',
        compatibleWith: ['halal', 'vegetarian'],
        description: 'Japanese matcha powder with fresh milk.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'gc_mango_green_m',
        name: 'Mango Green Tea (M)',
        emoji: '🥭',
        price: 4.20,
        calories: 110,
        protein: 1,
        carbs: 26,
        fat: 0,
        category: 'Fruit Tea',
        compatibleWith: ['halal', 'vegetarian', 'vegan'],
        servingNote: 'Medium (500ml)',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: 'gc_wintermelon_m',
        name: 'Wintermelon Tea (M)',
        emoji: '🍈',
        price: 3.80,
        calories: 90,
        protein: 0,
        carbs: 22,
        fat: 0,
        category: 'Fruit Tea',
        compatibleWith: ['halal', 'vegetarian', 'vegan'],
        servingNote: 'Medium (500ml)',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────

  {
    id: '7eleven',
    name: '7-Eleven',
    emoji: '🏪',
    cuisine: 'Convenience Store',
    serviceTypes: ['grab_go'],
    tier: 'full_menu',
    aliases: ['7-eleven', '7 eleven', '7eleven', 'seven eleven'],
    dietTags: [],
    priceRange: '$',
    lastUpdated: '2026-04-18',
    menu: [
      {
        id: '7e_hotdog',
        name: 'Big Bite Hot Dog',
        emoji: '🌭',
        price: 2.50,
        calories: 320,
        protein: 12,
        carbs: 26,
        fat: 18,
        sodium: 680,
        category: 'Hot Food',
        compatibleWith: [],
        isPopular: true,
        description: 'All-beef hot dog in a soft bun.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: '7e_chicken_pie',
        name: 'Chicken Pie',
        emoji: '🥧',
        price: 3.50,
        calories: 380,
        protein: 13,
        carbs: 36,
        fat: 20,
        sodium: 580,
        category: 'Hot Food',
        compatibleWith: ['halal'],
        isPopular: true,
        description: 'Flaky pastry with creamy chicken filling.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: '7e_tuna_sandwich',
        name: 'Tuna Sandwich',
        emoji: '🥪',
        price: 4.50,
        calories: 310,
        protein: 14,
        carbs: 38,
        fat: 9,
        fibre: 2,
        sodium: 620,
        category: 'Sandwiches & Onigiri',
        compatibleWith: [],
        isPopular: true,
        description: 'Chilled tuna mayo sandwich on soft white bread.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: '7e_onigiri_tuna',
        name: 'Onigiri — Tuna Mayo',
        emoji: '🍙',
        price: 2.80,
        calories: 180,
        protein: 8,
        carbs: 33,
        fat: 2,
        fibre: 1,
        sodium: 410,
        category: 'Sandwiches & Onigiri',
        compatibleWith: [],
        isPopular: true,
        description: 'Japanese-style rice ball with tuna mayo filling.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: '7e_onigiri_salmon',
        name: 'Onigiri — Salmon',
        emoji: '🍙',
        price: 2.80,
        calories: 175,
        protein: 9,
        carbs: 32,
        fat: 2,
        fibre: 1,
        sodium: 390,
        category: 'Sandwiches & Onigiri',
        compatibleWith: [],
        description: 'Rice ball with seasoned salmon filling.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: '7e_boiled_eggs',
        name: 'Hard-Boiled Eggs (2 pcs)',
        emoji: '🥚',
        price: 2.00,
        calories: 130,
        protein: 12,
        carbs: 1,
        fat: 9,
        sodium: 190,
        category: 'Snacks',
        compatibleWith: ['vegetarian', 'gluten_free'],
        isPopular: true,
        description: 'Pre-peeled hard-boiled eggs — quick protein on the go.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: '7e_slurpee_m',
        name: 'Slurpee (M)',
        emoji: '🧊',
        price: 2.50,
        calories: 160,
        protein: 0,
        carbs: 42,
        fat: 0,
        sodium: 30,
        category: 'Drinks',
        compatibleWith: ['vegetarian', 'vegan'],
        description: 'Frozen flavoured ice drink.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
      {
        id: '7e_greek_yogurt',
        name: 'Greek Yogurt (Meiji)',
        emoji: '🫙',
        price: 3.50,
        calories: 110,
        protein: 11,
        carbs: 12,
        fat: 2,
        category: 'Chilled',
        compatibleWith: ['vegetarian', 'gluten_free'],
        description: 'Plain Greek-style yogurt — high protein, low fat.',
        source: 'community',
        verified: false,
        lastVerified: '2026-04-18',
      },
    ],
  },

];

/**
 * Grocery ingredients used in recipes.
 * Price and macros are per the stated `unit`.
 *
 * TODO — Phase 1:
 *   FairPrice staples: chicken breast, eggs, rice, tofu, spinach,
 *   milk, canned tuna, canned beans, oats, sweet potato, broccoli
 */
export const SG_INGREDIENTS: SGIngredient[] = [

  // ── Protein sources ────────────────────────────────────────────────────
  {
    id: 'ing_chicken_breast',
    name: 'Chicken Breast (skinless)',
    emoji: '🍗',
    store: 'FairPrice',
    price: 6.50,
    unit: '500g pack',
    calories: 825,   // 165 kcal / 100g × 5
    protein: 155,    // 31g / 100g × 5
    carbs: 0,
    fat: 18,         // 3.6g / 100g × 5
    fibre: 0,
    compatibleWith: ['halal', 'gluten_free'],
    source: 'usda',
    verified: true,
    lastVerified: '2026-04-18',
  },
  {
    id: 'ing_chicken_thigh',
    name: 'Chicken Thigh (boneless, skinless)',
    emoji: '🍗',
    store: 'FairPrice',
    price: 5.00,
    unit: '500g pack',
    calories: 895,   // 179 kcal / 100g × 5
    protein: 100,    // 20g / 100g × 5
    carbs: 0,
    fat: 55,         // 11g / 100g × 5
    fibre: 0,
    compatibleWith: ['halal', 'gluten_free'],
    source: 'usda',
    verified: true,
    lastVerified: '2026-04-18',
  },
  {
    id: 'ing_eggs_10',
    name: 'Eggs (Local Farm)',
    emoji: '🥚',
    store: 'FairPrice',
    price: 2.80,
    unit: '10 eggs',
    calories: 700,   // 70 kcal / egg × 10
    protein: 60,     // 6g / egg × 10
    carbs: 5,        // 0.5g / egg × 10
    fat: 50,         // 5g / egg × 10
    fibre: 0,
    compatibleWith: ['vegetarian', 'gluten_free'],
    source: 'usda',
    verified: true,
    lastVerified: '2026-04-18',
  },
  {
    id: 'ing_canned_tuna',
    name: 'Tuna in Water (Ayam Brand)',
    emoji: '🐟',
    store: 'FairPrice',
    price: 2.20,
    unit: '185g can',
    calories: 140,
    protein: 30,
    carbs: 0,
    fat: 1,
    fibre: 0,
    compatibleWith: ['gluten_free'],
    source: 'open_food_facts',
    verified: true,
    lastVerified: '2026-04-18',
  },
  {
    id: 'ing_silken_tofu',
    name: 'Silken Tofu (Unicurd)',
    emoji: '🫘',
    store: 'FairPrice',
    price: 1.20,
    unit: '300g pack',
    calories: 150,   // 50 kcal / 100g × 3
    protein: 15,     // 5g / 100g × 3
    carbs: 6,        // 2g / 100g × 3
    fat: 7.5,        // 2.5g / 100g × 3
    fibre: 0,
    compatibleWith: ['vegan', 'vegetarian', 'gluten_free', 'halal'],
    source: 'open_food_facts',
    verified: true,
    lastVerified: '2026-04-18',
  },
  {
    id: 'ing_greek_yogurt',
    name: 'Low-fat Greek Yogurt (Meiji)',
    emoji: '🫙',
    store: 'FairPrice',
    price: 5.50,
    unit: '500g tub',
    calories: 295,   // 59 kcal / 100g × 5
    protein: 50,     // 10g / 100g × 5
    carbs: 18,       // 3.6g / 100g × 5
    fat: 2,          // 0.4g / 100g × 5
    fibre: 0,
    compatibleWith: ['vegetarian', 'gluten_free'],
    source: 'open_food_facts',
    verified: true,
    lastVerified: '2026-04-18',
  },

  // ── Carb sources ───────────────────────────────────────────────────────
  {
    id: 'ing_jasmine_rice',
    name: 'Jasmine Rice (Fragrant)',
    emoji: '🍚',
    store: 'FairPrice',
    price: 12.00,
    unit: '5kg bag',
    calories: 18000, // 360 kcal / 100g × 50 servings
    protein: 350,
    carbs: 4000,
    fat: 25,
    fibre: 15,
    compatibleWith: ['vegan', 'vegetarian', 'gluten_free', 'halal'],
    source: 'usda',
    verified: true,
    lastVerified: '2026-04-18',
  },
  {
    id: 'ing_brown_rice',
    name: 'Brown Rice (SunWhite)',
    emoji: '🍚',
    store: 'FairPrice',
    price: 4.50,
    unit: '1kg bag',
    calories: 3700,  // 370 kcal / 100g × 10 servings
    protein: 75,
    carbs: 770,
    fat: 27,
    fibre: 35,
    compatibleWith: ['vegan', 'vegetarian', 'gluten_free', 'halal'],
    source: 'usda',
    verified: true,
    lastVerified: '2026-04-18',
  },
  {
    id: 'ing_rolled_oats',
    name: 'Rolled Oats (Quaker)',
    emoji: '🌾',
    store: 'FairPrice',
    price: 3.50,
    unit: '500g pack',
    calories: 1900,  // 380 kcal / 100g × 5
    protein: 65,
    carbs: 335,
    fat: 35,
    fibre: 50,
    compatibleWith: ['vegan', 'vegetarian', 'halal'],
    source: 'open_food_facts',
    verified: true,
    lastVerified: '2026-04-18',
  },
  {
    id: 'ing_sweet_potato',
    name: 'Sweet Potato (Orange)',
    emoji: '🍠',
    store: 'FairPrice',
    price: 2.00,
    unit: '500g bag',
    calories: 430,   // 86 kcal / 100g × 5
    protein: 8,
    carbs: 100,
    fat: 0.5,
    fibre: 6,
    compatibleWith: ['vegan', 'vegetarian', 'gluten_free', 'halal'],
    source: 'usda',
    verified: true,
    lastVerified: '2026-04-18',
  },
  {
    id: 'ing_canned_chickpeas',
    name: 'Chickpeas, canned (Ayam Brand)',
    emoji: '🫘',
    store: 'FairPrice',
    price: 2.00,
    unit: '400g can (240g drained)',
    calories: 288,   // 120 kcal / 100g × 2.4
    protein: 17,
    carbs: 48,
    fat: 5,
    fibre: 10,
    compatibleWith: ['vegan', 'vegetarian', 'gluten_free', 'halal'],
    source: 'open_food_facts',
    verified: true,
    lastVerified: '2026-04-18',
  },
  {
    id: 'ing_banana',
    name: 'Banana (Cavendish)',
    emoji: '🍌',
    store: 'FairPrice',
    price: 0.40,
    unit: 'per banana (~118g)',
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.4,
    fibre: 3,
    compatibleWith: ['vegan', 'vegetarian', 'gluten_free', 'halal'],
    source: 'usda',
    verified: true,
    lastVerified: '2026-04-18',
  },

  // ── Vegetables ─────────────────────────────────────────────────────────
  {
    id: 'ing_baby_spinach',
    name: 'Baby Spinach',
    emoji: '🥬',
    store: 'FairPrice',
    price: 2.50,
    unit: '120g bag',
    calories: 28,    // 23 kcal / 100g × 1.2
    protein: 3.6,
    carbs: 4.2,
    fat: 0.5,
    fibre: 2.4,
    compatibleWith: ['vegan', 'vegetarian', 'gluten_free', 'halal'],
    source: 'usda',
    verified: true,
    lastVerified: '2026-04-18',
  },
  {
    id: 'ing_broccoli',
    name: 'Broccoli',
    emoji: '🥦',
    store: 'FairPrice',
    price: 2.50,
    unit: '350g head',
    calories: 119,   // 34 kcal / 100g × 3.5
    protein: 10.5,
    carbs: 24.5,
    fat: 1.4,
    fibre: 9,
    compatibleWith: ['vegan', 'vegetarian', 'gluten_free', 'halal'],
    source: 'usda',
    verified: true,
    lastVerified: '2026-04-18',
  },

  // ── Dairy ──────────────────────────────────────────────────────────────
  {
    id: 'ing_whole_milk',
    name: 'Full Cream Milk (Meiji)',
    emoji: '🥛',
    store: 'FairPrice',
    price: 3.00,
    unit: '1 litre',
    calories: 610,   // 61 kcal / 100ml × 10
    protein: 32,
    carbs: 48,
    fat: 33,
    fibre: 0,
    compatibleWith: ['vegetarian', 'gluten_free'],
    source: 'open_food_facts',
    verified: true,
    lastVerified: '2026-04-18',
  },

  // ── Pantry ─────────────────────────────────────────────────────────────
  {
    id: 'ing_light_soy_sauce',
    name: 'Light Soy Sauce (Kikkoman)',
    emoji: '🍶',
    store: 'FairPrice',
    price: 3.50,
    unit: '150ml bottle',
    calories: 60,
    protein: 6,
    carbs: 6,
    fat: 0,
    fibre: 0,
    compatibleWith: ['vegan', 'vegetarian', 'halal'],
    source: 'open_food_facts',
    verified: true,
    lastVerified: '2026-04-18',
  },
  {
    id: 'ing_sesame_oil',
    name: 'Sesame Oil',
    emoji: '🫙',
    store: 'FairPrice',
    price: 4.00,
    unit: '200ml bottle',
    calories: 1700,  // ~850 kcal / 100ml × 2
    protein: 0,
    carbs: 0,
    fat: 194,
    fibre: 0,
    compatibleWith: ['vegan', 'vegetarian', 'gluten_free', 'halal'],
    source: 'usda',
    verified: true,
    lastVerified: '2026-04-18',
  },

];

/**
 * Recipes composed from SG_INGREDIENTS.
 * Each recipe's `macrosPerServing` and `costPerServing` should be
 * computed from its ingredients rather than hand-estimated where possible.
 *
 * TODO — Phase 1:
 *   High Protein: Chicken Rice Bowl, Tuna Salad Wrap, Egg Fried Rice
 *   Budget: Bean & Veggie Stir Fry, Oat Porridge with Egg
 *   Meal Prep: Teriyaki Chicken Batch, Overnight Oats (3 variants)
 */
export const SG_RECIPES: SGRecipe[] = [

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'rec_chicken_rice_bowl',
    name: 'High-Protein Chicken Rice Bowl',
    emoji: '🍱',
    description: 'Simple meal-prep staple — steamed chicken breast over brown rice with broccoli.',
    servings: 2,
    prepMins: 10,
    cookMins: 25,
    category: 'High Protein',
    cuisine: 'Local',
    compatibleWith: ['halal', 'gluten_free'],
    ingredients: [
      { ingredientId: 'ing_chicken_breast', quantity: 0.6, note: '300g, sliced thinly' },
      { ingredientId: 'ing_brown_rice',     quantity: 0.05, note: '50g dry (~150g cooked)' },
      { ingredientId: 'ing_broccoli',       quantity: 0.5, note: '175g, cut into florets' },
      { ingredientId: 'ing_light_soy_sauce',quantity: 0.1, note: '2 tsp' },
      { ingredientId: 'ing_sesame_oil',     quantity: 0.02, note: '½ tsp' },
    ],
    steps: [
      'Rinse rice and cook in a pot (1:1.5 rice to water ratio, ~20 min on low heat after boiling).',
      'While rice cooks, steam or pan-fry chicken breast slices for 6–8 min until cooked through.',
      'Blanch broccoli in boiling water for 2–3 min until bright green and tender-crisp.',
      'Mix soy sauce and sesame oil together as a sauce.',
      'Divide rice between bowls, top with chicken and broccoli, drizzle sauce over.',
    ],
    macrosPerServing: {
      calories: 390,
      protein:  42,
      carbs:    32,
      fat:       7,
      fibre:     5,
    },
    costPerServing: 5.30,
    tags: ['meal prep', 'high protein', 'gluten free', 'quick', 'freezer friendly'],
    lastUpdated: '2026-04-18',
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'rec_tuna_oat_salad',
    name: 'Tuna Spinach Salad with Oats',
    emoji: '🥗',
    description: 'Quick no-cook meal — tuna and spinach over warm oats for a filling protein hit.',
    servings: 1,
    prepMins: 5,
    cookMins: 5,
    category: 'Quick & Easy',
    cuisine: 'Western',
    compatibleWith: ['gluten_free'],
    ingredients: [
      { ingredientId: 'ing_canned_tuna',   quantity: 1,    note: '1 can, drained' },
      { ingredientId: 'ing_rolled_oats',   quantity: 0.06, note: '30g dry oats' },
      { ingredientId: 'ing_baby_spinach',  quantity: 0.5,  note: '60g (half bag)' },
      { ingredientId: 'ing_light_soy_sauce',quantity: 0.05,note: '1 tsp for seasoning' },
    ],
    steps: [
      'Cook oats with 80ml water in a microwave for 2 min, or on hob for 3 min, until thick.',
      'Season oats with a dash of soy sauce.',
      'Place fresh spinach on a plate, spoon warm oats alongside.',
      'Top with drained tuna. Mix before eating.',
    ],
    macrosPerServing: {
      calories: 320,
      protein:  36,
      carbs:    28,
      fat:       4,
      fibre:     6,
    },
    costPerServing: 3.10,
    tags: ['no cook', 'quick', 'high protein', 'budget', 'meal prep'],
    lastUpdated: '2026-04-18',
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'rec_egg_fried_rice',
    name: 'High-Protein Egg Fried Rice',
    emoji: '🍳',
    description: 'Budget-friendly fried rice loaded with eggs and broccoli — better macros than hawker centre.',
    servings: 2,
    prepMins: 5,
    cookMins: 15,
    category: 'Budget Meal',
    cuisine: 'Local',
    compatibleWith: ['vegetarian', 'halal'],
    ingredients: [
      { ingredientId: 'ing_jasmine_rice',  quantity: 0.006, note: '~180g cooked (use day-old rice)' },
      { ingredientId: 'ing_eggs_10',       quantity: 0.4,   note: '4 eggs, beaten' },
      { ingredientId: 'ing_broccoli',      quantity: 0.4,   note: '140g, finely chopped' },
      { ingredientId: 'ing_light_soy_sauce',quantity: 0.1,  note: '2 tsp' },
      { ingredientId: 'ing_sesame_oil',    quantity: 0.02,  note: '½ tsp' },
    ],
    steps: [
      'Use day-old refrigerated rice (or fresh rice spread and dried for 1 hour) — this prevents clumping.',
      'Heat a wok or non-stick pan on high heat with a little oil.',
      'Add beaten eggs and scramble until just set. Push to the side of the pan.',
      'Add chopped broccoli, stir-fry 2–3 min.',
      'Add rice, breaking up any clumps. Stir-fry on high heat for 3–4 min until grains are separate.',
      'Season with soy sauce and sesame oil. Toss everything together and serve.',
    ],
    macrosPerServing: {
      calories: 360,
      protein:  18,
      carbs:    52,
      fat:      10,
      fibre:     4,
    },
    costPerServing: 2.50,
    tags: ['budget', 'vegetarian', 'quick', 'meal prep', 'high carb'],
    lastUpdated: '2026-04-18',
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'rec_overnight_oats',
    name: 'Overnight Oats with Banana',
    emoji: '🌙',
    description: 'Meal-prep breakfast — mix the night before and grab it from the fridge in the morning.',
    servings: 1,
    prepMins: 5,
    cookMins: 0,
    category: 'Meal Prep',
    cuisine: 'Western',
    compatibleWith: ['vegetarian', 'halal'],
    ingredients: [
      { ingredientId: 'ing_rolled_oats',   quantity: 0.06, note: '30g dry oats' },
      { ingredientId: 'ing_whole_milk',    quantity: 0.1,  note: '100ml' },
      { ingredientId: 'ing_greek_yogurt',  quantity: 0.1,  note: '50g (2 tbsp)' },
      { ingredientId: 'ing_banana',        quantity: 1,    note: '1 banana, sliced' },
    ],
    steps: [
      'Combine oats, milk, and yogurt in a jar or container. Stir well.',
      'Slice half the banana and stir in; reserve the rest for topping.',
      'Seal and refrigerate overnight (at least 6 hours).',
      'In the morning, top with remaining banana slices. Eat cold or microwave 1 min for a warm version.',
    ],
    macrosPerServing: {
      calories: 330,
      protein:  14,
      carbs:    52,
      fat:       7,
      fibre:     6,
    },
    costPerServing: 2.20,
    tags: ['breakfast', 'meal prep', 'no cook', 'vegetarian', 'quick', 'freezer friendly'],
    lastUpdated: '2026-04-18',
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'rec_tofu_veggie_stir_fry',
    name: 'Tofu & Veggie Stir Fry',
    emoji: '🥦',
    description: 'Plant-based, high-protein stir fry with silken tofu and broccoli over rice.',
    servings: 2,
    prepMins: 10,
    cookMins: 15,
    category: 'Vegetarian',
    cuisine: 'Local',
    compatibleWith: ['vegan', 'vegetarian', 'halal', 'gluten_free'],
    ingredients: [
      { ingredientId: 'ing_silken_tofu',    quantity: 2,    note: '2 packs (600g), cut into cubes' },
      { ingredientId: 'ing_broccoli',       quantity: 1,    note: '350g, cut into florets' },
      { ingredientId: 'ing_light_soy_sauce',quantity: 0.1,  note: '2 tsp' },
      { ingredientId: 'ing_sesame_oil',     quantity: 0.02, note: '½ tsp' },
      { ingredientId: 'ing_jasmine_rice',   quantity: 0.004,note: '~120g cooked (optional)' },
    ],
    steps: [
      'Press tofu between paper towels for 5 min to remove excess moisture, then cube.',
      'Pan-fry tofu cubes in a lightly oiled pan over medium-high heat until golden on each side (~4 min per side). Set aside.',
      'In the same pan, stir-fry broccoli on high heat for 3–4 min until tender-crisp.',
      'Return tofu to the pan. Add soy sauce and sesame oil, toss to coat.',
      'Serve over steamed jasmine rice.',
    ],
    macrosPerServing: {
      calories: 280,
      protein:  18,
      carbs:    28,
      fat:      10,
      fibre:     6,
    },
    costPerServing: 3.60,
    tags: ['vegan', 'vegetarian', 'gluten free', 'high protein', 'budget', 'quick'],
    lastUpdated: '2026-04-18',
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'rec_chickpea_sweet_potato_bowl',
    name: 'Chickpea & Sweet Potato Bowl',
    emoji: '🍠',
    description: 'Filling plant-based bowl with roasted sweet potato, chickpeas, spinach and yogurt.',
    servings: 2,
    prepMins: 10,
    cookMins: 25,
    category: 'Vegetarian',
    cuisine: 'Mediterranean',
    compatibleWith: ['vegetarian', 'gluten_free', 'halal'],
    ingredients: [
      { ingredientId: 'ing_sweet_potato',   quantity: 1,    note: '500g, peeled and cubed' },
      { ingredientId: 'ing_canned_chickpeas',quantity: 1,   note: '1 can, drained and rinsed' },
      { ingredientId: 'ing_baby_spinach',   quantity: 1,    note: '120g (1 bag)' },
      { ingredientId: 'ing_greek_yogurt',   quantity: 0.1,  note: '50g as dressing' },
      { ingredientId: 'ing_light_soy_sauce',quantity: 0.05, note: '1 tsp' },
    ],
    steps: [
      'Preheat oven to 200°C. Toss sweet potato cubes and chickpeas with a little oil and seasoning.',
      'Spread on a baking tray and roast for 22–25 min until sweet potato is tender and chickpeas are crispy.',
      'Arrange fresh spinach in bowls. Top with warm sweet potato and chickpeas.',
      'Thin yogurt with a dash of soy sauce and drizzle over the bowl.',
    ],
    macrosPerServing: {
      calories: 350,
      protein:  16,
      carbs:    58,
      fat:       5,
      fibre:    12,
    },
    costPerServing: 4.10,
    tags: ['vegetarian', 'gluten free', 'meal prep', 'high fibre', 'budget'],
    lastUpdated: '2026-04-18',
  },

];


// ─── Tier 3: Macro food reference database ────────────────────────────────────
//
// Source: Singapore Health Promotion Board (HPB) My Healthy Plate / Nutrient
// Composition of Foods database, cross-referenced with USDA FoodData Central.
// All values are per standard single serving as served in Singapore hawkers.

export const SG_MACRO_FOODS: SGMacroFood[] = [

  // ── Rice dishes ─────────────────────────────────────────────────────────────
  {
    id: 'macro_chicken_rice_steamed',
    name: 'Hainanese Chicken Rice (Steamed)',
    emoji: '🍗',
    aliases: ['chicken rice', 'steamed chicken rice', 'hainanese chicken rice', 'white chicken rice'],
    calories: 447, protein: 30, carbs: 54, fat: 10, fibre: 1, sodium: 920,
    servingG: 380, servingNote: '1 plate with rice (~380g)',
    typicalPriceSgd: 4.50,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['halal', 'gluten_free', 'lactose_free'],
  },
  {
    id: 'macro_chicken_rice_roasted',
    name: 'Roasted Chicken Rice',
    emoji: '🍗',
    aliases: ['roasted chicken rice', 'char siu chicken rice', 'roast chicken'],
    calories: 490, protein: 32, carbs: 54, fat: 13, fibre: 1, sodium: 980,
    servingG: 400, servingNote: '1 plate with rice (~400g)',
    typicalPriceSgd: 4.80,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['gluten_free', 'lactose_free'],
  },
  {
    id: 'macro_char_siew_rice',
    name: 'Char Siew Rice',
    emoji: '🍖',
    aliases: ['char siew rice', 'bbq pork rice', 'char siu rice'],
    calories: 548, protein: 27, carbs: 62, fat: 18, fibre: 1, sodium: 860,
    servingG: 400, servingNote: '1 plate with rice (~400g)',
    typicalPriceSgd: 4.50,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['lactose_free'],
  },
  {
    id: 'macro_duck_rice',
    name: 'Braised Duck Rice',
    emoji: '🦆',
    aliases: ['duck rice', 'braised duck', 'lor duck rice'],
    calories: 565, protein: 31, carbs: 60, fat: 19, fibre: 1, sodium: 1020,
    servingG: 420, servingNote: '1 plate with rice (~420g)',
    typicalPriceSgd: 5.00,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['gluten_free', 'lactose_free'],
  },
  {
    id: 'macro_economic_rice_2sides',
    name: 'Economic Rice (2 sides)',
    emoji: '🍱',
    aliases: ['economy rice', 'economic rice', 'mixed rice', 'cai fan', 'caifan'],
    calories: 480, protein: 20, carbs: 65, fat: 13, fibre: 2, sodium: 760,
    servingG: 380, servingNote: '1 plate: rice + 1 veg + 1 meat',
    typicalPriceSgd: 4.00,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['halal', 'lactose_free'],
  },

  // ── Noodle dishes ────────────────────────────────────────────────────────────
  {
    id: 'macro_char_kway_teow',
    name: 'Char Kway Teow',
    emoji: '🍜',
    aliases: ['char kway teow', 'char koay teow', 'ckw', 'fried flat noodles', 'ckt'],
    calories: 660, protein: 20, carbs: 82, fat: 26, fibre: 2, sodium: 1480,
    servingG: 350, servingNote: '1 plate (~350g)',
    typicalPriceSgd: 5.00,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['lactose_free'],
  },
  {
    id: 'macro_bak_chor_mee',
    name: 'Bak Chor Mee',
    emoji: '🍝',
    aliases: ['bak chor mee', 'minced pork noodles', 'bcm', 'mince noodles'],
    calories: 460, protein: 24, carbs: 58, fat: 12, fibre: 2, sodium: 940,
    servingG: 350, servingNote: '1 bowl (~350g)',
    typicalPriceSgd: 5.00,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['lactose_free'],
  },
  {
    id: 'macro_wonton_mee',
    name: 'Wonton Mee',
    emoji: '🥟',
    aliases: ['wonton mee', 'wanton mee', 'wonton noodles', 'wan ton mee'],
    calories: 438, protein: 21, carbs: 56, fat: 12, fibre: 2, sodium: 980,
    servingG: 320, servingNote: '1 bowl dry (~320g)',
    typicalPriceSgd: 4.50,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['lactose_free'],
  },
  {
    id: 'macro_fishball_noodles',
    name: 'Fishball Noodles (Soup)',
    emoji: '🐟',
    aliases: ['fishball noodles', 'fish ball noodles', 'fishball soup noodles', 'mee pok fishball'],
    calories: 382, protein: 19, carbs: 60, fat: 6, fibre: 2, sodium: 1080,
    servingG: 400, servingNote: '1 bowl with soup (~400g)',
    typicalPriceSgd: 4.50,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['lactose_free'],
  },
  {
    id: 'macro_mee_goreng',
    name: 'Mee Goreng',
    emoji: '🍜',
    aliases: ['mee goreng', 'mi goreng', 'fried noodles malay'],
    calories: 520, protein: 18, carbs: 72, fat: 16, fibre: 3, sodium: 1200,
    servingG: 360, servingNote: '1 plate (~360g)',
    typicalPriceSgd: 4.50,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['halal', 'lactose_free'],
  },
  {
    id: 'macro_mee_siam',
    name: 'Mee Siam',
    emoji: '🍜',
    aliases: ['mee siam', 'mee siam wet', 'mee siam dry'],
    calories: 438, protein: 17, carbs: 68, fat: 10, fibre: 3, sodium: 1100,
    servingG: 380, servingNote: '1 bowl (~380g)',
    typicalPriceSgd: 4.00,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['halal', 'lactose_free'],
  },
  {
    id: 'macro_prawn_noodles',
    name: 'Prawn Noodles (Soup)',
    emoji: '🦐',
    aliases: ['prawn noodles', 'har mee', 'prawn mee', 'hae mee'],
    calories: 420, protein: 24, carbs: 58, fat: 8, fibre: 2, sodium: 1320,
    servingG: 420, servingNote: '1 bowl with soup (~420g)',
    typicalPriceSgd: 5.00,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['lactose_free'],
  },
  {
    id: 'macro_ban_mian',
    name: 'Ban Mian (Hand-Made Noodles)',
    emoji: '🍜',
    aliases: ['ban mian', 'ban meen', 'handmade noodles', 'you mian'],
    calories: 452, protein: 26, carbs: 60, fat: 9, fibre: 2, sodium: 860,
    servingG: 400, servingNote: '1 bowl with soup and egg (~400g)',
    typicalPriceSgd: 5.50,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['lactose_free'],
  },
  {
    id: 'macro_economy_beehoon',
    name: 'Economy Bee Hoon (2 sides)',
    emoji: '🍱',
    aliases: ['economy bee hoon', 'economic bee hoon', 'mee hoon caifan', 'fried bee hoon'],
    calories: 398, protein: 14, carbs: 62, fat: 10, fibre: 2, sodium: 680,
    servingG: 320, servingNote: '1 plate: bee hoon + 2 sides',
    typicalPriceSgd: 3.50,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['halal', 'lactose_free'],
  },

  // ── Malay / Indian ───────────────────────────────────────────────────────────
  {
    id: 'macro_nasi_lemak',
    name: 'Nasi Lemak (with egg & sambal)',
    emoji: '🍛',
    aliases: ['nasi lemak', 'coconut rice', 'fragrant rice', 'nasi lemak set'],
    calories: 700, protein: 21, carbs: 82, fat: 28, fibre: 3, sodium: 860,
    servingG: 420, servingNote: '1 set: rice + egg + sambal + peanuts + ikan bilis',
    typicalPriceSgd: 4.00,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['halal', 'lactose_free', 'gluten_free'],
  },
  {
    id: 'macro_laksa',
    name: 'Laksa',
    emoji: '🥣',
    aliases: ['laksa', 'curry laksa', 'coconut laksa', 'laksa lemak'],
    calories: 580, protein: 24, carbs: 66, fat: 22, fibre: 3, sodium: 1460,
    servingG: 450, servingNote: '1 bowl (~450g)',
    typicalPriceSgd: 5.50,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['halal', 'lactose_free'],
  },
  {
    id: 'macro_roti_prata_plain',
    name: 'Roti Prata (Plain)',
    emoji: '🫓',
    aliases: ['roti prata', 'prata plain', 'plain prata', 'roti canai'],
    calories: 280, protein: 7, carbs: 40, fat: 10, fibre: 1, sodium: 360,
    servingG: 120, servingNote: '1 piece (~120g) with curry dip',
    typicalPriceSgd: 1.30,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['halal', 'vegetarian'],
  },
  {
    id: 'macro_roti_prata_egg',
    name: 'Roti Prata (Egg)',
    emoji: '🫓',
    aliases: ['egg prata', 'prata egg', 'roti prata egg'],
    calories: 355, protein: 13, carbs: 41, fat: 15, fibre: 1, sodium: 480,
    servingG: 150, servingNote: '1 piece with egg (~150g) with curry dip',
    typicalPriceSgd: 1.80,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['halal', 'vegetarian'],
  },
  {
    id: 'macro_thosai',
    name: 'Thosai (Plain)',
    emoji: '🫓',
    aliases: ['thosai', 'dosai', 'dosa', 'plain thosai'],
    calories: 195, protein: 6, carbs: 36, fat: 3, fibre: 2, sodium: 240,
    servingG: 100, servingNote: '1 piece (~100g) with sambar and chutney',
    typicalPriceSgd: 1.20,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['halal', 'vegetarian', 'vegan', 'lactose_free', 'gluten_free'],
  },

  // ── Hawker snacks ────────────────────────────────────────────────────────────
  {
    id: 'macro_carrot_cake_white',
    name: 'White Carrot Cake (Chai Tow Kway)',
    emoji: '🥚',
    aliases: ['white carrot cake', 'chai tow kway', 'chai tow kway white', 'radish cake white'],
    calories: 420, protein: 14, carbs: 52, fat: 16, fibre: 2, sodium: 780,
    servingG: 280, servingNote: '1 plate (~280g)',
    typicalPriceSgd: 4.00,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['vegetarian', 'lactose_free'],
  },
  {
    id: 'macro_carrot_cake_black',
    name: 'Black Carrot Cake (Chai Tow Kway)',
    emoji: '🥚',
    aliases: ['black carrot cake', 'black chai tow kway', 'radish cake black', 'dark carrot cake'],
    calories: 462, protein: 15, carbs: 58, fat: 17, fibre: 2, sodium: 920,
    servingG: 290, servingNote: '1 plate (~290g)',
    typicalPriceSgd: 4.00,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['vegetarian', 'lactose_free'],
  },
  {
    id: 'macro_oyster_omelette',
    name: 'Oyster Omelette (Or Luak)',
    emoji: '🦪',
    aliases: ['oyster omelette', 'or luak', 'oyster egg', 'orh luak'],
    calories: 540, protein: 19, carbs: 48, fat: 26, fibre: 1, sodium: 860,
    servingG: 300, servingNote: '1 plate (~300g)',
    typicalPriceSgd: 5.50,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['lactose_free', 'gluten_free'],
  },
  {
    id: 'macro_satay_chicken',
    name: 'Satay (Chicken, per stick)',
    emoji: '🍢',
    aliases: ['satay', 'chicken satay', 'satay chicken', 'sate'],
    calories: 52, protein: 5, carbs: 3, fat: 2, fibre: 0, sodium: 110,
    servingG: 30, servingNote: '1 stick (~30g marinated meat) with peanut sauce',
    typicalPriceSgd: 0.80,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['halal', 'gluten_free', 'lactose_free'],
  },
  {
    id: 'macro_popiah',
    name: 'Popiah (Fresh Spring Roll)',
    emoji: '🌯',
    aliases: ['popiah', 'spring roll fresh', 'fresh popiah'],
    calories: 195, protein: 8, carbs: 28, fat: 5, fibre: 3, sodium: 480,
    servingG: 120, servingNote: '1 roll (~120g)',
    typicalPriceSgd: 1.50,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['vegetarian', 'lactose_free'],
  },

  // ── Desserts & drinks ────────────────────────────────────────────────────────
  {
    id: 'macro_tau_huay',
    name: 'Tau Huay (Soft Tofu Dessert)',
    emoji: '⬜',
    aliases: ['tau huay', 'tau foo fah', 'tofu pudding', 'soya tofu dessert', 'tau hway'],
    calories: 145, protein: 8, carbs: 22, fat: 2, fibre: 0, sodium: 20,
    servingG: 250, servingNote: '1 bowl (~250g)',
    typicalPriceSgd: 1.50,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['vegetarian', 'vegan', 'gluten_free', 'lactose_free', 'halal'],
  },
  {
    id: 'macro_ice_kachang',
    name: 'Ice Kachang',
    emoji: '🍧',
    aliases: ['ice kachang', 'ice kachang', 'ais kacang', 'shaved ice dessert'],
    calories: 258, protein: 4, carbs: 58, fat: 1, fibre: 2, sodium: 40,
    servingG: 280, servingNote: '1 bowl (~280g)',
    typicalPriceSgd: 3.00,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['vegetarian', 'vegan', 'gluten_free', 'lactose_free', 'halal'],
  },
  {
    id: 'macro_teh_tarik',
    name: 'Teh Tarik (Pulled Milk Tea)',
    emoji: '🍵',
    aliases: ['teh tarik', 'pulled tea', 'milk tea sg', 'teh'],
    calories: 112, protein: 4, carbs: 18, fat: 3, fibre: 0, sodium: 60,
    servingG: 250, servingNote: '1 cup (250ml)',
    typicalPriceSgd: 1.50,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['halal', 'vegetarian'],
  },
  {
    id: 'macro_kopi_o',
    name: 'Kopi O (Black Coffee, no sugar)',
    emoji: '☕',
    aliases: ['kopi o', 'kopi o kosong', 'black coffee sg', 'local black coffee'],
    calories: 22, protein: 1, carbs: 4, fat: 0, fibre: 0, sodium: 10,
    servingG: 200, servingNote: '1 cup (200ml)',
    typicalPriceSgd: 1.10,
    source: 'hpb', verified: true, lastVerified: '2026-04-18',
    dietTags: ['halal', 'vegetarian', 'vegan', 'gluten_free', 'lactose_free', 'keto'],
  },
  {
    id: 'macro_milo_dinosaur',
    name: 'Milo Dinosaur',
    emoji: '🥤',
    aliases: ['milo dinosaur', 'milo dino', 'milo iced', 'milo powder'],
    calories: 285, protein: 7, carbs: 48, fat: 7, fibre: 1, sodium: 120,
    servingG: 350, servingNote: '1 cup with extra Milo powder (~350ml)',
    typicalPriceSgd: 3.50,
    source: 'community', verified: false, lastVerified: '2026-04-18',
    dietTags: ['halal', 'vegetarian'],
  },

  // ── Fish / seafood ───────────────────────────────────────────────────────────
  {
    id: 'macro_fish_and_chips',
    name: 'Fish & Chips (Hawker Style)',
    emoji: '🐟',
    aliases: ['fish and chips', 'fish n chips', 'fried fish chips', 'western fish'],
    calories: 625, protein: 29, carbs: 68, fat: 24, fibre: 3, sodium: 980,
    servingG: 380, servingNote: '1 set: battered fish + chips',
    typicalPriceSgd: 7.00,
    source: 'community', verified: false, lastVerified: '2026-04-18',
    dietTags: ['lactose_free'],
  },
];


// ─── Tier 2: Hawker centres & local food courts ───────────────────────────────
//
// These places appear in GPS results but have no official nutrition data.
// Menu items are populated from SG_MACRO_FOODS via `macroDbRef`.
// All items have confidence: 'estimated' and source: 'hpb'.
// GPS fuzzy matching uses `aliases` — keep these lowercase and exhaustive.

const SG_HAWKER_PLACES: SGRestaurant[] = [

  // ── Maxwell Food Centre ──────────────────────────────────────────────────────
  {
    id: 'maxwell_fc',
    name: 'Maxwell Food Centre',
    emoji: '🍗',
    cuisine: 'Local & Hawker',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'estimated_menu',
    aliases: ['maxwell food centre', 'maxwell food center', 'maxwell hawker', 'maxwell road food centre'],
    dietTags: ['halal', 'lactose_free'],
    priceRange: '$',
    lastUpdated: '2026-04-18',
    menu: [
      { id: 'mxfc_chicken_rice', name: 'Tian Tian Chicken Rice', emoji: '🍗', price: 5.00,
        calories: 447, protein: 30, carbs: 54, fat: 10, category: 'Rice',
        compatibleWith: ['halal', 'gluten_free', 'lactose_free'], isPopular: true,
        macroDbRef: 'macro_chicken_rice_steamed', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'mxfc_char_kway_teow', name: 'Char Kway Teow', emoji: '🍜', price: 5.00,
        calories: 660, protein: 20, carbs: 82, fat: 26, category: 'Noodles',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_char_kway_teow', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'mxfc_carrot_cake_white', name: 'White Carrot Cake', emoji: '🥚', price: 4.00,
        calories: 420, protein: 14, carbs: 52, fat: 16, category: 'Snacks',
        compatibleWith: ['vegetarian', 'lactose_free'],
        macroDbRef: 'macro_carrot_cake_white', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'mxfc_carrot_cake_black', name: 'Black Carrot Cake', emoji: '🥚', price: 4.00,
        calories: 462, protein: 15, carbs: 58, fat: 17, category: 'Snacks',
        compatibleWith: ['vegetarian', 'lactose_free'],
        macroDbRef: 'macro_carrot_cake_black', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'mxfc_popiah', name: 'Fresh Popiah', emoji: '🌯', price: 1.50,
        calories: 195, protein: 8, carbs: 28, fat: 5, category: 'Snacks',
        compatibleWith: ['vegetarian', 'lactose_free'],
        macroDbRef: 'macro_popiah', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'mxfc_wonton_mee', name: 'Wonton Mee', emoji: '🥟', price: 4.50,
        calories: 438, protein: 21, carbs: 56, fat: 12, category: 'Noodles',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_wonton_mee', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
    ],
  },

  // ── Lau Pa Sat (Telok Ayer) ──────────────────────────────────────────────────
  {
    id: 'lau_pa_sat',
    name: 'Lau Pa Sat Festival Market',
    emoji: '🏛️',
    cuisine: 'Local & Hawker',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'estimated_menu',
    aliases: ['lau pa sat', 'lau pa sat festival', 'telok ayer market', 'lps', 'lau pasat'],
    dietTags: ['halal', 'lactose_free'],
    priceRange: '$',
    lastUpdated: '2026-04-18',
    menu: [
      { id: 'lps_satay_chicken', name: 'Satay (Chicken, per 10 sticks)', emoji: '🍢', price: 8.00,
        calories: 520, protein: 50, carbs: 30, fat: 20, category: 'Satay',
        compatibleWith: ['halal', 'gluten_free', 'lactose_free'], isPopular: true,
        macroDbRef: 'macro_satay_chicken', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'lps_oyster_omelette', name: 'Oyster Omelette', emoji: '🦪', price: 6.00,
        calories: 540, protein: 19, carbs: 48, fat: 26, category: 'Hawker Classics',
        compatibleWith: ['lactose_free', 'gluten_free'],
        macroDbRef: 'macro_oyster_omelette', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'lps_char_kway_teow', name: 'Char Kway Teow', emoji: '🍜', price: 5.50,
        calories: 660, protein: 20, carbs: 82, fat: 26, category: 'Noodles',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_char_kway_teow', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'lps_laksa', name: 'Laksa', emoji: '🥣', price: 5.50,
        calories: 580, protein: 24, carbs: 66, fat: 22, category: 'Noodles',
        compatibleWith: ['halal', 'lactose_free'], isPopular: true,
        macroDbRef: 'macro_laksa', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'lps_economic_rice', name: 'Economic Rice (2 sides)', emoji: '🍱', price: 4.50,
        calories: 480, protein: 20, carbs: 65, fat: 13, category: 'Rice',
        compatibleWith: ['halal', 'lactose_free'],
        macroDbRef: 'macro_economic_rice_2sides', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
    ],
  },

  // ── Newton Food Centre ────────────────────────────────────────────────────────
  {
    id: 'newton_fc',
    name: 'Newton Food Centre',
    emoji: '🌃',
    cuisine: 'Local & Hawker',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'estimated_menu',
    aliases: ['newton food centre', 'newton hawker', 'newton circus', 'newton food center'],
    dietTags: ['halal', 'lactose_free'],
    priceRange: '$$',
    lastUpdated: '2026-04-18',
    menu: [
      { id: 'nfc_satay_chicken', name: 'Satay (Chicken, per 10 sticks)', emoji: '🍢', price: 10.00,
        calories: 520, protein: 50, carbs: 30, fat: 20, category: 'Satay',
        compatibleWith: ['halal', 'gluten_free', 'lactose_free'], isPopular: true,
        macroDbRef: 'macro_satay_chicken', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'nfc_oyster_omelette', name: 'Oyster Omelette', emoji: '🦪', price: 8.00,
        calories: 540, protein: 19, carbs: 48, fat: 26, category: 'Hawker Classics',
        compatibleWith: ['lactose_free', 'gluten_free'], isPopular: true,
        macroDbRef: 'macro_oyster_omelette', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'nfc_prawn_noodles', name: 'Prawn Noodles (Soup)', emoji: '🦐', price: 7.00,
        calories: 420, protein: 24, carbs: 58, fat: 8, category: 'Noodles',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_prawn_noodles', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'nfc_char_kway_teow', name: 'Char Kway Teow', emoji: '🍜', price: 6.00,
        calories: 660, protein: 20, carbs: 82, fat: 26, category: 'Noodles',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_char_kway_teow', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'nfc_ice_kachang', name: 'Ice Kachang', emoji: '🍧', price: 3.50,
        calories: 258, protein: 4, carbs: 58, fat: 1, category: 'Desserts',
        compatibleWith: ['vegetarian', 'vegan', 'halal', 'lactose_free'],
        macroDbRef: 'macro_ice_kachang', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
    ],
  },

  // ── Chinatown Complex Food Centre ─────────────────────────────────────────────
  {
    id: 'chinatown_complex_fc',
    name: 'Chinatown Complex Food Centre',
    emoji: '🏮',
    cuisine: 'Local & Hawker',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'estimated_menu',
    aliases: ['chinatown complex', 'chinatown food centre', 'chinatown complex hawker', 'smith street food centre'],
    dietTags: ['lactose_free'],
    priceRange: '$',
    lastUpdated: '2026-04-18',
    menu: [
      { id: 'ctfc_char_siew_rice', name: 'Char Siew Rice', emoji: '🍖', price: 4.50,
        calories: 548, protein: 27, carbs: 62, fat: 18, category: 'Rice',
        compatibleWith: ['lactose_free'], isPopular: true,
        macroDbRef: 'macro_char_siew_rice', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'ctfc_wonton_mee', name: 'Wonton Mee', emoji: '🥟', price: 4.50,
        calories: 438, protein: 21, carbs: 56, fat: 12, category: 'Noodles',
        compatibleWith: ['lactose_free'], isPopular: true,
        macroDbRef: 'macro_wonton_mee', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'ctfc_duck_rice', name: 'Braised Duck Rice', emoji: '🦆', price: 5.00,
        calories: 565, protein: 31, carbs: 60, fat: 19, category: 'Rice',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_duck_rice', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'ctfc_bak_chor_mee', name: 'Bak Chor Mee', emoji: '🍝', price: 5.00,
        calories: 460, protein: 24, carbs: 58, fat: 12, category: 'Noodles',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_bak_chor_mee', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'ctfc_tau_huay', name: 'Tau Huay', emoji: '⬜', price: 1.50,
        calories: 145, protein: 8, carbs: 22, fat: 2, category: 'Desserts',
        compatibleWith: ['vegetarian', 'vegan', 'halal', 'gluten_free', 'lactose_free'],
        macroDbRef: 'macro_tau_huay', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
    ],
  },

  // ── Tekka Market (Serangoon Road / Little India) ───────────────────────────
  {
    id: 'tekka_market',
    name: 'Tekka Market',
    emoji: '🇮🇳',
    cuisine: 'Indian & Malay',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'estimated_menu',
    aliases: ['tekka market', 'tekka centre', 'serangoon road market', 'little india market', 'buffalo road market'],
    dietTags: ['halal', 'vegetarian', 'lactose_free'],
    priceRange: '$',
    lastUpdated: '2026-04-18',
    menu: [
      { id: 'tekka_roti_prata_plain', name: 'Roti Prata (Plain)', emoji: '🫓', price: 1.30,
        calories: 280, protein: 7, carbs: 40, fat: 10, category: 'Indian Breads',
        compatibleWith: ['halal', 'vegetarian'], isPopular: true,
        macroDbRef: 'macro_roti_prata_plain', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'tekka_roti_prata_egg', name: 'Roti Prata (Egg)', emoji: '🫓', price: 1.80,
        calories: 355, protein: 13, carbs: 41, fat: 15, category: 'Indian Breads',
        compatibleWith: ['halal', 'vegetarian'], isPopular: true,
        macroDbRef: 'macro_roti_prata_egg', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'tekka_thosai', name: 'Thosai (Plain)', emoji: '🫓', price: 1.20,
        calories: 195, protein: 6, carbs: 36, fat: 3, category: 'Indian Breads',
        compatibleWith: ['halal', 'vegetarian', 'vegan', 'gluten_free', 'lactose_free'],
        macroDbRef: 'macro_thosai', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'tekka_nasi_lemak', name: 'Nasi Lemak Set', emoji: '🍛', price: 4.00,
        calories: 700, protein: 21, carbs: 82, fat: 28, category: 'Rice',
        compatibleWith: ['halal', 'gluten_free', 'lactose_free'],
        macroDbRef: 'macro_nasi_lemak', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'tekka_mee_goreng', name: 'Mee Goreng', emoji: '🍜', price: 4.50,
        calories: 520, protein: 18, carbs: 72, fat: 16, category: 'Noodles',
        compatibleWith: ['halal', 'lactose_free'],
        macroDbRef: 'macro_mee_goreng', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'tekka_teh_tarik', name: 'Teh Tarik', emoji: '🍵', price: 1.50,
        calories: 112, protein: 4, carbs: 18, fat: 3, category: 'Drinks',
        compatibleWith: ['halal', 'vegetarian'],
        macroDbRef: 'macro_teh_tarik', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
    ],
  },

  // ── Old Airport Road Food Centre ──────────────────────────────────────────────
  {
    id: 'old_airport_road_fc',
    name: 'Old Airport Road Food Centre',
    emoji: '✈️',
    cuisine: 'Local & Hawker',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'estimated_menu',
    aliases: ['old airport road food centre', 'old airport road hawker', 'oar food centre', 'oran hawker'],
    dietTags: ['lactose_free'],
    priceRange: '$',
    lastUpdated: '2026-04-18',
    menu: [
      { id: 'oar_char_kway_teow', name: 'Char Kway Teow', emoji: '🍜', price: 5.00,
        calories: 660, protein: 20, carbs: 82, fat: 26, category: 'Noodles',
        compatibleWith: ['lactose_free'], isPopular: true,
        macroDbRef: 'macro_char_kway_teow', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'oar_fishball_noodles', name: 'Fishball Noodles', emoji: '🐟', price: 4.50,
        calories: 382, protein: 19, carbs: 60, fat: 6, category: 'Noodles',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_fishball_noodles', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'oar_prawn_noodles', name: 'Prawn Noodles (Soup)', emoji: '🦐', price: 5.00,
        calories: 420, protein: 24, carbs: 58, fat: 8, category: 'Noodles',
        compatibleWith: ['lactose_free'], isPopular: true,
        macroDbRef: 'macro_prawn_noodles', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'oar_popiah', name: 'Fresh Popiah', emoji: '🌯', price: 1.60,
        calories: 195, protein: 8, carbs: 28, fat: 5, category: 'Snacks',
        compatibleWith: ['vegetarian', 'lactose_free'],
        macroDbRef: 'macro_popiah', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'oar_economic_rice', name: 'Economic Rice (2 sides)', emoji: '🍱', price: 4.00,
        calories: 480, protein: 20, carbs: 65, fat: 13, category: 'Rice',
        compatibleWith: ['halal', 'lactose_free'],
        macroDbRef: 'macro_economic_rice_2sides', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
    ],
  },

  // ── Amoy Street Food Centre ───────────────────────────────────────────────────
  {
    id: 'amoy_street_fc',
    name: 'Amoy Street Food Centre',
    emoji: '🏙️',
    cuisine: 'Local & Hawker',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'estimated_menu',
    aliases: ['amoy street food centre', 'amoy street hawker', 'amoy hawker', 'amoy street', 'telok ayer hawker'],
    dietTags: ['lactose_free'],
    priceRange: '$',
    lastUpdated: '2026-04-18',
    menu: [
      { id: 'asfc_ban_mian', name: 'Ban Mian', emoji: '🍜', price: 5.50,
        calories: 452, protein: 26, carbs: 60, fat: 9, category: 'Noodles',
        compatibleWith: ['lactose_free'], isPopular: true,
        macroDbRef: 'macro_ban_mian', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'asfc_fishball_noodles', name: 'Fishball Noodles', emoji: '🐟', price: 4.50,
        calories: 382, protein: 19, carbs: 60, fat: 6, category: 'Noodles',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_fishball_noodles', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'asfc_economic_rice', name: 'Economic Rice (2 sides)', emoji: '🍱', price: 4.00,
        calories: 480, protein: 20, carbs: 65, fat: 13, category: 'Rice',
        compatibleWith: ['halal', 'lactose_free'],
        macroDbRef: 'macro_economic_rice_2sides', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'asfc_char_siew_rice', name: 'Char Siew Rice', emoji: '🍖', price: 4.50,
        calories: 548, protein: 27, carbs: 62, fat: 18, category: 'Rice',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_char_siew_rice', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'asfc_economy_beehoon', name: 'Economy Bee Hoon (2 sides)', emoji: '🍱', price: 3.50,
        calories: 398, protein: 14, carbs: 62, fat: 10, category: 'Noodles',
        compatibleWith: ['halal', 'lactose_free'],
        macroDbRef: 'macro_economy_beehoon', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
    ],
  },

  // ── Hong Lim Food Centre ──────────────────────────────────────────────────────
  {
    id: 'hong_lim_fc',
    name: 'Hong Lim Food Centre',
    emoji: '🏯',
    cuisine: 'Local & Hawker',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'estimated_menu',
    aliases: ['hong lim food centre', 'hong lim market', 'hong lim hawker', 'hong lim complex'],
    dietTags: ['lactose_free'],
    priceRange: '$',
    lastUpdated: '2026-04-18',
    menu: [
      { id: 'hlfc_wonton_mee', name: 'Wonton Mee', emoji: '🥟', price: 4.50,
        calories: 438, protein: 21, carbs: 56, fat: 12, category: 'Noodles',
        compatibleWith: ['lactose_free'], isPopular: true,
        macroDbRef: 'macro_wonton_mee', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'hlfc_prawn_noodles', name: 'Prawn Noodles (Soup)', emoji: '🦐', price: 5.00,
        calories: 420, protein: 24, carbs: 58, fat: 8, category: 'Noodles',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_prawn_noodles', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'hlfc_char_siew_rice', name: 'Char Siew Rice', emoji: '🍖', price: 4.50,
        calories: 548, protein: 27, carbs: 62, fat: 18, category: 'Rice',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_char_siew_rice', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'hlfc_laksa', name: 'Laksa', emoji: '🥣', price: 5.50,
        calories: 580, protein: 24, carbs: 66, fat: 22, category: 'Noodles',
        compatibleWith: ['halal', 'lactose_free'],
        macroDbRef: 'macro_laksa', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
    ],
  },

  // ── Bedok Interchange Hawker Centre ───────────────────────────────────────────
  {
    id: 'bedok_interchange_fc',
    name: 'Bedok Interchange Hawker Centre',
    emoji: '🚉',
    cuisine: 'Local & Hawker',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'estimated_menu',
    aliases: ['bedok interchange', 'bedok interchange hawker', 'bedok food centre', 'bedok interchange food centre'],
    dietTags: ['halal', 'lactose_free'],
    priceRange: '$',
    lastUpdated: '2026-04-18',
    menu: [
      { id: 'bifc_chicken_rice', name: 'Chicken Rice', emoji: '🍗', price: 4.50,
        calories: 447, protein: 30, carbs: 54, fat: 10, category: 'Rice',
        compatibleWith: ['halal', 'gluten_free', 'lactose_free'], isPopular: true,
        macroDbRef: 'macro_chicken_rice_steamed', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'bifc_mee_goreng', name: 'Mee Goreng', emoji: '🍜', price: 4.50,
        calories: 520, protein: 18, carbs: 72, fat: 16, category: 'Noodles',
        compatibleWith: ['halal', 'lactose_free'],
        macroDbRef: 'macro_mee_goreng', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'bifc_nasi_lemak', name: 'Nasi Lemak Set', emoji: '🍛', price: 4.00,
        calories: 700, protein: 21, carbs: 82, fat: 28, category: 'Rice',
        compatibleWith: ['halal', 'gluten_free', 'lactose_free'], isPopular: true,
        macroDbRef: 'macro_nasi_lemak', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'bifc_economy_beehoon', name: 'Economy Bee Hoon', emoji: '🍱', price: 3.50,
        calories: 398, protein: 14, carbs: 62, fat: 10, category: 'Noodles',
        compatibleWith: ['halal', 'lactose_free'],
        macroDbRef: 'macro_economy_beehoon', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'bifc_ban_mian', name: 'Ban Mian', emoji: '🍜', price: 5.00,
        calories: 452, protein: 26, carbs: 60, fat: 9, category: 'Noodles',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_ban_mian', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
    ],
  },

  // ── Tiong Bahru Market ────────────────────────────────────────────────────────
  {
    id: 'tiong_bahru_market',
    name: 'Tiong Bahru Market',
    emoji: '🌿',
    cuisine: 'Local & Hawker',
    serviceTypes: ['dine_in', 'grab_go'],
    tier: 'estimated_menu',
    aliases: ['tiong bahru market', 'tiong bahru hawker', 'tiong bahru food centre', 'seng poh road market'],
    dietTags: ['lactose_free'],
    priceRange: '$',
    lastUpdated: '2026-04-18',
    menu: [
      { id: 'tbm_char_kway_teow', name: 'Char Kway Teow', emoji: '🍜', price: 5.00,
        calories: 660, protein: 20, carbs: 82, fat: 26, category: 'Noodles',
        compatibleWith: ['lactose_free'], isPopular: true,
        macroDbRef: 'macro_char_kway_teow', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'tbm_bak_chor_mee', name: 'Bak Chor Mee', emoji: '🍝', price: 5.00,
        calories: 460, protein: 24, carbs: 58, fat: 12, category: 'Noodles',
        compatibleWith: ['lactose_free'],
        macroDbRef: 'macro_bak_chor_mee', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'tbm_chicken_rice', name: 'Chicken Rice', emoji: '🍗', price: 4.50,
        calories: 447, protein: 30, carbs: 54, fat: 10, category: 'Rice',
        compatibleWith: ['gluten_free', 'lactose_free'], isPopular: true,
        macroDbRef: 'macro_chicken_rice_steamed', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'tbm_laksa', name: 'Laksa', emoji: '🥣', price: 5.00,
        calories: 580, protein: 24, carbs: 66, fat: 22, category: 'Noodles',
        compatibleWith: ['halal', 'lactose_free'],
        macroDbRef: 'macro_laksa', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
      { id: 'tbm_tau_huay', name: 'Tau Huay', emoji: '⬜', price: 1.50,
        calories: 145, protein: 8, carbs: 22, fat: 2, category: 'Desserts',
        compatibleWith: ['vegetarian', 'vegan', 'halal', 'gluten_free', 'lactose_free'],
        macroDbRef: 'macro_tau_huay', confidence: 'estimated', source: 'hpb', verified: false, lastVerified: '2026-04-18' },
    ],
  },
];

// Merge hawker places into the main array so matchRestaurant() finds them
SG_RESTAURANTS.push(...SG_HAWKER_PLACES);


// ─── Helper functions ─────────────────────────────────────────────────────────

/**
 * Fuzzy-match a Google Places display name against the database.
 * Returns the first restaurant whose aliases appear in the place name.
 *
 * @example
 * matchRestaurant("McDonald's Clementi Mall")  // → McDonald's entry
 * matchRestaurant("Koufu Food Court Ang Mo Kio") // → null
 */
export function matchRestaurant(placeName: string): SGRestaurant | null {
  const lower = placeName.toLowerCase().trim();
  return (
    SG_RESTAURANTS.find(r =>
      r.aliases.some(alias => lower.includes(alias.toLowerCase()))
    ) ?? null
  );
}

/**
 * Search restaurants by name, cuisine, or alias.
 * Optionally filter to outlets that support a specific service type.
 */
export function searchRestaurants(
  query: string,
  serviceType?: ServiceType,
): SGRestaurant[] {
  const base = serviceType
    ? SG_RESTAURANTS.filter(r => r.serviceTypes.includes(serviceType))
    : SG_RESTAURANTS;

  if (!query.trim()) return base;

  const lower = query.toLowerCase();
  return base.filter(r =>
    r.name.toLowerCase().includes(lower) ||
    r.cuisine.toLowerCase().includes(lower) ||
    r.aliases.some(a => a.includes(lower))
  );
}

/**
 * Search individual menu items across all (or service-type-filtered) restaurants.
 * Returns flat list of { restaurant, item } pairs sorted by relevance
 * (name match ranked above description/category match).
 */
export function searchMenuItems(
  query: string,
  serviceType?: ServiceType,
): MenuItemSearchResult[] {
  if (!query.trim()) return [];

  const lower = query.toLowerCase();
  const results: MenuItemSearchResult[] = [];

  SG_RESTAURANTS
    .filter(r => serviceType === undefined || r.serviceTypes.includes(serviceType))
    .forEach(restaurant => {
      restaurant.menu.forEach(item => {
        const nameMatch = item.name.toLowerCase().includes(lower);
        const catMatch  = item.category.toLowerCase().includes(lower);
        const descMatch = item.description?.toLowerCase().includes(lower) ?? false;
        if (nameMatch || catMatch || descMatch) {
          results.push({ restaurant, item });
        }
      });
    });

  // Name matches first, then category/description matches
  return results.sort((a, b) => {
    const aName = a.item.name.toLowerCase().includes(lower) ? 0 : 1;
    const bName = b.item.name.toLowerCase().includes(lower) ? 0 : 1;
    return aName - bName;
  });
}

/**
 * Combined search: returns matching restaurants AND matching menu items.
 * Used for the unified search bar on the Eat page.
 * Pass serviceType to restrict to outlets supporting that mode (optional).
 */
export function searchAll(
  query: string,
  serviceType?: ServiceType,
): { restaurants: SGRestaurant[]; items: MenuItemSearchResult[] } {
  return {
    restaurants: searchRestaurants(query, serviceType),
    items:       searchMenuItems(query, serviceType),
  };
}

/**
 * Search recipes by name, tag, cuisine, or description.
 */
export function searchRecipes(query: string): SGRecipe[] {
  if (!query.trim()) return SG_RECIPES;

  const lower = query.toLowerCase();
  return SG_RECIPES.filter(r =>
    r.name.toLowerCase().includes(lower) ||
    r.description.toLowerCase().includes(lower) ||
    r.cuisine.toLowerCase().includes(lower) ||
    r.category.toLowerCase().includes(lower) ||
    r.tags.some(t => t.toLowerCase().includes(lower))
  );
}

/**
 * Resolve a recipe's ingredient list into full SGIngredient objects.
 * Returns null for any ingredient ID not found in SG_INGREDIENTS.
 */
export function resolveIngredients(
  recipe: SGRecipe,
): { ingredient: SGIngredient | null; quantity: number; note?: string }[] {
  return recipe.ingredients.map(ri => ({
    ingredient: SG_INGREDIENTS.find(i => i.id === ri.ingredientId) ?? null,
    quantity:   ri.quantity,
    note:       ri.note,
  }));
}

/**
 * Calculate actual cost per serving from resolved ingredients.
 * Returns null if any ingredient is missing from the database.
 */
export function calcCostPerServing(recipe: SGRecipe): number | null {
  const resolved = resolveIngredients(recipe);
  if (resolved.some(r => r.ingredient === null)) return null;
  const total = resolved.reduce(
    (sum, r) => sum + (r.ingredient!.price * r.quantity),
    0,
  );
  return Math.round((total / recipe.servings) * 100) / 100;
}

/**
 * Filter restaurants by dietary flags.
 * Returns restaurants where ALL of the user's flags are in `dietTags`.
 */
export function filterByDiet(
  restaurants: SGRestaurant[],
  userFlags: DietaryFlag[],
): SGRestaurant[] {
  if (!userFlags.length) return restaurants;
  return restaurants.filter(r =>
    userFlags.every(f => r.dietTags.includes(f))
  );
}

/**
 * Filter menu items by dietary flags.
 * Returns items where ALL of the user's flags are in `compatibleWith`.
 */
export function filterItemsByDiet(
  items: SGMenuItem[],
  userFlags: DietaryFlag[],
): SGMenuItem[] {
  if (!userFlags.length) return items;
  return items.filter(i =>
    userFlags.every(f => i.compatibleWith.includes(f))
  );
}

/**
 * Get unique menu categories for a restaurant (preserving menu order).
 * Used to render the category tab bar in the expanded menu panel.
 */
export function getMenuCategories(restaurant: SGRestaurant): string[] {
  return Array.from(new Set(restaurant.menu.map(i => i.category)));
}

/**
 * Score how well a menu item fills the user's remaining macro targets.
 * Returns 0–1 (higher = better match).
 * Protein is weighted most heavily since it's typically the hardest to hit.
 */
export function macroMatchScore(
  item: Pick<SGMenuItem, 'protein' | 'calories' | 'carbs'>,
  remaining: { protein: number; calories: number; carbs: number },
): number {
  const p = remaining.protein  > 0 ? Math.min(item.protein  / remaining.protein,  1) : 0;
  const c = remaining.calories > 0 ? Math.min(item.calories / remaining.calories, 1) : 0;
  const b = remaining.carbs    > 0 ? Math.min(item.carbs    / remaining.carbs,    1) : 0;
  return p * 0.55 + c * 0.30 + b * 0.15;
}

/**
 * Protein-per-dollar value (g / SGD), rounded to 1 decimal.
 * Higher = better value for protein.
 */
export function proteinPerDollar(protein: number, price: number): number {
  if (price <= 0) return 0;
  return Math.round((protein / price) * 10) / 10;
}

/**
 * Colour-code the Protein/$ value.
 * Green ≥ 6 g/$, Yellow 3–6 g/$, Red < 3 g/$
 */
export function ppdColor(value: number): string {
  if (value >= 6) return '#00E676';
  if (value >= 3) return '#FFD166';
  return '#FF5A5A';
}

/**
 * Look up a macro food reference entry by ID.
 * Used to resolve SGMenuItem.macroDbRef for tier 2 estimated menu items.
 */
export function getMacroFood(id: string): SGMacroFood | undefined {
  return SG_MACRO_FOODS.find(f => f.id === id);
}

/**
 * Search SG_MACRO_FOODS by name / alias.
 * Returns ranked results (alias match > name contains).
 */
export function searchMacroFoods(query: string): SGMacroFood[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];
  return SG_MACRO_FOODS.filter(f =>
    f.aliases.some(a => a.includes(lower)) ||
    f.name.toLowerCase().includes(lower)
  );
}
