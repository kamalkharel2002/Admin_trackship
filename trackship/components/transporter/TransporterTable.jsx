// TransporterTable.jsx
'use client';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import TransporterRow from './TransporterRow';
import TransporterHeader from './TransporterHeader';
import DocumentModal from './DocumentModal';
import './TransporterTable.css';

import {
  getTransporters,
  createTransporter,
  updateTransporter,
  deleteTransporter,
  getAdminTransporterDocuments,
  verifyTransporter,
} from '@/lib/api';

const ROWS_PER_PAGE = 10;
const DEFAULT_REFRESH_INTERVAL = 30000;

const EMPTY_FORM = {
  user_name: '',
  email: '',
  phone: '',
  password: '',
  license_no: '',
  vehicle_type: '',
};

/* ── Icons ── */
const CloseIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const TruckIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="1" y="3" width="15" height="13"/>
    <rect x="16" y="8" width="7" height="8"/>
    <circle cx="6.5" cy="16.5" r="2.5"/>
    <circle cx="19.5" cy="16.5" r="2.5"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M23 4v6h-6"/>
    <path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

export default function TransporterTable({
  selected,
  setSelected,
  onUpdate,
  searchQuery = '',
  statusFilter = [],
  autoRefresh = true,
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
}) {
  const [transporters, setTransporters] = useState([]);
  const [search, setSearch] = useState('');
  const [activeStatuses, setActiveStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [editTransporter, setEditTransporter] = useState(null);
  const [selectedTransporter, setSelectedTransporter] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  const [lastUpdated, setLastUpdated] = useState(null);
  const firstInputRef = useRef(null);
  const refreshTimerRef = useRef(null);

  /* ── Data fetching ── */
  const fetchTransporters = useCallback(async (showRefreshIndicator = false) => {
    showRefreshIndicator ? setRefreshing(true) : setLoading(true);
    try {
      setError(null);
      const data = await getTransporters();
      setTransporters(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError('Failed to load transporters. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTransporters(); }, [fetchTransporters]);

  /* ── Auto-refresh ── */
  useEffect(() => {
    if (autoRefresh && !showModal && !showDocModal) {
      refreshTimerRef.current = setInterval(() => fetchTransporters(true), refreshInterval);
    }
    return () => clearInterval(refreshTimerRef.current);
  }, [autoRefresh, refreshInterval, fetchTransporters, showModal, showDocModal]);

  useEffect(() => {
    if (showModal) setTimeout(() => firstInputRef.current?.focus(), 80);
  }, [showModal]);

  /* ── Filtering ── */
  const pendingTransporters = useMemo(() => {
    return transporters.filter(t => t.verification_status === 'PENDING_VERIFICATION');
  }, [transporters]);

  const approvedTransporters = useMemo(() => {
    return transporters.filter(t => t.verification_status === 'APPROVED' || t.verification_status === 'DECLINED');
  }, [transporters]);

  const filteredPending = useMemo(() => {
    const q = (searchQuery || search).toLowerCase();
    return pendingTransporters.filter(t => {
      const matchesSearch = !q ||
        [t.user_name, t.email, t.phone, t.license_no].some(v => v?.toLowerCase().includes(q));
      return matchesSearch;
    });
  }, [pendingTransporters, searchQuery, search]);

  const filteredApproved = useMemo(() => {
    const q = (searchQuery || search).toLowerCase();
    const statuses = statusFilter.length > 0 ? statusFilter : activeStatuses;
    return approvedTransporters.filter(t => {
      const matchesSearch = !q ||
        [t.user_name, t.email, t.phone, t.license_no].some(v => v?.toLowerCase().includes(q));
      const matchesStatus = statuses.length === 0 || statuses.includes(t.verification_status);
      return matchesSearch && matchesStatus;
    });
  }, [approvedTransporters, searchQuery, search, statusFilter, activeStatuses]);

  const totalPagesPending = Math.max(1, Math.ceil(filteredPending.length / ROWS_PER_PAGE));
  const safePagePending = Math.min(page, totalPagesPending);
  const slicePending = filteredPending.slice((safePagePending - 1) * ROWS_PER_PAGE, safePagePending * ROWS_PER_PAGE);

  const totalPagesApproved = Math.max(1, Math.ceil(filteredApproved.length / ROWS_PER_PAGE));
  const safePageApproved = Math.min(page, totalPagesApproved);
  const sliceApproved = filteredApproved.slice((safePageApproved - 1) * ROWS_PER_PAGE, safePageApproved * ROWS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, activeStatuses, searchQuery, statusFilter]);

  /* ── Selection ── */
  const allCheckedPending = slicePending.length > 0 && slicePending.every(t => selected.includes(t.transporter_id));
  const someCheckedPending = slicePending.some(t => selected.includes(t.transporter_id));
  const togglePending = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  const toggleAllPending = () => {
    const ids = slicePending.map(t => t.transporter_id);
    if (allCheckedPending) setSelected(prev => prev.filter(x => !ids.includes(x)));
    else setSelected(prev => [...new Set([...prev, ...ids])]);
  };

  const allCheckedApproved = sliceApproved.length > 0 && sliceApproved.every(t => selected.includes(t.transporter_id));
  const someCheckedApproved = sliceApproved.some(t => selected.includes(t.transporter_id));
  const toggleApproved = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  const toggleAllApproved = () => {
    const ids = sliceApproved.map(t => t.transporter_id);
    if (allCheckedApproved) setSelected(prev => prev.filter(x => !ids.includes(x)));
    else setSelected(prev => [...new Set([...prev, ...ids])]);
  };

  /* ── Status filter toggle ── */
  function handleStatusToggle(statusId) {
    if (statusId === null) { setActiveStatuses([]); return; }
    setActiveStatuses(prev =>
      prev.includes(statusId) ? prev.filter(s => s !== statusId) : [...prev, statusId]
    );
    setPage(1);
  }

  /* ── Documents ── */
  async function handleViewDocuments(transporter) {
    setSelectedTransporter(transporter);
    setDocLoading(true);
    clearInterval(refreshTimerRef.current);
    try {
      const docs = await getAdminTransporterDocuments(transporter.transporter_id);
      setDocuments(docs?.fileList || []);
      setShowDocModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to load documents');
    } finally {
      setDocLoading(false);
    }
  }

  /* ── Modal helpers ── */
  function openCreate() {
    setEditTransporter(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(t) {
    setEditTransporter(t);
    setForm({
      user_name: t.user_name || '',
      email: t.email || '',
      phone: t.phone || '',
      password: '',
      license_no: t.license_no || '',
      vehicle_type: t.vehicle_type || '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditTransporter(null);
  }

  /* ── CRUD handlers ── */
  async function handleSubmit() {
    if (!form.user_name.trim() || !form.email.trim()) return;
    if (!editTransporter && !form.password.trim()) {
      alert('Password is required for new transporters');
      return;
    }
    try {
      setSubmitting(true);
      if (editTransporter) {
        await updateTransporter(editTransporter.transporter_id, form);
      } else {
        await createTransporter(form);
      }
      closeModal();
      await fetchTransporters();
      onUpdate?.();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this transporter? This action cannot be undone.')) return;
    try {
      await deleteTransporter(id);
      await fetchTransporters();
      onUpdate?.();
      setSelected(prev => prev.filter(x => x !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete transporter');
    }
  }

  async function handleVerifyAction(transporter, action) {
    if (!transporter) return;
    let reason = null;
    if (action === 'DECLINED') {
      reason = prompt('Provide a reason for declining this transporter:');
      if (reason === null) return;
    }
    try {
      setVerifying(true);
      setVerifyingId(transporter.transporter_id);
      await verifyTransporter(transporter.transporter_id, action, reason);
      await fetchTransporters();
      onUpdate?.();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Unable to update transporter status');
    } finally {
      setVerifying(false);
      setVerifyingId(null);
    }
  }

  /* ── Form field helper ── */
  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const canSubmit = form.user_name.trim() && form.email.trim() &&
    (editTransporter || form.password.trim());

  return (
    <>
      {/* Header row with refresh controls */}
      <div className="transporter-table-header-wrapper">
        <TransporterHeader
          selected={selected}
          onSearch={v => { setSearch(v); setPage(1); }}
          onAdd={openCreate}
          activeStatuses={statusFilter.length > 0 ? statusFilter : activeStatuses}
          onStatusToggle={handleStatusToggle}
        />

        <div className="transporter-refresh-controls">
          <button
            className="transporter-refresh-btn"
            onClick={() => fetchTransporters(true)}
            disabled={refreshing}
            title="Refresh data"
          >
            <RefreshIcon />
            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
          {lastUpdated && (
            <span className="transporter-last-updated">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Tables */}
      <div className="transporter-tables-container">

        {/* Pending Requests Table */}
        <div className="transporter-table-section">
          <div className="transporter-table-section-header">
            <h3 className="transporter-table-section-title">Pending Requests</h3>
            <span className="transporter-table-section-count">
              {filteredPending.length} transporter{filteredPending.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="transporter-table-wrap">
            {/* Head */}
            <div className="transporter-table-head">
              <div className="transporter-table-th">
                <input
                  type="checkbox"
                  className="transporter-table-check-all"
                  checked={allCheckedPending}
                  ref={el => { if (el) el.indeterminate = someCheckedPending && !allCheckedPending; }}
                  onChange={toggleAllPending}
                />
              </div>
              {['Name', 'Email', 'Phone', 'License', 'Status', 'Actions'].map(h => (
                <div key={h} className="transporter-table-th">{h}</div>
              ))}
            </div>

            {/* Body */}
            {loading && !transporters.length ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="transporter-table-skeleton-row">
                  <div className="transporter-table-skel" style={{ width: 15, height: 15, borderRadius: 4 }} />
                  <div className="transporter-table-skel transporter-table-skel-avatar" />
                  <div className="transporter-table-skel transporter-table-skel-name" />
                  <div className="transporter-table-skel transporter-table-skel-text" />
                  <div className="transporter-table-skel transporter-table-skel-text" />
                  <div className="transporter-table-skel transporter-table-skel-short" />
                  <div className="transporter-table-skel transporter-table-skel-short" />
                </div>
              ))
            ) : error ? (
              <div className="transporter-table-error">{error}</div>
            ) : filteredPending.length === 0 ? (
              <div className="transporter-table-empty">
                <div className="transporter-table-empty-icon"><TruckIcon /></div>
                <p className="transporter-table-empty-title">No pending requests</p>
                <p className="transporter-table-empty-sub">
                  All transporter requests have been processed.
                </p>
              </div>
            ) : (
              <>
                {refreshing && (
                  <div className="transporter-refresh-overlay">
                    <div className="transporter-refresh-spinner" />
                    <span>Updating…</span>
                  </div>
                )}
                {slicePending.map(transporter => (
                  <TransporterRow
                    key={transporter.transporter_id}
                    transporter={transporter}
                    checked={selected.includes(transporter.transporter_id)}
                    onToggle={() => togglePending(transporter.transporter_id)}
                    onView={() => handleViewDocuments(transporter)}
                    onEdit={() => openEdit(transporter)}
                    onDelete={() => handleDelete(transporter.transporter_id)}
                    onApprove={() => handleVerifyAction(transporter, 'APPROVED')}
                    onDecline={() => handleVerifyAction(transporter, 'DECLINED')}
                  />
                ))}
              </>
            )}

            {/* Footer */}
            {!loading && !error && filteredPending.length > 0 && (
              <div className="transporter-table-footer">
                <span className="transporter-table-footer-info">
                  Showing&nbsp;
                  <strong>{(safePagePending - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePagePending * ROWS_PER_PAGE, filteredPending.length)}</strong>
                  &nbsp;of&nbsp;<strong>{filteredPending.length}</strong>&nbsp;pending requests
                </span>
                <div className="transporter-table-pagination">
                  <button
                    className="transporter-table-page-btn"
                    disabled={safePagePending === 1}
                    onClick={() => setPage(p => p - 1)}
                  >‹</button>
                  {Array.from({ length: totalPagesPending }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPagesPending || Math.abs(p - safePagePending) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                      acc.push(p);
                      return acc;
                    }, []).map((p, i) =>
                      p === '…' ? (
                        <span key={`d-pending-${i}`} className="transporter-table-page-btn"
                          style={{ cursor: 'default', border: 'none' }}>…</span>
                      ) : (
                        <button
                          key={`pending-${p}`}
                          className={`transporter-table-page-btn${p === safePagePending ? ' active' : ''}`}
                          onClick={() => setPage(p)}
                        >{p}</button>
                      )
                    )}
                  <button
                    className="transporter-table-page-btn"
                    disabled={safePagePending === totalPagesPending}
                    onClick={() => setPage(p => p + 1)}
                  >›</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Approved/Active Transporters Table */}
        <div className="transporter-table-section">
          <div className="transporter-table-section-header">
            <h3 className="transporter-table-section-title">Approved & Active Transporters</h3>
            <span className="transporter-table-section-count">
              {filteredApproved.length} transporter{filteredApproved.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="transporter-table-wrap">
            {/* Head */}
            <div className="transporter-table-head">
              <div className="transporter-table-th">
                <input
                  type="checkbox"
                  className="transporter-table-check-all"
                  checked={allCheckedApproved}
                  ref={el => { if (el) el.indeterminate = someCheckedApproved && !allCheckedApproved; }}
                  onChange={toggleAllApproved}
                />
              </div>
              {['Name', 'Email', 'Phone', 'License', 'Status', 'Actions'].map(h => (
                <div key={h} className="transporter-table-th">{h}</div>
              ))}
            </div>

            {/* Body */}
            {loading && !transporters.length ? (
              [...Array(3)].map((_, i) => (
                <div key={`approved-skel-${i}`} className="transporter-table-skeleton-row">
                  <div className="transporter-table-skel" style={{ width: 15, height: 15, borderRadius: 4 }} />
                  <div className="transporter-table-skel transporter-table-skel-avatar" />
                  <div className="transporter-table-skel transporter-table-skel-name" />
                  <div className="transporter-table-skel transporter-table-skel-text" />
                  <div className="transporter-table-skel transporter-table-skel-text" />
                  <div className="transporter-table-skel transporter-table-skel-short" />
                  <div className="transporter-table-skel transporter-table-skel-short" />
                </div>
              ))
            ) : error ? (
              <div className="transporter-table-error">{error}</div>
            ) : filteredApproved.length === 0 ? (
              <div className="transporter-table-empty">
                <div className="transporter-table-empty-icon"><TruckIcon /></div>
                <p className="transporter-table-empty-title">No approved transporters</p>
                <p className="transporter-table-empty-sub">
                  Approved transporters will appear here.
                </p>
              </div>
            ) : (
              <>
                {refreshing && (
                  <div className="transporter-refresh-overlay">
                    <div className="transporter-refresh-spinner" />
                    <span>Updating…</span>
                  </div>
                )}
                {sliceApproved.map(transporter => (
                  <TransporterRow
                    key={transporter.transporter_id}
                    transporter={transporter}
                    checked={selected.includes(transporter.transporter_id)}
                    onToggle={() => toggleApproved(transporter.transporter_id)}
                    onView={() => handleViewDocuments(transporter)}
                    onEdit={() => openEdit(transporter)}
                    onDelete={() => handleDelete(transporter.transporter_id)}
                    onApprove={() => handleVerifyAction(transporter, 'APPROVED')}
                    onDecline={() => handleVerifyAction(transporter, 'DECLINED')}
                  />
                ))}
              </>
            )}

            {/* Footer */}
            {!loading && !error && filteredApproved.length > 0 && (
              <div className="transporter-table-footer">
                <span className="transporter-table-footer-info">
                  Showing&nbsp;
                  <strong>{(safePageApproved - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePageApproved * ROWS_PER_PAGE, filteredApproved.length)}</strong>
                  &nbsp;of&nbsp;<strong>{filteredApproved.length}</strong>&nbsp;approved transporters
                </span>
                <div className="transporter-table-pagination">
                  <button
                    className="transporter-table-page-btn"
                    disabled={safePageApproved === 1}
                    onClick={() => setPage(p => p - 1)}
                  >‹</button>
                  {Array.from({ length: totalPagesApproved }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPagesApproved || Math.abs(p - safePageApproved) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                      acc.push(p);
                      return acc;
                    }, []).map((p, i) =>
                      p === '…' ? (
                        <span key={`d-approved-${i}`} className="transporter-table-page-btn"
                          style={{ cursor: 'default', border: 'none' }}>…</span>
                      ) : (
                        <button
                          key={`approved-${p}`}
                          className={`transporter-table-page-btn${p === safePageApproved ? ' active' : ''}`}
                          onClick={() => setPage(p)}
                        >{p}</button>
                      )
                    )}
                  <button
                    className="transporter-table-page-btn"
                    disabled={safePageApproved === totalPagesApproved}
                    onClick={() => setPage(p => p + 1)}
                  >›</button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="tt-modal-backdrop" onClick={closeModal}>
          <div className="tt-modal" onClick={e => e.stopPropagation()}>
            <div className="tt-modal-header">
              <h3 className="tt-modal-title">
                {editTransporter ? 'Edit Transporter' : 'Add Transporter'}
              </h3>
              <button className="tt-modal-close" onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>

            <div className="tt-modal-body">
              <div className="tt-field">
                <label className="tt-label">Full Name *</label>
                <input
                  ref={firstInputRef}
                  className="tt-input"
                  placeholder="e.g. Tenzin Dorji"
                  value={form.user_name}
                  onChange={setField('user_name')}
                />
              </div>
              <div className="tt-field">
                <label className="tt-label">Email Address *</label>
                <input
                  className="tt-input"
                  type="email"
                  placeholder="transporter@example.com"
                  value={form.email}
                  onChange={setField('email')}
                />
              </div>
              <div className="tt-field">
                <label className="tt-label">Phone Number</label>
                <input
                  className="tt-input"
                  placeholder="+975 17 000 000"
                  value={form.phone}
                  onChange={setField('phone')}
                />
              </div>
              <div className="tt-field">
                <label className="tt-label">License Number</label>
                <input
                  className="tt-input"
                  placeholder="License number"
                  value={form.license_no}
                  onChange={setField('license_no')}
                />
              </div>
              {!editTransporter && (
                <>
                  <div className="tt-field">
                    <label className="tt-label">Password *</label>
                    <input
                      className="tt-input"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={form.password}
                      onChange={setField('password')}
                    />
                  </div>
                  <div className="tt-field">
                    <label className="tt-label">Vehicle Type</label>
                    <input
                      className="tt-input"
                      placeholder="e.g. Truck, Van, Pickup"
                      value={form.vehicle_type}
                      onChange={setField('vehicle_type')}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="tt-modal-footer">
              <button className="tt-btn-cancel" onClick={closeModal} disabled={submitting}>
                Cancel
              </button>
              <button
                className="tt-btn-submit"
                onClick={handleSubmit}
                disabled={submitting || !canSubmit}
              >
                {submitting
                  ? (editTransporter ? 'Updating…' : 'Creating…')
                  : (editTransporter ? 'Update Transporter' : 'Create Transporter')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocModal && (
        <DocumentModal
          transporter={selectedTransporter}
          documents={documents}
          loading={docLoading}
          onClose={() => {
            setShowDocModal(false);
            if (autoRefresh) {
              clearInterval(refreshTimerRef.current);
              refreshTimerRef.current = setInterval(() => fetchTransporters(true), refreshInterval);
            }
          }}
        />
      )}
    </>
  );
}