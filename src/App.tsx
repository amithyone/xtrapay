import React from 'react';
import { TransactionProvider, useTransactions } from './context/TransactionContext';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { BottomNavBarLegacy } from './components/BottomNavBar.legacy';
import { HubScreen } from './components/screens/HubScreen';
import { HubScreen as HubScreenLegacy } from './components/screens/HubScreen.legacy';
import { SavingScreen } from './components/screens/SavingScreen';
import { UtilityScreen } from './components/screens/UtilityScreen';
import { DollarCardScreen } from './components/screens/DollarCardScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { TransferScreen } from './components/screens/TransferScreen';
import { ReceiveScreen } from './components/screens/ReceiveScreen';
import { PayBillsScreen } from './components/screens/PayBillsScreen';
import { AirtimeScreen, DataScreen } from './components/screens/AirtimeScreen';
import { AskMoneyScreen } from './components/screens/AskMoneyScreen';
import { SaveTogetherScreen } from './components/screens/SaveTogetherScreen';
import { TerminalScreen } from './components/screens/TerminalScreen';
import { XPointsScreen } from './components/screens/XPointsScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { PayScreen } from './components/screens/PayScreen';
import { ServicesScreen } from './components/screens/ServicesScreen';
import { StatementScreen } from './components/screens/StatementScreen';
import { SettlementScreen } from './components/screens/SettlementScreen';
import { RecurringPaymentsScreen } from './components/screens/RecurringPaymentsScreen';
import { SubAccountsScreen } from './components/screens/SubAccountsScreen';
import { BusinessAccountsScreen } from './components/screens/BusinessAccountsScreen';
import { TermsScreen, PrivacyScreen } from './components/screens/LegalScreen';
import { CheckoutNowScreen } from './components/screens/CheckoutNowScreen';
import { LoansScreen } from './components/screens/LoansScreen';
import { LimitsScreen } from './components/screens/LimitsScreen';
import { SupportScreen } from './components/screens/SupportScreen';
import { NetworkScreen } from './components/screens/NetworkScreen';
import { AuthFlow } from './components/auth/AuthFlow';
import { TransferSuccessModal } from './components/modals/TransferSuccessModal';
import { QrModal } from './components/modals/QrModal';
import { ShareModal } from './components/modals/ShareModal';
import { NearbyPayModal } from './components/modals/NearbyPayModal';
import { PayAtShopModal } from './components/modals/PayAtShopModal';
import { ScanToPayModal } from './components/modals/ScanToPayModal';
import { BackgroundDepthPattern } from './components/BackgroundDepthPattern';
import { Icon } from './components/Icon';

/** Flip to true to restore the previous bottom nav */
const USE_LEGACY_BOTTOM_NAV = false;
/** Flip to true to restore the previous Hub layout */
const USE_LEGACY_HUB = false;

const AppContent: React.FC = () => {
  const { activeScreen, toast, theme, dismissToast, isAuthenticated, authReady } =
    useTransactions();

  if (!authReady) {
    return (
      <div
        className="min-h-screen flex justify-center items-center bg-[var(--bg-0)]"
        data-theme={theme === 'light' ? 'light' : 'dark'}
      >
        <p className="text-[13px] text-[var(--muted)]">Connecting…</p>
      </div>
    );
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'hub':
        return USE_LEGACY_HUB ? <HubScreenLegacy /> : <HubScreen />;
      case 'pay':
        return <PayScreen />;
      case 'services':
        return <ServicesScreen />;
      case 'statement':
        return <StatementScreen />;
      case 'settlement':
        return <SettlementScreen />;
      case 'recurring':
        return <RecurringPaymentsScreen />;
      case 'sub_accounts':
        return <SubAccountsScreen />;
      case 'business_accounts':
        return <BusinessAccountsScreen />;
      case 'saving':
        return <SavingScreen />;
      case 'save_together':
        return <SaveTogetherScreen />;
      case 'ask_money':
        return <AskMoneyScreen />;
      case 'utility':
        return <UtilityScreen />;
      case 'card':
        return <DollarCardScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'transfer':
        return <TransferScreen />;
      case 'receive':
        return <ReceiveScreen />;
      case 'paybills':
        return <PayBillsScreen />;
      case 'airtime':
        return <AirtimeScreen />;
      case 'data':
        return <DataScreen />;
      case 'terminals':
        return <TerminalScreen />;
      case 'xpoints':
        return <XPointsScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'terms':
        return <TermsScreen />;
      case 'privacy':
        return <PrivacyScreen />;
      case 'checkoutnow':
        return <CheckoutNowScreen />;
      case 'loans':
        return <LoansScreen />;
      case 'limits':
        return <LimitsScreen />;
      case 'support':
        return <SupportScreen />;
      case 'network':
        return <NetworkScreen />;
      default:
        return USE_LEGACY_HUB ? <HubScreenLegacy /> : <HubScreen />;
    }
  };

  return (
    <div
      className="min-h-screen flex justify-center overflow-x-hidden transition-colors bg-[var(--bg-0)]"
      data-theme={theme === 'light' ? 'light' : 'dark'}
    >
      <div className={`w-full max-w-md min-h-screen flex flex-col relative shadow-2xl transition-all ${
        theme === 'light'
          ? 'border-x border-black/5'
          : 'border-x border-white/5'
      }`}>
        <BackgroundDepthPattern />

        {isAuthenticated && <TopAppBar />}

        <div className="flex-1 flex flex-col relative z-10 min-w-0 overflow-x-hidden">
          {isAuthenticated ? renderScreen() : <AuthFlow />}
        </div>

        {isAuthenticated && (USE_LEGACY_BOTTOM_NAV ? <BottomNavBarLegacy /> : <BottomNavBar />)}

        {isAuthenticated && (
          <>
            <TransferSuccessModal />
            <QrModal />
            <ShareModal />
            <NearbyPayModal />
            <PayAtShopModal />
            <ScanToPayModal />
          </>
        )}

        {toast && (
          <div
            className="fixed top-3 left-0 right-0 z-[90] flex justify-center px-5 pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <div
              className={`app-toast pointer-events-auto flex w-auto max-w-[min(20rem,calc(100%-2.5rem))] items-center gap-2 rounded-2xl px-2.5 py-2 border backdrop-blur-[18px] ${
                theme === 'light' ? 'app-toast--light' : 'app-toast--dark'
              }`}
              data-toast-type={toast.type}
            >
              <span
                className={`app-toast-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  toast.type === 'success'
                    ? theme === 'light'
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : 'bg-emerald-500/20 text-emerald-300'
                    : toast.type === 'warning'
                    ? theme === 'light'
                      ? 'bg-amber-500/15 text-amber-600'
                      : 'bg-amber-500/20 text-amber-300'
                    : theme === 'light'
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                    : 'bg-white/12 text-white'
                }`}
              >
                <Icon
                  name={
                    toast.type === 'success'
                      ? 'check_circle'
                      : toast.type === 'warning'
                      ? 'warning'
                      : 'info'
                  }
                  size={15}
                />
              </span>
              <div className="min-w-0 flex-1 text-left pr-0.5">
                <p className="text-[12px] font-semibold leading-tight tracking-tight truncate">
                  {toast.title}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug opacity-75 line-clamp-2">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close notification"
                onClick={dismissToast}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full active:scale-95 transition-transform ${
                  theme === 'light'
                    ? 'bg-black/5 text-zinc-500 hover:bg-black/10'
                    : 'bg-white/10 text-white/80 hover:bg-white/16'
                }`}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <TransactionProvider>
      <AppContent />
    </TransactionProvider>
  );
}
