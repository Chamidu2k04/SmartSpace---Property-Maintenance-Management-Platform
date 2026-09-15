import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Upload, AlertCircle, QrCode, ArrowRight } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrScannerModal({ isOpen, onClose, onScan }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'file' | 'manual'
  const [scannerError, setScannerError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const scannerContainerId = 'smartspace-qr-reader';

  // Start Camera Scanner
  const startCamera = async () => {
    setScannerError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          stopCamera();
          onScan(decodedText);
          onClose();
        },
        () => {
          // Frame failure callback, ignore to prevent console flood
        }
      );
      setIsScanning(true);
    } catch (err) {
      setIsScanning(false);
      setScannerError(
        err?.message || 'Unable to access camera. Please check browser permissions or upload an image instead.'
      );
    }
  };

  // Stop Camera Scanner
  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping QR scanner:', err);
      }
    }
    setIsScanning(false);
  };

  // Lifecycle: start camera when camera tab is active and modal is open
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      // Allow DOM node to mount
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  // Handle Image File Upload Decoding
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerError(null);
    try {
      const scanner = html5QrCodeRef.current || new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = scanner;

      const decodedText = await scanner.scanFile(file, true);
      if (decodedText) {
        onScan(decodedText);
        onClose();
      } else {
        setScannerError('Could not decode any QR code from the uploaded image.');
      }
    } catch (err) {
      setScannerError('Failed to read QR code from this image. Please try a clearer picture.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Manual Part ID Lookup
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      setScannerError('Please enter a valid Part ID.');
      return;
    }
    onScan(manualInput.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#1E3A8A]">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Scan Part QR Code</h3>
              <p className="text-xs text-gray-500">Scan badge or upload image to filter inventory</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/30 p-1.5 gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setScannerError(null);
              setActiveTab('camera');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white text-[#1E3A8A] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Webcam</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setScannerError(null);
              setActiveTab('file');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-white text-[#1E3A8A] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setScannerError(null);
              setActiveTab('manual');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-[#1E3A8A] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Enter UUID</span>
          </button>
        </div>

        {/* Error Notification */}
        {scannerError && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{scannerError}</span>
          </div>
        )}

        {/* Tab 1: Live Webcam Viewfinder */}
        {activeTab === 'camera' && (
          <div className="p-5 flex flex-col items-center">
            <div className="w-full relative rounded-xl overflow-hidden bg-black/5 aspect-square max-w-[280px] flex items-center justify-center border border-gray-200">
              <div id={scannerContainerId} className="w-full h-full" />
              {!isScanning && !scannerError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-[#1E3A8A] border-t-transparent animate-spin" />
                  <span className="text-xs text-gray-500">Initializing camera...</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Align the part QR code inside the viewfinder box to auto-scan.
            </p>
          </div>
        )}

        {/* Tab 2: Upload Image File */}
        {activeTab === 'file' && (
          <div className="p-6 flex flex-col items-center">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 hover:border-[#1E3A8A] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-gray-50/50 hover:bg-blue-50/20 transition-all text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-800">Click to upload QR Image</span>
                <p className="text-xs text-gray-400 mt-0.5">Supports PNG, JPG, JPEG screenshots or photo</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Manual UUID Lookup */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Part UUID / Code
              </label>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#1E3A8A] focus:outline-none"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">
                Paste or type the part identifier printed on the inventory label.
              </p>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-medium text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Filter Inventory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
