import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, Sparkles, Rocket, Users } from 'lucide-react';

const SLIDES = [
  {
    title: "Connect with Visionaries",
    description: "ConnectUp bridges the gap between ambitious founders and strategic investors.",
    icon: Users,
    color: "from-blue-500/20 to-purple-500/20",
    image: "https://picsum.photos/seed/visionaries/1080/1920"
  },
  {
    title: "Fuel Your Growth",
    description: "Access a curated network of startups ready to scale and investors looking for the next big thing.",
    icon: Rocket,
    color: "from-orange-500/20 to-red-500/20",
    image: "https://picsum.photos/seed/growth/1080/1920"
  },
  {
    title: "Build the Future",
    description: "Join a community dedicated to innovation, collaboration, and sustainable success.",
    icon: Sparkles,
    color: "from-emerald-500/20 to-teal-500/20",
    image: "https://picsum.photos/seed/future/1080/1920"
  },
];

export const Onboarding = React.memo(({ onFinish }: { onFinish: () => void }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    } else {
      onFinish();
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const Icon = SLIDES[currentSlide].icon;

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white relative overflow-hidden font-sans">
      
      {/* Background Image Layer */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 }
          }}
          className="absolute inset-0"
        >
          <img 
            src={SLIDES[currentSlide].image} 
            alt={SLIDES[currentSlide].title}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/60 to-zinc-950`}></div>
          <div className={`absolute inset-0 bg-gradient-to-br ${SLIDES[currentSlide].color} mix-blend-overlay`}></div>
        </motion.div>
      </AnimatePresence>

      {/* Content Overlay */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-8 pb-48">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-md"
          >
            <h1 className="text-5xl font-display font-bold mb-6 tracking-tight leading-[1.1]">
              {SLIDES[currentSlide].title}
            </h1>
            <p className="text-xl text-zinc-300 font-medium leading-relaxed">
              {SLIDES[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="absolute bottom-16 left-0 right-0 z-30 px-8 pb-8 pt-8 flex items-center justify-between safe-area-bottom">
        {/* Progress Indicators */}
        <div className="flex space-x-2">
          {SLIDES.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-10 bg-brand-primary' : 'w-2 bg-white/20'}`}
            ></div>
          ))}
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext} 
          className="group flex items-center justify-center h-12 w-12 bg-brand-primary text-zinc-950 rounded-full shadow-[0_0_30px_rgba(250,204,21,0.3)]"
        >
          {currentSlide === SLIDES.length - 1 ? (
            <Check size={28} strokeWidth={3} />
          ) : (
            <ArrowRight size={28} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          )}
        </motion.button>
      </div>
    </div>
  );
});
