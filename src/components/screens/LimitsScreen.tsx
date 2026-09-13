import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

type LimitKey = 'daily' | 'single' | 'pos' | 'transfer';

/**
 * Limit settings — daily, single debit, POS float, and transfer caps.
 */
export const LimitsScreen: React.FC = () => {
  const { dailySpent, dailyLimit, overdraftLimit, showToast } = useTransactions();
  const limitLeft = Math.max(0, dailyLimit - dailySpent);

  const [daily, setDaily] = useState(dailyLimit);
  const [single, setSingle] = useState(1_000_000);
  const [pos, setPos] = useState(2_000_000);
  const [transfer, setTransfer] = useState(500_000);
  const [pinOpen, setPinOpen] = useState(false);
  const [pending, setPending] = useState<{ key: LimitKey; value: number } | null>(null);

  const fieldClass =
    'auth-field w-full h-12 px-4 rounded-2xl text-[var(--text)] text-sm focus:outline-none transition-all placeholder:text-[var(--muted)]';

  const rows: {
    key: LimitKey;
    label: string;
    hint: string;
    value: number;
    setValue: (n: number) => void;
    icon: string;
  }[] = [
    {
      key: 'daily',
      label: 'Daily spend limit',
      hint: `Spent today ${money(dailySpent)} · Left ${money(limitLeft)}`,
      value: daily,
      setValue: setDaily,
      icon: 'sliders',
    },
    {
      key: 'single',
      label: 'Single transaction',
      hint: 'Max amount per debit',
      value: single,
      setValue: setSingle,
      icon: 'payments',
    },
    {
      key: 'transfer',
      label: 'Transfer / NIP',
      hint: 'Bank & wallet transfers',
      value: transfer,
      setValue: setTransfer,
      icon: 'swap_horiz',
    },
    {
      key: 'pos',
      label: 'POS float cap',
      hint: 'Per-terminal float ceiling',
      value: pos,
      setValue: setPos,
      icon: 'point_of_sale',
    },
  ];

  const save = (key: LimitKey, value: number) => {
    if (!value || value < 1000) {
      showToast('Invalid limit', 'Enter at least ₦1,000.', 'warning');
      return;
    }
    setPending({ key, value });
    setPinOpen(true);
  };

  return (
    <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id="limits-screen">
      <header className="hub-action-shell !rounded-[28px] px-4 py-3.5">
        <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">Risk controls</p>
        <h1 className="mt-2 text-[15px] font-semibold text-[var(--text)] tracking-tight">
          Limit settings
        </h1>
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          Tier 3 KYC · Overdraft line {money(overdraftLimit)}. Changes require transaction PIN.
        </p>
      </header>

      <div className="hub-action-shell !rounded-[28px] px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-[var(--muted)]">Daily remaining</p>
            <p className="mt-1 text-[18px] font-semibold text-[var(--text)] tracking-tight">
              {money(limitLeft)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[var(--muted)]">Cap</p>
            <p className="mt-1 text-[13px] font-semibold text-[var(--text)]">{money(daily)}</p>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{
              width: `${Math.min(100, (dailySpent / Math.max(daily, 1)) * 100)}%`,
            }}
          />
        </div>
      </div>

      <section className="space-y-3">
        {rows.map(row => (
          <article key={row.key} className="hub-action-shell !rounded-[28px] px-4 py-3.5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
                <Icon name={row.icon} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[var(--text)]">{row.label}</p>
                <p className="text-[11px] text-[var(--muted)]">{row.hint}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                className={`${fieldClass} flex-1 font-mono`}
                inputMode="numeric"
                value={row.value.toLocaleString('en-US')}
                onChange={e => {
                  const n = Number(e.target.value.replace(/\D/g, ''));
                  row.setValue(Number.isFinite(n) ? n : 0);
                }}
                aria-label={row.label}
              />
              <button
                type="button"
                onClick={() => save(row.key, row.value)}
                className="settings-row shrink-0 h-12 px-4 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold appearance-none border-0 cursor-pointer"
              >
                Save
              </button>
            </div>
          </article>
        ))}
      </section>

      <p className="text-[11px] text-[var(--muted)] leading-snug px-1">
        Raising limits may trigger extra KYC or cooling periods. Lowering takes effect immediately
        after PIN confirmation.
      </p>

      <PinSheetModal
        isOpen={pinOpen}
        onClose={() => setPinOpen(false)}
        title="Confirm limit change"
        subtitle={
          pending
            ? `Set ${pending.key} limit to ${money(pending.value)}`
            : 'Enter your transaction PIN'
        }
        onSuccess={() => {
          setPinOpen(false);
          if (!pending) return;
          showToast(
            'Limit updated',
            `${pending.key === 'daily' ? 'Daily' : pending.key === 'single' ? 'Single' : pending.key === 'pos' ? 'POS' : 'Transfer'} cap is now ${money(pending.value)}.`,
            'success'
          );
          setPending(null);
        }}
      />
    </main>
  );
};
