import React from 'react';
import { ArrowRight, Database, ShieldCheck, Zap, Server } from 'lucide-react';
import heroEngineImg from '../../assets/hero_isometric_engine_1789622042928.png';

export default function HeroSection({ user, superAdmin, isSuperAdmin, onNavigateLogin, onNavigateRegister }) {
  const isLoggedIn = !!(user || superAdmin || isSuperAdmin);

  return (
    <section className="w-full bg-white pt-12 pb-16 text-slate-900 border-b border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Hero Content */}
          <div className="lg:col-span-6 flex flex-col text-left">

            {/* Top Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-bold tracking-wider uppercase mb-6 self-start">
              <span>CHUNKFLOW ENGINE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#f95716]" />
              <span className="text-[#f95716]">GO + FASTCDC</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.08] mb-6">
              Multi-Tenant <br />
              <span className="text-[#f95716]">FastCDC Backup</span> <br />
              Engine
            </h1>

            {/* Subheading */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8 max-w-xl font-normal">
              Content-Defined Chunking (FastCDC), physical database-per-tenant PostgreSQL isolation, and automated AWS S3 deduplicated snapshot streaming.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
              <button
                onClick={onNavigateRegister}
                className="px-7 py-3.5 rounded-full bg-slate-950 text-white font-bold text-xs tracking-wider uppercase hover:bg-[#f95716] transition-all duration-200 shadow-md shadow-slate-900/10 active:scale-[0.98] cursor-pointer flex items-center gap-2"
              >
                <span>
                  {isSuperAdmin || superAdmin
                    ? 'Go to Super Admin'
                    : user
                      ? 'Go to Workspace'
                      : 'Get Started'}
                </span>
                <ArrowRight size={15} />
              </button>

              <button
                onClick={onNavigateLogin}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#f95716] transition-colors cursor-pointer group"
              >
                <span>
                  {isLoggedIn ? 'OPEN ACTIVE WORKSPACE' : 'VIEW SNAPSHOT SPECS'}
                </span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Rating Cards Grid */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200/80 max-w-md">

              <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl flex flex-col justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Deduplication
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-slate-950">4.8x</span>
                  <span className="text-xs text-slate-400 font-bold">Ratio</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-tight mt-1">
                  FastCDC Content-Defined Chunking
                </p>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl flex flex-col justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  DB Isolation
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-slate-950">100%</span>
                  <span className="text-xs text-slate-400 font-bold">Guaranteed</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-tight mt-1">
                  Dedicated PostgreSQL DB per Tenant
                </p>
              </div>

            </div>

          </div>

          {/* Right Column: 3D Isometric Technical Illustration */}
          <div className="lg:col-span-6 relative flex justify-center items-center">
            <div className="relative w-full max-w-lg lg:max-w-none flex justify-center items-center">
              {/* Soft Ambient Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

              {/* Clean Transparent Isometric Artwork (No background frame/box) */}
              <img
                src={heroEngineImg}
                alt="ChunkFlow FastCDC Backup Engine"
                className="w-full max-w-lg h-auto object-contain hover:scale-[1.03] transition-transform duration-500 drop-shadow-lg relative z-10"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
