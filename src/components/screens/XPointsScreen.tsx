import React from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';
import { INITIAL_TERMINAL_TXS } from '../../data/terminals';

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Wallet-level X-Points & commission (Agent view from Hub). */
export const XPointsScreen: React.FC = () => {
  const { theme, setActiveScreen } = useTransactions();
  const isLight = theme === 'light';

  const summary = {
    total: 1248,
    available: 920,
    pending: 186,
    redeemed: 142,
    commission: 18_450.75,
  };

  const ledger = [
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

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="xpoints-screen">
      <header className="px-1 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
            Rewards & commission
          </p>
          <h1 className="mt-1.5 text-[18px] font-semibold text-[var(--text)] tracking-tight">
            X-Points
          </h1>
          <p className="mt-1 text-[12px] text-[var(--muted)] leading-snug">
            Points and commission earned across wallet and POS activity.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveScreen('terminals')}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:scale-95 transition-transform ${
            isLight
              ? 'bg-rose-500/12 text-rose-600'
              : 'bg-white/10 text-white border border-white/12'
          }`}
          aria-label="Open terminals"
          title="Terminal X-Points"
        >
          <Icon name="point_of_sale" size={18} />
        </button>
      </header>

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
            {summary.available.toLocaleString()}
          </span>
          <span className={`text-[12px] font-medium ${isLight ? 'text-zinc-500' : 'text-white/60'}`}>
            XP
          </span>
        </div>
        <p className={`mt-2 text-[12px] ${isLight ? 'text-zinc-500' : 'text-white/65'}`}>
          Commission earned · {money(summary.commission)}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Total', value: summary.total },
          { label: 'Pending', value: summary.pending },
          { label: 'Redeemed', value: summary.redeemed },
          { label: 'Available', value: summary.available },
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

      <section className="glass-card glass-strong !rounded-[24px] px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            Commission earned
          </p>
          <Icon name="toll" size={16} className="text-[var(--accent)]" />
        </div>
        <p className="mt-2 text-[1.5rem] font-semibold font-mono text-[var(--text)] leading-none">
          {money(summary.commission)}
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
              <p className="text-[12px] font-semibold text-emerald-500">+{row.xPoints} XP</p>
              {row.commission > 0 && (
                <p className="text-[10px] text-[var(--muted)]">Comm {money(row.commission)}</p>
              )}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
};
