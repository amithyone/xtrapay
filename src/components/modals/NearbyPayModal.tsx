import React, { useState, useEffect } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { NEARBY_PEERS } from '../../data/initialData';
import { NearbyPeer } from '../../types';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

export const NearbyPayModal: React.FC = () => {
  const {
    isNearbyPayOpen,
    setIsNearbyPayOpen,
    executeNearbySend,
    simulateInwardTransfer,
    showToast,
  } = useTransactions();

  const [mode, setMode] = useState<'send' | 'receive'>('send');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [peers, setPeers] = useState<NearbyPeer[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<NearbyPeer | null>(null);
  const [amountStr, setAmountStr] = useState<string>('3,500');
  const [isKeypadOpen, setIsKeypadOpen] = useState<boolean>(false);
  const [isPinOpen, setIsPinOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isNearbyPayOpen) {
      setIsScanning(true);
      const timer = setTimeout(() => {
        setPeers(NEARBY_PEERS);
        setIsScanning(false);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setPeers([]);
    }
  }, [isNearbyPayOpen]);

  if (!isNearbyPayOpen) return null;

  const handleStartSend = (peer: NearbyPeer) => {
    setSelectedPeer(peer);
    setIsKeypadOpen(true);
  };

  const handleProceedToPin = () => {
    setIsKeypadOpen(false);
    setIsPinOpen(true);
  };

  const handlePinSuccess = (pin: string) => {
    if (selectedPeer) {
      const amount = parseFloat(amountStr.replace(/,/g, ''));
      const ok = executeNearbySend(selectedPeer, amount, pin);
      if (ok) {
        setIsPinOpen(false);
        setIsNearbyPayOpen(false);
      }
    }
  };

  const handleSimulateIncoming = () => {
    simulateInwardTransfer(5000, 'Sarah Williams (Nearby BLE)');
    setIsNearbyPayOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md bg-[#181c24] border border-[#464554]/40 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4 animate-slideUp text-left"
        id="nearby-pay-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#464554]/20">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-full bg-[#8083ff]/20 text-[#c0c1ff] flex items-center justify-center">
              <Icon name="wifi" size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#dfe2ee]">Nearby Pay</h3>
              <p className="text-[10px] text-[#908fa0]">Bluetooth LE Wallet-to-Wallet</p>
            </div>
          </div>
          <button
            onClick={() => setIsNearbyPayOpen(false)}
            className="p-1.5 text-[#908fa0] hover:text-[#dfe2ee] rounded-lg hover:bg-[#262a33]"
            type="button"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Mode Selector: Send Nearby | Receive Nearby */}
        <div className="p-1 rounded-xl bg-[#0a0e16] border border-[#464554]/30 flex items-center">
          <button
            onClick={() => setMode('send')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              mode === 'send'
                ? 'bg-[#8083ff] text-[#0d0096] font-bold shadow-sm'
                : 'text-[#c7c4d7] hover:text-[#dfe2ee]'
            }`}
            type="button"
          >
            <Icon name="arrow_upward" size={14} />
            <span>Send Nearby</span>
          </button>
          <button
            onClick={() => setMode('receive')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              mode === 'receive'
                ? 'bg-[#8083ff] text-[#0d0096] font-bold shadow-sm'
                : 'text-[#c7c4d7] hover:text-[#dfe2ee]'
            }`}
            type="button"
          >
            <Icon name="arrow_downward" size={14} />
            <span>Receive Nearby</span>
          </button>
        </div>

        {/* SEND NEARBY MODE */}
        {mode === 'send' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-3 rounded-xl bg-[#1c2028] border border-[#464554]/30 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8083ff] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#c0c1ff]"></span>
                </span>
                <span className="text-[#dfe2ee] font-medium">
                  {isScanning
                    ? 'Scanning for nearby Checkout devices...'
                    : `${peers.length} nearby wallets discovered`}
                </span>
              </div>
              <span className="text-[10px] text-[#908fa0] font-mono">BLE 5.2 Active</span>
            </div>

            <p className="text-[11px] text-[#908fa0] px-1">
              Hold phones back-to-back or within 10 meters to pay instantly without sharing account numbers.
            </p>

            {/* Candidate Peers List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {peers.map(peer => (
                <div
                  key={peer.id}
                  className="p-3 rounded-xl bg-[#1c2028] border border-[#464554]/30 flex items-center justify-between hover:border-[#8083ff]/60 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-[#8083ff]/20 text-[#c0c1ff] flex items-center justify-center font-bold text-xs">
                      {peer.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <p className="text-xs font-bold text-[#dfe2ee]">{peer.name}</p>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#4edea3]/20 text-[#4edea3] font-mono">
                          Verified
                        </span>
                      </div>
                      <p className="text-[10px] text-[#908fa0]">
                        {peer.walletTag} • {peer.distance} away
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartSend(peer)}
                    className="h-8 px-3 rounded-lg bg-[#8083ff] hover:bg-[#979aff] text-[#0d0096] text-xs font-bold flex items-center space-x-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                    type="button"
                  >
                    <span>Send</span>
                    <Icon name="arrow_forward" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECEIVE NEARBY MODE */}
        {mode === 'receive' && (
          <div className="space-y-4 py-2 animate-fadeIn text-center">
            {/* BLE Radar Animation */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#8083ff]/30 animate-ping opacity-50" />
              <div className="absolute inset-2 rounded-full border border-[#8083ff]/40 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-[#8083ff]/20 border border-[#8083ff] flex items-center justify-center text-[#c0c1ff]">
                <Icon name="wifi" size={28} />
              </div>
            </div>

            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] text-[10px] font-mono uppercase font-bold">
                Broadcasting BLE Beacon
              </span>
              <h4 className="text-sm font-bold text-[#dfe2ee]">Tunde Bakare</h4>
              <p className="text-xs text-[#c0c1ff] font-mono">@tunde_b • 0803 124 8920</p>
              <p className="text-[11px] text-[#908fa0] max-w-xs mx-auto pt-1">
                Ready to receive — hold phones back-to-back. Senders nearby will see your wallet tag.
              </p>
            </div>

            {/* Simulator Button */}
            <div className="pt-2 border-t border-[#464554]/20">
              <button
                onClick={handleSimulateIncoming}
                className="w-full h-11 rounded-xl bg-[#262a33] hover:bg-[#31353e] text-[#4edea3] text-xs font-semibold border border-[#4edea3]/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                type="button"
              >
                <Icon name="bolt" size={16} />
                <span>Simulate Inward Transfer (₦5,000 via BLE)</span>
              </button>
            </div>
          </div>
        )}

        {/* AMOUNT SHEET FOR NEARBY SEND */}
        {isKeypadOpen && selectedPeer && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md bg-[#181c24] border border-[#464554]/40 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4 animate-slideUp">
              <div className="flex items-center justify-between pb-2 border-b border-[#464554]/20">
                <span className="text-xs font-semibold text-[#dfe2ee] uppercase">
                  Nearby Send to {selectedPeer.name}
                </span>
                <button
                  onClick={() => setIsKeypadOpen(false)}
                  className="text-[#908fa0] hover:text-[#dfe2ee] p-1"
                  type="button"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              <div className="text-center py-2">
                <span className="text-xs text-[#908fa0] block">Transfer Amount</span>
                <div className="text-3xl font-mono font-bold text-[#c0c1ff] tracking-tight">
                  ₦{amountStr}
                </div>
                <p className="text-[11px] text-[#4edea3] mt-0.5">
                  Proximity direct transfer • Instant settlement
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {['1,000', '2,500', '5,000', '10,000'].map(chip => (
                  <button
                    key={chip}
                    onClick={() => setAmountStr(chip)}
                    className="py-1.5 rounded-lg bg-[#262a33] text-xs font-mono text-[#c0c1ff] hover:bg-[#31353e] border border-[#464554]/30"
                    type="button"
                  >
                    ₦{chip}
                  </button>
                ))}
              </div>

              <button
                onClick={handleProceedToPin}
                className="w-full h-12 rounded-xl bg-[#8083ff] text-[#0d0096] text-sm font-bold flex items-center justify-center space-x-2 shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                type="button"
              >
                <span>Authorize Payment (PIN)</span>
                <Icon name="arrow_forward" size={18} />
              </button>
            </div>
          </div>
        )}

        {/* PIN SHEET */}
        <PinSheetModal
          isOpen={isPinOpen}
          onClose={() => setIsPinOpen(false)}
          title="Authorize Nearby Payment"
          recipient={selectedPeer?.name}
          amount={parseFloat(amountStr.replace(/,/g, '')) || 0}
          subtitle="Direct Bluetooth LE payment"
          onSuccess={handlePinSuccess}
        />
      </div>
    </div>
  );
};
