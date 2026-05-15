
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';

interface HomeViewProps {
  onNavigate: (page: 'home' | 'about' | 'blog' | 'founders' | 'contact') => void;
  onLoginClick: () => void;
  showVideo: boolean;
}

export const LandingHome = ({ onNavigate, onLoginClick, showVideo }: HomeViewProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (heroRef.current) {
      const elements = heroRef.current.querySelectorAll('.hero-anim');
      gsap.fromTo(elements, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'back.out(1.2)' }
      );
    }
  }, []);

  return (
    <div className="w-full min-h-[90vh] flex items-center justify-center pt-32 sm:pt-40 pb-16 px-0 sm:px-6" ref={heroRef}>
      <main className="z-20 max-w-7xl w-full text-center flex flex-col items-center">
        <h1 className="hero-anim text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tighter text-white mb-8 sm:mb-10 px-6 sm:px-0">
          Match with <span className="italic font-display font-light">Investors</span>
          <br />
          <span className="font-bold">That Actually Get It.</span>
        </h1>

        <div className="hero-anim mt-8 sm:mt-16 w-full max-w-6xl aspect-[16/10] rounded-none sm:rounded-[2.5rem] overflow-hidden border-y sm:border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative bg-[#121214] group">
          {showVideo ? (
            <motion.iframe
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src="https://player.vimeo.com/video/1191946999?autoplay=1&muted=1&loop=1&background=1"
              className="w-full h-full scale-[1.02]"
              allow="autoplay; fullscreen"
              frameBorder="0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950">
               <div className="text-zinc-800 font-display italic text-4xl sm:text-6xl">Visualizing Capital</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
        </div>
      </main>
    </div>
  );
};
