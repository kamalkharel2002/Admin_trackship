'use client';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import TransporterRow from './TransporterRow';
import TransporterHeader from './TransporterHeader';
import DocumentModal from './DocumentModal';
import './TransporterTable.css';

import {
  getTransporters,
  deleteTransporter,
  getAdminTransporterDocuments,
  verifyTransporter,
  getPendingVehicleDocuments,
  verifyVehicleDocument,
} from '@/lib/api/transporter';

const ROWS_PER_PAGE = 10;
const DEFAULT_REFRESH_INTERVAL = 30000;

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

const VehicleIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
    viewBox="0 0 24 24">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/>
    <line x1="2" y1="11" x2="22" y2="11"/>
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
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [modalType, setModalType] = useState('registration'); // 'registration' or 'vehicle-change'

  const [docLoading, setDocLoading] = useState(false);
  const [vehicleDocs, setVehicleDocs] = useState([]);
  const [vehiclesWithPendingDocs, setVehiclesWithPendingDocs] = useState([]);

  const [verifying, setVerifying] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  const refreshTimerRef = useRef(null);

  /* ── Data fetching ── */
  const fetchTransporters = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await getTransporters();
      setTransporters(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load transporters. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransporters(); }, [fetchTransporters]);

  /* ── Auto-refresh ── */
  useEffect(() => {
    if (autoRefresh && !showDocModal) {
      refreshTimerRef.current = setInterval(() => fetchTransporters(), refreshInterval);
    }
    return () => clearInterval(refreshTimerRef.current);
  }, [autoRefresh, refreshInterval, fetchTransporters, showDocModal]);

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

  /* ── Documents for Registration ── */
  async function handleViewDocuments(transporter) {
    setSelectedTransporter(transporter);
    setModalType('registration');
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

  /* ── Handle Vehicle Change Requests ── */
  async function handleViewVehicleChangeRequests(transporter) {
    setSelectedTransporter(transporter);
    setModalType('vehicle-change');
    setDocLoading(true);
    clearInterval(refreshTimerRef.current);
    try {
      const pendingDocs = await getPendingVehicleDocuments(transporter.transporter_id);
      
      // Group documents by vehicle
      const vehicleMap = new Map();
      pendingDocs.forEach(doc => {
        if (!vehicleMap.has(doc.vehicle_id)) {
          vehicleMap.set(doc.vehicle_id, {
            vehicle_id: doc.vehicle_id,
            vehicle_no: doc.vehicle_no,
            vehicle_type: doc.vehicle_type,
            documents: [],
            pending_docs_count: 0
          });
        }
        const vehicle = vehicleMap.get(doc.vehicle_id);
        vehicle.documents.push(doc);
        vehicle.pending_docs_count++;
      });
      
      setVehiclesWithPendingDocs(Array.from(vehicleMap.values()));
      setVehicleDocs(pendingDocs);
      setShowDocModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to load vehicle change requests');
    } finally {
      setDocLoading(false);
    }
  }

  /* ── Handle Individual Vehicle Document Verification ── */
  async function handleVehicleDocApprove(documentId) {
    try {
      await verifyVehicleDocument(documentId, 'APPROVED');
      alert('Document approved successfully');
      
      // Refresh the vehicle change requests view
      if (selectedTransporter) {
        const updatedDocs = await getPendingVehicleDocuments(selectedTransporter.transporter_id);
        setVehicleDocs(updatedDocs);
        
        // Re-group documents by vehicle
        const vehicleMap = new Map();
        updatedDocs.forEach(doc => {
          if (!vehicleMap.has(doc.vehicle_id)) {
            vehicleMap.set(doc.vehicle_id, {
              vehicle_id: doc.vehicle_id,
              vehicle_no: doc.vehicle_no,
              vehicle_type: doc.vehicle_type,
              documents: [],
              pending_docs_count: 0
            });
          }
          const vehicle = vehicleMap.get(doc.vehicle_id);
          vehicle.documents.push(doc);
          vehicle.pending_docs_count++;
        });
        setVehiclesWithPendingDocs(Array.from(vehicleMap.values()));
      }
      
      // If no more pending docs, close modal after short delay
      if (vehicleDocs.filter(d => d.document_id !== documentId).length === 0) {
        setTimeout(() => {
          setShowDocModal(false);
          fetchTransporters(); // Refresh to update any statuses
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to approve document');
    }
  }

  async function handleVehicleDocReject(documentId) {
    const reason = prompt('Provide a reason for rejecting this document:');
    if (reason === null) return;
    
    try {
      await verifyVehicleDocument(documentId, 'REJECTED');
      alert('Document rejected successfully');
      
      // Refresh the vehicle change requests view
      if (selectedTransporter) {
        const updatedDocs = await getPendingVehicleDocuments(selectedTransporter.transporter_id);
        setVehicleDocs(updatedDocs);
        
        // Re-group documents by vehicle
        const vehicleMap = new Map();
        updatedDocs.forEach(doc => {
          if (!vehicleMap.has(doc.vehicle_id)) {
            vehicleMap.set(doc.vehicle_id, {
              vehicle_id: doc.vehicle_id,
              vehicle_no: doc.vehicle_no,
              vehicle_type: doc.vehicle_type,
              documents: [],
              pending_docs_count: 0
            });
          }
          const vehicle = vehicleMap.get(doc.vehicle_id);
          vehicle.documents.push(doc);
          vehicle.pending_docs_count++;
        });
        setVehiclesWithPendingDocs(Array.from(vehicleMap.values()));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to reject document');
    }
  }

  /* ── CRUD handlers ── */
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

  return (
    <>
      {/* Header row */}
      <div className="transporter-table-header-wrapper">
        <TransporterHeader
          selected={selected}
          onSearch={v => { setSearch(v); setPage(1); }}
          activeStatuses={statusFilter.length > 0 ? statusFilter : activeStatuses}
          onStatusToggle={handleStatusToggle}
        />
      </div>

      {/* Tables */}
      <div className="transporter-tables-container">

        {/* Pending Requests Table (Initial Registration) */}
        <div className="transporter-table-section">
          <div className="transporter-table-section-header">
            <h3 className="transporter-table-section-title">Pending Registration Requests</h3>
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
              </div>
            ) : (
              slicePending.map(transporter => (
                <TransporterRow
                  key={transporter.transporter_id}
                  transporter={transporter}
                  checked={selected.includes(transporter.transporter_id)}
                  onToggle={() => togglePending(transporter.transporter_id)}
                  onView={() => handleViewDocuments(transporter)}
                  onDelete={() => handleDelete(transporter.transporter_id)}
                  onApprove={() => handleVerifyAction(transporter, 'APPROVED')}
                  onDecline={() => handleVerifyAction(transporter, 'DECLINED')}
                />
              ))
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

        {/* Active Transporters Table */}
        <div className="transporter-table-section">
          <div className="transporter-table-section-header">
            <h3 className="transporter-table-section-title">Active Transporters</h3>
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
                <p className="transporter-table-empty-title">No active transporters</p>
                <p className="transporter-table-empty-sub">
                  Active transporters will appear here.
                </p>
              </div>
            ) : (
              sliceApproved.map(transporter => (
                <TransporterRow
                  key={transporter.transporter_id}
                  transporter={transporter}
                  checked={selected.includes(transporter.transporter_id)}
                  onToggle={() => toggleApproved(transporter.transporter_id)}
                  onView={() => handleViewDocuments(transporter)}
                  onDelete={() => handleDelete(transporter.transporter_id)}
                  onViewVehicleChanges={() => handleViewVehicleChangeRequests(transporter)}
                  hasVehicleChanges={transporter.has_pending_vehicle_docs}
                />
              ))
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

      {/* Document Viewer Modal - Supports both registration and vehicle change */}
      {showDocModal && (
        <DocumentModal
          transporter={selectedTransporter}
          documents={modalType === 'registration' ? documents : vehicleDocs}
          vehicles={modalType === 'vehicle-change' ? vehiclesWithPendingDocs : []}
          loading={docLoading}
          modalType={modalType}
          onClose={() => {
            setShowDocModal(false);
            setModalType('registration');
            setVehicleDocs([]);
            setVehiclesWithPendingDocs([]);
            if (autoRefresh) {
              clearInterval(refreshTimerRef.current);
              refreshTimerRef.current = setInterval(() => fetchTransporters(), refreshInterval);
            }
          }}
          onApprove={() => {
            if (modalType === 'registration') {
              handleVerifyAction(selectedTransporter, 'APPROVED');
              setShowDocModal(false);
            }
          }}
          onDecline={() => {
            if (modalType === 'registration') {
              handleVerifyAction(selectedTransporter, 'DECLINED');
              setShowDocModal(false);
            }
          }}
          onVehicleDocApprove={modalType === 'vehicle-change' ? handleVehicleDocApprove : undefined}
          onVehicleDocReject={modalType === 'vehicle-change' ? handleVehicleDocReject : undefined}
        />
      )}
    </>
  );
}