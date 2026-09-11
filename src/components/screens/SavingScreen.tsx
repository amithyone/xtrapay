import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';

export const SavingScreen: React.FC = () => {
  const {
    flexibleSavings,
    strictSavings,
    quickSave,
    withdrawFlexible,
    strictAutoSave,
    setStrictAutoSave,
    accountContext,
    setAccountContext,
    showToast,
    setActiveScreen,
  } = useTransactions();

  const totalSavings = flexibleSavings + strictSavings;
  const flexRatio = totalSavings > 0 ? (flexibleSavings / totalSavings) * 100 : 50;

  const [customModalOpen, setCustomModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [customAmount, setCustomAmount] = useState<string>('5000');
  const [roundUpEnabled, setRoundUpEnabled] = useState<boolean>(true);
  const [reinvestEnabled, setReinvestEnabled] = useState<boolean>(true);
  const [simulatorMonths, setSimulatorMonths] = useState<number>(6);

  const handleChipAction = (amount: number, isDeposit: boolean = true) => {
    if (isDeposit) {
      quickSave(amount);
    } else {
      withdrawFlexible(amount);
    }
  };

  const handleModalSubmit = () => {
    const amt = parseFloat(customAmount.replace(/,/g, ''));
    if (!isNaN(amt) && amt > 0) {
      if (modalMode === 'deposit') {
        quickSave(amt);
      } else {
        withdrawFlexible(amt);
      }
      setCustomModalOpen(false);
    } else {
      showToast('Invalid Amount', 'Please enter a valid amount.', 'warning');
    }
  };

  const projectedInterest = Math.round(5000 * simulatorMonths * (0.142 * (simulatorMonths / 12)));

  const fieldClass =
    'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5" id="saving-screen">
      {/* Context + add */}
      <section className="flex items-center justify-between px-0.5">
        <p className="text-[12px] text-[var(--muted)]">
          {accountContext === 'personal' ? 'Personal high-yield vaults' : 'Business high-yield vaults'}
        </p>
        <button
          type="button"
          aria-label="New Savings Plan"
          onClick={() => {
            setModalMode('deposit');
            setCustomAmount('10000');
            setCustomModalOpen(true);
          }}
          className="glass-chip !rounded-full !px-3 !py-2 text-[12px] font-semibold text-[var(--accent)] flex items-center gap-1.5 active:scale-[0.98]"
        >
          <Icon name="add" size={16} />
          Add savings
        </button>
      </section>

      {/* Personal / business */}
      <section className="space-y-3">
        <div className="glass-card glass-strong flex p-1 !rounded-[18px]">
          <button
            type="button"
            onClick={() => setAccountContext('personal')}
            className={`flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-2 transition-all ${
              accountContext === 'personal'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--muted)]'
            }`}
          >
            <Icon name="person" size={16} />
            Personal
          </button>
          <button
            type="button"
            onClick={() => setAccountContext('business')}
            className={`flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-2 transition-all ${
              accountContext === 'business'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--muted)]'
            }`}
          >
            <Icon name="domain" size={16} />
            Business
          </button>
        </div>
      </section>

      {/* Total balance */}
      <section className="glass-card glass-strong !rounded-[24px] px-5 py-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Total savings balance
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-mono text-[var(--muted)]">₦</span>
              <span className="text-3xl font-mono font-bold tracking-tight text-[var(--text)]">
                {Math.floor(totalSavings).toLocaleString()}
                <span className="text-base font-normal text-[var(--muted)]">
                  .{(totalSavings % 1).toFixed(2).slice(2)}
                </span>
              </span>
            </div>
          </div>
          <span className="glass-chip !rounded-full !px-2.5 !py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            14.2% APY
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-mono text-emerald-600 dark:text-emerald-400">+₦142.80 today</p>
          <button
            type="button"
            onClick={() => {
              setModalMode('deposit');
              setCustomAmount('5000');
              setCustomModalOpen(true);
            }}
            className="h-9 px-3.5 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Icon name="bolt" size={15} />
            Deposit
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span>Flexible {Math.round(flexRatio)}%</span>
            <span>Strict {Math.round(100 - flexRatio)}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-black/[0.06] dark:bg-white/[0.08]">
            <div
              style={{ width: `${flexRatio}%` }}
              className="transition-all duration-500 bg-emerald-500"
              title="Flexible Savings"
            />
            <div
              style={{ width: `${100 - flexRatio}%` }}
              className="transition-all duration-500 bg-[var(--accent)]"
              title="Strict Savings"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--glass-border)] text-[11px] text-[var(--muted)]">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon name="trending_up" size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">₦12,480.20 lifetime interest</span>
          </div>
          <span className="font-mono text-[10px] shrink-0">Payout midnight</span>
        </div>
      </section>

      {/* Active plans */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Active plans
          </p>
          <span className="text-[11px] font-mono text-[var(--muted)]">3 active</span>
        </div>

        {/* Flexible */}
        <div className="glass-card glass-strong !rounded-[20px] p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Icon name="lock_open" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[13px] font-semibold text-[var(--text)]">Flexible Savings</h3>
                <span className="glass-chip !rounded-full !px-2 !py-0.5 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  10.0% APY
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                Instant zero-penalty withdrawals to main wallet
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-xl font-bold text-[var(--text)]">
                ₦{Math.floor(flexibleSavings).toLocaleString()}
                <span className="text-xs font-normal text-[var(--muted)]">
                  .{(flexibleSavings % 1).toFixed(2).slice(2)}
                </span>
              </p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">Daily compounded interest</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleChipAction(1000, true)}
                className="glass-chip !rounded-xl !px-3 !py-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 active:scale-[0.98]"
              >
                +₦1k
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalMode('withdraw');
                  setCustomAmount('1000');
                  setCustomModalOpen(true);
                }}
                className="glass-chip !rounded-xl !px-3 !py-2 text-[11px] font-semibold text-[var(--text)] active:scale-[0.98]"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Strict */}
        <div className="glass-card glass-strong !rounded-[20px] p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]">
              <Icon name="lock" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[13px] font-semibold text-[var(--text)]">Strict Savings</h3>
                <span className="glass-chip !rounded-full !px-2 !py-0.5 text-[10px] font-mono font-semibold text-[var(--accent)]">
                  14.2% APY
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                Target maturity lock with quarterly bonus yield
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-xl font-bold text-[var(--text)]">
                ₦{Math.floor(strictSavings).toLocaleString()}
                <span className="text-xs font-normal text-[var(--muted)]">
                  .{(strictSavings % 1).toFixed(2).slice(2)}
                </span>
              </p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">Shielded against impulse spending</p>
            </div>
            <button
              type="button"
              onClick={() => handleChipAction(5000, true)}
              className="glass-chip !rounded-xl !px-3 !py-2 text-[11px] font-semibold text-[var(--accent)] active:scale-[0.98] shrink-0"
            >
              Lock +₦5k
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] px-3 py-2.5 flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
              <span className="font-medium text-[var(--text)] truncate">
                Matures 19 Aug 2026 · 22 days left
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-[var(--accent)] shrink-0">85%</span>
          </div>
        </div>

        {/* Save together */}
        <div className="glass-card glass-strong !rounded-[20px] p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <Icon name="group" size={18} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[13px] font-semibold text-[var(--text)] truncate">
                    Dubai Retreat 2026 Syndicate
                  </h3>
                  <span className="glass-chip !rounded-full !px-2 !py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                    Group pool
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  Split goals with friends and shared activity
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveScreen('save_together')}
              className="text-[12px] font-semibold text-[var(--accent)] flex items-center gap-0.5 shrink-0"
            >
              View
              <Icon name="arrow_forward" size={14} />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-mono font-semibold text-[var(--text)]">₦1,080,000 / ₦1,500,000</span>
              <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                72%
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden bg-black/[0.06] dark:bg-white/[0.08]">
              <div className="h-full rounded-full bg-sky-500" style={{ width: '72%' }} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center -space-x-2">
              {[
                { initials: 'JD', className: 'bg-black/[0.08] dark:bg-white/10 text-[var(--text)]' },
                { initials: 'AM', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
                { initials: 'TO', className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
                { initials: '+3', className: 'bg-black/[0.04] dark:bg-white/[0.06] text-[var(--muted)]' },
              ].map(member => (
                <div
                  key={member.initials}
                  className={`w-7 h-7 rounded-full border-2 border-[var(--glass-border)] flex items-center justify-center text-[10px] font-bold ${member.className}`}
                >
                  {member.initials}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveScreen('save_together')}
              className="glass-chip !rounded-xl !px-3 !py-2 text-[11px] font-semibold text-[var(--text)] active:scale-[0.98]"
            >
              Contribute ₦10k
            </button>
          </div>
        </div>
      </section>

      {/* Autopilot */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Autopilot rules
          </p>
          <span className="glass-chip !rounded-full !px-2.5 !py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Active
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="glass-card glass-strong !rounded-[20px] px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[var(--text)]">10% inflow auto-route</p>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                Saves 10% into Strict on every received transfer
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={strictAutoSave}
                onChange={e => {
                  setStrictAutoSave(e.target.checked);
                  showToast(
                    'Auto-Save Rule',
                    e.target.checked ? 'Strict 10% Auto-Save armed.' : 'Auto-save paused.'
                  );
                }}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-black/10 dark:bg-white/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]" />
            </label>
          </div>

          <div className="glass-card glass-strong !rounded-[20px] px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[var(--text)]">Spare change round-up</p>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                Rounds spends to nearest ₦100 and saves the difference
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={roundUpEnabled}
                onChange={e => {
                  setRoundUpEnabled(e.target.checked);
                  showToast(
                    'Round-Up Engine',
                    e.target.checked ? 'Spare change round-up enabled.' : 'Round-up paused.'
                  );
                }}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-black/10 dark:bg-white/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]" />
            </label>
          </div>
        </div>
      </section>

      {/* Yield calculator */}
      <section className="glass-card glass-strong !rounded-[24px] px-5 py-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="calculate" size={18} className="text-[var(--accent)]" />
            <span className="text-[13px] font-semibold text-[var(--text)]">Compounding calculator</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
            +₦{projectedInterest.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {[3, 6, 12].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setSimulatorMonths(m)}
              className={`flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                simulatorMonths === m
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'glass-chip !rounded-xl !py-2 text-[var(--muted)]'
              }`}
            >
              {m} mo
            </button>
          ))}
        </div>

        <p className="text-[11px] text-[var(--muted)]">
          ₦5,000/mo into Strict at 14.2% APY projects +₦{projectedInterest.toLocaleString()} over{' '}
          {simulatorMonths} months.
        </p>
      </section>

      {/* Deposit / withdraw modal */}
      {customModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-card glass-strong !rounded-[24px] p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
              <h3 className="text-[14px] font-semibold text-[var(--text)] capitalize">
                {modalMode === 'deposit'
                  ? 'Deposit into flexible'
                  : 'Withdraw from flexible'}
              </h3>
              <button
                type="button"
                onClick={() => setCustomModalOpen(false)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                Amount (₦)
              </label>
              <input
                className={`${fieldClass} text-lg font-mono font-bold`}
                type="text"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder="5,000"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[2000, 5000, 20000].map(amt => {
                const isSelected = customAmount.replace(/,/g, '') === String(amt);
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomAmount(amt.toString())}
                    className={`py-2 rounded-xl text-[11px] font-mono font-semibold transition-all ${
                      isSelected
                        ? 'bg-[var(--accent)]/15 border border-[var(--accent)] text-[var(--accent)]'
                        : 'glass-chip !rounded-xl !py-2 text-[var(--muted)]'
                    }`}
                  >
                    ₦{amt.toLocaleString()}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setCustomModalOpen(false)}
                className="h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--text)] text-[12px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleModalSubmit}
                className="h-11 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold"
              >
                {modalMode === 'deposit' ? 'Confirm deposit' : 'Confirm withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
