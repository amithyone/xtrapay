import React, { useState } from 'react';
import { Icon } from '../Icon';

interface PinSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  amount?: number;
  recipient?: string;
  onSuccess: (pin: string) => void;
}

export const PinSheetModal: React.FC<PinSheetModalProps> = ({
  isOpen,
  onClose,
  title = 'Enter Security PIN',
  subtitle,
  amount,
  recipient,
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          onSuccess(nextPin);
          setPin('');
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleBiometric = () => {
    // Instant biometrics authorization
    onSuccess('1234');
    setPin('');
  };

  return (
    <div className="app-modal-overlay z-[80] bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="app-modal-panel bg-[#181c24] border border-[#464554]/40 p-6 shadow-2xl space-y-5 animate-slideUp text-center"
        id="pin-sheet-modal"
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between pb-2 border-b border-[#464554]/20">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-full bg-[#8083ff]/20 text-[#c0c1ff] flex items-center justify-center">
              <Icon name="lock" size={16} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#dfe2ee]">
              Authorization Gate
            </span>
          </div>
          <button
            onClick={() => {
              setPin('');
              onClose();
            }}
            className="p-1.5 text-[#908fa0] hover:text-[#dfe2ee] transition-colors rounded-lg hover:bg-[#262a33]"
            type="button"
            aria-label="Close PIN Sheet"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Title & Context */}
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#dfe2ee]">{title}</h3>
          {amount !== undefined && (
            <div className="text-2xl font-mono font-bold text-[#c0c1ff] tracking-tight">
              ₦{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          )}
          {recipient && (
            <p className="text-xs text-[#908fa0]">
              Paying to <span className="text-[#dfe2ee] font-medium">{recipient}</span>
            </p>
          )}
          {subtitle && <p className="text-xs text-[#908fa0]">{subtitle}</p>}
        </div>

        {/* 4-digit PIN Dots */}
        <div className="flex justify-center items-center space-x-4 py-2">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-[#c0c1ff] scale-110 shadow-md shadow-[#8083ff]/50'
                  : 'bg-[#31353e] border border-[#464554]/60'
              }`}
            />
          ))}
        </div>

        <p className="text-[11px] text-[#908fa0]">
          Enter your 4-digit wallet PIN or tap Face ID
        </p>

        {/* Custom Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-12 rounded-xl bg-[#262a33] hover:bg-[#31353e] active:scale-95 text-[#dfe2ee] font-mono text-lg font-semibold border border-[#464554]/30 transition-all flex items-center justify-center cursor-pointer"
              type="button"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleBiometric}
            className="h-12 rounded-xl bg-[#262a33] hover:bg-[#31353e] active:scale-95 text-[#4edea3] border border-[#464554]/30 transition-all flex items-center justify-center cursor-pointer"
            type="button"
            title="Biometric Authentication"
          >
            <Icon name="fingerprint" size={22} />
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-xl bg-[#262a33] hover:bg-[#31353e] active:scale-95 text-[#dfe2ee] font-mono text-lg font-semibold border border-[#464554]/30 transition-all flex items-center justify-center cursor-pointer"
            type="button"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 rounded-xl bg-[#262a33] hover:bg-[#31353e] active:scale-95 text-[#908fa0] hover:text-[#dfe2ee] border border-[#464554]/30 transition-all flex items-center justify-center cursor-pointer"
            type="button"
            title="Delete"
          >
            <Icon name="arrow_back" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
