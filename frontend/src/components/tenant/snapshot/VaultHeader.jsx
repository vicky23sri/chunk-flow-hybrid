import React from 'react';
import { Database, Search, RefreshCw, Plus } from 'lucide-react';
import PageHeader from '../../shared/PageHeader';

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
    <div className="space-y-4 mb-6">
      <PageHeader
        icon={Database}
        title="Active Pipelines"
        description="Manage your synchronized data streams and configure secure storage destinations"
        actions={
          <>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#f95716]' : 'text-slate-400'} /> Refresh
            </button>
            <button
              onClick={onNewPipeline}
              className="h-9 px-4 bg-[#f95716] hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-orange-400/25"
            >
              <Plus size={15} strokeWidth={2.5} /> New Pipeline
            </button>
          </>
        }
      />

      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleFilters}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${showFilters ? 'bg-[#f95716] text-white border-orange-600 shadow-sm shadow-orange-400/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filters
        </button>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-[11px] text-slate-400" />
          <input
            type="text"
            placeholder="Search pipelines..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-medium pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-[#f95716]/50 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
