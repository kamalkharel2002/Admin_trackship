"use client";

import { useState, useEffect } from "react";
import styles from "./settings.module.css";
import { getProfileDetails, updatePhone, updatePassword } from "@/lib/api/settings";

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function splitPhone(raw = "") {
  const match = raw.match(/^(\+\d{1,4})(\d+)$/);
  return match ? { countryCode: match[1], phone: match[2] } : { countryCode: "+975", phone: raw };
}

export default function SettingsPage() {
  const [profile,        setProfile]        = useState({ fullName: "", email: "", phone: "", countryCode: "+975" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg,     setProfileMsg]     = useState(null);
  const [pageLoading,    setPageLoading]    = useState(true);
  const [passwords,      setPasswords]      = useState({ newPassword: "", confirmPassword: "" });
  const [showPwd,        setShowPwd]        = useState({ new: false, confirm: false });
  const [pwdLoading,     setPwdLoading]     = useState(false);
  const [pwdMsg,         setPwdMsg]         = useState(null);

  useEffect(() => {
    getProfileDetails()
      .then(data => {
        const { countryCode, phone } = splitPhone(data.phone);
        setProfile({ fullName: data.fullName, email: data.email, phone, countryCode });
      })
      .catch(err => console.error("Failed to load profile:", err))
      .finally(() => setPageLoading(false));
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true); setProfileMsg(null);
    try {
      await updatePhone(`${profile.countryCode}${profile.phone}`);
      setProfileMsg({ type: "success", text: "Phone updated successfully." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message });
    } finally { setProfileLoading(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdLoading(true); setPwdMsg(null);
    try {
      await updatePassword(passwords.newPassword, passwords.confirmPassword);
      setPwdMsg({ type: "success", text: "Password changed successfully." });
      setPasswords({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwdMsg({ type: "error", text: err.message });
    } finally { setPwdLoading(false); }
  };

  if (pageLoading) return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <div className={styles.loadingState}>Loading profile…</div>
    </div>
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>

      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatarPlaceholder}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <button className={styles.editBadge} aria-label="Edit avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
        <p className={styles.profileName}>{profile.fullName || "—"}</p>
        <p className={styles.profilePhone}>{profile.countryCode}-{profile.phone}</p>
      </div>

      {/* Card */}
      <div className={styles.card}>

        {/* Profile Setting */}
        <form className={styles.section} onSubmit={handleProfileSubmit}>
          <h2 className={styles.sectionTitle}>Profile setting</h2>
          <p className={styles.sectionSubtitle}>Modify your details</p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="fullName">Full Name</label>
            <input id="fullName" className={styles.input} value={profile.fullName} disabled readOnly />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email Address</label>
            <input id="email" type="email" className={styles.input} value={profile.email} disabled readOnly />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">Phone Number</label>
            <div className={styles.phoneRow}>
              <input
                id="countryCode" name="countryCode"
                className={`${styles.input} ${styles.countryCode}`}
                value={profile.countryCode}
                onChange={e => { setProfile(p => ({ ...p, countryCode: e.target.value })); setProfileMsg(null); }}
              />
              <input
                id="phone" name="phone" type="tel"
                className={`${styles.input} ${styles.phoneInput}`}
                value={profile.phone} autoComplete="tel" required
                onChange={e => { setProfile(p => ({ ...p, phone: e.target.value })); setProfileMsg(null); }}
              />
            </div>
          </div>

          <div className={styles.spacer} />
          {profileMsg && <p className={profileMsg.type === "success" ? styles.successMsg : styles.errorMsg}>{profileMsg.text}</p>}
          <button type="submit" className={styles.btn} disabled={profileLoading}>
            {profileLoading ? "Updating…" : "Update"}
          </button>
        </form>

        <div className={styles.divider} />

        {/* Change Password */}
        <form className={styles.section} onSubmit={handlePasswordSubmit}>
          <h2 className={styles.sectionTitle}>Change password</h2>
          <p className={styles.sectionSubtitle}>Create a new password</p>

          {[
            { id: "newPassword",     label: "New Password",         key: "new"     },
            { id: "confirmPassword", label: "Confirm New Password", key: "confirm" },
          ].map(({ id, label, key }) => (
            <div className={styles.field} key={id}>
              <label className={styles.label} htmlFor={id}>{label}</label>
              <div className={styles.passwordWrapper}>
                <input
                  id={id} name={id}
                  type={showPwd[key] ? "text" : "password"}
                  className={styles.input}
                  value={passwords[id]}
                  autoComplete="new-password" required
                  onChange={e => { setPasswords(p => ({ ...p, [id]: e.target.value })); setPwdMsg(null); }}
                />
                <button type="button" className={styles.eyeIcon}
                  onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))}
                  aria-label={showPwd[key] ? "Hide" : "Show"}>
                  <EyeIcon open={showPwd[key]} />
                </button>
              </div>
            </div>
          ))}

          <div className={styles.spacer} />
          {pwdMsg && <p className={pwdMsg.type === "success" ? styles.successMsg : styles.errorMsg}>{pwdMsg.text}</p>}
          <button type="submit" className={styles.btn} disabled={pwdLoading}>
            {pwdLoading ? "Saving…" : "Save changes"}
          </button>
        </form>

      </div>
    </div>
  );
}