'use client';
// components/hub/HubModal.jsx
// Add / Edit hub modal with:
//   • Name + Region text inputs
//   • Interactive Leaflet map — click to drop pin & capture lat/lng
//   • Coordinator multi-select dropdown
//   • Submit calls createHub or updateHub

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { X, Loader2, AlertCircle, MapPin } from 'lucide-react';
import s from './HubModal.module.css';

// Fix Leaflet icon in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Pin icon for picker
const PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;
    background:linear-gradient(135deg,#F5B700,#F97316);
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid white;
    box-shadow:0 4px 12px rgba(245,183,0,0.5);
  "></div>`,
  iconSize:   [28, 28],
  iconAnchor: [14, 28],
});

// Captures map clicks → updates lat/lng
function ClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// Default Bhutan center
const BHUTAN = [27.5142, 90.4336];

export default function HubModal({ hub = null, coordinators = [], onClose, onSubmit }) {
  const isEdit = !!hub;

  const [form, setForm] = useState({
    name:   hub?.name   ?? '',
    region: hub?.region ?? '',
    coordinator_ids: hub?.coordinators?.map(c => c.id ?? c) ?? [],
  });
  const [lat, setLat] = useState(hub?.latitude  || null);
  const [lng, setLng] = useState(hub?.longitude || null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [pinActive, setPinActive] = useState(!!hub?.latitude);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePick = (la, lo) => {
    setLat(parseFloat(la.toFixed(6)));
    setLng(parseFloat(lo.toFixed(6)));
    setPinActive(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim())   return setError('Hub name is required.');
    if (!form.region.trim()) return setError('Region / location is required.');
    if (!lat || !lng)        return setError('Please click the map to set hub location.');

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name:            form.name.trim(),
        region:          form.region.trim(),
        latitude:        lat,
        longitude:       lng,
        coordinator_ids: form.coordinator_ids,
      }, hub?.id);
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Toggle coordinator selection
  const toggleCoord = (id) => {
    set('coordinator_ids', form.coordinator_ids.includes(id)
      ? form.coordinator_ids.filter(x => x !== id)
      : [...form.coordinator_ids, id]
    );
  };

  // Close on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const center = lat && lng ? [lat, lng] : BHUTAN;

  return (
    <div className={s.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>

        {/* Header */}
        <div className={s.modalHeader}>
          <div>
            <div className={s.modalTitle}>{isEdit ? 'Edit Hub' : 'Add New Hub'}</div>
            <div className={s.modalSub}>
              {isEdit ? `Editing: ${hub.name}` : 'Click the map to set location'}
            </div>
          </div>
          <button className={s.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={s.body}>

          {/* Name + Region */}
          <div className={s.fieldGroup}>
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
              <label className={s.label}>Region / Location</label>
              <input
                className={s.input}
                placeholder="e.g. Thimphu"
                value={form.region}
                onChange={e => set('region', e.target.value)}
              />
            </div>
          </div>

          {/* Map picker */}
          <div className={s.mapSection}>
            <div className={s.mapLabel}>
              <MapPin size={13} />
              Pin Location
              <span className={s.mapHint}>— click map to place marker</span>
            </div>
            <div className={`${s.mapPickerWrap} ${pinActive ? s.active : ''}`}>
              <MapContainer
                center={center}
                zoom={lat ? 12 : 8}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; CARTO'
                />
                <ClickHandler onPick={handlePick} />
                {lat && lng && (
                  <Marker position={[lat, lng]} icon={PIN_ICON} />
                )}
              </MapContainer>
            </div>

            {/* Coordinate readout */}
            {lat && lng ? (
              <div className={s.coordsRow}>
                <div className={s.coordBox}>
                  <span className={s.coordLabel}>Latitude</span>
                  <span className={s.coordValue}>{lat}</span>
                </div>
                <div className={s.coordBox}>
                  <span className={s.coordLabel}>Longitude</span>
                  <span className={s.coordValue}>{lng}</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No location selected yet
              </div>
            )}
          </div>

          {/* Coordinator multi-select */}
          {coordinators.length > 0 && (
            <div className={s.field}>
              <label className={s.label}>Hub Coordinators</label>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 8,
                background: 'var(--bg-page)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                maxHeight: 120, overflowY: 'auto',
              }}>
                {coordinators.map(c => {
                  const selected = form.coordinator_ids.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCoord(c.id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        border: '1.5px solid',
                        borderColor: selected ? 'var(--accent-blue)' : 'var(--border)',
                        background: selected ? 'rgba(14,165,233,0.1)' : 'var(--bg-card)',
                        color: selected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        fontSize: 12, fontWeight: 600,
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {selected ? '✓ ' : ''}{c.name}
                    </button>
                  );
                })}
              </div>
            </div>
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