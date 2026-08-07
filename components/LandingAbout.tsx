
import React, { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { TypewriterSequence } from './TypewriterSequence';
import connectImg from '../src/assets/images/connect.png';

export const LandingAbout = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full py-24 sm:py-32 px-4 sm:px-6 bg-[#FAF6E8] relative overflow-hidden" ref={containerRef}>
      {/* Background Connect.png Image */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img 
          src={connectImg} 
          alt="" 
          className="w-full h-full object-cover object-center opacity-90" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6E8]/30 via-transparent to-[#FAF6E8]/30" />
      </div>

      {/* Soft Mauve Golden Hour Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#E0B0FF]/20 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="max-w-7xl mx-auto w-full relative z-10">

        {/* Modern Deconstructed Heading */}
        <div className="mb-20 sm:mb-28 flex flex-col items-center text-center">
          <span
            className="text-xs tracking-[0.25em] font-bold uppercase text-zinc-950 bg-[#E0B0FF]/40 border border-[#E0B0FF]/60 px-4 py-1.5 rounded-full mb-5 shadow-xs"
          >
            Our Mission
          </span>
          <h2 
            className="text-5xl sm:text-7xl md:text-8xl font-black text-zinc-900 leading-[1.0] tracking-tight font-sans"
          >
            Pitching, <span className="italic font-serif font-light text-[#FFBF00]">Evolved.</span>
          </h2>
        </div>

        {/* Improved Bento-grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Main Prop */}
          <div 
            className="lg:col-span-2 p-6 sm:p-10 md:p-14 bg-white/70 backdrop-blur-md border border-amber-200/60 shadow-[0_8px_32px_0_rgba(207,181,59,0.08)] rounded-[2.5rem] flex flex-col justify-between min-h-[240px] sm:min-h-[320px] lg:min-h-[380px]"
          >
            <TypewriterSequence 
              className="font-serif text-xl sm:text-3xl md:text-5xl font-light text-zinc-900 leading-[1.15] tracking-tight mb-6 sm:mb-12 block"
              disableAnimation
              segments={[
                { text: "We believe the strongest partnerships start with " },
                { text: "instant alignment", className: "text-[#FFBF00] font-normal italic" },
                { text: ", not endless cold emails. We are redefining how founders tell their stories and how investors deploy capital." }
              ]}
            />
            <div className="h-[1px] w-20 bg-gradient-to-r from-[#FFBF00] to-[#CFB53B]" />
          </div>

          {/* Aesthetic Element */}
          <div 
            className="relative aspect-[16/10] sm:aspect-video lg:aspect-auto lg:h-full bg-white border border-amber-200/60 shadow-[0_8px_32px_0_rgba(207,181,59,0.08)] rounded-[2.5rem] overflow-hidden min-h-[200px] sm:min-h-[280px] lg:min-h-[380px] group/img"
          >
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80" 
              className="w-full h-full object-cover opacity-95 group-hover/img:opacity-100 transition-all duration-500 group-hover/img:scale-105"
              alt="Founders Meeting"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Features */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-6">
            {[
              { 
                bg: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800"
              },
              { 
                bg: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=800"
              }
            ].map((item, i) => (
              <div 
                key={i}
                className="p-10 rounded-[2.5rem] border backdrop-blur-md transition-all duration-500 bg-zinc-950 border-zinc-900 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] text-white relative overflow-hidden group min-h-[220px]"
              >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={item.bg} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
