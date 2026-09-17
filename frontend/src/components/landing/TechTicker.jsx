import React from 'react';
import { Database, Server, Cloud, ShieldCheck, Cpu, Layers, Globe, Zap } from 'lucide-react';

export default function TechTicker() {
  const techLogos = [
    { name: 'POSTGRESQL 16', icon: Database },
    { name: 'GO 1.22 FASTCDC', icon: Server },
    { name: 'DATABASE-PER-TENANT', icon: Globe },
    { name: 'AWS S3 STORAGE', icon: Cloud },
    { name: 'GIN + GORM ENGINE', icon: Cpu },
    { name: 'DOCKER CONTAINER', icon: Layers },
    { name: 'SHA-256 CHECKSUM', icon: ShieldCheck },
    { name: 'REACT VITE FRONTEND', icon: Zap },
  ];

  const duplicatedLogos = [...techLogos, ...techLogos, ...techLogos];

  return (
    <div className="w-full bg-[#0c0c0c] py-5 overflow-hidden relative border-y border-slate-800 text-white">
      {/* Soft Fading Edge Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0c0c0c] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0c0c0c] to-transparent z-10 pointer-events-none" />

      {/* Marquee Track */}
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-12 px-6 items-center">
        {duplicatedLogos.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div key={idx} className="flex items-center gap-2.5 shrink-0 opacity-80 hover:opacity-100 transition-opacity cursor-pointer group">
              <IconComp size={16} className="text-[#f95716] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black font-mono tracking-widest text-slate-200 uppercase group-hover:text-white transition-colors">
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
