
import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export const LandingAbout = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full py-20 sm:py-32 px-4 sm:px-6 overflow-hidden" ref={containerRef}>
      <div className="max-w-7xl mx-auto w-full">
        {/* Editorial Heading */}
        <div className="mb-24 sm:mb-32 text-center md:text-left">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-[900] text-white leading-[0.95] tracking-tighter"
          >
            Pitching, <br />
            <span className="italic font-display font-light text-[#EAB308]">Evolved.</span>
          </motion.h2>
        </div>

        {/* Narrative Grid */}
        <div className="grid lg:grid-cols-12 gap-12 sm:gap-20 items-start mb-32">
          <div className="lg:col-span-7 space-y-12">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-5xl font-medium text-white/95 leading-[1.1] tracking-tight"
            >
              We believe the strongest partnerships start with <span className="text-[#EAB308]">instant alignment</span>, not endless cold emails.
            </motion.p>
            
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 pt-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex-1 space-y-4"
              >
                <div className="h-[1px] w-12 bg-[#EAB308]" />
                <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed font-light">
                  Founder fatigue is real. Investor noise is deafening. ConnectUp was built to bridge that gap by applying algorithmic precision to the venture ecosystem.
                </p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex-1 space-y-4"
              >
                <div className="h-[1px] w-12 bg-[#EAB308]" />
                <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed font-light">
                  By instantly matching check sizes, sector expertise, and operational needs, we ensure that every swipe is a potential breakthrough.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Side Aesthetic Element */}
          <div className="lg:col-span-5 relative mt-20 lg:mt-0">
             <motion.div 
               initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
               whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
               viewport={{ once: true }}
               className="relative z-10 bg-white/5 lg:backdrop-blur-md border border-white/10 p-2 rounded-[3rem] shadow-2xl"
             >
                <div className="aspect-[4/5] bg-zinc-900 rounded-[2.5rem] overflow-hidden relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=60" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-all duration-1000"
                    alt="Founders Meeting"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-10 flex flex-col justify-end">
                    <div className="text-[#EAB308] font-black text-xs tracking-widest uppercase mb-2">Since 2024</div>
                    <h4 className="text-3xl font-black text-white mb-2 leading-tight">Scale at the speed of thought.</h4>
                    <p className="text-zinc-400 text-sm font-light">Join 2,400+ funded companies globally.</p>
                  </div>
                </div>
             </motion.div>
             {/* Decorative Elements - Reduced blur on mobile */}
             <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#EAB308]/10 blur-3xl rounded-full" />
             <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#EAB308]/5 blur-2xl rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
