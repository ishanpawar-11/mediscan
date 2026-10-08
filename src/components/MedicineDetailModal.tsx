import React, { useState } from 'react';
import { MedicineScanResult } from '../types';
import { 
  X, 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  VolumeX, 
  Printer, 
  Info,
  FileText,
  ShieldCheck,
  Building2,
  Tag,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface MedicineDetailModalProps {
  scan: MedicineScanResult | null;
  onClose: () => void;
}

export const MedicineDetailModal: React.FC<MedicineDetailModalProps> = ({
  scan,
  onClose,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showRawOcr, setShowRawOcr] = useState(false);

  if (!scan) return null;

  const speakMedicineInfo = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const speechText = `Medicine: ${scan.medicineName}. Strength: ${scan.strength || 'not specified'}. Expiry status: ${scan.statusMessage}. Used for: ${scan.purpose.join(', ')}. Dosage guidance: ${scan.dosageGuidance}. Storage: ${scan.storageInstructions}.`;

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 0.92;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl my-8 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden text-slate-900 space-y-4">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              scan.status === 'EXPIRED'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : scan.status === 'EXPIRING_SOON'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{scan.medicineName}</h2>
                {scan.strength && (
                  <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                    {scan.strength}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Scanned on {new Date(scan.scannedAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
              title="Print Summary"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">

          {/* Expiry Status Alert Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            scan.status === 'EXPIRED'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : scan.status === 'EXPIRING_SOON'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            {scan.status === 'EXPIRED' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : scan.status === 'EXPIRING_SOON' ? (
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold block text-sm">{scan.statusMessage}</span>
              <p className="text-xs opacity-90 mt-0.5">
                {scan.status === 'EXPIRED'
                  ? 'Expired chemical compounds can lose effectiveness or form toxic byproducts. Do not consume.'
                  : 'Check date against current dosage regimen.'}
              </p>
            </div>
          </div>

          {/* Verification Checks (if present) */}
          {scan.verificationChecks && scan.verificationChecks.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Optical & Pharmaceutical Consistency Audit
              </h4>
              <div className="space-y-1.5">
                {scan.verificationChecks.map((chk, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px]">
                    <span className={`px-1.5 py-0.2 rounded font-bold uppercase shrink-0 text-[9px] ${
                      chk.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : chk.status === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {chk.status}
                    </span>
                    <span className="text-slate-700">
                      <strong>{chk.label}:</strong> {chk.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Details Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Generic Formula</span>
              <strong className="text-slate-900 truncate block text-xs mt-0.5">{scan.genericName || 'N/A'}</strong>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Batch / Lot Code</span>
              <strong className="text-slate-800 font-mono block text-xs mt-0.5">{scan.batchNumber}</strong>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Mfg Date</span>
              <strong className="text-slate-800 block text-xs mt-0.5">{scan.mfgDate}</strong>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Expiry Date</span>
              <strong className={`block text-xs mt-0.5 ${scan.status === 'EXPIRED' ? 'text-rose-700 font-bold' : 'text-slate-900'}`}>
                {scan.expiryDate}
              </strong>
            </div>
          </div>

          {/* Manufacturer & MRP */}
          {(scan.manufacturer || scan.mrp) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {scan.manufacturer && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Manufacturer</span>
                    <strong className="text-slate-800 block text-xs">{scan.manufacturer}</strong>
                  </div>
                </div>
              )}
              {scan.mrp && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Printed MRP</span>
                    <strong className="text-slate-800 block text-xs">{scan.mrp}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Plain Language Clinical Overview */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              Clinical Summary & Purpose
            </h4>
            <p className="text-slate-600 leading-relaxed text-xs">
              {scan.simpleExplanation}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {scan.purpose.map((p, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-white text-slate-700 border border-slate-200">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Dosage & Usage */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <h4 className="text-xs font-semibold text-slate-800">Dosage Guidance</h4>
            <p className="text-slate-600 leading-relaxed text-xs">{scan.dosageGuidance}</p>
          </div>

          {/* Side Effects & Storage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-800">Common Side Effects</h4>
              <ul className="text-slate-600 space-y-1 list-disc list-inside text-xs">
                {scan.sideEffects.map((se, idx) => (
                  <li key={idx}>{se}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-800">Storage & Precautions</h4>
              <p className="text-slate-600 text-xs">{scan.storageInstructions}</p>
              <ul className="text-slate-600 space-y-1 list-disc list-inside text-xs pt-1">
                {scan.precautions.slice(0, 2).map((pc, idx) => (
                  <li key={idx}>{pc}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Collapsible Verbatim Raw OCR Text */}
          {scan.ocrRawText && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <button
                onClick={() => setShowRawOcr(!showRawOcr)}
                className="w-full p-3 flex items-center justify-between text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Verbatim OCR Raw Text ({scan.ocrRawText.length} chars)
                </span>
                {showRawOcr ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {showRawOcr && (
                <div className="p-3 bg-white border-t border-slate-200 text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                  {scan.ocrRawText}
                </div>
              )}
            </div>
          )}

          {/* Regulatory Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-100 text-slate-500 text-[11px] leading-relaxed">
            <span className="font-semibold text-slate-700">Disclaimer: </span>
            {scan.disclaimer}
          </div>

        </div>

        {/* Modal Footer Action Buttons */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={speakMedicineInfo}
            className={`w-full sm:w-auto px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isSpeaking
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isSpeaking ? 'Stop Audio' : 'Audio Readout'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
