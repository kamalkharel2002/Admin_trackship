'use client';
// components/hub/HubModal.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Loader2, AlertCircle, MousePointerClick, MapPin, Phone } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import s from './HubModal.module.css';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const BHUTAN = [90.4336, 27.5142];

async function reverseGeocode(lng, lat) {
  if (!TOKEN) return '';
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?access_token=${TOKEN}&types=address,poi,neighborhood,locality,place&limit=1&language=en`
    );
    const f = (await res.json())?.features?.[0];
    if (!f) return '';
    const ctx = f.context?.find(c => c.id.startsWith('locality') || c.id.startsWith('place'));
    return ctx ? `${f.text}, ${ctx.text}` : f.place_name?.split(',').slice(0, 2).join(',').trim() ?? f.text ?? '';
  } catch { return ''; }
}

async function forwardGeocode(query) {
  if (!TOKEN || query.length < 2) return [];
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${TOKEN}&proximity=${BHUTAN[0]},${BHUTAN[1]}` +
      `&types=address,poi,neighborhood,locality,place,district&limit=7&language=en`
    );
    return (await res.json())?.features?.map(f => ({
      id: f.id, name: f.text ?? f.place_name,
      place: f.place_name, lng: f.center[0], lat: f.center[1],
    })) ?? [];
  } catch { return []; }
}

const PIN_HTML = `<div><div class="mpick" style="
  width:28px;height:28px;background:linear-gradient(135deg,#F5B700,#F97316);
  border-radius:50% 50% 50% 2px;transform:rotate(-45deg);border:3px solid #fff;
  box-shadow:0 4px 14px rgba(245,183,0,0.5);transition:transform 0.2s;
"></div></div>`;

export default function HubModal({ hub = null, coordinators = [], onClose, onSubmit, onRefreshCoordinators }) {
  useEffect(() => {
    if (onRefreshCoordinators) {
      onRefreshCoordinators();
    }
  }, [onRefreshCoordinators]);
  
  const isEdit = !!hub;

  const existingCoordIds = (hub?.coordinators ?? [])
    .map(c => typeof c === 'string' ? c : (c.user_id ?? c.id ?? ''))
    .filter(Boolean);

  const [form, setForm] = useState({
    name: hub?.name ?? '',
    region: hub?.region ?? '',
    coordinator_ids: existingCoordIds,
  });
  const [lat, setLat] = useState(hub?.latitude || null);
  const [lng, setLng] = useState(hub?.longitude || null);
  const [pinned, setPinned] = useState(!!hub?.latitude);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [suggs, setSuggs] = useState([]);
  const [searching, setSearching] = useState(false);

  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const readyRef = useRef(false);
  const debRef = useRef(null);

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Place pin on map ─────────────────────────────────────────────────────
  const placePin = useCallback((mapboxgl, map, lo, la) => {
    if (markerRef.current) {
      markerRef.current.setLngLat([lo, la]);
    } else {
      const el = document.createElement('div');
      el.innerHTML = PIN_HTML;
      markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lo, la]).addTo(map);
    }
  }, []);

  // ── Init map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !TOKEN) return;
    import('mapbox-gl').then(({ default: mapboxgl }) => {
      mapboxgl.accessToken = TOKEN;
      containerRef.current.innerHTML = '';
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: lat && lng ? [lng, lat] : BHUTAN,
        zoom: lat && lng ? 13 : 7.5,
        antialias: true,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
      map.on('load', () => {
        readyRef.current = true;
        map.resize();
        if (lat && lng) placePin(mapboxgl, map, lng, lat);
        map.on('click', async (e) => {
          const lo = parseFloat(e.lngLat.lng.toFixed(6));
          const la = parseFloat(e.lngLat.lat.toFixed(6));
          setLat(la); setLng(lo); setPinned(true);
          placePin(mapboxgl, map, lo, la);
          const place = await reverseGeocode(lo, la);
          if (place) sf('region', place);
        });
      });
      mapRef.current = map;
    });
    return () => {
      readyRef.current = false; markerRef.current = null;
      mapRef.current?.remove(); mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flyTo = useCallback((lo, la) => {
    if (!mapRef.current || !readyRef.current) return;
    import('mapbox-gl').then(({ default: mapboxgl }) => {
      mapRef.current.flyTo({ center: [lo, la], zoom: 14, speed: 1.4 });
      placePin(mapboxgl, mapRef.current, lo, la);
    });
  }, [placePin]);

  // ── Debounced search ─────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(debRef.current);
    if (!query.trim()) { setSuggs([]); return; }
    debRef.current = setTimeout(async () => {
      setSearching(true);
      setSuggs(await forwardGeocode(query));
      setSearching(false);
    }, 320);
    return () => clearTimeout(debRef.current);
  }, [query]);

  const pickSugg = (sg) => {
    const lo = parseFloat(sg.lng.toFixed(6));
    const la = parseFloat(sg.lat.toFixed(6));
    setLat(la); setLng(lo); setPinned(true);
    flyTo(lo, la); sf('region', sg.name);
    setQuery(''); setSuggs([]);
  };

const toggleCoord = (id) => {
  sf('coordinator_ids',
    form.coordinator_ids.includes(id)
      ? form.coordinator_ids.filter(x => x !== id)
      : [...form.coordinator_ids, id]
  );
};

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('Hub name is required.');
    if (!form.region.trim()) return setError('Region is required.');
    if (!lat || !lng) return setError('Please pin the hub location on the map.');
    setLoading(true); setError(null);
    try {
      await onSubmit({
        name: form.name.trim(), region: form.region.trim(),
        latitude: lat, longitude: lng, coordinator_ids: form.coordinator_ids
      }, hub?.id ?? null);
    } catch (err) {
      setError(err.message ?? 'Something went wrong.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div className={s.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>

        <div className={s.modalHeader}>
          <div>
            <div className={s.modalTitle}>{isEdit ? 'Edit Hub' : 'Add New Hub'}</div>
            <div className={s.modalSub}>
              {isEdit ? `Updating: ${hub.name}` : 'Fill details and pin location on map'}
            </div>
          </div>
          <button className={s.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={s.body}>

          {/* Hub Details */}
          <div className={s.sectionLabel}>Hub Details</div>
          <div className={s.fieldRow}>
            <div className={s.field}>
              <label className={s.label}>Hub Name</label>
              <input className={s.input} placeholder="e.g. Thimphu Hub"
                value={form.name} onChange={e => sf('name', e.target.value)} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Region / Area</label>
              <input className={s.input} placeholder="Auto-filled from map pin"
                value={form.region} onChange={e => sf('region', e.target.value)} />
            </div>
          </div>

          {/* Location */}
          <div className={s.sectionLabel}>Pin Location</div>
          <div className={s.field}>
            <label className={s.label}>Search Location</label>
            <div className={s.searchWrap}>
              <Search size={15} className={s.searchIcon} />
              <input className={s.searchInput}
                placeholder="e.g. Mothithang, Thimphu or Paro Dzong…"
                value={query} onChange={e => setQuery(e.target.value)} autoComplete="off" />
              {(suggs.length > 0 || searching) && (
                <div className={s.suggestions}>
                  {searching ? (
                    <div className={s.searchLoading}>
                      <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Searching…
                    </div>
                  ) : suggs.map(sg => (
                    <div key={sg.id} className={s.suggestion} onClick={() => pickSugg(sg)}>
                      <div className={s.suggestionIcon}><MapPin size={13} color="var(--accent-blue)" /></div>
                      <div className={s.suggestionText}>
                        <div className={s.suggestionName}>{sg.name}</div>
                        <div className={s.suggestionPlace}>{sg.place}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={s.mapSection}>
            <div className={s.mapHint}>
              <MousePointerClick size={12} /> Click the map to drop a pin — region auto-fills
            </div>
            <div className={`${s.mapPickerWrap} ${pinned ? s.pinned : ''}`}>
              {TOKEN
                ? <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
                : <div className={s.noToken}>Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local</div>
              }
            </div>
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

          {/* ── Coordinators Section ── */}
<div className={s.sectionLabel}>
  Hub Coordinators
  {form.coordinator_ids.length > 0 && (
    <span className={s.selectedBadge}>{form.coordinator_ids.length} selected</span>
  )}
</div>

<div className={s.field}>
  {coordinators.length === 0 ? (
    <div className={s.noCoords}>No coordinators available from server</div>
  ) : (
    <div className={s.coordChips}>
      {coordinators.map(c => {
        const active = form.coordinator_ids.includes(c.id);
        return (
          <button 
            key={c.id} 
            type="button"
            className={`${s.chip} ${active ? s.chipActive : ''}`}
            onClick={() => toggleCoord(c.id)}
          >
            <span className={s.chipAvatar}>
              {c.name.charAt(0).toUpperCase()}
            </span>
            <span className={s.chipBody}>
              <span className={s.chipName}>{c.name}</span>
              {c.phone && (
                <span className={s.chipPhone}>
                  <Phone size={9} strokeWidth={2} /> {c.phone}
                </span>
              )}
            </span>
            {active && <span className={s.chipTick}>✓</span>}
          </button>
        );
      })}
    </div>
  )}
</div>

          {error && <div className={s.formError}><AlertCircle size={13} /> {error}</div>}

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