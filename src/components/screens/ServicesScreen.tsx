import React, { useDeferredValue, useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';
import { searchAppCatalog, type AppSearchItem } from '../../data/appSearch';

/**
 * Agent / account services — deep search + 3-column card grid.
 */
export const ServicesScreen: React.FC = () => {
  const {
    setActiveScreen,
    showToast,
    transactions,
  } = useTransactions();

  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isSearching = deferredQuery.trim().length > 0;

  const runItem = (item: AppSearchItem) => {
    setQuery('');
    if (item.action.type === 'screen') {
      setActiveScreen(item.action.screen);
      return;
    }
    showToast(item.action.title, item.action.message, item.action.tone ?? 'info');
  };

  const catalogResults = useMemo(
    () => searchAppCatalog(deferredQuery),
    [deferredQuery]
  );

  const txResults = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return transactions
      .filter(tx => {
        const hay =
          `${tx.title} ${tx.subtitle} ${tx.reference} ${tx.token ?? ''} ${tx.category}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 8);
  }, [deferredQuery, transactions]);

  const services: {
    label: string;
    icon: string;
    onClick: () => void;
  }[] = [
    {
      label: 'POS',
      icon: 'point_of_sale',
      onClick: () => setActiveScreen('terminals'),
    },
    {
      label: 'Loans',
      icon: 'hand_coins',
      onClick: () => setActiveScreen('loans'),
    },
    {
      label: 'Network',
      icon: 'cell_tower',
      onClick: () => setActiveScreen('network'),
    },
    {
      label: 'Limits',
      icon: 'sliders',
      onClick: () => setActiveScreen('limits'),
    },
    {
      label: 'Settlement',
      icon: 'account_balance',
      onClick: () => setActiveScreen('settlement'),
    },
    {
      label: 'Utilities',
      icon: 'bolt',
      onClick: () => setActiveScreen('utility'),
    },
    {
      label: 'Statement',
      icon: 'file_text',
      onClick: () => setActiveScreen('statement'),
    },
    {
      label: 'Cards',
      icon: 'credit_card',
      onClick: () => setActiveScreen('card'),
    },
    {
      label: 'Recurring',
      icon: 'autorenew',
      onClick: () => setActiveScreen('recurring'),
    },
    {
      label: 'Business',
      icon: 'domain',
      onClick: () => setActiveScreen('business_accounts'),
    },
    {
      label: 'Sub-accounts',
      icon: 'call_split',
      onClick: () => setActiveScreen('sub_accounts'),
    },
    {
      label: 'X-Points',
      icon: 'toll',
      onClick: () => setActiveScreen('xpoints'),
    },
    {
      label: 'Request',
      icon: 'request_quote',
      onClick: () => setActiveScreen('ask_money'),
    },
    {
      label: 'Support',
      icon: 'support_agent',
      onClick: () => setActiveScreen('support'),
    },
    {
      label: 'Settings',
      icon: 'settings',
      onClick: () => setActiveScreen('profile'),
    },
  ];

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="services-screen">
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]">
          <Icon name="search" size={16} />
        </span>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search anything — pay, POS, BVN, statements…"
          className="w-full h-12 pl-10 pr-10 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]"
          aria-label="Deep search across Xtrapay"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="settings-row absolute right-2 top-1/2 -translate-y-1/2 frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-full text-[var(--muted)]"
            aria-label="Clear search"
          >
            <Icon name="close" size={14} />
          </button>
        )}
      </div>

      {isSearching ? (
        <div className="space-y-4">
          <section className="space-y-2">
            <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
              Features · {catalogResults.length}
            </p>
            {catalogResults.length === 0 && txResults.length === 0 ? (
              <div className="glass-card glass-strong settings-list !rounded-[22px] px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-[var(--text)]">No matches</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  Try “transfer”, “POS”, “BVN”, “statement”, or a reference.
                </p>
              </div>
            ) : catalogResults.length > 0 ? (
              <div className="glass-card glass-strong settings-list !rounded-[22px] overflow-hidden divide-y divide-[var(--glass-border)]">
                {catalogResults.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => runItem(item)}
                    className="settings-row w-full flex items-center gap-3 px-3.5 py-3.5 text-left bg-transparent border-0 appearance-none cursor-pointer active:bg-black/[0.03] dark:active:bg-white/[0.04]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
                      <Icon name={item.icon} size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[var(--text)]">{item.title}</p>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                    <Icon
                      name="chevron_right"
                      size={16}
                      className="text-[var(--muted)] shrink-0 opacity-70"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          {txResults.length > 0 && (
            <section className="space-y-2">
              <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
                Transactions · {txResults.length}
              </p>
              <div className="glass-card glass-strong settings-list !rounded-[22px] overflow-hidden divide-y divide-[var(--glass-border)]">
                {txResults.map(tx => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setActiveScreen('history');
                    }}
                    className="settings-row w-full flex items-center gap-3 px-3.5 py-3.5 text-left bg-transparent border-0 appearance-none cursor-pointer"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
                      <Icon name="receipt_long" size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[var(--text)] truncate">
                        {tx.title}
                      </p>
                      <p className="text-[11px] text-[var(--muted)] truncate">
                        {tx.subtitle} · {tx.reference}
                      </p>
                    </div>
                    <p className="text-[12px] font-mono font-semibold text-[var(--text)] shrink-0">
                      ₦{tx.amount.toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <section className="grid grid-cols-3 gap-2.5">
          {services.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="settings-row glass-card glass-strong !rounded-[20px] px-2 py-4 flex flex-col items-center justify-center gap-2.5 text-center appearance-none border-0 cursor-pointer min-h-[96px]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)]">
                <Icon name={item.icon} size={18} />
              </span>
              <span className="text-[11px] font-semibold text-[var(--text)] leading-tight px-0.5">
                {item.label}
              </span>
            </button>
          ))}
        </section>
      )}
    </main>
  );
};
