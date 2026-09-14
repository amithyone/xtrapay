import React, { useState } from 'react';
import { AuthShell, authFieldClass } from './AuthShell';
import { Icon } from '../Icon';

export type RegisterBasicPayload = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
};

interface RegisterScreenProps {
  onBack: () => void;
  onContinue: (payload: RegisterBasicPayload) => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

/** One word only — strips spaces and other whitespace as the user types. */
const oneWord = (value: string) => value.replace(/\s+/g, '');

const isOneWord = (value: string) => value.length > 0 && !/\s/.test(value);

/**
 * Registration step 1 — basic account details.
 */
export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBack,
  onContinue,
  onOpenTerms,
  onOpenPrivacy,
}) => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    const first = oneWord(firstName);
    const middle = oneWord(middleName);
    const last = oneWord(lastName);
    if (!first || !last || !phone.trim() || !email.trim() || password.length < 6) {
      setError('Enter first and last name, phone, email, and a password (min 6 characters).');
      return;
    }
    if (!isOneWord(first) || !isOneWord(last) || (middle && !isOneWord(middle))) {
      setError('First, middle, and last name must each be a single word.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!accepted) {
      setError('Accept the terms to continue.');
      return;
    }
    setError('');
    // Backend still expects a single fullName — join parts (middle optional).
    const fullName = [first, middle, last].filter(Boolean).join(' ');
    onContinue({
      fullName,
      phone: phone.trim(),
      email: email.trim(),
      password,
    });
  };

  return (
    <AuthShell
      title="Basic information"
      subtitle="Create your login with name, phone, email and password. We’ll verify with OTP next — KYC comes later when you need higher limits."
      onBack={onBack}
    >
      <input
        className={authFieldClass}
        value={firstName}
        onChange={e => setFirstName(oneWord(e.target.value))}
        placeholder="First name (one word)"
        autoComplete="given-name"
      />
      <input
        className={authFieldClass}
        value={middleName}
        onChange={e => setMiddleName(oneWord(e.target.value))}
        placeholder="Middle name (optional, one word)"
        autoComplete="additional-name"
      />
      <input
        className={authFieldClass}
        value={lastName}
        onChange={e => setLastName(oneWord(e.target.value))}
        placeholder="Last name (one word)"
        autoComplete="family-name"
      />
      <input
        className={authFieldClass}
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="Phone number"
        inputMode="tel"
        autoComplete="tel"
      />
      <input
        className={authFieldClass}
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email address"
        type="email"
        autoComplete="email"
      />
      <div className="relative">
        <input
          className={`${authFieldClass} pr-12`}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Create password"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
        </button>
      </div>
      <div className="relative">
        <input
          className={`${authFieldClass} pr-12`}
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
        </button>
      </div>

      <label className="flex items-start gap-2.5 text-[12px] text-[var(--muted)] leading-snug cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={e => setAccepted(e.target.checked)}
          className="mt-0.5 accent-[var(--accent)] shrink-0"
        />
        <span>
          I agree to Xtrapay{' '}
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              onOpenTerms();
            }}
            className="settings-row font-semibold text-[var(--accent)] appearance-none border-0 bg-transparent cursor-pointer p-0 underline-offset-2 hover:underline"
          >
            Terms of use
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              onOpenPrivacy();
            }}
            className="settings-row font-semibold text-[var(--accent)] appearance-none border-0 bg-transparent cursor-pointer p-0 underline-offset-2 hover:underline"
          >
            Privacy policy
          </button>
          .
        </span>
      </label>

      {error && <p className="text-[12px] text-rose-500">{error}</p>}

      <button type="button" onClick={submit} className="glass-cta w-full !rounded-2xl">
        Continue
      </button>
    </AuthShell>
  );
};
