import { ApiError, apiRequest, setAccessToken } from './api';
import type { WalletAccount } from '../data/wallets';
import type { Transaction } from '../types';

export type ApiUserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  dateOfBirth?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  tier?: string;
  pinSet?: boolean;
  customerId?: string | null;
  customer_id?: string | null;
  passwordChangedAt?: string | null;
  password_changed_at?: string | null;
  linkedBanks?: string[] | null;
  linked_banks?: string[] | null;
  kyc?: {
    status?: string | null;
    idType?: string | null;
    id_type?: string | null;
    bvnMasked?: string | null;
    bvn_masked?: string | null;
    ninMasked?: string | null;
    nin_masked?: string | null;
  };
  agent?: {
    code?: string | null;
    aggregator?: string | null;
    active?: boolean | null;
  } | null;
  preferences?: {
    theme?: 'dark' | 'light' | null;
    biometrics?: boolean | null;
    faceId?: boolean | null;
    face_id?: boolean | null;
    requirePinAlways?: boolean | null;
    require_pin_always?: boolean | null;
    sessionTimeoutMin?: number | null;
    session_timeout_min?: number | null;
    push?: boolean | null;
    sms?: boolean | null;
    emailNotif?: boolean | null;
    email_notif?: boolean | null;
    txnAlerts?: boolean | null;
    txn_alerts?: boolean | null;
    promo?: boolean | null;
    loginAlerts?: boolean | null;
    login_alerts?: boolean | null;
    language?: string | null;
    currency?: string | null;
  } | null;
};

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  dateOfBirth: string;
  gender: string;
  tier: string;
  pinSet: boolean;
  customerId: string;
  passwordChangedAt: string;
  linkedBanks: string[];
  kyc: {
    status: string;
    idType: string;
    bvnMasked: string;
    ninMasked: string;
  };
  agent: {
    code: string;
    aggregator: string;
    active: boolean;
  } | null;
  preferences: {
    biometrics: boolean;
    faceId: boolean;
    requirePinAlways: boolean;
    sessionTimeoutMin: number;
    push: boolean;
    sms: boolean;
    emailNotif: boolean;
    txnAlerts: boolean;
    promo: boolean;
    loginAlerts: boolean;
    language: string;
    currency: string;
  };
};

export function mapApiUserProfile(raw: ApiUserProfile): UserProfile {
  const prefs = raw.preferences || {};
  const timeout = Number(prefs.sessionTimeoutMin ?? prefs.session_timeout_min ?? 5);
  return {
    id: String(raw.id || ''),
    fullName: String(raw.fullName || ''),
    email: String(raw.email || ''),
    phone: String(raw.phone || ''),
    address: String(raw.address || ''),
    city: String(raw.city || ''),
    state: String(raw.state || ''),
    dateOfBirth: String(raw.dateOfBirth ?? raw.date_of_birth ?? ''),
    gender: String(raw.gender || ''),
    tier: String(raw.tier || 'Tier 1'),
    pinSet: Boolean(raw.pinSet),
    customerId: String(raw.customerId ?? raw.customer_id ?? raw.agent?.code ?? ''),
    passwordChangedAt: String(raw.passwordChangedAt ?? raw.password_changed_at ?? ''),
    linkedBanks: Array.isArray(raw.linkedBanks)
      ? raw.linkedBanks.map(String)
      : Array.isArray(raw.linked_banks)
        ? raw.linked_banks.map(String)
        : [],
    kyc: {
      status: String(raw.kyc?.status || 'none'),
      idType: String(raw.kyc?.idType ?? raw.kyc?.id_type ?? ''),
      bvnMasked: String(raw.kyc?.bvnMasked ?? raw.kyc?.bvn_masked ?? ''),
      ninMasked: String(raw.kyc?.ninMasked ?? raw.kyc?.nin_masked ?? ''),
    },
    agent: raw.agent
      ? {
          code: String(raw.agent.code || ''),
          aggregator: String(raw.agent.aggregator || ''),
          active: Boolean(raw.agent.active),
        }
      : null,
    preferences: {
      biometrics: prefs.biometrics !== false,
      faceId: (prefs.faceId ?? prefs.face_id) !== false,
      requirePinAlways: (prefs.requirePinAlways ?? prefs.require_pin_always) !== false,
      sessionTimeoutMin: Number.isFinite(timeout) && timeout >= 0 ? timeout : 5,
      push: prefs.push !== false,
      sms: prefs.sms !== false,
      emailNotif: Boolean(prefs.emailNotif ?? prefs.email_notif),
      txnAlerts: (prefs.txnAlerts ?? prefs.txn_alerts) !== false,
      promo: Boolean(prefs.promo),
      loginAlerts: (prefs.loginAlerts ?? prefs.login_alerts) !== false,
      language: String(prefs.language || 'en-NG'),
      currency: String(prefs.currency || 'NGN'),
    },
  };
}

export async function apiMe() {
  const raw = await apiRequest<ApiUserProfile>('/me');
  return mapApiUserProfile(raw);
}

export async function apiUpdateMe(
  payload: Partial<{
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    dateOfBirth: string;
    preferences: Partial<UserProfile['preferences']>;
    kyc: Partial<{ bvn: string; nin: string }>;
  }>
) {
  const raw = await apiRequest<ApiUserProfile>('/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return mapApiUserProfile(raw);
}

export async function apiDeleteAccount(payload: { confirm: string; pin?: string }) {
  return apiRequest<{ ok?: boolean; message?: string }>('/auth/account', {
    method: 'DELETE',
    body: JSON.stringify(payload),
  });
}

export type ApiAppBranding = {
  logoUrl?: string | null;
  logo_url?: string | null;
  logoUrlDark?: string | null;
  logo_url_dark?: string | null;
  logoUrlLight?: string | null;
  logo_url_light?: string | null;
  appName?: string | null;
  app_name?: string | null;
};

export type AppBranding = {
  logoUrl: string | null;
  logoUrlDark: string | null;
  logoUrlLight: string | null;
  appName: string;
};

export function mapApiBranding(raw?: ApiAppBranding | null): AppBranding {
  const logoUrl = raw?.logoUrl ?? raw?.logo_url ?? null;
  return {
    logoUrl: logoUrl ? String(logoUrl) : null,
    logoUrlDark: raw?.logoUrlDark ?? raw?.logo_url_dark ?? logoUrl ?? null,
    logoUrlLight: raw?.logoUrlLight ?? raw?.logo_url_light ?? logoUrl ?? null,
    appName: String(raw?.appName ?? raw?.app_name ?? 'Xtrapay'),
  };
}

/** Public app shell — logo, name (no auth required). */
export async function apiAppConfig() {
  const data = await apiRequest<{ branding?: ApiAppBranding } | ApiAppBranding>('/config');
  const branding =
    data && typeof data === 'object' && 'branding' in data
      ? (data as { branding?: ApiAppBranding }).branding
      : (data as ApiAppBranding);
  return mapApiBranding(branding);
}

export type ApiBootstrap = {
  user: ApiUserProfile;
  branding?: ApiAppBranding;
  wallets: Array<{
    id: string;
    name: string;
    kind: WalletAccount['kind'];
    accountNumber: string;
    bankName: string;
    balance: number;
    subtitle: string;
    currency?: string;
    /** Name printed on the virtual account (receive screen) */
    accountName?: string;
    /** Optional USSD dial string for this VA */
    ussd?: string;
  }>;
  selectedWalletId?: string;
  limits: {
    dailySpendCap: number;
    dailySpent: number;
    singleTxnCap: number;
    transferCap: number;
    posFloatCap: number;
    /** Lifetime cumulative debit volume (NGN) — KYC prompted at ≥ 50_000 */
    cumulativeSpent?: number;
    cumulative_spent?: number;
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
  /** Referrer pay code or phone — attribution locked once set */
  referralCode?: string;
  referredBy?: string;
}) {
  const referral =
    (payload.referralCode || payload.referredBy || '').trim() || undefined;
  return apiRequest<{ registrationId: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      password: payload.password,
      ...(referral
        ? {
            referralCode: referral,
            referredBy: referral,
            referral_code: referral,
            referred_by: referral,
          }
        : {}),
    }),
  });
}

export async function apiSubmitKyc(payload: {
  /** Only during legacy pre-OTP register KYC — omit when logged in */
  registrationId?: string;
  idType: 'bvn' | 'nin';
  idNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  address: string;
  city: string;
  state: string;
}) {
  // Logged-in deferred KYC (preferred path after Tier-0 register)
  if (!payload.registrationId) {
    try {
      return await apiRequest<ApiUserProfile | { ok?: boolean; user?: ApiUserProfile }>('/kyc', {
        method: 'POST',
        body: JSON.stringify({
          idType: payload.idType,
          idNumber: payload.idNumber,
          dateOfBirth: payload.dateOfBirth,
          gender: payload.gender,
          address: payload.address,
          city: payload.city,
          state: payload.state,
        }),
      });
    } catch (err) {
      if (!(err instanceof ApiError) || (err.status !== 404 && err.status !== 405)) throw err;
      // fall through to /auth/kyc without registrationId
    }
  }
  return apiRequest('/auth/kyc', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Lifetime debit volume that triggers deferred KYC (₦50,000). */
export const KYC_CUMULATIVE_THRESHOLD_NGN = 50_000;

export async function apiSendOtp(
  destination: string,
  purpose: 'register' | 'login' | 'reset' | 'pin_change' | 'pin_set'
) {
  return apiRequest<{ demoCode?: string | null }>('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ destination, purpose }),
  });
}

export async function apiVerifyOtp(payload: {
  destination: string;
  purpose: 'register' | 'login' | 'reset' | 'pin_change' | 'pin_set';
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

/** Lightweight live balances — prefer this over full bootstrap for refreshes. */
export async function apiWallets() {
  return apiRequest<ApiBootstrap['wallets']>('/wallets');
}

export type ApiWallet = ApiBootstrap['wallets'][number] & {
  purpose?: string | null;
  parentWalletId?: string | null;
  parent_wallet_id?: string | null;
  status?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  account_number?: string | null;
  bank_name?: string | null;
  account_name?: string | null;
  nuban?: string | null;
  vaNumber?: string | null;
  va_number?: string | null;
  payIn?: Record<string, unknown> | null;
  pay_in?: Record<string, unknown> | null;
  virtualAccount?: Record<string, unknown> | null;
  virtual_account?: Record<string, unknown> | null;
};

export type CreateSubAccountPayload = {
  kind: 'sub_personal' | 'sub_business';
  name: string;
  purpose: string;
  pin: string;
  parentContext?: 'personal' | 'business';
};

/**
 * POST /wallets — create sub-account (KYC inherited from parent; no re-registration).
 * Also accepted: POST /wallets/sub-accounts with the same body.
 */
export async function apiCreateSubAccount(payload: CreateSubAccountPayload) {
  const raw = await apiRequest<ApiWallet>('/wallets', {
    method: 'POST',
    body: JSON.stringify({
      kind: payload.kind,
      name: payload.name,
      purpose: payload.purpose,
      pin: payload.pin,
      parentContext: payload.parentContext,
    }),
  });
  return mapApiWallet(raw);
}

/** Tier-2 instant business open — personal KYC reused server-side. */
export type CreateBusinessAccountPayload = {
  businessName: string;
  /** Mandatory CAC — BN (business name) or RC (registered company). */
  cac: string;
  address: string;
  pin: string;
};

/**
 * POST /business/accounts — Tier-2 instant path.
 * Body: business_name, cac (BN|RC), address, pin.
 * Server copies name/DOB/BVN/NIN/email/phone from personal KYC and queues a fresh
 * CheckoutRail (Mevon) pay-in VA. Docs / address verification deferred.
 */
export async function apiCreateBusinessAccount(payload: CreateBusinessAccountPayload) {
  const body = {
    business_name: payload.businessName,
    cac: payload.cac,
    address: payload.address,
    pin: payload.pin,
    // camelCase aliases for stacks that prefer them
    businessName: payload.businessName,
  };
  try {
    const raw = await apiRequest<ApiWallet>('/business/accounts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapApiWallet(raw);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
      const raw = await apiRequest<ApiWallet>('/wallets', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'business',
          name: payload.businessName,
          business_name: payload.businessName,
          cac: payload.cac,
          address: payload.address,
          pin: payload.pin,
        }),
      });
      return mapApiWallet(raw);
    }
    throw err;
  }
}

export async function apiBusinessAccounts() {
  try {
    const data = await apiRequest<ApiWallet[] | { accounts: ApiWallet[]; wallets?: ApiWallet[] }>(
      '/business/accounts'
    );
    const list = Array.isArray(data) ? data : data?.accounts ?? data?.wallets ?? [];
    return list.map(mapApiWallet);
  } catch {
    const all = await apiWallets();
    return all
      .filter(w => w.kind === 'business' || w.kind === 'sub_business')
      .map(w => mapApiWallet(w as ApiWallet));
  }
}

export function mapApiWallet(w: ApiWallet): WalletAccount {
  const raw = w as ApiWallet & Record<string, unknown>;
  const kind = (raw.kind || 'personal') as WalletAccount['kind'];
  const purpose = raw.purpose ? String(raw.purpose) : undefined;
  const defaultSubtitle =
    kind === 'sub_business'
      ? 'Sub-account · Mini business'
      : kind === 'sub_personal'
        ? 'Sub-account · Personal'
        : kind === 'business'
          ? 'Main business'
          : 'Main wallet';

  // Nested pay-in / VA objects some backends return
  const payIn =
    (raw.payIn as Record<string, unknown> | undefined) ||
    (raw.pay_in as Record<string, unknown> | undefined) ||
    (raw.virtualAccount as Record<string, unknown> | undefined) ||
    (raw.virtual_account as Record<string, unknown> | undefined) ||
    null;

  const accountNumber = String(
    raw.accountNumber ??
      raw.account_number ??
      raw.nuban ??
      raw.vaNumber ??
      raw.va_number ??
      payIn?.accountNumber ??
      payIn?.account_number ??
      payIn?.nuban ??
      ''
  ).trim();

  const bankName = String(
    raw.bankName ??
      raw.bank_name ??
      payIn?.bankName ??
      payIn?.bank_name ??
      ''
  ).trim();

  const accountNameRaw =
    raw.accountName ??
    raw.account_name ??
    payIn?.accountName ??
    payIn?.account_name;
  const ussdRaw = raw.ussd ?? payIn?.ussd;

  return {
    id: String(raw.id),
    name: String(raw.name || 'Wallet'),
    kind,
    accountNumber: accountNumber && accountNumber !== 'undefined' && accountNumber !== 'null'
      ? accountNumber
      : '',
    bankName: bankName && bankName !== 'undefined' && bankName !== 'null' ? bankName : '',
    balance: Number(raw.balance ?? 0),
    subtitle: purpose || String(raw.subtitle || defaultSubtitle),
    accountName: accountNameRaw ? String(accountNameRaw) : undefined,
    ussd: ussdRaw ? String(ussdRaw) : undefined,
  };
}

/** Optional dedicated list: GET /wallets/sub-accounts */
export async function apiSubAccounts() {
  try {
    const data = await apiRequest<ApiWallet[] | { wallets: ApiWallet[]; subAccounts?: ApiWallet[] }>(
      '/wallets/sub-accounts'
    );
    const list = Array.isArray(data)
      ? data
      : data?.subAccounts ?? data?.wallets ?? [];
    return list.map(mapApiWallet);
  } catch {
    const all = await apiWallets();
    return all
      .filter(w => w.kind === 'sub_personal' || w.kind === 'sub_business')
      .map(mapApiWallet);
  }
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
  /** bank = NUBAN; wallet = Xtrapay phone / tag */
  channel?: 'bank' | 'wallet';
  accountNumber?: string;
  phone?: string;
  bankName?: string;
  bankCode?: string;
  amount: number;
  recipientName: string;
  narration?: string;
  pin: string;
}) {
  return apiRequest<ApiTransferResult>('/transfers', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      channel: payload.channel || 'bank',
    }),
  });
}

export async function apiSetPin(payload: { pin: string; confirmPin: string }) {
  return apiRequest<{ pinSet: boolean; message?: string; user?: ApiUserProfile }>(
    '/security/pin/set',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/** Verify the user's set transaction PIN. Throws on wrong/missing PIN (422). */
export async function apiVerifyPin(pin: string): Promise<void> {
  if (!/^\d{4}$/.test(pin)) {
    throw new ApiError('Enter a 4-digit PIN.', 422);
  }
  // Backend: Hash::check against pin_hash — 422 when unset or invalid.
  // Do not treat empty bodies as success beyond HTTP/success flags in apiRequest.
  await apiRequest<{ ok?: boolean; valid?: boolean; pinSet?: boolean } | null>(
    '/security/pin/verify',
    {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }
  );
}

export async function apiRequestPinChange(currentPin: string) {
  return apiRequest<{
    otpSent: boolean;
    destinations?: string[];
    demoCode?: string | null;
  }>('/security/pin/change/request', {
    method: 'POST',
    body: JSON.stringify({ currentPin }),
  });
}

export async function apiConfirmPinChange(payload: {
  currentPin: string;
  otp: string;
  newPin: string;
  confirmPin: string;
}) {
  return apiRequest<{ pinSet: boolean; message?: string; user?: ApiUserProfile }>(
    '/security/pin/change/confirm',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export type ApiLimitsPayload = {
  dailySpendCap?: number;
  dailySpent?: number;
  singleTxnCap?: number;
  transferCap?: number;
  posFloatCap?: number;
  cumulativeSpent?: number;
  daily_spend_cap?: number;
  daily_spent?: number;
  single_txn_cap?: number;
  transfer_cap?: number;
  pos_float_cap?: number;
  cumulative_spent?: number;
};

export type AppLimits = {
  dailySpendCap: number;
  dailySpent: number;
  singleTxnCap: number;
  transferCap: number;
  posFloatCap: number;
  cumulativeSpent: number;
};

export function mapApiLimits(raw: ApiLimitsPayload): AppLimits {
  return {
    dailySpendCap: Number(raw.dailySpendCap ?? raw.daily_spend_cap ?? 0),
    dailySpent: Number(raw.dailySpent ?? raw.daily_spent ?? 0),
    singleTxnCap: Number(raw.singleTxnCap ?? raw.single_txn_cap ?? 0),
    transferCap: Number(raw.transferCap ?? raw.transfer_cap ?? 0),
    posFloatCap: Number(raw.posFloatCap ?? raw.pos_float_cap ?? 0),
    cumulativeSpent: Number(raw.cumulativeSpent ?? raw.cumulative_spent ?? 0),
  };
}

export async function apiLimits() {
  const raw = await apiRequest<ApiLimitsPayload>('/limits');
  return mapApiLimits(raw);
}

export async function apiUpdateLimits(payload: {
  dailySpendCap?: number;
  singleTxnCap?: number;
  transferCap?: number;
  posFloatCap?: number;
  pin: string;
}) {
  const raw = await apiRequest<ApiLimitsPayload>('/limits', {
    method: 'PUT',
    body: JSON.stringify({
      dailySpendCap: payload.dailySpendCap,
      singleTxnCap: payload.singleTxnCap,
      transferCap: payload.transferCap,
      posFloatCap: payload.posFloatCap,
      pin: payload.pin,
    }),
  });
  return mapApiLimits(raw);
}

export type ApiNetworkRail = {
  id: string;
  name: string;
  backend?: string;
  icon?: string;
  status?: 'Active' | 'Degraded' | 'Down' | string;
  successRate?: number;
  success_rate?: number;
  uptime?: number;
  latencyMs?: number;
  latency_ms?: number;
  lastTrafficAt?: string;
  last_traffic_at?: string;
  volume24h?: number;
  volume_24h?: number;
  lastRef?: string;
  last_ref?: string;
  lastTitle?: string;
  last_title?: string;
};

export type AppNetworkRail = {
  id: string;
  name: string;
  backend: string;
  icon: string;
  status: 'Active' | 'Degraded' | 'Down';
  successRate: number;
  uptime: number;
  latencyMs: number;
  lastAge: string;
  volume24h: number;
  lastRef: string | null;
  lastTitle: string | null;
};

export function mapApiNetworkRail(raw: ApiNetworkRail): AppNetworkRail {
  const statusRaw = String(raw.status || 'Active');
  const status: AppNetworkRail['status'] =
    statusRaw === 'Down' || statusRaw === 'Degraded' ? statusRaw : 'Active';
  const lastAt = raw.lastTrafficAt ?? raw.last_traffic_at;
  return {
    id: String(raw.id),
    name: String(raw.name),
    backend: String(raw.backend || '—'),
    icon: String(raw.icon || 'hub'),
    status,
    successRate: Number(raw.successRate ?? raw.success_rate ?? 0),
    uptime: Number(raw.uptime ?? 0),
    latencyMs: Number(raw.latencyMs ?? raw.latency_ms ?? 0),
    lastAge: lastAt ? String(lastAt) : '—',
    volume24h: Number(raw.volume24h ?? raw.volume_24h ?? 0),
    lastRef: raw.lastRef ?? raw.last_ref ?? null,
    lastTitle: raw.lastTitle ?? raw.last_title ?? null,
  };
}

export async function apiNetworkRails() {
  const data = await apiRequest<ApiNetworkRail[] | { rails: ApiNetworkRail[] }>('/network/rails');
  const list = Array.isArray(data) ? data : data?.rails ?? [];
  return list.map(mapApiNetworkRail);
}

export type ApiSupportTicket = {
  id: string;
  subject: string;
  category?: string;
  status?: 'Open' | 'Pending' | 'Resolved' | string;
  updatedAt?: string;
  updated_at?: string;
};

export type AppSupportTicket = {
  id: string;
  subject: string;
  category: string;
  status: 'Open' | 'Pending' | 'Resolved';
  updated: string;
};

export function mapApiSupportTicket(raw: ApiSupportTicket): AppSupportTicket {
  const statusRaw = String(raw.status || 'Open');
  const status: AppSupportTicket['status'] =
    statusRaw === 'Pending' || statusRaw === 'Resolved' ? statusRaw : 'Open';
  return {
    id: String(raw.id),
    subject: String(raw.subject),
    category: String(raw.category || 'Other'),
    status,
    updated: String(raw.updatedAt ?? raw.updated_at ?? '—'),
  };
}

export async function apiSupportTickets() {
  const data = await apiRequest<ApiSupportTicket[] | { tickets: ApiSupportTicket[] }>(
    '/support/tickets'
  );
  const list = Array.isArray(data) ? data : data?.tickets ?? [];
  return list.map(mapApiSupportTicket);
}

export async function apiCreateSupportTicket(payload: {
  category: string;
  subject: string;
  message: string;
}) {
  const raw = await apiRequest<ApiSupportTicket>('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapApiSupportTicket(raw);
}

export async function apiBeneficiaries() {
  return apiRequest<
    Array<{
      id: string;
      name: string;
      initials: string;
      bank: string;
      accountNumber: string;
      tier?: string | null;
      colorClass?: string | null;
    }>
  >('/beneficiaries');
}

export async function apiTransactions(params?: { category?: string; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.category) q.set('category', params.category);
  if (params?.limit) q.set('limit', String(params.limit));
  const suffix = q.toString() ? `?${q}` : '';
  return apiRequest<Transaction[]>(`/transactions${suffix}`);
}

/* ── Personal savings vaults ── */

export type ApiSavingsPlan = {
  id: string;
  name?: string | null;
  title?: string | null;
  type?: string | null;
  kind?: string | null;
  balance?: number | null;
  amount?: number | null;
  targetAmount?: number | null;
  target_amount?: number | null;
  percentage?: number | null;
  savePercent?: number | null;
  save_percent?: number | null;
  apy?: number | null;
  maturityDate?: string | null;
  maturity_date?: string | null;
  status?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  interestEarned?: number | null;
  interest_earned?: number | null;
};

export type ApiSavingsSummary = {
  flexibleBalance?: number;
  flexible_balance?: number;
  strictBalance?: number;
  strict_balance?: number;
  strictAutoSave?: boolean;
  strict_auto_save?: boolean;
  totalBalance?: number;
  total_balance?: number;
  blendedApy?: number;
  blended_apy?: number;
  interestToday?: number;
  interest_today?: number;
  lifetimeInterest?: number;
  lifetime_interest?: number;
  plans?: ApiSavingsPlan[];
};

function mapPlanType(raw?: string | null): import('../types').SavingsPlanType {
  const v = (raw || '').toLowerCase().replace(/-/g, '_');
  if (v === 'fixed' || v === 'strict' || v === 'locked') return 'fixed';
  if (v === 'spend_and_save' || v === 'spend_save' || v === 'autosave' || v === 'spend') {
    return 'spend_and_save';
  }
  return 'flexible';
}

export function mapApiSavingsPlan(raw: ApiSavingsPlan): import('../types').SavingsPlan {
  const type = mapPlanType(raw.type ?? raw.kind);
  const statusRaw = (raw.status || 'Active').toLowerCase();
  const status =
    statusRaw === 'matured' || statusRaw === 'completed'
      ? ('Matured' as const)
      : statusRaw === 'paused'
        ? ('Paused' as const)
        : ('Active' as const);
  return {
    id: String(raw.id),
    name: String(raw.name ?? raw.title ?? 'Savings plan'),
    type,
    balance: Number(raw.balance ?? raw.amount ?? 0),
    targetAmount:
      raw.targetAmount != null || raw.target_amount != null
        ? Number(raw.targetAmount ?? raw.target_amount)
        : undefined,
    percentage:
      raw.percentage != null || raw.savePercent != null || raw.save_percent != null
        ? Number(raw.percentage ?? raw.savePercent ?? raw.save_percent)
        : type === 'spend_and_save'
          ? 10
          : undefined,
    apy: raw.apy != null ? Number(raw.apy) : undefined,
    maturityDate: raw.maturityDate ?? raw.maturity_date ?? undefined,
    status,
    createdAt: raw.createdAt ?? raw.created_at ?? undefined,
    interestEarned:
      raw.interestEarned != null || raw.interest_earned != null
        ? Number(raw.interestEarned ?? raw.interest_earned)
        : undefined,
  };
}

export function mapApiSavingsSummary(
  raw: ApiSavingsSummary
): import('../types').SavingsSummary {
  const plans = (raw.plans || []).map(mapApiSavingsPlan);
  const flexibleBalance = Number(raw.flexibleBalance ?? raw.flexible_balance ?? 0);
  const strictBalance = Number(raw.strictBalance ?? raw.strict_balance ?? 0);
  return {
    flexibleBalance,
    strictBalance,
    strictAutoSave: Boolean(raw.strictAutoSave ?? raw.strict_auto_save),
    totalBalance: Number(
      raw.totalBalance ?? raw.total_balance ?? flexibleBalance + strictBalance
    ),
    blendedApy:
      raw.blendedApy != null || raw.blended_apy != null
        ? Number(raw.blendedApy ?? raw.blended_apy)
        : undefined,
    interestToday:
      raw.interestToday != null || raw.interest_today != null
        ? Number(raw.interestToday ?? raw.interest_today)
        : undefined,
    lifetimeInterest:
      raw.lifetimeInterest != null || raw.lifetime_interest != null
        ? Number(raw.lifetimeInterest ?? raw.lifetime_interest)
        : undefined,
    plans,
  };
}

export async function apiSavings() {
  const data = await apiRequest<ApiSavingsSummary>('/savings');
  return mapApiSavingsSummary(data);
}

export async function apiCreateSavingsPlan(payload: {
  name: string;
  type: 'flexible' | 'fixed' | 'spend_and_save';
  /** Initial deposit (flexible / fixed) */
  initialAmount?: number;
  /** Fixed target */
  targetAmount?: number;
  /** Fixed maturity ISO date or relative e.g. "90 days" */
  maturityDate?: string;
  /** Spend & save percent 1–100 */
  percentage?: number;
  walletId?: string;
}) {
  const raw = await apiRequest<ApiSavingsPlan>('/savings/plans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapApiSavingsPlan(raw);
}

export async function apiSavingsDeposit(
  planId: string,
  payload: { amount: number; pin?: string }
) {
  const raw = await apiRequest<ApiSavingsPlan | ApiSavingsSummary>(
    `/savings/plans/${planId}/deposit`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return raw;
}

export async function apiSavingsWithdraw(
  planId: string,
  payload: { amount: number; pin?: string }
) {
  const raw = await apiRequest<ApiSavingsPlan | ApiSavingsSummary>(
    `/savings/plans/${planId}/withdraw`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return raw;
}

/** Legacy flexible helpers — still supported */
export async function apiFlexibleDeposit(payload: { amount: number; pin?: string }) {
  return apiRequest<ApiSavingsSummary>('/savings/flexible/deposit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiFlexibleWithdraw(payload: { amount: number; pin?: string }) {
  return apiRequest<ApiSavingsSummary>('/savings/flexible/withdraw', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiStrictAutosave(enabled: boolean, percentage?: number) {
  return apiRequest<ApiSavingsSummary>('/savings/strict/autosave', {
    method: 'PATCH',
    body: JSON.stringify({ enabled, percentage }),
  });
}

/* ── VTU / bills (airtime, data, electricity, TV, betting) ── */

export type VtuNetwork = { id: string; label: string };
export type VtuPlan = {
  variation_id: string;
  label: string;
  price: number;
  available?: boolean;
};
export type VtuCatalogItem = { id: string; label: string };

export type VtuNetworksResponse = {
  networks: VtuNetwork[];
  airtime_min?: number;
  airtime_max?: number;
  configured?: boolean;
  provider?: string;
};

export type VtuBillCatalog = {
  electricity_discos?: VtuCatalogItem[];
  cable_tv_services?: VtuCatalogItem[];
  betting_services?: VtuCatalogItem[];
  electricity_min?: number;
};

export type VtuPayResult = {
  balance_after?: number;
  walletBalance?: number;
  token?: string | null;
  pendingToken?: string | null;
  reference?: string | null;
  message?: string | null;
  customer_name?: string | null;
  customerName?: string | null;
  data?: Record<string, unknown> | null;
};

export async function apiVtuNetworks() {
  return apiRequest<VtuNetworksResponse>('/vtu/networks');
}

export async function apiVtuDataPlans(networkId: string) {
  const q = new URLSearchParams({ network_id: networkId });
  return apiRequest<{ plans: VtuPlan[] }>(`/vtu/data-plans?${q}`);
}

export async function apiVtuBillCatalog() {
  return apiRequest<VtuBillCatalog>('/vtu/bill-catalog');
}

export async function apiVtuTvPlans(serviceId: string) {
  const q = new URLSearchParams({ service_id: serviceId });
  return apiRequest<{ plans: VtuPlan[] }>(`/vtu/tv-plans?${q}`);
}

export async function apiVtuAirtime(payload: {
  network_id: string;
  phone: string;
  amount: number;
  pin: string;
}) {
  return apiRequest<VtuPayResult>('/vtu/airtime', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiVtuData(payload: {
  network_id: string;
  phone: string;
  variation_id: string;
  expected_price: number;
  pin: string;
}) {
  return apiRequest<VtuPayResult>('/vtu/data', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiVtuElectricityVerify(payload: {
  service_id: string;
  customer_id: string;
  variation_id: 'prepaid' | 'postpaid';
}) {
  return apiRequest<VtuPayResult & { customer_name?: string; customerName?: string }>(
    '/vtu/electricity/verify',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function apiVtuElectricity(payload: {
  service_id: string;
  customer_id: string;
  variation_id: 'prepaid' | 'postpaid';
  amount: number;
  pin: string;
}) {
  return apiRequest<VtuPayResult>('/vtu/electricity', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiVtuBettingVerify(payload: {
  service_id: string;
  customer_id: string;
}) {
  return apiRequest<VtuPayResult>('/vtu/betting/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiVtuBetting(payload: {
  service_id: string;
  customer_id: string;
  amount: number;
  pin: string;
}) {
  return apiRequest<VtuPayResult>('/vtu/betting', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiVtuTvVerify(payload: {
  service_id: string;
  customer_id: string;
}) {
  return apiRequest<VtuPayResult>('/vtu/tv/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiVtuTv(payload: {
  service_id: string;
  customer_id: string;
  variation_id: string;
  expected_price: number;
  pin: string;
}) {
  return apiRequest<VtuPayResult>('/vtu/tv', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/* ── Cards (physical Naira + virtual USD) ── */

export type ApiCard = {
  id: string;
  kind?: string | null;
  type?: string | null;
  last4?: string | null;
  panMasked?: string | null;
  pan_masked?: string | null;
  status?: string | null;
  cardholderName?: string | null;
  cardholder_name?: string | null;
  expiryMonth?: number | string | null;
  expiry_month?: number | string | null;
  expiryYear?: number | string | null;
  expiry_year?: number | string | null;
  network?: string | null;
  spendAvailableNgn?: number | null;
  spend_available_ngn?: number | null;
  spendAvailableUsd?: number | null;
  spend_available_usd?: number | null;
  deliveryAddress?: string | null;
  delivery_address?: string | null;
  billingAddress?: string | null;
  billing_address?: string | null;
  cvvMasked?: string | null;
  cvv_masked?: string | null;
};

export type AppCard = {
  id: string;
  kind: 'physical' | 'virtual_usd';
  last4: string;
  panMasked: string;
  status: 'active' | 'frozen' | 'pending' | 'inactive';
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  network: string;
  spendAvailableNgn?: number;
  spendAvailableUsd?: number;
  deliveryAddress?: string;
  billingAddress?: string;
  cvvMasked?: string;
};

function mapCardKind(raw?: string | null): AppCard['kind'] {
  const v = (raw || '').toLowerCase();
  if (v.includes('virtual') || v.includes('usd') || v === 'virtual_usd') return 'virtual_usd';
  return 'physical';
}

function mapCardStatus(raw?: string | null): AppCard['status'] {
  const v = (raw || '').toLowerCase();
  if (v === 'frozen' || v === 'blocked') return 'frozen';
  if (v === 'pending' || v === 'processing' || v === 'requested') return 'pending';
  if (v === 'inactive' || v === 'cancelled' || v === 'canceled') return 'inactive';
  return 'active';
}

export function mapApiCard(raw: ApiCard): AppCard {
  const last4 = String(raw.last4 || '').replace(/\D/g, '').slice(-4) || '••••';
  const pan =
    String(raw.panMasked ?? raw.pan_masked ?? '').trim() ||
    (last4 !== '••••' ? `•••• •••• •••• ${last4}` : '•••• •••• •••• ••••');
  const month = String(raw.expiryMonth ?? raw.expiry_month ?? '').padStart(2, '0').slice(-2);
  const year = String(raw.expiryYear ?? raw.expiry_year ?? '').slice(-2);
  return {
    id: String(raw.id),
    kind: mapCardKind(raw.kind ?? raw.type),
    last4,
    panMasked: pan,
    status: mapCardStatus(raw.status),
    cardholderName: String(raw.cardholderName ?? raw.cardholder_name ?? ''),
    expiryMonth: month || '••',
    expiryYear: year || '••',
    network: String(raw.network || 'verve'),
    spendAvailableNgn:
      raw.spendAvailableNgn != null || raw.spend_available_ngn != null
        ? Number(raw.spendAvailableNgn ?? raw.spend_available_ngn)
        : undefined,
    spendAvailableUsd:
      raw.spendAvailableUsd != null || raw.spend_available_usd != null
        ? Number(raw.spendAvailableUsd ?? raw.spend_available_usd)
        : undefined,
    deliveryAddress: raw.deliveryAddress ?? raw.delivery_address ?? undefined,
    billingAddress: raw.billingAddress ?? raw.billing_address ?? undefined,
    cvvMasked: raw.cvvMasked ?? raw.cvv_masked ?? undefined,
  };
}

export async function apiCards() {
  const data = await apiRequest<ApiCard[] | { cards: ApiCard[] }>('/cards');
  const list = Array.isArray(data) ? data : data?.cards ?? [];
  return list.map(mapApiCard);
}

/** Quote shown before PIN when requesting a card (fees + USD top-up FX). */
export type ApiCardRequestQuote = {
  kind?: string;
  type?: string;
  issuanceFeeNgn?: number | null;
  issuance_fee_ngn?: number | null;
  deliveryFeeNgn?: number | null;
  delivery_fee_ngn?: number | null;
  minInitialTopUpUsd?: number | null;
  min_initial_top_up_usd?: number | null;
  initialTopUpUsd?: number | null;
  initial_top_up_usd?: number | null;
  fxRate?: number | null;
  fx_rate?: number | null;
  topUpNgn?: number | null;
  top_up_ngn?: number | null;
  totalDebitNgn?: number | null;
  total_debit_ngn?: number | null;
  walletBalanceNgn?: number | null;
  wallet_balance_ngn?: number | null;
  sufficientBalance?: boolean | null;
  sufficient_balance?: boolean | null;
  currency?: string | null;
  title?: string | null;
  notes?: string[] | null;
};

export type AppCardRequestQuote = {
  kind: 'physical' | 'virtual_usd';
  issuanceFeeNgn: number;
  deliveryFeeNgn: number;
  minInitialTopUpUsd: number;
  initialTopUpUsd: number;
  fxRate: number;
  topUpNgn: number;
  totalDebitNgn: number;
  walletBalanceNgn?: number;
  sufficientBalance?: boolean;
  title?: string;
  notes: string[];
};

export function mapApiCardRequestQuote(
  raw: ApiCardRequestQuote,
  fallbackKind: 'physical' | 'virtual_usd'
): AppCardRequestQuote {
  const kind = mapCardKind(raw.kind ?? raw.type ?? fallbackKind);
  const issuanceFeeNgn = Number(raw.issuanceFeeNgn ?? raw.issuance_fee_ngn ?? 0);
  const deliveryFeeNgn = Number(raw.deliveryFeeNgn ?? raw.delivery_fee_ngn ?? 0);
  const minInitialTopUpUsd = Number(
    raw.minInitialTopUpUsd ?? raw.min_initial_top_up_usd ?? (kind === 'virtual_usd' ? 10 : 0)
  );
  const initialTopUpUsd = Number(
    raw.initialTopUpUsd ?? raw.initial_top_up_usd ?? minInitialTopUpUsd
  );
  const fxRate = Number(raw.fxRate ?? raw.fx_rate ?? 0);
  const topUpNgn =
    raw.topUpNgn != null || raw.top_up_ngn != null
      ? Number(raw.topUpNgn ?? raw.top_up_ngn)
      : fxRate > 0
        ? Math.round(initialTopUpUsd * fxRate)
        : 0;
  const totalDebitNgn =
    raw.totalDebitNgn != null || raw.total_debit_ngn != null
      ? Number(raw.totalDebitNgn ?? raw.total_debit_ngn)
      : issuanceFeeNgn + deliveryFeeNgn + topUpNgn;
  return {
    kind,
    issuanceFeeNgn,
    deliveryFeeNgn,
    minInitialTopUpUsd,
    initialTopUpUsd,
    fxRate,
    topUpNgn,
    totalDebitNgn,
    walletBalanceNgn:
      raw.walletBalanceNgn != null || raw.wallet_balance_ngn != null
        ? Number(raw.walletBalanceNgn ?? raw.wallet_balance_ngn)
        : undefined,
    sufficientBalance:
      raw.sufficientBalance != null || raw.sufficient_balance != null
        ? Boolean(raw.sufficientBalance ?? raw.sufficient_balance)
        : undefined,
    title: raw.title ?? undefined,
    notes: Array.isArray(raw.notes) ? raw.notes.filter(Boolean) : [],
  };
}

/**
 * GET /cards/request-quote?kind=physical|virtual_usd&initialTopUpUsd=
 * Backend populates fees, min first USD top-up, FX rate, NGN conversion, total debit.
 */
export async function apiCardRequestQuote(params: {
  kind: 'physical' | 'virtual_usd';
  initialTopUpUsd?: number;
}) {
  const q = new URLSearchParams({ kind: params.kind });
  if (params.initialTopUpUsd != null && !Number.isNaN(params.initialTopUpUsd)) {
    q.set('initialTopUpUsd', String(params.initialTopUpUsd));
  }
  const raw = await apiRequest<ApiCardRequestQuote>(`/cards/request-quote?${q.toString()}`);
  return mapApiCardRequestQuote(raw, params.kind);
}

export async function apiRequestCard(payload: {
  kind: 'physical' | 'virtual_usd';
  deliveryAddress?: string;
  initialTopUpUsd?: number;
  pin: string;
}) {
  const raw = await apiRequest<ApiCard>('/cards/request', {
    method: 'POST',
    body: JSON.stringify({
      kind: payload.kind,
      deliveryAddress: payload.deliveryAddress,
      initialTopUpUsd: payload.initialTopUpUsd,
      pin: payload.pin,
    }),
  });
  return mapApiCard(raw);
}

export async function apiFreezeCard(id: string, frozen: boolean, pin?: string) {
  const raw = await apiRequest<ApiCard>(`/cards/${id}/freeze`, {
    method: 'POST',
    body: JSON.stringify({ frozen, pin }),
  });
  return mapApiCard(raw);
}

export async function apiFundVirtualCard(id: string, payload: { amountUsd: number; pin: string }) {
  return apiRequest<{
    card?: ApiCard;
    spendAvailableUsd?: number;
    walletBalance?: number;
    fxRate?: number;
  }>(`/cards/${id}/fund`, {
    method: 'POST',
    body: JSON.stringify({
      amountUsd: payload.amountUsd,
      amount: payload.amountUsd,
      pin: payload.pin,
    }),
  });
}

/* ── Ask Money (peer requests + credit) ── */

export type ApiMoneyRequest = {
  id: string;
  type?: string | null;
  requesterName?: string | null;
  requester_name?: string | null;
  requesterPhone?: string | null;
  requester_phone?: string | null;
  recipientName?: string | null;
  recipient_name?: string | null;
  recipientPhone?: string | null;
  recipient_phone?: string | null;
  amount?: number | null;
  note?: string | null;
  date?: string | null;
  timestamp?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  status?: string | null;
  isIncoming?: boolean | null;
  is_incoming?: boolean | null;
  facilityKind?: string | null;
  facility_kind?: string | null;
  tenor?: string | null;
};

function mapMoneyRequestStatus(
  s?: string | null
): import('../types').MoneyRequest['status'] {
  const v = (s || '').toLowerCase();
  if (v === 'accepted' || v === 'paid' || v === 'approved') return 'Accepted';
  if (v === 'declined' || v === 'rejected') return 'Declined';
  if (v === 'cancelled' || v === 'canceled') return 'Cancelled';
  if (v === 'expired') return 'Expired';
  return 'Pending';
}

function mapMoneyRequestType(
  s?: string | null
): import('../types').MoneyRequest['type'] {
  const v = (s || '').toLowerCase();
  if (v === 'overdraft') return 'overdraft';
  if (v === 'loan') return 'loan';
  return 'contact';
}

export function mapApiMoneyRequest(raw: ApiMoneyRequest): import('../types').MoneyRequest {
  const type = mapMoneyRequestType(raw.type ?? raw.facilityKind ?? raw.facility_kind);
  const facilityRaw = raw.facilityKind ?? raw.facility_kind ?? (type !== 'contact' ? type : undefined);
  return {
    id: String(raw.id),
    type,
    requesterName: String(raw.requesterName ?? raw.requester_name ?? 'Member'),
    requesterPhone: String(raw.requesterPhone ?? raw.requester_phone ?? ''),
    recipientName: String(raw.recipientName ?? raw.recipient_name ?? 'Contact'),
    recipientPhone: String(raw.recipientPhone ?? raw.recipient_phone ?? ''),
    amount: Number(raw.amount ?? 0),
    note: raw.note ?? undefined,
    date: String(raw.date ?? raw.createdAt ?? raw.created_at ?? 'Today'),
    timestamp: String(raw.timestamp ?? ''),
    status: mapMoneyRequestStatus(raw.status),
    isIncoming: Boolean(raw.isIncoming ?? raw.is_incoming),
    facilityKind:
      facilityRaw === 'overdraft' || facilityRaw === 'loan'
        ? facilityRaw
        : type === 'overdraft' || type === 'loan'
          ? type
          : undefined,
    tenor: raw.tenor ?? undefined,
  };
}

export async function apiMoneyRequests() {
  const data = await apiRequest<ApiMoneyRequest[] | { requests: ApiMoneyRequest[] }>(
    '/money-requests'
  );
  const list = Array.isArray(data) ? data : data?.requests ?? [];
  return list.map(mapApiMoneyRequest);
}

export async function apiCreateMoneyRequest(payload: {
  recipientPhone: string;
  amount: number;
  note?: string;
}) {
  const raw = await apiRequest<ApiMoneyRequest>('/money-requests', {
    method: 'POST',
    body: JSON.stringify({
      type: 'contact',
      recipientPhone: payload.recipientPhone.replace(/\s+/g, ''),
      amount: payload.amount,
      note: payload.note,
    }),
  });
  return mapApiMoneyRequest(raw);
}

export async function apiAcceptMoneyRequest(id: string, pin: string) {
  const raw = await apiRequest<ApiMoneyRequest>(`/money-requests/${id}/accept`, {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
  return mapApiMoneyRequest(raw);
}

export async function apiDeclineMoneyRequest(id: string) {
  const raw = await apiRequest<ApiMoneyRequest>(`/money-requests/${id}/decline`, {
    method: 'POST',
  });
  return mapApiMoneyRequest(raw);
}

export async function apiCancelMoneyRequest(id: string) {
  const raw = await apiRequest<ApiMoneyRequest>(`/money-requests/${id}/cancel`, {
    method: 'POST',
  });
  return mapApiMoneyRequest(raw);
}

export type ApiCreditOverview = {
  overdraftLimit?: number;
  overdraft_limit?: number;
  overdraftUsed?: number;
  overdraft_used?: number;
  overdraftAvailable?: number;
  overdraft_available?: number;
  outstandingLoans?: number;
  outstanding_loans?: number;
  minLoanAmount?: number;
  min_loan_amount?: number;
  interestRateFlat?: number;
  interest_rate_flat?: number;
  tenors?: string[] | null;
};

export type ApiLoan = {
  id: string;
  title?: string | null;
  principal?: number | null;
  outstanding?: number | null;
  dueDate?: string | null;
  due_date?: string | null;
  tenor?: string | null;
  status?: string | null;
  interestRate?: number | null;
  interest_rate?: number | null;
  disbursedAt?: string | null;
  disbursed_at?: string | null;
};

export type ApiLoanRepayment = {
  id: string;
  loanId?: string | null;
  loan_id?: string | null;
  loanTitle?: string | null;
  loan_title?: string | null;
  amount?: number | null;
  date?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  reference?: string | null;
  status?: string | null;
};

export type AppLoan = {
  id: string;
  title: string;
  principal: number;
  outstanding: number;
  dueDate: string;
  tenor: string;
  status: 'Active' | 'Overdue' | 'Settled' | 'Pending';
};

export type AppLoanRepayment = {
  id: string;
  loanId?: string;
  loanTitle: string;
  amount: number;
  date: string;
  reference: string;
};

function mapLoanStatus(raw?: string | null): AppLoan['status'] {
  const v = (raw || '').toLowerCase();
  if (v === 'overdue' || v === 'defaulted' || v === 'late') return 'Overdue';
  if (v === 'settled' || v === 'paid' || v === 'closed' || v === 'repaid') return 'Settled';
  if (v === 'pending' || v === 'processing' || v === 'requested') return 'Pending';
  return 'Active';
}

export function mapApiLoan(raw: ApiLoan): AppLoan {
  return {
    id: String(raw.id),
    title: String(raw.title || 'Loan'),
    principal: Number(raw.principal ?? 0),
    outstanding: Number(raw.outstanding ?? raw.principal ?? 0),
    dueDate: String(raw.dueDate ?? raw.due_date ?? '—'),
    tenor: String(raw.tenor || '—'),
    status: mapLoanStatus(raw.status),
  };
}

export function mapApiLoanRepayment(raw: ApiLoanRepayment): AppLoanRepayment {
  return {
    id: String(raw.id),
    loanId: raw.loanId ?? raw.loan_id ?? undefined,
    loanTitle: String(raw.loanTitle ?? raw.loan_title ?? 'Loan'),
    amount: Number(raw.amount ?? 0),
    date: String(raw.date ?? raw.createdAt ?? raw.created_at ?? '—'),
    reference: String(raw.reference || '—'),
  };
}

export async function apiCreditOverview() {
  return apiRequest<ApiCreditOverview>('/credit/overview');
}

export async function apiCreditLoans(params?: { status?: string }) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  const suffix = q.toString() ? `?${q.toString()}` : '';
  const data = await apiRequest<ApiLoan[] | { loans: ApiLoan[] }>(`/credit/loans${suffix}`);
  const list = Array.isArray(data) ? data : data?.loans ?? [];
  return list.map(mapApiLoan);
}

export async function apiLoanRepayments(params?: { loanId?: string }) {
  const q = new URLSearchParams();
  if (params?.loanId) q.set('loanId', params.loanId);
  const suffix = q.toString() ? `?${q.toString()}` : '';
  const data = await apiRequest<
    ApiLoanRepayment[] | { repayments: ApiLoanRepayment[]; history?: ApiLoanRepayment[] }
  >(`/credit/repayments${suffix}`);
  const list = Array.isArray(data)
    ? data
    : data?.repayments ?? data?.history ?? [];
  return list.map(mapApiLoanRepayment);
}

export async function apiRequestOverdraft(payload: { amount: number; pin?: string }) {
  const raw = await apiRequest<ApiMoneyRequest | ApiCreditOverview>('/credit/overdraft/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return raw;
}

/** Optional: pay down overdraft used balance from wallet. */
export async function apiRepayOverdraft(payload: { amount: number; pin: string }) {
  return apiRequest<ApiCreditOverview>('/credit/overdraft/repay', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiRequestLoan(payload: { amount: number; tenor?: string; pin?: string }) {
  const raw = await apiRequest<ApiLoan | ApiMoneyRequest>('/credit/loans/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  // Prefer loan object; fall back to money-request shaped response
  if (raw && 'outstanding' in raw) {
    return { kind: 'loan' as const, loan: mapApiLoan(raw as ApiLoan) };
  }
  return { kind: 'request' as const, request: mapApiMoneyRequest(raw as ApiMoneyRequest) };
}

export async function apiRepayLoan(
  id: string,
  payload: { amount: number; pin: string }
) {
  return apiRequest<{
    loan?: ApiLoan;
    repayment?: ApiLoanRepayment;
    outstanding?: number;
    walletBalance?: number;
  }>(`/credit/loans/${id}/repay`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/* ── Save Together ── */

export type ApiPotMember = {
  id?: string;
  name?: string;
  display_name?: string | null;
  phone?: string;
  phone_e164?: string;
  initials?: string;
  status?: string;
  contributed?: number;
  contributed_amount?: number;
  share?: number;
  share_target?: number;
  isCreator?: boolean;
  role?: string;
};

export type ApiGroupPot = {
  id: string;
  title: string;
  subtitle?: string | null;
  note?: string | null;
  targetAmount?: number;
  target_amount?: number;
  raisedAmount?: number;
  total_contributed?: number;
  perMemberShare?: number;
  per_member_share?: number;
  myStatus?: string | null;
  my_status?: string | null;
  myContribution?: number | null;
  my_contributed?: number | null;
  frequency?: string | null;
  completionMode?: string;
  completion_mode?: string;
  members?: ApiPotMember[];
  status?: string;
  currency?: string;
};

function normalizeStatus(s?: string | null): 'Active' | 'Pending' | 'Declined' {
  const v = (s || '').toLowerCase();
  if (v === 'declined' || v === 'rejected') return 'Declined';
  if (v === 'pending' || v === 'invited') return 'Pending';
  return 'Active';
}

export function mapApiPot(raw: ApiGroupPot): import('../types').GroupPot {
  const target = Number(raw.targetAmount ?? raw.target_amount ?? 0);
  const raised = Number(raw.raisedAmount ?? raw.total_contributed ?? 0);
  const members = (raw.members || []).map((m, i) => {
    const name = String(m.name ?? m.display_name ?? 'Member');
    const phone = String(m.phone ?? m.phone_e164 ?? '');
    const initials =
      m.initials ||
      (
        name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map(p => p[0] ?? '')
          .join('')
          .toUpperCase() || '??'
      );
    return {
      id: String(m.id ?? `m-${i}-${phone}`),
      name,
      phone,
      initials,
      status: normalizeStatus(m.status),
      contributed: Number(m.contributed ?? m.contributed_amount ?? 0),
      share: Number(m.share ?? m.share_target ?? 0),
      isCreator: Boolean(m.isCreator || m.role === 'creator'),
      avatarColor: 'bg-[var(--accent)]/15 text-[var(--accent)]',
    };
  });

  return {
    id: String(raw.id),
    title: String(raw.title || 'Group pot'),
    subtitle: String(raw.subtitle ?? raw.note ?? 'Shared collaborative target'),
    targetAmount: target,
    raisedAmount: raised,
    myStatus: normalizeStatus(raw.myStatus ?? raw.my_status),
    myContribution: Number(raw.myContribution ?? raw.my_contributed ?? 0),
    frequency: String(raw.frequency || 'Flexible'),
    members,
  };
}

export async function apiPots() {
  const data = await apiRequest<ApiGroupPot[] | { pots: ApiGroupPot[] }>('/pots');
  const list = Array.isArray(data) ? data : data?.pots ?? [];
  return list.map(mapApiPot);
}

export async function apiCreatePot(payload: {
  title: string;
  note?: string;
  targetAmount: number;
  memberPhones: string[];
  completionMode?: 'full_contribution' | 'time_deadline';
  frequency?: string;
}) {
  const raw = await apiRequest<ApiGroupPot>('/pots', {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title,
      note: payload.note,
      targetAmount: payload.targetAmount,
      memberPhones: payload.memberPhones,
      completionMode: payload.completionMode || 'full_contribution',
      frequency: payload.frequency,
    }),
  });
  return mapApiPot(raw);
}

export async function apiContributePot(id: string, payload: { amount: number; pin: string }) {
  const raw = await apiRequest<ApiGroupPot>(`/pots/${id}/contribute`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapApiPot(raw);
}

export async function apiAcceptPot(id: string) {
  const raw = await apiRequest<ApiGroupPot>(`/pots/${id}/accept`, { method: 'POST' });
  return mapApiPot(raw);
}

export async function apiDeclinePot(id: string) {
  const raw = await apiRequest<ApiGroupPot>(`/pots/${id}/decline`, { method: 'POST' });
  return mapApiPot(raw);
}

/** Lookup an Xtrapay user by phone — returns name if they have the app. */
export async function apiLookupUserByPhone(phone: string) {
  const normalized = phone.replace(/\s+/g, '');
  const q = new URLSearchParams({ phone: normalized });
  try {
    return await apiRequest<{
      found: boolean;
      fullName?: string | null;
      name?: string | null;
      phone?: string;
      hasWallet?: boolean;
      walletId?: string | null;
    }>(`/users/lookup?${q}`);
  } catch (err) {
    // Alias some stacks use for wallet name enquiry
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
      return apiRequest<{
        found: boolean;
        fullName?: string | null;
        name?: string | null;
        phone?: string;
        hasWallet?: boolean;
        walletId?: string | null;
      }>('/transfers/wallet-enquiry', {
        method: 'POST',
        body: JSON.stringify({ phone: normalized }),
      });
    }
    throw err;
  }
}

/* ── Nearby pay ── */

export async function apiProximityReceiveSession() {
  return apiRequest<{
    bleToken: string;
    expiresAt?: string;
    displayName: string;
    walletTag?: string;
    phone?: string;
  }>('/proximity/receive-session');
}

export async function apiProximityResolve(bleToken: string) {
  return apiRequest<{
    mode?: string;
    hasWallet?: boolean;
    recipientName: string;
    walletId?: string;
    walletTag?: string;
    phone?: string;
  }>('/proximity/resolve', {
    method: 'POST',
    body: JSON.stringify({ bleToken }),
  });
}

export async function apiProximityPay(payload: {
  bleToken: string;
  amount: number;
  pin: string;
  narration?: string;
}) {
  return apiRequest<{
    reference: string;
    amount: number;
    recipientName: string;
    walletBalance?: number;
  }>('/proximity/pay', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/* ── Pay at shop ── */

export async function apiShopsNearby() {
  try {
    const data = await apiRequest<
      Array<{
        id: string;
        name: string;
        terminalId: string;
        amount?: number | null;
        merchantCategory?: string;
        rssi?: string;
        distance?: string;
        sessionUuid?: string;
        sessionKind?: 'pos_checkout' | 'presence';
        accountNumber?: string;
        bankCode?: string;
      }>
    >('/shops/nearby');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function apiShopPay(payload: {
  sessionUuid?: string;
  terminalId: string;
  accountNumber?: string;
  bankCode?: string;
  amount: number;
  recipientName: string;
  pin: string;
  idempotencyKey?: string;
}) {
  return apiRequest<{
    reference: string;
    amount: number;
    walletBalance?: number;
  }>('/shops/pay', {
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

/* ── In-app notifications (credits / money requests / group savings) ── */

export type ApiAppNotification = {
  id: string;
  type?: string;
  kind?: string;
  title?: string;
  body?: string;
  message?: string;
  amount?: number | null;
  currency?: string | null;
  walletId?: string | null;
  wallet_id?: string | null;
  reference?: string | null;
  action?: string | null;
  screen?: string | null;
  entityType?: string | null;
  entity_type?: string | null;
  entityId?: string | null;
  entity_id?: string | null;
  read?: boolean;
  createdAt?: string;
  created_at?: string;
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  amount: number | null;
  walletId: string | null;
  reference: string | null;
  /** App screen hint: ask_money | save_together | history | … */
  action: string | null;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  createdAt: string;
};

function notificationHaystack(n: Pick<AppNotification, 'type' | 'title' | 'body' | 'action' | 'entityType'>): string {
  return `${n.type} ${n.title} ${n.body} ${n.action || ''} ${n.entityType || ''}`.toLowerCase();
}

/** Credit / VA / wallet top-up style alerts that should chime + refresh balances. */
export function isCreditTopUpNotification(
  n: Pick<AppNotification, 'type' | 'title' | 'body' | 'action' | 'entityType'>
): boolean {
  const t = notificationHaystack(n);
  if (isMoneyRequestNotification(n) || isGroupSavingsNotification(n)) return false;
  return (
    t.includes('credit') ||
    t.includes('topup') ||
    t.includes('top-up') ||
    t.includes('top up') ||
    t.includes('inward') ||
    t.includes('incoming') ||
    t.includes('deposit') ||
    t.includes('received') ||
    t.includes('funding') ||
    t.includes('va_credit') ||
    t.includes('wallet_credit')
  );
}

/** Incoming / status updates for Ask Money (peer requests). */
export function isMoneyRequestNotification(
  n: Pick<AppNotification, 'type' | 'title' | 'body' | 'action' | 'entityType'>
): boolean {
  const t = notificationHaystack(n);
  return (
    t.includes('money_request') ||
    n.action === 'ask_money' ||
    n.entityType === 'money_request' ||
    (t.includes('asked you') && t.includes('request')) ||
    (t.includes('money request') && !t.includes('credit'))
  );
}

/** Group savings / pot invites & contributions. */
export function isGroupSavingsNotification(
  n: Pick<AppNotification, 'type' | 'title' | 'body' | 'action' | 'entityType'>
): boolean {
  const t = notificationHaystack(n);
  return (
    t.includes('pot_') ||
    t.includes('pot invite') ||
    t.includes('group savings') ||
    t.includes('group pot') ||
    n.action === 'save_together' ||
    n.entityType === 'pot' ||
    (t.includes('invite') && t.includes('pot')) ||
    t.includes('contribution') && (t.includes('pot') || t.includes('group'))
  );
}

/** Screen to open when the user taps the alert. */
export function notificationDeepLinkScreen(
  n: Pick<AppNotification, 'type' | 'title' | 'body' | 'action' | 'entityType'>
): 'ask_money' | 'save_together' | 'history' | 'notifications' | null {
  if (n.action === 'ask_money' || isMoneyRequestNotification(n)) return 'ask_money';
  if (n.action === 'save_together' || isGroupSavingsNotification(n)) return 'save_together';
  if (n.action === 'history' || isCreditTopUpNotification(n)) return 'history';
  if (n.action === 'notifications') return 'notifications';
  return null;
}

export function mapApiNotification(raw: ApiAppNotification): AppNotification {
  return {
    id: String(raw.id),
    type: String(raw.type || raw.kind || 'alert'),
    title: String(raw.title || 'Notification'),
    body: String(raw.body || raw.message || ''),
    amount:
      raw.amount != null && Number.isFinite(Number(raw.amount)) ? Number(raw.amount) : null,
    walletId: raw.walletId != null || raw.wallet_id != null
      ? String(raw.walletId ?? raw.wallet_id)
      : null,
    reference: raw.reference != null ? String(raw.reference) : null,
    action: raw.action != null || raw.screen != null
      ? String(raw.action ?? raw.screen)
      : null,
    entityType:
      raw.entityType != null || raw.entity_type != null
        ? String(raw.entityType ?? raw.entity_type)
        : null,
    entityId:
      raw.entityId != null || raw.entity_id != null
        ? String(raw.entityId ?? raw.entity_id)
        : null,
    read: Boolean(raw.read),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
  };
}

/**
 * GET /notifications — inbox for the signed-in user.
 * Query: unreadOnly=1, since=<iso|id>, limit=
 */
export async function apiNotifications(params?: {
  unreadOnly?: boolean;
  since?: string;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.unreadOnly) q.set('unreadOnly', '1');
  if (params?.since) q.set('since', params.since);
  if (params?.limit) q.set('limit', String(params.limit));
  const suffix = q.toString() ? `?${q}` : '';
  const data = await apiRequest<
    ApiAppNotification[] | { notifications: ApiAppNotification[]; unreadCount?: number }
  >(`/notifications${suffix}`);
  const list = Array.isArray(data) ? data : data?.notifications ?? [];
  const unreadCount = Array.isArray(data)
    ? list.filter(n => !n.read).length
    : Number((data as { unreadCount?: number }).unreadCount ?? list.filter(n => !n.read).length);
  return {
    items: list.map(mapApiNotification),
    unreadCount,
  };
}

export async function apiMarkNotificationRead(id: string) {
  return apiRequest<{ ok?: boolean }>(`/notifications/${id}/read`, { method: 'POST' });
}

export async function apiMarkAllNotificationsRead() {
  return apiRequest<{ ok?: boolean }>('/notifications/read-all', { method: 'POST' });
}

/** Public legal docs — Terms / Privacy (CMS-backed). */
export async function apiLegalDocument(kind: 'terms' | 'privacy') {
  const data = await apiRequest<{
    title?: string;
    updatedAt?: string;
    updated_at?: string;
    sections?: Array<{ heading?: string; title?: string; body?: string; content?: string }>;
  }>(`/legal/${kind}`);
  const sections = (data.sections || [])
    .map(s => ({
      heading: String(s.heading || s.title || ''),
      body: String(s.body || s.content || ''),
    }))
    .filter(s => s.heading && s.body);
  return {
    title: data.title ? String(data.title) : kind === 'terms' ? 'Terms of use' : 'Privacy policy',
    updatedAt: String(data.updatedAt ?? data.updated_at ?? ''),
    sections,
  };
}

export function mapApiWallets(
  wallets: ApiBootstrap['wallets']
): WalletAccount[] {
  return wallets.map(mapApiWallet);
}

/* ── Analytics (Utilities screen) ── */

export type ApiAnalyticsChannel = {
  id?: string;
  label?: string;
  pct?: number;
  amount?: number;
  color?: string;
};

export type ApiAnalyticsDay = {
  day?: string;
  label?: string;
  amount?: number;
  heightPct?: number;
};

export type ApiAnalyticsCategory = {
  label?: string;
  amount?: number;
  pct?: number;
  icon?: string;
};

export type ApiCashflowAnalytics = {
  context?: string;
  periodDays?: number;
  period_days?: number;
  healthLabel?: string;
  health_label?: string;
  healthScorePct?: number;
  health_score_pct?: number;
  marginPct?: number;
  margin_pct?: number;
  netBalance?: number;
  net_balance?: number;
  burnPerDay?: number;
  burn_per_day?: number;
  runwayDays?: number;
  runway_days?: number;
  totalInflow?: number;
  total_inflow?: number;
  totalOutflow?: number;
  total_outflow?: number;
  inflowCount?: number;
  inflow_count?: number;
  outflowCount?: number;
  outflow_count?: number;
  inflowChangePct?: number;
  inflow_change_pct?: number;
  channels?: ApiAnalyticsChannel[];
  velocityAvgPerDay?: number;
  velocity_avg_per_day?: number;
  velocityDays?: ApiAnalyticsDay[];
  velocity_days?: ApiAnalyticsDay[];
  categories?: ApiAnalyticsCategory[];
};

export type AppCashflowAnalytics = {
  healthLabel: string;
  healthScorePct: number;
  marginPct: number;
  netBalance: number;
  burnPerDay: number;
  runwayDays: number;
  totalInflow: number;
  totalOutflow: number;
  inflowCount: number;
  outflowCount: number;
  inflowChangePct: number;
  channels: { label: string; pct: number; amount: number }[];
  velocityAvgPerDay: number;
  velocityDays: { day: string; amount: number; heightPct: number }[];
  categories: { label: string; amount: number; pct: number; icon: string }[];
};

export function mapApiCashflowAnalytics(raw: ApiCashflowAnalytics): AppCashflowAnalytics {
  const channels = (raw.channels || []).map(c => ({
    label: String(c.label || 'Channel'),
    pct: Number(c.pct ?? 0),
    amount: Number(c.amount ?? 0),
  }));
  const velocityDays = (raw.velocityDays ?? raw.velocity_days ?? []).map(d => ({
    day: String(d.day ?? d.label ?? ''),
    amount: Number(d.amount ?? 0),
    heightPct: Number(d.heightPct ?? 50),
  }));
  const categories = (raw.categories || []).map(c => ({
    label: String(c.label || 'Category'),
    amount: Number(c.amount ?? 0),
    pct: Number(c.pct ?? 0),
    icon: String(c.icon || 'receipt_long'),
  }));
  return {
    healthLabel: String(raw.healthLabel ?? raw.health_label ?? 'Optimal flow'),
    healthScorePct: Number(raw.healthScorePct ?? raw.health_score_pct ?? 0),
    marginPct: Number(raw.marginPct ?? raw.margin_pct ?? 0),
    netBalance: Number(raw.netBalance ?? raw.net_balance ?? 0),
    burnPerDay: Number(raw.burnPerDay ?? raw.burn_per_day ?? 0),
    runwayDays: Number(raw.runwayDays ?? raw.runway_days ?? 0),
    totalInflow: Number(raw.totalInflow ?? raw.total_inflow ?? 0),
    totalOutflow: Number(raw.totalOutflow ?? raw.total_outflow ?? 0),
    inflowCount: Number(raw.inflowCount ?? raw.inflow_count ?? 0),
    outflowCount: Number(raw.outflowCount ?? raw.outflow_count ?? 0),
    inflowChangePct: Number(raw.inflowChangePct ?? raw.inflow_change_pct ?? 0),
    channels,
    velocityAvgPerDay: Number(raw.velocityAvgPerDay ?? raw.velocity_avg_per_day ?? 0),
    velocityDays,
    categories,
  };
}

/** GET /analytics/cashflow?context=personal|business&periodDays=30|90|365 */
export async function apiCashflowAnalytics(params: {
  context: 'personal' | 'business';
  periodDays: 30 | 90 | 365;
}) {
  const q = new URLSearchParams({
    context: params.context,
    periodDays: String(params.periodDays),
  });
  const raw = await apiRequest<ApiCashflowAnalytics>(`/analytics/cashflow?${q}`);
  return mapApiCashflowAnalytics(raw);
}

/* ── Settlement ── */

export type ApiSettlementBank = {
  id?: string;
  bankName?: string;
  bank_name?: string;
  accountNumber?: string;
  account_number?: string;
  accountName?: string;
  account_name?: string;
  sharePct?: number;
  share_pct?: number;
};

export type ApiSettlementBatch = {
  id: string;
  reference?: string;
  amount?: number;
  status?: string;
  bankName?: string;
  bank_name?: string;
  scheduledAt?: string;
  scheduled_at?: string;
  postedAt?: string;
  posted_at?: string;
  date?: string;
};

export type ApiSettlementOverview = {
  pendingAmount?: number;
  pending_amount?: number;
  nextWindowAt?: string;
  next_window_at?: string;
  nextWindowLabel?: string;
  next_window_label?: string;
  cutOffLabel?: string;
  cut_off_label?: string;
  destinationSummary?: string;
  destination_summary?: string;
  availableForSettlement?: number;
  available_for_settlement?: number;
  minInstantAmount?: number;
  min_instant_amount?: number;
  instantFeeNgn?: number;
  instant_fee_ngn?: number;
  banks?: ApiSettlementBank[];
  recent?: ApiSettlementBatch[];
  batches?: ApiSettlementBatch[];
};

export type AppSettlementOverview = {
  pendingAmount: number;
  availableForSettlement: number;
  nextWindowLabel: string;
  cutOffLabel: string;
  destinationSummary: string;
  minInstantAmount: number;
  instantFeeNgn: number;
  banks: {
    id: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    sharePct: number;
  }[];
  recent: {
    id: string;
    reference: string;
    amount: number;
    status: string;
    bankName: string;
    when: string;
  }[];
};

export function mapApiSettlementOverview(raw: ApiSettlementOverview): AppSettlementOverview {
  const banks = (raw.banks || []).map((b, i) => ({
    id: String(b.id || `bank-${i}`),
    bankName: String(b.bankName ?? b.bank_name ?? 'Bank'),
    accountNumber: String(b.accountNumber ?? b.account_number ?? ''),
    accountName: String(b.accountName ?? b.account_name ?? ''),
    sharePct: Number(b.sharePct ?? b.share_pct ?? 0),
  }));
  const recentSrc = raw.recent ?? raw.batches ?? [];
  const recent = recentSrc.map(b => ({
    id: String(b.id),
    reference: String(b.reference || b.id),
    amount: Number(b.amount ?? 0),
    status: String(b.status || 'Pending'),
    bankName: String(b.bankName ?? b.bank_name ?? ''),
    when: String(b.postedAt ?? b.posted_at ?? b.scheduledAt ?? b.scheduled_at ?? b.date ?? '—'),
  }));
  return {
    pendingAmount: Number(raw.pendingAmount ?? raw.pending_amount ?? 0),
    availableForSettlement: Number(
      raw.availableForSettlement ?? raw.available_for_settlement ?? 0
    ),
    nextWindowLabel: String(
      raw.nextWindowLabel ?? raw.next_window_label ?? raw.nextWindowAt ?? raw.next_window_at ?? '—'
    ),
    cutOffLabel: String(raw.cutOffLabel ?? raw.cut_off_label ?? ''),
    destinationSummary: String(
      raw.destinationSummary ?? raw.destination_summary ?? 'Settlement banks'
    ),
    minInstantAmount: Number(raw.minInstantAmount ?? raw.min_instant_amount ?? 0),
    instantFeeNgn: Number(raw.instantFeeNgn ?? raw.instant_fee_ngn ?? 0),
    banks,
    recent,
  };
}

export async function apiSettlementOverview() {
  const raw = await apiRequest<ApiSettlementOverview>('/settlement/overview');
  return mapApiSettlementOverview(raw);
}

export async function apiSettlementBatches() {
  const data = await apiRequest<
    ApiSettlementBatch[] | { batches: ApiSettlementBatch[]; recent?: ApiSettlementBatch[] }
  >('/settlement/batches');
  const list = Array.isArray(data) ? data : data?.batches ?? data?.recent ?? [];
  return list.map(b => ({
    id: String(b.id),
    reference: String(b.reference || b.id),
    amount: Number(b.amount ?? 0),
    status: String(b.status || 'Pending'),
    bankName: String(b.bankName ?? b.bank_name ?? ''),
    when: String(b.postedAt ?? b.posted_at ?? b.scheduledAt ?? b.scheduled_at ?? b.date ?? '—'),
  }));
}

export async function apiRequestInstantSettlement(payload: {
  amount: number;
  pin: string;
  bankId?: string;
}) {
  return apiRequest<{
    batch?: ApiSettlementBatch;
    reference?: string;
    feeNgn?: number;
    availableForSettlement?: number;
  }>('/settlement/instant', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/* ── Statements ── */

export type StatementKind = 'wallet' | 'savings' | 'card' | 'pos' | 'business';

export async function apiCreateStatement(payload: {
  kind: StatementKind;
  period: '7' | '30' | '90' | '365';
  format: 'pdf' | 'csv';
  posId?: string;
  context?: 'personal' | 'business';
}) {
  return apiRequest<{
    downloadUrl?: string;
    download_url?: string;
    url?: string;
    expiresAt?: string;
    fileName?: string;
  }>('/statements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/* ── Recurring payments ── */

export type ApiRecurringPlan = {
  id: string;
  recipientName?: string;
  recipient_name?: string;
  bankName?: string;
  bank_name?: string;
  bankCode?: string;
  bank_code?: string;
  accountNumber?: string;
  account_number?: string;
  amount?: number;
  narration?: string;
  scheduleLabel?: string;
  schedule_label?: string;
  scheduleMode?: string;
  schedule_mode?: string;
  customCadence?: string;
  custom_cadence?: string;
  dayOfMonth?: number;
  day_of_month?: number;
  everyNDays?: number;
  every_n_days?: number;
  nextRun?: string;
  next_run?: string;
  active?: boolean;
  channel?: string;
  walletId?: string;
  wallet_id?: string;
};

export type ApiRecurringRun = {
  id: string;
  planId?: string;
  plan_id?: string;
  recipientName?: string;
  recipient_name?: string;
  amount?: number;
  status?: string;
  date?: string;
  time?: string;
  reference?: string;
};

export type AppRecurringPlan = {
  id: string;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  narration: string;
  scheduleLabel: string;
  nextRun: string;
  active: boolean;
};

export type AppRecurringRun = {
  id: string;
  planId: string;
  recipientName: string;
  amount: number;
  status: 'Successful' | 'Failed' | 'Pending';
  date: string;
  time: string;
  reference: string;
};

export function mapApiRecurringPlan(raw: ApiRecurringPlan): AppRecurringPlan {
  return {
    id: String(raw.id),
    recipientName: String(raw.recipientName ?? raw.recipient_name ?? 'Beneficiary'),
    bankName: String(raw.bankName ?? raw.bank_name ?? ''),
    accountNumber: String(raw.accountNumber ?? raw.account_number ?? ''),
    amount: Number(raw.amount ?? 0),
    narration: String(raw.narration || ''),
    scheduleLabel: String(raw.scheduleLabel ?? raw.schedule_label ?? ''),
    nextRun: String(raw.nextRun ?? raw.next_run ?? '—'),
    active: raw.active !== false,
  };
}

export function mapApiRecurringRun(raw: ApiRecurringRun): AppRecurringRun {
  const st = (raw.status || '').toLowerCase();
  const status: AppRecurringRun['status'] =
    st === 'failed' || st === 'failure' ? 'Failed' : st === 'pending' ? 'Pending' : 'Successful';
  return {
    id: String(raw.id),
    planId: String(raw.planId ?? raw.plan_id ?? ''),
    recipientName: String(raw.recipientName ?? raw.recipient_name ?? ''),
    amount: Number(raw.amount ?? 0),
    status,
    date: String(raw.date || '—'),
    time: String(raw.time || ''),
    reference: String(raw.reference || '—'),
  };
}

export async function apiRecurringPlans() {
  const data = await apiRequest<ApiRecurringPlan[] | { plans: ApiRecurringPlan[] }>('/recurring');
  const list = Array.isArray(data) ? data : data?.plans ?? [];
  return list.map(mapApiRecurringPlan);
}

export async function apiCreateRecurring(payload: {
  channel: 'bank' | 'wallet';
  recipientName: string;
  bankName?: string;
  bankCode?: string;
  accountNumber: string;
  amount: number;
  narration?: string;
  scheduleMode: 'end_of_month' | 'custom';
  customCadence?: 'daily' | 'weekly' | 'monthly' | 'every_n_days';
  dayOfMonth?: number;
  everyNDays?: number;
  pin: string;
}) {
  const raw = await apiRequest<ApiRecurringPlan>('/recurring', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapApiRecurringPlan(raw);
}

export async function apiPatchRecurring(
  id: string,
  payload: { active: boolean }
) {
  const raw = await apiRequest<ApiRecurringPlan>(`/recurring/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return mapApiRecurringPlan(raw);
}

export async function apiDeleteRecurring(id: string) {
  return apiRequest<{ ok?: boolean }>(`/recurring/${id}`, { method: 'DELETE' });
}

export async function apiRecurringRuns(planId?: string) {
  const path = planId ? `/recurring/${planId}/runs` : '/recurring/runs';
  const data = await apiRequest<ApiRecurringRun[] | { runs: ApiRecurringRun[] }>(path);
  const list = Array.isArray(data) ? data : data?.runs ?? [];
  return list.map(mapApiRecurringRun);
}

/* ── X-Points ── */

export type ApiXPointsLedgerItem = {
  id: string;
  title?: string;
  meta?: string;
  amount?: number;
  xPoints?: number;
  x_points?: number;
  commission?: number;
  when?: string;
  date?: string;
  status?: string;
};

export type ApiXPointsSummary = {
  available?: number;
  pending?: number;
  redeemed?: number;
  total?: number;
  commissionEarned?: number;
  commission_earned?: number;
  xpToNaira?: number;
  xp_to_naira?: number;
  rateLabel?: string;
  rate_label?: string;
  history?: ApiXPointsLedgerItem[];
  ledger?: ApiXPointsLedgerItem[];
};

export type AppXPointsSummary = {
  available: number;
  pending: number;
  redeemed: number;
  total: number;
  commissionEarned: number;
  xpToNaira: number;
  rateLabel: string;
  ledger: {
    id: string;
    title: string;
    meta: string;
    amount: number;
    xPoints: number;
    commission: number;
    when: string;
    status: string;
  }[];
};

export function mapApiXPointsSummary(raw: ApiXPointsSummary): AppXPointsSummary {
  const available = Number(raw.available ?? 0);
  const pending = Number(raw.pending ?? 0);
  const redeemed = Number(raw.redeemed ?? 0);
  const total = Number(raw.total ?? available + pending + redeemed);
  const ledgerSrc = raw.history ?? raw.ledger ?? [];
  return {
    available,
    pending,
    redeemed,
    total,
    commissionEarned: Number(raw.commissionEarned ?? raw.commission_earned ?? 0),
    xpToNaira: Number(raw.xpToNaira ?? raw.xp_to_naira ?? 5),
    rateLabel: String(raw.rateLabel ?? raw.rate_label ?? ''),
    ledger: ledgerSrc.map(item => ({
      id: String(item.id),
      title: String(item.title || 'Entry'),
      meta: String(item.meta || ''),
      amount: Number(item.amount ?? 0),
      xPoints: Number(item.xPoints ?? item.x_points ?? 0),
      commission: Number(item.commission ?? 0),
      when: String(item.when ?? item.date ?? '—'),
      status: String(item.status || 'Successful'),
    })),
  };
}

export async function apiXPoints() {
  const raw = await apiRequest<ApiXPointsSummary>('/xpoints');
  return mapApiXPointsSummary(raw);
}

export async function apiRedeemXPoints(payload: {
  channel: 'wallet' | 'airtime' | 'data' | 'commission';
  amount: number;
  pin: string;
  phone?: string;
}) {
  return apiRequest<{
    available?: number;
    redeemed?: number;
    pending?: number;
    walletBalance?: number;
    cashValue?: number;
    ledgerItem?: ApiXPointsLedgerItem;
  }>('/xpoints/redeem', {
    method: 'POST',
    body: JSON.stringify({
      channel: payload.channel,
      amount: payload.amount,
      xPoints: payload.amount,
      pin: payload.pin,
      phone: payload.phone,
    }),
  });
}

/* ── POS / Terminals ── */

export type ApiTerminal = {
  id: string;
  terminalId?: string;
  terminal_id?: string;
  serialNumber?: string;
  serial_number?: string;
  name?: string;
  model?: string;
  address?: string;
  status?: string;
  balance?: number;
  dateMapped?: string;
  date_mapped?: string;
  lastTransaction?: { label?: string; at?: string } | null;
  last_transaction?: { label?: string; at?: string } | null;
  pendingAddress?: string | null;
  pending_address?: string | null;
  addressRequestStatus?: string | null;
  address_request_status?: string | null;
};

export type ApiTerminalTx = {
  id: string;
  terminalId?: string;
  terminal_id?: string;
  type?: string;
  amount?: number;
  status?: string;
  reference?: string;
  date?: string;
  time?: string;
  commission?: number;
  xPoints?: number;
  x_points?: number;
};

function mapTerminalStatus(raw?: string | null): import('../types').TerminalStatus {
  const v = (raw || '').toLowerCase();
  if (v === 'offline') return 'Offline';
  if (v === 'locked' || v === 'blocked') return 'Locked';
  if (v === 'inactive') return 'Inactive';
  if (v === 'pending' || v === 'processing') return 'Pending';
  return 'Active';
}

function mapAddressRequestStatus(
  raw?: string | null
): import('../types').Terminal['addressRequestStatus'] {
  const v = (raw || '').toLowerCase();
  if (v === 'pending') return 'Pending';
  if (v === 'approved') return 'Approved';
  if (v === 'rejected') return 'Rejected';
  return 'None';
}

export function mapApiTerminal(raw: ApiTerminal): import('../types').Terminal {
  const last = raw.lastTransaction ?? raw.last_transaction;
  return {
    id: String(raw.id),
    terminalId: String(raw.terminalId ?? raw.terminal_id ?? raw.id),
    serialNumber: String(raw.serialNumber ?? raw.serial_number ?? '—'),
    name: String(raw.name || 'POS'),
    model: String(raw.model || '—'),
    address: String(raw.address || '—'),
    status: mapTerminalStatus(raw.status),
    balance: Number(raw.balance ?? 0),
    dateMapped: String(raw.dateMapped ?? raw.date_mapped ?? '—'),
    lastTransaction: {
      label: String(last?.label || 'No transactions yet'),
      at: String(last?.at || '—'),
    },
    pendingAddress: raw.pendingAddress ?? raw.pending_address ?? undefined,
    addressRequestStatus: mapAddressRequestStatus(
      raw.addressRequestStatus ?? raw.address_request_status
    ),
  };
}

export function mapApiTerminalTx(raw: ApiTerminalTx): import('../types').TerminalTx {
  const st = (raw.status || '').toLowerCase();
  let status: import('../types').TerminalTx['status'] = 'Successful';
  if (st === 'failed' || st === 'failure') status = 'Failed';
  else if (st === 'pending') status = 'Pending';
  else if (st === 'reversed' || st === 'reversal') status = 'Reversed';
  else if (st === 'declined') status = 'Declined';
  return {
    id: String(raw.id),
    terminalId: String(raw.terminalId ?? raw.terminal_id ?? ''),
    type: String(raw.type || 'Transaction'),
    amount: Number(raw.amount ?? 0),
    status,
    reference: String(raw.reference || '—'),
    date: String(raw.date || '—'),
    time: String(raw.time || ''),
    commission: raw.commission != null ? Number(raw.commission) : undefined,
    xPoints: Number(raw.xPoints ?? raw.x_points ?? 0) || undefined,
  };
}

export async function apiTerminals() {
  const data = await apiRequest<ApiTerminal[] | { terminals: ApiTerminal[] }>('/terminals');
  const list = Array.isArray(data) ? data : data?.terminals ?? [];
  return list.map(mapApiTerminal);
}

export async function apiTerminal(id: string) {
  const raw = await apiRequest<ApiTerminal>(`/terminals/${id}`);
  return mapApiTerminal(raw);
}

export async function apiTerminalTransactions(id: string) {
  const data = await apiRequest<
    ApiTerminalTx[] | { transactions: ApiTerminalTx[]; txs?: ApiTerminalTx[] }
  >(`/terminals/${id}/transactions`);
  const list = Array.isArray(data)
    ? data
    : data?.transactions ?? data?.txs ?? [];
  return list.map(mapApiTerminalTx);
}

export async function apiTerminalXPoints(id: string) {
  return apiRequest<{
    total?: number;
    available?: number;
    pending?: number;
    redeemed?: number;
    commission?: number;
  }>(`/terminals/${id}/xpoints`);
}

export async function apiRenameTerminal(id: string, name: string) {
  const raw = await apiRequest<ApiTerminal>(`/terminals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
  return mapApiTerminal(raw);
}

export async function apiFundTerminal(
  id: string,
  payload: { amount: number; pin: string }
) {
  return apiRequest<{
    terminal?: ApiTerminal;
    balance?: number;
    walletBalance?: number;
    reference?: string;
  }>(`/terminals/${id}/fund`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiWithdrawTerminal(
  id: string,
  payload: { amount: number; pin?: string }
) {
  return apiRequest<{
    terminal?: ApiTerminal;
    balance?: number;
    walletBalance?: number;
    reference?: string;
  }>(`/terminals/${id}/withdraw`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiSweepTerminals(payload: {
  terminalIds: 'all' | string[];
  amount?: number;
  pin: string;
}) {
  return apiRequest<{
    swept?: number;
    walletBalance?: number;
    terminals?: ApiTerminal[];
  }>('/terminals/sweep', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiLockTerminal(id: string) {
  const raw = await apiRequest<ApiTerminal>(`/terminals/${id}/lock`, { method: 'POST' });
  return mapApiTerminal(raw);
}

export async function apiUnlockTerminal(id: string, pin: string) {
  const raw = await apiRequest<ApiTerminal>(`/terminals/${id}/unlock`, {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
  return mapApiTerminal(raw);
}

export async function apiTerminalAddressRequest(
  id: string,
  payload: { address: string; reason: string }
) {
  const raw = await apiRequest<ApiTerminal>(`/terminals/${id}/address-request`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapApiTerminal(raw);
}

export async function apiTerminalSupport(
  id: string,
  payload: {
    type: string;
    note?: string;
    transactionId?: string;
  }
) {
  return apiRequest<{ ticketId?: string; reference?: string; status?: string }>(
    `/terminals/${id}/support`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/* ── Referrals (mirror consumer engine under /xtrapay/referrals/*) ── */

export type AppReferralRules = {
  firstTopupBonusPct: number;
  firstTopupBonusCap: number;
  minFirstTopup: number;
  milestoneEveryTxns: number;
  milestoneBonus: number;
  bonusWindowMonths: number;
  description: string;
};

export type AppReferralMe = {
  payCode: string;
  phone: string;
  referredCount: number;
  earnedTotal: number;
  pendingBonuses: number;
  bonusWindowOpen: boolean;
  referredByCode: string | null;
  rank: number | null;
};

export type AppReferralInvite = {
  payCode: string;
  shareText: string;
  shareUrl: string;
  qrPayload?: string;
};

export type AppReferralEntry = {
  id: string;
  name: string;
  phoneMasked: string;
  status: string;
  joinedAt: string;
  earnedFromThem: number;
};

export type AppReferralBonus = {
  id: string;
  title: string;
  amount: number;
  status: string;
  createdAt: string;
  meta: string;
};

export type AppReferralLeaderRow = {
  rank: number;
  name: string;
  payCode: string;
  referredCount: number;
  earnedTotal: number;
  isMe: boolean;
};

function num(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function apiReferralRules(): Promise<AppReferralRules> {
  const raw = await apiRequest<Record<string, unknown>>('/referrals/rules');
  return {
    firstTopupBonusPct: num(raw.firstTopupBonusPct ?? raw.first_topup_bonus_pct ?? raw.topupPct, 0),
    firstTopupBonusCap: num(raw.firstTopupBonusCap ?? raw.first_topup_bonus_cap ?? raw.topupCap, 0),
    minFirstTopup: num(raw.minFirstTopup ?? raw.min_first_topup ?? raw.minTopup, 0),
    milestoneEveryTxns: num(
      raw.milestoneEveryTxns ?? raw.milestone_every_txns ?? raw.milestoneEvery,
      100
    ),
    milestoneBonus: num(raw.milestoneBonus ?? raw.milestone_bonus, 200),
    bonusWindowMonths: num(raw.bonusWindowMonths ?? raw.bonus_window_months, 6),
    description: String(
      raw.description ??
        raw.summary ??
        'Earn when people you invite top up and spend on Xtrapay.'
    ),
  };
}

export async function apiReferralMe(): Promise<AppReferralMe> {
  const raw = await apiRequest<Record<string, unknown>>('/referrals/me');
  return {
    payCode: String(raw.payCode ?? raw.pay_code ?? raw.code ?? ''),
    phone: String(raw.phone ?? ''),
    referredCount: num(raw.referredCount ?? raw.referred_count ?? raw.count),
    earnedTotal: num(raw.earnedTotal ?? raw.earned_total ?? raw.totalEarned),
    pendingBonuses: num(raw.pendingBonuses ?? raw.pending_bonuses ?? raw.pending),
    bonusWindowOpen: Boolean(
      raw.bonusWindowOpen ?? raw.bonus_window_open ?? raw.windowOpen ?? true
    ),
    referredByCode:
      raw.referredByCode != null || raw.referred_by_code != null || raw.referredBy != null
        ? String(raw.referredByCode ?? raw.referred_by_code ?? raw.referredBy)
        : null,
    rank:
      raw.rank != null && Number.isFinite(Number(raw.rank)) ? Number(raw.rank) : null,
  };
}

export async function apiReferralInvite(): Promise<AppReferralInvite> {
  const raw = await apiRequest<Record<string, unknown>>('/referrals/invite');
  const payCode = String(raw.payCode ?? raw.pay_code ?? raw.code ?? '');
  const shareUrl = String(
    raw.shareUrl ??
      raw.share_url ??
      raw.url ??
      (payCode ? `https://xtrapay.ng/?ref=${encodeURIComponent(payCode)}` : '')
  );
  const shareText = String(
    raw.shareText ??
      raw.share_text ??
      raw.message ??
      (payCode
        ? `Join me on Xtrapay — use my code ${payCode} when you sign up. ${shareUrl}`
        : 'Join me on Xtrapay.')
  );
  return {
    payCode,
    shareText,
    shareUrl,
    qrPayload: raw.qrPayload != null || raw.qr_payload != null
      ? String(raw.qrPayload ?? raw.qr_payload)
      : shareUrl || undefined,
  };
}

export async function apiReferralList(): Promise<AppReferralEntry[]> {
  const data = await apiRequest<
    Record<string, unknown>[] | { referrals?: Record<string, unknown>[]; list?: Record<string, unknown>[] }
  >('/referrals/list');
  const list = Array.isArray(data) ? data : data?.referrals ?? data?.list ?? [];
  return list.map((r, i) => ({
    id: String(r.id ?? `ref_${i}`),
    name: String(r.name ?? r.fullName ?? r.full_name ?? 'Member'),
    phoneMasked: String(r.phoneMasked ?? r.phone_masked ?? r.phone ?? '—'),
    status: String(r.status ?? 'active'),
    joinedAt: String(r.joinedAt ?? r.joined_at ?? r.createdAt ?? r.created_at ?? ''),
    earnedFromThem: num(r.earnedFromThem ?? r.earned_from_them ?? r.earned ?? r.bonus),
  }));
}

export async function apiReferralBonuses(): Promise<AppReferralBonus[]> {
  const data = await apiRequest<
    Record<string, unknown>[] | { bonuses?: Record<string, unknown>[]; items?: Record<string, unknown>[] }
  >('/referrals/bonuses');
  const list = Array.isArray(data) ? data : data?.bonuses ?? data?.items ?? [];
  return list.map((b, i) => ({
    id: String(b.id ?? `bonus_${i}`),
    title: String(b.title ?? b.label ?? b.type ?? 'Referral bonus'),
    amount: num(b.amount ?? b.value),
    status: String(b.status ?? 'paid'),
    createdAt: String(b.createdAt ?? b.created_at ?? b.date ?? ''),
    meta: String(b.meta ?? b.subtitle ?? b.note ?? ''),
  }));
}

export async function apiReferralLeaderboard(): Promise<AppReferralLeaderRow[]> {
  const data = await apiRequest<
    | Record<string, unknown>[]
    | { leaderboard?: Record<string, unknown>[]; rows?: Record<string, unknown>[] }
  >('/referrals/leaderboard');
  const list = Array.isArray(data) ? data : data?.leaderboard ?? data?.rows ?? [];
  return list.map((r, i) => ({
    rank: num(r.rank ?? i + 1, i + 1),
    name: String(r.name ?? r.fullName ?? r.full_name ?? 'Member'),
    payCode: String(r.payCode ?? r.pay_code ?? r.code ?? ''),
    referredCount: num(r.referredCount ?? r.referred_count ?? r.count),
    earnedTotal: num(r.earnedTotal ?? r.earned_total ?? r.earned),
    isMe: Boolean(r.isMe ?? r.is_me ?? r.me),
  }));
}
