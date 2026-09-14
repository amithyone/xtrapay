import type { ActiveProcessingTransfer, Transaction } from '../types';

type ReceiptTheme = 'dark' | 'light';

export type ReceiptData = {
  amount: number;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  reference: string;
  sessionId?: string;
  narration?: string;
  date?: string;
  token?: string;
  cardLast4?: string;
  cardUsdAmount?: string;
  typeLabel?: string;
  categoryLabel?: string;
  initTime: string;
  processedTime: string;
  settledTime: string;
  statusLabel?: string;
  headline?: string;
  channel?: 'bank' | 'wallet';
};

export function receiptFromTransfer(transfer: ActiveProcessingTransfer): ReceiptData {
  return {
    amount: transfer.amount,
    recipientName: transfer.recipientName,
    bankName: transfer.bankName,
    accountNumber: transfer.accountNumber,
    reference: transfer.reference,
    narration: transfer.narration,
    initTime: transfer.initTime,
    processedTime: transfer.processedTime,
    settledTime: transfer.settledTime,
    statusLabel: 'SETTLED',
    headline: transfer.channel === 'wallet' ? 'Wallet transfer sent' : 'Transfer sent',
    channel: transfer.channel || 'bank',
    typeLabel: 'Debit',
    categoryLabel: 'Transfer',
  };
}

export function receiptFromTransaction(tx: Transaction): ReceiptData {
  const recipient =
    tx.recipient ||
    tx.title.replace(/^(Transfer to|Received from|Payment to)\s+/i, '') ||
    'Xtrapay customer';
  const time = tx.fullTime || tx.timestamp || '—';
  const categoryLabel = (() => {
    switch (tx.category) {
      case 'bill':
        return 'Bill pay';
      case 'utility':
        return 'Utility';
      case 'savings':
        return 'Savings';
      case 'card':
        return 'Card';
      case 'p2p':
        return 'P2P';
      default:
        return 'Transfer';
    }
  })();
  return {
    amount: tx.amount,
    recipientName: recipient,
    bankName: tx.bank || (tx.category === 'transfer' ? 'Xtrapay' : ''),
    accountNumber: tx.accountNumber || '',
    reference: tx.reference,
    sessionId: tx.sessionId,
    narration: tx.note || tx.subtitle,
    date: tx.date,
    token: tx.token,
    cardLast4: tx.cardLast4,
    cardUsdAmount: tx.cardUsdAmount,
    typeLabel: tx.type === 'credit' ? 'Credit' : 'Debit',
    categoryLabel,
    initTime: time,
    processedTime: time,
    settledTime: time,
    statusLabel: String(tx.status || 'SETTLED').toUpperCase(),
    headline: tx.type === 'credit' ? 'Payment received' : 'Payment sent',
    channel: tx.bank ? 'bank' : undefined,
  };
}

/** Detail rows for PNG/PDF — only include fields that have a value. */
function receiptDetailRows(transfer: ReceiptData): Array<[string, string]> {
  const rows: Array<[string, string]> = [['Reference', transfer.reference]];
  if (transfer.sessionId?.trim()) rows.push(['Session ID', transfer.sessionId.trim()]);
  if (transfer.date?.trim()) {
    const when = [transfer.date.trim(), transfer.settledTime || transfer.initTime]
      .filter(Boolean)
      .join(' · ');
    rows.push(['Date & time', when]);
  }
  if (transfer.typeLabel) rows.push(['Type', transfer.typeLabel]);
  if (transfer.categoryLabel) rows.push(['Category', transfer.categoryLabel]);
  if (transfer.bankName?.trim()) rows.push(['Bank', transfer.bankName.trim()]);
  if (transfer.accountNumber?.trim() && transfer.accountNumber !== '—') {
    rows.push(['Account', transfer.accountNumber.trim()]);
  }
  if (transfer.token?.trim()) rows.push(['Token', transfer.token.trim()]);
  if (transfer.cardLast4?.trim()) rows.push(['Card', `•••• ${transfer.cardLast4.trim()}`]);
  if (transfer.cardUsdAmount?.trim()) rows.push(['USD amount', transfer.cardUsdAmount.trim()]);
  rows.push(['Narration', transfer.narration?.trim() || 'Instant Funds Transfer']);
  rows.push(['Status', transfer.statusLabel || 'Settled']);
  return rows;
}

const COLORS = {
  dark: {
    bg0: '#1a0508',
    bg1: '#2a0a10',
    glass: 'rgba(40, 12, 18, 0.92)',
    border: 'rgba(255, 255, 255, 0.14)',
    text: '#faf7f7',
    muted: '#c4a8ae',
    accent: '#e94560',
    success: '#34d399',
    successBg: 'rgba(52, 211, 153, 0.14)',
  },
  light: {
    bg0: '#f7f6f5',
    bg1: '#f0eeec',
    glass: 'rgba(255, 255, 255, 0.96)',
    border: 'rgba(15, 15, 15, 0.10)',
    text: '#0a0a0a',
    muted: '#52525b',
    accent: '#dc2626',
    success: '#059669',
    successBg: 'rgba(5, 150, 105, 0.12)',
  },
} as const;

function money(n: number) {
  return `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** App brand typeface — must match index.html Google Fonts load. */
const RECEIPT_FONT = 'Comfortaa, sans-serif';

function receiptFont(weight: 400 | 500 | 600 | 700, sizePx: number) {
  return `${weight} ${sizePx}px ${RECEIPT_FONT}`;
}

async function ensureReceiptFonts() {
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  try {
    await Promise.all([
      document.fonts.load('400 16px Comfortaa'),
      document.fonts.load('500 16px Comfortaa'),
      document.fonts.load('600 16px Comfortaa'),
      document.fonts.load('700 28px Comfortaa'),
      document.fonts.load('700 52px Comfortaa'),
    ]);
  } catch {
    // Canvas will fall back to sans-serif if Comfortaa is unavailable
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Wrap long unbroken strings (session IDs) by character when needed. */
function wrapValueLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (ctx.measureText(text).width <= maxWidth) return [text];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  const pushChunk = (chunk: string) => {
    if (!chunk) return;
    if (ctx.measureText(chunk).width <= maxWidth) {
      if (line && ctx.measureText(`${line} ${chunk}`).width <= maxWidth) {
        line = `${line} ${chunk}`;
      } else {
        if (line) lines.push(line);
        line = chunk;
      }
      return;
    }
    if (line) {
      lines.push(line);
      line = '';
    }
    let buf = '';
    for (const ch of chunk) {
      const next = buf + ch;
      if (ctx.measureText(next).width > maxWidth && buf) {
        lines.push(buf);
        buf = ch;
      } else {
        buf = next;
      }
    }
    line = buf;
  };
  for (const word of words) pushChunk(word);
  if (line) lines.push(line);
  return lines.length ? lines : [text];
}

/** Paint a receipt that mirrors TransferSuccessModal frosted styling. */
export function renderTransferReceiptCanvas(
  transfer: ReceiptData,
  theme: ReceiptTheme = 'dark'
): HTMLCanvasElement {
  const c = COLORS[theme];
  const W = 720;
  const padX = 40;
  const cardX = padX;
  const cardW = W - padX * 2;
  const innerX = cardX + 32;
  const innerW = cardW - 64;
  const details = receiptDetailRows(transfer);
  const cx = W / 2;
  const timelineH = 168;

  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) throw new Error('Canvas unavailable');

  probe.font = receiptFont(600, 18);
  const nameLines = wrapValueLines(probe, transfer.recipientName, innerW);
  const nameH = nameLines.length * 24;

  probe.font = receiptFont(600, 13);
  const labelW = Math.min(140, innerW * 0.34);
  const valueMaxW = innerW - labelW - 36;
  const detailRowHeights = details.map(([, v]) => {
    const lines = wrapValueLines(probe, v, valueMaxW);
    return Math.max(28, lines.length * 18 + 8);
  });
  const detailsH = detailRowHeights.reduce((a, b) => a + b, 0);

  // Exact layout cursor (must match draw order below)
  const cardY = 36;
  let y = cardY + 36;
  y += 86; // brand block
  y += 62; // success mark
  y += 36; // amount
  y += 26; // headline
  y += 24; // sent to / from
  y += nameH + 28; // recipient
  y += 44; // ref chip
  y += timelineH + 22; // progress + gap
  y += 10 + detailsH + 24; // details panel padding + rows + footer gap
  const cardH = y - cardY;
  const H = cardY + cardH + cardY;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, c.bg0);
  bg.addColorStop(1, c.bg1);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const orb = ctx.createRadialGradient(W * 0.82, 60, 10, W * 0.82, 60, 220);
  orb.addColorStop(0, `${c.accent}2a`);
  orb.addColorStop(1, 'transparent');
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, W, H);

  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fillStyle = c.glass;
  ctx.fill();
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  y = cardY + 36;

  // Brand
  ctx.fillStyle = c.accent;
  ctx.font = receiptFont(700, 24);
  ctx.textAlign = 'left';
  ctx.fillText('Xtrapay', innerX, y + 8);
  ctx.fillStyle = c.muted;
  ctx.font = receiptFont(500, 13);
  ctx.fillText('Transaction receipt', innerX, y + 30);

  roundRect(ctx, cardX + cardW - 108, y - 6, 76, 26, 13);
  ctx.fillStyle = c.successBg;
  ctx.fill();
  ctx.strokeStyle = `${c.success}55`;
  ctx.stroke();
  ctx.fillStyle = c.success;
  ctx.font = receiptFont(700, 11);
  ctx.textAlign = 'center';
  ctx.fillText('E2EE', cardX + cardW - 70, y + 12);
  y += 86;

  // Success mark
  ctx.beginPath();
  ctx.arc(cx, y + 18, 28, 0, Math.PI * 2);
  ctx.fillStyle = c.successBg;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, y + 18, 20, 0, Math.PI * 2);
  ctx.fillStyle = c.success;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 7, y + 18);
  ctx.lineTo(cx - 1, y + 24);
  ctx.lineTo(cx + 9, y + 12);
  ctx.stroke();
  y += 62;

  ctx.fillStyle = c.text;
  ctx.font = receiptFont(700, 40);
  ctx.textAlign = 'center';
  ctx.fillText(money(transfer.amount), cx, y);
  y += 36;

  ctx.font = receiptFont(600, 20);
  ctx.fillText(transfer.headline || 'Transfer sent', cx, y);
  y += 26;

  ctx.fillStyle = c.muted;
  ctx.font = receiptFont(400, 14);
  ctx.fillText(transfer.typeLabel === 'Credit' ? 'from' : 'sent to', cx, y);
  y += 24;

  ctx.fillStyle = c.text;
  ctx.font = receiptFont(600, 18);
  nameLines.forEach((line, i) => {
    ctx.fillText(line, cx, y + i * 24);
  });
  y += nameH + 28;

  const refLabel = `REF  ${transfer.reference}`;
  ctx.font = receiptFont(600, 14);
  const refW = Math.min(innerW, Math.max(240, ctx.measureText(refLabel).width + 40));
  roundRect(ctx, cx - refW / 2, y - 18, refW, 36, 18);
  ctx.fillStyle = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  ctx.fill();
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = c.accent;
  ctx.fillText(refLabel, cx, y + 5);
  y += 44;

  const boxX = innerX;
  const boxW = innerW;
  const boxY = y;
  roundRect(ctx, boxX, boxY, boxW, timelineH, 18);
  ctx.fillStyle = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  ctx.fill();
  ctx.strokeStyle = c.border;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = c.muted;
  ctx.font = receiptFont(500, 12);
  ctx.fillText('Transfer progress', boxX + 18, boxY + 26);

  roundRect(ctx, boxX + boxW - 96, boxY + 12, 78, 22, 11);
  ctx.fillStyle = c.successBg;
  ctx.fill();
  ctx.fillStyle = c.success;
  ctx.font = receiptFont(700, 10);
  ctx.textAlign = 'center';
  ctx.fillText((transfer.statusLabel || 'SETTLED').slice(0, 12), boxX + boxW - 57, boxY + 27);

  const steps = [
    {
      title: 'Initiated',
      detail:
        transfer.channel === 'wallet'
          ? `${money(transfer.amount)} from your wallet`
          : `${money(transfer.amount)} from Xtrapay Vault`,
      time: transfer.initTime || '—',
    },
    {
      title: 'Processed',
      detail:
        transfer.channel === 'wallet'
          ? 'Cleared on Xtrapay ledger'
          : 'NIBSS Instant Payment (NIP)',
      time: transfer.processedTime || '—',
    },
    {
      title: 'Received',
      detail:
        transfer.channel === 'wallet'
          ? `${transfer.recipientName} · Wallet`
          : `${transfer.recipientName} · ${transfer.bankName || 'Bank'}`,
      time: transfer.settledTime || '—',
    },
  ];

  let sy = boxY + 52;
  steps.forEach((step, i) => {
    ctx.beginPath();
    ctx.arc(boxX + 28, sy + 4, 8, 0, Math.PI * 2);
    ctx.fillStyle = c.success;
    ctx.fill();
    if (i < steps.length - 1) {
      ctx.strokeStyle = `${c.success}55`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boxX + 28, sy + 14);
      ctx.lineTo(boxX + 28, sy + 42);
      ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = c.text;
    ctx.font = receiptFont(600, 13);
    ctx.fillText(step.title, boxX + 48, sy);
    ctx.textAlign = 'right';
    ctx.fillStyle = c.muted;
    ctx.font = receiptFont(500, 11);
    ctx.fillText(step.time, boxX + boxW - 18, sy);
    ctx.textAlign = 'left';
    ctx.fillStyle = c.muted;
    ctx.font = receiptFont(400, 12);
    let detail = step.detail;
    const detailMax = boxW - 110;
    if (ctx.measureText(detail).width > detailMax) {
      while (detail.length > 4 && ctx.measureText(`${detail}…`).width > detailMax) {
        detail = detail.slice(0, -1);
      }
      detail = `${detail}…`;
    }
    ctx.fillText(detail, boxX + 48, sy + 18);
    sy += 38;
  });

  y = boxY + timelineH + 22;

  const detailsTop = y;
  roundRect(ctx, boxX, detailsTop - 8, boxW, detailsH + 28, 18);
  ctx.fillStyle = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)';
  ctx.fill();
  ctx.strokeStyle = c.border;
  ctx.stroke();

  let dy = detailsTop + 10;
  details.forEach(([k, v], idx) => {
    ctx.font = receiptFont(500, 12);
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'left';
    ctx.fillText(k, boxX + 18, dy + 12);

    ctx.font = receiptFont(600, 13);
    ctx.fillStyle = c.text;
    ctx.textAlign = 'right';
    const lines = wrapValueLines(ctx, v, valueMaxW);
    lines.forEach((line, i) => {
      ctx.fillText(line, boxX + boxW - 18, dy + 12 + i * 18);
    });
    dy += detailRowHeights[idx] ?? Math.max(28, lines.length * 18 + 8);
  });

  return canvas;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function normalizeReceipt(
  input: ReceiptData | ActiveProcessingTransfer | Transaction
): ReceiptData {
  if ('step' in input) return receiptFromTransfer(input);
  if ('title' in input) return receiptFromTransaction(input);
  return input;
}

export async function downloadTransferReceiptImage(
  input: ReceiptData | ActiveProcessingTransfer | Transaction,
  theme: ReceiptTheme = 'dark'
) {
  await ensureReceiptFonts();
  const transfer = normalizeReceipt(input);
  const canvas = renderTransferReceiptCanvas(transfer, theme);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png');
  });
  triggerDownload(blob, `xtrapay-receipt-${transfer.reference}.png`);
  return blob;
}

/** Minimal single-page PDF wrapping a JPEG of the styled receipt. */
export async function downloadTransferReceiptPdf(
  input: ReceiptData | ActiveProcessingTransfer | Transaction,
  theme: ReceiptTheme = 'dark'
) {
  await ensureReceiptFonts();
  const transfer = normalizeReceipt(input);
  const canvas = renderTransferReceiptCanvas(transfer, theme);
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const jpegBase64 = jpegDataUrl.split(',')[1];
  const jpegBytes = Uint8Array.from(atob(jpegBase64), c => c.charCodeAt(0));

  // Page sized to receipt aspect ratio so nothing is clipped or over-shrunk
  const margin = 24;
  const pageW = 595;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height / canvas.width) * imgW;
  const pageH = Math.ceil(imgH + margin * 2);
  const imgX = margin;
  const imgY = margin;
  const content = `q\n${imgW.toFixed(2)} 0 0 ${imgH.toFixed(2)} ${imgX.toFixed(2)} ${(pageH - imgY - imgH).toFixed(2)} cm\n/Im0 Do\nQ\n`;

  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const pushStr = (s: string) => parts.push(encoder.encode(s));

  pushStr('%PDF-1.4\n');
  const offsets: number[] = [0];
  let size = parts.reduce((n, p) => n + p.length, 0);

  const writeObj = (num: number, body: string, binary?: Uint8Array) => {
    offsets[num] = size;
    const head = encoder.encode(`${num} 0 obj\n${body}`);
    parts.push(head);
    size += head.length;
    if (binary) {
      parts.push(binary);
      size += binary.length;
      const tail = encoder.encode('\nendstream\nendobj\n');
      parts.push(tail);
      size += tail.length;
    } else {
      const tail = encoder.encode('\nendobj\n');
      parts.push(tail);
      size += tail.length;
    }
  };

  writeObj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  writeObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  writeObj(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>`
  );
  writeObj(4, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  writeObj(
    5,
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
    jpegBytes
  );

  const xrefStart = size;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pushStr(xref);
  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }

  const blob = new Blob([out], { type: 'application/pdf' });
  triggerDownload(blob, `xtrapay-receipt-${transfer.reference}.pdf`);
  return blob;
}

export async function shareTransferReceiptImage(
  input: ReceiptData | ActiveProcessingTransfer | Transaction,
  theme: ReceiptTheme = 'dark'
) {
  await ensureReceiptFonts();
  const transfer = normalizeReceipt(input);
  const canvas = renderTransferReceiptCanvas(transfer, theme);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png');
  });
  const file = new File([blob], `xtrapay-receipt-${transfer.reference}.png`, {
    type: 'image/png',
  });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'Xtrapay Receipt',
      text: [
        `Transfer of ${money(transfer.amount)} to ${transfer.recipientName}`,
        `Ref ${transfer.reference}`,
        transfer.sessionId ? `Session ${transfer.sessionId}` : '',
      ]
        .filter(Boolean)
        .join(' · '),
    });
    return 'shared' as const;
  }
  triggerDownload(blob, file.name);
  return 'downloaded' as const;
}
