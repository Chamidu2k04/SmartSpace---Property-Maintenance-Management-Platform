import React, { useRef } from 'react';
import { X, Download, Printer, Copy, Check, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QrCodeModal({ isOpen, item, onClose }) {
  const canvasContainerRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !item) return null;

  // QR Code payload: standard part UUID
  const qrPayload = item.id || '';

  // Download QR code as PNG image
  const handleDownload = () => {
    if (!canvasContainerRef.current) return;
    const canvas = canvasContainerRef.current.querySelector('canvas');
    if (!canvas) return;

    const imageUri = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    const safeFileName = (item.itemName || 'part').toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadLink.href = imageUri;
    downloadLink.download = `${safeFileName}_qr_${item.id?.substring(0, 8) || 'code'}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Print QR badge
  const handlePrint = () => {
    window.print();
  };

  // Copy part ID
  const handleCopyId = () => {
    if (!qrPayload) return;
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#1E3A8A]">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Part QR Code</h3>
              <p className="text-xs text-gray-500">Scan badge for inventory lookup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Display Card */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* QR Canvas Container */}
          <div
            ref={canvasContainerRef}
            className="p-4 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-xs flex items-center justify-center mb-4"
          >
            <QRCodeCanvas
              value={qrPayload}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Part Name & Metadata */}
          <h4 className="text-base font-bold text-gray-900 line-clamp-1 mb-1">{item.itemName}</h4>
          <p className="text-xs text-gray-500 mb-3">
            {item.supplierName ? `Supplier: ${item.supplierName}` : 'Inventory Stock Item'}
          </p>

          {/* Part ID Chip with Copy Button */}
          <div className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 font-mono">
            <span className="truncate" title={qrPayload}>ID: {qrPayload}</span>
            <button
              onClick={handleCopyId}
              className="p-1 text-gray-500 hover:text-[#1E3A8A] rounded hover:bg-white transition-colors cursor-pointer shrink-0"
              title="Copy Part ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" />
            <span>Print Badge</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
