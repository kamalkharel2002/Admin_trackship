'use client';
import { useState } from 'react';
import './ShipmentsHeader.css';

const SearchIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const STATUS_CYCLE = [null, 'Delivered', 'In Transit', 'Pending', 'Delayed'];

export default function ShipmentsHeader({ selected, onSearch, onStatusChange }) {
  const [statusIdx, setStatusIdx] = useState(0);

  const cycleStatus = () => {
    const next = (statusIdx + 1) % STATUS_CYCLE.length;
    setStatusIdx(next);
    onStatusChange?.(STATUS_CYCLE[next]);
  };

  const activeStatus = STATUS_CYCLE[statusIdx];

  return (
    <div className="shipments-header">
      <div className="search-wrap">
        <span className="search-icon"><SearchIcon /></span>
        <input
          className="search-input"
          placeholder="Search by ID, sender, receiver..."
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>

      {selected.length > 0 && (
        <span className="selected-pill">{selected.length} selected</span>
      )}

      <div className="header-actions">
        <button
          className={`filter-btn ${activeStatus ? 'filter-btn-active' : ''}`}
          onClick={cycleStatus}
        >
          <FilterIcon />
          {activeStatus ?? 'Status'}
          <ChevronIcon />
        </button>

        <button className="filter-btn">
          <CalendarIcon />
          Date
          <ChevronIcon />
        </button>
      </div>
    </div>
  );
}