'use client';
import { useEffect, useState } from 'react';
import { getUsers } from '@/lib/api/users';
import UsersRow from './UsersRow';
import './UsersTable.css';

const SKELETON_ROWS = 6;

function SkeletonRows() {
  return Array.from({ length: SKELETON_ROWS }).map((_, i) => (
    <div className="users-table-skeleton-row" key={i}>
      <div className="users-table-skel" style={{ width: 15, height: 15, borderRadius: 5 }} />
      <div className="users-table-skel users-table-skel-avatar" />
      <div className="users-table-skel users-table-skel-name" />
      <div className="users-table-skel users-table-skel-text" />
      <div className="users-table-skel users-table-skel-text" />
      <div className="users-table-skel users-table-skel-short" />
      <div className="users-table-skel users-table-skel-short" />
    </div>
  ));
}

export default function UsersTable({ selected, setSelected }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const data = await getUsers({ offset: 0, limit: 10 });
      setUsers(data.users);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  const allChecked = users.length > 0 && selected.length === users.length;

  const toggleAll = () =>
    setSelected(allChecked ? [] : users.map((_, i) => i));

  const toggle = (index) =>
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((x) => x !== index) : [...prev, index]
    );

  return (
    <div className="users-table-wrap">
      {/* Column headers */}
      <div className="users-table-head">
        <div className="users-table-th">
          <input
            type="checkbox"
            className="users-table-check-all"
            checked={allChecked}
            onChange={toggleAll}
            disabled={loading || !!error}
          />
        </div>
        <div className="users-table-th">Name</div>
        <div className="users-table-th">Role</div>
        <div className="users-table-th">Email</div>
        <div className="users-table-th">Phone</div>
        <div className="users-table-th">Date Created</div>
        <div className="users-table-th">Status</div>
        <div className="users-table-th">Actions</div>
      </div>

      {/* Body */}
      {loading ? (
        <SkeletonRows />
      ) : error ? (
        <div className="users-table-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="users-table-empty">
          <div className="users-table-empty-icon">👤</div>
          <div className="users-table-empty-title">No users yet</div>
          <div className="users-table-empty-sub">Add your first team member to get started</div>
        </div>
      ) : (
        users.map((user, index) => (
          <UsersRow
            key={index}
            user={user}
            checked={selected.includes(index)}
            onToggle={() => toggle(index)}
          />
        ))
      )}

      {/* Footer */}
      {!loading && !error && (
        <div className="users-table-footer">
          <span className="users-table-footer-info">
            Showing <strong>{users.length}</strong> users
            {selected.length > 0 && (
              <> &middot; <strong>{selected.length}</strong> selected</>
            )}
          </span>
          <div className="users-table-pagination">
            <button className="users-table-page-btn" disabled>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button className="users-table-page-btn active">1</button>
            <button className="users-table-page-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}