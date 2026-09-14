import React, { useCallback, useEffect, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError } from '../../lib/api';
import {
  apiCreateSupportTicket,
  apiSupportTickets,
  type AppSupportTicket,
} from '../../lib/xtrapayApi';
import { Icon } from '../Icon';

type SupportView = 'hub' | 'ticket';

const CATEGORIES = [
  'Payments & transfers',
  'POS / terminals',
  'Loans & repayments',
  'Cards',
  'Account & KYC',
  'Limits & security',
  'Other',
];

/**
 * Support centre — contact, FAQs, and ticket intake.
 */
export const SupportScreen: React.FC = () => {
  const { showToast, setActiveScreen } = useTransactions();
  const [view, setView] = useState<SupportView>('hub');
  const [tickets, setTickets] = useState<AppSupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [categoryModal, setCategoryModal] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const list = await apiSupportTickets();
      setTickets(list);
    } catch {
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const fieldClass =
    'auth-field w-full h-12 px-4 rounded-2xl text-[var(--text)] text-sm focus:outline-none transition-all placeholder:text-[var(--muted)]';

  const submitTicket = async () => {
    if (!subject.trim() || message.trim().length < 10) {
      showToast('Incomplete', 'Add a subject and a short description (10+ characters).', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiCreateSupportTicket({
        category,
        subject: subject.trim(),
        message: message.trim(),
      });
      setTickets(prev => [created, ...prev]);
      showToast('Ticket opened', `${created.id} · we’ll reply within 15 minutes.`, 'success');
      setSubject('');
      setMessage('');
      setView('hub');
    } catch (err) {
      showToast(
        'Could not submit',
        err instanceof ApiError ? err.message : 'Support API unavailable.',
        'warning'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (view === 'ticket') {
    return (
      <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id="support-ticket-screen">
        <header className="hub-action-shell !rounded-[28px] px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">New ticket</p>
            <h1 className="mt-2 text-[15px] font-semibold text-[var(--text)] tracking-tight">
              Tell us what happened
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setView('hub')}
            className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
            aria-label="Back"
          >
            <Icon name="close" size={16} />
          </button>
        </header>

        <button
          type="button"
          onClick={() => setCategoryModal(true)}
          className={`settings-row ${fieldClass} flex items-center justify-between gap-2 text-left appearance-none cursor-pointer`}
        >
          <span className="truncate text-[var(--text)]">{category}</span>
          <Icon name="expand_more" size={18} className="text-[var(--muted)] shrink-0" />
        </button>
        <input
          className={fieldClass}
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Subject"
        />
        <textarea
          className={`${fieldClass} h-28 py-3 resize-none`}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Describe the issue — include reference if you have one"
        />
        <button
          type="button"
          onClick={() => void submitTicket()}
          disabled={submitting}
          className="glass-cta w-full !rounded-2xl disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit ticket'}
        </button>

        {categoryModal && (
          <div
            className="app-modal-overlay z-[90] bg-black/70 backdrop-blur-md"
            role="presentation"
            onClick={() => setCategoryModal(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Select category"
              className="app-modal-panel glass-card glass-strong settings-list !rounded-[24px] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
                <h2 className="text-[16px] font-semibold text-[var(--text)]">Category</h2>
                <button
                  type="button"
                  onClick={() => setCategoryModal(false)}
                  className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                  aria-label="Close"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
              <div className="max-h-[min(55vh,24rem)] overflow-y-auto divide-y divide-[var(--glass-border)]">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCategory(c);
                      setCategoryModal(false);
                    }}
                    className={`settings-row w-full flex items-center justify-between px-5 py-3.5 text-left appearance-none border-0 cursor-pointer ${
                      c === category ? 'bg-[var(--accent)]/10' : 'bg-transparent'
                    }`}
                  >
                    <span className="text-[13px] font-semibold text-[var(--text)]">{c}</span>
                    {c === category && (
                      <Icon name="check" size={18} className="text-[var(--accent)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 px-5 pt-4 pb-32 space-y-4" id="support-screen">
      <header className="hub-action-shell !rounded-[28px] px-4 py-3.5">
        <p className="text-[12px] text-[var(--muted)] tracking-wide leading-none">Help centre</p>
        <h1 className="mt-2 text-[15px] font-semibold text-[var(--text)] tracking-tight">
          Xtrapay support
        </h1>
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          24/7 Tier-1 concierge · avg reply under 15 minutes
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            showToast('Concierge', 'Connecting to live chat…', 'info');
          }}
          className="settings-row hub-action-shell !rounded-[28px] px-4 py-4 text-left appearance-none border-0 cursor-pointer"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
            <Icon name="chat" size={18} />
          </span>
          <p className="mt-3 text-[13px] font-semibold text-[var(--text)]">Live chat</p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">Talk to an agent</p>
        </button>
        <button
          type="button"
          onClick={() => setView('ticket')}
          className="settings-row hub-action-shell !rounded-[28px] px-4 py-4 text-left appearance-none border-0 cursor-pointer"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300">
            <Icon name="edit_note" size={18} />
          </span>
          <p className="mt-3 text-[13px] font-semibold text-[var(--text)]">Open ticket</p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">Trackable case</p>
        </button>
      </div>

      <section className="glass-card glass-strong settings-list !rounded-[24px] overflow-hidden divide-y divide-[var(--glass-border)]">
        <button
          type="button"
          onClick={() => showToast('Call support', 'Dialling 0700 XTRAPAY…', 'info')}
          className="settings-row w-full flex items-center gap-3 px-4 py-3.5 text-left appearance-none border-0 bg-transparent cursor-pointer"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
            <Icon name="smartphone" size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[var(--text)]">Call 0700 XTRAPAY</p>
            <p className="text-[11px] text-[var(--muted)]">Toll-free on major networks</p>
          </div>
          <Icon name="chevron_right" size={18} className="text-[var(--muted)]" />
        </button>
        <button
          type="button"
          onClick={() => showToast('Email', 'Opening support@xtrapay.ng…', 'info')}
          className="settings-row w-full flex items-center gap-3 px-4 py-3.5 text-left appearance-none border-0 bg-transparent cursor-pointer"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
            <Icon name="chat_bubble" size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[var(--text)]">Email support</p>
            <p className="text-[11px] text-[var(--muted)]">support@xtrapay.ng</p>
          </div>
          <Icon name="chevron_right" size={18} className="text-[var(--muted)]" />
        </button>
        <button
          type="button"
          onClick={() => setActiveScreen('terms')}
          className="settings-row w-full flex items-center gap-3 px-4 py-3.5 text-left appearance-none border-0 bg-transparent cursor-pointer"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
            <Icon name="help" size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[var(--text)]">FAQs & policies</p>
            <p className="text-[11px] text-[var(--muted)]">Terms · privacy · licences</p>
          </div>
          <Icon name="chevron_right" size={18} className="text-[var(--muted)]" />
        </button>
      </section>

      <section className="space-y-2">
        <p className="px-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          Your tickets
        </p>
        <div className="glass-card glass-strong settings-list !rounded-[24px] overflow-hidden divide-y divide-[var(--glass-border)]">
          {loadingTickets ? (
            <p className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">Loading tickets…</p>
          ) : tickets.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">
              No tickets yet — open one above.
            </p>
          ) : null}
          {tickets.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                showToast(t.subject, `${t.id} · ${t.status} · Updated ${t.updated}`, 'info')
              }
              className="settings-row w-full flex items-center gap-3 px-4 py-3.5 text-left appearance-none border-0 bg-transparent cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[var(--text)] truncate">{t.subject}</p>
                <p className="text-[11px] text-[var(--muted)]">
                  {t.category} · {t.updated}
                </p>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${
                  t.status === 'Open'
                    ? 'bg-[var(--accent)]/12 text-[var(--accent)]'
                    : t.status === 'Pending'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                }`}
              >
                {t.status}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
};
