import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { runSwipeHintLoop } from '../../lib/swipeHint';
import {
  formatVtuRecentAccount,
  vtuRecentInitials,
  type VtuRecentBeneficiary,
  type VtuRecentKind,
} from '../../lib/vtuRecentBeneficiaries';

type Props = {
  kind: VtuRecentKind;
  items: VtuRecentBeneficiary[];
  onSelect: (item: VtuRecentBeneficiary) => void;
};

/**
 * Horizontal “Recently used” rail for VTU / bill repurchase.
 */
export const RecentVtuBeneficiaries: React.FC<Props> = ({ kind, items, onSelect }) => {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = railRef.current;
    if (!el || items.length < 2) return;
    return runSwipeHintLoop(el, {
      idleMs: 2000,
      peekPx: () => Math.round(Math.min(56, el.clientWidth * 0.14)),
    });
  }, [items.length, kind]);

  if (!items.length) return null;

  const title =
    kind === 'airtime' || kind === 'data'
      ? 'Recent numbers'
      : kind === 'electricity'
        ? 'Recent meters'
        : kind === 'cable'
          ? 'Recent smartcards'
          : 'Recent accounts';

  return (
    <section className="space-y-2">
      <p className="px-0.5 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
        {title}
      </p>
      <div
        ref={railRef}
        className="hub-action-scroll flex gap-2.5 overflow-x-auto pb-1 -mx-0.5 px-0.5"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="settings-row shrink-0 w-[9.5rem] glass-card glass-strong !rounded-[18px] px-3 py-3 text-left appearance-none border-0 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)] text-[11px] font-bold">
                {vtuRecentInitials(item)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[var(--text)] truncate">
                  {item.label || item.providerLabel}
                </p>
                <p className="mt-0.5 text-[10px] font-mono text-[var(--muted)] truncate">
                  {formatVtuRecentAccount(kind, item.account)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-[var(--muted)] truncate flex items-center gap-1">
              <Icon name="history" size={11} />
              {item.lastDetail || item.providerLabel}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};
