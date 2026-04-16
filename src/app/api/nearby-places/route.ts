import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

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

// Google Places "New" API types
const FOOD_TYPES  = ['restaurant', 'cafe', 'fast_food_restaurant', 'meal_takeaway', 'bakery', 'bar_and_grill'];
const PLACE_TYPES = ['gym', 'park', 'swimming_pool', 'yoga_studio', 'sports_club', 'stadium', 'sports_complex', 'fitness_center'];

const TYPE_EMOJI: Record<string, string> = {
  restaurant: '🍽️', cafe: '☕', fast_food_restaurant: '🍔',
  meal_takeaway: '🥡', bakery: '🥐', bar_and_grill: '🍖',
  gym: '🏋️', park: '🌳', swimming_pool: '🏊',
  yoga_studio: '🧘', sports_club: '⚽', stadium: '🏟️',
  sports_complex: '🏟️', fitness_center: '🏃',
};

const PRICE: Record<string, string> = {
  PRICE_LEVEL_FREE: 'Free',
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalise(p: any, userLat: number, userLng: number, mode: string) {
  const pLat = p.location?.latitude  ?? userLat;
  const pLng = p.location?.longitude ?? userLng;
  const km   = distKm(userLat, userLng, pLat, pLng);

  const openNow = p.currentOpeningHours?.openNow;
  const hours   = openNow === true ? 'Open now' : openNow === false ? 'Closed now' : 'Hours unknown';

  const primaryType = p.primaryType ?? '';
  const emoji       = TYPE_EMOJI[primaryType] ?? (mode === 'food' ? '🍽️' : '⚡');

  return {
    id:         p.googleMapsUri ?? p.displayName?.text ?? Math.random().toString(),
    name:       p.displayName?.text ?? 'Unknown',
    type:       primaryType.replace(/_/g, ' '),
    distance:   fmtDist(km),
    distKm:     km,
    rating:     p.rating         ?? null,
    priceLevel: PRICE[p.priceLevel] ?? null,
    hours,
    emoji,
    mapsUrl:    p.googleMapsUri  ?? `https://maps.google.com/?q=${encodeURIComponent(p.displayName?.text ?? '')}`,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat  = parseFloat(searchParams.get('lat')  ?? '');
  const lng  = parseFloat(searchParams.get('lng')  ?? '');
  const mode = searchParams.get('type') ?? 'food';   // 'food' | 'activity'

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'GOOGLE_PLACES_API_KEY is not configured' },
      { status: 503 },
    );
  }

  const includedTypes = mode === 'activity' ? PLACE_TYPES : FOOD_TYPES;

  const body = {
    includedTypes,
    maxResultCount: 12,
    rankPreference:  'DISTANCE',
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 2000,
      },
    },
  };

  const fieldMask = [
    'places.displayName',
    'places.location',
    'places.rating',
    'places.priceLevel',
    'places.currentOpeningHours',
    'places.primaryType',
    'places.googleMapsUri',
  ].join(',');

  try {
    const res = await fetch(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        method:  'POST',
        headers: {
          'Content-Type':    'application/json',
          'X-Goog-Api-Key':  API_KEY,
          'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    const places = (data.places ?? [])
      .map((p: unknown) => normalise(p, lat, lng, mode))
      .sort((a: { distKm: number }, b: { distKm: number }) => a.distKm - b.distKm);

    return NextResponse.json({ places });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
