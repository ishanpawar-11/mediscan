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

export type FrequencyType = 'Daily' | 'Twice Daily' | 'Three Times Daily' | 'Weekly' | 'As Needed';
export type FoodTimingType = 'Before Food' | 'After Food' | 'With Food' | 'Any Time';

export interface Reminder {
  id: string;
  medicineId?: string;
  medicineName: string;
  dosage: string;
  time: string; // e.g. "09:00 PM" or "21:00"
  frequency: FrequencyType;
  foodTiming: FoodTimingType;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalScanned: number;
  expiredCount: number;
  expiringSoonCount: number;
  validCount: number;
  activeReminders: number;
}
