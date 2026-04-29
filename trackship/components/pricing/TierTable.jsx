// components/pricing/TierTable.jsx
'use client';
import { useState } from 'react';
import styles from './TierTable.module.css';

function EditableCell({ value, configKey, onSave, prefix = '', suffix = '' }) {
  const [editing, setEditing] = useState(false);
  const [input,   setInput]   = useState(String(parseFloat(value)));
  const [saving,  setSaving]  = useState(false);
  const [status,  setStatus]  = useState(null); // 'ok' | 'err'

  const save = async () => {
    const num = parseFloat(input);
    if (isNaN(num) || num < 0) { setStatus('err'); setTimeout(() => setStatus(null), 2000); return; }
    setSaving(true);
    const ok = await onSave(configKey, num);
    setSaving(false);
    if (ok) { setEditing(false); setStatus('ok'); setTimeout(() => setStatus(null), 2000); }
    else    { setStatus('err'); setTimeout(() => setStatus(null), 2000); }
  };

  const cancel = () => { setInput(String(parseFloat(value))); setEditing(false); };

  if (editing) {
    return (
      <div className={styles.cellEdit}>
        <span className={styles.cellPre}>{prefix}</span>
        <input
          className={styles.cellInput}
          type="number" min="0" step="0.01"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          autoFocus
        />
        <span className={styles.cellSuf}>{suffix}</span>
        <button className={styles.cellSave} onClick={save} disabled={saving}>
          {saving ? <span className={styles.spin} /> : '✓'}
        </button>
        <button className={styles.cellCancel} onClick={cancel}>✕</button>
      </div>
    );
  }

  return (
    <div className={styles.cellView} onClick={() => { setInput(String(parseFloat(value))); setEditing(true); }}>
      <span className={status === 'ok' ? styles.valOk : status === 'err' ? styles.valErr : styles.val}>
        {prefix}{parseFloat(value).toFixed(2)}{suffix}
      </span>
      <span className={styles.pencil}>✎</span>
    </div>
  );
}

export default function TierTable({ config, onSave }) {
  if (!config) return null;

  const get = (key) => config.find((c) => c.config_key === key)?.config_value ?? '0';

  const t1max = parseFloat(get('distance_tier_1_max_km'));
  const t2max = parseFloat(get('distance_tier_2_max_km'));
  const t3max = parseFloat(get('distance_tier_3_max_km'));

  const tiers = [
    { num: 1, label: 'Tier 1', range: `0 – ${t1max} km`,      maxKey: 'distance_tier_1_max_km', maxVal: get('distance_tier_1_max_km'), mulKey: 'distance_tier_1_multiplier', mulVal: get('distance_tier_1_multiplier'), color: '#0EA5E9' },
    { num: 2, label: 'Tier 2', range: `${t1max} – ${t2max} km`, maxKey: 'distance_tier_2_max_km', maxVal: get('distance_tier_2_max_km'), mulKey: 'distance_tier_2_multiplier', mulVal: get('distance_tier_2_multiplier'), color: '#0EA5E9' },
    { num: 3, label: 'Tier 3', range: `${t2max} – ${t3max} km`, maxKey: 'distance_tier_3_max_km', maxVal: get('distance_tier_3_max_km'), mulKey: 'distance_tier_3_multiplier', mulVal: get('distance_tier_3_multiplier'), color: '#0EA5E9' },
    { num: 4, label: 'Tier 4', range: `${t3max} km+`,           maxKey: null,                    maxVal: null,                          mulKey: 'distance_tier_4_multiplier', mulVal: get('distance_tier_4_multiplier'), color: '#0EA5E9' },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Distance Tiers</h3>
          <p className={styles.sub}>Configure km thresholds and price multipliers per tier. Click any value to edit.</p>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Range</th>
              <th>Max km (upper limit)</th>
              <th>Price Multiplier</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => (
              <tr key={t.num}>
                <td>
                  <span className={styles.tierBadge} style={{ '--tc': t.color }}>
                    {t.label}
                  </span>
                </td>
                <td className={styles.rangeCell}>{t.range}</td>
                <td>
                  {t.maxKey ? (
                    <EditableCell value={t.maxVal} configKey={t.maxKey} onSave={onSave} suffix=" km" />
                  ) : (
                    <span className={styles.unlimited}>No limit</span>
                  )}
                </td>
                <td>
                  <EditableCell value={t.mulVal} configKey={t.mulKey} onSave={onSave} prefix="×" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.note}>
        <span className={styles.noteIcon}>ℹ</span>
        Tier 4 covers all distances beyond Tier 3's max km. Editing Tier max km automatically updates the range display.
      </div>
    </div>
  );
}