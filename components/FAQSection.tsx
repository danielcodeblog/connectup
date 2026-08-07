import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const faqs = [
  {
    id: 1,
    question: 'What makes ConnectUp different from other matching solutions?',
    answer: 'ConnectUp stands out by integrating cutting-edge matching algorithms with verified founder & investor data, ensuring every connection meets stage, thesis, and sector demands. Our expertise spans global tech hubs, delivering tailored solutions that enhance capital speed and relationship quality.'
  },
  {
    id: 2,
    question: 'Does ConnectUp offer custom design solutions for unique architectural needs?',
    answer: 'Yes, ConnectUp provides tailored venture matching solutions to meet specific structural, geographic, and stage requirements, ensuring both aesthetic and functional excellence.'
  },
  {
    id: 3,
    question: 'How does ConnectUp ensure sustainability in its projects?',
    answer: 'We prioritize data security, vetted diligence packages, and long-term founder alignment, minimizing friction and maximizing sustainable capital placement across all venture verticals.'
  },
  {
    id: 4,
    question: 'What stages and cheque sizes are supported on the platform?',
    answer: 'ConnectUp supports pre-seed through Series B funding rounds, matching founders with angel syndicates, family offices, and institutional VCs tailored to exact ticket sizes.'
  },
  {
    id: 5,
    question: 'How quickly can founders start connecting with active investors?',
    answer: 'Once your profile and pitch room are verified by our team, matching signals activate immediately, surfacing high-intent investor introductions within 24–48 hours.'
  }
];

// Generate an extended list for continuous, infinite rolling (20 cycles of 5 items = 100 items)
const REPEAT_CYCLES = 20;
const extendedFaqs = Array.from({ length: faqs.length * REPEAT_CYCLES }, (_, i) => ({
  ...faqs[i % faqs.length],
  virtualId: i,
  realId: (i % faqs.length) + 1,
}));

export const FAQSection = () => {
  // Start in the middle cycle (cycle 5, index 25) so previous clicks also work smoothly
  const [virtualIndex, setVirtualIndex] = useState(faqs.length * 5);
  const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setViewMode('mobile');
      } else if (width < 1024) {
        setViewMode('tablet');
      } else {
        setViewMode('desktop');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNext = () => {
    setVirtualIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setVirtualIndex((prev) => Math.max(0, prev - 1));
  };

  const xOffset = viewMode === 'mobile'
    ? `calc(-${virtualIndex} * (100% + 1.5rem))`
    : viewMode === 'tablet'
    ? `calc(-${virtualIndex} * (50% + 0.75rem))`
    : `calc(-${virtualIndex - 1} * (100% + 1.5rem) / 3)`;

  return (
    <section id="faq" className="w-full py-16 sm:py-24 lg:py-32 bg-white relative z-10 px-4 sm:px-8 lg:px-12 overflow-hidden border-0">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-8 mb-10 sm:mb-14 lg:mb-16">
          <div>
            <div className="inline-block bg-[#FACC15] text-zinc-950 font-bold text-xs uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-3 sm:mb-4">
              Got Questions?
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-sans tracking-tight text-zinc-950 font-bold leading-[1.08]">
              Frequently <br />
              Asked <span className="text-[#D97706] font-extrabold">Questions</span>
            </h2>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-5 sm:gap-6">
            <p className="text-zinc-600 text-sm sm:text-base max-w-xs sm:max-w-sm sm:text-right font-normal leading-relaxed">
              Find answers to common questions about our platform engineering services, project process, and technical expertise.
            </p>

            {/* Navigation Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrev}
                className="w-11 h-11 rounded-full border border-amber-300 bg-white hover:bg-amber-100 text-zinc-900 transition-all flex items-center justify-center cursor-pointer active:scale-95"
                aria-label="Previous question"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2]" />
              </button>
              <button
                onClick={handleNext}
                className="w-11 h-11 rounded-full bg-[#FACC15] hover:bg-amber-400 text-zinc-950 font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95"
                aria-label="Next question"
              >
                <ArrowRight className="w-5 h-5 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>

        {/* Rolling Cards Carousel */}
        <div className="relative w-full overflow-hidden pt-3 pb-8 px-1">
          <motion.div 
            className="flex gap-6 items-center"
            animate={{
              x: xOffset
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          >
            {extendedFaqs.map((faq) => {
              const isActive = faq.virtualId === virtualIndex;

              return (
                <div
                  key={faq.virtualId}
                  onClick={() => setVirtualIndex(faq.virtualId)}
                  className={`w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] shrink-0 cursor-pointer rounded-[2rem] sm:rounded-[2.25rem] p-6 sm:p-8 lg:p-10 min-h-[350px] sm:min-h-[390px] lg:min-h-[430px] flex flex-col justify-between transition-all duration-500 ${
                    isActive
                      ? 'bg-[#FACC15] text-zinc-950 scale-[1.04] sm:scale-[1.05] z-20 border-2 border-amber-400'
                      : 'bg-slate-50 hover:bg-amber-50/70 text-zinc-800 scale-[0.96] opacity-85 z-10 border border-zinc-200/80'
                  }`}
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-colors ${
                          isActive ? 'bg-zinc-950 text-[#FACC15]' : 'bg-amber-100 text-amber-900'
                        }`}>
                          0{faq.realId}
                        </span>
                      </div>
                      <h3 className={`text-xl sm:text-2xl lg:text-3xl font-bold font-sans leading-snug tracking-tight transition-colors ${isActive ? 'text-zinc-950' : 'text-zinc-900'}`}>
                        {faq.question}
                      </h3>
                    </div>

                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="text-xs sm:text-sm text-zinc-800 font-medium leading-relaxed mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-zinc-950/20"
                      >
                        {faq.answer}
                      </motion.p>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};



