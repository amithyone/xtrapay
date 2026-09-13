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
}

export const INITIAL_WALLETS: WalletAccount[] = [
  {
    id: 'personal',
    name: 'Personal account',
    kind: 'personal',
    accountNumber: '0124892019',
    bankName: 'Zenith Bank',
    balance: 0,
    subtitle: 'Main wallet',
  },
  {
    id: 'business',
    name: 'Business account',
    kind: 'business',
    accountNumber: '2048991204',
    bankName: 'Providus Bank',
    balance: 14_250_000,
    subtitle: 'Main business',
  },
  {
    id: 'sub-1',
    name: 'Rent wallet',
    kind: 'sub_personal',
    accountNumber: '0124892201',
    bankName: 'Zenith Bank',
    balance: 125_000,
    subtitle: 'Sub-account · Personal',
  },
  {
    id: 'sub-2',
    name: 'Market stall',
    kind: 'sub_business',
    accountNumber: '2048991308',
    bankName: 'Providus Bank',
    balance: 482_450.5,
    subtitle: 'Sub-account · Mini business',
  },
];

export function walletParentContext(kind: WalletKind): 'personal' | 'business' {
  if (kind === 'business' || kind === 'sub_business') return 'business';
  return 'personal';
}
