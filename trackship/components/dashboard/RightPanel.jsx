'use client';
// components/RightPanel/RightPanel.jsx
// Right column: calendar date filter + pending transporter requests
// selectedDate / onDateChange bubble up to dashboard page for API refetch

import { useState } from 'react';
import { ChevronLeft, ChevronRight, XCircle, Truck } from 'lucide-react';
import s from './RightPanel.module.css';

const DAYS = ['S','M','T','W','T','F','S'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Mini calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelect, onClear }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const prev = () => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  const next = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });

  // Build cell array: leading empty + day numbers
  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const toISO = d => `${view.y}-${String(view.m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const isToday = d => d && view.y === today.getFullYear() && view.m === today.getMonth() && d === today.getDate();
  const isSelected = d => d && toISO(d) === selectedDate;

  return (
    <div className={s.calCard}>
      {/* Month nav */}
      <div className={s.calHeader}>
        <span className={s.calMonth}>{MONTHS[view.m]}, {view.y}</span>
        <div className={s.calNav}>
          <button className={s.calNavBtn} onClick={prev}><ChevronLeft size={14} /></button>
          <button className={s.calNavBtn} onClick={next}><ChevronRight size={14} /></button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className={s.calGrid}>
        {DAYS.map((d, i) => <div key={i} className={s.calDayName}>{d}</div>)}

        {/* Day cells */}
        {cells.map((d, i) => (
          <div
            key={i}
            className={`${s.calDay} ${!d ? s.empty : ''} ${isToday(d) ? s.today : ''} ${isSelected(d) ? s.selected : ''}`}
            onClick={() => d && onSelect(toISO(d))}
          >
            {d ?? ''}
          </div>
        ))}
      </div>

      {/* Clear — always visible; highlighted when a date is active */}
      <button
        className={`${s.clearBtn} ${selectedDate ? s.active : ''}`}
        onClick={onClear}
      >
        <XCircle size={13} />
        {selectedDate ? `Clear: ${selectedDate}` : 'Show all dates'}
      </button>
    </div>
  );
}

// ── Pending transporter item ─────────────────────────────────────────────────
function PendingItem({ item }) {
  const initials = item.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={s.pendingItem}>
      <div className={s.pendingAvatar}>{initials}</div>
      <div className={s.pendingInfo}>
        <div className={s.pendingName}>{item.name}</div>
        <div className={s.pendingMeta}>{item.vehicle || item.email || '—'}</div>
      </div>
      <span className={s.pendingBadge}>Pending</span>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function RightPanel({
  selectedDate,    // 'YYYY-MM-DD' | null
  onDateChange,    // fn(date|null)
  transporters,    // normalized array from getPendingTransporters()
  loadingT,        // boolean
}) {
  return (
    <div className={s.panel}>
      {/* Calendar date filter */}
      <MiniCalendar
        selectedDate={selectedDate}
        onSelect={onDateChange}
        onClear={() => onDateChange(null)}
      />

      {/* Pending driver registrations */}
      <div className={s.pendingCard}>
        <div className={s.pendingHeader}>
          <div className={s.pendingTitle}>
            <Truck size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Pending Requests
          </div>
          {transporters.length > 0 && (
            <span className={s.pendingCount}>{transporters.length}</span>
          )}
        </div>

        <div className={s.pendingList}>
          {loadingT ? (
            [1,2,3].map(i => <div key={i} className={s.skeleton} />)
          ) : transporters.length === 0 ? (
            <div className={s.emptyPending}>No pending requests</div>
          ) : (
            transporters.map(t => <PendingItem key={t.id} item={t} />)
          )}
        </div>
      </div>
    </div>
  );
}