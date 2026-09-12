import React from 'react';
import { ScreenType } from '../types';
import { useTransactions } from '../context/TransactionContext';
import { Icon } from './Icon';

/**
 * Circle-active bottom nav (reference: crypto-wallet style).
 * Rollback: set USE_LEGACY_BOTTOM_NAV = true in App.tsx
 * Legacy file: BottomNavBar.legacy.tsx
 */
export const BottomNavBar: React.FC = () => {
  const { activeScreen, setActiveScreen, theme } = useTransactions();
  const isLight = theme === 'light';

  const tabs: {
    id: ScreenType;
    label: string;
    icon: string;
    matchScreens?: ScreenType[];
  }[] = [
    {
      id: 'hub',
      label: 'Hub',
      icon: 'grid_view',
      matchScreens: [
        'hub',
        'transfer',
        'receive',
        'paybills',
        'ask_money',
        'terminals',
        'xpoints',
        'profile',
      ],
    },
    {
      id: 'saving',
      label: 'Saving',
      icon: 'savings',
      matchScreens: ['saving', 'save_together'],
    },
    {
      id: 'utility',
      label: 'Utility',
      icon: 'bolt',
      matchScreens: ['utility'],
    },
    {
      id: 'card',
      label: 'Cards',
      icon: 'credit_card',
      matchScreens: ['card'],
    },
    {
      id: 'history',
      label: 'History',
      icon: 'receipt_long',
      matchScreens: ['history'],
    },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto pb-safe"
      id="bottom-navigation-bar"
      data-nav-style="circle-active"
    >
      <div className="mx-3 mb-2 rounded-[28px] border border-[var(--glass-border)] bg-[var(--glass-nav-fill)] backdrop-blur-[18px] shadow-[0_-8px_28px_rgba(0,0,0,0.18)]">
        <div className="grid grid-cols-5 w-full h-[4.25rem] px-1.5">
          {tabs.map(tab => {
            const isActive = tab.matchScreens
              ? tab.matchScreens.includes(activeScreen)
              : activeScreen === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                type="button"
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveScreen(tab.id)}
                className="h-full w-full flex flex-col items-center justify-center gap-1 select-none cursor-pointer active:scale-90 transition-transform duration-150"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ${
                    isActive
                      ? isLight
                        ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/30'
                        : 'bg-[#f2ecc8] text-[#1a0508] shadow-md shadow-black/25'
                      : isLight
                        ? 'bg-transparent text-[var(--muted)]'
                        : 'bg-transparent text-white'
                  }`}
                >
                  <Icon
                    name={tab.icon}
                    size={20}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                </span>
                <span
                  className={`text-[9px] tracking-wide uppercase transition-colors duration-150 ${
                    isActive
                      ? isLight
                        ? 'text-[var(--accent)] font-bold'
                        : 'text-[#f2ecc8] font-bold'
                      : isLight
                        ? 'text-[var(--muted)] font-medium'
                        : 'text-white/70 font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
