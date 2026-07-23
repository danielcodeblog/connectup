import React, { useRef } from 'react';
import { TypewriterSequence } from './TypewriterSequence';

export const LandingWhy = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full py-24 sm:py-32 px-4 sm:px-6 bg-[#FDFBF2]" ref={containerRef}>
      <div className="max-w-7xl mx-auto w-full">
        {/* Modern Deconstructed Heading */}
        <div className="mb-20 sm:mb-28 flex flex-col items-center text-center">
          <span
            className="text-xs tracking-[0.25em] font-bold uppercase text-[#EAB308] mb-5"
          >
            Why ConnectUp
          </span>
          <h2 
            className="text-5xl sm:text-7xl md:text-8xl font-black text-zinc-900 leading-[1.0] tracking-tight font-sans"
          >
            Connection, <span className="italic font-serif font-light text-[#EAB308]">Evolved.</span>
          </h2>
        </div>

        {/* Improved Bento-grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Main Prop */}
          <div 
            className="lg:col-span-3 p-6 sm:p-10 md:p-14 bg-[#FAF9F5]/80 backdrop-blur-md border border-zinc-100 shadow-[0_8px_32px_0_rgba(148,163,184,0.08)] rounded-[2.5rem] flex flex-col justify-between min-h-[240px] sm:min-h-[320px] lg:min-h-[380px]"
          >
            <p className="font-serif text-xl sm:text-3xl md:text-5xl font-light text-zinc-900 leading-[1.15] tracking-tight mb-6 sm:mb-12 block">
              Founder fatigue is real. Investor noise is deafening. ConnectUp bridges that gap by transforming{' '}
              <TypewriterSequence 
                className="text-[#EAB308] font-normal italic inline"
                speed={35}
                delay={400}
                segments={[
                  { text: "passive browsing" }
                ]}
              />
              {' '}into high-signal engagement.
            </p>
            <div className="h-[1px] w-20 bg-[#EAB308]/40" />
          </div>
        </div>
      </div>
    </div>
  );
};
