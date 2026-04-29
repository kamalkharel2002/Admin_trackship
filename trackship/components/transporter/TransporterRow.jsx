'use client';
import './TransporterRow.css';

function getInitials(name = '') {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const ViewIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const VehicleIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
    viewBox="0 0 24 24">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <circle cx="8" cy="17" r="2"/>
    <circle cx="16" cy="17" r="2"/>
    <line x1="2" y1="11" x2="22" y2="11"/>
  </svg>
);

const STATUS_MAP = {
  APPROVED: {
    label: 'Approved',
    cls: 'approved',
    dot: '#1A9E5C',
  },
  DECLINED: {
    label: 'Declined',
    cls: 'declined',
    dot: '#C0392B',
  },
  PENDING_VERIFICATION: {
    label: 'Pending',
    cls: 'pending',
    dot: '#C05621',
  },
  ACTIVE: {
    label: 'Active',
    cls: 'approved',
    dot: '#1A9E5C',
  },
};

export default function TransporterRow({
  transporter,
  checked,
  onToggle,
  onView,
  onDelete,
  onApprove,
  onDecline,
  onViewVehicleChanges,
  hasVehicleChanges = false,
}) {
  const initials = getInitials(transporter.user_name);
  const status = transporter.verification_status || 'PENDING_VERIFICATION';
  const statusConfig = STATUS_MAP[status] || STATUS_MAP.PENDING_VERIFICATION;
  
  // Determine if this is a pending registration (shows approve/decline buttons)
  const showVerifyButtons = status === 'PENDING_VERIFICATION' && onApprove && onDecline;

  return (
    <div className={`transporter-row${checked ? ' checked' : ''}`}>

      {/* Checkbox */}
      <div className="transporter-row-check">
        <input
          type="checkbox"
          className="transporter-row-checkbox"
          checked={checked}
          onChange={onToggle}
        />
      </div>

      {/* Name + Avatar */}
      <div className="transporter-row-name-cell">
        <div className="transporter-row-avatar">{initials}</div>
        <div className="transporter-row-name-info">
          <span className="transporter-row-name">{transporter.user_name}</span>
        </div>
      </div>

      {/* Email */}
      <div className="transporter-row-email">{transporter.email}</div>

      {/* Phone */}
      <div className="transporter-row-phone">{transporter.phone || '—'}</div>

      {/* License */}
      <div className="transporter-row-license">{transporter.license_no || '—'}</div>

      {/* Status */}
      <div className="transporter-row-status">
        <span className={`transporter-row-badge ${statusConfig.cls}`}>
          <span className="transporter-row-badge-dot" style={{ background: statusConfig.dot }} />
          {statusConfig.label}
        </span>
        {hasVehicleChanges && status === 'APPROVED' && (
          <span className="transporter-row-vehicle-badge">
            <VehicleIcon />
            Pending Changes
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="transporter-row-actions">
        {/* View Documents Button */}
        <button
          className="transporter-row-action-btn view"
          title="View documents"
          onClick={onView}
        >
          <ViewIcon />
        </button>

        {/* Vehicle Change Requests Button - only for active transporters with pending changes */}
        {hasVehicleChanges && status === 'APPROVED' && onViewVehicleChanges && (
          <button
            className="transporter-row-action-btn vehicle-change"
            title="Pending vehicle change requests"
            onClick={onViewVehicleChanges}
          >
            <VehicleIcon />
            <span className="vehicle-change-badge">!</span>
          </button>
        )}

        {/* Delete Button - for all transporters */}
        {onDelete && (
          <button
            className="transporter-row-action-btn delete"
            title="Delete transporter"
            onClick={onDelete}
          >
            <DeleteIcon />
          </button>
        )}
      </div>

    </div>
  );
}