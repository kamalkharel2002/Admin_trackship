'use client';
// components/hub/HubMap.jsx
// Overview map — shows all hubs as markers with popup cards
// Uses react-leaflet (SSR-safe via dynamic import in parent)

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import s from './HubMap.module.css';

// Fix Leaflet default icon path issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom blue pin icon matching TrackShip brand
const HUB_ICON = L.divIcon({
  className: '',
  html: `
    <div style="
      width:36px; height:36px;
      background: linear-gradient(135deg,#0EA5E9,#1A1A2E);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(14,165,233,0.4);
    "></div>
  `,
  iconSize:   [36, 36],
  iconAnchor: [18, 36],
  popupAnchor:[0, -38],
});

// Auto-fit map bounds when hubs change
function FitBounds({ hubs }) {
  const map = useMap();
  useEffect(() => {
    if (!hubs.length) return;
    const valid = hubs.filter(h => h.latitude && h.longitude);
    if (!valid.length) return;
    const bounds = L.latLngBounds(valid.map(h => [h.latitude, h.longitude]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
  }, [hubs, map]);
  return null;
}

// Popup inner card — styled inline so Leaflet portal doesn't miss CSS
function HubPopup({ hub }) {
  return (
    <div style={{
      minWidth: 180,
      padding: '12px 14px',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        fontFamily: 'var(--font-head)',
        fontWeight: 700,
        fontSize: 14,
        color: '#1A1A2E',
        marginBottom: 4,
      }}>
        {hub.name}
      </div>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
        📍 {hub.region}
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <div>
          <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Drivers</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0EA5E9' }}>{hub.active_drivers}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shipments</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#22C55E' }}>{hub.shipments}</div>
        </div>
      </div>
    </div>
  );
}

// Default center: Bhutan
const DEFAULT_CENTER = [27.5142, 90.4336];
const DEFAULT_ZOOM   = 8;

export default function HubMap({ hubs = [], loading = false }) {
  const validHubs = hubs.filter(h => h.latitude && h.longitude);

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.dot} />
        <span className={s.cardTitle}>Hub Location Map</span>
        {!loading && (
          <span className={s.hubCount}>{validHubs.length} hub{validHubs.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {loading ? (
        <div className={s.mapPlaceholder}>Loading map…</div>
      ) : (
        <div className={s.mapWrap}>
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={false}
          >
            {/* Clean, light tile layer */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com">CARTO</a>'
            />
            <FitBounds hubs={validHubs} />
            {validHubs.map(hub => (
              <Marker
                key={hub.id}
                position={[hub.latitude, hub.longitude]}
                icon={HUB_ICON}
              >
                <Popup closeButton={false}>
                  <HubPopup hub={hub} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}