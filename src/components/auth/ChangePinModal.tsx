import React, { useEffect, useRef, useState } from 'react';
import { AuthShell, authFieldClass } from './AuthShell';
import { Icon } from '../Icon';

type ChangePinStep = 'current' | 'otp' | 'new';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestOtp: (currentPin: string) => Promise<{ demoCode?: string | null; destinations?: string[] }>;
  onConfirm: (payload: {
    currentPin: string;
    otp: string;
    newPin: string;
  }) => Promise<void>;
  onResendOtp: () => Promise<{ demoCode?: string | null }>;
}

const OTP_LEN = 6;

/**
 * Settings: current PIN → OTP confirm → new 4-digit PIN.
 */
export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  onRequestOtp,
  onConfirm,
  onResendOtp,
}) => {
  const [step, setStep] = useState<ChangePinStep>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState('');
  const [seconds, setSeconds] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!isOpen) {
      setStep('current');
      setCurrentPin('');
      setOtpDigits(Array(OTP_LEN).fill(''));
      setNewPin('');
      setConfirmPin('');
      setError('');
      setHint('');
      setSeconds(0);
      setBusy(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = window.setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [seconds]);

  if (!isOpen) return null;

  const otp = otpDigits.join('');

  const requestOtp = async () => {
    if (!/^\d{4}$/.test(currentPin)) {
      setError('Enter your current 4-digit PIN.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await onRequestOtp(currentPin);
      setStep('otp');
      setSeconds(45);
      setHint(
        res.demoCode
          ? `OTP sent. Demo code: ${res.demoCode}`
          : `OTP sent to ${(res.destinations || []).join(' & ') || 'your phone and email'}.`
      );
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP.');
    } finally {
      setBusy(false);
    }
  };

  const goNewPin = () => {
    if (otp.length < OTP_LEN) {
      setError('Enter the 6-digit OTP.');
      return;
    }
    setError('');
    setStep('new');
  };

  const saveNewPin = async () => {
    if (!/^\d{4}$/.test(newPin)) {
      setError('Enter a new 4-digit PIN.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('New PINs do not match.');
      return;
    }
    if (newPin === currentPin) {
      setError('Choose a PIN different from your current one.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onConfirm({ currentPin, otp, newPin });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update PIN.');
    } finally {
      setBusy(false);
    }
  };

  const applyDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);
    if (clean && index < OTP_LEN - 1) inputsRef.current[index + 1]?.focus();
  };

  return (
    <div
      className="app-modal-overlay z-[90] bg-black/70 backdrop-blur-md"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Change transaction PIN"
        className="app-modal-panel glass-card glass-strong settings-list !rounded-[24px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Security
            </p>
            <h2 className="mt-1 text-[16px] font-semibold text-[var(--text)]">
              {step === 'current'
                ? 'Current PIN'
                : step === 'otp'
                  ? 'Confirm with OTP'
                  : 'New transaction PIN'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
            aria-label="Close"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {step === 'current' && (
            <>
              <p className="text-[12px] text-[var(--muted)]">
                Enter your current transaction PIN. We’ll send an OTP to confirm the change.
              </p>
              <input
                className={`${authFieldClass} font-mono tracking-[0.35em] text-center`}
                inputMode="numeric"
                maxLength={4}
                value={currentPin}
                onChange={e => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                aria-label="Current PIN"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void requestOtp()}
                className="glass-cta w-full !rounded-2xl disabled:opacity-60"
              >
                {busy ? 'Sending OTP…' : 'Send OTP'}
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <p className="text-[12px] text-[var(--muted)]">{hint || 'Enter the OTP we sent.'}</p>
              <div className="flex justify-between gap-2">
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => {
                      inputsRef.current[i] = el;
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => applyDigit(i, e.target.value)}
                    aria-label={`OTP digit ${i + 1}`}
                    className="auth-field w-10 h-11 rounded-2xl text-center text-[16px] font-mono font-semibold text-[var(--text)] focus:outline-none"
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[var(--muted)]">
                  {seconds > 0 ? `Resend in ${seconds}s` : 'Didn’t get the code?'}
                </span>
                <button
                  type="button"
                  disabled={seconds > 0 || busy}
                  onClick={() => {
                    void (async () => {
                      setBusy(true);
                      try {
                        const res = await onResendOtp();
                        setSeconds(45);
                        if (res.demoCode) setHint(`OTP resent. Demo code: ${res.demoCode}`);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Resend failed.');
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
                  className={`settings-row font-semibold appearance-none border-0 bg-transparent cursor-pointer p-0 ${
                    seconds > 0 ? 'text-[var(--muted)] opacity-50' : 'text-[var(--accent)]'
                  }`}
                >
                  Resend OTP
                </button>
              </div>
              <button
                type="button"
                onClick={goNewPin}
                className="glass-cta w-full !rounded-2xl"
              >
                Continue
              </button>
            </>
          )}

          {step === 'new' && (
            <>
              <p className="text-[12px] text-[var(--muted)]">
                Choose a new 4-digit transaction PIN.
              </p>
              <input
                className={`${authFieldClass} font-mono tracking-[0.35em] text-center`}
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="New PIN"
                aria-label="New PIN"
              />
              <input
                className={`${authFieldClass} font-mono tracking-[0.35em] text-center`}
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Confirm new PIN"
                aria-label="Confirm new PIN"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveNewPin()}
                className="glass-cta w-full !rounded-2xl disabled:opacity-60"
              >
                {busy ? 'Updating…' : 'Update PIN'}
              </button>
            </>
          )}

          {error && <p className="text-[12px] text-rose-500">{error}</p>}
        </div>
      </div>
    </div>
  );
};
