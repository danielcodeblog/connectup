import React from 'react';
import { motion } from 'motion/react';

const logos = [
  { name: 'Google Meet' },
  { name: 'Paystack' },
  { name: 'Flutterwave' },
  { name: 'Chowdeck' },
  { name: 'Andela' },
  { name: 'Onedosh' },
];

export const LogoMarquee = () => {
  return (
    <div className="w-full py-8 sm:py-12 bg-[#FAF9F5] border-b border-zinc-200/50 relative z-10 flex flex-col gap-6 overflow-hidden">
      {/* First row: Moving Left */}
      <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <motion.div
          className="flex gap-20 whitespace-nowrap min-w-max"
          animate={{ x: [0, "-50%"] }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        >
          {/* Duplicate to create a seamless loop */}
          {[...logos, ...logos, ...logos, ...logos].map((logo, index) => (
            <div key={`left-${index}`} className="flex items-center text-zinc-400 hover:text-zinc-900 transition-all duration-500 hover:scale-105 cursor-pointer">
              <span className="font-semibold text-lg sm:text-xl tracking-tight text-zinc-700">{logo.name}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Second row: Moving Right */}
      <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <motion.div
          className="flex gap-20 whitespace-nowrap min-w-max"
          animate={{ x: ["-50%", 0] }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        >
          {/* Duplicate to create a seamless loop */}
          {[...logos, ...logos, ...logos, ...logos].map((logo, index) => (
            <div key={`right-${index}`} className="flex items-center text-zinc-400 hover:text-zinc-900 transition-all duration-500 hover:scale-105 cursor-pointer">
              <span className="font-semibold text-lg sm:text-xl tracking-tight text-zinc-700">{logo.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
