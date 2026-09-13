import React, { useMemo, useState } from 'react';
import { AuthShell, authFieldClass } from './AuthShell';
import { Icon } from '../Icon';

export type IdType = 'bvn' | 'nin';

export type RegisterKycPayload = {
  idType: IdType;
  idNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  address: string;
  city: string;
  state: string;
};

interface KycRegisterScreenProps {
  onBack: () => void;
  onContinue: (payload: RegisterKycPayload) => void;
  onSkip?: () => void;
}

const STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

/**
 * Registration step 2 — identity / KYC (BVN or NIN + personal details).
 */
export const KycRegisterScreen: React.FC<KycRegisterScreenProps> = ({
  onBack,
  onContinue,
  onSkip,
}) => {
  const [idType, setIdType] = useState<IdType>('bvn');
  const [idNumber, setIdNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [error, setError] = useState('');
  const [stateModalOpen, setStateModalOpen] = useState(false);
  const [stateQuery, setStateQuery] = useState('');

  const filteredStates = useMemo(() => {
    const q = stateQuery.trim().toLowerCase();
    if (!q) return STATES;
    return STATES.filter(s => s.toLowerCase().includes(q));
  }, [stateQuery]);

  const submit = () => {
    const digits = idNumber.replace(/\D/g, '');
    if (digits.length !== 11) {
      setError(`${idType.toUpperCase()} must be 11 digits.`);
      return;
    }
    if (!dateOfBirth) {
      setError('Enter your date of birth.');
      return;
    }
    if (!gender) {
      setError('Select your gender.');
      return;
    }
    if (!address.trim() || !city.trim() || !state) {
      setError('Enter your full residential address, city, and state.');
      return;
    }
    setError('');
    onContinue({
      idType,
      idNumber: digits,
      dateOfBirth,
      gender,
      address: address.trim(),
      city: city.trim(),
      state,
    });
  };

  return (
    <>
      <AuthShell
        title="Identity verification"
        subtitle="Step 2 of 2 · Choose BVN or NIN and complete KYC details required by regulation."
        onBack={onBack}
      >
        <div className="hub-action-shell !rounded-[28px] p-1.5 grid grid-cols-2 gap-1">
          {([
            { id: 'bvn' as const, label: 'BVN' },
            { id: 'nin' as const, label: 'NIN' },
          ]).map(opt => {
            const active = idType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setIdType(opt.id);
                  setIdNumber('');
                  setError('');
                }}
                className={`settings-row h-10 rounded-2xl text-[13px] font-semibold appearance-none border-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-transparent text-[var(--muted)]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <input
          className={authFieldClass}
          value={idNumber}
          onChange={e => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
          placeholder={idType === 'bvn' ? 'BVN (11 digits)' : 'NIN (11 digits)'}
          inputMode="numeric"
          autoComplete="off"
        />

        <input
          className={authFieldClass}
          type="date"
          value={dateOfBirth}
          onChange={e => setDateOfBirth(e.target.value)}
          placeholder="Date of birth"
          aria-label="Date of birth"
        />

        <div className="hub-action-shell !rounded-[28px] p-1.5 grid grid-cols-2 gap-1">
          {([
            { id: 'male' as const, label: 'Male' },
            { id: 'female' as const, label: 'Female' },
          ]).map(opt => {
            const active = gender === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGender(opt.id)}
                className={`settings-row h-10 rounded-2xl text-[13px] font-semibold appearance-none border-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-transparent text-[var(--muted)]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <textarea
          className={`${authFieldClass} h-24 py-3 resize-none`}
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Residential address"
          autoComplete="street-address"
        />

        <input
          className={authFieldClass}
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="City / town"
          autoComplete="address-level2"
        />

        <button
          type="button"
          onClick={() => {
            setStateQuery('');
            setStateModalOpen(true);
          }}
          className={`settings-row ${authFieldClass} flex items-center justify-between gap-2 text-left appearance-none cursor-pointer`}
          aria-label="State of residence"
        >
          <span className={`min-w-0 truncate ${state ? 'text-[var(--text)]' : 'text-[var(--muted)]'}`}>
            {state || 'State of residence'}
          </span>
          <Icon name="expand_more" size={18} className="text-[var(--muted)] shrink-0" />
        </button>

        <p className="text-[11px] text-[var(--muted)] leading-snug">
          Your {idType.toUpperCase()} is used only for identity verification (CBN KYC). Xtrapay never
          shares it for marketing.
        </p>

        {error && <p className="text-[12px] text-rose-500">{error}</p>}

        <button type="button" onClick={submit} className="glass-cta w-full !rounded-2xl">
          Continue to phone OTP
        </button>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full h-12 rounded-2xl bg-emerald-600 text-white text-[14px] font-semibold flex items-center justify-center shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-transform"
          >
            Skip for now — verify with OTP
          </button>
        )}
        <p className="text-[11px] text-center text-[var(--muted)] leading-snug px-1">
          BVN, NIN, and address can be completed later. We send verification codes to both your
          phone and email.
        </p>
      </AuthShell>

      {stateModalOpen && (
        <div
          className="app-modal-overlay z-[90] bg-black/70 backdrop-blur-md"
          role="presentation"
          onClick={() => setStateModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select state of residence"
            className="app-modal-panel glass-card glass-strong settings-list !rounded-[24px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                  KYC address
                </p>
                <h2 className="mt-1 text-[16px] font-semibold text-[var(--text)]">
                  State of residence
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setStateModalOpen(false)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                  <Icon name="search" size={16} />
                </span>
                <input
                  value={stateQuery}
                  onChange={e => setStateQuery(e.target.value)}
                  placeholder="Search state"
                  className={`${authFieldClass} !pl-10`}
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-[min(55vh,24rem)] overflow-y-auto divide-y divide-[var(--glass-border)]">
              {filteredStates.length === 0 ? (
                <p className="px-5 py-8 text-center text-[12px] text-[var(--muted)]">
                  No states found
                </p>
              ) : (
                filteredStates.map(s => {
                  const active = s === state;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setState(s);
                        setStateModalOpen(false);
                      }}
                      className={`settings-row w-full flex items-center gap-3 px-5 py-3.5 text-left appearance-none border-0 cursor-pointer ${
                        active ? 'bg-[var(--accent)]/10' : 'bg-transparent'
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)] text-[11px] font-bold">
                        {s.slice(0, 2).toUpperCase()}
                      </span>
                      <p className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--text)] truncate">
                        {s}
                      </p>
                      {active && (
                        <Icon name="check" size={18} className="text-[var(--accent)] shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
