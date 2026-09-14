import React, { useCallback, useEffect, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import {
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiNotifications,
  isCreditTopUpNotification,
  type AppNotification,
} from '../../lib/xtrapayApi';
import { Icon } from '../Icon';

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * In-app notification inbox — credits / top-ups / alerts from GET /notifications.
 */
export const NotificationsScreen: React.FC = () => {
  const { showToast, refreshBalances, setUnreadNotificationCount } = useTransactions();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiNotifications({ limit: 50 });
      setItems(res.items);
      setUnreadNotificationCount(res.unreadCount);
    } catch (err) {
      setItems([]);
      if (!(err instanceof ApiError && err.status === 404)) {
        showToast(
          'Notifications unavailable',
          err instanceof ApiError ? err.message : 'Could not load alerts.',
          'warning'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [setUnreadNotificationCount, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const markOne = async (n: AppNotification) => {
    if (n.read) return;
    try {
      await apiMarkNotificationRead(n.id);
      setItems(prev => prev.map(x => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadNotificationCount(c => Math.max(0, c - 1));
    } catch {
      // keep unread UI
    }
  };

  const markAll = async () => {
    setBusy(true);
    try {
      await apiMarkAllNotificationsRead();
      setItems(prev => prev.map(x => ({ ...x, read: true })));
      setUnreadNotificationCount(0);
      showToast('All read', 'Notification inbox cleared.', 'success');
    } catch (err) {
      showToast(
        'Could not update',
        err instanceof ApiError ? err.message : 'Mark-all failed.',
        'warning'
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 min-w-0 px-5 pt-5 pb-32" id="notifications-screen">
        <p className="text-[13px] text-[var(--muted)] text-center py-16">Loading notifications…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="notifications-screen">
      <section className="glass-card glass-strong settings-list !rounded-[24px] px-4 py-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Alerts</p>
          <p className="mt-1 text-[14px] font-semibold text-[var(--text)]">
            {items.filter(i => !i.read).length} unread
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void refreshBalances();
              void load();
            }}
            className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
            aria-label="Refresh"
          >
            <Icon name="refresh" size={16} />
          </button>
          <button
            type="button"
            disabled={busy || items.every(i => i.read)}
            onClick={() => void markAll()}
            className="h-9 px-3 rounded-full border border-[var(--glass-border)] text-[11px] font-semibold text-[var(--text)] disabled:opacity-40"
          >
            Mark all read
          </button>
        </div>
      </section>

      {items.length === 0 ? (
        <section className="glass-card glass-strong settings-list !rounded-[24px] px-5 py-12 text-center space-y-2">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
            <Icon name="notifications" size={22} />
          </span>
          <p className="text-[14px] font-semibold text-[var(--text)]">No notifications yet</p>
          <p className="text-[12px] text-[var(--muted)] leading-snug">
            Credits, wallet top-ups and account alerts will show here when the backend posts them.
          </p>
        </section>
      ) : (
        <div className="space-y-2.5">
          {items.map(n => {
            const credit = isCreditTopUpNotification(n);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => void markOne(n)}
                className={`settings-row w-full text-left glass-card glass-strong !rounded-[22px] px-4 py-3.5 appearance-none border-0 cursor-pointer space-y-1 ${
                  n.read ? 'opacity-75' : 'ring-1 ring-[var(--accent)]/25'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      credit
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-[var(--accent)]/12 text-[var(--accent)]'
                    }`}
                  >
                    <Icon name={credit ? 'payments' : 'notifications'} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-[var(--text)] truncate">{n.title}</p>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                      )}
                    </div>
                    {n.body && (
                      <p className="mt-0.5 text-[12px] text-[var(--muted)] leading-snug">{n.body}</p>
                    )}
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
                      <span className="truncate">{n.createdAt || n.type}</span>
                      {n.amount != null && (
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          +{money(n.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
};
