import React from 'react';
import { Database, Globe, Crown, Layers, Cloud, ShieldCheck, Zap, Server, Lock } from 'lucide-react';

export default function AWSCloudFeatures() {
  const features = [
    {
      icon: Database,
      title: 'Database-per-Tenant Isolation',
      description: 'Each registered tenant organization resides in an isolated PostgreSQL database, ensuring strict physical data boundaries.',
    },
    {
      icon: Cloud,
      title: 'AWS S3 Chunk Storage Engine',
      description: 'Payloads and document blobs are sliced into 64KB/1MB encrypted chunks and streamed directly to AWS S3 bucket partitions.',
    },
    {
      icon: Globe,
      title: 'Domain Resolution Tenancy',
      description: 'Central domain registry resolves incoming host domains directly to tenant UUIDs and database connection contexts.',
    },
    {
      icon: Crown,
      title: 'Super Admin Control Board',
      description: 'Central administrative dashboard providing root visibility into tenant provisioning, domain registries, and live database telemetry.',
    },
    {
      icon: Lock,
      title: 'AES-256 Per-Tenant Encryption',
      description: 'Data chunks are encrypted with tenant-specific keys before being written to cloud object storage for zero-trust privacy compliance.',
    },
    {
      icon: Zap,
      title: 'High-Throughput Parallel Uploads',
      description: 'Concurrent multipart chunk streaming maximizes network bandwidth while guaranteeing end-to-end checksum verification on AWS S3.',
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          Built for High-Scale Multi-Tenant Data Systems
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 tracking-tight">
          Enterprise Multi-Tenant Architecture
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-lg mx-auto">
          Combining PostgreSQL database physical isolation with AWS S3 chunk storage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, idx) => {
          const IconComponent = feat.icon;
          return (
            <div 
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                  <IconComponent size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">{feat.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
