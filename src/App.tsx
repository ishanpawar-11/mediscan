import React, { useState, useEffect } from 'react';
import { MedicineScanResult, Reminder, DashboardStats } from './types';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ScanMedicine } from './components/ScanMedicine';
import { Reminders } from './components/Reminders';
import { ScanHistory } from './components/ScanHistory';
import { SafetyGuide } from './components/SafetyGuide';
import { MedicineDetailModal } from './components/MedicineDetailModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'reminders' | 'history' | 'safety'>('dashboard');
  
  const [stats, setStats] = useState<DashboardStats>({
    totalScanned: 0,
    expiredCount: 0,
    expiringSoonCount: 0,
    validCount: 0,
    activeReminders: 0,
  });

  const [scans, setScans] = useState<MedicineScanResult[]>([]);
  const [recentScans, setRecentScans] = useState<MedicineScanResult[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  
  const [selectedScan, setSelectedScan] = useState<MedicineScanResult | null>(null);
  const [prefillReminderName, setPrefillReminderName] = useState<string>('');

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentScans(data.recentScans);
        setUpcomingReminders(data.upcomingReminders);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    }
  };

  // Load all scans history
  const loadScans = async () => {
    try {
      const res = await fetch('/api/scans');
      if (res.ok) {
        const data = await res.json();
        setScans(data);
      }
    } catch (err) {
      console.error('Error fetching scans:', err);
    }
  };

  // Load all reminders
  const loadReminders = async () => {
    try {
      const res = await fetch('/api/reminders');
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadScans();
    loadReminders();
  }, []);

  // Handlers
  const handleScanComplete = (newScan: MedicineScanResult) => {
    setScans((prev) => [newScan, ...prev]);
    loadDashboardData();
  };

  const handleSetReminderForMedicine = (scan: MedicineScanResult) => {
    setPrefillReminderName(scan.medicineName);
    setActiveTab('reminders');
  };

  const handleAddReminder = async (newRem: Partial<Reminder>) => {
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRem),
      });
      if (res.ok) {
        loadReminders();
        loadDashboardData();
        setPrefillReminderName('');
      }
    } catch (err) {
      console.error('Error adding reminder:', err);
    }
  };

  const handleToggleReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}/toggle`, {
        method: 'PUT',
      });
      if (res.ok) {
        loadReminders();
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error toggling reminder:', err);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadReminders();
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error deleting reminder:', err);
    }
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
      console.error('Error deleting scan:', err);
    }
  };

  const handleRestoreSamples = async () => {
    try {
      const res = await fetch('/api/seed-samples', { method: 'POST' });
      if (res.ok) {
        loadDashboardData();
        loadScans();
        loadReminders();
      }
    } catch (err) {
      console.error('Error restoring sample database:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white flex flex-col justify-between">
      
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        expiredCount={stats.expiredCount}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            recentScans={recentScans}
            upcomingReminders={upcomingReminders}
            onScanClick={() => setActiveTab('scan')}
            onSelectScan={(scan) => setSelectedScan(scan)}
            onViewAllHistory={() => setActiveTab('history')}
            onViewReminders={() => setActiveTab('reminders')}
            onToggleReminder={handleToggleReminder}
          />
        )}

        {activeTab === 'scan' && (
          <ScanMedicine
            onScanComplete={handleScanComplete}
            onSetReminderForMedicine={handleSetReminderForMedicine}
            recentScans={scans}
            onSelectScan={(scan) => setSelectedScan(scan)}
          />
        )}

        {activeTab === 'reminders' && (
          <Reminders
            reminders={reminders}
            onAddReminder={handleAddReminder}
            onToggleReminder={handleToggleReminder}
            onDeleteReminder={handleDeleteReminder}
            prefillMedicineName={prefillReminderName}
          />
        )}

        {activeTab === 'history' && (
          <ScanHistory
            scans={scans}
            onSelectScan={(scan) => setSelectedScan(scan)}
            onDeleteScan={handleDeleteScan}
            onRestoreSamples={handleRestoreSamples}
          />
        )}

        {activeTab === 'safety' && <SafetyGuide />}
      </main>

      {/* Detail Modal Popup */}
      {selectedScan && (
        <MedicineDetailModal
          scan={selectedScan}
          onClose={() => setSelectedScan(null)}
          onSetReminder={handleSetReminderForMedicine}
        />
      )}

      {/* App Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-700">MediScan · Clinical Optical Character Recognition & Expiration Verification</p>
        <p className="mt-1 text-[11px] text-slate-400">Educational pharmaceutical reference assistant. Always consult a certified physician or pharmacist before medication changes.</p>
      </footer>

    </div>
  );
}
