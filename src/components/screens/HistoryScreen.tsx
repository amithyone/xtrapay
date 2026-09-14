import React, { useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Transaction } from '../../types';
import { ApiError } from '../../lib/api';
import { apiTransaction } from '../../lib/xtrapayApi';
import { Icon } from '../Icon';
import {
  downloadTransferReceiptImage,
  downloadTransferReceiptPdf,
  shareTransferReceiptImage,
} from '../../lib/transferReceipt';

function moneyParts(n: number) {
  const [whole, frac = '00'] = Math.abs(n)
    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .split('.');
  return { whole, frac };
}

function isTodayLabel(date: string) {
  return /\btoday\b/i.test(date);
}

function isYesterdayLabel(date: string) {
  return /\byesterday\b/i.test(date);
}

function todayTxIconName(tx: Transaction): string {
  if (tx.category === 'bill') return 'bolt';
  if (tx.type === 'credit') return 'arrow_downward';
  if (tx.category === 'card') return 'tv';
  if (tx.category === 'savings') return 'savings';
  return 'arrow_upward';
}

function todayTxIconTint(tx: Transaction): string {
  if (tx.type === 'credit') return 'text-emerald-600 dark:text-emerald-400';
  if (tx.category === 'bill') return 'text-cyan-600 dark:text-cyan-400';
  return 'text-rose-500';
}

function yesterdayTxIconName(tx: Transaction): string {
  if (tx.category === 'card') return 'tv';
  if (tx.category === 'savings') return 'savings';
  return 'cell_tower';
}

function yesterdayTxIconTint(tx: Transaction): string {
  if (tx.category === 'card') return 'text-rose-500';
  if (tx.category === 'savings') return 'text-emerald-600 dark:text-emerald-400';
  return 'text-cyan-600 dark:text-cyan-400';
}

export const HistoryScreen: React.FC = () => {
  const { transactions, showToast, theme } = useTransactions();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [receiptBusy, setReceiptBusy] = useState<'image' | 'pdf' | 'share' | null>(null);

  const openReceipt = async (tx: Transaction) => {
    setSelectedTx(tx);
    if (tx.sessionId) return;
    try {
      const detail = await apiTransaction(tx.id);
      setSelectedTx(prev =>
        prev?.id === tx.id
          ? {
              ...prev,
              ...detail,
              sessionId: detail.sessionId || prev.sessionId,
            }
          : prev
      );
    } catch {
      // List row is enough when detail/session is unavailable
    }
  };

  const filteredTxs = transactions.filter(tx => {
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.token && tx.token.includes(searchQuery));

    if (!matchesSearch) return false;

    if (activeFilter === 'All') return true;
    if (activeFilter === 'Transfers') return tx.category === 'transfer';
    if (activeFilter === 'Bill Pay') return tx.category === 'bill';
    if (activeFilter === 'Card Spend') return tx.category === 'card';
    if (activeFilter === 'Savings') return tx.category === 'savings';
    if (activeFilter === 'Money In') return tx.type === 'credit';
    return true;
  });

  const todayTxs = filteredTxs.filter(tx => isTodayLabel(tx.date));
  const yesterdayTxs = filteredTxs.filter(tx => isYesterdayLabel(tx.date));
  const otherTxs = filteredTxs.filter(
    tx => !isTodayLabel(tx.date) && !isYesterdayLabel(tx.date)
  );

  const cashflow = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const inMonth = transactions.filter(tx => {
      const raw = (tx as Transaction & { occurredAt?: string }).occurredAt;
      if (raw) {
        const d = new Date(raw);
        return !Number.isNaN(d.getTime()) && d >= monthStart;
      }
      // Fallback: include all loaded txs when occurredAt is missing
      return true;
    });

    const outflow = inMonth
      .filter(tx => tx.type === 'debit')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const inflow = inMonth
      .filter(tx => tx.type === 'credit')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const debitCount = inMonth.filter(tx => tx.type === 'debit').length;
    const netPct = outflow === 0 ? (inflow > 0 ? 100 : 0) : ((inflow - outflow) / outflow) * 100;
    const monthLabel = new Date().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return { outflow, inflow, debitCount, netPct, monthLabel };
  }, [transactions]);

  const outflowParts = moneyParts(cashflow.outflow);
  const inflowParts = moneyParts(cashflow.inflow);

  const copyToken = (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(token);
    }
    showToast('Token Copied', `${token} copied to clipboard.`);
  };

  const copyRef = (ref: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ref);
    }
    showToast('Reference Copied', `${ref} copied.`);
  };

  const searchInputClass =
    'w-full h-11 pl-10 pr-11 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] placeholder:text-[var(--muted)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all';

  const renderTodayRow = (tx: Transaction) => (
    <div
      key={tx.id}
      onClick={() => void openReceipt(tx)}
      className="p-3.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className={`frosted-pad !rounded-[16px] shrink-0 ${todayTxIconTint(tx)}`}>
            <Icon name={todayTxIconName(tx)} size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-[var(--text)] truncate">{tx.title}</h2>
            <p className="text-[11px] text-[var(--muted)]">{tx.subtitle}</p>
            {tx.token && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 glass-chip !rounded-full !px-2.5 !py-0.5">
                <span className="text-[10px] text-[var(--muted)]">Token:</span>
                <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 tracking-wider select-all">
                  {tx.token}
                </span>
                <button
                  type="button"
                  onClick={e => copyToken(tx.token!, e)}
                  className="ml-0.5 text-[var(--muted)] hover:text-[var(--text)]"
                  title="Copy Token"
                >
                  <Icon name="content_copy" size={12} />
                </button>
              </div>
            )}
            {!tx.token && (
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[var(--muted)]">
                <span>Ref: {tx.reference}</span>
                <button
                  type="button"
                  onClick={e => copyRef(tx.reference, e)}
                  className="text-[var(--muted)] hover:text-[var(--text)]"
                >
                  <Icon name="content_copy" size={11} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className={`font-mono text-xs font-semibold ${
              tx.type === 'credit'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-[var(--text)]'
            }`}
          >
            {tx.type === 'credit' ? '+' : '-'}₦
            {tx.amount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border mt-1 ${
              tx.status === 'Processing'
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}
          >
            {tx.status}
          </span>
        </div>
      </div>
    </div>
  );

  const renderYesterdayRow = (tx: Transaction) => (
    <div
      key={tx.id}
      onClick={() => void openReceipt(tx)}
      className="p-3.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className={`frosted-pad !rounded-[16px] shrink-0 ${yesterdayTxIconTint(tx)}`}>
            <Icon name={yesterdayTxIconName(tx)} size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-[var(--text)] truncate">{tx.title}</h2>
            <p className="text-[11px] text-[var(--muted)]">{tx.subtitle}</p>
            {tx.cardLast4 && (
              <span className="text-[10px] text-[var(--muted)] mt-1 block">
                Card •••• {tx.cardLast4} ({tx.cardUsdAmount})
              </span>
            )}
            {tx.note && !tx.cardLast4 && (
              <span className="text-[10px] text-[var(--muted)] mt-1 block">{tx.note}</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-xs font-semibold text-[var(--text)]">
            -₦
            {tx.amount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border mt-1 ${
              tx.status === 'Automated'
                ? 'glass-chip !rounded-full text-[var(--muted)]'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}
          >
            {tx.status}
          </span>
        </div>
      </div>
    </div>
  );

  const renderOtherRow = (tx: Transaction) => (
    <div
      key={tx.id}
      onClick={() => void openReceipt(tx)}
      className="p-3.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-[var(--text)] truncate">{tx.title}</h3>
          <p className="text-[11px] text-[var(--muted)]">{tx.subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-xs font-semibold text-[var(--text)]">
            ₦{tx.amount.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{tx.status}</span>
        </div>
      </div>
    </div>
  );

  const renderGroup = (
    label: string,
    count: number,
    txs: Transaction[],
    renderRow: (tx: Transaction) => React.ReactNode
  ) => {
    if (txs.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] uppercase font-semibold tracking-[0.22em] text-[var(--muted)]">
            {label}
          </span>
          <span className="text-[10px] text-[var(--muted)]">{count} items</span>
        </div>
        <div className="glass-card glass-strong !rounded-[24px] overflow-hidden divide-y divide-[var(--glass-border)]">
          {txs.map(renderRow)}
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5" id="history-screen">
      <section className="glass-card glass-strong !rounded-[24px] px-5 py-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.22em] font-medium text-[var(--muted)]">
              {cashflow.monthLabel} cashflow
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              showToast('Statement Download', `${cashflow.monthLabel} statement downloaded.`, 'success')
            }
            className="text-[12px] font-semibold text-[var(--accent)] flex items-center gap-0.5 active:scale-[0.98] transition-transform"
          >
            Statement
            <Icon name="chevron_right" size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="glass-chip !rounded-[18px] p-3 border border-[var(--glass-border)]">
            <div className="flex items-center gap-1.5 text-[var(--muted)] text-xs">
              <Icon name="north_east" size={15} className="text-rose-500" />
              <span>Total outflow</span>
            </div>
            <div className="mt-1 font-mono text-sm text-[var(--text)] font-semibold tracking-tight">
              ₦{outflowParts.whole}
              <span className="text-[var(--muted)] text-xs">.{outflowParts.frac}</span>
            </div>
            <span className="mt-1.5 inline-block text-[10px] text-[var(--muted)] glass-chip !rounded-full !px-2 !py-0.5">
              {cashflow.debitCount} txn{cashflow.debitCount === 1 ? '' : 's'}
            </span>
          </div>
          <div className="glass-chip !rounded-[18px] p-3 border border-[var(--glass-border)]">
            <div className="flex items-center gap-1.5 text-[var(--muted)] text-xs">
              <Icon name="south_west" size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>Total inflow</span>
            </div>
            <div className="mt-1 font-mono text-sm text-emerald-600 dark:text-emerald-400 font-semibold tracking-tight">
              ₦{inflowParts.whole}
              <span className="opacity-70 text-xs">.{inflowParts.frac}</span>
            </div>
            <span className="mt-1.5 inline-block text-[10px] text-emerald-600 dark:text-emerald-400 glass-chip !rounded-full !px-2 !py-0.5">
              {cashflow.netPct >= 0 ? '+' : ''}
              {cashflow.netPct.toFixed(1)}% net
            </span>
          </div>
        </div>
      </section>

      <div className="relative">
        <Icon
          name="search"
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
        />
        <input
          className={searchInputClass}
          placeholder="Search by beneficiary, bank or reference..."
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button
          type="button"
          onClick={() => showToast('Scan', 'Scanning QR code for transaction reference...', 'info')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          title="Scan QR Code or Ref"
        >
          <Icon name="qr_code_scanner" size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs">
        {['All', 'Transfers', 'Bill Pay', 'Card Spend', 'Savings', 'Money In'].map(cat => {
          const isActive = activeFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(cat)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full transition-all active:scale-[0.98] flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[var(--accent)] text-white font-semibold shadow-md shadow-[var(--accent)]/20'
                  : 'glass-chip text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      <section className="space-y-4">
        {renderGroup('Today — 11 Sep 2026', todayTxs.length, todayTxs, renderTodayRow)}
        {renderGroup('Yesterday — 10 Sep 2026', yesterdayTxs.length, yesterdayTxs, renderYesterdayRow)}
        {renderGroup('Earlier', otherTxs.length, otherTxs, renderOtherRow)}
      </section>

      <section className="pt-1 pb-4 flex items-center justify-center gap-2 text-[var(--muted)] text-[10px] font-semibold uppercase tracking-[0.18em]">
        <Icon name="lock" size={14} />
        <span>End-to-end 256-bit encrypted transaction ledger</span>
      </section>

      {selectedTx && (
        <div className="app-modal-overlay z-[70] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[28px] !max-w-sm p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
              <div className="flex items-center gap-2">
                <Icon name="receipt" size={18} className="text-[var(--accent)]" />
                <h3 className="text-sm font-semibold text-[var(--text)]">Transaction receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="text-center py-2">
              <div className="font-mono text-2xl font-bold text-[var(--text)]">
                {selectedTx.type === 'credit' ? '+' : '-'}₦{selectedTx.amount.toLocaleString()}
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">{selectedTx.title}</p>
              <span className="inline-block mt-1.5 px-2.5 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {selectedTx.status}
              </span>
            </div>

            <div className="space-y-2 glass-chip !rounded-[18px] p-3.5 border border-[var(--glass-border)] text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-[var(--muted)]">Reference</span>
                <span className="font-mono font-medium text-[var(--accent)]">{selectedTx.reference}</span>
              </div>
              {selectedTx.sessionId && (
                <div className="flex justify-between gap-2 items-start">
                  <span className="text-[var(--muted)] shrink-0">Session ID</span>
                  <button
                    type="button"
                    className="font-mono font-medium text-[var(--text)] text-right break-all appearance-none border-0 bg-transparent p-0 cursor-pointer"
                    onClick={() => {
                      if (navigator.clipboard && selectedTx.sessionId) {
                        void navigator.clipboard.writeText(selectedTx.sessionId);
                        showToast('Session ID copied', selectedTx.sessionId, 'success');
                      }
                    }}
                    title="Tap to copy"
                  >
                    {selectedTx.sessionId}
                  </button>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-[var(--muted)]">Date &amp; time</span>
                <span className="text-[var(--text)] text-right">
                  {selectedTx.date} • {selectedTx.fullTime || selectedTx.timestamp}
                </span>
              </div>
              {selectedTx.token && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[var(--muted)]">Token</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                    {selectedTx.token}
                  </span>
                </div>
              )}
              {selectedTx.note && (
                <div className="flex justify-between gap-2">
                  <span className="text-[var(--muted)]">Narration</span>
                  <span className="text-[var(--text)] text-right">{selectedTx.note}</span>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={receiptBusy !== null}
                  onClick={async () => {
                    if (!selectedTx || receiptBusy) return;
                    setReceiptBusy('pdf');
                    try {
                      await downloadTransferReceiptPdf(
                        selectedTx,
                        theme === 'light' ? 'light' : 'dark'
                      );
                      showToast('PDF receipt', 'Styled PDF downloaded.', 'success');
                    } catch {
                      showToast('Download failed', 'Could not save PDF receipt.', 'warning');
                    } finally {
                      setReceiptBusy(null);
                    }
                  }}
                  className="h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--text)] text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Icon name="download" size={16} />
                  {receiptBusy === 'pdf' ? 'Saving…' : 'Save PDF'}
                </button>
                <button
                  type="button"
                  disabled={receiptBusy !== null}
                  onClick={async () => {
                    if (!selectedTx || receiptBusy) return;
                    setReceiptBusy('image');
                    try {
                      await downloadTransferReceiptImage(
                        selectedTx,
                        theme === 'light' ? 'light' : 'dark'
                      );
                      showToast('Image receipt', 'Styled PNG downloaded.', 'success');
                    } catch {
                      showToast('Download failed', 'Could not save image receipt.', 'warning');
                    } finally {
                      setReceiptBusy(null);
                    }
                  }}
                  className="h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--text)] text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Icon name="image" size={16} />
                  {receiptBusy === 'image' ? 'Saving…' : 'Save image'}
                </button>
              </div>
              <button
                type="button"
                disabled={receiptBusy !== null}
                onClick={async () => {
                  if (!selectedTx || receiptBusy) return;
                  setReceiptBusy('share');
                  try {
                    const result = await shareTransferReceiptImage(
                      selectedTx,
                      theme === 'light' ? 'light' : 'dark'
                    );
                    showToast(
                      result === 'shared' ? 'Receipt shared' : 'Receipt image saved',
                      result === 'shared'
                        ? 'Styled receipt shared.'
                        : 'PNG downloaded with success-screen style.',
                      'success'
                    );
                  } catch {
                    showToast('Share failed', 'Could not share receipt image.', 'warning');
                  } finally {
                    setReceiptBusy(null);
                  }
                }}
                className="w-full h-11 rounded-2xl glass-card glass-strong !rounded-2xl text-[var(--text)] text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Icon name="share" size={16} className="text-[var(--accent)]" />
                {receiptBusy === 'share' ? 'Preparing…' : 'Share receipt image'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-full h-11 rounded-2xl bg-[var(--accent)] text-white text-xs font-semibold shadow-lg shadow-[var(--accent)]/25"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
