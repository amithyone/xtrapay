import React from 'react';
import { TransactionProvider, useTransactions } from './context/TransactionContext';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { HubScreen } from './components/screens/HubScreen';
import { SavingScreen } from './components/screens/SavingScreen';
import { UtilityScreen } from './components/screens/UtilityScreen';
import { DollarCardScreen } from './components/screens/DollarCardScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { TransferScreen } from './components/screens/TransferScreen';
import { ReceiveScreen } from './components/screens/ReceiveScreen';
import { PayBillsScreen } from './components/screens/PayBillsScreen';
import { AskMoneyScreen } from './components/screens/AskMoneyScreen';
import { SaveTogetherScreen } from './components/screens/SaveTogetherScreen';
import { TransferSuccessModal } from './components/modals/TransferSuccessModal';
import { QrModal } from './components/modals/QrModal';
import { ShareModal } from './components/modals/ShareModal';
import { SimulateModal } from './components/modals/SimulateModal';
import { NearbyPayModal } from './components/modals/NearbyPayModal';
import { PayAtShopModal } from './components/modals/PayAtShopModal';
import { ScanToPayModal } from './components/modals/ScanToPayModal';
import { BackgroundDepthPattern } from './components/BackgroundDepthPattern';
import { Icon } from './components/Icon';

const AppContent: React.FC = () => {
  const { activeScreen, toast, theme } = useTransactions();

  const renderScreen = () => {
    switch (activeScreen) {
      case 'hub':
        return <HubScreen />;
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
      default:
        return <HubScreen />;
    }
  };

  return (
    <div
      className="min-h-screen flex justify-center overflow-x-hidden transition-colors bg-[var(--bg-0)]"
      data-theme={theme === 'light' ? 'light' : 'dark'}
    >
      {/* Mobile-contained layout wrapper */}
      <div className={`w-full max-w-md min-h-screen flex flex-col relative shadow-2xl transition-all ${
        theme === 'light'
          ? 'border-x border-black/5'
          : 'border-x border-white/5'
      }`}>
        {/* Soft 3D atmosphere — sits under frosted glass cards */}
        <BackgroundDepthPattern />

        {/* Top App Bar Header */}
        <TopAppBar />

        {/* Active Screen View */}
        <div className="flex-1 flex flex-col relative z-10 min-w-0 overflow-x-hidden">
          {renderScreen()}
        </div>

        {/* Persistent Bottom Navigation */}
        <BottomNavBar />

        {/* Modals & Sheets */}
        <TransferSuccessModal />
        <QrModal />
        <ShareModal />
        <SimulateModal />
        <NearbyPayModal />
        <PayAtShopModal />
        <ScanToPayModal />

        {/* Live Floating Toast Notification */}
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] pointer-events-none transition-all duration-300">
            <div
              className={`px-4 py-2.5 rounded-xl shadow-2xl border flex items-center gap-2.5 backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-[#00a572]/90 border-[#4edea3]/40 text-white'
                  : toast.type === 'warning'
                  ? 'bg-[#bc7000]/90 border-[#ffb4ab]/40 text-white'
                  : theme === 'light'
                  ? 'bg-white/90 border-red-500/30 text-slate-900 shadow-red-500/10'
                  : 'bg-[#1c2028]/95 border-[#c0c1ff]/40 text-[#dfe2ee]'
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
                size={18}
                className={theme === 'light' && toast.type === 'info' ? 'text-red-600' : ''}
              />
              <div className="text-xs text-left">
                <p className="font-semibold leading-tight">{toast.title}</p>
                <p className="text-[11px] opacity-90 leading-tight">{toast.message}</p>
              </div>
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
