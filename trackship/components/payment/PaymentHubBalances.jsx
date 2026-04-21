'use client';
import './PaymentHubBalances.css';

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

function getInitials(name = '') {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryBar({ summary }) {
  const items = [
    { label: 'Total Hubs',        value: summary?.totalHubs ?? 0 },
    { label: 'Total Cash Balance', value: formatCurrency(summary?.totalCashBalance) },
    { label: 'Avg Balance / Hub',  value: formatCurrency(summary?.averageBalancePerHub) },
    { label: 'Total Inflow',       value: formatCurrency(summary?.totalCashInflow) },
  ];

  return (
    <div className="phb-summary-bar">
      {items.map((item, i) => (
        <div key={i} className="phb-summary-item">
          <span className="phb-summary-label">{item.label}</span>
          <span className="phb-summary-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

const HEADERS = [
  'Hub Name',
  'Region',
  'Current Balance',
  'Customer Payments',
  'Transporter Settlements',
  'Shipments',
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentHubBalances({ data }) {
  if (!data) return null;

  const hubs = data.hubs ?? [];

  return (
    <div className="phb-root">
      <SummaryBar summary={data.summary} />

      <div className="phb-table-wrap">
        {/* Head */}
        <div className="phb-table-head">
          {HEADERS.map((h) => (
            <div key={h} className="phb-table-th">{h}</div>
          ))}
        </div>

        {/* Body */}
        {hubs.length === 0 ? (
          <div className="phb-empty-state">
            <div className="phb-empty-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
                <path d="M4 6v12a2 2 0 0 0 2 2h14v-6"/>
                <path d="M18 12a2 2 0 0 1 0 4"/>
              </svg>
            </div>
            <p className="phb-empty-title">No hubs found</p>
            <p className="phb-empty-sub">Try adjusting your region filter</p>
          </div>
        ) : (
          hubs.map((hub) => (
            <div key={hub.hubId} className="phb-table-row">
              {/* Hub Name */}
              <div className="phb-table-cell phb-hub-name">
                <div className="phb-hub-avatar">{getInitials(hub.name)}</div>
                {hub.name}
              </div>

              {/* Region */}
              <div className="phb-table-cell">
                <span className="phb-region-badge">{hub.region}</span>
              </div>

              {/* Current Balance */}
              <div className="phb-table-cell phb-balance">
                {formatCurrency(hub.currentCashBalance)}
              </div>

              {/* Customer Payments */}
              <div className="phb-table-cell phb-amount">
                {formatCurrency(hub.totalCustomerPayments)}
              </div>

              {/* Transporter Settlements */}
              <div className="phb-table-cell phb-amount">
                {formatCurrency(hub.totalTransporterSettlements)}
              </div>

              {/* Shipments */}
              <div className="phb-table-cell phb-shipments">
                {hub.shipmentsProcessed ?? '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}