'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ShipmentRow from './ShipmentRow';
import ShipmentsHeader from './ShipmentsHeader';
import './ShipmentsTable.css';

const ROWS_OPTIONS = [5, 10, 25];

export default function ShipmentsTable() {
  const router = useRouter();

  const [shipments, setShipments] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState(null);
  const [currentPage, setPage] = useState(1);
  const [rowsPerPage, setRows] = useState(5);

  useEffect(() => {
    fetchShipments();
  }, []);

  async function fetchShipments() {
    try {
      const res = await fetch('/api/admin/shipments');
      const data = await res.json();

      const formatted = data.shipments.map(s => ({
        shipment_code: s.shipment_code,
        sender: s.sender_name,
        receiver: s.receiver_name,
        route: `${s.source_hub} - ${s.destination_hub}`,
        status: s.status,
        transporter: s.transporter_name || 'N/A',
      }));

      setShipments(formatted);
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return shipments.filter(s => {
      const matchSearch = !q || [s.shipment_code, s.sender, s.receiver, s.route, s.transporter]
        .some(v => v?.toLowerCase().includes(q));
      const matchStatus = !statusFilter || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [shipments, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * rowsPerPage;
  const slice = filtered.slice(start, start + rowsPerPage);

  const toggle = (code) => {
    setSelected(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleRowClick = (shipment) => {
    router.push(`/admin/shipments/${shipment.shipment_code}`);
  };

  return (
    <div className="shipments-wrapper">
      <ShipmentsHeader
        selected={selected}
        onSearch={setSearch}
        onStatusChange={setStatus}
      />

      <div className="table-card">
        <div className="shipments-head">
          <div className="head-check"></div>
          <div className="head-cell">ID</div>
          <div className="head-cell">Sender</div>
          <div className="head-cell">Receiver</div>
          <div className="head-cell">Route</div>
          <div className="head-cell">Status</div>
          <div className="head-cell">Transporter</div>
        </div>

        {slice.length === 0 ? (
          <div className="empty-state">No shipments found.</div>
        ) : (
          slice.map((s) => (
            <ShipmentRow
              key={s.shipment_code}
              shipment={s}
              checked={selected.includes(s.shipment_code)}
              onToggle={() => toggle(s.shipment_code)}
              onClick={() => handleRowClick(s)}
            />
          ))
        )}
      </div>
    </div>
  );
}