'use client';

import { useState, useEffect } from 'react';
import { getShipmentById } from '@/lib/api';
import './ShipmentRow.css';

/* ───────── HELPERS ───────── */

const STATUS_CONFIG = {
  Delivered:    { badge: 'sr-s-delivered',  dot: 'sr-dot-delivered',  icon: '✓' },
  'In Transit': { badge: 'sr-s-transit',    dot: 'sr-dot-transit',    icon: '⟶' },
  Pending:      { badge: 'sr-s-pending',    dot: 'sr-dot-pending',    icon: '◷' },
  'At Hub':     { badge: 'sr-s-hub',        dot: 'sr-dot-hub',        icon: '⬡' },
  Cancelled:    { badge: 'sr-s-cancelled',  dot: 'sr-dot-cancelled',  icon: '✕' },
};

const AVATAR_COLORS = [
  { bg: '#E8F4FD', color: '#1565C0', border: '#BBDEFB' },
  { bg: '#E8F5E9', color: '#1B5E20', border: '#C8E6C9' },
  { bg: '#FFF8E1', color: '#E65100', border: '#FFECB3' },
  { bg: '#EDE7F6', color: '#311B92', border: '#D1C4E9' },
  { bg: '#FCE4EC', color: '#880E4F', border: '#F8BBD9' },
  { bg: '#E0F2F1', color: '#004D40', border: '#B2DFDB' },
];

function getInitials(name = '') {
  if (!name || typeof name !== 'string') return '?';
  return name.trim().split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase() || '?';
}

function getAvatar(name = '') {
  if (!name || typeof name !== 'string') return AVATAR_COLORS[0];
  const firstChar = name.trim().charAt(0);
  if (!firstChar) return AVATAR_COLORS[0];
  return AVATAR_COLORS[firstChar.charCodeAt(0) % AVATAR_COLORS.length] || AVATAR_COLORS[0];
}

/* ───────── DETAIL FIELD ───────── */
function Field({ label, value }) {
  return (
    <div className="sr-field">
      <span className="sr-field-label">{label}</span>
      <span className="sr-field-value">{value || '—'}</span>
    </div>
  );
}

/* ───────── STATUS BADGE FOR DAMAGE/DELAY ───────── */
function StatusBadge({ label, status }) {
  if (!status || status === 'Not Damaged' || status === 'Not Delayed') return null;
  
  const isDamaged = status === 'Damaged';
  const isDelayed = status === 'Delayed';
  
  return (
    <div className={`sr-status-badge ${isDamaged ? 'sr-status-damaged' : 'sr-status-delayed'}`}>
      <span className="sr-status-icon">
        {isDamaged ? '⚠️' : '🕒'}
      </span>
      <span className="sr-status-text">{label}: {status}</span>
    </div>
  );
}

/* ───────── HELPER TO GET ROUTE ───────── */
function getRouteFromShipment(shipmentData) {
  // First priority: direct route string if available
  if (shipmentData.route && shipmentData.route !== 'N/A' && shipmentData.route.includes('→')) {
    return shipmentData.route.split('→').map(s => s.trim());
  }
  
  // Second: use source and destination hub names
  const from = shipmentData.source_hub_name || shipmentData.sourceHub || 'N/A';
  const to = shipmentData.destination_hub_name || shipmentData.destinationHub || 'N/A';
  
  return [from, to];
}

/* ───────── COMPONENT ───────── */

export default function ShipmentRow({ shipment, checked, onToggle, onClick }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pre-fetch details in the background without waiting for user interaction
  useEffect(() => {
    // Fetch details immediately in the background
    fetchDetails();
  }, []); // Only fetch once when component mounts

  async function fetchDetails() {
    if (details) return; // Don't fetch if we already have details
    
    try {
      setLoading(true);
      const res = await getShipmentById(shipment.shipment_id);
      if (!res) throw new Error('No data returned');
      setDetails(res);
    } catch (err) {
      console.error('❌ Failed to fetch shipment details', err);
      setDetails({});
    } finally {
      setLoading(false);
    }
  }

  // Merge shipment data with fetched details
  const data = { ...shipment, ...details };

  const safeStatus = data.status || 'Pending';
  const statusKey = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
  const st = STATUS_CONFIG[statusKey] || STATUS_CONFIG['Pending'];

  const sa = getAvatar(data.sender_name || '');
  const ra = getAvatar(data.receiver_name || '');

  // Get route values - this will work immediately with initial shipment data
  const [from, to] = getRouteFromShipment(data);

  return (
    <div className={`sr-row-wrap${open ? ' sr-wrap-open' : ''}`}>

      {/* ───── MAIN ROW ───── */}
      <div
        className={`sr-row${open ? ' sr-row-expanded' : ''}`}
        onClick={() => setOpen(prev => !prev)}
      >
        <div className="sr-cell sr-cell-check" onClick={e => { e.stopPropagation(); onToggle(); }}>
          <label className="sr-check-wrap" onClick={e => e.stopPropagation()}>
            <input type="checkbox" className="sr-checkbox" checked={checked} onChange={onToggle} />
            <span className="sr-check-box" />
          </label>
        </div>

        <div className="sr-cell">
          <span className="sr-code">{data.shipment_code || 'N/A'}</span>
        </div>

        <div className="sr-cell">
          <div className="sr-person">
            <div className="sr-avatar" style={{ background: sa.bg, color: sa.color, borderColor: sa.border }}>
              {getInitials(data.sender_name || '')}
            </div>
            <span className="sr-pname">{data.sender_name || 'Unknown'}</span>
          </div>
        </div>

        <div className="sr-cell">
          <div className="sr-person">
            <div className="sr-avatar" style={{ background: ra.bg, color: ra.color, borderColor: ra.border }}>
              {getInitials(data.receiver_name || '')}
            </div>
            <span className="sr-pname">{data.receiver_name || 'Unknown'}</span>
          </div>
        </div>

        <div className="sr-cell">
          <div className="sr-route">
            <span className="sr-route-city">{from}</span>
            <span className="sr-route-line">
              <span className="sr-route-dot" />
              <span className="sr-route-track" />
              <span className="sr-route-arrow">›</span>
            </span>
            <span className="sr-route-city">{to}</span>
          </div>
        </div>

        <div className="sr-cell">
          <span className={`sr-badge ${st.badge}`}>
            <span className="sr-badge-icon">{st.icon}</span>
            {safeStatus}
          </span>
        </div>

        <div className="sr-cell sr-transporter-cell">
          <span className="sr-transporter-name">{data.transporter_name || 'Unassigned'}</span>
        </div>

        <div className={`sr-chevron${open ? ' sr-chevron-open' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* ───── DETAILS PANEL ───── */}
      <div className={`sr-detail${open ? ' sr-detail-open' : ''}`}>
        <div className="sr-detail-inner">
          {loading && !details ? (
            <div className="sr-detail-loading">
              <div className="sr-loading-spinner" />
              <span>Fetching shipment details…</span>
            </div>
          ) : (
            <div className="sr-detail-grid">

              {/* Card: Shipment Info */}
              <div className="sr-detail-card">
                <div className="sr-card-header">
                  <span className="sr-card-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                  </span>
                  <h4 className="sr-card-title">Shipment Info</h4>
                </div>
                <div className="sr-fields">
                  <Field label="Shipment Code" value={data.shipment_code} />
                  <Field label="Trip ID" value={data.trip_id} />
                  <Field label="Created" value={data.created_at ? new Date(data.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null} />
                  <Field label="Total Price" value={data.total_price ? `Nu. ${Number(data.total_price).toLocaleString()}` : null} />
                  <Field label="Delivery Mode" value={data.delivery_mode} />
                  <Field label="Source Hub" value={data.source_hub_name} />
                  <Field label="Destination Hub" value={data.destination_hub_name} />
                  
                  {/* Conditional Status Badges */}
                  {data.damage_status === 'Damaged' && (
                    <div className="sr-field">
                      <span className="sr-field-label">Damage Status</span>
                      <span className="sr-field-value sr-value-damaged">⚠️ Damaged</span>
                    </div>
                  )}
                  
                  {data.delay_status === 'Delayed' && (
                    <div className="sr-field">
                      <span className="sr-field-label">Delay Status</span>
                      <span className="sr-field-value sr-value-delayed">🕒 Delayed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card: Contacts */}
              <div className="sr-detail-card">
                <div className="sr-card-header">
                  <span className="sr-card-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </span>
                  <h4 className="sr-card-title">Contacts</h4>
                </div>
                <div className="sr-contacts-grid">
                  <div className="sr-contact-block">
                    <span className="sr-contact-role">Sender</span>
                    <div className="sr-contact-person">
                      <div className="sr-avatar sr-avatar-md" style={{ background: sa.bg, color: sa.color, borderColor: sa.border }}>
                        {getInitials(data.sender_name || '')}
                      </div>
                      <div>
                        <p className="sr-contact-name">{data.sender_name || 'Unknown'}</p>
                        <p className="sr-contact-phone">{data.sender_phone || '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="sr-contact-block">
                    <span className="sr-contact-role">Receiver</span>
                    <div className="sr-contact-person">
                      <div className="sr-avatar sr-avatar-md" style={{ background: ra.bg, color: ra.color, borderColor: ra.border }}>
                        {getInitials(data.receiver_name || '')}
                      </div>
                      <div>
                        <p className="sr-contact-name">{data.receiver_name || 'Unknown'}</p>
                        <p className="sr-contact-phone">{data.receiver_phone || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Transporter */}
              <div className="sr-detail-card">
                <div className="sr-card-header">
                  <span className="sr-card-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" rx="1"/>
                      <path d="M16 8h4l3 3v5h-7V8z"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                  </span>
                  <h4 className="sr-card-title">Transporter</h4>
                </div>
                <div className="sr-fields">
                  <Field label="Name" value={data.transporter_name} />
                  <Field label="Phone" value={data.transporter_phone} />
                  <Field label="Transporter ID" value={data.transporter_id} />
                  <Field label="Vehicle Model" value={data.vehicle_model} />
                  <Field label="Vehicle Type" value={data.vehicle_type} />
                  <Field label="Vehicle No." value={data.vehicle_no} />
                  <Field label="Point Name" value={data.point_name} />
                </div>
              </div>

              {/* Rejection info if present */}
              {(data.rejection_reason || data.rejected_at) && (
                <div className="sr-detail-card sr-detail-card-danger">
                  <div className="sr-card-header">
                    <span className="sr-card-icon sr-icon-danger">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    </span>
                    <h4 className="sr-card-title">Rejection Info</h4>
                  </div>
                  <div className="sr-fields">
                    <Field label="Reason" value={data.rejection_reason} />
                    <Field label="Rejected At" value={data.rejected_at ? new Date(data.rejected_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null} />
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}