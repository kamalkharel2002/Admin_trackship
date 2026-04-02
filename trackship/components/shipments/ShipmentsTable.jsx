'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getShipments } from '@/lib/api';
import ShipmentRow from './ShipmentRow';
import ShipmentsHeader from './ShipmentsHeader';
import './ShipmentsTable.css';

const ROWS_OPTIONS = [5, 10, 25];

export default function ShipmentsTable() {
  const router = useRouter();

  const [shipments, setShipments]           = useState([]);
  const [selected, setSelected]             = useState([]);
  const [search, setSearch]                 = useState('');
  const [activeStatuses, setActiveStatuses] = useState([]);
  const [dateRange, setDateRange]           = useState(null);
  const [currentPage, setPage]              = useState(1);
  const [rowsPerPage, setRows]              = useState(10);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);

  useEffect(() => { fetchShipments(); }, []);

  async function fetchShipments() {
    try {
      setLoading(true);
      setError(null);
      const result = await getShipments({ offset: 0, limit: 100 });
      setShipments(result.shipments || []);
      setPage(1);
    } catch (err) {
      console.error('Unable to load shipments', err);
      setError('Unable to load shipments. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  function handleStatusToggle(statusId) {
    if (statusId === null) { setActiveStatuses([]); return; }
    setActiveStatuses(prev =>
      prev.includes(statusId)
        ? prev.filter(s => s !== statusId)
        : [...prev, statusId]
    );
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return shipments.filter(s => {
      const matchSearch = !q ||
        [s.shipment_code, s.sender, s.receiver, s.route, s.transporter]
          .some(v => v?.toLowerCase().includes(q));
      const matchStatus = activeStatuses.length === 0 || activeStatuses.includes(s.status);

      let matchDate = true;
      if (dateRange?.startDate && dateRange?.endDate) {
        const d = new Date(s.created_at);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        matchDate = d >= start && d <= end;
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [shipments, search, activeStatuses, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage   = Math.min(currentPage, totalPages);
  const start      = (safePage - 1) * rowsPerPage;
  const slice      = filtered.slice(start, start + rowsPerPage);

  const allChecked  = slice.length > 0 && slice.every(s => selected.includes(s.shipment_code));
  const someChecked = slice.some(s => selected.includes(s.shipment_code));

  const toggleOne = code =>
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

  const toggleAll = () => {
    const codes = slice.map(s => s.shipment_code);
    if (allChecked) setSelected(prev => prev.filter(c => !codes.includes(c)));
    else setSelected(prev => [...new Set([...prev, ...codes])]);
  };

  const pageRange = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
      acc.push(p); return acc;
    }, []);

  return (
    <div className="shipments-wrapper">
      <ShipmentsHeader
        selected={selected}
        onSearch={v => { setSearch(v); setPage(1); }}
        activeStatuses={activeStatuses}
        onStatusToggle={handleStatusToggle}
        onDateChange={setDateRange}
      />

      <div className="sh-table-card">

        {/* ── Column Headers ── */}
        <div className="sh-thead">
          <div className="sh-th sh-th-check">
            <label className="sr-check-wrap">
              <input
                type="checkbox"
                ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                checked={allChecked}
                onChange={toggleAll}
              />
              <span className="sr-check-box" />
            </label>
          </div>
          {[
            { key: 'Shipment ID', icon: null },
            { key: 'Sender',      icon: null },
            { key: 'Receiver',    icon: null },
            { key: 'Route',       icon: null },
            { key: 'Status',      icon: null },
            { key: 'Transporter', icon: null },
          ].map(({ key }) => (
            <div key={key} className="sh-th">{key}</div>
          ))}
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div className="sh-skeleton-wrap">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="sh-skeleton-row" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="sh-skel sh-skel-check" />
                <div className="sh-skel sh-skel-code" />
                <div className="sh-skel sh-skel-person" />
                <div className="sh-skel sh-skel-person" />
                <div className="sh-skel sh-skel-route" />
                <div className="sh-skel sh-skel-badge" />
                <div className="sh-skel sh-skel-text" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="sh-state">
            <div className="sh-state-icon sh-state-icon-error">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="sh-state-title">Failed to load</p>
            <p className="sh-state-sub">{error}</p>
            <button className="sh-retry-btn" onClick={fetchShipments}>Try again</button>
          </div>
        ) : slice.length === 0 ? (
          <div className="sh-state">
            <div className="sh-state-icon">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <p className="sh-state-title">No shipments found</p>
            <p className="sh-state-sub">
              {search || activeStatuses.length > 0
                ? 'Try adjusting your search or filters.'
                : 'No shipments have been created yet.'}
            </p>
          </div>
        ) : (
          slice.map(shipment => (
            <ShipmentRow
              key={shipment.shipment_code}
              shipment={shipment}
              checked={selected.includes(shipment.shipment_code)}
              onToggle={() => toggleOne(shipment.shipment_code)}
              onClick={() => router.push(`/admin/shipments/${shipment.shipment_code}`)}
            />
          ))
        )}

        {/* ── Footer ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="sh-footer">
            <div className="sh-footer-left">
              <span className="sh-footer-count">
                <strong>{(safePage - 1) * rowsPerPage + 1}–{Math.min(safePage * rowsPerPage, filtered.length)}</strong>
                <span> of {filtered.length} shipments</span>
              </span>
              <div className="sh-rows-wrap">
                <span className="sh-rows-label">Per page</span>
                <select
                  className="sh-rows-select"
                  value={rowsPerPage}
                  onChange={e => { setRows(Number(e.target.value)); setPage(1); }}
                >
                  {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="sh-pagination">
              <button
                className="sh-page-btn sh-page-nav"
                disabled={safePage === 1}
                onClick={() => setPage(p => p - 1)}
                aria-label="Previous page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              {pageRange.map((p, i) =>
                p === '…'
                  ? <span key={`d${i}`} className="sh-dots">···</span>
                  : <button
                      key={p}
                      className={`sh-page-btn${p === safePage ? ' active' : ''}`}
                      onClick={() => setPage(p)}
                    >{p}</button>
              )}
              <button
                className="sh-page-btn sh-page-nav"
                disabled={safePage === totalPages}
                onClick={() => setPage(p => p + 1)}
                aria-label="Next page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}