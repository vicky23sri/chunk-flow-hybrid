import React from 'react';
import { Database, Cloud, Sparkles } from 'lucide-react';

export default function NodeLibrarySidebar({ onDragStart, onCreateNode }) {
  return (
    <div className="lg:col-span-3 col-span-12 bg-slate-50/60 p-4 sm:p-5 border-r border-b lg:border-b-0 border-slate-200/80 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h3 className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
            Node Library
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-normal">
            Drag nodes onto canvas or click to add:
          </p>
        </div>

        {/* Draggable Database Source Node */}
        <div className="space-y-3">
          <div>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-blue-600 uppercase mb-1.5 flex items-center gap-1.5 tracking-tight">
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" /> 1. Database (Source)
            </span>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, 'source', 'postgres')}
              onClick={() => onCreateNode('source', 'postgres')}
              className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-500/60 hover:shadow-md transition-all cursor-grab active:cursor-grabbing text-left flex items-center gap-3 shadow-xs group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                <Database size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  Database Source
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 font-normal truncate">
                  Relational Database Connection
                </div>
              </div>
            </div>
          </div>

          {/* Draggable Amazon S3 Destination Node */}
          <div>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-emerald-600 uppercase mb-1.5 flex items-center gap-1.5 tracking-tight">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> 2. Amazon S3 (Destination)
            </span>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, 'destination', 's3')}
              onClick={() => onCreateNode('destination', 's3')}
              className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/60 hover:shadow-md transition-all cursor-grab active:cursor-grabbing text-left flex items-center gap-3 shadow-xs group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <Cloud size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                  Amazon S3 Vault
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 font-normal truncate">
                  AWS S3 Cloud Storage
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Instructions Box */}
      <div className="mt-5 bg-white border border-slate-200 p-3 sm:p-3.5 rounded-2xl text-xs space-y-1.5 text-slate-600 shadow-xs">
        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#f95716] shrink-0" /> Instructions:
        </div>
        <ul className="space-y-1 text-[10px] sm:text-[11px] list-disc list-inside font-normal text-slate-500 leading-snug">
          <li>Drag or click nodes to add.</li>
          <li>Click <strong className="text-blue-600 font-bold">Blue dot</strong> on DB, then <strong className="text-emerald-600 font-bold">Green dot</strong> on S3 to wire.</li>
          <li>Click nodes to configure settings.</li>
        </ul>
      </div>
    </div>
  );
}
