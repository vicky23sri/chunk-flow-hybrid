import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import heroEngineImg from '../../assets/hero_isometric_engine_1789622042928.png';

export default function CallToAction() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
    }
  };

  return (
    <section className="w-full bg-white text-slate-900">
      <div className="bg-[#f95716] text-white p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl shadow-orange-500/20">
        {/* Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight mb-4">
          Start Building with Better <br className="hidden sm:block" />
          Data Today
        </h2>

        {/* Description */}
        <p className="text-orange-100 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed mb-8 font-normal">
          Deploy isolated tenant workspaces in seconds with automated physical database partitioning and cloud stream chunking.
        </p>

        {/* Email Subscription Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex items-center bg-white rounded-full p-1.5 shadow-xl">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-transparent border-0 px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            required
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-slate-950 text-white font-bold text-xs tracking-wider uppercase hover:bg-slate-800 transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            {subscribed ? 'Subscribed!' : 'Subscribe'}
          </button>
        </form>

      </div>
    </section>
  );
}
