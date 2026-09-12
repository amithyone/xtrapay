import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

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

/**
 * Full profile & settings — typical Nigerian fintech agent/customer account centre.
 */
export const ProfileScreen: React.FC = () => {
  const { accountContext, showToast, theme, toggleTheme } = useTransactions();
  const isLight = theme === 'light';

  const [fullName, setFullName] = useState('Innocent Solomon');
  const [email, setEmail] = useState('innocent.solomon@xtrapay.ng');
  const [phone, setPhone] = useState('+234 803 412 9981');
  const [address, setAddress] = useState('12 Admiralty Way, Lekki Phase 1, Lagos');
  const [bvn, setBvn] = useState('221*****8841');
  const [nin, setNin] = useState('123*******9012');
  const [tier] = useState('Tier 3');
  const [dob] = useState('14 Mar 1992');

  const [biometrics, setBiometrics] = useState(true);
  const [faceId, setFaceId] = useState(true);
  const [transactionPinRequired, setTransactionPinRequired] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('5 min');

  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [txnAlerts, setTxnAlerts] = useState(true);
  const [promoNotif, setPromoNotif] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  const [sheet, setSheet] = useState<SheetKind>(null);
  const [draft, setDraft] = useState('');
  const [passwordPinOpen, setPasswordPinOpen] = useState(false);
  const [pinChangeOpen, setPinChangeOpen] = useState(false);

  const openEdit = (kind: SheetKind, value: string) => {
    setDraft(value);
    setSheet(kind);
  };

  const saveEdit = () => {
    if (!sheet) return;
    const v = draft.trim();
    if (!v) {
      showToast('Required', 'This field cannot be empty.', 'warning');
      return;
    }
    if (sheet === 'name') setFullName(v);
    if (sheet === 'email') setEmail(v);
    if (sheet === 'phone') setPhone(v);
    if (sheet === 'address') setAddress(v);
    if (sheet === 'bvn') setBvn(v);
    if (sheet === 'nin') setNin(v);
    showToast('Profile Updated', 'Your changes have been saved.', 'success');
    setSheet(null);
  };

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="profile-screen">
      {/* Hero identity */}
      <section className="glass-card glass-strong settings-list !rounded-[28px] px-5 py-5 text-center space-y-3">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-[22px] font-bold border border-[var(--accent)]/25">
          JD
        </div>
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--text)] tracking-tight">{fullName}</h1>
          <p className="mt-1 text-[12px] text-[var(--muted)]">{phone}</p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
            <Icon name="verified" size={12} />
            {tier} · {accountContext === 'personal' ? 'Personal' : 'Business'} · Verified
          </div>
        </div>
        <p className="text-[11px] text-[var(--muted)]">
          CBN licensed · NDIC insured · Customer ID AG-1003925
        </p>
      </section>

      {/* Personal details */}
      <Section title="Personal details">
        <Row
          icon="contact_page"
          label="Full name"
          value={fullName}
          onClick={() => openEdit('name', fullName)}
        />
        <Row
          icon="chat"
          label="Email"
          value={email}
          onClick={() => openEdit('email', email)}
        />
        <Row
          icon="smartphone"
          label="Phone number"
          value={phone}
          onClick={() => openEdit('phone', phone)}
        />
        <Row icon="schedule" label="Date of birth" value={dob} />
        <Row
          icon="location_on"
          label="Residential address"
          value={address}
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
        <Row icon="insights" label="Account tier" value={`${tier} · Higher limits unlocked`} />
        <Row
          icon="account_balance"
          label="Linked banks"
          value="Zenith · Providus · Rubies MFB"
          onClick={() => showToast('Linked Banks', 'Manage settlement rails from account settings.', 'info')}
        />
      </Section>

      {/* Security */}
      <Section title="Security">
        <Row
          icon="lock"
          label="Reset login password"
          value="Last changed 22 Aug 2026"
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
          onChange={setBiometrics}
          isLight={isLight}
        />
        <ToggleRow
          icon="visibility"
          label="Face ID / Face unlock"
          hint="Authorize transfers with face biometrics"
          checked={faceId}
          onChange={setFaceId}
          isLight={isLight}
        />
        <ToggleRow
          icon="lock"
          label="Always require PIN"
          hint="Ask for PIN on every money movement"
          checked={transactionPinRequired}
          onChange={setTransactionPinRequired}
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
                onClick={() => {
                  setSessionTimeout(opt);
                  showToast('Auto-lock Updated', `Session locks after ${opt}.`, 'info');
                }}
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
          onChange={setPushNotif}
          isLight={isLight}
        />
        <ToggleRow
          icon="smartphone"
          label="SMS alerts"
          hint="OTP and debit/credit SMS"
          checked={smsNotif}
          onChange={setSmsNotif}
          isLight={isLight}
        />
        <ToggleRow
          icon="chat"
          label="Email alerts"
          checked={emailNotif}
          onChange={setEmailNotif}
          isLight={isLight}
        />
        <ToggleRow
          icon="receipt_long"
          label="Transaction alerts"
          hint="Instant notice on every debit or credit"
          checked={txnAlerts}
          onChange={setTxnAlerts}
          isLight={isLight}
        />
        <ToggleRow
          icon="shield"
          label="Login & device alerts"
          checked={loginAlerts}
          onChange={setLoginAlerts}
          isLight={isLight}
        />
        <ToggleRow
          icon="sparkles"
          label="Promotions & tips"
          checked={promoNotif}
          onChange={setPromoNotif}
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
          value="English (NG)"
          onClick={() => showToast('Language', 'English (NG) is your default language.', 'info')}
        />
        <Row
          icon="toll"
          label="Currency display"
          value="NGN (₦)"
          onClick={() => showToast('Currency', 'All balances display in Nigerian Naira.', 'info')}
        />
        <Row
          icon="point_of_sale"
          label="Agent / POS profile"
          value="Active · AG-1003925"
          onClick={() => showToast('Agent Profile', 'Mapped to Lagos Island aggregator.', 'info')}
        />
      </Section>

      {/* Support & legal */}
      <Section title="Support & legal">
        <Row
          icon="support_agent"
          label="Contact support"
          value="24/7 concierge"
          onClick={() => showToast('Support', 'Connecting to Xtrapay Tier-1 concierge…', 'info')}
        />
        <Row
          icon="help"
          label="FAQs & help centre"
          onClick={() => showToast('Help Centre', 'Opening Xtrapay help articles.', 'info')}
        />
        <Row
          icon="file_text"
          label="Terms of use"
          onClick={() => showToast('Terms', 'Xtrapay terms of use.', 'info')}
        />
        <Row
          icon="shield"
          label="Privacy policy"
          onClick={() => showToast('Privacy', 'How we protect your data.', 'info')}
        />
        <Row
          icon="account_balance"
          label="Licences"
          value="CBN · NDIC"
          onClick={() => showToast('Licences', 'Xtrapay is CBN licensed and NDIC insured.', 'info')}
        />
      </Section>

      <button
        type="button"
        onClick={() =>
          showToast('Signed Out', 'You have been securely signed out on this device.', 'info')
        }
        className="w-full h-12 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-[14px] font-semibold active:scale-[0.98] transition-transform"
      >
        Sign out
      </button>

      <p className="text-center text-[10px] text-[var(--muted)] pb-2">
        Xtrapay · v1.1.0 · Build 2026.09.12
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
            <button type="button" onClick={saveEdit} className="glass-cta w-full">
              Save changes
            </button>
          </div>
        </div>
      )}

      <PinSheetModal
        isOpen={passwordPinOpen}
        onClose={() => setPasswordPinOpen(false)}
        title="Confirm Identity"
        subtitle="Enter your current PIN to reset login password"
        onSuccess={() => {
          setPasswordPinOpen(false);
          showToast(
            'Password Reset Link Sent',
            `A secure reset link was sent to ${email}.`,
            'success'
          );
        }}
      />

      <PinSheetModal
        isOpen={pinChangeOpen}
        onClose={() => setPinChangeOpen(false)}
        title="Change Transaction PIN"
        subtitle="Enter your current PIN to continue"
        onSuccess={() => {
          setPinChangeOpen(false);
          showToast('PIN Updated', 'Your new 4-digit transaction PIN is active.', 'success');
        }}
      />
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
        className="settings-row w-full flex items-center gap-3 px-3.5 py-3.5 text-left bg-transparent border-0 appearance-none cursor-pointer active:bg-black/[0.03] dark:active:bg-white/[0.04]"
      >
        {body}
      </button>
    );
  }

  return <div className="w-full flex items-center gap-3 px-3.5 py-3.5">{body}</div>;
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
