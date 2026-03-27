'use client';
import styles from './DateFilterPanel.module.css';

export default function DateFilterPanel({
  draft,
  appliedFilter,
  summary,
  onDraftChange,
  onApply,
  onClear,
}) {
  const filtered = !!appliedFilter;
  const rate = summary?.success_rate;
  const rateNum = parseFloat(rate);
  const rateDisplay = !rate
    ? '—'
    : isNaN(rateNum)
      ? '0.0%'
      : `${rateNum.toFixed(1)}%`;

  const summaryRows = [
    ['Shipments', summary?.total_shipments],
    ['Delivered', summary?.delivered_shipments],
    ['Active Drivers', summary?.active_drivers],
    ['Success Rate', rateDisplay],
  ];

  const activeTag = (() => {
    if (!appliedFilter) return null;
    if (appliedFilter.mode === 'single') return `Showing data for ${appliedFilter.date}`;
    if (appliedFilter.mode === 'range') return `Showing data for ${appliedFilter.startDate} - ${appliedFilter.endDate}`;
    return null;
  })();

  return (
    <div className={styles.section}>
      <div className={styles.title}>📅 Filter by Date</div>

      <div className={styles.modeRow}>
        <button
          type="button"
          className={`${styles.modeBtn} ${draft.mode === 'single' ? styles.modeActive : ''}`}
          onClick={() => onDraftChange({ ...draft, mode: 'single' })}
        >
          Single date
        </button>
        <button
          type="button"
          className={`${styles.modeBtn} ${draft.mode === 'range' ? styles.modeActive : ''}`}
          onClick={() => onDraftChange({ ...draft, mode: 'range' })}
        >
          Date range
        </button>
      </div>

      {draft.mode === 'single' ? (
        <input
          type="date"
          className={`input ${styles.datepick}`}
          value={draft.date}
          onChange={(e) => onDraftChange({ ...draft, date: e.target.value })}
        />
      ) : (
        <div className={styles.rangeRow}>
          <input
            type="date"
            className={`input ${styles.rangeInput}`}
            value={draft.startDate}
            onChange={(e) => onDraftChange({ ...draft, startDate: e.target.value })}
          />
          <span className={styles.rangeDash}>—</span>
          <input
            type="date"
            className={`input ${styles.rangeInput}`}
            value={draft.endDate}
            onChange={(e) => onDraftChange({ ...draft, endDate: e.target.value })}
          />
        </div>
      )}

      <div className={styles.btnRow}>
        <button
          className={`btn btn-primary btn-sm ${styles.apply}`}
          onClick={onApply}
          type="button"
          disabled={
            draft.mode === 'single'
              ? !draft.date
              : !draft.startDate || !draft.endDate
          }
        >
          Apply
        </button>
        {filtered && (
          <button className={`btn btn-secondary btn-sm`} onClick={onClear} type="button">
            Clear
          </button>
        )}
      </div>

      {activeTag && <div className={styles.activeTag}>{activeTag}</div>}

      {/* Filtered summary rows */}
      {filtered && summary && (
        <div className={styles.summaryBox}>
          {summaryRows.map(([k, v]) => (
            <div key={k} className={styles.summaryRow}>
              <span className={styles.summaryKey}>{k}</span>
              <span className={styles.summaryVal}>{v ?? '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}