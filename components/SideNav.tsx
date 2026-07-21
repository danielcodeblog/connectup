import React, { useState } from 'react';
import { 
  Home01Icon, 
  Chat01Icon, 
  UserGroupIcon, 
  Settings02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  PlusSignIcon
} from 'hugeicons-react';
import { Lock } from 'lucide-react';

interface SideNavProps {
  currentView: string;
  onViewChange: (view: any) => void;
  onPostClick?: () => void;
  userProfile?: any;
}

export const SideNav: React.FC<SideNavProps> = ({ currentView, onViewChange, onPostClick, userProfile }) => {
  const isCollapsed = true;
  const isPro = userProfile?.plan === 'pro';

  const navItems = [
    { id: 'home', icon: Home01Icon, label: 'Dashboard' },
    { id: 'community', icon: UserGroupIcon, label: 'Community' },
    { id: 'messages', icon: Chat01Icon, label: 'Messages' },
    { id: 'settings', icon: Settings02Icon, label: 'Settings' },
  ];

  return (
    <div className={`hidden lg:flex flex-col bg-[#FFFCF0] border-r border-zinc-200 h-screen sticky top-0 left-0 z-50 transition-all duration-500 ease-in-out backdrop-blur-3xl shadow-sm ${isCollapsed ? 'w-20' : 'w-24 xl:w-72'}`}>
      {/* Toggle Area */}
      <div className={`h-20 xl:h-24 shrink-0 flex items-center justify-center pt-4 transition-all duration-300`}>
      </div>

      {/* Nav Items */}
      <nav className={`flex-1 flex flex-col justify-between py-8 m-2 rounded-[2.5rem] bg-white border border-zinc-200 shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),0_8px_32px_rgba(0,0,0,0.02)] ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <div className="space-y-3">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group relative ${
                  isActive 
                    ? 'bg-zinc-50 text-zinc-900 shadow-xl shadow-black/[0.02] border border-zinc-100' 
                    : 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900 hover:shadow-sm'
                }`}
              >
                <div className={`p-2 rounded-xl transition-all duration-300 shrink-0 ${isActive ? 'bg-brand-primary text-white scale-105 shadow-xl shadow-brand-primary/30' : 'bg-transparent text-zinc-400 group-hover:text-zinc-900'}`}>
                  <item.icon 
                    size={22} 
                    className="shrink-0"
                  />
                </div>
                
                {!isCollapsed && (
                  <span className={`font-bold text-sm hidden xl:block tracking-tight ${isActive ? 'text-zinc-900' : 'text-zinc-500 group-hover:text-zinc-900'}`}>
                    {item.label}
                  </span>
                )}
                
                {/* Active Indicator Line */}
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-primary rounded-r-full shadow-[2px_0_10px_rgba(234,179,8,0.5)] hidden xl:block" />
                )}

                {/* Tooltip for collapsed view or non-active items */}
                {(isCollapsed || !isActive) && (
                  <div className={`absolute left-full ml-6 px-3 py-2 bg-white text-zinc-900 border border-zinc-100 text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 whitespace-nowrap z-50 translate-x-[-10px] group-hover:translate-x-0 shadow-xl ${!isCollapsed && 'xl:hidden'}`}>
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white border-l border-b border-zinc-100 rotate-45" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Create Post Button */}
        {onPostClick && (
          <div className="pt-6 border-t border-zinc-100 mt-6 px-1.5 shrink-0">
            <button
              onClick={onPostClick}
              className={`w-full flex items-center justify-center gap-3.5 rounded-2xl transition-all duration-300 group relative active:scale-95 shadow-lg cursor-pointer ${
                isPro 
                  ? 'bg-brand-primary text-white hover:bg-yellow-600 shadow-brand-primary/20' 
                  : 'bg-zinc-100 border border-zinc-200 text-zinc-500 hover:bg-zinc-200 shadow-black/5'
              } ${
                isCollapsed 
                  ? 'p-3' 
                  : 'p-3 xl:p-3.5 xl:px-5'
              }`}
            >
              <div className={`p-1 rounded-lg shrink-0 flex items-center justify-center ${isCollapsed ? 'm-0.5' : ''} ${isPro ? 'bg-white/20' : 'bg-zinc-200'}`}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className={`shrink-0 ${isPro ? 'text-white' : 'text-zinc-600'}`}
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </div>
              
              {!isCollapsed && (
                <span className={`font-bold text-sm hidden xl:block tracking-tight ${isPro ? 'text-white' : 'text-zinc-600'}`}>
                  Create Post
                </span>
              )}

              {/* Tooltip for collapsed view */}
              {isCollapsed && (
                <div className="absolute left-full ml-6 px-3 py-2 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 whitespace-nowrap z-50 translate-x-[-10px] group-hover:translate-x-0 shadow-xl">
                  {isPro ? 'Create Post' : 'Create Post (Pro)'}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-zinc-900 rotate-45" />
                </div>
              )}
            </button>
          </div>
        )}
      </nav>
    </div>
  );
};
