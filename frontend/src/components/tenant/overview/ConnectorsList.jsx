import React from 'react';
import { Database, Plug, ArrowRight } from 'lucide-react';

export default function ConnectorsList({ connectors, onViewAll, onAddConnector }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900">Connectors</h3>
          <p className="text-xs text-slate-500">Active data sources</p>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-bold text-[#f95716] hover:text-orange-600 transition-colors cursor-pointer"
        >
          View All <ArrowRight size={13} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[300px] p-2 space-y-1">
        {connectors.length > 0 ? (
          connectors.map((conn) => (
            <div key={conn.id || conn.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Database size={18} />
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="text-sm font-bold text-slate-900 truncate">{conn.name}</h4>
                <p className="text-xs text-slate-500 truncate">{conn.type || 'PostgreSQL DB'}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Connected"></span>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 mt-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Plug size={20} />
            </div>
            <p className="text-sm font-black text-slate-900">No Data Sources</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">Connect a database to start extracting data</p>
            <button 
              onClick={onAddConnector}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              Add Connector
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
