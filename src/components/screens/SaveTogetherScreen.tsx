import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { INITIAL_BENEFICIARIES } from '../../data/initialData';
import { Icon } from '../Icon';
import { PinSheetModal } from '../common/PinSheetModal';

type FilterType = 'all' | 'pending' | 'active' | 'declined';
type CreateStep = 'members' | 'target' | 'review';

const fieldClass =
  'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

const sheetBackdropClass =
  'fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn';

const sheetPanelClass =
  'glass-card glass-strong w-full max-w-md !rounded-t-[24px] sm:!rounded-[24px] p-6 shadow-2xl space-y-4 animate-slideUp max-h-[90vh] overflow-y-auto';

export const SaveTogetherScreen: React.FC = () => {
  const {
    groupPots,
    createGroupPot,
    contributeToPot,
    acceptPotInvite,
    declinePotInvite,
    navigateBack,
    showToast,
  } = useTransactions();

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedPotId, setSelectedPotId] = useState<string | null>(null);
  const [contributeAmountStr, setContributeAmountStr] = useState<string>('25,000');
  const [isContributeKeypadOpen, setIsContributeKeypadOpen] = useState<boolean>(false);
  const [isPinOpen, setIsPinOpen] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createStep, setCreateStep] = useState<CreateStep>('members');
  const [newTitle, setNewTitle] = useState<string>('Japan Summer Trip 2027');
  const [newSubtitle, setNewSubtitle] = useState<string>('Shared travel & flight savings');
  const [newTargetStr, setNewTargetStr] = useState<string>('1,500,000');
  const [newFrequency, setNewFrequency] = useState<string>('Monthly');
  const [selectedMembers, setSelectedMembers] = useState<Array<{ name: string; phone: string }>>([
    { name: 'Sarah Williams', phone: '0802 334 1120' },
    { name: 'David Adeleke', phone: '0805 119 2240' },
  ]);
  const [manualPhoneInput, setManualPhoneInput] = useState<string>('');
  const [manualNameInput, setManualNameInput] = useState<string>('');

  const activePot = groupPots.find(p => p.id === selectedPotId);

  const filteredPots = groupPots.filter(pot => {
    if (filter === 'all') return true;
    if (filter === 'pending') return pot.myStatus === 'Pending';
    if (filter === 'active') return pot.myStatus === 'Active';
    if (filter === 'declined') return pot.myStatus === 'Declined';
    return true;
  });

  const handleAddMember = (name: string, phone: string) => {
    if (selectedMembers.some(m => m.phone === phone)) {
      showToast('Already Added', `${name} is already in the list.`, 'info');
      return;
    }
    setSelectedMembers(prev => [...prev, { name, phone }]);
    setManualNameInput('');
    setManualPhoneInput('');
  };

  const handleRemoveMember = (phone: string) => {
    setSelectedMembers(prev => prev.filter(m => m.phone !== phone));
  };

  const handleConfirmCreatePot = () => {
    const numericTarget = parseFloat(newTargetStr.replace(/,/g, ''));
    if (isNaN(numericTarget) || numericTarget <= 0) {
      showToast('Invalid Target', 'Please enter a target amount.', 'warning');
      return;
    }
    if (!newTitle.trim()) {
      showToast('Title Required', 'Give your savings pot a name.', 'warning');
      return;
    }

    createGroupPot({
      title: newTitle,
      subtitle: newSubtitle,
      targetAmount: numericTarget,
      frequency: newFrequency,
      members: selectedMembers,
    });

    setIsCreateOpen(false);
    setCreateStep('members');
  };

  const handleTriggerContribute = () => {
    setIsContributeKeypadOpen(false);
    setIsPinOpen(true);
  };

  const handleContributePinSuccess = (pin: string) => {
    if (selectedPotId) {
      const amount = parseFloat(contributeAmountStr.replace(/,/g, ''));
      const ok = contributeToPot(selectedPotId, amount, pin);
      if (ok) {
        setIsPinOpen(false);
      }
    }
  };

  const totalMemberCount = selectedMembers.length + 1;
  const targetNum = parseFloat(newTargetStr.replace(/,/g, '')) || 0;
  const perPersonShare = Math.round(targetNum / Math.max(1, totalMemberCount));

  const statusBadgeClass = (status: string) => {
    if (status === 'Active') {
      return 'glass-chip !rounded-full !px-2 !py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400';
    }
    if (status === 'Pending') {
      return 'glass-chip !rounded-full !px-2 !py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400';
    }
    return 'glass-chip !rounded-full !px-2 !py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--muted)]';
  };

  return (
    <main className="flex-1 min-w-0 px-5 pt-5 pb-28 space-y-5" id="save-together-screen">
      <section className="flex items-center justify-between px-0.5">
        <p className="text-[12px] text-[var(--muted)]">
          Collaborative targets &amp; group savings pools
        </p>
        <button
          type="button"
          onClick={() => {
            setCreateStep('members');
            setIsCreateOpen(true);
          }}
          className="h-9 px-3.5 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-lg shadow-[var(--accent)]/20 active:scale-[0.98] transition-transform"
        >
          <Icon name="add" size={16} />
          New Pot
        </button>
      </section>

      <section className="space-y-2.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)] px-0.5">
          Filter
        </p>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {(['all', 'pending', 'active', 'declined'] as FilterType[]).map(tab => {
            const isSelected = filter === tab;
            const count =
              tab === 'all'
                ? groupPots.length
                : groupPots.filter(p => p.myStatus.toLowerCase() === tab).length;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`shrink-0 px-3 py-2 rounded-2xl text-[12px] font-semibold capitalize flex items-center gap-1.5 transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'glass-chip !rounded-2xl text-[var(--muted)]'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-black/[0.06] dark:bg-white/10 text-[var(--muted)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        {filteredPots.length === 0 ? (
          <div className="glass-card glass-strong !rounded-[24px] p-8 text-center space-y-2">
            <Icon name="savings" size={32} className="text-[var(--muted)] mx-auto opacity-60" />
            <p className="text-[13px] font-semibold text-[var(--text)]">No Pots in this View</p>
            <p className="text-[12px] text-[var(--muted)]">
              Create a group pot or accept an invitation to start saving together.
            </p>
          </div>
        ) : (
          filteredPots.map(pot => {
            const progress = Math.min(100, Math.round((pot.raisedAmount / pot.targetAmount) * 100));
            const isPendingInvite = pot.myStatus === 'Pending';
            return (
              <button
                key={pot.id}
                type="button"
                onClick={() => setSelectedPotId(pot.id)}
                className="glass-card glass-strong !rounded-[20px] w-full text-left p-4 space-y-3 active:scale-[0.99] transition-transform ring-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold text-[var(--text)] truncate">
                      {pot.title}
                    </h3>
                    <p className="text-[11px] text-[var(--muted)] mt-0.5">{pot.subtitle}</p>
                  </div>
                  <span className={statusBadgeClass(pot.myStatus)}>{pot.myStatus}</span>
                </div>

                <div className="flex items-baseline justify-between text-[12px]">
                  <div>
                    <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.18em] font-medium">
                      Raised
                    </span>
                    <p className="font-mono font-bold text-[15px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ₦{pot.raisedAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.18em] font-medium">
                      Goal
                    </span>
                    <p className="font-mono font-semibold text-[13px] text-[var(--text)] mt-0.5">
                      ₦{pot.targetAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="w-full rounded-full h-2 overflow-hidden border border-[var(--glass-border)] bg-black/[0.04] dark:bg-white/[0.06]">
                  <div
                    className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--glass-border)]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                      {pot.members.slice(0, 4).map(m => (
                        <div
                          key={m.id}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-[var(--glass-border)] ${m.avatarColor}`}
                          title={m.name}
                        >
                          {m.initials}
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] text-[var(--muted)] truncate">
                      {pot.members.length} members • {pot.frequency}
                    </span>
                  </div>

                  {isPendingInvite ? (
                    <span className="text-[11px] text-[var(--accent)] font-semibold flex items-center gap-0.5 shrink-0">
                      View Invite
                      <Icon name="arrow_forward" size={14} />
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-[var(--muted)] shrink-0">
                      {progress}% target
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </section>

      {activePot && (
        <div className={sheetBackdropClass}>
          <div className={sheetPanelClass}>
            <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
              <div>
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.22em] font-medium">
                  Pot Overview
                </span>
                <h2 className="text-[16px] font-semibold text-[var(--text)] mt-0.5">
                  {activePot.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPotId(null)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {activePot.myStatus === 'Pending' && (
              <div className="rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-4 py-3 space-y-2">
                <p className="text-[12px] text-[var(--text)] font-semibold">
                  You have been invited to join this savings pot!
                </p>
                <p className="text-[11px] text-[var(--muted)]">
                  Your target share is ₦
                  {Math.round(activePot.targetAmount / activePot.members.length).toLocaleString()}.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => acceptPotInvite(activePot.id)}
                    className="flex-1 h-11 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold active:scale-[0.98] transition-transform"
                  >
                    Accept Invite
                  </button>
                  <button
                    type="button"
                    onClick={() => declinePotInvite(activePot.id)}
                    className="h-11 px-4 rounded-2xl glass-chip !rounded-2xl text-[12px] font-semibold text-rose-600 dark:text-rose-400"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05]">
              <div>
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.18em]">
                  Total Raised
                </span>
                <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ₦{activePot.raisedAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.18em]">
                  Target Goal
                </span>
                <p className="font-mono text-lg font-bold text-[var(--text)] mt-0.5">
                  ₦{activePot.targetAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.18em]">
                  Your Contribution
                </span>
                <p className="font-mono text-sm font-semibold text-[var(--accent)] mt-0.5">
                  ₦{activePot.myContribution.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.18em]">
                  Cycle Frequency
                </span>
                <p className="text-[12px] font-semibold text-[var(--text)] mt-0.5">
                  {activePot.frequency}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-[var(--muted)]">
                <span>Progress</span>
                <span>
                  {Math.round((activePot.raisedAmount / activePot.targetAmount) * 100)}% Completed
                </span>
              </div>
              <div className="w-full rounded-full h-2.5 overflow-hidden border border-[var(--glass-border)] bg-black/[0.04] dark:bg-white/[0.06]">
                <div
                  className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (activePot.raisedAmount / activePot.targetAmount) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.22em] font-medium">
                Members Breakdown ({activePot.members.length})
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {activePot.members.map(m => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-[10px] ${m.avatarColor}`}
                      >
                        {m.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12px] text-[var(--text)] font-semibold truncate">
                          {m.name}
                        </p>
                        <p className="text-[10px] text-[var(--muted)]">
                          Share: ₦{m.share.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ₦{m.contributed.toLocaleString()}
                      </p>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                          m.status === 'Active'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {activePot.myStatus === 'Active' && (
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsContributeKeypadOpen(true)}
                  className="flex-1 h-11 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform"
                >
                  <Icon name="add" size={16} />
                  Contribute Money
                </button>
                <button
                  type="button"
                  onClick={() =>
                    showToast(
                      'Locked Vault',
                      'Withdrawal unlocks when target cycle completes.',
                      'info'
                    )
                  }
                  className="h-11 px-4 rounded-2xl glass-chip !rounded-2xl text-[12px] font-semibold text-[var(--text)]"
                >
                  Withdraw
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isContributeKeypadOpen && (
        <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="glass-card glass-strong w-full max-w-md !rounded-t-[24px] sm:!rounded-[24px] p-6 shadow-2xl space-y-4 animate-slideUp">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
              <span className="text-[12px] font-semibold text-[var(--text)] uppercase tracking-[0.18em]">
                Contribute to Pot
              </span>
              <button
                type="button"
                onClick={() => setIsContributeKeypadOpen(false)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="text-center py-2">
              <span className="text-[12px] text-[var(--muted)] block">Contribution Amount</span>
              <div className="text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
                ₦{contributeAmountStr}
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-1">
                Transferred from your personal wallet balance
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {['10,000', '25,000', '50,000', '100,000'].map(chip => {
                const isSelected = contributeAmountStr === chip;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setContributeAmountStr(chip)}
                    className={`py-2 rounded-xl text-[11px] font-mono font-semibold transition-all ${
                      isSelected
                        ? 'bg-[var(--accent)]/15 border border-[var(--accent)] text-[var(--accent)]'
                        : 'glass-chip !rounded-xl !px-1 !py-2 text-[var(--muted)]'
                    }`}
                  >
                    ₦{chip}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleTriggerContribute}
              className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform"
            >
              Authorize with PIN
              <Icon name="arrow_forward" size={18} />
            </button>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className={`${sheetPanelClass} z-[75]`}>
            <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
              <div>
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.22em] font-medium">
                  Step{' '}
                  {createStep === 'members'
                    ? '1 of 3: Members'
                    : createStep === 'target'
                      ? '2 of 3: Target'
                      : '3 of 3: Review'}
                </span>
                <h2 className="text-[16px] font-semibold text-[var(--text)] mt-0.5">
                  Create Group Pot
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)]"
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {createStep === 'members' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                    Pot Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Wedding Contribution, Vacation..."
                    className={`${fieldClass} !h-11 text-[13px]`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                    Description / Purpose
                  </label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={e => setNewSubtitle(e.target.value)}
                    placeholder="Brief description"
                    className={`${fieldClass} !h-11 text-[13px]`}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-3.5 py-3 text-[12px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 h-8 shrink-0 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[10px]">
                      You
                    </span>
                    <span className="text-[var(--text)] font-semibold truncate">
                      Tunde Bakare (Creator)
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--accent)] font-mono shrink-0">Included</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.22em] font-medium">
                    Invited Members ({selectedMembers.length})
                  </span>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedMembers.map(m => (
                      <div
                        key={m.phone}
                        className="p-3 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-between gap-2 text-[12px]"
                      >
                        <div className="min-w-0">
                          <p className="text-[var(--text)] font-semibold truncate">{m.name}</p>
                          <p className="text-[10px] text-[var(--muted)]">{m.phone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.phone)}
                          className="frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-full text-rose-600 dark:text-rose-400 shrink-0"
                          aria-label={`Remove ${m.name}`}
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.22em] font-medium">
                    Add from Beneficiaries
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {INITIAL_BENEFICIARIES.map(ben => (
                      <button
                        key={ben.id}
                        type="button"
                        onClick={() => handleAddMember(ben.name, ben.accountNumber)}
                        className="glass-chip !rounded-2xl shrink-0 flex items-center gap-1 px-2.5 py-2 text-[12px] text-[var(--text)] active:scale-[0.98]"
                      >
                        <Icon name="add" size={12} className="text-[var(--accent)]" />
                        <span>{ben.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCreateStep('target')}
                  className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white text-[13px] font-semibold flex items-center justify-center gap-1 shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform"
                >
                  Next: Set Target
                  <Icon name="arrow_forward" size={16} />
                </button>
              </div>
            )}

            {createStep === 'target' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                    Group Target Goal (₦)
                  </label>
                  <input
                    type="text"
                    value={newTargetStr}
                    onChange={e => setNewTargetStr(e.target.value)}
                    className={`${fieldClass} !h-14 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                    Contribution Cycle
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Weekly', 'Monthly', 'Target Goal'].map(freq => {
                      const isSelected = newFrequency === freq;
                      return (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setNewFrequency(freq)}
                          className={`py-2.5 rounded-2xl text-[12px] font-semibold transition-all active:scale-[0.98] ${
                            isSelected
                              ? 'bg-[var(--accent)] text-white shadow-sm'
                              : 'glass-chip !rounded-2xl text-[var(--muted)]'
                          }`}
                        >
                          {freq}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] space-y-1">
                  <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.18em] font-medium">
                    Live Calculation Preview
                  </span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-[12px] text-[var(--text)]">Per-person share:</span>
                    <span className="font-mono text-base font-bold text-[var(--accent)]">
                      ₦{perPersonShare.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--muted)]">
                    Calculated as total target divided by {totalMemberCount} members.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateStep('members')}
                    className="h-11 px-4 rounded-2xl glass-chip !rounded-2xl text-[12px] font-semibold text-[var(--text)]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateStep('review')}
                    className="flex-1 h-11 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold flex items-center justify-center gap-1 shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform"
                  >
                    Next: Review &amp; Launch
                    <Icon name="arrow_forward" size={16} />
                  </button>
                </div>
              </div>
            )}

            {createStep === 'review' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl border border-[var(--glass-border)] bg-black/[0.03] dark:bg-white/[0.05] space-y-2">
                  <h4 className="text-[14px] font-semibold text-[var(--text)]">{newTitle}</h4>
                  <p className="text-[12px] text-[var(--muted)]">{newSubtitle}</p>
                  <div className="border-t border-[var(--glass-border)] pt-2 space-y-1.5 text-[12px]">
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--muted)]">Target Goal:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₦{newTargetStr}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--muted)]">Total Members:</span>
                      <span className="text-[var(--text)]">{totalMemberCount} members</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--muted)]">Per-person share:</span>
                      <span className="font-mono font-bold text-[var(--accent)]">
                        ₦{perPersonShare.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--muted)]">Cycle:</span>
                      <span className="text-[var(--text)]">{newFrequency}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateStep('target')}
                    className="h-11 px-4 rounded-2xl glass-chip !rounded-2xl text-[12px] font-semibold text-[var(--text)]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCreatePot}
                    className="flex-1 h-11 rounded-2xl bg-[var(--accent)] text-white text-[12px] font-semibold flex items-center justify-center gap-1 shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98] transition-transform"
                  >
                    <Icon name="check" size={16} />
                    Confirm &amp; Dispatch Invites
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <PinSheetModal
        isOpen={isPinOpen}
        onClose={() => setIsPinOpen(false)}
        title="Authorize Contribution"
        recipient={activePot?.title}
        amount={parseFloat(contributeAmountStr.replace(/,/g, '')) || 0}
        subtitle="Funds will be locked securely in the group vault."
        onSuccess={handleContributePinSuccess}
      />
    </main>
  );
};
