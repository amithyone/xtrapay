import { apiRequest, setAccessToken } from './api';
import type { WalletAccount } from '../data/wallets';
import type { Transaction } from '../types';

export type ApiUserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
};

export type ApiBootstrap = {
  user: ApiUserProfile;
  wallets: Array<{
    id: string;
    name: string;
    kind: WalletAccount['kind'];
    accountNumber: string;
    bankName: string;
    balance: number;
    subtitle: string;
    currency?: string;
  }>;
  selectedWalletId?: string;
  limits: {
    dailySpendCap: number;
    dailySpent: number;
    singleTxnCap: number;
    transferCap: number;
    posFloatCap: number;
  };
  savings: {
    flexibleBalance: number;
    strictBalance: number;
    strictAutoSave: boolean;
  };
  overdraftLimit: number;
  recentTransactions: Transaction[];
  cardFrozen: boolean;
  xpointsBalance: number;
};

export type AuthSession = {
  accessToken: string;
  tokenType?: string;
  user: ApiUserProfile;
};

export async function apiLogin(identifier: string, password: string) {
  const data = await apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function apiRegister(payload: {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}) {
  return apiRequest<{ registrationId: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiSubmitKyc(payload: {
  registrationId: string;
  idType: 'bvn' | 'nin';
  idNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  address: string;
  city: string;
  state: string;
}) {
  return apiRequest('/auth/kyc', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiSendOtp(destination: string, purpose: 'register' | 'login' | 'reset') {
  return apiRequest<{ demoCode?: string | null }>('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ destination, purpose }),
  });
}

export async function apiVerifyOtp(payload: {
  destination: string;
  purpose: 'register' | 'login' | 'reset';
  code: string;
  registrationId?: string;
}) {
  const data = await apiRequest<AuthSession>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function apiForgotPassword(identifier: string) {
  return apiRequest('/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  });
}

export async function apiResetPassword(payload: {
  identifier: string;
  otp: string;
  newPassword: string;
}) {
  const data = await apiRequest<AuthSession>('/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function apiBootstrap() {
  return apiRequest<ApiBootstrap>('/bootstrap');
}

export type ApiBank = {
  id: string;
  name: string;
  code: string;
};

export async function apiBanks() {
  return apiRequest<ApiBank[]>('/banks');
}

export async function apiNameEnquiry(payload: {
  accountNumber: string;
  bankCode?: string;
  bankName?: string;
}) {
  return apiRequest<{
    accountNumber: string;
    accountName: string;
    bankName?: string | null;
    bankCode?: string;
  }>('/transfers/name-enquiry', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type ApiTransferResult = {
  id: string;
  step: number;
  amount: number;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  reference: string;
  narration?: string | null;
  initTime: string;
  processedTime: string;
  settledTime: string;
  isComplete: boolean;
  bucket?: string;
  walletBalance?: number;
  responseCode?: string | null;
  providerMessage?: string;
};

export async function apiCreateTransfer(payload: {
  walletId?: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  amount: number;
  recipientName: string;
  narration?: string;
  pin: string;
}) {
  return apiRequest<ApiTransferResult>('/transfers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiLogout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // ignore network/logout errors
  } finally {
    setAccessToken(null);
  }
}

export function mapApiWallets(
  wallets: ApiBootstrap['wallets']
): WalletAccount[] {
  return wallets.map(w => ({
    id: w.id,
    name: w.name,
    kind: w.kind,
    accountNumber: w.accountNumber,
    bankName: w.bankName,
    balance: w.balance,
    subtitle: w.subtitle,
  }));
}
