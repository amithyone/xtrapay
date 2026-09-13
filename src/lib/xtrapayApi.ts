import { apiRequest, setAccessToken } from './api';
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

export async function apiSetPin(payload: { pin: string; confirmPin: string }) {
  return apiRequest<{ pinSet: boolean; message?: string; user?: ApiUserProfile }>(
    '/security/pin/set',
    {
      method: 'POST',
      body: JSON.stringify(payload),
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
  outstandingLoans?: number;
  outstanding_loans?: number;
};

export async function apiCreditOverview() {
  return apiRequest<ApiCreditOverview>('/credit/overview');
}

export async function apiRequestOverdraft(payload: { amount: number; pin?: string }) {
  const raw = await apiRequest<ApiMoneyRequest | ApiCreditOverview>('/credit/overdraft/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return raw;
}

export async function apiRequestLoan(payload: { amount: number; tenor?: string; pin?: string }) {
  const raw = await apiRequest<ApiMoneyRequest>('/credit/loans/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapApiMoneyRequest(raw);
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
  return apiRequest<{
    found: boolean;
    fullName?: string | null;
    phone?: string;
    hasWallet?: boolean;
  }>(`/users/lookup?${q}`);
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
    accountName: w.accountName,
    ussd: w.ussd,
  }));
}
