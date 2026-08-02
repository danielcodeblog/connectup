import React from 'react';
import { motion } from 'motion/react';

interface CircleLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CircleLoader: React.FC<CircleLoaderProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const borderSizes = {
    sm: 'border-2',
    md: 'border-4',
    lg: 'border-4'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} ${borderSizes[size]} rounded-full border-zinc-200 border-t-zinc-900`}
      />
    </div>
  );
};
