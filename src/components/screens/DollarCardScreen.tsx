import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';

export const DollarCardScreen: React.FC = () => {
  const { personalBalance, cardFrozen, setCardFrozen, showToast } = useTransactions();

  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [usdBalance, setUsdBalance] = useState<number>(3.6);
  const [fundAmountUsd, setFundAmountUsd] = useState<string>('20');
  const [fundingOpen, setFundingOpen] = useState<boolean>(false);

  const fxRate = 1485.0;

  const fieldClass =
    'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

  const handleFundCard = () => {
    const amt = parseFloat(fundAmountUsd);
    if (isNaN(amt) || amt <= 0) {
      showToast('Invalid Amount', 'Enter valid USD amount.', 'warning');
      return;
    }
    const nairaNeeded = amt * fxRate;
    if (nairaNeeded > personalBalance) {
      showToast(
        'Insufficient Balance',
        `You need ₦${nairaNeeded.toLocaleString()} in your personal wallet.`,
        'warning'
      );
      return;
    }
    setUsdBalance(prev => prev + amt);
    setFundingOpen(false);
    showToast('Dollar Card Funded', `+$${amt} USD credited at ₦${fxRate}/$`);
  };

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5" id="dollar-card-screen">
      <section className="flex items-center justify-between px-0.5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            Virtual USD
          </p>
          <h1 className="mt-1 text-[15px] font-semibold text-[var(--text)] tracking-tight">
            Dollar card
          </h1>
          <p className="text-[12px] text-[var(--muted)] mt-0.5">
            Global SaaS, AWS, and international checkout
          </p>
        </div>
        <span className="glass-chip !rounded-full !px-2.5 !py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Icon name="verified_user" size={13} />
          3D Secure
        </span>
      </section>

      {/* Premium virtual card product surface */}
      <div
        id="virtual-dollar-card"
        className={`rounded-[24px] p-5 border relative overflow-hidden transition-all duration-300 shadow-2xl ${
          cardFrozen
            ? 'bg-gradient-to-br from-zinc-900 via-zinc-800 to-black border-rose-400/35 opacity-85'
            : 'bg-gradient-to-br from-zinc-900 via-zinc-800 to-black border-white/15'
        }`}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-start mb-6 relative">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wider text-white text-sm">Xtrapay</span>
            <span className="text-[10px] text-white/50 px-1.5 py-0.5 rounded bg-white/10 uppercase">
              Virtual USD
            </span>
          </div>
          <Icon name="contactless" size={16} className="text-white/70" />
        </div>

        <div className="flex items-center justify-between mb-4 relative">
          <div className="w-10 h-8 rounded bg-gradient-to-tr from-amber-200/40 to-amber-100/60 border border-white/20 flex items-center justify-center">
            <div className="w-6 h-5 border border-black/40 rounded-sm opacity-60" />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-white/50 uppercase block">Card balance</span>
            <span className="font-mono text-xl font-bold text-white">
              ${usdBalance.toFixed(2)} USD
            </span>
          </div>
        </div>

        <div className="py-2 relative">
          <div className="font-mono text-base sm:text-lg tracking-widest text-white whitespace-nowrap">
            {showDetails ? '5399 4102 9840 4092' : '•••• •••• •••• 4092'}
          </div>
        </div>

        <div className="flex justify-between items-end pt-2 border-t border-white/10 mt-2 relative">
          <div>
            <span className="text-[9px] text-white/45 uppercase block">Cardholder</span>
            <span className="text-xs font-semibold text-white tracking-wide">INNOCENT SOLOMON</span>
          </div>
          <div>
            <span className="text-[9px] text-white/45 uppercase block">Expires</span>
            <span className="font-mono text-xs text-white">
              {showDetails ? '08/29' : '••/••'}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-white/45 uppercase block">CVV</span>
            <span className="font-mono text-xs text-white">{showDetails ? '742' : '•••'}</span>
          </div>
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-[#eb001b]" />
            <div className="w-6 h-6 rounded-full bg-[#f79e1b]/95" />
          </div>
        </div>

        {cardFrozen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-[24px]">
            <span className="glass-chip !rounded-full !px-3 !py-1.5 text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
              <Icon name="ac_unit" size={14} />
              Card frozen
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="h-11 rounded-2xl glass-chip !rounded-2xl text-[12px] font-semibold text-[var(--text)] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
        >
          <Icon name={showDetails ? 'visibility_off' : 'visibility'} size={16} />
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
        <button
          type="button"
          onClick={() => setFundingOpen(true)}
          className="h-11 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform"
        >
          <Icon name="add_card" size={16} />
          Fund card
        </button>
      </div>

      <div className="glass-card glass-strong !rounded-[20px] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="frosted-pad !h-10 !w-10 !min-h-10 !min-w-10 !rounded-full text-sky-500">
            <Icon name="ac_unit" size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[12px] font-semibold text-[var(--text)]">Instant freeze</h3>
            <p className="text-[10px] text-[var(--muted)]">
              Lock card to block all international charges
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={cardFrozen}
            onChange={e => {
              setCardFrozen(e.target.checked);
              showToast('Card Security', e.target.checked ? 'Dollar card frozen.' : 'Dollar card active.');
            }}
            className="sr-only peer"
          />
          <div className="w-10 h-6 bg-black/10 dark:bg-white/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]" />
        </label>
      </div>

      <section className="glass-card glass-strong !rounded-[24px] px-5 py-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            US billing address
          </p>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Tax exempt Delaware
          </span>
        </div>
        <div className="text-[12px] text-[var(--text)] space-y-0.5 font-mono">
          <p>1209 Orange Street, Suite 400</p>
          <p>Wilmington, DE 19801, United States</p>
        </div>
      </section>

      {fundingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-card glass-strong !rounded-[24px] p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
              <h3 className="text-[14px] font-semibold text-[var(--text)]">Fund dollar card</h3>
              <button
                type="button"
                onClick={() => setFundingOpen(false)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)] block mb-1.5">
                Amount to load (USD)
              </label>
              <input
                className={`${fieldClass} !h-12 font-mono text-lg`}
                type="number"
                value={fundAmountUsd}
                onChange={e => setFundAmountUsd(e.target.value)}
              />
              <div className="mt-2.5 text-[11px] text-[var(--muted)] flex justify-between">
                <span>FX conversion rate</span>
                <span className="font-mono text-[var(--accent)]">₦{fxRate.toLocaleString()} / $1</span>
              </div>
              <div className="mt-1 text-[11px] text-[var(--text)] flex justify-between font-semibold">
                <span>Total naira debit</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  ₦{((parseFloat(fundAmountUsd) || 0) * fxRate).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setFundingOpen(false)}
                className="h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--text)] text-[12px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFundCard}
                className="h-11 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold"
              >
                Confirm load
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
