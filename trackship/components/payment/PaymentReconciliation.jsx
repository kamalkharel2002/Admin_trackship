'use client';
import './PaymentReconciliation.css';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BTN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0).replace('BTN', 'Nu.');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function PaymentStatusBadge({ status }) {
  const getConfig = () => {
    if (status === 'Paid to Transporter') return { label: 'Paid to Transporter', cls: 'paid-transporter', icon: '🚚' };
    if (status === 'Paid to Hub') return { label: 'Paid to Hub', cls: 'paid-hub', icon: '🏢' };
    return { label: 'Unpaid', cls: 'unpaid', icon: '⚠️' };
  };
  const config = getConfig();
  return (
    <span className={`payment-status-badge ${config.cls}`}>
      <span className="payment-status-icon">{config.icon}</span>
      {config.label}
    </span>
  );
}

const MoneyIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

export default function PaymentReconciliation({ data, page, onPageChange }) {
  if (!data) return null;

  const summary = data.summary;

  return (
    <>
      <div className="pr-summary-bar">
        <div className="pr-summary-item">
          <span className="pr-summary-label">Total Shipments</span>
          <span className="pr-summary-value">{summary?.totalShipments || 0}</span>
        </div>
        <div className="pr-summary-item">
          <span className="pr-summary-label">Total Revenue</span>
          <span className="pr-summary-value">{formatCurrency(summary?.totalRevenue)}</span>
        </div>
        <div className="pr-summary-item">
          <span className="pr-summary-label">Collected</span>
          <span className="pr-summary-value green">{formatCurrency(summary?.totalCollected)}</span>
        </div>
        <div className="pr-summary-item">
          <span className="pr-summary-label">Outstanding</span>
          <span className="pr-summary-value red">{formatCurrency(summary?.outstandingAmount)}</span>
        </div>
        <div className="pr-summary-item">
          <span className="pr-summary-label">Paid to Transporter</span>
          <span className="pr-summary-value">{summary?.paidToTransporterCount || 0}</span>
        </div>
        <div className="pr-summary-item">
          <span className="pr-summary-label">Paid to Hub</span>
          <span className="pr-summary-value">{summary?.paidToHubCount || 0}</span>
        </div>
        <div className="pr-summary-item">
          <span className="pr-summary-label">Unpaid</span>
          <span className="pr-summary-value red">{summary?.unpaidCount || 0}</span>
        </div>
      </div>

      <div className="pr-table-wrap">
        <div className="pr-table-head reconciliation-head">
          <div className="pr-table-th">Shipment Code</div>
          <div className="pr-table-th">Date</div>
          <div className="pr-table-th">Sender</div>
          <div className="pr-table-th">Receiver</div>
          <div className="pr-table-th">Total</div>
          <div className="pr-table-th">Payment Status</div>
          <div className="pr-table-th">Paid / Remaining</div>
          <div className="pr-table-th">Delivery Mode</div>
        </div>

        {data.shipments?.length === 0 ? (
          <div className="pr-empty-state">
            <div className="pr-empty-icon"><MoneyIcon /></div>
            <p className="pr-empty-title">No shipments found</p>
            <p className="pr-empty-sub">Try adjusting your filters</p>
          </div>
        ) : (
          data.shipments.map(shipment => (
            <div key={shipment.shipmentId} className="pr-table-row reconciliation-row">
              <div className="pr-table-cell pr-code">{shipment.shipmentCode}</div>
              <div className="pr-table-cell">{formatDate(shipment.createdAt)}</div>
              <div className="pr-table-cell">{shipment.senderName}</div>
              <div className="pr-table-cell">{shipment.receiverName}</div>
              <div className="pr-table-cell pr-amount">{formatCurrency(shipment.totalPrice)}</div>
              <div className="pr-table-cell">
                <PaymentStatusBadge status={shipment.overallPaymentStatus} />
              </div>
              <div className="pr-table-cell">
                <div className="pr-payment-breakdown">
                  <span className="pr-paid">{formatCurrency(shipment.totalAmountPaid)}</span>
                  <span className="pr-sep">/</span>
                  <span className="pr-remaining">{formatCurrency(shipment.remainingAmount)}</span>
                </div>
              </div>
              <div className="pr-table-cell">
                <span className="pr-delivery-badge">{shipment.deliveryMode === 'Route_Side' ? 'Roadside' : 'Hub'}</span>
              </div>
            </div>
          ))
        )}

        {data.pagination && data.shipments?.length > 0 && (
          <div className="pr-table-footer">
            <span className="pr-footer-info">
              Showing {(data.pagination.currentPage - 1) * data.pagination.itemsPerPage + 1}–
              {Math.min(data.pagination.currentPage * data.pagination.itemsPerPage, data.pagination.totalItems)} of {data.pagination.totalItems}
            </span>
            <div className="pr-pagination">
              <button
                className="pr-page-btn"
                disabled={page === 1}
                onClick={() => onPageChange(p => p - 1)}
              >‹</button>
              <button className="pr-page-btn active">{page}</button>
              <button
                className="pr-page-btn"
                disabled={page === data.pagination.totalPages}
                onClick={() => onPageChange(p => p + 1)}
              >›</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}