'use client';
import './PaymentHubBalances.css';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BTN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0).replace('BTN', 'Nu.');
}

const WalletIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
    <path d="M4 6v12a2 2 0 0 0 2 2h14v-6"/>
    <path d="M18 12a2 2 0 0 1 0 4"/>
  </svg>
);

export default function PaymentHubBalances({ data }) {
  if (!data) return null;

  return (
    <>
      <div className="pr-summary-bar">
        <div className="pr-summary-item">
          <span className="pr-summary-label">Total Hubs</span>
          <span className="pr-summary-value">{data.summary?.totalHubs || 0}</span>
        </div>
        <div className="pr-summary-item">
          <span className="pr-summary-label">Total Cash Balance</span>
          <span className="pr-summary-value">{formatCurrency(data.summary?.totalCashBalance)}</span>
        </div>
        <div className="pr-summary-item">
          <span className="pr-summary-label">Avg Balance/Hub</span>
          <span className="pr-summary-value">{formatCurrency(data.summary?.averageBalancePerHub)}</span>
        </div>
        <div className="pr-summary-item">
          <span className="pr-summary-label">Total Inflow</span>
          <span className="pr-summary-value">{formatCurrency(data.summary?.totalCashInflow)}</span>
        </div>
      </div>

      <div className="pr-table-wrap">
        <div className="pr-table-head hub-balances-head">
          <div className="pr-table-th">Hub Name</div>
          <div className="pr-table-th">Region</div>
          <div className="pr-table-th">Current Balance</div>
          <div className="pr-table-th">Customer Payments</div>
          <div className="pr-table-th">Transporter Settlements</div>
          <div className="pr-table-th">Shipments</div>
        </div>

        {data.hubs?.length === 0 ? (
          <div className="pr-empty-state">
            <div className="pr-empty-icon"><WalletIcon /></div>
            <p className="pr-empty-title">No hubs found</p>
            <p className="pr-empty-sub">Try adjusting your region filter</p>
          </div>
        ) : (
          data.hubs.map(hub => (
            <div key={hub.hubId} className="pr-table-row hub-balances-row">
              <div className="pr-table-cell pr-hub-name">{hub.name}</div>
              <div className="pr-table-cell">{hub.region}</div>
              <div className="pr-table-cell pr-amount pr-balance">{formatCurrency(hub.currentCashBalance)}</div>
              <div className="pr-table-cell">{formatCurrency(hub.totalCustomerPayments)}</div>
              <div className="pr-table-cell">{formatCurrency(hub.totalTransporterSettlements)}</div>
              <div className="pr-table-cell">{hub.shipmentsProcessed}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}