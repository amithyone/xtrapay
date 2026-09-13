import React, { useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';
import { INITIAL_TERMINAL_TXS } from '../../data/terminals';

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** 1 XP = ₦5 wallet credit (demo rate) */
const XP_TO_NAIRA = 5;

type RedeemOption = 'wallet' | 'airtime' | 'data' | 'commission';

const REDEEM_OPTIONS: {
  id: RedeemOption;
  label: string;
  hint: string;
  icon: string;
}[] = [
  {
    id: 'wallet',
    label: 'Wallet cash',
    hint: 'Credit Xtrapay wallet instantly',
    icon: 'account_balance_wallet',
  },
  {
    id: 'airtime',
    label: 'Airtime',
    hint: 'Top up any Nigerian network',
    icon: 'smartphone',
  },
  {
    id: 'data',
    label: 'Data bundle',
    hint: 'Redeem for mobile data',
    icon: 'wifi',
  },
  {
    id: 'commission',
    label: 'Boost commission',
    hint: 'Add value to pending settlement',
    icon: 'toll',
  },
];

/** Wallet-level X-Points & commission (Agent view from Hub). */
export const XPointsScreen: React.FC = () => {
  const { theme, showToast } = useTransactions();
  const isLight = theme === 'light';

  const [available, setAvailable] = useState(920);
  const [redeemed, setRedeemed] = useState(142);
  const [pending] = useState(186);
  const total = available + pending + redeemed;

  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemOption, setRedeemOption] = useState<RedeemOption>('wallet');
  const [xpAmount, setXpAmount] = useState('200');
  const [pinOpen, setPinOpen] = useState(false);
  const [redeemLedger, setRedeemLedger] = useState<
    {
      id: string;
      title: string;
      meta: string;
      amount: number;
      xPoints: number;
      commission: number;
      when: string;
      status: 'Successful';
    }[]
  >([]);

  const nairaValue = useMemo(() => {
    const xp = parseInt(xpAmount.replace(/\D/g, ''), 10) || 0;
    return xp * XP_TO_NAIRA;
  }, [xpAmount]);

  const baseLedger = [
    ...INITIAL_TERMINAL_TXS.map(tx => ({
      id: tx.id,
      title: tx.type,
      meta: `${tx.terminalId} · ${tx.reference}`,
      amount: tx.amount,
      xPoints: tx.xPoints || 0,
      commission: tx.commission || 0,
      when: `${tx.date} · ${tx.time}`,
      status: tx.status,
    })),
    {
      id: 'xp-bonus',
      title: 'Loyalty bonus',
      meta: 'WALLET · XP-20260901-BONUS',
      amount: 0,
      xPoints: 50,
      commission: 0,
      when: '01 Sep 2026 · 09:00',
      status: 'Successful' as const,
    },
  ];

  const ledger = [...redeemLedger, ...baseLedger];

  const openRedeem = () => {
    if (available <= 0) {
      showToast('Nothing to Redeem', 'You have no available X-Points right now.', 'info');
      return;
    }
    setXpAmount(String(Math.min(200, available)));
    setRedeemOption('wallet');
    setRedeemOpen(true);
  };

  const continueRedeem = () => {
    const xp = parseInt(xpAmount.replace(/\D/g, ''), 10) || 0;
    if (xp <= 0) {
      showToast('Invalid Amount', 'Enter how many X-Points to redeem.', 'warning');
      return;
    }
    if (xp > available) {
      showToast('Not Enough XP', `You only have ${available.toLocaleString()} XP available.`, 'warning');
      return;
    }
    setRedeemOpen(false);
    setPinOpen(true);
  };

  const handleRedeemSuccess = () => {
    const xp = parseInt(xpAmount.replace(/\D/g, ''), 10) || 0;
    const option = REDEEM_OPTIONS.find(o => o.id === redeemOption);
    const cash = xp * XP_TO_NAIRA;
    setAvailable(prev => prev - xp);
    setRedeemed(prev => prev + xp);
    setRedeemLedger(prev => [
      {
        id: `xpr-${Date.now()}`,
        title: `Redeemed · ${option?.label ?? 'Wallet'}`,
        meta: `WALLET · XPR-${Date.now().toString().slice(-8)}`,
        amount: redeemOption === 'wallet' || redeemOption === 'commission' ? cash : 0,
        xPoints: -xp,
        commission: 0,
        when: 'Just now',
        status: 'Successful',
      },
      ...prev,
    ]);
    setPinOpen(false);
    showToast(
      'X-Points Redeemed',
      redeemOption === 'wallet'
        ? `${xp.toLocaleString()} XP → ${money(cash)} credited to your wallet.`
        : `${xp.toLocaleString()} XP redeemed as ${option?.label}.`,
      'success'
    );
  };

  const quickXp = [50, 100, 200, available].filter(
    (v, i, arr) => v > 0 && v <= available && arr.indexOf(v) === i
  );

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="xpoints-screen">
      <section
        className={`relative overflow-hidden rounded-[28px] px-5 py-5 ${
          isLight
            ? 'bg-white border border-black/8 shadow-sm'
            : 'border border-white/12'
        }`}
        style={
          isLight
            ? undefined
            : {
                background:
                  'linear-gradient(155deg, rgba(255,255,255,0.06) 0%, transparent 40%), linear-gradient(145deg, rgba(127,29,29,0.45) 0%, rgba(40,10,16,0.55) 55%, rgba(0,0,0,0.40) 100%)',
              }
        }
      >
        <p
          className={`text-[10px] uppercase tracking-[0.22em] ${
            isLight ? 'text-zinc-500' : 'text-white/55'
          }`}
        >
          Available X-Points
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`font-mono text-[2.1rem] font-semibold leading-none tracking-tight ${
              isLight ? 'text-[#0a0a0a]' : 'text-white'
            }`}
          >
            {available.toLocaleString()}
          </span>
          <span className={`text-[12px] font-medium ${isLight ? 'text-zinc-500' : 'text-white/60'}`}>
            XP
          </span>
        </div>
        <p className={`mt-2 text-[12px] ${isLight ? 'text-zinc-500' : 'text-white/65'}`}>
          Worth about {money(available * XP_TO_NAIRA)} · 1 XP = ₦{XP_TO_NAIRA}
        </p>
        <button
          type="button"
          onClick={openRedeem}
          disabled={available <= 0}
          className={`mt-4 w-full h-11 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-2 ${
            available <= 0
              ? 'opacity-45 cursor-not-allowed bg-black/10 text-[var(--muted)]'
              : isLight
                ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/25'
                : 'bg-[#f2ecc8] text-[#1a0508] shadow-md shadow-black/20'
          }`}
        >
          <Icon name="toll" size={16} />
          Redeem X-Points
        </button>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Total', value: total },
          { label: 'Pending', value: pending },
          { label: 'Redeemed', value: redeemed },
          { label: 'Available', value: available },
        ].map(card => (
          <div key={card.label} className="glass-card !rounded-[20px] px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              {card.label}
            </p>
            <p className="mt-1 text-[18px] font-semibold font-mono text-[var(--text)]">
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      <section className="glass-card glass-strong settings-list !rounded-[24px] px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            Commission earned
          </p>
          <Icon name="toll" size={16} className="text-[var(--accent)]" />
        </div>
        <p className="mt-2 text-[1.5rem] font-semibold font-mono text-[var(--text)] leading-none">
          {money(18_450.75)}
        </p>
        <p className="mt-1.5 text-[11px] text-[var(--muted)]">
          Backend-controlled rates · settlement pending included above
        </p>
      </section>

      <section className="space-y-2.5">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Activity ledger
        </p>
        {ledger.map(row => (
          <div
            key={row.id}
            className="glass-card !rounded-[20px] px-3.5 py-3.5 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text)] truncate">{row.title}</p>
              <p className="mt-0.5 text-[10px] font-mono text-[var(--muted)] truncate">{row.meta}</p>
              <p className="mt-1 text-[10px] text-[var(--muted)]">{row.when}</p>
            </div>
            <div className="text-right shrink-0">
              {row.amount > 0 && (
                <p className="text-[12px] font-mono text-[var(--text)]">{money(row.amount)}</p>
              )}
              <p
                className={`text-[12px] font-semibold ${
                  row.xPoints < 0 ? 'text-rose-500' : 'text-emerald-500'
                }`}
              >
                {row.xPoints > 0 ? '+' : ''}
                {row.xPoints} XP
              </p>
              {row.commission > 0 && (
                <p className="text-[10px] text-[var(--muted)]">Comm {money(row.commission)}</p>
              )}
            </div>
          </div>
        ))}
      </section>

      {redeemOpen && (
        <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
              <h3 className="text-[14px] font-semibold text-[var(--text)]">Redeem X-Points</h3>
              <button
                type="button"
                onClick={() => setRedeemOpen(false)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <p className="text-[12px] text-[var(--muted)]">
              Available · <span className="font-mono font-semibold text-[var(--text)]">{available} XP</span>
            </p>

            <div className="grid grid-cols-2 gap-2">
              {REDEEM_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRedeemOption(opt.id)}
                  className={`settings-row rounded-2xl px-3 py-3 text-left border appearance-none cursor-pointer ${
                    redeemOption === opt.id
                      ? 'border-[var(--accent)]/55 ring-1 ring-[var(--accent)]/30 bg-[var(--accent)]/8'
                      : 'border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.04]'
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                    <Icon name={opt.icon} size={15} />
                  </span>
                  <p className="mt-2 text-[12px] font-semibold text-[var(--text)]">{opt.label}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-snug">{opt.hint}</p>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                X-Points to redeem
              </label>
              <input
                value={xpAmount}
                onChange={e => setXpAmount(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                className="w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25"
                placeholder="0"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {quickXp.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setXpAmount(String(v))}
                    className={`settings-chip h-8 px-3 rounded-full text-[11px] font-semibold border ${
                      xpAmount === String(v)
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'border-[var(--glass-border)] text-[var(--muted)]'
                    }`}
                  >
                    {v === available ? 'Max' : `${v} XP`}
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-[var(--muted)] pt-1">
                Est. value ·{' '}
                <span className="font-mono font-semibold text-[var(--text)]">{money(nairaValue)}</span>
              </p>
            </div>

            <button type="button" onClick={continueRedeem} className="glass-cta w-full">
              Continue to PIN
            </button>
          </div>
        </div>
      )}

      <PinSheetModal
        isOpen={pinOpen}
        onClose={() => setPinOpen(false)}
        title="Authorize Redemption"
        subtitle={`Redeem ${xpAmount || '0'} XP as ${REDEEM_OPTIONS.find(o => o.id === redeemOption)?.label}`}
        amount={nairaValue}
        onSuccess={handleRedeemSuccess}
      />
    </main>
  );
};
