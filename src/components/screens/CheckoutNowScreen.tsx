import React from 'react';
import { AuthShell } from '../auth/AuthShell';

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'Who we are',
    body: 'CheckoutNow is a fintech development company. We build modern payments engines, mobile experiences, and secure transaction tooling for licensed financial service providers.',
  },
  {
    heading: 'Licence to Xtratech',
    body: 'CheckoutNow has licensed the use of our technology to Xtratech Global Solutions so they can run the Xtrapay fintech solutions engine and serve their customers with a more effective, modern app for everyday transactions.',
  },
  {
    heading: 'What CheckoutNow does',
    body: 'Under this licence, CheckoutNow manages and updates the Xtrapay app experience and underlying solution stack — keeping the product current, secure, and fit for handling user transactions.',
  },
  {
    heading: 'What CheckoutNow does not control',
    body: 'CheckoutNow has no control of user data or money. Customer funds, KYC records, wallets, and personal data are managed solely by Xtrapay, operated by Xtratech Global Solutions.',
  },
  {
    heading: 'Licensed period',
    body: 'CheckoutNow is licensing the use of this app and its solutions to Xtrapay for a licensed period, as Xtrapay deems fit that this product is the most effective and modern way to handle user transactions and manage them securely.',
  },
];

function CheckoutNowBody() {
  return (
    <div className="space-y-3">
      {SECTIONS.map(section => (
        <article
          key={section.heading}
          className="hub-action-shell !rounded-[28px] px-4 py-3.5 space-y-2"
        >
          <h2 className="text-[13px] font-semibold text-[var(--text)] tracking-tight">
            {section.heading}
          </h2>
          <p className="text-[12px] text-[var(--muted)] leading-relaxed">{section.body}</p>
        </article>
      ))}
      <p className="text-center text-[10px] text-[var(--muted)] pt-1 pb-2">
        Xtrapay by Xtratech Global Solutions · Powered by CheckoutNow
      </p>
    </div>
  );
}

/**
 * Explains the CheckoutNow ↔ Xtratech / Xtrapay licensing relationship.
 * Use `onBack` when shown from the auth gate; otherwise TopAppBar handles back.
 */
export const CheckoutNowScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  if (onBack) {
    return (
      <AuthShell
        title="CheckoutNow"
        subtitle="Fintech technology partner powering the Xtrapay experience."
        onBack={onBack}
      >
        <CheckoutNowBody />
      </AuthShell>
    );
  }

  return (
    <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id="checkoutnow-screen">
      <header className="hub-action-shell !rounded-[28px] px-4 py-3.5">
        <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">Technology partner</p>
        <h1 className="mt-2 text-[15px] font-semibold text-[var(--text)] tracking-tight">
          Powered by CheckoutNow
        </h1>
        <p className="mt-2 text-[11px] text-[var(--muted)] leading-snug">
          Licensed fintech engine for Xtrapay by Xtratech Global Solutions.
        </p>
      </header>
      <CheckoutNowBody />
    </main>
  );
};
