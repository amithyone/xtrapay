import React, { useEffect, useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { apiCashflowAnalytics, apiCreateStatement, type AppCashflowAnalytics } from '../../lib/xtrapayApi';
import { Icon } from '../Icon';

const moneyCompact = (n: number) => {
  if (!Number.isFinite(n)) return '₦0';
  if (Math.abs(n) >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `₦${(n / 1_000).toFixed(1)}k`;
  return `₦${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

const moneyFull = (n: number) => {
  if (!Number.isFinite(n)) return '₦0.00';
  return `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const UtilityScreen: React.FC = () => {
  const {
    accountContext,
    setAccountContext,
    showToast,
    setActiveScreen,
    openPayBills,
    personalBalance,
    businessBalance,
  } = useTransactions();

  const [period, setPeriod] = useState<'30' | '90' | '365'>('30');
  const [analyticsTab, setAnalyticsTab] = useState<'distribution' | 'velocity' | 'categories'>(
    'distribution'
  );
  const [metrics, setMetrics] = useState<AppCashflowAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void apiCashflowAnalytics({ context: accountContext, periodDays: period })
      .then(data => {
        if (!cancelled) setMetrics(data);
      })
      .catch(() => {
        if (!cancelled) setMetrics(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountContext, period]);

  const liveBalance =
    accountContext === 'personal'
      ? Number(personalBalance) || 0
      : Number(businessBalance) || 0;
  const netBalance = Number.isFinite(metrics?.netBalance)
    ? (metrics!.netBalance as number)
    : liveBalance;
  const balanceWhole = Math.floor(Math.abs(netBalance));
  const balanceFrac = (Math.abs(netBalance) % 1).toFixed(2).slice(2);

  const ringOffset = useMemo(() => {
    const score = Math.min(100, Math.max(0, metrics?.healthScorePct ?? 0));
    return 251.2 * (1 - score / 100);
  }, [metrics?.healthScorePct]);

  const exportStatement = async () => {
    try {
      const res = await apiCreateStatement({
        kind: accountContext === 'business' ? 'business' : 'wallet',
        period,
        format: 'pdf',
        context: accountContext,
      });
      const url = res.downloadUrl ?? res.download_url ?? res.url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      showToast(
        'Statement ready',
        `Cash-flow export (${period === '30' ? '30 Days' : period === '90' ? 'Quarterly' : 'Annual'}).`,
        'success'
      );
    } catch {
      showToast('Export failed', 'Could not generate statement right now.', 'warning');
    }
  };

  const channelTotal =
    metrics?.channels.reduce((s, c) => s + c.amount, 0) || metrics?.totalOutflow || 0;

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5" id="utility-screen">
      <section className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="frosted-pad !h-10 !w-10 !min-h-10 !min-w-10 !rounded-full text-[var(--accent)]">
            <Icon name="monitoring" size={18} />
          </span>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-[var(--text)] tracking-tight">
              Utilities &amp; analytics
            </h1>
            <p className="text-[12px] text-[var(--muted)]">
              Bills, airtime, cash flow &amp; statements
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void exportStatement()}
          className="glass-chip !rounded-2xl !px-3 !py-2 text-[11px] font-semibold text-[var(--text)] flex items-center gap-1.5 active:scale-[0.98] transition-transform shrink-0"
          title="Export Certified PDF"
        >
          <Icon name="download" size={15} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </section>

      <div className="glass-card glass-strong flex p-1 !rounded-[18px]">
        <button
          type="button"
          onClick={() => setAccountContext('personal')}
          className={`flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
            accountContext === 'personal'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'text-[var(--muted)]'
          }`}
        >
          <Icon name="person" size={15} />
          Personal
        </button>
        <button
          type="button"
          onClick={() => setAccountContext('business')}
          className={`flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
            accountContext === 'business'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'text-[var(--muted)]'
          }`}
        >
          <Icon name="domain" size={15} />
          Business
        </button>
      </div>

      <section className="glass-card glass-strong !rounded-[24px] px-5 py-4 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Cash flow radar
            </p>
            <span className="glass-chip !rounded-full !px-2 !py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {metrics?.healthLabel || (loading ? 'Loading…' : 'No data')}
            </span>
          </div>
          <div className="text-[11px] font-mono text-[var(--muted)]">
            {period}D{' '}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {(metrics?.healthScorePct ?? 0).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                className="stroke-black/10 dark:stroke-white/10"
                strokeWidth="9"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                className="stroke-emerald-500"
                strokeWidth="9"
                strokeDasharray="251.2"
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] uppercase font-bold text-[var(--muted)]">Margin</span>
              <span className="text-xs font-mono font-bold text-[var(--text)]">
                {(metrics?.marginPct ?? 0) >= 0 ? '+' : ''}
                {(metrics?.marginPct ?? 0).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Net balance
              </span>
              <button
                type="button"
                onClick={() => setActiveScreen('history')}
                className="text-[11px] font-semibold text-[var(--accent)] flex items-center gap-0.5"
              >
                Transactions
                <Icon name="chevron_right" size={13} />
              </button>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-mono text-[var(--accent)]">₦</span>
              <span className="text-2xl font-mono font-bold tracking-tight text-[var(--text)]">
                {balanceWhole.toLocaleString()}
                <span className="text-sm font-normal text-[var(--muted)]">.{balanceFrac}</span>
              </span>
            </div>
            <div className="text-[11px] text-[var(--muted)] flex items-center gap-1.5">
              <Icon name="speed" size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>
                Burn velocity: {moneyCompact(metrics?.burnPerDay ?? 0)}/day •{' '}
                {metrics?.runwayDays ?? 0}d runway
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-[var(--glass-border)]">
          <div className="rounded-2xl border border-[var(--glass-border)] bg-emerald-500/8 px-3 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                Total inflow
              </span>
              <Icon name="arrow_downward" size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {moneyFull(metrics?.totalInflow ?? 0)}
            </div>
            <div className="text-[10px] mt-0.5 text-[var(--muted)]">
              {metrics?.inflowCount ?? 0} settled credits
              {(metrics?.inflowChangePct ?? 0) !== 0
                ? ` (${(metrics!.inflowChangePct >= 0 ? '+' : '') + metrics!.inflowChangePct.toFixed(1)}%)`
                : ''}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--glass-border)] bg-rose-500/8 px-3 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">
                Total outflow
              </span>
              <Icon name="arrow_upward" size={14} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
              {moneyFull(metrics?.totalOutflow ?? 0)}
            </div>
            <div className="text-[10px] mt-0.5 text-[var(--muted)]">
              {metrics?.outflowCount ?? 0} authorized payments
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="glass-card glass-strong flex p-1 !rounded-[14px]">
            {(['distribution', 'velocity', 'categories'] as const).map(tabKey => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setAnalyticsTab(tabKey)}
                className={`px-3 py-1.5 rounded-[10px] text-[11px] font-semibold capitalize transition-all ${
                  analyticsTab === tabKey
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--muted)]'
                }`}
              >
                {tabKey}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {(['30', '90', '365'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono transition-all ${
                  period === p
                    ? 'bg-[var(--accent)] text-white'
                    : 'glass-chip !rounded-xl !px-2.5 text-[var(--muted)]'
                }`}
              >
                {p === '30' ? '30D' : p === '90' ? '90D' : '1Y'}
              </button>
            ))}
          </div>
        </div>

        {analyticsTab === 'distribution' && (
          <div className="glass-card glass-strong !rounded-[24px] px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                Outflow channel breakdown
              </p>
              <span className="text-xs font-mono font-bold text-[var(--text)]">
                {moneyFull(channelTotal)}
              </span>
            </div>
            {(metrics?.channels.length ?? 0) === 0 ? (
              <p className="text-[12px] text-[var(--muted)] py-4 text-center">
                {loading ? 'Loading channels…' : 'No channel data for this period.'}
              </p>
            ) : (
              <>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-black/5 dark:bg-white/5">
                  {metrics!.channels.map((c, i) => (
                    <div
                      key={c.label}
                      style={{ width: `${Math.max(0, c.pct)}%` }}
                      className={
                        i === 0 ? 'bg-[var(--accent)]' : i === 1 ? 'bg-cyan-500' : 'bg-emerald-500'
                      }
                      title={`${c.label} (${c.pct}%)`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {metrics!.channels.slice(0, 3).map((row, i) => (
                    <div key={row.label} className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            i === 0
                              ? 'bg-[var(--accent)]'
                              : i === 1
                                ? 'bg-cyan-500'
                                : 'bg-emerald-500'
                          }`}
                        />
                        <span className="text-[11px] font-medium text-[var(--muted)] truncate">
                          {row.label}
                        </span>
                      </div>
                      <div className="font-mono font-bold text-xs text-[var(--text)]">
                        {row.pct.toFixed(1)}%
                      </div>
                      <div className="text-[10px] font-mono text-[var(--muted)]">
                        {moneyCompact(row.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {analyticsTab === 'velocity' && (
          <div className="glass-card glass-strong !rounded-[24px] px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                7-day settlement velocity
              </p>
              <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                Avg: {moneyFull(metrics?.velocityAvgPerDay ?? 0)} / day
              </span>
            </div>
            {(metrics?.velocityDays.length ?? 0) === 0 ? (
              <p className="text-[12px] text-[var(--muted)] py-6 text-center">
                {loading ? 'Loading velocity…' : 'No velocity series yet.'}
              </p>
            ) : (
              <div className="grid grid-cols-7 gap-1.5 items-end h-20 pt-2">
                {metrics!.velocityDays.slice(0, 7).map((bar, idx) => {
                  const peak = Math.max(...metrics!.velocityDays.map(d => d.amount), 1);
                  const isPeak = bar.amount === peak;
                  const h = bar.heightPct || Math.round((bar.amount / peak) * 100);
                  return (
                    <div key={`${bar.day}-${idx}`} className="flex flex-col items-center gap-1 group">
                      <div
                        className={`w-full rounded-t-md transition-all group-hover:opacity-80 ${
                          isPeak ? 'bg-[var(--accent)]' : 'bg-black/10 dark:bg-white/10'
                        }`}
                        style={{ height: `${Math.max(8, h)}%` }}
                        title={`${bar.day}: ${moneyCompact(bar.amount)}`}
                      />
                      <span
                        className={`text-[10px] font-mono ${
                          isPeak ? 'text-[var(--accent)] font-bold' : 'text-[var(--muted)]'
                        }`}
                      >
                        {bar.day.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {analyticsTab === 'categories' && (
          <div className="glass-card glass-strong !rounded-[24px] px-5 py-4 space-y-2.5">
            {(metrics?.categories.length ?? 0) === 0 ? (
              <p className="text-[12px] text-[var(--muted)] py-4 text-center">
                {loading ? 'Loading categories…' : 'No category spend yet.'}
              </p>
            ) : (
              metrics!.categories.map(cat => (
                <div key={cat.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon name={cat.icon} size={15} className="text-[var(--accent)] shrink-0" />
                      <span className="font-medium text-[var(--text)] truncate">{cat.label}</span>
                    </div>
                    <span className="font-mono font-semibold text-[var(--text)] shrink-0">
                      {moneyFull(cat.amount)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/5 dark:bg-white/5">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${Math.min(100, Math.max(0, cat.pct))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
              Quick utility payments
            </p>
            <span className="glass-chip !rounded-full !px-2 !py-0.5 text-[10px] font-semibold text-[var(--accent)]">
              Live VTU
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveScreen('paybills')}
            className="text-[12px] font-semibold text-[var(--accent)] flex items-center gap-1"
          >
            All billers
            <Icon name="arrow_forward" size={13} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setActiveScreen('airtime')}
            className="settings-row glass-card glass-strong !rounded-[20px] px-3 py-4 text-center appearance-none border-0 cursor-pointer"
          >
            <Icon name="smartphone" size={18} className="mx-auto text-[var(--accent)]" />
            <p className="mt-2 text-[11px] font-semibold text-[var(--text)]">Airtime</p>
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('data')}
            className="settings-row glass-card glass-strong !rounded-[20px] px-3 py-4 text-center appearance-none border-0 cursor-pointer"
          >
            <Icon name="wifi" size={18} className="mx-auto text-[var(--accent)]" />
            <p className="mt-2 text-[11px] font-semibold text-[var(--text)]">Data</p>
          </button>
          <button
            type="button"
            onClick={() => openPayBills('electricity')}
            className="settings-row glass-card glass-strong !rounded-[20px] px-3 py-4 text-center appearance-none border-0 cursor-pointer"
          >
            <Icon name="bolt" size={18} className="mx-auto text-[var(--accent)]" />
            <p className="mt-2 text-[11px] font-semibold text-[var(--text)]">Power</p>
          </button>
        </div>
      </section>
    </main>
  );
};
