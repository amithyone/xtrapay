import React from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';

export const ShareModal: React.FC = () => {
  const { isShareOpen, setIsShareOpen, accountContext, showToast } = useTransactions();

  if (!isShareOpen) return null;

  const acct =
    accountContext === 'personal'
      ? { name: 'Innocent Solomon', number: '1000003925', bank: 'RUBIES MFB' }
      : { name: 'Xtrapay Global Ventures', number: '2048991204', bank: 'PROVIDUS BANK' };

  const shareText = `Send money to my Xtrapay account:\nBank: ${acct.bank}\nAccount No: ${acct.number}\nAccount Name: ${acct.name}`;

  const copyShareText = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
    }
    showToast('Details Copied', 'Ready to paste into WhatsApp, SMS or chat.');
    setIsShareOpen(false);
  };

  return (
    <div className="app-modal-overlay z-[70] bg-black/70 backdrop-blur-md">
      <div className="app-modal-panel glass-card glass-strong !max-w-sm !rounded-[24px] p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-1.5">
            <Icon name="share" size={18} className="text-[var(--accent)]" />
            <span className="text-sm font-semibold text-[var(--text)]">Share account details</span>
          </div>
          <button
            onClick={() => setIsShareOpen(false)}
            className="frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg text-[var(--muted)]"
            type="button"
            aria-label="Close"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--glass-border)] bg-black/[0.04] dark:bg-white/[0.06] p-3.5 space-y-1.5 font-mono text-xs">
          <div className="text-[var(--muted)]">
            Account Name:{' '}
            <span className="text-[var(--text)] font-semibold">{acct.name}</span>
          </div>
          <div className="text-[var(--muted)]">
            Bank: <span className="text-[var(--text)] font-semibold">{acct.bank}</span>
          </div>
          <div className="text-[var(--muted)]">
            Account Number:{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              {acct.number}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <button
            onClick={copyShareText}
            className="p-3 rounded-2xl glass-chip !rounded-2xl flex flex-col items-center gap-1.5 active:scale-95"
            type="button"
          >
            <Icon name="chat" size={20} className="text-emerald-500" />
            <span className="text-[11px] font-semibold text-[var(--text)]">WhatsApp</span>
          </button>
          <button
            onClick={copyShareText}
            className="p-3 rounded-2xl glass-chip !rounded-2xl flex flex-col items-center gap-1.5 active:scale-95"
            type="button"
          >
            <Icon name="send" size={20} className="text-sky-500" />
            <span className="text-[11px] font-semibold text-[var(--text)]">Telegram</span>
          </button>
          <button
            onClick={copyShareText}
            className="p-3 rounded-2xl glass-chip !rounded-2xl flex flex-col items-center gap-1.5 active:scale-95"
            type="button"
          >
            <Icon name="content_copy" size={20} className="text-[var(--accent)]" />
            <span className="text-[11px] font-semibold text-[var(--text)]">Copy</span>
          </button>
        </div>

        <button
          onClick={copyShareText}
          className="w-full h-11 rounded-2xl bg-[var(--accent)] text-white text-[13px] font-semibold"
          type="button"
        >
          Copy complete text
        </button>
      </div>
    </div>
  );
};
