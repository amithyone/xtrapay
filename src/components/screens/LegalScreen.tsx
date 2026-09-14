import React, { useEffect, useState } from 'react';
import { ApiError } from '../../lib/api';
import { apiLegalDocument } from '../../lib/xtrapayApi';
import { Icon } from '../Icon';

type LegalKind = 'terms' | 'privacy';

const FALLBACK_TERMS: { heading: string; body: string }[] = [
  {
    heading: '1. Who we are',
    body: 'Xtrapay is a digital wallet and payments product operated by Xtratech Global Solutions, leveraging CheckoutNow infrastructure. These Terms of Use govern your access to the Xtrapay mobile experience in Nigeria.',
  },
  {
    heading: '2. Eligibility',
    body: 'You must be at least 18 years old and have a valid Nigerian phone number. Higher limits require KYC (BVN or NIN) after cumulative activity reaches regulatory thresholds.',
  },
  {
    heading: '3. Account & security',
    body: 'You are responsible for keeping your password, transaction PIN, and device biometrics secure. Notify us immediately of suspected unauthorised access.',
  },
  {
    heading: '4. Payments & services',
    body: 'Transfers, airtime, bills, POS float, cards, savings, and related tools are subject to network availability, bank partner rails, and CBN rules. Fees and limits are shown before you confirm.',
  },
  {
    heading: '5. Acceptable use',
    body: 'You must not use Xtrapay for fraud, money laundering, sanction evasion, or any illegal activity. We may refuse, reverse, or report transactions required by law.',
  },
  {
    heading: '6. Contact',
    body: 'Questions: support@xtrapay.ng · Xtratech Global Solutions · Powered by CheckoutNow.',
  },
];

const FALLBACK_PRIVACY: { heading: string; body: string }[] = [
  {
    heading: '1. Data we collect',
    body: 'We collect identity data (name, phone, email, and KYC details when provided), device and usage data, and transaction records needed to run your wallet.',
  },
  {
    heading: '2. How we use data',
    body: 'Data is used to verify identity, process payments, prevent fraud, improve the product, send transactional alerts, and comply with regulations.',
  },
  {
    heading: '3. Sharing',
    body: 'We share data with licensed banking and payments partners, identity providers, regulators when required, and CheckoutNow as infrastructure — only as needed to provide the service.',
  },
  {
    heading: '4. Your rights',
    body: 'You may review and update profile details in Settings, request a copy of personal data, or request account deletion subject to legal retention rules.',
  },
  {
    heading: '5. Contact',
    body: 'Privacy requests: privacy@xtrapay.ng · Xtrapay by Xtratech Global Solutions · Powered by CheckoutNow.',
  },
];

/**
 * In-app Terms of Use / Privacy Policy — content from GET /legal/:kind.
 */
export const LegalScreen: React.FC<{ kind: LegalKind; onBack?: () => void }> = ({
  kind,
  onBack,
}) => {
  const fallback = kind === 'terms' ? FALLBACK_TERMS : FALLBACK_PRIVACY;
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(kind === 'terms' ? 'Terms of use' : 'Privacy policy');
  const [updated, setUpdated] = useState('Last updated · see in-app version');
  const [sections, setSections] = useState(fallback);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const doc = await apiLegalDocument(kind);
        if (cancelled) return;
        setTitle(doc.title);
        if (doc.updatedAt) {
          setUpdated(`Last updated · ${doc.updatedAt}`);
        }
        if (doc.sections.length) setSections(doc.sections);
        else setSections(fallback);
      } catch (err) {
        if (cancelled) return;
        setSections(fallback);
        if (err instanceof ApiError && err.status !== 404) {
          // keep fallback; silent for offline/auth gate
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return (
    <main
      className={`flex-1 min-w-0 px-5 pt-4 space-y-4 ${onBack ? 'pb-8' : 'pb-32'}`}
      id={`legal-${kind}-screen`}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="settings-row inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)] bg-transparent border-0 p-0 appearance-none cursor-pointer"
        >
          <Icon name="arrow_back" size={16} />
          Back
        </button>
      )}

      <header className="hub-action-shell !rounded-[28px] px-4 py-3.5">
        <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">
          {kind === 'terms' ? 'Legal' : 'Privacy'}
        </p>
        <h1 className="mt-2 text-[15px] font-semibold text-[var(--text)] tracking-tight">{title}</h1>
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          {loading ? 'Loading…' : updated}
        </p>
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
            <p className="text-[12px] text-[var(--muted)] leading-relaxed whitespace-pre-wrap">
              {section.body}
            </p>
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
