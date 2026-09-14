# Xtrapay — Backend contract & mock inventory

This document maps **everything the React app currently mocks** to what the backend must provide. Use it as the build checklist for APIs, models, and auth.

**Frontend stack:** Vite + React · state hub `src/context/TransactionContext.tsx` · types `src/types.ts`  
**Mock sources:** `src/data/*.ts` + screen-local seed state  
**Currency:** NGN (₦) unless noted (USD card amounts)  
**Timezone:** Africa/Lagos (WAT)

> Goal: replace every hard-coded seed and client-only mutation with authenticated API responses. The UI should become a consumer of these contracts.

---

## 1. Principles

| Rule | Detail |
|------|--------|
| Auth | All user/money endpoints require Bearer token (except public auth + legal). |
| Money | Amounts as **integer kobo** on the wire (`5000000` = ₦50,000.00) *or* decimal NGN with 2 places — pick one and stick to it. Frontend today uses `number` NGN. |
| IDs | Opaque string IDs (`tx-…`, `trm-…`, UUID ok). |
| Errors | `{ code, message, fields? }` + HTTP status. |
| Idempotency | Transfers, bills, loan disburse, collections: `Idempotency-Key` header. |
| PIN | Never send raw PIN logs. Prefer PIN challenge token / hashed verify endpoint. Mock today accepts any 4 digits. |
| Pagination | List endpoints: `?cursor=&limit=` or `page&pageSize`. |

### Suggested base URL

```
https://api.xtrapay.ng/v1
```

---

## 2. Data sources (post mock cleanup)

| Area | Source | Endpoint(s) |
|------|--------|-------------|
| Wallets / balances | API | `GET /bootstrap`, `GET /wallets` |
| Banks / beneficiaries | API | `GET /banks`, `GET /beneficiaries` |
| Transactions / history | API | `GET /transactions`, bootstrap `recentTransactions` |
| Savings / pots / ask-money | API | `/savings*`, `/pots*`, `/money-requests*` |
| VTU / bills | API | `/vtu/*` (Pay Bills, Airtime screens) |
| Cards / loans / terminals | API | `/cards*`, `/credit*`, `/terminals*` |
| Business | API | `GET/POST /business/accounts` |
| Limits | API | `GET/PUT /limits` |
| Network | API | `GET /network/rails` |
| Support | API | `GET/POST /support/tickets` |
| Proximity / shop pay | API | `/proximity/*`, `/shops/*` |
| `src/data/wallets.ts` | Placeholder only | Single zero-balance personal shell pre-login |
| `src/data/terminals.ts` | Static labels | `SUPPORT_TX_TYPES` only (not terminal data) |
| `src/data/appSearch.ts` | Client nav index | Optional CMS later |
| **Dev-only (not production data)** | Client | Top bar **Simulate inward** (`TransactionContext.simulateInwardTransfer`), Scan-to-pay demo buttons in `ScanToPayModal` |
| Auth screens | Login/register/KYC/OTP/reset (localStorage flags only) |
| `LegalScreen` / `CheckoutNowScreen` | Static copy (CMS or keep static) |

---

## 3. Domain models (API shapes)

Align responses with frontend types in `src/types.ts` and `src/data/wallets.ts`.

### 3.1 User & profile

```ts
UserProfile {
  id: string
  fullName: string
  email: string
  phone: string            // E.164 preferred: +2348034129981
  address: string
  city: string
  state: string            // NG state name
  dateOfBirth: string      // ISO date
  gender: 'male' | 'female'
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | string
  kyc: {
    bvnMasked?: string
    ninMasked?: string
    idType?: 'bvn' | 'nin'
    status: 'none' | 'pending' | 'verified' | 'rejected'
  }
  agent?: {
    code: string           // e.g. AG-1003925
    aggregator?: string
    active: boolean
  }
  preferences: {
    theme?: 'dark' | 'light'
    balanceHidden?: boolean
    biometrics?: boolean
    faceId?: boolean
    push?: boolean
    sms?: boolean
    emailNotif?: boolean
    txnAlerts?: boolean
    promo?: boolean
    loginAlerts?: boolean
    sessionTimeoutMin?: number
  }
}
```

### 3.2 Wallet & sub-accounts

```ts
WalletAccount {
  id: string
  name: string
  kind: 'personal' | 'business' | 'sub_personal' | 'sub_business'
  accountNumber: string          // NUBAN / VA
  bankName: string
  balance: number                // NGN
  subtitle: string               // often = purpose for subs
  purpose?: string
  accountName?: string           // legal name on VA (usually parent)
  parentWalletId?: string
  status?: 'active' | 'frozen' | 'closed'
  currency: 'NGN'
}

// Parent profile for create screen comes from GET /me (masked KYC):
Me {
  fullName, phone, email, tier, customerId,
  kyc: { status, bvnMasked, ninMasked, idType? }
}
```

**Open business account (Tier-2 instant)** — no re-login / no re-KYC.

Requires personal **Tier 2** KYC. App sends only business fields; server copies
name, DOB, BVN/NIN, email, phone from the personal profile. Always provision a
**fresh** business pay-in VA via CheckoutRail (Mevon) — do **not** reuse the
personal wallet VA (`instant_tier2` / empty VA path). Utility bills, CAC
certificates, and address verification are **deferred** (ask later).

```http
POST /business/accounts
{
  "business_name": "Ajah Fresh Market Ltd",
  "cac": "BN1234567",
  "address": "12 Admiralty Way, Lekki",
  "pin": "1234"
}
```

`cac` is **mandatory** — accepts **BN** or **RC** (e.g. `BN1234567`, `RC123456`). Reject empty/invalid. Alias `businessName` may be accepted.

**Response `201`** — `WalletAccount` with `kind: "business"`. `accountNumber` may
be empty/pending while CheckoutRail queues the VA; client shows “provisioning…”.

Also accepted: `GET /business/accounts` → business + mini-business wallets.

**Create sub-account** — KYC inherited; do **not** require BVN/NIN again.

```http
POST /wallets
Content-Type: application/json

{
  "kind": "sub_personal" | "sub_business",
  "name": "Rent wallet",
  "purpose": "Monthly rent set-aside",
  "pin": "1234",
  "parentContext": "personal" | "business"
}
```

**Response `201`**

```json
{
  "id": "sub_01H…",
  "name": "Rent wallet",
  "kind": "sub_personal",
  "accountNumber": "0124892201",
  "bankName": "Zenith Bank",
  "balance": 0,
  "subtitle": "Monthly rent set-aside",
  "purpose": "Monthly rent set-aside",
  "accountName": "INNOCENT SOLOMON",
  "parentWalletId": "personal",
  "status": "active",
  "currency": "NGN"
}
```

| Method | Path | Notes |
|--------|------|--------|
| GET | `/me` | Parent verified profile (masked BVN/NIN) |
| GET | `/wallets` | All wallets incl. `sub_*` |
| GET | `/wallets/sub-accounts` | Optional: only subs |
| POST | `/wallets` | Create sub (`kind` = `sub_personal` \| `sub_business`) |
| GET | `/wallets/:id` | Detail + balance |
| PATCH | `/wallets/:id` | Optional rename / purpose |
| DELETE | `/wallets/:id` | Optional close (balance 0) |
| GET | `/wallets/:id/transactions` | Sub ledger |

| UI field | Source |
|----------|--------|
| Name, Phone, BVN, NIN, Customer ID, Tier | `GET /me` |
| List (name, kind, subtitle, accountNumber, balance) | `GET /wallets` filter `sub_*` |
| Create type + name + purpose + PIN | `POST /wallets` |

### 3.3 Transaction

```ts
Transaction {
  id: string
  title: string
  subtitle: string
  date: string             // display or prefer ISO `occurredAt`
  timestamp: string
  fullTime?: string
  occurredAt?: string      // ISO — preferred for backend
  amount: number
  type: 'debit' | 'credit'
  status: string           // Settled | Successful | Processing | Failed | …
  category: 'transfer' | 'utility' | 'bill' | 'savings' | 'card' | 'p2p'
  reference: string
  token?: string
  bank?: string
  recipient?: string
  cardLast4?: string
  cardUsdAmount?: string
  note?: string
  walletId?: string
}
```

### 3.4 Transfer (in flight)

```ts
ActiveProcessingTransfer {
  step: 1 | 2 | 3          // initiated → processing → settled
  amount: number
  recipientName: string
  bankName: string
  accountNumber: string
  reference: string
  narration?: string
  initTime / processedTime / settledTime: string
  isComplete: boolean
}
```

### 3.5 Banks, beneficiaries, billers

```ts
Bank { id, name, code }                    // NUBAN bank list
Beneficiary { id, name, initials, bank, accountNumber, tier, colorClass? }
BillerCategory { id, name, icon, subtitle, active? }
FrequentBiller { id, name, icon, subtitle, accountNumber, category, provider }
```

### 3.6 POS

```ts
Terminal { id, terminalId, serialNumber, name, model, address, status, balance, dateMapped, lastTransaction, pendingAddress?, addressRequestStatus? }
TerminalTx { id, terminalId, type, amount, status, reference, date, time, commission?, xPoints? }
status: Active | Inactive | Offline | Locked | Pending
```

### 3.7 Savings & group pots

```ts
SavingsSummary { flexibleBalance, strictBalance, strictAutoSave: boolean }
GroupPot { id, title, subtitle, targetAmount, raisedAmount, myStatus, myContribution, frequency, members[] }
PotMember { id, name, phone, initials, status, contributed, share, isCreator? }
```

### 3.8 Money requests & credit

```ts
MoneyRequest { id, type: contact|overdraft|loan, …, status, isIncoming, facilityKind?, tenor? }

// GET /credit/overview
CreditOverview {
  overdraftLimit: number          // authorized OD line
  overdraftUsed?: number          // drawn
  overdraftAvailable?: number     // limit - used (optional)
  outstandingLoans: number        // sum of open loan balances (hub header)
  minLoanAmount?: number          // default 5000
  interestRateFlat?: number       // 0.025 or 2.5
  tenors?: string[]               // e.g. ["14 days","30 days","60 days","90 days"]
}

// GET /credit/loans?status=active|all|settled
Loan {
  id: string
  title: string
  principal: number
  outstanding: number
  dueDate: string                 // display string ok
  tenor: string
  status: 'Active' | 'Overdue' | 'Settled' | 'Pending'
  interestRate?: number
  disbursedAt?: string
}

// GET /credit/repayments?loanId=
LoanRepayment {
  id: string
  loanId?: string
  loanTitle: string
  amount: number
  date: string
  reference: string
  status?: string
}

// POST /credit/loans/request   { amount, tenor, pin }
// → Loan (preferred) OR MoneyRequest (pending approval)
// POST /credit/loans/:id/repay { amount, pin }
// → { loan?, repayment?, outstanding?, walletBalance? }
// POST /credit/overdraft/request { amount, pin } → overview or request
// POST /credit/overdraft/repay   { amount, pin } → overview (optional pay-down)
```

**UI map (LoansScreen):** hub = overview + loan list; request = min/tenor/interest from overview; repay = open loans + PIN debit; “Recent repayments” = `/credit/repayments`. Overdraft request lives mainly on Ask Money → `/credit/overdraft/request`.

### 3.9 Limits

```ts
Limits {
  dailySpendCap: number
  dailySpent: number
  singleTxnCap: number
  transferCap: number
  posFloatCap: number
}
```

### 3.10 Cards

Empty `GET /cards` → UI shows **Request card only** (no mock faces).

```ts
Card {
  id: string
  kind: 'physical' | 'virtual_usd'   // or type
  last4: string
  panMasked?: string                 // e.g. "•••• •••• •••• 1044" or spaced PAN when reveal allowed
  status: 'active' | 'frozen' | 'pending' | 'inactive'
  cardholderName?: string
  expiryMonth?: string               // "MM"
  expiryYear?: string                // "YY"
  network?: 'visa' | 'mastercard' | 'verve'
  spendAvailableNgn?: number         // physical (often = wallet link)
  spendAvailableUsd?: number         // virtual USD balance
  deliveryAddress?: string           // physical
  billingAddress?: string            // virtual US billing block
  cvvMasked?: string                 // only when reveal / details allowed; never full CVV in list
}

// GET /cards/request-quote?kind=physical|virtual_usd&initialTopUpUsd=
CardRequestQuote {
  kind: 'physical' | 'virtual_usd'
  issuanceFeeNgn: number          // card cost charged from wallet
  deliveryFeeNgn?: number         // physical only
  minInitialTopUpUsd?: number     // virtual: first top-up requirement (USD)
  initialTopUpUsd?: number        // echoed / applied USD load
  fxRate?: number                 // NGN per 1 USD
  topUpNgn?: number               // conversion amount for initialTopUpUsd
  totalDebitNgn: number           // issuance + delivery + topUpNgn
  walletBalanceNgn?: number
  sufficientBalance?: boolean
  title?: string
  notes?: string[]
}

// POST /cards/request  body:
{ kind, deliveryAddress?, initialTopUpUsd?, pin }
// → Card (pending for physical ok; virtual may be active + funded)

// POST /cards/:id/freeze  body: { frozen: boolean, pin?: string } → Card
// POST /cards/:id/fund    body: { amountUsd: number, pin: string }
// → { card?: Card, spendAvailableUsd?, walletBalance?, fxRate? }  // virtual only
// POST /cards/:id/pin     body: { pin: string, newPin: string } → ok
```

### 3.11 Recurring

```ts
// GET /recurring → RecurringPlan[] | { plans }
// POST /recurring { channel, recipientName, bankName?, bankCode?, accountNumber,
//   amount, narration?, scheduleMode: end_of_month|custom,
//   customCadence?, dayOfMonth?, everyNDays?, pin } → RecurringPlan
// PATCH /recurring/:id { active } → RecurringPlan
// DELETE /recurring/:id
// GET /recurring/runs | /recurring/:id/runs → RecurringRun[]

RecurringPlan {
  id, recipientName, bankName, accountNumber, amount, narration,
  scheduleLabel, nextRun, active, walletId?
}
RecurringRun { id, planId, recipientName, amount, status: Successful|Failed|Pending, date, time, reference }
```

### 3.11b Analytics · Settlement · Statements · X-Points

```ts
// GET /analytics/cashflow?context=personal|business&periodDays=30|90|365
CashflowAnalytics {
  healthLabel, healthScorePct, marginPct, netBalance,
  burnPerDay, runwayDays,
  totalInflow, totalOutflow, inflowCount, outflowCount, inflowChangePct,
  channels: [{ label, pct, amount }],
  velocityAvgPerDay,
  velocityDays: [{ day, amount, heightPct? }],
  categories: [{ label, amount, pct, icon? }]
}

// GET /settlement/overview
SettlementOverview {
  pendingAmount, availableForSettlement,
  nextWindowLabel, cutOffLabel?, destinationSummary?,
  minInstantAmount?, instantFeeNgn?,
  banks: [{ id, bankName, accountNumber, accountName?, sharePct? }],
  recent: [{ id, reference, amount, status, bankName, postedAt|date }]
}
// GET /settlement/batches
// POST /settlement/instant { amount, pin, bankId? } → { batch?, reference?, feeNgn? }

// POST /statements
{ kind: wallet|savings|card|pos|business, period: '7'|'30'|'90'|'365',
  format: pdf|csv, posId?, context? }
→ { downloadUrl|url, fileName?, expiresAt? }

// GET /xpoints
XPointsSummary {
  available, pending, redeemed, total?,
  commissionEarned, xpToNaira, rateLabel?,
  history|ledger: [{ id, title, meta, amount, xPoints, commission, when, status }]
}
// POST /xpoints/redeem { channel: wallet|airtime|data|commission, amount, pin, phone? }
```

### 3.12 Support & network

```ts
SupportTicket { id, subject, category, status: Open|Pending|Resolved, updatedAt, messages? }
NetworkRail {
  id, name, backend, status: Active|Degraded|Down,
  successRate, uptime, latencyMs, lastTrafficAt, volume24h
}
```

### 3.13 App branding

```ts
AppBranding {
  logoUrl?: string          // default / fallback
  logoUrlDark?: string      // header on dark theme
  logoUrlLight?: string     // header on light theme
  appName?: string          // default "Xtrapay"
}
```

### 3.14 Proximity / shop (optional phase)

```ts
NearbyPeer { id, name, device, distance, walletTag, avatarColor }
ShopTerminal { id, name, terminalId, amount?, merchantCategory, rssi }
```

---

## 4. Auth API

Frontend flow today: Intro (client) → Login / Register(basic) → KYC → OTP → session.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/register` | Step 1 basic: `{ fullName, phone, email, password }` → `{ registrationId }` |
| POST | `/auth/kyc` | Step 2: `{ registrationId, idType, idNumber, dateOfBirth, gender, address, city, state }` |
| POST | `/auth/otp/send` | `{ destination, purpose: register\|login\|reset }` |
| POST | `/auth/otp/verify` | `{ destination, purpose, code }` → tokens on success |
| POST | `/auth/login` | `{ identifier, password }` → tokens **or** `{ requiresOtp: true }` |
| POST | `/auth/password/forgot` | `{ identifier }` |
| POST | `/auth/password/reset` | `{ identifier, otp, newPassword }` |
| POST | `/auth/logout` | Invalidate refresh |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/session` | Current user + wallets summary |
| DELETE | `/auth/account` | Delete account (confirm with PIN / password) |

**Tokens:** `{ accessToken, refreshToken, expiresIn }`  
**Client storage today:** `localStorage xtrapay_auth`, `xtrapay_intro` — replace with secure token storage.

**PIN (transaction):**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/security/pin/verify` | `{ pin }` or challenge → `{ ok, challengeId? }` |
| POST | `/security/pin/set` | Change PIN (after verify) |
| POST | `/security/password/change` | Change login password |

---

## 5. Core money & wallet API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/config` | Public branding — logo URLs + app name (no auth). Same `branding` object may appear on `GET /bootstrap`. |
| GET | `/me` | Profile |
| PATCH | `/me` | Update name/email/phone/address/prefs |
| GET | `/wallets` | List wallets (incl. sub_*) |
| POST | `/wallets` | Create sub-account `{ kind, name, purpose, pin }` |
| GET | `/wallets/sub-accounts` | Optional: sub accounts only |
| GET | `/business/accounts` | List business wallets |
| POST | `/business/accounts` | Tier-2 instant: `{ business_name, cac, address, pin }` — KYC from personal; fresh Mevon VA |
| GET | `/wallets/:id` | Detail + balance |
| PATCH | `/wallets/:id` | Rename / purpose (optional) |
| GET | `/wallets/:id/transactions` | Ledger (`category`, `from`, `to`, cursor) |
| GET | `/transactions` | Cross-wallet history |
| GET | `/transactions/:id` | Receipt payload |
| POST | `/transfers` | `{ walletId, accountNumber, bankCode, amount, narration, pinChallenge }` |
| GET | `/transfers/:id` | Status polling (steps 1–3) |
| POST | `/transfers/name-enquiry` | `{ accountNumber, bankCode }` → `{ accountName }` |
| GET | `/banks` | NUBAN list |
| GET | `/beneficiaries` | Saved recipients |
| POST | `/beneficiaries` | Save |
| DELETE | `/beneficiaries/:id` | Remove |

**Resend behaviour (UI):** does **not** call transfer again — opens form with prefill. Backend only needs GET of last transfer details if client doesn’t keep them.

---

## 6. Bills, airtime, utilities

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/billers/categories` | Categories |
| GET | `/billers?category=` | Providers |
| GET | `/billers/frequent` | User frequents |
| POST | `/bills/validate` | Meter/smartcard lookup |
| POST | `/bills/pay` | Pay → `{ reference, token? }` |
| GET | `/savings` | Flexible + strict balances |
| POST | `/savings/flexible/deposit` | Quick save |
| POST | `/savings/flexible/withdraw` | Withdraw |
| PATCH | `/savings/strict/autosave` | Toggle |

---

## 7. POS / terminals

No mock seeds — empty `GET /terminals` → empty list UI.

```ts
Terminal {
  id, terminalId, serialNumber, name, model, address,
  status: Active|Offline|Locked|Inactive|Pending,
  balance, dateMapped,
  lastTransaction: { label, at },
  pendingAddress?, addressRequestStatus?: None|Pending|Approved|Rejected
}
TerminalTx {
  id, terminalId, type, amount,
  status: Successful|Failed|Pending|Reversed|Declined,
  reference, date, time, commission?, xPoints?
}
```

| Method | Path | Body / response |
|--------|------|-----------------|
| GET | `/terminals` | `Terminal[]` \| `{ terminals }` |
| GET | `/terminals/:id` | Detail |
| PATCH | `/terminals/:id` | `{ name }` rename |
| GET | `/terminals/:id/transactions` | POS ledger |
| GET | `/terminals/:id/xpoints` | `{ total, available, pending, redeemed, commission }` |
| POST | `/terminals/:id/fund` | `{ amount, pin }` → `{ terminal?, balance?, reference?, walletBalance? }` |
| POST | `/terminals/:id/withdraw` | `{ amount, pin? }` → same shape |
| POST | `/terminals/sweep` | `{ terminalIds: 'all' \| string[], amount?, pin }` |
| POST | `/terminals/:id/lock` | → Terminal |
| POST | `/terminals/:id/unlock` | `{ pin }` → Terminal |
| POST | `/terminals/:id/address-request` | `{ address, reason }` → Terminal |
| POST | `/terminals/:id/support` | `{ type, note?, transactionId? }` → `{ ticketId?, status? }` |



## 8. Loans, limits, network, support

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/credit/overview` | OD limit/used + outstanding + loan rules |
| GET | `/credit/loans` | `?status=` active/settled/all |
| POST | `/credit/loans/request` | `{ amount, tenor, pin }` → Loan or request |
| POST | `/credit/loans/:id/repay` | `{ amount, pin }` from wallet |
| GET | `/credit/repayments` | `?loanId=` repayment history |
| POST | `/credit/overdraft/request` | `{ amount, pin }` extend OD line |
| POST | `/credit/overdraft/repay` | `{ amount, pin }` pay down used (optional) |
| GET | `/credit/collections` | *(optional agent)* collection log |
| POST | `/credit/collections` | *(optional agent)* record collection + PIN |
| GET | `/limits` | Caps + dailySpent |
| PUT | `/limits` | Update caps + PIN |
| GET | `/network/rails` | Runtime health |
| GET | `/support/tickets` | List |
| POST | `/support/tickets` | Create |
| GET | `/support/tickets/:id` | Thread |

---

## 9. Cards, recurring, statements, X-Points, analytics, settlement

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/cards` | List user cards (empty = no active card) |
| GET | `/cards/request-quote` | `?kind=&initialTopUpUsd=` → fees + FX summary |
| POST | `/cards/request` | `{ kind, deliveryAddress?, initialTopUpUsd?, pin }` → Card |
| POST | `/cards/:id/freeze` | `{ frozen, pin? }` → Card |
| POST | `/cards/:id/fund` | Virtual USD: `{ amountUsd, pin }` |
| POST | `/cards/:id/pin` | Set/change card PIN |
| GET | `/recurring` | Plans |
| POST | `/recurring` | Create schedule + PIN |
| PATCH | `/recurring/:id` | Pause/resume `{ active }` |
| DELETE | `/recurring/:id` | Delete |
| GET | `/recurring/runs` | All run history |
| GET | `/recurring/:id/runs` | Per-plan history |
| POST | `/statements` | `{ kind, period, format, posId?, context? }` → download URL |
| GET | `/analytics/cashflow` | `?context=&periodDays=` Utility metrics |
| GET | `/settlement/overview` | Pending, window, banks, recent batches |
| GET | `/settlement/batches` | Settlement history |
| POST | `/settlement/instant` | `{ amount, pin, bankId? }` instant payout |
| GET | `/xpoints` | Balance + commission + ledger |
| POST | `/xpoints/redeem` | `{ channel, amount, pin }` |

---

## 10. Peer request, group save, proximity (phase 2)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/money-requests` | Inbox/outbox |
| POST | `/money-requests` | Ask contact |
| POST | `/money-requests/:id/accept` | + PIN |
| POST | `/money-requests/:id/decline` | |
| POST | `/money-requests/:id/cancel` | |
| GET | `/pots` | Group savings |
| POST | `/pots` | Create |
| POST | `/pots/:id/contribute` | + PIN |
| POST | `/pots/:id/accept` | Invite |
| POST | `/pots/:id/decline` | |
| GET | `/proximity/peers` | Nearby (BLE/session) |
| POST | `/proximity/pay` | P2P nearby |
| GET | `/shops/nearby` | Till broadcast |
| POST | `/shops/pay` | Pay at shop |

---

## 11. Legal / partner (mostly static)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/legal/terms` | Optional CMS |
| GET | `/legal/privacy` | Optional CMS |
| GET | `/partners/checkoutnow` | Partner blurb (or keep static in app) |

**Product attribution (UI copy):**  
Xtrapay by **Xtratech Global Solutions** · Powered by **CheckoutNow** (licensed engine; CheckoutNow does not control user funds/data).

---

## 12. Screen → API mapping

| Screen | Needs from backend |
|--------|-------------------|
| Auth (all) | Auth + OTP + KYC |
| Hub | `/wallets`, recent `/transactions`, selected wallet |
| Pay | Limits snippet, recent transfers |
| Transfer | Banks, name enquiry, beneficiaries, POST transfer, PIN verify |
| Receive | Wallet account/QR payload |
| History | Paginated transactions |
| Pay bills | Billers + pay |
| Saving | Savings summary + mutate |
| Save together | Pots |
| Ask money | Money requests + facilities |
| Terminals | Terminals + sweep/fund/lock |
| Cards | Cards CRUD-ish |
| X-Points | Balance + redeem |
| Statement | Generate export |
| Recurring | Plans + runs |
| Sub-accounts | Wallets filter / create |
| Loans | Loans + collections |
| Limits | GET/PUT limits |
| Network | Rails health |
| Support | Tickets |
| Profile | `/me`, delete account, prefs |
| Services search | Can stay client catalogue |

---

## 13. Current client-side “business rules” to preserve

These are implemented in the mock today — backend should own them:

1. **Transfer:** validate amount > 0, ≤ wallet balance, 10-digit NUBAN, bank selected → PIN → create transfer → async steps → ledger debit + receipt.  
2. **Resend:** UI prefill only (no auto debit).  
3. **Daily limit:** `dailySpent` vs `dailyLimit` (mock: spent 2,450,000 / cap 5,000,000).  
4. **Loan request:** min ₦5,000, tenor 14/30/60/90, ~2.5% flat interest display, credit personal wallet on approve.  
5. **Loan collection:** agent records Cash/Transfer/POS against customer.  
6. **Bill electricity:** return STS-style token groups.  
7. **Account delete:** confirm string `DELETE` in UI + authenticated DELETE.  
8. **KYC:** BVN or NIN exactly 11 digits.  
9. **OTP:** 6 digits (mock accepts any).  
10. **Network health:** blend provider heartbeats with recent txn success rates.

---

## 14. Suggested build order

1. **Auth + session + `/me` + wallets + transactions** (unlocks Hub)  
2. **Banks + name enquiry + transfers + PIN**  
3. **Beneficiaries + bills**  
4. **POS terminals**  
5. **Savings + limits**  
6. **Loans + collections**  
7. **Cards + recurring + statements**  
8. **Support + network rails**  
9. **Money requests + pots + proximity**

---

## 15. Example bootstrap payload

What a logged-in app boot could fetch in one round-trip (optional `GET /bootstrap`):

```json
{
  "user": { "fullName": "Innocent Solomon", "tier": "Tier 3", "phone": "+2348034129981" },
  "branding": {
    "logoUrl": "https://cdn.example.com/xtrapay/logo.svg",
    "logoUrlDark": "https://cdn.example.com/xtrapay/logo-dark.svg",
    "logoUrlLight": "https://cdn.example.com/xtrapay/logo-light.svg",
    "appName": "Xtrapay"
  },
  "wallets": [ /* WalletAccount[] from GET /wallets */ ],
  "selectedWalletId": "personal",
  "limits": { "dailySpendCap": 5000000, "dailySpent": 2450000, "singleTxnCap": 1000000, "transferCap": 500000, "posFloatCap": 2000000 },
  "savings": { "flexibleBalance": 214558.04, "strictBalance": 2250, "strictAutoSave": true },
  "overdraftLimit": 150000,
  "recentTransactions": [ /* first page */ ],
  "cardFrozen": false,
  "xpointsBalance": 0
}
```

---

## 16. Frontend replacement checklist

When APIs exist:

- [x] Remove `src/data/initialData.ts` mock seeds  
- [x] Wallets: placeholder shell until `GET /wallets`  
- [x] Limits / network / support → live API clients  
- [ ] Optional: remove dev **Simulate inward** + QR/OCR demo when staging has test VA inflows  
- [ ] Keep `appSearch.ts` client-side until a CMS is needed  

---

## 17. Source references

| Concern | Path |
|---------|------|
| Types | `src/types.ts` |
| Context / actions | `src/context/TransactionContext.tsx` |
| API client | `src/lib/xtrapayApi.ts` |
| Placeholders | `src/data/wallets.ts`, `src/data/terminals.ts` (labels only) |
| Auth UI | `src/components/auth/*` |
| Screens | `src/components/screens/*` |

---

*Generated for Xtrapay frontend mock → backend handoff. Update this file as contracts stabilize.*
