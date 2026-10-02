import React from 'react';
import { DashboardStats, MedicineScanResult, Reminder } from '../types';
import { 
  Pill, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Camera, 
  BellRing,
  Calendar,
  ChevronRight
} from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats;
  recentScans: MedicineScanResult[];
  upcomingReminders: Reminder[];
  onScanClick: () => void;
  onSelectScan: (scan: MedicineScanResult) => void;
  onViewAllHistory: () => void;
  onViewReminders: () => void;
  onToggleReminder: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  recentScans,
  upcomingReminders,
  onScanClick,
  onSelectScan,
  onViewAllHistory,
  onViewReminders,
  onToggleReminder,
}) => {
  return (
    <div className="space-y-6">

      {/* Overview Intro Banner - Minimal White */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Clinical Optical Character Recognition & Expiration Auditing
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Medication Verification Console
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Verify pharmaceutical packaging, batch integrity, and expiration timelines through high-resolution computer vision and generative OCR analysis.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <button
              onClick={onScanClick}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              Scan Medication
            </button>
            <button
              onClick={onViewReminders}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Configure Alarms
            </button>
          </div>
        </div>
      </div>

      {/* Clinical Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Scanned */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Scanned</span>
            <Pill className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {stats.totalScanned}
            </span>
            <span className="text-xs text-slate-500">records</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Total logged entries</p>
        </div>

        {/* Expired Status Alert */}
        <div className={`border rounded-xl p-5 shadow-xs ${
          stats.expiredCount > 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${stats.expiredCount > 0 ? 'text-rose-900' : 'text-slate-500'}`}>
              Expired Alert
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
              items
            </span>
          </div>
          <p className={`mt-1 text-xs ${stats.expiredCount > 0 ? 'text-rose-700 font-medium' : 'text-slate-400'}`}>
            {stats.expiredCount > 0 ? 'Immediate quarantine required' : 'No expired medications identified'}
          </p>
        </div>

        {/* Expiring Soon */}
        <div className={`border rounded-xl p-5 shadow-xs ${
          stats.expiringSoonCount > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${stats.expiringSoonCount > 0 ? 'text-amber-900' : 'text-slate-500'}`}>
              Expiring Soon
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
              under 60 days
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Review before prescription renewal</p>
        </div>

        {/* Active Reminders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Schedules</span>
            <BellRing className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {stats.activeReminders}
            </span>
            <span className="text-xs text-slate-500">routines</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Audio and browser prompts enabled</p>
        </div>

      </div>

      {/* Main Content Split: Recent Scans & Medication Routines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Scanned Log (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Scanned Medications</h2>
              <p className="text-xs text-slate-500">Latest pharmaceutical records processed by optical inspection</p>
            </div>
            <button
              onClick={onViewAllHistory}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Full Archive</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentScans.length === 0 ? (
            <div className="text-center py-10">
              <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600">No medication records yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Scan your first medicine packaging strip to populate logs.</p>
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

        {/* Active Routines / Reminders Column (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Active Schedules</h2>
              <p className="text-xs text-slate-500">Configured dose times</p>
            </div>
            <button
              onClick={onViewReminders}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingReminders.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600">No scheduled routines</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Add an alert for regular or antibiotic courses.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {rem.time}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {rem.frequency}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 truncate mt-0.5">
                      {rem.medicineName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {rem.dosage} · {rem.foodTiming}
                    </p>
                  </div>

                  <button
                    onClick={() => onToggleReminder(rem.id)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer ${
                      rem.isActive
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {rem.isActive ? 'Active' : 'Paused'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={onViewReminders}
              className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Schedule New Dose Reminder
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
