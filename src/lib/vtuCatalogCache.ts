/** In-memory + localStorage cache for VTU networks / data plans. */

import type { VtuNetwork, VtuPlan } from './xtrapayApi';

const NETWORKS_KEY = 'xtrapay_vtu_networks_v1';
const PLANS_KEY = 'xtrapay_vtu_data_plans_v1';
const TTL_MS = 30 * 60 * 1000; // 30 minutes

type NetworksCache = {
  at: number;
  networks: VtuNetwork[];
  airtimeMin?: number;
  airtimeMax?: number;
};

type PlansCache = Record<string, { at: number; plans: VtuPlan[] }>;

const memNetworks: { current: NetworksCache | null } = { current: null };
const memPlans: PlansCache = {};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

function fresh(at: number) {
  return Date.now() - at < TTL_MS;
}

export function getCachedVtuNetworks(): NetworksCache | null {
  if (memNetworks.current && fresh(memNetworks.current.at)) return memNetworks.current;
  const disk = readJson<NetworksCache>(NETWORKS_KEY);
  if (disk && Array.isArray(disk.networks) && fresh(disk.at)) {
    memNetworks.current = disk;
    return disk;
  }
  return null;
}

export function setCachedVtuNetworks(payload: Omit<NetworksCache, 'at'>) {
  const next: NetworksCache = { ...payload, at: Date.now() };
  memNetworks.current = next;
  writeJson(NETWORKS_KEY, next);
}

export function getCachedDataPlans(networkId: string): VtuPlan[] | null {
  const key = networkId.trim().toLowerCase();
  if (!key) return null;
  const mem = memPlans[key];
  if (mem && fresh(mem.at) && Array.isArray(mem.plans)) return mem.plans;
  const disk = readJson<PlansCache>(PLANS_KEY) || {};
  const entry = disk[key];
  if (entry && fresh(entry.at) && Array.isArray(entry.plans)) {
    memPlans[key] = entry;
    return entry.plans;
  }
  return null;
}

export function setCachedDataPlans(networkId: string, plans: VtuPlan[]) {
  const key = networkId.trim().toLowerCase();
  if (!key) return;
  const entry = { at: Date.now(), plans };
  memPlans[key] = entry;
  const disk = readJson<PlansCache>(PLANS_KEY) || {};
  disk[key] = entry;
  writeJson(PLANS_KEY, disk);
}

export function normalizeNetworkId(id: string) {
  return id.trim().toLowerCase().replace(/\s+/g, '');
}
