import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';
import { BotanicalXIcon } from '../BackgroundDepthPattern';
import { useTransactions } from '../../context/TransactionContext';

export const authFieldClass =
  'auth-field w-full h-12 px-4 rounded-2xl text-[var(--text)] text-sm focus:outline-none transition-all placeholder:text-[var(--muted)]';

const isField = (el: Element | null): el is HTMLElement =>
  !!el && el instanceof HTMLElement && el.matches('input, textarea, select');

export const AuthShell: React.FC<{
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  footer?: React.ReactNode;
}> = ({ children, title, subtitle, onBack, footer }) => {
  const { theme } = useTransactions();
  const isLight = theme === 'light';
  const shellRef = useRef<HTMLElement>(null);
  const [fieldFocused, setFieldFocused] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    const sync = () => {
      if (!vv) {
        setKeyboardInset(0);
        return;
      }
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(inset);
    };
    sync();
    vv?.addEventListener('resize', sync);
    vv?.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    return () => {
      vv?.removeEventListener('resize', sync);
      vv?.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  const lifted = fieldFocused || keyboardInset > 60;

  const handleFocusIn = (e: React.FocusEvent) => {
    const target = e.target;
    if (!isField(target)) return;
    setFieldFocused(true);
    window.setTimeout(() => {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 140);
  };

  const handleFocusOut = () => {
    window.setTimeout(() => {
      const active = document.activeElement;
      if (!isField(active) || !shellRef.current?.contains(active)) {
        setFieldFocused(false);
      }
    }, 60);
  };

  return (
    <main
      ref={shellRef}
      className="flex-1 min-w-0 px-5 pt-4 flex flex-col overflow-y-auto overscroll-contain"
      id="auth-shell"
      onFocusCapture={handleFocusIn}
      onBlurCapture={handleFocusOut}
      style={{
        paddingBottom: `max(${lifted ? 1 : 2.75}rem, calc(${keyboardInset}px + 0.75rem + env(safe-area-inset-bottom, 0px)))`,
      }}
    >
      <div className="flex items-center justify-between shrink-0 mb-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
            aria-label="Back"
          >
            <Icon name="arrow_back" size={16} />
          </button>
        ) : (
          <span className="w-9" />
        )}
        <div className="flex items-center gap-2">
          <span className="frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg p-1">
            <BotanicalXIcon
              className="w-5 h-5"
              strokeColor={isLight ? '#dc2626' : '#ffffff'}
              opacity={1}
              strokeWidth={3}
            />
          </span>
          <span className="text-[15px] font-semibold text-[var(--text)] tracking-tight">Xtrapay</span>
        </div>
        <span className="w-9" />
      </div>

      <div
        className={`flex flex-col w-full transition-[margin] duration-300 ease-in-out ${
          lifted ? 'mt-0' : 'mt-auto'
        }`}
      >
        {(title || subtitle) && (
          <header className="hub-action-shell !rounded-[28px] px-4 py-3.5 mb-5">
            {title && (
              <h1 className="text-[15px] font-semibold text-[var(--text)] tracking-tight leading-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                className={`text-[12px] text-[var(--muted)] leading-snug tracking-wide ${
                  title ? 'mt-2' : ''
                }`}
              >
                {subtitle}
              </p>
            )}
          </header>
        )}

        <div className="space-y-4">{children}</div>
        {footer && <div className="mt-5 pt-1">{footer}</div>}
      </div>
    </main>
  );
};
