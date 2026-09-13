import React, { useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';
import {
  INITIAL_TERMINALS,
  INITIAL_TERMINAL_TXS,
  SUPPORT_TX_TYPES,
} from '../../data/terminals';
import type { Terminal, TerminalStatus, TerminalTx } from '../../types';

type SheetKind =
  | null
  | 'rename'
  | 'address'
  | 'fund'
  | 'withdraw'
  | 'xpoints'
  | 'history'
  | 'support'
  | 'lock';

const statusTone = (status: TerminalStatus, isLight: boolean) => {
  switch (status) {
    case 'Active':
      return isLight
        ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25'
        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'Offline':
      return isLight
        ? 'bg-amber-500/15 text-amber-700 border-amber-500/25'
        : 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'Locked':
      return isLight
        ? 'bg-rose-500/15 text-rose-700 border-rose-500/25'
        : 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    case 'Inactive':
      return isLight
        ? 'bg-zinc-500/15 text-zinc-600 border-zinc-500/25'
        : 'bg-white/10 text-white/70 border-white/15';
    case 'Pending':
    default:
      return isLight
        ? 'bg-sky-500/15 text-sky-700 border-sky-500/25'
        : 'bg-sky-500/20 text-sky-300 border-sky-500/30';
  }
};

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Agent Terminal Management — mini dashboard + terminal details & actions.
 * Spec: Terminal → My Terminals → Details → Fund / Withdraw / … / Support
 */
export const TerminalScreen: React.FC = () => {
  const { personalBalance, showToast, theme } = useTransactions();
  const isLight = theme === 'light';

  const [terminals, setTerminals] = useState<Terminal[]>(INITIAL_TERMINALS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [renameValue, setRenameValue] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [addressReason, setAddressReason] = useState('');
  const [amountStr, setAmountStr] = useState('0');
  const [supportType, setSupportType] = useState<string>(SUPPORT_TX_TYPES[0]);
  const [supportNote, setSupportNote] = useState('');
  const [attachTxId, setAttachTxId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'All' | TerminalTx['status']>('All');
  const [unlockPinOpen, setUnlockPinOpen] = useState(false);
  const [sweepPageOpen, setSweepPageOpen] = useState(false);
  const [sweepTarget, setSweepTarget] = useState<'all' | string>('all');
  const [sweepPinOpen, setSweepPinOpen] = useState(false);
  const [fundPinOpen, setFundPinOpen] = useState(false);
  const [pendingFundAmount, setPendingFundAmount] = useState(0);
  const [fundSuccess, setFundSuccess] = useState<{
    amount: number;
    terminalName: string;
    terminalId: string;
    reference: string;
    newBalance: number;
  } | null>(null);

  const selected = terminals.find(t => t.id === selectedId) ?? null;

  const stats = useMemo(() => {
    const total = terminals.length;
    const active = terminals.filter(t => t.status === 'Active').length;
    const offline = terminals.filter(t => t.status === 'Offline').length;
    const locked = terminals.filter(t => t.status === 'Locked').length;
    const float = terminals.reduce((s, t) => s + t.balance, 0);
    return { total, active, offline, locked, float };
  }, [terminals]);

  const terminalTxs = useMemo(() => {
    if (!selected) return [];
    return INITIAL_TERMINAL_TXS.filter(tx => tx.terminalId === selected.terminalId).filter(
      tx => historyFilter === 'All' || tx.status === historyFilter
    );
  }, [selected, historyFilter]);

  const xPointsSummary = useMemo(() => {
    const rows = INITIAL_TERMINAL_TXS.filter(
      tx => selected && tx.terminalId === selected.terminalId
    );
    const earned = rows.reduce((s, t) => s + (t.xPoints || 0), 0);
    const commission = rows.reduce((s, t) => s + (t.commission || 0), 0);
    return {
      total: earned + 420,
      available: earned + 280,
      pending: 86,
      redeemed: 54,
      commission,
    };
  }, [selected]);

  const openSheet = (kind: SheetKind) => {
    if (!selected) return;
    if (kind === 'rename') setRenameValue(selected.name);
    if (kind === 'address') {
      setNewAddress(selected.pendingAddress || '');
      setAddressReason('');
    }
    if (kind === 'fund' || kind === 'withdraw') setAmountStr('0');
    if (kind === 'support') {
      setSupportType(SUPPORT_TX_TYPES[0]);
      setSupportNote('');
      setAttachTxId(null);
    }
    if (kind === 'history') setHistoryFilter('All');
    setSheet(kind);
  };

  const closeSheet = () => setSheet(null);

  const patchTerminal = (id: string, patch: Partial<Terminal>) => {
    setTerminals(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  };

  const handleRename = () => {
    if (!selected || !renameValue.trim()) return;
    patchTerminal(selected.id, { name: renameValue.trim() });
    showToast('Terminal Renamed', `${selected.terminalId} is now “${renameValue.trim()}”.`);
    closeSheet();
  };

  const handleAddressRequest = () => {
    if (!selected || !newAddress.trim() || !addressReason.trim()) {
      showToast('Missing Details', 'Enter the new address and a reason.', 'warning');
      return;
    }
    patchTerminal(selected.id, {
      pendingAddress: newAddress.trim(),
      addressRequestStatus: 'Pending',
    });
    showToast(
      'Address Request Submitted',
      'Admin/Operations will review before the official address updates.',
      'info'
    );
    closeSheet();
  };

  const handleFund = () => {
    if (!selected) return;
    const amt = parseFloat(amountStr.replace(/,/g, '')) || 0;
    if (amt <= 0) {
      showToast('Invalid Amount', 'Enter a valid funding amount.', 'warning');
      return;
    }
    if (amt > personalBalance) {
      showToast('Insufficient Wallet', 'Wallet balance cannot cover this fund.', 'warning');
      return;
    }
    setPendingFundAmount(amt);
    setFundPinOpen(true);
  };

  const handleFundPinSuccess = () => {
    if (!selected || pendingFundAmount <= 0) return;
    const amt = pendingFundAmount;
    const reference = `XTF-${Date.now().toString().slice(-8)}`;
    const newBalance = selected.balance + amt;
    patchTerminal(selected.id, { balance: newBalance });
    setFundPinOpen(false);
    setPendingFundAmount(0);
    closeSheet();
    setFundSuccess({
      amount: amt,
      terminalName: selected.name,
      terminalId: selected.terminalId,
      reference,
      newBalance,
    });
  };

  const handleWithdraw = () => {
    if (!selected) return;
    const amt = parseFloat(amountStr.replace(/,/g, '')) || 0;
    if (amt <= 0) {
      showToast('Invalid Amount', 'Enter a valid withdrawal amount.', 'warning');
      return;
    }
    if (amt > selected.balance) {
      showToast('Insufficient Terminal Float', 'Amount exceeds terminal balance.', 'warning');
      return;
    }
    patchTerminal(selected.id, { balance: selected.balance - amt });
    showToast(
      'Withdrawn to Wallet',
      `${money(amt)} returned to your Xtrapay wallet.`
    );
    closeSheet();
  };

  const handleLockToggle = () => {
    if (!selected) return;
    if (selected.status === 'Locked') {
      setUnlockPinOpen(true);
      return;
    }
    patchTerminal(selected.id, { status: 'Locked' });
    showToast('Terminal Locked', `${selected.name} is locked for security.`, 'warning');
    closeSheet();
  };

  const handleUnlockSuccess = () => {
    if (!selected) return;
    patchTerminal(selected.id, { status: 'Active' });
    setUnlockPinOpen(false);
    closeSheet();
    showToast('Terminal Unlocked', `${selected.name} is active again.`);
  };

  const terminalsWithFloat = useMemo(
    () => terminals.filter(t => t.balance > 0),
    [terminals]
  );

  const sweepAmount = useMemo(() => {
    if (sweepTarget === 'all') {
      return terminalsWithFloat.reduce((s, t) => s + t.balance, 0);
    }
    return terminals.find(t => t.id === sweepTarget)?.balance ?? 0;
  }, [sweepTarget, terminals, terminalsWithFloat]);

  const sweepLabel = useMemo(() => {
    if (sweepTarget === 'all') {
      return `${terminalsWithFloat.length} terminal${terminalsWithFloat.length === 1 ? '' : 's'}`;
    }
    return terminals.find(t => t.id === sweepTarget)?.name ?? 'Terminal';
  }, [sweepTarget, terminals, terminalsWithFloat]);

  const openSweepPage = () => {
    if (stats.float <= 0) {
      showToast('Nothing to Sweep', 'All POS terminals already have zero float.', 'info');
      return;
    }
    setSweepTarget('all');
    setSweepPageOpen(true);
  };

  const handleSweepContinue = () => {
    if (sweepAmount <= 0) {
      showToast('Nothing to Sweep', 'Select a POS with float to withdraw.', 'warning');
      return;
    }
    setSweepPinOpen(true);
  };

  const handleSweepSuccess = () => {
    const swept = sweepAmount;
    const target = sweepTarget;
    setTerminals(prev =>
      prev.map(t => {
        if (target === 'all') return { ...t, balance: 0 };
        if (t.id === target) return { ...t, balance: 0 };
        return t;
      })
    );
    setSweepPinOpen(false);
    setSweepPageOpen(false);
    showToast(
      'POS Sweep Complete',
      target === 'all'
        ? `${money(swept)} withdrawn from all terminals to your Xtrapay wallet.`
        : `${money(swept)} withdrawn from ${sweepLabel} to your Xtrapay wallet.`
    );
  };

  const handleSupportSubmit = () => {
    if (!selected) return;
    const ticket = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(
      Math.floor(Math.random() * 900000) + 100000
    ).slice(0, 6)}`;
    showToast(
      'Support Ticket Opened',
      `${ticket} · ${supportType} · Status: Open`,
      'info'
    );
    closeSheet();
  };

  const padDigit = (d: string) => {
    setAmountStr(prev => {
      if (prev === '0') return d;
      if (prev.replace(/,/g, '').length >= 9) return prev;
      return prev + d;
    });
  };

  const padDel = () => {
    setAmountStr(prev => {
      const next = prev.slice(0, -1);
      return next.length === 0 ? '0' : next;
    });
  };

  /* ───────── Sweep POS page ───────── */
  if (sweepPageOpen && !selected) {
    return (
      <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id="sweep-pos-screen">
        <button
          type="button"
          onClick={() => {
            setSweepPinOpen(false);
            setSweepPageOpen(false);
          }}
          className="settings-row inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] bg-transparent border-0 p-0 appearance-none cursor-pointer active:opacity-70"
        >
          <Icon name="arrow_back" size={16} />
          All terminals
        </button>

        <header className="glass-card glass-strong settings-list !rounded-[24px] px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
            Withdraw float
          </p>
          <h1 className="mt-1.5 text-[18px] font-semibold text-[var(--text)] tracking-tight">
            Sweep POS
          </h1>
          <p className="mt-1 text-[12px] text-[var(--muted)] leading-snug">
            Choose one terminal or sweep every POS with float into your wallet.
          </p>
        </header>

        <section className="glass-card glass-strong settings-list !rounded-[24px] px-4 py-4 space-y-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Amount to withdraw
          </p>
          <p className="text-[26px] font-semibold font-mono text-[var(--text)] tracking-tight">
            {money(sweepAmount)}
          </p>
          <p className="text-[12px] text-[var(--muted)]">
            From {sweepLabel} · settles to Xtrapay wallet
          </p>
        </section>

        <section className="space-y-2">
          <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Select POS to sweep
          </p>

          <button
            type="button"
            onClick={() => setSweepTarget('all')}
            className={`settings-row w-full glass-card glass-strong !rounded-[22px] px-4 py-4 text-left border appearance-none cursor-pointer ${
              sweepTarget === 'all'
                ? 'border-[var(--accent)]/55 ring-1 ring-[var(--accent)]/30'
                : 'border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  sweepTarget === 'all'
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                    : 'border-[var(--glass-border)]'
                }`}
              >
                {sweepTarget === 'all' && <Icon name="check" size={12} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-[var(--text)]">All POS with float</p>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {terminalsWithFloat.length} terminal
                  {terminalsWithFloat.length === 1 ? '' : 's'} · combined balance
                </p>
              </div>
              <p className="text-[13px] font-semibold font-mono text-[var(--text)] shrink-0">
                {money(stats.float)}
              </p>
            </div>
          </button>

          {terminals.map(t => {
            const selectedTarget = sweepTarget === t.id;
            const disabled = t.balance <= 0;
            return (
              <button
                key={t.id}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setSweepTarget(t.id)}
                className={`settings-row w-full glass-card glass-strong !rounded-[22px] px-4 py-4 text-left border appearance-none ${
                  disabled
                    ? 'opacity-45 cursor-not-allowed border-transparent'
                    : selectedTarget
                      ? 'border-[var(--accent)]/55 ring-1 ring-[var(--accent)]/30 cursor-pointer'
                      : 'border-transparent cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selectedTarget
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                        : 'border-[var(--glass-border)]'
                    }`}
                  >
                    {selectedTarget && <Icon name="check" size={12} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold text-[var(--text)] truncate">
                        {t.name}
                      </p>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusTone(
                          t.status,
                          isLight
                        )}`}
                      >
                        {t.status === 'Offline' ? 'Offline' : t.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-mono text-[var(--muted)]">
                      {t.terminalId}
                    </p>
                  </div>
                  <p className="text-[13px] font-semibold font-mono text-[var(--text)] shrink-0">
                    {money(t.balance)}
                  </p>
                </div>
              </button>
            );
          })}
        </section>

        <button
          type="button"
          onClick={handleSweepContinue}
          disabled={sweepAmount <= 0}
          className={`w-full h-12 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 ${
            sweepAmount <= 0
              ? 'opacity-45 cursor-not-allowed bg-black/[0.04] dark:bg-white/[0.06] text-[var(--muted)] border border-[var(--glass-border)]'
              : 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/25'
          }`}
        >
          Continue to PIN
        </button>

        <PinSheetModal
          isOpen={sweepPinOpen}
          onClose={() => setSweepPinOpen(false)}
          title={sweepTarget === 'all' ? 'Sweep All POS Float' : 'Sweep POS Float'}
          subtitle={`Withdraw ${money(sweepAmount)} from ${sweepLabel} to your wallet`}
          amount={sweepAmount}
          recipient={
            sweepTarget === 'all'
              ? 'All POS'
              : terminals.find(t => t.id === sweepTarget)?.terminalId
          }
          onSuccess={handleSweepSuccess}
        />
      </main>
    );
  }

  /* ───────── List (Mini Dashboard) ───────── */
  if (!selected) {
    return (
      <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="terminal-screen">
        <header className="glass-card glass-strong !rounded-[24px] px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
            Agent terminal management
          </p>
          <h1 className="mt-1.5 text-[18px] font-semibold text-[var(--text)] tracking-tight">
            My Terminals
          </h1>
          <p className="mt-1 text-[12px] text-[var(--muted)] leading-snug">
            Manage mapped POS devices, float, locks and support tickets.
          </p>
        </header>

        <section className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Total', value: String(stats.total) },
            { label: 'Active', value: String(stats.active) },
            { label: 'Offline', value: String(stats.offline) },
            { label: 'Locked', value: String(stats.locked) },
          ].map(card => (
            <div
              key={card.label}
              className="glass-card !rounded-[20px] px-3.5 py-3"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                {card.label}
              </p>
              <p className="mt-1 text-[20px] font-semibold text-[var(--text)] font-mono">
                {card.value}
              </p>
            </div>
          ))}
        </section>

        <section className="glass-card glass-strong !rounded-[24px] px-4 py-3.5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Combined float
              </p>
              <p className="mt-1 text-[18px] font-semibold font-mono text-[var(--text)]">
                {money(stats.float)}
              </p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
              <Icon name="point_of_sale" size={20} />
            </span>
          </div>
          <button
            type="button"
            onClick={openSweepPage}
            disabled={stats.float <= 0}
            className={`w-full h-11 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-2 ${
              stats.float <= 0
                ? 'opacity-45 cursor-not-allowed bg-black/[0.04] dark:bg-white/[0.06] text-[var(--muted)] border border-[var(--glass-border)]'
                : 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/25'
            }`}
          >
            <Icon name="arrow_upward" size={16} />
            Sweep POS
          </button>
        </section>

        <section className="space-y-3">
          <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Mapped terminals · {terminals.length}
          </p>
          {terminals.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              className="glass-card glass-strong w-full !rounded-[24px] px-4 py-4 text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-[14px] font-semibold text-[var(--text)] truncate">
                      {t.name}
                    </h2>
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusTone(
                        t.status,
                        isLight
                      )}`}
                    >
                      {t.status === 'Offline' ? 'Offline / Not Working' : t.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-mono text-[var(--muted)]">
                    {t.terminalId} · {t.serialNumber}
                  </p>
                  <p className="mt-1.5 text-[11px] text-[var(--muted)] line-clamp-1 flex items-center gap-1">
                    <Icon name="location_on" size={12} />
                    {t.address}
                  </p>
                </div>
                <Icon name="chevron_right" size={18} className="text-[var(--muted)] shrink-0 mt-1" />
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--glass-border)] flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
                    Balance
                  </p>
                  <p className="text-[15px] font-semibold font-mono text-[var(--text)]">
                    {money(t.balance)}
                  </p>
                </div>
                <div className="text-right min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
                    Last txn
                  </p>
                  <p className="text-[11px] text-[var(--text)] truncate">{t.lastTransaction.label}</p>
                  <p className="text-[10px] text-[var(--muted)]">{t.lastTransaction.at}</p>
                </div>
              </div>
            </button>
          ))}
        </section>
      </main>
    );
  }

  /* ───────── Detail ───────── */
  const actions: { label: string; icon: string; sheet: SheetKind }[] = [
    { label: 'Rename', icon: 'edit', sheet: 'rename' },
    { label: 'Address', icon: 'location_on', sheet: 'address' },
    { label: 'Fund', icon: 'arrow_downward', sheet: 'fund' },
    { label: 'Withdraw', icon: 'arrow_upward', sheet: 'withdraw' },
    { label: 'X-Points', icon: 'toll', sheet: 'xpoints' },
    { label: 'History', icon: 'receipt_long', sheet: 'history' },
    {
      label: selected.status === 'Locked' ? 'Unlock' : 'Lock',
      icon: selected.status === 'Locked' ? 'lock_open' : 'lock',
      sheet: 'lock',
    },
    { label: 'Support', icon: 'support_agent', sheet: 'support' },
  ];

  return (
    <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id="terminal-detail-screen">
      <button
        type="button"
        onClick={() => setSelectedId(null)}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] active:opacity-70"
      >
        <Icon name="arrow_back" size={16} />
        All terminals
      </button>

      <section className="glass-card glass-strong !rounded-[28px] px-5 py-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              Terminal details
            </p>
            <h1 className="mt-1 text-[18px] font-semibold text-[var(--text)] tracking-tight">
              {selected.name}
            </h1>
            <p className="mt-1 text-[11px] font-mono text-[var(--muted)]">
              {selected.terminalId}
            </p>
          </div>
          <span
            className={`shrink-0 text-[9px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${statusTone(
              selected.status,
              isLight
            )}`}
          >
            {selected.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">Serial</p>
            <p className="mt-0.5 font-mono text-[var(--text)]">{selected.serialNumber}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">Model</p>
            <p className="mt-0.5 text-[var(--text)]">{selected.model}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">Address</p>
            <p className="mt-0.5 text-[var(--text)] leading-snug">{selected.address}</p>
            {selected.addressRequestStatus === 'Pending' && selected.pendingAddress && (
              <p className="mt-1 text-[11px] text-amber-500">
                Pending approval → {selected.pendingAddress}
              </p>
            )}
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Date mapped
            </p>
            <p className="mt-0.5 text-[var(--text)]">{selected.dateMapped}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Last transaction
            </p>
            <p className="mt-0.5 text-[var(--text)]">{selected.lastTransaction.label}</p>
            <p className="text-[10px] text-[var(--muted)]">{selected.lastTransaction.at}</p>
          </div>
        </div>

        <div
          className={`rounded-[20px] px-4 py-3.5 ${
            isLight ? 'bg-zinc-100' : 'bg-white/8 border border-white/10'
          }`}
        >
          <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Terminal balance
          </p>
          <p className="mt-1 text-[1.65rem] font-semibold font-mono text-[var(--text)] leading-none">
            {money(selected.balance)}
          </p>
        </div>
      </section>

      <section>
        <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Actions
        </p>
        <div className="grid grid-cols-4 gap-2">
          {actions.map(a => (
            <button
              key={a.label}
              type="button"
              onClick={() => openSheet(a.sheet)}
              className="glass-card !rounded-[18px] px-1.5 py-3 flex flex-col items-center gap-2 active:scale-[0.97] transition-transform"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  isLight ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-white/10 text-white'
                }`}
              >
                <Icon name={a.icon} size={16} />
              </span>
              <span className="text-[10px] font-semibold text-[var(--text)] text-center leading-tight">
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ───── Sheets ───── */}
      {sheet === 'rename' && (
        <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-5 space-y-4">
            <SheetHeader title="Rename Terminal" onClose={closeSheet} />
            <p className="text-[11px] text-[var(--muted)]">
              Display name only — ID, serial, ownership and settlement stay unchanged.
            </p>
            <input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              className={fieldClass}
              placeholder="e.g. Main Shop POS"
            />
            <button type="button" onClick={handleRename} className="glass-cta w-full">
              Save name
            </button>
          </div>
        </div>
      )}

      {sheet === 'address' && (
        <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-5 space-y-4">
            <SheetHeader title="Change Address" onClose={closeSheet} />
            <div className="rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] p-3">
              <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Current mapped address
              </p>
              <p className="mt-1 text-[12px] text-[var(--text)]">{selected.address}</p>
            </div>
            <input
              value={newAddress}
              onChange={e => setNewAddress(e.target.value)}
              className={fieldClass}
              placeholder="Proposed new address"
            />
            <textarea
              value={addressReason}
              onChange={e => setAddressReason(e.target.value)}
              className={`${fieldClass} !h-24 py-3 resize-none`}
              placeholder="Reason for change"
            />
            <button type="button" onClick={handleAddressRequest} className="glass-cta w-full">
              Submit for admin review
            </button>
          </div>
        </div>
      )}

      {(sheet === 'fund' || sheet === 'withdraw') && (
        <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-5 space-y-4">
            <SheetHeader
              title={sheet === 'fund' ? 'Fund Terminal' : 'Withdraw to Wallet'}
              onClose={closeSheet}
            />
            <p className="text-[11px] text-[var(--muted)] text-center">
              {sheet === 'fund'
                ? `Wallet available · ${money(personalBalance)}`
                : `Terminal float · ${money(selected.balance)}`}
            </p>
            <div className="text-center py-1">
              <span className="text-3xl font-mono font-semibold text-[var(--text)]">
                ₦{amountStr}
              </span>
            </div>
            <Keypad onDigit={padDigit} onDelete={padDel} />
            <button
              type="button"
              onClick={sheet === 'fund' ? handleFund : handleWithdraw}
              className="glass-cta w-full"
            >
              {sheet === 'fund' ? 'Continue to PIN' : 'Withdraw to wallet'}
            </button>
          </div>
        </div>
      )}

      {sheet === 'xpoints' && (
        <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-5 space-y-4">
            <SheetHeader title="X-Points & Commission" onClose={closeSheet} />
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Total', value: xPointsSummary.total },
                { label: 'Available', value: xPointsSummary.available },
                { label: 'Pending', value: xPointsSummary.pending },
                { label: 'Redeemed', value: xPointsSummary.redeemed },
              ].map(row => (
                <div key={row.label} className="rounded-2xl border border-[var(--glass-border)] p-3">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
                    {row.label}
                  </p>
                  <p className="mt-1 text-[16px] font-semibold font-mono text-[var(--text)]">
                    {row.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-[var(--glass-border)] p-3.5">
              <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Commission earned
              </p>
              <p className="mt-1 text-[18px] font-semibold font-mono text-[var(--text)]">
                {money(xPointsSummary.commission)}
              </p>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {INITIAL_TERMINAL_TXS.filter(tx => tx.terminalId === selected.terminalId).map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--glass-border)] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-[var(--text)] truncate">{tx.type}</p>
                    <p className="text-[10px] text-[var(--muted)] font-mono">{tx.reference}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-mono text-[var(--text)]">{money(tx.amount)}</p>
                    <p className="text-[10px] text-emerald-500">+{tx.xPoints || 0} XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {sheet === 'history' && (
        <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-5 space-y-4">
            <SheetHeader title="Terminal History" onClose={closeSheet} />
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {(['All', 'Successful', 'Failed', 'Pending', 'Reversed', 'Declined'] as const).map(
                f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setHistoryFilter(f)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide border ${
                      historyFilter === f
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'border-[var(--glass-border)] text-[var(--muted)]'
                    }`}
                  >
                    {f}
                  </button>
                )
              )}
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {terminalTxs.length === 0 && (
                <p className="text-center text-[12px] text-[var(--muted)] py-8">
                  No transactions for this filter.
                </p>
              )}
              {terminalTxs.map(tx => (
                <div
                  key={tx.id}
                  className="rounded-2xl border border-[var(--glass-border)] px-3.5 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--text)]">{tx.type}</p>
                      <p className="text-[10px] font-mono text-[var(--muted)]">{tx.reference}</p>
                      <p className="text-[10px] text-[var(--muted)] mt-0.5">
                        {tx.date} · {tx.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-mono font-semibold text-[var(--text)]">
                        {money(tx.amount)}
                      </p>
                      <p
                        className={`text-[10px] font-semibold ${
                          tx.status === 'Successful'
                            ? 'text-emerald-500'
                            : tx.status === 'Failed' || tx.status === 'Declined'
                            ? 'text-rose-500'
                            : 'text-amber-500'
                        }`}
                      >
                        {tx.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {sheet === 'lock' && (
        <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-5 space-y-4">
            <SheetHeader
              title={selected.status === 'Locked' ? 'Unlock Terminal' : 'Lock Terminal'}
              onClose={closeSheet}
            />
            <p className="text-[12px] text-[var(--muted)] leading-relaxed">
              {selected.status === 'Locked'
                ? 'Unlocking requires your wallet PIN. Transactions will resume per TMS rules.'
                : 'Lock for loss, theft, security concern or temporary non-use. Transactions will be restricted.'}
            </p>
            <button type="button" onClick={handleLockToggle} className="glass-cta w-full">
              {selected.status === 'Locked' ? 'Continue to unlock' : 'Lock terminal'}
            </button>
          </div>
        </div>
      )}

      {sheet === 'support' && (
        <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-5 space-y-4">
            <SheetHeader title="Terminal Support" onClose={closeSheet} />
            <div className="rounded-2xl border border-[var(--glass-border)] p-3 text-[11px] space-y-1">
              <p className="text-[var(--muted)]">
                Agent · <span className="text-[var(--text)]">Innocent Solomon · AG-1003925</span>
              </p>
              <p className="text-[var(--muted)]">
                Terminal ·{' '}
                <span className="text-[var(--text)]">
                  {selected.name} · {selected.terminalId}
                </span>
              </p>
              <p className="text-[var(--muted)]">
                Serial · <span className="text-[var(--text)]">{selected.serialNumber}</span>
              </p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Issue type
              </span>
              <select
                value={supportType}
                onChange={e => setSupportType(e.target.value)}
                className={fieldClass}
              >
                {SUPPORT_TX_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Attach receipt (optional)
              </span>
              <select
                value={attachTxId || ''}
                onChange={e => setAttachTxId(e.target.value || null)}
                className={fieldClass}
              >
                <option value="">No receipt attached</option>
                {INITIAL_TERMINAL_TXS.filter(tx => tx.terminalId === selected.terminalId).map(
                  tx => (
                    <option key={tx.id} value={tx.id}>
                      {tx.reference} · {tx.type} · {money(tx.amount)}
                    </option>
                  )
                )}
              </select>
            </label>
            <textarea
              value={supportNote}
              onChange={e => setSupportNote(e.target.value)}
              className={`${fieldClass} !h-24 py-3 resize-none`}
              placeholder="Describe the issue…"
            />
            <button type="button" onClick={handleSupportSubmit} className="glass-cta w-full">
              Open support ticket
            </button>
          </div>
        </div>
      )}

      <PinSheetModal
        isOpen={fundPinOpen}
        onClose={() => {
          setFundPinOpen(false);
          setPendingFundAmount(0);
        }}
        title="Authorize Funding"
        subtitle={`Fund ${selected.name} from your wallet`}
        amount={pendingFundAmount}
        recipient={selected.terminalId}
        onSuccess={handleFundPinSuccess}
      />

      <PinSheetModal
        isOpen={unlockPinOpen}
        onClose={() => setUnlockPinOpen(false)}
        title="Unlock Terminal"
        subtitle={`Authorize unlock for ${selected.name}`}
        onSuccess={handleUnlockSuccess}
      />

      {fundSuccess && (
        <div className="app-modal-overlay z-[85] bg-black/75 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[28px] p-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-500">
              <Icon name="check_circle" size={32} />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-[var(--text)]">Funding successful</h2>
              <p className="mt-1.5 text-[12px] text-[var(--muted)] leading-snug">
                Your wallet debit settled and the terminal float was credited.
              </p>
            </div>
            <div className="rounded-[20px] border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] px-4 py-4 text-left space-y-2.5">
              <div className="flex justify-between gap-3 text-[12px]">
                <span className="text-[var(--muted)]">Amount funded</span>
                <span className="font-mono font-semibold text-[var(--text)]">
                  {money(fundSuccess.amount)}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-[12px]">
                <span className="text-[var(--muted)]">Terminal</span>
                <span className="text-right font-medium text-[var(--text)]">
                  {fundSuccess.terminalName}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-[12px]">
                <span className="text-[var(--muted)]">Terminal ID</span>
                <span className="font-mono text-[var(--text)]">{fundSuccess.terminalId}</span>
              </div>
              <div className="flex justify-between gap-3 text-[12px]">
                <span className="text-[var(--muted)]">New float</span>
                <span className="font-mono font-semibold text-emerald-500">
                  {money(fundSuccess.newBalance)}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-[12px] pt-1 border-t border-[var(--glass-border)]">
                <span className="text-[var(--muted)]">Reference</span>
                <span className="font-mono text-[11px] text-[var(--text)]">
                  {fundSuccess.reference}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFundSuccess(null)}
              className="glass-cta w-full"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

const fieldClass =
  'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

const SheetHeader: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => (
  <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
    <h3 className="text-[14px] font-semibold text-[var(--text)]">{title}</h3>
    <button
      type="button"
      onClick={onClose}
      className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
      aria-label="Close"
    >
      <Icon name="close" size={16} />
    </button>
  </div>
);

const Keypad: React.FC<{ onDigit: (d: string) => void; onDelete: () => void }> = ({
  onDigit,
  onDelete,
}) => (
  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
      <button
        key={d}
        type="button"
        onClick={() => onDigit(d)}
        className="h-12 rounded-xl glass-chip !rounded-xl font-mono text-lg font-semibold text-[var(--text)] active:scale-95"
      >
        {d}
      </button>
    ))}
    <span />
    <button
      type="button"
      onClick={() => onDigit('0')}
      className="h-12 rounded-xl glass-chip !rounded-xl font-mono text-lg font-semibold text-[var(--text)] active:scale-95"
    >
      0
    </button>
    <button
      type="button"
      onClick={onDelete}
      className="h-12 rounded-xl glass-chip !rounded-xl text-[var(--muted)] active:scale-95 flex items-center justify-center"
      aria-label="Delete"
    >
      <Icon name="arrow_back" size={18} />
    </button>
  </div>
);
