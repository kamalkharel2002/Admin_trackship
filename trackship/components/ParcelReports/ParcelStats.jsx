'use client';
// components/ParcelReports/ParcelStats.jsx
import { Package, Clock, CheckCircle } from 'lucide-react';
import s from './ParcelStats.module.css';

const CARDS = [
  {
    key: 'total',
    label: 'Total Reports',
    icon: Package,
    color: '#6366F1',
    bg: '#EEF2FF',
    border: '#C7D2FE',
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: Clock,
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  {
    key: 'solved',
    label: 'Resolved',
    icon: CheckCircle,
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
  },
];

export default function ParcelStats({ stats, loading }) {
  return (
    <div className={s.grid}>
      {CARDS.map(({ key, label, icon: Icon, color, bg, border }) => (
        <div key={key} className={s.card} style={{ borderColor: border }}>
          <div className={s.cardIcon} style={{ background: bg, color }}>
            <Icon size={18} />
          </div>
          <div className={s.cardBody}>
            <div className={s.cardLabel}>{label}</div>
            {loading ? (
              <div className={s.skeleton} />
            ) : (
              <div className={s.cardValue} style={{ color }}>{stats[key] ?? 0}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}