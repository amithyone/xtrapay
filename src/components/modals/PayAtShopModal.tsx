import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { SHOP_TERMINALS } from '../../data/initialData';
import { ShopTerminal } from '../../types';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

export const PayAtShopModal: React.FC = () => {
  const {
    isPayAtShopOpen,
    setIsPayAtShopOpen,
    executeShopPayment,
    showToast,
  } = useTransactions();

  const [terminals, setTerminals] = useState<ShopTerminal[]>(SHOP_TERMINALS);
  const [selectedShop, setSelectedShop] = useState<ShopTerminal | null>(null);
  const [customAmountStr, setCustomAmountStr] = useState<string>('3,200');
  const [isAmountModalOpen, setIsAmountModalOpen] = useState<boolean>(false);
  const [isPinOpen, setIsPinOpen] = useState<boolean>(false);

  if (!isPayAtShopOpen) return null;

  const handlePayTerminal = (shop: ShopTerminal) => {
    setSelectedShop(shop);
    if (shop.amount) {
      setIsPinOpen(true);
    } else {
      setIsAmountModalOpen(true);
    }
  };

  const handleAmountSubmit = () => {
    setIsAmountModalOpen(false);
    setIsPinOpen(true);
  };

  const handlePinSuccess = (pin: string) => {
    if (selectedShop) {
      const amountToPay = selectedShop.amount || parseFloat(customAmountStr.replace(/,/g, '')) || 0;
      const ok = executeShopPayment(selectedShop, amountToPay, pin);
      if (ok) {
        setIsPinOpen(false);
        setIsPayAtShopOpen(false);
      }
    }
  };

  const currentAmount = selectedShop?.amount || parseFloat(customAmountStr.replace(/,/g, '')) || 0;

  return (
    <div className="app-modal-overlay z-[70] bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="app-modal-panel bg-[#181c24] border border-[#464554]/40 p-6 shadow-2xl space-y-4 animate-slideUp text-left"
        id="pay-at-shop-modal"
      >
        {/* Header */}
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

        {/* Radar Scanning Status */}
        <div className="p-3 rounded-xl bg-[#1c2028] border border-[#464554]/30 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4edea3]"></span>
            </span>
            <div>
              <p className="text-[#dfe2ee] font-semibold">Listening for nearby tills...</p>
              <p className="text-[10px] text-[#908fa0]">BLE Beacon detection active</p>
            </div>
          </div>
          <span className="text-[10px] text-[#4edea3] font-mono px-2 py-0.5 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20">
            Scanning
          </span>
        </div>

        <p className="text-[11px] text-[#908fa0] px-1">
          When you stand at the checkout register, Checkout tills broadcast your basket bill directly to your phone.
        </p>

        {/* Candidate Terminals List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {terminals.map(shop => {
            const hasAmount = Boolean(shop.amount);
            return (
              <div
                key={shop.id}
                className="p-3.5 rounded-xl bg-[#1c2028] border border-[#464554]/30 flex items-center justify-between hover:border-[#4edea3]/60 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#262a33] text-[#4edea3] flex items-center justify-center border border-[#464554]/30">
                    <Icon name="store" size={20} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-xs font-bold text-[#dfe2ee]">{shop.name}</h4>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#31353e] text-[#908fa0] font-mono">
                        {shop.terminalId}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#908fa0]">
                      {shop.distance} • {shop.signalStrength}
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
                        className="h-7 px-3 rounded-lg bg-[#4edea3] hover:bg-[#5cecb2] text-[#003822] text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        type="button"
                      >
                        Pay Bill
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-[#908fa0]">Manual Till</span>
                      <button
                        onClick={() => handlePayTerminal(shop)}
                        className="h-7 px-3 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-[#c0c1ff] border border-[#8083ff]/40 text-xs font-medium transition-all active:scale-95 cursor-pointer"
                        type="button"
                      >
                        Enter Amount
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security / Permissions Footer */}
        <div className="pt-2 border-t border-[#464554]/20 flex items-center justify-between text-[10px] text-[#908fa0]">
          <span className="flex items-center space-x-1">
            <Icon name="verified_user" size={13} className="text-[#4edea3]" />
            <span>Encrypted POS Handshake</span>
          </span>
          <span>Instant electronic till receipt</span>
        </div>

        {/* MANUAL AMOUNT MODAL */}
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
                <p className="text-[11px] text-[#908fa0] mt-1">
                  Check cashier display for exact total
                </p>
              </div>

              <button
                onClick={handleAmountSubmit}
                className="w-full h-12 rounded-xl bg-[#4edea3] text-[#003822] text-sm font-bold flex items-center justify-center space-x-2 shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                type="button"
              >
                <span>Proceed to Authorize (PIN)</span>
                <Icon name="arrow_forward" size={18} />
              </button>
            </div>
          </div>
        )}

        {/* PIN AUTHORIZATION */}
        <PinSheetModal
          isOpen={isPinOpen}
          onClose={() => setIsPinOpen(false)}
          title="Authorize Shop Payment"
          recipient={selectedShop?.name}
          amount={currentAmount}
          subtitle={`Checkout Till: ${selectedShop?.terminalId}`}
          onSuccess={handlePinSuccess}
        />
      </div>
    </div>
  );
};
