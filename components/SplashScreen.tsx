
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } }}
        className="fixed inset-0 bg-[#FFFCF0] z-[100] flex items-center justify-center overflow-hidden"
      >
        <div className="relative flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="flex items-center"
          >
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-zinc-900">
              Connect<span className="text-brand-primary">Up</span>
            </h1>
          </motion.div>
          
          {/* Subtle Progress Line */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-zinc-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full bg-brand-primary"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
