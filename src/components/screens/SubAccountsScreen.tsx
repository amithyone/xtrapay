import React, { useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import { apiCreateSubAccount } from '../../lib/xtrapayApi';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

type ViewMode = 'list' | 'create';
type SubKind = 'sub_personal' | 'sub_business';

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Sub-Accounts — Tier 3 personal wallets & mini business accounts
 * created from the verified parent profile (no new KYC registration).
 */
export const SubAccountsScreen: React.FC = () => {
  const {
    accountContext,
    showToast,
    wallets,
    addWallet,
    selectWallet,
    userProfile,
    accountTier,
    accountFullName,
    refreshBalances,
  } = useTransactions();
  const isBusinessParent = accountContext === 'business';

  const [view, setView] = useState<ViewMode>('list');
  const [pinOpen, setPinOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const subAccounts = wallets.filter(
    w => w.kind === 'sub_personal' || w.kind === 'sub_business'
  );

  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [kind, setKind] = useState<SubKind>(
    isBusinessParent ? 'sub_business' : 'sub_personal'
  );

  const parentProfile = useMemo(() => {
    const fullName =
      userProfile?.fullName || accountFullName || 'Verified account holder';
    const phone = userProfile?.phone || '—';
    const tier = userProfile?.tier || accountTier || 'Tier 3';
    return {
      fullName,
      phone,
      email: userProfile?.email || '—',
      tier,
      bvn: userProfile?.kyc?.bvnMasked || '—',
      nin: userProfile?.kyc?.ninMasked || '—',
      customerId:
        userProfile?.customerId ||
        (isBusinessParent ? '—' : '—'),
      parentLabel: isBusinessParent ? 'Business profile' : 'Personal wallet',
      kycStatus: userProfile?.kyc?.status || 'verified',
    };
  }, [userProfile, accountFullName, accountTier, isBusinessParent]);

  const fieldClass =
    'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

  const openCreate = () => {
    setName('');
    setPurpose('');
    setKind(isBusinessParent ? 'sub_business' : 'sub_personal');
    setView('create');
  };

  const handleContinue = () => {
    if (!name.trim()) {
      showToast('Name Required', 'Give this sub-account a short name.', 'warning');
      return;
    }
    if (!purpose.trim()) {
      showToast('Purpose Required', 'Tell us what this sub-account is for.', 'warning');
      return;
    }
    setPinOpen(true);
  };

  const handlePinSuccess = async (pin: string) => {
    setBusy(true);
    try {
      const next = await apiCreateSubAccount({
        kind,
        name: name.trim(),
        purpose: purpose.trim(),
        pin,
        parentContext: isBusinessParent ? 'business' : 'personal',
      });
      addWallet(next);
      selectWallet(next.id);
      void refreshBalances();
      setPinOpen(false);
      setView('list');
      showToast(
        'Sub-Account Created',
        `${next.name} · ${next.accountNumber} opened under your verified ${parentProfile.parentLabel.toLowerCase()}.`,
        'success'
      );
    } catch (err) {
      showToast(
        'Create failed',
        err instanceof ApiError ? err.message : 'Could not create sub-account.',
        'warning'
      );
    } finally {
      setBusy(false);
    }
  };

  if (view === 'list') {
    return (
      <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="sub-accounts-screen">
        <section className="glass-card glass-strong settings-list !rounded-[24px] px-4 py-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
              <Icon name="verified" size={12} />
              {parentProfile.tier} verified
            </span>
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-wide">
              {parentProfile.parentLabel}
            </span>
          </div>
          <p className="text-[13px] text-[var(--muted)] leading-snug">
            Open sub-accounts from your existing KYC — no new registration. BVN/NIN stay on the
            parent profile.
          </p>
        </section>

        <button
          type="button"
          onClick={openCreate}
          className="glass-cta w-full !rounded-2xl flex items-center justify-center gap-2"
        >
          <Icon name="add" size={16} />
          Create sub-account
        </button>

        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Your sub-accounts · {subAccounts.length}
        </p>

        {subAccounts.length === 0 ? (
          <section className="glass-card glass-strong settings-list !rounded-[24px] px-5 py-10 text-center space-y-3">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
              <Icon name="call_split" size={22} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[var(--text)]">No sub-accounts yet</p>
              <p className="mt-1 text-[12px] text-[var(--muted)] leading-snug">
                Split rent, savings goals, or mini business cash from your main wallet.
              </p>
            </div>
          </section>
        ) : (
          <div className="space-y-2.5">
            {subAccounts.map(acc => (
              <button
                key={acc.id}
                type="button"
                onClick={() => {
                  selectWallet(acc.id);
                  showToast('Account switched', `Now viewing ${acc.name}.`, 'info');
                }}
                className="settings-row glass-card glass-strong w-full !rounded-[22px] px-4 py-3.5 text-left appearance-none border-0 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold text-[var(--text)] truncate">
                        {acc.name}
                      </p>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                          acc.kind === 'sub_business'
                            ? 'border-sky-500/30 bg-sky-500/10 text-sky-500'
                            : 'border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]'
                        }`}
                      >
                        {acc.kind === 'sub_business' ? 'Mini business' : 'Personal'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--muted)] truncate">{acc.subtitle}</p>
                    <p className="mt-1 text-[11px] font-mono text-[var(--muted)]">
                      {acc.accountNumber}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-semibold font-mono text-[var(--text)]">
                      {money(acc.balance)}
                    </p>
                    <p className="mt-1 text-[10px] text-emerald-500 font-semibold">Active</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id="sub-accounts-create">
      <button
        type="button"
        onClick={() => setView('list')}
        className="settings-row inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] bg-transparent border-0 p-0 appearance-none cursor-pointer"
      >
        <Icon name="arrow_back" size={16} />
        Sub-accounts
      </button>

      <section className="glass-card glass-strong settings-list !rounded-[24px] px-4 py-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            Verified parent profile
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
            <Icon name="verified" size={12} />
            {parentProfile.tier}
          </span>
        </div>
        <div className="space-y-2 text-[12px]">
          <div className="flex justify-between gap-3">
            <span className="text-[var(--muted)]">Name</span>
            <span className="font-semibold text-[var(--text)] text-right">{parentProfile.fullName}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[var(--muted)]">Phone</span>
            <span className="font-mono text-[var(--text)]">{parentProfile.phone}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[var(--muted)]">BVN</span>
            <span className="font-mono text-[var(--text)]">{parentProfile.bvn}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[var(--muted)]">NIN</span>
            <span className="font-mono text-[var(--text)]">{parentProfile.nin}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[var(--muted)]">Customer ID</span>
            <span className="font-mono text-[var(--text)]">{parentProfile.customerId}</span>
          </div>
        </div>
        <p className="text-[11px] text-[var(--muted)] leading-snug border-t border-[var(--glass-border)] pt-3">
          KYC is inherited. You will not re-register — only name this wallet and set a purpose.
        </p>
      </section>

      <section className="space-y-2">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Sub-account type
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setKind('sub_personal')}
            className={`settings-row rounded-2xl px-3 py-3.5 text-left border appearance-none cursor-pointer ${
              kind === 'sub_personal'
                ? 'border-[var(--accent)]/55 ring-1 ring-[var(--accent)]/30 bg-[var(--accent)]/8'
                : 'border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.04]'
            }`}
          >
            <p className="text-[13px] font-semibold text-[var(--text)]">Personal</p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-snug">
              Tier 3 individual wallet under your main account
            </p>
          </button>
          <button
            type="button"
            onClick={() => setKind('sub_business')}
            className={`settings-row rounded-2xl px-3 py-3.5 text-left border appearance-none cursor-pointer ${
              kind === 'sub_business'
                ? 'border-[var(--accent)]/55 ring-1 ring-[var(--accent)]/30 bg-[var(--accent)]/8'
                : 'border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.04]'
            }`}
          >
            <p className="text-[13px] font-semibold text-[var(--text)]">Mini business</p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-snug">
              Branch / stall account under your business profile
            </p>
          </button>
        </div>
      </section>

      <section className="glass-card glass-strong settings-list !rounded-[24px] px-4 py-4 space-y-3.5">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            Sub-account name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className={fieldClass}
            placeholder={kind === 'sub_business' ? 'e.g. Ajah branch' : 'e.g. Rent wallet'}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            Purpose
          </label>
          <textarea
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
            className={`${fieldClass} !h-24 py-3 resize-none`}
            placeholder="What will this wallet be used for?"
          />
        </div>
      </section>

      <button type="button" onClick={handleContinue} className="glass-cta w-full !rounded-2xl">
        Continue to PIN
      </button>

      <PinSheetModal
        isOpen={pinOpen}
        onClose={() => !busy && setPinOpen(false)}
        title="Authorize Sub-Account"
        subtitle={`Create ${kind === 'sub_business' ? 'mini business' : 'personal'} wallet under ${parentProfile.fullName}`}
        onSuccess={pin => void handlePinSuccess(pin)}
      />
    </main>
  );
};
