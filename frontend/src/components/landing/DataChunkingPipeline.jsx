import React from 'react';
import { Cpu, Cloud, Layers, CheckCircle2 } from 'lucide-react';
import smartSlicingImg from '../../assets/feature_smart_slicing_iso_1789622101138.png';

export default function DataChunkingPipeline() {
  return (
    <section className="w-full bg-white py-16 text-slate-900 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Isometric 3D Artwork (No background frame/box) */}
          <div className="lg:col-span-6 relative flex justify-center items-center order-2 lg:order-1">
            <img
              src={smartSlicingImg}
              alt="ChunkFlow FastCDC Slicing Engine"
              className="w-full max-w-lg h-auto object-contain hover:scale-[1.03] transition-transform duration-500 drop-shadow-md"
            />
          </div>

          {/* Right Column: Text & Features */}
          <div className="lg:col-span-6 flex flex-col text-left order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#f95716] text-xs font-mono font-bold tracking-wider uppercase mb-5 self-start">
              <span>FASTCDC ENGINE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 leading-tight mb-4">
              Content-Defined Chunking <br />
              & AWS S3 Vault
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-xl">
              Slice database snapshot dumps into deduplicated variable chunks with SHA-256 integrity checksum verification before uploading to AWS S3 storage.
            </p>

            {/* Sub-Features Grid (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="flex flex-col text-left">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-[#f95716] flex items-center justify-center mb-3">
                  <Cpu size={18} />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-1">
                  FastCDC Deduplication
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Eliminate duplicate data blocks across database snapshot versions automatically.
                </p>
              </div>

              <div className="flex flex-col text-left">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-[#f95716] flex items-center justify-center mb-3">
                  <Cloud size={18} />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-1">
                  S3 Stream Assembly
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Reconstruct full <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-bold">sql.dump</code> files directly from S3 chunks on demand.
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
