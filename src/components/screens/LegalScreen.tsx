import React from 'react';

type LegalKind = 'terms' | 'privacy';

const TERMS_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. Who we are',
    body: 'Xtrapay is a digital wallet and payments product operated by Xtratech Global Solutions, leveraging CheckoutNow infrastructure. These Terms of Use govern your access to the Xtrapay mobile experience in Nigeria.',
  },
  {
    heading: '2. Eligibility',
    body: 'You must be at least 18 years old, have a valid Nigerian phone number, and complete identity verification (BVN or NIN) to open and operate a funded wallet. Tier limits apply based on KYC level.',
  },
  {
    heading: '3. Account & security',
    body: 'You are responsible for keeping your password, transaction PIN, and device biometrics secure. Notify us immediately of suspected unauthorised access. Xtrapay may freeze sessions or wallets to protect you or meet regulatory duties.',
  },
  {
    heading: '4. Payments & services',
    body: 'Transfers, airtime, bills, POS float, cards, savings, and related tools are provided subject to network availability, bank partner rails, and CBN rules. Fees and limits are shown in-app before you confirm a transaction.',
  },
  {
    heading: '5. Acceptable use',
    body: 'You must not use Xtrapay for fraud, money laundering, sanction evasion, or any illegal activity. We may refuse, reverse, or report transactions required by law or our risk policies.',
  },
  {
    heading: '6. Closing your account',
    body: 'You may request account deletion from Settings. Outstanding balances, disputes, or compliance holds may delay closure. After closure, we retain records only as required by Nigerian law.',
  },
  {
    heading: '7. Changes',
    body: 'We may update these terms. Material changes will be flagged in the app. Continued use after notice means you accept the updated terms.',
  },
  {
    heading: '8. Contact',
    body: 'Questions: support@xtrapay.ng · Xtratech Global Solutions · Powered by CheckoutNow.',
  },
];

const PRIVACY_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. Data we collect',
    body: 'We collect identity data (name, phone, email, BVN/NIN, date of birth, address), device and usage data, and transaction records needed to run your wallet and meet KYC/AML obligations.',
  },
  {
    heading: '2. How we use data',
    body: 'Data is used to verify identity, process payments, prevent fraud, improve the product, send transactional alerts, and comply with CBN, NDIC, and related regulations. Marketing messages are optional and can be turned off in Settings.',
  },
  {
    heading: '3. Sharing',
    body: 'We share data with licensed banking and payments partners, identity verification providers, regulators when required, and CheckoutNow as our infrastructure partner — only as needed to provide the service.',
  },
  {
    heading: '4. Retention',
    body: 'We keep account and transaction records for the periods required under Nigerian financial regulations, then securely delete or anonymise them where permitted.',
  },
  {
    heading: '5. Your rights',
    body: 'You may review and update profile details in Settings, request a copy of personal data we hold, or request account deletion. Some requests may be limited by legal retention rules.',
  },
  {
    heading: '6. Security',
    body: 'We use encryption in transit, access controls, PIN/biometric gates, and monitoring. No method is perfectly secure; report concerns to support@xtrapay.ng immediately.',
  },
  {
    heading: '7. Contact',
    body: 'Privacy requests: privacy@xtrapay.ng · Xtrapay by Xtratech Global Solutions · Powered by CheckoutNow.',
  },
];

/**
 * In-app Terms of Use / Privacy Policy readers.
 */
export const LegalScreen: React.FC<{ kind: LegalKind }> = ({ kind }) => {
  const sections = kind === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS;
  const updated = 'Last updated · 13 Sep 2026';

  return (
    <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id={`legal-${kind}-screen`}>
      <header className="hub-action-shell !rounded-[28px] px-4 py-3.5">
        <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">
          {kind === 'terms' ? 'Legal' : 'Privacy'}
        </p>
        <h1 className="mt-2 text-[15px] font-semibold text-[var(--text)] tracking-tight">
          {kind === 'terms' ? 'Terms of use' : 'Privacy policy'}
        </h1>
        <p className="mt-2 text-[11px] text-[var(--muted)]">{updated}</p>
      </header>

      <div className="space-y-3">
        {sections.map(section => (
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
      </div>

      <p className="text-center text-[10px] text-[var(--muted)] pt-2 pb-2">
        Xtrapay by Xtratech Global Solutions
      </p>
    </main>
  );
};

export const TermsScreen: React.FC = () => <LegalScreen kind="terms" />;
export const PrivacyScreen: React.FC = () => <LegalScreen kind="privacy" />;
