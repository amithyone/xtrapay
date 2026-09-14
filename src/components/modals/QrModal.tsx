import React, { useEffect, useMemo, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { ApiError, getApiBase } from '../../lib/api';
import { apiWalletQr, type AppWalletQr } from '../../lib/xtrapayApi';
import { Icon } from '../Icon';

function payloadQrFallback(payload: string): string | null {
  const p = payload.trim();
  if (!p) return null;
  // Public QR encode as last resort when server image fails
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(p)}`;
}

export const QrModal: React.FC = () => {
  const {
    isQrOpen,
    setIsQrOpen,
    selectedWallet,
    accountFullName,
    showToast,
  } = useTransactions();

  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<AppWalletQr | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** 0 = imageUrl, 1 = imageBase64, 2 = payload encode fallback */
  const [srcIndex, setSrcIndex] = useState(0);

  useEffect(() => {
    if (!isQrOpen) {
      setQr(null);
      setError(null);
      setSrcIndex(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSrcIndex(0);
    (async () => {
      try {
        const data = await apiWalletQr(selectedWallet.id);
        if (!cancelled) setQr(data);
      } catch (err) {
        if (!cancelled) {
          setQr(null);
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load receive QR from the server.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isQrOpen, selectedWallet.id]);

  const candidates = useMemo(() => {
    if (!qr) return [] as string[];
    const list: string[] = [];
    if (qr.imageUrl) list.push(qr.imageUrl);
    if (qr.imageBase64) list.push(qr.imageBase64);
    const encoded = payloadQrFallback(qr.payload);
    if (encoded) list.push(encoded);
    return list;
  }, [qr]);

  const imageSrc = candidates[srcIndex] ?? null;

  if (!isQrOpen) return null;

  const acct = {
    name:
      qr?.accountName ||
      selectedWallet.accountName ||
      accountFullName ||
      selectedWallet.name,
    number: qr?.accountNumber || selectedWallet.accountNumber || '—',
    bank: qr?.bankName || selectedWallet.bankName || '—',
  };

  const payload = qr?.payload || '';

  const copyPayload = () => {
    if (!payload) {
      showToast('QR unavailable', 'Wait for the server QR payload.', 'warning');
      return;
    }
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(payload);
    }
    showToast('QR link copied', payload.startsWith('http') ? payload : 'Payload copied.', 'success');
  };

  const saveImage = async () => {
    if (!imageSrc) {
      showToast('No image yet', 'QR image is still loading from the server.', 'info');
      return;
    }
    try {
      if (imageSrc.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = imageSrc;
        a.download = `xtrapay-qr-${acct.number || 'wallet'}.svg`;
        a.click();
        showToast('QR saved', 'Receive QR downloaded.', 'success');
        setIsQrOpen(false);
        return;
      }
      const res = await fetch(imageSrc, { mode: 'cors' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xtrapay-qr-${acct.number || 'wallet'}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('QR saved', 'Receive QR downloaded.', 'success');
      setIsQrOpen(false);
    } catch {
      window.open(imageSrc, '_blank', 'noopener,noreferrer');
      showToast('QR opened', 'Save the image from the opened tab.', 'info');
    }
  };

  return (
    <div className="app-modal-overlay z-[70] bg-black/70 backdrop-blur-md">
      <div className="app-modal-panel glass-card glass-strong !rounded-[24px] !max-w-xs p-6 text-center shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-1.5">
            <Icon name="qr_code_2" size={18} className="text-[var(--accent)]" />
            <span className="text-xs font-semibold text-[var(--text)]">Receive QR</span>
          </div>
          <button
            onClick={() => setIsQrOpen(false)}
            className="frosted-pad !h-8 !w-8 !min-h-8 !min-w-8 !rounded-lg text-[var(--muted)]"
            type="button"
            aria-label="Close"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl inline-flex mx-auto shadow-inner min-h-[12rem] min-w-[12rem] items-center justify-center overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-[var(--muted)]">
              <Icon name="sync" size={22} className="animate-spin text-[var(--accent)]" />
              <p className="text-[11px]">Generating QR…</p>
            </div>
          ) : imageSrc ? (
            <img
              key={imageSrc}
              src={imageSrc}
              alt="Receive QR"
              className="w-48 h-48 object-contain"
              onError={() => {
                setSrcIndex(i => {
                  if (i + 1 < candidates.length) return i + 1;
                  return i;
                });
              }}
            />
          ) : (
            <div className="px-3 py-6 space-y-2 max-w-[12rem]">
              <Icon name="qr_code_2" size={28} className="mx-auto text-zinc-400" />
              <p className="text-[11px] text-zinc-500 leading-snug">
                {error ||
                  `QR image missing. API: ${getApiBase()}/wallets/{id}/qr — need imageUrl or imageBase64.`}
              </p>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[var(--text)]">{acct.name}</h4>
          <p className="font-mono text-xs text-[var(--accent)]">
            {acct.number} · {acct.bank}
          </p>
          <p className="text-[11px] text-[var(--muted)] mt-1">
            Scan to pay into this wallet
          </p>
          {qr?.expiresAt && (
            <p className="text-[10px] text-[var(--muted)] mt-1">Expires {qr.expiresAt}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={copyPayload}
            disabled={!payload}
            className="h-11 rounded-2xl glass-chip !rounded-2xl text-[var(--text)] text-xs font-semibold disabled:opacity-40"
            type="button"
          >
            Copy link
          </button>
          <button
            onClick={() => void saveImage()}
            disabled={!imageSrc}
            className="h-11 rounded-2xl bg-[var(--accent)] text-white text-xs font-semibold disabled:opacity-40"
            type="button"
          >
            Save to device
          </button>
        </div>
      </div>
    </div>
  );
};
