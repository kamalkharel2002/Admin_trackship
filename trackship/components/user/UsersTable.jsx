'use client';

import { useEffect, useState } from 'react';
import { getUsers } from '@/lib/api';
import UsersRow from './UsersRow';
import './UsersTable.css';

export default function UsersTable({ selected, setSelected }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const toggleAll = () => {
    if (selected.length === users.length) {
      setSelected([]);
    } else {
      setSelected(users.map((_, i) => i));
    }
  };

  const toggle = (index) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((x) => x !== index) : [...prev, index]
    );
  };

  if (loading) {
    return (
      <div className="users-table-wrap">
        <div className="users-table-loading">
          <div className="users-table-spinner" />
          Loading users…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-table-wrap">
        <div className="users-table-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="users-table-wrap">
        <div className="users-table-empty">
          <div className="users-table-empty-icon">👤</div>
          <div className="users-table-empty-title">No users found</div>
          <div className="users-table-empty-sub">Add your first user to get started</div>
        </div>
      </div>
    );
  }

  const allChecked = selected.length === users.length;

  return (
    <div className="users-table-wrap">
      {/* Header */}
      <div className="users-table-head">
        <div className="users-table-th" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <input
            type="checkbox"
            style={{
              width: 16, height: 16, borderRadius: 5, cursor: 'pointer',
              accentColor: 'var(--blue)',
            }}
            checked={allChecked}
            onChange={toggleAll}
            title={allChecked ? 'Deselect all' : 'Select all'}
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

      {/* Rows */}
      {users.map((user, index) => (
        <UsersRow
          key={index}
          user={user}
          checked={selected.includes(index)}
          onToggle={() => toggle(index)}
        />
      ))}

      {/* Footer */}
      <div className="users-table-footer">
        <span className="users-table-footer-info">
          Showing <strong>{users.length}</strong> users
          {selected.length > 0 && (
            <> · <strong>{selected.length}</strong> selected</>
          )}
        </span>
      </div>
    </div>
  );
}