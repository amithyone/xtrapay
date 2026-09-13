import React, { useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';

export const ReceiveScreen: React.FC = () => {
  const {
    accountContext,
    setAccountContext,
    wallets,
    accountFullName,
    accountTier,
    setIsQrOpen,
    setIsShareOpen,
    setActiveScreen,
    showToast,
  } = useTransactions();

  const [activeTab, setActiveTab] = useState<'personal' | 'business'>(accountContext);

  const accountInfo = useMemo(() => {
    const wallet =
      wallets.find(w => w.kind === activeTab) ??
      wallets.find(w =>
        activeTab === 'personal' ? w.kind === 'sub_personal' : w.kind === 'sub_business'
      );

    const number = wallet?.accountNumber?.trim() || '—';
    const bank = wallet?.bankName?.trim() || '—';
    const name =
      wallet?.accountName?.trim() ||
      accountFullName.trim() ||
      wallet?.name?.trim() ||
      '—';
    const ussd =
      wallet?.ussd?.trim() ||
      (number !== '—' ? `*901*000*${number}#` : '—');

    return {
      name,
      number,
      bank,
      tier: accountTier || 'Tier 1',
      ussd,
      badge: activeTab === 'personal' ? 'Personal account' : 'Business vault',
    };
  }, [activeTab, wallets, accountFullName, accountTier]);

  const copyField = (val: string, label: string) => {
    if (!val || val === '—') {
      showToast('Unavailable', `${label} is not ready yet.`, 'warning');
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(val);
    }
    showToast(`${label} Copied`, `${val} copied to clipboard.`);
  };

  const handleSync = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    btn.classList.add('animate-spin');
    setTimeout(() => {
      btn.classList.remove('animate-spin');
      showToast('NIBSS Core Synchronized', 'Real-time settlement pipe refreshed.');
    }, 700);
  };

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5" id="receive-screen">
      {/* Account switch + shortcuts */}
      <section className="space-y-3">
        <div className="glass-card glass-strong flex p-1 !rounded-[18px]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('personal');
              setAccountContext('personal');
            }}
            className={`flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold transition-all ${
              activeTab === 'personal'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--muted)]'
            }`}
          >
            Personal
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('business');
              setAccountContext('business');
            }}
            className={`flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold transition-all ${
              activeTab === 'business'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--muted)]'
            }`}
          >
            Business
          </button>
        </div>

        <div className="flex items-center justify-between px-0.5">
          <p className="text-[12px] text-[var(--muted)]">Instant virtual routing</p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSync}
              className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
              title="Sync settlement"
              aria-label="Sync"
            >
              <Icon name="refresh" size={15} />
            </button>
            <button
              type="button"
              onClick={() => setIsQrOpen(true)}
              className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-sky-600"
              title="View QR"
              aria-label="QR"
            >
              <Icon name="qr_code_2" size={15} />
            </button>
            <button
              type="button"
              onClick={() =>
                showToast('Contactless NFC', 'Looking for nearby Xtrapay devices...', 'info')
              }
              className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--accent)]"
              title="Contactless"
              aria-label="Contactless"
            >
              <Icon name="contactless" size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Account card */}
      <section className="glass-card glass-strong !rounded-[24px] px-5 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              {accountInfo.badge}
            </p>
            <p className="mt-1 text-[12px] font-semibold text-[var(--accent)]">{accountInfo.tier}</p>
          </div>
          <span className="glass-chip !rounded-full !px-2.5 !py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Icon name="bolt" size={13} />
            Zero fee
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] px-3.5 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-purple-500">
              <Icon name="person" size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Account name
              </p>
              <p className="text-[13px] font-semibold text-[var(--text)] truncate">
                {accountInfo.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyField(accountInfo.name, 'Account Name')}
              className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
              aria-label="Copy name"
            >
              <Icon name="content_copy" size={15} />
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-3.5 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
              <Icon name="credit_card" size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--accent)] font-semibold">
                Account number
              </p>
              <p className="font-mono text-[17px] font-semibold tracking-wide text-[var(--text)]">
                {accountInfo.number}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyField(accountInfo.number, 'Account Number')}
              className="h-9 px-3 rounded-full bg-[var(--accent)] text-white text-[11px] font-semibold flex items-center gap-1.5 active:scale-95"
            >
              <Icon name="content_copy" size={13} />
              Copy
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] px-3.5 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
              <Icon name="account_balance" size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Bank</p>
              <p className="text-[13px] font-semibold text-[var(--text)]">{accountInfo.bank}</p>
            </div>
            <button
              type="button"
              onClick={() => copyField(accountInfo.bank, 'Bank Name')}
              className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
              aria-label="Copy bank"
            >
              <Icon name="content_copy" size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Primary CTA */}
      <button
        type="button"
        onClick={() => setIsShareOpen(true)}
        className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform"
      >
        <Icon name="share" size={18} />
        Share account details
      </button>

      {/* Secondary actions */}
      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveScreen('ask_money')}
          className="glass-card glass-strong !rounded-[20px] px-4 py-4 text-left active:scale-[0.99] transition-transform"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-600">
            <Icon name="payments" size={16} />
          </span>
          <span className="mt-3 block text-[13px] font-semibold text-[var(--text)]">
            Request for money
          </span>
          <span className="mt-0.5 block text-[11px] text-[var(--muted)]">Ask people you know</span>
        </button>

        <button
          type="button"
          onClick={() => copyField(accountInfo.ussd, 'USSD Code')}
          className="glass-card glass-strong !rounded-[20px] px-4 py-4 text-left active:scale-[0.99] transition-transform"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <Icon name="dialpad" size={16} />
          </span>
          <span className="mt-3 block text-[13px] font-semibold text-[var(--text)]">USSD routing</span>
          <span className="mt-0.5 block text-[11px] text-[var(--muted)]">Copy dial code</span>
        </button>
      </section>

      {/* USSD bar */}
      <section className="glass-card glass-strong !rounded-[20px] px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/40 dark:bg-white/8 text-[var(--muted)]">
            <Icon name="smartphone" size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Quick USSD
            </p>
            <p className="font-mono text-[13px] font-semibold text-[var(--text)] truncate">
              {accountInfo.ussd}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => copyField(accountInfo.ussd, 'USSD Dial String')}
          className="shrink-0 h-9 px-3 rounded-full bg-[var(--accent)] text-white text-[11px] font-semibold active:scale-95"
        >
          Dial code
        </button>
      </section>
    </main>
  );
};
