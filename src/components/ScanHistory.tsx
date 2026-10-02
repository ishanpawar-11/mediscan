import React, { useState, useMemo } from 'react';
import { MedicineScanResult, ExpiryStatus } from '../types';
import { 
  History, 
  Search, 
  Trash2, 
  Pill, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Eye, 
  RotateCcw,
  Download,
  Calendar,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  SlidersHorizontal
} from 'lucide-react';

interface ScanHistoryProps {
  scans: MedicineScanResult[];
  onSelectScan: (scan: MedicineScanResult) => void;
  onDeleteScan: (id: string) => void;
  onRestoreSamples: () => void;
}

type SortField = 'expiryDate' | 'medicineName' | 'scannedAt';
type SortOrder = 'asc' | 'desc';

// Helper to reliably parse expiry date strings like "07/2025", "07/25", "11/2027", "JUL 2025", "2025-07-31", etc.
function parseExpiryDateTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const trimmed = dateStr
    .replace(/^(exp|expiry|exp\.?date|use\s*by|best\s*before|bb)[:\s.\-]*/i, '')
    .trim();

  // Pattern MM/YYYY or M/YYYY
  const mmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (mmyyyy) {
    const month = parseInt(mmyyyy[1], 10);
    const year = parseInt(mmyyyy[2], 10);
    return new Date(year, month, 0, 23, 59, 59).getTime();
  }

  // Pattern MM/YY
  const mmyy = trimmed.match(/^(\d{1,2})[\/\-](\d{2})$/);
  if (mmyy) {
    const month = parseInt(mmyy[1], 10);
    const year = parseInt('20' + mmyy[2], 10);
    return new Date(year, month, 0, 23, 59, 59).getTime();
  }

  // Pattern YYYY-MM
  const yyyymm = trimmed.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (yyyymm) {
    const year = parseInt(yyyymm[1], 10);
    const month = parseInt(yyyymm[2], 10);
    return new Date(year, month, 0, 23, 59, 59).getTime();
  }

  // Pattern Mon YYYY / Mon-YY
  const monthMap: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  const monYear = trimmed.match(/([a-zA-Z]{3,9})[\s\/\-\.]+(\d{2,4})/);
  if (monYear) {
    const mPrefix = monYear[1].slice(0, 3).toLowerCase();
    if (monthMap[mPrefix]) {
      let yr = monYear[2];
      if (yr.length === 2) yr = '20' + yr;
      return new Date(parseInt(yr, 10), monthMap[mPrefix], 0, 23, 59, 59).getTime();
    }
  }

  // Standard date attempt
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    return parsed;
  }

  return 0;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  scans,
  onSelectScan,
  onDeleteScan,
  onRestoreSamples,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ExpiryStatus>('ALL');
  const [sortField, setSortField] = useState<SortField>('expiryDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Status counters from total scans for quick reference in badges
  const counts = useMemo(() => {
    return {
      all: scans.length,
      expired: scans.filter(s => s.status === 'EXPIRED').length,
      expiringSoon: scans.filter(s => s.status === 'EXPIRING_SOON').length,
      valid: scans.filter(s => s.status === 'VALID').length,
    };
  }, [scans]);

  // Filtered and Sorted scans
  const processedScans = useMemo(() => {
    const filtered = scans.filter((scan) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch = !query ||
        scan.medicineName.toLowerCase().includes(query) ||
        (scan.genericName && scan.genericName.toLowerCase().includes(query)) ||
        (scan.strength && scan.strength.toLowerCase().includes(query)) ||
        (scan.manufacturer && scan.manufacturer.toLowerCase().includes(query)) ||
        scan.batchNumber.toLowerCase().includes(query) ||
        scan.expiryDate.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'ALL' || scan.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'expiryDate') {
        const timeA = parseExpiryDateTimestamp(a.expiryDate);
        const timeB = parseExpiryDateTimestamp(b.expiryDate);
        comparison = timeA - timeB;
      } else if (sortField === 'medicineName') {
        comparison = a.medicineName.localeCompare(b.medicineName, undefined, { sensitivity: 'base' });
      } else if (sortField === 'scannedAt') {
        const timeA = new Date(a.scannedAt || 0).getTime();
        const timeB = new Date(b.scannedAt || 0).getTime();
        comparison = timeA - timeB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [scans, searchTerm, statusFilter, sortField, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setSortField('expiryDate');
    setSortOrder('asc');
  };

  const isFilterActive = searchTerm !== '' || statusFilter !== 'ALL' || sortField !== 'expiryDate' || sortOrder !== 'asc';

  // CSV Export Feature
  const handleExportCSV = () => {
    const recordsToExport = processedScans.length > 0 ? processedScans : scans;

    if (recordsToExport.length === 0) {
      setExportNotice('No medication records available to export.');
      setTimeout(() => setExportNotice(null), 3000);
      return;
    }

    const headers = [
      'Record ID',
      'Medicine Name',
      'Generic Name / Formula',
      'Batch Number',
      'Manufacturing Date',
      'Expiry Date',
      'Status',
      'Status Details',
      'Dosage Guidance',
      'Indications',
      'Side Effects',
      'Storage Instructions',
      'Scanned Timestamp'
    ];

    const escapeCSV = (value: string | number | undefined | null) => {
      if (value === null || value === undefined) return '""';
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = recordsToExport.map((s) => [
      escapeCSV(s.id),
      escapeCSV(s.medicineName),
      escapeCSV(s.genericName || 'N/A'),
      escapeCSV(s.batchNumber),
      escapeCSV(s.mfgDate),
      escapeCSV(s.expiryDate),
      escapeCSV(s.status),
      escapeCSV(s.statusMessage),
      escapeCSV(s.dosageGuidance),
      escapeCSV(Array.isArray(s.purpose) ? s.purpose.join('; ') : s.purpose),
      escapeCSV(Array.isArray(s.sideEffects) ? s.sideEffects.join('; ') : s.sideEffects),
      escapeCSV(s.storageInstructions),
      escapeCSV(new Date(s.scannedAt).toISOString())
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateFormatted = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `mediscan_medication_records_${dateFormatted}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported ${recordsToExport.length} medication record${recordsToExport.length > 1 ? 's' : ''} to CSV file.`);
    setTimeout(() => {
      setExportNotice(null);
    }, 4500);
  };

  return (
    <div className="space-y-6">

      {/* Header Banner - Clean Minimal Light */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            Pharmaceutical Scan Records
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical repository of scanned medicines, packaging batch codes, and expiration audits.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            title="Download CSV log of scanned medications"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Reset Samples */}
          <button
            onClick={onRestoreSamples}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title="Reset database to initial reference records"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Samples</span>
          </button>
        </div>
      </div>

      {/* CSV Export Success Toast */}
      {exportNotice && (
        <div className="p-3 rounded-lg bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Comprehensive Search & Filter Toolbar - Light Themed */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5">
        
        {/* Top Row: Search Input + Sorting Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search by Medicine Name / Generic / Batch / Expiry */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by medicine name, generic formula, batch code, or expiry date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              Sort:
            </span>

            <div className="relative inline-block">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="px-3 py-2 pr-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-colors cursor-pointer appearance-none"
              >
                <option value="expiryDate">Expiry Date</option>
                <option value="medicineName">Medicine Name (A–Z)</option>
                <option value="scannedAt">Scan Date</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Sort Direction Toggle Button */}
            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
              title={`Switch order (Currently ${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
            >
              {sortOrder === 'asc' ? (
                <>
                  <ArrowUp className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">
                    {sortField === 'expiryDate' ? 'Soonest First' : sortField === 'medicineName' ? 'A → Z' : 'Oldest First'}
                  </span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">
                    {sortField === 'expiryDate' ? 'Furthest First' : sortField === 'medicineName' ? 'Z → A' : 'Newest First'}
                  </span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Bottom Row: Status Filter Badges + Results Counter & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          
          {/* Status Segmented Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({counts.all})
            </button>

            <button
              onClick={() => setStatusFilter('EXPIRED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'EXPIRED'
                  ? 'bg-white text-rose-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Expired ({counts.expired})
            </button>

            <button
              onClick={() => setStatusFilter('EXPIRING_SOON')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'EXPIRING_SOON'
                  ? 'bg-white text-amber-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Expiring Soon ({counts.expiringSoon})
            </button>

            <button
              onClick={() => setStatusFilter('VALID')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'VALID'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Valid ({counts.valid})
            </button>
          </div>

          {/* Results Summary and Reset */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-900 font-semibold">{processedScans.length}</strong> of {scans.length} records
            </span>

            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Scans Listing */}
      {processedScans.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl space-y-3">
          <Pill className="w-8 h-8 text-slate-300 mx-auto" />
          <div>
            <p className="text-sm font-semibold text-slate-800">No matching medication records found</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {searchTerm ? `No results matching "${searchTerm}"` : 'No records match the active status filter.'}
            </p>
          </div>
          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Clear Search & Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedScans.map((scan) => (
            <div
              key={scan.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5 hover:border-slate-300 transition-colors shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                
                {/* Header Status Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                    scan.status === 'EXPIRED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : scan.status === 'EXPIRING_SOON'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {scan.status === 'EXPIRED' ? 'Expired' : scan.status === 'EXPIRING_SOON' ? 'Expiring Soon' : 'Valid'}
                  </span>

                  <span className="text-xs font-mono text-slate-400">
                    {new Date(scan.scannedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Medicine Title & Formula */}
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {scan.medicineName}
                  </h3>
                  {scan.genericName && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {scan.genericName}
                    </p>
                  )}
                </div>

                {/* Key Spec Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Batch Code</span>
                    <strong className="text-slate-800 font-mono text-[11px]">{scan.batchNumber}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Expiration</span>
                    <strong className={`text-[11px] ${scan.status === 'EXPIRED' ? 'text-rose-700 font-semibold' : 'text-slate-800'}`}>
                      {scan.expiryDate}
                    </strong>
                  </div>
                </div>

                {/* Status Message */}
                <p className="text-xs text-slate-600 leading-normal line-clamp-2">
                  {scan.statusMessage}
                </p>

              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-1">
                <button
                  onClick={() => onSelectScan(scan)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Dossier
                </button>

                <button
                  onClick={() => onDeleteScan(scan.id)}
                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                  title="Delete Entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
