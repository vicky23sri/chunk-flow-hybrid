import React, { useState } from 'react';
import { 
  Clock, PlusCircle, CheckCircle2, AlertTriangle, HelpCircle, Calendar, 
  Database, ShieldCheck, Activity, Layers, Sparkles, RefreshCw, ChevronRight, Check
} from 'lucide-react';

export default function BackupScheduler({ tenant, onScheduleCreated }) {
  const [cronExp, setCronExp] = useState('0 2 * * *');
  const [description, setDescription] = useState('Daily production snapshot & FastCDC slicing');
  const [enableImmediately, setEnableImmediately] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const presets = [
    { label: 'Daily at 2:00 AM', cron: '0 2 * * *' },
    { label: 'Every 30 Minutes', cron: '*/30 * * * *' },
    { label: 'Every 15 Minutes', cron: '*/15 * * * *' },
    { label: 'Weekly on Sunday', cron: '0 0 * * 0' },
    { label: 'Monthly 1st at Midnight', cron: '0 0 1 * *' },
  ];

  const handleApplyPreset = (cron, label) => {
    setCronExp(cron);
    setDescription(`Scheduled ${label.toLowerCase()} backup`);
  };

  const handleSubmitSchedule = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      if (onScheduleCreated) {
        onScheduleCreated({ cronExp, description, enableImmediately });
      }
      setTimeout(() => setSaveSuccess(false), 4000);
    }, 800);
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      
      {/* Left Column: Schedule Form & Presets (7 cols) */}
      <div className="lg:col-span-7 bg-white text-slate-900 p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Schedule New Database Backup
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated FastCDC chunking cron runner for <code className="font-mono text-[#f95716] font-bold">chunkflow_tenant_{tenant?.subdomain}</code>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(true)}
              className="text-slate-500 hover:text-slate-900 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
              title="Cron Expression Guide"
            >
              <HelpCircle size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmitSchedule} className="space-y-5">
            
            {/* Cron Expression Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                  Cron Expression Syntax
                </label>
                <span className="text-[11px] font-mono text-slate-500">5-Field Linux Format</span>
              </div>
              <input
                type="text"
                value={cronExp}
                onChange={(e) => setCronExp(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#f95716] focus:bg-white rounded-xl px-4 py-3 font-mono text-sm text-sky-600 font-bold outline-none transition-all shadow-sm"
                placeholder="e.g. 0 2 * * *"
              />
            </div>

            {/* Quick Presets Pills */}
            <div>
              <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Schedule Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p.cron}
                    type="button"
                    onClick={() => handleApplyPreset(p.cron, p.label)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer border ${
                      cronExp === p.cron
                        ? 'bg-[#f95716] text-white border-[#f95716] shadow-md'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider block mb-2">
                Schedule Label & Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#f95716] focus:bg-white rounded-xl px-4 py-3 text-xs text-slate-800 font-medium outline-none transition-all shadow-sm"
                placeholder="e.g. Daily production PostgreSQL snapshot"
              />
            </div>

            {/* Enable Checkbox */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
              <input
                type="checkbox"
                id="enable-immediate"
                checked={enableImmediately}
                onChange={(e) => setEnableImmediately(e.target.checked)}
                className="w-4 h-4 rounded text-[#f95716] focus:ring-[#f95716] bg-white border-slate-300 cursor-pointer"
              />
              <label htmlFor="enable-immediate" className="text-xs text-slate-700 font-medium cursor-pointer">
                Enable schedule immediately upon saving
              </label>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> Schedule successfully configured and registered!
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 rounded-xl bg-[#f95716] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <PlusCircle size={16} />}
              <span>{isSaving ? 'Registering Schedule...' : 'Register Backup Schedule'}</span>
            </button>
          </form>
        </div>

      </div>

      {/* Right Column: Statistics & Live Schedule Status (5 cols) */}
      <div className="lg:col-span-5 bg-white text-slate-900 p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
        
        <div>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Cron Engine Metrics
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Active backup pipeline health telemetry
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <div className="text-[11px] font-mono font-bold text-purple-600 uppercase mb-1">Total Snapshots</div>
              <div className="text-2xl font-black text-slate-900">24</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <div className="text-[11px] font-mono font-bold text-sky-600 uppercase mb-1">FastCDC Chunk</div>
              <div className="text-2xl font-black text-slate-900">64 KB</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <div className="text-[11px] font-mono font-bold text-emerald-600 uppercase mb-1">Active Rules</div>
              <div className="text-2xl font-black text-slate-900">3 Cron</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <div className="text-[11px] font-mono font-bold text-amber-600 uppercase mb-1">Deduplication</div>
              <div className="text-2xl font-black text-slate-900">4.8x</div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-600">
              <span>Next execution window:</span>
              <strong className="text-[#f95716] font-mono">Today at 02:00 AM</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Target S3 Storage Vault:</span>
              <strong className="text-sky-600 font-mono">s3://chunkflow-raw/</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Isolation Level:</span>
              <strong className="text-emerald-600 font-mono">Physical PostgreSQL</strong>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-mono flex items-center justify-between">
          <span>Cron Scheduler Status: ACTIVE</span>
          <span className="text-emerald-600 font-bold">● 100% Operational</span>
        </div>
      </div>

      {/* Cron Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-7 max-w-lg w-full text-slate-900 shadow-2xl relative text-left">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black flex items-center gap-2">
                <HelpCircle size={18} className="text-[#f95716]" /> Cron Expression Syntax
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Standard Linux 5-field cron syntax format:
              </p>
              <div className="bg-slate-100 p-3 rounded-xl font-mono text-[11px] text-sky-700 flex justify-between border border-slate-200">
                <span>Minute (0-59)</span>
                <span>Hour (0-23)</span>
                <span>Day (1-31)</span>
                <span>Month (1-12)</span>
                <span>Weekday (0-6)</span>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900">Examples:</div>
                <ul className="space-y-1.5 font-mono text-[11px] text-slate-600">
                  <li><code className="text-[#f95716]">0 2 * * *</code> - Daily at 2:00 AM</li>
                  <li><code className="text-[#f95716]">*/15 * * * *</code> - Every 15 minutes</li>
                  <li><code className="text-[#f95716]">0 0 * * 0</code> - Weekly on Sunday midnight</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-[#f95716] text-white font-bold text-xs uppercase shadow-md"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
