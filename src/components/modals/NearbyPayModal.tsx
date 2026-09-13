import React, { useEffect, useRef, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import {
  apiProximityReceiveSession,
  apiProximityResolve,
} from '../../lib/xtrapayApi';
import { NearbyPeer } from '../../types';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

export const NearbyPayModal: React.FC = () => {
  const {
    isNearbyPayOpen,
    setIsNearbyPayOpen,
    executeNearbySend,
    accountFullName,
    showToast,
  } = useTransactions();

  const [mode, setMode] = useState<'send' | 'receive'>('send');
  const [isScanning, setIsScanning] = useState(false);
  const [peers, setPeers] = useState<NearbyPeer[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<NearbyPeer | null>(null);
  const [amountStr, setAmountStr] = useState('3,500');
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [receiveSession, setReceiveSession] = useState<{
    bleToken: string;
    displayName: string;
    walletTag?: string;
    phone?: string;
  } | null>(null);
  const [receiveBusy, setReceiveBusy] = useState(false);
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = isNearbyPayOpen;
    if (!isNearbyPayOpen) {
      setPeers([]);
      setSelectedPeer(null);
      setReceiveSession(null);
      setTokenInput('');
      setIsScanning(false);
      return;
    }
    if (mode === 'receive') {
      void startReceive();
    }
  }, [isNearbyPayOpen, mode]);

  const startReceive = async () => {
    setReceiveBusy(true);
    try {
      const session = await apiProximityReceiveSession();
      if (!openRef.current) return;
      setReceiveSession({
        bleToken: session.bleToken,
        displayName: session.displayName || accountFullName || 'You',
        walletTag: session.walletTag,
        phone: session.phone,
      });
    } catch (err) {
      if (!openRef.current) return;
      setReceiveSession(null);
      showToast(
        'Receive unavailable',
        err instanceof ApiError ? err.message : 'Could not start nearby receive session.',
        'warning'
      );
    } finally {
      setReceiveBusy(false);
    }
  };

  const resolveToken = async () => {
    const bleToken = tokenInput.trim().toUpperCase();
    if (bleToken.length < 4) {
      showToast('Enter token', 'Paste or type the nearby wallet BLE token.', 'warning');
      return;
    }
    setIsScanning(true);
    try {
      const resolved = await apiProximityResolve(bleToken);
      if (!resolved.hasWallet && resolved.hasWallet !== undefined) {
        showToast('No wallet', 'This token is not linked to a wallet.', 'warning');
        return;
      }
      const peer: NearbyPeer = {
        id: resolved.walletId || bleToken,
        name: resolved.recipientName,
        device: 'Nearby BLE',
        distance: 'Nearby',
        walletTag: resolved.walletTag || `@${bleToken.toLowerCase()}`,
        avatarColor: 'bg-[#8083ff]/30 text-[#c0c1ff]',
        bleToken,
      };
      setPeers(prev => {
        const without = prev.filter(p => p.bleToken !== bleToken);
        return [peer, ...without];
      });
      showToast('Wallet found', `${resolved.recipientName} is ready for nearby pay.`, 'success');
    } catch (err) {
      showToast(
        'Resolve failed',
        err instanceof ApiError ? err.message : 'Could not resolve nearby token.',
        'warning'
      );
    } finally {
      setIsScanning(false);
    }
  };

  if (!isNearbyPayOpen) return null;

  const handleStartSend = (peer: NearbyPeer) => {
    setSelectedPeer(peer);
    setIsKeypadOpen(true);
  };

  const handlePinSuccess = async (pin: string) => {
    if (!selectedPeer) return;
    const amount = parseFloat(amountStr.replace(/,/g, ''));
    const ok = await executeNearbySend(selectedPeer, amount, pin);
    if (ok) {
      setIsPinOpen(false);
      setIsNearbyPayOpen(false);
    }
  };

  return (
    <div className="app-modal-overlay z-[70] bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="app-modal-panel bg-[#181c24] border border-[#464554]/40 p-6 shadow-2xl space-y-4 animate-slideUp text-left"
        id="nearby-pay-modal"
      >
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
                    ? 'Resolving nearby wallet…'
                    : peers.length
                      ? `${peers.length} wallet${peers.length === 1 ? '' : 's'} ready`
                      : 'Enter a BLE token from the other phone'}
                </span>
              </div>
              <span className="text-[10px] text-[#908fa0] font-mono">Live API</span>
            </div>

            <p className="text-[11px] text-[#908fa0] px-1">
              On mobile, BLE discovers wallets automatically. Here, paste the receive token from the
              other phone, resolve it, then send.
            </p>

            <div className="flex gap-2">
              <input
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value.toUpperCase())}
                placeholder="BLE token"
                className="flex-1 h-11 px-3 rounded-xl bg-[#0a0e16] border border-[#464554]/40 text-[#dfe2ee] text-xs font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void resolveToken()}
                className="h-11 px-3 rounded-xl bg-[#8083ff] text-[#0d0096] text-xs font-bold"
              >
                Resolve
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {peers.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#1c2028] border border-[#464554]/30 text-center text-[11px] text-[#908fa0]">
                  No nearby wallets yet. Ask the other person to open Receive Nearby and share their
                  token.
                </div>
              ) : (
                peers.map(peer => (
                  <div
                    key={peer.id}
                    className="p-3 rounded-xl bg-[#1c2028] border border-[#464554]/30 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#8083ff]/20 text-[#c0c1ff] flex items-center justify-center font-bold text-xs">
                        {peer.name
                          .split(' ')
                          .map(w => w[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#dfe2ee] truncate">{peer.name}</p>
                        <p className="text-[10px] text-[#908fa0]">
                          {peer.walletTag} · {peer.bleToken}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartSend(peer)}
                      className="h-8 px-3 rounded-lg bg-[#8083ff] text-[#0d0096] text-xs font-bold"
                      type="button"
                    >
                      Send
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {mode === 'receive' && (
          <div className="space-y-4 py-2 animate-fadeIn text-center">
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#8083ff]/30 animate-ping opacity-50" />
              <div className="w-16 h-16 rounded-full bg-[#8083ff]/20 border border-[#8083ff] flex items-center justify-center text-[#c0c1ff]">
                <Icon name="wifi" size={28} />
              </div>
            </div>

            {receiveBusy ? (
              <p className="text-xs text-[#908fa0]">Starting receive session…</p>
            ) : receiveSession ? (
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] text-[10px] font-mono uppercase font-bold">
                  Broadcasting token
                </span>
                <h4 className="text-sm font-bold text-[#dfe2ee]">{receiveSession.displayName}</h4>
                <p className="text-xs text-[#c0c1ff] font-mono">
                  {receiveSession.walletTag || 'Nearby receive'}
                </p>
                <p className="text-lg font-mono font-bold text-[#dfe2ee] tracking-[0.2em] pt-2">
                  {receiveSession.bleToken}
                </p>
                <p className="text-[11px] text-[#908fa0] max-w-xs mx-auto pt-1">
                  Share this token with the sender (or let BLE advertise it on the native app).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      void navigator.clipboard.writeText(receiveSession.bleToken);
                    }
                    showToast('Token copied', 'Nearby receive token copied.', 'success');
                  }}
                  className="mt-2 h-10 px-4 rounded-xl bg-[#262a33] text-[#c0c1ff] text-xs font-semibold border border-[#464554]/40"
                >
                  Copy token
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void startReceive()}
                className="h-11 px-4 rounded-xl bg-[#8083ff] text-[#0d0096] text-xs font-bold"
              >
                Start receive session
              </button>
            )}
          </div>
        )}

        {isKeypadOpen && selectedPeer && (
          <div className="app-modal-overlay z-[80] bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="app-modal-panel bg-[#181c24] border border-[#464554]/40 p-6 shadow-2xl space-y-4 animate-slideUp">
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
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['1,000', '2,500', '5,000', '10,000'].map(chip => (
                  <button
                    key={chip}
                    onClick={() => setAmountStr(chip)}
                    className="py-1.5 rounded-lg bg-[#262a33] text-xs font-mono text-[#c0c1ff]"
                    type="button"
                  >
                    ₦{chip}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setIsKeypadOpen(false);
                  setIsPinOpen(true);
                }}
                className="w-full h-12 rounded-xl bg-[#8083ff] text-[#0d0096] text-sm font-bold"
                type="button"
              >
                Authorize Payment (PIN)
              </button>
            </div>
          </div>
        )}

        <PinSheetModal
          isOpen={isPinOpen}
          onClose={() => setIsPinOpen(false)}
          title="Authorize Nearby Payment"
          recipient={selectedPeer?.name}
          amount={parseFloat(amountStr.replace(/,/g, '')) || 0}
          subtitle="Direct Bluetooth LE payment"
          onSuccess={pin => void handlePinSuccess(pin)}
        />
      </div>
    </div>
  );
};
