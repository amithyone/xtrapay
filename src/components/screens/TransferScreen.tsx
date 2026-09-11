import React, { useState, useEffect } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { INITIAL_BENEFICIARIES, SUPPORTED_BANKS } from '../../data/initialData';
import { Icon } from '../Icon';

export const TransferScreen: React.FC = () => {
  const {
    personalBalance,
    initiateTransfer,
    setActiveScreen,
    showToast,
    setIsNearbyPayOpen,
    setIsPayAtShopOpen,
    setIsScanToPayOpen,
    prefilledTransferData,
    setPrefilledTransferData,
  } = useTransactions();

  const [channel, setChannel] = useState<'bank' | 'wallet'>('bank');
  const [accountNumber, setAccountNumber] = useState<string>('0123984521');
  const [selectedBank, setSelectedBank] = useState<string>('Access Bank Plc');
  const [amountStr, setAmountStr] = useState<string>('50,000');
  const [narration, setNarration] = useState<string>('Project Milestone 2 Settlement');
  const [recipientName, setRecipientName] = useState<string>('ADEKUNLE OLUMIDE');

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

  const handleSelectBeneficiary = (ben: (typeof INITIAL_BENEFICIARIES)[0]) => {
    setAccountNumber(ben.accountNumber);
    setSelectedBank(ben.bank);
    setRecipientName(ben.name.toUpperCase());
    showToast('Beneficiary Selected', `${ben.name} (${ben.bank}) loaded.`);
  };

  const handleQuickAmount = (val: number) => {
    setAmountStr(val.toLocaleString());
  };

  const handleProceed = () => {
    const numericAmount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('Invalid Amount', 'Please enter a valid transfer amount.', 'warning');
      return;
    }
    if (numericAmount > personalBalance) {
      showToast('Insufficient Funds', 'Transfer amount exceeds your current wallet balance.', 'warning');
      return;
    }

    initiateTransfer({
      amount: numericAmount,
      recipientName: recipientName || 'BENEFICIARY RECIPIENT',
      bankName: selectedBank,
      accountNumber,
      narration,
    });
  };

  const fieldClass =
    'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5" id="transfer-screen">
      {/* Channel + shortcuts */}
      <section className="space-y-3">
        <div className="glass-card glass-strong flex p-1 !rounded-[18px]">
          <button
            type="button"
            onClick={() => setChannel('bank')}
            className={`flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-2 transition-all ${
              channel === 'bank'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--muted)]'
            }`}
          >
            <Icon name="account_balance" size={16} />
            Bank
          </button>
          <button
            type="button"
            onClick={() => setChannel('wallet')}
            className={`flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-2 transition-all ${
              channel === 'wallet'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--muted)]'
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
            className="text-[12px] font-semibold text-[var(--accent)] flex items-center gap-1"
          >
            Request for money
            <Icon name="arrow_forward" size={14} />
          </button>
        </div>
      </section>

      {/* Form */}
      <section className="glass-card glass-strong !rounded-[24px] px-5 py-5 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            Account number
          </label>
          <div className="flex items-center gap-2">
            <input
              className={`${fieldClass} font-mono flex-1`}
              inputMode="numeric"
              maxLength={10}
              value={accountNumber}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                setAccountNumber(val);
                if (val.length === 10) {
                  setRecipientName('ADEKUNLE OLUMIDE');
                }
              }}
              placeholder="0000000000"
              type="text"
            />
            <button
              type="button"
              aria-label="Beneficiaries"
              onClick={() => handleSelectBeneficiary(INITIAL_BENEFICIARIES[0])}
              className="frosted-pad !h-12 !w-12 !min-h-12 !min-w-12 !rounded-2xl text-[var(--accent)] shrink-0"
              title="Quick beneficiary"
            >
              <Icon name="contacts" size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            Destination bank
          </label>
          <div className="relative">
            <select
              value={selectedBank}
              onChange={e => setSelectedBank(e.target.value)}
              className={`${fieldClass} appearance-none pr-10 cursor-pointer`}
            >
              {SUPPORTED_BANKS.map(bank => (
                <option key={bank.id} value={bank.name}>
                  {bank.name}
                </option>
              ))}
            </select>
            <Icon
              name="expand_more"
              size={18}
              className="text-[var(--muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Amount
            </label>
            <span className="text-[11px] text-[var(--muted)]">
              Bal{' '}
              <span className="font-mono font-semibold text-[var(--text)]">
                ₦
                {personalBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg text-[var(--accent)]">
              ₦
            </span>
            <input
              className={`${fieldClass} !pl-9 font-mono text-xl h-14`}
              inputMode="decimal"
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
              placeholder="0.00"
              type="text"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[5000, 10000, 25000, 50000].map(val => {
              const isSelected = amountStr.replace(/,/g, '') === String(val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className={`py-2 rounded-xl text-[11px] font-mono font-semibold transition-all ${
                    isSelected
                      ? 'bg-[var(--accent)]/15 border border-[var(--accent)] text-[var(--accent)]'
                      : 'glass-chip !rounded-xl !px-1 !py-2 text-[var(--muted)]'
                  }`}
                >
                  ₦{val.toLocaleString()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            Narration
          </label>
          <input
            className={`${fieldClass} !h-11`}
            placeholder="What's this for? (optional)"
            type="text"
            value={narration}
            onChange={e => setNarration(e.target.value)}
          />
        </div>
      </section>

      {/* CTA — before recent */}
      <section>
        <button
          type="button"
          onClick={handleProceed}
          className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform"
        >
          Proceed to verify
          <Icon name="arrow_forward" size={18} />
        </button>
      </section>

      {/* Recent people */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Recent
          </p>
          <button
            type="button"
            onClick={() => setActiveScreen('history')}
            className="text-[12px] font-semibold text-[var(--accent)]"
          >
            View all
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {INITIAL_BENEFICIARIES.map(ben => (
            <button
              key={ben.id}
              type="button"
              onClick={() => handleSelectBeneficiary(ben)}
              className="flex w-[4.25rem] shrink-0 flex-col items-center gap-2 cursor-pointer"
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
          ))}
        </div>
      </section>
    </main>
  );
};
