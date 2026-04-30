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
  verifyVehicle,
  getAllPendingVehicleRequests,
} from '@/lib/api/transporter';

const ROWS_PER_PAGE = 10;
const DEFAULT_REFRESH_INTERVAL = 30000;

/* ── Icons ── */
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
  const [allPendingVehicleRequests, setAllPendingVehicleRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [activeStatuses, setActiveStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingVehicleRequests, setLoadingVehicleRequests] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [vehicleRequestPage, setVehicleRequestPage] = useState(1);

  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState(null);
  const [selectedVehicleRequest, setSelectedVehicleRequest] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [modalType, setModalType] = useState('registration');
  const [docLoading, setDocLoading] = useState(false);
  const [vehicleRequests, setVehicleRequests] = useState([]);
  const [vehiclesWithPendingDocs, setVehiclesWithPendingDocs] = useState([]);
  const [processingVehicleId, setProcessingVehicleId] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  const refreshTimerRef = useRef(null);
  const isRefreshingRef = useRef(false);

  /* ── Data fetching ── */
  const fetchTransporters = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setError(null);
      const data = await getTransporters();
      setTransporters(data || []);
    } catch (err) {
      console.error(err);
      if (!silent) setError('Failed to load transporters. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchAllPendingVehicleRequests = useCallback(async (silent = false) => {
    if (!silent) setLoadingVehicleRequests(true);
    try {
      const requests = await getAllPendingVehicleRequests();
      console.log('All pending vehicle requests:', requests);
      setAllPendingVehicleRequests(requests || []);
    } catch (err) {
      console.error('Failed to fetch pending vehicle requests:', err);
    } finally {
      if (!silent) setLoadingVehicleRequests(false);
    }
  }, []);

  // Refresh all data - silent by default for auto-refresh
  const refreshAllData = useCallback(async (silent = true) => {
    if (isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    try {
      await Promise.all([
        fetchTransporters(silent),
        fetchAllPendingVehicleRequests(silent)
      ]);
      onUpdate?.();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetchTransporters, fetchAllPendingVehicleRequests, onUpdate]);

  // Initial load - not silent
  useEffect(() => { 
    refreshAllData(false);
  }, [refreshAllData]);

  /* ── Auto-refresh with silent mode ── */
  useEffect(() => {
    if (autoRefresh && !showDocModal) {
      refreshTimerRef.current = setInterval(() => {
        refreshAllData(true);
      }, refreshInterval);
    }
    return () => clearInterval(refreshTimerRef.current);
  }, [autoRefresh, refreshInterval, refreshAllData, showDocModal]);

  /* ── Filtering ── */
  const pendingTransporters = useMemo(() => {
    return transporters.filter(t => t.verification_status === 'PENDING_VERIFICATION');
  }, [transporters]);

  const approvedTransporters = useMemo(() => {
    return transporters.filter(t => ['APPROVED', 'ACTIVE', 'DECLINED'].includes(t.verification_status));
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

  const filteredVehicleRequests = useMemo(() => {
    const q = (searchQuery || search).toLowerCase();
    return allPendingVehicleRequests.filter(request => {
      const matchesSearch = !q ||
        [request.user_name, request.email, request.vehicle_no].some(v => v?.toLowerCase().includes(q));
      return matchesSearch;
    });
  }, [allPendingVehicleRequests, searchQuery, search]);

  const totalPagesPending = Math.max(1, Math.ceil(filteredPending.length / ROWS_PER_PAGE));
  const safePagePending = Math.min(page, totalPagesPending);
  const slicePending = filteredPending.slice((safePagePending - 1) * ROWS_PER_PAGE, safePagePending * ROWS_PER_PAGE);

  const totalPagesApproved = Math.max(1, Math.ceil(filteredApproved.length / ROWS_PER_PAGE));
  const safePageApproved = Math.min(page, totalPagesApproved);
  const sliceApproved = filteredApproved.slice((safePageApproved - 1) * ROWS_PER_PAGE, safePageApproved * ROWS_PER_PAGE);

  const totalPagesVehicleRequests = Math.max(1, Math.ceil(filteredVehicleRequests.length / ROWS_PER_PAGE));
  const safePageVehicleRequests = Math.min(vehicleRequestPage, totalPagesVehicleRequests);
  const sliceVehicleRequests = filteredVehicleRequests.slice((safePageVehicleRequests - 1) * ROWS_PER_PAGE, safePageVehicleRequests * ROWS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, activeStatuses, searchQuery, statusFilter]);
  useEffect(() => { setVehicleRequestPage(1); }, [search, searchQuery]);

  /* ── Selection handlers ── */
  const allCheckedPending = slicePending.length > 0 && slicePending.every(t => selected.includes(t.transporter_id));
  const someCheckedPending = slicePending.some(t => selected.includes(t.transporter_id));
  
  const togglePending = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  
  const toggleAllPending = () => {
    const ids = slicePending.map(t => t.transporter_id);
    if (allCheckedPending) {
      setSelected(prev => prev.filter(x => !ids.includes(x)));
    } else {
      setSelected(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const allCheckedApproved = sliceApproved.length > 0 && sliceApproved.every(t => selected.includes(t.transporter_id));
  const someCheckedApproved = sliceApproved.some(t => selected.includes(t.transporter_id));
  
  const toggleApproved = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  
  const toggleAllApproved = () => {
    const ids = sliceApproved.map(t => t.transporter_id);
    if (allCheckedApproved) {
      setSelected(prev => prev.filter(x => !ids.includes(x)));
    } else {
      setSelected(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const handleStatusToggle = (statusId) => {
    if (statusId === null) {
      setActiveStatuses([]);
      return;
    }
    setActiveStatuses(prev =>
      prev.includes(statusId) ? prev.filter(s => s !== statusId) : [...prev, statusId]
    );
    setPage(1);
  };

  /* ── Document handlers ── */
  // For viewing APPROVED documents of active transporters
  const handleViewDocuments = async (transporter) => {
    setSelectedTransporter(transporter);
    setSelectedVehicleRequest(null);
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
  };

  // For viewing PENDING vehicle update requests (from the pending requests section)
  const handleViewVehicleRequest = async (vehicleRequest) => {
    setSelectedTransporter({
      transporter_id: vehicleRequest.transporter_id,
      user_name: vehicleRequest.user_name,
      email: vehicleRequest.email,
      license_no: vehicleRequest.license_no,
      verification_status: 'ACTIVE'
    });
    setSelectedVehicleRequest(vehicleRequest);
    setModalType('vehicle-change');
    setDocLoading(true);
    clearInterval(refreshTimerRef.current);
    try {
      const pendingDocs = await getPendingVehicleDocuments(vehicleRequest.transporter_id);
      const vehicleDocs = pendingDocs.filter(doc => doc.vehicle_id === vehicleRequest.vehicle_id);
      
      setVehicleRequests(vehicleDocs);
      setVehiclesWithPendingDocs([{
        vehicle_id: vehicleRequest.vehicle_id,
        vehicle_no: vehicleRequest.vehicle_no,
        vehicle_type: vehicleRequest.vehicle_type,
        documents: vehicleDocs,
        pending_docs_count: vehicleDocs.filter(d => d.status === 'PENDING').length
      }]);
      setShowDocModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to load vehicle documents');
    } finally {
      setDocLoading(false);
    }
  };

  /* ── Verification handlers ── */
  const handleVehicleApprove = async (vehicleId) => {
    setProcessingVehicleId(vehicleId);
    try {
      await verifyVehicle(vehicleId, 'APPROVED');
      alert('Vehicle approved successfully!');
      
      await refreshAllData(false);
      
      if (selectedTransporter && modalType === 'vehicle-change') {
        const updatedDocs = await getPendingVehicleDocuments(selectedTransporter.transporter_id);
        setVehicleRequests(updatedDocs);
        
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
          if (doc.status === 'PENDING') vehicle.pending_docs_count++;
        });
        setVehiclesWithPendingDocs(Array.from(vehicleMap.values()));
      }
      
      if (selectedVehicleRequest && selectedVehicleRequest.vehicle_id === vehicleId) {
        setTimeout(() => {
          const vehicleStillPending = vehiclesWithPendingDocs.some(v => 
            v.vehicle_id === vehicleId && v.pending_docs_count > 0
          );
          if (!vehicleStillPending) setShowDocModal(false);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to approve vehicle');
    } finally {
      setProcessingVehicleId(null);
    }
  };

  const handleVehicleReject = async (vehicleId) => {
    const reason = prompt('Provide a reason for rejecting this vehicle\'s documents:');
    if (!reason || reason.trim() === '') {
      if (reason !== null) alert('Rejection reason is required');
      return;
    }
    
    setProcessingVehicleId(vehicleId);
    try {
      await verifyVehicle(vehicleId, 'REJECTED', reason);
      alert('Vehicle rejected successfully');
      await refreshAllData(false);
      
      if (selectedTransporter && modalType === 'vehicle-change') {
        const updatedDocs = await getPendingVehicleDocuments(selectedTransporter.transporter_id);
        setVehicleRequests(updatedDocs);
        
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
          if (doc.status === 'PENDING') vehicle.pending_docs_count++;
        });
        setVehiclesWithPendingDocs(Array.from(vehicleMap.values()));
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to reject vehicle');
    } finally {
      setProcessingVehicleId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transporter? This action cannot be undone.')) return;
    try {
      await deleteTransporter(id);
      await refreshAllData(false);
      setSelected(prev => prev.filter(x => x !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete transporter');
    }
  };

  const handleVerifyAction = async (transporter, action) => {
    if (!transporter) return;
    let reason = null;
    if (action === 'DECLINED') {
      reason = prompt('Provide a reason for declining this transporter:');
      if (reason === null) return;
      if (reason.trim() === '') {
        alert('Reason is required');
        return;
      }
    }
    try {
      setVerifying(true);
      setVerifyingId(transporter.transporter_id);
      await verifyTransporter(transporter.transporter_id, action, reason);
      await refreshAllData(false);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Unable to update transporter status');
    } finally {
      setVerifying(false);
      setVerifyingId(null);
    }
  };

  const handleModalClose = () => {
    setShowDocModal(false);
    setModalType('registration');
    setVehicleRequests([]);
    setVehiclesWithPendingDocs([]);
    setSelectedVehicleRequest(null);
    if (autoRefresh) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = setInterval(() => refreshAllData(true), refreshInterval);
    }
  };

  return (
    <>
      <div className="transporter-table-header-wrapper">
        <TransporterHeader
          selected={selected}
          onSearch={v => { setSearch(v); setPage(1); setVehicleRequestPage(1); }}
          activeStatuses={statusFilter.length > 0 ? statusFilter : activeStatuses}
          onStatusToggle={handleStatusToggle}
          
        />
      </div>

      <div className="transporter-tables-container">

        {/* Pending Vehicle Update Requests Section - Only show if there are requests */}
        {!loadingVehicleRequests && filteredVehicleRequests.length > 0 && (
          <div className="transporter-table-section">
            <div className="transporter-table-section-header">
              <h3 className="transporter-table-section-title">Pending Vehicle Update Requests</h3>
              <span className="transporter-table-section-count">
                {filteredVehicleRequests.length} vehicle update{filteredVehicleRequests.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="transporter-table-wrap">
              <div className="transporter-table-head">
                <div className="transporter-table-th"> </div>
                <div className="transporter-table-th">Email</div>
                <div className="transporter-table-th">Vehicle No</div>
                <div className="transporter-table-th">Vehicle Type</div>
                <div className="transporter-table-th">Request Date</div>
                <div className="transporter-table-th">Actions</div>
              </div>

              {sliceVehicleRequests.map(request => (
                <div key={request.vehicle_id} className="transporter-row">
                  <div className="transporter-row-name-cell">
                    <div className="transporter-row-avatar">
                      {getInitials(request.user_name)}
                    </div>
                    <span className="transporter-row-name">{request.user_name}</span>
                  </div>
                  <div className="transporter-row-email">{request.email}</div>
                  <div className="transporter-row-license">{request.vehicle_no}</div>
                  <div className="transporter-row-license">{request.vehicle_type}</div>
                  <div className="transporter-row-license">
                    {new Date(request.vehicle_created_at).toLocaleDateString()}
                  </div>
                  <div className="transporter-row-actions">
                    <button
                      className="transporter-row-action-btn view"
                      title="Review vehicle update"
                      onClick={() => handleViewVehicleRequest(request)}
                    >
                      <ViewIcon />
                    </button>
                  </div>
                </div>
              ))}

              {filteredVehicleRequests.length > ROWS_PER_PAGE && (
                <div className="transporter-table-footer">
                  <div className="transporter-table-pagination">
                    <button
                      className="transporter-table-page-btn"
                      disabled={safePageVehicleRequests === 1}
                      onClick={() => setVehicleRequestPage(p => p - 1)}
                    >‹</button>
                    <span>Page {safePageVehicleRequests} of {totalPagesVehicleRequests}</span>
                    <button
                      className="transporter-table-page-btn"
                      disabled={safePageVehicleRequests === totalPagesVehicleRequests}
                      onClick={() => setVehicleRequestPage(p => p + 1)}
                    >›</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Registration Requests Table */}
        <div className="transporter-table-section">
          <div className="transporter-table-section-header">
            <h3 className="transporter-table-section-title">Pending Registration Requests</h3>
            <span className="transporter-table-section-count">
              {filteredPending.length} transporter{filteredPending.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="transporter-table-wrap">
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
                />
              ))
            )}

            {!loading && !error && filteredPending.length > 0 && (
              <div className="transporter-table-footer">
                <span className="transporter-table-footer-info">
                  Showing {(safePagePending - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePagePending * ROWS_PER_PAGE, filteredPending.length)} of {filteredPending.length} pending requests
                </span>
                <div className="transporter-table-pagination">
                  <button className="transporter-table-page-btn" disabled={safePagePending === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                  <button className={`transporter-table-page-btn ${safePagePending === 1 ? 'active' : ''}`} onClick={() => setPage(1)}>1</button>
                  {safePagePending > 3 && <span className="transporter-table-page-btn" style={{ cursor: 'default' }}>…</span>}
                  {safePagePending > 2 && <button className="transporter-table-page-btn" onClick={() => setPage(safePagePending - 1)}>{safePagePending - 1}</button>}
                  {safePagePending !== 1 && safePagePending !== totalPagesPending && (
                    <button className="transporter-table-page-btn active">{safePagePending}</button>
                  )}
                  {safePagePending < totalPagesPending - 1 && <button className="transporter-table-page-btn" onClick={() => setPage(safePagePending + 1)}>{safePagePending + 1}</button>}
                  {safePagePending < totalPagesPending - 2 && <span className="transporter-table-page-btn" style={{ cursor: 'default' }}>…</span>}
                  {totalPagesPending > 1 && (
                    <button className={`transporter-table-page-btn ${safePagePending === totalPagesPending ? 'active' : ''}`} onClick={() => setPage(totalPagesPending)}>{totalPagesPending}</button>
                  )}
                  <button className="transporter-table-page-btn" disabled={safePagePending === totalPagesPending} onClick={() => setPage(p => p + 1)}>›</button>
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
                />
              ))
            )}

            {!loading && !error && filteredApproved.length > 0 && (
              <div className="transporter-table-footer">
                <span className="transporter-table-footer-info">
                  Showing {(safePageApproved - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePageApproved * ROWS_PER_PAGE, filteredApproved.length)} of {filteredApproved.length} approved transporters
                </span>
                <div className="transporter-table-pagination">
                  <button className="transporter-table-page-btn" disabled={safePageApproved === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                  <button className={`transporter-table-page-btn ${safePageApproved === 1 ? 'active' : ''}`} onClick={() => setPage(1)}>1</button>
                  {safePageApproved > 3 && <span className="transporter-table-page-btn" style={{ cursor: 'default' }}>…</span>}
                  {safePageApproved > 2 && <button className="transporter-table-page-btn" onClick={() => setPage(safePageApproved - 1)}>{safePageApproved - 1}</button>}
                  {safePageApproved !== 1 && safePageApproved !== totalPagesApproved && (
                    <button className="transporter-table-page-btn active">{safePageApproved}</button>
                  )}
                  {safePageApproved < totalPagesApproved - 1 && <button className="transporter-table-page-btn" onClick={() => setPage(safePageApproved + 1)}>{safePageApproved + 1}</button>}
                  {safePageApproved < totalPagesApproved - 2 && <span className="transporter-table-page-btn" style={{ cursor: 'default' }}>…</span>}
                  {totalPagesApproved > 1 && (
                    <button className={`transporter-table-page-btn ${safePageApproved === totalPagesApproved ? 'active' : ''}`} onClick={() => setPage(totalPagesApproved)}>{totalPagesApproved}</button>
                  )}
                  <button className="transporter-table-page-btn" disabled={safePageApproved === totalPagesApproved} onClick={() => setPage(p => p + 1)}>›</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDocModal && (
        <DocumentModal
          transporter={selectedTransporter}
          documents={modalType === 'registration' ? documents : vehicleRequests}
          vehicles={modalType === 'vehicle-change' ? vehiclesWithPendingDocs : []}
          loading={docLoading}
          modalType={modalType}
          processingVehicleId={processingVehicleId}
          onClose={handleModalClose}
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
          onVehicleApprove={modalType === 'vehicle-change' ? handleVehicleApprove : undefined}
          onVehicleReject={modalType === 'vehicle-change' ? handleVehicleReject : undefined}
        />
      )}
    </>
  );
}

// Helper function
function getInitials(name = '') {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// View Icon component
const ViewIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);