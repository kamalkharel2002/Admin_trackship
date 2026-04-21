'use client';
import './PaymentCashLedger.css';

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

function formatDateTime(dateStr) {
  if (!dateStr) return { date: '—', time: '' };
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

function getInitials(name = '') {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Transaction type → badge class ──────────────────────────────────────────

function getTxClass(type = '') {
  const t = type.toLowerCase();
  if (t.includes('customer') || t.includes('payment')) return 'customer';
  if (t.includes('settlement') || t.includes('transporter')) return 'settlement';
  if (t.includes('adjust')) return 'adjustment';
  if (t.includes('refund')) return 'refund';
  return 'default';
}

// ─── Payment method → badge class ────────────────────────────────────────────

function getMethodClass(method = '') {
  const m = method.toLowerCase();
  if (m === 'cash') return 'cash';
  if (m === 'online' || m === 'upi' || m === 'card') return 'online';
  return '';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryBar({ summary }) {
  return (
    <div className="pcl-summary-bar">
      <div className="pcl-summary-item">
        <span className="pcl-summary-label">Total Transactions</span>
        <span className="pcl-summary-value">{summary?.totalTransactions ?? 0}</span>
      </div>
      {summary?.byTransactionType?.map((type) => (
        <div key={type.transactionType} className="pcl-summary-item">
          <span className="pcl-summary-label">
            {type.transactionType.replace(/_/g, ' ')}
          </span>
          <span className="pcl-summary-value">{formatCurrency(type.totalAmount)}</span>
          <span className="pcl-summary-count">{type.transactionCount} txns</span>
        </div>
      ))}
    </div>
  );
}

const HEADERS = [
  'Date & Time',
  'Transaction Type',
  'Amount',
  'Payment Method',
  'Hub',
  'Collected By',
  'Shipment',
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentCashLedger({ data, page, onPageChange }) {
  if (!data) return null;

  const transactions = data.transactions ?? [];
  const pagination = data.pagination;

  return (
    <div className="pcl-root">
      <SummaryBar summary={data.summary} />

      <div className="pcl-table-wrap">
        {/* Head */}
        <div className="pcl-table-head">
          {HEADERS.map((h) => (
            <div key={h} className="pcl-table-th">{h}</div>
          ))}
        </div>

        {/* Body */}
        {transactions.length === 0 ? (
          <div className="pcl-empty-state">
            <div className="pcl-empty-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4l3 3" />
              </svg>
            </div>
            <p className="pcl-empty-title">No transactions found</p>
            <p className="pcl-empty-sub">Try adjusting your filters</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const { date, time } = formatDateTime(tx.collectionTime);
            const txClass = getTxClass(tx.transactionDisplay ?? tx.transactionType ?? '');
            const methodClass = getMethodClass(tx.paymentMethod ?? '');

            return (
              <div key={tx.id} className="pcl-table-row">
                {/* Date & Time */}
                <div className="pcl-table-cell">
                  <div className="pcl-datetime">
                    <span className="pcl-datetime-date">{date}</span>
                    <span className="pcl-datetime-time">{time}</span>
                  </div>
                </div>

                {/* Transaction Type */}
                <div className="pcl-table-cell">
                  <span className={`pcl-tx-badge ${txClass}`}>
                    <span className="pcl-tx-dot" />
                    {tx.transactionDisplay}
                  </span>
                </div>

                {/* Amount */}
                <div className="pcl-table-cell pcl-amount">
                  {formatCurrency(tx.amountCollected)}
                </div>

                {/* Payment Method */}
                <div className="pcl-table-cell">
                  <span className={`pcl-method-badge ${methodClass}`}>
                    {tx.paymentMethod ?? '—'}
                  </span>
                </div>

                {/* Hub */}
                <div className="pcl-table-cell">
                  <span className="pcl-hub" title={tx.hubName}>{tx.hubName ?? '—'}</span>
                </div>

                {/* Collected By */}
                <div className="pcl-table-cell">
                  <div className="pcl-user">
                    <div className="pcl-user-avatar">
                      {getInitials(tx.collectedByUserName ?? '')}
                    </div>
                    <span className="pcl-user-name" title={tx.collectedByUserName}>
                      {tx.collectedByUserName ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Shipment Code */}
                <div className="pcl-table-cell">
                  {tx.shipmentCode
                    ? <span className="pcl-code-chip">{tx.shipmentCode}</span>
                    : <span style={{ color: '#D1D5DB' }}>—</span>
                  }
                </div>
              </div>
            );
          })
        )}

        {/* Footer */}
        {pagination && transactions.length > 0 && (
          <div className="pcl-footer">
            <span className="pcl-footer-info">
              Showing{' '}
              <strong>
                {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                –{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
              </strong>{' '}
              of <strong>{pagination.totalItems}</strong> transactions
            </span>

            <div className="pcl-pagination">
              <button
                className="pcl-page-btn"
                disabled={page === 1}
                onClick={() => onPageChange((p) => p - 1)}
                aria-label="Previous page"
              >‹</button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    className={`pcl-page-btn ${p === page ? 'active' : ''}`}
                    onClick={() => onPageChange(() => p)}
                  >
                    {p}
                  </button>
                ))}

              <button
                className="pcl-page-btn"
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