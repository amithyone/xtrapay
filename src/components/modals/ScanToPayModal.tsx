import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { Icon } from '../Icon';

export const ScanToPayModal: React.FC = () => {
  const {
    isScanToPayOpen,
    setIsScanToPayOpen,
    setPrefilledTransferData,
    setActiveScreen,
    showToast,
  } = useTransactions();

  const [segment, setSegment] = useState<'qr' | 'ocr'>('qr');
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');

  if (!isScanToPayOpen) return null;

  const handleSimulateQRScan = (type: 'p2p' | 'merchant' | 'invoice') => {
    setIsProcessing(true);
    setProcessingMessage('Decoding QR code payload...');

    setTimeout(() => {
      setIsProcessing(false);
      setIsScanToPayOpen(false);

      if (type === 'p2p') {
        setPrefilledTransferData({
          recipientName: 'Sarah Williams',
          bankName: 'Access Bank',
          accountNumber: '0812345678',
          amount: 4500,
          narration: 'QR P2P Settlement',
        });
        showToast('QR Code Decoded', 'Prefilled transfer to Sarah Williams.');
      } else if (type === 'merchant') {
        setPrefilledTransferData({
          recipientName: 'SuperMart Lekki Phase 1',
          bankName: 'GTBank',
          accountNumber: '0129847120',
          amount: 8200,
          narration: 'POS Till Checkout #402',
        });
        showToast('Merchant QR Decoded', 'Prefilled checkout to SuperMart Lekki.');
      } else {
        setPrefilledTransferData({
          recipientName: 'Adekunle Olumide',
          bankName: 'Zenith Bank',
          accountNumber: '2049182301',
          amount: 15000,
          narration: 'Invoice #841',
        });
        showToast('Invoice QR Decoded', 'Prefilled transfer to Adekunle Olumide.');
      }

      setActiveScreen('transfer');
    }, 700);
  };

  const handleSimulateOCRScan = (slipType: 'zenith' | 'gtbank' | 'invoice') => {
    setIsProcessing(true);
    setProcessingMessage('Analyzing slip image with Neural Bank OCR...');

    setTimeout(() => {
      setIsProcessing(false);
      setIsScanToPayOpen(false);

      if (slipType === 'zenith') {
        setPrefilledTransferData({
          recipientName: 'Emeka Nwosu',
          bankName: 'Zenith Bank',
          accountNumber: '2093849182',
          amount: 25000,
          narration: 'Deposit slip OCR extraction',
        });
        showToast('OCR Complete', 'Extracted Zenith Bank account: 2093849182 (Emeka Nwosu)');
      } else if (slipType === 'gtbank') {
        setPrefilledTransferData({
          recipientName: 'Amina Bello Enterprises',
          bankName: 'GTBank',
          accountNumber: '0239182910',
          amount: 50000,
          narration: 'Vendor invoice OCR extraction',
        });
        showToast('OCR Complete', 'Extracted GTBank account: 0239182910 (Amina Bello)');
      } else {
        setPrefilledTransferData({
          recipientName: 'Konga Online Shopping',
          bankName: 'Access Bank',
          accountNumber: '0981234918',
          amount: 12400,
          narration: 'Order #KG-91024',
        });
        showToast('OCR Complete', 'Extracted invoice details for Konga.');
      }

      setActiveScreen('transfer');
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md bg-[#181c24] border border-[#464554]/40 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4 animate-slideUp text-left"
        id="scan-to-pay-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#464554]/20">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-full bg-[#8083ff]/20 text-[#c0c1ff] flex items-center justify-center">
              <Icon name="qr_code_scanner" size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#dfe2ee]">Scan to Pay</h3>
              <p className="text-[10px] text-[#908fa0]">QR &amp; Bank Slip OCR Scanner</p>
            </div>
          </div>
          <button
            onClick={() => setIsScanToPayOpen(false)}
            className="p-1.5 text-[#908fa0] hover:text-[#dfe2ee] rounded-lg hover:bg-[#262a33]"
            type="button"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Mode Segment: QR Code | Bank OCR */}
        <div className="p-1 rounded-xl bg-[#0a0e16] border border-[#464554]/30 flex items-center">
          <button
            onClick={() => setSegment('qr')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              segment === 'qr'
                ? 'bg-[#8083ff] text-[#0d0096] font-bold shadow-sm'
                : 'text-[#c7c4d7] hover:text-[#dfe2ee]'
            }`}
            type="button"
          >
            <Icon name="qr_code" size={14} />
            <span>QR Code</span>
          </button>
          <button
            onClick={() => setSegment('ocr')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              segment === 'ocr'
                ? 'bg-[#8083ff] text-[#0d0096] font-bold shadow-sm'
                : 'text-[#c7c4d7] hover:text-[#dfe2ee]'
            }`}
            type="button"
          >
            <Icon name="document_scanner" size={14} />
            <span>Bank OCR</span>
          </button>
        </div>

        {/* CAMERA VIEWFINDER SIMULATION */}
        <div className="relative w-full h-56 rounded-2xl bg-black border border-[#464554]/40 overflow-hidden flex flex-col items-center justify-center">
          {/* Subtle camera texture */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#8083ff]/5 to-transparent pointer-events-none" />

          {/* Laser Scanning Bar */}
          <div className="absolute left-6 right-6 h-0.5 bg-[#4edea3] shadow-lg shadow-[#4edea3]/80 animate-bounce" />

          {/* Viewfinder Target Frame Corners */}
          <div className="w-40 h-40 border-2 border-[#8083ff]/60 rounded-xl relative flex items-center justify-center">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#c0c1ff]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#c0c1ff]" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#c0c1ff]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#c0c1ff]" />

            {segment === 'qr' ? (
              <Icon name="qr_code_2" size={48} className="text-[#8083ff]/40" />
            ) : (
              <Icon name="receipt_long" size={48} className="text-[#4edea3]/40" />
            )}
          </div>

          {/* Status Label on Camera View */}
          <div className="absolute bottom-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] text-[#dfe2ee] font-medium flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
            <span>
              {segment === 'qr'
                ? 'Align QR Code inside frame'
                : 'Align paper bank slip or account card'}
            </span>
          </div>

          {/* Flashlight toggle */}
          <button
            onClick={() => setIsFlashOn(prev => !prev)}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all ${
              isFlashOn
                ? 'bg-[#c0c1ff] text-[#0d0096] border-[#c0c1ff]'
                : 'bg-black/60 text-[#dfe2ee] border-white/20'
            }`}
            type="button"
            title="Toggle Flash"
          >
            <Icon name="flashlight_on" size={16} />
          </button>

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 text-center p-4">
              <div className="w-8 h-8 rounded-full border-2 border-[#c0c1ff] border-t-transparent animate-spin" />
              <p className="text-xs text-[#dfe2ee] font-semibold">{processingMessage}</p>
            </div>
          )}
        </div>

        {/* DEMO SCAN PRESETS */}
        <div className="space-y-2">
          <span className="text-[10px] text-[#908fa0] uppercase font-semibold block">
            {segment === 'qr' ? 'Simulate Real QR Scans' : 'Simulate Paper Slip Scans (AI OCR)'}
          </span>

          {segment === 'qr' ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSimulateQRScan('p2p')}
                className="p-2.5 rounded-xl bg-[#1c2028] hover:bg-[#262a33] border border-[#464554]/30 text-left transition-all group"
                type="button"
              >
                <p className="text-xs font-bold text-[#dfe2ee] group-hover:text-[#c0c1ff]">
                  Sarah's Wallet QR
                </p>
                <p className="text-[10px] text-[#908fa0]">₦4,500 • Access Bank</p>
              </button>
              <button
                onClick={() => handleSimulateQRScan('merchant')}
                className="p-2.5 rounded-xl bg-[#1c2028] hover:bg-[#262a33] border border-[#464554]/30 text-left transition-all group"
                type="button"
              >
                <p className="text-xs font-bold text-[#dfe2ee] group-hover:text-[#4edea3]">
                  SuperMart POS QR
                </p>
                <p className="text-[10px] text-[#908fa0]">₦8,200 • GTBank</p>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSimulateOCRScan('zenith')}
                className="p-2.5 rounded-xl bg-[#1c2028] hover:bg-[#262a33] border border-[#464554]/30 text-left transition-all group"
                type="button"
              >
                <p className="text-xs font-bold text-[#dfe2ee] group-hover:text-[#4edea3]">
                  Zenith Bank Slip
                </p>
                <p className="text-[10px] text-[#908fa0]">Emeka Nwosu • ₦25k</p>
              </button>
              <button
                onClick={() => handleSimulateOCRScan('gtbank')}
                className="p-2.5 rounded-xl bg-[#1c2028] hover:bg-[#262a33] border border-[#464554]/30 text-left transition-all group"
                type="button"
              >
                <p className="text-xs font-bold text-[#dfe2ee] group-hover:text-[#c0c1ff]">
                  GTBank Invoice
                </p>
                <p className="text-[10px] text-[#908fa0]">Amina Bello • ₦50k</p>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
