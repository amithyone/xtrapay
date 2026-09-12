import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { INITIAL_BENEFICIARIES } from '../../data/initialData';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

type MainTab = 'new' | 'incoming' | 'sent';
type RequestKind = 'contact' | 'overdraft' | 'loan';

export const AskMoneyScreen: React.FC = () => {
  const {
    moneyRequests,
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

  const [phone, setPhone] = useState<string>('0802 339 4410');
  const [recipientName, setRecipientName] = useState<string>('Adekunle Olumide');
  const [note, setNote] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('5,000');
  const [isKeypadOpen, setIsKeypadOpen] = useState<boolean>(false);
  const [showConfirmSummary, setShowConfirmSummary] = useState<boolean>(false);

  const [activeAcceptRequestId, setActiveAcceptRequestId] = useState<string | null>(null);
  const [isPinOpen, setIsPinOpen] = useState<boolean>(false);

  const incomingRequests = moneyRequests.filter(r => r.isIncoming);
  const sentRequests = moneyRequests.filter(r => !r.isIncoming);
  const pendingIncomingCount = incomingRequests.filter(r => r.status === 'Pending').length;

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

  const handleSelectContact = (ben: typeof INITIAL_BENEFICIARIES[0]) => {
    setRecipientName(ben.name);
    setPhone(ben.accountNumber.startsWith('0') ? ben.accountNumber : `080${ben.accountNumber.slice(0, 8)}`);
    showToast('Contact Loaded', `${ben.name} selected.`);
  };

  const handleOpenAmountSheet = () => {
    if (requestKind === 'contact' && !phone) {
      showToast('Missing Contact', 'Please enter a contact phone number.', 'warning');
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

  const handleSendRequest = () => {
    const numericAmount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('Invalid Amount', 'Enter a valid amount.', 'warning');
      return;
    }

    if (requestKind === 'contact') {
      sendMoneyRequest({
        recipientName: recipientName || 'Checkout Contact',
        recipientPhone: phone,
        amount: numericAmount,
        note: note || undefined,
      });
      setIsKeypadOpen(false);
      setShowConfirmSummary(false);
      setActiveTab('sent');
    } else {
      requestFacility({
        kind: facilityKind,
        amount: numericAmount,
        tenor: facilityKind === 'loan' ? loanTenor : undefined,
      });
      setIsKeypadOpen(false);
      setShowConfirmSummary(false);
    }
  };

  const handleTriggerAccept = (reqId: string) => {
    setActiveAcceptRequestId(reqId);
    setIsPinOpen(true);
  };

  const handlePinSuccess = (pin: string) => {
    if (activeAcceptRequestId) {
      const ok = acceptMoneyRequest(activeAcceptRequestId, pin);
      if (ok) {
        setIsPinOpen(false);
        setActiveAcceptRequestId(null);
      }
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
                  Recipient phone / wallet tag
                </label>
                <div className="relative">
                  <Icon
                    name="search"
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
                  />
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Enter phone or @tag"
                    className={`${fieldClass} !pl-10 font-mono text-[13px]`}
                  />
                </div>
              </div>

              {recipientName && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 px-3.5 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Icon name="check" size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--text)] truncate">{recipientName}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Verified checkout wallet user</p>
                    </div>
                  </div>
                  <span className="glass-chip !rounded-full !px-2 !py-0.5 text-[10px] font-mono text-[var(--muted)] shrink-0">
                    Tier 3
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)] px-0.5">
                  Saved beneficiaries
                </p>
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                  {INITIAL_BENEFICIARIES.map(ben => (
                    <button
                      key={ben.id}
                      type="button"
                      onClick={() => handleSelectContact(ben)}
                      className="shrink-0 flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] px-3 py-2 transition-all active:scale-[0.98]"
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/50 dark:bg-white/8 text-[11px] font-bold ${ben.colorClass}`}
                      >
                        {ben.initials}
                      </span>
                      <span className="text-[12px] font-semibold text-[var(--text)]">{ben.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

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
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Pre-approved</span>
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
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/15 text-teal-600">
                        <Icon name="account_balance" size={17} />
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-[var(--accent)]">2.5% Mo.</span>
                    </div>
                    <h3 className="mt-2 text-[12px] font-bold text-[var(--text)]">Loan</h3>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-snug">
                      Fixed amount to repay with tenor
                    </p>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] px-3.5 py-3 text-[12px] space-y-1">
                <p className="font-medium text-[var(--text)]">
                  {facilityKind === 'overdraft'
                    ? 'Request an overdraft on your wallet — subject to approval.'
                    : 'Fixed institutional installment loan disbursed instantly to your wallet.'}
                </p>
                <p className="text-[11px] text-[var(--muted)]">
                  {facilityKind === 'overdraft'
                    ? `Current authorized limit: ₦${overdraftLimit.toLocaleString()}. Zero interest if settled within 14 days.`
                    : 'Flexible repayments automatically deducted at cycle maturity.'}
                </p>
              </div>

              {facilityKind === 'loan' && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                    Select repayment tenor
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['30 days', '60 days', '90 days'].map(ten => (
                      <button
                        key={ten}
                        type="button"
                        onClick={() => setLoanTenor(ten)}
                        className={`py-2 rounded-xl text-[11px] font-semibold transition-all ${
                          loanTenor === ten
                            ? 'bg-[var(--accent)]/15 border border-[var(--accent)] text-[var(--accent)]'
                            : 'glass-chip !rounded-xl !px-1 !py-2 text-[var(--muted)]'
                        }`}
                      >
                        {ten}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                        onClick={() => declineMoneyRequest(req.id)}
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

                {req.status === 'Pending' && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => cancelMoneyRequest(req.id)}
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
                  ? `Asking from ${recipientName || phone}`
                  : facilityKind === 'overdraft'
                  ? 'Request an overdraft on your wallet — subject to approval.'
                  : `Repayment tenor: ${loanTenor}`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumericKey(digit)}
                  className="h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--text)] font-mono text-lg font-semibold active:scale-95 transition-transform"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmountStr('5,000')}
                className="h-11 rounded-2xl glass-chip !rounded-2xl text-[11px] text-[var(--accent)] font-mono font-semibold"
              >
                ₦5k
              </button>
              <button
                type="button"
                onClick={() => handleNumericKey('0')}
                className="h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--text)] font-mono text-lg font-semibold active:scale-95 transition-transform"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--muted)] flex items-center justify-center active:scale-95 transition-transform"
              >
                <Icon name="arrow_back" size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendRequest}
              className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform"
            >
              {requestKind === 'contact'
                ? `Send request (₦${amountStr})`
                : facilityKind === 'overdraft'
                ? 'Request overdraft'
                : 'Request loan'}
              <Icon name="arrow_forward" size={18} />
            </button>
          </div>
        </div>
      )}

      <PinSheetModal
        isOpen={isPinOpen}
        onClose={() => {
          setIsPinOpen(false);
          setActiveAcceptRequestId(null);
        }}
        title="Authorize Peer Payment"
        recipient={activeRequestForPin?.requesterName}
        amount={activeRequestForPin?.amount}
        subtitle="Money will be transferred from your wallet immediately."
        onSuccess={handlePinSuccess}
      />
    </main>
  );
};
