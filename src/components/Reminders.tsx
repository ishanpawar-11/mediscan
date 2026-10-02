import React, { useState } from 'react';
import { Reminder, FrequencyType, FoodTimingType } from '../types';
import { Clock, Plus, Trash2, BellRing, BellOff, Volume2, X } from 'lucide-react';

interface RemindersProps {
  reminders: Reminder[];
  onAddReminder: (reminder: Partial<Reminder>) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  prefillMedicineName?: string;
}

export const Reminders: React.FC<RemindersProps> = ({
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  prefillMedicineName = '',
}) => {
  const [showAddModal, setShowAddModal] = useState(!!prefillMedicineName);
  const [medicineName, setMedicineName] = useState(prefillMedicineName);
  const [dosage, setDosage] = useState('1 Tablet');
  const [time, setTime] = useState('09:00 AM');
  const [frequency, setFrequency] = useState<FrequencyType>('Daily');
  const [foodTiming, setFoodTiming] = useState<FoodTimingType>('After Food');
  const [notes, setNotes] = useState('');
  const [testNotificationMsg, setTestNotificationMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) return;

    onAddReminder({
      medicineName: medicineName.trim(),
      dosage,
      time,
      frequency,
      foodTiming,
      notes: notes.trim(),
    });

    setMedicineName('');
    setNotes('');
    setShowAddModal(false);
  };

  const playTestAlarm = (remName: string, remTime: string) => {
    setTestNotificationMsg(`Dose alert triggered: Time to take ${remName} (${remTime}).`);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance(`Medication reminder. It is time to take your scheduled dose of ${remName}.`);
      speech.rate = 0.95;
      window.speechSynthesis.speak(speech);
    }

    setTimeout(() => {
      setTestNotificationMsg(null);
    }, 5000);
  };

  return (
    <div className="space-y-6">

      {/* Header Banner - Minimal White */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700" />
            Medication Schedule & Timers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure recurring dose times, meals coordination, and audio speech notifications.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Schedule</span>
        </button>
      </div>

      {/* Test Alarm Alert Bar */}
      {testNotificationMsg && (
        <div className="p-3.5 rounded-lg bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-emerald-400" />
            <span>{testNotificationMsg}</span>
          </div>
          <button
            onClick={() => setTestNotificationMsg(null)}
            className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add Reminder Modal / Form Card */}
      {showAddModal && (
        <div className="bg-white border border-slate-300 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              Configure Dose Routine
            </h3>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            
            {/* Medicine Name */}
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <label className="text-slate-700 font-medium block">Medicine Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Paracetamol, Amoxicillin"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Dosage */}
            <div className="space-y-1">
              <label className="text-slate-700 font-medium block">Dosage Quantity</label>
              <input
                type="text"
                placeholder="e.g. 1 Tablet, 5 ml"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Reminder Time */}
            <div className="space-y-1">
              <label className="text-slate-700 font-medium block">Scheduled Time</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400"
              >
                <option value="08:00 AM">08:00 AM (Morning)</option>
                <option value="09:00 AM">09:00 AM (Breakfast)</option>
                <option value="01:00 PM">01:00 PM (Lunch)</option>
                <option value="05:00 PM">05:00 PM (Evening)</option>
                <option value="09:00 PM">09:00 PM (Dinner / Night)</option>
                <option value="10:00 PM">10:00 PM (Bedtime)</option>
              </select>
            </div>

            {/* Repeat Frequency */}
            <div className="space-y-1">
              <label className="text-slate-700 font-medium block">Interval</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400"
              >
                <option value="Daily">Daily</option>
                <option value="Twice Daily">Twice Daily</option>
                <option value="Three Times Daily">Three Times Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="As Needed">As Needed</option>
              </select>
            </div>

            {/* Food Timing */}
            <div className="space-y-1">
              <label className="text-slate-700 font-medium block">Meal Coordination</label>
              <select
                value={foodTiming}
                onChange={(e) => setFoodTiming(e.target.value as FoodTimingType)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400"
              >
                <option value="After Food">After Food</option>
                <option value="Before Food">Before Food</option>
                <option value="With Food">With Food</option>
                <option value="Any Time">Any Time</option>
              </select>
            </div>

            {/* Special Notes */}
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <label className="text-slate-700 font-medium block">Specific Notes</label>
              <input
                type="text"
                placeholder="e.g. Take with warm water, complete full 7 days"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Submit Actions */}
            <div className="sm:col-span-2 lg:col-span-3 pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                Save Schedule
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Reminders List */}
      <div className="space-y-3">
        {reminders.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl">
            <BellOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No active medication schedules</p>
            <p className="text-xs text-slate-500 mt-0.5">Click "New Schedule" to register a dose reminder.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className={`p-5 rounded-xl border transition-colors ${
                  rem.isActive
                    ? 'bg-white border-slate-200 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {rem.time}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-600 font-medium">
                        {rem.frequency}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1">{rem.medicineName}</h3>
                    <p className="text-xs text-slate-600">
                      Dosage: <strong className="text-slate-800 font-medium">{rem.dosage}</strong> · <span>{rem.foodTiming}</span>
                    </p>

                    {rem.notes && (
                      <p className="text-xs text-slate-500 italic pt-0.5">
                        "{rem.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Audio Test Button */}
                    <button
                      onClick={() => playTestAlarm(rem.medicineName, rem.time)}
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                      title="Test Audio Voice Alert"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {/* Toggle Active / Inactive */}
                    <button
                      onClick={() => onToggleReminder(rem.id)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        rem.isActive
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700'
                      }`}
                      title={rem.isActive ? 'Pause Reminder' : 'Resume Reminder'}
                    >
                      {rem.isActive ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteReminder(rem.id)}
                      className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                      title="Delete Routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
