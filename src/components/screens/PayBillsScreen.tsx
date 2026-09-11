import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { BILLER_CATEGORIES, FREQUENT_BILLERS } from '../../data/initialData';
import { Icon } from '../Icon';

export const PayBillsScreen: React.FC = () => {
  const { personalBalance, payBill, setActiveScreen, showToast } = useTransactions();

  const [selectedCategory, setSelectedCategory] = useState<string>('electricity');
  const [selectedProvider, setSelectedProvider] = useState<string>(
    'IKEDC (Ikeja Electric) - Prepaid'
  );
  const [meterNumber, setMeterNumber] = useState<string>('0428 7199 402');
  const [amountStr, setAmountStr] = useState<string>('15,000');
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [billerName, setBillerName] = useState<string>('Ikeja Electric');
  const [generatedTokenModal, setGeneratedTokenModal] = useState<{
    token: string;
    amount: number;
  } | null>(null);

  const fieldClass =
    'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

  const handleSelectFrequentBiller = (biller: (typeof FREQUENT_BILLERS)[0]) => {
    setSelectedCategory(biller.category);
    setSelectedProvider(biller.provider);
    setMeterNumber(biller.accountNumber);
    setBillerName(biller.name);
    showToast('Biller Loaded', `${biller.name} details populated.`);
  };

  const handlePay = () => {
    const numericAmount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('Invalid Amount', 'Please specify a valid recharge amount.', 'warning');
      return;
    }
    if (numericAmount > personalBalance) {
      showToast('Insufficient Balance', 'Wallet balance is insufficient.', 'warning');
      return;
    }

    const token = payBill({
      billerName,
      provider: selectedProvider,
      accountOrMeter: meterNumber,
      amount: numericAmount,
      category: selectedCategory,
      autoRenew,
    });

    setGeneratedTokenModal({ token, amount: numericAmount });
  };

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5" id="paybills-screen">
      {/* Header */}
      <section className="flex items-center justify-between px-0.5">
        <div>
          <p className="text-[12px] text-[var(--muted)]">Instant token settlement</p>
        </div>
        <span className="glass-chip !rounded-full !px-2.5 !py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Icon name="bolt" size={13} />
          Zero surcharge
        </span>
      </section>

      {/* Search */}
      <div className="relative">
        <Icon
          name="search"
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
        />
        <input
          className={`${fieldClass} !pl-10`}
          placeholder="Search provider, biller or meter"
          type="text"
        />
      </div>

      {/* Categories */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Categories
          </p>
          <button
            type="button"
            onClick={() =>
              showToast('Categories', 'All 36 institutional Disco & Telco rails active.', 'info')
            }
            className="text-[12px] font-semibold text-[var(--accent)]"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {BILLER_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`glass-card glass-strong !rounded-[18px] min-h-[96px] p-3 text-left flex flex-col justify-between transition-all active:scale-[0.98] ${
                  isSelected ? 'ring-2 ring-[var(--accent)]/40' : ''
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isSelected
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                      : 'bg-black/[0.04] dark:bg-white/8 text-[var(--muted)]'
                  }`}
                >
                  <Icon name={cat.icon} size={17} />
                </span>
                <span>
                  <span className="block text-[12px] font-bold text-[var(--text)] leading-tight">
                    {cat.name}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[var(--muted)] leading-tight">
                    {cat.subtitle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Frequent */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Frequent
          </p>
          <button
            type="button"
            onClick={() =>
              showToast('Manage Billers', 'Editing 4 saved automated billers.', 'info')
            }
            className="text-[12px] font-semibold text-[var(--accent)] flex items-center gap-0.5"
          >
            Manage
            <Icon name="chevron_right" size={14} />
          </button>
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {FREQUENT_BILLERS.map(biller => {
            const isSelected = billerName === biller.name;
            return (
              <button
                key={biller.id}
                type="button"
                onClick={() => handleSelectFrequentBiller(biller)}
                className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10'
                    : 'border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05]'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    isSelected
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                      : 'bg-white/50 dark:bg-white/8 text-[var(--muted)]'
                  }`}
                >
                  <Icon name={biller.icon} size={15} />
                </span>
                <span className="text-left">
                  <span className="block text-[12px] font-bold text-[var(--text)]">
                    {biller.name}
                  </span>
                  <span className="block text-[10px] text-[var(--muted)]">{biller.subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Form */}
      <section className="glass-card glass-strong !rounded-[24px] px-5 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-[var(--text)]">Payment details</p>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Active
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            Provider
          </label>
          <div className="relative">
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value)}
              className={`${fieldClass} appearance-none pr-10 cursor-pointer`}
            >
              <option value="IKEDC (Ikeja Electric) - Prepaid">
                IKEDC (Ikeja Electric) - Prepaid
              </option>
              <option value="EKEDC (Eko Electric) - Prepaid">EKEDC (Eko Electric) - Prepaid</option>
              <option value="AEDC (Abuja Electricity) - Prepaid">
                AEDC (Abuja Electricity) - Prepaid
              </option>
              <option value="IBEDC (Ibadan Electricity) - Prepaid">
                IBEDC (Ibadan Electricity) - Prepaid
              </option>
              <option value="MultiChoice DStv Subscription">MultiChoice DStv Subscription</option>
              <option value="Spectranet 4G LTE Fiber">Spectranet 4G LTE Fiber</option>
            </select>
            <Icon
              name="expand_more"
              size={18}
              className="text-[var(--muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Meter / account
            </label>
            <button
              type="button"
              onClick={() => handleSelectFrequentBiller(FREQUENT_BILLERS[0])}
              className="text-[12px] font-semibold text-[var(--accent)] flex items-center gap-1"
            >
              <Icon name="contact_page" size={13} />
              Saved
            </button>
          </div>
          <input
            className={`${fieldClass} font-mono`}
            type="text"
            value={meterNumber}
            onChange={e => setMeterNumber(e.target.value)}
            placeholder="Meter or account number"
          />
        </div>

        <div className="space-y-1.5">
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
              type="text"
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[2000, 5000, 10000, 15000].map(val => {
              const isSelected = amountStr.replace(/,/g, '') === String(val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountStr(val.toLocaleString())}
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

        <div className="flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] px-3.5 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
            <Icon name="account_balance_wallet" size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Pay from</p>
            <p className="text-[13px] font-semibold text-[var(--text)]">Personal wallet</p>
          </div>
          <Icon name="swap_horiz" size={16} className="text-[var(--muted)]" />
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon name="autorenew" size={16} className="text-[var(--muted)] shrink-0" />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[var(--text)]">Auto-renew</p>
              <p className="text-[10px] text-[var(--muted)]">Remind 48h before units run out</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={e => setAutoRenew(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-black/10 dark:bg-white/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]" />
          </label>
        </div>
      </section>

      {/* CTA */}
      <button
        type="button"
        onClick={handlePay}
        className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform"
      >
        <Icon name="lock" size={17} />
        Pay ₦{amountStr}
      </button>

      {/* Token modal */}
      {generatedTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-card glass-strong !rounded-[24px] p-6 w-full max-w-sm text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-500 mx-auto flex items-center justify-center">
              <Icon name="electric_bolt" size={26} />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[var(--text)]">Token generated</h2>
              <p className="text-[12px] text-[var(--muted)] mt-1">
                Paid ₦{generatedTokenModal.amount.toLocaleString()} for {billerName}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--glass-border)] bg-black/[0.04] dark:bg-white/[0.06] px-4 py-3.5">
              <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.18em] block mb-1.5">
                Prepaid token
              </span>
              <div className="font-mono text-[17px] font-bold text-[var(--accent)] tracking-wider select-all">
                {generatedTokenModal.token}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(generatedTokenModal.token);
                  }
                  showToast('Copied', 'Token copied to clipboard.');
                }}
                className="h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--text)] text-[12px] font-semibold flex items-center justify-center gap-1.5"
              >
                <Icon name="content_copy" size={15} />
                Copy
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeneratedTokenModal(null);
                  setActiveScreen('history');
                }}
                className="h-11 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold"
              >
                View history
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
