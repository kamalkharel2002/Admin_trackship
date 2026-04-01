'use client';
import { useState, useRef, useEffect } from 'react';
import './UsersHeader.css';

const FilterIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.8"
    strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export default function UsersHeader({ selected, onSearch, onAdd, activeRoles = [], onRoleToggle, roles = [] }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="users-header">

      {/* Search */}
      <div className="users-header-search-wrap">
        <span className="users-header-search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </span>
        <input
          className="users-header-search"
          placeholder="Search by name, email, role…"
          onChange={e => onSearch?.(e.target.value)}
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

        {/* Filter wrap — positions the dropdown */}
        <div className="users-header-filter-wrap" ref={wrapRef}>
          <button
            className={[
              'users-header-filter-btn',
              open              ? 'open'          : '',
              activeRoles.length > 0 ? 'active-filter' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => setOpen(o => !o)}
          >
            <FilterIcon />
            Filter
            {activeRoles.length > 0 && (
              <span className="users-header-filter-badge">{activeRoles.length}</span>
            )}
            <svg
              className={`users-header-chevron${open ? ' flipped' : ''}`}
              width="11" height="11" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {open && (
            <div className="users-header-dropdown">
              <div className="users-header-dropdown-header">Filter by role</div>
              <div className="users-header-dropdown-list">
                {roles.map(role => {
                  const isActive = activeRoles.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      className={`users-header-role-option${isActive ? ' active' : ''}`}
                      onClick={() => onRoleToggle?.(role.id)}
                    >
                      <span
                        className="users-header-role-check"
                        style={isActive ? { background: role.color, borderColor: role.color } : {}}
                      >
                        {isActive && (
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none"
                            stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2 6 5 9 10 3"/>
                          </svg>
                        )}
                      </span>
                      <span className="users-header-role-dot" style={{ background: role.color }} />
                      <span className="users-header-role-label">{role.label}</span>
                    </button>
                  );
                })}
              </div>
              {activeRoles.length > 0 && (
                <div className="users-header-dropdown-footer">
                  <button className="users-header-clear-btn" onClick={() => onRoleToggle?.(null)}>
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add User */}
        <button className="users-header-add-btn" onClick={onAdd}>
          <span className="users-header-add-icon"><PlusIcon /></span>
          Add User
        </button>
      </div>

      {/* Active filter tags */}
      {activeRoles.length > 0 && (
        <div className="users-header-active-tags">
          {roles.filter(r => activeRoles.includes(r.id)).map(role => (
            <span key={role.id} className="users-header-active-tag">
              <span className="users-header-role-dot" style={{ background: role.color }} />
              {role.label}
              <span className="users-header-tag-remove" onClick={() => onRoleToggle?.(role.id)}>
                <svg width="9" height="9" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </span>
            </span>
          ))}
        </div>
      )}

    </div>
  );
}