import React from 'react';
import { Activity, Clock, Projector, ArrowRight } from 'lucide-react';

export default function RecentWorkflows({ recentWorkflows, onNavSelect, onNavigateToBuilder }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900">Recent Workflows</h3>
          <p className="text-xs text-slate-500">Latest pipeline deployments and executions</p>
        </div>
        <button 
          onClick={() => onNavSelect('workflow')}
          className="text-xs font-bold text-[#f95716] hover:text-orange-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          View All <ArrowRight size={14} />
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {recentWorkflows.length > 0 ? (
          recentWorkflows.map((wf) => (
            <div key={wf.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <Activity size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{wf.name}</h4>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-mono text-slate-500">ID: {wf.id.substring(0, 8)}...</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} /> {new Date(wf.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                Active
              </span>
            </div>
          ))
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-3">
              <Projector size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">No Workflows Yet</h4>
            <p className="text-xs text-slate-500 mb-4">Create your first database-to-storage pipeline</p>
            <button
              onClick={() => onNavigateToBuilder(null)}
              className="px-4 py-2 bg-[#f95716] text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20 cursor-pointer"
            >
              Launch Builder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
