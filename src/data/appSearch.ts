import type { ScreenType } from '../types';

export type AppSearchAction =
  | { type: 'screen'; screen: ScreenType }
  | { type: 'toast'; title: string; message: string; tone?: 'success' | 'info' | 'warning' };

export interface AppSearchItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  /** Space-joined aliases for deep matching */
  keywords: string;
  action: AppSearchAction;
}

/** Deep app catalogue — screens, tools, KYC, POS ops, payments, settings. */
export const APP_SEARCH_CATALOG: AppSearchItem[] = [
  // Home & wallets
  {
    id: 'home',
    title: 'Home',
    subtitle: 'Wallet overview & quick actions',
    icon: 'home',
    keywords: 'home hub dashboard balance wallet overview',
    action: { type: 'screen', screen: 'hub' },
  },
  {
    id: 'receive',
    title: 'Receive money',
    subtitle: 'Account number, QR & share',
    icon: 'arrow_downward',
    keywords: 'receive deposit fund account number qr share inflow credit',
    action: { type: 'screen', screen: 'receive' },
  },
  {
    id: 'history',
    title: 'Transaction history',
    subtitle: 'All debits, credits & receipts',
    icon: 'receipt_long',
    keywords: 'history transactions ledger receipt ref token statement trail',
    action: { type: 'screen', screen: 'history' },
  },

  // Pay
  {
    id: 'pay',
    title: 'Pay',
    subtitle: 'Transfers, airtime, data & bills',
    icon: 'swap_horiz',
    keywords: 'pay payment send money limits daily limit',
    action: { type: 'screen', screen: 'pay' },
  },
  {
    id: 'transfer',
    title: 'Transfer',
    subtitle: 'Bank, Xtrapay & wallet transfer',
    icon: 'swap_horiz',
    keywords: 'transfer send bank nip account name enquiry remita',
    action: { type: 'screen', screen: 'transfer' },
  },
  {
    id: 'airtime',
    title: 'Airtime',
    subtitle: 'MTN, Airtel, Glo, 9mobile',
    icon: 'smartphone',
    keywords: 'airtime recharge topup mtn airtel glo 9mobile mobile',
    action: { type: 'screen', screen: 'airtime' },
  },
  {
    id: 'data',
    title: 'Data',
    subtitle: 'Mobile data bundles',
    icon: 'wifi',
    keywords: 'data bundle mtn airtel glo 9mobile internet',
    action: { type: 'screen', screen: 'data' },
  },
  {
    id: 'bills',
    title: 'Pay bills',
    subtitle: 'Electricity, TV, tolls & more',
    icon: 'receipt_long',
    keywords: 'bills electricity disco ikedc dstv gotv cable toll remita betting broadband',
    action: { type: 'screen', screen: 'paybills' },
  },

  // Services grid
  {
    id: 'services',
    title: 'Services',
    subtitle: 'Agent toolkit & utilities',
    icon: 'grid_view',
    keywords: 'services tools agent toolkit',
    action: { type: 'screen', screen: 'services' },
  },
  {
    id: 'pos',
    title: 'POS & terminals',
    subtitle: 'Manage devices, float & sweep',
    icon: 'point_of_sale',
    keywords: 'pos terminal device float sweep fund withdraw lock unlock serial',
    action: { type: 'screen', screen: 'terminals' },
  },
  {
    id: 'sweep',
    title: 'Sweep POS',
    subtitle: 'Withdraw float from one or all POS',
    icon: 'arrow_upward',
    keywords: 'sweep withdraw all pos float cashout',
    action: { type: 'screen', screen: 'terminals' },
  },
  {
    id: 'loans',
    title: 'Loans',
    subtitle: 'Request facilities & collect repayments',
    icon: 'hand_coins',
    keywords: 'loan overdraft credit facility working capital request repay',
    action: { type: 'screen', screen: 'loans' },
  },
  {
    id: 'loan_request',
    title: 'Loan request',
    subtitle: 'Borrow working capital to wallet',
    icon: 'hand_coins',
    keywords: 'loan request borrow facility tenor',
    action: { type: 'screen', screen: 'loans' },
  },
  {
    id: 'loan_repay',
    title: 'Repay loan',
    subtitle: 'Pay outstanding from your wallet',
    icon: 'payments',
    keywords: 'loan repay repayment settle outstanding wallet',
    action: { type: 'screen', screen: 'loans' },
  },
  {
    id: 'network',
    title: 'Network status',
    subtitle: 'Rails uptime, latency & success rates',
    icon: 'cell_tower',
    keywords: 'network ussd nip card rails health downtime success latency runtime backend',
    action: { type: 'screen', screen: 'network' },
  },
  {
    id: 'limits',
    title: 'Limit settings',
    subtitle: 'Daily, transfer, POS & single caps',
    icon: 'sliders',
    keywords: 'limits daily spend cap transaction limit settings risk',
    action: { type: 'screen', screen: 'limits' },
  },
  {
    id: 'settlement',
    title: 'Settlement',
    subtitle: 'Bank payout cut-offs & instant settle',
    icon: 'account_balance',
    keywords: 'settlement payout bank zenith providus cut-off instant',
    action: { type: 'screen', screen: 'settlement' },
  },
  {
    id: 'utilities',
    title: 'Utilities & analytics',
    subtitle: 'Cash flow and statements export',
    icon: 'bolt',
    keywords: 'utilities analytics cashflow statement export radar',
    action: { type: 'screen', screen: 'utility' },
  },
  {
    id: 'statement',
    title: 'Statements',
    subtitle: 'Wallet, savings, card & POS PDF/CSV',
    icon: 'file_text',
    keywords: 'statement download pdf csv audit tax pos wallet savings card',
    action: { type: 'screen', screen: 'statement' },
  },
  {
    id: 'cards',
    title: 'Cards',
    subtitle: 'Virtual & dollar cards',
    icon: 'credit_card',
    keywords: 'card dollar usd virtual freeze pin spend',
    action: { type: 'screen', screen: 'card' },
  },
  {
    id: 'recurring',
    title: 'Recurring payments',
    subtitle: 'Set up auto-debits',
    icon: 'autorenew',
    keywords: 'recurring auto debit standing order schedule rent subscription',
    action: { type: 'screen', screen: 'recurring' },
  },
  {
    id: 'business_accounts',
    title: 'Business accounts',
    subtitle: 'Open and manage business wallets',
    icon: 'domain',
    keywords: 'business account open register company merchant store shop',
    action: { type: 'screen', screen: 'business_accounts' },
  },
  {
    id: 'sub_accounts',
    title: 'Sub-accounts',
    subtitle: 'Personal & mini business wallets under main profile',
    icon: 'call_split',
    keywords:
      'sub account subaccount mini business branch wallet tier 3 personal business kyc inherited',
    action: { type: 'screen', screen: 'sub_accounts' },
  },
  {
    id: 'xpoints',
    title: 'X-Points',
    subtitle: 'Earn and redeem rewards',
    icon: 'toll',
    keywords: 'xpoints points rewards redeem commission',
    action: { type: 'screen', screen: 'xpoints' },
  },
  {
    id: 'referrals',
    title: 'Referral',
    subtitle: 'Invite friends and earn bonuses',
    icon: 'gift',
    keywords: 'referral refer invite code bonus leaderboard share paycode',
    action: { type: 'screen', screen: 'referrals' },
  },
  {
    id: 'request',
    title: 'Request money',
    subtitle: 'Ask peers or share a link',
    icon: 'request_quote',
    keywords: 'request ask money peer payment link invoice',
    action: { type: 'screen', screen: 'ask_money' },
  },
  {
    id: 'support',
    title: 'Support',
    subtitle: '24/7 concierge desk',
    icon: 'support_agent',
    keywords: 'support help concierge ticket chat agent',
    action: { type: 'screen', screen: 'support' },
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'Profile, security & preferences',
    icon: 'settings',
    keywords: 'settings preferences theme language appearance',
    action: { type: 'screen', screen: 'profile' },
  },
  {
    id: 'terms',
    title: 'Terms of use',
    subtitle: 'Xtrapay legal terms',
    icon: 'file_text',
    keywords: 'terms of use legal agreement policy',
    action: { type: 'screen', screen: 'terms' },
  },
  {
    id: 'privacy',
    title: 'Privacy policy',
    subtitle: 'How we use your data',
    icon: 'shield',
    keywords: 'privacy policy data protection gdpr',
    action: { type: 'screen', screen: 'privacy' },
  },
  {
    id: 'checkoutnow',
    title: 'CheckoutNow',
    subtitle: 'Technology partner powering Xtrapay',
    icon: 'sparkles',
    keywords: 'checkoutnow powered by licence xtratech partner',
    action: { type: 'screen', screen: 'checkoutnow' },
  },
  {
    id: 'delete_account',
    title: 'Delete account',
    subtitle: 'Close your Xtrapay wallet permanently',
    icon: 'delete',
    keywords: 'delete account close remove deactivate',
    action: { type: 'screen', screen: 'profile' },
  },

  // Save
  {
    id: 'save',
    title: 'Savings',
    subtitle: 'Flexible & locked savings',
    icon: 'savings',
    keywords: 'save savings pot flexible strict autosave',
    action: { type: 'screen', screen: 'saving' },
  },
  {
    id: 'group',
    title: 'Group savings',
    subtitle: 'Save together with peers',
    icon: 'groups',
    keywords: 'group savings save together ajo esusu',
    action: { type: 'screen', screen: 'save_together' },
  },

  // Profile / KYC deep links
  {
    id: 'profile',
    title: 'Profile',
    subtitle: 'Name, email, phone & address',
    icon: 'person',
    keywords: 'profile account name email phone address dob',
    action: { type: 'screen', screen: 'profile' },
  },
  {
    id: 'bvn',
    title: 'BVN',
    subtitle: 'Bank Verification Number',
    icon: 'shield',
    keywords: 'bvn bank verification kyc identity',
    action: { type: 'screen', screen: 'profile' },
  },
  {
    id: 'nin',
    title: 'NIN',
    subtitle: 'National Identification Number',
    icon: 'verified_user',
    keywords: 'nin national identity kyc',
    action: { type: 'screen', screen: 'profile' },
  },
  {
    id: 'biometric',
    title: 'Biometrics',
    subtitle: 'Fingerprint & Face ID',
    icon: 'fingerprint',
    keywords: 'biometric fingerprint face id unlock security pin password',
    action: { type: 'screen', screen: 'profile' },
  },
  {
    id: 'notifications',
    title: 'Notifications',
    subtitle: 'Push, SMS & email alerts',
    icon: 'notifications',
    keywords: 'notifications push sms email alerts login promo',
    action: { type: 'screen', screen: 'notifications' },
  },
];

export function searchAppCatalog(query: string, limit = 24): AppSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = APP_SEARCH_CATALOG.map(item => {
    const hay = `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase();
    let score = 0;
    if (item.title.toLowerCase().startsWith(q)) score += 40;
    if (item.title.toLowerCase().includes(q)) score += 20;
    if (hay.includes(q)) score += 12;
    for (const t of tokens) {
      if (hay.includes(t)) score += 8;
      else score -= 4;
    }
    return { item, score };
  })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));

  return scored.slice(0, limit).map(r => r.item);
}
