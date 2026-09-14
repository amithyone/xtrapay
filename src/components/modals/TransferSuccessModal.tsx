import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';
import {
  downloadTransferReceiptImage,
  downloadTransferReceiptPdf,
  shareTransferReceiptImage,
} from '../../lib/transferReceipt';

export const TransferSuccessModal: React.FC = () => {
  const {
    activeTransfer,
    dismissActiveTransfer,
    repeatTransfer,
    showToast,
    theme,
  } = useTransactions();
  const [busy, setBusy] = useState<'image' | 'pdf' | 'share' | null>(null);

  if (!activeTransfer) return null;

  const receiptTheme = theme === 'light' ? 'light' : 'dark';

  const copyRef = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(activeTransfer.reference);
    }
    showToast('Reference Copied', `${activeTransfer.reference} copied.`);
  };

  const handleShareImage = async () => {
    if (busy) return;
    setBusy('share');
    try {
      const result = await shareTransferReceiptImage(activeTransfer, receiptTheme);
      showToast(
        result === 'shared' ? 'Receipt shared' : 'Receipt image saved',
        result === 'shared'
          ? 'Styled transfer receipt shared.'
          : 'PNG receipt downloaded — styled like this success screen.',
        'success'
      );
    } catch {
      showToast('Share failed', 'Could not create the receipt image.', 'warning');
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadImage = async () => {
    if (busy) return;
    setBusy('image');
    try {
      await downloadTransferReceiptImage(activeTransfer, receiptTheme);
      showToast('Image receipt', 'PNG downloaded with the success-screen style.', 'success');
    } catch {
      showToast('Download failed', 'Could not save the receipt image.', 'warning');
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (busy) return;
    setBusy('pdf');
    try {
      await downloadTransferReceiptPdf(activeTransfer, receiptTheme);
      showToast('PDF receipt', 'PDF downloaded with the success-screen style.', 'success');
    } catch {
      showToast('Download failed', 'Could not save the receipt PDF.', 'warning');
    } finally {
      setBusy(null);
    }
  };

  const isStep1Done = activeTransfer.step >= 1;
  const isStep2Done = activeTransfer.step >= 2;
  const isStep3Done = activeTransfer.step >= 3;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-[var(--bg-0)]/92 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md min-h-screen flex flex-col relative border-x border-[var(--glass-border)] pb-28 bg-[var(--bg-0)]">
        <header className="sticky top-0 z-40 border-b border-[var(--glass-border)] bg-[var(--glass-nav-fill)] backdrop-blur-[18px]">
          <div className="flex justify-between items-center w-full px-4 h-14 max-w-md mx-auto">
            <button
              aria-label="Close transfer modal"
              onClick={dismissActiveTransfer}
              className="frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg text-[var(--muted)]"
              type="button"
            >
              <Icon name="close" size={18} />
            </button>

            <div className="flex items-center gap-1.5">
              <Icon name="account_balance" size={18} className="text-[var(--accent)]" />
              <span className="text-base font-semibold tracking-tight text-[var(--text)]">
                Xtrapay
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[10px] font-semibold">
                <Icon name="verified_user" size={12} />
                E2EE
              </span>
              <button
                aria-label="Support Agent"
                onClick={() =>
                  showToast('Support Agent', 'Live transaction dispute window active.', 'info')
                }
                className="frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg text-[var(--muted)]"
                type="button"
              >
                <Icon name="support_agent" size={16} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col px-5 pt-5 pb-6 space-y-5">
          <section className="flex flex-col items-center text-center pt-1">
            <div className="relative mb-5">
              <div
                className={`w-16 h-16 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  isStep3Done
                    ? 'bg-emerald-500/15 border-emerald-500/35 success-pulse'
                    : 'bg-[var(--accent)]/15 border-[var(--accent)]/35'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                    isStep3Done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[var(--accent)] text-white animate-pulse'
                  }`}
                >
                  <Icon name={isStep3Done ? 'check' : 'sync'} size={22} />
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="font-mono text-3xl tracking-tight text-[var(--text)] font-semibold">
                ₦{Math.floor(activeTransfer.amount).toLocaleString()}
              </span>
              <span className="font-mono text-sm text-[var(--muted)]">
                .{(activeTransfer.amount % 1).toFixed(2).slice(2)}
              </span>
            </div>

            <h1 className="text-xl font-semibold text-[var(--text)] mt-1">
              {isStep3Done ? 'Transfer sent' : 'Processing Transfer'}
            </h1>
            <p className="text-xs text-[var(--muted)] mt-1 max-w-[280px]">
              sent to{' '}
              <span className="text-[var(--text)] font-medium">{activeTransfer.recipientName}</span>
            </p>

            <button
              type="button"
              onClick={copyRef}
              className="mt-3 glass-chip !rounded-full !px-3 !py-1.5 inline-flex items-center gap-2 cursor-pointer"
              title="Click to copy ref code"
            >
              <span className="text-[10px] text-[var(--muted)] uppercase font-semibold">REF:</span>
              <span className="font-mono text-xs text-[var(--accent)] tracking-wider font-semibold">
                {activeTransfer.reference}
              </span>
              <Icon name="content_copy" size={14} className="text-[var(--muted)]" />
            </button>
          </section>

          <section className="glass-card glass-strong !rounded-[22px] p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--glass-border)]">
              <h2 className="text-xs font-medium text-[var(--muted)]">
                Here is how your transfer progressed.
              </h2>
              <span
                className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  isStep3Done
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                    : 'bg-sky-500/10 text-sky-500 border-sky-500/25'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isStep3Done ? 'bg-emerald-500' : 'bg-sky-500 animate-ping'
                  }`}
                />
                {isStep3Done ? 'SETTLED' : 'PROCESSING'}
              </span>
            </div>

            <div className="space-y-0 relative">
              <div
                className={`absolute left-3.5 top-3.5 bottom-3.5 w-0.5 transition-colors duration-500 ${
                  isStep3Done ? 'bg-emerald-500/40' : 'bg-[var(--glass-border)]'
                }`}
              />

              <div className="relative flex items-start gap-3.5 pb-4">
                <div
                  className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 z-10 bg-[var(--bg-0)] ${
                    isStep1Done
                      ? 'border-emerald-500 text-emerald-500'
                      : 'border-[var(--glass-border)] text-[var(--muted)]'
                  }`}
                >
                  <Icon name="check" size={14} />
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[var(--text)]">Transfer initiated</p>
                    <time className="font-mono text-[11px] text-[var(--muted)]">
                      {activeTransfer.initTime}
                    </time>
                  </div>
                  <p className="text-[11px] text-[var(--muted)]">
                    {activeTransfer.channel === 'wallet'
                      ? `Debit of ₦${activeTransfer.amount.toLocaleString()}.00 confirmed from your Xtrapay wallet`
                      : `Debit of ₦${activeTransfer.amount.toLocaleString()}.00 confirmed from Xtrapay Vault`}
                  </p>
                </div>
              </div>

              <div className="relative flex items-start gap-3.5 pb-4">
                <div
                  className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 z-10 bg-[var(--bg-0)] transition-colors ${
                    isStep2Done
                      ? 'border-emerald-500 text-emerald-500'
                      : 'border-[var(--accent)] text-[var(--accent)] animate-pulse'
                  }`}
                >
                  <Icon name={isStep2Done ? 'check' : 'sync'} size={14} />
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[var(--text)]">Transfer processed</p>
                    <time className="font-mono text-[11px] text-[var(--muted)]">
                      {activeTransfer.processedTime || 'In progress...'}
                    </time>
                  </div>
                  <p className="text-[11px] text-[var(--muted)]">
                    {activeTransfer.channel === 'wallet'
                      ? 'Cleared instantly on Xtrapay ledger (no NIP)'
                      : 'Cleared via NIBSS Instant Payment (NIP) switch'}
                  </p>
                </div>
              </div>

              <div className="relative flex items-start gap-3.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm transition-all duration-300 ${
                    isStep3Done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[var(--bg-1)] border border-[var(--glass-border)] text-[var(--muted)]'
                  }`}
                >
                  <Icon name={isStep3Done ? 'check' : 'hourglass_top'} size={14} />
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[var(--text)]">Received by recipient</p>
                    <time className="font-mono text-[11px] text-emerald-500 font-medium">
                      {activeTransfer.settledTime || 'Pending...'}
                    </time>
                  </div>
                  <p className="text-[11px] text-[var(--muted)]">
                    Credited to{' '}
                    <span className="text-[var(--text)] font-medium">
                      {activeTransfer.recipientName}
                    </span>{' '}
                    •{' '}
                    {activeTransfer.channel === 'wallet'
                      ? 'Xtrapay Wallet'
                      : activeTransfer.bankName}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2.5 pt-1">
            <button
              onClick={dismissActiveTransfer}
              className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold flex items-center justify-center shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform"
              type="button"
            >
              Done
            </button>

            {isStep3Done && (
              <>
                <button
                  onClick={() => void handleShareImage()}
                  disabled={busy !== null}
                  className="w-full h-11 rounded-2xl glass-card glass-strong !rounded-2xl text-[var(--text)] text-xs font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
                  type="button"
                >
                  <Icon name="share" size={16} className="text-[var(--accent)]" />
                  {busy === 'share' ? 'Preparing…' : 'Share receipt image'}
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => void handleDownloadPdf()}
                    disabled={busy !== null}
                    className="h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--muted)] text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-60"
                    type="button"
                  >
                    <Icon name="download" size={16} />
                    {busy === 'pdf' ? 'Saving…' : 'Save PDF'}
                  </button>
                  <button
                    onClick={() => void handleDownloadImage()}
                    disabled={busy !== null}
                    className="h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--muted)] text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-60"
                    type="button"
                  >
                    <Icon name="image" size={16} />
                    {busy === 'image' ? 'Saving…' : 'Save image'}
                  </button>
                </div>
              </>
            )}

            <button
              onClick={repeatTransfer}
              className="w-full h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--muted)] text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.98]"
              type="button"
            >
              <Icon name="replay" size={16} />
              Resend
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
