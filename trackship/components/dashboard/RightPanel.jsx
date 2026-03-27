'use client';
// components/RightPanel/RightPanel.jsx
// Right column: calendar date range filter + pending transporter requests

import { useState } from 'react';
import { ChevronLeft, ChevronRight, XCircle, Truck } from 'lucide-react';
import s from './RightPanel.module.css';

const DAYS = ['S','M','T','W','T','F','S'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Date Range Calendar (with drag selection only) ─────────────────────────────────
function DateRangeCalendar({ startDate, endDate, onRangeSelect, onClear }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selectionStart, setSelectionStart] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [tempRange, setTempRange] = useState({ start: null, end: null });

  const prev = () => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  const next = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });

  // Build cell array: leading empty + day numbers
  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const toISO = (d) => `${view.y}-${String(view.m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  
  const isInRange = (dateStr) => {
    // Show the final selected range
    if (!startDate || !endDate) return false;
    return dateStr >= startDate && dateStr <= endDate;
  };

  const isInTempRange = (dateStr) => {
    // Show the temporary range while dragging
    if (!tempRange.start || !tempRange.end) return false;
    return dateStr >= tempRange.start && dateStr <= tempRange.end;
  };
  
  const isRangeStart = (dateStr) => dateStr === startDate;
  const isRangeEnd = (dateStr) => dateStr === endDate;
  const isTempRangeStart = (dateStr) => dateStr === tempRange.start;
  const isTempRangeEnd = (dateStr) => dateStr === tempRange.end;

  const handleMouseDown = (day) => {
    if (!day) return;
    const dateStr = toISO(day);
    setSelectionStart(dateStr);
    setIsSelecting(true);
    setTempRange({ start: dateStr, end: dateStr });
  };

  const handleMouseEnter = (day) => {
    if (!isSelecting || !selectionStart || !day) return;
    const currentDate = toISO(day);
    if (currentDate < selectionStart) {
      setTempRange({ start: currentDate, end: selectionStart });
    } else {
      setTempRange({ start: selectionStart, end: currentDate });
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && tempRange.start && tempRange.end) {
      // If start and end are the same, it's a single date selection
      if (tempRange.start === tempRange.end) {
        onRangeSelect(tempRange.start, null); // Single date
      } else {
        // Range selection
        onRangeSelect(tempRange.start, tempRange.end);
      }
    }
    setIsSelecting(false);
    setSelectionStart(null);
    setTempRange({ start: null, end: null });
  };

  const handleDayClick = (day) => {
    if (!day) return;
    // Only handle single click if not dragging
    if (!isSelecting) {
      const dateStr = toISO(day);
      onRangeSelect(dateStr, null); // Single date
    }
  };

  const isToday = d => d && view.y === today.getFullYear() && view.m === today.getMonth() && d === today.getDate();

  const getRangeDisplay = () => {
    if (startDate && endDate) return `${startDate} → ${endDate}`;
    if (startDate && !endDate) return `Selected: ${startDate}`;
    if (tempRange.start && tempRange.end && tempRange.start !== tempRange.end) {
      return `Selecting: ${tempRange.start} → ${tempRange.end}`;
    }
    return 'Click for single date or drag for range';
  };

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

      {/* Range display */}
      <div className={s.rangeDisplay}>
        {getRangeDisplay()}
      </div>

      {/* Day-of-week headers */}
      <div className={s.calGrid}>
        {DAYS.map((d, i) => <div key={i} className={s.calDayName}>{d}</div>)}

        {/* Day cells */}
        {cells.map((d, i) => {
          if (!d) {
            return <div key={i} className={`${s.calDay} ${s.empty}`} />;
          }
          
          const dateStr = toISO(d);
          const inFinalRange = isInRange(dateStr);
          const inTempRange = isInTempRange(dateStr);
          const isStart = isRangeStart(dateStr);
          const isEnd = isRangeEnd(dateStr);
          const isTempStart = isTempRangeStart(dateStr);
          const isTempEnd = isTempRangeEnd(dateStr);
          const isSingleDate = startDate && !endDate && dateStr === startDate;
          
          // Determine which range to show (temp while dragging, final otherwise)
          const showRange = isSelecting ? inTempRange : inFinalRange;
          const showStart = isSelecting ? isTempStart : isStart;
          const showEnd = isSelecting ? isTempEnd : isEnd;
          
          return (
            <div
              key={i}
              className={`
                ${s.calDay} 
                ${showRange ? s.inRange : ''} 
                ${showStart ? s.rangeStart : ''} 
                ${showEnd ? s.rangeEnd : ''}
                ${isSingleDate ? s.singleDate : ''}
                ${isToday(d) ? s.today : ''}
              `}
              onMouseDown={() => handleMouseDown(d)}
              onMouseEnter={() => handleMouseEnter(d)}
              onMouseUp={handleMouseUp}
              onClick={() => handleDayClick(d)}
            >
              {d}
            </div>
          );
        })}
      </div>

      {/* Clear button */}
      <button
        className={`${s.clearBtn} ${(startDate || endDate) ? s.active : ''}`}
        onClick={onClear}
      >
        <XCircle size={13} />
        {(startDate || endDate) ? 'Clear selection' : 'Show all dates'}
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
        <div className={s.pendingMeta}>{item.phone ||'—'}</div>
      </div>
      <span className={s.pendingBadge}>Pending</span>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function RightPanel({
  startDate,      // start date for range or single date
  endDate,        // end date for range (null for single date)
  onRangeChange,  // fn(startDate, endDate)
  transporters,   // normalized array from getPendingTransporters()
  loadingT,       // boolean
}) {
  const handleRangeSelect = (start, end) => {
    onRangeChange(start, end);
  };

  const handleClear = () => {
    onRangeChange(null, null);
  };

  return (
    <div className={s.panel}>
      {/* Date range calendar */}
      <DateRangeCalendar
        startDate={startDate}
        endDate={endDate}
        onRangeSelect={handleRangeSelect}
        onClear={handleClear}
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