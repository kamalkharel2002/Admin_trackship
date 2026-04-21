'use client';
// components/hub/HubMap.jsx
// Single useEffect handles both map init AND markers together.
// Runs whenever `hubs` changes — so navigating away and back
// always gets a fresh map with current hub data.

import { useEffect, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import s from './HubMap.module.css';

const TOKEN         = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const BHUTAN_CENTER = [90.4336, 27.5142];

function markerHTML(name) {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div class="hub-pin-inner" style="
        width:36px;height:36px;
        background:linear-gradient(135deg,#0EA5E9,#1A1A2E);
        border-radius:50% 50% 50% 2px;
        transform:rotate(-45deg);
        border:3px solid #fff;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 12px rgba(14,165,233,0.4);
        transition:transform 0.2s,box-shadow 0.2s;
        will-change:transform;
      ">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="#fff" stroke-width="2.5" stroke-linecap="round"
             style="transform:rotate(45deg)">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div style="
        margin-top:5px;background:#1A1A2E;color:#fff;
        font-size:10px;font-weight:700;
        font-family:'Plus Jakarta Sans',sans-serif;
        padding:2px 8px;border-radius:10px;
        white-space:nowrap;max-width:110px;
        overflow:hidden;text-overflow:ellipsis;
        box-shadow:0 2px 6px rgba(0,0,0,0.2);
      ">${name}</div>
    </div>`;
}

function popupHTML(hub) {
  return `
    <div style="min-width:185px;padding:14px 16px;font-family:'DM Sans',sans-serif;">
      <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:14px;color:#1A1A2E;margin-bottom:3px;">
        ${hub.name}
      </div>
      <div style="font-size:11px;color:#94A3B8;margin-bottom:12px;"> ${hub.region}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="background:#F0F9FF;border-radius:8px;padding:8px;text-align:center;">
          <div style="font-size:9px;font-weight:700;color:#64748B;text-transform:uppercase;margin-bottom:2px;">Drivers</div>
          <div style="font-size:20px;font-weight:800;color:#0EA5E9;font-family:'Plus Jakarta Sans',sans-serif;">${hub.active_drivers}</div>
        </div>
        <div style="background:#F0FDF4;border-radius:8px;padding:8px;text-align:center;">
          <div style="font-size:9px;font-weight:700;color:#64748B;text-transform:uppercase;margin-bottom:2px;">Shipments</div>
          <div style="font-size:20px;font-weight:800;color:#22C55E;font-family:'Plus Jakarta Sans',sans-serif;">${hub.shipments}</div>
        </div>
      </div>
    </div>`;
}

export default function HubMap({ hubs = [], loading = false }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    // Skip if no token, no container, or still loading hubs
    if (!TOKEN || !containerRef.current || loading) return;

    let cancelled = false;

    import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current) return;

      // Always destroy any previous instance before creating a new one
      // This is what makes navigation-back work — stale map is gone, fresh one starts
      mapRef.current?.remove();
      mapRef.current = null;
      containerRef.current.innerHTML = '';

      mapboxgl.accessToken = TOKEN;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style:     'mapbox://styles/mapbox/light-v11',
        center:    BHUTAN_CENTER,
        zoom:      7.5,
        antialias: true,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
      mapRef.current = map;

      map.on('load', () => {
        if (cancelled) return;

        map.resize();

        const valid = hubs.filter(h => h.latitude && h.longitude);

        // Add a marker + popup for each hub
        valid.forEach(hub => {
          const el = document.createElement('div');
          el.innerHTML = markerHTML(hub.name);

          // Hover on inner pin only — never transform the wrapper (Mapbox owns it)
          const inner = el.querySelector('.hub-pin-inner');
          el.addEventListener('mouseenter', () => {
            if (inner) inner.style.transform = 'rotate(-45deg) scale(1.15)';
          });
          el.addEventListener('mouseleave', () => {
            if (inner) inner.style.transform = 'rotate(-45deg) scale(1)';
          });

          new mapboxgl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([hub.longitude, hub.latitude])
            .setPopup(new mapboxgl.Popup({ offset: [0, -52], closeOnClick: true, maxWidth: '230px' })
              .setHTML(popupHTML(hub)))
            .addTo(map);
        });

        // Fit map to all hub positions
        if (valid.length === 1) {
          map.flyTo({ center: [valid[0].longitude, valid[0].latitude], zoom: 12 });
        } else if (valid.length > 1) {
          const lngs = valid.map(h => h.longitude);
          const lats = valid.map(h => h.latitude);
          map.fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
            { padding: 60, maxZoom: 13, duration: 800 }
          );
        }
      });
    });

    // Cleanup: destroy map when component unmounts or hubs changes
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [hubs, loading]); // re-runs when hubs update OR on every fresh mount

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
            Set <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> in <code>.env.local</code>
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