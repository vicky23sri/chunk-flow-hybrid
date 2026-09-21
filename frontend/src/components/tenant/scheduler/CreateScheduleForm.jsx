import React from 'react';
import { 
  SlidersHorizontal, HelpCircle, Layers, Database, ArrowRight, HardDrive, 
  RefreshCw, PlusCircle 
} from 'lucide-react';

export default function CreateScheduleForm({
  workflowsList,
  selectedWorkflowId,
  setSelectedWorkflowId,
  activeSelectedWorkflow,
  scheduleName,
  setScheduleName,
  presets,
  handleApplyPreset,
  cronExp,
  setCronExp,
  getCronHumanLabel,
  backupScope,
  setBackupScope,
  retentionPolicy,
  setRetentionPolicy,
  enableImmediately,
  setEnableImmediately,
  isSaving,
  handleSubmitSchedule,
  setShowHelpModal
}) {
  return (
    <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-xs">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Create Backup Rule
              </h3>
              <p className="text-[11px] text-slate-400">
                Select target pipeline canvas & cron execution rule
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowHelpModal(true)}
            className="text-slate-400 hover:text-slate-800 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
            title="Cron Syntax Guide"
          >
            <HelpCircle size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmitSchedule} className="space-y-4 text-xs">
          
          {/* Target Pipeline Canvas Visual Selector Card */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Layers size={13} className="text-[#f95716]" /> Select Target Pipeline Canvas
            </label>
            <select
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#f95716] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold outline-none transition-all shadow-xs cursor-pointer"
            >
              {workflowsList.length > 0 ? (
                workflowsList.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name} (ID: {wf.id.slice(0, 8)}...)
                  </option>
                ))
              ) : (
                <option value="default_wf">PostgreSQL -&gt; S3 Vault Data Pipeline (Active Canvas)</option>
              )}
            </select>

            {/* Interactive Target Canvas Blueprint Diagram Preview */}
            <div className="mt-2.5 p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/30 border border-slate-200/90 text-[11px] space-y-2">
              <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                <span className="font-bold text-slate-700 uppercase tracking-wider">Pipeline Flow Diagram</span>
                <span className="text-emerald-600 font-bold">● Active Node Wire</span>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 font-bold">
                    <Database size={13} />
                  </div>
                  <span className="font-bold text-slate-800 truncate text-[11px]">
                    {activeSelectedWorkflow?.source_name || 'PostgreSQL DB'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[#f95716] shrink-0 mx-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f95716] animate-ping" />
                  <ArrowRight size={13} />
                </div>

                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 font-bold">
                    <HardDrive size={13} />
                  </div>
                  <span className="font-bold text-slate-800 truncate text-[11px]">
                    {activeSelectedWorkflow?.destination_name || 'Amazon S3 Vault'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Rule Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider block mb-1.5">
              Backup Rule Label
            </label>
            <input
              type="text"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#f95716] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold outline-none transition-all shadow-xs"
              placeholder="e.g. Daily Production Snapshot"
            />
          </div>

          {/* Quick Presets Pills */}
          <div>
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Frequency Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.cron}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold transition-all cursor-pointer border ${
                    cronExp === p.cron
                      ? 'bg-[#f95716] text-white border-[#f95716] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cron Expression Syntax */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                Cron Syntax (Linux 5-Field)
              </label>
            </div>
            <input
              type="text"
              value={cronExp}
              onChange={(e) => setCronExp(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#f95716] focus:bg-white rounded-xl px-3.5 py-2.5 font-mono text-xs text-sky-600 font-bold outline-none transition-all shadow-xs"
              placeholder="0 2 * * *"
            />
            <div className="mt-1 text-[11px] text-slate-400 font-mono">
              {getCronHumanLabel(cronExp)}
            </div>
          </div>

          {/* Backup Scope & Retention Policy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider block mb-1.5">
                Backup Scope
              </label>
              <select
                value={backupScope}
                onChange={(e) => setBackupScope(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#f95716] focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-800 font-medium outline-none transition-all shadow-xs cursor-pointer"
              >
                <option value="Full Database Dump + FastCDC">Full DB + FastCDC</option>
                <option value="Incremental FastCDC Slice">Incremental CDC Slice</option>
                <option value="Full Cold Storage Backup">Cold Storage Vault</option>
                <option value="Full Archival Vault Dump">Archival Snapshot</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider block mb-1.5">
                Retention Policy
              </label>
              <select
                value={retentionPolicy}
                onChange={(e) => setRetentionPolicy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#f95716] focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-800 font-medium outline-none transition-all shadow-xs cursor-pointer"
              >
                <option value="30 Days">30 Days (Recommended)</option>
                <option value="7 Days">7 Days</option>
                <option value="90 Days">90 Days</option>
                <option value="Indefinite">Indefinite Retention</option>
              </select>
            </div>
          </div>

          {/* Immediate Activate Toggle */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <input
              type="checkbox"
              id="enable-immediately"
              checked={enableImmediately}
              onChange={(e) => setEnableImmediately(e.target.checked)}
              className="w-4 h-4 rounded text-[#f95716] focus:ring-[#f95716] bg-white border-slate-300 cursor-pointer"
            />
            <label htmlFor="enable-immediately" className="text-xs text-slate-700 font-medium cursor-pointer">
              Activate rule immediately upon saving
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-xl bg-[#f95716] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 mt-3"
          >
            {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <PlusCircle size={16} />}
            <span>{isSaving ? 'Saving Rule...' : 'Save Backup Schedule'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
