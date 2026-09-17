import React, { useState } from 'react';
import {
  Database, Activity, Cloud, Lock, Cpu,
  ShieldCheck, Globe, Sparkles
} from 'lucide-react';

export default function InfiniteMetricsMarquee() {
  const [isPaused, setIsPaused] = useState(false);

  const metrics = [
    {
      stat: '100%',
      title: 'Physical DB Isolation',
      desc: 'Dedicated PostgreSQL Instance',
      badge: 'ZERO BLEED',
      icon: Database,
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconStyle: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      statStyle: 'text-emerald-600',
    },
    {
      stat: '< 0.38 ms',
      title: 'Connection Latency',
      desc: 'Thread-Safe Pool Allocator',
      badge: 'REAL-TIME',
      icon: Activity,
      badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconStyle: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
      statStyle: 'text-indigo-600',
    },
    {
      stat: 'AWS S3',
      title: 'Cloud Partitioning',
      desc: 'Automated Stream Slicing',
      badge: 'S3 BACKED',
      icon: Cloud,
      badgeStyle: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      iconStyle: 'bg-cyan-50 text-cyan-600 border-cyan-200/80',
      statStyle: 'text-cyan-600',
    },
    {
      stat: 'AES-256',
      title: 'Zero-Trust Storage',
      desc: 'Per-Tenant KMS Keys',
      badge: 'ENCRYPTED',
      icon: Lock,
      badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
      iconStyle: 'bg-purple-50 text-purple-600 border-purple-200/80',
      statStyle: 'text-purple-600',
    },
    {
      stat: '64 KB',
      title: 'Payload Slice Engine',
      desc: 'SHA-256 Checksum Slicing',
      badge: 'HIGH-PERF',
      icon: Cpu,
      badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
      iconStyle: 'bg-amber-50 text-amber-600 border-amber-200/80',
      statStyle: 'text-amber-600',
    },
    {
      stat: '99.999%',
      title: 'Platform Uptime SLA',
      desc: 'Enterprise Failover System',
      badge: 'ONLINE',
      icon: ShieldCheck,
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconStyle: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      statStyle: 'text-emerald-600',
    },
    {
      stat: 'Subdomain',
      title: 'Domain Resolution',
      desc: 'Stancl Tenancy Router',
      badge: 'PORTIQ ENGINE',
      icon: Globe,
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
      iconStyle: 'bg-blue-50 text-blue-600 border-blue-200/80',
      statStyle: 'text-blue-600',
    },
    {
      stat: '0% Leak',
      title: 'Row Isolation Guard',
      desc: 'Zero Cross-Tenant Bleed',
      badge: 'VERIFIED',
      icon: Sparkles,
      badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200',
      iconStyle: 'bg-rose-50 text-rose-600 border-rose-200/80',
      statStyle: 'text-rose-600',
    },
  ];

  // Tripled array for seamless infinite looping without gaps
  const duplicatedMetrics = [...metrics, ...metrics, ...metrics];

  return (
    <div className="w-full bg-white py-4 relative overflow-hidden border-y border-slate-200/90 shadow-2xs">
      {/* Soft Fading Edge Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-28 sm:w-40 bg-gradient-to-r from-white via-white/95 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-28 sm:w-40 bg-gradient-to-l from-white via-white/95 to-transparent z-10 pointer-events-none" />

      {/* Single Marquee Track */}
      <div 
        className="flex w-max animate-marquee gap-4 px-4 items-center"
        style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
      >
        {duplicatedMetrics.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="flex items-center gap-3.5 bg-slate-50/90 border border-slate-200/90 hover:border-indigo-400 hover:bg-white px-4 py-2.5 rounded-2xl shrink-0 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 group"
            >
              {/* Icon Capsule */}
              <div className={`w-9 h-9 rounded-xl border ${item.iconStyle} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
                <IconComp size={16} />
              </div>

              {/* Text & Metrics */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-sm font-black font-mono tracking-tight ${item.statStyle}`}>
                    {item.stat}
                  </span>
                  <span className={`text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-md border ${item.badgeStyle}`}>
                    {item.badge}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-950 transition-colors">
                  {item.title}
                </div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                  {item.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
