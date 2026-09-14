import React, { useEffect, useRef, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import { apiLookupUserByPhone } from '../../lib/xtrapayApi';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

type MainTab = 'new' | 'incoming' | 'sent';

const REQUESTS_LIVE_POLL_MS = 20_000;

export const AskMoneyScreen: React.FC = () => {
  const {
    moneyRequests,
    refreshMoneyRequests,
    sendMoneyRequest,
    requestFacility,
    acceptMoneyRequest,
    declineMoneyRequest,
    cancelMoneyRequest,
    navigateBack,
    showToast,
    overdraftLimit,
  } = useTransactions();

  const [activeTab, setActiveTab] = useState<MainTab>('new');
  const [requestKind, setRequestKind] = useState<'contact' | 'facility'>('contact');
  const [facilityKind, setFacilityKind] = useState<'overdraft' | 'loan'>('overdraft');
  const [loanTenor, setLoanTenor] = useState<string>('30 days');

  const [phone, setPhone] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientHasApp, setRecipientHasApp] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [note, setNote] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('5,000');
  const [isKeypadOpen, setIsKeypadOpen] = useState<boolean>(false);
  const [showConfirmSummary, setShowConfirmSummary] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);

  const [activeAcceptRequestId, setActiveAcceptRequestId] = useState<string | null>(null);
  const [isPinOpen, setIsPinOpen] = useState<boolean>(false);

  const refreshRef = useRef(refreshMoneyRequests);
  refreshRef.current = refreshMoneyRequests;
  const lastLookupPhoneRef = useRef('');

  useEffect(() => {
    void refreshRef.current();
    const syncIfVisible = () => {
      if (document.visibilityState === 'visible') void refreshRef.current();
    };
    document.addEventListener('visibilitychange', syncIfVisible);
    window.addEventListener('focus', syncIfVisible);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshRef.current();
    }, REQUESTS_LIVE_POLL_MS);
    return () => {
      document.removeEventListener('visibilitychange', syncIfVisible);
      window.removeEventListener('focus', syncIfVisible);
      window.clearInterval(timer);
    };
  }, []);

  // Lookup recipient when phone reaches 10+ digits (same idea as Save Together).
  useEffect(() => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setRecipientName('');
      setRecipientHasApp(false);
      lastLookupPhoneRef.current = '';
      return;
    }
    if (digits === lastLookupPhoneRef.current) return;

    let cancelled = false;
    const run = async () => {
      setLookingUp(true);
      try {
        const lookup = await apiLookupUserByPhone(phone);
        if (cancelled) return;
        lastLookupPhoneRef.current = digits;
        if (lookup.found && lookup.fullName?.trim()) {
          setRecipientName(lookup.fullName.trim());
          setRecipientHasApp(true);
        } else {
          setRecipientName('');
          setRecipientHasApp(false);
        }
      } catch (err) {
        if (cancelled) return;
        lastLookupPhoneRef.current = digits;
        setRecipientName('');
        setRecipientHasApp(false);
        if (err instanceof ApiError && err.status !== 404) {
          showToast('Lookup failed', err.message, 'warning');
        }
      } finally {
        if (!cancelled) setLookingUp(false);
      }
    };
    const t = window.setTimeout(run, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [phone, showToast]);

  const incomingRequests = moneyRequests.filter(r => r.isIncoming);
  const sentRequests = moneyRequests.filter(r => !r.isIncoming);
  const pendingIncomingCount = incomingRequests.filter(r => r.status === 'Pending').length;

  const recentContacts = (() => {
    const seen = new Set<string>();
    const out: Array<{ name: string; phone: string }> = [];
    for (const r of moneyRequests) {
      if (r.type !== 'contact') continue;
      const p = (r.isIncoming ? r.requesterPhone : r.recipientPhone).replace(/\s+/g, '');
      const n = r.isIncoming ? r.requesterName : r.recipientName;
      const key = p.replace(/\D/g, '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ name: n, phone: p });
      if (out.length >= 8) break;
    }
    return out;
  })();

  const fieldClass =
    'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

  const segmentBtn = (active: boolean) =>
    `flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
      active ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--muted)]'
    }`;

  const chipBtn = (active: boolean) =>
    `py-2 px-3 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 border transition-all ${
      active
        ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]'
        : 'border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] text-[var(--muted)]'
    }`;

  const handleSelectContact = (c: { name: string; phone: string }) => {
    setPhone(c.phone);
    setRecipientName(c.name);
    setRecipientHasApp(Boolean(c.name && c.name !== c.phone));
    lastLookupPhoneRef.current = c.phone.replace(/\D/g, '');
    showToast('Contact Loaded', `${c.name} selected.`);
  };

  const handleOpenAmountSheet = () => {
    if (requestKind === 'contact' && phone.replace(/\D/g, '').length < 10) {
      showToast('Missing Contact', 'Enter a valid phone number (at least 10 digits).', 'warning');
      return;
    }
    setIsKeypadOpen(true);
  };

  const handleNumericKey = (val: string) => {
    let clean = amountStr.replace(/,/g, '');
    if (clean === '0' || clean === '') {
      clean = val;
    } else if (clean.length < 9) {
      clean += val;
    }
    const num = parseFloat(clean);
    if (!isNaN(num)) {
      setAmountStr(num.toLocaleString());
    }
  };

  const handleBackspace = () => {
    const clean = amountStr.replace(/,/g, '');
    if (clean.length <= 1) {
      setAmountStr('0');
    } else {
      const updated = clean.slice(0, -1);
      const num = parseFloat(updated);
      setAmountStr(isNaN(num) ? '0' : num.toLocaleString());
    }
  };

  const handleSendRequest = async () => {
    const numericAmount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('Invalid Amount', 'Enter a valid amount.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (requestKind === 'contact') {
        const ok = await sendMoneyRequest({
          recipientName: recipientName || phone,
          recipientPhone: phone,
          amount: numericAmount,
          note: note || undefined,
        });
        if (ok) {
          setIsKeypadOpen(false);
          setShowConfirmSummary(false);
          setActiveTab('sent');
          setPhone('');
          setRecipientName('');
          setRecipientHasApp(false);
          setNote('');
        }
      } else {
        const ok = await requestFacility({
          kind: facilityKind,
          amount: numericAmount,
          tenor: facilityKind === 'loan' ? loanTenor : undefined,
        });
        if (ok) {
          setIsKeypadOpen(false);
          setShowConfirmSummary(false);
          setActiveTab('sent');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerAccept = (reqId: string) => {
    setActiveAcceptRequestId(reqId);
    setIsPinOpen(true);
  };

  const handlePinSuccess = async (pin: string) => {
    if (activeAcceptRequestId) {
      const ok = await acceptMoneyRequest(activeAcceptRequestId, pin);
      if (ok) {
        setIsPinOpen(false);
        setActiveAcceptRequestId(null);
        return;
      }
      return false;
    }
  };

  const activeRequestForPin = moneyRequests.find(r => r.id === activeAcceptRequestId);

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5" id="ask-money-screen">
      {/* Header */}
      <section className="flex items-center justify-between px-0.5">
        <p className="text-[12px] text-[var(--muted)]">Peer payment requests &amp; checkout overdraft</p>
        <span className="glass-chip !rounded-full !px-2.5 !py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Icon name="bolt" size={13} />
          Zero fee
        </span>
      </section>

      {/* Main tabs */}
      <section className="glass-card glass-strong flex p-1 !rounded-[18px]">
        <button type="button" onClick={() => setActiveTab('new')} className={segmentBtn(activeTab === 'new')}>
          <Icon name="add" size={16} />
          New
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('incoming')}
          className={`${segmentBtn(activeTab === 'incoming')} relative`}
        >
          <Icon name="arrow_downward" size={16} />
          Incoming
          {pendingIncomingCount > 0 && (
            <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {pendingIncomingCount}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setActiveTab('sent')} className={segmentBtn(activeTab === 'sent')}>
          <Icon name="arrow_upward" size={16} />
          Sent
        </button>
      </section>

      {/* TAB: NEW REQUEST */}
      {activeTab === 'new' && (
        <div className="space-y-5">
          <section className="glass-card glass-strong !rounded-[24px] px-5 py-4 space-y-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              What do you need?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setRequestKind('contact')} className={chipBtn(requestKind === 'contact')}>
                <Icon name="contacts" size={16} />
                Ask a contact
              </button>
              <button type="button" onClick={() => setRequestKind('facility')} className={chipBtn(requestKind === 'facility')}>
                <Icon name="bolt" size={16} />
                Overdraft / loan
              </button>
            </div>
          </section>

          {requestKind === 'contact' ? (
            <section className="glass-card glass-strong !rounded-[24px] px-5 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                  Recipient phone
                </label>
                <div className="relative">
                  <Icon
                    name="search"
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0803 000 0000"
                    className={`${fieldClass} !pl-10 font-mono text-[13px]`}
                  />
                </div>
                {lookingUp && (
                  <p className="text-[11px] text-[var(--muted)] px-0.5">Looking up Xtrapay user…</p>
                )}
              </div>

              {recipientHasApp && recipientName ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 px-3.5 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Icon name="check" size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--text)] truncate">{recipientName}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Has Xtrapay — name from lookup</p>
                    </div>
                  </div>
                </div>
              ) : phone.replace(/\D/g, '').length >= 10 && !lookingUp ? (
                <div className="rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] px-3.5 py-3">
                  <p className="text-[12px] text-[var(--muted)]">
                    No Xtrapay account found for this number yet. You can still send a request — their name shows when they join.
                  </p>
                </div>
              ) : null}

              {recentContacts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)] px-0.5">
                    Recent
                  </p>
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                    {recentContacts.map(c => (
                      <button
                        key={c.phone}
                        type="button"
                        onClick={() => handleSelectContact(c)}
                        className="shrink-0 flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] px-3 py-2 transition-all active:scale-[0.98]"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/50 dark:bg-white/8 text-[11px] font-bold text-[var(--accent)]">
                          {(c.name || '?')
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map(w => w[0])
                            .join('')
                            .toUpperCase() || '?'}
                        </span>
                        <span className="text-[12px] font-semibold text-[var(--text)]">
                          {c.name.split(' ')[0] || c.phone}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                  Optional note / reason
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Dinner bill split, Uber share..."
                  className={`${fieldClass} !h-11`}
                />
              </div>

              <button
                type="button"
                onClick={handleOpenAmountSheet}
                className="w-full rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-4 py-3.5 flex items-center justify-between text-left transition-all active:scale-[0.99]"
              >
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)] block">
                    Requested amount
                  </span>
                  <span className="font-mono text-xl font-semibold text-[var(--text)]">₦{amountStr}</span>
                </div>
                <span className="h-9 px-3 rounded-xl bg-[var(--accent)] text-white text-[11px] font-semibold flex items-center gap-1">
                  Set amount
                  <Icon name="chevron_right" size={14} />
                </span>
              </button>

              <button
                type="button"
                onClick={handleOpenAmountSheet}
                className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform"
              >
                Continue
                <Icon name="arrow_forward" size={18} />
              </button>
            </section>
          ) : (
            <section className="glass-card glass-strong !rounded-[24px] px-5 py-5 space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                  Request type
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFacilityKind('overdraft')}
                    className={`glass-card glass-strong !rounded-[18px] p-3 text-left transition-all active:scale-[0.98] ${
                      facilityKind === 'overdraft' ? 'ring-2 ring-[var(--accent)]/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                        <Icon name="bolt" size={17} />
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
                    </div>
                    <h3 className="mt-2 text-[12px] font-bold text-[var(--text)]">Overdraft</h3>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-snug">
                      Spend beyond balance up to limit
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacilityKind('loan')}
                    className={`glass-card glass-strong !rounded-[18px] p-3 text-left transition-all active:scale-[0.98] ${
                      facilityKind === 'loan' ? 'ring-2 ring-[var(--accent)]/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                        <Icon name="account_balance" size={17} />
                      </span>
                    </div>
                    <h3 className="mt-2 text-[12px] font-bold text-[var(--text)]">Quick loan</h3>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-snug">
                      Disburse to wallet after approval
                    </p>
                  </button>
                </div>
              </div>

              {facilityKind === 'loan' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                    Tenor
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['14 days', '30 days', '60 days', '90 days'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLoanTenor(t)}
                        className={chipBtn(loanTenor === t)}
                      >
                        {t.replace(' days', 'd')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[12px] text-[var(--muted)] leading-relaxed">
                {facilityKind === 'overdraft'
                  ? 'Request an overdraft on your wallet — subject to approval.'
                  : 'Request a quick loan disbursed to your personal wallet after approval.'}
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                {facilityKind === 'overdraft'
                  ? `Current authorized limit: ₦${overdraftLimit.toLocaleString()}.`
                  : `Selected tenor: ${loanTenor}.`}
              </p>

              <button
                type="button"
                onClick={handleOpenAmountSheet}
                className="w-full rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-4 py-3.5 flex items-center justify-between text-left transition-all active:scale-[0.99]"
              >
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)] block">
                    {facilityKind === 'overdraft' ? 'Overdraft extension' : 'Loan amount'}
                  </span>
                  <span className="font-mono text-xl font-semibold text-[var(--text)]">₦{amountStr}</span>
                </div>
                <span className="h-9 px-3 rounded-xl bg-[var(--accent)] text-white text-[11px] font-semibold flex items-center gap-1">
                  Set amount
                  <Icon name="chevron_right" size={14} />
                </span>
              </button>

              <button
                type="button"
                onClick={handleOpenAmountSheet}
                className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform"
              >
                {facilityKind === 'overdraft' ? 'Request overdraft' : 'Request loan'}
                <Icon name="arrow_forward" size={18} />
              </button>
            </section>
          )}
        </div>
      )}

      {/* TAB: INCOMING */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
              Requests received
            </p>
            <span className="text-[12px] font-semibold text-[var(--accent)]">{incomingRequests.length} total</span>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="glass-card glass-strong !rounded-[24px] px-6 py-10 text-center space-y-2">
              <Icon name="arrow_downward" size={32} className="text-[var(--muted)] mx-auto opacity-60" />
              <p className="text-[13px] font-semibold text-[var(--text)]">No incoming requests</p>
              <p className="text-[12px] text-[var(--muted)]">
                When friends or contacts ask for money, you&apos;ll see them here.
              </p>
            </div>
          ) : (
            incomingRequests.map(req => {
              const isPending = req.status === 'Pending';
              return (
                <div key={req.id} className="glass-card glass-strong !rounded-[24px] px-5 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[12px] font-bold text-[var(--accent)]">
                        {req.requesterName
                          .split(' ')
                          .map(w => w[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-semibold text-[var(--text)] truncate">{req.requesterName}</h4>
                        <p className="text-[10px] text-[var(--muted)]">
                          {req.requesterPhone} • {req.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-[14px] font-semibold text-[var(--text)]">
                        ₦{req.amount.toLocaleString()}
                      </div>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                          req.status === 'Accepted'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                            : req.status === 'Declined'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>

                  {req.note && (
                    <p className="text-[11px] text-[var(--muted)] italic rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] px-3 py-2">
                      &ldquo;{req.note}&rdquo;
                    </p>
                  )}

                  {isPending && (
                    <div className="flex items-center gap-2 pt-1 border-t border-[var(--glass-border)]">
                      <button
                        type="button"
                        onClick={() => handleTriggerAccept(req.id)}
                        className="flex-1 h-10 rounded-2xl bg-emerald-600 text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                      >
                        <Icon name="check" size={16} />
                        Accept &amp; pay (PIN)
                      </button>
                      <button
                        type="button"
                        onClick={() => void declineMoneyRequest(req.id)}
                        className="px-4 h-10 rounded-2xl glass-chip !rounded-2xl text-rose-600 dark:text-rose-400 text-[12px] font-semibold active:scale-[0.98]"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB: SENT */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
              Requests you sent
            </p>
            <span className="text-[12px] font-semibold text-[var(--accent)]">{sentRequests.length} total</span>
          </div>

          {sentRequests.length === 0 ? (
            <div className="glass-card glass-strong !rounded-[24px] px-6 py-10 text-center space-y-2">
              <Icon name="send" size={32} className="text-[var(--muted)] mx-auto opacity-60" />
              <p className="text-[13px] font-semibold text-[var(--text)]">No sent requests</p>
              <p className="text-[12px] text-[var(--muted)]">
                Compose your first money request in the New tab.
              </p>
            </div>
          ) : (
            sentRequests.map(req => (
              <div key={req.id} className="glass-card glass-strong !rounded-[24px] px-5 py-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                      To: {req.recipientName}
                    </span>
                    <h4 className="text-[13px] font-semibold text-[var(--text)]">
                      {req.type === 'overdraft'
                        ? 'Overdraft facility request'
                        : req.type === 'loan'
                        ? `Quick loan (${req.tenor || '30 days'})`
                        : req.recipientPhone}
                    </h4>
                    <p className="text-[10px] text-[var(--muted)]">
                      {req.date} • {req.timestamp}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-[14px] font-semibold text-[var(--text)]">
                      ₦{req.amount.toLocaleString()}
                    </div>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                        req.status === 'Accepted'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                          : req.status === 'Cancelled'
                          ? 'bg-black/5 dark:bg-white/10 text-[var(--muted)] border border-[var(--glass-border)]'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>

                {req.note && (
                  <p className="text-[11px] text-[var(--muted)] rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] px-3 py-2">
                    Note: {req.note}
                  </p>
                )}

                {req.status === 'Pending' && req.type === 'contact' && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => void cancelMoneyRequest(req.id)}
                      className="text-[12px] font-semibold text-rose-600 dark:text-rose-400"
                    >
                      Cancel request
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Amount keypad sheet */}
      {isKeypadOpen && (
        <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                {requestKind === 'contact' ? 'Request amount' : 'Credit facility amount'}
              </span>
              <button
                type="button"
                onClick={() => setIsKeypadOpen(false)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="text-center py-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] block">Target figure</span>
              <div className="text-3xl font-mono font-semibold text-[var(--text)] tracking-tight">₦{amountStr}</div>
              <p className="text-[12px] text-[var(--muted)] mt-1">
                {requestKind === 'contact'
                  ? `From ${recipientName || phone || 'contact'}`
                  : facilityKind === 'overdraft'
                  ? 'Request an overdraft on your wallet — subject to approval.'
                  : `Quick loan • ${loanTenor}`}
              </p>
            </div>

            {showConfirmSummary ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] px-4 py-3 text-[12px] text-[var(--muted)] space-y-1">
                  <p>
                    Amount:{' '}
                    <span className="font-mono font-semibold text-[var(--text)]">₦{amountStr}</span>
                  </p>
                  {requestKind === 'contact' && (
                    <p>
                      To: <span className="text-[var(--text)]">{recipientName || phone}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSendRequest()}
                  className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold disabled:opacity-60"
                >
                  {submitting
                    ? 'Sending…'
                    : requestKind === 'contact'
                    ? 'Send request'
                    : facilityKind === 'overdraft'
                    ? 'Request overdraft'
                    : 'Request loan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmSummary(false)}
                  className="w-full text-[12px] font-semibold text-[var(--muted)]"
                >
                  Edit amount
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2.5">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleNumericKey(k)}
                      className="h-12 rounded-2xl glass-chip !rounded-2xl text-[18px] font-mono font-semibold text-[var(--text)] active:scale-[0.97]"
                    >
                      {k}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="h-12 rounded-2xl glass-chip !rounded-2xl text-[var(--muted)] flex items-center justify-center active:scale-[0.97]"
                    aria-label="Backspace"
                  >
                    <Icon name="delete" size={20} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmSummary(true)}
                  className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold"
                >
                  Continue
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <PinSheetModal
        isOpen={isPinOpen}
        onClose={() => {
          setIsPinOpen(false);
          setActiveAcceptRequestId(null);
        }}
        onSuccess={handlePinSuccess}
        title="Confirm payment"
        subtitle={
          activeRequestForPin
            ? `Pay ₦${activeRequestForPin.amount.toLocaleString()} to ${activeRequestForPin.requesterName}`
            : 'Enter your 4-digit PIN'
        }
      />

      <button type="button" onClick={navigateBack} className="sr-only">
        Back
      </button>
    </main>
  );
};
