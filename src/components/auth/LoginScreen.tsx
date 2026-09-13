import React, { useState } from 'react';
import { AuthShell, authFieldClass } from './AuthShell';
import { Icon } from '../Icon';

interface LoginScreenProps {
  onBack?: () => void;
  onLogin: (payload: { identifier: string; password: string }) => void | Promise<void>;
  onForgot: () => void;
  onRegister: () => void;
  onPoweredBy?: () => void;
  loading?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onLogin,
  onForgot,
  onRegister,
  onPoweredBy,
  loading = false,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (loading) return;
    if (!identifier.trim() || !password.trim()) {
      setError('Enter your phone/email and password.');
      return;
    }
    setError('');
    void onLogin({ identifier: identifier.trim(), password });
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your phone number or email."
      onBack={onBack}
      footer={
        <div className="space-y-3">
          <p className="text-center text-[13px] text-[var(--muted)]">
            New to Xtrapay?{' '}
            <button
              type="button"
              onClick={onRegister}
              disabled={loading}
              className="settings-row font-semibold text-[var(--accent)] appearance-none border-0 bg-transparent cursor-pointer p-0 disabled:opacity-50"
            >
              Create account
            </button>
          </p>
          <div
            className="mx-10 my-1 h-px bg-[var(--glass-border)]"
            role="separator"
            aria-hidden="true"
          />
          <p className="text-center text-[11px] font-semibold tracking-wide text-[var(--text)]/70 pt-0.5">
            Xtrapay by Xtratech Global Solutions
          </p>
          <p className="text-center text-[10px] tracking-wide text-[var(--muted)]/80 pb-1">
            {onPoweredBy ? (
              <button
                type="button"
                onClick={onPoweredBy}
                disabled={loading}
                className="settings-row appearance-none border-0 bg-transparent cursor-pointer p-0 text-[10px] tracking-wide text-[var(--muted)]/80 underline underline-offset-2 decoration-[var(--glass-border)] disabled:opacity-50"
              >
                Powered by CheckoutNow
              </button>
            ) : (
              'Powered by CheckoutNow'
            )}
          </p>
        </div>
      }
    >
      <input
        className={authFieldClass}
        value={identifier}
        onChange={e => setIdentifier(e.target.value)}
        placeholder="Phone number or email"
        autoComplete="username"
        disabled={loading}
        onKeyDown={e => {
          if (e.key === 'Enter') submit();
        }}
      />
      <div className="relative">
        <input
          className={`${authFieldClass} pr-12`}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          disabled={loading}
          onKeyDown={e => {
            if (e.key === 'Enter') submit();
          }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          disabled={loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] disabled:opacity-50"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
        </button>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onForgot}
          disabled={loading}
          className="settings-row text-[12px] font-semibold text-[var(--accent)] appearance-none border-0 bg-transparent cursor-pointer p-0 disabled:opacity-50"
        >
          Forgot password?
        </button>
      </div>

      {error && <p className="text-[12px] text-rose-500">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        aria-busy={loading}
        className="glass-cta w-full !rounded-2xl disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Icon name="sync" size={18} className="animate-spin" />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </button>
    </AuthShell>
  );
};
