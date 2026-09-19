import React from 'react';
import { Cpu } from 'lucide-react';

export default function FooterSection() {
  return (
    <footer className="w-full bg-[#0c0c0c] text-white pt-16 pb-0 border-t border-slate-800 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 text-left">

          {/* Col 1: Brand & Contact Email */}
          <div className="md:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-[#f95716] text-white flex items-center justify-center font-bold shadow-md">
                  <Cpu size={20} />
                </div>
                <span className="text-xl font-black tracking-tight text-white">ChunkFlow</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-normal mb-8">
                Enterprise Multi-Tenant SaaS Engine with automated PostgreSQL physical database isolation & Cloud S3 payload chunking.
              </p>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">DIRECT INQUIRIES</div>
              <a href="mailto:HELLO@CHUNKFLOW.COM" className="text-2xl sm:text-3xl font-black text-white hover:text-[#f95716] transition-colors tracking-tight">
                HELLO@CHUNKFLOW.COM
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links Grid */}
          <div className="md:col-span-6 grid grid-cols-3 gap-6 pt-2">
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-4">About</h4>
              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li><a href="#engine" className="hover:text-[#f95716] transition-colors">Engine</a></li>
                <li><a href="#tenants" className="hover:text-[#f95716] transition-colors">Multi-Tenancy</a></li>
                <li><a href="#security" className="hover:text-[#f95716] transition-colors">Security Specs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-4">Product</h4>
              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li><a href="#slicing" className="hover:text-[#f95716] transition-colors">Chunking Slicer</a></li>
                <li><a href="#domains" className="hover:text-[#f95716] transition-colors">Domain Router</a></li>
                <li><a href="#s3" className="hover:text-[#f95716] transition-colors">S3 Storage Vault</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-4">System</h4>
              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li><a href="#privacy" className="hover:text-[#f95716] transition-colors">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-[#f95716] transition-colors">Terms of Service</a></li>
                <li><a href="#status" className="hover:text-[#f95716] transition-colors">System Telemetry</a></li>
              </ul>
            </div>
          </div>

        </div>

        {/* Copyright strip */}
        <div className="pt-10 mt-10 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-medium gap-4">
          <div>© 2026 ChunkFlow Engine Inc. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#terms" className="hover:text-slate-300">Terms of Service</a>
            <a href="#cookies" className="hover:text-slate-300">Cookie Settings</a>
          </div>
        </div>
      </div>

      {/* Massive Bold Orange Watermark Banner across the bottom */}
      <div className="w-full overflow-hidden bg-[#f95716] py-3 text-center pointer-events-none select-none">
        <div className="text-[9vw] sm:text-[10vw] leading-none font-black tracking-tighter text-white uppercase whitespace-nowrap opacity-95">
          CHUNKFLOW.CHUNKFLOW
        </div>
      </div>
    </footer>
  );
}
