import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.FOURSQUARE_API_KEY;

// ─── In-memory cache ────────────────────────────────────────────────────────
// Rounds lat/lng to 2 decimal places (~1 km grid) so nearby requests reuse
// the same cached result. TTL: 10 minutes per bucket.
interface CacheEntry { data: unknown; expires: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function cacheKey(lat: number, lng: number, mode: string) {
  const rLat = Math.round(lat * 100) / 100;
  const rLng = Math.round(lng * 100) / 100;
  return `${rLat},${rLng},${mode}`;
}
// ────────────────────────────────────────────────────────────────────────────

// Haversine distance in km
function distKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// Foursquare category IDs
// Food: 13065 Restaurant, 13032 Café, 13145 Fast Food, 13338 Bakery, 13306 Food Truck
// Activity: 18021 Gym/Fitness, 16032 Park, 18022 Yoga Studio, 18025 Swimming Pool, 18027 Sports Club
const FOOD_CATEGORIES     = '13065,13032,13145,13338,13306';
const ACTIVITY_CATEGORIES = '18021,16032,18022,18025,18027';

// Map Foursquare category IDs → emoji
const CATEGORY_EMOJI: Record<number, string> = {
  13065: '🍽️',  // Restaurant
  13032: '☕',   // Café
  13145: '🍔',  // Fast Food
  13338: '🥐',  // Bakery
  13306: '🚚',  // Food Truck
  18021: '🏋️', // Gym
  16032: '🌳',  // Park
  18022: '🧘',  // Yoga Studio
  18025: '🏊',  // Swimming Pool
  18027: '⚽',  // Sports Club
};

const PRICE_LABEL: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalise(p: any, userLat: number, userLng: number, mode: string) {
  const pLat = p.geocodes?.main?.latitude  ?? userLat;
  const pLng = p.geocodes?.main?.longitude ?? userLng;
  const km   = p.distance != null ? p.distance / 1000 : distKm(userLat, userLng, pLat, pLng);

  const openNow = p.hours?.open_now;
  const hours   = openNow === true ? 'Open now' : openNow === false ? 'Closed now' : 'Hours unknown';

  const primaryCategory = p.categories?.[0];
  const emoji = primaryCategory ? (CATEGORY_EMOJI[primaryCategory.id] ?? (mode === 'food' ? '🍽️' : '⚡')) : (mode === 'food' ? '🍽️' : '⚡');
  const type  = primaryCategory?.name ?? (mode === 'food' ? 'Restaurant' : 'Fitness');

  // Google Maps deep link — free, works on all devices
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' Singapore')}`;

  return {
    id:         p.fsq_id ?? Math.random().toString(),
    name:       p.name   ?? 'Unknown',
    type,
    distance:   fmtDist(km),
    distKm:     km,
    lat:        pLat,
    lng:        pLng,
    rating:     p.rating != null ? Math.round((p.rating / 10) * 5 * 10) / 10 : null, // convert 0–10 → 0–5
    priceLevel: p.price != null ? PRICE_LABEL[p.price] ?? null : null,
    hours,
    emoji,
    mapsUrl,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat  = parseFloat(searchParams.get('lat')  ?? '');
  const lng  = parseFloat(searchParams.get('lng')  ?? '');
  const mode = searchParams.get('type') ?? 'food'; // 'food' | 'activity'

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  // Return cached result if still fresh
  const key    = cacheKey(lat, lng, mode);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'FOURSQUARE_API_KEY is not configured' },
      { status: 503 },
    );
  }

  const categories = mode === 'activity' ? ACTIVITY_CATEGORIES : FOOD_CATEGORIES;
  const fields     = 'fsq_id,name,geocodes,categories,distance,rating,price,hours';

  const url = new URL('https://api.foursquare.com/v3/places/search');
  url.searchParams.set('ll',         `${lat},${lng}`);
  url.searchParams.set('radius',     '2000');
  url.searchParams.set('categories', categories);
  url.searchParams.set('limit',      '12');
  url.searchParams.set('sort',       'distance');
  url.searchParams.set('fields',     fields);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': API_KEY,
        'Accept':        'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data   = await res.json();
    const places = (data.results ?? [])
      .map((p: unknown) => normalise(p, lat, lng, mode))
      .sort((a: { distKm: number }, b: { distKm: number }) => a.distKm - b.distKm);

    const result = { places };
    cache.set(key, { data: result, expires: Date.now() + CACHE_TTL_MS });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
