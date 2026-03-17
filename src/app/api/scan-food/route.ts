import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const USDA_API_KEY = process.env.USDA_API_KEY ?? 'DEMO_KEY';
const USDA_SEARCH  = 'https://api.nal.usda.gov/fdc/v1/foods/search';

/* ─────────────────────────────────────────────────────────────
   USDA lookup — returns per-100g macros for the best match
───────────────────────────────────────────────────────────── */
interface UsdaFood {
  fdcId: number;
  description: string;
  foodNutrients: Array<{ nutrientId: number; nutrientName: string; value: number; unitName: string }>;
  servingSize?: number;
  servingSizeUnit?: string;
}

interface UsdaMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  per100g: boolean;
  source: string;
}

async function lookupUsda(foodName: string): Promise<UsdaMacros | null> {
  try {
    const url = `${USDA_SEARCH}?query=${encodeURIComponent(foodName)}&dataType=SR%20Legacy,Foundation,Survey%20(FNDDS)&pageSize=3&api_key=${USDA_API_KEY}`;
    const res  = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    const food: UsdaFood | undefined = data.foods?.[0];
    if (!food) return null;

    const n = food.foodNutrients;
    const get = (...ids: number[]) =>
      n.find((x) => ids.includes(x.nutrientId))?.value ?? 0;

    // USDA nutrient IDs:
    // 1008 = Energy (kcal), 1003 = Protein, 1005 = Carbs, 1004 = Fat
    const calories = get(1008);
    const protein  = get(1003);
    const carbs    = get(1005);
    const fat      = get(1004);

    if (!calories) return null;

    return {
      calories: Math.round(calories),
      protein:  Math.round(protein  * 10) / 10,
      carbs:    Math.round(carbs    * 10) / 10,
      fat:      Math.round(fat      * 10) / 10,
      per100g: true,
      source:  `USDA: ${food.description}`,
    };
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   FOOD EMOJI MAP — simple lookup so the emoji is always right
───────────────────────────────────────────────────────────── */
const EMOJI_MAP: Record<string, string> = {
  banana: '🍌', apple: '🍎', orange: '🍊', grape: '🍇', strawberry: '🍓',
  watermelon: '🍉', pineapple: '🍍', mango: '🥭', peach: '🍑', cherry: '🍒',
  blueberry: '🫐', pear: '🍐', lemon: '🍋', avocado: '🥑',
  chicken: '🍗', beef: '🥩', steak: '🥩', pork: '🥩', fish: '🐟', salmon: '🐟', tuna: '🐟', shrimp: '🍤',
  egg: '🥚', cheese: '🧀', milk: '🥛', yogurt: '🥛', butter: '🧈',
  rice: '🍚', pasta: '🍝', bread: '🍞', pizza: '🍕', burger: '🍔', sandwich: '🥪',
  salad: '🥗', soup: '🍲', sushi: '🍱', taco: '🌮', noodle: '🍜',
  broccoli: '🥦', carrot: '🥕', potato: '🥔', tomato: '🍅', corn: '🌽',
  spinach: '🥬', lettuce: '🥬', cucumber: '🥒', pepper: '🫑', onion: '🧅',
  oatmeal: '🥣', cereal: '🥣', granola: '🥣',
  cookie: '🍪', cake: '🎂', chocolate: '🍫', ice: '🍦', donut: '🍩',
  coffee: '☕', tea: '🍵', juice: '🧃', smoothie: '🥤', water: '💧',
  almond: '🥜', peanut: '🥜', walnut: '🥜', nut: '🥜',
  olive: '🫒', lentil: '🫘', bean: '🫘', quinoa: '🌾', tofu: '🥡',
  protein: '🧃', shake: '🧃',
};

function pickEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return '🍽️';
}

/* ─────────────────────────────────────────────────────────────
   POST /api/scan-food
───────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

    const base64Data = image.replace(/^data:image\/[a-z+]+;base64,/, '');
    const mediaType  = (image.match(/^data:(image\/[a-z+]+);base64,/)?.[1] ?? 'image/jpeg') as
      'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    /* Step 1 — Claude Haiku identifies the food (vision-only model, locked to haiku) */
    const aiResponse = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
          {
            type: 'text',
            text: `Identify the food in this image.

Respond ONLY with a JSON object — no markdown, no extra text:
{
  "name": "specific food name for USDA database lookup, e.g. 'Banana raw', 'Chicken breast grilled', 'Greek yogurt plain'",
  "displayName": "short human-friendly name, e.g. 'Banana', 'Grilled Chicken Breast'",
  "servingSize": "visual estimate of serving, e.g. '1 medium (118g)' or '150g portion'",
  "estimatedGrams": <number — best guess weight in grams>,
  "confidence": <0.0 to 1.0>,
  "fallbackCalories": <rough kcal estimate for the full serving>,
  "fallbackProtein": <grams>,
  "fallbackCarbs": <grams>,
  "fallbackFat": <grams>
}

If no food is visible, return: {"error": "No food detected"}`,
          },
        ],
      }],
    });

    const aiText   = (aiResponse.content[0] as { type: string; text: string }).text.trim();
    const aiParsed = JSON.parse(aiText);

    if (aiParsed.error) {
      return NextResponse.json({ error: aiParsed.error }, { status: 422 });
    }

    const {
      name, displayName, servingSize, estimatedGrams = 100,
      confidence, fallbackCalories, fallbackProtein, fallbackCarbs, fallbackFat,
    } = aiParsed;

    /* Step 2 — USDA lookup using the AI-generated search name */
    const usda = await lookupUsda(name);

    let calories: number, protein: number, carbs: number, fat: number, dataSource: string;

    if (usda) {
      // USDA returns per-100g — scale to estimated serving size
      const scale = estimatedGrams / 100;
      calories    = Math.round(usda.calories * scale);
      protein     = Math.round(usda.protein  * scale * 10) / 10;
      carbs       = Math.round(usda.carbs    * scale * 10) / 10;
      fat         = Math.round(usda.fat      * scale * 10) / 10;
      dataSource  = `USDA verified · ${usda.source}`;
    } else {
      // Fall back to Claude's estimates
      calories   = fallbackCalories;
      protein    = fallbackProtein;
      carbs      = fallbackCarbs;
      fat        = fallbackFat;
      dataSource = 'AI estimate (USDA not found)';
    }

    return NextResponse.json({
      name:        displayName ?? name,
      emoji:       pickEmoji(displayName ?? name),
      calories,
      protein,
      carbs,
      fat,
      servingSize,
      estimatedGrams,
      confidence,
      dataSource,
      usdaVerified: !!usda,
    });

  } catch (err: unknown) {
    console.error('Food scan error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
