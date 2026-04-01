'use client';

import { useState } from 'react';
import './ShipmentRow.css';

const STATUS_CONFIG = {
  'Delivered':  { badge: 'sr-s-delivered',  dot: 'sr-dot-delivered'  },
  'In Transit': { badge: 'sr-s-transit',    dot: 'sr-dot-transit'    },
  'Pending':    { badge: 'sr-s-pending',    dot: 'sr-dot-pending'    },
  'At Hub':     { badge: 'sr-s-hub',        dot: 'sr-dot-hub'        },
  'Cancelled':  { badge: 'sr-s-cancelled',  dot: 'sr-dot-cancelled'  },
};

const AVATAR_COLORS = [
  { bg: '#E6F1FB', color: '#0C447C' },
  { bg: '#EAF3DE', color: '#27500A' },
  { bg: '#FAEEDA', color: '#633806' },
  { bg: '#EEEDFE', color: '#3C3489' },
  { bg: '#FAECE7', color: '#712B13' },
  { bg: '#FBEAF0', color: '#72243E' },
];

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
function getAvatar(name = '') {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`sr-chevron-icon${open ? ' sr-chevron-open' : ''}`}
      width="15" height="15" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Timeline({ steps = [] }) {
  return (
    <div className="sr-timeline">
      {steps.map((step, i) => (
        <div className="sr-tl-step" key={i}>
          <div className="sr-tl-left">
            <div className={`sr-tl-dot${step.done ? ' sr-tl-dot-done' : ''}`} />
            {i < steps.length - 1 && <div className="sr-tl-line" />}
          </div>
          <div className="sr-tl-content">
            <div className={`sr-tl-event${step.done ? '' : ' sr-tl-event-pending'}`}>{step.e}</div>
            <div className="sr-tl-time">{step.t}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailCard({ title, children }) {
  return (
    <div className="sr-detail-card">
      <div className="sr-detail-card-title">{title}</div>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="sr-detail-row">
      <span className="sr-detail-label">{label}</span>
      <span className="sr-detail-val">{value}</span>
    </div>
  );
}

export default function ShipmentRow({ shipment, checked, onToggle, onClick }) {
  const [open, setOpen] = useState(false);

  const st = STATUS_CONFIG[shipment.status] || STATUS_CONFIG['Pending'];
  const sa = getAvatar(shipment.sender);
  const ra = getAvatar(shipment.receiver);

  const [from, to] = shipment.route?.includes('→')
    ? shipment.route.split('→').map(s => s.trim())
    : [shipment.from || '', shipment.to || ''];

  function handleToggle(e) {
    e.stopPropagation();
    setOpen(prev => !prev);
    onClick?.();
  }

  return (
    <div className="sr-row-wrap">

      {/* ── Main row ── */}
      <div
        className={`sr-row${open ? ' sr-row-expanded' : ''}`}
        onClick={() => setOpen(prev => !prev)}
      >

        <div className="sr-cell sr-cell-check" onClick={e => { e.stopPropagation(); onToggle(); }}>
          <input type="checkbox" className="sr-checkbox" checked={checked} onChange={onToggle} />
        </div>

        <div className="sr-cell">
          <span className="sr-code">{shipment.shipment_code}</span>
        </div>

        <div className="sr-cell">
          <div className="sr-person">
            <div className="sr-avatar" style={{ background: sa.bg, color: sa.color }}>
              {getInitials(shipment.sender)}
            </div>
            <span className="sr-pname">{shipment.sender}</span>
          </div>
        </div>

        <div className="sr-cell">
          <div className="sr-person">
            <div className="sr-avatar" style={{ background: ra.bg, color: ra.color }}>
              {getInitials(shipment.receiver)}
            </div>
            <span className="sr-pname">{shipment.receiver}</span>
          </div>
        </div>

        <div className="sr-cell">
          <div className="sr-route">
            <span>{from}</span>
            <span className="sr-route-arrow">
              <svg width="11" height="11" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
            <span>{to}</span>
          </div>
        </div>

        <div className="sr-cell">
          <span className={`sr-badge ${st.badge}`}>
            <span className={`sr-dot ${st.dot}`} />
            {shipment.status}
          </span>
        </div>

        <div className="sr-cell">
          <span className="sr-transporter">{shipment.transporter}</span>
        </div>

        <div className="sr-chevron" onClick={handleToggle}>
          <ChevronIcon open={open} />
        </div>

      </div>

      {/* ── Expanded detail panel ── */}
      <div className={`sr-detail${open ? ' sr-detail-open' : ''}`}>
        <div className="sr-detail-inner">

          {/* Timeline */}
          <DetailCard title="Timeline">
            <Timeline steps={shipment.timeline || []} />
          </DetailCard>

          <div className="sr-detail-right">

            {/* Package info */}
            <DetailCard title="Package info">
              <DetailRow label="Weight"        value={shipment.weight} />
              <DetailRow label="Dimensions"    value={shipment.dims} />
              <DetailRow label="Type"          value={shipment.type} />
              <DetailRow label="Declared value" value={shipment.declared} />
            </DetailCard>

            {/* Contacts */}
            <DetailCard title="Contacts">
              <div className="sr-contacts-grid">
                <div className="sr-contact-block">
                  <span className="sr-contact-lbl">Sender</span>
                  <div className="sr-contact-person">
                    <div className="sr-avatar sr-avatar-sm" style={{ background: sa.bg, color: sa.color }}>
                      {getInitials(shipment.sender)}
                    </div>
                    <span className="sr-contact-name">{shipment.sender}</span>
                  </div>
                  <span className="sr-contact-info">{shipment.sender_email}</span>
                  <span className="sr-contact-info">{shipment.sender_phone}</span>
                </div>
                <div className="sr-contact-block">
                  <span className="sr-contact-lbl">Receiver</span>
                  <div className="sr-contact-person">
                    <div className="sr-avatar sr-avatar-sm" style={{ background: ra.bg, color: ra.color }}>
                      {getInitials(shipment.receiver)}
                    </div>
                    <span className="sr-contact-name">{shipment.receiver}</span>
                  </div>
                  <span className="sr-contact-info">{shipment.receiver_email}</span>
                  <span className="sr-contact-info">{shipment.receiver_phone}</span>
                </div>
              </div>
            </DetailCard>

            {/* Actions */}
            <DetailCard title="Actions">
              <div className="sr-actions-grid">
                <button className="sr-action-btn sr-action-primary">Track shipment</button>
                <button className="sr-action-btn">Print label</button>
                <button className="sr-action-btn">Duplicate</button>
                <button className="sr-action-btn sr-action-danger">Cancel</button>
              </div>
            </DetailCard>

          </div>
        </div>
      </div>

    </div>
  );
}