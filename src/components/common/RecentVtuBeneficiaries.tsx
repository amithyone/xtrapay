import React, { useEffect, useRef } from 'react';
import { runSwipeHintLoop } from '../../lib/swipeHint';
import {
  vtuRecentInitials,
  type VtuRecentBeneficiary,
  type VtuRecentKind,
} from '../../lib/vtuRecentBeneficiaries';

const AVATAR_COLORS = [
  'text-[#c0c1ff]',
  'text-[#4edea3]',
  'text-[#4cd7f6]',
  'text-[#8083ff]',
  'text-[#dfe2ee]',
  'text-amber-500',
  'text-rose-400',
];

type Props = {
  kind: VtuRecentKind;
  items: VtuRecentBeneficiary[];
  onSelect: (item: VtuRecentBeneficiary) => void;
};

function shortLabel(kind: VtuRecentKind, item: VtuRecentBeneficiary): string {
  if (kind === 'airtime' || kind === 'data') {
    const digits = item.account.replace(/\D/g, '');
    if (digits.length >= 4) return digits.slice(-4);
    return item.providerLabel.split(/\s+/)[0] || 'Recent';
  }
  const source = (item.label || item.providerLabel || item.account).trim();
  return source.split(/\s+/)[0] || item.account.slice(-4) || 'Recent';
}

/**
 * Recent VTU / bill picks — same circular avatar rail as Transfer recent recipients.
 */
export const RecentVtuBeneficiaries: React.FC<Props> = ({ kind, items, onSelect }) => {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = railRef.current;
    if (!el || items.length < 3) return;
    return runSwipeHintLoop(el, {
      idleMs: 2000,
      peekPx: () => Math.round(Math.min(48, el.clientWidth * 0.14)),
    });
  }, [items.length, kind]);

  if (!items.length) return null;

  const title =
    kind === 'airtime' || kind === 'data'
      ? 'Recent'
      : kind === 'electricity'
        ? 'Recent meters'
        : kind === 'cable'
          ? 'Recent smartcards'
          : 'Recent accounts';

  return (
    <section className="space-y-3">
      <p className="px-0.5 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
        {title}
      </p>
      <div
        ref={railRef}
        className="hub-action-scroll flex gap-3 overflow-x-auto no-scrollbar pb-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            title={`${item.providerLabel} · ${item.account}${
              item.lastDetail ? ` · ${item.lastDetail}` : ''
            }`}
            className="settings-row flex w-[4.25rem] shrink-0 flex-col items-center gap-2 cursor-pointer appearance-none border-0 bg-transparent p-0"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/50 dark:bg-white/8 text-[12px] font-bold ${
                AVATAR_COLORS[i % AVATAR_COLORS.length]
              }`}
            >
              {vtuRecentInitials(item)}
            </span>
            <span className="w-full truncate text-center text-[10px] font-bold text-[var(--text)]">
              {shortLabel(kind, item)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
