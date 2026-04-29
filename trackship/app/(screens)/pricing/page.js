// app/(screens)/pricing/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { getPricingConfig, updatePricingConfig } from '@/lib/api';
import { Package, PackageOpen, Container, ShieldCheck } from 'lucide-react';
import PriceCard from '@/components/pricing/PriceCard';
import TierTable from '@/components/pricing/TierTable';
import styles from './pricing.module.css';

const PARCEL_CARDS = [
  { key: 'price_small_parcel',  label: 'Small Parcel',  icon: <Package size={20} strokeWidth={1.75} />,      accent: 'var(--accent-yellow)' },
  { key: 'price_medium_parcel', label: 'Medium Parcel', icon: <PackageOpen size={20} strokeWidth={1.75} />,  accent: 'var(--accent-blue)'   },
  { key: 'price_large_parcel',  label: 'Large Parcel',  icon: <Container size={20} strokeWidth={1.75} />,    accent: 'var(--accent-orange)' },
  { key: 'price_insurance',     label: 'Insurance Fee', icon: <ShieldCheck size={20} strokeWidth={1.75} />,  accent: 'var(--accent-green)'  },
];

function SkelCard() {
  return <div className={styles.skelCard} />;
}

export default function PricingPage() {
  const [config,  setConfig]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPricingConfig();
      setConfig(res?.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const val  = (key) => config?.find((c) => c.config_key === key)?.config_value ?? '0';
  const desc = (key) => config?.find((c) => c.config_key === key)?.description  ?? '';

  const handleSave = async (key, value) => {
    try {
      const res = await updatePricingConfig(key, value);
      if (!res?.success) return false;
      setConfig((prev) =>
        prev.map((c) => c.config_key === key ? { ...c, config_value: String(value) } : c)
      );
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Price Management</h1>
          <p className={styles.sub}>Configure parcel pricing, distance tiers, and multipliers.</p>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className={styles.errorBanner}>
          ⚠ Failed to load pricing config — {error}
          <button onClick={load} className={styles.retryBtn}>Retry</button>
        </div>
      )}

      {/* ── Parcel Base Prices ── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionDot} style={{ background: 'var(--accent-yellow)' }} />
          <h2 className={styles.sectionTitle}>Parcel Base Prices</h2>
        </div>
        <p className={styles.sectionSub}>Base prices charged per parcel size before distance multipliers are applied.</p>
        <div className={styles.priceGrid}>
          {loading
            ? Array(4).fill(0).map((_, i) => <SkelCard key={i} />)
            : PARCEL_CARDS.map((card) => (
                <PriceCard
                  key={card.key}
                  configKey={card.key}
                  label={card.label}
                  description={desc(card.key)}
                  value={val(card.key)}
                  icon={card.icon}
                  accent={card.accent}
                  onSave={handleSave}
                />
              ))
          }
        </div>
      </div>

      {/* ── Distance Tier Pricing ── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionDot} style={{ background: 'var(--accent-blue)' }} />
          <h2 className={styles.sectionTitle}>Distance Tier Pricing</h2>
          <span className={styles.sectionBadge}>4 tiers</span>
        </div>
        <p className={styles.sectionSub}>Set km thresholds and price multipliers for each distance tier. Final price = base price × multiplier.</p>
        {loading
          ? <div className={styles.skelTable} />
          : <TierTable config={config} onSave={handleSave} />
        }
      </div>

    </div>
  );
}

function RefreshIcon({ loading }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
    >
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}