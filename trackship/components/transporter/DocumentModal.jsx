'use client';
import { useState } from 'react';
import './DocumentModal.css';

/* ── File helpers ── */
function getFileType(base64) {
  if (!base64) return 'unknown';
  if (base64.startsWith('/9j/'))  return 'jpg';
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
  // Transporter documents
  license_front: 'License Front',
  license_back:  'License Back',
  bluebook:      'Bluebook',
  insurance:     'Insurance',
  // Vehicle documents
  registration_cert: 'Registration Certificate',
  pollution_cert:    'Pollution Certificate',
  fitness_cert:      'Fitness Certificate',
  permit:            'Permit',
  insurance_cert:    'Insurance Certificate',
};

function getLabel(type) {
  return DOC_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/* ── Icons (same as before) ── */
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

/* ── Status config ── */
const STATUS_CONFIG = {
  APPROVED:             { label: 'Approved', cls: 'status-approved' },
  DECLINED:             { label: 'Declined', cls: 'status-declined' },
  PENDING_VERIFICATION: { label: 'Pending',  cls: 'status-pending'  },
  ACTIVE:               { label: 'Active',   cls: 'status-approved' },
};

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function DocumentModal({
  transporter,
  documents = [],
  vehicles = [], // For vehicle change requests
  loading = false,
  modalType = 'registration', // 'registration' or 'vehicle-change'
  onClose,
  onApprove,
  onDecline,
  onVehicleDocApprove, // For approving individual vehicle documents
  onVehicleDocReject,  // For rejecting individual vehicle documents
}) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const status    = transporter?.verification_status || 'PENDING_VERIFICATION';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_VERIFICATION;
  const isPendingRegistration = status === 'PENDING_VERIFICATION';
  const isVehicleChangeMode = modalType === 'vehicle-change';

  const fields = [
    { label: 'Full Name',    value: transporter?.user_name    },
    { label: 'Email',        value: transporter?.email        },
    { label: 'Phone',        value: transporter?.phone        },
    { label: 'License No.',  value: transporter?.license_no   },
  ];

  // Add vehicle-specific fields if in vehicle-change mode
  if (isVehicleChangeMode && selectedVehicle) {
    fields.push(
      { label: 'Vehicle Type', value: selectedVehicle.vehicle_type },
      { label: 'Vehicle No.',  value: selectedVehicle.vehicle_no }
    );
  } else if (!isVehicleChangeMode) {
    fields.push(
      { label: 'Vehicle Type', value: transporter?.vehicle_type },
      { label: 'Vehicle No.',  value: transporter?.vehicle_no }
    );
  }

  return (
    <>
      {/* ── Main modal ── */}
      <div className="dm-backdrop" onClick={onClose}>
        <div className="dm-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
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

          {/* Body */}
          <div className="dm-body">

            {/* Info grid */}
            <section className="dm-section">
              <p className="dm-section-label">
                {isVehicleChangeMode ? 'Transporter Details' : 'Registration Details'}
              </p>
              <div className="dm-info-grid">
                {fields.map(({ label, value }) => (
                  <div className="dm-info-cell" key={label}>
                    <span className="dm-info-label">{label}</span>
                    <span className="dm-info-value">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Vehicle selection for vehicle-change mode */}
            {isVehicleChangeMode && vehicles.length > 0 && (
              <section className="dm-section">
                <p className="dm-section-label">Select Vehicle</p>
                <div className="dm-vehicle-selector">
                  {vehicles.map(vehicle => (
                    <button
                      key={vehicle.vehicle_id}
                      className={`dm-vehicle-card ${selectedVehicle?.vehicle_id === vehicle.vehicle_id ? 'active' : ''}`}
                      onClick={() => setSelectedVehicle(vehicle)}
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

            {/* Documents */}
            <section className="dm-section">
              <div className="dm-section-header">
                <p className="dm-section-label">
                  {isVehicleChangeMode && selectedVehicle 
                    ? `Documents for ${selectedVehicle.vehicle_no}`
                    : 'Uploaded Documents'}
                </p>
                {!loading && documents.length > 0 && (
                  <span className="dm-doc-count">
                    {documents.length} file{documents.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="dm-loading">
                  <div className="dm-loading-track"><div className="dm-loading-bar" /></div>
                  <span className="dm-loading-text">Loading documents…</span>
                </div>
              ) : documents.length === 0 ? (
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
                  {documents.map((doc, i) => {
                    const fileType = getFileType(doc.file);
                    const url      = getFileDataUrl(doc.file);
                    const isPending = doc.status === 'PENDING';
                    
                    return (
                      <div key={i} className="dm-doc-wrapper">
                        <button
                          className="dm-doc-card"
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
                          {isVehicleChangeMode && isPending && (
                            <span className="dm-pending-label">Pending</span>
                          )}
                        </button>
                        
                        {/* Individual document actions for vehicle change mode */}
                        {isVehicleChangeMode && isPending && onVehicleDocApprove && onVehicleDocReject && (
                          <div className="dm-doc-actions">
                            <button
                              className="dm-doc-action-reject"
                              onClick={() => onVehicleDocReject(doc.document_id)}
                              title="Reject document"
                            >
                              <XIcon />
                            </button>
                            <button
                              className="dm-doc-action-approve"
                              onClick={() => onVehicleDocApprove(doc.document_id)}
                              title="Approve document"
                            >
                              <CheckIcon />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

          </div>

          {/* Footer - Only show for initial registration */}
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

          {/* Footer for vehicle change mode - Batch actions */}
          {isVehicleChangeMode && selectedVehicle && (
            <div className="dm-footer">
              <p className="dm-footer-hint">
                Review and verify each document individually.
              </p>
              <div className="dm-footer-actions">
                <button 
                  className="dm-btn-secondary" 
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Document viewer ── */}
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