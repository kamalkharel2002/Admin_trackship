'use client';
// components/ParcelReports/DelayFilters.jsx
import { Search, Filter } from 'lucide-react';
import s from './ParcelFilters.module.css'; // reuse identical styles

const FILTERS = [
  { value: 'all',        label: 'All'        },
  { value: 'unresolved', label: 'Unresolved' },
  { value: 'resolved',   label: 'Resolved'   },
  { value: 'excused',    label: 'Excused'    },
];

export default function DelayFilters({ search, filter, onSearch, onFilter }) {
  return (
    <div className={s.bar}>
      <div className={s.searchWrap}>
        <Search size={14} className={s.searchIcon} />
        <input
          className={s.searchInput}
          type="text"
          placeholder="Search by shipment, reporter or transporter…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className={s.filterGroup}>
        <Filter size={13} className={s.filterIcon} />
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`${s.filterBtn} ${filter === f.value ? s.active : ''}`}
            onClick={() => onFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}