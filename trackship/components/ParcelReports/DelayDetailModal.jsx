'use client';
// components/ParcelReports/DelayDetailModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Clock, CheckCircle, AlertTriangle, MinusCircle,
    Truck, User, Phone, MapPin, Calendar, Hash, Milestone,
} from 'lucide-react';
import { updateDelayStatus } from '@/lib/api';
import s from './DelayDetailModal.module.css';

const fmt = (d) =>
    d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const STATUS_CFG = {
    unresolved: { color: '#DC2626', bg: '#FEF2F2', label: 'Unresolved', Icon: AlertTriangle },
    resolved: { color: '#059669', bg: '#ECFDF5', label: 'Resolved', Icon: CheckCircle },
    excused: { color: '#D97706', bg: '#FFFBEB', label: 'Excused', Icon: MinusCircle },
};

const RESOLUTION_OPTIONS = ['unresolved', 'resolved', 'excused'];

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

// Success Toast Component
function SuccessToast({ message, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return createPortal(
        <div className={s.successToast}>
            <CheckCircle size={18} />
            <span>{message}</span>
        </div>,
        document.body
    );
}

export default function DelayDetailModal({ report, onClose, onUpdated }) {
    const [status, setStatus] = useState(report.resolution_status ?? 'unresolved');
    const [notes, setNotes] = useState(report.admin_notes ?? '');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => { setMounted(true); }, []);

    const cfg = STATUS_CFG[report.resolution_status] ?? STATUS_CFG.unresolved;

    const handleUpdate = async () => {
        if (!notes.trim()) { 
            setErr('Please add notes before updating.'); 
            return; 
        }
        setErr(null);
        setLoading(true);
        try {
            await updateDelayStatus(report.delay_id, status, notes.trim());
            
            // Get status label for success message
            const statusLabel = STATUS_CFG[status]?.label || status;
            setSuccessMessage(`Delay report marked as ${statusLabel} successfully!`);
            setShowSuccess(true);
            
            // Update parent component
            onUpdated(report.delay_id, status, notes.trim());
            
            // Close modal after a short delay to show success message
            setTimeout(() => {
                onClose();
            }, 1500);
            
        } catch {
            setErr('Failed to update. Please try again.');
            setLoading(false);
        }
    };

    if (!mounted) return null;

    const delayDays = report.delay_days != null
        ? `${report.delay_days}d late`
        : !report.actual_delivery_at ? 'Ongoing' : '—';

    return createPortal(
        <>
            <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div className={s.modal}>

                    {/* ── Header ── */}
                    <div className={s.modalHeader}>
                        <div className={s.headerLeft}>
                            <div className={s.headerDot} style={{ background: cfg.color }} />
                            <div>
                                <div className={s.shipCode}>{report.shipment_code}</div>
                                <div className={s.shipMeta}>{report.delivery_mode?.replace(/_/g, ' ')} · Detected {fmt(report.detected_at)}</div>
                            </div>
                        </div>
                        <div className={s.headerRight}>
                            <span className={s.statusChip} style={{ color: cfg.color, background: cfg.bg }}>
                                <cfg.Icon size={11} /> {cfg.label}
                            </span>
                            <button className={s.closeBtn} onClick={onClose}><X size={14} /></button>
                        </div>
                    </div>

                    <div className={s.body}>

                        {/* ── Summary strip ── */}
                        <div className={s.strip}>
                            {[
                                { label: 'Expected', value: fmt(report.expected_delivery_at) },
                                { label: 'Actual', value: fmt(report.actual_delivery_at) },
                                { label: 'Delay', value: delayDays, red: true },
                                { label: 'Distance', value: report.total_distance_km ? `${report.total_distance_km} km` : '—' },
                            ].flatMap(({ label, value, red }, i, arr) => {
                                const items = [
                                    <div key={label} className={s.stripItem}>
                                        <span className={s.stripLabel}>{label}</span>
                                        <span className={s.stripValue} style={red ? { color: '#DC2626', fontWeight: 800 } : {}}>{value}</span>
                                    </div>
                                ];

                                if (i < arr.length - 1) {
                                    items.push(<div key={`divider-${i}`} className={s.stripDiv} />);
                                }

                                return items;
                            })}
                        </div>

                        {/* ── Sender / Receiver ── */}
                        <div className={s.partyRow}>
                            <div className={s.partyCard}>
                                <div className={s.partyLabel}><User size={11} /> Sender</div>
                                <div className={s.partyName}>{report.sender_external_name || '—'}</div>
                                {report.sender_external_phone && (
                                    <div className={s.partyPhone}><Phone size={10} /> {report.sender_external_phone}</div>
                                )}
                            </div>
                            <div className={s.partyArrow}>→</div>
                            <div className={s.partyCard}>
                                <div className={s.partyLabel}><User size={11} /> Receiver</div>
                                <div className={s.partyName}>{report.receiver_external_name || '—'}</div>
                                {report.receiver_external_phone && (
                                    <div className={s.partyPhone}><Phone size={10} /> {report.receiver_external_phone}</div>
                                )}
                            </div>
                        </div>

                        {/* ── Route ── */}
                        <div className={s.section}>
                            <div className={s.secTitle}><MapPin size={11} /> Route</div>
                            <div className={s.infoGrid}>
                                <InfoCard icon={MapPin} label="From" value={report.source_hub_name} />
                                <InfoCard icon={MapPin} label="To" value={report.destination_hub_name} />
                                <InfoCard icon={Milestone} label="Expected Days" value={report.expected_delivery_days != null ? `${report.expected_delivery_days}d` : null} />
                                <InfoCard icon={Calendar} label="In Transit" value={fmt(report.in_transit_at)} />
                            </div>
                        </div>

                        {/* ── Transporter ── */}
                        <div className={s.section}>
                            <div className={s.secTitle}><Truck size={11} /> Transporter</div>
                            <div className={s.infoGrid}>
                                <InfoCard icon={User} label="Driver" value={report.transporter_name} />
                                <InfoCard icon={Truck} label="Vehicle" value={`${report.vehicle_model ?? '—'} · ${report.vehicle_type ?? '—'}`} />
                                <InfoCard icon={Hash} label="Plate" value={report.vehicle_no} />
                                <InfoCard icon={Calendar} label="Trip Date" value={fmt(report.trip_date)} />
                            </div>
                        </div>

                        {/* ── Resolution ── */}
                        <div className={s.resolveBox}>
                            <div className={s.resolveTitle}><CheckCircle size={14} /> Resolution</div>
                            {err && <div className={s.errMsg}>{err}</div>}

                            <div>
                                <div className={s.fieldLabel}>Status</div>
                                <div className={s.statusOptions}>
                                    {RESOLUTION_OPTIONS.map((opt) => {
                                        const c = STATUS_CFG[opt];
                                        const active = status === opt;
                                        return (
                                            <button
                                                key={opt}
                                                className={`${s.statusOption} ${active ? s.statusOptionActive : ''}`}
                                                style={active ? { borderColor: c.color, background: c.bg, color: c.color } : {}}
                                                onClick={() => { setStatus(opt); setErr(null); }}
                                            >
                                                <c.Icon size={12} /> {c.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <div className={s.fieldLabel}>Admin Notes</div>
                                <textarea
                                    className={s.textarea}
                                    placeholder="Add resolution notes…"
                                    value={notes}
                                    onChange={(e) => { setNotes(e.target.value); setErr(null); }}
                                    rows={3}
                                />
                            </div>

                            <button className={s.resolveBtn} onClick={handleUpdate} disabled={loading}>
                                {loading ? 'Saving…' : <><CheckCircle size={14} /> Update Status</>}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
            
            {/* Success Toast */}
            {showSuccess && (
                <SuccessToast 
                    message={successMessage} 
                    onClose={() => setShowSuccess(false)} 
                />
            )}
        </>,
        document.body
    );
}