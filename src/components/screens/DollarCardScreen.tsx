import React, { useEffect, useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import {
  apiCardRequestQuote,
  apiCards,
  apiFreezeCard,
  apiFundVirtualCard,
  apiRequestCard,
  mapApiCard,
  type AppCard,
  type AppCardRequestQuote,
} from '../../lib/xtrapayApi';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

type CardKind = 'physical' | 'virtual';

/**
 * Cards — Physical Naira + Virtual USD. Empty = request only (no mock cards).
 */
export const DollarCardScreen: React.FC = () => {
  const {
    personalBalance,
    accountFullName,
    userProfile,
    refreshBalances,
    showToast,
    theme,
  } = useTransactions();
  const isLight = theme === 'light';

  const [cards, setCards] = useState<AppCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardKind, setCardKind] = useState<CardKind>('physical');
  const [showDetails, setShowDetails] = useState(false);
  const [fundAmountUsd, setFundAmountUsd] = useState('20');
  const [fundingOpen, setFundingOpen] = useState(false);
  const [fundPinOpen, setFundPinOpen] = useState(false);

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestKind, setRequestKind] = useState<CardKind>('physical');
  const [deliveryAddress, setDeliveryAddress] = useState(
    userProfile?.address || ''
  );
  const [initialTopUpUsd, setInitialTopUpUsd] = useState('20');
  const [requestQuote, setRequestQuote] = useState<AppCardRequestQuote | null>(null);
  const [requestPinOpen, setRequestPinOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const cardholderFallback =
    accountFullName || userProfile?.fullName || 'Cardholder';

  const loadCards = async () => {
    try {
      const list = await apiCards();
      setCards(Array.isArray(list) ? list : []);
      const physical = list.find(
        c => c.kind === 'physical' && (c.status === 'active' || c.status === 'frozen' || c.status === 'pending')
      );
      const virtual = list.find(
        c =>
          c.kind === 'virtual_usd' &&
          (c.status === 'active' || c.status === 'frozen' || c.status === 'pending')
      );
      if (!physical && virtual) setCardKind('virtual');
      else if (physical && !virtual) setCardKind('physical');
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userProfile?.address && !deliveryAddress) {
      setDeliveryAddress(userProfile.address);
    }
  }, [userProfile?.address, deliveryAddress]);

  const physicalCard = useMemo(
    () =>
      cards.find(
        c =>
          c.kind === 'physical' &&
          (c.status === 'active' || c.status === 'frozen' || c.status === 'pending')
      ) || null,
    [cards]
  );
  const virtualCard = useMemo(
    () =>
      cards.find(
        c =>
          c.kind === 'virtual_usd' &&
          (c.status === 'active' || c.status === 'frozen' || c.status === 'pending')
      ) || null,
    [cards]
  );

  const hasAnyCard = Boolean(physicalCard || virtualCard);
  const activeCard = cardKind === 'physical' ? physicalCard : virtualCard;
  const ownsActive = Boolean(activeCard);
  const activeFrozen = activeCard?.status === 'frozen';

  const fieldClass =
    'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

  const openRequest = (kind: CardKind = cardKind) => {
    setRequestKind(kind);
    setRequestOpen(true);
  };

  const continueRequest = () => {
    if (requestKind === 'physical' && !deliveryAddress.trim()) {
      showToast('Address Required', 'Enter a delivery address for your physical card.', 'warning');
      return;
    }
    if (requestKind === 'virtual') {
      const usd = parseFloat(initialTopUpUsd);
      const min = requestQuote?.minInitialTopUpUsd ?? 0;
      if (isNaN(usd) || usd < min) {
        showToast(
          'Top-up required',
          min > 0
            ? `First top-up must be at least $${min.toFixed(2)} USD.`
            : 'Enter a valid USD first top-up.',
          'warning'
        );
        return;
      }
    }
    if (requestQuote?.sufficientBalance === false) {
      showToast(
        'Insufficient balance',
        `You need ₦${requestQuote.totalDebitNgn.toLocaleString()} for this request.`,
        'warning'
      );
      return;
    }
    setRequestOpen(false);
    setRequestPinOpen(true);
  };

  const handleRequestSuccess = async (pin: string) => {
    setBusy(true);
    try {
      const usd = parseFloat(initialTopUpUsd);
      const card = await apiRequestCard({
        kind: requestKind === 'physical' ? 'physical' : 'virtual_usd',
        deliveryAddress:
          requestKind === 'physical' ? deliveryAddress.trim() : undefined,
        initialTopUpUsd:
          requestKind === 'virtual' && !isNaN(usd) ? usd : undefined,
        pin,
      });
      setCards(prev => [card, ...prev.filter(c => c.id !== card.id)]);
      setCardKind(requestKind);
      setRequestPinOpen(false);
      void refreshBalances();
      showToast(
        requestKind === 'physical' ? 'Physical card requested' : 'Virtual USD card issued',
        requestKind === 'physical'
          ? 'Your Naira debit card request was submitted.'
          : 'Your dollar card is being activated.',
        'success'
      );
      void loadCards();
    } catch (err) {
      showToast(
        'Request failed',
        err instanceof ApiError ? err.message : 'Could not request card.',
        'warning'
      );
    } finally {
      setBusy(false);
    }
  };

  const setFrozen = async (next: boolean) => {
    if (!activeCard) return;
    try {
      const updated = await apiFreezeCard(activeCard.id, next);
      setCards(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      showToast(
        'Card Security',
        next ? 'Card frozen.' : 'Card active again.',
        next ? 'warning' : 'success'
      );
    } catch (err) {
      showToast(
        'Freeze failed',
        err instanceof ApiError ? err.message : 'Could not update card status.',
        'warning'
      );
    }
  };

  const handleFundContinue = () => {
    const amt = parseFloat(fundAmountUsd);
    if (isNaN(amt) || amt <= 0) {
      showToast('Invalid Amount', 'Enter valid USD amount.', 'warning');
      return;
    }
    setFundingOpen(false);
    setFundPinOpen(true);
  };

  const handleFundPinSuccess = async (pin: string) => {
    if (!virtualCard) return;
    const amt = parseFloat(fundAmountUsd);
    setBusy(true);
    try {
      const res = await apiFundVirtualCard(virtualCard.id, { amountUsd: amt, pin });
      if (res.card) {
        const mapped = mapApiCard(res.card);
        setCards(prev => prev.map(c => (c.id === mapped.id ? mapped : c)));
      } else {
        void loadCards();
      }
      void refreshBalances();
      setFundPinOpen(false);
      showToast('Dollar Card Funded', `+$${amt} USD credited to your virtual card.`);
    } catch (err) {
      showToast(
        'Fund failed',
        err instanceof ApiError ? err.message : 'Could not fund virtual card.',
        'warning'
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 min-w-0 px-5 pt-5 pb-28" id="dollar-card-screen">
        <p className="text-[13px] text-[var(--muted)] text-center py-16">Loading cards…</p>
      </main>
    );
  }

  /** No cards at all → request only */
  if (!hasAnyCard) {
    return (
      <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-4" id="dollar-card-screen">
        <section className="glass-card glass-strong settings-list !rounded-[24px] px-5 py-12 text-center space-y-5">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
            <Icon name="credit_card" size={28} />
          </span>
          <div>
            <h1 className="text-[17px] font-semibold text-[var(--text)] tracking-tight">
              No active card
            </h1>
            <p className="mt-2 text-[13px] text-[var(--muted)] leading-relaxed max-w-[280px] mx-auto">
              Request a physical Naira debit card or a virtual USD card to start spending.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openRequest('physical')}
            className="glass-cta !rounded-2xl w-full max-w-xs mx-auto inline-flex items-center justify-center gap-2"
          >
            <Icon name="add_card" size={16} />
            Request card
          </button>
        </section>

        <RequestCardModal
          open={requestOpen}
          onClose={() => setRequestOpen(false)}
          requestKind={requestKind}
          setRequestKind={setRequestKind}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
          initialTopUpUsd={initialTopUpUsd}
          setInitialTopUpUsd={setInitialTopUpUsd}
          quote={requestQuote}
          setQuote={setRequestQuote}
          onContinue={continueRequest}
          fieldClass={fieldClass}
        />
        <PinSheetModal
          isOpen={requestPinOpen}
          onClose={() => !busy && setRequestPinOpen(false)}
          title="Authorize Card Request"
          subtitle={
            requestQuote
              ? `Debit ₦${requestQuote.totalDebitNgn.toLocaleString('en-NG', { maximumFractionDigits: 2 })} · ${
                  requestKind === 'physical' ? 'Physical Naira' : 'Virtual USD'
                }`
              : requestKind === 'physical'
                ? 'Confirm physical Naira card issuance'
                : 'Confirm virtual USD card issuance'
          }
          onSuccess={pin => void handleRequestSuccess(pin)}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-4" id="dollar-card-screen">
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
            {activeCard?.status === 'pending'
              ? 'Pending'
              : cardKind === 'physical'
                ? (activeCard?.network || 'Verve').toUpperCase()
                : '3D Secure'}
          </span>
        )}
      </section>

      {!ownsActive ? (
        <EmptyCardState
          kind={cardKind}
          isLight={isLight}
          onRequest={() => openRequest(cardKind)}
        />
      ) : cardKind === 'physical' && physicalCard ? (
        <PhysicalCardFace
          card={physicalCard}
          frozen={activeFrozen}
          showDetails={showDetails}
          balance={physicalCard.spendAvailableNgn ?? personalBalance}
          cardholder={physicalCard.cardholderName || cardholderFallback}
        />
      ) : virtualCard ? (
        <VirtualCardFace
          card={virtualCard}
          frozen={activeFrozen}
          showDetails={showDetails}
          balance={virtualCard.spendAvailableUsd ?? 0}
          cardholder={virtualCard.cardholderName || cardholderFallback}
        />
      ) : null}

      {ownsActive && activeCard && (
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
              onClick={() => void setFrozen(!activeFrozen)}
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
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                US billing address
              </p>
              <div className="text-[12px] text-[var(--text)] space-y-0.5 font-mono whitespace-pre-line">
                {virtualCard.billingAddress ||
                  '1209 Orange Street, Suite 400\nWilmington, DE 19801, United States'}
              </div>
            </section>
          ) : (
            <section className="glass-card glass-strong settings-list !rounded-[24px] px-5 py-4 space-y-2.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                Delivery address
              </p>
              <p className="text-[12px] text-[var(--text)] leading-snug">
                {physicalCard?.deliveryAddress || deliveryAddress || '—'}
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                Status · {physicalCard?.status === 'pending' ? 'Processing' : 'Active'}
              </p>
            </section>
          )}
        </>
      )}

      {(!physicalCard || !virtualCard) && (
        <button
          type="button"
          onClick={() => openRequest(!physicalCard ? 'physical' : 'virtual')}
          className="w-full h-12 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] text-[var(--text)] text-[14px] font-semibold flex items-center justify-center gap-2"
        >
          <Icon name="add_card" size={16} />
          Request {!physicalCard ? 'physical' : 'virtual USD'} card
        </button>
      )}

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
                onClick={handleFundContinue}
                className="h-11 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <RequestCardModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        requestKind={requestKind}
        setRequestKind={setRequestKind}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={setDeliveryAddress}
        initialTopUpUsd={initialTopUpUsd}
        setInitialTopUpUsd={setInitialTopUpUsd}
        quote={requestQuote}
        setQuote={setRequestQuote}
        onContinue={continueRequest}
        fieldClass={fieldClass}
      />

      <PinSheetModal
        isOpen={requestPinOpen}
        onClose={() => !busy && setRequestPinOpen(false)}
        title="Authorize Card Request"
        subtitle={
          requestQuote
            ? `Debit ₦${requestQuote.totalDebitNgn.toLocaleString('en-NG', { maximumFractionDigits: 2 })} · ${
                requestKind === 'physical' ? 'Physical Naira' : 'Virtual USD'
              }`
            : requestKind === 'physical'
              ? 'Confirm physical Naira card issuance'
              : 'Confirm virtual USD card issuance'
        }
        onSuccess={pin => void handleRequestSuccess(pin)}
      />
      <PinSheetModal
        isOpen={fundPinOpen}
        onClose={() => !busy && setFundPinOpen(false)}
        title="Confirm card funding"
        subtitle={`Load $${fundAmountUsd} USD`}
        onSuccess={pin => void handleFundPinSuccess(pin)}
      />
    </main>
  );
};

const formatNgn = (n: number) =>
  `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const RequestCardModal: React.FC<{
  open: boolean;
  onClose: () => void;
  requestKind: CardKind;
  setRequestKind: (k: CardKind) => void;
  deliveryAddress: string;
  setDeliveryAddress: (v: string) => void;
  initialTopUpUsd: string;
  setInitialTopUpUsd: (v: string) => void;
  quote: AppCardRequestQuote | null;
  setQuote: (q: AppCardRequestQuote | null) => void;
  onContinue: () => void;
  fieldClass: string;
}> = ({
  open,
  onClose,
  requestKind,
  setRequestKind,
  deliveryAddress,
  setDeliveryAddress,
  initialTopUpUsd,
  setInitialTopUpUsd,
  quote,
  setQuote,
  onContinue,
  fieldClass,
}) => {
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const kind = requestKind === 'physical' ? 'physical' : 'virtual_usd';
    const usd = parseFloat(initialTopUpUsd);
    const timer = window.setTimeout(() => {
      setQuoteLoading(true);
      setQuoteError(null);
      void apiCardRequestQuote({
        kind,
        initialTopUpUsd:
          requestKind === 'virtual' && !isNaN(usd) ? usd : undefined,
      })
        .then(q => {
          if (cancelled) return;
          setQuote(q);
          if (
            requestKind === 'virtual' &&
            q.minInitialTopUpUsd > 0 &&
            (isNaN(usd) || usd < q.minInitialTopUpUsd)
          ) {
            setInitialTopUpUsd(String(q.minInitialTopUpUsd));
          }
        })
        .catch(err => {
          if (cancelled) return;
          setQuote(null);
          setQuoteError(
            err instanceof ApiError ? err.message : 'Could not load card cost summary.'
          );
        })
        .finally(() => {
          if (!cancelled) setQuoteLoading(false);
        });
    }, requestKind === 'virtual' ? 350 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, requestKind, initialTopUpUsd, setQuote, setInitialTopUpUsd]);

  if (!open) return null;

  const isVirtual = requestKind === 'virtual';

  return (
    <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
      <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-5 space-y-4 max-h-[min(90vh,640px)] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
          <h3 className="text-[14px] font-semibold text-[var(--text)]">Request card</h3>
          <button
            type="button"
            onClick={onClose}
            className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(['physical', 'virtual'] as const).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setRequestKind(k)}
              className={`rounded-2xl border px-3 py-3 text-left ${
                requestKind === k
                  ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10'
                  : 'border-[var(--glass-border)]'
              }`}
            >
              <p className="text-[12px] font-semibold text-[var(--text)]">
                {k === 'physical' ? 'Physical Naira' : 'Virtual USD'}
              </p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">
                {k === 'physical' ? 'ATM · POS · in-store' : 'Online · international'}
              </p>
            </button>
          ))}
        </div>

        {requestKind === 'physical' && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Delivery address
            </label>
            <textarea
              className={`${fieldClass} !h-24 py-3 resize-none`}
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              placeholder="Full delivery address"
            />
          </div>
        )}

        {isVirtual && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              First top-up (USD)
            </label>
            <input
              className={`${fieldClass} !h-12 font-mono text-base`}
              type="number"
              min={quote?.minInitialTopUpUsd ?? 0}
              step="1"
              value={initialTopUpUsd}
              onChange={e => setInitialTopUpUsd(e.target.value)}
              placeholder="20"
            />
            {quote && quote.minInitialTopUpUsd > 0 && (
              <p className="text-[11px] text-[var(--muted)]">
                Minimum ${quote.minInitialTopUpUsd.toFixed(2)} USD required to activate.
              </p>
            )}
          </div>
        )}

        <section className="rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.04] px-4 py-3.5 space-y-2.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            Cost summary
          </p>
          {quoteLoading && !quote ? (
            <p className="text-[12px] text-[var(--muted)]">Loading quote…</p>
          ) : quoteError && !quote ? (
            <p className="text-[12px] text-rose-500">{quoteError}</p>
          ) : quote ? (
            <>
              <SummaryRow label="Card cost" value={formatNgn(quote.issuanceFeeNgn)} />
              {quote.deliveryFeeNgn > 0 && (
                <SummaryRow label="Delivery" value={formatNgn(quote.deliveryFeeNgn)} />
              )}
              {isVirtual && (
                <>
                  <SummaryRow
                    label="First top-up"
                    value={`$${quote.initialTopUpUsd.toFixed(2)} USD`}
                  />
                  {quote.fxRate > 0 && (
                    <SummaryRow
                      label="FX rate"
                      value={`₦${quote.fxRate.toLocaleString('en-NG', { maximumFractionDigits: 2 })} / $1`}
                    />
                  )}
                  <SummaryRow
                    label="Conversion (NGN)"
                    value={formatNgn(quote.topUpNgn)}
                  />
                </>
              )}
              <div className="pt-2 mt-1 border-t border-[var(--glass-border)] flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold text-[var(--text)]">Total debit</span>
                <span className="font-mono text-[14px] font-bold text-[var(--text)]">
                  {formatNgn(quote.totalDebitNgn)}
                </span>
              </div>
              {quote.walletBalanceNgn != null && (
                <p
                  className={`text-[11px] ${
                    quote.sufficientBalance === false ? 'text-rose-500' : 'text-[var(--muted)]'
                  }`}
                >
                  Wallet · {formatNgn(quote.walletBalanceNgn)}
                  {quote.sufficientBalance === false ? ' · insufficient' : ''}
                </p>
              )}
              {quote.notes.length > 0 && (
                <ul className="pt-1 space-y-1">
                  {quote.notes.map(n => (
                    <li key={n} className="text-[11px] text-[var(--muted)] leading-snug">
                      {n}
                    </li>
                  ))}
                </ul>
              )}
              {quoteLoading && (
                <p className="text-[10px] text-[var(--muted)]">Updating quote…</p>
              )}
            </>
          ) : (
            <p className="text-[12px] text-[var(--muted)]">Select a card type to see costs.</p>
          )}
        </section>

        <button
          type="button"
          onClick={onContinue}
          disabled={quoteLoading && !quote}
          className="glass-cta w-full disabled:opacity-50"
        >
          Continue with PIN
        </button>
      </div>
    </div>
  );
};

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 text-[12px]">
    <span className="text-[var(--muted)]">{label}</span>
    <span className="font-mono text-[var(--text)] text-right shrink-0">{value}</span>
  </div>
);

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
      Request card
    </button>
  </section>
);

const PhysicalCardFace: React.FC<{
  card: AppCard;
  frozen: boolean;
  showDetails: boolean;
  balance: number;
  cardholder: string;
}> = ({ card, frozen, showDetails, balance, cardholder }) => (
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
        {showDetails ? card.panMasked : `•••• •••• •••• ${card.last4}`}
      </div>
    </div>
    <div className="flex justify-between items-end pt-2 border-t border-white/10 mt-2 relative gap-2">
      <div className="min-w-0">
        <span className="text-[9px] text-white/45 uppercase block">Cardholder</span>
        <span className="text-xs font-semibold text-white tracking-wide truncate block uppercase">
          {cardholder}
        </span>
      </div>
      <div>
        <span className="text-[9px] text-white/45 uppercase block">Expires</span>
        <span className="font-mono text-xs text-white">
          {showDetails ? `${card.expiryMonth}/${card.expiryYear}` : '••/••'}
        </span>
      </div>
      <div>
        <span className="text-[9px] text-white/45 uppercase block">CVV</span>
        <span className="font-mono text-xs text-white">
          {showDetails ? card.cvvMasked || '•••' : '•••'}
        </span>
      </div>
      <div className="text-[10px] font-bold text-white/80 tracking-wide uppercase">
        {card.network || 'VERVE'}
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

const VirtualCardFace: React.FC<{
  card: AppCard;
  frozen: boolean;
  showDetails: boolean;
  balance: number;
  cardholder: string;
}> = ({ card, frozen, showDetails, balance, cardholder }) => (
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
        {showDetails ? card.panMasked : `•••• •••• •••• ${card.last4}`}
      </div>
    </div>
    <div className="flex justify-between items-end pt-2 border-t border-white/10 mt-2 relative gap-2">
      <div className="min-w-0">
        <span className="text-[9px] text-white/45 uppercase block">Cardholder</span>
        <span className="text-xs font-semibold text-white tracking-wide truncate block uppercase">
          {cardholder}
        </span>
      </div>
      <div>
        <span className="text-[9px] text-white/45 uppercase block">Expires</span>
        <span className="font-mono text-xs text-white">
          {showDetails ? `${card.expiryMonth}/${card.expiryYear}` : '••/••'}
        </span>
      </div>
      <div>
        <span className="text-[9px] text-white/45 uppercase block">CVV</span>
        <span className="font-mono text-xs text-white">
          {showDetails ? card.cvvMasked || '•••' : '•••'}
        </span>
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
