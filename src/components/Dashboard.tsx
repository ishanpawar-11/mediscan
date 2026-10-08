import React from 'react';
import { DashboardStats, MedicineScanResult } from '../types';
import { 
  Pill, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Camera, 
  ChevronRight,
  History
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { OverviewSkeleton } from './common/Skeleton';

interface DashboardProps {
  stats: DashboardStats;
  recentScans: MedicineScanResult[];
  isLoading?: boolean;
  onScanClick: () => void;
  onSelectScan: (scan: MedicineScanResult) => void;
  onViewAllHistory: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  recentScans,
  isLoading = false,
  onScanClick,
  onSelectScan,
  onViewAllHistory,
}) => {
  const { t } = useLanguage();

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="space-y-6">

      {/* Overview Intro Banner - Minimal Clinical White */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Clinical Monitoring & Packaging Inspection
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Medication Overview Console
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Summary of all scanned pharmaceutical packaging, expiration timelines, and batch records processed across the clinic repository.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <button
              onClick={onScanClick}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t('scanMedication')}</span>
            </button>
            <button
              onClick={onViewAllHistory}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('scanHistory')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clinical Metrics Cards Grid (4 Cards: Total, Expired, Expiring Soon, Valid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Scanned */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t('totalScanned')}</span>
            <Pill className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {stats.totalScanned}
            </span>
            <span className="text-xs text-slate-500">{t('records')}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{t('verifiedActive')}</p>
        </div>

        {/* Expired Status Alert */}
        <div className={`border rounded-xl p-5 shadow-xs ${
          stats.expiredCount > 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${stats.expiredCount > 0 ? 'text-rose-900' : 'text-slate-500'}`}>
              {t('expiredAlert')}
            </span>
            <AlertTriangle className={`w-4 h-4 ${stats.expiredCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-semibold font-mono tabular-nums ${
              stats.expiredCount > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}>
              {stats.expiredCount}
            </span>
            <span className={`text-xs ${stats.expiredCount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
              {t('items')}
            </span>
          </div>
          <p className={`mt-1 text-xs ${stats.expiredCount > 0 ? 'text-rose-700 font-medium' : 'text-slate-400'}`}>
            {stats.expiredCount > 0 ? t('quarantineRequired') : 'No expired medications identified'}
          </p>
        </div>

        {/* Expiring Soon */}
        <div className={`border rounded-xl p-5 shadow-xs ${
          stats.expiringSoonCount > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${stats.expiringSoonCount > 0 ? 'text-amber-900' : 'text-slate-500'}`}>
              {t('expiringSoon')}
            </span>
            <Clock className={`w-4 h-4 ${stats.expiringSoonCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-semibold font-mono tabular-nums ${
              stats.expiringSoonCount > 0 ? 'text-amber-800' : 'text-slate-900'
            }`}>
              {stats.expiringSoonCount}
            </span>
            <span className={`text-xs ${stats.expiringSoonCount > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
              {t('under60Days')}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{t('reviewRequired')}</p>
        </div>

        {/* Valid Medications */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t('validMedications')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {stats.validCount}
            </span>
            <span className="text-xs text-slate-500">{t('activeMedications')}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{t('safeToUse')}</p>
        </div>

      </div>

      {/* Recent Scanned Log Table/Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{t('recentScannedMedications')}</h2>
            <p className="text-xs text-slate-500">{t('recentScannedDesc')}</p>
          </div>
          <button
            onClick={onViewAllHistory}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{t('fullArchive')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentScans.length === 0 ? (
          <div className="text-center py-12">
            <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">{t('noMedicationRecords')}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('noMedicationRecordsDesc')}</p>
            <button
              onClick={onScanClick}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t('scanMedication')}</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                onClick={() => onSelectScan(scan)}
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 rounded-lg px-2 -mx-2 transition-colors cursor-pointer group"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-slate-900 group-hover:text-slate-800 truncate">
                      {scan.medicineName}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-mono text-slate-500">
                      {scan.batchNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{scan.genericName || 'Formula recorded'}</span>
                    <span aria-hidden="true">·</span>
                    <span>Exp: {scan.expiryDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                    scan.status === 'EXPIRED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : scan.status === 'EXPIRING_SOON'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {scan.status === 'EXPIRED' ? 'Expired' : scan.status === 'EXPIRING_SOON' ? 'Expiring Soon' : 'Valid'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
