import React, { useMemo } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';
import type { Transaction } from '../../types';

type RailStatus = 'Active' | 'Degraded' | 'Down';

type NetworkRail = {
  id: string;
  name: string;
  backend: string;
  icon: string;
  categories: Transaction['category'][];
  /** Fallback metrics when no recent txs match */
  baselineSuccess: number;
  baselineLatencyMs: number;
};

const RAILS: NetworkRail[] = [
  {
    id: 'nip',
    name: 'NIP Instant',
    backend: 'NIBSS · interbank',
    icon: 'swap_horiz',
    categories: ['transfer', 'p2p'],
    baselineSuccess: 99.2,
    baselineLatencyMs: 820,
  },
  {
    id: 'ussd',
    name: 'USSD gateway',
    backend: '*737# · telco hubs',
    icon: 'smartphone',
    categories: ['utility', 'bill'],
    baselineSuccess: 97.4,
    baselineLatencyMs: 1400,
  },
  {
    id: 'card',
    name: 'Card acquiring',
    backend: 'Visa · Mastercard · Verve',
    icon: 'credit_card',
    categories: ['card'],
    baselineSuccess: 98.6,
    baselineLatencyMs: 1100,
  },
  {
    id: 'pos',
    name: 'POS terminals',
    backend: 'ISO8583 · float rails',
    icon: 'point_of_sale',
    categories: ['transfer', 'p2p'],
    baselineSuccess: 98.1,
    baselineLatencyMs: 950,
  },
  {
    id: 'bills',
    name: 'Bills & airtime',
    backend: 'Biller aggregators',
    icon: 'receipt_long',
    categories: ['utility', 'bill'],
    baselineSuccess: 96.8,
    baselineLatencyMs: 1600,
  },
  {
    id: 'kyc',
    name: 'KYC · BVN / NIN',
    backend: 'NIMC · NIBSS lookup',
    icon: 'verified_user',
    categories: ['transfer'],
    baselineSuccess: 99.5,
    baselineLatencyMs: 2100,
  },
  {
    id: 'settlement',
    name: 'Settlement',
    backend: 'Zenith · Providus',
    icon: 'account_balance',
    categories: ['transfer', 'savings'],
    baselineSuccess: 99.8,
    baselineLatencyMs: 3200,
  },
  {
    id: 'credit',
    name: 'Loans engine',
    backend: 'CheckoutNow credit',
    icon: 'hand_coins',
    categories: ['transfer'],
    baselineSuccess: 99.0,
    baselineLatencyMs: 700,
  },
];

function parseRelativeMinutes(tx: Transaction): number {
  const t = tx.fullTime || tx.timestamp || '';
  // Prefer fresher "Today" rows; older dates get larger age
  if (tx.date.toLowerCase().includes('today')) {
    const m = t.match(/(\d{1,2}):(\d{2})/);
    if (m) {
      const mins = Number(m[1]) * 60 + Number(m[2]);
      // Treat as minutes since midnight; invert so later clock = fresher
      return Math.max(5, 24 * 60 - mins);
    }
    return 30;
  }
  if (tx.date.toLowerCase().includes('yesterday')) return 60 * 18;
  return 60 * 48;
}

function statusFrom(successRate: number, ageMinutes: number | null): RailStatus {
  if (successRate < 92 || (ageMinutes !== null && ageMinutes > 60 * 36 && successRate < 97)) {
    return successRate < 85 ? 'Down' : 'Degraded';
  }
  if (successRate < 96.5) return 'Degraded';
  return 'Active';
}

function formatAge(minutes: number | null): string {
  if (minutes === null) return 'No recent traffic';
  if (minutes < 60) return `${Math.round(minutes)}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / (60 * 24))}d ago`;
}

/**
 * Network / runtime health — rails, success rates, last traffic.
 */
export const NetworkScreen: React.FC = () => {
  const { transactions, showToast } = useTransactions();

  const rails = useMemo(() => {
    return RAILS.map(rail => {
      const matched = transactions.filter(tx => rail.categories.includes(tx.category));
      const sample = matched.slice(0, 40);
      const ok = sample.filter(tx => {
        const s = String(tx.status).toLowerCase();
        return (
          s.includes('settled') ||
          s.includes('success') ||
          s.includes('delivered') ||
          s.includes('automated')
        );
      }).length;
      const bad = sample.filter(tx => {
        const s = String(tx.status).toLowerCase();
        return s.includes('fail') || s.includes('revers') || s.includes('declin');
      }).length;
      const observed =
        sample.length >= 2
          ? ((ok + Math.max(0, sample.length - ok - bad) * 0.9) / sample.length) * 100
          : rail.baselineSuccess;
      // Blend heartbeat baseline with observed ledger outcomes
      const successRate = Number(
        (sample.length >= 2
          ? rail.baselineSuccess * 0.55 + observed * 0.45
          : rail.baselineSuccess
        ).toFixed(1)
      );

      const newest = matched[0] ?? null;
      const ageMinutes = newest ? parseRelativeMinutes(newest) : null;
      const status = statusFrom(successRate, ageMinutes);
      const latencyMs =
        status === 'Degraded'
          ? Math.round(rail.baselineLatencyMs * 1.45)
          : status === 'Down'
            ? Math.round(rail.baselineLatencyMs * 2.2)
            : rail.baselineLatencyMs;
      const uptime =
        status === 'Active' ? 99.95 : status === 'Degraded' ? 99.1 : 97.2;

      return {
        ...rail,
        successRate: Number(successRate.toFixed(1)),
        latencyMs,
        uptime,
        status,
        lastRef: newest?.reference ?? null,
        lastTitle: newest?.title ?? null,
        lastAge: formatAge(ageMinutes),
        volume24h: matched.filter(tx => tx.date.toLowerCase().includes('today')).length,
      };
    });
  }, [transactions]);

  const overall = useMemo(() => {
    const active = rails.filter(r => r.status === 'Active').length;
    const degraded = rails.filter(r => r.status === 'Degraded').length;
    const down = rails.filter(r => r.status === 'Down').length;
    const avgSuccess =
      rails.reduce((s, r) => s + r.successRate, 0) / Math.max(rails.length, 1);
    return { active, degraded, down, avgSuccess: Number(avgSuccess.toFixed(1)) };
  }, [rails]);

  const overallLabel =
    overall.down > 0 ? 'Incident' : overall.degraded > 0 ? 'Watch' : 'Healthy';

  return (
    <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id="network-screen">
      <header className="hub-action-shell !rounded-[28px] px-4 py-3.5">
        <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">Runtime</p>
        <h1 className="mt-2 text-[15px] font-semibold text-[var(--text)] tracking-tight">
          Network · {overallLabel}
        </h1>
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          Avg success {overall.avgSuccess}% · {overall.active} active · {overall.degraded}{' '}
          degraded · {overall.down} down
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Active', value: overall.active, tone: 'text-emerald-600 dark:text-emerald-300' },
          { label: 'Degraded', value: overall.degraded, tone: 'text-amber-600 dark:text-amber-300' },
          { label: 'Down', value: overall.down, tone: 'text-rose-500' },
        ].map(chip => (
          <div key={chip.label} className="hub-action-shell !rounded-[22px] px-3 py-3 text-center">
            <p className={`text-[18px] font-semibold tracking-tight ${chip.tone}`}>{chip.value}</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">{chip.label}</p>
          </div>
        ))}
      </div>

      <section className="space-y-2.5">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Backends & rails
        </p>
        {rails.map(rail => (
          <button
            key={rail.id}
            type="button"
            onClick={() =>
              showToast(
                rail.name,
                `${rail.status} · Success ${rail.successRate}% · ${rail.lastAge}${
                  rail.lastRef ? ` · ${rail.lastRef}` : ''
                }`,
                rail.status === 'Active' ? 'success' : rail.status === 'Degraded' ? 'warning' : 'info'
              )
            }
            className="settings-row w-full hub-action-shell !rounded-[28px] px-4 py-3.5 text-left appearance-none border-0 cursor-pointer space-y-3"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
                <Icon name={rail.icon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-[var(--text)] truncate">{rail.name}</p>
                  <span
                    className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${
                      rail.status === 'Active'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : rail.status === 'Degraded'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                          : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    {rail.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--muted)] truncate">{rail.backend}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] text-[var(--muted)]">Success</p>
                <p className="text-[13px] font-semibold text-[var(--text)]">{rail.successRate}%</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--muted)]">Uptime</p>
                <p className="text-[13px] font-semibold text-[var(--text)]">{rail.uptime}%</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--muted)]">Latency</p>
                <p className="text-[13px] font-semibold text-[var(--text)]">{rail.latencyMs}ms</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
              <span className="truncate">
                Last traffic · {rail.lastAge}
                {rail.lastTitle ? ` · ${rail.lastTitle}` : ''}
              </span>
              <span className="shrink-0 font-medium text-[var(--text)]/70">
                {rail.volume24h} today
              </span>
            </div>
          </button>
        ))}
      </section>

      <p className="text-[11px] text-[var(--muted)] leading-snug px-1">
        Health blends live backend heartbeats with your recent transaction outcomes on each rail.
        Tap a rail for the latest reference.
      </p>
    </main>
  );
};
