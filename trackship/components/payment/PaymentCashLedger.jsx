'use client';
import './PaymentCashLedger.css';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BTN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0).replace('BTN', 'Nu.');
}
function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const MoneyIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

export default function PaymentCashLedger({ data, page, onPageChange }) {
  if (!data) return null;

  return (
    <>
      <div className="pr-summary-bar">
        <div className="pr-summary-item">
          <span className="pr-summary-label">Total Transactions</span>
          <span className="pr-summary-value">{data.summary?.totalTransactions || 0}</span>
        </div>
        {data.summary?.byTransactionType?.map(type => (
          <div key={type.transactionType} className="pr-summary-item">
            <span className="pr-summary-label">{type.transactionType.replace('_', ' ')}</span>
            <span className="pr-summary-value">{formatCurrency(type.totalAmount)}</span>
            <span className="pr-summary-count">({type.transactionCount})</span>
          </div>
        ))}
      </div>

      <div className="pr-table-wrap">
        <div className="pr-table-head cash-ledger-head">
          <div className="pr-table-th">Date & Time</div>
          <div className="pr-table-th">Transaction Type</div>
          <div className="pr-table-th">Amount</div>
          <div className="pr-table-th">Payment Method</div>
          <div className="pr-table-th">Hub</div>
          <div className="pr-table-th">Collected By</div>
          <div className="pr-table-th">Shipment</div>
        </div>

        {data.transactions?.length === 0 ? (
          <div className="pr-empty-state">
            <div className="pr-empty-icon"><MoneyIcon /></div>
            <p className="pr-empty-title">No transactions found</p>
            <p className="pr-empty-sub">Try adjusting your filters</p>
          </div>
        ) : (
          data.transactions.map(tx => (
            <div key={tx.id} className="pr-table-row cash-ledger-row">
              <div className="pr-table-cell">{formatDateTime(tx.collectionTime)}</div>
              <div className="pr-table-cell">
                <span className="pr-tx-type-badge">{tx.transactionDisplay}</span>
              </div>
              <div className="pr-table-cell pr-amount">{formatCurrency(tx.amountCollected)}</div>
              <div className="pr-table-cell">{tx.paymentMethod}</div>
              <div className="pr-table-cell">{tx.hubName}</div>
              <div className="pr-table-cell">{tx.collectedByUserName}</div>
              <div className="pr-table-cell pr-code">{tx.shipmentCode}</div>
            </div>
          ))
        )}

        {data.pagination && data.transactions?.length > 0 && (
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