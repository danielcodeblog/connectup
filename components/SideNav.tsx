import React, { useState, useEffect } from 'react';
import { 
  Home01Icon, 
  Chat01Icon, 
  UserGroupIcon, 
  Settings02Icon,
  UserCircleIcon,
} from 'hugeicons-react';
import { Feather, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const isCommunity = currentView === 'community' || currentView === 'profile';
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
    { id: 'profile', icon: UserCircleIcon, label: 'Profile' },
    { id: 'settings', icon: Settings02Icon, label: 'Settings' },
  ];

  return (
    <div className={`hidden lg:flex flex-col bg-[#FFFCF0] h-screen sticky top-0 left-0 z-50 transition-all duration-300 ease-in-out backdrop-blur-3xl shadow-sm ${isCollapsed ? 'w-20' : 'w-64 xl:w-72'}`}>
      {/* Nav Items Container */}
      <nav className={`flex-1 flex flex-col justify-between py-5 m-2 rounded-[2.5rem] bg-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),0_8px_32px_rgba(0,0,0,0.02)] ${isCollapsed ? 'px-2' : 'px-3.5'}`}>
        <div className="space-y-2">
          {/* Expand / Collapse Button Header */}
          <div className="flex items-center justify-center pb-2.5 mb-1 border-b border-zinc-100/90 w-full">
            <button
              onClick={toggleExpand}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-2 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 transition-all cursor-pointer flex items-center justify-center group relative mx-auto"
            >
              <svg 
                width={20} 
                height={20} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.75" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="transition-transform group-hover:scale-110 shrink-0"
              >
                <path d="M4 6h16M4 12h10M4 18h16" />
              </svg>
              {isCollapsed && (
                <div className="absolute left-full ml-6 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 translate-x-[-6px] group-hover:translate-x-0 shadow-lg">
                  Expand Sidebar
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-zinc-900 rotate-45" />
                </div>
              )}
            </button>
          </div>

          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3.5 py-3 px-3 rounded-full transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-zinc-100 text-zinc-900 font-black shadow-xs' 
                    : 'text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900 font-semibold'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all duration-200 shrink-0 flex items-center justify-center ${
                  isActive ? 'text-yellow-500 scale-110' : 'text-zinc-950 group-hover:text-black'
                }`}>
                  <item.icon 
                    size={22} 
                    className="shrink-0"
                  />
                </div>
                
                {!isCollapsed && (
                  <span className={`text-base block tracking-tight truncate ${
                    isActive ? 'font-black text-zinc-950' : 'font-semibold text-zinc-800 group-hover:text-black'
                  }`}>
                    {item.label}
                  </span>
                )}

                {/* Tooltip for collapsed view */}
                {isCollapsed && (
                  <div className="absolute left-full ml-6 px-3 py-2 bg-white text-zinc-900 border border-zinc-100 text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 whitespace-nowrap z-50 translate-x-[-10px] group-hover:translate-x-0 shadow-xl">
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white border-l border-b border-zinc-100 rotate-45" />
                  </div>
                )}
              </button>
            );
          })}

          {/* Big Post Button */}
          {onPostClick && (
            <div className="pt-2">
              <button
                onClick={onPostClick}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 py-3 px-3.5 rounded-full font-bold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer ${
                  isPro || isCommunity
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-black shadow-yellow-400/20' 
                    : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:bg-zinc-200 shadow-black/5'
                }`}
              >
                <Plus size={22} className="shrink-0" />
                {!isCollapsed && (
                  <span className="block text-base font-black tracking-tight">
                    Post
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
