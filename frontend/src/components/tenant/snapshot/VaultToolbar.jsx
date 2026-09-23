import React from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';

export default function VaultToolbar({
  selectedTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  totalCount,
}) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
      {/* Tab Filter Pills */}
      {/* <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider mr-1">Vault View:</span>
        <button
          onClick={() => onSelectTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
            selectedTab === 'all'
              ? 'bg-[#f95716] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Pipelines ({totalCount})
        </button>
        <button
          onClick={() => onSelectTab('deployed')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
            selectedTab === 'deployed'
              ? 'bg-[#f95716] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Deployed Live Streams
        </button>
      </div> */}

      {/* Search Box */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search pipeline, host or database..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium pl-9 pr-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-[#f95716] transition-all shadow-xs"
          />
        </div>
      </div>
    </div>
  );
}
