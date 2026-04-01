'use client';
// components/hub/HubModal.jsx
// Add / Edit hub modal with:
//   • Location search (Mapbox Geocoding API) → pin flies to result
//   • Click-to-pin on map → reverse geocodes → auto-fills region field
//   • Coordinator multi-select chips
//   • Submit → createHub / updateHub

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Loader2, AlertCircle, MousePointerClick, MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';   // ← required: map renders correctly
import s from './HubModal.module.css';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const BHUTAN = [90.4336, 27.5142];

// ── Reverse geocode: [lng, lat] → place name string ─────────────────────────
async function reverseGeocode(lng, lat) {
  if (!TOKEN) return '';
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${TOKEN}&types=place,district,region&limit=1`
    );
    const data = await res.json();
    const feature = data?.features?.[0];
    return feature?.place_name?.split(',')[0] ?? '';
  } catch {
    return '';
  }
}

// ── Forward geocode: query string → [{name, place, lng, lat}] ───────────────
async function forwardGeocode(query) {
  if (!TOKEN || query.length < 2) return [];
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${TOKEN}&proximity=${BHUTAN[0]},${BHUTAN[1]}&limit=5`
    );
    const data = await res.json();
    return (data?.features ?? []).map(f => ({
      id:      f.id,
      name:    f.text ?? f.place_name,
      place:   f.place_name,
      lng:     f.center[0],
      lat:     f.center[1],
    }));
  } catch {
    return [];
  }
}

// ── Picker pin HTML ──────────────────────────────────────────────────────────
const PIN_HTML = `
  <div style="
    width:28px; height:28px;
    background:linear-gradient(135deg,#F5B700,#F97316);
    border-radius:50% 50% 50% 2px;
    transform:rotate(-45deg);
    border:3px solid white;
    box-shadow:0 4px 14px rgba(245,183,0,0.5);
  "></div>
`;

export default function HubModal({ hub = null, coordinators = [], onClose, onSubmit }) {
  const isEdit = !!hub;

  const [form, setForm] = useState({
    name:            hub?.name   ?? '',
    region:          hub?.region ?? '',
    coordinator_ids: hub?.coordinators?.map(c => c.id ?? c) ?? [],
  });
  const [lat,        setLat]       = useState(hub?.latitude  || null);
  const [lng,        setLng]       = useState(hub?.longitude || null);
  const [pinned,     setPinned]    = useState(!!hub?.latitude);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState(null);

  // Search state
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching,   setSearching]   = useState(false);

  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const debounceRef  = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Init Mapbox picker map ─────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !TOKEN) return;

    import('mapbox-gl').then(({ default: mapboxgl }) => {
      mapboxgl.accessToken = TOKEN;

      const initialCenter = lat && lng ? [lng, lat] : BHUTAN;
      const initialZoom   = lat && lng ? 12 : 7.5;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style:     'mapbox://styles/mapbox/light-v11',
        center:    initialCenter,
        zoom:      initialZoom,
        antialias: true,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      // If editing, place existing pin
      if (lat && lng) {
        const el = document.createElement('div');
        el.innerHTML = PIN_HTML;
        markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([lng, lat])
          .addTo(map);
      }

      // Click → drop pin → reverse geocode → fill region
      map.on('click', async (e) => {
        const { lng: lo, lat: la } = e.lngLat;
        setLat(parseFloat(la.toFixed(6)));
        setLng(parseFloat(lo.toFixed(6)));
        setPinned(true);

        // Move or create marker
        const el = document.createElement('div');
        el.innerHTML = PIN_HTML;

        if (markerRef.current) {
          markerRef.current.setLngLat([lo, la]);
        } else {
          markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([lo, la])
            .addTo(map);
        }

        // Auto-fill region via reverse geocode
        const place = await reverseGeocode(lo, la);
        if (place) set('region', place);
      });

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fly map to coordinates (after search pick) ─────────────────────────
  const flyTo = useCallback((lo, la) => {
    if (!mapRef.current) return;
    import('mapbox-gl').then(({ default: mapboxgl }) => {
      mapRef.current.flyTo({ center: [lo, la], zoom: 13, speed: 1.4 });

      const el = document.createElement('div');
      el.innerHTML = PIN_HTML;

      if (markerRef.current) {
        markerRef.current.setLngLat([lo, la]);
      } else {
        markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([lo, la])
          .addTo(mapRef.current);
      }
    });
  }, []);

  // ── Debounced search ───────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await forwardGeocode(query);
      setSuggestions(results);
      setSearching(false);
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ── Pick suggestion ────────────────────────────────────────────────────
  const pickSuggestion = async (s2) => {
    setLat(parseFloat(s2.lat.toFixed(6)));
    setLng(parseFloat(s2.lng.toFixed(6)));
    setPinned(true);
    flyTo(s2.lng, s2.lat);

    // Use the suggestion's primary name as region
    set('region', s2.name);

    setQuery('');
    setSuggestions([]);
  };

  // ── Coordinator toggle ─────────────────────────────────────────────────
  const toggleCoord = (id) =>
    set('coordinator_ids', form.coordinator_ids.includes(id)
      ? form.coordinator_ids.filter(x => x !== id)
      : [...form.coordinator_ids, id]
    );

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name.trim())   return setError('Hub name is required.');
    if (!form.region.trim()) return setError('Region / location is required.');
    if (!lat || !lng)        return setError('Please pin the hub location on the map.');

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name:            form.name.trim(),
        region:          form.region.trim(),
        latitude:        lat,
        longitude:       lng,
        coordinator_ids: form.coordinator_ids,
      }, hub?.id ?? null);
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div className={s.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>

        {/* ── Header ── */}
        <div className={s.modalHeader}>
          <div className={s.headerLeft}>
            <div className={s.modalTitle}>{isEdit ? 'Edit Hub' : 'Add New Hub'}</div>
            <div className={s.modalSub}>
              {isEdit
                ? `Updating: ${hub.name}`
                : 'Search or click the map to pin hub location'}
            </div>
          </div>
          <button className={s.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={s.body}>

          {/* ── Section: Hub Info ── */}
          <div className={s.sectionLabel}>Hub Details</div>

          <div className={s.fieldRow}>
            <div className={s.field}>
              <label className={s.label}>Hub Name</label>
              <input
                className={s.input}
                placeholder="e.g. Thimphu Hub"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>Region</label>
              <input
                className={s.input}
                placeholder="Auto-filled from map"
                value={form.region}
                onChange={e => set('region', e.target.value)}
              />
            </div>
          </div>

          {/* ── Section: Location ── */}
          <div className={s.sectionLabel}>Pin Location</div>

          {/* Location search box */}
          <div className={s.field}>
            <label className={s.label}>
              <Search size={11} style={{ display:'inline', marginRight:4 }} />
              Search Location
            </label>
            <div className={s.searchWrap}>
              <Search size={15} className={s.searchIcon} />
              <input
                className={s.searchInput}
                placeholder="Search a place, city or address…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoComplete="off"
              />

              {/* Dropdown suggestions */}
              {(suggestions.length > 0 || searching) && (
                <div className={s.suggestions}>
                  {searching ? (
                    <div className={s.searchLoading}>Searching…</div>
                  ) : (
                    suggestions.map(sug => (
                      <div key={sug.id} className={s.suggestion} onClick={() => pickSuggestion(sug)}>
                        <div className={s.suggestionIcon}>
                          <MapPin size={13} color="var(--accent-blue)" />
                        </div>
                        <div className={s.suggestionText}>
                          <div className={s.suggestionName}>{sug.name}</div>
                          <div className={s.suggestionPlace}>{sug.place}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Map picker */}
          <div className={s.mapSection}>
            <div className={s.mapHint}>
              <MousePointerClick size={12} />
              Click anywhere on the map to drop a pin
            </div>

            <div className={`${s.mapPickerWrap} ${pinned ? s.pinned : ''}`}>
              {TOKEN ? (
                <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
              ) : (
                <div style={{
                  height: '100%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)', fontSize: 12,
                  fontFamily: 'var(--font-body)', textAlign: 'center', padding: 16,
                }}>
                  Add <code style={{ margin: '0 4px' }}>NEXT_PUBLIC_MAPBOX_TOKEN</code> to .env.local
                </div>
              )}
            </div>

            {/* Coordinate display */}
            {lat && lng ? (
              <div className={s.coordsRow}>
                <div className={s.coordBox}>
                  <div className={s.coordLabel}>Latitude</div>
                  <div className={s.coordValue}>{lat}</div>
                </div>
                <div className={s.coordBox}>
                  <div className={s.coordLabel}>Longitude</div>
                  <div className={s.coordValue}>{lng}</div>
                </div>
              </div>
            ) : (
              <div className={s.coordEmpty}>No location pinned yet</div>
            )}
          </div>

          {/* ── Section: Coordinators ── */}
          {coordinators.length > 0 && (
            <>
              <div className={s.sectionLabel}>Coordinators</div>
              <div className={s.field}>
                <label className={s.label}>Select Coordinators (multi)</label>
                <div className={s.coordChips}>
                  {coordinators.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`${s.chip} ${form.coordinator_ids.includes(c.id) ? s.selected : ''}`}
                      onClick={() => toggleCoord(c.id)}
                    >
                      {form.coordinator_ids.includes(c.id) ? '✓ ' : ''}{c.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className={s.formError}>
              <AlertCircle size={13} /> {error}
            </div>
          )}

          {/* Footer */}
          <div className={s.footer}>
            <button className={s.btnSecondary} onClick={onClose}>Cancel</button>
            <button className={s.btnPrimary} onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                : isEdit ? 'Save Changes' : 'Add Hub'
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}