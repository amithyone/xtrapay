import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import { apiNetworkRails, type AppNetworkRail } from '../../lib/xtrapayApi';
import { Icon } from '../Icon';

/**
 * Network / runtime health — GET /api/v1/xtrapay/network/rails (no client mock).
 */
export const NetworkScreen: React.FC = () => {
  const { showToast } = useTransactions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rails, setRails] = useState<AppNetworkRail[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await apiNetworkRails();
      setRails(list);
      setFetchedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setRails([]);
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Could not reach GET /network/rails';
      setError(msg);
      if (!(err instanceof ApiError && err.status === 404)) {
        showToast('Network status unavailable', msg, 'warning');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const overall = useMemo(() => {
    const active = rails.filter(r => r.status === 'Active').length;
    const degraded = rails.filter(r => r.status === 'Degraded').length;
    const down = rails.filter(r => r.status === 'Down').length;
    const avgSuccess =
      rails.reduce((s, r) => s + r.successRate, 0) / Math.max(rails.length, 1);
    return { active, degraded, down, avgSuccess: Number(avgSuccess.toFixed(1)) };
  }, [rails]);

  const overallLabel =
    error && !rails.length
      ? 'Offline'
      : overall.down > 0
        ? 'Incident'
        : overall.degraded > 0
          ? 'Watch'
          : rails.length
            ? 'Healthy'
            : '—';

  if (loading) {
    return (
      <main className="flex-1 min-w-0 px-5 pt-4 pb-32" id="network-screen">
        <p className="text-[13px] text-[var(--muted)] text-center py-16">Loading network status…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id="network-screen">
      <header className="hub-action-shell !rounded-[28px] px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">Runtime</p>
            <h1 className="mt-2 text-[15px] font-semibold text-[var(--text)] tracking-tight">
              Network · {overallLabel}
            </h1>
            <p className="mt-2 text-[11px] text-[var(--muted)]">
              {rails.length
                ? `Avg success ${overall.avgSuccess}% · ${overall.active} active · ${overall.degraded} degraded · ${overall.down} down`
                : error
                  ? error
                  : 'No rail telemetry yet — backend should populate GET /network/rails with live ops data.'}
            </p>
            {fetchedAt && rails.length > 0 && (
              <p className="mt-1 text-[10px] text-[var(--muted)]">Updated {fetchedAt}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)] shrink-0"
            aria-label="Refresh network status"
          >
            <Icon name="refresh" size={16} />
          </button>
        </div>
      </header>

      {rails.length > 0 && (
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
      )}

      <section className="space-y-2.5">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Backends & rails
        </p>
        {rails.length === 0 ? (
          <div className="hub-action-shell !rounded-[28px] px-5 py-10 text-center space-y-2">
            <p className="text-[13px] font-semibold text-[var(--text)]">
              {error ? 'Could not load rails' : 'No rails reported'}
            </p>
            <p className="text-[12px] text-[var(--muted)] leading-snug">
              Live endpoint:{' '}
              <span className="font-mono text-[11px] text-[var(--text)]">
                GET /api/v1/xtrapay/network/rails
              </span>
            </p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void load();
              }}
              className="mt-2 inline-flex h-10 px-4 items-center justify-center rounded-2xl border border-[var(--glass-border)] text-[12px] font-semibold text-[var(--accent)]"
            >
              Retry
            </button>
          </div>
        ) : (
          rails.map(rail => (
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
          ))
        )}
      </section>
    </main>
  );
};
