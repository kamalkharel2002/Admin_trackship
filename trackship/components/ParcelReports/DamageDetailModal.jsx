'use client';
// components/ParcelReports/DamageDetailModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, CheckCircle, AlertTriangle, Package, Truck,
  ZoomIn, ChevronLeft, ChevronRight, Shield, Zap,
  MapPin, Phone, User, Calendar, Hash, Banknote,
} from 'lucide-react';
import { updateDamageStatus } from '@/lib/api';
import { API_BASE } from '@/lib/config';
import s from './DamageDetailModal.module.css';

const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const photoUrl = (path) =>
  path ? `${API_BASE.replace('/api', '')}/${path.replace(/\\/g, '/')}` : null;

const SEV_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
const SEV_BG    = { high: '#FEF2F2', medium: '#FFFBEB', low: '#F0FDF4' };

function Badge({ children, color, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-head)',
      color, background: bg, border: `1px solid ${color}22`,
    }}>
      {children}
    </span>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className={s.infoCard}>
      <div className={s.infoCardIcon}><Icon size={13} /></div>
      <div>
        <div className={s.infoCardLabel}>{label}</div>
        <div className={s.infoCardValue}>{value || '—'}</div>
      </div>
    </div>
  );
}

function PhotoLightbox({ urls, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx(i => (i - 1 + urls.length) % urls.length);
  const next = () => setIdx(i => (i + 1) % urls.length);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return createPortal(
    <div className={s.lightboxOverlay} onClick={onClose}>
      <div className={s.lightboxInner} onClick={e => e.stopPropagation()}>
        <button className={s.lightboxClose} onClick={onClose}><X size={16} /></button>
        <button className={s.lightboxNav} style={{ left: 16 }} onClick={prev}><ChevronLeft size={20} /></button>
        <img src={photoUrl(urls[idx])} alt={`Evidence ${idx + 1}`} className={s.lightboxImg} />
        <button className={s.lightboxNav} style={{ right: 16 }} onClick={next}><ChevronRight size={20} /></button>
        <div className={s.lightboxCounter}>{idx + 1} / {urls.length}</div>
      </div>
    </div>,
    document.body
  );
}

export default function DamageDetailModal({ report, onClose, onResolved }) {
  const [notes,      setNotes]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState(null);
  const [mounted,    setMounted]    = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  const isResolved = report.resolution_status === 'solved';
  const maxSev = report.parcels?.reduce((m, p) => {
    const o = { high: 3, medium: 2, low: 1 };
    return (o[p.damage_severity] || 0) > (o[m] || 0) ? p.damage_severity : m;
  }, 'low') ?? 'low';

  const handleResolve = async () => {
    if (!notes.trim()) { setErr('Please add resolution notes before marking as resolved.'); return; }
    setErr(null);
    setLoading(true);
    try {
      await updateDamageStatus(report.damage_id, 'solved', notes.trim());
      onResolved(report.damage_id, notes.trim());
    } catch {
      setErr('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {lightboxIdx !== null && (
        <PhotoLightbox
          urls={report.evidence_photo_urls}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className={s.modal}>

          {/* ── Header ── */}
          <div className={s.modalHeader}>
            <div className={s.headerLeft}>
              <div className={s.sevDot} style={{ background: SEV_COLOR[maxSev] }} />
              <div>
                <div className={s.shipCode}>{report.shipment_code}</div>
                <div className={s.shipMeta}>
                  {report.delivery_mode?.replace(/_/g, ' ')} · {fmt(report.reported_at)}
                </div>
              </div>
            </div>
            <div className={s.headerRight}>
              <span className={`${s.statusChip} ${s[report.resolution_status]}`}>
                {isResolved ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                {report.resolution_status}
              </span>
              <button className={s.closeBtn} onClick={onClose}><X size={14} /></button>
            </div>
          </div>

          <div className={s.body}>

            {/* ── Two-column: Sender / Receiver ── */}
            <div className={s.partyRow}>
              <div className={s.partyCard}>
                <div className={s.partyLabel}>
                  <User size={11} /> Sender
                </div>
                <div className={s.partyName}>{report.sender_external_name || '—'}</div>
                {report.sender_external_phone && (
                  <div className={s.partyPhone}><Phone size={10} /> {report.sender_external_phone}</div>
                )}
              </div>
              <div className={s.partyArrow}>→</div>
              <div className={s.partyCard}>
                <div className={s.partyLabel}>
                  <User size={11} /> Receiver
                </div>
                <div className={s.partyName}>{report.receiver_external_name || '—'}</div>
                {report.receiver_external_phone && (
                  <div className={s.partyPhone}><Phone size={10} /> {report.receiver_external_phone}</div>
                )}
              </div>
            </div>

            {/* ── Shipment meta grid ── */}
            <div className={s.section}>
              <div className={s.secTitle}><Package size={11} /> Shipment Details</div>
              <div className={s.infoGrid}>
                <InfoCard icon={Banknote}  label="Total Price"  value={`Nu. ${report.total_price}`} />
                <InfoCard icon={User}      label="Reported By"  value={report.reported_by_name} />
                <InfoCard icon={Calendar}  label="Reported At"  value={fmt(report.reported_at)} />
                <InfoCard icon={MapPin}    label="Shipment Status" value={report.shipment_status?.replace(/_/g, ' ')} />
              </div>
            </div>

            {/* ── Transporter ── */}
            <div className={s.section}>
              <div className={s.secTitle}><Truck size={11} /> Transporter Details</div>
              <div className={s.infoGrid}>
                <InfoCard icon={User}     label="Driver"     value={report.transporter_name} />
                <InfoCard icon={Truck}    label="Vehicle"    value={`${report.vehicle_model ?? '—'} · ${report.vehicle_type ?? '—'}`} />
                <InfoCard icon={Hash}     label="Plate No"   value={report.vehicle_no} />
                <InfoCard icon={Calendar} label="Trip Date"  value={fmt(report.trip_date)} />
              </div>
            </div>

            {/* ── Parcels ── */}
            <div className={s.section}>
              <div className={s.secTitle}>
                <Package size={11} /> Damaged Parcels
                <span className={s.count}>{report.parcels?.length ?? 0}</span>
              </div>
              <div className={s.parcelList}>
                {report.parcels?.map((p) => (
                  <div key={p.id} className={s.parcelCard} style={{ borderLeftColor: SEV_COLOR[p.damage_severity] }}>
                    <div className={s.parcelHeader}>
                      <span className={s.parcelCat}>{p.category} · {p.dimensions}</span>
                      <div className={s.parcelBadges}>
                        <Badge color={SEV_COLOR[p.damage_severity]} bg={SEV_BG[p.damage_severity]}>
                          {p.damage_severity} severity
                        </Badge>
                        <Badge color="#DC2626" bg="#FEF2F2">{p.damage_type}</Badge>
                      </div>
                    </div>

                    {/* ── Fragile / Insured pills ── */}
                    <div className={s.parcelTraits}>
                      {p.is_fragile && (
                        <div className={s.traitPill} style={{ background: '#FDF2F8', color: '#9D174D', borderColor: '#F9A8D4' }}>
                          <Zap size={10} /> Fragile
                        </div>
                      )}
                      {p.is_insured && (
                        <div className={s.traitPill} style={{ background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}>
                          <Shield size={10} /> Insured
                        </div>
                      )}
                    </div>

                    {p.damage_description && (
                      <p className={s.parcelDesc}>"{p.damage_description}"</p>
                    )}
                    {p.parcel_description && (
                      <p className={s.parcelOrigDesc}>Contents: {p.parcel_description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Evidence photos ── */}
            {report.evidence_photo_urls?.length > 0 && (
              <div className={s.section}>
                <div className={s.secTitle}>
                  <ZoomIn size={11} /> Evidence Photos
                  <span className={s.count}>{report.evidence_photo_urls.length}</span>
                </div>
                <div className={s.photosGrid}>
                  {report.evidence_photo_urls.map((url, i) => (
                    <button
                      key={i}
                      className={s.photoThumb}
                      onClick={() => setLightboxIdx(i)}
                      title={`View photo ${i + 1}`}
                    >
                      <img
                        src={photoUrl(url)}
                        alt={`Evidence ${i + 1}`}
                        className={s.photoImg}
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                      <div className={s.photoFallback} style={{ display: 'none' }}>
                        <ZoomIn size={18} />
                        <span>Photo {i + 1}</span>
                      </div>
                      <div className={s.photoHover}><ZoomIn size={16} /></div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Resolve box ── */}
            <div className={`${s.resolveBox} ${isResolved ? s.isResolved : ''}`}>
              {isResolved ? (
                <>
                  <div className={s.resolveTitle} style={{ color: '#0369A1' }}>
                    <CheckCircle size={15} /> Already Resolved
                  </div>
                  {report.notes && <p className={s.resolvedNote}>"{report.notes}"</p>}
                </>
              ) : (
                <>
                  <div className={s.resolveTitle}>
                    <CheckCircle size={15} /> Mark as Resolved
                  </div>
                  {err && <div className={s.errMsg}>{err}</div>}
                  <textarea
                    className={s.textarea}
                    placeholder="Describe the resolution (e.g. 'Transporter confirmed fault, refund issued')…"
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); setErr(null); }}
                    rows={3}
                  />
                  <button className={s.resolveBtn} onClick={handleResolve} disabled={loading}>
                    {loading ? 'Saving…' : <><CheckCircle size={14} /> Mark as Resolved</>}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>,
    document.body
  );
}