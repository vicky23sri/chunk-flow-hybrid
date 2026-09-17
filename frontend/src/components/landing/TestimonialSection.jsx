import React from 'react';
import { Star } from 'lucide-react';

export default function TestimonialSection() {
  return (
    <section className="w-full bg-white py-16 px-4 text-slate-900 border-b border-slate-200/80">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        
        {/* 5 Stars */}
        <div className="flex items-center gap-1.5 text-[#f95716] mb-6">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={18} fill="currentColor" stroke="none" />
          ))}
        </div>

        {/* Large Quote */}
        <blockquote className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight leading-snug mb-8">
          “ChunkFlow has completely changed the way we work with multi-tenant data. What used to take weeks now takes minutes.”
        </blockquote>

        {/* Customer Profile */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-900 to-indigo-900 text-white flex items-center justify-center font-bold text-xs font-mono uppercase shadow-md">
            WS
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-slate-900 leading-tight">Will Sparrow</div>
            <div className="text-xs text-slate-500 font-medium">Head of Data Systems @ Vault Platform</div>
          </div>
        </div>

      </div>
    </section>
  );
}
