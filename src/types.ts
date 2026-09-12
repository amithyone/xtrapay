export type ScreenType =
  | 'hub'
  | 'saving'
  | 'utility'
  | 'card'
  | 'history'
  | 'transfer'
  | 'receive'
  | 'paybills'
  | 'ask_money'
  | 'save_together'
  | 'terminals'
  | 'xpoints'
  | 'profile';

export type AccountContext = 'personal' | 'business';

export type TerminalStatus =
  | 'Active'
  | 'Inactive'
  | 'Offline'
  | 'Locked'
  | 'Pending';

export interface Terminal {
  id: string;
  terminalId: string;
  serialNumber: string;
  name: string;
  model: string;
  address: string;
  status: TerminalStatus;
  balance: number;
  dateMapped: string;
  lastTransaction: {
    label: string;
    at: string;
  };
  pendingAddress?: string;
  addressRequestStatus?: 'None' | 'Pending' | 'Approved' | 'Rejected';
}

export interface TerminalTx {
  id: string;
  terminalId: string;
  type: string;
  amount: number;
  status: 'Successful' | 'Failed' | 'Pending' | 'Reversed' | 'Declined';
  reference: string;
  date: string;
  time: string;
  commission?: number;
  xPoints?: number;
}

export interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  date: string; // e.g. "Today - 11 Sep 2026" or "Yesterday - 10 Sep 2026"
  timestamp: string; // e.g. "14:22" or "10:45 AM"
  fullTime?: string; // e.g. "16:12:02"
  amount: number;
  type: 'debit' | 'credit';
  status: 'Successful' | 'Settled' | 'Automated' | 'Delivered' | 'Processing' | 'SUCCESS' | string;
  category: 'transfer' | 'utility' | 'bill' | 'savings' | 'card' | 'p2p';
  reference: string;
  token?: string; // e.g. "4590-2391-4920-1182" for electricity
  bank?: string;
  recipient?: string;
  cardLast4?: string;
  cardUsdAmount?: string;
  note?: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  initials: string;
  bank: string;
  accountNumber: string;
  tier: string;
  colorClass: string;
}

export interface BillerCategory {
  id: string;
  name: string;
  icon: string;
  subtitle: string;
  active?: boolean;
}

export interface FrequentBiller {
  id: string;
  name: string;
  icon: string;
  subtitle: string;
  accountNumber: string;
  category: string;
  provider: string;
}

export interface ActiveProcessingTransfer {
  step: 1 | 2 | 3;
  amount: number;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  reference: string;
  narration?: string;
  initTime: string;
  processedTime: string;
  settledTime: string;
  isComplete: boolean;
}

export interface MoneyRequest {
  id: string;
  type: 'contact' | 'overdraft' | 'loan';
  requesterName: string;
  requesterPhone: string;
  recipientName: string;
  recipientPhone: string;
  amount: number;
  note?: string;
  date: string;
  timestamp: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Cancelled' | 'Expired';
  isIncoming: boolean;
  facilityKind?: 'overdraft' | 'loan';
  tenor?: string;
}

export interface PotMember {
  id: string;
  name: string;
  phone: string;
  initials: string;
  status: 'Active' | 'Pending' | 'Declined';
  contributed: number;
  share: number;
  isCreator?: boolean;
  avatarColor?: string;
}

export interface GroupPot {
  id: string;
  title: string;
  subtitle: string;
  targetAmount: number;
  raisedAmount: number;
  myStatus: 'Active' | 'Pending' | 'Declined';
  myContribution: number;
  frequency: string;
  members: PotMember[];
}

export interface NearbyPeer {
  id: string;
  name: string;
  device: string;
  distance: string;
  walletTag: string;
  avatarColor: string;
}

export interface ShopTerminal {
  id: string;
  name: string;
  terminalId: string;
  amount?: number;
  merchantCategory: string;
  rssi: string;
}
