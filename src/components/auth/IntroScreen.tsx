import React, { useState } from 'react';
import { Icon } from '../Icon';
import { BotanicalXIcon } from '../BackgroundDepthPattern';
import { useTransactions } from '../../context/TransactionContext';

const SLIDES = [
  {
    id: 'pay',
    title: 'Pay anyone, instantly',
    body: 'Transfer to any Nigerian bank, buy airtime, and settle bills from one wallet.',
    icon: 'swap_horiz',
  },
  {
    id: 'pos',
    title: 'Run your POS float',
    body: 'Fund, sweep, and manage terminals with live balances and settlement tools.',
    icon: 'point_of_sale',
  },
  {
    id: 'secure',
    title: 'Bank-grade security',
    body: 'Tier 3 KYC, biometrics, and PIN gates keep every debit under your control.',
    icon: 'shield',
  },
] as const;

interface IntroScreenProps {
  onSkip: () => void;
  onDone: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onSkip, onDone }) => {
  const { theme } = useTransactions();
  const isLight = theme === 'light';
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <main className="flex-1 min-w-0 px-5 pt-6 pb-10 flex flex-col" id="auth-intro-screen">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-lg p-1">
            <BotanicalXIcon
              className="w-5 h-5"
              strokeColor={isLight ? '#dc2626' : '#ffffff'}
              opacity={1}
              strokeWidth={3}
            />
          </span>
          <span className="text-[16px] font-semibold text-[var(--text)]">Xtrapay</span>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="settings-row text-[13px] font-semibold text-[var(--muted)] appearance-none border-0 bg-transparent cursor-pointer p-0"
        >
          Skip
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center text-center px-2 pb-6 space-y-6">
        <span className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[var(--accent)]/12 text-[var(--accent)]">
          <Icon name={slide.icon} size={40} />
        </span>
        <header className="hub-action-shell !rounded-[28px] px-4 py-3.5 w-full max-w-[20rem] text-left">
          <h1 className="text-[15px] font-semibold text-[var(--text)] tracking-tight leading-tight">
            {slide.title}
          </h1>
          <p className="mt-2 text-[12px] text-[var(--muted)] leading-snug tracking-wide">{slide.body}</p>
        </header>

        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all appearance-none border-0 cursor-pointer ${
                i === index ? 'w-6 bg-[var(--accent)]' : 'w-1.5 bg-[var(--muted)]/35'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (isLast) onDone();
            else setIndex(i => i + 1);
          }}
          className="glass-cta w-full !rounded-2xl flex items-center justify-center gap-2"
        >
          {isLast ? 'Get started' : 'Next'}
          <Icon name="arrow_forward" size={16} />
        </button>
        {!isLast && (
          <button
            type="button"
            onClick={onDone}
            className="w-full h-11 text-[13px] font-semibold text-[var(--muted)]"
          >
            Skip intro
          </button>
        )}
      </div>
    </main>
  );
};
