
import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export const LandingAbout = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full py-20 sm:py-32 px-4 sm:px-6 bg-[#0D0D0F]" ref={containerRef}>
      <div className="max-w-7xl mx-auto w-full">
        {/* Modern Deconstructed Heading */}
        <div className="mb-24 sm:mb-32 flex flex-col items-center text-center">
            <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-xs tracking-[0.3em] font-black uppercase text-[#EAB308] mb-6"
            >
                Our Mission
            </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-7xl md:text-8xl font-[900] text-white leading-[0.9] tracking-tighter"
          >
            Pitching, <span className="italic font-display font-light text-white/70">Evolved.</span>
          </motion.h2>
        </div>

        {/* Improved Bento-grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Prop */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 p-10 sm:p-16 bg-white/5 rounded-[3rem] border border-white/5 flex flex-col justify-between min-h-[400px]"
          >
            <p className="text-3xl sm:text-4xl md:text-5xl font-medium text-white/95 leading-[1.1] tracking-tight mb-12">
              We believe the strongest partnerships start with <span className="text-[#EAB308]">instant alignment</span>, not endless cold emails.
            </p>
            <div className="h-[1px] w-24 bg-[#EAB308]/50" />
          </motion.div>

          {/* Aesthetic Element */}
          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="relative aspect-square lg:aspect-auto lg:h-full bg-zinc-900 rounded-[3rem] overflow-hidden border border-white/5"
           >
             <img 
               src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=60" 
               className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-all duration-1000"
               alt="Founders Meeting"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-10">
               <h4 className="text-2xl font-black text-white leading-tight">Scale at the speed of thought.</h4>
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
                    transition={{ delay: 0.2 + i * 0.1 }}
                    key={i}
                    className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5"
                >
                    <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                    <p className="text-zinc-400 leading-relaxed font-light">{item.desc}</p>
                </motion.div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
