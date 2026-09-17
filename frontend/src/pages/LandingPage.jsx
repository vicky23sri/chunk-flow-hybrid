import React from 'react';
import HeroSection from '../components/landing/HeroSection';
import TechTicker from '../components/landing/TechTicker';
import OrangeBanner from '../components/landing/OrangeBanner';
import DomainRoutingArchitecture from '../components/landing/DomainRoutingArchitecture';
import DataChunkingPipeline from '../components/landing/DataChunkingPipeline';
import AutoControlShowcase from '../components/landing/AutoControlShowcase';
import EnterpriseSecurity from '../components/landing/EnterpriseSecurity';
import TestimonialSection from '../components/landing/TestimonialSection';
import CallToAction from '../components/landing/CallToAction';
import FooterSection from '../components/landing/FooterSection';

export default function LandingPage({ user, superAdmin, isSuperAdmin, onNavigateLogin, onNavigateRegister, onQuickLogin }) {
  return (
    <div className="w-full min-h-screen bg-white selection:bg-[#f95716] selection:text-white">
      {/* 1. Hero Section — White background, 2-Column, 3D Isometric Engine */}
      <HeroSection 
        user={user}
        superAdmin={superAdmin}
        isSuperAdmin={isSuperAdmin}
        onNavigateLogin={onNavigateLogin} 
        onNavigateRegister={onNavigateRegister} 
      />

      {/* 2. Brand / Tech Logo Marquee Strip — Dark obsidian bar */}
      <TechTicker />

      {/* 3. High Impact Orange Accent Banner */}
      <OrangeBanner />

      {/* 4. Feature Section 1: Seamless Multi-Source Tenant Integration */}
      <DomainRoutingArchitecture />

      {/* 5. Feature Section 2: Smart Data Transformation Engine (Slicing Processor) */}
      <DataChunkingPipeline />

      {/* 6. Feature Section 3: Dark Container "Your Data, Working for You Fast" */}
      <AutoControlShowcase 
        onQuickLogin={onQuickLogin} 
      />

      {/* 7. Feature Section 4: Enterprise Grade Security Comes Standard */}
      <EnterpriseSecurity />

      {/* 8. 5-Star Testimonial Section */}
      <TestimonialSection />

      {/* 9. Vibrant Orange CTA Banner */}
      <CallToAction />

      {/* 10. Dark Footer with Giant Bold Orange Watermark Banner */}
      <FooterSection />
    </div>
  );
}
