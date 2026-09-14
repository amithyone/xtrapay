import React, { useEffect, useRef, useState } from 'react';
import { AuthShell } from './AuthShell';
import { Icon } from '../Icon';

interface OtpScreenProps {
  destination: string;
  purpose: 'register' | 'login' | 'reset';
  onBack: () => void;
  onVerified: (otp: string) => void | Promise<void>;
  onResend: () => void | Promise<void>;
  /** Parent busy flag (e.g. AuthFlow) — keeps button disabled during verify */
  verifying?: boolean;
}

const OTP_LEN = 6;

export const OtpScreen: React.FC<OtpScreenProps> = ({
  destination,
  purpose,
  onBack,
  onVerified,
  onResend,
  verifying: verifyingProp = false,
}) => {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [seconds, setSeconds] = useState(45);
  const [error, setError] = useState('');
  const [localVerifying, setLocalVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const submitLock = useRef(false);

  const verifying = verifyingProp || localVerifying;

  useEffect(() => {
    if (seconds <= 0) return;
    const t = window.setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const purposeCopy =
    purpose === 'register'
      ? 'Confirm your phone to finish creating your account.'
      : purpose === 'reset'
        ? 'Enter the code we sent so you can reset your password.'
        : 'Enter the code to complete sign-in.';

  const submitCode = async (code: string) => {
    if (code.length < OTP_LEN) {
      setError('Enter the 6-digit code.');
      return;
    }
    if (submitLock.current || verifying) return;
    submitLock.current = true;
    setError('');
    setLocalVerifying(true);
    try {
      await onVerified(code);
    } finally {
      submitLock.current = false;
      setLocalVerifying(false);
    }
  };

  const applyDigit = (index: number, value: string) => {
    if (verifying) return;
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < OTP_LEN - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    if (next.every(d => d.length === 1)) {
      void submitCode(next.join(''));
    }
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (verifying) return;
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    if (verifying) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    if (!pasted) return;
    const next = Array(OTP_LEN)
      .fill('')
      .map((_, i) => pasted[i] || '');
    setDigits(next);
    const focusAt = Math.min(pasted.length, OTP_LEN - 1);
    inputsRef.current[focusAt]?.focus();
    if (pasted.length === OTP_LEN) {
      void submitCode(pasted);
    }
  };

  return (
    <AuthShell
      title="Enter OTP"
      subtitle={`${purposeCopy} Sent to ${destination}.`}
      onBack={verifying ? undefined : onBack}
    >
      <div className="flex justify-between gap-2" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => {
              inputsRef.current[i] = el;
            }}
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => applyDigit(i, e.target.value)}
            onKeyDown={e => onKeyDown(i, e)}
            disabled={verifying}
            aria-label={`Digit ${i + 1}`}
            className="auth-field w-11 h-12 sm:w-12 rounded-2xl text-center text-[18px] font-mono font-semibold text-[var(--text)] focus:outline-none disabled:opacity-60"
          />
        ))}
      </div>

      {error && <p className="text-[12px] text-rose-500">{error}</p>}

      <div className="flex items-center justify-between text-[12px]">
        <span className="text-[var(--muted)]">
          {seconds > 0 ? `Resend in ${seconds}s` : 'Didn’t get the code?'}
        </span>
        <button
          type="button"
          disabled={seconds > 0 || verifying || resending}
          onClick={async () => {
            if (seconds > 0 || verifying || resending) return;
            setResending(true);
            try {
              await onResend();
              setSeconds(45);
              setDigits(Array(OTP_LEN).fill(''));
              inputsRef.current[0]?.focus();
            } finally {
              setResending(false);
            }
          }}
          className={`settings-row font-semibold appearance-none border-0 bg-transparent cursor-pointer p-0 disabled:opacity-50 disabled:pointer-events-none ${
            seconds > 0 || verifying || resending
              ? 'text-[var(--muted)]'
              : 'text-[var(--accent)]'
          }`}
        >
          {resending ? 'Sending…' : 'Resend OTP'}
        </button>
      </div>

      <button
        type="button"
        disabled={verifying || digits.join('').length < OTP_LEN}
        aria-busy={verifying}
        onClick={() => void submitCode(digits.join(''))}
        className="glass-cta w-full !rounded-2xl disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        {verifying ? (
          <>
            <Icon name="sync" size={18} className="animate-spin" />
            Verifying…
          </>
        ) : (
          'Verify code'
        )}
      </button>

      <p className="text-center text-[11px] text-[var(--muted)]">
        Demo tip · any 6 digits works for now.
      </p>
    </AuthShell>
  );
};
