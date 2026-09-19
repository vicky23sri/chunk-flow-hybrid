import React from 'react';
import { Sparkles, CheckCircle2, ChevronRight, Database, Cpu, Zap, Layers, Lock, ShieldCheck } from 'lucide-react';
import heroEngineImg from '../../assets/hero_isometric_engine_1789622042928.png';
import multiTenantImg from '../../assets/feature_multi_tenant_iso_1789622083140.png';
import smartSlicingImg from '../../assets/feature_smart_slicing_iso_1789622101138.png';

export default function AutoControlShowcase({ onQuickLogin }) {
  const cards = [
    {
      id: '01',
      tag: 'PHYSICAL ISOLATION',
      icon: Lock,
      title: 'Dedicated Tenant Databases',
      subtitle: 'PostgreSQL-per-Tenant Engine',
      desc: 'Automatic physical PostgreSQL database provisioning for each workspace tenant instance with zero cross-tenant data bleed.',
      highlights: [
        'Dedicated PostgreSQL DB (chunkflow_tenant_<id>)',
        'Automatic Routing via Central Registry',
        'Guaranteed Zero Cross-Tenant Data Leakage',
      ],
      metrics: '100% Isolated',
      image: multiTenantImg,
      alt: 'Physical Database Isolation Architecture',
    },
    {
      id: '02',
      tag: 'STREAM ENGINE',
      icon: Cpu,
      title: 'FastCDC Stream Slicing',
      subtitle: 'Content-Defined Chunking & Hash',
      desc: 'Database snapshot dumps are sliced into dynamic variable blocks with per-chunk SHA-256 integrity verification before S3 streaming.',
      highlights: [
        'FastCDC Content-Defined Chunking Engine',
        'SHA-256 Per-Chunk Hash Integrity Checks',
        'Direct AWS S3 sql.dump Stream Vaulting',
      ],
      metrics: '4.8x Deduplication',
      image: smartSlicingImg,
      alt: 'FastCDC Slicing Engine Architecture',
    },
    {
      id: '03',
      tag: 'SCALE PIPELINES',
      icon: Zap,
      title: 'Sub-ms Execution Speed',
      subtitle: 'Go 1.22 Runtime Connection Pool',
      desc: 'High-frequency concurrent tenant routing powered by lightweight Go goroutines and dynamic RWMutex database connection pools.',
      highlights: [
        'Dynamic RWMutex PostgreSQL Connection Pool',
        'Auto-Scaling Concurrent Tenant Workspaces',
        'Go 1.22 High-Throughput Engine Core',
      ],
      metrics: 'Sub-ms Latency',
      image: heroEngineImg,
      alt: 'At-Scale Multi-Tenant Engine Architecture',
    },
  ];

  return (
    <section className="w-full bg-[#08080a] text-white py-24 relative overflow-hidden border-y border-slate-800/80">

      {/* Top Edge Glowing Orange Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f95716] to-transparent opacity-90" />

      {/* Background Radial Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#f95716]/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 relative z-10">

        {/* Centered Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#f95716] text-xs font-mono font-bold tracking-wider uppercase mb-5 backdrop-blur-md shadow-lg shadow-orange-500/5">
            <Sparkles size={14} className="animate-pulse" />
            <span>HIGH PERFORMANCE ARCHITECTURE</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-4">
            Engineered for Absolute <br />
            <span className="bg-gradient-to-r from-[#f95716] via-orange-400 to-amber-300 bg-clip-text text-transparent">
              Isolation & Speed.
            </span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-normal max-w-2xl mx-auto">
            Explore the core technology driving real-time physical database routing, variable-length chunk deduplication, and zero-trust multi-tenancy.
          </p>
        </div>

        {/* 3 Premium Visual Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                className="group relative rounded-3xl bg-[#08090d] border border-slate-800/90 hover:border-[#f95716]/80 transition-all duration-500 shadow-2xl hover:shadow-[0_20px_50px_rgba(249,87,22,0.25)] overflow-hidden h-[520px] flex flex-col justify-between backdrop-blur-xl cursor-pointer"
              >
                {/* 1. FULL CARD IMAGE LAYER */}
                <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
                  {/* Base Image */}
                  <img
                    src={card.image}
                    alt={card.alt}
                    className="w-full h-full object-cover filter brightness-[0.95] group-hover:brightness-[0.4] group-hover:scale-110 transition-all duration-700 ease-out"
                  />

                  {/* Dark Vignette Overlay Effect (Fades in on Hover) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

                  {/* Subtle Top Glowing Line on Hover */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f95716] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
                </div>

                {/* 2. DEFAULT STATE: Minimal Floating Badge Indicator (Fades out on Hover) */}
                <div className="absolute bottom-4 right-4 z-10 opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-slate-300 text-[11px] font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#f95716] animate-ping" />
                    <span>Hover for details</span>
                  </div>
                </div>

                {/* 3. HOVER STATE: Sleek Slide-Up Glassmorphic Content Sheet */}
                <div className="absolute inset-0 z-20 p-5 sm:p-6 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none group-hover:pointer-events-auto transform translate-y-6 group-hover:translate-y-0">

                  {/* Top Badges Header */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#f95716] text-xs font-mono font-bold border border-white/15 backdrop-blur-md shadow-md">
                      <IconComponent size={14} />
                      <span>{card.id}</span>
                      <span className="text-slate-500">•</span>
                      <span>{card.tag}</span>
                    </div>

                    <span className="text-xs font-mono font-bold bg-[#f95716]/20 text-orange-400 border border-[#f95716]/40 px-3 py-1 rounded-full shadow-md backdrop-blur-md">
                      {card.metrics}
                    </span>
                  </div>

                  {/* Middle Content Box (Glass Container) */}
                  <div className="bg-[#0b0c10]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl my-auto space-y-3">

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                        {card.title}
                      </h3>
                      <div className="text-[#f95716] text-xs font-semibold tracking-wide mt-0.5">
                        {card.subtitle}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-300 text-xs leading-relaxed font-normal">
                      {card.desc}
                    </p>

                    {/* Feature Bullet Points */}
                    <div className="space-y-1.5 pt-1">
                      {card.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-slate-200 font-medium leading-tight">
                          <CheckCircle2 size={13} className="text-[#f95716] shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action CTA Button */}
                  <button
                    onClick={() => onQuickLogin && onQuickLogin('acme', 'admin@acme.com', 'admin123')}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#f95716] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-[0.99]"
                  >
                    <span>Explore Tenant Architecture</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>

                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}











