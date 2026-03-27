'use client';
import styles from './DriverRequests.module.css';
import { useState } from 'react';

const INITIAL_REQUESTS = [
  { id: 1, name: 'Karma Dorji', vehicle: 'Toyota Hilux · BA-1234', initials: 'KD' },
  { id: 2, name: 'Tshering Wangdi', vehicle: 'Tata Truck · PA-5678', initials: 'TW' },
  { id: 3, name: 'Pema Lhamo', vehicle: 'Mahindra · PU-9012', initials: 'PL' },
];

export default function DriverRequests() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const handleApprove = (id) => setRequests((prev) => prev.filter((item) => item.id !== id));
  const handleReject = (id) => setRequests((prev) => prev.filter((item) => item.id !== id));

  return (
    <div className={styles.section}>
      <div className={styles.titleRow}>
        <span className={styles.title}>🚗 Driver Requests</span>
        {(requests?.length || 0) > 0 && (
          <span className="badge badge-blue">{requests.length}</span>
        )}
      </div>

      {requests.length === 0 && (
        <div className={styles.empty}>No pending requests</div>
      )}

      {requests.map((d) => (
          <div key={d.id} className={styles.card}>
            <div className={`avatar avatar-sm ${styles.avatar}`}>{d.initials || 'DR'}</div>
            <div className={styles.info}>
              <div className={styles.name}>{d.name}</div>
              <div className={`text-xs text-muted truncate ${styles.vehicle}`}>{d.vehicle}</div>
            </div>
            <div className={styles.actions}>
              <button className="btn-ok" title="Approve" onClick={() => handleApprove(d.id)}>✓</button>
              <button className="btn-no" title="Reject" onClick={() => handleReject(d.id)}>✕</button>
            </div>
          </div>
        ))}
    </div>
  );
}