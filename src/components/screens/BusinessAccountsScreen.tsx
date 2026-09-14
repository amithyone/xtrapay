import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import {
  apiBusinessAccounts,
  apiCreateBusinessAccount,
} from '../../lib/xtrapayApi';
import type { WalletAccount } from '../../data/wallets';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

type ViewMode = 'list' | 'create';

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function tierRank(tier: string): number {
  const m = tier.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

function formatAccountNumber(acc: WalletAccount): string {
  const n = (acc.accountNumber || '').trim();
  if (!n || n === '—' || /^pending/i.test(n)) {
    return 'Pay-in number provisioning…';
  }
  return `${acc.bankName} · ${n}`;
}

/** Mandatory CAC — BN (business name) or RC (registered company). */
function normalizeCac(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

function isValidCac(raw: string): boolean {
  const v = normalizeCac(raw);
  return /^(BN|RC)[-/]?\d{5,12}$/i.test(v);
}

/**
 * Business accounts — Tier-2 instant open (personal KYC reused) + manage.
 */
export const BusinessAccountsScreen: React.FC = () => {
  const {
    showToast,
    wallets,
    addWallet,
    selectWallet,
    setAccountContext,
    setActiveScreen,
    userProfile,
    accountFullName,
    accountTier,
    refreshBalances,
  } = useTransactions();

  const [view, setView] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [pinOpen, setPinOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [cac, setCac] = useState('');
  const [address, setAddress] = useState('');

  const fieldClass =
    'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

  const owner = useMemo(
    () => ({
      fullName: userProfile?.fullName || accountFullName || 'Account holder',
      phone: userProfile?.phone || '—',
      email: userProfile?.email || '—',
      tier: userProfile?.tier || accountTier || 'Tier 1',
      bvn: userProfile?.kyc?.bvnMasked || '—',
      nin: userProfile?.kyc?.ninMasked || '—',
    }),
    [userProfile, accountFullName, accountTier]
  );

  const hasTier2 = tierRank(owner.tier) >= 2;

  const load = useCallback(async () => {
    try {
      const list = await apiBusinessAccounts();
      if (list.length) {
        setAccounts(list);
      } else {
        setAccounts(
          wallets.filter(w => w.kind === 'business' || w.kind === 'sub_business')
        );
      }
    } catch {
      setAccounts(
        wallets.filter(w => w.kind === 'business' || w.kind === 'sub_business')
      );
    } finally {
      setLoading(false);
    }
  }, [wallets]);

  useEffect(() => {
    void load();
  }, [load]);

  const mainBusiness = accounts.find(a => a.kind === 'business') ?? null;
  const miniBusiness = accounts.filter(a => a.kind === 'sub_business');

  const openCreate = () => {
    if (!hasTier2) {
      showToast(
        'Tier 2 KYC required',
        'Complete personal Tier 2 verification first. We reuse your name, BVN/NIN, email and phone — no re-login.',
        'warning'
      );
      return;
    }
    setBusinessName('');
    setCac('');
    setAddress('');
    setView('create');
  };

  const handleContinue = () => {
    if (!businessName.trim()) {
      showToast('Business name required', 'Enter the registered or trading business name.', 'warning');
      return;
    }
    if (!cac.trim()) {
      showToast('RC / BN required', 'CAC registration number is mandatory to open a business account.', 'warning');
      return;
    }
    if (!isValidCac(cac)) {
      showToast('Invalid CAC', 'Enter a valid BN or RC number (e.g. BN1234567 or RC123456).', 'warning');
      return;
    }
    if (!address.trim()) {
      showToast('Address required', 'Enter the business operating address.', 'warning');
      return;
    }
    setPinOpen(true);
  };

  const handlePinSuccess = async (pin: string) => {
    setBusy(true);
    try {
      const next = await apiCreateBusinessAccount({
        businessName: businessName.trim(),
        cac: normalizeCac(cac),
        address: address.trim(),
        pin,
      });
      addWallet(next);
      setAccounts(prev => [next, ...prev.filter(a => a.id !== next.id)]);
      selectWallet(next.id);
      setAccountContext('business');
      void refreshBalances();
      setPinOpen(false);
      setView('list');
      const vaReady = Boolean(next.accountNumber?.trim()) && !/^pending/i.test(next.accountNumber);
      showToast(
        'Business account opened',
        vaReady
          ? `${next.name} · ${next.accountNumber} is ready. Docs & address verification come later.`
          : `${next.name} created. Fresh pay-in number is being provisioned.`,
        'success'
      );
    } catch (err) {
      showToast(
        'Could not open business',
        err instanceof ApiError ? err.message : 'Business account API unavailable.',
        'warning'
      );
      throw err instanceof Error ? err : new Error('Create failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading && view === 'list') {
    return (
      <main className="flex-1 min-w-0 px-5 pt-5 pb-32" id="business-accounts-screen">
        <p className="text-[13px] text-[var(--muted)] text-center py-16">Loading business accounts…</p>
      </main>
    );
  }

  if (view === 'create') {
    return (
      <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id="business-accounts-create">
        <button
          type="button"
          onClick={() => setView('list')}
          className="settings-row inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] bg-transparent border-0 p-0 appearance-none cursor-pointer"
        >
          <Icon name="arrow_back" size={16} />
          Business accounts
        </button>

        <section className="glass-card glass-strong settings-list !rounded-[24px] px-4 py-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              From your personal KYC
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
              <Icon name="verified" size={12} />
              {owner.tier}
            </span>
          </div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between gap-3">
              <span className="text-[var(--muted)]">Name</span>
              <span className="font-semibold text-[var(--text)] text-right">{owner.fullName}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[var(--muted)]">Phone</span>
              <span className="font-mono text-[var(--text)]">{owner.phone}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[var(--muted)]">Email</span>
              <span className="text-[var(--text)] text-right truncate max-w-[60%]">{owner.email}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[var(--muted)]">BVN</span>
              <span className="font-mono text-[var(--text)]">{owner.bvn}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[var(--muted)]">NIN</span>
              <span className="font-mono text-[var(--text)]">{owner.nin}</span>
            </div>
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-snug border-t border-[var(--glass-border)] pt-3">
            Instant open — we reuse Tier 2 personal details. A fresh business pay-in number is
            provisioned. Utility bills, CAC certificates and address verification come later.
          </p>
        </section>

        <section className="glass-card glass-strong settings-list !rounded-[24px] px-4 py-4 space-y-3.5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Business name
            </label>
            <input
              className={fieldClass}
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. Ajah Fresh Market Ltd"
              autoComplete="organization"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              CAC · BN or RC <span className="text-rose-500 normal-case tracking-normal">*</span>
            </label>
            <input
              className={fieldClass}
              value={cac}
              onChange={e => setCac(e.target.value)}
              placeholder="BN1234567 or RC123456"
              autoCapitalize="characters"
              required
              aria-required="true"
            />
            <p className="text-[11px] text-[var(--muted)] leading-snug">
              Mandatory. Use your CAC Business Name (BN) or Registered Company (RC) number.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Business address
            </label>
            <textarea
              className={`${fieldClass} !h-20 py-3 resize-none`}
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Street, landmark, city"
            />
          </div>
        </section>

        <button type="button" onClick={handleContinue} className="glass-cta w-full !rounded-2xl">
          Continue to PIN
        </button>

        <PinSheetModal
          isOpen={pinOpen}
          onClose={() => !busy && setPinOpen(false)}
          title="Authorize business account"
          subtitle={`Open ${businessName.trim() || 'business'} under ${owner.fullName}`}
          onSuccess={pin => handlePinSuccess(pin)}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="business-accounts-screen">
      <section className="glass-card glass-strong settings-list !rounded-[24px] px-4 py-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-500">
            <Icon name="domain" size={12} />
            Business
          </span>
          <span className="text-[10px] text-[var(--muted)] uppercase tracking-wide">
            {owner.tier} · instant open
          </span>
        </div>
        <p className="text-[13px] text-[var(--muted)] leading-snug">
          Open a business wallet with name, CAC and address only. Personal Tier 2 KYC covers the
          rest — certificates and address checks come later.
        </p>
      </section>

      {!mainBusiness ? (
        <button
          type="button"
          onClick={openCreate}
          className="glass-cta w-full !rounded-2xl flex items-center justify-center gap-2"
        >
          <Icon name="add" size={16} />
          Open business account
        </button>
      ) : (
        <button
          type="button"
          onClick={openCreate}
          className="w-full h-12 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] text-[var(--text)] text-[14px] font-semibold flex items-center justify-center gap-2"
        >
          <Icon name="add" size={16} />
          Open another business
        </button>
      )}

      <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
        Your business accounts · {accounts.length}
      </p>

      {accounts.length === 0 ? (
        <section className="glass-card glass-strong settings-list !rounded-[24px] px-5 py-10 text-center space-y-3">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
            <Icon name="domain" size={22} />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-[var(--text)]">No business account yet</p>
            <p className="mt-1 text-[12px] text-[var(--muted)] leading-snug">
              Instant create under your personal Tier 2 profile — fresh pay-in number via CheckoutRail.
            </p>
          </div>
        </section>
      ) : (
        <div className="space-y-2.5">
          {accounts.map(acc => (
            <article
              key={acc.id}
              className="glass-card glass-strong settings-list !rounded-[22px] px-4 py-3.5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold text-[var(--text)] truncate">{acc.name}</p>
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                        acc.kind === 'business'
                          ? 'border-sky-500/30 bg-sky-500/10 text-sky-500'
                          : 'border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]'
                      }`}
                    >
                      {acc.kind === 'business' ? 'Main business' : 'Mini business'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--muted)] truncate">{acc.subtitle}</p>
                  <p className="mt-1 text-[11px] font-mono text-[var(--muted)]">
                    {formatAccountNumber(acc)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-semibold font-mono text-[var(--text)]">
                    {money(acc.balance)}
                  </p>
                  <p className="mt-1 text-[10px] text-emerald-500 font-semibold">Active</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1 border-t border-[var(--glass-border)]">
                <button
                  type="button"
                  onClick={() => {
                    selectWallet(acc.id);
                    setAccountContext('business');
                    showToast('Switched', `Now using ${acc.name}.`, 'info');
                    setActiveScreen('hub');
                  }}
                  className="settings-row flex-1 h-9 rounded-xl bg-[var(--accent)] text-white text-[12px] font-semibold appearance-none border-0 cursor-pointer"
                >
                  Use wallet
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen('sub_accounts')}
                  className="settings-row flex-1 h-9 rounded-xl border border-[var(--glass-border)] text-[12px] font-semibold text-[var(--text)] appearance-none cursor-pointer bg-black/[0.03] dark:bg-white/[0.05]"
                >
                  Sub-accounts
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen('settlement')}
                  className="settings-row flex-1 h-9 rounded-xl border border-[var(--glass-border)] text-[12px] font-semibold text-[var(--text)] appearance-none cursor-pointer bg-black/[0.03] dark:bg-white/[0.05]"
                >
                  Settlement
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {mainBusiness && miniBusiness.length === 0 && (
        <p className="text-center text-[11px] text-[var(--muted)] px-2 leading-relaxed">
          Need a branch or stall wallet? Create a mini business from Sub-accounts.
        </p>
      )}
    </main>
  );
};
