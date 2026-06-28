import React, { useState } from 'react';
import { 
  Home01Icon, 
  Chat01Icon, 
  UserGroupIcon, 
  Settings02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon
} from 'hugeicons-react';

interface SideNavProps {
  currentView: string;
  onViewChange: (view: any) => void;
}

export const SideNav: React.FC<SideNavProps> = ({ currentView, onViewChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'home', icon: Home01Icon, label: 'Dashboard' },
    { id: 'community', icon: UserGroupIcon, label: 'Community' },
    { id: 'messages', icon: Chat01Icon, label: 'Messages' },
    { id: 'settings', icon: Settings02Icon, label: 'Settings' },
  ];

  return (
    <div className={`hidden lg:flex flex-col bg-white/60 border-r border-white/20 h-screen sticky top-0 left-0 z-50 transition-all duration-500 ease-in-out backdrop-blur-3xl ${isCollapsed ? 'w-20' : 'w-24 xl:w-72'}`}>
      {/* Logo Toggle Area */}
      <div className={`h-20 xl:h-24 shrink-0 flex items-center px-4 pt-4 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-start ml-2'}`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="group relative flex items-center gap-3 transition-all duration-300 active:scale-95"
        >
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-black/20 group-hover:shadow-brand-primary/20 transition-all duration-300">
            <div className="w-4 h-4 bg-brand-primary rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
          </div>
          
          {!isCollapsed && (
            <span className="font-display font-black text-2xl tracking-tighter text-zinc-900 hidden xl:block animate-in fade-in slide-in-from-left-2 duration-500">
              Connect<span className="text-brand-primary">Up</span>
            </span>
          )}
          
          {/* Subtle indicator */}
          <div className={`absolute top-1/2 -translate-y-1/2 p-1.5 bg-white/90 backdrop-blur-md border border-white/60 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 ${isCollapsed ? '-right-3 translate-x-[-10px] group-hover:translate-x-0' : 'right-[-20px] xl:right-[-40px] translate-x-[-10px] group-hover:translate-x-0'}`}>
             {isCollapsed ? <ArrowRight01Icon size={12} className="text-zinc-900" /> : <ArrowLeft01Icon size={12} className="text-zinc-900" />}
          </div>
        </button>
      </div>

      {/* Nav Items */}
      <nav className={`flex-1 py-8 space-y-3 m-2 rounded-[2.5rem] bg-white/30 backdrop-blur-md border border-white/40 shadow-inner ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group relative ${
                isActive 
                  ? 'bg-zinc-900 text-white shadow-xl shadow-black/10 border border-zinc-800' 
                  : 'text-zinc-400 hover:bg-white/40 hover:text-zinc-900 hover:shadow-sm'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 shrink-0 ${isActive ? 'bg-brand-primary text-black scale-110 shadow-lg shadow-brand-primary/20' : 'bg-transparent text-zinc-400 group-hover:text-zinc-900'}`}>
                <item.icon 
                  size={22} 
                  className="shrink-0"
                />
              </div>
              
              {!isCollapsed && (
                <span className={`font-bold text-sm hidden xl:block tracking-tight ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-900'}`}>
                  {item.label}
                </span>
              )}
              
              {/* Active Indicator Line */}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-primary rounded-r-full shadow-[2px_0_10px_rgba(234,179,8,0.5)] hidden xl:block" />
              )}

              {/* Tooltip for collapsed view or non-active items */}
              {(isCollapsed || !isActive) && (
                <div className={`absolute left-full ml-6 px-3 py-2 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 whitespace-nowrap z-50 translate-x-[-10px] group-hover:translate-x-0 shadow-xl ${!isCollapsed && 'xl:hidden'}`}>
                  {item.label}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-zinc-900 rotate-45" />
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
