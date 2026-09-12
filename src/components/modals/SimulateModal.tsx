import React from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../common/Icon';

const PRESETS = [
  { amount: 25000, sender: 'Tunde Bakare' },
  { amount: 50000, sender: 'Chioma N.' },
  { amount: 100000, sender: 'KPMG Nigeria Settler' },
  { amount: 250000, sender: 'Zenith Bank Treasury' },
];

export const SimulateModal: React.FC = () => {
  const {
    isSimulateOpen,
    setIsSimulateOpen,
    simulateInwardTransfer,
  } = useTransactions();

  if (!isSimulateOpen) return null;

  const run = (amount?: number, sender?: string) => {
    simulateInwardTransfer(amount, sender);
    setIsSimulateOpen(false);
  };

  return (
    <div className="app-modal-overlay z-[70] modal-backdrop">
      <div className="app-modal-panel glass-sheet glass-card glass-strong !max-w-sm p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <Icon name="bolt" size={18} className="text-[#4edea3]" />
            <span className="text-sm font-semibold text-[#dfe2ee]">Simulate Inward Transfer</span>
          </div>
          <button
            onClick={() => setIsSimulateOpen(false)}
            className="text-[#908fa0] hover:text-[#dfe2ee]"
            type="button"
            aria-label="Close"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <p className="text-xs text-[#908fa0]">
          Credit a demo inflow to Personal Wallet to preview the frosted glass ledger updates.
        </p>

        <div className="space-y-2">
          {PRESETS.map((p) => (
            <button
              key={p.amount}
              type="button"
              onClick={() => run(p.amount, p.sender)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all text-left"
            >
              <div>
                <div className="text-sm font-semibold text-[#dfe2ee]">{p.sender}</div>
                <div className="text-[11px] text-[#908fa0]">Instant P2P settlement</div>
              </div>
              <div className="text-sm font-bold text-[#4edea3]">
                +₦{p.amount.toLocaleString()}
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => run()}
          className="glass-cta w-full"
        >
          Random inflow
        </button>
      </div>
    </div>
  );
};
