import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import {
  apiCreditLoans,
  apiCreditOverview,
  apiLoanRepayments,
  apiRepayLoan,
  mapApiLoan,
  mapApiLoanRepayment,
  type AppLoan,
  type AppLoanRepayment,
} from '../../lib/xtrapayApi';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

type LoansView = 'hub' | 'request' | 'repay';

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const DEFAULT_TENORS = ['14 days', '30 days', '60 days', '90 days'];

/**
 * Loans centre — overview, request facility, repay, active loans + repayment history.
 * Data from /credit/* (no mock seeds).
 */
export const LoansScreen: React.FC = () => {
  const {
    requestFacility,
    overdraftLimit,
    personalBalance,
    refreshBalances,
    showToast,
  } = useTransactions();
  const [view, setView] = useState<LoansView>('hub');
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<AppLoan[]>([]);
  const [repayments, setRepayments] = useState<AppLoanRepayment[]>([]);
  const [overviewOutstanding, setOverviewOutstanding] = useState<number | null>(null);
  const [overdraftUsed, setOverdraftUsed] = useState(0);
  const [minLoanAmount, setMinLoanAmount] = useState(5000);
  const [interestFlat, setInterestFlat] = useState(0.025);
  const [tenors, setTenors] = useState<string[]>(DEFAULT_TENORS);

  const [amount, setAmount] = useState('');
  const [tenor, setTenor] = useState('30 days');
  const [pinOpen, setPinOpen] = useState(false);
  const [pinMode, setPinMode] = useState<'request' | 'repay'>('request');
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const fieldClass =
    'auth-field w-full h-12 px-4 rounded-2xl text-[var(--text)] text-sm focus:outline-none transition-all placeholder:text-[var(--muted)]';

  const loadCredit = useCallback(async () => {
    try {
      const [list, history, overview] = await Promise.all([
        apiCreditLoans().catch(() => [] as AppLoan[]),
        apiLoanRepayments().catch(() => [] as AppLoanRepayment[]),
        apiCreditOverview().catch(() => null),
      ]);
      setLoans(list);
      setRepayments(history);
      if (overview) {
        const out = Number(overview.outstandingLoans ?? overview.outstanding_loans);
        if (!Number.isNaN(out)) setOverviewOutstanding(out);
        const used = Number(overview.overdraftUsed ?? overview.overdraft_used ?? 0);
        if (!Number.isNaN(used)) setOverdraftUsed(used);
        const min = Number(overview.minLoanAmount ?? overview.min_loan_amount);
        if (!Number.isNaN(min) && min > 0) setMinLoanAmount(min);
        const rate = Number(overview.interestRateFlat ?? overview.interest_rate_flat);
        if (!Number.isNaN(rate) && rate > 0) setInterestFlat(rate);
        if (Array.isArray(overview.tenors) && overview.tenors.length) {
          setTenors(overview.tenors.map(String));
          setTenor(prev =>
            overview.tenors!.map(String).includes(prev) ? prev : String(overview.tenors![0])
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCredit();
  }, [loadCredit]);

  const openLoans = useMemo(
    () => loans.filter(l => l.status !== 'Settled'),
    [loans]
  );

  const totalOutstanding = useMemo(() => {
    if (overviewOutstanding != null) return overviewOutstanding;
    return openLoans.reduce((s, l) => s + l.outstanding, 0);
  }, [openLoans, overviewOutstanding]);

  const selectedRepayLoan = openLoans.find(l => l.id === repayLoanId) ?? openLoans[0] ?? null;

  const submitRequest = () => {
    const n = Number(amount.replace(/,/g, ''));
    if (!n || n < minLoanAmount) {
      showToast(
        'Invalid amount',
        `Minimum loan request is ${money(minLoanAmount)}.`,
        'warning'
      );
      return;
    }
    setPinMode('request');
    setPinOpen(true);
  };

  const openRepayView = (loanId?: string) => {
    const id = loanId ?? openLoans[0]?.id ?? null;
    setRepayLoanId(id);
    const loan = loans.find(l => l.id === id);
    setRepayAmount(loan ? String(Math.round(loan.outstanding)) : '');
    setView('repay');
  };

  const submitRepay = () => {
    if (!selectedRepayLoan) {
      showToast('No loan', 'You have no active loan to repay.', 'warning');
      return;
    }
    const n = Number(repayAmount.replace(/,/g, ''));
    if (!n || n < 100) {
      showToast('Invalid amount', 'Enter a repayment of at least ₦100.', 'warning');
      return;
    }
    if (n > selectedRepayLoan.outstanding) {
      showToast('Too high', `Outstanding is only ${money(selectedRepayLoan.outstanding)}.`, 'warning');
      return;
    }
    if (n > personalBalance) {
      showToast('Insufficient balance', 'Fund your wallet to repay this loan.', 'warning');
      return;
    }
    setRepayLoanId(selectedRepayLoan.id);
    setPinMode('repay');
    setPinOpen(true);
  };

  const onPinSuccess = async (pin: string) => {
    if (pinMode === 'request') {
      const n = Number(amount.replace(/,/g, ''));
      setBusy(true);
      try {
        const ok = await requestFacility({ kind: 'loan', amount: n, tenor, pin });
        if (!ok) return;
        setAmount('');
        setView('hub');
        setLoading(true);
        await loadCredit();
        void refreshBalances();
      } finally {
        setBusy(false);
        setPinOpen(false);
      }
      return;
    }

    if (pinMode === 'repay' && repayLoanId) {
      const pay = Number(repayAmount.replace(/,/g, '')) || 0;
      setBusy(true);
      try {
        const res = await apiRepayLoan(repayLoanId, { amount: pay, pin });
        if (res.loan) {
          const mapped = mapApiLoan(res.loan);
          setLoans(prev => {
            const exists = prev.some(l => l.id === mapped.id);
            return exists
              ? prev.map(l => (l.id === mapped.id ? mapped : l))
              : [mapped, ...prev];
          });
        }
        if (res.repayment) {
          setRepayments(prev => [mapApiLoanRepayment(res.repayment!), ...prev]);
        }
        void refreshBalances();
        await loadCredit();
        const left =
          res.outstanding ??
          res.loan?.outstanding ??
          Math.max(0, (selectedRepayLoan?.outstanding ?? 0) - pay);
        showToast(
          Number(left) <= 0 ? 'Loan settled' : 'Repayment successful',
          Number(left) <= 0
            ? `${selectedRepayLoan?.title ?? 'Loan'} is fully repaid.`
            : `${money(pay)} applied · ${money(Number(left))} left.`,
          'success'
        );
        setRepayAmount('');
        setView('hub');
        setPinOpen(false);
      } catch (err) {
        showToast(
          'Repayment failed',
          err instanceof ApiError ? err.message : 'Could not repay this loan.',
          'warning'
        );
      } finally {
        setBusy(false);
      }
    }
  };

  if (loading && view === 'hub') {
    return (
      <main className="flex-1 min-w-0 px-5 pt-4 pb-32" id="loans-screen">
        <p className="text-[13px] text-[var(--muted)] text-center py-16">Loading credit…</p>
      </main>
    );
  }

  if (view === 'request') {
    const ratePct = (interestFlat <= 1 ? interestFlat * 100 : interestFlat).toFixed(1);
    return (
      <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id="loans-request-screen">
        <header className="hub-action-shell !rounded-[28px] px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">Loan request</p>
            <h1 className="mt-2 text-[15px] font-semibold text-[var(--text)] tracking-tight">
              Request facility
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setView('hub')}
            className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
            aria-label="Back to loans"
          >
            <Icon name="close" size={16} />
          </button>
        </header>

        <div className="space-y-3">
          <input
            className={fieldClass}
            inputMode="numeric"
            value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ''))}
            placeholder={`Amount (min ${money(minLoanAmount)})`}
          />
          <div className="hub-action-shell !rounded-[28px] p-1.5 grid grid-cols-2 gap-1">
            {tenors.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTenor(t)}
                className={`settings-row h-10 rounded-2xl text-[12px] font-semibold appearance-none border-0 cursor-pointer ${
                  tenor === t ? 'bg-[var(--accent)] text-white' : 'bg-transparent text-[var(--muted)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-snug px-0.5">
            Indicative interest {ratePct}% flat. Disbursed to your personal wallet after PIN confirm.
            Overdraft line available: {money(overdraftLimit)}
            {overdraftUsed > 0 ? ` · used ${money(overdraftUsed)}` : ''}.
          </p>
          <button type="button" onClick={submitRequest} className="glass-cta w-full !rounded-2xl">
            Continue to PIN
          </button>
        </div>

        <PinSheetModal
          isOpen={pinOpen}
          onClose={() => !busy && setPinOpen(false)}
          title="Confirm loan request"
          subtitle={`Borrow ${amount ? money(Number(amount.replace(/,/g, ''))) : '—'} · ${tenor}`}
          onSuccess={pin => void onPinSuccess(pin)}
        />
      </main>
    );
  }

  if (view === 'repay') {
    return (
      <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id="loans-repay-screen">
        <header className="hub-action-shell !rounded-[28px] px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">Repay loan</p>
            <h1 className="mt-2 text-[15px] font-semibold text-[var(--text)] tracking-tight">
              Pay from wallet
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setView('hub')}
            className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
            aria-label="Back to loans"
          >
            <Icon name="close" size={16} />
          </button>
        </header>

        <div className="hub-action-shell !rounded-[28px] px-4 py-3.5">
          <p className="text-[11px] text-[var(--muted)]">Available wallet balance</p>
          <p className="mt-1 text-[18px] font-semibold text-[var(--text)] tracking-tight">
            {money(personalBalance)}
          </p>
        </div>

        {openLoans.length === 0 ? (
          <div className="hub-action-shell !rounded-[28px] px-4 py-8 text-center">
            <p className="text-[13px] font-semibold text-[var(--text)]">No active loans</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Request a facility when you need float.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
              Select loan
            </p>
            <div className="space-y-2">
              {openLoans.map(loan => {
                const active = selectedRepayLoan?.id === loan.id;
                return (
                  <button
                    key={loan.id}
                    type="button"
                    onClick={() => {
                      setRepayLoanId(loan.id);
                      setRepayAmount(String(Math.round(loan.outstanding)));
                    }}
                    className={`settings-row w-full hub-action-shell !rounded-[28px] px-4 py-3.5 text-left appearance-none border-0 cursor-pointer ${
                      active ? 'ring-2 ring-[var(--accent)]/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text)] truncate">
                          {loan.title}
                        </p>
                        <p className="mt-1 text-[11px] text-[var(--muted)]">
                          Due {loan.dueDate} · {loan.status}
                        </p>
                      </div>
                      <p className="text-[13px] font-semibold text-[var(--text)] shrink-0">
                        {money(loan.outstanding)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <input
              className={fieldClass}
              inputMode="numeric"
              value={repayAmount}
              onChange={e => setRepayAmount(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="Repayment amount"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  selectedRepayLoan &&
                  setRepayAmount(String(Math.round(selectedRepayLoan.outstanding)))
                }
                className="settings-row flex-1 h-10 rounded-2xl text-[12px] font-semibold bg-[var(--accent)]/12 text-[var(--accent)] appearance-none border-0 cursor-pointer"
              >
                Pay full outstanding
              </button>
              <button
                type="button"
                onClick={() =>
                  selectedRepayLoan &&
                  setRepayAmount(
                    String(Math.min(50000, Math.round(selectedRepayLoan.outstanding)))
                  )
                }
                className="settings-row flex-1 h-10 rounded-2xl text-[12px] font-semibold bg-black/5 dark:bg-white/10 text-[var(--muted)] appearance-none border-0 cursor-pointer"
              >
                ₦50,000
              </button>
            </div>
            <button type="button" onClick={submitRepay} className="glass-cta w-full !rounded-2xl">
              Continue to PIN
            </button>
          </div>
        )}

        <section className="space-y-2">
          <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Recent repayments
          </p>
          <div className="glass-card glass-strong settings-list !rounded-[24px] overflow-hidden divide-y divide-[var(--glass-border)]">
            {repayments.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px] text-[var(--muted)]">No repayments yet</p>
            ) : (
              repayments.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                    <Icon name="check" size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[var(--text)] truncate">{r.loanTitle}</p>
                    <p className="text-[11px] text-[var(--muted)]">
                      {r.date} · {r.reference}
                    </p>
                  </div>
                  <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-300 shrink-0">
                    {money(r.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <PinSheetModal
          isOpen={pinOpen}
          onClose={() => !busy && setPinOpen(false)}
          title="Confirm repayment"
          subtitle={
            selectedRepayLoan
              ? `Pay ${repayAmount ? money(Number(repayAmount.replace(/,/g, ''))) : '—'} on ${selectedRepayLoan.title}`
              : 'Enter your transaction PIN'
          }
          amount={Number(repayAmount.replace(/,/g, '')) || undefined}
          onSuccess={pin => void onPinSuccess(pin)}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id="loans-screen">
      <header className="hub-action-shell !rounded-[28px] px-4 py-3.5">
        <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">Credit facilities</p>
        <h1 className="mt-2 text-[15px] font-semibold text-[var(--text)] tracking-tight">
          Outstanding · {money(totalOutstanding)}
        </h1>
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          Overdraft available {money(overdraftLimit)}
          {overdraftUsed > 0 ? ` · used ${money(overdraftUsed)}` : ''} · Request or repay from your
          wallet
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setView('request')}
          className="settings-row hub-action-shell !rounded-[28px] px-4 py-4 text-left appearance-none border-0 cursor-pointer"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
            <Icon name="hand_coins" size={18} />
          </span>
          <p className="mt-3 text-[13px] font-semibold text-[var(--text)]">Loan request</p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">Borrow to wallet</p>
        </button>
        <button
          type="button"
          onClick={() => openRepayView()}
          className="settings-row hub-action-shell !rounded-[28px] px-4 py-4 text-left appearance-none border-0 cursor-pointer"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
            <Icon name="payments" size={18} />
          </span>
          <p className="mt-3 text-[13px] font-semibold text-[var(--text)]">Repay loan</p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">Pay from wallet</p>
        </button>
      </div>

      <section className="space-y-2">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Active loans
        </p>
        <div className="space-y-2.5">
          {loans.length === 0 ? (
            <div className="hub-action-shell !rounded-[28px] px-4 py-8 text-center">
              <p className="text-[13px] font-semibold text-[var(--text)]">No loans yet</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Request a loan to borrow into your wallet.
              </p>
            </div>
          ) : (
            loans.map(loan => (
              <article
                key={loan.id}
                className="hub-action-shell !rounded-[28px] px-4 py-3.5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--text)] truncate">{loan.title}</p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">
                      Due {loan.dueDate} · {loan.tenor}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${
                      loan.status === 'Overdue'
                        ? 'bg-rose-500/15 text-rose-500'
                        : loan.status === 'Settled'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : loan.status === 'Pending'
                            ? 'bg-amber-500/15 text-amber-600'
                            : 'bg-[var(--accent)]/12 text-[var(--accent)]'
                    }`}
                  >
                    {loan.status}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] text-[var(--muted)]">Outstanding</p>
                    <p className="text-[16px] font-semibold text-[var(--text)] tracking-tight">
                      {money(loan.outstanding)}
                    </p>
                  </div>
                  {loan.status !== 'Settled' && loan.status !== 'Pending' && (
                    <button
                      type="button"
                      onClick={() => openRepayView(loan.id)}
                      className="settings-row h-9 px-3 rounded-xl bg-[var(--accent)] text-white text-[12px] font-semibold appearance-none border-0 cursor-pointer"
                    >
                      Repay
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
};
