'use client';
import './UsersRow.css';

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function UsersRow({ user, checked, onToggle }) {
  return (
    <div className={`users-row${checked ? ' checked' : ''}`}>
      {/* Checkbox */}
      <div className="users-row-check">
        <input
          type="checkbox"
          className="users-row-checkbox"
          checked={checked}
          onChange={onToggle}
        />
      </div>

      {/* Name + Avatar */}
      <div className="users-row-name-cell">
        <div className="users-row-avatar">{getInitials(user.user_name)}</div>
        <div className="users-row-name-info">
          <span className="users-row-name">{user.user_name}</span>
        </div>
      </div>

      {/* Role */}
      <div className="users-row-role">{user.role}</div>

      {/* Email */}
      <div className="users-row-email">{user.email}</div>

      {/* Phone */}
      <div className="users-row-phone">{user.phone}</div>

      {/* Date */}
      <div className="users-row-date">{user.created_at}</div>

      {/* Status */}
      <div className="users-row-status">
        <span className="users-row-badge active">
          <span className="users-row-badge-dot" />
          Active
        </span>
      </div>

      {/* Actions */}
      <div className="users-row-actions">
        <button className="users-row-action-btn edit" title="Edit">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button className="users-row-action-btn delete" title="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}