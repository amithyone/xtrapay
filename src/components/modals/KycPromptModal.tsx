import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { KYC_CUMULATIVE_THRESHOLD_NGN } from '../../lib/xtrapayApi';
import { KycRegisterScreen, type RegisterKycPayload } from '../auth/KycRegisterScreen';
import { Icon } from '../Icon';

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

/**
 * Deferred KYC — shown after login when cumulative spend ≥ ₦50,000 and KYC incomplete.
 */
export const KycPromptModal: React.FC = () => {
  const {
    kycPromptRequired,
    cumulativeSpent,
    dismissKycPrompt,
    submitDeferredKyc,
    showToast,
  } = useTransactions();
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!kycPromptRequired) return null;

  if (formOpen) {
    return (
      <div className="fixed inset-0 z-[95] bg-[var(--bg-0)] overflow-y-auto">
        <div className="min-h-full max-w-md mx-auto">
          <KycRegisterScreen
            onBack={() => setFormOpen(false)}
            onContinue={async (payload: RegisterKycPayload) => {
              if (busy) return;
              setBusy(true);
              try {
                const ok = await submitDeferredKyc(payload);
                if (ok) setFormOpen(false);
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-modal-overlay z-[95] bg-black/70 backdrop-blur-md" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Complete KYC"
        className="app-modal-panel glass-card glass-strong !rounded-[24px] p-6 shadow-2xl space-y-4 max-w-sm w-[calc(100%-2rem)]"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
            <Icon name="verified_user" size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Identity required
            </p>
            <h2 className="mt-1 text-[17px] font-semibold text-[var(--text)] tracking-tight">
              Complete KYC to keep spending
            </h2>
            <p className="mt-2 text-[13px] text-[var(--muted)] leading-snug">
              You&apos;ve reached {money(Math.max(cumulativeSpent, KYC_CUMULATIVE_THRESHOLD_NGN))}{' '}
              in cumulative activity. Regulation requires BVN or NIN verification before higher
              limits.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="glass-cta w-full !rounded-2xl"
        >
          Start verification
        </button>
        <button
          type="button"
          onClick={() => {
            dismissKycPrompt();
            showToast(
              'KYC later',
              'Some features may stay limited until you verify.',
              'info'
            );
          }}
          className="w-full h-11 rounded-2xl border border-[var(--glass-border)] text-[13px] font-semibold text-[var(--muted)] bg-transparent"
        >
          Remind me later
        </button>
      </div>
    </div>
  );
};
