import React from 'react';
import { Pill, Camera, Clock, History, LayoutDashboard, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'scan' | 'reminders' | 'history' | 'safety';
  setActiveTab: (tab: 'dashboard' | 'scan' | 'reminders' | 'history' | 'safety') => void;
  expiredCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, expiredCount }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 text-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand: Minimal, Clean Typography */}
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center transition-transform group-hover:scale-102">
              <Pill className="w-4 h-4 text-slate-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  MediScan
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 border-l border-slate-200 pl-2">
                  Clinical OCR & Verification
                </span>
              </div>
            </div>
          </button>

          {/* Navigation Items: Minimal Light Tabs */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Overview
            </button>

            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'scan'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Scan Medication
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'reminders'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Schedule & Reminders
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Scan History
              {expiredCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-100 text-rose-700">
                  {expiredCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('safety')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'safety'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Safety Protocols
            </button>
          </nav>

          {/* Action button */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('scan')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-medium text-xs shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>New Scan</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-white border-t border-slate-200 py-2 px-2 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            activeTab === 'dashboard' ? 'text-slate-900 font-semibold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            activeTab === 'scan' ? 'text-slate-900 font-semibold' : 'text-slate-500'
          }`}
        >
          <Camera className="w-4 h-4 mb-0.5" />
          Scan
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            activeTab === 'reminders' ? 'text-slate-900 font-semibold' : 'text-slate-500'
          }`}
        >
          <Clock className="w-4 h-4 mb-0.5" />
          Reminders
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            activeTab === 'history' ? 'text-slate-900 font-semibold' : 'text-slate-500'
          }`}
        >
          <History className="w-4 h-4 mb-0.5" />
          History
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            activeTab === 'safety' ? 'text-slate-900 font-semibold' : 'text-slate-500'
          }`}
        >
          <ShieldAlert className="w-4 h-4 mb-0.5" />
          Safety
        </button>
      </div>
    </header>
  );
};
