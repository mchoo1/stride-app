// Vercel serverless function — POST /api/scan
// Pipeline: Kimi 2.5 vision (food ID + macro estimate) → USDA FoodData Central (verified macros)
//
// Required environment variables (set in Vercel dashboard → Settings → Environment Variables):
//   KIMI_API_KEY   API key from platform.moonshot.cn
//   USDA_API_KEY   Free key from fdc.nal.usda.gov/api-key-signup.html
//
// Kimi 2.5 model: moonshot-v1-8k (vision-capable)
// Check platform.moonshot.cn/docs for the latest vision model name if this changes.

const EMOJI_MAP = {
  banana:'🍌', apple:'🍎', orange:'🍊', grape:'🍇', strawberry:'🍓',
  blueberry:'🫐', watermelon:'🍉', pineapple:'🍍', mango:'🥭', cherry:'🍒',
  chicken:'🍗', beef:'🥩', pork:'🥩', lamb:'🥩', fish:'🐟', salmon:'🐟',
  tuna:'🐠', shrimp:'🍤', egg:'🥚', cheese:'🧀', milk:'🥛', yogurt:'🥗',
  butter:'🧈', rice:'🍚', pasta:'🍝', noodle:'🍜', bread:'🍞', oat:'🍳',
  tortilla:'🌮', broccoli:'🥦', carrot:'🥕', spinach:'🥬', corn:'🌽',
  tomato:'🍅', potato:'🥔', lettuce:'🥬', cucumber:'🥒', avocado:'🥑',
  lemon:'🍋', coconut:'🥥', pizza:'🍕', burger:'🍔', sandwich:'🥪',
  taco:'🌮', burrito:'🌯', salad:'🥗', soup:'🍜', steak:'🥩', sushi:'🍱',
  dumpling:'🥟', chocolate:'🍫', cake:'🎂', cookie:'🍪', ice_cream:'🍦',
  donut:'🍩', waffle:'🧇', pancake:'🥞', cereal:'🥣', coffee:'☕',
  juice:'🧃', smoothie:'🥤', tea:'🍵', almond:'🥜', peanut:'🥜',
  walnut:'🥜', nut:'🥜', sweet_potato:'🍠',
};

function pickEmoji(name) {
  const n = (name || '').toLowerCase();
  for (const [key, val] of Object.entries(EMOJI_MAP)) {
    if (n.includes(key)) return val;
  }
  return '🍽️';
}

// Prompt Kimi to return structured JSON so we can parse it reliably
const KIMI_PROMPT = `You are a nutrition assistant. Analyze the food in this image and respond ONLY with a valid JSON object — no markdown, no explanation, just raw JSON.

Required format:
{
  "name": "specific food name (e.g. 'grilled chicken breast', 'bowl of white rice')",
  "confidence": 0.92,
  "estimated_macros_per_100g": {
    "calories": 165,
    "protein_g": 31.0,
    "carbs_g": 0.0,
    "fat_g": 3.6
  }
}

Rules:
- "name" must be specific and in English (not just "food" or "dish")
- "confidence" is your certainty from 0.0 to 1.0
- "estimated_macros_per_100g" are your best nutritional estimates per 100g of the food
- All numbers must be numeric (not strings)
- Do not include any text outside the JSON object`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image } = req.body || {};
  if (!image) return res.status(400).json({ error: 'No image provided' });

  const KIMI_KEY = process.env.KIMI_API_KEY;
  const USDA_KEY = process.env.USDA_API_KEY;

  if (!KIMI_KEY) return res.status(500).json({ error: 'KIMI_API_KEY not configured' });
  if (!USDA_KEY) return res.status(500).json({ error: 'USDA_API_KEY not configured' });

  // ── Step 1: Kimi 2.5 vision — food identification + fallback macro estimate ─
  let foodName, confidence;
  let kimiMacros = null; // used as fallback if USDA returns nothing

  try {
    const kimiRes = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KIMI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
              {
                type: 'text',
                text: KIMI_PROMPT,
              },
            ],
          },
        ],
        max_tokens: 256,
        temperature: 0.1, // low temperature for consistent structured output
      }),
    });

    if (!kimiRes.ok) {
      const txt = await kimiRes.text();
      throw new Error(`Kimi ${kimiRes.status}: ${txt.slice(0, 300)}`);
    }

    const kimiData = await kimiRes.json();
    const rawText  = kimiData.choices?.[0]?.message?.content;
    if (!rawText) throw new Error('Empty response from Kimi');

    // Strip any accidental markdown code fences before parsing
    const jsonText = rawText.replace(/```json?\s*/gi, '').replace(/```\s*/g, '').trim();
    const parsed   = JSON.parse(jsonText);

    foodName   = parsed.name;
    confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.8;

    // Save Kimi's macro estimates as a fallback
    const em = parsed.estimated_macros_per_100g;
    if (em && typeof em.calories === 'number') {
      kimiMacros = {
        cal: Math.round(em.calories),
        p:   Math.round((em.protein_g  || 0) * 10) / 10,
        c:   Math.round((em.carbs_g    || 0) * 10) / 10,
        f:   Math.round((em.fat_g      || 0) * 10) / 10,
      };
      // Enforce formula consistency on Kimi's estimates too
      kimiMacros.cal = Math.round(kimiMacros.p * 4 + kimiMacros.c * 4 + kimiMacros.f * 9);
    }
  } catch (err) {
    console.error('[scan] Kimi error:', err.message);
    return res.status(502).json({ error: `Food recognition failed: ${err.message}` });
  }

  // ── Step 2: USDA FoodData Central — verified macro lookup ──────────────────
  // Prefer Foundation / SR Legacy (whole foods). Falls back to Kimi estimates.
  let cal = 0, p = 0, c = 0, f = 0, usdaName = null, fdcId = null;
  try {
    const usdaUrl =
      `https://api.nal.usda.gov/fdc/v1/foods/search` +
      `?api_key=${USDA_KEY}` +
      `&query=${encodeURIComponent(foodName)}` +
      `&dataType=Foundation,SR%20Legacy` +
      `&pageSize=5`;

    const usdaRes = await fetch(usdaUrl);
    if (!usdaRes.ok) throw new Error(`USDA ${usdaRes.status}`);

    const usdaData = await usdaRes.json();
    const food     = usdaData.foods?.[0];

    if (food) {
      const nutrients = food.foodNutrients || [];
      // Nutrient IDs: 1003=Protein, 1004=Total fat, 1005=Carbohydrate, 1008=Energy
      const getN = (id) => {
        const n = nutrients.find(x => x.nutrientId === id);
        return n ? Math.round(n.value * 10) / 10 : 0;
      };

      p        = getN(1003);
      c        = getN(1005);
      f        = getN(1004);
      cal      = Math.round(p * 4 + c * 4 + f * 9); // consistent formula
      usdaName = food.description;
      fdcId    = food.fdcId;
    }
  } catch (err) {
    console.warn('[scan] USDA lookup failed:', err.message);
  }

  // Fall back to Kimi's macro estimates if USDA returned nothing
  let macroSource = 'kimi+usda';
  if (!fdcId && kimiMacros) {
    ({ cal, p, c, f } = kimiMacros);
    macroSource = 'kimi-estimated';
  } else if (!fdcId) {
    macroSource = 'kimi-only';
  }

  return res.json({
    name:       usdaName || foodName,
    emoji:      pickEmoji(usdaName || foodName),
    confidence,
    cal, p, c, f,
    source:     macroSource,
    fdcId,
  });
};
