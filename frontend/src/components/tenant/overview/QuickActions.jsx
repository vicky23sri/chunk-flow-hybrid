import React from 'react';
import { Projector, Clock, ChevronRight } from 'lucide-react';

export default function QuickActions({ onNavigateToBuilder, onNavSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div 
        onClick={() => onNavigateToBuilder(null)}
        className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-orange-500/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#f95716] flex items-center justify-center border border-orange-200 shrink-0">
            <Projector size={24} />
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900">Launch Workflow Builder</h3>
            <p className="text-xs text-slate-500">Visual database-to-storage canvas pipeline</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-slate-400" />
      </div>

      <div 
        onClick={() => onNavSelect('scheduler')}
        className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900">Configure Backup Scheduler</h3>
            <p className="text-xs text-slate-500">Cron rules and FastCDC snapshot telemetry</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-slate-[#f95716]" />
      </div>
    </div>
  );
}
