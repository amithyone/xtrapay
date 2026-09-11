import React from 'react';
import { ScreenType } from '../types';
import { useTransactions } from '../context/TransactionContext';
import { Icon } from './Icon';

export const BottomNavBar: React.FC = () => {
  const { activeScreen, setActiveScreen, theme } = useTransactions();

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
      matchScreens: ['hub', 'transfer', 'receive', 'paybills', 'ask_money'],
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
      className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto pb-safe transition-all"
      id="bottom-navigation-bar"
    >
      <div className="grid grid-cols-5 w-full h-16 px-1">
        {tabs.map(tab => {
          const isActive = tab.matchScreens
            ? tab.matchScreens.includes(activeScreen)
            : activeScreen === tab.id;

          const activeColor = theme === 'light' ? 'text-red-600 font-bold' : 'text-[#e94560] font-bold';
          const inactiveColor = theme === 'light' ? 'text-slate-500 hover:text-slate-900 font-medium' : 'text-[var(--muted)] hover:text-[var(--text)] font-medium';

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveScreen(tab.id)}
              className={`h-full w-full flex flex-col items-center justify-center py-1 relative transition-transform duration-150 ease-out active:scale-90 group select-none cursor-pointer ${
                isActive ? activeColor : inactiveColor
              }`}
              type="button"
            >
              {/* Icon Container with subtle active glow */}
              <div className="relative flex items-center justify-center h-6 w-6">
                {isActive && (
                  <span className={`absolute inset-0 rounded-full blur-sm scale-125 pointer-events-none transition-all ${
                    theme === 'light' ? 'bg-red-500/20' : 'bg-[#e94560]/25'
                  }`} />
                )}
                <Icon
                  name={tab.icon}
                  size={20}
                  strokeWidth={isActive ? 2.3 : 1.8}
                  className={`transition-all duration-150 relative z-10 ${
                    isActive
                      ? `scale-110 ${theme === 'light' ? 'text-red-600' : 'text-[#e94560]'}`
                      : `group-hover:scale-105 ${theme === 'light' ? 'text-slate-500 group-hover:text-slate-800' : 'text-[var(--muted)]'}`
                  }`}
                />
              </div>

              {/* Symmetrical Label */}
              <span
                className={`text-[10px] tracking-tight mt-1 whitespace-nowrap uppercase transition-all duration-150 ${
                  isActive ? activeColor : inactiveColor
                }`}
              >
                {tab.label}
              </span>

              {/* Active Indicator Pip with fixed geometry to avoid layout shift */}
              <div className="h-1.5 flex items-center justify-center mt-0.5">
                <span
                  className={`w-1 h-1 rounded-full transition-all duration-150 ${
                    isActive
                      ? theme === 'light'
                        ? 'bg-red-600 opacity-100 scale-100 shadow-sm shadow-red-500/50'
                        : 'bg-[#e94560] opacity-100 scale-100'
                      : 'bg-transparent opacity-0 scale-50'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
