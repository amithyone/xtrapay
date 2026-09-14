import React, { useEffect, useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import {
  apiVtuAirtime,
  apiVtuData,
  apiVtuDataPlans,
  apiVtuNetworks,
  type VtuNetwork,
  type VtuPlan,
} from '../../lib/xtrapayApi';
import {
  fetchVtuRecentBeneficiaries,
  rememberVtuRecentBeneficiary,
  type VtuRecentBeneficiary,
} from '../../lib/vtuRecentBeneficiaries';
import {
  getCachedDataPlans,
  getCachedVtuNetworks,
  normalizeNetworkId,
  setCachedDataPlans,
  setCachedVtuNetworks,
} from '../../lib/vtuCatalogCache';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';
import { RecentVtuBeneficiaries } from '../common/RecentVtuBeneficiaries';

const FALLBACK_NETWORKS: VtuNetwork[] = [
  { id: 'mtn', label: 'MTN' },
  { id: 'glo', label: 'Glo' },
  { id: 'airtel', label: 'Airtel' },
  { id: '9mobile', label: '9mobile' },
];

const NETWORK_COLORS: Record<string, string> = {
  mtn: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
  airtel: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
  glo: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  '9mobile': 'bg-lime-500/15 text-lime-700 dark:text-lime-300',
};

const AIRTIME_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const fieldClass =
  'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

type Kind = 'airtime' | 'data';

function sameNetwork(a: string, b: string) {
  return normalizeNetworkId(a) === normalizeNetworkId(b);
}

export const TelcoTopupScreen: React.FC<{ kind: Kind }> = ({ kind }) => {
  const { refreshBalances, showToast } = useTransactions();
  const isAirtime = kind === 'airtime';

  const cachedNetworks = getCachedVtuNetworks();
  const [networks, setNetworks] = useState<VtuNetwork[]>(
    () => cachedNetworks?.networks?.length ? cachedNetworks.networks : FALLBACK_NETWORKS
  );
  const [airtimeMin, setAirtimeMin] = useState(() => cachedNetworks?.airtimeMin ?? 50);
  const [airtimeMax, setAirtimeMax] = useState(() => cachedNetworks?.airtimeMax ?? 50000);
  const [networkId, setNetworkId] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [amountStr, setAmountStr] = useState('1,000');
  const [plans, setPlans] = useState<VtuPlan[]>(() => getCachedDataPlans('mtn') || []);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const [variationId, setVariationId] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{
    amount: number;
    label: string;
    balance?: number;
  } | null>(null);
  const [recentItems, setRecentItems] = useState<VtuRecentBeneficiary[]>([]);

  const recentKind = isAirtime ? 'airtime' : 'data';

  const refreshRecent = async () => {
    const list = await fetchVtuRecentBeneficiaries(recentKind);
    setRecentItems(list);
  };

  const applyRecent = (item: VtuRecentBeneficiary) => {
    setNetworkId(item.providerId);
    setPhone(item.account);
    showToast('Filled from recent', `${item.providerLabel} · ${item.account}`, 'info');
  };

  useEffect(() => {
    void refreshRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentKind]);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedVtuNetworks();
    if (cached?.networks?.length) {
      setNetworks(cached.networks);
      if (cached.airtimeMin != null) setAirtimeMin(cached.airtimeMin);
      if (cached.airtimeMax != null) setAirtimeMax(cached.airtimeMax);
    }
    (async () => {
      try {
        const res = await apiVtuNetworks();
        if (cancelled) return;
        const list =
          Array.isArray(res.networks) && res.networks.length ? res.networks : FALLBACK_NETWORKS;
        const airtime_min =
          res.airtime_min != null ? Number(res.airtime_min) : undefined;
        const airtime_max =
          res.airtime_max != null ? Number(res.airtime_max) : undefined;
        setNetworks(list);
        if (airtime_min != null) setAirtimeMin(airtime_min);
        if (airtime_max != null) setAirtimeMax(airtime_max);
        setCachedVtuNetworks({
          networks: list,
          airtimeMin: airtime_min,
          airtimeMax: airtime_max,
        });
        setNetworkId(prev =>
          list.some(n => sameNetwork(n.id, prev)) ? prev : list[0]?.id || prev
        );
      } catch {
        // keep fallback / cached networks
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isAirtime) return;
    let cancelled = false;
    const cached = getCachedDataPlans(networkId);
    if (cached?.length) {
      setPlans(cached);
      setPlansLoading(false);
      if (!variationId || !cached.some(p => p.variation_id === variationId)) {
        setVariationId(cached[0]?.variation_id || '');
      }
    } else {
      setPlansLoading(true);
      setPlans([]);
      setVariationId('');
    }
    setPlanSearch('');

    (async () => {
      try {
        const res = await apiVtuDataPlans(networkId);
        if (cancelled) return;
        const list = (res.plans || []).filter(p => p.available !== false);
        setPlans(list);
        setCachedDataPlans(networkId, list);
        setVariationId(prev =>
          list.some(p => p.variation_id === prev) ? prev : list[0]?.variation_id || ''
        );
      } catch (err) {
        if (!cancelled && !cached?.length) {
          showToast(
            'Plans unavailable',
            err instanceof ApiError ? err.message : 'Could not load data plans.',
            'warning'
          );
        }
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally omit showToast — it is recreated every render and would spam reloads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAirtime, networkId]);

  const filteredPlans = useMemo(() => {
    const q = planSearch.trim().toLowerCase();
    if (!q) return plans;
    const digits = q.replace(/\D/g, '');
    return plans.filter(plan => {
      const label = String(plan.label || '').toLowerCase();
      const id = String(plan.variation_id || '').toLowerCase();
      const price = String(plan.price ?? '');
      const priceFmt = Number(plan.price).toLocaleString().toLowerCase();
      if (label.includes(q) || id.includes(q) || price.includes(q) || priceFmt.includes(q)) {
        return true;
      }
      if (digits && price.includes(digits)) return true;
      return false;
    });
  }, [plans, planSearch]);

  useEffect(() => {
    if (!filteredPlans.length) return;
    if (!filteredPlans.some(p => p.variation_id === variationId)) {
      setVariationId(filteredPlans[0].variation_id);
    }
  }, [filteredPlans, variationId]);

  const selectedPlan =
    filteredPlans.find(p => p.variation_id === variationId) ||
    plans.find(p => p.variation_id === variationId) ||
    filteredPlans[0];
  const networkLabel =
    networks.find(n => sameNetwork(n.id, networkId))?.label || networkId.toUpperCase();

  const validate = (): { amount: number } | null => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      showToast('Phone required', 'Enter a valid Nigerian phone number.', 'warning');
      return null;
    }
    if (isAirtime) {
      const amount = parseFloat(amountStr.replace(/,/g, ''));
      if (isNaN(amount) || amount < airtimeMin || amount > airtimeMax) {
        showToast(
          'Invalid amount',
          `Airtime must be between ₦${airtimeMin.toLocaleString()} and ₦${airtimeMax.toLocaleString()}.`,
          'warning'
        );
        return null;
      }
      return { amount };
    }
    if (!selectedPlan) {
      showToast('Select a plan', 'Pick a data plan to continue.', 'warning');
      return null;
    }
    return { amount: Number(selectedPlan.price) };
  };

  const handleContinue = () => {
    if (!validate()) return;
    setPinOpen(true);
  };

  const handlePinSuccess = async (pin: string) => {
    const checked = validate();
    if (!checked) return;
    setBusy(true);
    try {
      const phoneClean = phone.replace(/\s+/g, '');
      if (isAirtime) {
        const res = await apiVtuAirtime({
          network_id: networkId,
          phone: phoneClean,
          amount: checked.amount,
          pin,
        });
        void refreshBalances();
        setPinOpen(false);
        rememberVtuRecentBeneficiary({
          kind: 'airtime',
          account: phoneClean,
          providerId: networkId,
          providerLabel: networkLabel,
          lastDetail: `₦${checked.amount.toLocaleString()}`,
        });
        void refreshRecent();
        setSuccess({
          amount: checked.amount,
          label: `${networkLabel} airtime`,
          balance: res.walletBalance ?? res.balance_after,
        });
        showToast('Airtime sent', `₦${checked.amount.toLocaleString()} to ${phoneClean}.`);
      } else {
        const plan = selectedPlan!;
        const res = await apiVtuData({
          network_id: networkId,
          phone: phoneClean,
          variation_id: plan.variation_id,
          expected_price: Number(plan.price),
          pin,
        });
        void refreshBalances();
        setPinOpen(false);
        rememberVtuRecentBeneficiary({
          kind: 'data',
          account: phoneClean,
          providerId: networkId,
          providerLabel: networkLabel,
          lastDetail: plan.label,
        });
        void refreshRecent();
        setSuccess({
          amount: Number(plan.price),
          label: plan.label,
          balance: res.walletBalance ?? res.balance_after,
        });
        showToast('Data purchased', `${plan.label} for ${phoneClean}.`);
      }
    } catch (err) {
      showToast(
        'Purchase failed',
        err instanceof ApiError ? err.message : 'Could not complete VTU purchase.',
        'warning'
      );
      throw err instanceof Error
        ? err
        : new Error(err instanceof ApiError ? err.message : 'Purchase failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5"
      id={isAirtime ? 'airtime-screen' : 'data-screen'}
    >
      <section className="flex items-center justify-between px-0.5">
        <p className="text-[12px] text-[var(--muted)]">
          {isAirtime ? 'Top up any Nigerian network' : 'Buy mobile data bundles'}
        </p>
        <span className="glass-chip !rounded-full !px-2.5 !py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Icon name="bolt" size={13} />
          Live VTU
        </span>
      </section>

      <section className="space-y-3">
        <p className="px-0.5 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Network
        </p>
        <div className="grid grid-cols-4 gap-2">
          {networks.map(n => {
            const active = sameNetwork(networkId, n.id);
            const colorKey = normalizeNetworkId(n.id);
            const color =
              NETWORK_COLORS[colorKey] || 'bg-[var(--accent)]/15 text-[var(--accent)]';
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setNetworkId(n.id)}
                aria-pressed={active}
                className={`network-tile glass-card glass-strong px-2 py-3 text-center appearance-none cursor-pointer ${
                  active
                    ? 'network-tile--waterdrop ring-2 ring-[var(--accent)] bg-[var(--accent)]/12 border border-[var(--accent)]/45 shadow-md shadow-[var(--accent)]/20'
                    : 'network-tile--idle border border-transparent opacity-90'
                }`}
              >
                <span className="network-tile-inner block">
                  <span
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold ${color}`}
                  >
                    {n.label.slice(0, 1)}
                  </span>
                  <span
                    className={`mt-1.5 block text-[11px] truncate ${
                      active
                        ? 'font-bold text-[var(--accent)]'
                        : 'font-semibold text-[var(--text)]'
                    }`}
                  >
                    {n.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-card glass-strong !rounded-[24px] px-5 py-5 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
            Phone number
          </label>
          <input
            className={`${fieldClass} font-mono`}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="0803 000 0000"
          />
        </div>

        {isAirtime ? (
          <div className="space-y-2">
            <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Amount (₦{airtimeMin.toLocaleString()}–₦{airtimeMax.toLocaleString()})
            </label>
            <input
              className={`${fieldClass} text-lg font-mono font-bold`}
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
              placeholder="1,000"
            />
            <div className="grid grid-cols-3 gap-2">
              {AIRTIME_AMOUNTS.map(amt => {
                const selected = amountStr.replace(/,/g, '') === String(amt);
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountStr(amt.toLocaleString())}
                    className={`h-10 rounded-xl text-[12px] font-mono font-semibold border transition-all ${
                      selected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                        : 'border-[var(--glass-border)] text-[var(--muted)]'
                    }`}
                  >
                    ₦{amt.toLocaleString()}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              Data plan
            </label>
            <div className="relative">
              <Icon
                name="search"
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
              />
              <input
                className={`${fieldClass} !pl-10`}
                type="search"
                value={planSearch}
                onChange={e => setPlanSearch(e.target.value)}
                placeholder="Search GB, days, price…"
                autoComplete="off"
              />
            </div>
            {plansLoading && plans.length === 0 ? (
              <p className="text-[12px] text-[var(--muted)] py-4 text-center">Loading plans…</p>
            ) : plans.length === 0 ? (
              <p className="text-[12px] text-[var(--muted)] py-4 text-center">
                No plans for {networkLabel} right now.
              </p>
            ) : filteredPlans.length === 0 ? (
              <p className="text-[12px] text-[var(--muted)] py-4 text-center">
                No plans match “{planSearch.trim()}”.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto no-scrollbar">
                {filteredPlans.map(plan => {
                  const selected = variationId === plan.variation_id;
                  return (
                    <button
                      key={plan.variation_id}
                      type="button"
                      onClick={() => setVariationId(plan.variation_id)}
                      className={`rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.98] ${
                        selected
                          ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10'
                          : 'border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05]'
                      }`}
                    >
                      <p className="text-[12px] font-semibold text-[var(--text)] leading-snug">
                        {plan.label}
                      </p>
                      <p className="text-[12px] font-mono font-semibold text-[var(--accent)] mt-1">
                        ₦{Number(plan.price).toLocaleString()}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
            {plans.length > 0 && (
              <p className="text-[10px] text-[var(--muted)] px-0.5">
                Showing {filteredPlans.length} of {plans.length} plans
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={busy || (!isAirtime && !selectedPlan)}
          className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {isAirtime
            ? `Continue · ₦${amountStr}`
            : selectedPlan
              ? `Continue · ₦${Number(selectedPlan.price).toLocaleString()}`
              : 'Select a plan'}
        </button>
      </section>

      <RecentVtuBeneficiaries kind={recentKind} items={recentItems} onSelect={applyRecent} />

      <PinSheetModal
        isOpen={pinOpen}
        onClose={() => !busy && setPinOpen(false)}
        title="Confirm purchase"
        subtitle={
          isAirtime
            ? `${networkLabel} airtime · ₦${amountStr}`
            : `${selectedPlan?.label || 'Data'} · ${networkLabel}`
        }
        onSuccess={handlePinSuccess}
      />

      {success && (
        <div className="app-modal-overlay z-[75] bg-black/70 backdrop-blur-md">
          <div className="app-modal-panel glass-card glass-strong !rounded-[24px] p-6 space-y-4 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Icon name="check" size={22} />
            </span>
            <div>
              <h3 className="text-[16px] font-semibold text-[var(--text)]">
                {isAirtime ? 'Airtime sent' : 'Data purchased'}
              </h3>
              <p className="text-[12px] text-[var(--muted)] mt-1">
                ₦{success.amount.toLocaleString()} · {success.label} · {phone}
              </p>
              {success.balance != null && (
                <p className="text-[11px] font-mono text-[var(--muted)] mt-2">
                  Wallet ₦{Number(success.balance).toLocaleString()}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="w-full h-11 rounded-2xl bg-[var(--accent)] text-white text-[13px] font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export const AirtimeScreen: React.FC = () => <TelcoTopupScreen kind="airtime" />;
export const DataScreen: React.FC = () => <TelcoTopupScreen kind="data" />;
