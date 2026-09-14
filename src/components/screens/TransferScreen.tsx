import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import type { Beneficiary } from '../../types';
import { ApiError } from '../../lib/api';
import { apiLookupUserByPhone, apiNameEnquiry } from '../../lib/xtrapayApi';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

export const TransferScreen: React.FC = () => {
  const {
    personalBalance,
    businessBalance,
    wallets,
    selectedWallet,
    selectedWalletId,
    banks,
    banksLoading,
    beneficiaries,
    transactions,
    initiateTransfer,
    setActiveScreen,
    showToast,
    saveBeneficiary,
    setIsNearbyPayOpen,
    setIsPayAtShopOpen,
    setIsScanToPayOpen,
    prefilledTransferData,
    setPrefilledTransferData,
  } = useTransactions();

  const [channel, setChannel] = useState<'bank' | 'wallet'>('bank');
  const [debitWalletId, setDebitWalletId] = useState(selectedWalletId);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('Access Bank');
  const [amountStr, setAmountStr] = useState<string>('');
  const [narration, setNarration] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [nameLoading, setNameLoading] = useState(false);
  const [debitModalOpen, setDebitModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankQuery, setBankQuery] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [savingBeneficiary, setSavingBeneficiary] = useState(false);
  const nameEnquirySeq = useRef(0);
  /** Skip auto name-enquiry for this acct|bank after one failure until the user changes either value. */
  const failedNameEnquiryKey = useRef<string | null>(null);
  const succeededNameEnquiryKey = useRef<string | null>(null);
  const failedWalletLookupKey = useRef<string | null>(null);
  const succeededWalletLookupKey = useRef<string | null>(null);

  // Always default debit account to the account currently in view
  useEffect(() => {
    setDebitWalletId(selectedWalletId);
  }, [selectedWalletId]);

  useEffect(() => {
    if (prefilledTransferData) {
      if (prefilledTransferData.accountNumber) {
        setAccountNumber(prefilledTransferData.accountNumber);
      }
      if (prefilledTransferData.bankName) {
        setSelectedBank(prefilledTransferData.bankName);
      }
      if (prefilledTransferData.recipientName) {
        setRecipientName(prefilledTransferData.recipientName.toUpperCase());
      }
      if (prefilledTransferData.amount) {
        setAmountStr(prefilledTransferData.amount.toLocaleString());
      }
      if (prefilledTransferData.narration) {
        setNarration(prefilledTransferData.narration);
      }
      setPrefilledTransferData(null);
    }
  }, [prefilledTransferData, setPrefilledTransferData]);

  useEffect(() => {
    if (!banks.length) return;
    if (!banks.some(b => b.name === selectedBank)) {
      setSelectedBank(banks[0].name);
    }
  }, [banks, selectedBank]);

  const selectedBankMeta = useMemo(
    () => banks.find(b => b.name === selectedBank) ?? null,
    [banks, selectedBank]
  );

  useEffect(() => {
    if (channel !== 'bank') return;

    const acct = accountNumber.replace(/\D/g, '');
    // Only enquire when NUBAN is exactly 10 digits and a bank code is known.
    if (acct.length !== 10 || !selectedBankMeta?.code) {
      return;
    }

    const key = `${acct}|${selectedBankMeta.code}`;

    // After a failed attempt, do not retry the same account+bank until the user changes values.
    if (failedNameEnquiryKey.current === key) {
      return;
    }

    // Do not re-hit the API for a combo that already resolved successfully.
    if (succeededNameEnquiryKey.current === key) {
      return;
    }

    const seq = ++nameEnquirySeq.current;
    setNameLoading(true);
    setRecipientName('');

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await apiNameEnquiry({
            accountNumber: acct,
            bankCode: selectedBankMeta.code,
            bankName: selectedBankMeta.name,
          });
          if (seq !== nameEnquirySeq.current) return;
          failedNameEnquiryKey.current = null;
          succeededNameEnquiryKey.current = key;
          setRecipientName(result.accountName);
        } catch (err) {
          if (seq !== nameEnquirySeq.current) return;
          failedNameEnquiryKey.current = key;
          succeededNameEnquiryKey.current = null;
          setRecipientName('');
          const msg =
            err instanceof ApiError
              ? err.message
              : 'Could not resolve account name.';
          showToast('Name enquiry failed', msg, 'warning');
        } finally {
          if (seq === nameEnquirySeq.current) setNameLoading(false);
        }
      })();
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [accountNumber, selectedBankMeta, channel, showToast]);

  // Wallet → wallet: confirm holder name from phone via GET /users/lookup
  useEffect(() => {
    if (channel !== 'wallet') return;

    const phone = phoneNumber.replace(/\D/g, '');
    if (phone.length < 10) {
      return;
    }

    if (failedWalletLookupKey.current === phone) return;
    if (succeededWalletLookupKey.current === phone) return;

    const seq = ++nameEnquirySeq.current;
    setNameLoading(true);
    setRecipientName('');

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await apiLookupUserByPhone(phone);
          if (seq !== nameEnquirySeq.current) return;
          const name = String(result.fullName || result.name || '').trim();
          if (!result.found || !name) {
            failedWalletLookupKey.current = phone;
            succeededWalletLookupKey.current = null;
            setRecipientName('');
            showToast(
              'Wallet not found',
              'No Xtrapay account matches that phone number.',
              'warning'
            );
            return;
          }
          failedWalletLookupKey.current = null;
          succeededWalletLookupKey.current = phone;
          setRecipientName(name.toUpperCase());
        } catch (err) {
          if (seq !== nameEnquirySeq.current) return;
          failedWalletLookupKey.current = phone;
          succeededWalletLookupKey.current = null;
          setRecipientName('');
          showToast(
            'Lookup failed',
            err instanceof ApiError ? err.message : 'Could not confirm wallet holder.',
            'warning'
          );
        } finally {
          if (seq === nameEnquirySeq.current) setNameLoading(false);
        }
      })();
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [phoneNumber, channel, showToast]);

  const debitWallet = useMemo(
    () => wallets.find(w => w.id === debitWalletId) ?? selectedWallet,
    [wallets, debitWalletId, selectedWallet]
  );

  const debitBalance = useMemo(() => {
    if (debitWallet.kind === 'personal') return personalBalance;
    if (debitWallet.kind === 'business') return businessBalance;
    return debitWallet.balance;
  }, [debitWallet, personalBalance, businessBalance]);

  const walletBalance = (w: (typeof wallets)[number]) => {
    if (w.kind === 'personal') return personalBalance;
    if (w.kind === 'business') return businessBalance;
    return w.balance;
  };

  const filteredBanks = useMemo(() => {
    const q = bankQuery.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter(
      b => b.name.toLowerCase().includes(q) || b.code.includes(q)
    );
  }, [bankQuery, banks]);

  const money = (n: number) =>
    `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const alreadySaved = useMemo(() => {
    if (!recipientName) return false;
    if (channel === 'bank') {
      const acct = accountNumber.replace(/\D/g, '');
      return beneficiaries.some(
        b =>
          b.accountNumber.replace(/\D/g, '') === acct &&
          b.bank.toLowerCase() === selectedBank.toLowerCase()
      );
    }
    const phone = phoneNumber.replace(/\D/g, '');
    return beneficiaries.some(b => b.accountNumber.replace(/\D/g, '') === phone);
  }, [accountNumber, beneficiaries, channel, phoneNumber, recipientName, selectedBank]);

  const handleSaveBeneficiary = async () => {
    if (!recipientName.trim() || savingBeneficiary) return;
    if (channel === 'bank') {
      const acct = accountNumber.replace(/\D/g, '');
      if (acct.length < 10 || !selectedBank) {
        showToast('Incomplete', 'Resolve account number and bank first.', 'warning');
        return;
      }
      setSavingBeneficiary(true);
      const saved = await saveBeneficiary({
        name: recipientName.trim(),
        accountNumber: acct,
        bank: selectedBank,
        bankCode: selectedBankMeta?.code,
        channel: 'bank',
      });
      setSavingBeneficiary(false);
      if (saved) {
        showToast('Beneficiary saved', `${saved.name} · ${saved.bank}`, 'success');
      }
      return;
    }
    const phone = phoneNumber.replace(/\D/g, '');
    if (phone.length < 10) {
      showToast('Incomplete', 'Confirm the wallet phone first.', 'warning');
      return;
    }
    setSavingBeneficiary(true);
    const saved = await saveBeneficiary({
      name: recipientName.trim(),
      phone,
      accountNumber: phone,
      bank: 'Xtrapay Wallet',
      channel: 'wallet',
    });
    setSavingBeneficiary(false);
    if (saved) {
      showToast('Beneficiary saved', `${saved.name} · Xtrapay Wallet`, 'success');
    }
  };

  const handleSelectBeneficiary = (ben: Beneficiary) => {
    if (ben.bank.toLowerCase().includes('xtrapay') || ben.bank.toLowerCase().includes('wallet')) {
      setChannel('wallet');
      setPhoneNumber(ben.accountNumber);
      setRecipientName('');
      showToast('Beneficiary Selected', `${ben.name} — confirming wallet…`);
      return;
    }
    setChannel('bank');
    setAccountNumber(ben.accountNumber);
    setSelectedBank(ben.bank);
    setRecipientName('');
    showToast('Beneficiary Selected', `${ben.name} (${ben.bank}) — verifying name…`);
  };

  /** Recent recipients: saved beneficiaries first, then unique people from live transfer ledger. */
  const recentRecipients = useMemo(() => {
    const byAcct = new Map<string, Beneficiary>();

    for (const ben of beneficiaries) {
      const key = ben.accountNumber.replace(/\D/g, '');
      if (key.length >= 10) byAcct.set(key, ben);
    }

    for (const tx of transactions) {
      if (tx.category !== 'transfer' || tx.type !== 'debit') continue;
      const acct = (tx.accountNumber || '').replace(/\D/g, '');
      if (acct.length < 10 || byAcct.has(acct)) continue;
      const name = tx.recipient || tx.title.replace(/^Transfer to\s+/i, '') || 'Recipient';
      byAcct.set(acct, {
        id: `tx-ben-${tx.id}`,
        name,
        initials: name
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map(p => p[0] ?? '')
          .join('')
          .toUpperCase() || '??',
        bank: tx.bank || 'Bank',
        accountNumber: acct,
        tier: 'Recent',
        colorClass: 'text-[var(--accent)]',
      });
    }

    return Array.from(byAcct.values()).slice(0, 12);
  }, [beneficiaries, transactions]);

  const handleQuickAmount = (val: number) => {
    setAmountStr(val.toLocaleString());
  };

  const handleProceed = () => {
    const numericAmount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('Invalid Amount', 'Please enter a valid transfer amount.', 'warning');
      return;
    }
    if (numericAmount > debitBalance) {
      showToast(
        'Insufficient Funds',
        `Amount exceeds ${debitWallet.name} balance.`,
        'warning'
      );
      return;
    }
    if (channel === 'bank' && accountNumber.replace(/\D/g, '').length < 10) {
      showToast('Invalid account', 'Enter a valid 10-digit account number.', 'warning');
      return;
    }
    if (channel === 'wallet' && phoneNumber.replace(/\D/g, '').length < 10) {
      showToast('Phone required', 'Enter the recipient’s Xtrapay phone number.', 'warning');
      return;
    }
    if (channel === 'bank' && !selectedBank.trim()) {
      showToast('Select bank', 'Choose a destination bank to continue.', 'warning');
      return;
    }
    if (nameLoading || !recipientName.trim()) {
      showToast(
        channel === 'wallet' ? 'Confirm wallet holder' : 'Name enquiry required',
        nameLoading
          ? 'Wait for the account name to resolve.'
          : channel === 'wallet'
            ? 'Phone number could not be matched to an Xtrapay user yet.'
            : 'Account name could not be verified yet.',
        'warning'
      );
      return;
    }
    setPinOpen(true);
  };

  const confirmTransfer = (pin: string) => {
    const numericAmount = parseFloat(amountStr.replace(/,/g, ''));
    setPinOpen(false);
    void initiateTransfer({
      amount: numericAmount,
      recipientName: recipientName || 'BENEFICIARY RECIPIENT',
      bankName: channel === 'wallet' ? 'Xtrapay Wallet' : selectedBank,
      bankCode: channel === 'bank' ? selectedBankMeta?.code : undefined,
      accountNumber: channel === 'bank' ? accountNumber : undefined,
      phone: channel === 'wallet' ? phoneNumber.replace(/\D/g, '') : undefined,
      channel,
      narration: narration || `From ${debitWallet.name}`,
      pin,
      walletId: debitWalletId,
    });
  };

  const fieldClass =
    'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5" id="transfer-screen">
      <section className="space-y-3">
        <div className="glass-card glass-strong flex p-1 !rounded-[18px]">
          <button
            type="button"
            onClick={() => {
              setChannel('bank');
              nameEnquirySeq.current += 1;
              setRecipientName('');
              setNameLoading(false);
            }}
            className={`settings-row flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-2 appearance-none border-0 cursor-pointer ${
              channel === 'bank'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'bg-transparent text-[var(--muted)]'
            }`}
          >
            <Icon name="account_balance" size={16} />
            Bank
          </button>
          <button
            type="button"
            onClick={() => {
              setChannel('wallet');
              nameEnquirySeq.current += 1;
              setRecipientName('');
              setNameLoading(false);
              failedWalletLookupKey.current = null;
              succeededWalletLookupKey.current = null;
            }}
            className={`settings-row flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-2 appearance-none border-0 cursor-pointer ${
              channel === 'wallet'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'bg-transparent text-[var(--muted)]'
            }`}
          >
            <Icon name="wallet" size={16} />
            Wallet
          </button>
        </div>

        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsNearbyPayOpen(true)}
              className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-orange-500"
              title="Nearby"
              aria-label="Nearby Pay"
            >
              <Icon name="wifi" size={15} />
            </button>
            <button
              type="button"
              onClick={() => setIsPayAtShopOpen(true)}
              className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-teal-600"
              title="Pay at shop"
              aria-label="Pay at Shop"
            >
              <Icon name="store" size={15} />
            </button>
            <button
              type="button"
              onClick={() => setIsScanToPayOpen(true)}
              className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-sky-600"
              title="Scan to pay"
              aria-label="Scan to Pay"
            >
              <Icon name="qr_code" size={15} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setActiveScreen('ask_money')}
            className="settings-row text-[12px] font-semibold text-[var(--accent)] flex items-center gap-1 appearance-none border-0 bg-transparent cursor-pointer p-0"
          >
            Request for money
            <Icon name="arrow_forward" size={14} />
          </button>
        </div>
      </section>

      <section className="glass-card glass-strong settings-list !rounded-[24px] px-5 py-5 space-y-3.5">
        {/* Debit account — custom modal */}
        <button
          type="button"
          onClick={() => setDebitModalOpen(true)}
          className={`settings-row ${fieldClass} flex items-center justify-between gap-2 text-left appearance-none cursor-pointer`}
          aria-label="Debit account"
        >
          <span className="min-w-0 truncate text-[var(--text)]">
            {debitWallet.name}
            <span className="text-[var(--muted)]"> · {money(debitBalance)}</span>
          </span>
          <Icon name="expand_more" size={18} className="text-[var(--muted)] shrink-0" />
        </button>
        <p className="text-[11px] text-[var(--muted)] -mt-1.5 px-0.5">
          Debit from ·{' '}
          {debitWallet.accountNumber?.trim()
            ? debitWallet.accountNumber
            : 'VA provisioning…'}{' '}
          · Bal{' '}
          <span className="font-mono font-semibold text-[var(--text)]">{money(debitBalance)}</span>
        </p>

        {channel === 'wallet' ? (
          <div className="space-y-1.5">
            <input
              className={`${fieldClass} font-mono`}
              inputMode="tel"
              maxLength={14}
              value={phoneNumber}
              onChange={e => {
                const val = e.target.value.replace(/[^\d+]/g, '');
                setPhoneNumber(val);
                const digits = val.replace(/\D/g, '');
                if (digits.length < 10) {
                  nameEnquirySeq.current += 1;
                  setNameLoading(false);
                  setRecipientName('');
                  failedWalletLookupKey.current = null;
                  succeededWalletLookupKey.current = null;
                }
              }}
              placeholder="Recipient phone (e.g. 0803…)"
              aria-label="Recipient phone"
              type="tel"
            />
            <p className="text-[11px] text-[var(--muted)] px-0.5">
              We’ll confirm the Xtrapay account holder’s name before you pay.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              className={`${fieldClass} font-mono flex-1`}
              inputMode="numeric"
              maxLength={10}
              value={accountNumber}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                setAccountNumber(val);
                if (val.length !== 10) {
                  nameEnquirySeq.current += 1;
                  setNameLoading(false);
                  setRecipientName('');
                }
              }}
              placeholder="Account number"
              aria-label="Account number"
              type="text"
            />
            <button
              type="button"
              aria-label="Beneficiaries"
              onClick={() => {
                if (recentRecipients[0]) {
                  handleSelectBeneficiary(recentRecipients[0]);
                } else {
                  showToast(
                    'No recent recipients',
                    'Complete a transfer and they will show up here.',
                    'info'
                  );
                }
              }}
              className="frosted-pad !h-12 !w-12 !min-h-12 !min-w-12 !rounded-2xl text-[var(--accent)] shrink-0"
              title="Quick beneficiary"
            >
              <Icon name="contacts" size={18} />
            </button>
          </div>
        )}

        {channel === 'bank' && (
          <button
            type="button"
            onClick={() => {
              setBankQuery('');
              setBankModalOpen(true);
            }}
            className={`settings-row ${fieldClass} flex items-center justify-between gap-2 text-left appearance-none cursor-pointer`}
            aria-label="Destination bank"
          >
            <span className={`min-w-0 truncate ${selectedBank ? 'text-[var(--text)]' : 'text-[var(--muted)]'}`}>
              {selectedBank || 'Destination bank'}
            </span>
            <Icon name="expand_more" size={18} className="text-[var(--muted)] shrink-0" />
          </button>
        )}

        {nameLoading && (
          <div className="rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.04] px-3.5 py-2.5 flex items-center gap-2">
            <Icon name="sync" size={16} className="text-[var(--accent)] shrink-0 animate-spin" />
            <p className="text-[12px] text-[var(--muted)]">
              {channel === 'wallet' ? 'Confirming wallet holder…' : 'Resolving account name…'}
            </p>
          </div>
        )}

        {recipientName && !nameLoading && (
          <div className="space-y-2">
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 flex items-center gap-2">
              <Icon name="verified" size={16} className="text-emerald-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-600/80 dark:text-emerald-400/80">
                  {channel === 'wallet' ? 'Wallet holder' : 'Name enquiry'}
                </p>
                <p className="text-[13px] font-semibold text-[var(--text)] truncate">{recipientName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleSaveBeneficiary()}
              disabled={alreadySaved || savingBeneficiary}
              className="w-full h-11 rounded-2xl border border-[var(--glass-border)] text-[13px] font-semibold flex items-center justify-center gap-2 bg-black/[0.03] dark:bg-white/[0.05] text-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name={alreadySaved ? 'check' : 'person_add'} size={16} />
              {alreadySaved
                ? 'Saved beneficiary'
                : savingBeneficiary
                  ? 'Saving…'
                  : 'Save beneficiary'}
            </button>
          </div>
        )}

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg text-[var(--accent)] pointer-events-none">
            ₦
          </span>
          <input
            className={`${fieldClass} !pl-9 font-mono text-xl h-14`}
            inputMode="decimal"
            value={amountStr}
            onChange={e => setAmountStr(e.target.value)}
            placeholder="Amount"
            aria-label="Amount"
            type="text"
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[5000, 10000, 25000, 50000].map(val => {
            const isSelected = amountStr.replace(/,/g, '') === String(val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                className={`settings-chip py-2 rounded-xl text-[11px] font-mono font-semibold ${
                  isSelected
                    ? 'bg-[var(--accent)]/15 border border-[var(--accent)] text-[var(--accent)]'
                    : 'glass-chip !rounded-xl !px-1 !py-2 text-[var(--muted)] border border-transparent'
                }`}
              >
                ₦{val.toLocaleString()}
              </button>
            );
          })}
        </div>

        <input
          className={`${fieldClass} !h-11`}
          placeholder="Narration (optional)"
          aria-label="Narration"
          type="text"
          value={narration}
          onChange={e => setNarration(e.target.value)}
        />
      </section>

      <section>
        <button
          type="button"
          onClick={handleProceed}
          className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/25"
        >
          Proceed to verify
          <Icon name="arrow_forward" size={18} />
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Recent
          </p>
          <button
            type="button"
            onClick={() => setActiveScreen('history')}
            className="settings-row text-[12px] font-semibold text-[var(--accent)] appearance-none border-0 bg-transparent cursor-pointer p-0"
          >
            View all
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {recentRecipients.length === 0 ? (
            <p className="text-[12px] text-[var(--muted)] px-0.5 py-3">
              No recent transfer recipients yet. People you send to will appear here.
            </p>
          ) : (
            recentRecipients.map(ben => (
              <button
                key={ben.id}
                type="button"
                onClick={() => handleSelectBeneficiary(ben)}
                className="settings-row flex w-[4.25rem] shrink-0 flex-col items-center gap-2 cursor-pointer appearance-none border-0 bg-transparent p-0"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/50 dark:bg-white/8 text-[12px] font-bold ${ben.colorClass}`}
                >
                  {ben.initials}
                </span>
                <span className="w-full truncate text-center text-[10px] font-bold text-[var(--text)]">
                  {ben.name.split(' ')[0]}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Debit account modal */}
      {debitModalOpen && (
        <div
          className="app-modal-overlay z-[90] bg-black/70 backdrop-blur-md"
          role="presentation"
          onClick={() => setDebitModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select debit account"
            className="app-modal-panel glass-card glass-strong settings-list !rounded-[24px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                  Debit from
                </p>
                <h2 className="mt-1 text-[16px] font-semibold text-[var(--text)]">Select account</h2>
              </div>
              <button
                type="button"
                onClick={() => setDebitModalOpen(false)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="max-h-[min(60vh,26rem)] overflow-y-auto divide-y divide-[var(--glass-border)]">
              {wallets.map(w => {
                const bal = walletBalance(w);
                const active = w.id === debitWalletId;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setDebitWalletId(w.id);
                      setDebitModalOpen(false);
                    }}
                    className={`settings-row w-full flex items-start gap-3 px-5 py-4 text-left appearance-none border-0 cursor-pointer ${
                      active ? 'bg-[var(--accent)]/10' : 'bg-transparent'
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
                      <Icon
                        name={
                          w.kind === 'business' || w.kind === 'sub_business'
                            ? 'domain'
                            : w.kind.startsWith('sub')
                              ? 'call_split'
                              : 'person'
                        }
                        size={18}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-[var(--text)] truncate">{w.name}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--muted)] truncate">
                        {w.subtitle} · {w.accountNumber}
                      </p>
                      <p className="mt-1 text-[13px] font-mono font-semibold text-[var(--text)]">
                        {money(bal)}
                      </p>
                    </div>
                    {active && (
                      <Icon name="check" size={18} className="text-[var(--accent)] shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Destination bank modal */}
      {bankModalOpen && (
        <div
          className="app-modal-overlay z-[90] bg-black/70 backdrop-blur-md"
          role="presentation"
          onClick={() => setBankModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select destination bank"
            className="app-modal-panel glass-card glass-strong settings-list !rounded-[24px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                  Transfer to
                </p>
                <h2 className="mt-1 text-[16px] font-semibold text-[var(--text)]">
                  Destination bank
                </h2>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {banksLoading
                    ? 'Loading banks from backend…'
                    : `${banks.length.toLocaleString()} banks from backend`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBankModalOpen(false)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                  <Icon name="search" size={16} />
                </span>
                <input
                  value={bankQuery}
                  onChange={e => setBankQuery(e.target.value)}
                  placeholder="Search bank"
                  className={`${fieldClass} !pl-10`}
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-[min(55vh,24rem)] overflow-y-auto divide-y divide-[var(--glass-border)]">
              {filteredBanks.length === 0 ? (
                <p className="px-5 py-8 text-center text-[12px] text-[var(--muted)]">No banks found</p>
              ) : (
                filteredBanks.map(bank => {
                  const active = bank.name === selectedBank;
                  return (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => {
                        setSelectedBank(bank.name);
                        setBankModalOpen(false);
                      }}
                      className={`settings-row w-full flex items-center gap-3 px-5 py-3.5 text-left appearance-none border-0 cursor-pointer ${
                        active ? 'bg-[var(--accent)]/10' : 'bg-transparent'
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)] text-[11px] font-bold">
                        {bank.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[var(--text)] truncate">
                          {bank.name}
                        </p>
                        <p className="text-[11px] font-mono text-[var(--muted)]">Code · {bank.code}</p>
                      </div>
                      {active && (
                        <Icon name="check" size={18} className="text-[var(--accent)] shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <PinSheetModal
        isOpen={pinOpen}
        onClose={() => setPinOpen(false)}
        title="Confirm transfer"
        subtitle="Enter your 4-digit transaction PIN to proceed"
        amount={parseFloat(amountStr.replace(/,/g, '')) || undefined}
        recipient={recipientName || selectedBank}
        onSuccess={pin => confirmTransfer(pin)}
      />
    </main>
  );
};
