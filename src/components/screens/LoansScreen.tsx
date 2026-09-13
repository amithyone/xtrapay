import React, { useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

type LoansView = 'hub' | 'request' | 'repay';

type ActiveLoan = {
  id: string;
  title: string;
  principal: number;
  outstanding: number;
  dueDate: string;
  tenor: string;
  status: 'Active' | 'Overdue' | 'Settled';
};

type RepaymentEntry = {
  id: string;
  loanTitle: string;
  amount: number;
  date: string;
  reference: string;
};

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const TENORS = ['14 days', '30 days', '60 days', '90 days'];

/**
 * Loans centre — overview, request facility, and repay loan.
 */
export const LoansScreen: React.FC = () => {
  const { requestFacility, overdraftLimit, personalBalance, showToast } = useTransactions();
  const [view, setView] = useState<LoansView>('hub');
  const [loans, setLoans] = useState<ActiveLoan[]>([
    {
      id: 'ln-1',
      title: 'Working capital · Sep',
      principal: 250000,
      outstanding: 187500,
      dueDate: '12 Oct 2026',
      tenor: '30 days',
      status: 'Active',
    },
    {
      id: 'ln-2',
      title: 'POS float boost',
      principal: 100000,
      outstanding: 42000,
      dueDate: '28 Sep 2026',
      tenor: '14 days',
      status: 'Overdue',
    },
  ]);
  const [repayments, setRepayments] = useState<RepaymentEntry[]>([
    {
      id: 'rp-1',
      loanTitle: 'Working capital · Sep',
      amount: 62500,
      date: '05 Sep · 16:10',
      reference: 'XTR-RP-881201',
    },
  ]);

  const [amount, setAmount] = useState('');
  const [tenor, setTenor] = useState('30 days');
  const [pinOpen, setPinOpen] = useState(false);
  const [pinMode, setPinMode] = useState<'request' | 'repay'>('request');
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState('');

  const fieldClass =
    'auth-field w-full h-12 px-4 rounded-2xl text-[var(--text)] text-sm focus:outline-none transition-all placeholder:text-[var(--muted)]';

  const openLoans = useMemo(
    () => loans.filter(l => l.status !== 'Settled'),
    [loans]
  );

  const totalOutstanding = useMemo(
    () => openLoans.reduce((s, l) => s + l.outstanding, 0),
    [openLoans]
  );

  const selectedRepayLoan = openLoans.find(l => l.id === repayLoanId) ?? openLoans[0] ?? null;

  const submitRequest = () => {
    const n = Number(amount.replace(/,/g, ''));
    if (!n || n < 5000) {
      showToast('Invalid amount', 'Minimum loan request is ₦5,000.', 'warning');
      return;
    }
    setPinMode('request');
    setPinOpen(true);
  };

  const openRepayView = (loanId?: string) => {
    const id = loanId ?? openLoans[0]?.id ?? null;
    setRepayLoanId(id);
    const loan = loans.find(l => l.id === id);
    setRepayAmount(loan ? String(loan.outstanding) : '');
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

  const onPinSuccess = () => {
    setPinOpen(false);
    if (pinMode === 'request') {
      const n = Number(amount.replace(/,/g, ''));
      requestFacility({ kind: 'loan', amount: n, tenor });
      setLoans(prev => [
        {
          id: `ln-${Date.now()}`,
          title: `Quick loan · ${tenor}`,
          principal: n,
          outstanding: Math.round(n * 1.025),
          dueDate: tenor.includes('14')
            ? '27 Sep 2026'
            : tenor.includes('60')
              ? '12 Nov 2026'
              : tenor.includes('90')
                ? '12 Dec 2026'
                : '13 Oct 2026',
          tenor,
          status: 'Active',
        },
        ...prev,
      ]);
      setAmount('');
      setView('hub');
      return;
    }

    if (pinMode === 'repay' && repayLoanId) {
      const loan = loans.find(l => l.id === repayLoanId);
      if (!loan) return;
      const pay = Number(repayAmount.replace(/,/g, '')) || 0;
      const applied = Math.min(pay, loan.outstanding, personalBalance);
      if (applied <= 0) {
        showToast('Insufficient balance', 'Fund your wallet to repay.', 'warning');
        return;
      }
      const next = Math.max(0, loan.outstanding - applied);
      setLoans(prev =>
        prev.map(l =>
          l.id === repayLoanId
            ? {
                ...l,
                outstanding: next,
                status: next === 0 ? 'Settled' : l.status === 'Overdue' && next > 0 ? 'Active' : l.status,
              }
            : l
        )
      );
      setRepayments(prev => [
        {
          id: `rp-${Date.now()}`,
          loanTitle: loan.title,
          amount: applied,
          date: 'Just now',
          reference: `XTR-RP-${Math.floor(100000 + Math.random() * 900000)}`,
        },
        ...prev,
      ]);
      showToast(
        next === 0 ? 'Loan settled' : 'Repayment successful',
        next === 0
          ? `${loan.title} is fully repaid.`
          : `${money(applied)} applied · ${money(next)} left on ${loan.title}.`,
        'success'
      );
      setRepayAmount('');
      setView('hub');
    }
  };

  if (view === 'request') {
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
            placeholder="Amount (min ₦5,000)"
          />
          <div className="hub-action-shell !rounded-[28px] p-1.5 grid grid-cols-2 gap-1">
            {TENORS.map(t => (
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
            Indicative interest 2.5% flat. Disbursed to your personal wallet after PIN confirm.
            Overdraft line available: {money(overdraftLimit)}.
          </p>
          <button type="button" onClick={submitRequest} className="glass-cta w-full !rounded-2xl">
            Continue to PIN
          </button>
        </div>

        <PinSheetModal
          isOpen={pinOpen}
          onClose={() => setPinOpen(false)}
          title="Confirm loan request"
          subtitle={`Borrow ${amount ? money(Number(amount.replace(/,/g, ''))) : '—'} · ${tenor}`}
          onSuccess={onPinSuccess}
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
                      setRepayAmount(String(loan.outstanding));
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
                  selectedRepayLoan && setRepayAmount(String(selectedRepayLoan.outstanding))
                }
                className="settings-row flex-1 h-10 rounded-2xl text-[12px] font-semibold bg-[var(--accent)]/12 text-[var(--accent)] appearance-none border-0 cursor-pointer"
              >
                Pay full outstanding
              </button>
              <button
                type="button"
                onClick={() =>
                  selectedRepayLoan &&
                  setRepayAmount(String(Math.min(50000, selectedRepayLoan.outstanding)))
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
          onClose={() => setPinOpen(false)}
          title="Confirm repayment"
          subtitle={
            selectedRepayLoan
              ? `Pay ${repayAmount ? money(Number(repayAmount.replace(/,/g, ''))) : '—'} on ${selectedRepayLoan.title}`
              : 'Enter your transaction PIN'
          }
          amount={Number(repayAmount.replace(/,/g, '')) || undefined}
          onSuccess={onPinSuccess}
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
          Overdraft available {money(overdraftLimit)} · Request or repay from your wallet
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
          {loans.map(loan => (
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
                {loan.status !== 'Settled' && (
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
          ))}
        </div>
      </section>

      <PinSheetModal
        isOpen={pinOpen}
        onClose={() => setPinOpen(false)}
        title="Confirm"
        subtitle="Enter your transaction PIN"
        onSuccess={onPinSuccess}
      />
    </main>
  );
};
