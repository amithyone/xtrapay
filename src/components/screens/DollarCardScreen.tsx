import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

type CardKind = 'physical' | 'virtual';

/**
 * Cards — Physical Naira card + Virtual USD card, with request flow.
 */
export const DollarCardScreen: React.FC = () => {
  const { personalBalance, cardFrozen, setCardFrozen, showToast, theme } =
    useTransactions();
  const isLight = theme === 'light';

  const [cardKind, setCardKind] = useState<CardKind>('physical');
  const [showDetails, setShowDetails] = useState(false);
  const [usdBalance, setUsdBalance] = useState(3.6);
  const [ngnBalance] = useState(485_200.5);
  const [fundAmountUsd, setFundAmountUsd] = useState('20');
  const [fundingOpen, setFundingOpen] = useState(false);

  const [hasPhysical, setHasPhysical] = useState(true);
  const [hasVirtual, setHasVirtual] = useState(true);
  const [physicalFrozen, setPhysicalFrozen] = useState(false);

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestKind, setRequestKind] = useState<CardKind>('physical');
  const [deliveryAddress, setDeliveryAddress] = useState(
    '12 Admiralty Way, Lekki Phase 1, Lagos'
  );
  const [requestPinOpen, setRequestPinOpen] = useState(false);

  const fxRate = 1485.0;
  const activeFrozen = cardKind === 'virtual' ? cardFrozen : physicalFrozen;

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

  const openRequest = (kind: CardKind = cardKind) => {
    setRequestKind(kind);
    setRequestOpen(true);
  };

  const continueRequest = () => {
    if (requestKind === 'physical' && !deliveryAddress.trim()) {
      showToast('Address Required', 'Enter a delivery address for your physical card.', 'warning');
      return;
    }
    setRequestOpen(false);
    setRequestPinOpen(true);
  };

  const handleRequestSuccess = () => {
    setRequestPinOpen(false);
    if (requestKind === 'physical') {
      setHasPhysical(true);
      showToast(
        'Physical Card Requested',
        'Your Naira debit card will ship in 5–7 working days.',
        'success'
      );
    } else {
      setHasVirtual(true);
      setCardKind('virtual');
      showToast(
        'Virtual USD Card Issued',
        'Your dollar card is active for online spend.',
        'success'
      );
    }
  };

  const setFrozen = (next: boolean) => {
    if (cardKind === 'virtual') {
      setCardFrozen(next);
      showToast('Card Security', next ? 'Virtual USD card frozen.' : 'Virtual USD card active.');
    } else {
      setPhysicalFrozen(next);
      showToast('Card Security', next ? 'Physical card frozen.' : 'Physical card active.');
    }
  };

  const ownsActive = cardKind === 'physical' ? hasPhysical : hasVirtual;

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-4" id="dollar-card-screen">
      {/* Type switch */}
      <div className="glass-card glass-strong settings-list flex p-1 !rounded-[18px]">
        <button
          type="button"
          onClick={() => {
            setCardKind('physical');
            setShowDetails(false);
          }}
          className={`settings-row flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all appearance-none border-0 cursor-pointer ${
            cardKind === 'physical'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'bg-transparent text-[var(--muted)]'
          }`}
        >
          <Icon name="credit_card" size={15} />
          Physical
        </button>
        <button
          type="button"
          onClick={() => {
            setCardKind('virtual');
            setShowDetails(false);
          }}
          className={`settings-row flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all appearance-none border-0 cursor-pointer ${
            cardKind === 'virtual'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'bg-transparent text-[var(--muted)]'
          }`}
        >
          <Icon name="smartphone" size={15} />
          Virtual USD
        </button>
      </div>

      <section className="flex items-center justify-between px-0.5 gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            {cardKind === 'physical' ? 'Physical Naira' : 'Virtual USD'}
          </p>
          <h1 className="mt-1 text-[15px] font-semibold text-[var(--text)] tracking-tight">
            {cardKind === 'physical' ? 'Debit card' : 'Dollar card'}
          </h1>
          <p className="text-[12px] text-[var(--muted)] mt-0.5">
            {cardKind === 'physical'
              ? 'ATM, POS and in-store spend across Nigeria'
              : 'Global SaaS, AWS, and international checkout'}
          </p>
        </div>
        {ownsActive && (
          <span className="glass-chip !rounded-full !px-2.5 !py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
            <Icon name="verified_user" size={13} />
            {cardKind === 'physical' ? 'Verve · MC' : '3D Secure'}
          </span>
        )}
      </section>

      {!ownsActive ? (
        <EmptyCardState
          kind={cardKind}
          isLight={isLight}
          onRequest={() => openRequest(cardKind)}
        />
      ) : cardKind === 'physical' ? (
        <PhysicalCardFace
          frozen={physicalFrozen}
          showDetails={showDetails}
          balance={ngnBalance}
        />
      ) : (
        <VirtualCardFace
          frozen={cardFrozen}
          showDetails={showDetails}
          balance={usdBalance}
        />
      )}

      {ownsActive && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="settings-row h-11 rounded-2xl glass-chip !rounded-2xl text-[12px] font-semibold text-[var(--text)] flex items-center justify-center gap-1.5 appearance-none border-0 cursor-pointer"
            >
              <Icon name={showDetails ? 'visibility_off' : 'visibility'} size={16} />
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
            {cardKind === 'virtual' ? (
              <button
                type="button"
                onClick={() => setFundingOpen(true)}
                className="h-11 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-[var(--accent)]/25"
              >
                <Icon name="add_card" size={16} />
                Fund card
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  showToast('Linked Wallet', 'Physical card spends from your Xtrapay wallet.', 'info')
                }
                className="h-11 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-[var(--accent)]/25"
              >
                <Icon name="account_balance_wallet" size={16} />
                Linked wallet
              </button>
            )}
          </div>

          <div className="glass-card glass-strong settings-list !rounded-[20px] px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="frosted-pad !h-10 !w-10 !min-h-10 !min-w-10 !rounded-full text-sky-500">
                <Icon name="ac_unit" size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[12px] font-semibold text-[var(--text)]">Instant freeze</h3>
                <p className="text-[10px] text-[var(--muted)]">
                  {cardKind === 'physical'
                    ? 'Block ATM, POS and online charges'
                    : 'Lock card to block all international charges'}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={activeFrozen}
              aria-label="Freeze card"
              onClick={() => setFrozen(!activeFrozen)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 border-0 appearance-none cursor-pointer transition-colors duration-200 ease-in-out ${
                activeFrozen
                  ? 'bg-[var(--accent)] justify-end'
                  : isLight
                    ? 'bg-zinc-300 justify-start'
                    : 'bg-white/20 justify-start'
              }`}
            >
              <span className="pointer-events-none block h-6 w-6 shrink-0 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {cardKind === 'virtual' ? (
            <section className="glass-card glass-strong settings-list !rounded-[24px] px-5 py-4 space-y-2.5">
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
          ) : (
            <section className="glass-card glass-strong settings-list !rounded-[24px] px-5 py-4 space-y-2.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                Delivery address
              </p>
              <p className="text-[12px] text-[var(--text)] leading-snug">{deliveryAddress}</p>
              <p className="text-[11px] text-[var(--muted)]">Status · Delivered · PIN mailed separately</p>
            </section>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => openRequest(cardKind)}
        className="w-full h-12 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] text-[var(--text)] text-[14px] font-semibold flex items-center justify-center gap-2"
      >
        <Icon name="add_card" size={16} />
        Request for card
      </button>

      {fundingOpen && (
        <div className="app-modal-overlay z-[70] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] !max-w-sm p-5 space-y-4 shadow-2xl">
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
                <span className="font-mono text-[var(--accent)]">
                  ₦{fxRate.toLocaleString()} / $1
                </span>
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

      {requestOpen && (
        <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
              <h3 className="text-[14px] font-semibold text-[var(--text)]">Request for card</h3>
              <button
                type="button"
                onClick={() => setRequestOpen(false)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'physical' as const, label: 'Physical', hint: 'Naira debit' },
                  { id: 'virtual' as const, label: 'Virtual USD', hint: 'Online only' },
                ] as const
              ).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRequestKind(opt.id)}
                  className={`settings-row rounded-2xl px-3 py-3 text-left border appearance-none cursor-pointer ${
                    requestKind === opt.id
                      ? 'border-[var(--accent)]/55 ring-1 ring-[var(--accent)]/30 bg-[var(--accent)]/8'
                      : 'border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.04]'
                  }`}
                >
                  <p className="text-[13px] font-semibold text-[var(--text)]">{opt.label}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">{opt.hint}</p>
                </button>
              ))}
            </div>

            {requestKind === 'physical' && (
              <textarea
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                className={`${fieldClass} !h-24 py-3 resize-none`}
                placeholder="Delivery address"
              />
            )}

            <p className="text-[11px] text-[var(--muted)] leading-snug">
              {requestKind === 'physical'
                ? 'Issuance fee ₦2,500 · Ships in 5–7 working days after KYC check.'
                : 'Issuance fee $1 · Instant virtual Mastercard for FX spend.'}
            </p>

            <button type="button" onClick={continueRequest} className="glass-cta w-full">
              Continue to PIN
            </button>
          </div>
        </div>
      )}

      <PinSheetModal
        isOpen={requestPinOpen}
        onClose={() => setRequestPinOpen(false)}
        title="Authorize Card Request"
        subtitle={
          requestKind === 'physical'
            ? 'Confirm physical Naira card issuance'
            : 'Confirm virtual USD card issuance'
        }
        onSuccess={handleRequestSuccess}
      />
    </main>
  );
};

const EmptyCardState: React.FC<{
  kind: CardKind;
  isLight: boolean;
  onRequest: () => void;
}> = ({ kind, isLight, onRequest }) => (
  <section className="glass-card glass-strong settings-list !rounded-[24px] px-5 py-10 text-center space-y-4">
    <span
      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
        isLight ? 'bg-[var(--accent)]/12 text-[var(--accent)]' : 'bg-white/10 text-white'
      }`}
    >
      <Icon name="credit_card" size={24} />
    </span>
    <div>
      <h2 className="text-[15px] font-semibold text-[var(--text)]">
        No {kind === 'physical' ? 'physical' : 'virtual USD'} card yet
      </h2>
      <p className="mt-1.5 text-[12px] text-[var(--muted)] leading-snug max-w-[260px] mx-auto">
        {kind === 'physical'
          ? 'Request a physical Naira debit card for ATM and POS spend.'
          : 'Request a virtual USD card for international online payments.'}
      </p>
    </div>
    <button
      type="button"
      onClick={onRequest}
      className="glass-cta !rounded-2xl inline-flex items-center justify-center gap-2 mx-auto px-6"
    >
      <Icon name="add_card" size={16} />
      Request for card
    </button>
  </section>
);

const PhysicalCardFace: React.FC<{
  frozen: boolean;
  showDetails: boolean;
  balance: number;
}> = ({ frozen, showDetails, balance }) => (
  <div
    className={`rounded-[24px] p-5 border relative overflow-hidden shadow-2xl transition-all duration-300 ${
      frozen
        ? 'bg-gradient-to-br from-[#5c0a1a] via-[#3a0610] to-[#1a0508] border-rose-400/35 opacity-85'
        : 'bg-gradient-to-br from-[#8b1530] via-[#5c0a1a] to-[#1a0508] border-white/15'
    }`}
  >
    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
    <div className="flex justify-between items-start mb-6 relative">
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-wider text-white text-sm">Xtrapay</span>
        <span className="text-[10px] text-white/50 px-1.5 py-0.5 rounded bg-white/10 uppercase">
          Physical
        </span>
      </div>
      <Icon name="contactless" size={16} className="text-white/70" />
    </div>
    <div className="flex items-center justify-between mb-4 relative">
      <div className="w-10 h-8 rounded bg-gradient-to-tr from-amber-200/40 to-amber-100/60 border border-white/20 flex items-center justify-center">
        <div className="w-6 h-5 border border-black/40 rounded-sm opacity-60" />
      </div>
      <div className="text-right">
        <span className="text-[10px] text-white/50 uppercase block">Wallet link</span>
        <span className="font-mono text-lg font-bold text-white">
          ₦{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
    <div className="py-2 relative">
      <div className="font-mono text-base sm:text-lg tracking-widest text-white whitespace-nowrap">
        {showDetails ? '5061 2345 6789 1044' : '•••• •••• •••• 1044'}
      </div>
    </div>
    <div className="flex justify-between items-end pt-2 border-t border-white/10 mt-2 relative">
      <div>
        <span className="text-[9px] text-white/45 uppercase block">Cardholder</span>
        <span className="text-xs font-semibold text-white tracking-wide">INNOCENT SOLOMON</span>
      </div>
      <div>
        <span className="text-[9px] text-white/45 uppercase block">Expires</span>
        <span className="font-mono text-xs text-white">{showDetails ? '11/28' : '••/••'}</span>
      </div>
      <div>
        <span className="text-[9px] text-white/45 uppercase block">CVV</span>
        <span className="font-mono text-xs text-white">{showDetails ? '318' : '•••'}</span>
      </div>
      <div className="text-[10px] font-bold text-white/80 tracking-wide">VERVE</div>
    </div>
    {frozen && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-[24px]">
        <span className="glass-chip !rounded-full !px-3 !py-1.5 text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
          <Icon name="ac_unit" size={14} />
          Card frozen
        </span>
      </div>
    )}
  </div>
);

const VirtualCardFace: React.FC<{
  frozen: boolean;
  showDetails: boolean;
  balance: number;
}> = ({ frozen, showDetails, balance }) => (
  <div
    id="virtual-dollar-card"
    className={`rounded-[24px] p-5 border relative overflow-hidden transition-all duration-300 shadow-2xl ${
      frozen
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
        <span className="font-mono text-xl font-bold text-white">${balance.toFixed(2)} USD</span>
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
        <span className="font-mono text-xs text-white">{showDetails ? '08/29' : '••/••'}</span>
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
    {frozen && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-[24px]">
        <span className="glass-chip !rounded-full !px-3 !py-1.5 text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
          <Icon name="ac_unit" size={14} />
          Card frozen
        </span>
      </div>
    )}
  </div>
);
