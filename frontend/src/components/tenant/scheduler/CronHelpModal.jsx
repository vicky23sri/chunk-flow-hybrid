import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function CronHelpModal({ showHelpModal, setShowHelpModal }) {
  if (!showHelpModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-lg w-full text-slate-900 shadow-2xl relative text-left">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-base font-black flex items-center gap-2">
            <HelpCircle size={18} className="text-[#f95716]" /> Linux Cron Expression Syntax Guide
          </h3>
          <button
            onClick={() => setShowHelpModal(false)}
            className="text-slate-400 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Standard Linux 5-field cron syntax structure:
          </p>
          <div className="bg-slate-100 p-3 rounded-xl font-mono text-[11px] text-sky-700 flex justify-between border border-slate-200 font-bold">
            <span>Minute (0-59)</span>
            <span>Hour (0-23)</span>
            <span>Day (1-31)</span>
            <span>Month (1-12)</span>
            <span>Weekday (0-6)</span>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-900">Recommended Schedules:</div>
            <ul className="space-y-1.5 font-mono text-[11px] text-slate-600">
              <li><code className="text-[#f95716] font-bold">0 2 * * *</code> - Every day at 02:00 AM UTC</li>
              <li><code className="text-[#f95716] font-bold">*/30 * * * *</code> - Every 30 minutes continuously</li>
              <li><code className="text-[#f95716] font-bold">0 0 * * 0</code> - Every Sunday at midnight UTC</li>
              <li><code className="text-[#f95716] font-bold">0 0 1 * *</code> - 1st of every month at midnight</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => setShowHelpModal(false)}
            className="px-5 py-2 rounded-xl bg-[#f95716] hover:bg-orange-600 text-white font-bold text-xs uppercase shadow-xs cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
