import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, ChevronRight, Lock, Shield, Server, HardDrive } from 'lucide-react';
import heroEngineImg from '../../assets/hero_isometric_engine_1789622042928.png';
import multiTenantImg from '../../assets/feature_multi_tenant_iso_1789622083140.png';
import smartSlicingImg from '../../assets/feature_smart_slicing_iso_1789622101138.png';

export default function EnterpriseSecurity() {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef(null);

  const securityItems = [
    {
      id: '01',
      tabLabel: 'End-to-End Encryption',
      title: 'End-to-end encryption',
      subtitle: '(at rest and in transit)',
      desc: 'Every payload chunk is encrypted both during transfer and while stored using AES-256 keys and SHA-256 checksum integrity verification, keeping it safe at every step.',
      highlights: [
        'Per-Tenant KMS Key Isolation (AES-256)',
        'TLS 1.3 Strict Wire Transport Encryption',
        'SHA-256 Payload Hash Verification',
      ],
      buttonText: 'View security spec',
      image: heroEngineImg,
      alt: 'End-to-End Encryption Architecture',
      badgeIcon: Lock,
    },
    {
      id: '02',
      tabLabel: 'Physical Database Isolation',
      title: 'Physical database isolation',
      subtitle: '(per-tenant PostgreSQL)',
      desc: 'Dedicated PostgreSQL databases provisioned automatically for every tenant with central registry routing and zero cross-tenant data bleed.',
      highlights: [
        'Dedicated PostgreSQL DB (chunkflow_tenant_<id>)',
        'Automatic Central Router (chunkflow_central)',
        'Zero Cross-Tenant Data Bleed Guarantee',
      ],
      buttonText: 'Explore tenant isolation',
      image: multiTenantImg,
      alt: 'Physical Database Isolation Architecture',
      badgeIcon: Server,
    },
    {
      id: '03',
      tabLabel: 'Content-Defined Chunking',
      title: 'Content-defined chunking',
      subtitle: '(FastCDC & S3 Vault)',
      desc: 'Variable stream slicing engine with SHA-256 hash deduplication that streams database snapshot blocks directly to AWS S3 storage.',
      highlights: [
        'FastCDC Content-Defined Chunking Engine',
        'Direct AWS S3 sql.dump Snapshot Assembly',
        'Automated Snapshot Backup Schedules',
      ],
      buttonText: 'Explore chunking engine',
      image: smartSlicingImg,
      alt: 'Content-defined Chunking Engine',
      badgeIcon: HardDrive,
    },
  ];

  // Precise Scroll listener: As user scrolls down through the 300vh section,
  // the sticky container stays pinned while scroll progress smoothly transitions 01 -> 02 -> 03.
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalHeight = containerRef.current.clientHeight;
      const windowHeight = window.innerHeight;

      const scrollableDistance = totalHeight - windowHeight;
      if (scrollableDistance <= 0) return;

      // Scrolled distance from when container top hits top of viewport
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));

      if (progress < 0.33) {
        setActiveStep(0);
      } else if (progress < 0.66) {
        setActiveStep(1);
      } else {
        setActiveStep(2);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Trigger once initial position calculation
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeItem = securityItems[activeStep];

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-white text-slate-900 border-b border-slate-200/80 min-h-[300vh]"
    >
      {/* Sticky Viewport Container: Stays fixed on screen while scrolling through the 300vh height */}
      <div className="sticky top-0 h-screen flex flex-col justify-center max-w-7xl mx-auto px-3 py-8 overflow-hidden">

        {/* Centered Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-6 shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#f95716] text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <Shield size={14} />
            <span>ENTERPRISE ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 leading-tight mb-2">
            Enterprise Grade Security Comes Standard.
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-normal">
            Your data is your asset. We treat it with the highest standards of security and privacy.
          </p>
        </div>

        {/* Step Navigation Pill Bar (01 / 02 / 03) */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 shrink-0">
          {securityItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setActiveStep(index)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 border ${activeStep === index
                  ? 'bg-slate-950 text-white border-slate-950 shadow-md scale-105'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black transition-colors ${activeStep === index ? 'bg-[#f95716] text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                {item.id}
              </span>
              <span>{item.tabLabel}</span>
            </button>
          ))}
        </div>

        {/* Scroll Progress Bar Visual Indicator */}
        <div className="max-w-md mx-auto w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-8 shrink-0">
          <div
            className="h-full bg-[#f95716] transition-all duration-500 ease-out rounded-full"
            style={{ width: `${((activeStep + 1) / 3) * 100}%` }}
          />
        </div>

        {/* Active Showcase Item (Single item visible: hides current when scrolling to next) */}
        <div className="max-w-6xl mx-auto w-full">
          <div
            key={activeItem.id}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center transition-all duration-500 animate-fadeIn"
          >

            {/* Left Column with Vertical Orange Accent Line */}
            <div className="lg:col-span-6 flex flex-col text-left border-l-4 border-[#f95716] pl-6 sm:pl-8 py-2">
              {/* Step Index Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#f95716] text-xs font-mono font-bold w-max mb-4">
                <span>{activeItem.id} / 03</span>
                <span className="text-slate-400">•</span>
                <span>{activeItem.tabLabel}</span>
              </div>

              {/* Headline */}
              <h3 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight mb-3">
                {activeItem.title} <br />
                <span className="text-slate-500 font-semibold text-lg sm:text-2xl">{activeItem.subtitle}</span>
              </h3>

              {/* Paragraph Description */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 font-normal max-w-lg">
                {activeItem.desc}
              </p>

              {/* Highlights List */}
              <div className="space-y-2.5 mb-8">
                {activeItem.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-semibold">
                    <CheckCircle2 size={18} className="text-[#f95716] shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button className="px-6 py-2.5 rounded-xl bg-slate-950 text-white font-bold text-xs sm:text-sm hover:bg-[#f95716] transition-all cursor-pointer self-start shadow-sm flex items-center gap-2 group">
                <span>{activeItem.buttonText}</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right Column: Clean Isometric Image for Active Step */}
            <div className="lg:col-span-6 flex justify-center items-center">
              <div className="relative w-full max-w-lg flex justify-center items-center p-4">
                <img
                  src={activeItem.image}
                  alt={activeItem.alt}
                  className="w-full max-w-md h-auto object-contain hover:scale-[1.03] transition-transform duration-500 drop-shadow-xl"
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

