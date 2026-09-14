import React, { useEffect, useRef, useState } from 'react';
import { AuthShell, authFieldClass } from './AuthShell';
import { Icon } from '../Icon';

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
  const [showPin, setShowPin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pinRef.current?.focus();
  }, []);

  const submit = async () => {
    if (busy) return;
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
    <AuthShell title={title} subtitle={subtitle} onBack={busy ? undefined : onBack}>
      <div className="relative">
        <input
          ref={pinRef}
          className={`${authFieldClass} font-mono tracking-[0.35em] text-center pr-12`}
          type={showPin ? 'text' : 'password'}
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          autoComplete="new-password"
          aria-label="Create PIN"
          disabled={busy}
          onKeyDown={e => {
            if (e.key === 'Enter') void submit();
          }}
        />
        <button
          type="button"
          onClick={() => setShowPin(v => !v)}
          disabled={busy}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] disabled:opacity-50"
          aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
        >
          <Icon name={showPin ? 'visibility_off' : 'visibility'} size={18} />
        </button>
      </div>

      <div className="relative">
        <input
          className={`${authFieldClass} font-mono tracking-[0.35em] text-center pr-12`}
          type={showConfirm ? 'text' : 'password'}
          inputMode="numeric"
          maxLength={4}
          value={confirm}
          onChange={e => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="Confirm PIN"
          autoComplete="new-password"
          aria-label="Confirm PIN"
          disabled={busy}
          onKeyDown={e => {
            if (e.key === 'Enter') void submit();
          }}
        />
        <button
          type="button"
          onClick={() => setShowConfirm(v => !v)}
          disabled={busy}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] disabled:opacity-50"
          aria-label={showConfirm ? 'Hide confirm PIN' : 'Show confirm PIN'}
        >
          <Icon name={showConfirm ? 'visibility_off' : 'visibility'} size={18} />
        </button>
      </div>

      {error && <p className="text-[12px] text-rose-500">{error}</p>}

      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={() => void submit()}
        className="glass-cta w-full !rounded-2xl disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        {busy ? (
          <>
            <Icon name="sync" size={18} className="animate-spin" />
            Saving…
          </>
        ) : (
          submitLabel
        )}
      </button>

      <p className="text-[11px] text-center text-[var(--muted)] leading-snug px-1">
        Never share your transaction PIN. Xtrapay staff will never ask for it.
      </p>
    </AuthShell>
  );
};
