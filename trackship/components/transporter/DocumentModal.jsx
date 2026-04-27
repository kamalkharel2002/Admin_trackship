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
  license_front: 'License Front',
  license_back:  'License Back',
  bluebook:      'Bluebook',
  insurance:     'Insurance',
};
function getLabel(type) {
  return DOC_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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

/* ── Status config ── */
const STATUS_CONFIG = {
  APPROVED:             { label: 'Approved', cls: 'status-approved' },
  DECLINED:             { label: 'Declined', cls: 'status-declined' },
  PENDING_VERIFICATION: { label: 'Pending',  cls: 'status-pending'  },
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
  loading = false,
  onClose,
  onApprove,
  onDecline,
}) {
  const [selectedDoc, setSelectedDoc] = useState(null);

  const status    = transporter?.verification_status || 'PENDING_VERIFICATION';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_VERIFICATION;
  const isPending = status === 'PENDING_VERIFICATION';

  const fields = [
    { label: 'Full Name',    value: transporter?.user_name    },
    { label: 'Phone',        value: transporter?.phone        },
    { label: 'Vehicle Type', value: transporter?.vehicle_type },
    { label: 'License No.',  value: transporter?.license_no   },
    { label: 'Vehicle No.',  value: transporter?.vehicle_no   },
  ];

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
              <p className="dm-section-label">Transporter Details</p>
              <div className="dm-info-grid">
                {fields.map(({ label, value }) => (
                  <div className="dm-info-cell" key={label}>
                    <span className="dm-info-label">{label}</span>
                    <span className="dm-info-value">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Documents */}
            <section className="dm-section">
              <div className="dm-section-header">
                <p className="dm-section-label">Uploaded Documents</p>
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
                  <p className="dm-empty-sub">This transporter hasn't submitted any documents yet.</p>
                </div>
              ) : (
                <div className="dm-doc-grid">
                  {documents.map((doc, i) => {
                    const fileType = getFileType(doc.file);
                    const url      = getFileDataUrl(doc.file);
                    return (
                      <button
                        key={i}
                        className="dm-doc-card"
                        style={{ animationDelay: `${i * 0.05}s` }}
                        onClick={() => setSelectedDoc(doc)}
                        aria-label={`View ${getLabel(doc.type)}`}
                      >
                        <div className="dm-doc-thumb">
                          {fileType === 'pdf' ? (
                            <div className="dm-doc-pdf-thumb">
                              <DocFileIcon />
                              <span>PDF</span>
                            </div>
                          ) : (
                            <img src={url} alt={doc.type} draggable={false} />
                          )}
                          <div className="dm-doc-overlay">
                            <span>View</span>
                          </div>
                        </div>
                        <span className="dm-doc-label">{getLabel(doc.type)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

          </div>

          {/* Footer */}
          {isPending && onApprove && onDecline && (
            <div className="dm-footer">
              <p className="dm-footer-hint">Review all documents before taking action.</p>
              <div className="dm-footer-actions">
                <button className="dm-btn-decline" onClick={onDecline}>
                  <XIcon />
                  Decline
                </button>
                <button className="dm-btn-approve" onClick={onApprove}>
                  <CheckIcon />
                  Approve
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
              <span className="dm-viewer-title">{getLabel(selectedDoc.type)}</span>
              <button className="dm-viewer-close" onClick={() => setSelectedDoc(null)} aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            <div className="dm-viewer-body">
              {getFileType(selectedDoc.file) === 'pdf' ? (
                <iframe
                  src={getFileDataUrl(selectedDoc.file)}
                  title={selectedDoc.type}
                  className="dm-viewer-pdf"
                />
              ) : (
                <img
                  src={getFileDataUrl(selectedDoc.file)}
                  alt={selectedDoc.type}
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