import React, { useEffect, useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import { apiCreateStatement, type StatementKind } from '../../lib/xtrapayApi';
import { Icon } from '../Icon';

type Period = '7' | '30' | '90' | '365';

/**
 * Statement centre — download wallet, savings, card, POS, business statements via API.
 */
export const StatementScreen: React.FC = () => {
  const { showToast, accountContext, wallets } = useTransactions();
  const posWallets = useMemo(
    () => wallets.filter(w => (w.kind || '').toLowerCase().includes('pos') || w.name.toLowerCase().includes('pos')),
    [wallets]
  );
  const hasPos = true; // always offer POS; backend validates scope

  const [kind, setKind] = useState<StatementKind>('wallet');
  const [period, setPeriod] = useState<Period>('30');
  const [posId, setPosId] = useState<string>('all');
  const [busy, setBusy] = useState(false);

  const kinds = useMemo(() => {
    const list: { id: StatementKind; label: string; hint: string; icon: string }[] = [
      {
        id: 'wallet',
        label: 'Wallet',
        hint: 'Personal ledger & NIP history',
        icon: 'account_balance_wallet',
      },
      {
        id: 'savings',
        label: 'Savings',
        hint: 'Flexible & locked pots',
        icon: 'savings',
      },
      {
        id: 'card',
        label: 'Card',
        hint: 'USD / Naira card spend',
        icon: 'credit_card',
      },
      {
        id: 'business',
        label: 'Business',
        hint: 'Business wallet activity',
        icon: 'domain',
      },
    ];
    if (hasPos) {
      list.splice(3, 0, {
        id: 'pos',
        label: 'POS',
        hint: 'Terminal float & settlements',
        icon: 'point_of_sale',
      });
    }
    return list;
  }, [hasPos]);

  const periodLabel =
    period === '7'
      ? 'Last 7 days'
      : period === '30'
        ? 'Last 30 days'
        : period === '90'
          ? 'Last 90 days'
          : 'Last 12 months';

  const handleDownload = async (format: 'PDF' | 'CSV') => {
    setBusy(true);
    try {
      const res = await apiCreateStatement({
        kind,
        period,
        format: format.toLowerCase() as 'pdf' | 'csv',
        posId: kind === 'pos' ? posId : undefined,
        context: accountContext,
      });
      const url = res.downloadUrl ?? res.download_url ?? res.url;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        showToast(
          `${format} ready`,
          `${kinds.find(k => k.id === kind)?.label ?? 'Statement'} · ${periodLabel}`,
          'success'
        );
      } else {
        showToast(
          `${format} queued`,
          res.fileName
            ? `${res.fileName} is being prepared.`
            : `${periodLabel} statement is being prepared.`,
          'success'
        );
      }
    } catch (err) {
      showToast(
        'Download failed',
        err instanceof ApiError ? err.message : 'Could not generate statement.',
        'warning'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="statement-screen">
      <section className="space-y-2">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Statement type
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {kinds.map(item => {
            const active = kind === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setKind(item.id)}
                className={`settings-row glass-card glass-strong !rounded-[20px] px-3.5 py-3.5 text-left appearance-none cursor-pointer border ${
                  active
                    ? 'border-[var(--accent)]/55 ring-1 ring-[var(--accent)]/30'
                    : 'border-transparent'
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)]">
                  <Icon name={item.icon} size={16} />
                </span>
                <p className="mt-2.5 text-[13px] font-semibold text-[var(--text)]">{item.label}</p>
                <p className="mt-0.5 text-[10px] text-[var(--muted)] leading-snug">{item.hint}</p>
              </button>
            );
          })}
        </div>
      </section>

      {kind === 'pos' && (
        <section className="space-y-2">
          <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            POS scope
          </p>
          <div className="glass-card glass-strong settings-list !rounded-[22px] overflow-hidden divide-y divide-[var(--glass-border)]">
            <button
              type="button"
              onClick={() => setPosId('all')}
              className="settings-row w-full flex items-center gap-3 px-3.5 py-3 text-left bg-transparent border-0 appearance-none cursor-pointer"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  posId === 'all'
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                    : 'border-[var(--glass-border)]'
                }`}
              >
                {posId === 'all' && <Icon name="check" size={12} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[var(--text)]">All POS terminals</p>
                <p className="text-[11px] text-[var(--muted)]">Combined float & txn report</p>
              </div>
            </button>
            {posWallets.map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => setPosId(w.id)}
                className="settings-row w-full flex items-center gap-3 px-3.5 py-3 text-left bg-transparent border-0 appearance-none cursor-pointer"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    posId === w.id
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                      : 'border-[var(--glass-border)]'
                  }`}
                >
                  {posId === w.id && <Icon name="check" size={12} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[var(--text)] truncate">{w.name}</p>
                  <p className="text-[11px] font-mono text-[var(--muted)]">{w.accountNumber}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Period
        </p>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              ['7', '7D'],
              ['30', '30D'],
              ['90', '90D'],
              ['365', '1Y'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPeriod(id)}
              className={`settings-chip h-9 rounded-xl text-[12px] font-semibold border ${
                period === id
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'border-[var(--glass-border)] text-[var(--muted)] bg-black/[0.03] dark:bg-white/[0.05]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleDownload('PDF')}
          className="glass-cta w-full !rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Icon name="download" size={16} />
          PDF
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleDownload('CSV')}
          className="settings-row w-full h-12 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] text-[var(--text)] text-[14px] font-semibold flex items-center justify-center gap-2 appearance-none cursor-pointer disabled:opacity-50"
        >
          <Icon name="file_text" size={16} />
          CSV
        </button>
      </section>

      <p className="text-center text-[10px] text-[var(--muted)] px-2 leading-relaxed">
        Statements are CBN-ready and cryptographically sealed for audits, loans and tax filing.
      </p>
    </main>
  );
};
