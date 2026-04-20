// DocumentModal.jsx
'use client';
import './DocumentModal.css';

const CloseIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const FileIcon = () => (
  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5"
    viewBox="0 0 24 24">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
    <polyline points="13 2 13 9 20 9"/>
  </svg>
);

const LoadingSpinner = () => (
  <div className="doc-loading-spinner"></div>
);

export default function DocumentModal({ transporter, documents, loading = false, onClose }) {
  const getDocTypeLabel = (type) => {
    const labels = {
      'license': 'Driver License',
      'registration': 'Vehicle Registration',
      'insurance': 'Insurance Certificate',
      'permit': 'Transport Permit',
      'id_proof': 'ID Proof',
      'address_proof': 'Address Proof'
    };
    return labels[type] || type.replace(/_/g, ' ').toUpperCase();
  };

  const handleDownload = (fileBase64, filename) => {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${fileBase64}`;
    link.download = filename;
    link.click();
  };

  return (
    <div className="doc-modal-backdrop" onClick={onClose}>
      <div className="doc-modal" onClick={e => e.stopPropagation()}>
        <div className="doc-modal-header">
          <h3 className="doc-modal-title">
            Documents - {transporter?.user_name}
          </h3>
          <button className="doc-modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="doc-modal-body">
          {loading ? (
            <div className="doc-loading">
              <LoadingSpinner />
              <p>Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="doc-empty">
              <FileIcon />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="doc-list">
              {documents.map((doc, idx) => (
                <div key={idx} className="doc-item">
                  <div className="doc-item-info">
                    <FileIcon />
                    <div>
                      <div className="doc-item-title">{getDocTypeLabel(doc.type)}</div>
                      <button 
                        className="doc-view-btn"
                        onClick={() => handleDownload(doc.file, `${doc.type}.pdf`)}
                      >
                        View Document →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="doc-modal-footer">
          <button className="doc-btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}