import React from 'react';
import { Database, Globe, ShieldCheck } from 'lucide-react';
import multiTenantImg from '../../assets/feature_multi_tenant_iso_1789622083140.png';

export default function DomainRoutingArchitecture() {
  return (
    <section className="w-full bg-white py-16 text-slate-900 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Text & Features */}
          <div className="lg:col-span-6 flex flex-col text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#f95716] text-xs font-mono font-bold tracking-wider uppercase mb-5 self-start">
              <span>DATABASE-PER-TENANT</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 leading-tight mb-4">
              Physical Database-per-Tenant <br />
              Isolation Strategy
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-xl">
              Central <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-bold">chunkflow_central</code> database manages global registries while automatically routing queries to isolated <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-bold">chunkflow_tenant_&lt;id&gt;</code> databases.
            </p>

            {/* Sub-Features Grid (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              <div className="flex flex-col text-left">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-[#f95716] flex items-center justify-center mb-3">
                  <Database size={18} />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-1">
                  Physical DB Isolation
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Dedicated PostgreSQL databases created dynamically with isolated connection pools.
                </p>
              </div>

              <div className="flex flex-col text-left">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-[#f95716] flex items-center justify-center mb-3">
                  <Globe size={18} />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-1">
                  Dynamic Subdomain Router
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Inspects host headers to automatically route tenant traffic with zero overhead.
                </p>
              </div>

            </div>

          </div>

          {/* Right Column: Isometric 3D Artwork (No background frame/box) */}
          <div className="lg:col-span-6 relative flex justify-center items-center">
            <img
              src={multiTenantImg}
              alt="ChunkFlow Database-per-Tenant Architecture"
              className="w-full max-w-lg h-auto object-contain hover:scale-[1.03] transition-transform duration-500 drop-shadow-md"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
