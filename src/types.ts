export type ExpiryStatus = 'EXPIRED' | 'EXPIRING_SOON' | 'VALID';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FieldConfidences {
  medicineName?: ConfidenceLevel;
  genericName?: ConfidenceLevel;
  strength?: ConfidenceLevel;
  expiryDate?: ConfidenceLevel;
  batchNumber?: ConfidenceLevel;
  mfgDate?: ConfidenceLevel;
  mrp?: ConfidenceLevel;
  manufacturer?: ConfidenceLevel;
}

export interface VerificationCheck {
  label: string;
  status: 'PASSED' | 'WARNING' | 'INFO';
  detail: string;
}

export interface MedicineScanResult {
  id: string;
  medicineName: string;
  genericName?: string;
  strength?: string;
  manufacturer?: string;
  mrp?: string;
  mfgDate: string;
  expiryDate: string;
  batchNumber: string;
  dosageInstructions: string;
  ocrRawText: string;
  purpose: string[];
  simpleExplanation: string;
  dosageGuidance: string;
  sideEffects: string[];
  storageInstructions: string;
  precautions: string[];
  disclaimer: string;
  confidenceScore: number;
  fieldConfidences?: FieldConfidences;
  verificationChecks?: VerificationCheck[];
  isRecognizedInDatabase?: boolean;
  identificationConfidenceMessage?: string;
  processingMethodUsed?: string;
  status: ExpiryStatus;
  statusMessage: string;
  scannedAt: string;
  imageUrl?: string;
}

export interface DashboardStats {
  totalScanned: number;
  expiredCount: number;
  expiringSoonCount: number;
  validCount: number;
}

