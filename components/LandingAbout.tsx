
import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export const LandingAbout = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full py-24 sm:py-32 px-4 sm:px-6 bg-[#0B0B0D]" ref={containerRef}>
      <div className="max-w-7xl mx-auto w-full">
        {/* Modern Deconstructed Heading */}
        <div className="mb-20 sm:mb-28 flex flex-col items-center text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs tracking-[0.25em] font-bold uppercase text-[#EAB308] mb-5"
          >
            Our Mission
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-7xl md:text-8xl font-black text-white leading-[1.0] tracking-tight font-sans"
          >
            Pitching, <span className="italic font-serif font-light text-[#EAB308]">Evolved.</span>
          </motion.h2>
        </div>

        {/* Improved Bento-grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Main Prop */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 p-6 sm:p-10 md:p-14 bg-[#161618] rounded-[2rem] border border-white/5 flex flex-col justify-between min-h-[240px] sm:min-h-[320px] lg:min-h-[380px]"
          >
            <p className="font-serif text-xl sm:text-3xl md:text-5xl font-light text-white leading-[1.15] tracking-tight mb-6 sm:mb-12">
              We believe the strongest partnerships start with <span className="text-[#EAB308] font-normal italic">instant alignment</span>, not endless cold emails.
            </p>
            <div className="h-[1px] w-20 bg-[#EAB308]/40" />
          </motion.div>

          {/* Aesthetic Element */}
          <motion.div 
             initial={{ opacity: 0, scale: 0.98 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="relative aspect-[16/10] sm:aspect-video lg:aspect-auto lg:h-full bg-[#161618] rounded-[2rem] overflow-hidden border border-white/5 min-h-[200px] sm:min-h-[280px] lg:min-h-[380px]"
           >
             <img 
               src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=60" 
               className="w-full h-full object-cover opacity-50 hover:opacity-80 transition-all duration-1000 grayscale hover:grayscale-0"
               alt="Founders Meeting"
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8">
               <h4 className="text-lg sm:text-xl font-bold text-white leading-tight font-sans">Scale at the speed of thought.</h4>
             </div>
           </motion.div>

           {/* Features */}
           <div className="lg:col-span-3 grid sm:grid-cols-2 gap-6">
              {[
                { title: "Algorithmic Precision", desc: "Founder fatigue is real. Investor noise is deafening. We bridge that gap by applying algorithmic precision to the venture ecosystem." },
                { title: "Smart Matching", desc: "By instantly matching check sizes, sector expertise, and operational needs, we ensure that every swipe is a potential breakthrough." }
              ].map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  key={i}
                  className={`p-10 rounded-[2rem] border transition-all duration-300 ${i === 1 ? 'bg-[#EAB308] border-transparent text-black' : 'bg-[#161618] border-white/5 text-white'}`}
                >
                  <h3 className={`font-serif text-2xl font-normal mb-4 ${i === 1 ? 'text-black' : 'text-white'}`}>{item.title}</h3>
                  <p className={`leading-relaxed font-light text-sm ${i === 1 ? 'text-black/80' : 'text-zinc-400'}`}>{item.desc}</p>
                </motion.div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
