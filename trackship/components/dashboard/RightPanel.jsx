'use client';
// components/RightPanel/RightPanel.jsx

import { useState } from 'react';
import { ChevronLeft, ChevronRight, XCircle, Truck, FileText } from 'lucide-react';
import s from './RightPanel.module.css';

const DAYS = ['S','M','T','W','T','F','S'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Date Range Calendar ─────────────────────────────────
function DateRangeCalendar({ startDate, endDate, onRangeSelect, onClear }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selectionStart, setSelectionStart] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [tempRange, setTempRange] = useState({ start: null, end: null });

  const prev = () => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  const next = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });

  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const toISO = (d) => `${view.y}-${String(view.m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  
  const isInRange = (dateStr) => {
    if (!startDate || !endDate) return false;
    return dateStr >= startDate && dateStr <= endDate;
  };

  const isInTempRange = (dateStr) => {
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
      if (tempRange.start === tempRange.end) {
        onRangeSelect(tempRange.start, null);
      } else {
        onRangeSelect(tempRange.start, tempRange.end);
      }
    }
    setIsSelecting(false);
    setSelectionStart(null);
    setTempRange({ start: null, end: null });
  };

  const handleDayClick = (day) => {
    if (!day) return;
    if (!isSelecting) {
      const dateStr = toISO(day);
      onRangeSelect(dateStr, null);
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
      <div className={s.calHeader}>
        <span className={s.calMonth}>{MONTHS[view.m]}, {view.y}</span>
        <div className={s.calNav}>
          <button className={s.calNavBtn} onClick={prev}><ChevronLeft size={14} /></button>
          <button className={s.calNavBtn} onClick={next}><ChevronRight size={14} /></button>
        </div>
      </div>

      <div className={s.rangeDisplay}>
        {getRangeDisplay()}
      </div>

      <div className={s.calGrid}>
        {/* FIXED: Use index to make keys unique */}
        {DAYS.map((d, idx) => (
          <div key={`day_${d}_${idx}`} className={s.calDayName}>{d}</div>
        ))}

        {cells.map((d, i) => {
          if (!d) {
            return <div key={`empty_${i}`} className={`${s.calDay} ${s.empty}`} />;
          }
          
          const dateStr = toISO(d);
          const inFinalRange = isInRange(dateStr);
          const inTempRange = isInTempRange(dateStr);
          const isStart = isRangeStart(dateStr);
          const isEnd = isRangeEnd(dateStr);
          const isTempStart = isTempRangeStart(dateStr);
          const isTempEnd = isTempRangeEnd(dateStr);
          const isSingleDate = startDate && !endDate && dateStr === startDate;
          
          const showRange = isSelecting ? inTempRange : inFinalRange;
          const showStart = isSelecting ? isTempStart : isStart;
          const showEnd = isSelecting ? isTempEnd : isEnd;
          
          return (
            <div
              key={`cell_${d}_${i}`}
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

// ── Pending item that handles both transporters AND vehicle documents ──
function PendingItem({ item }) {
  // Determine what type of item this is
  const isTransporter = item.type === 'transporter' || item.transporter_id;
  const isVehicleDoc = item.type === 'vehicle_doc' || item.document_id;
  
  let initials = '?';
  let displayName = '';
  let displayMeta = '';
  
  if (isTransporter) {
    const name = item.name || item.user_name || '';
    displayName = name;
    displayMeta = item.phone || item.email || '—';
    initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    if (!initials && name) initials = name.slice(0, 2).toUpperCase();
    if (!initials) initials = 'TR';
  } else if (isVehicleDoc) {
    displayName = `${item.doc_type || 'Document'} - ${item.vehicle_no || 'Vehicle'}`;
    displayMeta = `Uploaded: ${item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : 'Recently'}`;
    initials = (item.doc_type?.slice(0, 2) || 'VD').toUpperCase();
  } else {
    displayName = item.name || item.title || 'Pending Request';
    displayMeta = item.meta || 'Awaiting verification';
    initials = 'PD';
  }
  
  return (
    <div className={s.pendingItem}>
      <div className={s.pendingAvatar}>{initials}</div>
      <div className={s.pendingInfo}>
        <div className={s.pendingName}>{displayName}</div>
        <div className={s.pendingMeta}>{displayMeta}</div>
      </div>
      <span className={s.pendingBadge}>Pending</span>
    </div>
  );
}

// ── Main export ──
export default function RightPanel({
  startDate,
  endDate,
  onRangeChange,
  transporters,
  vehicleDocuments,
  loadingT,
  loadingV,
}) {
  const handleRangeSelect = (start, end) => {
    onRangeChange(start, end);
  };

  const handleClear = () => {
    onRangeChange(null, null);
  };

  // Combine and format all pending items
  const allPendingItems = [
    ...(transporters || []).map(t => ({ ...t, type: 'transporter' })),
    ...(vehicleDocuments || []).map(v => ({ ...v, type: 'vehicle_doc' }))
  ];

  const isLoading = loadingT || loadingV;
  const totalPending = allPendingItems.length;

  return (
    <div className={s.panel}>
      <DateRangeCalendar
        startDate={startDate}
        endDate={endDate}
        onRangeSelect={handleRangeSelect}
        onClear={handleClear}
      />

      <div className={s.pendingCard}>
        <div className={s.pendingHeader}>
          <div className={s.pendingTitle}>
            <Truck size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Pending Requests
          </div>
          {totalPending > 0 && (
            <span className={s.pendingCount}>{totalPending}</span>
          )}
        </div>

        <div className={s.pendingList}>
          {isLoading ? (
            [1,2,3].map(i => <div key={`skeleton_${i}`} className={s.skeleton} />)
          ) : totalPending === 0 ? (
            <div className={s.emptyPending}>No pending requests</div>
          ) : (
            allPendingItems.map((item, index) => {
              // Create a truly unique key
              const uniqueKey = `${item.type}_${item.transporter_id || item.document_id || item.id || index}_${index}`;
              return <PendingItem key={uniqueKey} item={item} />;
            })
          )}
        </div>
      </div>
    </div>
  );
}