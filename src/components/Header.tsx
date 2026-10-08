import React from 'react';
import { Pill, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateHome }) => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 text-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Logo & Brand: Minimal, Clean Typography */}
          <button 
            onClick={onNavigateHome} 
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            title="MediScan - Home / Scan Medication"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
              <Pill className="w-4 h-4 text-slate-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  {t('appName')}
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 border-l border-slate-200 pl-2">
                  {t('appSubtitle')}
                </span>
              </div>
            </div>
          </button>

          {/* Clean & Unobtrusive Language Toggle */}
          <div className="flex items-center">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              title={language === 'en' ? 'Switch to Hindi (हिंदी)' : 'Switch to English'}
              aria-label="Toggle application language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono text-[11px] font-semibold text-slate-800">
                {language === 'en' ? 'EN' : 'हिं'}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {language === 'en' ? 'हिंदी' : 'EN'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
