import React from 'react';
import { useTransactions } from '../context/TransactionContext';
import { Icon } from './Icon';
import { BotanicalXIcon } from './BackgroundDepthPattern';

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ title, showBack }) => {
  const {
    activeScreen,
    setActiveScreen,
    navigateBack,
    setIsSimulateOpen,
    accountContext,
    setAccountContext,
    showToast,
    theme,
    toggleTheme,
  } = useTransactions();

  const isLight = theme === 'light';
  const iconTone = isLight ? 'text-[var(--muted)]' : 'text-white';

  // If on a subscreen that requires a dedicated back header
  const isSubScreen =
    showBack ||
    activeScreen === 'transfer' ||
    activeScreen === 'receive' ||
    activeScreen === 'paybills' ||
    activeScreen === 'ask_money' ||
    activeScreen === 'save_together' ||
    activeScreen === 'terminals' ||
    activeScreen === 'xpoints';

  if (isSubScreen) {
    let screenTitle = title;
    if (!screenTitle) {
      if (activeScreen === 'transfer') screenTitle = 'Transfer Funds';
      else if (activeScreen === 'receive') screenTitle = 'Receive Funds';
      else if (activeScreen === 'paybills') screenTitle = 'Pay Bills';
      else if (activeScreen === 'ask_money') screenTitle = 'Request for money';
      else if (activeScreen === 'save_together') screenTitle = 'Group savings';
      else if (activeScreen === 'terminals') screenTitle = 'Terminal Management';
      else if (activeScreen === 'xpoints') screenTitle = 'X-Points';
      else if (activeScreen === 'history') screenTitle = 'Transaction History';
    }

    return (
      <header className="sticky top-0 z-40 transition-all" id="top-app-bar-subscreen">
        <div className="flex justify-between items-center w-full px-4 h-14 max-w-md mx-auto">
          <div className="flex items-center gap-2.5">
            <button
              aria-label="Go back"
              onClick={navigateBack}
              className="frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg text-[var(--text)]"
              type="button"
            >
              <Icon name="arrow_back" size={18} />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold tracking-tight text-[var(--text)] text-[17px]">
                {screenTitle || 'Xtrapay'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeScreen === 'receive' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/25 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                LIVE NIBSS
              </span>
            )}
            {activeScreen === 'paybills' && (
              <span className="text-xs text-[var(--muted)] mr-1 font-medium">Utility</span>
            )}
            <button
              aria-label="Simulate Inward Transfer"
              onClick={() => setIsSimulateOpen(true)}
              className={`frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg ${isLight ? 'text-[#4cd7f6]' : 'text-white'}`}
              title="Simulate Real-time Incoming Transfer"
              type="button"
            >
              <Icon name="bolt" size={18} />
            </button>
            <button
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              id="subscreen-theme-toggle-btn"
              onClick={toggleTheme}
              className={`frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg ${iconTone}`}
              title={theme === 'dark' ? 'Switch to Light Mode (Crimson Red)' : 'Switch to Dark Mode'}
              type="button"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>
            <button
              aria-label="Support Agent"
              onClick={() => showToast('Support Agent', 'Connecting to 24/7 Xtrapay Tier-1 Concierge...', 'info')}
              className={`frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg ${iconTone}`}
              type="button"
            >
              <Icon name="support_agent" size={18} />
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Standard Top App Bar (Screen 1 Hub / Saving / Utility / Card / History)
  return (
    <header className="sticky top-0 z-40 transition-all" id="top-app-bar-main">
      <div className="flex justify-between items-center w-full px-4 h-14 max-w-md mx-auto">
        {/* Brand & Tenant Selector */}
        <div className="flex items-center space-x-2.5">
          <div className="frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg p-1">
            <BotanicalXIcon
              className="w-5 h-5"
              strokeColor={isLight ? '#dc2626' : '#ffffff'}
              opacity={1}
              strokeWidth={3}
            />
          </div>
          <div className="flex flex-col">
            <button
              onClick={() => setAccountContext(accountContext === 'personal' ? 'business' : 'personal')}
              className="flex items-center space-x-1 text-left group cursor-pointer"
              type="button"
            >
              <span className="text-[17px] font-semibold tracking-tight text-[var(--text)] group-hover:opacity-80 transition-colors">
                Xtrapay
              </span>
              <Icon
                name="expand_more"
                size={16}
                className={`${iconTone} transition-colors`}
              />
            </button>
            <span className="text-[10px] text-[var(--muted)] font-semibold tracking-wider uppercase">
              {accountContext === 'personal' ? 'PERSONAL ACCOUNT' : 'BUSINESS ACCOUNT'}
            </span>
          </div>
        </div>

        {/* Action Quartet */}
        <div className="flex items-center space-x-1.5">
          {/* Real-time Simulator Trigger */}
          <button
            aria-label="Real-time Simulator"
            onClick={() => setIsSimulateOpen(true)}
            className={`glass-chip !rounded-lg !px-2 !py-1 flex items-center gap-1.5 text-[11px] font-medium cursor-pointer ${
              isLight ? 'text-[#4cd7f6]' : 'text-white'
            }`}
            title="Simulate Inward Transfer"
            type="button"
          >
            <Icon name="bolt" size={13} />
            <span>Simulate</span>
          </button>

          {/* Theme Toggle (Light / Dark with Red Primary Accent) */}
          <button
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            id="main-theme-toggle-btn"
            onClick={toggleTheme}
            className={`frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg cursor-pointer ${iconTone}`}
            title={theme === 'dark' ? 'Switch to Light Mode (Crimson Red)' : 'Switch to Dark Mode'}
            type="button"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>

          {/* Support */}
          <button
            aria-label="Support Agent"
            onClick={() => showToast('Support Agent', 'Live financial concierge connected.', 'info')}
            className={`frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg cursor-pointer ${iconTone}`}
            type="button"
          >
            <Icon name="support_agent" size={18} />
          </button>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            onClick={() => setActiveScreen('history')}
            className={`frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg relative cursor-pointer ${iconTone}`}
            type="button"
          >
            <Icon name="notifications" size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#4edea3] ring-2 ring-[var(--bg-0)]" />
          </button>

          {/* Profile Avatar */}
          <button
            aria-label="Profile Account"
            onClick={() => showToast('Profile', 'Logged in as Innocent Solomon (JD) • Tier 3', 'info')}
            className="frosted-pad !h-7 !w-7 !min-h-7 !min-w-7 !rounded-full text-[var(--accent)] text-xs font-semibold cursor-pointer"
            type="button"
          >
            JD
          </button>
        </div>
      </div>
    </header>
  );
};
