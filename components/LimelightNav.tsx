import React, { useState, cloneElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Internal Types and Defaults ---

const DefaultHomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);
const DefaultCompassIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
  </svg>
);
const DefaultBellIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export type NavItem = {
  id: string | number;
  icon: React.ReactElement<any>;
  label?: string;
  onClick?: () => void;
  badge?: boolean;
};

const defaultNavItems: NavItem[] = [
  { id: 'default-home', icon: <DefaultHomeIcon />, label: 'Home' },
  { id: 'default-explore', icon: <DefaultCompassIcon />, label: 'Explore' },
  { id: 'default-notifications', icon: <DefaultBellIcon />, label: 'Notifications' },
];

export type LimelightNavProps = {
  items?: NavItem[];
  activeIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
  limelightClassName?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
};

/**
 * A highly polished floating dock navigation with sliding capsule highlights,
 * glowing active indicators, and organic micro-interactions.
 */
export const LimelightNav = ({
  items = defaultNavItems,
  activeIndex: controlledIndex,
  onTabChange,
  className = '',
  limelightClassName = '',
  iconContainerClassName = '',
  iconClassName = '',
}: LimelightNavProps) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = controlledIndex ?? internalIndex;

  const handleItemClick = (index: number, itemOnClick?: () => void) => {
    if (controlledIndex === undefined) {
      setInternalIndex(index);
    }
    onTabChange?.(index);
    itemOnClick?.();
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className={`relative inline-flex items-center justify-between gap-1 h-16 sm:h-20 bg-black/20 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl px-2 sm:px-4 text-white w-[95%] max-w-lg md:max-w-3xl select-none ${className}`}>
      {items.map(({ id, icon, label, onClick, badge }, index) => {
        const isActive = activeIndex === index;
        const isCreate = id === 'plus';

        return (
          <button
            key={id}
            onClick={() => handleItemClick(index, onClick)}
            className={`relative z-20 flex-1 flex h-full items-center justify-center cursor-pointer transition-all duration-300 rounded-xl select-none outline-none focus:outline-none ${iconContainerClassName}`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {/* Solid background capsule animation for active items */}
            {isActive && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-y-2 sm:inset-y-3 inset-x-1 sm:inset-x-2 bg-zinc-900 rounded-xl -z-10 shadow-lg border border-zinc-800"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}

            <div className={`relative flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-300 ${
              isActive ? 'text-brand-primary' : 'text-white hover:text-zinc-200'
            }`}>

              <span className={`transition-transform duration-300 ${isActive ? 'scale-105' : 'scale-100'}`}>
                {cloneElement(icon, {
                  className: `w-5 h-5 sm:w-6 h-6 transition-all duration-300 ${
                    isActive ? 'opacity-100 stroke-[2.5]' : 'opacity-70 stroke-[1.5]'
                  } ${icon.props.className || ''} ${iconClassName}`,
                } as any)}
              </span>

              {/* Expandable Label on Active */}
              <AnimatePresence initial={false}>
                {isActive && label && (
                  <motion.span
                    initial={{ opacity: 0, width: 0, scale: 0.9 }}
                    animate={{ opacity: 1, width: 'auto', scale: 1 }}
                    exit={{ opacity: 0, width: 0, scale: 0.9 }}
                    className="text-xs sm:text-sm font-black tracking-widest uppercase whitespace-nowrap overflow-hidden hidden xs:inline-block"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Glow Badge */}
              {badge && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                </span>
              )}
            </div>

            {/* Micro indicator */}
            {isActive && (
              <motion.div
                layoutId="limelightLight"
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-brand-primary shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
