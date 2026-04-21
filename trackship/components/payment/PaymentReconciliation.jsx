'use client';
import { useState } from 'react';
import './PaymentReconciliation.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '—';
  return (
    'Nu. ' +
    new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CLASS = {
  'Paid to Transporter': { cls: 'transporter', label: 'Paid · Transporter' },
  'Paid to Hub':         { cls: 'hub',          label: 'Paid · Hub' },
  'Unpaid':              { cls: 'unpaid',        label: 'Unpaid' },
};

function StatusBadge({ status }) {
  const { cls, label } = STATUS_CLASS[status] || STATUS_CLASS['Unpaid'];
  return (
    <span className={`pr-status-badge ${cls}`}>
      <span className="pr-status-dot" />
      {label}
    </span>
  );
}

// ─── Summary Bar ──────────────────────────────────────────────────────────────

function SummaryBar({ summary }) {
  const items = [
    { label: 'Total Shipments',    value: summary?.totalShipments ?? 0,              cls: '' },
    { label: 'Total Revenue',      value: formatCurrency(summary?.totalRevenue),      cls: '' },
    { label: 'Collected',          value: formatCurrency(summary?.totalCollected),    cls: 'green' },
    { label: 'Outstanding',        value: formatCurrency(summary?.outstandingAmount), cls: 'red' },
    { label: 'Paid · Transporter', value: summary?.paidToTransporterCount ?? 0,       cls: '' },
    { label: 'Paid · Hub',         value: summary?.paidToHubCount ?? 0,               cls: '' },
    { label: 'Unpaid',             value: summary?.unpaidCount ?? 0,                  cls: 'red' },
  ];

  return (
    <div className="pr-summary-bar">
      {items.map((item, i) => (
        <div key={i} className="pr-summary-item">
          <span className="pr-summary-label">{item.label}</span>
          <span className={`pr-summary-value ${item.cls}`}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Table Headers ────────────────────────────────────────────────────────────

const HEADERS = [
  'Shipment Code', 'Date', 'Sender', 'Receiver',
  'Total', 'Payment Status', 'Paid / Remaining', 'Mode',
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentReconciliation({ data, page, onPageChange }) {
  if (!data) return null;

  const { summary, shipments = [], pagination } = data;
  const isRoadside = (mode) => mode === 'Route_Side';

  return (
    <div className="pr-root">
      <SummaryBar summary={summary} />

      <div className="pr-table-wrap">
        {/* Head */}
        <div className="pr-table-head">
          {HEADERS.map((h) => (
            <div key={h} className="pr-table-th">{h}</div>
          ))}
        </div>

        {/* Body */}
        {shipments.length === 0 ? (
          <div className="pr-empty-state">
            <div className="pr-empty-icon">
              <svg width="20" height="20" fill="none" stroke="#9CA3AF" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4l3 3" />
              </svg>
            </div>
            <p className="pr-empty-title">No shipments found</p>
            <p className="pr-empty-sub">Try adjusting your filters</p>
          </div>
        ) : (
          shipments.map((s) => (
            <div key={s.shipmentId} className="pr-table-row">
              {/* Shipment Code */}
              <div className="pr-table-cell">
                <span className="pr-code-chip">{s.shipmentCode}</span>
              </div>

              {/* Date */}
              <div className="pr-table-cell date">
                {formatDate(s.createdAt)}
              </div>

              {/* Sender */}
              <div className="pr-table-cell name" title={s.senderName}>
                {s.senderName}
              </div>

              {/* Receiver */}
              <div className="pr-table-cell name" title={s.receiverName}>
                {s.receiverName}
              </div>

              {/* Total */}
              <div className="pr-table-cell pr-amount">
                {formatCurrency(s.totalPrice)}
              </div>

              {/* Status */}
              <div className="pr-table-cell">
                <StatusBadge status={s.overallPaymentStatus} />
              </div>

              {/* Paid / Remaining */}
              <div className="pr-table-cell">
                <div className="pr-breakdown">
                  <span className="pr-breakdown-paid">
                    {formatCurrency(s.totalAmountPaid)}
                  </span>
                  {s.remainingAmount > 0 && (
                    <span className="pr-breakdown-remain">
                      <span className="pr-breakdown-remain-label">rem. </span>
                      {formatCurrency(s.remainingAmount)}
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Mode */}
              <div className="pr-table-cell">
                <span className={`pr-delivery-badge ${isRoadside(s.deliveryMode) ? 'roadside' : ''}`}>
                  {isRoadside(s.deliveryMode) ? 'Roadside' : 'Hub'}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Footer */}
        {pagination && shipments.length > 0 && (
          <div className="pr-footer">
            <span className="pr-footer-info">
              Showing{' '}
              <strong>
                {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                –{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
              </strong>{' '}
              of <strong>{pagination.totalItems}</strong> shipments
            </span>

            <div className="pr-pagination">
              <button
                className="pr-page-btn"
                disabled={page === 1}
                onClick={() => onPageChange((p) => p - 1)}
                aria-label="Previous page"
              >‹</button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    className={`pr-page-btn ${p === page ? 'active' : ''}`}
                    onClick={() => onPageChange(() => p)}
                  >
                    {p}
                  </button>
                ))}

              <button
                className="pr-page-btn"
                disabled={page === pagination.totalPages}
                onClick={() => onPageChange((p) => p + 1)}
                aria-label="Next page"
              >›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}