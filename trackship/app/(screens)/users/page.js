'use client';

import { useEffect, useState } from 'react';
import UsersHeader from '@/components/user/UsersHeader';
import UsersTable from '@/components/user/UsersTable';
import { getUsers } from '@/lib/api';

export default function UsersPage() {
  const [selected, setSelected] = useState([]);
  const [counts, setCounts] = useState([]);
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  async function fetchCounts() {
    try {
      setLoadingCounts(true);
      const data = await getUsers({ offset: 0, limit: 10 });
      setCounts(data.counts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCounts(false);
    }
  }

  return (
    <div className="page-body">
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
          alignItems: 'center',
        }}
      >
        {/* Left Title */}
        <div>
          <h2 style={{ fontWeight: 600 }}>Team List</h2>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            Admin Dashboard &gt; Team List
          </span>
        </div>

        {/* Right Controls */}
        <UsersHeader selected={selected} />
      </div>

      {/* Role Counts */}
      <div
        className="card"
        style={{
          display: 'flex',
          gap: 20,
          padding: 16,
          marginBottom: 16,
        }}
      >
        {loadingCounts ? (
          <span style={{ fontSize: 13 }}>Loading counts...</span>
        ) : counts.length > 0 ? (
          counts.map((c, i) => (
            <div key={i}>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {c.role}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {c.user_count}
              </div>
            </div>
          ))
        ) : (
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            No user data
          </span>
        )}
      </div>

      {/* Users Table */}
      <UsersTable selected={selected} setSelected={setSelected} />
    </div>
  );
}