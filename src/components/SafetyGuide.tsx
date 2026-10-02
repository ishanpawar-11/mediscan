import React from 'react';
import { ShieldAlert, AlertTriangle, Thermometer, Pill, BookOpen, PhoneCall } from 'lucide-react';

export const SafetyGuide: React.FC = () => {
  return (
    <div className="space-y-6">

      {/* Header Banner - Minimal White */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1.5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-slate-700" />
          Medication Safety & Expiration Reference
        </h1>
        <p className="text-xs text-slate-500">
          Clinical principles for deciphering pharmaceutical packaging, understanding stability risks, and safe domestic storage.
        </p>
      </div>

      {/* Safety Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Rule 1: Dangers of Expired Medicines */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="text-sm font-semibold text-slate-900">Risks of Expired Pharmaceutical Compounds</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Consuming expired pharmaceuticals compromises therapeutic efficacy and may induce biochemical toxicity. Over time, active chemical compounds undergo oxidation and hydrolysis.
          </p>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <li><strong className="text-slate-800">Sub-potent Antibiotic Resistance:</strong> Degraded antibiotics fail to eradicate pathogens, cultivating resistant bacterial strains.</li>
            <li><strong className="text-slate-800">Chemical Degradation Byproducts:</strong> Compounds such as tetracyclines can degrade into nephrotoxic metabolites.</li>
            <li><strong className="text-slate-800">Preservative Decay:</strong> Liquid suspensions and ophthalmic drops lose antimicrobial preservatives, inviting contamination.</li>
          </ul>
        </div>

        {/* Rule 2: Decoding Packaging Abbreviations */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <BookOpen className="w-4 h-4" />
            <h2 className="text-sm font-semibold text-slate-900">Deciphering Pharmaceutical Packaging Codes</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Blister foils and bottles feature standardized regulatory markings stamped during quality inspection.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <strong className="text-slate-900 font-mono text-[11px] block">EXP / EXP.DATE</strong>
              <span className="text-[11px] text-slate-500">Terminal date of validated chemical stability and safety.</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <strong className="text-slate-900 font-mono text-[11px] block">MFD / MFG</strong>
              <span className="text-[11px] text-slate-500">Factory production date of the active batch.</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <strong className="text-slate-900 font-mono text-[11px] block">B.NO / LOT</strong>
              <span className="text-[11px] text-slate-500">Manufacturer batch identifier for regulatory auditing.</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <strong className="text-slate-900 font-mono text-[11px] block">IP / BP / USP</strong>
              <span className="text-[11px] text-slate-500">Pharmacopeia standards followed (Indian/British/US).</span>
            </div>
          </div>
        </div>

        {/* Rule 3: Storage Instructions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Thermometer className="w-4 h-4" />
            <h2 className="text-sm font-semibold text-slate-900">Proper Domestic Storage Environment</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Heat, humidity, and direct UV radiation accelerate compound degradation before official expiration dates.
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-800">Avoid Bathroom Medicine Cabinets:</span>
              <p className="text-slate-600 text-[11px] mt-0.5">Shower steam and fluctuations in humidity degrade solid dosage forms like tablets and gelatin capsules.</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-800">Room Temperature Range (15°C - 25°C):</span>
              <p className="text-slate-600 text-[11px] mt-0.5">Store in a cool, dry pantry or locked organizer away from kitchen stoves and direct windows.</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-800">Refrigeration Protocols (2°C - 8°C):</span>
              <p className="text-slate-600 text-[11px] mt-0.5">Insulins, reconstituted antibiotics, and vaccines require consistent refrigeration. Do not freeze.</p>
            </div>
          </div>
        </div>

        {/* Rule 4: Safe Disposal & Poison Control */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <PhoneCall className="w-4 h-4" />
            <h2 className="text-sm font-semibold text-slate-900">Safe Disposal & Emergency Resources</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Never flush expired medications into municipal sewage unless explicitly stated on FDA flush lists.
          </p>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
            <strong className="text-slate-800 block text-xs">Recommended Disposal Method:</strong>
            <p className="text-slate-600 text-[11px]">
              Mix uncrushed tablets with undesirable substance (coffee grounds, cat litter), seal in an impermeable plastic bag, and deposit in domestic solid waste.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="font-semibold text-slate-800 block">Poison Control Helpline:</span>
            <span className="text-slate-600 text-[11px]">National Emergency: 1-800-222-1222 (US) or local emergency services.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
