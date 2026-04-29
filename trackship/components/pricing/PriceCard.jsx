// components/pricing/PriceCard.jsx
'use client';
import { useState } from 'react';
import styles from './PriceCard.module.css';

export default function PriceCard({ configKey, label, description, value, icon, accent, onSave }) {
  const [editing,  setEditing]  = useState(false);
  const [input,    setInput]    = useState(String(parseFloat(value)));
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null); // 'ok' | 'err'

  const handleSave = async () => {
    const num = parseFloat(input);
    if (isNaN(num) || num < 0) { setToast('err'); setTimeout(() => setToast(null), 2500); return; }
    setSaving(true);
    const ok = await onSave(configKey, num);
    setSaving(false);
    if (ok) { setEditing(false); setToast('ok'); setTimeout(() => setToast(null), 2000); }
    else    { setToast('err'); setTimeout(() => setToast(null), 2500); }
  };

  const handleCancel = () => {
    setInput(String(parseFloat(value)));
    setEditing(false);
  };

  return (
    <div className={styles.card} style={{ '--acc': accent }}>
      <div className={styles.topBar} />
      <div className={styles.iconRow}>
        <span className={styles.icon} style={{ color: accent }}>{icon}</span>
        {toast === 'ok'  && <span className={styles.toastOk}>✓ Saved</span>}
        {toast === 'err' && <span className={styles.toastErr}>✕ Invalid</span>}
      </div>
      <p className={styles.label}>{label}</p>
      <p className={styles.desc}>{description}</p>

      {editing ? (
        <div className={styles.editRow}>
          <span className={styles.prefix}>Nu</span>
          <input
            className={styles.input}
            type="number"
            min="0"
            step="0.01"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            autoFocus
          />
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <span className={styles.spin} /> : 'Save'}
          </button>
          <button className={styles.cancelBtn} onClick={handleCancel}>✕</button>
        </div>
      ) : (
        <div className={styles.valueRow}>
          <span className={styles.value}>Nu {parseFloat(value).toFixed(2)}</span>
          <button className={styles.editBtn} onClick={() => { setInput(String(parseFloat(value))); setEditing(true); }}>
            <EditIcon /> Edit
          </button>
        </div>
      )}
    </div>
  );
}

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);