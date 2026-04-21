'use client';
import './PaymentFilters.css';

const CalendarIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export default function PaymentFilters({ 
  activeTab, 
  filters, 
  filterOptions, 
  onFilterChange, 
  onReset,
  onExport,
  exporting 
}) {
  const handleExport = () => {
    if (activeTab === 'cashLedger') {
      onExport('cashLedger');
    } else if (activeTab === 'reconciliation') {
      onExport('reconciliation');
    }
  };

  return (
    <div className="pr-filters-bar">
      <div className="pr-filter-group">
        <label className="pr-filter-label">
          <CalendarIcon />
          From
        </label>
        <input
          type="date"
          className="pr-filter-input"
          value={filters.startDate}
          onChange={e => onFilterChange('startDate', e.target.value)}
        />
      </div>

      <div className="pr-filter-group">
        <label className="pr-filter-label">
          <CalendarIcon />
          To
        </label>
        <input
          type="date"
          className="pr-filter-input"
          value={filters.endDate}
          onChange={e => onFilterChange('endDate', e.target.value)}
        />
      </div>

      {activeTab !== 'hubBalances' && (
        <>
          <div className="pr-filter-group">
            <select
              className="pr-filter-select"
              value={filters.hubId}
              onChange={e => onFilterChange('hubId', e.target.value)}
            >
              <option value="">All Hubs</option>
              {filterOptions?.hubs?.map(hub => (
                <option key={hub.value} value={hub.value}>{hub.label}</option>
              ))}
            </select>
          </div>

          {activeTab === 'cashLedger' && (
            <>
              <div className="pr-filter-group">
                <select
                  className="pr-filter-select"
                  value={filters.transactionType}
                  onChange={e => onFilterChange('transactionType', e.target.value)}
                >
                  <option value="">All Transaction Types</option>
                  {filterOptions?.transactionTypes?.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="pr-filter-group">
                <select
                  className="pr-filter-select"
                  value={filters.transporterId}
                  onChange={e => onFilterChange('transporterId', e.target.value)}
                >
                  <option value="">All Transporters</option>
                  {filterOptions?.transporters?.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {activeTab === 'reconciliation' && (
            <>
              <div className="pr-filter-group">
                <select
                  className="pr-filter-select"
                  value={filters.sourceHubId}
                  onChange={e => onFilterChange('sourceHubId', e.target.value)}
                >
                  <option value="">Source Hub (All)</option>
                  {filterOptions?.hubs?.map(hub => (
                    <option key={hub.value} value={hub.value}>{hub.label}</option>
                  ))}
                </select>
              </div>

              <div className="pr-filter-group">
                <select
                  className="pr-filter-select"
                  value={filters.destinationHubId}
                  onChange={e => onFilterChange('destinationHubId', e.target.value)}
                >
                  <option value="">Destination Hub (All)</option>
                  {filterOptions?.hubs?.map(hub => (
                    <option key={hub.value} value={hub.value}>{hub.label}</option>
                  ))}
                </select>
              </div>

              <div className="pr-filter-group">
                <select
                  className="pr-filter-select"
                  value={filters.paymentStatus}
                  onChange={e => onFilterChange('paymentStatus', e.target.value)}
                >
                  <option value="">All Payment Status</option>
                  {filterOptions?.paymentStatuses?.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div className="pr-filter-group">
                <select
                  className="pr-filter-select"
                  value={filters.deliveryMode}
                  onChange={e => onFilterChange('deliveryMode', e.target.value)}
                >
                  <option value="">All Delivery Modes</option>
                  {filterOptions?.deliveryModes?.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'hubBalances' && (
        <div className="pr-filter-group">
          <select
            className="pr-filter-select"
            value={filters.region}
            onChange={e => onFilterChange('region', e.target.value)}
          >
            <option value="">All Regions</option>
            {[...new Set(filterOptions?.hubs?.map(h => h.region))].filter(Boolean).map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      )}

      <button className="pr-filter-reset" onClick={onReset}>Reset</button>

      {(activeTab === 'cashLedger' || activeTab === 'reconciliation') && (
        <div className="pr-export-buttons">
          <button className="pr-export-btn" onClick={handleExport} disabled={exporting}>
            <DownloadIcon />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      )}
    </div>
  );
}