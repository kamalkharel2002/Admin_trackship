'use client';
// app/(screens)/hubs/page.jsx
// Hub Management screen
//   • Stats (total hubs, coordinators, shipments)
//   • Full-width overview Leaflet map
//   • Hub card grid with edit/delete
//   • Add/Edit modal with interactive map picker
//   • Success dialog + Delete confirm dialog
// Leaflet loaded via dynamic import (SSR-safe)

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Warehouse, AlertCircle } from 'lucide-react';

import HubStats from '@/components/hub/HubStats';
import HubCard from '@/components/hub/HubCard';
import { SuccessDialog, DeleteConfirm } from '@/components/hub/HubDialogs';

import {
  getHubs,
  createHub,
  updateHub,
  deleteHub,
  getCoordinators,
  getHubCoordinatorsForEdits,
} from '@/lib/api';

import s from './hubs.module.css';

// Dynamic import — Leaflet requires browser APIs, can't run on server
const HubMap = dynamic(() => import('@/components/hub/HubMap'), { ssr: false, loading: () => null });
const HubModal = dynamic(() => import('@/components/hub/HubModal'), { ssr: false });

export default function HubsPage() {
  const [hubs, setHubs] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [editCoordinators, setEditCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [modal, setModal] = useState(null);  // null | 'add' | 'edit'
  const [editing, setEditing] = useState(null);  // hub being edited

  // Dialog states
  const [success, setSuccess] = useState(null);  // success message string
  const [deleting, setDeleting] = useState(null);  // hub to delete
  const [delLoad, setDelLoad] = useState(false);

  // ── Fetch hubs + coordinators on mount ──────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [hubList, coordList] = await Promise.all([
        getHubs(),
        getCoordinators().catch(() => []),  // gracefully skip if endpoint unavailable
      ]);
      setHubs(hubList);
      setCoordinators(coordList);
    } catch (err) {
      setError(err.message ?? 'Failed to load hubs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // function to refresh coordinators list after adding/editing a hub, since coordinators can be assigned to hubs
  const refreshCoordinators = useCallback(async () => {
    try {
      const coordList = await getCoordinators();
      setCoordinators(coordList);
    } catch (err) {
      console.error('Failed to refresh coordinators', err);
    }
  }, []);

  // ── Add / Edit submit ────────────────────────────────────────────────────
  const handleSubmit = async (formData, hubId) => {
    if (hubId) {
      const updated = await updateHub(hubId, formData);
      setHubs(prev => prev.map(h => h.id === hubId ? updated : h));
      setSuccess(`"${updated.name}" has been updated successfully.`);
    } else {
      const created = await createHub(formData);
      setHubs(prev => [...prev, created]);
      setSuccess(`"${created.name}" has been added to the network.`);
    }
    setModal(null);
    setEditing(null);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleting) return;
    setDelLoad(true);
    try {
      await deleteHub(deleting.id);
      setHubs(prev => prev.filter(h => h.id !== deleting.id));
      setSuccess(`"${deleting.name}" has been removed.`);
      setDeleting(null);
    } catch (err) {
      setError(err.message ?? 'Delete failed');
      setDeleting(null);
    } finally {
      setDelLoad(false);
    }
  };

  const openEdit = async (hub) => {
    setEditing(hub);
    try {
      // Fetch coordinators with assignment status for this hub
      const hubCoords = await getHubCoordinatorsForEdits(hub.id);
      setEditCoordinators(hubCoords);
    } catch (err) {
      console.error('Failed to fetch hub coordinators', err);
      // Fallback to all coordinators if endpoint fails
      setEditCoordinators(coordinators.map(c => ({ ...c, is_assigned: false })));
    }
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setEditing(null); };

  return (
    <div className={s.page}>

      {/* ── Page header ── */}
      <div className={s.pageHeader}>
        <div className={s.titleBlock}>
          <h1 className={s.pageTitle}>Hub Management</h1>
          <div className={s.pageSub}>Manage logistics hubs, locations and coordinators</div>
        </div>
        <button className={s.addBtn} onClick={() => setModal('add')}>
          <Plus size={16} /> Add Hub
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className={s.error}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* ── Stats row ── */}
      <HubStats hubs={hubs} loading={loading} />

      {/* ── Overview map ── */}
      <HubMap hubs={hubs} loading={loading} />

      {/* ── Hub card grid ── */}
      <div className={s.gridSection}>
        <div className={s.gridHeader}>
          <div className={s.gridTitle}>All Hubs</div>
          {!loading && <span className={s.hubCount}>{hubs.length} total</span>}
        </div>

        <div className={s.grid}>
          {loading ? (
            // Skeleton placeholders
            [1, 2, 3].map(i => <div key={i} className={s.skeletonCard} />)
          ) : hubs.length === 0 ? (
            <div className={s.empty}>
              <div className={s.emptyIcon}><Warehouse size={28} color="var(--text-muted)" /></div>
              <div className={s.emptyText}>No hubs added yet</div>
              <div className={s.emptySub}>Click "Add Hub" to create your first logistics hub</div>
            </div>
          ) : (
            hubs.map(hub => (
              <HubCard
                key={hub.id}
                hub={hub}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal (Leaflet — client-only) ── */}
      {modal && (
        <HubModal
          hub={modal === 'edit' ? editing : null}
          coordinators={modal === 'edit' ? editCoordinators : coordinators}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onRefreshCoordinators={refreshCoordinators}
        />
      )}

      {/* ── Success dialog ── */}
      {success && (
        <SuccessDialog
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      {/* ── Delete confirm dialog ── */}
      {deleting && (
        <DeleteConfirm
          hub={deleting}
          loading={delLoad}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}

    </div>
  );
}