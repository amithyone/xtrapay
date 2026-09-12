import React from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';

export const QrModal: React.FC = () => {
  const { isQrOpen, setIsQrOpen, accountContext, showToast } = useTransactions();

  if (!isQrOpen) return null;

  const acct =
    accountContext === 'personal'
      ? { name: 'Innocent Solomon', number: '1000003925', bank: 'RUBIES MFB' }
      : { name: 'Xtrapay Global Ventures', number: '2048991204', bank: 'PROVIDUS BANK' };

  return (
    <div className="app-modal-overlay z-[70] bg-black/70 backdrop-blur-md">
      <div className="app-modal-panel glass-card glass-strong !rounded-[24px] !max-w-xs p-6 text-center shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-1.5">
            <Icon name="qr_code_2" size={18} className="text-[var(--accent)]" />
            <span className="text-xs font-semibold text-[var(--text)]">Instant NIBSS QR</span>
          </div>
          <button
            onClick={() => setIsQrOpen(false)}
            className="frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg text-[var(--muted)]"
            type="button"
            aria-label="Close"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-inner">
          <svg
            className="w-48 h-48"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="10" y="10" width="24" height="24" fill="#000" />
            <rect x="14" y="14" width="16" height="16" fill="#fff" />
            <rect x="18" y="18" width="8" height="8" fill="#000" />
            <rect x="66" y="10" width="24" height="24" fill="#000" />
            <rect x="70" y="14" width="16" height="16" fill="#fff" />
            <rect x="74" y="18" width="8" height="8" fill="#000" />
            <rect x="10" y="66" width="24" height="24" fill="#000" />
            <rect x="14" y="70" width="16" height="16" fill="#fff" />
            <rect x="18" y="74" width="8" height="8" fill="#000" />
            <rect x="40" y="12" width="6" height="6" fill="#000" />
            <rect x="50" y="12" width="6" height="6" fill="#000" />
            <rect x="44" y="24" width="6" height="6" fill="#000" />
            <rect x="54" y="24" width="6" height="6" fill="#000" />
            <rect x="12" y="44" width="6" height="6" fill="#000" />
            <rect x="24" y="44" width="6" height="6" fill="#000" />
            <rect x="36" y="38" width="6" height="6" fill="#000" />
            <rect x="46" y="42" width="8" height="8" fill="#dc2626" />
            <rect x="60" y="44" width="6" height="6" fill="#000" />
            <rect x="72" y="44" width="6" height="6" fill="#000" />
            <rect x="82" y="44" width="6" height="6" fill="#000" />
            <rect x="40" y="60" width="6" height="6" fill="#000" />
            <rect x="52" y="66" width="6" height="6" fill="#000" />
            <rect x="64" y="60" width="6" height="6" fill="#000" />
            <rect x="76" y="70" width="6" height="6" fill="#000" />
            <rect x="44" y="80" width="6" height="6" fill="#000" />
            <rect x="60" y="80" width="6" height="6" fill="#000" />
            <rect x="80" y="82" width="6" height="6" fill="#000" />
          </svg>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[var(--text)]">{acct.name}</h4>
          <p className="font-mono text-xs text-[var(--accent)]">
            {acct.number} · {acct.bank}
          </p>
          <p className="text-[11px] text-[var(--muted)] mt-1">
            Compatible with Nigerian banking apps &amp; POS
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(
                  `00020101021226580010com.nibss0110${acct.number}520454115802NG5916${acct.name}6005Lagos`
                );
              }
              showToast('QR Payload Copied', 'EMVCo payload string copied.');
            }}
            className="h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--text)] text-xs font-semibold"
            type="button"
          >
            Copy payload
          </button>
          <button
            onClick={() => {
              showToast('QR Saved', 'QR image downloaded to photos.');
              setIsQrOpen(false);
            }}
            className="h-11 rounded-2xl bg-[var(--accent)] text-white text-xs font-semibold"
            type="button"
          >
            Save to device
          </button>
        </div>
      </div>
    </div>
  );
};
