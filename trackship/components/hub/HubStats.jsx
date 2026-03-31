'use client';
// components/hub/HubStats.jsx
// Three metric cards derived from the hub list — no separate API call needed

import { MapPin, Users, Package } from 'lucide-react';
import s from './HubStats.module.css';

const STATS_CFG = [
  {
    key:    'hubs',
    label:  'Total Hubs',
    icon:   <MapPin size={22} color="#0EA5E9" />,
    iconBg: '#E0F2FE',
  },
  {
    key:    'coordinators',
    label:  'Total Hub Coordinators',
    icon:   <Users size={22} color="#22C55E" />,
    iconBg: '#DCFCE7',
  },
  {
    key:    'shipments',
    label:  'Total Shipments',
    icon:   <Package size={22} color="#818CF8" />,
    iconBg: '#EDE9FE',
  },
];

// Derive counts from hub list — avoids extra API calls
function deriveStats(hubs) {
  return {
    hubs:         hubs.length,
    coordinators: hubs.reduce((acc, h) => acc + (h.coordinators?.length ?? 0), 0),
    shipments:    hubs.reduce((acc, h) => acc + (h.shipments ?? 0), 0),
  };
}

export default function HubStats({ hubs = [], loading = false }) {
  const stats = deriveStats(hubs);

  return (
    <div className={s.row}>
      {STATS_CFG.map(cfg =>
        loading ? (
          <div key={cfg.key} className={s.skeleton} />
        ) : (
          <div key={cfg.key} className={s.card}>
            <div className={s.left}>
              <div className={s.label}>{cfg.label}</div>
              <div className={s.value}>{stats[cfg.key]}</div>
            </div>
            <div className={s.iconWrap} style={{ background: cfg.iconBg }}>
              {cfg.icon}
            </div>
          </div>
        )
      )}
    </div>
  );
}