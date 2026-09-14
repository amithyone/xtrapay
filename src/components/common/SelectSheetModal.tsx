import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../Icon';

export type SelectSheetOption = {
  value: string;
  label: string;
  subtitle?: string;
  /** Optional avatar initials; defaults to first 2 letters of label */
  initials?: string;
};

type SelectSheetModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  options: SelectSheetOption[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
  zClass?: string;
};

const fieldClass =
  'w-full h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--glass-border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 transition-all placeholder:text-[var(--muted)]';

/**
 * Frosted glass option sheet — replaces native &lt;select&gt; / radio pickers.
 * Matches Transfer destination-bank modal language.
 */
export const SelectSheetModal: React.FC<SelectSheetModalProps> = ({
  open,
  onClose,
  title,
  eyebrow,
  subtitle,
  options,
  value,
  onChange,
  searchable = false,
  searchPlaceholder = 'Search',
  emptyLabel = 'No options',
  zClass = 'z-[90]',
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      o =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(q)) ||
        o.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  if (!open) return null;

  return (
    <div
      className={`app-modal-overlay ${zClass} bg-black/70 backdrop-blur-md`}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="app-modal-panel glass-card glass-strong settings-list !rounded-[24px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
          <div className="min-w-0 pr-3">
            {eyebrow && (
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
                {eyebrow}
              </p>
            )}
            <h2 className={`text-[16px] font-semibold text-[var(--text)] ${eyebrow ? 'mt-1' : ''}`}>
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="frosted-pad !h-9 !w-9 !min-h-9 !min-w-9 !rounded-full text-[var(--muted)] shrink-0"
            aria-label="Close"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {searchable && (
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                <Icon name="search" size={16} />
              </span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className={`${fieldClass} !pl-10`}
                autoFocus
              />
            </div>
          </div>
        )}

        <div className="max-h-[min(55vh,24rem)] overflow-y-auto divide-y divide-[var(--glass-border)]">
          {filtered.length === 0 ? (
            <p className="px-5 py-8 text-center text-[12px] text-[var(--muted)]">{emptyLabel}</p>
          ) : (
            filtered.map(opt => {
              const active = opt.value === value;
              const initials =
                opt.initials ||
                opt.label
                  .replace(/[^a-zA-Z0-9 ]/g, '')
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(w => w[0])
                  .join('')
                  .toUpperCase() ||
                opt.label.slice(0, 2).toUpperCase();
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    onClose();
                  }}
                  className={`settings-row w-full flex items-center gap-3 px-5 py-3.5 text-left appearance-none border-0 cursor-pointer ${
                    active ? 'bg-[var(--accent)]/10' : 'bg-transparent'
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)] text-[11px] font-bold">
                    {initials.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[var(--text)] truncate">
                      {opt.label}
                    </p>
                    {opt.subtitle && (
                      <p className="text-[11px] text-[var(--muted)] truncate">{opt.subtitle}</p>
                    )}
                  </div>
                  {active && (
                    <Icon name="check" size={18} className="text-[var(--accent)] shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

type SelectFieldButtonProps = {
  label?: string;
  valueLabel: string;
  placeholder?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

/** Trigger that opens SelectSheetModal — same chrome as Transfer bank field. */
export const SelectFieldButton: React.FC<SelectFieldButtonProps> = ({
  label,
  valueLabel,
  placeholder = 'Select…',
  onClick,
  disabled,
  className = '',
}) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && (
      <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
        {label}
      </label>
    )}
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${fieldClass} flex items-center justify-between gap-2 text-left appearance-none cursor-pointer disabled:opacity-50`}
    >
      <span
        className={`min-w-0 truncate ${
          valueLabel ? 'text-[var(--text)]' : 'text-[var(--muted)]'
        }`}
      >
        {valueLabel || placeholder}
      </span>
      <Icon name="expand_more" size={18} className="text-[var(--muted)] shrink-0" />
    </button>
  </div>
);
