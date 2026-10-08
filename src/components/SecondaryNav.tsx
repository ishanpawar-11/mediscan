import React from 'react';
import { LayoutDashboard, History } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SecondaryNavProps {
  currentPath: string; // '/' | '/overview' | '/scan-history'
  onNavigate: (path: string) => void;
}

export const SecondaryNav: React.FC<SecondaryNavProps> = ({ currentPath, onNavigate }) => {
  const { t } = useLanguage();

  const isOverview = currentPath === '/overview';
  const isHistory = currentPath === '/scan-history';

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 sm:gap-2 h-11 text-xs" aria-label="Secondary navigation">
          
          {/* Overview Tab */}
          <button
            onClick={() => onNavigate('/overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              isOverview
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{t('overview')}</span>
          </button>

          {/* Scan History Tab */}
          <button
            onClick={() => onNavigate('/scan-history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              isHistory
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{t('scanHistory')}</span>
          </button>

        </nav>
      </div>
    </div>
  );
};
