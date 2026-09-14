import React from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';
import type { Transaction } from '../../types';

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Payments hub — transfers, airtime/data, bills, and recent transfer activity.
 */
export const PayScreen: React.FC = () => {
  const {
    setActiveScreen,
    transactions,
    theme,
    dailySpent,
    dailyLimit,
  } = useTransactions();
  const isLight = theme === 'light';
  const limitLeft = Math.max(0, dailyLimit - dailySpent);

  const limitMoney = (n: number) =>
    `₦${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  const recentTransfers = transactions
    .filter(tx => tx.category === 'transfer' || tx.category === 'p2p')
    .slice(0, 6);

  const actions: {
    label: string;
    hint: string;
    icon: string;
    pad: string;
    tint: string;
    onClick: () => void;
  }[] = [
    {
      label: 'Transfer',
      hint: 'Bank · Xtrapay · wallet',
      icon: 'swap_horiz',
      pad: 'bg-[var(--accent)]/15',
      tint: 'text-[var(--accent)]',
      onClick: () => setActiveScreen('transfer'),
    },
    {
      label: 'Airtime',
      hint: 'MTN · Airtel · Glo · 9mobile',
      icon: 'smartphone',
      pad: isLight ? 'bg-amber-500/15' : 'bg-amber-500/20',
      tint: isLight ? 'text-amber-700' : 'text-amber-300',
      onClick: () => setActiveScreen('airtime'),
    },
    {
      label: 'Data',
      hint: 'Mobile data bundles',
      icon: 'wifi',
      pad: isLight ? 'bg-sky-500/15' : 'bg-sky-500/20',
      tint: isLight ? 'text-sky-700' : 'text-sky-300',
      onClick: () => setActiveScreen('data'),
    },
    {
      label: 'Pay bills',
      hint: 'Power · TV · tolls · more',
      icon: 'receipt_long',
      pad: isLight ? 'bg-cyan-500/15' : 'bg-cyan-500/20',
      tint: isLight ? 'text-cyan-700' : 'text-cyan-300',
      onClick: () => setActiveScreen('paybills'),
    },
  ];

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="pay-screen">
      <section className="glass-card glass-strong settings-list !rounded-[24px] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Daily limit remaining
            </p>
            <p className="mt-1 text-[20px] font-semibold font-mono text-[var(--text)]">
              {limitMoney(limitLeft)}
            </p>
          </div>
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full ${
              isLight ? 'bg-emerald-500/15 text-emerald-700' : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            <Icon name="verified" size={20} />
          </span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${Math.min(100, (dailySpent / dailyLimit) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          Spent today {limitMoney(dailySpent)} · Cap {limitMoney(dailyLimit)}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        {actions.map(action => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="settings-row glass-card glass-strong !rounded-[22px] px-3.5 py-4 text-left appearance-none border-0 cursor-pointer active:bg-black/[0.03] dark:active:bg-white/[0.04]"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${action.pad} ${action.tint}`}
            >
              <Icon name={action.icon} size={18} />
            </span>
            <p className="mt-3 text-[13px] font-semibold text-[var(--text)]">{action.label}</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)] leading-snug">{action.hint}</p>
          </button>
        ))}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Recent transfers
          </p>
          <button
            type="button"
            onClick={() => setActiveScreen('history')}
            className="settings-row text-[11px] font-semibold text-[var(--accent)] bg-transparent border-0 appearance-none cursor-pointer p-0"
          >
            See all
          </button>
        </div>

        <div className="glass-card glass-strong settings-list !rounded-[24px] overflow-hidden divide-y divide-[var(--glass-border)]">
          {recentTransfers.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] font-medium text-[var(--text)]">No recent transfers</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Your latest sends will show up here.
              </p>
            </div>
          ) : (
            recentTransfers.map(tx => <TransferRow key={tx.id} tx={tx} />)
          )}
        </div>
      </section>
    </main>
  );
};

const TransferRow: React.FC<{ tx: Transaction }> = ({ tx }) => {
  const isCredit = tx.type === 'credit';
  return (
    <div className="flex items-center gap-3 px-3.5 py-3.5">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isCredit
            ? 'bg-emerald-500/15 text-emerald-500'
            : 'bg-[var(--accent)]/12 text-[var(--accent)]'
        }`}
      >
        <Icon name={isCredit ? 'arrow_downward' : 'arrow_upward'} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[var(--text)] truncate">{tx.title}</p>
        <p className="text-[11px] text-[var(--muted)] truncate">
          {tx.subtitle} · {tx.date}
        </p>
      </div>
      <p
        className={`text-[12px] font-semibold font-mono shrink-0 ${
          isCredit ? 'text-emerald-500' : 'text-[var(--text)]'
        }`}
      >
        {isCredit ? '+' : '−'}
        {money(tx.amount)}
      </p>
    </div>
  );
};
