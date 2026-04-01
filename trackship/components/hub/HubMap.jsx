'use client';
// components/hub/HubMap.jsx
// Overview map — Mapbox GL JS (vector tiles, smooth, professional)
// Shows all hubs as custom markers with rich popup cards
// Token: set NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local
// SSR-safe: loaded via dynamic() with ssr:false in parent

import { useEffect, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';   // ← required: fixes map render & controls
import s from './HubMap.module.css';

// Mapbox public token — use your own in .env.local
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Bhutan bounds to auto-fit
const BHUTAN_CENTER = [90.4336, 27.5142];

// ── HTML for custom hub marker pin ──────────────────────────────────────────
function markerHTML(name) {
  return `
    <div style="
      display:flex; flex-direction:column; align-items:center;
      cursor:pointer; filter:drop-shadow(0 4px 8px rgba(14,165,233,0.35));
    ">
      <div style="
        width:38px; height:38px;
        background:linear-gradient(135deg,#0EA5E9 0%,#1A1A2E 100%);
        border-radius:50% 50% 50% 2px;
        transform:rotate(-45deg);
        border:3px solid #fff;
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 12px rgba(14,165,233,0.4);
        transition:transform 0.2s;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             style="transform:rotate(45deg)">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div style="
        margin-top:6px;
        background:#1A1A2E;
        color:#fff;
        font-size:10px;
        font-weight:700;
        font-family:'Plus Jakarta Sans',sans-serif;
        padding:2px 8px;
        border-radius:10px;
        white-space:nowrap;
        letter-spacing:0.02em;
        max-width:120px;
        overflow:hidden;
        text-overflow:ellipsis;
      ">${name}</div>
    </div>
  `;
}

// ── Popup HTML card ──────────────────────────────────────────────────────────
function popupHTML(hub) {
  return `
    <div style="
      min-width:190px; max-width:220px;
      padding:14px 16px;
      font-family:'DM Sans',sans-serif;
    ">
      <div style="
        font-family:'Plus Jakarta Sans',sans-serif;
        font-weight:800; font-size:14px;
        color:#1A1A2E; margin-bottom:3px;
      ">${hub.name}</div>
      <div style="
        font-size:11px; color:#94A3B8;
        margin-bottom:12px;
        display:flex; align-items:center; gap:4px;
      ">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
             stroke="#94A3B8" stroke-width="2" stroke-linecap="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        ${hub.region}
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div style="
          background:#F0F9FF; border-radius:8px; padding:8px 10px;
          text-align:center;
        ">
          <div style="font-size:9px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Drivers</div>
          <div style="font-size:20px;font-weight:800;color:#0EA5E9;font-family:'Plus Jakarta Sans',sans-serif;">${hub.active_drivers}</div>
        </div>
        <div style="
          background:#F0FDF4; border-radius:8px; padding:8px 10px;
          text-align:center;
        ">
          <div style="font-size:9px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Shipments</div>
          <div style="font-size:20px;font-weight:800;color:#22C55E;font-family:'Plus Jakarta Sans',sans-serif;">${hub.shipments}</div>
        </div>
      </div>
    </div>
  `;
}

export default function HubMap({ hubs = [], loading = false }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);

  // ── Init Mapbox on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!TOKEN) {
      console.warn('HubMap: set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local');
      return;
    }

    // Dynamic import — Mapbox GL is browser-only
    import('mapbox-gl').then(({ default: mapboxgl }) => {
      mapboxgl.accessToken = TOKEN;

      // Clear any SSR/React-rendered children so Mapbox gets a clean container
      containerRef.current.innerHTML = '';

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style:     'mapbox://styles/mapbox/light-v11',   // clean light vector style
        center:    BHUTAN_CENTER,
        zoom:      7.5,
        pitch:     0,
        bearing:   0,
        antialias: true,
      });

      // Navigation controls (zoom +/-)
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      // Smooth resize
      map.on('load', () => { map.resize(); });

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Add / update markers when hubs change ────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    import('mapbox-gl').then(({ default: mapboxgl }) => {
      // Remove old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const valid = hubs.filter(h => h.latitude && h.longitude);
      if (!valid.length) return;

      // Add marker + popup for each hub
      valid.forEach(hub => {
        // Marker element
        const el = document.createElement('div');
        el.innerHTML = markerHTML(hub.name);

        // Hover scale effect
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.1)';
          el.style.transition = 'transform 0.2s';
          el.style.zIndex = '10';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.zIndex = '1';
        });

        const popup = new mapboxgl.Popup({
          offset:    [0, -52],
          closeOnClick: true,
          maxWidth: '240px',
        }).setHTML(popupHTML(hub));

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([hub.longitude, hub.latitude])
          .setPopup(popup)
          .addTo(mapRef.current);

        markersRef.current.push(marker);
      });

      // Fly-fit to all hub bounds
      if (valid.length === 1) {
        mapRef.current.flyTo({
          center: [valid[0].longitude, valid[0].latitude],
          zoom: 12,
          speed: 1.2,
        });
      } else {
        // Fit map to show all hub markers
        const lngs = valid.map(h => h.longitude);
        const lats = valid.map(h => h.latitude);
        mapRef.current.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: { top: 60, bottom: 60, left: 60, right: 60 }, maxZoom: 13, duration: 1200 }
        );
      }
    });
  }, [hubs]);

  const validCount = hubs.filter(h => h.latitude && h.longitude).length;

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.dot} />
        <span className={s.cardTitle}>Hub Location Map</span>
        {!loading && (
          <span className={s.hubCount}>{validCount} hub{validCount !== 1 ? 's' : ''}</span>
        )}
      </div>

      {loading ? (
        <div className={s.mapPlaceholder}>
          <div className={s.spinnerRing} />
          <span className={s.placeholderText}>Loading map…</span>
        </div>
      ) : !TOKEN ? (
        <div className={s.mapPlaceholder}>
          <span className={s.placeholderText}>
            Add <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to <code>.env.local</code>
          </span>
        </div>
      ) : (
        <div className={s.mapWrap}>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}
    </div>
  );
}