import React from 'react';

export default function UsersPage() {
  return (
    <div className="page-body">
      <div>
        <div className="font-h font-700" style={{ fontSize: '1.2rem', marginBottom: 6 }}>
          Users
        </div>
        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
          Coming soon: manage admin users, roles, and access.
        </div>
      </div>

      <div className="card card-pad card-hover">
        <div className="text-sm text-muted">This section will be connected to the Users API later.</div>
      </div>
    </div>
  );
}

