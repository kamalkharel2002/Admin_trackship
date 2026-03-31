'use client';
import './ShipmentRow.css';

const RouteIcon = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

export default function ShipmentRow({ shipment, checked, onToggle, onClick }) {
  const initials = shipment.sender?.slice(0, 2).toUpperCase();
  const statusClass = shipment.status.toLowerCase().replace(' ', '-');

  return (
    <div
      className={`shipment-row ${checked ? 'checked' : ''}`}
      onClick={onClick}
    >
      <div className="cell cell-check">
        <input
          type="checkbox"
          className="row-checkbox"
          checked={checked}
          onChange={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        />
      </div>

      <div className="cell cell-id">
        <span className="shipment-id">{shipment.shipment_code}</span>
      </div>

      <div className="cell cell-sender">
        <div className="sender-wrap">
          <div className="avatar">{initials}</div>
          <span className="sender-name">{shipment.sender}</span>
        </div>
      </div>

      <div className="cell cell-receiver">
        <span className="receiver-name">{shipment.receiver}</span>
      </div>

      <div className="cell cell-route">
        <span className="route-tag">
          <RouteIcon />
          {shipment.route}
        </span>
      </div>

      <div className="cell cell-status">
        <span className={`badge badge-${statusClass}`}>
          <span className="badge-dot" />
          {shipment.status}
        </span>
      </div>

      <div className="cell cell-transporter">
        <span className="transporter">{shipment.transporter}</span>
      </div>
    </div>
  );
}