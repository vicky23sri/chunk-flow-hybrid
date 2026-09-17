import React from 'react';

export default function OrangeBanner() {
  return (
    <section className="w-full bg-[#f95716] text-white py-14 px-4 text-center relative overflow-hidden shadow-inner">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        {/* Top Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-mono font-extrabold tracking-wider uppercase mb-5">
          <span>CHUNK & PARTITION</span>
        </div>

        {/* Main Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight mb-4">
          Chunk, Deduplicate, and Stream All in One Place.
        </h2>

        {/* Description */}
        <p className="text-orange-100 text-xs sm:text-sm max-w-2xl leading-relaxed font-normal opacity-95">
          ChunkFlow automatically provisions physical database boundaries, applies FastCDC content slicing, and streams deduplicated PostgreSQL snapshots directly to AWS S3.
        </p>
      </div>
    </section>
  );
}
