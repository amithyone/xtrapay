/** Recently used VTU / bill recipients — local, per-device, for quick repurchase. */

export type VtuRecentKind = 'airtime' | 'data' | 'electricity' | 'cable' | 'betting';

export type VtuRecentBeneficiary = {
  id: string;
  kind: VtuRecentKind;
  /** Phone, meter, smartcard, or betting user id */
  account: string;
  /** Network / disco / TV / betting provider id */
  providerId: string;
  providerLabel: string;
  /** Optional display name from last verify */
  label?: string;
  /** Last amount or plan label for subtitle */
  lastDetail?: string;
  updatedAt: number;
};

const STORAGE_KEY = 'xtrapay_vtu_recent_beneficiaries';
const MAX_PER_KIND = 8;

function readAll(): VtuRecentBeneficiary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VtuRecentBeneficiary[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: VtuRecentBeneficiary[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 40)));
  } catch {
    // ignore quota
  }
}

function normalizeAccount(kind: VtuRecentKind, account: string): string {
  const trimmed = account.trim();
  if (kind === 'airtime' || kind === 'data') {
    return trimmed.replace(/\D/g, '');
  }
  return trimmed.replace(/\s+/g, '');
}

export function listVtuRecentBeneficiaries(kind: VtuRecentKind): VtuRecentBeneficiary[] {
  return readAll()
    .filter(b => b.kind === kind)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_PER_KIND);
}

export function rememberVtuRecentBeneficiary(entry: {
  kind: VtuRecentKind;
  account: string;
  providerId: string;
  providerLabel: string;
  label?: string;
  lastDetail?: string;
}): VtuRecentBeneficiary[] {
  const account = normalizeAccount(entry.kind, entry.account);
  if (!account || account.length < 4) return listVtuRecentBeneficiaries(entry.kind);

  const id = `${entry.kind}:${entry.providerId}:${account}`;
  const next: VtuRecentBeneficiary = {
    id,
    kind: entry.kind,
    account,
    providerId: entry.providerId,
    providerLabel: entry.providerLabel,
    label: entry.label?.trim() || undefined,
    lastDetail: entry.lastDetail?.trim() || undefined,
    updatedAt: Date.now(),
  };

  const others = readAll().filter(b => b.id !== id);
  writeAll([next, ...others]);
  return listVtuRecentBeneficiaries(entry.kind);
}

export function formatVtuRecentAccount(kind: VtuRecentKind, account: string): string {
  if (kind === 'airtime' || kind === 'data') {
    const d = account.replace(/\D/g, '');
    if (d.length === 11) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
    if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return d;
  }
  return account;
}

export function vtuRecentInitials(b: VtuRecentBeneficiary): string {
  const source = (b.label || b.providerLabel || b.account).trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase() || '??';
}
