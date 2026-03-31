'use client';
import './UsersHeader.css';

const FilterIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.8"
    strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export default function UsersHeader({ selected, onSearch, onAdd }) {
  return (
    <div className="users-header">

      {/* Search */}
      <div className="users-header-search-wrap">
        <span className="users-header-search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </span>
        <input
          className="users-header-search"
          placeholder="Search by name, email, role…"
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>

      {/* Selected pill */}
      {selected?.length > 0 && (
        <span className="users-header-selected-pill">
          <span className="users-header-selected-dot" />
          {selected.length} selected
        </span>
      )}

      {/* Actions */}
      <div className="users-header-actions">
        <button className="users-header-filter-btn">
          <FilterIcon />
          Filter
          <ChevronIcon />
        </button>

        <button className="users-header-add-btn" onClick={onAdd}>
          <span className="users-header-add-icon">
            <PlusIcon />
          </span>
          Add User
        </button>
      </div>

    </div>
  );
}