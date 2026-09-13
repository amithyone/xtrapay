import React, { useEffect, useRef, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { apiShopsNearby } from '../../lib/xtrapayApi';
import { ShopTerminal } from '../../types';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

export const PayAtShopModal: React.FC = () => {
  const { isPayAtShopOpen, setIsPayAtShopOpen, executeShopPayment, showToast } = useTransactions();

  const [terminals, setTerminals] = useState<ShopTerminal[]>([]);
  const [listening, setListening] = useState(false);
  const [selectedShop, setSelectedShop] = useState<ShopTerminal | null>(null);
  const [customAmountStr, setCustomAmountStr] = useState('3,200');
  const [isAmountModalOpen, setIsAmountModalOpen] = useState(false);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = isPayAtShopOpen;
    if (!isPayAtShopOpen) {
      setTerminals([]);
      setSelectedShop(null);
      setListening(false);
      return;
    }
    void listenForTills();
  }, [isPayAtShopOpen]);

  const listenForTills = async () => {
    setListening(true);
    try {
      const rows = await apiShopsNearby();
      if (!openRef.current) return;
      setTerminals(
        rows.map(r => ({
          id: r.id || r.terminalId,
          name: r.name,
          terminalId: r.terminalId,
          amount: r.amount ?? undefined,
          merchantCategory: r.merchantCategory || 'Retail',
          rssi: r.rssi || '—',
          distance: r.distance,
          signalStrength: r.rssi,
          sessionUuid: r.sessionUuid,
          sessionKind: r.sessionKind,
          accountNumber: r.accountNumber,
          bankCode: r.bankCode,
          recipientName: r.name,
        }))
      );
    } finally {
      if (openRef.current) setListening(false);
    }
  };

  if (!isPayAtShopOpen) return null;

  const handlePayTerminal = (shop: ShopTerminal) => {
    setSelectedShop(shop);
    if (shop.amount && shop.amount > 0) {
      setIsPinOpen(true);
    } else {
      setIsAmountModalOpen(true);
    }
  };

  const handlePinSuccess = async (pin: string) => {
    if (!selectedShop) return;
    const amountToPay =
      selectedShop.amount && selectedShop.amount > 0
        ? selectedShop.amount
        : parseFloat(customAmountStr.replace(/,/g, '')) || 0;
    if (amountToPay <= 0) {
      showToast('Enter amount', 'Enter the bill total to continue.', 'warning');
      return;
    }
    const ok = await executeShopPayment(selectedShop, amountToPay, pin);
    if (ok) {
      setIsPinOpen(false);
      setIsPayAtShopOpen(false);
    }
  };

  const currentAmount =
    selectedShop?.amount && selectedShop.amount > 0
      ? selectedShop.amount
      : parseFloat(customAmountStr.replace(/,/g, '')) || 0;

  return (
    <div className="app-modal-overlay z-[70] bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="app-modal-panel bg-[#181c24] border border-[#464554]/40 p-6 shadow-2xl space-y-4 animate-slideUp text-left"
        id="pay-at-shop-modal"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#464554]/20">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-full bg-[#4edea3]/20 text-[#4edea3] flex items-center justify-center">
              <Icon name="store" size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#dfe2ee]">Pay at Shop</h3>
              <p className="text-[10px] text-[#908fa0]">Contactless Till Broadcast</p>
            </div>
          </div>
          <button
            onClick={() => setIsPayAtShopOpen(false)}
            className="p-1.5 text-[#908fa0] hover:text-[#dfe2ee] rounded-lg hover:bg-[#262a33]"
            type="button"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#1c2028] border border-[#464554]/30 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4edea3]"></span>
            </span>
            <div>
              <p className="text-[#dfe2ee] font-semibold">
                {listening ? 'Listening for nearby tills…' : 'Till scan'}
              </p>
              <p className="text-[10px] text-[#908fa0]">
                BLE on native · optional GET /shops/nearby on web
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void listenForTills()}
            className="text-[10px] text-[#4edea3] font-mono px-2 py-0.5 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20"
          >
            Refresh
          </button>
        </div>

        <p className="text-[11px] text-[#908fa0] px-1">
          Checkout tills broadcast a signed basket (or idle presence). Verified tills appear below —
          pay with your transaction PIN.
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {terminals.length === 0 ? (
            <div className="p-5 rounded-xl bg-[#1c2028] border border-[#464554]/30 text-center space-y-2">
              <Icon name="store" size={28} className="text-[#908fa0] mx-auto opacity-70" />
              <p className="text-xs font-semibold text-[#dfe2ee]">No tills nearby</p>
              <p className="text-[11px] text-[#908fa0]">
                Stand at a Checkout till, or wait until the backend returns live shop sessions on{' '}
                <span className="font-mono">/shops/nearby</span>.
              </p>
            </div>
          ) : (
            terminals.map(shop => {
              const hasAmount = Boolean(shop.amount && shop.amount > 0);
              return (
                <div
                  key={shop.id}
                  className="p-3.5 rounded-xl bg-[#1c2028] border border-[#464554]/30 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#262a33] text-[#4edea3] flex items-center justify-center border border-[#464554]/30">
                      <Icon name="store" size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-bold text-[#dfe2ee] truncate">{shop.name}</h4>
                        <span className="text-[9px] px-1 rounded bg-[#31353e] text-[#908fa0] font-mono">
                          {shop.terminalId}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#908fa0]">
                        {shop.sessionKind === 'presence' || !hasAmount
                          ? 'Enter amount'
                          : shop.merchantCategory}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end space-y-1">
                    {hasAmount ? (
                      <>
                        <span className="font-mono text-xs font-bold text-[#4edea3]">
                          ₦{shop.amount?.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handlePayTerminal(shop)}
                          className="h-7 px-3 rounded-lg bg-[#4edea3] text-[#003822] text-xs font-bold"
                          type="button"
                        >
                          Pay Bill
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handlePayTerminal(shop)}
                        className="h-7 px-3 rounded-lg bg-[#262a33] text-[#c0c1ff] border border-[#8083ff]/40 text-xs font-medium"
                        type="button"
                      >
                        Enter Amount
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {isAmountModalOpen && selectedShop && (
          <div className="app-modal-overlay z-[80] bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="app-modal-panel bg-[#181c24] border border-[#464554]/40 p-6 shadow-2xl space-y-4 animate-slideUp">
              <div className="flex items-center justify-between pb-2 border-b border-[#464554]/20">
                <span className="text-xs font-semibold text-[#dfe2ee] uppercase">
                  Pay {selectedShop.name}
                </span>
                <button
                  onClick={() => setIsAmountModalOpen(false)}
                  className="text-[#908fa0] hover:text-[#dfe2ee] p-1"
                  type="button"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
              <div className="text-center py-2">
                <span className="text-xs text-[#908fa0] block">Enter Bill Total</span>
                <input
                  type="text"
                  value={customAmountStr}
                  onChange={e => setCustomAmountStr(e.target.value)}
                  className="w-full text-center text-3xl font-mono font-bold text-[#4edea3] bg-transparent focus:outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setIsAmountModalOpen(false);
                  setIsPinOpen(true);
                }}
                className="w-full h-12 rounded-xl bg-[#4edea3] text-[#003822] text-sm font-bold"
                type="button"
              >
                Proceed to Authorize (PIN)
              </button>
            </div>
          </div>
        )}

        <PinSheetModal
          isOpen={isPinOpen}
          onClose={() => setIsPinOpen(false)}
          title="Authorize Shop Payment"
          recipient={selectedShop?.name}
          amount={currentAmount}
          subtitle={`Checkout Till: ${selectedShop?.terminalId}`}
          onSuccess={pin => void handlePinSuccess(pin)}
        />
      </div>
    </div>
  );
};
