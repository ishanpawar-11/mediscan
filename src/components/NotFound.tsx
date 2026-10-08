import React from 'react';
import { Camera, FileQuestion, ArrowLeft } from 'lucide-react';

interface NotFoundProps {
  onBackToScan: () => void;
  language?: 'en' | 'hi';
}

export const NotFound: React.FC<NotFoundProps> = ({ onBackToScan, language = 'en' }) => {
  const isHindi = language === 'hi';

  return (
    <div className="min-h-[55vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-xs text-center space-y-6">
        
        {/* Visual Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mx-auto shadow-xs">
          <FileQuestion className="w-8 h-8 text-slate-800" />
        </div>

        {/* 404 Heading & Clinical Style Message */}
        <div className="space-y-2">
          <span className="font-mono text-sm font-bold tracking-wider text-slate-400 uppercase">
            404
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isHindi ? 'पृष्ठ नहीं मिला' : 'Page Not Found'}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {isHindi
              ? 'आप जिस पृष्ठ की तलाश कर रहे हैं वह मौजूद नहीं है या हटा दिया गया है।'
              : "The page you're looking for doesn't exist or may have been moved."}
          </p>
        </div>

        {/* Action Button: Back to Scan (Homepage /) */}
        <div className="pt-2">
          <button
            onClick={onBackToScan}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isHindi ? 'स्कैन पर वापस' : 'Back to Scan'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
