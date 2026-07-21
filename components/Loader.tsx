import React from 'react';
import { motion } from 'motion/react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size = 'md', className = '' }) => {
  const dots = [
    { color: '#2b5a79' }, // Teal Blue
    { color: '#3d607d' }, // Muted Slate Blue
    { color: '#5a4e67' }, // Dusky Purple
    { color: '#7d444e' }, // Deep Maroon
    { color: '#a44038' }, // Brick Red
    { color: '#c94025' }, // Warm Red
    { color: '#e73b18' }  // Bright Orange-Red
  ];

  // Map sizes to layout variables
  const dotSizes = {
    sm: { width: 'w-2 h-2', gap: 'gap-1.5', offset: 6, spacing: 'mt-2', blur: 'blur-[1px]' },
    md: { width: 'w-4 h-4', gap: 'gap-3', offset: 12, spacing: 'mt-3', blur: 'blur-[3px]' },
    lg: { width: 'w-6 h-6', gap: 'gap-4', offset: 18, spacing: 'mt-4', blur: 'blur-[5px]' }
  };

  const currentSize = dotSizes[size];

  return (
    <div className={`flex flex-col items-center justify-center p-10 select-none pointer-events-none ${className}`} id="custom-dot-loader">
      <div className={`flex ${currentSize.gap} items-center justify-center`}>
        {dots.map((dot, index) => (
          <div key={index} className="flex flex-col items-center relative">
            {/* Real Dot */}
            <motion.div
              animate={{
                y: [0, -currentSize.offset, 0],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.15,
              }}
              className={`${currentSize.width} rounded-full shadow-sm`}
              style={{ backgroundColor: dot.color }}
            />
            
            {/* Reflection Dot */}
            <motion.div
              animate={{
                y: [0, currentSize.offset, 0],
                opacity: [0.35, 0.08, 0.35],
                scaleY: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.15,
              }}
              className={`${currentSize.width} rounded-full ${currentSize.blur} origin-top`}
              style={{ 
                backgroundColor: dot.color,
                marginTop: currentSize.spacing
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

