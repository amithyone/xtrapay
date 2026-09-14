import type { ActiveProcessingTransfer, Transaction } from '../types';

type ReceiptTheme = 'dark' | 'light';

export type ReceiptData = {
  amount: number;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  reference: string;
  narration?: string;
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
  };
}

export function receiptFromTransaction(tx: Transaction): ReceiptData {
  const recipient =
    tx.recipient ||
    tx.title.replace(/^(Transfer to|Received from|Payment to)\s+/i, '') ||
    'Xtrapay customer';
  const time = tx.fullTime || tx.timestamp || '—';
  return {
    amount: tx.amount,
    recipientName: recipient,
    bankName: tx.bank || 'Xtrapay',
    accountNumber: tx.token || '—',
    reference: tx.reference,
    narration: tx.note || tx.subtitle,
    initTime: time,
    processedTime: time,
    settledTime: time,
    statusLabel: String(tx.status || 'SETTLED').toUpperCase(),
    headline: tx.type === 'credit' ? 'Payment received' : 'Payment sent',
  };
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/);
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy;
}

/** Paint a receipt that mirrors TransferSuccessModal frosted styling. */
export function renderTransferReceiptCanvas(
  transfer: ReceiptData,
  theme: ReceiptTheme = 'dark'
): HTMLCanvasElement {
  const c = COLORS[theme];
  const W = 720;
  const H = 1180;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  // Background atmosphere
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, c.bg0);
  bg.addColorStop(1, c.bg1);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft accent orb
  const orb = ctx.createRadialGradient(W * 0.8, 80, 20, W * 0.8, 80, 280);
  orb.addColorStop(0, `${c.accent}33`);
  orb.addColorStop(1, 'transparent');
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, W, H);

  // Main glass card
  const cardX = 40;
  const cardY = 48;
  const cardW = W - 80;
  const cardH = H - 96;
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fillStyle = c.glass;
  ctx.fill();
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Brand row
  ctx.fillStyle = c.accent;
  ctx.font = receiptFont(700, 28);
  ctx.textAlign = 'left';
  ctx.fillText('Xtrapay', cardX + 40, cardY + 64);
  ctx.fillStyle = c.muted;
  ctx.font = receiptFont(600, 14);
  ctx.fillText('Transfer receipt', cardX + 40, cardY + 92);

  // E2EE chip
  roundRect(ctx, cardX + cardW - 130, cardY + 42, 90, 28, 14);
  ctx.fillStyle = c.successBg;
  ctx.fill();
  ctx.strokeStyle = `${c.success}55`;
  ctx.stroke();
  ctx.fillStyle = c.success;
  ctx.font = receiptFont(700, 12);
  ctx.textAlign = 'center';
  ctx.fillText('E2EE', cardX + cardW - 85, cardY + 61);

  // Success badge
  const cx = W / 2;
  ctx.beginPath();
  ctx.arc(cx, cardY + 190, 42, 0, Math.PI * 2);
  ctx.fillStyle = c.successBg;
  ctx.fill();
  ctx.strokeStyle = `${c.success}66`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cardY + 190, 30, 0, Math.PI * 2);
  ctx.fillStyle = c.success;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 10, cardY + 190);
  ctx.lineTo(cx - 2, cardY + 198);
  ctx.lineTo(cx + 12, cardY + 182);
  ctx.stroke();

  // Amount
  ctx.fillStyle = c.text;
  ctx.font = receiptFont(700, 52);
  ctx.textAlign = 'center';
  ctx.fillText(money(transfer.amount), cx, cardY + 290);

  ctx.fillStyle = c.text;
  ctx.font = receiptFont(600, 28);
  ctx.fillText(transfer.headline || 'Transfer sent', cx, cardY + 340);

  ctx.fillStyle = c.muted;
  ctx.font = receiptFont(400, 18);
  ctx.fillText('sent to', cx, cardY + 372);
  ctx.fillStyle = c.text;
  ctx.font = receiptFont(600, 20);
  wrapText(ctx, transfer.recipientName, cx, cardY + 402, cardW - 100, 26);

  // Ref chip
  const refLabel = `REF  ${transfer.reference}`;
  ctx.font = receiptFont(600, 16);
  const refW = Math.max(280, ctx.measureText(refLabel).width + 48);
  roundRect(ctx, cx - refW / 2, cardY + 430, refW, 44, 22);
  ctx.fillStyle = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  ctx.fill();
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = c.accent;
  ctx.fillText(refLabel, cx, cardY + 458);

  // Progress card
  const boxX = cardX + 36;
  const boxY = cardY + 510;
  const boxW = cardW - 72;
  const boxH = 320;
  roundRect(ctx, boxX, boxY, boxW, boxH, 24);
  ctx.fillStyle = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  ctx.fill();
  ctx.strokeStyle = c.border;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = c.muted;
  ctx.font = receiptFont(500, 14);
  ctx.fillText('Here is how your transfer progressed.', boxX + 24, boxY + 36);

  roundRect(ctx, boxX + boxW - 110, boxY + 18, 86, 26, 13);
  ctx.fillStyle = c.successBg;
  ctx.fill();
  ctx.fillStyle = c.success;
  ctx.font = receiptFont(700, 11);
  ctx.textAlign = 'center';
  ctx.fillText(transfer.statusLabel || 'SETTLED', boxX + boxW - 67, boxY + 36);

  const steps = [
    {
      title: 'Transfer initiated',
      detail:
        transfer.channel === 'wallet'
          ? `Debit of ${money(transfer.amount)} confirmed from your Xtrapay wallet`
          : `Debit of ${money(transfer.amount)} confirmed from Xtrapay Vault`,
      time: transfer.initTime || '—',
    },
    {
      title: 'Transfer processed',
      detail:
        transfer.channel === 'wallet'
          ? 'Cleared instantly on Xtrapay ledger (no NIP)'
          : 'Cleared via NIBSS Instant Payment (NIP) switch',
      time: transfer.processedTime || '—',
    },
    {
      title: 'Received by recipient',
      detail:
        transfer.channel === 'wallet'
          ? `Credited to ${transfer.recipientName} · Xtrapay Wallet`
          : `Credited to ${transfer.recipientName} · ${transfer.bankName}`,
      time: transfer.settledTime || '—',
    },
  ];

  let sy = boxY + 78;
  steps.forEach((step, i) => {
    ctx.beginPath();
    ctx.arc(boxX + 36, sy + 8, 12, 0, Math.PI * 2);
    ctx.fillStyle = c.success;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(boxX + 30, sy + 8);
    ctx.lineTo(boxX + 34, sy + 12);
    ctx.lineTo(boxX + 42, sy + 4);
    ctx.stroke();

    if (i < steps.length - 1) {
      ctx.strokeStyle = `${c.success}66`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(boxX + 36, sy + 22);
      ctx.lineTo(boxX + 36, sy + 78);
      ctx.stroke();
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = c.text;
    ctx.font = receiptFont(600, 16);
    ctx.fillText(step.title, boxX + 64, sy + 4);
    ctx.textAlign = 'right';
    ctx.fillStyle = c.muted;
    ctx.font = receiptFont(500, 13);
    ctx.fillText(step.time, boxX + boxW - 24, sy + 4);
    ctx.textAlign = 'left';
    ctx.fillStyle = c.muted;
    ctx.font = receiptFont(400, 13);
    wrapText(ctx, step.detail, boxX + 64, sy + 28, boxW - 110, 18);
    sy += 84;
  });

  // Details
  const details = [
    ['Bank', transfer.bankName],
    ['Account', transfer.accountNumber],
    ['Narration', transfer.narration || 'Instant Funds Transfer'],
    ['Status', transfer.statusLabel || 'Settled'],
  ];
  let dy = boxY + boxH + 36;
  details.forEach(([k, v]) => {
    ctx.fillStyle = c.muted;
    ctx.font = receiptFont(500, 14);
    ctx.textAlign = 'left';
    ctx.fillText(k, boxX, dy);
    ctx.fillStyle = c.text;
    ctx.font = receiptFont(600, 15);
    ctx.textAlign = 'right';
    const truncated =
      ctx.measureText(v).width > boxW * 0.55 ? `${v.slice(0, 28)}…` : v;
    ctx.fillText(truncated, boxX + boxW, dy);
    dy += 34;
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

  const pageW = 595;
  const pageH = 842;
  const margin = 28;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height / canvas.width) * imgW;
  const imgX = margin;
  const imgY = Math.max(margin, (pageH - imgH) / 2);
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
      text: `Transfer of ${money(transfer.amount)} to ${transfer.recipientName}`,
    });
    return 'shared' as const;
  }
  triggerDownload(blob, file.name);
  return 'downloaded' as const;
}
