'use client';

import { useState } from 'react';
import { loginUser } from '@/lib/api';
import styles from './LoginPage.module.css';
import './login-global.css'; // resets + font import (not a module)

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [formError, setFormError]   = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await loginUser({ email, password });
      window.location.href = '/dashboard';
    } catch (err) {
      setFormError(err?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.shell}>

      {/* ════ LEFT — brand panel ════ */}
      <div className={styles.left}>
        <div className={styles.leftGrid}  aria-hidden="true" />
        <div className={styles.leftGlow1} aria-hidden="true" />
        <div className={styles.leftGlow2} aria-hidden="true" />

        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>TS</div>
          <div>
            <div className={styles.brandName}>Trackship</div>
            <div className={styles.brandTag}>Admin Console</div>
          </div>
        </div>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroEyebrow}>
            <span className={styles.heroEyebrowDot} aria-hidden="true" />
            Live operations
          </div>

          <h1 className={styles.heroHeadline}>
            Logistics<br />
            <span className={styles.heroAccent}>in control.</span>
          </h1>

          <p className={styles.heroDesc}>
            Monitor shipments, manage routes, and coordinate your entire
            fleet from a single, unified dashboard.
          </p>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>
              12<span className={styles.statAccent}>k+</span>
            </div>
            <div className={styles.statLabel}>Active shipments</div>
          </div>
          <div className={`${styles.stat} ${styles.statBorder}`}>
            <div className={styles.statValue}>
              98<span className={styles.statAccent}>%</span>
            </div>
            <div className={styles.statLabel}>On-time delivery</div>
          </div>
          <div className={`${styles.stat} ${styles.statBorder}`}>
            <div className={styles.statValue}>
              340<span className={styles.statAccent}>+</span>
            </div>
            <div className={styles.statLabel}>Routes tracked</div>
          </div>
        </div>
      </div>

      {/* ════ RIGHT — form panel ════ */}
      <div className={styles.right}>
        <div className={styles.rightGlow} aria-hidden="true" />

        <div className={styles.formWrap}>
          {/* Header */}
          <div className={styles.formHeader}>
            <div className={styles.formWelcome}>Welcome back</div>
            <h2 className={styles.formTitle}>Sign in to continue</h2>
            <p className={styles.formSub}>
              Enter your admin credentials to access the operations dashboard.
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate>
            {/* Email */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lp-email">
                Email address
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIconLeft} aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M22 7l-10 7L2 7"/>
                  </svg>
                </span>
                <input
                  id="lp-email"
                  className={styles.input}
                  type="email"
                  placeholder="admin@trackship.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lp-password">
                Password
              </label>
              <div className={styles.inputWrap}>
                <input
                  id="lp-password"
                  className={`${styles.input} ${styles.inputNoLeftPad}`}
                  type="password"
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className={styles.inputIconRight} aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
              </div>
            </div>

            {/* Forgot */}
            <div className={styles.forgotRow}>
              <button type="button" className={styles.forgot}>
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={styles.submit}
              disabled={submitting}
            >
              <span className={styles.submitShimmer} aria-hidden="true" />
              {submitting ? (
                <>
                  <span className={styles.spinner} />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>

            {/* Error */}
            {formError && (
              <div className={styles.error} role="alert">
                <span className={styles.errorIcon} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </span>
                {formError}
              </div>
            )}
          </form>

          {/* Footer */}
          <div className={styles.footerNote}>
            Restricted access · <strong>Trackship</strong> admin only.<br />
            Having trouble? Contact your system administrator.
          </div>
        </div>
      </div>

    </div>
  );
}