import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

interface Translations {
  appName: string;
  appSubtitle: string;
  overview: string;
  scanHistory: string;
  scanMedication: string;
  pageNotFound: string;
  pageNotFoundDesc: string;
  backToScan: string;
  totalScanned: string;
  expiredAlert: string;
  expiringSoon: string;
  validMedications: string;
  records: string;
  items: string;
  under60Days: string;
  activeMedications: string;
  recentScannedMedications: string;
  recentScannedDesc: string;
  fullArchive: string;
  noMedicationRecords: string;
  noMedicationRecordsDesc: string;
  searchMedications: string;
  filterAll: string;
  filterExpired: string;
  filterExpiringSoon: string;
  filterValid: string;
  verifiedActive: string;
  quarantineRequired: string;
  reviewRequired: string;
  safeToUse: string;
  scanNewMedication: string;
  clearFilters: string;
}

const translations: Record<Language, Translations> = {
  en: {
    appName: 'MediScan',
    appSubtitle: 'Clinical OCR & Verification',
    overview: 'Overview',
    scanHistory: 'Scan History',
    scanMedication: 'Scan Medication',
    pageNotFound: 'Page Not Found',
    pageNotFoundDesc: "The page you're looking for doesn't exist or may have been moved.",
    backToScan: 'Back to Scan',
    totalScanned: 'Total Scanned',
    expiredAlert: 'Expired Alert',
    expiringSoon: 'Expiring Soon',
    validMedications: 'Valid Medications',
    records: 'records',
    items: 'items',
    under60Days: 'under 60 days',
    activeMedications: 'active & safe',
    recentScannedMedications: 'Recent Scanned Medications',
    recentScannedDesc: 'Latest pharmaceutical records processed by optical inspection',
    fullArchive: 'Full Archive',
    noMedicationRecords: 'No medication records yet',
    noMedicationRecordsDesc: 'Scan your first medicine packaging strip to populate logs.',
    searchMedications: 'Search medications by brand, salt, batch...',
    filterAll: 'All',
    filterExpired: 'Expired',
    filterExpiringSoon: 'Expiring Soon',
    filterValid: 'Valid',
    verifiedActive: 'Verified active records',
    quarantineRequired: 'Immediate quarantine required',
    reviewRequired: 'Review before prescription renewal',
    safeToUse: 'Verified valid for administration',
    scanNewMedication: 'Scan Medication',
    clearFilters: 'Clear Filters',
  },
  hi: {
    appName: 'मेडीस्कैन',
    appSubtitle: 'नैदानिक ओसीआर एवं सत्यापन',
    overview: 'अवलोकन',
    scanHistory: 'स्कैन इतिहास',
    scanMedication: 'दवा स्कैन करें',
    pageNotFound: 'पृष्ठ नहीं मिला',
    pageNotFoundDesc: 'आप जिस पृष्ठ की तलाश कर रहे हैं वह मौजूद नहीं है या हटा दिया गया है।',
    backToScan: 'स्कैन पर वापस',
    totalScanned: 'कुल स्कैन',
    expiredAlert: 'समाप्त चेतावनी',
    expiringSoon: 'शीघ्र समाप्त',
    validMedications: 'मान्य दवाएं',
    records: 'अभिलेख',
    items: 'दवाएं',
    under60Days: '60 दिनों के भीतर',
    activeMedications: 'सक्रिय एवं सुरक्षित',
    recentScannedMedications: 'हाल ही में स्कैन की गई दवाएं',
    recentScannedDesc: 'ऑप्टिकल निरीक्षण द्वारा संसाधित नवीनतम फार्मास्युटिकल रिकॉर्ड',
    fullArchive: 'पूरा इतिहास',
    noMedicationRecords: 'अभी तक कोई दवा रिकॉर्ड नहीं',
    noMedicationRecordsDesc: 'लॉग प्रविष्टियों के लिए अपनी पहली दवा पैकेजिंग पट्टी स्कैन करें।',
    searchMedications: 'ब्रांड, साल्ट, बैच द्वारा दवाएं खोजें...',
    filterAll: 'सभी',
    filterExpired: 'समाप्त',
    filterExpiringSoon: 'शीघ्र समाप्त',
    filterValid: 'मान्य',
    verifiedActive: 'सत्यापित सक्रिय रिकॉर्ड',
    quarantineRequired: 'तत्काल क्वारंटाइन आवश्यक',
    reviewRequired: 'पर्चे के नवीनीकरण से पहले समीक्षा करें',
    safeToUse: 'उपयोग के लिए मान्य सत्यापित',
    scanNewMedication: 'दवा स्कैन करें',
    clearFilters: 'फ़िल्टर हटाएं',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => translations.en[key] || '',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('mediscan_lang');
      if (saved === 'hi' || saved === 'en') return saved;
    } catch {
      // fallback
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('mediscan_lang', lang);
    } catch {
      // fallback
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const t = (key: keyof Translations): string => {
    return translations[language][key] || translations.en[key] || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
