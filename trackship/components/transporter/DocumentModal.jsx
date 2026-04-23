// DocumentModal.jsx
'use client';
import { useState } from 'react';
import './DocumentModal.css';

/* ── Icons ── */
const CloseIcon = ({ size = 14 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.4"
    strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const FileIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
    <polyline points="13 2 13 9 20 9"/>
  </svg>
);

const EmptyFileIcon = () => (
  <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.4"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
    <polyline points="13 2 13 9 20 9"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
    <line x1="9" y1="17" x2="13" y2="17"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.3"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const UserIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

/* ── Helpers ── */
const DOC_CONFIG = {
  license:        { label: 'Driver License',         color: '#1D6FA4', bg: 'rgba(29,111,164,0.08)',   border: 'rgba(29,111,164,0.18)' },
  registration:   { label: 'Vehicle Registration',   color: '#1A9E5C', bg: 'rgba(26,158,92,0.08)',    border: 'rgba(26,158,92,0.18)'  },
  insurance:      { label: 'Insurance Certificate',  color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',   border: 'rgba(124,58,237,0.18)' },
  permit:         { label: 'Transport Permit',        color: '#D4920A', bg: 'rgba(212,146,10,0.08)',   border: 'rgba(212,146,10,0.18)' },
  id_proof:       { label: 'ID Proof',                color: '#C05621', bg: 'rgba(192,86,33,0.08)',    border: 'rgba(192,86,33,0.18)'  },
  address_proof:  { label: 'Address Proof',           color: '#0E7490', bg: 'rgba(14,116,144,0.08)',   border: 'rgba(14,116,144,0.18)' },
};

function getDocConfig(type = '') {
  return DOC_CONFIG[type] || {
    label:  type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    color:  '#6B7385',
    bg:     'rgba(107,115,133,0.08)',
    border: 'rgba(107,115,133,0.18)',
  };
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// Detect file type from base64 string
function getFileType(base64String) {
  if (!base64String) return 'unknown';
  
  // Check common PDF signatures
  if (base64String.startsWith('JVBER')) return 'pdf';
  
  // Check image signatures
  if (base64String.startsWith('/9j/')) return 'jpg';
  if (base64String.startsWith('iVBORw0KGgo')) return 'png';
  if (base64String.startsWith('R0lGODlh')) return 'gif';
  if (base64String.startsWith('PHN2Zy')) return 'svg';
  
  return 'unknown';
}

// Get MIME type and data URL
function getFileDataUrl(base64String) {
  const fileType = getFileType(base64String);
  
  switch(fileType) {
    case 'pdf':
      return `data:application/pdf;base64,${base64String}`;
    case 'jpg':
      return `data:image/jpeg;base64,${base64String}`;
    case 'png':
      return `data:image/png;base64,${base64String}`;
    case 'gif':
      return `data:image/gif;base64,${base64String}`;
    case 'svg':
      return `data:image/svg+xml;base64,${base64String}`;
    default:
      return `data:application/octet-stream;base64,${base64String}`;
  }
}

/* ── Document List Modal ── */
export default function DocumentModal({ transporter, documents = [], loading = false, onClose }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [imageError, setImageError] = useState(false);

  const renderViewerContent = (doc) => {
    const fileType = getFileType(doc.file);
    const dataUrl = getFileDataUrl(doc.file);
    
    if (fileType === 'pdf') {
      return (
        <iframe
          src={dataUrl}
          title={doc.type}
          className="doc-viewer-iframe"
        />
      );
    } else if (['jpg', 'png', 'gif', 'svg'].includes(fileType)) {
      return (
        <div className="doc-viewer-image-container">
          {!imageError ? (
            <img
              src={dataUrl}
              alt={getDocConfig(doc.type).label}
              className="doc-viewer-image"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="doc-viewer-error">
              <p>Unable to display image</p>
              <button 
                className="doc-viewer-download-btn"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = dataUrl;
                  link.download = `${doc.type}.${fileType}`;
                  link.click();
                }}
              >
                Download File
              </button>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="doc-viewer-unsupported">
          <EmptyFileIcon />
          <p>Preview not available for this file type</p>
          <button 
            className="doc-viewer-download-btn"
            onClick={() => {
              const link = document.createElement('a');
              link.href = dataUrl;
              link.download = doc.type;
              link.click();
            }}
          >
            Download File
          </button>
        </div>
      );
    }
  };

  return (
    <>
      {/* List modal */}
      <div className="doc-modal-backdrop" onClick={onClose}>
        <div className="doc-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="doc-modal-header">
            <div className="doc-modal-header-left">
              <div className="doc-modal-avatar">{getInitials(transporter?.user_name)}</div>
              <div>
                <h3 className="doc-modal-title">Documents</h3>
                <p className="doc-modal-subtitle">
                  <UserIcon />
                  {transporter?.user_name}
                </p>
              </div>
            </div>
            <button className="doc-modal-close" onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>

          {/* Body */}
          <div className="doc-modal-body">
            {loading ? (
              <div className="doc-loading">
                <div className="doc-loading-track">
                  <div className="doc-loading-bar" />
                </div>
                <p className="doc-loading-label">Loading documents…</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="doc-empty">
                <div className="doc-empty-icon"><EmptyFileIcon /></div>
                <p className="doc-empty-title">No documents uploaded</p>
                <p className="doc-empty-sub">This transporter hasn't submitted any documents yet.</p>
              </div>
            ) : (
              <div className="doc-list">
                <p className="doc-list-meta">{documents.length} document{documents.length !== 1 ? 's' : ''} on file</p>
                {documents.map((doc, idx) => {
                  const cfg = getDocConfig(doc.type);
                  return (
                    <button
                      key={idx}
                      className="doc-item"
                      style={{ '--doc-color': cfg.color, '--doc-bg': cfg.bg, '--doc-bd': cfg.border }}
                      onClick={() => {
                        setImageError(false);
                        setSelectedDoc(doc);
                      }}
                    >
                      <div className="doc-item-icon">
                        <FileIcon />
                      </div>
                      <div className="doc-item-body">
                        <span className="doc-item-title">{cfg.label}</span>
                        <span className="doc-item-hint">Click to preview</span>
                      </div>
                      <div className="doc-item-arrow"><ChevronRightIcon /></div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="doc-modal-footer">
            <span className="doc-modal-footer-info">
              {documents.length > 0 && !loading
                ? `${documents.length} file${documents.length !== 1 ? 's' : ''} available`
                : '\u00a0'}
            </span>
            <button className="doc-btn-close" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {/* Viewer modal */}
      {selectedDoc && (
        <div className="doc-viewer-backdrop" onClick={() => setSelectedDoc(null)}>
          <div className="doc-viewer-modal" onClick={e => e.stopPropagation()}>
            <div className="doc-viewer-header">
              <button className="doc-viewer-back" onClick={() => setSelectedDoc(null)}>
                <ArrowLeftIcon />
                Back
              </button>
              <span className="doc-viewer-title">{getDocConfig(selectedDoc.type).label}</span>
              <button
                className="doc-viewer-close"
                onClick={() => setSelectedDoc(null)}
                aria-label="Close viewer"
              >
                <CloseIcon size={13} />
              </button>
            </div>
            <div className="doc-viewer-content">
              {renderViewerContent(selectedDoc)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}