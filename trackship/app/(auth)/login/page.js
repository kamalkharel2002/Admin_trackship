
'use client';

import { useState } from 'react';
import { loginUser } from '@/lib/api';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await loginUser({ email, password });
      // Full navigation guarantees middleware is evaluated with the newest cookie.
      window.location.href = '/dashboard';
    } catch (err) {
      setFormError(err?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${styles.shell} fadeIn`}>
      <div className={styles.card}>
        <div className={styles.cardInner}>
          <div className={styles.brandRow}>
            <div className={styles.brandIcon}>TS</div>
            <div>
              <div className={styles.title}>Trackship Admin</div>
              <div className={styles.subtitle}>Logistics operations dashboard</div>
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Email</div>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="admin@trackship.com"
                required
              />
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>Password</div>
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <div className={styles.btnRow}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={submitting}
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </div>

            {formError && <div className={styles.error}>{formError}</div>}

            <div className={styles.help}>Use your admin credentials to continue.</div>
          </form>
        </div>
      </div>
    </div>
  );
}

