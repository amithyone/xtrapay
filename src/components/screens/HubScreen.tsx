import React, { useEffect, useRef, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';
import {
  animateRubberRelease,
  clampScrollWithRubber,
  runSwipeHintLoop,
} from '../../lib/swipeHint';

/**
 * Hub fused with PAKEE + crypto-wallet language:
 * - dark: frosted maroon glass hero + white type
 * - light: solid white hero
 * - Send | QR | Receive nested in the hero
 * Rollback: USE_LEGACY_HUB = true in App.tsx
 */
export const HubScreen: React.FC = () => {
  const {
    personalBalance,
    businessBalance,
    selectedWallet,
    balanceHidden,
    setBalanceHidden,
    setActiveScreen,
    setIsQrOpen,
    setIsNearbyPayOpen,
    setIsPayAtShopOpen,
    setIsScanToPayOpen,
    showToast,
    theme,
  } = useTransactions();

  const isLight = theme === 'light';
  const [isPosPinOpen, setIsPosPinOpen] = useState(false);
  const actionRailRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startScroll: 0,
    moved: false,
    capturing: false,
  });
  const railInteractedRef = useRef(false);
  const rubberRef = useRef(0);
  const [rubberX, setRubberX] = useState(0);

  const DRAG_THRESHOLD = 14;

  const applyRubber = (px: number) => {
    rubberRef.current = px;
    setRubberX(px);
  };

  const onActionPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = actionRailRef.current;
    if (!el || e.button !== 0) return;
    railInteractedRef.current = true;
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
      capturing: false,
    };
    el.dataset.dragging = '0';
  };

  const onActionPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = actionRailRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;

    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      drag.moved = true;
      el.dataset.dragging = '1';
      drag.capturing = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const desired = drag.startScroll - dx;
    const { scrollLeft, rubber } = clampScrollWithRubber(desired, maxScroll, el.clientWidth);
    el.scrollLeft = scrollLeft;
    applyRubber(-rubber);
  };

  const onActionPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = actionRailRef.current;
    const drag = dragRef.current;
    if (e.pointerId !== drag.pointerId && drag.pointerId !== -1) return;
    const wasDragging = drag.moved;
    drag.active = false;
    drag.pointerId = -1;
    if (el) {
      if (drag.capturing) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        drag.capturing = false;
      }
      const from = rubberRef.current;
      if (Math.abs(from) > 0.5) {
        void animateRubberRelease(applyRubber, from);
      } else {
        applyRubber(0);
      }
      if (wasDragging) {
        window.setTimeout(() => {
          drag.moved = false;
          if (el) el.dataset.dragging = '0';
        }, 80);
      } else {
        drag.moved = false;
        el.dataset.dragging = '0';
      }
    }
  };

  useEffect(() => {
    const el = actionRailRef.current;
    if (!el) return;
    return runSwipeHintLoop(el, {
      idleMs: 2000,
      shouldCancel: () => railInteractedRef.current || dragRef.current.active,
    });
  }, []);

  const currentBalance =
    selectedWallet.kind === 'personal'
      ? personalBalance
      : selectedWallet.kind === 'business'
        ? businessBalance
        : selectedWallet.balance;
  const accountNumber = selectedWallet.accountNumber;
  const bankName = selectedWallet.bankName;

  const copyAccount = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(accountNumber);
    }
    showToast('Copied to Clipboard', `Account ${accountNumber} (${bankName}) copied.`);
  };

  const moreActions = [
    {
      label: 'Pay',
      icon: 'swap_horiz',
      tint: isLight ? 'text-cyan-600' : 'text-white',
      pad: 'bg-cyan-500/18',
      onClick: () => setActiveScreen('pay'),
    },
    {
      label: 'History',
      icon: 'history',
      tint: isLight ? 'text-purple-600' : 'text-white',
      pad: 'bg-purple-500/18',
      onClick: () => setActiveScreen('history'),
    },
    {
      label: 'Nearby',
      icon: 'wifi',
      tint: isLight ? 'text-orange-600' : 'text-white',
      pad: 'bg-orange-500/18',
      onClick: () => setIsNearbyPayOpen(true),
    },
    {
      label: 'Shop',
      icon: 'store',
      tint: isLight ? 'text-teal-600' : 'text-white',
      pad: 'bg-teal-500/18',
      onClick: () => setIsPayAtShopOpen(true),
    },
    {
      label: 'Scan',
      icon: 'qr_code',
      tint: isLight ? 'text-sky-600' : 'text-white',
      pad: 'bg-sky-500/18',
      onClick: () => setIsScanToPayOpen(true),
    },
    {
      label: 'POS',
      icon: 'point_of_sale',
      tint: isLight ? 'text-rose-600' : 'text-white',
      pad: 'bg-rose-500/18',
      onClick: () => setIsPosPinOpen(true),
    },
    {
      label: 'Services',
      icon: 'grid_view',
      tint: isLight ? 'text-emerald-600' : 'text-white',
      pad: 'bg-emerald-500/18',
      onClick: () => setActiveScreen('services'),
    },
  ] as const;

  return (
    <main className="flex-1 min-w-0 px-5 pt-6 pb-32 space-y-4">
      {/* Greeting shell — matches More rail radius + soft depth shadow */}
      <header className="hub-action-shell !rounded-[28px] px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">Good evening</p>
          <h1 className="mt-2 text-[15px] font-semibold text-[var(--text)] tracking-tight">
            {selectedWallet.name}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setActiveScreen('xpoints')}
          aria-label="Open X-Points"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] active:scale-95 transition-transform shadow-md ${
            isLight
              ? 'bg-amber-500/12 text-amber-600 border border-amber-500/20 shadow-amber-500/10'
              : 'bg-white/10 text-[#f2ecc8] border border-white/14 shadow-black/30'
          }`}
        >
          <Icon name="toll" size={18} />
        </button>
      </header>

      {/* Hero — dark: maroon glass + white type · light: solid white */}
      <section
        id="hub-smart-balance-card"
        className="relative overflow-hidden rounded-[32px] px-5 pt-6 pb-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`text-[10px] uppercase tracking-[0.24em] ${
                isLight ? 'text-zinc-500' : 'text-white/55'
              }`}
            >
              Available
            </p>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span
                className={`font-mono text-base font-medium ${
                  isLight ? 'text-[var(--accent)]' : 'text-white/75'
                }`}
              >
                ₦
              </span>
              <span
                className={`font-mono text-[2.05rem] font-medium leading-none tracking-tight ${
                  isLight ? 'text-[#0a0a0a]' : 'text-white'
                }`}
              >
                {balanceHidden
                  ? '••••••••'
                  : currentBalance.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </span>
            </div>
          </div>
          <button
            aria-label="Toggle Balance Visibility"
            onClick={() => setBalanceHidden(!balanceHidden)}
            className={`flex h-10 w-10 items-center justify-center rounded-full active:scale-95 transition-transform ${
              isLight
                ? 'bg-zinc-100 text-zinc-600'
                : 'bg-white/10 text-white/80 border border-white/15'
            }`}
            type="button"
          >
            <Icon name={balanceHidden ? 'visibility_off' : 'visibility'} size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={copyAccount}
          className={`mt-5 inline-flex items-center rounded-full px-3.5 py-1.5 text-[11px] font-mono active:scale-[0.98] transition-transform ${
            isLight
              ? 'bg-zinc-100 text-zinc-600'
              : 'bg-white/10 text-white/70 border border-white/12'
          }`}
        >
          {bankName} · {accountNumber.slice(0, 4)}…{accountNumber.slice(-4)}
        </button>

        {/* Dual pills + floating QR — Send left · Receive right */}
        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveScreen('transfer')}
            className="h-12 rounded-full bg-[var(--accent)] text-white font-semibold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform shadow-md shadow-[var(--accent)]/30"
          >
            Send
            <Icon name="arrow_upward" size={15} />
          </button>

          <button
            type="button"
            onClick={() => setIsQrOpen(true)}
            aria-label="Show QR"
            className={`relative z-10 -my-1 flex h-12 w-12 items-center justify-center rounded-full shadow-md active:scale-95 transition-transform ${
              isLight
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[#f2ecc8] text-[#1a0508]'
            }`}
          >
            <Icon name="qr_code_2" size={18} />
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('receive')}
            className={`h-12 rounded-full font-semibold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform ${
              isLight
                ? 'bg-zinc-100 text-[#0a0a0a] border border-black/6'
                : 'bg-white/12 text-white border border-white/18 backdrop-blur-md'
            }`}
          >
            Receive
            <Icon name="arrow_downward" size={15} />
          </button>
        </div>
      </section>

      {/* More tools rail */}
      <section className="min-w-0 w-full max-w-full">
        <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          More
        </p>
        <div className="hub-action-shell !rounded-[28px] min-w-0 w-full max-w-full overflow-hidden">
          <div
            ref={actionRailRef}
            className="hub-action-scroll flex flex-nowrap gap-1 px-2.5 py-3.5 select-none cursor-grab active:cursor-grabbing"
            onPointerDown={onActionPointerDown}
            onPointerMove={onActionPointerMove}
            onPointerUp={onActionPointerUp}
            onPointerCancel={onActionPointerUp}
          >
            <div
              className="hub-action-track flex flex-nowrap gap-1 will-change-transform"
              style={{ transform: `translate3d(${rubberX}px, 0, 0)` }}
            >
              {moreActions.map(action => (
                <button
                  key={action.label}
                  type="button"
                  onClick={e => {
                    if (
                      dragRef.current.moved ||
                      actionRailRef.current?.dataset.dragging === '1'
                    ) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    action.onClick();
                  }}
                  className="flex w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl py-1.5 cursor-pointer"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${action.pad} ${action.tint}`}
                  >
                    <Icon name={action.icon} size={18} />
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text)] text-center leading-tight whitespace-nowrap">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bento pebbles — matching glass pair */}
      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveScreen('save_together')}
          className="glass-card glass-strong !rounded-[28px] px-4 py-4 text-left active:scale-[0.99] transition-transform"
        >
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/15 ${
              isLight ? 'text-purple-500' : 'text-white'
            }`}
          >
            <Icon name="groups" size={17} />
          </span>
          <span className="mt-3 block text-[13px] font-semibold text-[var(--text)] leading-snug">
            Group savings
          </span>
          <span className="mt-1 block text-[11px] text-[var(--muted)] leading-snug">
            Accountability
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen('ask_money')}
          className="glass-card glass-strong !rounded-[28px] px-4 py-4 text-left active:scale-[0.99] transition-transform"
        >
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/15 ${
              isLight ? 'text-[var(--accent)]' : 'text-white'
            }`}
          >
            <Icon name="hand_coins" size={17} />
          </span>
          <span className="mt-3 block text-[13px] font-semibold text-[var(--text)] leading-snug">
            Request money
          </span>
          <span className="mt-1 block text-[11px] text-[var(--muted)] leading-snug">
            Friends & family
          </span>
        </button>
      </section>

      <PinSheetModal
        isOpen={isPosPinOpen}
        onClose={() => setIsPosPinOpen(false)}
        title="Enter Security PIN"
        subtitle="Authenticate to open Terminal Management"
        onSuccess={() => {
          setIsPosPinOpen(false);
          setActiveScreen('terminals');
        }}
      />
    </main>
  );
};
