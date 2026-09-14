import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  ActiveProcessingTransfer,
  ScreenType,
  AccountContext,
  Transaction,
  MoneyRequest,
  GroupPot,
  NearbyPeer,
  ShopTerminal,
  Beneficiary,
  SavingsPlan,
  SavingsPlanType,
  SavingsSummary,
} from '../types';
import {
  PLACEHOLDER_WALLETS,
  walletParentContext,
  type WalletAccount,
} from '../data/wallets';
import { ApiError, getAccessToken, setAccessToken } from '../lib/api';
import {
  apiAcceptMoneyRequest,
  apiAcceptPot,
  apiBanks,
  apiBeneficiaries,
  apiAppConfig,
  apiBootstrap,
  type AppBranding,
  mapApiBranding,
  apiCancelMoneyRequest,
  apiContributePot,
  apiCreateMoneyRequest,
  apiCreatePot,
  apiCreateSavingsPlan,
  apiCreateTransfer,
  apiCreditOverview,
  apiDeclineMoneyRequest,
  apiDeclinePot,
  apiDeleteAccount,
  apiFlexibleDeposit,
  apiFlexibleWithdraw,
  apiLogout,
  apiMe,
  apiMoneyRequests,
  apiNotifications,
  isCreditTopUpNotification,
  isGroupSavingsNotification,
  isMoneyRequestNotification,
  apiPots,
  apiProximityPay,
  apiRequestLoan,
  apiRequestOverdraft,
  apiSavings,
  apiShopPay,
  apiStrictAutosave,
  apiSubmitKyc,
  apiTransactions,
  apiUpdateMe,
  apiVerifyPin,
  apiWallets,
  mapApiSavingsSummary,
  mapApiUserProfile,
  mapApiWallets,
  KYC_CUMULATIVE_THRESHOLD_NGN,
  type ApiBank,
  type AppNotification,
  type UserProfile,
} from '../lib/xtrapayApi';

const BENEFICIARY_COLORS = [
  'text-[#c0c1ff]',
  'text-[#4edea3]',
  'text-[#4cd7f6]',
  'text-[#8083ff]',
  'text-[#dfe2ee]',
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function mapApiBeneficiary(
  b: {
    id: string;
    name: string;
    initials?: string;
    bank: string;
    accountNumber: string;
    tier?: string | null;
    colorClass?: string | null;
  },
  index = 0
): Beneficiary {
  return {
    id: b.id,
    name: b.name,
    initials: b.initials || initialsFromName(b.name),
    bank: b.bank,
    accountNumber: b.accountNumber,
    tier: b.tier || 'Tier 1',
    colorClass: b.colorClass || BENEFICIARY_COLORS[index % BENEFICIARY_COLORS.length],
  };
}

interface ToastInfo {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
}

interface TransactionContextType {
  // Navigation
  activeScreen: ScreenType;
  setActiveScreen: (screen: ScreenType) => void;
  /** Prefill category when opening Pay Bills (airtime | data | electricity | …) */
  payBillsCategory: string | null;
  openPayBills: (category?: string) => void;
  clearPayBillsCategory: () => void;
  navigateBack: () => void;
  
  // Account State
  accountContext: AccountContext;
  setAccountContext: (ctx: AccountContext) => void;
  wallets: WalletAccount[];
  selectedWalletId: string;
  selectedWallet: WalletAccount;
  selectWallet: (id: string) => void;
  addWallet: (wallet: WalletAccount) => void;
  refreshBalances: () => Promise<void>;
  banks: ApiBank[];
  banksLoading: boolean;
  personalBalance: number;
  businessBalance: number;
  flexibleSavings: number;
  strictSavings: number;
  savingsPlans: SavingsPlan[];
  savingsMeta: {
    blendedApy: number;
    interestToday: number;
    lifetimeInterest: number;
  };
  refreshSavings: () => Promise<void>;
  createSavingsPlan: (params: {
    name: string;
    type: SavingsPlanType;
    initialAmount?: number;
    targetAmount?: number;
    maturityDate?: string;
    percentage?: number;
  }) => Promise<boolean>;
  dailySpent: number;
  dailyLimit: number;
  setDailySpent: (n: number) => void;
  setDailyLimit: (n: number) => void;
  /** Lifetime debit volume — KYC prompted at ≥ ₦50,000 */
  cumulativeSpent: number;
  setCumulativeSpent: (n: number) => void;
  /** True when KYC incomplete and cumulative spend ≥ threshold */
  kycPromptRequired: boolean;
  dismissKycPrompt: () => void;
  submitDeferredKyc: (payload: {
    idType: 'bvn' | 'nin';
    idNumber: string;
    dateOfBirth: string;
    gender: 'male' | 'female';
    address: string;
    city: string;
    state: string;
  }) => Promise<boolean>;
  cardFrozen: boolean;
  setCardFrozen: (frozen: boolean) => void;
  biometricsActive: boolean;
  setBiometricsActive: (active: boolean) => void;
  strictAutoSave: boolean;
  setStrictAutoSave: (enabled: boolean) => void;
  toggleStrictAutoSave: (enabled: boolean, percentage?: number) => Promise<void>;
  balanceHidden: boolean;
  setBalanceHidden: (hidden: boolean) => void;
  accountTier: string;
  kycStatus: string;
  accountFullName: string;
  userProfile: UserProfile | null;
  appBranding: AppBranding;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    patch: Parameters<typeof apiUpdateMe>[0]
  ) => Promise<boolean>;
  deleteAccount: (payload: { confirm: string; pin?: string }) => Promise<boolean>;

  // Auth
  isAuthenticated: boolean;
  authReady: boolean;
  hasSeenIntro: boolean;
  completeIntro: () => void;
  login: () => void;
  establishSession: (accessToken: string) => Promise<void>;
  logout: () => void;
  /** POS management requires verified transaction PIN once per session */
  posManagementUnlocked: boolean;
  unlockPosManagement: (pin: string) => Promise<boolean>;
  lockPosManagement: () => void;
  /** In-app alerts (top-ups / credits) from GET /notifications */
  notifications: AppNotification[];
  unreadNotificationCount: number;
  setUnreadNotificationCount: React.Dispatch<React.SetStateAction<number>>;
  refreshNotifications: () => Promise<void>;
  
  // Real-time Transactions
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  activeTransfer: ActiveProcessingTransfer | null;
  initiateTransfer: (params: {
    amount: number;
    recipientName: string;
    bankName: string;
    bankCode?: string;
    accountNumber?: string;
    phone?: string;
    channel?: 'bank' | 'wallet';
    narration?: string;
    pin: string;
    walletId?: string;
  }) => Promise<void>;
  dismissActiveTransfer: () => void;
  repeatTransfer: () => void;
  
  // Utility & Bill Payments
  payBill: (params: {
    billerName: string;
    provider: string;
    accountOrMeter: string;
    amount: number;
    category: string;
    autoRenew?: boolean;
  }) => string; // returns generated token or reference
  
  // Savings Actions
  quickSave: (amount: number) => Promise<boolean>;
  withdrawFlexible: (amount: number) => Promise<boolean>;
  
  // Real-time Inward Simulator
  simulateInwardTransfer: (amount?: number, sender?: string) => void;
  
  // Peer Money & Ask For Money
  moneyRequests: MoneyRequest[];
  refreshMoneyRequests: () => Promise<void>;
  sendMoneyRequest: (params: {
    recipientName: string;
    recipientPhone: string;
    amount: number;
    note?: string;
  }) => Promise<boolean>;
  requestFacility: (params: {
    kind: 'overdraft' | 'loan';
    amount: number;
    tenor?: string;
    pin?: string;
  }) => Promise<boolean>;
  acceptMoneyRequest: (requestId: string, pin: string) => Promise<boolean>;
  declineMoneyRequest: (requestId: string) => Promise<void>;
  cancelMoneyRequest: (requestId: string) => Promise<void>;
  overdraftLimit: number;

  // Group Savings (Save Together)
  groupPots: GroupPot[];
  createGroupPot: (params: {
    title: string;
    subtitle?: string;
    targetAmount: number;
    frequency: string;
    members: Array<{ name: string; phone: string }>;
  }) => Promise<boolean>;
  contributeToPot: (potId: string, amount: number, pin: string) => Promise<boolean>;
  acceptPotInvite: (potId: string) => Promise<void>;
  declinePotInvite: (potId: string) => Promise<void>;
  refreshPots: () => Promise<void>;

  // Proximity Pay Actions
  isNearbyPayOpen: boolean;
  setIsNearbyPayOpen: (open: boolean) => void;
  isPayAtShopOpen: boolean;
  setIsPayAtShopOpen: (open: boolean) => void;
  isScanToPayOpen: boolean;
  setIsScanToPayOpen: (open: boolean) => void;
  prefilledTransferData: {
    accountNumber?: string;
    bankName?: string;
    recipientName?: string;
    amount?: number;
    narration?: string;
  } | null;
  setPrefilledTransferData: (
    data: {
      accountNumber?: string;
      bankName?: string;
      recipientName?: string;
      amount?: number;
      narration?: string;
    } | null
  ) => void;
  executeNearbySend: (peer: NearbyPeer, amount: number, pin: string) => Promise<boolean>;
  executeShopPayment: (shop: ShopTerminal, amount: number, pin: string) => Promise<boolean>;

  // Modals & Overlays
  isQrOpen: boolean;
  setIsQrOpen: (open: boolean) => void;
  isShareOpen: boolean;
  setIsShareOpen: (open: boolean) => void;
  isSimulateOpen: boolean;
  setIsSimulateOpen: (open: boolean) => void;
  toast: ToastInfo | null;
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  dismissToast: () => void;

  // Theme (Dark / Light with Red Primary Accent)
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// Sound notification synthesizer using Web Audio API
function playChime(type: 'success' | 'pop') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

function getFormattedTime(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation
  const [activeScreen, setActiveScreenState] = useState<ScreenType>('hub');
  const [screenHistory, setScreenHistory] = useState<ScreenType[]>(['hub']);
  const [payBillsCategory, setPayBillsCategory] = useState<string | null>(null);

  const setActiveScreen = (screen: ScreenType) => {
    setScreenHistory(prev => [...prev, screen]);
    setActiveScreenState(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPayBills = (category?: string) => {
    setPayBillsCategory(category?.trim() || null);
    setActiveScreen('paybills');
  };

  const clearPayBillsCategory = () => setPayBillsCategory(null);

  const navigateBack = () => {
    if (screenHistory.length > 1) {
      const newHistory = [...screenHistory];
      newHistory.pop();
      const prev = newHistory[newHistory.length - 1];
      setScreenHistory(newHistory);
      setActiveScreenState(prev);
    } else {
      setActiveScreenState('hub');
    }
  };

  // Balances
  // Account
  const [accountContext, setAccountContextState] = useState<AccountContext>('personal');
  const [wallets, setWallets] = useState<WalletAccount[]>(PLACEHOLDER_WALLETS);
  const [banks, setBanks] = useState<ApiBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('personal');
  const [personalBalance, setPersonalBalance] = useState<number>(0);
  const [businessBalance, setBusinessBalance] = useState<number>(14250000.00);
  const [flexibleSavings, setFlexibleSavings] = useState<number>(0);
  const [strictSavings, setStrictSavings] = useState<number>(0);
  const [savingsPlans, setSavingsPlans] = useState<SavingsPlan[]>([]);
  const [savingsMeta, setSavingsMeta] = useState({
    blendedApy: 0,
    interestToday: 0,
    lifetimeInterest: 0,
  });
  const [dailySpent, setDailySpent] = useState<number>(0);
  const [dailyLimit, setDailyLimit] = useState<number>(5000000);
  const [cumulativeSpent, setCumulativeSpent] = useState<number>(0);
  const [kycPromptDismissed, setKycPromptDismissed] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const seenNotificationIds = React.useRef<Set<string>>(new Set());
  
  const [cardFrozen, setCardFrozen] = useState<boolean>(false);
  const [biometricsActive, setBiometricsActive] = useState<boolean>(true);
  const [strictAutoSave, setStrictAutoSave] = useState<boolean>(false);
  const [balanceHidden, setBalanceHidden] = useState<boolean>(false);
  const [accountTier, setAccountTier] = useState<string>('Tier 1');
  const [kycStatus, setKycStatus] = useState<string>('none');
  const [accountFullName, setAccountFullName] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [appBranding, setAppBranding] = useState<AppBranding>(() =>
    mapApiBranding(null)
  );

  const applyUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    if (profile.fullName) setAccountFullName(profile.fullName);
    if (profile.tier) setAccountTier(profile.tier);
    if (profile.kyc?.status) setKycStatus(profile.kyc.status);
  };

  const applySavingsSummary = (summary: SavingsSummary) => {
    setFlexibleSavings(summary.flexibleBalance);
    setStrictSavings(summary.strictBalance);
    setStrictAutoSave(Boolean(summary.strictAutoSave));
    setSavingsPlans(Array.isArray(summary.plans) ? summary.plans : []);
    setSavingsMeta({
      blendedApy: Number(summary.blendedApy ?? 0),
      interestToday: Number(summary.interestToday ?? 0),
      lifetimeInterest: Number(summary.lifetimeInterest ?? 0),
    });
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return Boolean(getAccessToken());
    } catch {
      return false;
    }
  });
  const [posManagementUnlocked, setPosManagementUnlocked] = useState(false);
  const [authReady, setAuthReady] = useState<boolean>(() => !getAccessToken());
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(() => {
    try {
      return localStorage.getItem('xtrapay_intro') === '1';
    } catch {
      return false;
    }
  });

  const completeIntro = () => {
    setHasSeenIntro(true);
    try {
      localStorage.setItem('xtrapay_intro', '1');
    } catch {
      // ignore
    }
  };

  const applyWalletBalances = (mapped: WalletAccount[]) => {
    if (!mapped.length) return;
    setWallets(prev => {
      // Preserve order/selection; update balances from server.
      const byId = new Map(mapped.map(w => [w.id, w]));
      const merged = prev.map(w => {
        const live = byId.get(w.id);
        return live ? { ...w, balance: live.balance, accountNumber: live.accountNumber, bankName: live.bankName } : w;
      });
      const missing = mapped.filter(w => !prev.some(p => p.id === w.id));
      return missing.length ? [...merged, ...missing] : merged;
    });
    const personal = mapped.find(w => w.kind === 'personal');
    const business = mapped.find(w => w.kind === 'business');
    if (personal) setPersonalBalance(personal.balance);
    if (business) setBusinessBalance(business.balance);
  };

  const refreshBalances = async () => {
    try {
      const list = await apiWallets();
      if (Array.isArray(list) && list.length) {
        applyWalletBalances(mapApiWallets(list));
      }
    } catch {
      // keep last known balances
    }
  };

  const applyBootstrap = async () => {
    const data = await apiBootstrap();
    if (data.branding) {
      setAppBranding(mapApiBranding(data.branding));
    }
    const mapped = mapApiWallets(data.wallets);
    const walletList = mapped.length ? mapped : PLACEHOLDER_WALLETS;
    setWallets(walletList);
    const selected =
      data.selectedWalletId && mapped.some(w => w.id === data.selectedWalletId)
        ? data.selectedWalletId
        : mapped.find(w => w.kind === 'personal')?.id ?? mapped[0]?.id ?? 'personal';
    setSelectedWalletId(selected);
    applyWalletBalances(walletList);
    applySavingsSummary({
      flexibleBalance: data.savings.flexibleBalance,
      strictBalance: data.savings.strictBalance,
      strictAutoSave: data.savings.strictAutoSave,
      plans: [],
    });
    setDailySpent(data.limits.dailySpent);
    setDailyLimit(data.limits.dailySpendCap);
    setCumulativeSpent(
      Number(
        data.limits.cumulativeSpent ??
          data.limits.cumulative_spent ??
          0
      )
    );
    setOverdraftLimit(data.overdraftLimit);
    setCardFrozen(data.cardFrozen);
    if (data.user) {
      applyUserProfile(mapApiUserProfile(data.user));
    }
    // Prefer full ledger; fall back to bootstrap recent slice.
    try {
      const ledger = await apiTransactions({ limit: 100 });
      setTransactions(Array.isArray(ledger) && ledger.length ? ledger : data.recentTransactions ?? []);
    } catch {
      setTransactions(
        Array.isArray(data.recentTransactions) ? data.recentTransactions : []
      );
    }
    setBanksLoading(true);
    try {
      const [list, bens] = await Promise.all([apiBanks(), apiBeneficiaries().catch(() => [])]);
      if (Array.isArray(list) && list.length) {
        setBanks(list);
      }
      if (Array.isArray(bens)) {
        setBeneficiaries(bens.map((b, i) => mapApiBeneficiary(b, i)));
      }
    } catch {
      // keep previous / fallback list
    } finally {
      setBanksLoading(false);
    }
    try {
      const pots = await apiPots();
      setGroupPots(Array.isArray(pots) ? pots : []);
    } catch {
      setGroupPots([]);
    }
    try {
      const [reqs, credit] = await Promise.all([
        apiMoneyRequests().catch(() => [] as MoneyRequest[]),
        apiCreditOverview().catch(() => null),
      ]);
      setMoneyRequests(Array.isArray(reqs) ? reqs : []);
      if (credit) {
        const limit = Number(credit.overdraftLimit ?? credit.overdraft_limit);
        if (!Number.isNaN(limit) && limit >= 0) setOverdraftLimit(limit);
      }
    } catch {
      setMoneyRequests([]);
    }
    try {
      const me = await apiMe();
      applyUserProfile(me);
    } catch {
      // bootstrap user is enough until Profile refresh
    }
    try {
      const savings = await apiSavings();
      applySavingsSummary(savings);
    } catch {
      // keep bootstrap savings balances
    }
  };

  const refreshProfile = async () => {
    try {
      const me = await apiMe();
      applyUserProfile(me);
    } catch {
      // keep last known profile
    }
  };

  const establishSession = async (accessToken: string) => {
    setAccessToken(accessToken);
    await applyBootstrap();
    setIsAuthenticated(true);
    setPosManagementUnlocked(false);
    setActiveScreenState('hub');
    setScreenHistory(['hub']);
    try {
      localStorage.setItem('xtrapay_auth', '1');
    } catch {
      // ignore
    }
  };

  const login = () => {
    setIsAuthenticated(true);
    setPosManagementUnlocked(false);
    setActiveScreenState('hub');
    setScreenHistory(['hub']);
    try {
      localStorage.setItem('xtrapay_auth', '1');
    } catch {
      // ignore
    }
  };

  const logout = () => {
    void apiLogout();
    setAccessToken(null);
    setIsAuthenticated(false);
    setPosManagementUnlocked(false);
    setUserProfile(null);
    setAccountFullName('');
    setWallets(PLACEHOLDER_WALLETS);
    setTransactions([]);
    setBeneficiaries([]);
    setBanks([]);
    setMoneyRequests([]);
    setGroupPots([]);
    setCumulativeSpent(0);
    setKycPromptDismissed(false);
    setNotifications([]);
    setUnreadNotificationCount(0);
    seenNotificationIds.current = new Set();
    setActiveScreenState('hub');
    setScreenHistory(['hub']);
    try {
      localStorage.removeItem('xtrapay_auth');
    } catch {
      // ignore
    }
  };

  const dismissKycPrompt = () => setKycPromptDismissed(true);

  const kycIncomplete =
    !kycStatus ||
    ['none', 'incomplete', 'unverified', 'rejected'].includes(kycStatus.toLowerCase());

  const kycPromptRequired =
    isAuthenticated &&
    kycIncomplete &&
    cumulativeSpent >= KYC_CUMULATIVE_THRESHOLD_NGN &&
    !kycPromptDismissed;

  const submitDeferredKyc = async (payload: {
    idType: 'bvn' | 'nin';
    idNumber: string;
    dateOfBirth: string;
    gender: 'male' | 'female';
    address: string;
    city: string;
    state: string;
  }): Promise<boolean> => {
    try {
      const res = await apiSubmitKyc(payload);
      if (res && typeof res === 'object' && 'fullName' in res) {
        applyUserProfile(mapApiUserProfile(res as Parameters<typeof mapApiUserProfile>[0]));
      } else if (res && typeof res === 'object' && 'user' in res && (res as { user?: unknown }).user) {
        applyUserProfile(
          mapApiUserProfile((res as { user: Parameters<typeof mapApiUserProfile>[0] }).user)
        );
      } else {
        await refreshProfile();
      }
      setKycPromptDismissed(true);
      showToast('KYC submitted', 'Identity verification is in progress.', 'success');
      return true;
    } catch (err) {
      showToast(
        'KYC failed',
        err instanceof ApiError ? err.message : 'Could not submit verification.',
        'warning'
      );
      return false;
    }
  };

  const unlockPosManagement = async (pin: string): Promise<boolean> => {
    try {
      await apiVerifyPin(pin);
      setPosManagementUnlocked(true);
      return true;
    } catch (err) {
      showToast(
        'PIN required',
        err instanceof ApiError ? err.message : 'Enter your set transaction PIN to open POS.',
        'warning'
      );
      return false;
    }
  };

  const lockPosManagement = () => setPosManagementUnlocked(false);

  const refreshNotifications = async () => {
    try {
      const res = await apiNotifications({ limit: 40 });
      setNotifications(res.items);
      setUnreadNotificationCount(res.unreadCount);
      for (const n of res.items) {
        seenNotificationIds.current.add(n.id);
      }
    } catch {
      // endpoint may not exist yet
    }
  };

  /** Soft poll for credit / money-request / group-savings alerts while signed in. */
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const poll = async (announceNew: boolean) => {
      try {
        const res = await apiNotifications({ limit: 40 });
        if (cancelled) return;

        const freshCredits: AppNotification[] = [];
        const freshMoneyRequests: AppNotification[] = [];
        const freshPots: AppNotification[] = [];
        for (const n of res.items) {
          if (!seenNotificationIds.current.has(n.id)) {
            seenNotificationIds.current.add(n.id);
            if (announceNew && !n.read) {
              if (isCreditTopUpNotification(n)) freshCredits.push(n);
              else if (isMoneyRequestNotification(n)) freshMoneyRequests.push(n);
              else if (isGroupSavingsNotification(n)) freshPots.push(n);
            }
          }
        }

        setNotifications(res.items);
        setUnreadNotificationCount(res.unreadCount);

        if (freshCredits.length) {
          void refreshBalances();
          for (const n of freshCredits) {
            const amountLabel =
              n.amount != null
                ? `₦${n.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : null;
            playChime('success');
            showToast(
              n.title || 'Money received',
              amountLabel
                ? `${amountLabel} credited${n.body ? ` · ${n.body}` : ''}`
                : n.body || 'Your wallet was topped up.',
              'success'
            );
          }
        }

        if (freshMoneyRequests.length) {
          void refreshMoneyRequests();
          for (const n of freshMoneyRequests) {
            playChime('pop');
            showToast(
              n.title || 'Money request',
              n.body || 'Someone asked you for money.',
              'info'
            );
          }
        }

        if (freshPots.length) {
          void refreshPots();
          for (const n of freshPots) {
            playChime('pop');
            showToast(
              n.title || 'Group savings',
              n.body || 'Update on a group pot.',
              'info'
            );
          }
        }
      } catch {
        // silent — backend may still be wiring /notifications
      }
    };

    // First load: seed seen IDs without toast spam
    void poll(false);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void poll(true);
    }, 12_000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void poll(true);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll helpers are stable enough for session lifetime
  }, [isAuthenticated]);

  useEffect(() => {
    void apiAppConfig()
      .then(setAppBranding)
      .catch(() => {
        /* keep default / bootstrap branding */
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const token = getAccessToken();
    if (!token) {
      setAuthReady(true);
      return;
    }
    (async () => {
      try {
        await applyBootstrap();
        if (!cancelled) {
          setIsAuthenticated(true);
        }
      } catch {
        setAccessToken(null);
        if (!cancelled) {
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedWallet =
    wallets.find(w => w.id === selectedWalletId) ?? wallets[0] ?? PLACEHOLDER_WALLETS[0];

  const selectWallet = (id: string) => {
    const wallet = wallets.find(w => w.id === id);
    if (!wallet) return;
    setSelectedWalletId(id);
    setAccountContextState(walletParentContext(wallet.kind));
  };

  const setAccountContext = (ctx: AccountContext) => {
    setAccountContextState(ctx);
    setSelectedWalletId(ctx);
  };

  const addWallet = (wallet: WalletAccount) => {
    setWallets(prev => [wallet, ...prev]);
  };

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);

  // Peer Money (Ask For Money & Overdraft/Loan) — live from API
  const [moneyRequests, setMoneyRequests] = useState<MoneyRequest[]>([]);
  const [overdraftLimit, setOverdraftLimit] = useState<number>(0);

  // Group Savings (Save Together)
  const [groupPots, setGroupPots] = useState<GroupPot[]>([]);

  // Proximity Pay States
  const [isNearbyPayOpen, setIsNearbyPayOpen] = useState<boolean>(false);
  const [isPayAtShopOpen, setIsPayAtShopOpen] = useState<boolean>(false);
  const [isScanToPayOpen, setIsScanToPayOpen] = useState<boolean>(false);
  const [prefilledTransferData, setPrefilledTransferData] = useState<{
    accountNumber?: string;
    bankName?: string;
    recipientName?: string;
    amount?: number;
    narration?: string;
  } | null>(null);

  // Modals & Active Transfer state
  const [activeTransfer, setActiveTransfer] = useState<ActiveProcessingTransfer | null>(null);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  // Theme state: default dark, persists in localStorage, toggles cleanly
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('xtrapay_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('xtrapay_theme', newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    showToast(
      next === 'light' ? 'Light Mode' : 'Dark Mode',
      next === 'light' ? 'Activated crisp light theme with crimson red primary accent.' : 'Activated deep institutional dark theme.',
      'info'
    );
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      body.classList.remove('bg-[#0f131c]', 'bg-[#0a0a0c]', 'bg-[#0c0806]', 'bg-[#1a0508]', 'text-[#dfe2ee]', 'text-[#f9fafb]', 'text-[#faf7f7]');
      body.classList.add('bg-[#f4f2f1]', 'text-black');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      body.classList.remove('bg-[#f8fafc]', 'bg-[#faf0ef]', 'bg-[#f4f2f1]', 'text-[#0f172a]', 'text-black');
      body.classList.add('bg-[#1a0508]', 'text-[#faf7f7]');
    }
  }, [theme]);

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString();
    setToast({ id, title, message, type });
    playChime('pop');
  };

  const dismissToast = () => setToast(null);

  const updateProfile = async (patch: Parameters<typeof apiUpdateMe>[0]): Promise<boolean> => {
    try {
      const me = await apiUpdateMe(patch);
      applyUserProfile(me);
      return true;
    } catch (err) {
      showToast(
        'Could not update profile',
        err instanceof ApiError ? err.message : 'Profile update failed.',
        'warning'
      );
      return false;
    }
  };

  const deleteAccount = async (payload: {
    confirm: string;
    pin?: string;
  }): Promise<boolean> => {
    try {
      await apiDeleteAccount(payload);
      logout();
      showToast(
        'Account deleted',
        'Your Xtrapay account deletion was submitted. You have been signed out.',
        'warning'
      );
      return true;
    } catch (err) {
      showToast(
        'Delete failed',
        err instanceof ApiError ? err.message : 'Could not delete account.',
        'warning'
      );
      return false;
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Live transfer via MevonPay — no client-side mock settlement
  const initiateTransfer = async ({
    amount,
    recipientName,
    bankName,
    bankCode,
    accountNumber,
    phone,
    channel = 'bank',
    narration,
    pin,
    walletId,
  }: {
    amount: number;
    recipientName: string;
    bankName: string;
    bankCode?: string;
    accountNumber?: string;
    phone?: string;
    channel?: 'bank' | 'wallet';
    narration?: string;
    pin: string;
    walletId?: string;
  }) => {
    const t1 = getFormattedTime();
    const pendingRef = `XTR-PENDING-${Date.now()}`;
    const displayAccount =
      channel === 'wallet' ? phone || accountNumber || '' : accountNumber || '';

    setActiveTransfer({
      step: 1,
      amount,
      recipientName,
      bankName: channel === 'wallet' ? bankName || 'Xtrapay Wallet' : bankName,
      accountNumber: displayAccount,
      reference: pendingRef,
      narration: narration || 'Instant Funds Transfer',
      channel,
      initTime: t1,
      processedTime: '',
      settledTime: '',
      isComplete: false,
    });
    playChime('pop');

    try {
      setActiveTransfer(prev =>
        prev ? { ...prev, step: 2, processedTime: getFormattedTime() } : null
      );

      const result = await apiCreateTransfer({
        walletId: walletId || selectedWalletId,
        channel,
        accountNumber: channel === 'bank' ? accountNumber : undefined,
        phone: channel === 'wallet' ? phone || accountNumber : undefined,
        bankName: channel === 'wallet' ? bankName || 'Xtrapay Wallet' : bankName,
        bankCode,
        amount,
        recipientName,
        narration,
        pin,
      });

      const t3 = getFormattedTime();
      setActiveTransfer({
        step: 3,
        amount: result.amount,
        recipientName: result.recipientName,
        bankName: result.bankName || (channel === 'wallet' ? 'Xtrapay Wallet' : bankName),
        accountNumber: result.accountNumber || displayAccount,
        reference: result.reference,
        narration: result.narration || narration || 'Instant Funds Transfer',
        channel,
        initTime: result.initTime || t1,
        processedTime: result.processedTime || t3,
        settledTime: result.settledTime || t3,
        isComplete: true,
      });

      if (typeof result.walletBalance === 'number') {
        const kind =
          wallets.find(w => w.id === (walletId || selectedWalletId))?.kind ?? 'personal';
        if (kind === 'personal') setPersonalBalance(result.walletBalance);
        else if (kind === 'business') setBusinessBalance(result.walletBalance);
        setWallets(prev =>
          prev.map(w =>
            w.id === (walletId || selectedWalletId)
              ? { ...w, balance: result.walletBalance as number }
              : w
          )
        );
      } else if (accountContext === 'personal') {
        setPersonalBalance(prev => Math.max(0, prev - amount));
      } else {
        setBusinessBalance(prev => Math.max(0, prev - amount));
      }
      setDailySpent(prev => prev + amount);

      const settledTx: Transaction = {
        id: `tx-${Date.now()}`,
        title: `Transfer to ${result.recipientName}`,
        subtitle: `${result.bankName} • ${(result.settledTime || t3).slice(0, 5)}`,
        date: `Today - ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
        timestamp: (result.settledTime || t3).slice(0, 5),
        fullTime: result.settledTime || t3,
        amount: result.amount,
        type: 'debit',
        status: 'Successful',
        category: 'transfer',
        reference: result.reference,
        bank: result.bankName,
        recipient: result.recipientName,
        accountNumber: result.accountNumber,
        note: result.narration || narration || 'Xtrapay Direct Settlement',
      };
      setTransactions(prev => [settledTx, ...prev]);

      // Keep Recent recipients in sync with real transfers (no mock list).
      const acct = result.accountNumber.replace(/\D/g, '');
      if (acct.length >= 10) {
        setBeneficiaries(prev => {
          const existing = prev.findIndex(b => b.accountNumber.replace(/\D/g, '') === acct);
          const next: Beneficiary = {
            id: existing >= 0 ? prev[existing].id : `ben-${acct}`,
            name: result.recipientName,
            initials: initialsFromName(result.recipientName),
            bank: result.bankName,
            accountNumber: acct,
            tier: existing >= 0 ? prev[existing].tier : 'Tier 1',
            colorClass:
              existing >= 0
                ? prev[existing].colorClass
                : BENEFICIARY_COLORS[prev.length % BENEFICIARY_COLORS.length],
          };
          if (existing >= 0) {
            const copy = [...prev];
            copy.splice(existing, 1);
            return [next, ...copy];
          }
          return [next, ...prev];
        });
      }

      void refreshBalances();
      playChime('success');
      showToast('Transfer Settled', `₦${amount.toLocaleString()} sent to ${result.recipientName}`);
    } catch (err) {
      setActiveTransfer(null);
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Transfer failed';
      showToast('Transfer failed', msg, 'warning');
      throw err;
    }
  };

  const dismissActiveTransfer = () => {
    setActiveTransfer(null);
    setActiveScreen('hub');
  };

  const repeatTransfer = () => {
    if (!activeTransfer) return;
    setPrefilledTransferData({
      accountNumber: activeTransfer.accountNumber,
      bankName: activeTransfer.bankName,
      recipientName: activeTransfer.recipientName,
      amount: activeTransfer.amount,
      narration: activeTransfer.narration,
    });
    setActiveTransfer(null);
    setActiveScreen('transfer');
    showToast(
      'Ready to edit',
      'Details refilled on Transfer — review and confirm when you want to send.',
      'info'
    );
  };

  // Pay bill logic with instant STS token generation
  const payBill = ({
    billerName,
    provider,
    accountOrMeter,
    amount,
    category,
    autoRenew,
  }: {
    billerName: string;
    provider: string;
    accountOrMeter: string;
    amount: number;
    category: string;
    autoRenew?: boolean;
  }): string => {
    // Generate token if electricity or activation code
    let generatedToken = '';
    if (category === 'electricity' || billerName.toLowerCase().includes('electric')) {
      const g1 = Math.floor(1000 + Math.random() * 9000);
      const g2 = Math.floor(1000 + Math.random() * 9000);
      const g3 = Math.floor(1000 + Math.random() * 9000);
      const g4 = Math.floor(1000 + Math.random() * 9000);
      generatedToken = `${g1}-${g2}-${g3}-${g4}`;
    } else {
      generatedToken = `ACT-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const t = getFormattedTime();
    const refCode = `XTR-${Math.floor(10000000 + Math.random() * 90000000)}`;

    if (accountContext === 'personal') {
      setPersonalBalance(prev => Math.max(0, prev - amount));
    } else {
      setBusinessBalance(prev => Math.max(0, prev - amount));
    }
    setDailySpent(prev => prev + amount);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: `${billerName} Prepaid`,
      subtitle: `${provider.slice(0, 16)} • ${t.slice(0, 5)}`,
      date: 'Today - 11 Sep 2026',
      timestamp: t.slice(0, 5),
      fullTime: t,
      amount,
      type: 'debit',
      status: 'Successful',
      category: 'bill',
      reference: refCode,
      token: generatedToken,
      note: autoRenew ? 'Auto-renew enabled 48h before units exhaust' : 'Instant token generated',
    };

    setTransactions(prev => [newTx, ...prev]);
    playChime('success');
    showToast('Bill Payment Successful', `Token: ${generatedToken}`);
    return generatedToken;
  };

  // Quick Save / withdraw — live flexible vault
  const refreshSavings = async () => {
    try {
      const savings = await apiSavings();
      applySavingsSummary(savings);
    } catch {
      // keep last known
    }
  };

  const createSavingsPlan = async (params: {
    name: string;
    type: SavingsPlanType;
    initialAmount?: number;
    targetAmount?: number;
    maturityDate?: string;
    percentage?: number;
  }): Promise<boolean> => {
    try {
      const plan = await apiCreateSavingsPlan(params);
      setSavingsPlans(prev => [plan, ...prev.filter(p => p.id !== plan.id)]);
      await refreshSavings();
      void refreshBalances();
      playChime('success');
      showToast('Plan created', `"${plan.name}" is ready.`);
      return true;
    } catch (err) {
      showToast(
        'Could not create plan',
        err instanceof ApiError ? err.message : 'Savings plans unavailable right now.',
        'warning'
      );
      return false;
    }
  };

  const toggleStrictAutoSave = async (enabled: boolean, percentage?: number) => {
    setStrictAutoSave(enabled);
    try {
      const summary = await apiStrictAutosave(enabled, percentage);
      applySavingsSummary(mapApiSavingsSummary(summary));
      showToast(
        'Auto-Save Rule',
        enabled ? 'Spend & save auto-route armed.' : 'Auto-save paused.'
      );
    } catch (err) {
      showToast(
        'Auto-save failed',
        err instanceof ApiError ? err.message : 'Could not update auto-save.',
        'warning'
      );
      void refreshSavings();
    }
  };

  const quickSave = async (amount: number): Promise<boolean> => {
    try {
      const summary = await apiFlexibleDeposit({ amount });
      applySavingsSummary(mapApiSavingsSummary(summary));
      void refreshBalances();
      playChime('success');
      showToast('Quick Save Confirmed', `+₦${amount.toLocaleString()} moved to Flexible Savings`);
      return true;
    } catch (err) {
      showToast(
        'Deposit failed',
        err instanceof ApiError ? err.message : 'Could not deposit to savings.',
        'warning'
      );
      return false;
    }
  };

  const withdrawFlexible = async (amount: number): Promise<boolean> => {
    try {
      const summary = await apiFlexibleWithdraw({ amount });
      applySavingsSummary(mapApiSavingsSummary(summary));
      void refreshBalances();
      playChime('success');
      showToast('Withdrawal Complete', `+₦${amount.toLocaleString()} returned to Personal Wallet`);
      return true;
    } catch (err) {
      showToast(
        'Withdrawal failed',
        err instanceof ApiError ? err.message : 'Could not withdraw from savings.',
        'warning'
      );
      return false;
    }
  };

  // Simulate real-time inbound payment
  const simulateInwardTransfer = (customAmount?: number, customSender?: string) => {
    const amount = customAmount || [25000, 50000, 100000, 250000][Math.floor(Math.random() * 4)];
    const sender = customSender || ['Tunde Bakare', 'David Adeleke', 'Chioma N.', 'KPMG Nigeria Settler', 'Zenith Bank Treasury'][Math.floor(Math.random() * 5)];
    const t = getFormattedTime();
    const refCode = `XTR-${Math.floor(10000000 + Math.random() * 90000000)}`;

    let creditedAmount = amount;
    let autoSaveDeduction = 0;

    // Strict auto-save calculation: 10% automatically saved if enabled
    if (strictAutoSave) {
      autoSaveDeduction = Math.round(amount * 0.10);
      creditedAmount = amount - autoSaveDeduction;
      setStrictSavings(prev => prev + autoSaveDeduction);
    }

    setPersonalBalance(prev => prev + creditedAmount);

    const creditTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: `Transfer from ${sender}`,
      subtitle: `Xtrapay Direct Inflow • ${t.slice(0, 5)}`,
      date: 'Today - 11 Sep 2026',
      timestamp: t.slice(0, 5),
      fullTime: t,
      amount,
      type: 'credit',
      status: 'Settled',
      category: 'p2p',
      reference: refCode,
      recipient: accountFullName || 'Account holder',
      note: 'Instant P2P Settlement Cleared',
    };

    const newTxs = [creditTx];

    if (autoSaveDeduction > 0) {
      newTxs.unshift({
        id: `tx-autosave-${Date.now()}`,
        title: 'Strict Auto-Save (10%)',
        subtitle: `Vault Auto-Lock • ${t.slice(0, 5)}`,
        date: 'Today - 11 Sep 2026',
        timestamp: t.slice(0, 5),
        fullTime: t,
        amount: autoSaveDeduction,
        type: 'debit',
        status: 'Automated',
        category: 'savings',
        reference: `XTR-AS-${Math.floor(100000 + Math.random() * 900000)}`,
        note: '10% rule on incoming wallet transfer',
      });
    }

    setTransactions(prev => [...newTxs, ...prev]);
    playChime('success');
    showToast(
      'Inward Transfer Received',
      `+₦${amount.toLocaleString()} received from ${sender}${autoSaveDeduction > 0 ? ` (₦${autoSaveDeduction.toLocaleString()} auto-saved)` : ''}`
    );
  };

  // Peer Money Actions (live)
  const refreshMoneyRequests = async () => {
    try {
      const [reqs, credit] = await Promise.all([
        apiMoneyRequests(),
        apiCreditOverview().catch(() => null),
      ]);
      setMoneyRequests(Array.isArray(reqs) ? reqs : []);
      if (credit) {
        const limit = Number(credit.overdraftLimit ?? credit.overdraft_limit);
        if (!Number.isNaN(limit) && limit >= 0) setOverdraftLimit(limit);
      }
    } catch {
      // keep last known list
    }
  };

  const sendMoneyRequest = async ({
    recipientName,
    recipientPhone,
    amount,
    note,
  }: {
    recipientName: string;
    recipientPhone: string;
    amount: number;
    note?: string;
  }): Promise<boolean> => {
    try {
      const req = await apiCreateMoneyRequest({
        recipientPhone,
        amount,
        note,
      });
      setMoneyRequests(prev => [req, ...prev.filter(r => r.id !== req.id)]);
      playChime('pop');
      showToast(
        'Request Dispatched',
        `₦${amount.toLocaleString()} requested from ${req.recipientName || recipientName}.`
      );
      return true;
    } catch (err) {
      showToast(
        'Could not send request',
        err instanceof ApiError ? err.message : 'Ask Money is unavailable right now.',
        'warning'
      );
      return false;
    }
  };

  const requestFacility = async ({
    kind,
    amount,
    tenor,
    pin,
  }: {
    kind: 'overdraft' | 'loan';
    amount: number;
    tenor?: string;
    pin?: string;
  }): Promise<boolean> => {
    try {
      if (kind === 'overdraft') {
        await apiRequestOverdraft({ amount, pin });
        const credit = await apiCreditOverview().catch(() => null);
        if (credit) {
          const limit = Number(credit.overdraftLimit ?? credit.overdraft_limit);
          if (!Number.isNaN(limit) && limit >= 0) setOverdraftLimit(limit);
        } else {
          setOverdraftLimit(prev => prev + amount);
        }
        playChime('success');
        showToast(
          'Overdraft requested',
          `₦${amount.toLocaleString()} overdraft facility submitted.`
        );
      } else {
        const res = await apiRequestLoan({ amount, tenor, pin });
        if (res.kind === 'request') {
          setMoneyRequests(prev => [res.request, ...prev.filter(r => r.id !== res.request.id)]);
        }
        void refreshBalances();
        playChime('success');
        showToast('Loan requested', `₦${amount.toLocaleString()} loan request submitted.`);
      }
      void refreshMoneyRequests();
      return true;
    } catch (err) {
      showToast(
        'Facility request failed',
        err instanceof ApiError ? err.message : 'Credit facilities unavailable right now.',
        'warning'
      );
      return false;
    }
  };

  const acceptMoneyRequest = async (requestId: string, pin: string): Promise<boolean> => {
    if (!pin || pin.length < 4) {
      showToast('Invalid PIN', 'Please enter your 4-digit security PIN.', 'warning');
      return false;
    }
    try {
      const req = await apiAcceptMoneyRequest(requestId, pin);
      setMoneyRequests(prev => prev.map(r => (r.id === requestId ? req : r)));
      void refreshBalances();
      playChime('success');
      showToast('Payment Sent', `₦${req.amount.toLocaleString()} paid to ${req.requesterName}.`);
      return true;
    } catch (err) {
      showToast(
        'Accept failed',
        err instanceof ApiError ? err.message : 'Could not settle this request.',
        'warning'
      );
      return false;
    }
  };

  const declineMoneyRequest = async (requestId: string) => {
    try {
      const req = await apiDeclineMoneyRequest(requestId);
      setMoneyRequests(prev => prev.map(r => (r.id === requestId ? req : r)));
      showToast('Request Declined', 'The request has been marked as declined.', 'info');
    } catch (err) {
      showToast(
        'Decline failed',
        err instanceof ApiError ? err.message : 'Could not decline this request.',
        'warning'
      );
    }
  };

  const cancelMoneyRequest = async (requestId: string) => {
    try {
      const req = await apiCancelMoneyRequest(requestId);
      setMoneyRequests(prev => prev.map(r => (r.id === requestId ? req : r)));
      showToast('Request Cancelled', 'Your money request was cancelled.', 'info');
    } catch (err) {
      showToast(
        'Cancel failed',
        err instanceof ApiError ? err.message : 'Could not cancel this request.',
        'warning'
      );
    }
  };

  // Group Pot Actions (Save Together)
  const refreshPots = async () => {
    try {
      const pots = await apiPots();
      setGroupPots(Array.isArray(pots) ? pots : []);
    } catch {
      // keep last known list
    }
  };

  const createGroupPot = async ({
    title,
    subtitle,
    targetAmount,
    frequency,
    members: inviteMembers,
  }: {
    title: string;
    subtitle?: string;
    targetAmount: number;
    frequency: string;
    members: Array<{ name: string; phone: string }>;
  }): Promise<boolean> => {
    try {
      const pot = await apiCreatePot({
        title,
        note: subtitle,
        targetAmount,
        memberPhones: inviteMembers.map(m => m.phone.replace(/\s+/g, '')),
        frequency,
      });
      setGroupPots(prev => [pot, ...prev.filter(p => p.id !== pot.id)]);
      playChime('success');
      showToast('Pot Created', `Group pot "${title}" active. Invitations sent.`);
      return true;
    } catch (err) {
      showToast(
        'Could not create pot',
        err instanceof ApiError ? err.message : 'Save Together is unavailable right now.',
        'warning'
      );
      return false;
    }
  };

  const contributeToPot = async (potId: string, amount: number, pin: string): Promise<boolean> => {
    if (!pin || pin.length < 4) {
      showToast('Invalid PIN', 'Enter 4-digit security PIN.', 'warning');
      return false;
    }
    try {
      const pot = await apiContributePot(potId, { amount, pin });
      setGroupPots(prev => prev.map(p => (p.id === potId ? pot : p)));
      void refreshBalances();
      playChime('success');
      showToast('Contribution Saved', `₦${amount.toLocaleString()} added to ${pot.title}.`);
      return true;
    } catch (err) {
      showToast(
        'Contribution failed',
        err instanceof ApiError ? err.message : 'Could not contribute to pot.',
        'warning'
      );
      return false;
    }
  };

  const acceptPotInvite = async (potId: string) => {
    try {
      const pot = await apiAcceptPot(potId);
      setGroupPots(prev => prev.map(p => (p.id === potId ? pot : p)));
      playChime('pop');
      showToast('Joined Pot', 'You joined the group savings pot.');
    } catch (err) {
      showToast(
        'Could not join',
        err instanceof ApiError ? err.message : 'Accept invite failed.',
        'warning'
      );
    }
  };

  const declinePotInvite = async (potId: string) => {
    try {
      const pot = await apiDeclinePot(potId);
      setGroupPots(prev => prev.map(p => (p.id === potId ? pot : p)));
      showToast('Invitation Declined', 'Pot invitation was declined.', 'info');
    } catch (err) {
      showToast(
        'Could not decline',
        err instanceof ApiError ? err.message : 'Decline invite failed.',
        'warning'
      );
    }
  };

  // Proximity Actions Execution
  const executeNearbySend = async (
    peer: NearbyPeer,
    amount: number,
    pin: string
  ): Promise<boolean> => {
    if (!pin || pin.length < 4) {
      showToast('Invalid PIN', 'Enter 4-digit PIN.', 'warning');
      return false;
    }
    const bleToken = peer.bleToken?.trim();
    if (!bleToken) {
      showToast('Missing token', 'Resolve a nearby wallet token before paying.', 'warning');
      return false;
    }
    try {
      const result = await apiProximityPay({
        bleToken,
        amount,
        pin,
        narration: `Nearby pay to ${peer.name}`,
      });
      if (typeof result.walletBalance === 'number') {
        setPersonalBalance(result.walletBalance);
      } else {
        void refreshBalances();
      }
      const t = getFormattedTime();
      setTransactions(prev => [
        {
          id: `tx-ble-${Date.now()}`,
          title: `Nearby to ${result.recipientName || peer.name}`,
          subtitle: `BLE Wallet Tap • ${t.slice(0, 5)}`,
          date: `Today - ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
          timestamp: t.slice(0, 5),
          fullTime: t,
          amount: result.amount ?? amount,
          type: 'debit',
          status: 'Successful',
          category: 'p2p',
          reference: result.reference,
          recipient: result.recipientName || peer.name,
          note: `Proximity Bluetooth LE transfer to ${peer.walletTag}`,
        },
        ...prev,
      ]);
      playChime('success');
      showToast(
        'Nearby Payment Sent',
        `₦${amount.toLocaleString()} sent to ${result.recipientName || peer.name}.`
      );
      return true;
    } catch (err) {
      showToast(
        'Nearby pay failed',
        err instanceof ApiError ? err.message : 'Could not complete nearby payment.',
        'warning'
      );
      return false;
    }
  };

  const executeShopPayment = async (
    shop: ShopTerminal,
    amount: number,
    pin: string
  ): Promise<boolean> => {
    if (!pin || pin.length < 4) {
      showToast('Invalid PIN', 'Enter 4-digit PIN.', 'warning');
      return false;
    }
    try {
      const result = await apiShopPay({
        sessionUuid: shop.sessionUuid,
        terminalId: shop.terminalId,
        accountNumber: shop.accountNumber,
        bankCode: shop.bankCode,
        amount,
        recipientName: shop.recipientName || shop.name,
        pin,
        idempotencyKey: shop.sessionUuid,
      });
      if (typeof result.walletBalance === 'number') {
        setPersonalBalance(result.walletBalance);
      } else {
        void refreshBalances();
      }
      const t = getFormattedTime();
      setTransactions(prev => [
        {
          id: `tx-shop-${Date.now()}`,
          title: shop.name,
          subtitle: `${shop.terminalId} • ${t.slice(0, 5)}`,
          date: `Today - ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
          timestamp: t.slice(0, 5),
          fullTime: t,
          amount: result.amount ?? amount,
          type: 'debit',
          status: 'Settled',
          category: 'transfer',
          reference: result.reference,
          recipient: shop.name,
          note: `Contactless till checkout (${shop.terminalId})`,
        },
        ...prev,
      ]);
      playChime('success');
      showToast('Shop Payment Settled', `₦${amount.toLocaleString()} paid to ${shop.name}.`);
      return true;
    } catch (err) {
      showToast(
        'Shop payment failed',
        err instanceof ApiError ? err.message : 'Could not pay this till.',
        'warning'
      );
      return false;
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        payBillsCategory,
        openPayBills,
        clearPayBillsCategory,
        navigateBack,
        accountContext,
        setAccountContext,
        wallets,
        selectedWalletId,
        selectedWallet,
        selectWallet,
        addWallet,
        refreshBalances,
        banks,
        banksLoading,
        personalBalance,
        businessBalance,
        flexibleSavings,
        strictSavings,
        savingsPlans,
        savingsMeta,
        refreshSavings,
        createSavingsPlan,
        dailySpent,
        dailyLimit,
        setDailySpent,
        setDailyLimit,
        cumulativeSpent,
        setCumulativeSpent,
        kycPromptRequired,
        dismissKycPrompt,
        submitDeferredKyc,
        cardFrozen,
        setCardFrozen,
        biometricsActive,
        setBiometricsActive,
        strictAutoSave,
        setStrictAutoSave,
        toggleStrictAutoSave,
        balanceHidden,
        setBalanceHidden,
        accountTier,
        kycStatus,
        accountFullName,
        userProfile,
        appBranding,
        refreshProfile,
        updateProfile,
        deleteAccount,
        isAuthenticated,
        authReady,
        hasSeenIntro,
        completeIntro,
        login,
        establishSession,
        logout,
        posManagementUnlocked,
        unlockPosManagement,
        lockPosManagement,
        notifications,
        unreadNotificationCount,
        setUnreadNotificationCount,
        refreshNotifications,
        transactions,
        beneficiaries,
        activeTransfer,
        initiateTransfer,
        dismissActiveTransfer,
        repeatTransfer,
        payBill,
        quickSave,
        withdrawFlexible,
        simulateInwardTransfer,
        moneyRequests,
        refreshMoneyRequests,
        sendMoneyRequest,
        requestFacility,
        acceptMoneyRequest,
        declineMoneyRequest,
        cancelMoneyRequest,
        overdraftLimit,
        groupPots,
        createGroupPot,
        contributeToPot,
        acceptPotInvite,
        declinePotInvite,
        refreshPots,
        isNearbyPayOpen,
        setIsNearbyPayOpen,
        isPayAtShopOpen,
        setIsPayAtShopOpen,
        isScanToPayOpen,
        setIsScanToPayOpen,
        prefilledTransferData,
        setPrefilledTransferData,
        executeNearbySend,
        executeShopPayment,
        isQrOpen,
        setIsQrOpen,
        isShareOpen,
        setIsShareOpen,
        isSimulateOpen,
        setIsSimulateOpen,
        toast,
        showToast,
        dismissToast,
        theme,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
