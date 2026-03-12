// Vercel serverless function — POST /api/scan
// Pipeline: Clarifai food-item-recognition → USDA FoodData Central macro lookup
//
// Required environment variables (set in Vercel dashboard → Settings → Environment Variables):
//   CLARIFAI_API_KEY  Personal Access Token from clarifai.com
//   USDA_API_KEY      Free key from fdc.nal.usda.gov/api-key-signup.html

const EMOJI_MAP = {
  banana:'🍌', apple:'🍎', orange:'🍊', grape:'🍇', strawberry:'🍓',
  blueberry:'🫐', watermelon:'🍉', pineapple:'🍍', mango:'🥭', cherry:'🍒',
  chicken:'🍗', beef:'🥩', pork:'🥩', lamb:'🥩', fish:'🐟', salmon:'🐟',
  tuna:'🐡', shrimp:'🍤', egg:'🥚', cheese:'🧀', milk:'🥛', yogurt:'🥗',
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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image } = req.body || {};
  if (!image) return res.status(400).json({ error: 'No image provided' });

  const CLARIFAI_KEY = process.env.CLARIFAI_API_KEY;
  const USDA_KEY     = process.env.USDA_API_KEY;

  if (!CLARIFAI_KEY) return res.status(500).json({ error: 'CLARIFAI_API_KEY not configured' });
  if (!USDA_KEY)     return res.status(500).json({ error: 'USDA_API_KEY not configured' });

  // Step 1: Clarifai food-item-recognition
  let foodName, confidence;
  try {
    const clRes = await fetch(
      'https://api.clarifai.com/v2/users/clarifai/apps/main/models/food-item-recognition/outputs',
      {
        method: 'POST',
        headers: {
          Authorization: 'Key ' + CLARIFAI_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: [{ data: { image: { base64: image } } }],
        }),
      }
    );
    if (!clRes.ok) {
      const txt = await clRes.text();
      throw new Error('Clarifai ' + clRes.status + ': ' + txt.slice(0, 200));
    }
    const clData   = await clRes.json();
    const concepts = clData.outputs?.[0]?.data?.concepts;
    if (!concepts?.length) throw new Error('No food concepts returned by Clarifai');
    foodName   = concepts[0].name;
    confidence = concepts[0].value;
  } catch (err) {
    console.error('[scan] Clarifai error:', err.message);
    return res.status(502).json({ error: 'Food recognition failed: ' + err.message });
  }

  // Step 2: USDA FoodData Central macro lookup
  let cal = 0, p = 0, c = 0, f = 0, usdaName = null, fdcId = null;
  try {
    const usdaUrl =
      'https://api.nal.usda.gov/fdc/v1/foods/search' +
      '?api_key=' + USDA_KEY +
      '&query=' + encodeURIComponent(foodName) +
      '&dataType=Foundation,SR%20Legacy' +
      '&pageSize=5';
    const usdaRes = await fetch(usdaUrl);
    if (!usdaRes.ok) throw new Error('USDA ' + usdaRes.status);
    const usdaData = await usdaRes.json();
    const food     = usdaData.foods?.[0];
    if (food) {
      const nutrients = food.foodNutrients || [];
      const getN = (id) => {
        const n = nutrients.find(x => x.nutrientId === id);
        return n ? Math.round(n.value * 10) / 10 : 0;
      };
      p   = getN(1003);
      c   = getN(1005);
      f   = getN(1004);
      cal = Math.round(p * 4 + c * 4 + f * 9);
      usdaName = food.description;
      fdcId    = food.fdcId;
    }
  } catch (err) {
    console.warn('[scan] USDA lookup failed:', err.message);
  }

  return res.json({
    name:       usdaName || foodName,
    emoji:      pickEmoji(usdaName || foodName),
    confidence,
    cal, p, c, f,
    source:     fdcId ? 'clarifai+usda' : 'clarifai-only',
    fdcId,
  });
};
