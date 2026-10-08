import React, { useState, useEffect, useCallback } from 'react';
import { MedicineScanResult, DashboardStats } from './types';
import { Header } from './components/Header';
import { SecondaryNav } from './components/SecondaryNav';
import { Dashboard } from './components/Dashboard';
import { ScanMedicine } from './components/ScanMedicine';
import { ScanHistory } from './components/ScanHistory';
import { NotFound } from './components/NotFound';
import { MedicineDetailModal } from './components/MedicineDetailModal';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

function AppContent() {
  const { language, t } = useLanguage();

  // Route state initialized from current URL pathname
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
      return path;
    }
    return '/';
  });

  // Client-side router navigation
  const navigate = useCallback((to: string) => {
    const normalized = to.toLowerCase().replace(/\/+$/, '') || '/';
    if (window.location.pathname !== normalized) {
      window.history.pushState({}, '', normalized);
    }
    setCurrentPath(normalized);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Core application state
  const [stats, setStats] = useState<DashboardStats>({
    totalScanned: 0,
    expiredCount: 0,
    expiringSoonCount: 0,
    validCount: 0,
  });

  const [scans, setScans] = useState<MedicineScanResult[]>([]);
  const [recentScans, setRecentScans] = useState<MedicineScanResult[]>([]);
  const [selectedScan, setSelectedScan] = useState<MedicineScanResult | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(true);
  const [isLoadingScans, setIsLoadingScans] = useState<boolean>(true);

  // Load dashboard metrics
  const loadDashboardData = async () => {
    setIsLoadingDashboard(true);
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentScans(data.recentScans || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Load full scan history
  const loadScans = async () => {
    setIsLoadingScans(true);
    try {
      const res = await fetch('/api/scans');
      if (res.ok) {
        const data = await res.json();
        setScans(data);
      }
    } catch (err) {
      console.error('Error fetching scans archive:', err);
    } finally {
      setIsLoadingScans(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadScans();
  }, []);

  // Handlers
  const handleScanComplete = (newScan: MedicineScanResult) => {
    setScans((prev) => [newScan, ...prev]);
    loadDashboardData();
  };

  const handleDeleteScan = async (id: string) => {
    try {
      const res = await fetch(`/api/scans/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setScans((prev) => prev.filter((s) => s.id !== id));
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error deleting scan record:', err);
    }
  };

  const handleRestoreSamples = async () => {
    try {
      const res = await fetch('/api/seed-samples', { method: 'POST' });
      if (res.ok) {
        loadDashboardData();
        loadScans();
      }
    } catch (err) {
      console.error('Error restoring sample database:', err);
    }
  };

  // Determine which page component to display based on route
  const isHomeScanPage = currentPath === '/' || currentPath === '';
  const isOverviewPage = currentPath === '/overview';
  const isScanHistoryPage = currentPath === '/scan-history';
  const is404Page = !isHomeScanPage && !isOverviewPage && !isScanHistoryPage;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white flex flex-col justify-between">
      
      {/* 1. CLEAN HEADER (Logo, Brand Name, Subtitle, Language Toggle ONLY) */}
      <Header onNavigateHome={() => navigate('/')} />

      {/* 2. SECONDARY NAVIGATION (Overview, Scan History ONLY) */}
      <SecondaryNav currentPath={currentPath} onNavigate={navigate} />

      {/* 3. MAIN APPLICATION CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* DEFAULT HOMEPAGE (/) = SCAN MEDICATION */}
        {isHomeScanPage && (
          <ScanMedicine
            onScanComplete={handleScanComplete}
            recentScans={scans}
            onSelectScan={(scan) => setSelectedScan(scan)}
          />
        )}

        {/* OVERVIEW (/overview) */}
        {isOverviewPage && (
          <Dashboard
            stats={stats}
            recentScans={recentScans}
            isLoading={isLoadingDashboard}
            onScanClick={() => navigate('/')}
            onSelectScan={(scan) => setSelectedScan(scan)}
            onViewAllHistory={() => navigate('/scan-history')}
          />
        )}

        {/* SCAN HISTORY (/scan-history) */}
        {isScanHistoryPage && (
          <ScanHistory
            scans={scans}
            isLoading={isLoadingScans}
            onSelectScan={(scan) => setSelectedScan(scan)}
            onDeleteScan={handleDeleteScan}
            onRestoreSamples={handleRestoreSamples}
            onNavigateToScan={() => navigate('/')}
          />
        )}

        {/* 404 NOT FOUND (/invalid-route) */}
        {is404Page && (
          <NotFound
            language={language}
            onBackToScan={() => navigate('/')}
          />
        )}

      </main>

      {/* Detail Modal Popup */}
      {selectedScan && (
        <MedicineDetailModal
          scan={selectedScan}
          onClose={() => setSelectedScan(null)}
        />
      )}

      {/* Clean Clinical Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-700">
          {t('appName')} · {t('appSubtitle')}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Educational pharmaceutical reference assistant. Always consult a certified physician or pharmacist before medication administration.
        </p>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
