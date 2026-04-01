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

  const [shipments, setShipments]   = useState([]);
  const [selected, setSelected]     = useState([]);
  const [search, setSearch]         = useState('');
  const [activeStatuses, setActiveStatuses] = useState([]);
  const [dateRange, setDateRange]   = useState(null);
  const [currentPage, setPage]      = useState(1);
  const [rowsPerPage, setRows]      = useState(5);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => { fetchShipments(); }, []);

  async function fetchShipments() {
    try {
      setLoading(true);
      setError(null);
      const result = await getShipments({ offset: 0, limit: 100 });
      const formatted = (result.shipments || []).map(s => ({
        shipment_id:   s.shipment_id,
        shipment_code: s.shipment_code,
        sender:        s.sender      || 'Unknown',
        receiver:      s.receiver    || 'Unknown',
        route:         s.route       || 'N/A',
        from:          s.from        || '',
        to:            s.to          || '',
        status:        s.status      || 'Pending',
        transporter:   s.transporter || 'Unassigned',
        delivery_mode: s.delivery_mode || 'Unknown',
        trip_id:       s.trip_id    || null,
        created_at:    s.created_at || '',
      }));
      setShipments(formatted);
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

      // Date filtering
      let matchDate = true;
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        const shipmentDate = new Date(s.created_at);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);

        // Set time to start/end of day for inclusive filtering
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        matchDate = shipmentDate >= startDate && shipmentDate <= endDate;
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

  const toggleOne = (code) =>
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

        {/* Head */}
        <div className="sh-thead">
          <div className="sh-th">
            <input
              type="checkbox"
              className="sh-checkbox"
              checked={allChecked}
              ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
              onChange={toggleAll}
            />
          </div>
          {['Shipment ID', 'Sender', 'Receiver', 'Route', 'Status', 'Transporter'].map(h => (
            <div key={h} className="sh-th">{h}</div>
          ))}
        </div>

        {/* Body */}
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="sh-skeleton-row">
              <div className="sh-skel" style={{ width: 14, height: 14, borderRadius: 4 }} />
              <div className="sh-skel sh-skel-code" />
              <div className="sh-skel sh-skel-person" />
              <div className="sh-skel sh-skel-person" />
              <div className="sh-skel sh-skel-route" />
              <div className="sh-skel sh-skel-badge" />
              <div className="sh-skel sh-skel-text" />
            </div>
          ))
        ) : error ? (
          <div className="sh-empty">
            <div className="sh-empty-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="sh-empty-title">Failed to load</p>
            <p className="sh-empty-sub">{error}</p>
          </div>
        ) : slice.length === 0 ? (
          <div className="sh-empty">
            <div className="sh-empty-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <p className="sh-empty-title">No shipments found</p>
            <p className="sh-empty-sub">
              {search || activeStatuses.length > 0
                ? 'Try a different search or filter.'
                : 'No shipments available yet.'}
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

        {/* Footer */}
        {!loading && !error && filtered.length > 0 && (
          <div className="sh-footer">
            <div className="sh-footer-left">
              <span className="sh-footer-info">
                Showing&nbsp;
                <strong>{(safePage - 1) * rowsPerPage + 1}–{Math.min(safePage * rowsPerPage, filtered.length)}</strong>
                &nbsp;of&nbsp;<strong>{filtered.length}</strong>
              </span>
              <div className="sh-rows-wrap">
                <span className="sh-rows-label">Rows</span>
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
              <button className="sh-page-btn" disabled={safePage === 1}
                onClick={() => setPage(p => p - 1)}>‹</button>
              {pageRange.map((p, i) =>
                p === '…'
                  ? <span key={`d${i}`} className="sh-dots">…</span>
                  : <button key={p}
                      className={`sh-page-btn${p === safePage ? ' active' : ''}`}
                      onClick={() => setPage(p)}>{p}</button>
              )}
              <button className="sh-page-btn" disabled={safePage === totalPages}
                onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}