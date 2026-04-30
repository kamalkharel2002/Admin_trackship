'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import './TransporterHeader.css';

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const ChevronIcon = ({ className }) => (
  <svg
    className={className}
    width="10" height="10" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const CloseSmIcon = () => (
  <svg width="8" height="8" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const STATUS_OPTIONS = [
  { id: 'PENDING_VERIFICATION', label: 'Pending', color: '#C05621' },
  { id: 'APPROVED', label: 'Approved', color: '#1A9E5C' },
  { id: 'DECLINED', label: 'Declined', color: '#C0392B' },
  { id: 'ACTIVE', label: 'Active', color: '#1A9E5C' }, // Added ACTIVE status
];

export default function TransporterHeader({
  selected = [],
  onSearch,
  activeStatuses = [],
  onStatusToggle,
  searchPlaceholder = "Search by name, email, license…",
  showSelectedCount = true,
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const wrapRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search with cleanup
  const handleSearchDebounced = useCallback((value) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      onSearch?.(value);
    }, 300);
  }, [onSearch]);

  useEffect(() => {
    handleSearchDebounced(searchValue);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue, handleSearchDebounced]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleClearFilter = () => {
    onStatusToggle?.(null);
    setOpen(false);
  };

  const handleStatusClick = (statusId) => {
    onStatusToggle?.(statusId);
  };

  const handleRemoveTag = (statusId, e) => {
    e.stopPropagation();
    onStatusToggle?.(statusId);
  };

  // Reset search
  const handleClearSearch = () => {
    setSearchValue('');
    onSearch?.('');
  };

  return (
    <div className="transporter-header">

      {/* Search */}
      <div className="transporter-header-search-wrap">
        <span className="transporter-header-search-icon">
          <SearchIcon />
        </span>
        <input
          className="transporter-header-search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={handleSearchChange}
          aria-label="Search transporters"
        />
        {searchValue && (
          <button
            className="transporter-header-search-clear"
            onClick={handleClearSearch}
            aria-label="Clear search"
          >
            <CloseSmIcon />
          </button>
        )}
      </div>

      {/* Selected count */}
      {showSelectedCount && selected?.length > 0 && (
        <span className="transporter-header-selected-pill">
          <span className="transporter-header-selected-dot" />
          {selected.length} selected
        </span>
      )}

      {/* Right actions */}
      <div className="transporter-header-actions">

        {/* Filter dropdown */}
        <div className="transporter-header-filter-wrap" ref={wrapRef}>
          <button
            className={[
              'transporter-header-filter-btn',
              open ? 'open' : '',
              activeStatuses.length > 0 ? 'active-filter' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => setOpen(o => !o)}
            aria-label="Open filter menu"
            aria-expanded={open}
          >
            <FilterIcon />
            Filter
            {activeStatuses.length > 0 && (
              <span className="transporter-header-filter-badge">
                {activeStatuses.length}
              </span>
            )}
            <ChevronIcon className={`transporter-header-chevron${open ? ' flipped' : ''}`} />
          </button>

          {open && (
            <div className="transporter-header-dropdown" role="menu">
              <div className="transporter-header-dropdown-header">
                Filter by status
              </div>
              <div className="transporter-header-dropdown-list">
                {STATUS_OPTIONS.map(status => {
                  const isActive = activeStatuses.includes(status.id);
                  return (
                    <button
                      key={status.id}
                      className={`transporter-status-option${isActive ? ' active' : ''}`}
                      onClick={() => handleStatusClick(status.id)}
                      role="menuitem"
                      aria-label={`Filter by ${status.label}`}
                    >
                      <span
                        className="transporter-status-check"
                        style={isActive ? { backgroundColor: status.color, borderColor: status.color } : {}}
                      >
                        {isActive && (
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none"
                            stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2 6 5 9 10 3"/>
                          </svg>
                        )}
                      </span>
                      <span className="transporter-status-dot" style={{ backgroundColor: status.color }} />
                      <span className="transporter-status-label">{status.label}</span>
                    </button>
                  );
                })}
              </div>
              {activeStatuses.length > 0 && (
                <div className="transporter-header-dropdown-footer">
                  <button 
                    className="transporter-clear-btn" 
                    onClick={handleClearFilter}
                    aria-label="Clear all filters"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Active filter tags */}
      {activeStatuses.length > 0 && (
        <div className="transporter-header-active-tags" role="list" aria-label="Active filters">
          {STATUS_OPTIONS
            .filter(s => activeStatuses.includes(s.id))
            .map(status => (
              <span key={status.id} className="transporter-header-active-tag" role="listitem">
                <span className="transporter-status-dot" style={{ backgroundColor: status.color }} />
                {status.label}
                <span
                  className="transporter-tag-remove"
                  onClick={(e) => handleRemoveTag(status.id, e)}
                  role="button"
                  aria-label={`Remove ${status.label} filter`}
                >
                  <CloseSmIcon />
                </span>
              </span>
            ))}
        </div>
      )}

    </div>
  );
}