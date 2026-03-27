'use client';
import './UsersHeader.css';

export default function UsersHeader({ selected }) {
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
          placeholder="Search users…"
        />
      </div>

      {/* Selected count pill */}
      {selected.length > 0 && (
        <span className="users-header-selected-pill">
          <span className="users-header-selected-dot" />
          {selected.length} selected
        </span>
      )}

      {/* Right actions */}
      <div className="users-header-actions">
        <button className="users-header-filter-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filter
        </button>

        <button className="users-header-add-btn">
          <span className="users-header-add-icon">+</span>
          Add User
        </button>
      </div>
    </div>
  );
}