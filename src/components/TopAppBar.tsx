import React, { useState } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { Icon } from './Icon';
import { BotanicalXIcon } from './BackgroundDepthPattern';
import type { WalletAccount } from '../data/wallets';

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
}

function walletBadge(kind: WalletAccount['kind']) {
  if (kind === 'personal') return 'Personal';
  if (kind === 'business') return 'Business';
  if (kind === 'sub_personal') return 'Sub · Personal';
  return 'Sub · Business';
}

function walletIcon(kind: WalletAccount['kind']) {
  if (kind === 'business' || kind === 'sub_business') return 'domain';
  if (kind.startsWith('sub')) return 'call_split';
  return 'person';
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ title, showBack }) => {
  const {
    activeScreen,
    setActiveScreen,
    navigateBack,
    setIsSimulateOpen,
    showToast,
    theme,
    toggleTheme,
    wallets,
    selectedWallet,
    selectWallet,
    personalBalance,
    businessBalance,
  } = useTransactions();

  const isLight = theme === 'light';
  const iconTone = isLight ? 'text-[var(--muted)]' : 'text-white';
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const displayBalance = (w: WalletAccount) => {
    if (w.kind === 'personal') return personalBalance;
    if (w.kind === 'business') return businessBalance;
    return w.balance;
  };

  const isSubScreen =
    showBack ||
    activeScreen === 'transfer' ||
    activeScreen === 'receive' ||
    activeScreen === 'paybills' ||
    activeScreen === 'airtime' ||
    activeScreen === 'data' ||
    activeScreen === 'ask_money' ||
    activeScreen === 'save_together' ||
    activeScreen === 'terminals' ||
    activeScreen === 'xpoints' ||
    activeScreen === 'profile' ||
    activeScreen === 'terms' ||
    activeScreen === 'privacy' ||
    activeScreen === 'checkoutnow' ||
    activeScreen === 'loans' ||
    activeScreen === 'limits' ||
    activeScreen === 'support' ||
    activeScreen === 'network' ||
    activeScreen === 'utility' ||
    activeScreen === 'history' ||
    activeScreen === 'statement' ||
    activeScreen === 'settlement' ||
    activeScreen === 'recurring' ||
    activeScreen === 'sub_accounts' ||
    activeScreen === 'business_accounts';

  if (isSubScreen) {
    let screenTitle = title;
    if (!screenTitle) {
      if (activeScreen === 'transfer') screenTitle = 'Transfer Funds';
      else if (activeScreen === 'receive') screenTitle = 'Receive Funds';
      else if (activeScreen === 'paybills') screenTitle = 'Pay Bills';
      else if (activeScreen === 'airtime') screenTitle = 'Buy airtime';
      else if (activeScreen === 'data') screenTitle = 'Buy data';
      else if (activeScreen === 'ask_money') screenTitle = 'Request for money';
      else if (activeScreen === 'save_together') screenTitle = 'Group savings';
      else if (activeScreen === 'terminals') screenTitle = 'Terminal Management';
      else if (activeScreen === 'xpoints') screenTitle = 'X-Points';
      else if (activeScreen === 'profile') screenTitle = 'Profile & Settings';
      else if (activeScreen === 'terms') screenTitle = 'Terms of use';
      else if (activeScreen === 'privacy') screenTitle = 'Privacy policy';
      else if (activeScreen === 'checkoutnow') screenTitle = 'CheckoutNow';
      else if (activeScreen === 'loans') screenTitle = 'Loans';
      else if (activeScreen === 'limits') screenTitle = 'Limit settings';
      else if (activeScreen === 'support') screenTitle = 'Support';
      else if (activeScreen === 'network') screenTitle = 'Network';
      else if (activeScreen === 'utility') screenTitle = 'Utilities & Analytics';
      else if (activeScreen === 'history') screenTitle = 'Transaction History';
      else if (activeScreen === 'statement') screenTitle = 'Statements';
      else if (activeScreen === 'settlement') screenTitle = 'Settlement';
      else if (activeScreen === 'recurring') screenTitle = 'Recurring Payments';
      else if (activeScreen === 'sub_accounts') screenTitle = 'Sub-Accounts';
      else if (activeScreen === 'business_accounts') screenTitle = 'Business Accounts';
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
              onClick={() =>
                showToast('Support Agent', 'Connecting to 24/7 Xtrapay Tier-1 Concierge...', 'info')
              }
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

  return (
    <>
      <header className="sticky top-0 z-40 transition-all" id="top-app-bar-main">
        <div className="flex justify-between items-center w-full px-4 h-14 max-w-md mx-auto">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg p-1 shrink-0">
              <BotanicalXIcon
                className="w-5 h-5"
                strokeColor={isLight ? '#dc2626' : '#ffffff'}
                opacity={1}
                strokeWidth={3}
              />
            </div>
            <button
              type="button"
              onClick={() => setAccountModalOpen(true)}
              className="settings-row flex flex-col text-left appearance-none border-0 bg-transparent p-0 cursor-pointer min-w-0"
              aria-haspopup="dialog"
              aria-label="Select account"
            >
              <span className="flex items-center gap-1">
                <span className="text-[17px] font-semibold tracking-tight text-[var(--text)] truncate">
                  Xtrapay
                </span>
                <Icon name="expand_more" size={16} className={`${iconTone} shrink-0`} />
              </span>
              <span className="text-[10px] text-[var(--muted)] font-semibold tracking-wider uppercase truncate max-w-[11rem]">
                {selectedWallet.name}
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
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

            <button
              aria-label="Support Agent"
              onClick={() => showToast('Support Agent', 'Live financial concierge connected.', 'info')}
              className={`frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg cursor-pointer ${iconTone}`}
              type="button"
            >
              <Icon name="support_agent" size={18} />
            </button>

            <button
              aria-label="Notifications"
              onClick={() => setActiveScreen('history')}
              className={`frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg relative cursor-pointer ${iconTone}`}
              type="button"
            >
              <Icon name="notifications" size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#4edea3] ring-2 ring-[var(--bg-0)]" />
            </button>

            <button
              aria-label="Profile Account"
              onClick={() => setActiveScreen('profile')}
              className="frosted-pad !h-7 !w-7 !min-h-7 !min-w-7 !rounded-full text-[var(--accent)] text-xs font-semibold cursor-pointer"
              type="button"
            >
              JD
            </button>
          </div>
        </div>
      </header>

      {accountModalOpen && (
        <div
          className="app-modal-overlay z-[90] bg-black/70 backdrop-blur-md"
          role="presentation"
          onClick={() => setAccountModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select account"
            id="account-switcher-modal"
            className="app-modal-panel glass-card glass-strong settings-list !rounded-[24px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                  Accounts
                </p>
                <h2 className="mt-1 text-[16px] font-semibold text-[var(--text)]">
                  Select account in view
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="max-h-[min(60vh,26rem)] overflow-y-auto divide-y divide-[var(--glass-border)]">
              {wallets.map(wallet => {
                const active = wallet.id === selectedWallet.id;
                const bal = displayBalance(wallet);
                return (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => {
                      selectWallet(wallet.id);
                      setAccountModalOpen(false);
                      showToast('Account switched', `Now viewing ${wallet.name}.`, 'info');
                    }}
                    className={`settings-row w-full flex items-start gap-3 px-5 py-4 text-left appearance-none border-0 cursor-pointer ${
                      active
                        ? 'bg-[var(--accent)]/10'
                        : 'bg-transparent active:bg-black/[0.03] dark:active:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
                      <Icon name={walletIcon(wallet.kind)} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold text-[var(--text)] truncate">
                          {wallet.name}
                        </p>
                        <span className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border border-[var(--glass-border)] text-[var(--muted)]">
                          {walletBadge(wallet.kind)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[var(--muted)] truncate">
                        {wallet.subtitle} · {wallet.accountNumber}
                      </p>
                      <p className="mt-1 text-[13px] font-mono font-semibold text-[var(--text)]">
                        ₦
                        {bal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    {active && (
                      <Icon name="check" size={18} className="text-[var(--accent)] shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-[var(--glass-border)]">
              <button
                type="button"
                onClick={() => {
                  setAccountModalOpen(false);
                  setActiveScreen('sub_accounts');
                }}
                className="w-full h-11 rounded-2xl border border-[var(--glass-border)] text-[13px] font-semibold text-[var(--accent)] flex items-center justify-center gap-2 bg-black/[0.03] dark:bg-white/[0.05]"
              >
                <Icon name="add" size={15} />
                Manage sub-accounts
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
