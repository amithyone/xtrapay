import React, { useEffect, useRef, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import {
  apiConfirmPinChange,
  apiForgotPassword,
  apiRequestPinChange,
} from '../../lib/xtrapayApi';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';
import { ChangePinModal } from '../auth/ChangePinModal';

type SheetKind =
  | null
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'password'
  | 'pin'
  | 'bvn'
  | 'nin';

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  return parts
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDob(isoOrDisplay: string): string {
  if (!isoOrDisplay) return '—';
  const d = new Date(isoOrDisplay);
  if (Number.isNaN(d.getTime())) return isoOrDisplay;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPasswordChanged(isoOrDisplay: string): string {
  if (!isoOrDisplay) return 'Manage password';
  const d = new Date(isoOrDisplay);
  if (Number.isNaN(d.getTime())) return isoOrDisplay;
  return `Last changed ${d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function timeoutLabel(min: number): string {
  if (min <= 0) return 'Never';
  if (min === 1) return '1 min';
  return `${min} min`;
}

function timeoutMinutes(label: string): number {
  if (label === 'Never') return 0;
  const n = parseInt(label, 10);
  return Number.isFinite(n) ? n : 5;
}

/**
 * Full profile & settings — live from GET/PATCH /me.
 */
export const ProfileScreen: React.FC = () => {
  const {
    accountContext,
    accountTier,
    kycStatus,
    userProfile,
    refreshProfile,
    updateProfile,
    deleteAccount,
    showToast,
    theme,
    toggleTheme,
    logout,
    setActiveScreen,
  } = useTransactions();
  const isLight = theme === 'light';

  const [sheet, setSheet] = useState<SheetKind>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordPinOpen, setPasswordPinOpen] = useState(false);
  const [pinChangeOpen, setPinChangeOpen] = useState(false);
  const [pinChangeCurrent, setPinChangeCurrent] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const refreshRef = useRef(refreshProfile);
  refreshRef.current = refreshProfile;

  useEffect(() => {
    void refreshRef.current();
  }, []);

  const fullName = userProfile?.fullName || '';
  const email = userProfile?.email || '';
  const phone = userProfile?.phone || '';
  const address = userProfile?.address || '';
  const dob = formatDob(userProfile?.dateOfBirth || '');
  const bvn = userProfile?.kyc.bvnMasked || 'Not linked';
  const nin = userProfile?.kyc.ninMasked || 'Not linked';
  const customerId = userProfile?.customerId || userProfile?.agent?.code || '';
  const linkedBanks =
    userProfile?.linkedBanks?.length
      ? userProfile.linkedBanks.join(' · ')
      : 'No linked banks yet';
  const agentLabel = userProfile?.agent
    ? `${userProfile.agent.active ? 'Active' : 'Inactive'}${
        userProfile.agent.code ? ` · ${userProfile.agent.code}` : ''
      }`
    : customerId
      ? `Customer · ${customerId}`
      : 'Not enrolled';

  const prefs = userProfile?.preferences;
  const biometrics = prefs?.biometrics ?? true;
  const faceId = prefs?.faceId ?? true;
  const transactionPinRequired = prefs?.requirePinAlways ?? true;
  const sessionTimeout = timeoutLabel(prefs?.sessionTimeoutMin ?? 5);
  const pushNotif = prefs?.push ?? true;
  const smsNotif = prefs?.sms ?? true;
  const emailNotif = prefs?.emailNotif ?? false;
  const txnAlerts = prefs?.txnAlerts ?? true;
  const promoNotif = prefs?.promo ?? false;
  const loginAlerts = prefs?.loginAlerts ?? true;

  const openEdit = (kind: SheetKind, value: string) => {
    setDraft(value === 'Not linked' || value === '—' ? '' : value);
    setSheet(kind);
  };

  const patchPrefs = async (partial: Partial<NonNullable<typeof prefs>>) => {
    const ok = await updateProfile({ preferences: partial });
    if (ok) showToast('Preferences saved', 'Your settings were updated.', 'success');
  };

  const saveEdit = async () => {
    if (!sheet) return;
    const v = draft.trim();
    if (!v) {
      showToast('Required', 'This field cannot be empty.', 'warning');
      return;
    }
    setSaving(true);
    try {
      let ok = false;
      if (sheet === 'name') ok = await updateProfile({ fullName: v });
      else if (sheet === 'email') ok = await updateProfile({ email: v });
      else if (sheet === 'phone') ok = await updateProfile({ phone: v });
      else if (sheet === 'address') ok = await updateProfile({ address: v });
      else if (sheet === 'bvn') ok = await updateProfile({ kyc: { bvn: v } });
      else if (sheet === 'nin') ok = await updateProfile({ kyc: { nin: v } });
      if (ok) {
        showToast('Profile Updated', 'Your changes have been saved.', 'success');
        setSheet(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const kycLabel =
    kycStatus === 'verified'
      ? 'Verified'
      : kycStatus === 'pending'
        ? 'Pending KYC'
        : 'Unverified';

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="profile-screen">
      {/* Hero identity */}
      <section className="glass-card glass-strong settings-list !rounded-[28px] px-5 py-5 text-center space-y-3">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-[22px] font-bold border border-[var(--accent)]/25">
          {initialsFromName(fullName)}
        </div>
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--text)] tracking-tight">
            {fullName || 'Your profile'}
          </h1>
          <p className="mt-1 text-[12px] text-[var(--muted)]">{phone || '—'}</p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
            <Icon name="verified" size={12} />
            {accountTier} · {accountContext === 'personal' ? 'Personal' : 'Business'} · {kycLabel}
          </div>
        </div>
        <p className="text-[11px] text-[var(--muted)]">
          CBN licensed · NDIC insured
          {customerId ? ` · Customer ID ${customerId}` : ''}
        </p>
      </section>

      {/* Personal details */}
      <Section title="Personal details">
        <Row
          icon="contact_page"
          label="Full name"
          value={fullName || '—'}
          onClick={() => openEdit('name', fullName)}
        />
        <Row
          icon="chat"
          label="Email"
          value={email || '—'}
          onClick={() => openEdit('email', email)}
        />
        <Row
          icon="smartphone"
          label="Phone number"
          value={phone || '—'}
          onClick={() => openEdit('phone', phone)}
        />
        <Row icon="schedule" label="Date of birth" value={dob} />
        <Row
          icon="location_on"
          label="Residential address"
          value={address || '—'}
          onClick={() => openEdit('address', address)}
        />
      </Section>

      {/* KYC */}
      <Section title="Identity & KYC">
        <Row
          icon="shield"
          label="BVN"
          value={bvn}
          hint="Bank Verification Number"
          onClick={() => openEdit('bvn', bvn)}
        />
        <Row
          icon="verified_user"
          label="NIN"
          value={nin}
          hint="National Identification Number"
          onClick={() => openEdit('nin', nin)}
        />
        <Row
          icon="insights"
          label="Account tier"
          value={`${accountTier} · ${
            kycStatus === 'verified' ? 'Higher limits unlocked' : 'Complete KYC to raise limits'
          }`}
        />
        <Row
          icon="account_balance"
          label="Linked banks"
          value={linkedBanks}
          onClick={() =>
            showToast('Linked Banks', 'Settlement rails come from your verified accounts.', 'info')
          }
        />
      </Section>

      {/* Security */}
      <Section title="Security">
        <Row
          icon="lock"
          label="Reset login password"
          value={formatPasswordChanged(userProfile?.passwordChangedAt || '')}
          onClick={() => setPasswordPinOpen(true)}
        />
        <Row
          icon="dialpad"
          label="Transaction PIN"
          value="••••"
          onClick={() => setPinChangeOpen(true)}
        />
        <ToggleRow
          icon="fingerprint"
          label="Biometric login"
          hint="Use fingerprint to unlock the app"
          checked={biometrics}
          onChange={v => void patchPrefs({ biometrics: v })}
          isLight={isLight}
        />
        <ToggleRow
          icon="visibility"
          label="Face ID / Face unlock"
          hint="Authorize transfers with face biometrics"
          checked={faceId}
          onChange={v => void patchPrefs({ faceId: v })}
          isLight={isLight}
        />
        <ToggleRow
          icon="lock"
          label="Always require PIN"
          hint="Ask for PIN on every money movement"
          checked={transactionPinRequired}
          onChange={v => void patchPrefs({ requirePinAlways: v })}
          isLight={isLight}
        />
        <div className="px-3.5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
              <Icon name="hourglass" size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[var(--text)]">Auto-lock timer</p>
              <p className="text-[11px] text-[var(--muted)]">Lock app after inactivity</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {['1 min', '5 min', '15 min', 'Never'].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => void patchPrefs({ sessionTimeoutMin: timeoutMinutes(opt) })}
                className={`settings-chip h-9 rounded-xl text-[12px] font-semibold border transition-colors ${
                  sessionTimeout === opt
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'border-[var(--glass-border)] text-[var(--muted)] bg-black/[0.03] dark:bg-white/[0.05]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <ToggleRow
          icon="notifications"
          label="Push notifications"
          checked={pushNotif}
          onChange={v => void patchPrefs({ push: v })}
          isLight={isLight}
        />
        <ToggleRow
          icon="smartphone"
          label="SMS alerts"
          hint="OTP and debit/credit SMS"
          checked={smsNotif}
          onChange={v => void patchPrefs({ sms: v })}
          isLight={isLight}
        />
        <ToggleRow
          icon="chat"
          label="Email alerts"
          checked={emailNotif}
          onChange={v => void patchPrefs({ emailNotif: v })}
          isLight={isLight}
        />
        <ToggleRow
          icon="receipt_long"
          label="Transaction alerts"
          hint="Instant notice on every debit or credit"
          checked={txnAlerts}
          onChange={v => void patchPrefs({ txnAlerts: v })}
          isLight={isLight}
        />
        <ToggleRow
          icon="shield"
          label="Login & device alerts"
          checked={loginAlerts}
          onChange={v => void patchPrefs({ loginAlerts: v })}
          isLight={isLight}
        />
        <ToggleRow
          icon="sparkles"
          label="Promotions & tips"
          checked={promoNotif}
          onChange={v => void patchPrefs({ promo: v })}
          isLight={isLight}
        />
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <Row
          icon={theme === 'dark' ? 'moon' : 'sun'}
          label="Appearance"
          value={theme === 'dark' ? 'Dark maroon' : 'Light'}
          onClick={toggleTheme}
        />
        <Row
          icon="home"
          label="Default language"
          value={prefs?.language === 'en-NG' || !prefs?.language ? 'English (NG)' : prefs.language}
          onClick={() => showToast('Language', 'English (NG) is your default language.', 'info')}
        />
        <Row
          icon="toll"
          label="Currency display"
          value={prefs?.currency === 'NGN' || !prefs?.currency ? 'NGN (₦)' : prefs.currency}
          onClick={() => showToast('Currency', 'All balances display in Nigerian Naira.', 'info')}
        />
        <Row
          icon="point_of_sale"
          label="Agent / POS profile"
          value={agentLabel}
          onClick={() =>
            showToast(
              'Agent Profile',
              userProfile?.agent?.aggregator
                ? `Mapped to ${userProfile.agent.aggregator}.`
                : 'Agent mapping comes from your account.',
              'info'
            )
          }
        />
      </Section>

      {/* Support & legal */}
      <Section title="Support & legal">
        <Row
          icon="support_agent"
          label="Contact support"
          value="24/7 concierge"
          onClick={() => setActiveScreen('support')}
        />
        <Row
          icon="help"
          label="FAQs & help centre"
          onClick={() => showToast('Help Centre', 'Opening Xtrapay help articles.', 'info')}
        />
        <Row icon="file_text" label="Terms of use" onClick={() => setActiveScreen('terms')} />
        <Row icon="shield" label="Privacy policy" onClick={() => setActiveScreen('privacy')} />
        <Row
          icon="account_balance"
          label="Licences"
          value="CBN · NDIC"
          onClick={() => showToast('Licences', 'Xtrapay is CBN licensed and NDIC insured.', 'info')}
        />
        <Row
          icon="sparkles"
          label="Powered by CheckoutNow"
          value="Technology partner"
          onClick={() => setActiveScreen('checkoutnow')}
        />
      </Section>

      <Section title="Danger zone">
        <Row
          icon="delete"
          label="Delete account"
          value="Permanent"
          onClick={() => {
            setDeleteConfirm('');
            setDeleteOpen(true);
          }}
        />
      </Section>

      <button
        type="button"
        onClick={() => {
          logout();
          showToast('Signed Out', 'You have been securely signed out on this device.', 'info');
        }}
        className="w-full h-12 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-[14px] font-semibold active:scale-[0.98] transition-transform"
      >
        Sign out
      </button>

      <p className="text-center text-[10px] text-[var(--muted)] pb-2">
        Xtrapay · v1.1.0
      </p>

      {/* Edit sheet */}
      {sheet && sheet !== 'password' && sheet !== 'pin' && (
        <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
              <h3 className="text-[14px] font-semibold text-[var(--text)] capitalize">
                Edit {sheet}
              </h3>
              <button
                type="button"
                onClick={() => setSheet(null)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            {sheet === 'address' ? (
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className={`${fieldClass} !h-24 py-3 resize-none`}
                placeholder="Full residential address"
              />
            ) : (
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className={fieldClass}
                placeholder={`Enter ${sheet}`}
                type={sheet === 'email' ? 'email' : 'text'}
              />
            )}
            <button
              type="button"
              onClick={() => void saveEdit()}
              disabled={saving}
              className="glass-cta w-full disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      <PinSheetModal
        isOpen={passwordPinOpen}
        onClose={() => setPasswordPinOpen(false)}
        title="Confirm Identity"
        subtitle="Enter your current PIN to reset login password"
        onSuccess={async () => {
          setPasswordPinOpen(false);
          try {
            const target = email || phone;
            if (!target) {
              showToast('Missing contact', 'Add an email or phone before resetting password.', 'warning');
              return;
            }
            await apiForgotPassword(target);
            showToast(
              'Password Reset Sent',
              `A secure reset code was sent to ${target}.`,
              'success'
            );
          } catch (err) {
            showToast(
              'Reset failed',
              err instanceof ApiError ? err.message : 'Could not start password reset.',
              'warning'
            );
          }
        }}
      />

      <ChangePinModal
        isOpen={pinChangeOpen}
        onClose={() => {
          setPinChangeOpen(false);
          setPinChangeCurrent('');
        }}
        onRequestOtp={async currentPin => {
          try {
            setPinChangeCurrent(currentPin);
            return await apiRequestPinChange(currentPin);
          } catch (err) {
            throw new Error(
              err instanceof ApiError ? err.message : 'Could not start PIN change.'
            );
          }
        }}
        onResendOtp={async () => {
          try {
            if (!pinChangeCurrent) {
              throw new Error('Enter your current PIN again.');
            }
            return await apiRequestPinChange(pinChangeCurrent);
          } catch (err) {
            throw new Error(err instanceof ApiError ? err.message : 'Could not resend OTP.');
          }
        }}
        onConfirm={async ({ currentPin, otp, newPin }) => {
          try {
            await apiConfirmPinChange({
              currentPin: currentPin || pinChangeCurrent,
              otp,
              newPin,
              confirmPin: newPin,
            });
            showToast('PIN Updated', 'Your new 4-digit transaction PIN is active.', 'success');
          } catch (err) {
            throw new Error(
              err instanceof ApiError ? err.message : 'Could not update transaction PIN.'
            );
          }
        }}
      />

      {deleteOpen && (
        <div
          className="app-modal-overlay z-[80] bg-black/70 backdrop-blur-md"
          role="presentation"
          onClick={() => setDeleteOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete account"
            className="app-modal-panel glass-card glass-strong settings-list !rounded-[24px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-rose-500">
                  Danger zone
                </p>
                <h2 className="mt-1 text-[16px] font-semibold text-[var(--text)]">Delete account</h2>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <p className="text-[12px] text-[var(--muted)] leading-relaxed">
                This permanently closes your Xtrapay wallet, cards, and POS mapping. Outstanding
                balances must be withdrawn first. Type{' '}
                <span className="font-semibold text-[var(--text)]">DELETE</span> to confirm.
              </p>
              <input
                className={fieldClass}
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE"
                autoComplete="off"
                autoFocus
              />
              <button
                type="button"
                disabled={deleteConfirm.trim().toUpperCase() !== 'DELETE' || deleting}
                onClick={() => {
                  void (async () => {
                    setDeleting(true);
                    try {
                      const ok = await deleteAccount({
                        confirm: 'DELETE',
                      });
                      if (ok) {
                        setDeleteOpen(false);
                        setDeleteConfirm('');
                      }
                    } finally {
                      setDeleting(false);
                    }
                  })();
                }}
                className={`w-full h-12 rounded-2xl text-[14px] font-semibold transition-all ${
                  deleteConfirm.trim().toUpperCase() === 'DELETE'
                    ? 'bg-rose-500 text-white active:scale-[0.98]'
                    : 'bg-rose-500/20 text-rose-500/50 cursor-not-allowed'
                }`}
              >
                {deleting ? 'Deleting…' : 'Permanently delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

const fieldClass =
  'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
      {title}
    </p>
    <div className="glass-card glass-strong settings-list !rounded-[24px] overflow-hidden divide-y divide-[var(--glass-border)]">
      {children}
    </div>
  </section>
);

const Row: React.FC<{
  icon: string;
  label: string;
  value?: string;
  hint?: string;
  onClick?: () => void;
}> = ({ icon, label, value, hint, onClick }) => {
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
        <Icon name={icon} size={16} />
      </span>
      <div className="min-w-0 flex-1 pr-1">
        <p className="text-[13px] font-semibold text-[var(--text)] leading-snug">{label}</p>
        {hint && <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-snug">{hint}</p>}
        {value && (
          <p className="text-[11px] text-[var(--muted)] mt-0.5 truncate leading-snug">{value}</p>
        )}
      </div>
      {onClick && (
        <Icon name="chevron_right" size={16} className="text-[var(--muted)] shrink-0 opacity-70" />
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="settings-row w-full flex items-center gap-3 px-3.5 py-3.5 text-left appearance-none border-0 bg-transparent cursor-pointer"
      >
        {body}
      </button>
    );
  }

  return <div className="flex items-center gap-3 px-3.5 py-3.5">{body}</div>;
};

const ToggleRow: React.FC<{
  icon: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  isLight: boolean;
}> = ({ icon, label, hint, checked, onChange, isLight }) => (
  <div className="flex items-center gap-3 px-3.5 py-3.5">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
      <Icon name={icon} size={16} />
    </span>
    <div className="min-w-0 flex-1 pr-2">
      <p className="text-[13px] font-semibold text-[var(--text)] leading-snug">{label}</p>
      {hint && <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-snug">{hint}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 border-0 appearance-none cursor-pointer transition-colors duration-200 ease-in-out ${
        checked
          ? 'bg-[var(--accent)] justify-end'
          : isLight
            ? 'bg-zinc-300 justify-start'
            : 'bg-white/20 justify-start'
      }`}
    >
      <span className="pointer-events-none block h-6 w-6 shrink-0 rounded-full bg-white shadow-sm" />
    </button>
  </div>
);
