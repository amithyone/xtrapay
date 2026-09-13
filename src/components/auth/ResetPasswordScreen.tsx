import React, { useState } from 'react';
import { AuthShell, authFieldClass } from './AuthShell';
import { Icon } from '../Icon';

interface ResetPasswordScreenProps {
  onBack: () => void;
  onSave: (password: string) => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onBack, onSave }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    onSave(password);
  };

  return (
    <AuthShell
      title="Set new password"
      subtitle="Choose a strong password you haven’t used on Xtrapay before."
      onBack={onBack}
    >
      <div className="relative">
        <input
          className={`${authFieldClass} pr-12`}
          type={show ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="New password"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <Icon name={show ? 'visibility_off' : 'visibility'} size={18} />
        </button>
      </div>
      <input
        className={authFieldClass}
        type={show ? 'text' : 'password'}
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        autoComplete="new-password"
      />
      {error && <p className="text-[12px] text-rose-500">{error}</p>}
      <button type="button" onClick={submit} className="glass-cta w-full !rounded-2xl">
        Save password & sign in
      </button>
    </AuthShell>
  );
};
