import React, { useEffect, useRef, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';
import {
  animateRubberRelease,
  clampScrollWithRubber,
  runSwipeHintLoop,
} from '../../lib/swipeHint';

export const HubScreen: React.FC = () => {
  const {
    personalBalance,
    businessBalance,
    accountContext,
    balanceHidden,
    setBalanceHidden,
    setActiveScreen,
    setIsQrOpen,
    setIsNearbyPayOpen,
    setIsPayAtShopOpen,
    setIsScanToPayOpen,
    showToast,
  } = useTransactions();

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
    // Do NOT capture yet — allow button clicks until a real drag starts
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
      // Keep drag flag briefly so the synthetic click after a drag is ignored
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

  // Repeated idle swipe hint — ease-in-out half-tile peek (see design-animation skill)
  useEffect(() => {
    const el = actionRailRef.current;
    if (!el) return;
    return runSwipeHintLoop(el, {
      idleMs: 2000,
      shouldCancel: () => railInteractedRef.current || dragRef.current.active,
    });
  }, []);

  const currentBalance = accountContext === 'personal' ? personalBalance : businessBalance;
  const accountNumber = accountContext === 'personal' ? '0124892019' : '2048991204';
  const bankName = accountContext === 'personal' ? 'Zenith Bank' : 'Providus Bank';

  const copyAccount = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(accountNumber);
    }
    showToast('Copied to Clipboard', `Account ${accountNumber} (${bankName}) copied.`);
  };

  const actions = [
    {
      label: 'Send',
      icon: 'arrow_upward',
      tint: 'text-red-600',
      pad: 'bg-red-500/18',
      onClick: () => setActiveScreen('transfer'),
    },
    {
      label: 'Receive',
      icon: 'arrow_downward',
      tint: 'text-emerald-600',
      pad: 'bg-emerald-500/18',
      onClick: () => setActiveScreen('receive'),
    },
    {
      label: 'Bills',
      icon: 'receipt_long',
      tint: 'text-cyan-600',
      pad: 'bg-cyan-500/18',
      onClick: () => setActiveScreen('paybills'),
    },
    {
      label: 'Chat',
      icon: 'chat_bubble',
      tint: 'text-purple-600',
      pad: 'bg-purple-500/18',
      onClick: () =>
        showToast('Xtrapay Chat', 'Peer-to-peer encrypted messaging active.', 'info'),
    },
    {
      label: 'Nearby',
      icon: 'wifi',
      tint: 'text-orange-600',
      pad: 'bg-orange-500/18',
      onClick: () => setIsNearbyPayOpen(true),
    },
    {
      label: 'Shop',
      icon: 'store',
      tint: 'text-teal-600',
      pad: 'bg-teal-500/18',
      onClick: () => setIsPayAtShopOpen(true),
    },
    {
      label: 'Scan',
      icon: 'qr_code',
      tint: 'text-sky-600',
      pad: 'bg-sky-500/18',
      onClick: () => setIsScanToPayOpen(true),
    },
  ] as const;

  return (
    <main className="flex-1 min-w-0 px-5 pt-7 pb-28">
      <header className="glass-card glass-strong mb-4 !rounded-[20px] px-6 py-4">
        <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">
          Good evening
        </p>
        <h1 className="mt-2.5 text-[15px] font-medium text-[var(--text)] tracking-tight leading-snug">
          {accountContext === 'personal' ? 'Personal wallet' : 'Business wallet'}
        </h1>
      </header>

      <section
        id="hub-smart-balance-card"
        className="glass-card relative overflow-hidden !rounded-[24px] px-6 py-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              Available
            </p>
            <div className="mt-3.5 flex items-baseline gap-1">
              <span className="font-mono text-sm font-normal text-[var(--accent)]">₦</span>
              <span className="font-mono text-[1.5rem] font-normal leading-none tracking-tight text-[var(--text)]">
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
            className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
            type="button"
          >
            <Icon name={balanceHidden ? 'visibility_off' : 'visibility'} size={16} />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={copyAccount}
            className="glass-chip !rounded-full !px-3.5 !py-2 !text-[11px] font-mono text-[var(--muted)] active:scale-[0.98]"
          >
            {bankName} · {accountNumber.slice(0, 4)}…{accountNumber.slice(-4)}
          </button>
          <button
            type="button"
            onClick={() => setIsQrOpen(true)}
            className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
            aria-label="Show QR"
          >
            <Icon name="qr_code_2" size={16} />
          </button>
        </div>
      </section>

      <section className="mt-6 min-w-0 w-full max-w-full">
        <div className="hub-action-shell min-w-0 w-full max-w-full overflow-hidden">
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
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={(e) => {
                    // Ignore click that follows a real drag swipe
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
                  className="flex w-[4.75rem] min-w-[4.75rem] max-w-[4.75rem] shrink-0 grow-0 basis-[4.75rem] flex-col items-center gap-2 rounded-2xl py-2 cursor-pointer"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${action.pad} ${action.tint}`}
                  >
                    <Icon name={action.icon} size={18} />
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text)] text-center leading-tight px-0.5 whitespace-nowrap">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-[var(--muted)] opacity-60">
          Swipe for more →
        </p>
      </section>

      <section className="mt-6">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setActiveScreen('save_together')}
            className="glass-card glass-strong relative z-10 flex w-full items-center gap-3.5 !rounded-[20px] px-5 py-4 text-left cursor-pointer active:scale-[0.99] transition-transform"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/12 text-purple-300">
              <Icon name="groups" size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-[var(--text)]">Group savings</span>
              <span className="mt-0.5 block text-[11px] text-[var(--muted)]">Accountability savings</span>
            </span>
            <Icon name="chevron_right" size={18} className="text-[var(--muted)] opacity-50" />
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('ask_money')}
            className="glass-card glass-strong relative z-10 flex w-full items-center gap-3.5 !rounded-[20px] px-5 py-4 text-left cursor-pointer active:scale-[0.99] transition-transform"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/12 text-cyan-300">
              <Icon name="hand_coins" size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-[var(--text)]">Request for money</span>
              <span className="mt-0.5 block text-[11px] text-[var(--muted)]">Ask people you know for money</span>
            </span>
            <Icon name="chevron_right" size={18} className="text-[var(--muted)] opacity-50" />
          </button>
        </div>
      </section>
    </main>
  );
};
