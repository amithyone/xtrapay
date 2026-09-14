import React, { useCallback, useEffect, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import {
  apiReferralBonuses,
  apiReferralInvite,
  apiReferralLeaderboard,
  apiReferralList,
  apiReferralMe,
  apiReferralRules,
  type AppReferralBonus,
  type AppReferralEntry,
  type AppReferralInvite,
  type AppReferralLeaderRow,
  type AppReferralMe,
  type AppReferralRules,
} from '../../lib/xtrapayApi';
import { Icon } from '../Icon';

const money = (n: number) =>
  `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Tab = 'invite' | 'people' | 'bonuses' | 'board';

/**
 * Referrals — invite code, referred list, bonuses, leaderboard.
 * Backed by GET /referrals/{rules,me,invite,list,bonuses,leaderboard}.
 */
export const ReferralsScreen: React.FC = () => {
  const { showToast } = useTransactions();
  const [tab, setTab] = useState<Tab>('invite');
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<AppReferralMe | null>(null);
  const [rules, setRules] = useState<AppReferralRules | null>(null);
  const [invite, setInvite] = useState<AppReferralInvite | null>(null);
  const [people, setPeople] = useState<AppReferralEntry[]>([]);
  const [bonuses, setBonuses] = useState<AppReferralBonus[]>([]);
  const [board, setBoard] = useState<AppReferralLeaderRow[]>([]);

  const load = useCallback(async () => {
    try {
      const [meRes, rulesRes, inviteRes] = await Promise.all([
        apiReferralMe().catch(() => null),
        apiReferralRules().catch(() => null),
        apiReferralInvite().catch(() => null),
      ]);
      setMe(meRes);
      setRules(rulesRes);
      setInvite(inviteRes);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) {
        showToast(
          'Referrals unavailable',
          err instanceof ApiError ? err.message : 'Could not load referral data.',
          'warning'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab === 'people') {
      void apiReferralList()
        .then(setPeople)
        .catch(() => setPeople([]));
    } else if (tab === 'bonuses') {
      void apiReferralBonuses()
        .then(setBonuses)
        .catch(() => setBonuses([]));
    } else if (tab === 'board') {
      void apiReferralLeaderboard()
        .then(setBoard)
        .catch(() => setBoard([]));
    }
  }, [tab]);

  const copyCode = async () => {
    const code = invite?.payCode || me?.payCode;
    if (!code) {
      showToast('No code yet', 'Your invite code will appear once referrals are live.', 'info');
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      showToast('Copied', `Invite code ${code} copied.`, 'success');
    } catch {
      showToast('Copy failed', code, 'info');
    }
  };

  const shareInvite = async () => {
    const text = invite?.shareText;
    if (!text) {
      showToast('Nothing to share', 'Invite text is not ready yet.', 'info');
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Join Xtrapay', text, url: invite?.shareUrl });
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast('Invite copied', 'Share text copied to clipboard.', 'success');
    } catch {
      // user cancelled share
    }
  };

  if (loading && !me && !invite) {
    return (
      <main className="flex-1 min-w-0 px-5 pt-5 pb-32" id="referrals-screen">
        <p className="text-[13px] text-[var(--muted)] text-center py-16">Loading referrals…</p>
      </main>
    );
  }

  const payCode = invite?.payCode || me?.payCode || '—';
  const tabs: { id: Tab; label: string }[] = [
    { id: 'invite', label: 'Invite' },
    { id: 'people', label: 'People' },
    { id: 'bonuses', label: 'Bonuses' },
    { id: 'board', label: 'Board' },
  ];

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-32 space-y-4" id="referrals-screen">
      <section className="glass-card glass-strong settings-list !rounded-[24px] px-5 py-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              Your invite code
            </p>
            <p className="mt-1.5 font-mono text-[1.6rem] font-semibold tracking-tight text-[var(--text)]">
              {payCode}
            </p>
            <p className="mt-1 text-[12px] text-[var(--muted)] leading-snug">
              Friends enter this pay code or phone at signup.
            </p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
            <Icon name="gift" size={20} />
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] px-3 py-2.5">
            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wide">Referred</p>
            <p className="mt-0.5 text-[15px] font-semibold font-mono text-[var(--text)]">
              {me?.referredCount ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] px-3 py-2.5">
            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wide">Earned</p>
            <p className="mt-0.5 text-[15px] font-semibold font-mono text-[var(--text)]">
              {money(me?.earnedTotal ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] px-3 py-2.5">
            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wide">Pending</p>
            <p className="mt-0.5 text-[15px] font-semibold font-mono text-[var(--text)]">
              {money(me?.pendingBonuses ?? 0)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void copyCode()}
            className="flex-1 h-11 rounded-2xl border border-[var(--glass-border)] text-[13px] font-semibold text-[var(--text)] flex items-center justify-center gap-2 bg-black/[0.03] dark:bg-white/[0.05]"
          >
            <Icon name="content_copy" size={15} />
            Copy code
          </button>
          <button
            type="button"
            onClick={() => void shareInvite()}
            className="flex-1 h-11 rounded-2xl bg-[var(--accent)] text-white text-[13px] font-semibold flex items-center justify-center gap-2"
          >
            <Icon name="share" size={15} />
            Share invite
          </button>
        </div>
      </section>

      {rules && (
        <section className="glass-card glass-strong settings-list !rounded-[22px] px-4 py-3.5 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">How you earn</p>
          <p className="text-[12px] text-[var(--muted)] leading-snug">{rules.description}</p>
          <ul className="text-[12px] text-[var(--text)] space-y-1.5 pt-1">
            <li className="flex gap-2">
              <Icon name="check" size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>
                First top-up{rules.minFirstTopup > 0 ? ` (min ${money(rules.minFirstTopup)})` : ''}
                {rules.firstTopupBonusPct > 0
                  ? ` · ${rules.firstTopupBonusPct}%`
                  : ''}
                {rules.firstTopupBonusCap > 0 ? ` capped at ${money(rules.firstTopupBonusCap)}` : ''}
              </span>
            </li>
            <li className="flex gap-2">
              <Icon name="check" size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Milestone every {rules.milestoneEveryTxns || 100} spend txns
                {rules.milestoneBonus > 0 ? ` · ${money(rules.milestoneBonus)}` : ''}
                {rules.bonusWindowMonths > 0
                  ? ` · window ~${rules.bonusWindowMonths} months`
                  : ''}
              </span>
            </li>
          </ul>
        </section>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 h-9 px-3.5 rounded-full text-[12px] font-semibold border transition-colors ${
              tab === t.id
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'border-[var(--glass-border)] text-[var(--muted)] bg-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'invite' && (
        <section className="glass-card glass-strong settings-list !rounded-[22px] px-4 py-4 space-y-3">
          <p className="text-[13px] font-semibold text-[var(--text)]">Share link</p>
          <p className="text-[12px] text-[var(--muted)] break-all leading-snug">
            {invite?.shareUrl || 'Invite link will appear when the API is live.'}
          </p>
          {me?.referredByCode && (
            <p className="text-[11px] text-[var(--muted)]">
              You joined with code <span className="font-mono text-[var(--text)]">{me.referredByCode}</span>
            </p>
          )}
          {me?.rank != null && (
            <p className="text-[11px] text-[var(--muted)]">
              Leaderboard rank · <span className="font-semibold text-[var(--text)]">#{me.rank}</span>
            </p>
          )}
        </section>
      )}

      {tab === 'people' && (
        <section className="space-y-2">
          {people.length === 0 ? (
            <div className="glass-card glass-strong !rounded-[22px] px-4 py-10 text-center">
              <p className="text-[13px] font-semibold text-[var(--text)]">No referrals yet</p>
              <p className="mt-1 text-[12px] text-[var(--muted)]">
                Share your code — they lock to you on signup.
              </p>
            </div>
          ) : (
            people.map(p => (
              <article
                key={p.id}
                className="glass-card glass-strong settings-list !rounded-[20px] px-4 py-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--text)] truncate">{p.name}</p>
                  <p className="text-[11px] text-[var(--muted)] truncate">
                    {p.phoneMasked}
                    {p.joinedAt ? ` · ${p.joinedAt}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] font-mono font-semibold text-[var(--text)]">
                    {money(p.earnedFromThem)}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] capitalize">{p.status}</p>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {tab === 'bonuses' && (
        <section className="space-y-2">
          {bonuses.length === 0 ? (
            <div className="glass-card glass-strong !rounded-[22px] px-4 py-10 text-center">
              <p className="text-[13px] font-semibold text-[var(--text)]">No bonuses yet</p>
              <p className="mt-1 text-[12px] text-[var(--muted)]">
                First top-ups and spend milestones show here.
              </p>
            </div>
          ) : (
            bonuses.map(b => (
              <article
                key={b.id}
                className="glass-card glass-strong settings-list !rounded-[20px] px-4 py-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--text)] truncate">{b.title}</p>
                  <p className="text-[11px] text-[var(--muted)] truncate">
                    {b.meta || b.createdAt || b.status}
                  </p>
                </div>
                <p className="text-[13px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                  +{money(b.amount)}
                </p>
              </article>
            ))
          )}
        </section>
      )}

      {tab === 'board' && (
        <section className="space-y-2">
          {board.length === 0 ? (
            <div className="glass-card glass-strong !rounded-[22px] px-4 py-10 text-center">
              <p className="text-[13px] font-semibold text-[var(--text)]">Leaderboard empty</p>
              <p className="mt-1 text-[12px] text-[var(--muted)]">
                Rankings appear after settlement runs.
              </p>
            </div>
          ) : (
            board.map(row => (
              <article
                key={`${row.rank}-${row.payCode}`}
                className={`glass-card glass-strong settings-list !rounded-[20px] px-4 py-3.5 flex items-center gap-3 ${
                  row.isMe ? 'ring-1 ring-[var(--accent)]/30' : ''
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)] font-mono text-[12px] font-semibold">
                  #{row.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[var(--text)] truncate">
                    {row.name}
                    {row.isMe ? ' · You' : ''}
                  </p>
                  <p className="text-[11px] text-[var(--muted)] font-mono truncate">
                    {row.payCode} · {row.referredCount} referred
                  </p>
                </div>
                <p className="text-[12px] font-mono font-semibold text-[var(--text)] shrink-0">
                  {money(row.earnedTotal)}
                </p>
              </article>
            ))
          )}
        </section>
      )}
    </main>
  );
};
