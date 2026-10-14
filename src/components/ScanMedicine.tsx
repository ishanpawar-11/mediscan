import React, { useState, useRef, useEffect } from 'react';
import { MedicineScanResult } from '../types';
import { 
  processImageForOCR, 
  DEFAULT_PREPROCESSING, 
  PreprocessingOptions, 
  calculateSharpness,
  PackagingRegion,
  extractPackagingRegions
} from '../utils/imagePreprocessing';
import { 
  Camera, 
  CameraOff,
  Upload, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  SlidersHorizontal, 
  Eye,
  RotateCcw,
  RotateCw,
  Edit3,
  Save,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Building2,
  Tag,
  FileText,
  Copy,
  CheckCheck,
  Crop,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ScanLine,
  Maximize2
} from 'lucide-react';

interface FrameItem {
  id: string;
  originalDataUrl: string;
  enhancedDataUrl: string;
  sharpnessScore: number;
  label: string;
  isBest?: boolean;
}

interface ScanMedicineProps {
  onScanComplete: (result: MedicineScanResult) => void;
  recentScans?: MedicineScanResult[];
  onSelectScan?: (result: MedicineScanResult) => void;
}

export const ScanMedicine: React.FC<ScanMedicineProps> = ({
  onScanComplete,
  recentScans = [],
  onSelectScan,
}) => {
  // Scanning input mode
  const [mode, setMode] = useState<'upload' | 'webcam'>('upload');
  
  // Multi-frame storage
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [isCapturingBurst, setIsCapturingBurst] = useState(false);
  const [burstCount, setBurstCount] = useState<number>(0);

  // Pre-processing settings & rotation
  const [preprocessing, setPreprocessing] = useState<PreprocessingOptions>(DEFAULT_PREPROCESSING);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);
  const [showRawOcrAccordion, setShowRawOcrAccordion] = useState(false);
  const [copiedOcrText, setCopiedOcrText] = useState(false);

  // Region-Based OCR state (Crimp edges, rotated margins, center body)
  const [detectedRegions, setDetectedRegions] = useState<PackagingRegion[]>([]);
  const [activeRegionId, setActiveRegionId] = useState<string>('full');

  // Live video sharpness meter
  const [liveSharpness, setLiveSharpness] = useState<number>(82);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState<boolean>(false);

  // Loading & Scan Result State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [scanResult, setScanResult] = useState<MedicineScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Manual Edit & Verification State
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    medicineName: '',
    genericName: '',
    strength: '',
    manufacturer: '',
    mrp: '',
    mfgDate: '',
    expiryDate: '',
    batchNumber: '',
    dosageInstructions: '',
    dosageGuidance: '',
    simpleExplanation: '',
    storageInstructions: '',
  });

  // Local fallback scans if recentScans prop is empty
  const [fallbackScans, setFallbackScans] = useState<MedicineScanResult[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addFrameInputRef = useRef<HTMLInputElement | null>(null);
  const liveCheckIntervalRef = useRef<number | null>(null);

  // Fetch scans list if not provided via props
  useEffect(() => {
    if (recentScans.length === 0) {
      fetch('/api/scans')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setFallbackScans(data))
        .catch(() => {});
    }
  }, [recentScans.length]);

  // Extract packaging regions (crimp edges, margins, formulation body) for region-based OCR
  useEffect(() => {
    const current = frames[activeFrameIndex];
    if (current?.enhancedDataUrl) {
      extractPackagingRegions(current.enhancedDataUrl)
        .then((regs) => {
          setDetectedRegions(regs);
          setActiveRegionId('full');
        })
        .catch(() => {
          setDetectedRegions([]);
        });
    } else {
      setDetectedRegions([]);
      setActiveRegionId('full');
    }
  }, [frames, activeFrameIndex]);

  const displayedScans = recentScans.length > 0 ? recentScans : fallbackScans;

  // Webcam stream management
  const startWebcam = async () => {
    try {
      setErrorMsg(null);
      setCameraPermissionDenied(false);

      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraPermissionDenied(true);
        setErrorMsg('Camera access is not supported in this browser environment. Please upload packaging photos or select a reference strip.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Periodically calculate live focus/sharpness
      if (liveCheckIntervalRef.current) clearInterval(liveCheckIntervalRef.current);
      liveCheckIntervalRef.current = window.setInterval(() => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 320;
          tempCanvas.height = 240;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(videoRef.current, 0, 0, 320, 240);
            const score = calculateSharpness(tempCtx, 320, 240);
            setLiveSharpness(score);
          }
        } catch {
          // ignore stream interval exceptions
        }
      }, 700);

    } catch (err: any) {
      console.warn('Webcam access notice:', err?.name || err?.message);
      setCameraPermissionDenied(true);
      setErrorMsg('Camera access was denied or is blocked in this browser frame. Switch to Photo Upload or test instantly with a reference medicine strip below.');
    }
  };

  const stopWebcam = () => {
    if (liveCheckIntervalRef.current) {
      clearInterval(liveCheckIntervalRef.current);
      liveCheckIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (mode === 'webcam') {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [mode]);

  // Helper to re-process an existing frame with updated pre-processing options
  const reprocessFrame = async (frame: FrameItem, options: PreprocessingOptions): Promise<FrameItem> => {
    const res = await processImageForOCR(frame.originalDataUrl, { ...options, rotation: rotationAngle });
    return {
      ...frame,
      enhancedDataUrl: res.enhancedDataUrl,
      sharpnessScore: res.sharpnessScore,
    };
  };

  // Re-process all frames when user changes pre-processing (contrast/sharpening/glare/rotation/crop)
  useEffect(() => {
    if (frames.length === 0) return;
    let isCancelled = false;

    Promise.all(frames.map((f) => reprocessFrame(f, preprocessing))).then((updated) => {
      if (!isCancelled) {
        setFrames(updated);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [
    preprocessing.contrast, 
    preprocessing.sharpen, 
    preprocessing.brightness, 
    preprocessing.antiGlare, 
    preprocessing.autoCrop,
    rotationAngle
  ]);

  // Rotation Handlers
  const handleRotate = (direction: 'cw' | 'ccw') => {
    const delta = direction === 'cw' ? 90 : -90;
    const nextAngle = (rotationAngle + delta + 360) % 360;
    setRotationAngle(nextAngle);
    setPreprocessing(prev => ({ ...prev, rotation: nextAngle }));
  };

  // Preset Preprocessing Modes
  const applyPresetMode = (mode: 'balanced' | 'antiglare' | 'crimp' | 'highcontrast') => {
    switch (mode) {
      case 'balanced':
        setPreprocessing({
          ...preprocessing,
          contrast: 130,
          sharpen: 1,
          brightness: 0,
          antiGlare: true,
          autoCrop: false,
        });
        break;
      case 'antiglare':
        setPreprocessing({
          ...preprocessing,
          contrast: 145,
          sharpen: 1,
          brightness: -5,
          antiGlare: true,
          autoCrop: false,
        });
        break;
      case 'crimp':
        setPreprocessing({
          ...preprocessing,
          contrast: 160,
          sharpen: 2,
          brightness: 0,
          antiGlare: true,
          autoCrop: false,
        });
        break;
      case 'highcontrast':
        setPreprocessing({
          ...preprocessing,
          contrast: 175,
          sharpen: 2,
          brightness: 10,
          antiGlare: false,
          autoCrop: true,
        });
        break;
    }
  };

  // Single Frame Webcam Capture
  const captureSingleWebcamFrame = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.86);

    const { enhancedDataUrl, sharpnessScore } = await processImageForOCR(rawDataUrl, {
      ...preprocessing,
      rotation: rotationAngle
    });

    const newFrame: FrameItem = {
      id: 'frame-' + Date.now(),
      originalDataUrl: rawDataUrl,
      enhancedDataUrl,
      sharpnessScore,
      label: `Frame ${frames.length + 1}`,
      isBest: true,
    };

    setFrames((prev) => [...prev, newFrame]);
    setActiveFrameIndex(frames.length);
    stopWebcam();
    setMode('upload');
    setErrorMsg(null);
  };

  // Multi-Frame Burst Capture (3 rapid frames across 600ms, measures sharpness and auto-picks best)
  const captureBurstWebcamFrames = async () => {
    if (!videoRef.current || isCapturingBurst) return;
    setIsCapturingBurst(true);
    setErrorMsg(null);

    const video = videoRef.current;
    const captured: FrameItem[] = [];

    for (let i = 0; i < 3; i++) {
      setBurstCount(i + 1);
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const raw = canvas.toDataURL('image/jpeg', 0.86);
        const { enhancedDataUrl, sharpnessScore } = await processImageForOCR(raw, {
          ...preprocessing,
          rotation: rotationAngle
        });
        captured.push({
          id: `burst-${Date.now()}-${i}`,
          originalDataUrl: raw,
          enhancedDataUrl,
          sharpnessScore,
          label: i === 0 ? 'Frame 1 (Front)' : i === 1 ? 'Frame 2 (Crimp)' : 'Frame 3 (Detail)',
        });
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    // Determine the highest clarity frame
    let maxSharpness = -1;
    let bestIndex = 0;
    captured.forEach((frame, idx) => {
      if (frame.sharpnessScore > maxSharpness) {
        maxSharpness = frame.sharpnessScore;
        bestIndex = idx;
      }
    });

    captured.forEach((f, idx) => {
      f.isBest = idx === bestIndex;
    });

    setFrames(captured);
    setActiveFrameIndex(bestIndex);
    setIsCapturingBurst(false);
    setBurstCount(0);
    stopWebcam();
    setMode('upload');
  };

  // File Upload Handler (Supports multiple files or single file)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isAppend = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg(null);
    const newFrames: FrameItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const rawDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.readAsDataURL(file);
      });

      const { enhancedDataUrl, sharpnessScore } = await processImageForOCR(rawDataUrl, {
        ...preprocessing,
        rotation: rotationAngle
      });

      newFrames.push({
        id: `upload-${Date.now()}-${i}`,
        originalDataUrl: rawDataUrl,
        enhancedDataUrl,
        sharpnessScore,
        label: isAppend
          ? `Angle ${frames.length + i + 1}`
          : i === 0
          ? 'Front Face'
          : `Frame ${i + 1}`,
      });
    }

    if (newFrames.length === 0) {
      setErrorMsg('Please upload valid image files (PNG, JPG, WEBP).');
      return;
    }

    if (isAppend) {
      setFrames((prev) => [...prev, ...newFrames]);
      setActiveFrameIndex(frames.length);
    } else {
      let maxScore = -1;
      let bestIdx = 0;
      newFrames.forEach((f, idx) => {
        if (f.sharpnessScore > maxScore) {
          maxScore = f.sharpnessScore;
          bestIdx = idx;
        }
      });
      newFrames.forEach((f, idx) => {
        f.isBest = idx === bestIdx;
      });
      setFrames(newFrames);
      setActiveFrameIndex(bestIdx);
      setScanResult(null);
      setIsEditing(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addFrameInputRef.current) addFrameInputRef.current.value = '';
  };

  // Delete Frame
  const handleDeleteFrame = (index: number) => {
    const updated = frames.filter((_, i) => i !== index);
    setFrames(updated);
    if (activeFrameIndex >= updated.length) {
      setActiveFrameIndex(Math.max(0, updated.length - 1));
    }
  };

  // Diverse Preset Sample Medicine Strips for instant testing
  const loadPreset = async (type: 'dolo' | 'amox' | 'augmentin' | 'pantocid' | 'telma') => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 560;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Metallic blister foil background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 900, 560);

    // Blister border
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 860, 520);

    // Top Crimp Sealed Foil Band (Where Batch, MFG, and EXP are stamped)
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(20, 20, 860, 90);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 860, 90);

    // Embossed foil crimp texture
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 35; i < 860; i += 18) {
      ctx.beginPath();
      ctx.moveTo(i, 22);
      ctx.lineTo(i, 108);
      ctx.stroke();
    }

    // Bottom Crimp Sealed Foil Band (Where MRP & batch code are stamped)
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(20, 450, 860, 90);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(20, 450, 860, 90);
    for (let i = 35; i < 860; i += 18) {
      ctx.beginPath();
      ctx.moveTo(i, 452);
      ctx.lineTo(i, 538);
      ctx.stroke();
    }

    // Left vertical border margin line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(90, 110);
    ctx.lineTo(90, 450);
    ctx.stroke();

    if (type === 'dolo') {
      // Top Crimp Stamped Info (Dot-Matrix Inkjet imprint)
      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('B.No. DL-8902X   MFD: 01/2024   EXP: 07/2025', 60, 75);

      // Center Body
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('DOLO 650', 120, 180);
      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Paracetamol Tablets IP 650 mg', 120, 225);
      ctx.font = '16px sans-serif';
      ctx.fillText('Mfd by: Micro Labs Limited, Verna, Goa', 120, 265);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText('Dosage: 1 tablet after food as directed by physician', 120, 310);
      ctx.fillText('Storage: Store in a cool, dry place. Protect from direct light.', 120, 345);

      // Bottom Crimp Stamped Info
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('M.R.P. Rs. 34.15 per 15 Tabs (Incl. of all taxes)', 60, 505);

      // Left Vertical Margin Stamping (Rotated 90°)
      ctx.save();
      ctx.translate(55, 380);
      ctx.rotate(-Math.PI / 2);
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('BATCH: DL-8902X | EXP: 07/2025 | MFD: 01/2024', 0, 0);
      ctx.restore();
    } else if (type === 'amox') {
      // Top Crimp Stamped Info
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('BATCH: AMX-4412   MFG DATE: 05-2025   EXP DATE: 11-2027', 60, 75);

      // Center Body
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('AMOXICILLIN 500 MG', 120, 180);
      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Amoxicillin Trihydrate Capsules IP 500mg', 120, 225);
      ctx.font = '16px sans-serif';
      ctx.fillText('Mfd by: Cipla Ltd, Mumbai, Maharashtra', 120, 265);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText('Dosage: 1 capsule every 8 hours with full glass of water', 120, 310);
      ctx.fillText('Storage: Store below 25°C in a tightly closed container.', 120, 345);

      // Bottom Crimp Stamped Info
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('M.R.P. ₹ 89.50 per 10 Caps (Incl. of all taxes)', 60, 505);

      // Left Vertical Margin Stamping
      ctx.save();
      ctx.translate(55, 380);
      ctx.rotate(-Math.PI / 2);
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#047857';
      ctx.fillText('AMX-4412 | MFD: 05/2025 | EXP: 11/2027', 0, 0);
      ctx.restore();
    } else if (type === 'augmentin') {
      // Top Crimp Stamped Info
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('Lot No: AUG-991B   Mfg. Dt: 09/24   Exp. Dt: 09/26', 60, 75);

      // Center Body
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText('AUGMENTIN 625 DUO', 120, 180);
      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Amoxicillin & Potassium Clavulanate Tablets IP 625mg', 120, 225);
      ctx.font = '16px sans-serif';
      ctx.fillText('GlaxoSmithKline Pharmaceuticals Ltd', 120, 265);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText('Dosage: 1 tablet twice daily at start of a meal', 120, 310);
      ctx.fillText('Storage: Store in original desiccant pack protected from moisture.', 120, 345);

      // Bottom Crimp Stamped Info
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('M.R.P. Rs. 204.00 per 10 Tabs (Incl. of all taxes)', 60, 505);

      // Left Vertical Margin Stamping
      ctx.save();
      ctx.translate(55, 380);
      ctx.rotate(-Math.PI / 2);
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#b45309';
      ctx.fillText('AUG-991B | EXP: 09/2026 | MFG: 09/2024', 0, 0);
      ctx.restore();
    } else if (type === 'pantocid') {
      // Top Crimp Stamped Info
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('B.NO. PAN-8803   MANF: 03/2025   EXPIRY: 02/2028', 60, 75);

      // Center Body
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('PANTOCID 40', 120, 180);
      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Pantoprazole Gastro-resistant Tablets IP 40mg', 120, 225);
      ctx.font = '16px sans-serif';
      ctx.fillText('Sun Pharmaceutical Industries Ltd, Halol, Gujarat', 120, 265);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText('Dosage: 1 tablet once daily 1 hour before breakfast', 120, 310);
      ctx.fillText('Storage: Swallow whole. Do not chew, crush, or split.', 120, 345);

      // Bottom Crimp Stamped Info
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('M.R.P. Rs. 155.00 per 15 Tabs (Incl. of all taxes)', 60, 505);

      // Left Vertical Margin Stamping
      ctx.save();
      ctx.translate(55, 380);
      ctx.rotate(-Math.PI / 2);
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#6366f1';
      ctx.fillText('PAN-8803 | EXPIRY: 02/2028 | MANF: 03/2025', 0, 0);
      ctx.restore();
    } else {
      // Top Crimp Stamped Info
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('Batch No: TLM-552A   MFD: 11/2024   EXP: 10/2027', 60, 75);

      // Center Body
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('TELMA 40', 120, 180);
      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Telmisartan Tablets IP 40 mg', 120, 225);
      ctx.font = '16px sans-serif';
      ctx.fillText('Glenmark Pharmaceuticals Ltd, Nashik', 120, 265);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText('Dosage: 1 tablet daily with or without food', 120, 310);
      ctx.fillText('Storage: Store in original blister pack away from heat.', 120, 345);

      // Bottom Crimp Stamped Info
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('M.R.P. ₹ 142.00 per 30 Tabs (Incl. of all taxes)', 60, 505);

      // Left Vertical Margin Stamping
      ctx.save();
      ctx.translate(55, 380);
      ctx.rotate(-Math.PI / 2);
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#dc2626';
      ctx.fillText('TLM-552A | EXP: 10/2027 | MFD: 11/2024', 0, 0);
      ctx.restore();
    }

    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const { enhancedDataUrl, sharpnessScore } = await processImageForOCR(rawDataUrl, {
      ...preprocessing,
      rotation: 0
    });

    setRotationAngle(0);
    const newFrames = [
      {
        id: 'preset-' + type,
        originalDataUrl: rawDataUrl,
        enhancedDataUrl,
        sharpnessScore,
        label: `${type.toUpperCase()} Reference Strip`,
        isBest: true,
      },
    ];
    setFrames(newFrames);
    setActiveFrameIndex(0);
    setScanResult(null);
    setErrorMsg(null);
    setIsEditing(false);

    try {
      const regs = await extractPackagingRegions(enhancedDataUrl);
      setDetectedRegions(regs);
      setActiveRegionId('full');
    } catch {
      setDetectedRegions([]);
    }
  };

  // Run Optical Scan Pipeline
  const runScanPipeline = async () => {
    if (frames.length === 0) return;

    try {
      setIsLoading(true);
      setErrorMsg(null);
      setIsEditing(false);

      // Ensure regions are extracted for active frame
      let regionsToSend = detectedRegions;
      if (regionsToSend.length === 0 && frames[activeFrameIndex]?.enhancedDataUrl) {
        try {
          regionsToSend = await extractPackagingRegions(frames[activeFrameIndex].enhancedDataUrl);
          setDetectedRegions(regionsToSend);
        } catch {
          regionsToSend = [];
        }
      }

      setLoadingStep('1. Slicing packaging into high-resolution crimp edges & rotated vertical margins...');
      await new Promise((r) => setTimeout(r, 200));

      setLoadingStep(
        regionsToSend.length > 0
          ? `2. Running region-based OCR across ${regionsToSend.length} packaging zones (crimps, margins & body)...`
          : '2. Running multi-pass OCR on pharmaceutical typography...'
      );
      await new Promise((r) => setTimeout(r, 260));

      setLoadingStep('3. Detecting small printed fields: MFG date, EXP date, Batch No, and MRP...');
      await new Promise((r) => setTimeout(r, 240));

      setLoadingStep('4. Performing timeline consistency verification & catalog cross-referencing...');

      // Prepare payload: send primary high-resolution frame + zoomed crimp & margin region crops
      const enhancedFramesPayload = frames.map((f) => f.enhancedDataUrl);
      const primaryFrame = enhancedFramesPayload[activeFrameIndex] || enhancedFramesPayload[0];

      // Check if active frame was loaded from a preset strip
      const activeFrame = frames[activeFrameIndex] || frames[0];
      const detectedPreset = activeFrame?.id?.startsWith('preset-')
        ? activeFrame.id.replace('preset-', '')
        : undefined;

      // Select top focused regions (crimps and margins) to maximize OCR accuracy without overloading payload
      const regionsToSendPayload = regionsToSend.slice(0, 3).map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        dataUrl: r.dataUrl,
      }));

      const response = await fetch('/api/scan-medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: primaryFrame,
          presetType: detectedPreset,
          regions: regionsToSendPayload,
          processingMethodUsed: `Region-Based OCR (${regionsToSend.length} zones) + Crimp Magnification`,
        }),
      });

      // Safe Response Parsing: Inspect Content-Type and read raw body text before parsing
      const contentType = response.headers.get('content-type') || '';
      const rawBody = await response.text().catch(() => '');
      let parsedData: any = null;

      if (contentType.includes('application/json') && rawBody) {
        try {
          parsedData = JSON.parse(rawBody);
        } catch {
          parsedData = null;
        }
      }

      if (!response.ok || !parsedData) {
        let errMessage = 'Failed to analyze packaging. Please verify image clarity and retry.';
        if (parsedData && (parsedData.details || parsedData.error)) {
          errMessage = parsedData.details || parsedData.error;
        } else if (response.status === 413 || rawBody.toLowerCase().includes('too large')) {
          errMessage = 'Image size too large. Please use a closer or single photo under 25MB.';
        } else if (response.status === 504 || response.status === 503) {
          errMessage = 'Recognition service timed out. Please retry with a well-lit photo of the strip.';
        } else if (response.status === 404) {
          errMessage = 'Scan endpoint was temporarily unreachable. Please retry.';
        } else if (!contentType.includes('application/json')) {
          errMessage = `Server communication advisory (HTTP ${response.status}). Please try scanning again.`;
        }
        throw new Error(errMessage);
      }

      const result: MedicineScanResult = parsedData;
      setScanResult(result);

      // Pre-fill edit form
      setEditForm({
        medicineName: result.medicineName,
        genericName: result.genericName || '',
        strength: result.strength || '',
        manufacturer: result.manufacturer || '',
        mrp: result.mrp || '',
        mfgDate: result.mfgDate || '',
        expiryDate: result.expiryDate || '',
        batchNumber: result.batchNumber || '',
        dosageInstructions: result.dosageInstructions || '',
        dosageGuidance: result.dosageGuidance || '',
        simpleExplanation: result.simpleExplanation || '',
        storageInstructions: result.storageInstructions || '',
      });

      onScanComplete(result);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMsg(err.message || 'Error processing medicine scan. Please try a well-lit angle or enter details manually.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Save manual modifications & verify
  const handleSaveEdit = async () => {
    if (!scanResult) return;
    try {
      setIsSavingEdit(true);
      setEditSuccessMsg(null);

      const response = await fetch(`/api/scans/${scanResult.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const contentType = response.headers.get('content-type') || '';
      const rawBody = await response.text().catch(() => '');
      let updatedData: any = null;
      if (contentType.includes('application/json') && rawBody) {
        try {
          updatedData = JSON.parse(rawBody);
        } catch {
          updatedData = null;
        }
      }

      if (!response.ok || !updatedData) {
        throw new Error(updatedData?.error || 'Failed to update verification details.');
      }

      const updated: MedicineScanResult = updatedData;
      setScanResult(updated);
      onScanComplete(updated);
      setEditSuccessMsg('Details verified & saved.');
      setTimeout(() => {
        setEditSuccessMsg(null);
        setIsEditing(false);
      }, 1200);
    } catch (err: any) {
      console.error('Error saving scan update:', err);
      setErrorMsg(err.message || 'Failed to save modifications.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Text-to-speech audio pronunciation
  const speakMedicineInfo = () => {
    if (!scanResult) return;
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const speechText = `Medicine: ${scanResult.medicineName}. Strength: ${scanResult.strength || 'not specified'}. Status: ${scanResult.statusMessage}. Purpose: ${scanResult.purpose.join(', ')}. Dosage: ${scanResult.dosageGuidance}. Storage: ${scanResult.storageInstructions}.`;

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 0.92;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Copy raw OCR text
  const copyRawOcrText = () => {
    if (!scanResult?.ocrRawText) return;
    navigator.clipboard.writeText(scanResult.ocrRawText);
    setCopiedOcrText(true);
    setTimeout(() => setCopiedOcrText(false), 2000);
  };

  // Active frame data & region preview
  const currentFrame = frames[activeFrameIndex] || frames[0];
  const activeRegion = detectedRegions.find((r) => r.id === activeRegionId);
  const displayImageUrl = activeRegionId !== 'full' && activeRegion
    ? activeRegion.dataUrl
    : showOriginalComparison && currentFrame
    ? currentFrame.originalDataUrl
    : currentFrame?.enhancedDataUrl;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* TOP HEADER: Clean clinical identity */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Camera className="w-6 h-6 text-slate-900" />
            Scan Medicine & Expiry Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Universal medicine strip scanning pipeline with anti-glare, auto-crop, multi-frame burst and clinical validation.
          </p>
        </div>

        {/* Input Switcher: Camera / Upload */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              mode === 'upload'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Photo
          </button>
          <button
            onClick={() => setMode('webcam')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              mode === 'webcam'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Camera
          </button>
        </div>
      </div>

      {/* SECTION 1: SCAN STUDIO (HIGHEST HIERARCHY) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">

        {/* Error notification banner */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Scan Reading Advisory</strong>
                <p className="text-rose-800 text-[11px] leading-relaxed mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-rose-200/60 text-[11px] text-rose-700">
              <span>Tip: Try turning on <strong>Foil Anti-Glare</strong> or rotating the strip 90°.</span>
              {frames.length > 0 && (
                <button
                  onClick={runScanPipeline}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded bg-rose-900 text-white font-medium text-[11px] hover:bg-rose-800 transition-colors cursor-pointer"
                >
                  Retry Scan
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODE: LIVE CAMERA VIEW */}
        {mode === 'webcam' && (
          <div className="space-y-4">
            {cameraPermissionDenied ? (
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-8 text-center flex flex-col items-center justify-center space-y-4 min-h-[340px]">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <CameraOff className="w-7 h-7 text-amber-400" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-sm font-semibold text-white">Camera Access Not Available</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Camera permissions were denied or camera hardware is restricted in this window. You can easily upload medicine strip photos or test with standard reference strips below.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setMode('upload');
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 rounded-lg bg-white text-slate-950 text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Medicine Photo
                  </button>
                  <button
                    onClick={() => {
                      setMode('upload');
                      loadPreset('dolo');
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium hover:bg-slate-750 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Try Sample Strip (Dolo 650)
                  </button>
                  <button
                    onClick={() => {
                      setCameraPermissionDenied(false);
                      startWebcam();
                    }}
                    className="px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                  >
                    Retry Camera
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[360px]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[480px] object-cover rounded-xl"
                />

                {/* Viewfinder Target Framing with Packaging Alignment Guides */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  <div className="w-full max-w-lg h-56 sm:h-64 border-2 border-dashed border-white/70 rounded-xl relative flex flex-col items-center justify-between p-3 backdrop-brightness-95">
                    
                    {/* Top Guide Indicator */}
                    <div className="bg-slate-900/80 text-white text-[11px] font-medium px-3 py-1 rounded-full backdrop-blur-xs border border-white/20 flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Align medicine strip horizontally or vertically</span>
                    </div>

                    {/* Horizontal Guideline for Crimp & Dot Matrix Stamp */}
                    <div className="w-4/5 border-b border-white/40 flex items-center justify-center">
                      <span className="text-[10px] text-white/80 bg-slate-900/60 px-2 rounded-full">
                        Crimp / Expiry Date Zone
                      </span>
                    </div>

                    {/* Corner Accent Guides */}
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white" />
                  </div>
                </div>

                {/* Live Focus / Sharpness Gauge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-slate-900/85 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md border border-white/20 flex items-center gap-1.5 shadow-xs">
                    <span className={`w-2 h-2 rounded-full ${liveSharpness > 80 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span>Optical Focus: <strong>{liveSharpness}%</strong></span>
                    <span className="text-slate-400 text-[10px]">({liveSharpness > 80 ? 'Sharp' : 'Hold Steady'})</span>
                  </span>
                </div>

                {/* Burst In Progress Overlay */}
                {isCapturingBurst && (
                  <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 z-20">
                    <div className="w-10 h-10 rounded-full border-3 border-white border-t-transparent animate-spin" />
                    <p className="font-semibold text-sm">Burst Sampling Frame {burstCount} of 3...</p>
                    <p className="text-xs text-slate-300">Measuring focus gradient & selecting sharpest angle</p>
                  </div>
                )}

                {/* Camera Action Buttons */}
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 px-4 z-10">
                  <button
                    onClick={captureBurstWebcamFrames}
                    disabled={isCapturingBurst}
                    className="px-4 py-2.5 rounded-xl bg-white text-slate-950 font-semibold text-xs shadow-md hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-slate-900" />
                    <span>Burst Capture (3 Shots)</span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">Auto-Best</span>
                  </button>

                  <button
                    onClick={captureSingleWebcamFrame}
                    disabled={isCapturingBurst}
                    className="px-4 py-2.5 rounded-xl bg-slate-900/90 text-white font-medium text-xs border border-white/20 hover:bg-slate-900 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Single Snapshot
                  </button>
                </div>
              </div>
            )}

            <p className="text-center text-xs text-slate-500">
              Burst capture takes 3 rapid frames across 600ms to eliminate hand shake and glare, auto-selecting the frame with highest optical clarity.
            </p>
          </div>
        )}

        {/* MODE: UPLOAD DROPZONE (When no frames yet) */}
        {mode === 'upload' && frames.length === 0 && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-10 text-center bg-slate-50/60 hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e, false)}
                accept="image/*"
                multiple
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-600 group-hover:text-slate-900 flex items-center justify-center mx-auto mb-3.5 transition-colors shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                Upload Medicine Packaging or Blister Strip Photo
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Works with any brand, strip size, font, or manufacturer. You can upload multiple angles (front brand + back foil crimp).
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <span>PNG, JPG, WEBP</span>
                <span>•</span>
                <span>Multi-Image Supported</span>
                <span>•</span>
                <span>Auto-Crop & Anti-Glare</span>
              </div>
            </div>

            {/* Test Sample Reference Strips */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Test Reference Strips (Diverse Brands & Layouts):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <button
                  onClick={() => loadPreset('dolo')}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium text-left transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                >
                  <span className="block font-semibold text-slate-900 text-xs">Dolo 650</span>
                  <span className="text-[10px] text-rose-700 font-medium">Expired (07/2025)</span>
                </button>
                <button
                  onClick={() => loadPreset('amox')}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium text-left transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                >
                  <span className="block font-semibold text-slate-900 text-xs">Amoxicillin 500</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Valid (11/2027)</span>
                </button>
                <button
                  onClick={() => loadPreset('augmentin')}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium text-left transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                >
                  <span className="block font-semibold text-slate-900 text-xs">Augmentin 625</span>
                  <span className="text-[10px] text-amber-700 font-medium">Expiring (09/2026)</span>
                </button>
                <button
                  onClick={() => loadPreset('pantocid')}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium text-left transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                >
                  <span className="block font-semibold text-slate-900 text-xs">Pantocid 40</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Valid (02/2028)</span>
                </button>
                <button
                  onClick={() => loadPreset('telma')}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium text-left transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                >
                  <span className="block font-semibold text-slate-900 text-xs">Telma 40</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Valid (10/2027)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE CAPTURE PREVIEW & MULTI-FRAME REEL */}
        {frames.length > 0 && (
          <div className="space-y-5">
            {/* Top Toolbar: Multi-Frame Reel & Add Angle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <span className="text-xs font-semibold text-slate-700 shrink-0 flex items-center gap-1.5 mr-1">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  Frames ({frames.length}):
                </span>
                {frames.map((frame, idx) => (
                  <div key={frame.id} className="relative flex items-center shrink-0">
                    <button
                      onClick={() => setActiveFrameIndex(idx)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        activeFrameIndex === idx
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{frame.label}</span>
                      {frame.isBest && (
                        <span className={`text-[10px] px-1 rounded font-bold ${
                          activeFrameIndex === idx ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          Best
                        </span>
                      )}
                      <span className={`text-[10px] font-mono ${
                        activeFrameIndex === idx ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {frame.sharpnessScore}%
                      </span>
                    </button>
                    {frames.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFrame(idx);
                        }}
                        className="ml-1 text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                        title="Remove Frame"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add Another Angle / Side */}
                <input
                  type="file"
                  ref={addFrameInputRef}
                  onChange={(e) => handleFileUpload(e, true)}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => addFrameInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 bg-white text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="Upload additional side (e.g. back foil crimp)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Angle</span>
                </button>
              </div>

              {/* Reset / Retake */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => {
                    setFrames([]);
                    setScanResult(null);
                    setErrorMsg(null);
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear & Retake
                </button>
              </div>
            </div>

            {/* Main Image Preview Display with Pre-Processing Badge */}
            <div className="relative overflow-hidden rounded-xl bg-slate-900/5 border border-slate-200 flex items-center justify-center p-3 min-h-[300px] max-h-[440px]">
              {displayImageUrl ? (
                <img
                  src={displayImageUrl}
                  alt="Medicine Packaging Frame"
                  className="max-h-[410px] w-auto max-w-full rounded-lg object-contain shadow-xs transition-transform duration-200"
                />
              ) : null}

              {/* Top overlay indicators */}
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-md border border-white/20 shadow-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {showOriginalComparison ? 'Original Camera Feed' : 'Pre-Processed (Enhanced for OCR)'}
                </span>

                {currentFrame && (
                  <span className="bg-white/90 backdrop-blur-xs text-slate-800 text-[11px] font-mono px-2 py-1 rounded-md border border-slate-200 shadow-xs">
                    Clarity: {currentFrame.sharpnessScore}%
                  </span>
                )}

                {rotationAngle !== 0 && (
                  <span className="bg-slate-800 text-white text-[11px] px-2 py-1 rounded-md shadow-xs">
                    Rotated {rotationAngle}°
                  </span>
                )}

                {activeRegionId !== 'full' && activeRegion && (
                  <span className="bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md border border-white/20 shadow-xs flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    Focused Zone: {activeRegion.name}
                  </span>
                )}
              </div>

              {/* Rotation & Comparison Floating Controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  onClick={() => handleRotate('ccw')}
                  className="p-2 rounded-lg bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200 backdrop-blur-xs transition-colors cursor-pointer"
                  title="Rotate 90° Counter-Clockwise"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRotate('cw')}
                  className="p-2 rounded-lg bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200 backdrop-blur-xs transition-colors cursor-pointer"
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowOriginalComparison(!showOriginalComparison)}
                  className="px-3 py-2 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-xs font-semibold shadow-md border border-slate-200/80 backdrop-blur-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-700" />
                  <span>{showOriginalComparison ? 'View Enhanced' : 'Compare Original'}</span>
                </button>
              </div>
            </div>

            {/* REGION-BASED PACKAGING ZONES SELECTOR */}
            {detectedRegions.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <ScanLine className="w-4 h-4 text-slate-800 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">
                      Region-Based Packaging Zones ({detectedRegions.length} Detected):
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Tap a zone to inspect magnified crimp or margin
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {detectedRegions.map((reg) => (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => {
                        setActiveRegionId(reg.id);
                        setShowOriginalComparison(false);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        activeRegionId === reg.id
                          ? 'bg-white border-slate-900 shadow-xs ring-1.5 ring-slate-900'
                          : 'bg-white/80 hover:bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-bold uppercase truncate ${
                            activeRegionId === reg.id ? 'text-slate-900 font-extrabold' : 'text-slate-700'
                          }`}>
                            {reg.id === 'full'
                              ? 'Full Strip'
                              : reg.id === 'top_crimp'
                              ? 'Top Crimp'
                              : reg.id === 'bottom_crimp'
                              ? 'Bottom Crimp'
                              : reg.id === 'left_margin'
                              ? 'Left Edge'
                              : reg.id === 'right_margin'
                              ? 'Right Edge'
                              : 'Center Body'}
                          </span>
                          {reg.rotated && (
                            <span className="text-[9px] bg-slate-100 text-slate-700 px-1 rounded font-mono font-bold">
                              90°
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {reg.id === 'top_crimp'
                            ? 'MFG / EXP / Batch'
                            : reg.id === 'bottom_crimp'
                            ? 'MRP / Batch Lot'
                            : reg.id === 'left_margin' || reg.id === 'right_margin'
                            ? 'Vertical Edge Stamp'
                            : reg.id === 'center_body'
                            ? 'Brand & Formula'
                            : 'Complete strip'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono mt-2 pt-1 border-t border-slate-100 text-slate-500">
                        <span>{reg.width}×{reg.height}</span>
                        <span className="text-emerald-700 font-semibold">{reg.sharpnessScore}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PRE-PROCESSING CONTROLS & PRESET MODES */}
            <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-slate-700" />
                  Optical Pre-Processing & Calibration
                </span>
                
                {/* Preset Filters */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500 font-medium">Presets:</span>
                  <button
                    onClick={() => applyPresetMode('balanced')}
                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium cursor-pointer"
                  >
                    Auto-Balance
                  </button>
                  <button
                    onClick={() => applyPresetMode('antiglare')}
                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium cursor-pointer"
                  >
                    Anti-Glare Foil
                  </button>
                  <button
                    onClick={() => applyPresetMode('crimp')}
                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium cursor-pointer"
                  >
                    Crimp Sharpen
                  </button>
                  <button
                    onClick={() => applyPresetMode('highcontrast')}
                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium cursor-pointer"
                  >
                    High Contrast
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {/* Contrast Boost */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">Contrast Boost</span>
                    <span className="font-mono text-slate-500">{preprocessing.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="180"
                    step="5"
                    value={preprocessing.contrast}
                    onChange={(e) => setPreprocessing({ ...preprocessing, contrast: parseInt(e.target.value, 10) })}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                </div>

                {/* Convolution Sharpening */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">Sharpening Kernel</span>
                    <span className="font-mono text-slate-500">
                      {preprocessing.sharpen === 0 ? 'None' : preprocessing.sharpen === 1 ? 'Crisp (L1)' : 'Ultra (L2)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setPreprocessing({ ...preprocessing, sharpen: 0 })}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        preprocessing.sharpen === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => setPreprocessing({ ...preprocessing, sharpen: 1 })}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        preprocessing.sharpen === 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Crisp
                    </button>
                    <button
                      onClick={() => setPreprocessing({ ...preprocessing, sharpen: 2 })}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        preprocessing.sharpen === 2 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Ultra
                    </button>
                  </div>
                </div>

                {/* Metallic Anti-Glare Suppressor */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">Foil Anti-Glare</span>
                    <span className={`font-medium ${preprocessing.antiGlare ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {preprocessing.antiGlare ? 'Active' : 'Off'}
                    </span>
                  </div>
                  <button
                    onClick={() => setPreprocessing({ ...preprocessing, antiGlare: !preprocessing.antiGlare })}
                    className={`mt-1.5 w-full py-1 px-2 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      preprocessing.antiGlare
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{preprocessing.antiGlare ? 'Suppress Glare' : 'Bypass'}</span>
                  </button>
                </div>

                {/* Auto-Crop Strip */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">Auto-Crop Strip</span>
                    <span className={`font-medium ${preprocessing.autoCrop ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {preprocessing.autoCrop ? 'Active' : 'Full Frame'}
                    </span>
                  </div>
                  <button
                    onClick={() => setPreprocessing({ ...preprocessing, autoCrop: !preprocessing.autoCrop })}
                    className={`mt-1.5 w-full py-1 px-2 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      preprocessing.autoCrop
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Crop className="w-3 h-3" />
                    <span>{preprocessing.autoCrop ? 'Crop Enabled' : 'Auto Detect'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* PRIMARY SCAN CTA: RUN CLINICAL OPTICAL SCAN */}
            <div className="pt-1">
              <button
                onClick={runScanPipeline}
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-300" />
                    <span>{loadingStep || 'Analyzing Packaging...'}</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>
                      Run Optical Scan & Verify ({frames.length} Frame{frames.length > 1 ? 's' : ''})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* SECTION 2: ACTIVE SCAN RESULTS & CLINICAL AUDIT */}
      {scanResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 animate-fadeIn">
          
          {/* Header & Verification Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Verification Result
              </span>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <h2 className="text-xl font-bold text-slate-900">
                  {scanResult.medicineName}
                </h2>
                {scanResult.strength && (
                  <span className="text-xs bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200">
                    {scanResult.strength}
                  </span>
                )}
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Overall Confidence: {scanResult.confidenceScore}%
                </span>
                {scanResult.isRecognizedInDatabase ? (
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Database Verified
                  </span>
                ) : (
                  <span className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-medium">
                    Open OCR Extraction
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  isEditing
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Close Verification Panel' : 'Verify / Correct Details'}</span>
              </button>
            </div>
          </div>

          {/* Uncertainty Warning Banner (if confidence low) */}
          {scanResult.identificationConfidenceMessage && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Clarity Advisory:</strong>
                <p className="text-amber-800 mt-0.5">{scanResult.identificationConfidenceMessage}</p>
                <p className="text-amber-700 text-[11px] mt-1">
                  You can inspect the OCR transcription below or click "Verify / Correct Details" to adjust field values.
                </p>
              </div>
            </div>
          )}

          {/* Expiry Status Alert Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            scanResult.status === 'EXPIRED'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : scanResult.status === 'EXPIRING_SOON'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            {scanResult.status === 'EXPIRED' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : scanResult.status === 'EXPIRING_SOON' ? (
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-bold text-sm tracking-tight">{scanResult.statusMessage}</h3>
              <p className="text-xs opacity-90 mt-0.5">
                {scanResult.status === 'EXPIRED'
                  ? 'Expired pharmaceutical products lose therapeutic efficacy and can cause toxic breakdown products. Safe disposal is advised.'
                  : scanResult.status === 'EXPIRING_SOON'
                  ? 'Medication will expire within 90 days. Consume as prescribed or prepare a pharmacy refill.'
                  : 'Medication is within active manufacturer shelf-life.'}
              </p>
            </div>
          </div>

          {/* Field-by-Field Confidence Badges & Specifications Grid (ALL Required Fields) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {/* 1. Medicine Name */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">Brand Name</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                    scanResult.fieldConfidences?.medicineName === 'HIGH' ? 'bg-emerald-100 text-emerald-800' : scanResult.fieldConfidences?.medicineName === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {scanResult.fieldConfidences?.medicineName || 'HIGH'}
                  </span>
                </div>
                <strong className="text-slate-900 truncate block text-sm mt-1">{scanResult.medicineName}</strong>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Commercial Brand</span>
            </div>

            {/* 2. Generic Composition */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">Generic / Salt</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                    scanResult.fieldConfidences?.genericName === 'HIGH' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {scanResult.fieldConfidences?.genericName || 'HIGH'}
                  </span>
                </div>
                <strong className="text-slate-800 block text-xs mt-1 truncate" title={scanResult.genericName}>
                  {scanResult.genericName || 'Formula not visible'}
                </strong>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Active Chemical</span>
            </div>

            {/* 3. Strength */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">Strength</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                    scanResult.fieldConfidences?.strength === 'HIGH' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {scanResult.fieldConfidences?.strength || 'HIGH'}
                  </span>
                </div>
                <strong className="text-slate-800 block text-sm mt-1 font-mono">{scanResult.strength || 'N/A'}</strong>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Dosage Unit</span>
            </div>

            {/* 4. Batch Number */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">Batch / Lot</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                    scanResult.fieldConfidences?.batchNumber === 'HIGH' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {scanResult.fieldConfidences?.batchNumber || 'HIGH'}
                  </span>
                </div>
                <strong className="text-slate-800 font-mono block text-sm mt-1">{scanResult.batchNumber}</strong>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Mfg Lot No.</span>
            </div>

            {/* 5. Manufacturing Date (MFG) */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">MFG Date</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                    scanResult.fieldConfidences?.mfgDate === 'HIGH' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {scanResult.fieldConfidences?.mfgDate || (scanResult.mfgDate && scanResult.mfgDate !== 'N/A' ? 'HIGH' : 'LOW')}
                  </span>
                </div>
                <strong className="text-slate-800 font-mono block text-sm mt-1">
                  {scanResult.mfgDate || 'N/A'}
                </strong>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Date of Mfg</span>
            </div>

            {/* 6. Expiry Date (EXP) */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">EXP Date</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                    scanResult.fieldConfidences?.expiryDate === 'HIGH' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {scanResult.fieldConfidences?.expiryDate || 'HIGH'}
                  </span>
                </div>
                <strong className={`block text-sm mt-1 font-bold font-mono ${
                  scanResult.status === 'EXPIRED' ? 'text-rose-700' : 'text-slate-900'
                }`}>
                  {scanResult.expiryDate}
                </strong>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">MM/YYYY Expiry</span>
            </div>
          </div>

          {/* Secondary Details: Manufacturer & MRP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Manufacturer / Marketing Company</span>
                  <strong className="text-slate-800 block text-xs mt-0.5">
                    {scanResult.manufacturer || 'Manufacturer not printed on visible strip'}
                  </strong>
                </div>
              </div>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-200 text-slate-700">
                {scanResult.fieldConfidences?.manufacturer || (scanResult.manufacturer ? 'HIGH' : 'LOW')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Maximum Retail Price (MRP)</span>
                  <strong className="text-slate-800 block text-xs mt-0.5 font-mono">
                    {scanResult.mrp || 'Not visible on strip'}
                  </strong>
                </div>
              </div>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-200 text-slate-700">
                {scanResult.fieldConfidences?.mrp || (scanResult.mrp ? 'HIGH' : 'LOW')}
              </span>
            </div>
          </div>

          {/* Region-Based Packaging Inspection Tray */}
          {detectedRegions.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ScanLine className="w-4 h-4 text-slate-700" />
                  Region-Based OCR Inspection Tray ({detectedRegions.length} Packaging Zones Analyzed)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Targeted crimp, margin & body analysis
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {detectedRegions.map((reg) => (
                  <div
                    key={reg.id}
                    onClick={() => {
                      setActiveRegionId(reg.id);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className="bg-white p-2 rounded-lg border border-slate-200 hover:border-slate-400 transition-all cursor-pointer space-y-1.5 group shadow-2xs"
                  >
                    <div className="h-16 w-full rounded bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200/60">
                      <img
                        src={reg.dataUrl}
                        alt={reg.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-800 truncate">{reg.name.split(' ')[0]} {reg.name.split(' ')[1] || ''}</span>
                        <span className="text-emerald-700 font-mono text-[9px] font-bold">{reg.sharpnessScore}%</span>
                      </div>
                      <p className="text-[9px] text-slate-500 line-clamp-1">
                        {reg.id === 'top_crimp' ? 'Dates & Batch' : reg.id === 'bottom_crimp' ? 'MRP & Lot' : reg.id === 'left_margin' || reg.id === 'right_margin' ? 'Rotated 90°' : 'Formulation'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Checks & Internal Consistency Box */}
          {scanResult.verificationChecks && scanResult.verificationChecks.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Optical Character & Timeline Consistency Verification
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {scanResult.verificationChecks.map((chk, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-[11px]">{chk.label}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        chk.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : chk.status === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {chk.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">{chk.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inline Edit & Verification Form */}
          {isEditing && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-slate-700" />
                  Manual Verification & Fine-Tuning
                </h4>
                {editSuccessMsg && (
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {editSuccessMsg}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-600 font-medium mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={editForm.medicineName}
                    onChange={(e) => setEditForm({ ...editForm, medicineName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 font-medium mb-1">Active Formulation</label>
                  <input
                    type="text"
                    value={editForm.genericName}
                    onChange={(e) => setEditForm({ ...editForm, genericName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 font-medium mb-1">Dosage Strength</label>
                  <input
                    type="text"
                    value={editForm.strength}
                    onChange={(e) => setEditForm({ ...editForm, strength: e.target.value })}
                    placeholder="e.g. 500 mg or 650 mg"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 font-medium mb-1">Expiration Date (MM/YYYY)</label>
                  <input
                    type="text"
                    value={editForm.expiryDate}
                    onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                    placeholder="e.g. 07/2025"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 font-medium mb-1">Batch / Lot Number</label>
                  <input
                    type="text"
                    value={editForm.batchNumber}
                    onChange={(e) => setEditForm({ ...editForm, batchNumber: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 font-medium mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={editForm.manufacturer}
                    onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 font-medium mb-1">Manufacturing Date (MM/YYYY)</label>
                  <input
                    type="text"
                    value={editForm.mfgDate}
                    onChange={(e) => setEditForm({ ...editForm, mfgDate: e.target.value })}
                    placeholder="e.g. 05/2024"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 font-medium mb-1">Maximum Retail Price (MRP)</label>
                  <input
                    type="text"
                    value={editForm.mrp}
                    onChange={(e) => setEditForm({ ...editForm, mrp: e.target.value })}
                    placeholder="e.g. ₹ 32.50 per 15 Tabs"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSavingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save & Recalculate Expiry</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Formulation & Pharmacological Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Active Chemical Formulation:</span>
              <span className="text-slate-700 font-medium bg-white px-2.5 py-0.5 rounded border border-slate-200">
                {scanResult.genericName || 'Formula Identified'}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs">
              {scanResult.simpleExplanation}
            </p>
            {scanResult.purpose && scanResult.purpose.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-slate-600">
                <span className="font-medium text-slate-700">Clinical Indications:</span>
                {scanResult.purpose.map((p, idx) => (
                  <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-medium">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Dosage & Storage Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-900 block text-[11px]">Dosage Guidance</span>
              <p className="text-slate-600 leading-normal text-xs">{scanResult.dosageGuidance}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-900 block text-[11px]">Storage Specification</span>
              <p className="text-slate-600 leading-normal text-xs">{scanResult.storageInstructions}</p>
            </div>
          </div>

          {/* Collapsible Verbatim Raw OCR Text Viewer */}
          {scanResult.ocrRawText && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <div className="w-full p-3 flex items-center justify-between text-left text-xs font-semibold text-slate-700 bg-slate-100/70 border-b border-slate-200">
                <button
                  onClick={() => setShowRawOcrAccordion(!showRawOcrAccordion)}
                  className="flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Verbatim OCR Raw Transcription ({scanResult.ocrRawText.length} characters detected)</span>
                  {showRawOcrAccordion ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                </button>
                <button
                  onClick={copyRawOcrText}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedOcrText ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedOcrText ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              {showRawOcrAccordion && (
                <div className="p-3.5 bg-white text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {scanResult.ocrRawText}
                </div>
              )}
            </div>
          )}

          {/* Audio & Schedule Action Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <button
              onClick={speakMedicineInfo}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? 'Stop Audio' : 'Audio Explanation'}</span>
            </button>
          </div>

        </div>
      )}

      {/* SECTION 3: SCANNED MEDICINES (HIERARCHY IMMEDIATELY BELOW SCAN) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-slate-800" />
              Scanned Medicines
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                {displayedScans.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified medicines from your cabinet and active scanning session.
            </p>
          </div>
        </div>

        {displayedScans.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-2">
            <Pill className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-800">No Medicines Scanned Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use the scanner above to capture any blister strip, medicine box, or bottle label.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {displayedScans.map((scan) => (
              <div
                key={scan.id}
                onClick={() => onSelectScan?.(scan)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 transition-all hover:shadow-xs cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      scan.status === 'EXPIRED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : scan.status === 'EXPIRING_SOON'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {scan.status === 'EXPIRED' ? 'Expired' : scan.status === 'EXPIRING_SOON' ? 'Expiring Soon' : 'Valid'}
                    </span>

                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(scan.scannedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-2 group-hover:text-slate-700 transition-colors">
                    {scan.medicineName}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {scan.genericName || 'Formula not specified'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between text-slate-600">
                  <span>Batch: <strong className="font-mono text-slate-800">{scan.batchNumber}</strong></span>
                  <span>Exp: <strong className={`font-mono ${scan.status === 'EXPIRED' ? 'text-rose-700' : 'text-slate-800'}`}>{scan.expiryDate}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
