export type WalletKind = 'personal' | 'business' | 'sub_personal' | 'sub_business';

export interface WalletAccount {
  id: string;
  name: string;
  kind: WalletKind;
  accountNumber: string;
  bankName: string;
  balance: number;
  /** Short line under the name in the switcher */
  subtitle: string;
  /** Legal / receive account name on the VA (optional; falls back to profile name) */
  accountName?: string;
  /** Optional dial string for USSD routing */
  ussd?: string;
}

/** Pre-bootstrap / logged-out shell — no fake balances or sub-wallets. */
export const PLACEHOLDER_WALLETS: WalletAccount[] = [
  {
    id: 'personal',
    name: 'Personal account',
    kind: 'personal',
    accountNumber: '—',
    bankName: '—',
    balance: 0,
    subtitle: 'Main wallet',
  },
];

export function walletParentContext(kind: WalletKind): 'personal' | 'business' {
  if (kind === 'business' || kind === 'sub_business') return 'business';
  return 'personal';
}
