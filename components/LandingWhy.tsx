import React, { useRef } from 'react';
import foundersImage1 from '../src/assets/images/investors_and_founders_1_1785147760772.jpg';
import foundersImage2 from '../src/assets/images/founders_summit_2_1785147774377.jpg';

export const LandingWhy = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const differentiations = [
    {
      number: "01",
      title: "Founder-Investor Synergy",
      description: "ConnectUp bridges the gap between visionary founders and strategic investors with precision and speed."
    },
    {
      number: "02",
      title: "Algorithmic Matching",
      description: "Our smart matching engine analyzes venture data to surface high-signal connections tailored to your stage and industry."
    },
    {
      number: "03",
      title: "African Tech Ecosystem",
      description: "We are building the premier gateway for capital and innovation across the continent's fastest-growing tech hubs."
    }
  ];

  return (
    <div className="w-full py-16 sm:py-24 px-4 sm:px-8 lg:px-12 bg-white text-zinc-900 relative overflow-hidden" ref={containerRef}>
      {/* Soft Ambient Warm Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FFBF00]/20 rounded-full blur-[150px] pointer-events-none z-0" />
      
      {/* Spread Content Container */}
      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Title */}
        <div className="flex justify-center mb-12 sm:mb-24">
          <h2 className="text-5xl sm:text-7xl md:text-8xl font-display font-black text-center tracking-tighter uppercase [text-shadow:6px_6px_0px_rgba(24,24,27,1)]">
            <span className="text-white">Why</span> <span className="text-[#FACC15]">ConnectUp</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Left Column - 3 Numbered Points */}
          <div className="lg:col-span-5 space-y-10 sm:space-y-14">
            {differentiations.map((item, idx) => (
              <div key={item.number} className="group">
                <div className="flex gap-6 sm:gap-8 items-start">
                  <span className="w-10 h-10 rounded-lg bg-zinc-900 shadow-xl flex items-center justify-center text-yellow-400 font-ibm-mono text-xs font-bold shrink-0">
                    {item.number}
                  </span>
                  <div className="space-y-3">
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-zinc-900 uppercase tracking-tight leading-none">
                      {item.title}
                    </h3>
                    <p className="text-zinc-600 text-sm sm:text-base leading-relaxed font-sans max-w-md">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Large Collage of Investors and Founders Pictures */}
          <div className="lg:col-span-7 relative min-h-[520px] sm:min-h-[640px] w-full flex items-center justify-center pt-8 lg:pt-0">
            
            {/* Card 1: Top Left - Investors & Founders Boardroom Collaboration */}
            <div className="absolute top-0 left-0 sm:left-4 w-64 sm:w-[380px] h-48 sm:h-[270px] rounded-2xl overflow-hidden shadow-xl transform -rotate-4 transition-all duration-500 hover:rotate-0 hover:scale-105 border-4 border-white z-20 bg-white">
              <img 
                src={foundersImage1} 
                alt="Investors and Founders Collaboration"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-white tracking-wide border border-white/20">
                Boardroom Strategy Session
              </div>
            </div>

            {/* Card 2: Top Right - Transatlantic Founders Summit */}
            <div className="absolute top-8 right-0 sm:right-2 w-60 sm:w-[350px] h-44 sm:h-[250px] rounded-2xl overflow-hidden shadow-xl transform rotate-3 transition-all duration-500 hover:rotate-0 hover:scale-105 border-4 border-white z-10 bg-white">
              <img 
                src={foundersImage2} 
                alt="Founders Summit"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-white tracking-wide border border-white/20">
                Founders & VC Partners
              </div>
            </div>

            {/* Card 3: Center Featured - Executive Investor & Founder Meeting */}
            <div className="absolute top-36 sm:top-44 right-4 sm:right-12 w-64 sm:w-[400px] h-48 sm:h-[280px] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] transform -rotate-2 transition-all duration-500 hover:rotate-0 hover:scale-105 border-4 border-white z-30 bg-white">
              <img 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop" 
                alt="Executive Founder & Investor Meeting"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-white tracking-wide border border-white/20">
                Transatlantic Dealroom
              </div>
            </div>

            {/* Card 4: Bottom Left - Operator Team & Tech Leaders */}
            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-8 w-64 sm:w-[390px] h-48 sm:h-[270px] rounded-2xl overflow-hidden shadow-xl transform rotate-4 transition-all duration-500 hover:rotate-0 hover:scale-105 border-4 border-white z-25 bg-white">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop" 
                alt="Operator Team and Tech Leaders"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-white tracking-wide border border-white/20">
                Operator-Led Team
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

