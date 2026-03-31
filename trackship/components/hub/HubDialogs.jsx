'use client';
// components/hub/HubDialogs.jsx
// Two small dialogs:
//   <SuccessDialog>  — post-create/edit success celebration
//   <DeleteConfirm>  — confirm before deleting a hub

import { CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';
import s from './HubDialogs.module.css';

/* ── Backdrop shared by both ── */
function Backdrop({ children, onClose }) {
  return (
    <div className={s.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      {children}
    </div>
  );
}

/* ── Success Dialog ──────────────────────────────────────────── */
export function SuccessDialog({ message = 'Hub saved successfully!', onClose }) {
  return (
    <Backdrop onClose={onClose}>
      <div className={s.dialog}>
        <button className={s.closeBtn} onClick={onClose}><X size={15} /></button>

        {/* Animated check circle */}
        <div className={s.successIcon}>
          <div className={s.successRing} />
          <CheckCircle2 size={40} color="#22C55E" strokeWidth={1.8} />
        </div>

        <div className={s.successTitle}>All Done!</div>
        <div className={s.successMsg}>{message}</div>

        <button className={s.btnSuccess} onClick={onClose}>
          Continue
        </button>
      </div>
    </Backdrop>
  );
}

/* ── Delete Confirm Dialog ───────────────────────────────────── */
export function DeleteConfirm({ hub, loading, onConfirm, onClose }) {
  return (
    <Backdrop onClose={onClose}>
      <div className={s.dialog}>
        <button className={s.closeBtn} onClick={onClose}><X size={15} /></button>

        <div className={s.dangerIcon}>
          <AlertTriangle size={36} color="#F97316" strokeWidth={1.8} />
        </div>

        <div className={s.successTitle}>Delete Hub?</div>
        <div className={s.successMsg}>
          Are you sure you want to delete <strong>{hub?.name}</strong>?
          This action cannot be undone.
        </div>

        <div className={s.dialogFooter}>
          <button className={s.btnCancel} onClick={onClose}>Cancel</button>
          <button className={s.btnDanger} onClick={onConfirm} disabled={loading}>
            {loading
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</>
              : 'Yes, Delete'
            }
          </button>
        </div>
      </div>
    </Backdrop>
  );
}