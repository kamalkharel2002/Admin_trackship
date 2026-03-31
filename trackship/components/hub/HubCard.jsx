'use client';
// components/hub/HubCard.jsx
// Displays one hub: name, location, coordinators, active drivers, shipments
// onEdit / onDelete callbacks bubble up to hubs page

import { MapPin, Pencil, Trash2 } from 'lucide-react';
import s from './HubCard.module.css';

function CoordinatorChip({ name }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className={s.coordinatorChip}>
      <span className={s.coordinatorAvatar}>{initials}</span>
      {name}
    </span>
  );
}

export default function HubCard({ hub, onEdit, onDelete }) {
  return (
    <div className={s.card}>

      {/* Header: name + location + actions */}
      <div className={s.header}>
        <div className={s.nameBlock}>
          <div className={s.name}>{hub.name}</div>
          <div className={s.location}>
            <MapPin size={11} />
            {hub.region}
          </div>
        </div>
        <div className={s.actions}>
          <button
            className={s.actionBtn}
            onClick={() => onEdit(hub)}
            aria-label={`Edit ${hub.name}`}
          >
            <Pencil size={13} />
          </button>
          <button
            className={`${s.actionBtn} ${s.danger}`}
            onClick={() => onDelete(hub)}
            aria-label={`Delete ${hub.name}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className={s.divider} />

      {/* Coordinators */}
      <div className={s.section}>
        <div className={s.sectionLabel}>Coordinator</div>
        <div className={s.coordinatorList}>
          {hub.coordinators?.length ? (
            hub.coordinators.map((c, i) => (
              <CoordinatorChip key={i} name={typeof c === 'string' ? c : c.name} />
            ))
          ) : (
            <span className={s.noCoordinator}>No coordinator assigned</span>
          )}
        </div>
      </div>

      <div className={s.divider} />

      {/* Stats */}
      <div className={s.stats}>
        <div className={s.stat}>
          <div className={s.statLabel}>Active Drivers</div>
          <div className={`${s.statValue} ${s.blue}`}>{hub.active_drivers}</div>
        </div>
        <div className={s.stat}>
          <div className={s.statLabel}>Shipments</div>
          <div className={`${s.statValue} ${s.green}`}>{hub.shipments}</div>
        </div>
      </div>

    </div>
  );
}