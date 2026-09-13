import React, { useState } from 'react';
import { AuthShell, authFieldClass } from './AuthShell';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onContinue: (identifier: string) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
  onContinue,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!identifier.trim()) {
      setError('Enter the phone or email on your Xtrapay account.');
      return;
    }
    setError('');
    onContinue(identifier.trim());
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We’ll send a one-time code to verify it’s you, then you can set a new password."
      onBack={onBack}
    >
      <input
        className={authFieldClass}
        value={identifier}
        onChange={e => setIdentifier(e.target.value)}
        placeholder="Phone number or email"
        autoComplete="username"
      />
      {error && <p className="text-[12px] text-rose-500">{error}</p>}
      <button type="button" onClick={submit} className="glass-cta w-full !rounded-2xl">
        Send verification code
      </button>
    </AuthShell>
  );
};
