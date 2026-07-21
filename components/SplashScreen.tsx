import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing ecosystem...');

  useEffect(() => {
    // Smooth progress simulation over 1800ms
    const totalDuration = 1800;
    const intervalTime = 30;
    const steps = totalDuration / intervalTime;
    const increment = 100 / steps;

    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(timer);
        setTimeout(() => {
          onFinish();
        }, 150); // Small pause at 100% for satisfying feedback
      }
      setProgress(Math.floor(currentProgress));

      // Dynamic professional status updates
      if (currentProgress < 35) {
        setStatusText('Initializing ecosystem...');
      } else if (currentProgress < 70) {
        setStatusText('Securing visionary channels...');
      } else if (currentProgress < 95) {
        setStatusText('Optimizing workspace analytics...');
      } else {
        setStatusText('Connection established!');
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } }}
        className="fixed inset-0 bg-[#FFFCF0] dark:bg-zinc-950 z-[100] flex flex-col items-center justify-center overflow-hidden"
      >
        <div className="relative flex flex-col items-center max-w-sm w-full px-6 text-center">
          {/* Logo illustration precisely styled like the picture */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 relative flex items-center justify-center"
          >
            {/* Ambient glow backing the logo */}
            <div className="absolute w-36 h-36 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-full blur-2xl pointer-events-none" />

            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 200 200" 
              className="w-40 h-40 md:w-48 md:h-48 select-none pointer-events-none drop-shadow-[0_10px_15px_rgba(0,0,0,0.06)]"
            >
              <defs>
                {/* 3D-like soft shadow for deep immersion */}
                <filter id="soft-shadow-splash" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#000000" flood-opacity="0.10" />
                  <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#EAB308" flood-opacity="0.05" />
                </filter>
                
                {/* Left node gradient - pristine 3D silver pearl look */}
                <radialGradient id="left-node-radial-splash" cx="32%" cy="32%" r="68%">
                  <stop offset="0%" stop-color="#FFFFFF" />
                  <stop offset="65%" stop-color="#E4E4E7" />
                  <stop offset="100%" stop-color="#A1A1AA" />
                </radialGradient>
                
                {/* Right node gradient - pristine 3D golden amber sphere look */}
                <radialGradient id="right-node-radial-splash" cx="32%" cy="32%" r="68%">
                  <stop offset="0%" stop-color="#FEF08A" />
                  <stop offset="55%" stop-color="#EAB308" />
                  <stop offset="100%" stop-color="#854D0E" />
                </radialGradient>
                
                {/* Connector gradient with high-fidelity matching the image */}
                <linearGradient id="connector-grad-splash" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#E4E4E7" />
                  <stop offset="25%" stop-color="#FFFFFF" />
                  <stop offset="70%" stop-color="#FDE047" />
                  <stop offset="100%" stop-color="#EAB308" />
                </linearGradient>

                {/* Sweeping glossy light beam gradient */}
                <linearGradient id="shine-grad-splash" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0" />
                  <stop offset="35%" stop-color="#FFFFFF" stop-opacity="0.75" />
                  <stop offset="65%" stop-color="#FFFFFF" stop-opacity="0.75" />
                  <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
                </linearGradient>
              </defs>

              <g filter="url(#soft-shadow-splash)">
                {/* Straight connected bar */}
                <motion.line 
                  x1="65" 
                  y1="125" 
                  x2="135" 
                  y2="75" 
                  stroke="url(#connector-grad-splash)" 
                  strokeWidth="15" 
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                />
                
                {/* Moving glossy sheen highlight across the straight bar */}
                <motion.line 
                  x1="65" 
                  y1="125" 
                  x2="135" 
                  y2="75" 
                  stroke="url(#shine-grad-splash)" 
                  strokeWidth="9" 
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: [0, 1, 1],
                    opacity: [0, 0.9, 0]
                  }}
                  transition={{ 
                    duration: 1.8, 
                    ease: "easeInOut", 
                    repeat: Infinity,
                    repeatDelay: 0.4
                  }}
                />

                {/* Left Pearl Node */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 140, damping: 12 }}
                >
                  <circle cx="65" cy="125" r="18" fill="url(#left-node-radial-splash)" stroke="#FFFFFF" strokeWidth="0.5" />
                  <circle cx="65" cy="125" r="17.5" fill="none" stroke="#D4D4D8" strokeWidth="0.5" opacity="0.3" />
                  {/* Glossy Reflection Highlight */}
                  <circle cx="59" cy="119" r="4.5" fill="#FFFFFF" opacity="0.6" />
                </motion.g>

                {/* Right Amber Node */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.45, type: "spring", stiffness: 140, damping: 12 }}
                >
                  <circle cx="135" cy="75" r="18" fill="url(#right-node-radial-splash)" stroke="#FDE047" strokeWidth="0.5" />
                  <circle cx="135" cy="75" r="17.5" fill="none" stroke="#CA8A04" strokeWidth="0.5" opacity="0.3" />
                  {/* Glossy Reflection Highlight */}
                  <circle cx="129" cy="69" r="4.5" fill="#FFFFFF" opacity="0.7" />
                </motion.g>
              </g>
            </svg>
          </motion.div>

          {/* ConnectUp Brand Typography */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-zinc-900 dark:text-white mb-2">
              Connect<span className="text-brand-primary">Up</span>
            </h1>
            <p className="text-xs font-mono tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-8">
              Ecosystem for Visionaries
            </p>
          </motion.div>

          {/* Progress Bar Container */}
          <div className="w-48">
            <div className="h-[3px] w-full bg-zinc-200/50 dark:bg-zinc-800/50 rounded-full overflow-hidden mb-3">
              <motion.div 
                className="h-full bg-brand-primary rounded-full origin-left"
                style={{ width: `${progress}%` }}
                layoutId="splash-progress-bar"
              />
            </div>
            
            {/* Status updates & Numeric value */}
            <div className="flex items-center justify-between text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400">
              <span className="text-left select-none">{statusText}</span>
              <span className="text-right tabular-nums">{progress}%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
