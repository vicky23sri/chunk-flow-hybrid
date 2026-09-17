import React from 'react';
import { Database, Cloud, Sparkles } from 'lucide-react';

export default function NodeLibrarySidebar({ onDragStart, onCreateNode }) {
  return (
    <div className="lg:col-span-2 bg-slate-50/60 p-6 border-r border-slate-200/80 flex flex-col justify-between overflow-y-auto">
      <div>
        <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
          Node Library
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-4 font-normal">
          Drag nodes onto the canvas or click to add:
        </p>

        {/* Draggable PostgreSQL Source Node */}
        <div className="space-y-4">
          <div>
            <span className="text-[11px] font-mono font-bold text-blue-600 uppercase block mb-1.5 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" /> 1. PostgreSQL (Source)
            </span>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, 'source', 'postgres')}
              onClick={() => onCreateNode('source', 'postgres')}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500/60 hover:shadow-md transition-all cursor-grab active:cursor-grabbing text-left flex items-center gap-3 shadow-xs group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                <Database size={17} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  PostgreSQL Database
                </div>
                <div className="text-[11px] text-slate-500 font-normal">Select from tenant DB list</div>
              </div>
            </div>
          </div>

          {/* Draggable Amazon S3 Destination Node */}
          <div>
            <span className="text-[11px] font-mono font-bold text-emerald-600 uppercase block mb-1.5 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 2. Amazon S3 (Destination)
            </span>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, 'destination', 's3')}
              onClick={() => onCreateNode('destination', 's3')}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/60 hover:shadow-md transition-all cursor-grab active:cursor-grabbing text-left flex items-center gap-3 shadow-xs group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <Cloud size={17} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Amazon S3 Vault
                </div>
                <div className="text-[11px] text-slate-500 font-normal">AWS S3 Cloud Storage</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Instructions Box */}
      <div className="mt-6 bg-white border border-slate-200 p-4 rounded-2xl text-xs space-y-2 text-slate-600 shadow-xs">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#f95716]" /> Connection Instructions:
        </div>
        <ul className="space-y-1.5 text-[11px] list-disc list-inside font-normal text-slate-500">
          <li>Drag nodes from sidebar onto canvas.</li>
          <li>Click <strong className="text-blue-600 font-bold">Blue dot</strong> on DB node, then click <strong className="text-emerald-600 font-bold">Green dot</strong> on S3 node to draw wire.</li>
          <li>Click nodes to configure connection settings in Inspector.</li>
        </ul>
      </div>
    </div>
  );
}
