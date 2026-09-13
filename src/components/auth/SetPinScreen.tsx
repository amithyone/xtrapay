import React, { useEffect, useRef, useState } from 'react';
import { AuthShell, authFieldClass } from './AuthShell';

interface SetPinScreenProps {
  onBack?: () => void;
  onSave: (pin: string) => void | Promise<void>;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
}

/**
 * Create / confirm a 4-digit transaction PIN (registration or settings).
 */
export const SetPinScreen: React.FC<SetPinScreenProps> = ({
  onBack,
  onSave,
  title = 'Create transaction PIN',
  subtitle = 'This 4-digit PIN authorizes transfers and wallet actions. Keep it private.',
  submitLabel = 'Save PIN & continue',
}) => {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pinRef.current?.focus();
  }, []);

  const submit = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setError('Enter a 4-digit PIN.');
      return;
    }
    if (pin !== confirm) {
      setError('PINs do not match.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onSave(pin);
    } catch {
      // Parent shows toast
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={title} subtitle={subtitle} onBack={onBack}>
      <input
        ref={pinRef}
        className={`${authFieldClass} font-mono tracking-[0.35em] text-center`}
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
        placeholder="••••"
        autoComplete="new-password"
        aria-label="Create PIN"
      />
      <input
        className={`${authFieldClass} font-mono tracking-[0.35em] text-center`}
        inputMode="numeric"
        maxLength={4}
        value={confirm}
        onChange={e => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
        placeholder="Confirm PIN"
        autoComplete="new-password"
        aria-label="Confirm PIN"
      />

      {error && <p className="text-[12px] text-rose-500">{error}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="glass-cta w-full !rounded-2xl disabled:opacity-60"
      >
        {busy ? 'Saving…' : submitLabel}
      </button>

      <p className="text-[11px] text-center text-[var(--muted)] leading-snug px-1">
        Never share your transaction PIN. Xtrapay staff will never ask for it.
      </p>
    </AuthShell>
  );
};
