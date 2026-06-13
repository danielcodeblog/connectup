import React from 'react';
import { cn } from '../../lib/utils';

interface MenuToggleProps {
  open: boolean;
  className?: string;
}

export function MenuToggleIcon({ open, className }: MenuToggleProps) {
  return (
    <div className={cn("relative w-5 h-4 flex flex-col justify-between items-end", className)}>
      <div
        className={cn(
          "h-[2px] bg-current rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] origin-center",
          open ? "w-5 rotate-45 translate-y-[7px]" : "w-5"
        )}
      />
      <div
        className={cn(
          "h-[2px] bg-current rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] origin-center",
          open ? "w-0 opacity-0" : "w-3"
        )}
      />
      <div
        className={cn(
          "h-[2px] bg-current rounded-full transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] origin-center",
          open ? "w-5 -rotate-45 -translate-y-[7px]" : "w-5"
        )}
      />
    </div>
  );
}
