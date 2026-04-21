'use client';
import './PaymentDashboard.css';

const MoneyIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

const WalletIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
    <path d="M4 6v12a2 2 0 0 0 2 2h14v-6"/>
    <path d="M18 12a2 2 0 0 1 0 4"/>
  </svg>
);

const TruckIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="1" y="3" width="15" height="13"/>
    <rect x="16" y="8" width="7" height="8"/>
    <circle cx="6.5" cy="16.5" r="2.5"/>
    <circle cx="19.5" cy="16.5" r="2.5"/>
  </svg>
);

const UnpaidIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BTN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0).replace('BTN', 'Nu.');
}

export default function PaymentDashboard({ data }) {
  if (!data) return null;

  const maxHubBalance = Math.max(
    ...(data.hubCashBalances?.map(h => h.currentCashBalance) || [1])
  );

  const stats = [
    {
      title: 'Total collections',
      value: formatCurrency(data.totalCustomerCollections),
      icon: <MoneyIcon />,
      color: 'amber',
      trend: data.collectionsTrend,
      pills: [
        `Hub: ${formatCurrency(data.collectionsViaHub)}`,
        `Transporter: ${formatCurrency(data.collectionsViaTransporter)}`,
      ],
    },
    {
      title: 'Transporter settlements',
      value: formatCurrency(data.totalTransporterSettlements),
      icon: <TruckIcon />,
      color: 'blue',
      trend: data.settlementsTrend,
      sub: 'Paid by transporters to hubs',
    },
    {
      title: 'Unpaid shipments',
      value: data.unpaidShipmentsCount,
      icon: <UnpaidIcon />,
      color: 'red',
      trend: data.unpaidTrend,
      sub: `${formatCurrency(data.unpaidShipmentsAmount)} outstanding`,
    },
    {
      title: 'Total hub cash',
      value: formatCurrency(data.totalHubCash),
      icon: <WalletIcon />,
      color: 'green',
      trend: data.hubCashTrend,
      sub: `Across ${data.hubCashBalances?.length || 0} hubs`,
    },
  ];

  return (
    <>
      <div className="db-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="db-card">
            <div className="db-card-header">
              <div className={`db-icon ${stat.color}`}>{stat.icon}</div>
              <span className="db-label">{stat.title}</span>
            </div>
            <div>
              <div className="db-value">{stat.value}</div>
              {stat.trend && (
                <div className={`db-trend ${stat.trend.dir}`}>
                  {stat.trend.dir === 'up' ? '↑' : '↓'} {stat.trend.label}
                </div>
              )}
            </div>
            {stat.pills ? (
              <div className="db-pill-row">
                {stat.pills.map((p, i) => <span key={i} className="db-pill">{p}</span>)}
              </div>
            ) : (
              <div className="db-sub">{stat.sub}</div>
            )}
          </div>
        ))}
      </div>

      <div className="db-divider" />

      <div className="db-section-row">
        <span className="db-section-label">Hub cash balances</span>
        <span className="db-section-count">{data.hubCashBalances?.length || 0} hubs</span>
      </div>

      <div className="db-hub-grid">
        {data.hubCashBalances?.map(hub => {
          const pct = Math.round((hub.currentCashBalance / maxHubBalance) * 100);
          return (
            <div key={hub.hubId} className="db-hub">
              <div className="db-hub-name">{hub.name}</div>
              <div className="db-hub-region">{hub.region}</div>
              <div className="db-hub-amount">{formatCurrency(hub.currentCashBalance)}</div>
              <div className="db-hub-bar">
                <div className="db-hub-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}