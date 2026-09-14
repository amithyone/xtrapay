import React, { useEffect, useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import {
  apiVtuBetting,
  apiVtuBettingVerify,
  apiVtuBillCatalog,
  apiVtuElectricity,
  apiVtuElectricityVerify,
  apiVtuTv,
  apiVtuTvPlans,
  apiVtuTvVerify,
  type VtuCatalogItem,
  type VtuPlan,
} from '../../lib/xtrapayApi';
import {
  fetchVtuRecentBeneficiaries,
  rememberVtuRecentBeneficiary,
  type VtuRecentBeneficiary,
} from '../../lib/vtuRecentBeneficiaries';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';
import { RecentVtuBeneficiaries } from '../common/RecentVtuBeneficiaries';

type BillKind = 'electricity' | 'cable' | 'betting';

const BILL_KINDS: Array<{ id: BillKind; name: string; icon: string; subtitle: string }> = [
  { id: 'electricity', name: 'Electricity', icon: 'bolt', subtitle: 'Disco tokens' },
  { id: 'cable', name: 'Cable TV', icon: 'tv', subtitle: 'DStv, GOtv' },
  { id: 'betting', name: 'Betting', icon: 'sports_esports', subtitle: 'Wallet top-up' },
];

const fieldClass =
  'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

export const PayBillsScreen: React.FC = () => {
  const { refreshBalances, setActiveScreen, showToast } = useTransactions();

  const [kind, setKind] = useState<BillKind>('electricity');
  const [discos, setDiscos] = useState<VtuCatalogItem[]>([]);
  const [tvServices, setTvServices] = useState<VtuCatalogItem[]>([]);
  const [bettingServices, setBettingServices] = useState<VtuCatalogItem[]>([]);
  const [electricityMin, setElectricityMin] = useState(1000);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [serviceId, setServiceId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [variationId, setVariationId] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [amountStr, setAmountStr] = useState('2,000');
  const [tvPlans, setTvPlans] = useState<VtuPlan[]>([]);
  const [tvVariationId, setTvVariationId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{
    title: string;
    detail: string;
    token?: string;
  } | null>(null);
  const [recentItems, setRecentItems] = useState<VtuRecentBeneficiary[]>([]);

  const refreshRecent = async () => {
    const list = await fetchVtuRecentBeneficiaries(kind);
    setRecentItems(list);
  };

  const applyRecent = (item: VtuRecentBeneficiary) => {
    setServiceId(item.providerId);
    setCustomerId(item.account);
    if (item.label) setCustomerName(item.label);
    showToast('Filled from recent', `${item.providerLabel} · ${item.account}`, 'info');
  };

  useEffect(() => {
    void refreshRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    (async () => {
      try {
        const catalog = await apiVtuBillCatalog();
        if (cancelled) return;
        const d = catalog.electricity_discos || [];
        const tv = catalog.cable_tv_services || [];
        const bet = catalog.betting_services || [];
        setDiscos(d);
        setTvServices(tv);
        setBettingServices(bet);
        if (catalog.electricity_min != null) setElectricityMin(Number(catalog.electricity_min));
        if (d[0]) setServiceId(d[0].id);
      } catch (err) {
        if (!cancelled) {
          showToast(
            'Catalog unavailable',
            err instanceof ApiError ? err.message : 'Could not load billers.',
            'warning'
          );
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const services = useMemo(() => {
    if (kind === 'electricity') return discos;
    if (kind === 'cable') return tvServices;
    return bettingServices;
  }, [kind, discos, tvServices, bettingServices]);

  useEffect(() => {
    setCustomerId('');
    setCustomerName('');
    setTvPlans([]);
    setTvVariationId('');
    if (kind === 'electricity') {
      setServiceId(discos[0]?.id || '');
      setVariationId('prepaid');
      setAmountStr('2,000');
    } else if (kind === 'cable') {
      setServiceId(tvServices[0]?.id || '');
    } else {
      setServiceId(bettingServices[0]?.id || '');
      setAmountStr('1,000');
    }
    // Only reset form when bill kind changes — not when catalog lists refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  // Seed default provider once catalogs arrive (without wiping a recent pick).
  useEffect(() => {
    if (serviceId) return;
    if (kind === 'electricity' && discos[0]) setServiceId(discos[0].id);
    else if (kind === 'cable' && tvServices[0]) setServiceId(tvServices[0].id);
    else if (kind === 'betting' && bettingServices[0]) setServiceId(bettingServices[0].id);
  }, [kind, discos, tvServices, bettingServices, serviceId]);

  useEffect(() => {
    if (kind !== 'cable' || !serviceId) return;
    let cancelled = false;
    setTvPlans([]);
    setTvVariationId('');
    (async () => {
      try {
        const res = await apiVtuTvPlans(serviceId);
        if (cancelled) return;
        const list = (res.plans || []).filter(p => p.available !== false);
        setTvPlans(list);
        if (list[0]) setTvVariationId(list[0].variation_id);
      } catch (err) {
        if (!cancelled) {
          showToast(
            'TV plans failed',
            err instanceof ApiError ? err.message : 'Could not load bouquets.',
            'warning'
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, serviceId, showToast]);

  const selectedTvPlan = tvPlans.find(p => p.variation_id === tvVariationId) || tvPlans[0];
  const serviceLabel = services.find(s => s.id === serviceId)?.label || serviceId;

  const handleVerify = async () => {
    if (!serviceId || !customerId.trim()) {
      showToast('Missing details', 'Select a provider and enter account / meter / smartcard.', 'warning');
      return;
    }
    setVerifying(true);
    setCustomerName('');
    try {
      if (kind === 'electricity') {
        const res = await apiVtuElectricityVerify({
          service_id: serviceId,
          customer_id: customerId.trim(),
          variation_id: variationId,
        });
        const name =
          res.customer_name ||
          res.customerName ||
          (res.data && String((res.data as { customer_name?: string }).customer_name || '')) ||
          '';
        setCustomerName(name || 'Verified');
        showToast('Meter verified', name ? `Customer: ${name}` : 'Account verified.', 'success');
      } else if (kind === 'cable') {
        const res = await apiVtuTvVerify({
          service_id: serviceId,
          customer_id: customerId.trim(),
        });
        const name = res.customer_name || res.customerName || 'Verified';
        setCustomerName(String(name));
        showToast('Smartcard verified', String(name), 'success');
      } else {
        const res = await apiVtuBettingVerify({
          service_id: serviceId,
          customer_id: customerId.trim(),
        });
        const name = res.customer_name || res.customerName || 'Verified';
        setCustomerName(String(name));
        showToast('Account verified', String(name), 'success');
      }
    } catch (err) {
      showToast(
        'Verify failed',
        err instanceof ApiError ? err.message : 'Could not verify customer.',
        'warning'
      );
    } finally {
      setVerifying(false);
    }
  };

  const validatePay = (): boolean => {
    if (!serviceId || !customerId.trim()) {
      showToast('Missing details', 'Provider and account are required.', 'warning');
      return false;
    }
    if (kind === 'cable') {
      if (!selectedTvPlan) {
        showToast('Select bouquet', 'Pick a TV plan to continue.', 'warning');
        return false;
      }
      return true;
    }
    const amount = parseFloat(amountStr.replace(/,/g, ''));
    if (kind === 'electricity') {
      if (isNaN(amount) || amount < electricityMin) {
        showToast(
          'Invalid amount',
          `Minimum electricity amount is ₦${electricityMin.toLocaleString()}.`,
          'warning'
        );
        return false;
      }
    }
    if (kind === 'betting') {
      if (isNaN(amount) || amount < 100 || amount > 100000) {
        showToast('Invalid amount', 'Betting top-up must be ₦100–₦100,000.', 'warning');
        return false;
      }
    }
    return true;
  };

  const handleContinue = () => {
    if (!validatePay()) return;
    setPinOpen(true);
  };

  const handlePinSuccess = async (pin: string) => {
    if (!validatePay()) return;
    setBusy(true);
    try {
      if (kind === 'electricity') {
        const amount = parseFloat(amountStr.replace(/,/g, ''));
        const res = await apiVtuElectricity({
          service_id: serviceId,
          customer_id: customerId.trim(),
          variation_id: variationId,
          amount,
          pin,
        });
        void refreshBalances();
        setPinOpen(false);
        rememberVtuRecentBeneficiary({
          kind: 'electricity',
          account: customerId.trim(),
          providerId: serviceId,
          providerLabel: serviceLabel,
          label: customerName || undefined,
          lastDetail: `₦${amount.toLocaleString()}`,
        });
        void refreshRecent();
        const token = res.token || res.pendingToken || undefined;
        setSuccess({
          title: 'Electricity paid',
          detail: `${serviceLabel} · ₦${amount.toLocaleString()}`,
          token: token || undefined,
        });
        showToast(
          token ? 'Token ready' : 'Payment submitted',
          token ? 'Copy your STS token below.' : 'Token may arrive shortly.',
          'success'
        );
      } else if (kind === 'cable') {
        const plan = selectedTvPlan!;
        await apiVtuTv({
          service_id: serviceId,
          customer_id: customerId.trim(),
          variation_id: plan.variation_id,
          expected_price: Number(plan.price),
          pin,
        });
        void refreshBalances();
        setPinOpen(false);
        rememberVtuRecentBeneficiary({
          kind: 'cable',
          account: customerId.trim(),
          providerId: serviceId,
          providerLabel: serviceLabel,
          label: customerName || undefined,
          lastDetail: plan.label,
        });
        void refreshRecent();
        setSuccess({
          title: 'TV subscription paid',
          detail: `${plan.label} · ₦${Number(plan.price).toLocaleString()}`,
        });
        showToast('TV paid', plan.label, 'success');
      } else {
        const amount = parseFloat(amountStr.replace(/,/g, ''));
        await apiVtuBetting({
          service_id: serviceId,
          customer_id: customerId.trim(),
          amount,
          pin,
        });
        void refreshBalances();
        setPinOpen(false);
        rememberVtuRecentBeneficiary({
          kind: 'betting',
          account: customerId.trim(),
          providerId: serviceId,
          providerLabel: serviceLabel,
          label: customerName || undefined,
          lastDetail: `₦${amount.toLocaleString()}`,
        });
        void refreshRecent();
        setSuccess({
          title: 'Betting wallet funded',
          detail: `${serviceLabel} · ₦${amount.toLocaleString()}`,
        });
        showToast('Betting top-up done', `₦${amount.toLocaleString()} sent.`, 'success');
      }
    } catch (err) {
      showToast(
        'Payment failed',
        err instanceof ApiError ? err.message : 'Could not complete bill payment.',
        'warning'
      );
      throw err instanceof Error
        ? err
        : new Error(err instanceof ApiError ? err.message : 'Payment failed');
    } finally {
      setBusy(false);
    }
  };

  const accountLabel =
    kind === 'electricity'
      ? 'Meter number'
      : kind === 'cable'
        ? 'Smartcard number'
        : 'Betting user ID';

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5" id="paybills-screen">
      <section className="flex items-center justify-between px-0.5">
        <p className="text-[12px] text-[var(--muted)]">Electricity · Cable TV · Betting</p>
        <span className="glass-chip !rounded-full !px-2.5 !py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Icon name="bolt" size={13} />
          Live VTU
        </span>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setActiveScreen('airtime')}
          className="glass-card glass-strong !rounded-[18px] px-3.5 py-3 text-left flex items-center gap-2.5 active:scale-[0.98]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300">
            <Icon name="smartphone" size={17} />
          </span>
          <span>
            <span className="block text-[12px] font-bold text-[var(--text)]">Airtime</span>
            <span className="block text-[10px] text-[var(--muted)]">Dedicated top-up</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveScreen('data')}
          className="glass-card glass-strong !rounded-[18px] px-3.5 py-3 text-left flex items-center gap-2.5 active:scale-[0.98]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300">
            <Icon name="wifi" size={17} />
          </span>
          <span>
            <span className="block text-[12px] font-bold text-[var(--text)]">Data</span>
            <span className="block text-[10px] text-[var(--muted)]">Bundle plans</span>
          </span>
        </button>
      </section>

      <section className="space-y-3">
        <p className="px-0.5 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Bill options
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {BILL_KINDS.map(cat => {
            const isSelected = kind === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setKind(cat.id)}
                className={`glass-card glass-strong !rounded-[18px] min-h-[96px] p-3 text-left flex flex-col justify-between transition-all active:scale-[0.98] ${
                  isSelected ? 'ring-2 ring-[var(--accent)]/40' : ''
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isSelected
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                      : 'bg-black/[0.04] dark:bg-white/8 text-[var(--muted)]'
                  }`}
                >
                  <Icon name={cat.icon} size={17} />
                </span>
                <span>
                  <span className="block text-[12px] font-bold text-[var(--text)] leading-tight">
                    {cat.name}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[var(--muted)] leading-tight">
                    {cat.subtitle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <RecentVtuBeneficiaries kind={kind} items={recentItems} onSelect={applyRecent} />

      <section className="glass-card glass-strong !rounded-[24px] px-5 py-5 space-y-4">
        <p className="text-[13px] font-semibold text-[var(--text)]">Payment details</p>

        {catalogLoading ? (
          <p className="text-[12px] text-[var(--muted)] text-center py-6">Loading billers…</p>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                Provider
              </label>
              <div className="relative">
                <select
                  value={serviceId}
                  onChange={e => setServiceId(e.target.value)}
                  className={`${fieldClass} appearance-none pr-10 cursor-pointer`}
                >
                  {services.length === 0 && <option value="">No providers</option>}
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Icon
                  name="expand_more"
                  size={18}
                  className="text-[var(--muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                />
              </div>
            </div>

            {kind === 'electricity' && (
              <div className="grid grid-cols-2 gap-2">
                {(['prepaid', 'postpaid'] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariationId(v)}
                    className={`h-10 rounded-xl text-[12px] font-semibold border capitalize ${
                      variationId === v
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                        : 'border-[var(--glass-border)] text-[var(--muted)]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                {accountLabel}
              </label>
              <div className="flex gap-2">
                <input
                  className={`${fieldClass} font-mono flex-1`}
                  type="text"
                  value={customerId}
                  onChange={e => {
                    setCustomerId(e.target.value);
                    setCustomerName('');
                  }}
                  placeholder={
                    kind === 'electricity'
                      ? 'Meter number'
                      : kind === 'cable'
                        ? 'Smartcard number'
                        : 'User ID (case-sensitive)'
                  }
                />
                <button
                  type="button"
                  disabled={verifying}
                  onClick={() => void handleVerify()}
                  className="shrink-0 h-12 px-3 rounded-2xl border border-[var(--accent)]/30 text-[var(--accent)] text-[12px] font-semibold disabled:opacity-60"
                >
                  {verifying ? '…' : 'Verify'}
                </button>
              </div>
              {customerName && (
                <p className="text-[12px] text-emerald-600 dark:text-emerald-400 px-0.5">
                  {customerName}
                </p>
              )}
            </div>

            {kind === 'cable' ? (
              <div className="space-y-2">
                <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                  Bouquet / plan
                </label>
                {tvPlans.length === 0 ? (
                  <p className="text-[12px] text-[var(--muted)] py-2">
                    {serviceId ? 'Loading plans…' : 'Select a TV provider'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                    {tvPlans.map(plan => {
                      const selected = tvVariationId === plan.variation_id;
                      return (
                        <button
                          key={plan.variation_id}
                          type="button"
                          onClick={() => setTvVariationId(plan.variation_id)}
                          className={`rounded-2xl border px-3.5 py-3 text-left ${
                            selected
                              ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10'
                              : 'border-[var(--glass-border)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-semibold text-[var(--text)]">
                              {plan.label}
                            </span>
                            <span className="text-[12px] font-mono font-semibold text-[var(--accent)]">
                              ₦{Number(plan.price).toLocaleString()}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                  Amount (₦)
                </label>
                <input
                  className={`${fieldClass} text-lg font-mono font-bold`}
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value)}
                  placeholder="2,000"
                />
                <div className="grid grid-cols-3 gap-2">
                  {(kind === 'betting' ? [500, 1000, 5000] : [2000, 5000, 10000]).map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountStr(amt.toLocaleString())}
                      className="h-9 rounded-xl text-[11px] font-mono font-semibold border border-[var(--glass-border)] text-[var(--muted)]"
                    >
                      ₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleContinue}
              disabled={busy || !serviceId}
              className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold disabled:opacity-60"
            >
              Continue with PIN
            </button>
          </>
        )}
      </section>

      <PinSheetModal
        isOpen={pinOpen}
        onClose={() => !busy && setPinOpen(false)}
        title="Confirm bill payment"
        subtitle={
          kind === 'cable' && selectedTvPlan
            ? `${selectedTvPlan.label} · ₦${Number(selectedTvPlan.price).toLocaleString()}`
            : `${serviceLabel} · ₦${amountStr}`
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
              <h3 className="text-[16px] font-semibold text-[var(--text)]">{success.title}</h3>
              <p className="text-[12px] text-[var(--muted)] mt-1">{success.detail}</p>
              {success.token && (
                <p className="text-[12px] font-mono text-[var(--text)] mt-3 break-all px-2">
                  Token: {success.token}
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
