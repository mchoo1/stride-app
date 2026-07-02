'use client';
/**
 * MapView — Leaflet map loaded from CDN (no npm package required).
 * Renders restaurant pins on a CartoDB light basemap.
 * Import via Next.js dynamic() with ssr:false.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { proteinPerDollar, ppdColor, type SGRestaurant, type SGMenuItem } from '@/lib/sgFoodDb';

/* ── Types ── */
export interface MapPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** DB restaurant — has menu data */
  restaurant?: SGRestaurant;
  /** Distance from search center */
  distKm?: number;
  /** Data quality tier for pin color */
  tier: 'approved' | 'menu' | 'gps_only';
}

interface Props {
  pins: MapPin[];
  centerLat: number;
  centerLng: number;
  /** True when coords are from real GPS (use close zoom), false = default SG center (overview zoom) */
  hasGPS?: boolean;
  onSearchArea: (lat: number, lng: number) => void;
  onSelectRestaurant: (restaurant: SGRestaurant) => void;
}

/* ── Design tokens (mirrors eat/page) ── */
const GREEN  = '#1E7F5C';
const BLUE   = '#2E6FB8';
const GRAY   = '#8B95A7';
const BORDER = '#E5E9F2';
const CARD   = '#FFFFFF';
const FG1    = '#0F1B2D';
const FG2    = '#5B6576';
const FG3    = '#8B95A7';
const AMBER  = '#C98A2E';

const PIN_COLOR: Record<MapPin['tier'], string> = {
  approved: GREEN,
  menu:     BLUE,
  gps_only: GRAY,
};

/* ── Load Leaflet from CDN once ── */
let leafletReady: Promise<void> | null = null;
function loadLeaflet(): Promise<void> {
  if (leafletReady) return leafletReady;
  leafletReady = new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(); return; }
    if ((window as any).L) { resolve(); return; }

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
  return leafletReady;
}

/* ── Pin SVG divIcon HTML ── */
function pinHtml(initial: string, color: string, selected = false): string {
  const size  = selected ? 40 : 32;
  const ring  = selected ? `box-shadow:0 0 0 3px ${color}40,0 3px 12px rgba(0,0,0,0.22);` : 'box-shadow:0 2px 8px rgba(0,0,0,0.18);';
  return `<div style="
    width:${size}px;height:${size}px;border-radius:50%;
    background:${color};border:2.5px solid white;
    display:flex;align-items:center;justify-content:center;
    font-size:${selected ? 15 : 12}px;font-weight:700;color:white;
    ${ring} cursor:pointer; transition:all .15s;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  ">${initial}</div>`;
}

/* ── Mini restaurant panel ── */
function RestaurantPanel({ restaurant, distKm, onViewMenu, onClose }: {
  restaurant: SGRestaurant;
  distKm?: number;
  onViewMenu: () => void;
  onClose: () => void;
}) {
  const topItems = restaurant.menu.filter(i => i.isPopular).slice(0, 3);
  if (topItems.length === 0) topItems.push(...restaurant.menu.slice(0, 3));

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: CARD, borderRadius: '18px 18px 0 0',
      boxShadow: '0 -2px 20px rgba(15,27,45,0.12)',
      padding: '12px 0 max(20px, env(safe-area-inset-bottom)) 0',
      animation: 'slideUp .22s ease',
    }}>
      <style>{`@keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }`}</style>

      {/* Handle */}
      <div style={{ width: 36, height: 4, background: '#DDE0E8', borderRadius: 2, margin: '0 auto 14px' }} />

      <div style={{ padding: '0 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: FG1, marginBottom: 2, letterSpacing: '-0.01em' }}>
              {restaurant.name}
            </div>
            <div style={{ fontSize: 12, color: FG2 }}>
              {restaurant.cuisine}
              {restaurant.priceRange ? ` · ${restaurant.priceRange}` : ''}
              {distKm !== undefined ? ` · ${distKm < 1 ? `${(distKm * 1000).toFixed(0)}m` : `${distKm.toFixed(1)}km`}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: '50%', border: `1px solid ${BORDER}`,
            background: '#F7F8FB', color: FG3, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12,
          }}>✕</button>
        </div>

        {/* Top items */}
        {topItems.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {topItems.map(item => {
              const ppd  = item.price ? proteinPerDollar(item.protein, item.price) : 0;
              const ppdC = ppdColor(ppd);
              return (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: `1px solid ${BORDER}`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: FG1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11, color: FG3, marginTop: 2 }}>
                      {item.calories} cal · {item.protein}g protein
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                    {item.price && ppd > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: `${ppdC}14`, color: ppdC }}>
                        {ppd}g/$
                      </span>
                    )}
                    {item.price != null && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>${item.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View menu CTA */}
        <button onClick={onViewMenu} style={{
          width: '100%', padding: '13px', borderRadius: 12, border: 'none',
          background: FG1, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          letterSpacing: '-0.01em',
        }}>
          View full menu — {restaurant.menu.length} items
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════ MapView ════════════════════════════════════ */
export default function MapView({ pins, centerLat, centerLng, hasGPS = false, onSearchArea, onSelectRestaurant }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const markersRef   = useRef<Map<string, any>>(new Map());
  const [ready,      setReady]      = useState(false);
  const [selected,   setSelected]   = useState<MapPin | null>(null);
  const [showSearchBtn, setShowSearchBtn] = useState(false);
  const searchCenterRef = useRef<{ lat: number; lng: number }>({ lat: centerLat, lng: centerLng });

  // ── Init map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then(() => {
      if (cancelled || !containerRef.current) return;
      const L = (window as any).L;
      if (mapRef.current) return; // already inited

      const map = L.map(containerRef.current, {
        center: [centerLat, centerLng],
        zoom: 12,           // 12 = whole-Singapore overview; bumps to 15 when GPS granted
        zoomControl: false,
        attributionControl: true,
      });

      // CartoDB light tiles — clean, professional
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd', maxZoom: 19,
        }
      ).addTo(map);

      // Zoom control — top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Current location marker (blue pulsing dot)
      if (centerLat && centerLng) {
        L.circleMarker([centerLat, centerLng], {
          radius: 7, color: '#fff', weight: 2.5,
          fillColor: BLUE, fillOpacity: 1,
        }).addTo(map).bindTooltip('You are here', { permanent: false });
      }

      // Detect significant pan → show "Search this area"
      map.on('moveend', () => {
        const c = map.getCenter();
        const dist = distanceBetween(
          c.lat, c.lng,
          searchCenterRef.current.lat,
          searchCenterRef.current.lng,
        );
        setShowSearchBtn(dist > 0.4);
      });

      mapRef.current = map;
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-center when centerLat/lng changes ─────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !centerLat || !centerLng) return;
    // Zoom to street level only when we have a real GPS fix; keep overview otherwise
    const zoom = hasGPS ? 15 : 12;
    mapRef.current.setView([centerLat, centerLng], zoom, { animate: true });
    searchCenterRef.current = { lat: centerLat, lng: centerLng };
    setShowSearchBtn(false);
  }, [centerLat, centerLng]);

  // ── Sync markers with pins array ─────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const L   = (window as any).L;
    const map = mapRef.current;

    // Remove old markers not in current pins
    const currentIds = new Set(pins.map(p => p.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) { map.removeLayer(marker); markersRef.current.delete(id); }
    });

    // Add / update markers
    pins.forEach(pin => {
      if (!pin.lat || !pin.lng) return;
      const color   = PIN_COLOR[pin.tier];
      const initial = pin.name.charAt(0).toUpperCase();
      const isSelected = selected?.id === pin.id;

      if (markersRef.current.has(pin.id)) {
        // Update icon for selection state
        const existing = markersRef.current.get(pin.id);
        existing.setIcon(L.divIcon({
          html: pinHtml(initial, color, isSelected),
          className: '', iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
          iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
        }));
        return;
      }

      const marker = L.marker([pin.lat, pin.lng], {
        icon: L.divIcon({
          html: pinHtml(initial, color, false),
          className: '', iconSize: [32, 32], iconAnchor: [16, 16],
        }),
      });

      marker.on('click', () => {
        setSelected(prev => prev?.id === pin.id ? null : pin);
        if (pin.restaurant) onSelectRestaurant(pin.restaurant);
      });

      marker.addTo(map);
      markersRef.current.set(pin.id, marker);
    });
  }, [ready, pins, selected, onSelectRestaurant]);

  // ── Handle "Search this area" ─────────────────────────────────────────────
  const handleSearchArea = useCallback(() => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter();
    searchCenterRef.current = { lat: c.lat, lng: c.lng };
    setShowSearchBtn(false);
    onSearchArea(c.lat, c.lng);
  }, [onSearchArea]);

  const selectedPin = selected;
  const selectedRestaurant = selectedPin?.restaurant ?? null;

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100dvh - 310px)', minHeight: 320 }}>
      {/* Map container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Search this area button */}
      {showSearchBtn && (
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 900 }}>
          <button onClick={handleSearchArea} style={{
            padding: '9px 18px', borderRadius: 22,
            background: CARD, border: `1px solid ${BORDER}`,
            fontSize: 13, fontWeight: 700, color: FG1,
            boxShadow: '0 2px 12px rgba(15,27,45,0.14)',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            Search this area
          </button>
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute', top: 12, right: 52, zIndex: 900,
        background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 10, padding: '8px 10px',
        boxShadow: '0 1px 8px rgba(15,27,45,0.10)',
      }}>
        {[
          { color: GREEN, label: 'Stride Approved' },
          { color: BLUE,  label: 'Menu available'  },
          { color: GRAY,  label: 'Nearby (no menu)'},
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: FG2, whiteSpace: 'nowrap' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Restaurant panel */}
      {selectedRestaurant && selectedPin && (
        <RestaurantPanel
          restaurant={selectedRestaurant}
          distKm={selectedPin.distKm}
          onViewMenu={() => {
            onSelectRestaurant(selectedRestaurant);
            setSelected(null);
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/* ── Haversine distance (km) ─────────────────────────────────────────────── */
function distanceBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R   = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a   = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
