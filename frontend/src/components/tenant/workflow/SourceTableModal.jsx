import React, { useState } from 'react';
import { Database, HardDrive, Table, CheckCircle2, Search, X, Check, Layers, Cpu } from 'lucide-react';

export default function SourceTableModal({
  isOpen,
  onClose,
  dbDetails,
  onConfirmSelection,
}) {
  if (!isOpen || !dbDetails) return null;

  const tables = dbDetails.tables || [];
  const databaseName = dbDetails.database || 'PostgreSQL DB';
  const totalDbSize = dbDetails.total_db_size || '0 kB';
  const latencyMs = dbDetails.latency_ms || 12;

  const [selectedTables, setSelectedTables] = useState(() =>
    tables.map((t) => t.name)
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTable = (tableName) => {
    setSelectedTables((prev) =>
      prev.includes(tableName)
        ? prev.filter((name) => name !== tableName)
        : [...prev, tableName]
    );
  };

  const selectAll = () => {
    setSelectedTables(tables.map((t) => t.name));
  };

  const deselectAll = () => {
    setSelectedTables([]);
  };

  const handleConfirm = () => {
    if (onConfirmSelection) onConfirmSelection(selectedTables);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left">
        
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 opacity-10 pointer-events-none">
            <Database size={180} />
          </div>

          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold tracking-wider uppercase">
                <CheckCircle2 size={12} className="text-emerald-400" /> Connection Verified
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-medium">
                Ping {latencyMs}ms
              </span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Source Database Schema & Tables
            </h3>
            <p className="text-xs text-slate-300 font-mono">
              Source Database Target: <strong className="text-blue-300">{databaseName}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer relative z-10"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Summary Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 p-5 bg-slate-50 border-b border-slate-200/80">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <HardDrive size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Total Size</span>
              <span className="text-base font-black text-slate-900 tracking-tight">{totalDbSize}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
              <Table size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Tables Found</span>
              <span className="text-base font-black text-slate-900 tracking-tight">{tables.length} Tables</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <Cpu size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Selected</span>
              <span className="text-base font-black text-emerald-600 tracking-tight">
                {selectedTables.length} / {tables.length}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search source tables..."
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 font-medium outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold transition-colors cursor-pointer"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold transition-colors cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Interactive Table List Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2 max-h-[340px] bg-slate-50/50">
          {filteredTables.length > 0 ? (
            filteredTables.map((t) => {
              const isChecked = selectedTables.includes(t.name);
              return (
                <div
                  key={t.name}
                  onClick={() => toggleTable(t.name)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isChecked
                      ? 'bg-white border-blue-500/80 ring-2 ring-blue-500/10 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 bg-slate-50'
                      }`}
                    >
                      {isChecked && <Check size={13} />}
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                      <Layers size={15} />
                    </div>

                    <div>
                      <h5 className="font-mono font-bold text-xs text-slate-900 leading-snug">
                        {t.name}
                      </h5>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Estimated Rows: <strong className="text-slate-700">{t.rows ?? 0}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs text-slate-700 font-bold">
                      {t.size || '16 kB'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              No database tables match "{searchQuery}"
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Selected <strong className="text-slate-900">{selectedTables.length}</strong> table(s) for FastCDC backup flow
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-[#f95716] hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>Confirm & Apply Selection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
