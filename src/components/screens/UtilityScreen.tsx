import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';

export const UtilityScreen: React.FC = () => {
  const {
    accountContext,
    setAccountContext,
    showToast,
    setActiveScreen,
    payBill,
    balance,
  } = useTransactions();

  const [period, setPeriod] = useState<'30' | '90' | '365'>('30');
  const [analyticsTab, setAnalyticsTab] = useState<'distribution' | 'velocity' | 'categories'>(
    'distribution'
  );
  const [quickPhone] = useState<string>('0803 123 4567');
  const [selectedDataPack, setSelectedDataPack] = useState<string>('2500');

  const exportStatement = () => {
    showToast(
      'Audit Statement Generated',
      `Official Xtrapay certified e-Statement (${period === '30' ? '30 Days' : period === '90' ? 'Quarterly' : 'Annual'}) exported with digital cryptographic ledger seal.`,
      'success'
    );
  };

  const handleInstantRecharge = (service: string, amount: number) => {
    try {
      const token = payBill({
        billerName: service,
        provider: service.includes('MTN')
          ? 'MTN Nigeria'
          : service.includes('Electricity')
            ? 'IKEDC'
            : 'Multichoice',
        accountOrMeter: service.includes('Electricity') ? '4509-2219-01' : quickPhone,
        amount,
        category: service.includes('Electricity') ? 'electricity' : 'airtime',
      });
      showToast(
        'Recharge Successful',
        `Processed ₦${amount.toLocaleString()} for ${service}. ${token ? `Token: ${token}` : ''}`,
        'success'
      );
    } catch {
      showToast('Transaction Failed', 'Insufficient balance or network error.', 'warning');
    }
  };

  const balanceWhole =
    accountContext === 'personal' ? Math.floor(balance) : 8420000;
  const balanceFrac =
    accountContext === 'personal'
      ? (balance % 1).toFixed(2).slice(2)
      : '00';

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5" id="utility-screen">
      <section className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="frosted-pad !h-10 !w-10 !min-h-10 !min-w-10 !rounded-full text-[var(--accent)]">
            <Icon name="monitoring" size={18} />
          </span>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-[var(--text)] tracking-tight">
              Utilities &amp; analytics
            </h1>
            <p className="text-[12px] text-[var(--muted)]">
              Bills, airtime, cash flow &amp; statements
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={exportStatement}
          className="glass-chip !rounded-2xl !px-3 !py-2 text-[11px] font-semibold text-[var(--text)] flex items-center gap-1.5 active:scale-[0.98] transition-transform shrink-0"
          title="Export Certified PDF"
        >
          <Icon name="download" size={15} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </section>

      <div className="glass-card glass-strong flex p-1 !rounded-[18px]">
        <button
          type="button"
          onClick={() => setAccountContext('personal')}
          className={`flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
            accountContext === 'personal'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'text-[var(--muted)]'
          }`}
        >
          <Icon name="person" size={15} />
          Personal
        </button>
        <button
          type="button"
          onClick={() => setAccountContext('business')}
          className={`flex-1 py-2.5 rounded-[14px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
            accountContext === 'business'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'text-[var(--muted)]'
          }`}
        >
          <Icon name="domain" size={15} />
          Business
        </button>
      </div>

      <section className="glass-card glass-strong !rounded-[24px] px-5 py-4 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Cash flow radar
            </p>
            <span className="glass-chip !rounded-full !px-2 !py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Optimal flow
            </span>
          </div>
          <div className="text-[11px] font-mono text-[var(--muted)]">
            30D{' '}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">94.2%</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                className="stroke-black/10 dark:stroke-white/10"
                strokeWidth="9"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                className="stroke-emerald-500"
                strokeWidth="9"
                strokeDasharray="251.2"
                strokeDashoffset="75"
                strokeLinecap="round"
              />
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                className="stroke-[var(--accent)]"
                strokeWidth="6"
                strokeDasharray="188.4"
                strokeDashoffset="60"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] uppercase font-bold text-[var(--muted)]">Margin</span>
              <span className="text-xs font-mono font-bold text-[var(--text)]">+5.7%</span>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Net balance
              </span>
              <button
                type="button"
                onClick={() => setActiveScreen('history')}
                className="text-[11px] font-semibold text-[var(--accent)] flex items-center gap-0.5"
              >
                Transactions
                <Icon name="chevron_right" size={13} />
              </button>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-mono text-[var(--accent)]">₦</span>
              <span className="text-2xl font-mono font-bold tracking-tight text-[var(--text)]">
                {balanceWhole.toLocaleString()}
                <span className="text-sm font-normal text-[var(--muted)]">.{balanceFrac}</span>
              </span>
            </div>
            <div className="text-[11px] text-[var(--muted)] flex items-center gap-1.5">
              <Icon name="speed" size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Burn velocity: ₦74.5k/day • 42d runway</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-[var(--glass-border)]">
          <div className="rounded-2xl border border-[var(--glass-border)] bg-emerald-500/8 px-3 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                Total inflow
              </span>
              <Icon name="arrow_downward" size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
              ₦2,369,550<span className="text-[10px] opacity-75">.00</span>
            </div>
            <div className="text-[10px] mt-0.5 text-[var(--muted)]">103 settled credits (+18.4%)</div>
          </div>
          <div className="rounded-2xl border border-[var(--glass-border)] bg-rose-500/8 px-3 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">
                Total outflow
              </span>
              <Icon name="arrow_upward" size={14} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
              ₦2,234,961<span className="text-[10px] opacity-75">.53</span>
            </div>
            <div className="text-[10px] mt-0.5 text-[var(--muted)]">76 authorized payments</div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="glass-card glass-strong flex p-1 !rounded-[14px]">
            {(['distribution', 'velocity', 'categories'] as const).map(tabKey => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setAnalyticsTab(tabKey)}
                className={`px-3 py-1.5 rounded-[10px] text-[11px] font-semibold capitalize transition-all ${
                  analyticsTab === tabKey
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--muted)]'
                }`}
              >
                {tabKey}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {(['30', '90', '365'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono transition-all ${
                  period === p
                    ? 'bg-[var(--accent)] text-white'
                    : 'glass-chip !rounded-xl !px-2.5 text-[var(--muted)]'
                }`}
              >
                {p === '30' ? '30D' : p === '90' ? '90D' : '1Y'}
              </button>
            ))}
          </div>
        </div>

        {analyticsTab === 'distribution' && (
          <div className="glass-card glass-strong !rounded-[24px] px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                Outflow channel breakdown
              </p>
              <span className="text-xs font-mono font-bold text-[var(--text)]">₦2,234,961.53</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-black/5 dark:bg-white/5">
              <div style={{ width: '67.5%' }} className="bg-[var(--accent)]" title="Bank Transfers (67.5%)" />
              <div style={{ width: '26.6%' }} className="bg-cyan-500" title="P2P Settlement (26.6%)" />
              <div style={{ width: '5.9%' }} className="bg-emerald-500" title="Cards & Utility (5.9%)" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { label: 'Transfers', pct: '67.5%', amt: '₦1.50M', dot: 'bg-[var(--accent)]' },
                { label: 'P2P direct', pct: '26.6%', amt: '₦596.1k', dot: 'bg-cyan-500' },
                { label: 'Cards/bills', pct: '5.9%', amt: '₦131.2k', dot: 'bg-emerald-500' },
              ].map(row => (
                <div key={row.label} className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                    <span className="text-[11px] font-medium text-[var(--muted)]">{row.label}</span>
                  </div>
                  <div className="font-mono font-bold text-xs text-[var(--text)]">{row.pct}</div>
                  <div className="text-[10px] font-mono text-[var(--muted)]">{row.amt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analyticsTab === 'velocity' && (
          <div className="glass-card glass-strong !rounded-[24px] px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                7-day settlement velocity
              </p>
              <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                Avg: ₦74,498 / day
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 items-end h-20 pt-2">
              {[
                { day: 'Mon', h: 55, amt: '₦62k' },
                { day: 'Tue', h: 80, amt: '₦91k' },
                { day: 'Wed', h: 45, amt: '₦48k' },
                { day: 'Thu', h: 95, amt: '₦114k' },
                { day: 'Fri', h: 65, amt: '₦77k' },
                { day: 'Sat', h: 35, amt: '₦39k' },
                { day: 'Sun', h: 70, amt: '₦82k' },
              ].map(bar => (
                <div key={bar.day} className="flex flex-col items-center gap-1 group">
                  <div
                    className={`w-full rounded-t-md transition-all group-hover:opacity-80 ${
                      bar.day === 'Thu'
                        ? 'bg-[var(--accent)]'
                        : 'bg-black/10 dark:bg-white/10'
                    }`}
                    style={{ height: `${bar.h}%` }}
                    title={`${bar.day}: ${bar.amt}`}
                  />
                  <span
                    className={`text-[10px] font-mono ${
                      bar.day === 'Thu'
                        ? 'text-[var(--accent)] font-bold'
                        : 'text-[var(--muted)]'
                    }`}
                  >
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analyticsTab === 'categories' && (
          <div className="glass-card glass-strong !rounded-[24px] px-5 py-4 space-y-2.5">
            {[
              { label: 'Merchant Invoices & Supplies', amount: '₦940,200', pct: 42, icon: 'receipt_long' },
              { label: 'Bank Peer-to-Peer Transfers', amount: '₦682,100', pct: 30, icon: 'swap_horiz' },
              { label: 'Data, Telephony & Power', amount: '₦345,600', pct: 15, icon: 'bolt' },
              { label: 'POS Terminal & Cash Outflow', amount: '₦267,061', pct: 13, icon: 'point_of_sale' },
            ].map(cat => (
              <div key={cat.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon name={cat.icon} size={15} className="text-[var(--accent)] shrink-0" />
                    <span className="font-medium text-[var(--text)] truncate">{cat.label}</span>
                  </div>
                  <span className="font-mono font-semibold text-[var(--text)] shrink-0">{cat.amount}</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/5 dark:bg-white/5">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
              Quick utility payments
            </p>
            <span className="glass-chip !rounded-full !px-2 !py-0.5 text-[10px] font-semibold text-[var(--accent)]">
              Instant payments
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveScreen('paybills')}
            className="text-[12px] font-semibold text-[var(--accent)] flex items-center gap-1"
          >
            All billers
            <Icon name="arrow_forward" size={13} />
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="glass-card glass-strong !rounded-[20px] px-4 py-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Icon name="wifi" size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-[var(--text)]">MTN 5G Broadband / Voice</p>
                  <p className="text-[11px] font-mono text-[var(--muted)] truncate">
                    {quickPhone} • High-speed auto-renew
                  </p>
                </div>
              </div>
              <span className="glass-chip !rounded-full !px-2 !py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                Active
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { pack: '1.5 GB', price: 1000, val: '1000' },
                { pack: '4.5 GB', price: 2500, val: '2500' },
                { pack: '12 GB', price: 5000, val: '5000' },
              ].map(item => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => {
                    setSelectedDataPack(item.val);
                    handleInstantRecharge('MTN 5G Data Refill', item.price);
                  }}
                  className={`py-2 px-1.5 rounded-xl border text-center transition-all active:scale-[0.98] ${
                    selectedDataPack === item.val
                      ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-bold'
                      : 'border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] text-[var(--text)]'
                  }`}
                >
                  <div className="text-[11px] font-bold">{item.pack}</div>
                  <div className="text-[10px] font-mono opacity-85">₦{item.price.toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card glass-strong !rounded-[20px] px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
                <Icon name="bolt" size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-[var(--text)]">IKEDC Prepaid Meter</p>
                <p className="text-[11px] font-mono text-[var(--muted)]">
                  Meter #4509-2219-01 • Ikeja Electric
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleInstantRecharge('IKEDC Electricity Meter', 3000)}
              className="shrink-0 py-2 px-3 rounded-2xl text-[11px] font-bold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 active:scale-[0.98] transition-transform"
            >
              +₦3,000 vend
            </button>
          </div>

          <div className="glass-card glass-strong !rounded-[20px] px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <Icon name="tv" size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-[var(--text)]">DStv Premium &amp; Showmax</p>
                <p className="text-[11px] text-[var(--muted)]">
                  Smartcard #102948102 • Due in 5 days
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveScreen('paybills')}
              className="shrink-0 py-2 px-3 rounded-2xl glass-chip !rounded-2xl text-[11px] font-semibold text-[var(--text)] active:scale-[0.98] transition-transform"
            >
              Renew
            </button>
          </div>
        </div>
      </section>

      <section className="glass-chip !rounded-[18px] px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text)]">
          <Icon name="verified_user" size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">NIBSS &amp; NDIC insured settlement infrastructure</span>
        </div>
        <p className="text-[10px] font-mono text-[var(--muted)] mt-0.5">
          SHA-256 stamp: 0x8b32e9a...7c91 • Audited in real-time
        </p>
      </section>
    </main>
  );
};
