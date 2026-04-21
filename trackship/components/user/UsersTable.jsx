'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/api';
import UsersRow from './UsersRow';
import UsersHeader from './UsersHeader';
import './UsersTable.css';

const ROWS_PER_PAGE = 10;

const ROLES = [
  { id: 'customer',         label: 'Customer',        color: '#F5B700' },
  { id: 'transporter',      label: 'Transporter',     color: '#0EA5E9' },
  { id: 'hub-coordinator',  label: 'Hub Coordinator', color: '#22C55E' },
];

const CloseIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const UserIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const EMPTY_FORM = { user_name: '', email: '', phone: '', password: '', role: 'customer' };

export default function UsersTable({ selected, setSelected, onUpdate }) {
  const [users, setUsers]           = useState([]);
  const [search, setSearch]         = useState('');
  const [activeRoles, setActiveRoles] = useState([]);   // ← role filter state
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);
  const [showModal, setShowModal]   = useState(false);
  const [editUser, setEditUser]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => {
    if (showModal) setTimeout(() => firstInputRef.current?.focus(), 80);
  }, [showModal]);

  async function fetchUsers() {
    try {
      setLoading(true); setError(null);
      const data = await getUsers({ offset: 0, limit: 200 });
      setUsers(data.users || []);
    } catch {
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Role toggle: null = clear all ── */
  function handleRoleToggle(roleId) {
    if (roleId === null) { setActiveRoles([]); return; }
    setActiveRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(r => r !== roleId)
        : [...prev, roleId]
    );
    setPage(1);
  }

  /* ── Filter: search + roles ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchesSearch = !q ||
        [u.user_name, u.email, u.phone, u.role].some(v => v?.toLowerCase().includes(q));
      const matchesRole = activeRoles.length === 0 ||
        activeRoles.includes(u.role?.toLowerCase().replace(/\s+/g, '_'));
      return matchesSearch && matchesRole;
    });
  }, [users, search, activeRoles]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const slice      = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);
  useEffect(() => { setPage(1); }, [search, activeRoles]);

  /* ── Select ── */
  const allChecked  = slice.length > 0 && slice.every(u => selected.includes(u.user_id));
  const someChecked = slice.some(u => selected.includes(u.user_id));
  const toggle      = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll   = () => {
    const ids = slice.map(u => u.user_id);
    if (allChecked) setSelected(prev => prev.filter(x => !ids.includes(x)));
    else setSelected(prev => [...new Set([...prev, ...ids])]);
  };

  /* ── Modal ── */
  function openCreate() { setEditUser(null); setForm(EMPTY_FORM); setShowModal(true); }
  function openEdit(u)  { setEditUser(u); setForm({ ...u, password: '' }); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditUser(null); }

  async function handleSubmit() {
    if (!form.user_name.trim() || !form.email.trim()) return;
    try {
      setSubmitting(true);
      if (editUser) {
        await updateUser(editUser.user_id, form);
      } else {
        await createUser(form);
      }
      closeModal();
      fetchUsers();
      onUpdate?.();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Something went wrong. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await deleteUser(id);
    fetchUsers();
    onUpdate?.();
  }

  /* ── Page range ── */
  const pageRange = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
      acc.push(p); return acc;
    }, []);

  return (
    <>
      <UsersHeader
        selected={selected}
        onSearch={v => { setSearch(v); setPage(1); }}
        onAdd={openCreate}
        activeRoles={activeRoles}
        onRoleToggle={handleRoleToggle}
        roles={ROLES}
      />

      <div className="users-table-wrap">

        {/* Head */}
        <div className="users-table-head">
          <div className="users-table-th">
            <input
              type="checkbox"
              className="users-table-check-all"
              checked={allChecked}
              ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
              onChange={toggleAll}
            />
          </div>
          {['Name', 'Role', 'Email', 'Phone', 'Joined', 'Status', 'Actions'].map(h => (
            <div key={h} className="users-table-th">{h}</div>
          ))}
        </div>

        {/* Body */}
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="users-table-skeleton-row">
              <div className="users-table-skel" style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0 }} />
              <div className="users-table-skel users-table-skel-avatar" />
              <div className="users-table-skel users-table-skel-name" />
              <div className="users-table-skel users-table-skel-text" />
              <div className="users-table-skel users-table-skel-text" />
              <div className="users-table-skel users-table-skel-short" />
              <div className="users-table-skel users-table-skel-short" />
            </div>
          ))
        ) : error ? (
          <div className="users-table-error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="users-table-empty">
            <div className="users-table-empty-icon"><UserIcon /></div>
            <p className="users-table-empty-title">No users found</p>
            <p className="users-table-empty-sub">
              {search || activeRoles.length > 0
                ? 'Try a different search term or filter.'
                : 'Add your first user to get started.'}
            </p>
          </div>
        ) : (
          slice.map(user => (
            <UsersRow
              key={user.user_id}
              user={user}
              checked={selected.includes(user.user_id)}
              onToggle={() => toggle(user.user_id)}
              onEdit={() => openEdit(user)}
              onDelete={() => handleDelete(user.user_id)}
            />
          ))
        )}

        {/* Footer / pagination */}
        {!loading && !error && filtered.length > 0 && (
          <div className="users-table-footer">
            <span className="users-table-footer-info">
              Showing&nbsp;
              <strong>{(safePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePage * ROWS_PER_PAGE, filtered.length)}</strong>
              &nbsp;of&nbsp;<strong>{filtered.length}</strong>&nbsp;users
            </span>
            <div className="users-table-pagination">
              <button className="users-table-page-btn" disabled={safePage === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {pageRange.map((p, i) =>
                p === '…'
                  ? <span key={`d${i}`} className="users-table-page-btn" style={{ cursor: 'default', border: 'none' }}>…</span>
                  : <button key={p} className={`users-table-page-btn${p === safePage ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              )}
              <button className="users-table-page-btn" disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="ut-modal-backdrop" onClick={closeModal}>
          <div className="ut-modal" onClick={e => e.stopPropagation()}>

            <div className="ut-modal-header">
              <h3 className="ut-modal-title">{editUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="ut-modal-close" onClick={closeModal}><CloseIcon /></button>
            </div>

            <div className="ut-modal-body">
              <div className="ut-field">
                <label className="ut-label">Full Name</label>
                <input ref={firstInputRef} className="ut-input" placeholder="e.g. Pema Wangchuk"
                  value={form.user_name} onChange={e => setForm({ ...form, user_name: e.target.value })} />
              </div>
              <div className="ut-field">
                <label className="ut-label">Email Address</label>
                <input className="ut-input" type="email" placeholder="user@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="ut-field">
                <label className="ut-label">Phone Number</label>
                <input className="ut-input" placeholder="+975 17 000 000"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              {!editUser && (
                <>
                  <div className="ut-field">
                    <label className="ut-label">Password</label>
                    <input className="ut-input" type="password" placeholder="Min. 8 characters"
                      value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  </div>
                  <div className="ut-field">
                    <label className="ut-label">Role</label>
                    <select className="ut-select" value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="customer">Customer</option>
                      <option value="hub-coordinator">Hub Coordinator</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="ut-modal-footer">
              <button className="ut-btn-cancel" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button className="ut-btn-submit" onClick={handleSubmit}
                disabled={submitting || !form.user_name.trim() || !form.email.trim()}>
                {submitting ? (editUser ? 'Updating…' : 'Creating…') : (editUser ? 'Update User' : 'Create User')}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}