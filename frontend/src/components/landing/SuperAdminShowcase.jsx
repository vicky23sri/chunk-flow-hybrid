import React from 'react';
import { Crown, ShieldCheck, Database, Globe, CheckCircle2, ArrowRight, Server, Activity } from 'lucide-react';

export default function SuperAdminShowcase({ onQuickLogin }) {
  return (
    <section className="w-full bg-slate-950 text-white py-20 px-3 border-y border-slate-800/80 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Column: Storytelling & Key Points */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Crown size={14} />
              <span>Central Operations & System Control</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
              Unified Super Admin.<br />
              <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500 bg-clip-text text-transparent">
                Full System Visibility & Control.
              </span>
            </h2>

            <p className="text-base text-slate-300 leading-relaxed font-normal">
              Root administrative control panel to manage global tenant registries, monitor PostgreSQL database clusters, configure domain mappings, and provision isolated tenant workspaces.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Centralized Tenant Registry</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Manage all tenant organization records and mapped domains in central storage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Live Database Cluster Telemetry</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Monitor active database connection pool health, query latency, and physical storage usage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Automated Migration Engine</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Trigger automated DDL migration runs across tenant physical databases with single-click actions.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => onQuickLogin('superadmin', 'superadmin@chunkflow.com', 'admin123', true)}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition-all cursor-pointer"
              >
                <Crown size={16} />
                <span>Launch Super Admin Portal</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Right Column: Product Showcase Card */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-100">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
                  <span className="text-xs font-mono text-slate-400 ml-2">Super Admin Control Plane</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950 border border-indigo-800 px-2.5 py-0.5 rounded font-bold">
                  ROOT PRIVILEGES
                </span>
              </div>

              {/* Dashboard Mockup Content */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Tenants</div>
                    <div className="text-xl font-black text-white">3 Workspaces</div>
                    <div className="text-[10px] text-indigo-400 font-mono mt-1">● Active Telemetry</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Central Target</div>
                    <div className="text-xl font-black text-white">Central System</div>
                    <div className="text-[10px] text-indigo-400 font-mono mt-1">● Master Registry</div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-400 font-mono text-[11px] border-b border-slate-800/80 pb-2">
                    <span>MAPPED DOMAIN</span>
                    <span>PHYSICAL DB INSTANCE</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-200 font-mono text-[11px]">
                    <span className="text-indigo-400 font-bold">willsparrow.localhost</span>
                    <span className="text-slate-300">chunkflow_tenant_willsparrow</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-200 font-mono text-[11px]">
                    <span className="text-indigo-400 font-bold">acme.localhost</span>
                    <span className="text-slate-300">chunkflow_tenant_acme</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-200 font-mono text-[11px]">
                    <span className="text-indigo-400 font-bold">globex.localhost</span>
                    <span className="text-slate-300">chunkflow_tenant_globex</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-indigo-300 flex items-center justify-between font-mono">
                <span>Super Admin Status: Authenticated</span>
                <span className="text-indigo-400 font-bold flex items-center gap-1">
                  <Activity size={13} /> 100% System Telemetry
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
