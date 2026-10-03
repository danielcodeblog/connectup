import React, { useState, useEffect } from 'react';
import { 
  Home01Icon, 
  Chat01Icon, 
  UserGroupIcon, 
  Settings02Icon,
} from 'hugeicons-react';
import { Feather, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SideNavProps {
  currentView: string;
  onViewChange: (view: any) => void;
  onPostClick?: () => void;
  userProfile?: any;
}

export const SideNav: React.FC<SideNavProps> = ({ currentView, onViewChange, onPostClick, userProfile }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('connectup_sidenav_expanded');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // fallback
    }
    return false;
  });

  const isCollapsed = !isExpanded;
  const isPro = userProfile?.plan === 'pro';

  const toggleExpand = () => {
    setIsExpanded(prev => {
      const next = !prev;
      try {
        localStorage.setItem('connectup_sidenav_expanded', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const navItems = [
    { id: 'home', icon: Home01Icon, label: 'Dashboard' },
    { id: 'community', icon: UserGroupIcon, label: 'Community' },
    { id: 'messages', icon: Chat01Icon, label: 'Messages' },
    { id: 'settings', icon: Settings02Icon, label: 'Settings' },
  ];

  return (
    <div className={`hidden lg:flex flex-col bg-transparent h-screen sticky top-0 left-0 z-50 transition-all duration-300 ease-in-out backdrop-blur-3xl ${isCollapsed ? 'w-20' : 'w-64 xl:w-72'}`}>
      {/* Nav Items Container */}
      <nav className={`flex-1 flex flex-col justify-between py-5 m-2.5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)] ${isCollapsed ? 'px-2' : 'px-3'}`}>
        <div className="space-y-1.5">
          {/* Expand / Collapse Button Header */}
          <div className={`flex items-center pb-2 mb-1 w-full ${isCollapsed ? 'justify-center' : 'justify-end px-1'}`}>
            <motion.button
              onClick={toggleExpand}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-center group relative overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isCollapsed ? (
                  <motion.div
                    key="menu"
                    initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex items-center justify-center"
                  >
                    <svg 
                      width={20} 
                      height={20} 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="shrink-0"
                    >
                      <path d="M4 6h16M4 12h10M4 18h16" />
                    </svg>
                  </motion.div>
                ) : (
                  <motion.div
                    key="x"
                    initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex items-center justify-center text-zinc-500 group-hover:text-zinc-950 dark:group-hover:text-white"
                  >
                    <X size={20} strokeWidth={2.5} className="shrink-0" />
                  </motion.div>
                )}
              </AnimatePresence>
              {isCollapsed && (
                <div className="absolute left-full ml-5 px-3 py-1.5 bg-zinc-950 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 translate-x-[-6px] group-hover:translate-x-0 shadow-lg">
                  Expand Sidebar
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-zinc-950 rotate-45" />
                </div>
              )}
            </motion.button>
          </div>

          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 py-2.5 px-3 rounded-2xl transition-all duration-200 group relative cursor-pointer ${
                  isActive 
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-white font-medium'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all duration-200 shrink-0 flex items-center justify-center ${
                  isActive ? 'text-amber-400 dark:text-amber-500' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'
                }`}>
                  <item.icon 
                    size={20} 
                    className="shrink-0"
                  />
                </div>
                
                {!isCollapsed && (
                  <span className={`text-sm block tracking-tight truncate ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}>
                    {item.label}
                  </span>
                )}

                {/* Tooltip for collapsed view */}
                {isCollapsed && (
                  <div className="absolute left-full ml-5 px-3 py-1.5 bg-zinc-950 text-white border border-zinc-800 text-[10px] font-bold tracking-wider rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 translate-x-[-6px] group-hover:translate-x-0 shadow-xl">
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-zinc-950 rotate-45" />
                  </div>
                )}
              </button>
            );
          })}

          {/* New Post Button */}
          {onPostClick && (
            <div className="pt-2">
              <button
                onClick={onPostClick}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-2.5 py-2.5 px-3 rounded-2xl font-bold text-sm transition-all duration-200 shadow-xs hover:scale-[1.02] active:scale-95 cursor-pointer bg-amber-400 hover:bg-amber-300 text-zinc-950`}
              >
                <Plus size={20} strokeWidth={2.5} className="shrink-0" />
                {!isCollapsed && (
                  <span className="block font-bold tracking-tight">
                    New Post
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};
