'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import './DocumentModal.css';

/* ── File helpers ── */
function getFileType(base64) {
  if (!base64) return 'unknown';
  if (base64.startsWith('/9j/')) return 'jpg';
  if (base64.startsWith('iVBOR')) return 'png';
  if (base64.startsWith('JVBER')) return 'pdf';
  return 'unknown';
}

function getFileDataUrl(base64) {
  const type = getFileType(base64);
  if (type === 'pdf') return `data:application/pdf;base64,${base64}`;
  return `data:image/${type};base64,${base64}`;
}

const DOC_LABELS = {
  license_front: 'License Front',
  license_back: 'License Back',
  bluebook: 'Bluebook',
  insurance: 'Insurance',
  registration_cert: 'Registration Certificate',
  pollution_cert: 'Pollution Certificate',
  fitness_cert: 'Fitness Certificate',
  permit: 'Permit',
  insurance_cert: 'Insurance Certificate',
  aadhar_card: 'Aadhar Card',
  pan_card: 'PAN Card',
  gst_certificate: 'GST Certificate',
  bank_proof: 'Bank Proof',
  rc_book: 'RC Book',
  vehicle_insurance: 'Vehicle Insurance',
  vehicle_permit: 'Vehicle Permit',
  vehicle_fitness: 'Vehicle Fitness',
  vehicle_pollution: 'Pollution Certificate',
};

function getLabel(type) {
  return DOC_LABELS[type] || type?.replace(/_/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || type;
}

/* ── Icons ── */
const CloseIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const BackIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.8"
    strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const DocFileIcon = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
    <polyline points="13 2 13 9 20 9"/>
  </svg>
);

const EmptyDocsIcon = () => (
  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
    <polyline points="13 2 13 9 20 9"/>
    <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>
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

const STATUS_CONFIG = {
  APPROVED: { label: 'Approved', cls: 'status-approved' },
  DECLINED: { label: 'Declined', cls: 'status-declined' },
  PENDING_VERIFICATION: { label: 'Pending', cls: 'status-pending' },
  ACTIVE: { label: 'Active', cls: 'status-approved' },
  REJECTED: { label: 'Rejected', cls: 'status-declined' },
};

function getInitials(name = '') {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function DocumentModal({
  transporter,
  documents = [],
  vehicles = [],
  loading = false,
  modalType = 'registration',
  processingVehicleId = null,
  onClose,
  onApprove,
  onDecline,
  onVehicleApprove,  // Changed from onVehicleDocApprove
  onVehicleReject,   // Changed from onVehicleDocReject
}) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleMap, setVehicleMap] = useState(new Map());

  // Build vehicle map from documents
  useEffect(() => {
    if (modalType === 'vehicle-change' && documents.length > 0) {
      const map = new Map();
      documents.forEach(doc => {
        if (doc.vehicle_id && !map.has(doc.vehicle_id)) {
          map.set(doc.vehicle_id, {
            vehicle_id: doc.vehicle_id,
            vehicle_no: doc.vehicle_no || 'N/A',
            vehicle_type: doc.vehicle_type || 'N/A',
            pending_docs_count: 0,
          });
        }
      });
      
      // Count pending docs per vehicle
      map.forEach((vehicle, id) => {
        const pendingDocs = documents.filter(doc => 
          doc.vehicle_id === id && doc.status === 'PENDING'
        ).length;
        vehicle.pending_docs_count = pendingDocs;
      });
      
      setVehicleMap(map);
      
      // Auto-select first vehicle if none selected
      if (!selectedVehicle && map.size > 0) {
        const firstVehicle = Array.from(map.values())[0];
        setSelectedVehicle(firstVehicle);
      }
    }
  }, [modalType, documents, selectedVehicle]);

  // DEDUPLICATE documents to prevent key errors
  const uniqueDocuments = useMemo(() => {
    if (!documents || documents.length === 0) return [];
    
    const uniqueMap = new Map();
    documents.forEach(doc => {
      const id = doc.document_id || doc.id;
      if (id && !uniqueMap.has(id)) {
        uniqueMap.set(id, doc);
      } else if (!id) {
        const key = `${doc.doc_type}_${doc.vehicle_id || 'transporter'}_${doc.uploaded_at}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, doc);
        }
      }
    });
    
    if (uniqueMap.size !== documents.length) {
      console.log(`DocumentModal: Deduplicated ${documents.length} docs to ${uniqueMap.size}`);
    }
    
    return Array.from(uniqueMap.values());
  }, [documents]);

  // Get unique vehicles from the vehicles prop or from documents
  const uniqueVehicles = useMemo(() => {
    if (vehicles && vehicles.length > 0) {
      const uniqueMap = new Map();
      vehicles.forEach(vehicle => {
        const id = vehicle.vehicle_id;
        if (!uniqueMap.has(id)) {
          const pendingDocs = uniqueDocuments.filter(doc => 
            doc.vehicle_id === id && doc.status === 'PENDING'
          ).length;
          uniqueMap.set(id, {
            ...vehicle,
            pending_docs_count: pendingDocs,
          });
        }
      });
      return Array.from(uniqueMap.values());
    }
    
    return Array.from(vehicleMap.values());
  }, [vehicles, uniqueDocuments, vehicleMap]);

  const status = transporter?.verification_status || 'PENDING_VERIFICATION';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_VERIFICATION;
  const isPendingRegistration = status === 'PENDING_VERIFICATION';
  const isVehicleChangeMode = modalType === 'vehicle-change';

  const fields = [
    { label: 'Full Name', value: transporter?.user_name },
    { label: 'Email', value: transporter?.email },
    { label: 'Phone', value: transporter?.phone },
    { label: 'License No.', value: transporter?.license_no },
  ];

  if (isVehicleChangeMode && selectedVehicle) {
    fields.push(
      { label: 'Vehicle Type', value: selectedVehicle.vehicle_type },
      { label: 'Vehicle No.', value: selectedVehicle.vehicle_no }
    );
  } else if (!isVehicleChangeMode) {
    fields.push(
      { label: 'Vehicle Type', value: transporter?.vehicle_type },
      { label: 'Vehicle No.', value: transporter?.vehicle_no }
    );
  }

  const getDocumentKey = useCallback((doc, index) => {
    if (doc.document_id) return `doc_${doc.document_id}`;
    if (doc.id) return `doc_${doc.id}`;
    return `doc_${doc.doc_type || doc.type}_${doc.vehicle_id || 'transporter'}_${index}`;
  }, []);

  const getVehicleKey = useCallback((vehicle) => {
    if (vehicle.vehicle_id) return `vehicle_${vehicle.vehicle_id}`;
    return `vehicle_${vehicle.vehicle_no}_${vehicle.vehicle_type}`;
  }, []);

  // Get documents to display (filter by selected vehicle if needed)
  const displayedDocuments = useMemo(() => {
    if (!isVehicleChangeMode || !selectedVehicle) {
      return uniqueDocuments;
    }
    return uniqueDocuments.filter(doc => doc.vehicle_id === selectedVehicle?.vehicle_id);
  }, [uniqueDocuments, isVehicleChangeMode, selectedVehicle]);

  // Check if all documents for selected vehicle are approved
  const isVehicleFullyApproved = useMemo(() => {
    if (!isVehicleChangeMode || !selectedVehicle || displayedDocuments.length === 0) {
      return false;
    }
    const hasPending = displayedDocuments.some(doc => doc.status === 'PENDING');
    return !hasPending && displayedDocuments.length > 0;
  }, [isVehicleChangeMode, selectedVehicle, displayedDocuments]);

  const isProcessing = (vehicleId) => processingVehicleId === vehicleId;

  return (
    <>
      <div className="dm-backdrop" onClick={onClose}>
        <div className="dm-modal" onClick={e => e.stopPropagation()}>
          <div className="dm-header">
            <div className="dm-header-left">
              <div className="dm-avatar">{getInitials(transporter?.user_name)}</div>
              <div className="dm-header-info">
                <h2 className="dm-name">{transporter?.user_name || 'Transporter'}</h2>
                <span className={`dm-status-badge ${statusCfg.cls}`}>
                  <span className="dm-status-dot" />
                  {statusCfg.label}
                </span>
                {isVehicleChangeMode && (
                  <span className="dm-badge-vehicle-change">
                    <VehicleIcon />
                    Vehicle Update Request
                  </span>
                )}
              </div>
            </div>
            <button className="dm-close-btn" onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>

          <div className="dm-body">
            <section className="dm-section">
              <p className="dm-section-label">
                {isVehicleChangeMode ? 'Transporter Details' : 'Registration Details'}
              </p>
              <div className="dm-info-grid">
                {fields.map(({ label, value }, idx) => (
                  <div className="dm-info-cell" key={`field_${label}_${idx}`}>
                    <span className="dm-info-label">{label}</span>
                    <span className="dm-info-value">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </section>

            {isVehicleChangeMode && uniqueVehicles.length > 0 && (
              <section className="dm-section">
                <p className="dm-section-label">Select Vehicle</p>
                <div className="dm-vehicle-selector">
                  {uniqueVehicles.map(vehicle => (
                    <button
                      key={getVehicleKey(vehicle)}
                      className={`dm-vehicle-card ${selectedVehicle?.vehicle_id === vehicle.vehicle_id ? 'active' : ''}`}
                      onClick={() => setSelectedVehicle(vehicle)}
                      disabled={isProcessing(vehicle.vehicle_id)}
                    >
                      <VehicleIcon />
                      <div>
                        <div className="dm-vehicle-no">{vehicle.vehicle_no}</div>
                        <div className="dm-vehicle-type">{vehicle.vehicle_type}</div>
                      </div>
                      {vehicle.pending_docs_count > 0 && (
                        <span className="dm-pending-badge">
                          {vehicle.pending_docs_count} pending
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="dm-section">
              <div className="dm-section-header">
                <p className="dm-section-label">
                  {isVehicleChangeMode && selectedVehicle 
                    ? `Documents for ${selectedVehicle.vehicle_no}`
                    : 'Uploaded Documents'}
                </p>
                {!loading && displayedDocuments.length > 0 && (
                  <span className="dm-doc-count">
                    {displayedDocuments.length} file{displayedDocuments.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="dm-loading">
                  <div className="dm-loading-track"><div className="dm-loading-bar" /></div>
                  <span className="dm-loading-text">Loading documents…</span>
                </div>
              ) : displayedDocuments.length === 0 ? (
                <div className="dm-empty">
                  <div className="dm-empty-icon"><EmptyDocsIcon /></div>
                  <p className="dm-empty-title">No documents uploaded</p>
                  <p className="dm-empty-sub">
                    {isVehicleChangeMode 
                      ? 'No pending documents for this vehicle.'
                      : 'This transporter hasn\'t submitted any documents yet.'}
                  </p>
                </div>
              ) : (
                <div className="dm-doc-grid">
                  {displayedDocuments.map((doc, i) => {
                    const fileType = getFileType(doc.file);
                    const url = getFileDataUrl(doc.file);
                    const isPending = doc.status === 'PENDING';
                    const isApproved = doc.status === 'ACTIVE';
                    const isRejected = doc.status === 'REJECTED';
                    const documentKey = getDocumentKey(doc, i);
                    
                    return (
                      <div key={documentKey} className="dm-doc-wrapper">
                        <button
                          className={`dm-doc-card ${isApproved ? 'approved' : ''} ${isRejected ? 'rejected' : ''}`}
                          style={{ animationDelay: `${i * 0.05}s` }}
                          onClick={() => setSelectedDoc(doc)}
                          aria-label={`View ${getLabel(doc.doc_type || doc.type)}`}
                        >
                          <div className="dm-doc-thumb">
                            {fileType === 'pdf' ? (
                              <div className="dm-doc-pdf-thumb">
                                <DocFileIcon />
                                <span>PDF</span>
                              </div>
                            ) : (
                              <img src={url} alt={doc.doc_type || doc.type} draggable={false} />
                            )}
                            <div className="dm-doc-overlay">
                              <span>View</span>
                            </div>
                          </div>
                          <span className="dm-doc-label">
                            {getLabel(doc.doc_type || doc.type)}
                          </span>
                          {isVehicleChangeMode && (
                            <span className={`dm-doc-status ${isPending ? 'pending' : isApproved ? 'approved' : 'rejected'}`}>
                              {isPending ? 'Pending' : isApproved ? 'Approved' : 'Rejected'}
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {isVehicleChangeMode && selectedVehicle && isVehicleFullyApproved && (
                <div className="dm-vehicle-approved-message">
                  <CheckIcon />
                  <span>All documents approved! Click "Approve Vehicle" to finalize.</span>
                </div>
              )}
            </section>
          </div>

          {!isVehicleChangeMode && isPendingRegistration && onApprove && onDecline && (
            <div className="dm-footer">
              <p className="dm-footer-hint">Review all documents before taking action.</p>
              <div className="dm-footer-actions">
                <button className="dm-btn-decline" onClick={onDecline}>
                  <XIcon />
                  Decline Registration
                </button>
                <button className="dm-btn-approve" onClick={onApprove}>
                  <CheckIcon />
                  Approve Registration
                </button>
              </div>
            </div>
          )}

          {isVehicleChangeMode && selectedVehicle && onVehicleApprove && onVehicleReject && (
            <div className="dm-footer">
              <p className="dm-footer-hint">
                Review all documents for this vehicle before approving or rejecting.
              </p>
              <div className="dm-footer-actions">
                <button 
                  className="dm-btn-decline" 
                  onClick={() => onVehicleReject(selectedVehicle.vehicle_id)}
                  disabled={isProcessing(selectedVehicle.vehicle_id)}
                >
                  <XIcon />
                  {isProcessing(selectedVehicle.vehicle_id) ? 'Processing...' : 'Reject Vehicle'}
                </button>
                <button 
                  className="dm-btn-approve" 
                  onClick={() => onVehicleApprove(selectedVehicle.vehicle_id)}
                  disabled={isProcessing(selectedVehicle.vehicle_id) || !isVehicleFullyApproved}
                >
                  <CheckIcon />
                  {isProcessing(selectedVehicle.vehicle_id) ? 'Processing...' : 'Approve Vehicle'}
                </button>
              </div>
            </div>
          )}

          {isVehicleChangeMode && !selectedVehicle && uniqueVehicles.length === 0 && (
            <div className="dm-footer">
              <div className="dm-footer-actions">
                <button className="dm-btn-secondary" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedDoc && (
        <div className="dm-viewer-backdrop" onClick={() => setSelectedDoc(null)}>
          <div className="dm-viewer-modal" onClick={e => e.stopPropagation()}>
            <div className="dm-viewer-header">
              <button className="dm-viewer-back" onClick={() => setSelectedDoc(null)}>
                <BackIcon />
                Back
              </button>
              <span className="dm-viewer-title">
                {getLabel(selectedDoc.doc_type || selectedDoc.type)}
              </span>
              <button className="dm-viewer-close" onClick={() => setSelectedDoc(null)} aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            <div className="dm-viewer-body">
              {getFileType(selectedDoc.file) === 'pdf' ? (
                <iframe
                  src={getFileDataUrl(selectedDoc.file)}
                  title={selectedDoc.doc_type || selectedDoc.type}
                  className="dm-viewer-pdf"
                />
              ) : (
                <img
                  src={getFileDataUrl(selectedDoc.file)}
                  alt={selectedDoc.doc_type || selectedDoc.type}
                  className="dm-viewer-img"
                  draggable={false}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}