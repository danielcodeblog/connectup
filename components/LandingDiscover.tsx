
import React, { useState, useRef } from 'react';
import { Heart, ThumbsDown, Building2, Briefcase, TrendingUp, Users } from 'lucide-react';
import gsap from 'gsap';
import { FOUNDERS, FounderData } from '../src/constants';

export const LandingDiscover = () => {
  const [founders, setFounders] = useState<FounderData[]>(FOUNDERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState(0);
  
  const cardRef = useRef<HTMLDivElement>(null);

  const handleHover = (e: React.MouseEvent<HTMLButtonElement>) => gsap.to(e.currentTarget, { scale: 1.1, duration: 0.2, ease: 'back.out' });
  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: 'power2.out' });

  const swipe = (direction: 'left' | 'right') => {
    if (!cardRef.current || currentIndex >= founders.length) return;

    const x = direction === 'right' ? 500 : -500;
    const rotation = direction === 'right' ? 20 : -20;

    gsap.to(cardRef.current, {
      x,
      rotation,
      opacity: 0,
      duration: 0.6,
      ease: 'back.in(1.2)',
      onComplete: () => {
        if (direction === 'right') {
          setMatches(m => m + 1);
        }
        setCurrentIndex(prev => prev + 1);
        
        // Reset position for next card behind the scenes
        if (cardRef.current) {
          gsap.set(cardRef.current, { x: 0, rotation: 0, opacity: 1 });
          gsap.fromTo(cardRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out' });
        }
      }
    });
  };

  const restartCount = () => {
    setMatches(0);
    setCurrentIndex(0);
  };

  if (currentIndex >= founders.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white min-h-[600px]">
        <div className="w-24 h-24 bg-[#EAB308] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,215,0,0.4)]">
          <Heart size={40} className="text-black fill-black" />
        </div>
        <h2 className="text-4xl font-[800] mb-4">You've Swiped Them All!</h2>
        <p className="text-xl text-white/70 mb-8 font-light">You found {matches} amazing founders.</p>
        <button 
          onClick={restartCount}
          onMouseEnter={e => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2, ease: 'back.out' })}
          onMouseLeave={e => gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: 'power2.out' })}
          className="bg-white text-black px-8 py-4 rounded-full font-[800] text-lg hover:bg-white/90 shadow-lg transition-colors"
        >
          Discover More
        </button>
      </div>
    );
  }

  const currentFounder = founders[currentIndex];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden min-h-[600px]">
      <div className="w-full max-w-sm sm:max-max-md relative flex flex-col items-center">
        
        {/* Match Counter */}
        <div className="absolute top-[-50px] sm:top-[-60px] bg-white/10 backdrop-blur-md px-5 sm:px-6 py-1.5 sm:py-2 rounded-full border border-white/20 font-bold text-lg sm:text-xl shadow-lg text-white z-20">
          Matches: <span className="text-[#EAB308]">{matches}</span>
        </div>

        {/* Card */}
        <div 
          ref={cardRef}
          className="w-full bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl z-10 text-white"
          style={{ willChange: 'transform' }}
        >
          <div 
            className="h-40 sm:h-48 w-full flex items-center justify-center text-4xl font-[800]"
            style={{ background: currentFounder.image }}
          >
             <Building2 size={56} className="text-black/30" />
          </div>
          
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl sm:text-3xl font-black mb-1">{currentFounder.name}</h3>
            <div className="text-base sm:text-lg font-bold text-[#EAB308] mb-4 uppercase tracking-wider">{currentFounder.title}</div>
            
            <p className="text-white/70 font-light mb-6 line-clamp-3 text-sm sm:text-base leading-relaxed">"{currentFounder.tagline}"</p>
            
            <div className="space-y-3 font-ibm-mono text-xs sm:text-sm text-white/50">
              <div className="flex justify-between pb-2 border-b border-white/5">
                <span className="flex items-center gap-2"><Briefcase size={14}/> Industry</span>
                <span className="font-semibold text-white">{currentFounder.industry}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/5">
                <span className="flex items-center gap-2"><TrendingUp size={14}/> Stage</span>
                <span className="font-semibold text-white">{currentFounder.stage}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/5">
                <span className="flex items-center gap-2"><Users size={14}/> Team</span>
                <span className="font-semibold text-white">{currentFounder.members} members</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="flex items-center gap-2 font-black text-white/40 text-[10px] uppercase tracking-widest">Seeking</span>
                <span className="font-black text-[#EAB308] text-base sm:text-lg">{currentFounder.seeking}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-6 sm:gap-8 mt-8 sm:mt-12 z-20">
          <button 
            onClick={() => swipe('left')}
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-white/20 transition-all active:scale-95"
          >
            <ThumbsDown className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />
          </button>
          <button 
            onClick={() => swipe('right')}
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-[#EAB308] border border-[#EAB308] rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(184,134,11,0.4)] hover:bg-[#CA8A04] transition-all active:scale-95"
          >
            <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-black text-black" strokeWidth={2} />
          </button>
        </div>

      </div>
    </div>
  );
};
