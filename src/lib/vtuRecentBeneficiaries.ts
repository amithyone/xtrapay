/** Recently used VTU / bill recipients — server-backed with local cache fallback. */

import { apiVtuRecent, type ApiVtuRecentItem } from './xtrapayApi';

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

function readCache(): VtuRecentBeneficiary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VtuRecentBeneficiary[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCache(list: VtuRecentBeneficiary[]) {
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

function parseUpdatedAt(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v) {
    const t = Date.parse(v);
    if (Number.isFinite(t)) return t;
  }
  return Date.now();
}

export function mapApiVtuRecentItem(
  raw: ApiVtuRecentItem,
  fallbackKind: VtuRecentKind
): VtuRecentBeneficiary | null {
  const kindRaw = String(raw.kind || raw.type || raw.category || fallbackKind).toLowerCase();
  const kind: VtuRecentKind =
    kindRaw === 'data' ||
    kindRaw === 'electricity' ||
    kindRaw === 'cable' ||
    kindRaw === 'tv' ||
    kindRaw === 'betting'
      ? kindRaw === 'tv'
        ? 'cable'
        : (kindRaw as VtuRecentKind)
      : fallbackKind;

  const account = normalizeAccount(
    kind,
    String(
      raw.account ??
        raw.phone ??
        raw.customerId ??
        raw.customer_id ??
        raw.meter ??
        raw.smartcard ??
        ''
    )
  );
  if (!account || account.length < 4) return null;

  const providerId = String(
    raw.providerId ??
      raw.provider_id ??
      raw.network_id ??
      raw.service_id ??
      ''
  );
  const providerLabel = String(
    raw.providerLabel ??
      raw.provider_label ??
      raw.provider ??
      raw.network ??
      (providerId || 'Provider')
  );
  const label =
    raw.label || raw.name || raw.customerName || raw.customer_name
      ? String(raw.label ?? raw.name ?? raw.customerName ?? raw.customer_name)
      : undefined;
  const lastDetail =
    raw.lastDetail || raw.last_detail || raw.detail
      ? String(raw.lastDetail ?? raw.last_detail ?? raw.detail)
      : raw.amount != null
        ? `₦${Number(raw.amount).toLocaleString()}`
        : undefined;

  return {
    id: String(raw.id || `${kind}:${providerId}:${account}`),
    kind,
    account,
    providerId,
    providerLabel,
    label,
    lastDetail,
    updatedAt: parseUpdatedAt(raw.updatedAt ?? raw.updated_at ?? raw.createdAt ?? raw.created_at),
  };
}

/** Sync read of cached rows (may be stale). Prefer fetchVtuRecentBeneficiaries. */
export function listVtuRecentBeneficiaries(kind: VtuRecentKind): VtuRecentBeneficiary[] {
  return readCache()
    .filter(b => b.kind === kind)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_PER_KIND);
}

/**
 * Load recent VTU recipients from backend (cross-device).
 * Falls back to local cache if the API is unavailable.
 */
export async function fetchVtuRecentBeneficiaries(
  kind: VtuRecentKind,
  limit = MAX_PER_KIND
): Promise<VtuRecentBeneficiary[]> {
  try {
    const raw = await apiVtuRecent({ kind, limit });
    const mapped = raw
      .map(r => mapApiVtuRecentItem(r, kind))
      .filter((b): b is VtuRecentBeneficiary => Boolean(b))
      .filter(b => b.kind === kind)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);

    if (mapped.length) {
      const others = readCache().filter(b => b.kind !== kind);
      writeCache([...mapped, ...others]);
      return mapped;
    }

    // Empty server list is authoritative when the call succeeded.
    const others = readCache().filter(b => b.kind !== kind);
    writeCache(others);
    return [];
  } catch {
    return listVtuRecentBeneficiaries(kind);
  }
}

/** Optimistic local cache until next GET /vtu/recent (backend should upsert on pay). */
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

  const others = readCache().filter(b => b.id !== id);
  writeCache([next, ...others]);
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
