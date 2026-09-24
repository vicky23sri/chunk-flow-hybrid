import React from 'react';
import { Database, Search, ShieldCheck, RefreshCw, Plus } from 'lucide-react';

export default function VaultHeader({
  tenant,
  isRefreshing,
  onRefresh,
  onNewPipeline,
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters
}) {
  return (
    <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-[2rem] p-8 sm:p-10 mb-8 text-left shadow-xl">
      {/* Background visual effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100/60 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-50/80 rounded-full blur-[60px] -translate-x-1/4 translate-y-1/4 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        
        {/* Title Section */}
        <div className="space-y-4 max-w-xl">
          <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f95716] to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
              <Database size={20} />
            </div>
            <span>Backup Vault & Topology</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-lg">
            Manage your synchronized data streams, monitor active pipelines, and configure secure storage destinations.
          </p>
        </div>

        {/* Action & Search Section */}
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 w-full justify-end">
            <button
              onClick={onNewPipeline}
              className="px-5 py-3 bg-[#f95716] hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-2"
            >
              <Plus size={18} />
              <span>New Pipeline</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3 w-full justify-end">
            {/* Filter Toggle Button */}
            <button
              onClick={onToggleFilters}
              className={`px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm border ${showFilters ? 'bg-[#f95716] text-white border-orange-600 shadow-orange-500/20' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              <span>Filters</span>
            </button>

            {/* Global Search */}
            <div className="relative w-full md:w-64 group shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent rounded-xl blur-md -z-10 opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <Search size={16} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-[#f95716] transition-colors" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-medium pl-11 pr-4 py-3 rounded-xl outline-none focus:bg-white focus:border-[#f95716]/50 transition-all backdrop-blur-md shadow-sm"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
