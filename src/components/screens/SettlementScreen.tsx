import React, { useCallback, useEffect, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import {
  apiRequestInstantSettlement,
  apiSettlementOverview,
  type AppSettlementOverview,
} from '../../lib/xtrapayApi';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Settlement — payout windows, destination banks, instant settle, batch history.
 */
export const SettlementScreen: React.FC = () => {
  const { showToast, refreshBalances } = useTransactions();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AppSettlementOverview | null>(null);
  const [amount, setAmount] = useState('');
  const [bankId, setBankId] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const overview = await apiSettlementOverview();
      setData(overview);
      setBankId(prev => prev || overview.banks[0]?.id || null);
      setAmount(prev =>
        prev || overview.availableForSettlement > 0
          ? prev || String(Math.floor(overview.availableForSettlement))
          : prev
      );
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fieldClass =
    'auth-field w-full h-12 px-4 rounded-2xl text-[var(--text)] text-sm focus:outline-none transition-all placeholder:text-[var(--muted)]';

  const submitInstant = () => {
    if (!data) return;
    const n = Number(amount.replace(/,/g, ''));
    if (!n || n <= 0) {
      showToast('Invalid amount', 'Enter how much to settle.', 'warning');
      return;
    }
    if (data.minInstantAmount > 0 && n < data.minInstantAmount) {
      showToast(
        'Below minimum',
        `Instant settlement minimum is ${money(data.minInstantAmount)}.`,
        'warning'
      );
      return;
    }
    if (n > data.availableForSettlement) {
      showToast(
        'Too high',
        `Available for settlement is ${money(data.availableForSettlement)}.`,
        'warning'
      );
      return;
    }
    setPinOpen(true);
  };

  const onPinSuccess = async (pin: string) => {
    const n = Number(amount.replace(/,/g, ''));
    setBusy(true);
    try {
      const res = await apiRequestInstantSettlement({
        amount: n,
        pin,
        bankId: bankId || undefined,
      });
      showToast(
        'Settlement submitted',
        res.reference
          ? `Batch ${res.reference} queued.`
          : `${money(n)} sent to settlement rail.`,
        'success'
      );
      setPinOpen(false);
      void refreshBalances();
      setLoading(true);
      await load();
    } catch (err) {
      showToast(
        'Settlement failed',
        err instanceof ApiError ? err.message : 'Could not settle now.',
        'warning'
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <main className="flex-1 min-w-0 px-5 pt-5 pb-32" id="settlement-screen">
        <p className="text-[13px] text-[var(--muted)] text-center py-16">Loading settlement…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="settlement-screen">
      <header className="hub-action-shell !rounded-[28px] px-4 py-4 space-y-2">
        <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">Settlement</p>
        <h1 className="text-[15px] font-semibold text-[var(--text)] tracking-tight">
          Pending · {money(data?.pendingAmount ?? 0)}
        </h1>
        <p className="text-[11px] text-[var(--muted)] leading-snug">
          Next window · {data?.nextWindowLabel || '—'}
          {data?.cutOffLabel ? ` · Cut-off ${data.cutOffLabel}` : ''}
        </p>
        <p className="text-[11px] text-[var(--muted)]">
          {data?.destinationSummary || 'Posts to linked settlement banks'}
        </p>
      </header>

      <section className="hub-action-shell !rounded-[28px] px-4 py-3.5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
          Available to settle
        </p>
        <p className="mt-1 text-[20px] font-semibold font-mono text-[var(--text)] tracking-tight">
          {money(data?.availableForSettlement ?? 0)}
        </p>
      </section>

      <section className="space-y-2">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Destination banks
        </p>
        {(data?.banks.length ?? 0) === 0 ? (
          <div className="glass-card glass-strong !rounded-[22px] px-4 py-6 text-center text-[12px] text-[var(--muted)]">
            No settlement banks linked yet.
          </div>
        ) : (
          <div className="space-y-2">
            {data!.banks.map(bank => {
              const active = bankId === bank.id;
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setBankId(bank.id)}
                  className={`settings-row w-full glass-card glass-strong !rounded-[22px] px-4 py-3.5 text-left appearance-none border-0 cursor-pointer ${
                    active ? 'ring-2 ring-[var(--accent)]/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--text)] truncate">
                        {bank.bankName}
                      </p>
                      <p className="mt-0.5 text-[11px] font-mono text-[var(--muted)]">
                        {bank.accountNumber}
                        {bank.accountName ? ` · ${bank.accountName}` : ''}
                      </p>
                    </div>
                    {bank.sharePct > 0 && (
                      <span className="text-[11px] font-semibold text-[var(--accent)] shrink-0">
                        {bank.sharePct}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Instant settlement
        </p>
        <input
          className={fieldClass}
          inputMode="numeric"
          value={amount}
          onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ''))}
          placeholder="Amount"
        />
        {data && data.instantFeeNgn > 0 && (
          <p className="text-[11px] text-[var(--muted)] px-0.5">
            Instant fee · {money(data.instantFeeNgn)}
            {data.minInstantAmount > 0
              ? ` · Min ${money(data.minInstantAmount)}`
              : ''}
          </p>
        )}
        <button type="button" onClick={submitInstant} className="glass-cta w-full !rounded-2xl">
          Continue with PIN
        </button>
      </section>

      <section className="space-y-2">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Recent batches
        </p>
        <div className="glass-card glass-strong settings-list !rounded-[24px] overflow-hidden divide-y divide-[var(--glass-border)]">
          {(data?.recent.length ?? 0) === 0 ? (
            <p className="px-4 py-6 text-center text-[12px] text-[var(--muted)]">No batches yet</p>
          ) : (
            data!.recent.map(batch => (
              <div key={batch.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
                  <Icon name="account_balance" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[var(--text)] truncate">
                    {batch.bankName || batch.reference}
                  </p>
                  <p className="text-[11px] text-[var(--muted)] truncate">
                    {batch.when} · {batch.reference} · {batch.status}
                  </p>
                </div>
                <p className="text-[13px] font-semibold font-mono text-[var(--text)] shrink-0">
                  {money(batch.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <PinSheetModal
        isOpen={pinOpen}
        onClose={() => !busy && setPinOpen(false)}
        title="Confirm settlement"
        subtitle={`Settle ${amount ? money(Number(amount)) : '—'} to linked bank`}
        amount={Number(amount) || undefined}
        onSuccess={pin => void onPinSuccess(pin)}
      />
    </main>
  );
};
