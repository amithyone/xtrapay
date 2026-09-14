import React, { useEffect, useRef, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import type { SavingsPlan, SavingsPlanType } from '../../types';
import { Icon } from '../Icon';

const fieldClass =
  'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

function money(n: number) {
  const abs = Math.abs(n);
  const whole = Math.floor(abs).toLocaleString();
  const frac = (abs % 1).toFixed(2).slice(2);
  return { whole, frac, sign: n < 0 ? '-' : '' };
}

function planTypeLabel(type: SavingsPlanType) {
  if (type === 'fixed') return 'Fixed';
  if (type === 'spend_and_save') return 'Spend & save';
  return 'Flexible';
}

function planIcon(type: SavingsPlanType) {
  if (type === 'fixed') return 'lock';
  if (type === 'spend_and_save') return 'bolt';
  return 'lock_open';
}

function planAccent(type: SavingsPlanType) {
  if (type === 'fixed') return 'bg-[var(--accent)]/15 text-[var(--accent)]';
  if (type === 'spend_and_save') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
}

export const SavingScreen: React.FC = () => {
  const {
    flexibleSavings,
    strictSavings,
    savingsPlans,
    savingsMeta,
    refreshSavings,
    createSavingsPlan,
    quickSave,
    withdrawFlexible,
    strictAutoSave,
    toggleStrictAutoSave,
    accountContext,
    setAccountContext,
    showToast,
    setActiveScreen,
    groupPots,
  } = useTransactions();

  const totalSavings =
    savingsPlans.length > 0
      ? savingsPlans.reduce((s, p) => s + p.balance, 0)
      : flexibleSavings + strictSavings;
  const flexRatio = totalSavings > 0 ? (flexibleSavings / totalSavings) * 100 : 50;

  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [customAmount, setCustomAmount] = useState('5000');
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<'type' | 'details'>('type');
  const [planType, setPlanType] = useState<SavingsPlanType>('flexible');
  const [planName, setPlanName] = useState('');
  const [initialAmount, setInitialAmount] = useState('5,000');
  const [targetAmount, setTargetAmount] = useState('100,000');
  const [maturityDays, setMaturityDays] = useState('90');
  const [savePercent, setSavePercent] = useState('10');
  const [creating, setCreating] = useState(false);
  const [roundUpEnabled, setRoundUpEnabled] = useState(false);
  const [simulatorMonths, setSimulatorMonths] = useState(6);

  const refreshRef = useRef(refreshSavings);
  refreshRef.current = refreshSavings;

  useEffect(() => {
    void refreshRef.current();
  }, []);

  const openCreate = () => {
    setCreateStep('type');
    setPlanType('flexible');
    setPlanName('');
    setInitialAmount('5,000');
    setTargetAmount('100,000');
    setMaturityDays('90');
    setSavePercent('10');
    setCreateOpen(true);
  };

  const handleChipAction = async (amount: number, isDeposit: boolean = true) => {
    if (isDeposit) await quickSave(amount);
    else await withdrawFlexible(amount);
  };

  const handleModalSubmit = async () => {
    const amt = parseFloat(customAmount.replace(/,/g, ''));
    if (isNaN(amt) || amt <= 0) {
      showToast('Invalid Amount', 'Please enter a valid amount.', 'warning');
      return;
    }
    const ok =
      modalMode === 'deposit' ? await quickSave(amt) : await withdrawFlexible(amt);
    if (ok) setCustomModalOpen(false);
  };

  const handleCreatePlan = async () => {
    const name = planName.trim() || `${planTypeLabel(planType)} plan`;
    const initial = parseFloat(initialAmount.replace(/,/g, '')) || 0;
    const target = parseFloat(targetAmount.replace(/,/g, '')) || 0;
    const pct = parseFloat(savePercent) || 0;
    const days = parseInt(maturityDays, 10) || 90;

    if (planType === 'spend_and_save') {
      if (pct < 1 || pct > 100) {
        showToast('Invalid percentage', 'Enter a save percentage between 1 and 100.', 'warning');
        return;
      }
    }
    if (planType === 'fixed' && target <= 0) {
      showToast('Target required', 'Set a fixed savings target amount.', 'warning');
      return;
    }

    setCreating(true);
    try {
      const maturityDate =
        planType === 'fixed'
          ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
          : undefined;
      const ok = await createSavingsPlan({
        name,
        type: planType,
        initialAmount:
          planType === 'spend_and_save' ? undefined : initial > 0 ? initial : undefined,
        targetAmount: planType === 'fixed' ? target : undefined,
        maturityDate,
        percentage: planType === 'spend_and_save' ? pct : undefined,
      });
      if (ok) setCreateOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const projectedInterest = Math.round(5000 * simulatorMonths * (0.142 * (simulatorMonths / 12)));
  const blended =
    savingsMeta.blendedApy > 0
      ? savingsMeta.blendedApy
      : savingsPlans.find(p => p.apy)?.apy || 0;
  const interestToday = savingsMeta.interestToday;
  const lifetime = savingsMeta.lifetimeInterest;
  const activePots = groupPots.filter(p => p.myStatus === 'Active');

  const typeChip = (type: SavingsPlanType, title: string, subtitle: string, icon: string) => {
    const active = planType === type;
    return (
      <button
        type="button"
        onClick={() => setPlanType(type)}
        className={`w-full text-left rounded-2xl border px-3.5 py-3 transition-all active:scale-[0.99] ${
          active
            ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10'
            : 'border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05]'
        }`}
      >
        <div className="flex items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${planAccent(type)}`}>
            <Icon name={icon} size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[var(--text)]">{title}</p>
            <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">{subtitle}</p>
          </div>
        </div>
      </button>
    );
  };

  const renderPlanCard = (plan: SavingsPlan) => {
    const bal = money(plan.balance);
    const progress =
      plan.type === 'fixed' && plan.targetAmount && plan.targetAmount > 0
        ? Math.min(100, Math.round((plan.balance / plan.targetAmount) * 100))
        : null;
    return (
      <div key={plan.id} className="glass-card glass-strong !rounded-[20px] p-4 space-y-3">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${planAccent(plan.type)}`}
          >
            <Icon name={planIcon(plan.type)} size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[13px] font-semibold text-[var(--text)] truncate">{plan.name}</h3>
              <span className="glass-chip !rounded-full !px-2 !py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                {planTypeLabel(plan.type)}
              </span>
              {plan.apy != null && plan.apy > 0 && (
                <span className="glass-chip !rounded-full !px-2 !py-0.5 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {plan.apy.toFixed(1)}% APY
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              {plan.type === 'flexible' && 'Withdraw anytime to your wallet'}
              {plan.type === 'fixed' &&
                (plan.maturityDate
                  ? `Locked until ${plan.maturityDate}`
                  : 'Locked until maturity')}
              {plan.type === 'spend_and_save' &&
                `Auto-saves ${plan.percentage ?? 0}% of spends / inflows`}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xl font-bold text-[var(--text)]">
              ₦{bal.whole}
              <span className="text-xs font-normal text-[var(--muted)]">.{bal.frac}</span>
            </p>
            {plan.type === 'spend_and_save' && (
              <p className="text-[10px] text-[var(--muted)] mt-0.5">
                {plan.percentage ?? 0}% on every eligible transaction
              </p>
            )}
            {plan.type === 'fixed' && plan.targetAmount != null && (
              <p className="text-[10px] text-[var(--muted)] mt-0.5">
                Target ₦{plan.targetAmount.toLocaleString()}
              </p>
            )}
          </div>
          {plan.type === 'flexible' && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => void handleChipAction(1000, true)}
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
          )}
          {plan.type === 'fixed' && (
            <button
              type="button"
              onClick={() => {
                setModalMode('deposit');
                setCustomAmount('5000');
                setCustomModalOpen(true);
              }}
              className="glass-chip !rounded-xl !px-3 !py-2 text-[11px] font-semibold text-[var(--accent)] active:scale-[0.98] shrink-0"
            >
              Lock more
            </button>
          )}
        </div>

        {progress != null && (
          <div className="rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] px-3 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--muted)]">Progress to target</span>
              <span className="font-mono font-bold text-[var(--accent)]">{progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/[0.06] dark:bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const total = money(totalSavings);

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5" id="saving-screen">
      <section className="flex items-center justify-between px-0.5">
        <p className="text-[12px] text-[var(--muted)]">
          {accountContext === 'personal' ? 'Personal high-yield vaults' : 'Business high-yield vaults'}
        </p>
        <button
          type="button"
          aria-label="New Savings Plan"
          onClick={openCreate}
          className="glass-chip !rounded-full !px-3 !py-2 text-[12px] font-semibold text-[var(--accent)] flex items-center gap-1.5 active:scale-[0.98]"
        >
          <Icon name="add" size={16} />
          Add savings
        </button>
      </section>

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

      <section className="glass-card glass-strong !rounded-[24px] px-5 py-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Total savings balance
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-mono text-[var(--muted)]">₦</span>
              <span className="text-3xl font-mono font-bold tracking-tight text-[var(--text)]">
                {total.whole}
                <span className="text-base font-normal text-[var(--muted)]">.{total.frac}</span>
              </span>
            </div>
          </div>
          {blended > 0 && (
            <span className="glass-chip !rounded-full !px-2.5 !py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {blended.toFixed(1)}% APY
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-mono text-emerald-600 dark:text-emerald-400">
            {interestToday > 0 ? `+₦${interestToday.toLocaleString()} today` : 'Interest accrues daily'}
          </p>
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
            <span>Fixed {Math.round(100 - flexRatio)}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-black/[0.06] dark:bg-white/[0.08]">
            <div
              style={{ width: `${flexRatio}%` }}
              className="transition-all duration-500 bg-emerald-500"
            />
            <div
              style={{ width: `${100 - flexRatio}%` }}
              className="transition-all duration-500 bg-[var(--accent)]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--glass-border)] text-[11px] text-[var(--muted)]">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon name="trending_up" size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">
              {lifetime > 0
                ? `₦${lifetime.toLocaleString()} lifetime interest`
                : 'Lifetime interest will appear here'}
            </span>
          </div>
          <span className="font-mono text-[10px] shrink-0">Payout midnight</span>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Active plans
          </p>
          <span className="text-[11px] font-mono text-[var(--muted)]">
            {savingsPlans.length} active
          </span>
        </div>

        {savingsPlans.length === 0 ? (
          <div className="glass-card glass-strong !rounded-[20px] px-5 py-8 text-center space-y-2">
            <Icon name="savings" size={28} className="text-[var(--muted)] mx-auto opacity-60" />
            <p className="text-[13px] font-semibold text-[var(--text)]">No savings plans yet</p>
            <p className="text-[12px] text-[var(--muted)]">
              Create a Flexible, Fixed, or Spend &amp; save plan to get started.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-1 h-10 px-4 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold"
            >
              Create plan
            </button>
          </div>
        ) : (
          savingsPlans.map(renderPlanCard)
        )}

        {/* Live group pots shortcut */}
        {activePots[0] && (
          <div className="glass-card glass-strong !rounded-[20px] p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  <Icon name="group" size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold text-[var(--text)] truncate">
                    {activePots[0].title}
                  </h3>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">Group pool · Save Together</p>
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
                <span className="font-mono font-semibold text-[var(--text)]">
                  ₦{activePots[0].raisedAmount.toLocaleString()} / ₦
                  {activePots[0].targetAmount.toLocaleString()}
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.min(
                    100,
                    Math.round((activePots[0].raisedAmount / activePots[0].targetAmount) * 100) || 0
                  )}
                  %
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden bg-black/[0.06] dark:bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-sky-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (activePots[0].raisedAmount / activePots[0].targetAmount) * 100
                      ) || 0
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Autopilot rules
          </p>
          <span className="glass-chip !rounded-full !px-2.5 !py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            {strictAutoSave || roundUpEnabled ? 'Active' : 'Off'}
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="glass-card glass-strong !rounded-[20px] px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[var(--text)]">Spend &amp; save auto-route</p>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                Routes a set % of inflows into your spend &amp; save plan
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={strictAutoSave}
                onChange={e => void toggleStrictAutoSave(e.target.checked)}
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
                    'Round-Up',
                    e.target.checked
                      ? 'Local preference on — backend rule coming with spend & save.'
                      : 'Round-up paused.',
                    'info'
                  );
                }}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-black/10 dark:bg-white/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]" />
            </label>
          </div>
        </div>
      </section>

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
          ₦5,000/mo into Fixed at {(blended || 14.2).toFixed(1)}% APY projects +₦
          {projectedInterest.toLocaleString()} over {simulatorMonths} months.
        </p>
      </section>

      {/* Create plan sheet */}
      {createOpen && (
        <div className="app-modal-overlay z-[70] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] !max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
              <h3 className="text-[14px] font-semibold text-[var(--text)]">
                {createStep === 'type' ? 'Choose plan type' : 'Plan details'}
              </h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {createStep === 'type' ? (
              <div className="space-y-2.5">
                {typeChip(
                  'flexible',
                  'Flexible',
                  'Save freely — withdraw to wallet anytime.',
                  'lock_open'
                )}
                {typeChip(
                  'fixed',
                  'Fixed',
                  'Lock funds to a target date / amount for higher yield.',
                  'lock'
                )}
                {typeChip(
                  'spend_and_save',
                  'Spend & save',
                  'Auto-save a percentage of spends or inflows.',
                  'bolt'
                )}
                <button
                  type="button"
                  onClick={() => setCreateStep('details')}
                  className="w-full h-11 rounded-2xl bg-[var(--accent)] text-white text-[13px] font-semibold mt-1"
                >
                  Continue
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                    Plan name
                  </label>
                  <input
                    className={fieldClass}
                    value={planName}
                    onChange={e => setPlanName(e.target.value)}
                    placeholder={
                      planType === 'spend_and_save'
                        ? 'e.g. Everyday auto-save'
                        : planType === 'fixed'
                          ? 'e.g. Rent lock'
                          : 'e.g. Emergency fund'
                    }
                  />
                </div>

                {planType !== 'spend_and_save' && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                      Initial deposit (₦) — optional
                    </label>
                    <input
                      className={`${fieldClass} font-mono`}
                      value={initialAmount}
                      onChange={e => setInitialAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                )}

                {planType === 'fixed' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                        Target amount (₦)
                      </label>
                      <input
                        className={`${fieldClass} font-mono`}
                        value={targetAmount}
                        onChange={e => setTargetAmount(e.target.value)}
                        placeholder="100,000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                        Lock duration
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {['30', '60', '90', '180'].map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setMaturityDays(d)}
                            className={`h-9 rounded-xl text-[11px] font-semibold border ${
                              maturityDays === d
                                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                                : 'border-[var(--glass-border)] text-[var(--muted)]'
                            }`}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {planType === 'spend_and_save' && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                      Save percentage
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {['5', '10', '15', '20'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setSavePercent(p)}
                          className={`h-9 rounded-xl text-[11px] font-semibold border ${
                            savePercent === p
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                              : 'border-[var(--glass-border)] text-[var(--muted)]'
                          }`}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                    <input
                      className={`${fieldClass} font-mono`}
                      type="number"
                      min={1}
                      max={100}
                      value={savePercent}
                      onChange={e => setSavePercent(e.target.value)}
                      placeholder="10"
                    />
                    <p className="text-[11px] text-[var(--muted)]">
                      {savePercent || '0'}% of eligible spends / inflows moves into this vault
                      automatically.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setCreateStep('type')}
                    className="h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--text)] text-[12px] font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={creating}
                    onClick={() => void handleCreatePlan()}
                    className="h-11 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold disabled:opacity-60"
                  >
                    {creating ? 'Creating…' : 'Create plan'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deposit / withdraw modal */}
      {customModalOpen && (
        <div className="app-modal-overlay z-[70] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] !max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
              <h3 className="text-[14px] font-semibold text-[var(--text)] capitalize">
                {modalMode === 'deposit' ? 'Deposit into flexible' : 'Withdraw from flexible'}
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
                onClick={() => void handleModalSubmit()}
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
