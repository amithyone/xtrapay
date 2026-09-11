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
} from '../types';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_MONEY_REQUESTS,
  INITIAL_GROUP_POTS,
} from '../data/initialData';

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
  navigateBack: () => void;
  
  // Account State
  accountContext: AccountContext;
  setAccountContext: (ctx: AccountContext) => void;
  personalBalance: number;
  businessBalance: number;
  flexibleSavings: number;
  strictSavings: number;
  dailySpent: number;
  dailyLimit: number;
  cardFrozen: boolean;
  setCardFrozen: (frozen: boolean) => void;
  biometricsActive: boolean;
  setBiometricsActive: (active: boolean) => void;
  strictAutoSave: boolean;
  setStrictAutoSave: (enabled: boolean) => void;
  balanceHidden: boolean;
  setBalanceHidden: (hidden: boolean) => void;
  
  // Real-time Transactions
  transactions: Transaction[];
  activeTransfer: ActiveProcessingTransfer | null;
  initiateTransfer: (params: {
    amount: number;
    recipientName: string;
    bankName: string;
    accountNumber: string;
    narration?: string;
  }) => void;
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
  quickSave: (amount: number) => void;
  withdrawFlexible: (amount: number) => void;
  
  // Real-time Inward Simulator
  simulateInwardTransfer: (amount?: number, sender?: string) => void;
  
  // Peer Money & Ask For Money
  moneyRequests: MoneyRequest[];
  sendMoneyRequest: (params: {
    recipientName: string;
    recipientPhone: string;
    amount: number;
    note?: string;
  }) => void;
  requestFacility: (params: {
    kind: 'overdraft' | 'loan';
    amount: number;
    tenor?: string;
  }) => void;
  acceptMoneyRequest: (requestId: string, pin: string) => boolean;
  declineMoneyRequest: (requestId: string) => void;
  cancelMoneyRequest: (requestId: string) => void;
  overdraftLimit: number;

  // Group Savings (Save Together)
  groupPots: GroupPot[];
  createGroupPot: (params: {
    title: string;
    subtitle?: string;
    targetAmount: number;
    frequency: string;
    members: Array<{ name: string; phone: string }>;
  }) => void;
  contributeToPot: (potId: string, amount: number, pin: string) => boolean;
  acceptPotInvite: (potId: string) => void;
  declinePotInvite: (potId: string) => void;

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
  executeNearbySend: (peer: NearbyPeer, amount: number, pin: string) => boolean;
  executeShopPayment: (shop: ShopTerminal, amount: number, pin: string) => boolean;

  // Modals & Overlays
  isQrOpen: boolean;
  setIsQrOpen: (open: boolean) => void;
  isShareOpen: boolean;
  setIsShareOpen: (open: boolean) => void;
  isSimulateOpen: boolean;
  setIsSimulateOpen: (open: boolean) => void;
  toast: ToastInfo | null;
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;

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

  const setActiveScreen = (screen: ScreenType) => {
    setScreenHistory(prev => [...prev, screen]);
    setActiveScreenState(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
  const [accountContext, setAccountContext] = useState<AccountContext>('personal');
  const [personalBalance, setPersonalBalance] = useState<number>(4850240.00);
  const [businessBalance, setBusinessBalance] = useState<number>(14250000.00);
  const [flexibleSavings, setFlexibleSavings] = useState<number>(214558.04);
  const [strictSavings, setStrictSavings] = useState<number>(2250.00);
  const [dailySpent, setDailySpent] = useState<number>(2450000);
  const dailyLimit = 5000000;
  
  const [cardFrozen, setCardFrozen] = useState<boolean>(false);
  const [biometricsActive, setBiometricsActive] = useState<boolean>(true);
  const [strictAutoSave, setStrictAutoSave] = useState<boolean>(true);
  const [balanceHidden, setBalanceHidden] = useState<boolean>(false);

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Peer Money (Ask For Money & Overdraft/Loan)
  const [moneyRequests, setMoneyRequests] = useState<MoneyRequest[]>(INITIAL_MONEY_REQUESTS);
  const [overdraftLimit, setOverdraftLimit] = useState<number>(150000);

  // Group Savings (Save Together)
  const [groupPots, setGroupPots] = useState<GroupPot[]>(INITIAL_GROUP_POTS);

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

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Real-time transfer initiation & multi-stage settlement
  const initiateTransfer = ({
    amount,
    recipientName,
    bankName,
    accountNumber,
    narration,
  }: {
    amount: number;
    recipientName: string;
    bankName: string;
    accountNumber: string;
    narration?: string;
  }) => {
    const refCode = `XTR-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const t1 = getFormattedTime();

    // 1. Immediate balance deduction & Daily limit update
    if (accountContext === 'personal') {
      setPersonalBalance(prev => Math.max(0, prev - amount));
    } else {
      setBusinessBalance(prev => Math.max(0, prev - amount));
    }
    setDailySpent(prev => prev + amount);

    // 2. Setup active transfer progress stepper (Step 1)
    const transferObj: ActiveProcessingTransfer = {
      step: 1,
      amount,
      recipientName,
      bankName,
      accountNumber,
      reference: refCode,
      narration: narration || 'Instant Funds Transfer',
      initTime: t1,
      processedTime: '',
      settledTime: '',
      isComplete: false,
    };
    setActiveTransfer(transferObj);

    // Insert pending transaction at top
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: `Transfer to ${recipientName}`,
      subtitle: `${bankName} • ${t1.slice(0, 5)}`,
      date: 'Today - 11 Sep 2026',
      timestamp: t1.slice(0, 5),
      fullTime: t1,
      amount,
      type: 'debit',
      status: 'Processing',
      category: 'transfer',
      reference: refCode,
      bank: bankName,
      recipient: recipientName,
      note: narration || 'Xtrapay Direct Settlement',
    };
    setTransactions(prev => [newTx, ...prev]);
    playChime('pop');

    // Step 2: NIBSS switch processing (after 1.3s)
    setTimeout(() => {
      const t2 = getFormattedTime();
      setActiveTransfer(prev => prev ? { ...prev, step: 2, processedTime: t2 } : null);
      playChime('pop');
    }, 1300);

    // Step 3: Settled by recipient (after 2.6s)
    setTimeout(() => {
      const t3 = getFormattedTime();
      setActiveTransfer(prev => prev ? { ...prev, step: 3, settledTime: t3, isComplete: true } : null);
      setTransactions(prev =>
        prev.map(item =>
          item.reference === refCode
            ? { ...item, status: 'Successful', fullTime: t3 }
            : item
        )
      );
      playChime('success');
      showToast('Transfer Settled', `₦${amount.toLocaleString()} sent to ${recipientName}`);
    }, 2700);
  };

  const dismissActiveTransfer = () => {
    setActiveTransfer(null);
    setActiveScreen('hub');
  };

  const repeatTransfer = () => {
    if (!activeTransfer) return;
    initiateTransfer({
      amount: activeTransfer.amount,
      recipientName: activeTransfer.recipientName,
      bankName: activeTransfer.bankName,
      accountNumber: activeTransfer.accountNumber,
      narration: activeTransfer.narration,
    });
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

  // Quick Save logic
  const quickSave = (amount: number) => {
    if (personalBalance < amount) {
      showToast('Insufficient Balance', 'Wallet balance is too low for this save amount.', 'warning');
      return;
    }
    setPersonalBalance(prev => prev - amount);
    setFlexibleSavings(prev => prev + amount);

    const t = getFormattedTime();
    const refCode = `XTR-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: 'Flexible Quick Save',
      subtitle: `Savings Vault • ${t.slice(0, 5)}`,
      date: 'Today - 11 Sep 2026',
      timestamp: t.slice(0, 5),
      fullTime: t,
      amount,
      type: 'debit',
      status: 'Settled',
      category: 'savings',
      reference: refCode,
      note: 'Flexible deposit earning bonus interest',
    };

    setTransactions(prev => [newTx, ...prev]);
    playChime('success');
    showToast('Quick Save Confirmed', `+₦${amount.toLocaleString()} moved to Flexible Savings`);
  };

  // Withdraw from flexible savings
  const withdrawFlexible = (amount: number) => {
    if (flexibleSavings < amount) {
      showToast('Insufficient Flexible Savings', 'Amount exceeds flexible savings balance.', 'warning');
      return;
    }
    setFlexibleSavings(prev => prev - amount);
    setPersonalBalance(prev => prev + amount);

    const t = getFormattedTime();
    const refCode = `XTR-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: 'Flexible Savings Withdrawal',
      subtitle: `To Personal Wallet • ${t.slice(0, 5)}`,
      date: 'Today - 11 Sep 2026',
      timestamp: t.slice(0, 5),
      fullTime: t,
      amount,
      type: 'credit',
      status: 'Settled',
      category: 'savings',
      reference: refCode,
      note: 'Instant liquidity transfer to personal wallet',
    };

    setTransactions(prev => [newTx, ...prev]);
    playChime('success');
    showToast('Withdrawal Complete', `+₦${amount.toLocaleString()} returned to Personal Wallet`);
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
      recipient: 'Innocent Solomon',
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

  // Peer Money Actions
  const sendMoneyRequest = ({
    recipientName,
    recipientPhone,
    amount,
    note,
  }: {
    recipientName: string;
    recipientPhone: string;
    amount: number;
    note?: string;
  }) => {
    const newReq: MoneyRequest = {
      id: `req-${Date.now()}`,
      type: 'contact',
      requesterName: 'Tunde Bakare',
      requesterPhone: '0803 124 8920',
      recipientName,
      recipientPhone,
      amount,
      note,
      date: 'Today',
      timestamp: getFormattedTime().slice(0, 5),
      status: 'Pending',
      isIncoming: false,
    };
    setMoneyRequests(prev => [newReq, ...prev]);
    playChime('pop');
    showToast('Request Dispatched', `₦${amount.toLocaleString()} requested from ${recipientName}.`);
  };

  const requestFacility = ({
    kind,
    amount,
    tenor,
  }: {
    kind: 'overdraft' | 'loan';
    amount: number;
    tenor?: string;
  }) => {
    const t = getFormattedTime();
    if (kind === 'overdraft') {
      setOverdraftLimit(prev => prev + amount);
      playChime('success');
      showToast('Overdraft Approved', `₦${amount.toLocaleString()} overdraft facility activated on your wallet.`);
    } else {
      // Loan disbursed to personal balance
      setPersonalBalance(prev => prev + amount);
      const tx: Transaction = {
        id: `tx-loan-${Date.now()}`,
        title: 'Institutional Loan Disbursed',
        subtitle: `Checkout Credit Facility • ${t.slice(0, 5)}`,
        date: 'Today - 11 Sep 2026',
        timestamp: t.slice(0, 5),
        fullTime: t,
        amount,
        type: 'credit',
        status: 'Settled',
        category: 'transfer',
        reference: `XTR-LN-${Math.floor(100000 + Math.random() * 900000)}`,
        note: `Tenor: ${tenor || '30 days'} • 2.5% fixed interest`,
      };
      setTransactions(prev => [tx, ...prev]);
      playChime('success');
      showToast('Loan Disbursed', `₦${amount.toLocaleString()} credited to your wallet.`);
    }

    const newReq: MoneyRequest = {
      id: `req-fac-${Date.now()}`,
      type: kind,
      facilityKind: kind,
      requesterName: 'Tunde Bakare',
      requesterPhone: '0803 124 8920',
      recipientName: 'CheckoutNow Credit',
      recipientPhone: 'INSTITUTIONAL',
      amount,
      note: kind === 'overdraft' ? 'Wallet Overdraft Limit Extension' : `Personal Quick Loan (${tenor || '30 days'})`,
      date: 'Today',
      timestamp: t.slice(0, 5),
      status: 'Accepted',
      isIncoming: false,
      tenor,
    };
    setMoneyRequests(prev => [newReq, ...prev]);
  };

  const acceptMoneyRequest = (requestId: string, pin: string): boolean => {
    if (!pin || pin.length < 4) {
      showToast('Invalid PIN', 'Please enter your 4-digit security PIN.', 'warning');
      return false;
    }

    const req = moneyRequests.find(r => r.id === requestId);
    if (!req) return false;

    if (personalBalance < req.amount) {
      showToast('Insufficient Funds', 'Your balance cannot cover this request.', 'warning');
      return false;
    }

    // Deduct balance & record debit transaction
    setPersonalBalance(prev => prev - req.amount);
    setDailySpent(prev => prev + req.amount);

    const t = getFormattedTime();
    const tx: Transaction = {
      id: `tx-peer-${Date.now()}`,
      title: `Transfer to ${req.requesterName}`,
      subtitle: `Money Request Accepted • ${t.slice(0, 5)}`,
      date: 'Today - 11 Sep 2026',
      timestamp: t.slice(0, 5),
      fullTime: t,
      amount: req.amount,
      type: 'debit',
      status: 'Successful',
      category: 'p2p',
      reference: `XTR-REQ-${Math.floor(100000 + Math.random() * 900000)}`,
      recipient: req.requesterName,
      note: req.note || 'Settled peer money request',
    };
    setTransactions(prev => [tx, ...prev]);

    setMoneyRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'Accepted' as const } : r))
    );

    playChime('success');
    showToast('Payment Sent', `₦${req.amount.toLocaleString()} paid to ${req.requesterName}.`);
    return true;
  };

  const declineMoneyRequest = (requestId: string) => {
    setMoneyRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'Declined' as const } : r))
    );
    showToast('Request Declined', 'The request has been marked as declined.', 'info');
  };

  const cancelMoneyRequest = (requestId: string) => {
    setMoneyRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'Cancelled' as const } : r))
    );
    showToast('Request Cancelled', 'Your money request was cancelled.', 'info');
  };

  // Group Pot Actions (Save Together)
  const createGroupPot = ({
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
  }) => {
    const totalMemberCount = inviteMembers.length + 1; // including creator
    const perShare = Math.round(targetAmount / totalMemberCount);

    const fullMembers = [
      {
        id: `mem-creator-${Date.now()}`,
        name: 'Tunde Bakare (You)',
        phone: '0803 124 8920',
        initials: 'TB',
        status: 'Active' as const,
        contributed: 0,
        share: perShare,
        isCreator: true,
        avatarColor: 'bg-[#8083ff]/30 text-[#c0c1ff]',
      },
      ...inviteMembers.map((m, idx) => ({
        id: `mem-${idx}-${Date.now()}`,
        name: m.name,
        phone: m.phone,
        initials: m.name
          .split(' ')
          .map(w => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        status: 'Pending' as const,
        contributed: 0,
        share: perShare,
        avatarColor: 'bg-[#4edea3]/20 text-[#4edea3]',
      })),
    ];

    const newPot: GroupPot = {
      id: `pot-${Date.now()}`,
      title,
      subtitle: subtitle || 'Shared collaborative target pot',
      targetAmount,
      raisedAmount: 0,
      myStatus: 'Active',
      myContribution: 0,
      frequency,
      members: fullMembers,
    };

    setGroupPots(prev => [newPot, ...prev]);
    playChime('success');
    showToast('Pot Created', `Group pot "${title}" active. Invitations sent.`);
  };

  const contributeToPot = (potId: string, amount: number, pin: string): boolean => {
    if (!pin || pin.length < 4) {
      showToast('Invalid PIN', 'Enter 4-digit security PIN.', 'warning');
      return false;
    }
    if (personalBalance < amount) {
      showToast('Insufficient Funds', 'Transfer exceeds wallet balance.', 'warning');
      return false;
    }

    setPersonalBalance(prev => prev - amount);
    const t = getFormattedTime();
    const pot = groupPots.find(p => p.id === potId);
    const potTitle = pot?.title || 'Group Pot';

    const tx: Transaction = {
      id: `tx-pot-${Date.now()}`,
      title: `Contribution: ${potTitle}`,
      subtitle: `Save Together Pot • ${t.slice(0, 5)}`,
      date: 'Today - 11 Sep 2026',
      timestamp: t.slice(0, 5),
      fullTime: t,
      amount,
      type: 'debit',
      status: 'Successful',
      category: 'savings',
      reference: `XTR-POT-${Math.floor(100000 + Math.random() * 900000)}`,
      note: `Contribution towards ${potTitle}`,
    };
    setTransactions(prev => [tx, ...prev]);

    setGroupPots(prev =>
      prev.map(p => {
        if (p.id !== potId) return p;
        return {
          ...p,
          raisedAmount: p.raisedAmount + amount,
          myContribution: p.myContribution + amount,
          members: p.members.map(m =>
            m.isCreator || m.name.includes('You')
              ? { ...m, contributed: m.contributed + amount }
              : m
          ),
        };
      })
    );

    playChime('success');
    showToast('Contribution Saved', `₦${amount.toLocaleString()} added to ${potTitle}.`);
    return true;
  };

  const acceptPotInvite = (potId: string) => {
    setGroupPots(prev =>
      prev.map(p => (p.id === potId ? { ...p, myStatus: 'Active' as const } : p))
    );
    playChime('pop');
    showToast('Joined Pot', 'You joined the group savings pot.');
  };

  const declinePotInvite = (potId: string) => {
    setGroupPots(prev =>
      prev.map(p => (p.id === potId ? { ...p, myStatus: 'Declined' as const } : p))
    );
    showToast('Invitation Declined', 'Pot invitation was declined.', 'info');
  };

  // Proximity Actions Execution
  const executeNearbySend = (peer: NearbyPeer, amount: number, pin: string): boolean => {
    if (!pin || pin.length < 4) {
      showToast('Invalid PIN', 'Enter 4-digit PIN.', 'warning');
      return false;
    }
    if (personalBalance < amount) {
      showToast('Insufficient Funds', 'Transfer exceeds wallet balance.', 'warning');
      return false;
    }

    setPersonalBalance(prev => prev - amount);
    setDailySpent(prev => prev + amount);

    const t = getFormattedTime();
    const tx: Transaction = {
      id: `tx-ble-${Date.now()}`,
      title: `Nearby to ${peer.name}`,
      subtitle: `BLE Wallet Tap • ${t.slice(0, 5)}`,
      date: 'Today - 11 Sep 2026',
      timestamp: t.slice(0, 5),
      fullTime: t,
      amount,
      type: 'debit',
      status: 'Successful',
      category: 'p2p',
      reference: `XTR-BLE-${Math.floor(100000 + Math.random() * 900000)}`,
      recipient: peer.name,
      note: `Proximity Bluetooth LE transfer to ${peer.walletTag}`,
    };
    setTransactions(prev => [tx, ...prev]);

    playChime('success');
    showToast('Nearby Payment Sent', `₦${amount.toLocaleString()} sent to ${peer.name}.`);
    return true;
  };

  const executeShopPayment = (shop: ShopTerminal, amount: number, pin: string): boolean => {
    if (!pin || pin.length < 4) {
      showToast('Invalid PIN', 'Enter 4-digit PIN.', 'warning');
      return false;
    }
    if (personalBalance < amount) {
      showToast('Insufficient Funds', 'Transfer exceeds wallet balance.', 'warning');
      return false;
    }

    setPersonalBalance(prev => prev - amount);
    setDailySpent(prev => prev + amount);

    const t = getFormattedTime();
    const tx: Transaction = {
      id: `tx-shop-${Date.now()}`,
      title: shop.name,
      subtitle: `${shop.terminalId} • ${t.slice(0, 5)}`,
      date: 'Today - 11 Sep 2026',
      timestamp: t.slice(0, 5),
      fullTime: t,
      amount,
      type: 'debit',
      status: 'Settled',
      category: 'transfer',
      reference: `XTR-POS-${Math.floor(100000 + Math.random() * 900000)}`,
      recipient: shop.name,
      note: `Contactless till checkout (${shop.terminalId})`,
    };
    setTransactions(prev => [tx, ...prev]);

    playChime('success');
    showToast('Shop Payment Settled', `₦${amount.toLocaleString()} paid to ${shop.name}.`);
    return true;
  };

  return (
    <TransactionContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        navigateBack,
        accountContext,
        setAccountContext,
        personalBalance,
        businessBalance,
        flexibleSavings,
        strictSavings,
        dailySpent,
        dailyLimit,
        cardFrozen,
        setCardFrozen,
        biometricsActive,
        setBiometricsActive,
        strictAutoSave,
        setStrictAutoSave,
        balanceHidden,
        setBalanceHidden,
        transactions,
        activeTransfer,
        initiateTransfer,
        dismissActiveTransfer,
        repeatTransfer,
        payBill,
        quickSave,
        withdrawFlexible,
        simulateInwardTransfer,
        moneyRequests,
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
