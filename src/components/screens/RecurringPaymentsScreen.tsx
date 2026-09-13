import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { INITIAL_BENEFICIARIES } from '../../data/initialData';
import { ApiError } from '../../lib/api';
import { apiNameEnquiry } from '../../lib/xtrapayApi';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

type ScheduleMode = 'end_of_month' | 'custom';
type CustomCadence = 'daily' | 'weekly' | 'monthly' | 'every_n_days';
type ViewMode = 'list' | 'create';

interface RecurringPlan {
  id: string;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  narration: string;
  scheduleLabel: string;
  nextRun: string;
  active: boolean;
}

interface RecurringRun {
  id: string;
  planId: string;
  recipientName: string;
  amount: number;
  status: 'Successful' | 'Failed' | 'Pending';
  date: string;
  time: string;
  reference: string;
}

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function lastDayOfThisOrNextMonthLabel(): string {
  const now = new Date(2026, 8, 13);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  if (now.getDate() >= end.getDate()) {
    const nextEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return nextEnd.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return end.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function nextCustomRunLabel(
  cadence: CustomCadence,
  dayOfMonth: number,
  everyNDays: number
): string {
  if (cadence === 'daily') return 'Tomorrow';
  if (cadence === 'weekly') return 'Next Monday';
  if (cadence === 'every_n_days') return `In ${Math.max(1, everyNDays)} day(s)`;
  const d = Math.min(28, Math.max(1, dayOfMonth));
  return `${String(d).padStart(2, '0')} Oct 2026`;
}

/**
 * Recurring payments — list first, create via bank-transfer flow, delete + run history.
 */
export const RecurringPaymentsScreen: React.FC = () => {
  const { personalBalance, showToast, banks, banksLoading } = useTransactions();
  const [view, setView] = useState<ViewMode>('list');
  const nameEnquirySeq = useRef(0);
  const [nameLoading, setNameLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [plans, setPlans] = useState<RecurringPlan[]>([
    {
      id: 'rcp-1',
      recipientName: 'LANDLORD LEKKI',
      bankName: 'Zenith Bank',
      accountNumber: '0124892019',
      amount: 850_000,
      narration: 'Rent · Lekki',
      scheduleLabel: 'Every end of month',
      nextRun: '30 Sep 2026',
      active: true,
    },
    {
      id: 'rcp-2',
      recipientName: 'MULTICHOICE NG',
      bankName: 'GTBank',
      accountNumber: '0044211988',
      amount: 24_500,
      narration: 'DSTV Compact',
      scheduleLabel: 'Custom · Day 15 monthly',
      nextRun: '15 Sep 2026',
      active: true,
    },
    {
      id: 'rcp-3',
      recipientName: 'MTN NIGERIA',
      bankName: 'Xtrapay Wallet',
      accountNumber: '08034129981',
      amount: 2_000,
      narration: 'Airtime · Self',
      scheduleLabel: 'Custom · Weekly',
      nextRun: 'Fri · 18 Sep',
      active: false,
    },
  ]);

  const [runs] = useState<RecurringRun[]>([
    {
      id: 'rr-1',
      planId: 'rcp-1',
      recipientName: 'LANDLORD LEKKI',
      amount: 850_000,
      status: 'Successful',
      date: '31 Aug 2026',
      time: '23:58',
      reference: 'RCP-20260831-88421',
    },
    {
      id: 'rr-2',
      planId: 'rcp-2',
      recipientName: 'MULTICHOICE NG',
      amount: 24_500,
      status: 'Successful',
      date: '15 Aug 2026',
      time: '06:02',
      reference: 'RCP-20260815-44102',
    },
    {
      id: 'rr-3',
      planId: 'rcp-1',
      recipientName: 'LANDLORD LEKKI',
      amount: 850_000,
      status: 'Failed',
      date: '31 Jul 2026',
      time: '23:59',
      reference: 'RCP-20260731-22918',
    },
    {
      id: 'rr-4',
      planId: 'rcp-2',
      recipientName: 'MULTICHOICE NG',
      amount: 24_500,
      status: 'Successful',
      date: '15 Jul 2026',
      time: '06:01',
      reference: 'RCP-20260715-11028',
    },
  ]);

  // Create form state
  const [channel, setChannel] = useState<'bank' | 'wallet'>('bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState('Access Bank');
  const [amountStr, setAmountStr] = useState('50,000');
  const [narration, setNarration] = useState('Monthly rent');
  const [recipientName, setRecipientName] = useState('');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('end_of_month');
  const [customCadence, setCustomCadence] = useState<CustomCadence>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState(28);
  const [everyNDays, setEveryNDays] = useState(14);
  const [pinOpen, setPinOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!banks.length) return;
    if (!banks.some(b => b.name === selectedBank)) {
      setSelectedBank(banks[0].name);
    }
  }, [banks, selectedBank]);

  const selectedBankMeta = useMemo(
    () => banks.find(b => b.name === selectedBank) ?? null,
    [banks, selectedBank]
  );

  useEffect(() => {
    if (view !== 'create' || channel !== 'bank') return;
    const acct = accountNumber.replace(/\D/g, '');
    if (acct.length !== 10 || !selectedBankMeta?.code) return;

    const seq = ++nameEnquirySeq.current;
    setNameLoading(true);
    setRecipientName('');

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await apiNameEnquiry({
            accountNumber: acct,
            bankCode: selectedBankMeta.code,
            bankName: selectedBankMeta.name,
          });
          if (seq !== nameEnquirySeq.current) return;
          setRecipientName(result.accountName);
        } catch (err) {
          if (seq !== nameEnquirySeq.current) return;
          setRecipientName('');
          showToast(
            'Name enquiry failed',
            err instanceof ApiError ? err.message : 'Could not resolve account name.',
            'warning'
          );
        } finally {
          if (seq === nameEnquirySeq.current) setNameLoading(false);
        }
      })();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [accountNumber, selectedBankMeta, channel, view, showToast]);

  const fieldClass =
    'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

  const schedulePreview = useMemo(() => {
    if (scheduleMode === 'end_of_month') {
      return {
        label: 'Every end of month',
        nextRun: lastDayOfThisOrNextMonthLabel(),
      };
    }
    if (customCadence === 'daily') {
      return { label: 'Custom · Daily', nextRun: nextCustomRunLabel('daily', dayOfMonth, everyNDays) };
    }
    if (customCadence === 'weekly') {
      return { label: 'Custom · Weekly', nextRun: nextCustomRunLabel('weekly', dayOfMonth, everyNDays) };
    }
    if (customCadence === 'every_n_days') {
      return {
        label: `Custom · Every ${Math.max(1, everyNDays)} days`,
        nextRun: nextCustomRunLabel('every_n_days', dayOfMonth, everyNDays),
      };
    }
    return {
      label: `Custom · Day ${dayOfMonth} monthly`,
      nextRun: nextCustomRunLabel('monthly', dayOfMonth, everyNDays),
    };
  }, [scheduleMode, customCadence, dayOfMonth, everyNDays]);

  const openCreate = () => {
    setChannel('bank');
    setAccountNumber('');
    setSelectedBank('Access Bank');
    setAmountStr('50,000');
    setNarration('Monthly rent');
    setRecipientName('');
    setNameLoading(false);
    setScheduleMode('end_of_month');
    setCustomCadence('monthly');
    setDayOfMonth(28);
    setEveryNDays(14);
    setView('create');
  };

  const handleSelectBeneficiary = (ben: (typeof INITIAL_BENEFICIARIES)[0]) => {
    setAccountNumber(ben.accountNumber);
    setSelectedBank(ben.bank);
    setRecipientName('');
    showToast('Beneficiary Selected', `${ben.name} (${ben.bank}) — verifying name…`);
  };

  const handleProceed = () => {
    const numericAmount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('Invalid Amount', 'Please enter a valid transfer amount.', 'warning');
      return;
    }
    if (channel === 'bank' && accountNumber.replace(/\D/g, '').length < 10) {
      showToast('Invalid Account', 'Enter a valid 10-digit account number.', 'warning');
      return;
    }
    if (channel === 'bank' && (nameLoading || !recipientName.trim())) {
      showToast(
        'Name enquiry required',
        nameLoading
          ? 'Wait for the account name to resolve.'
          : 'Account name could not be verified yet.',
        'warning'
      );
      return;
    }
    if (numericAmount > personalBalance) {
      showToast('Insufficient Funds', 'Amount exceeds your current wallet balance.', 'warning');
      return;
    }
    setPinOpen(true);
  };

  const handlePinSuccess = () => {
    const numericAmount = parseFloat(amountStr.replace(/,/g, '')) || 0;
    const next: RecurringPlan = {
      id: `rcp-${Date.now()}`,
      recipientName: recipientName || 'BENEFICIARY RECIPIENT',
      bankName: channel === 'wallet' ? 'Xtrapay Wallet' : selectedBank,
      accountNumber,
      amount: numericAmount,
      narration: narration.trim() || 'Recurring transfer',
      scheduleLabel: schedulePreview.label,
      nextRun: schedulePreview.nextRun,
      active: true,
    };
    setPlans(prev => [next, ...prev]);
    setPinOpen(false);
    setView('list');
    showToast(
      'Recurring Transfer Set',
      `${money(numericAmount)} to ${next.recipientName} · ${next.scheduleLabel}`,
      'success'
    );
  };

  const togglePlan = (id: string) => {
    setPlans(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, active: !p.active } : p));
      const plan = next.find(p => p.id === id);
      if (plan) {
        showToast(
          plan.active ? 'Resumed' : 'Paused',
          `${plan.recipientName} is now ${plan.active ? 'active' : 'paused'}.`,
          'info'
        );
      }
      return next;
    });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const plan = plans.find(p => p.id === deleteId);
    setPlans(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
    showToast(
      'Schedule Deleted',
      plan
        ? `${plan.recipientName} recurring transfer was removed.`
        : 'Recurring schedule removed.',
      'info'
    );
  };

  /* ───────── LIST VIEW ───────── */
  if (view === 'list') {
    return (
      <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="recurring-screen">
        <button
          type="button"
          onClick={openCreate}
          className="glass-cta w-full !rounded-2xl flex items-center justify-center gap-2"
        >
          <Icon name="add" size={16} />
          Add recurring payment
        </button>

        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Your schedules · {plans.length}
          </p>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="settings-row text-[11px] font-semibold text-[var(--accent)] bg-transparent border-0 appearance-none cursor-pointer p-0 inline-flex items-center gap-1"
          >
            <Icon name="receipt_long" size={14} />
            Run history
          </button>
        </div>

        {plans.length === 0 ? (
          <section className="glass-card glass-strong settings-list !rounded-[24px] px-5 py-10 text-center space-y-3">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
              <Icon name="autorenew" size={22} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[var(--text)]">No recurring payments</p>
              <p className="mt-1 text-[12px] text-[var(--muted)]">
                Set up an auto-transfer like rent or DSTV.
              </p>
            </div>
          </section>
        ) : (
          <div className="space-y-2.5">
            {plans.map(plan => (
              <div
                key={plan.id}
                className="glass-card glass-strong settings-list !rounded-[22px] px-4 py-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold text-[var(--text)] truncate">
                        {plan.recipientName}
                      </p>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                          plan.active
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                            : 'border-[var(--glass-border)] text-[var(--muted)]'
                        }`}
                      >
                        {plan.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--muted)] truncate">
                      {plan.bankName} · {plan.accountNumber}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)] truncate">{plan.narration}</p>
                  </div>
                  <p className="text-[13px] font-semibold font-mono text-[var(--text)] shrink-0">
                    {money(plan.amount)}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--glass-border)] space-y-2.5">
                  <p className="text-[11px] text-[var(--muted)] flex items-center gap-1.5">
                    <Icon name="schedule" size={12} />
                    {plan.scheduleLabel} · Next {plan.nextRun}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePlan(plan.id)}
                      className="settings-row flex-1 h-9 rounded-xl border border-[var(--glass-border)] text-[11px] font-semibold text-[var(--text)] appearance-none cursor-pointer bg-black/[0.03] dark:bg-white/[0.05]"
                    >
                      {plan.active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryOpen(true);
                      }}
                      className="settings-row flex-1 h-9 rounded-xl border border-[var(--glass-border)] text-[11px] font-semibold text-[var(--text)] appearance-none cursor-pointer bg-black/[0.03] dark:bg-white/[0.05]"
                    >
                      History
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(plan.id)}
                      className="settings-row h-9 w-9 shrink-0 rounded-xl border border-rose-500/30 text-rose-500 appearance-none cursor-pointer bg-rose-500/10 flex items-center justify-center"
                      aria-label="Delete schedule"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Run history sheet */}
        {historyOpen && (
          <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
            <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
                <h3 className="text-[14px] font-semibold text-[var(--text)]">Run history</h3>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                  aria-label="Close"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>

              {runs.length === 0 ? (
                <p className="text-center text-[12px] text-[var(--muted)] py-8">
                  No runs yet. Scheduled transfers will appear here.
                </p>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {runs.map(run => (
                    <div
                      key={run.id}
                      className="rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.04] px-3.5 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--text)] truncate">
                            {run.recipientName}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                            {run.date} · {run.time}
                          </p>
                          <p className="mt-0.5 text-[10px] font-mono text-[var(--muted)] truncate">
                            {run.reference}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[12px] font-semibold font-mono text-[var(--text)]">
                            {money(run.amount)}
                          </p>
                          <p
                            className={`mt-1 text-[10px] font-semibold ${
                              run.status === 'Successful'
                                ? 'text-emerald-500'
                                : run.status === 'Failed'
                                  ? 'text-rose-500'
                                  : 'text-amber-500'
                            }`}
                          >
                            {run.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteId && (
          <div className="app-modal-overlay z-[80] bg-black/70 backdrop-blur-md">
            <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-5 space-y-4 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
                <Icon name="warning" size={22} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--text)]">Delete schedule?</h3>
                <p className="mt-1.5 text-[12px] text-[var(--muted)] leading-snug">
                  This stops future auto-transfers. Past run history is kept.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="h-11 rounded-2xl border border-[var(--glass-border)] text-[13px] font-semibold text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="h-11 rounded-2xl bg-rose-500 text-white text-[13px] font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  /* ───────── CREATE VIEW ───────── */
  return (
    <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-5" id="recurring-create-screen">
      <button
        type="button"
        onClick={() => setView('list')}
        className="settings-row inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] bg-transparent border-0 p-0 appearance-none cursor-pointer"
      >
        <Icon name="arrow_back" size={16} />
        Your schedules
      </button>

      <div className="glass-card glass-strong settings-list flex p-1 !rounded-[18px]">
        <button
          type="button"
          onClick={() => setChannel('bank')}
          className={`settings-row flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-2 appearance-none border-0 cursor-pointer ${
            channel === 'bank'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'bg-transparent text-[var(--muted)]'
          }`}
        >
          <Icon name="account_balance" size={16} />
          Bank
        </button>
        <button
          type="button"
          onClick={() => setChannel('wallet')}
          className={`settings-row flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-2 appearance-none border-0 cursor-pointer ${
            channel === 'wallet'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'bg-transparent text-[var(--muted)]'
          }`}
        >
          <Icon name="wallet" size={16} />
          Wallet
        </button>
      </div>

      <section className="glass-card glass-strong settings-list !rounded-[24px] px-5 py-5 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            Account number
          </label>
          <div className="flex items-center gap-2">
            <input
              className={`${fieldClass} font-mono flex-1`}
              inputMode="numeric"
              maxLength={10}
              value={accountNumber}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                setAccountNumber(val);
                if (val.length !== 10) {
                  nameEnquirySeq.current += 1;
                  setNameLoading(false);
                  setRecipientName('');
                }
              }}
              placeholder="0000000000"
              type="text"
            />
            <button
              type="button"
              aria-label="Beneficiaries"
              onClick={() => handleSelectBeneficiary(INITIAL_BENEFICIARIES[0])}
              className="frosted-pad !h-12 !w-12 !min-h-12 !min-w-12 !rounded-2xl text-[var(--accent)] shrink-0"
            >
              <Icon name="contacts" size={18} />
            </button>
          </div>
        </div>

        {channel === 'bank' && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Destination bank
              {banksLoading
                ? ' · loading…'
                : banks.length
                  ? ` · ${banks.length.toLocaleString()} from backend`
                  : ''}
            </label>
            <div className="relative">
              <select
                value={selectedBank}
                onChange={e => setSelectedBank(e.target.value)}
                className={`${fieldClass} appearance-none pr-10 cursor-pointer`}
              >
                {banks.map(bank => (
                  <option key={bank.id} value={bank.name}>
                    {bank.name}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                size={18}
                className="text-[var(--muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>
        )}

        {nameLoading && (
          <div className="rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.04] px-3.5 py-2.5 flex items-center gap-2">
            <Icon name="sync" size={16} className="text-[var(--accent)] shrink-0 animate-spin" />
            <p className="text-[12px] text-[var(--muted)]">Resolving account name…</p>
          </div>
        )}

        {recipientName && !nameLoading && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 flex items-center gap-2">
            <Icon name="verified" size={16} className="text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-600/80 dark:text-emerald-400/80">
                Name enquiry
              </p>
              <p className="text-[13px] font-semibold text-[var(--text)] truncate">{recipientName}</p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Amount
            </label>
            <span className="text-[11px] text-[var(--muted)]">
              Bal{' '}
              <span className="font-mono font-semibold text-[var(--text)]">
                {money(personalBalance)}
              </span>
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg text-[var(--accent)]">
              ₦
            </span>
            <input
              className={`${fieldClass} !pl-9 font-mono text-xl h-14`}
              inputMode="decimal"
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
              placeholder="0.00"
              type="text"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[5000, 10000, 25000, 50000].map(val => {
              const isSelected = amountStr.replace(/,/g, '') === String(val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountStr(val.toLocaleString())}
                  className={`settings-chip py-2 rounded-xl text-[11px] font-mono font-semibold ${
                    isSelected
                      ? 'bg-[var(--accent)]/15 border border-[var(--accent)] text-[var(--accent)]'
                      : 'glass-chip !rounded-xl !px-1 !py-2 text-[var(--muted)] border border-transparent'
                  }`}
                >
                  ₦{val.toLocaleString()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            Narration
          </label>
          <input
            className={`${fieldClass} !h-11`}
            placeholder="What's this for? (optional)"
            type="text"
            value={narration}
            onChange={e => setNarration(e.target.value)}
          />
        </div>
      </section>

      <section className="glass-card glass-strong settings-list !rounded-[24px] px-5 py-5 space-y-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            Recurring timer
          </p>
          <p className="mt-1 text-[12px] text-[var(--muted)] leading-snug">
            Choose when this transfer repeats automatically.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setScheduleMode('end_of_month')}
            className={`settings-row rounded-2xl px-3 py-3 text-left border appearance-none cursor-pointer ${
              scheduleMode === 'end_of_month'
                ? 'border-[var(--accent)]/55 ring-1 ring-[var(--accent)]/30 bg-[var(--accent)]/8'
                : 'border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.04]'
            }`}
          >
            <p className="text-[13px] font-semibold text-[var(--text)]">End of month</p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">Last day · every month</p>
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode('custom')}
            className={`settings-row rounded-2xl px-3 py-3 text-left border appearance-none cursor-pointer ${
              scheduleMode === 'custom'
                ? 'border-[var(--accent)]/55 ring-1 ring-[var(--accent)]/30 bg-[var(--accent)]/8'
                : 'border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.04]'
            }`}
          >
            <p className="text-[13px] font-semibold text-[var(--text)]">Custom</p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">Pick your own cadence</p>
          </button>
        </div>

        {scheduleMode === 'custom' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['daily', 'Daily'],
                  ['weekly', 'Weekly'],
                  ['monthly', 'Monthly'],
                  ['every_n_days', 'Every N days'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCustomCadence(id)}
                  className={`settings-chip h-9 rounded-xl text-[12px] font-semibold border ${
                    customCadence === id
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'border-[var(--glass-border)] text-[var(--muted)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {customCadence === 'monthly' && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                  Day of month
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={dayOfMonth}
                  onChange={e =>
                    setDayOfMonth(Math.min(28, Math.max(1, Number(e.target.value) || 1)))
                  }
                  className={`${fieldClass} font-mono`}
                />
              </div>
            )}

            {customCadence === 'every_n_days' && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                  Repeat every (days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={everyNDays}
                  onChange={e =>
                    setEveryNDays(Math.min(90, Math.max(1, Number(e.target.value) || 1)))
                  }
                  className={`${fieldClass} font-mono`}
                />
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.04] px-3.5 py-3 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
            <Icon name="schedule" size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-[var(--text)]">{schedulePreview.label}</p>
            <p className="text-[11px] text-[var(--muted)]">Next run · {schedulePreview.nextRun}</p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={handleProceed}
        className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/25"
      >
        Schedule recurring transfer
        <Icon name="arrow_forward" size={18} />
      </button>

      <PinSheetModal
        isOpen={pinOpen}
        onClose={() => setPinOpen(false)}
        title="Authorize Recurring"
        subtitle={`${schedulePreview.label} · Next ${schedulePreview.nextRun}`}
        amount={parseFloat(amountStr.replace(/,/g, '')) || undefined}
        recipient={recipientName}
        onSuccess={handlePinSuccess}
      />
    </main>
  );
};
