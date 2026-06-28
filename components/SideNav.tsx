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
    <div className={`hidden lg:flex flex-col bg-white/20 border-r border-white/30 h-screen sticky top-0 left-0 z-50 transition-all duration-500 ease-in-out backdrop-blur-2xl shadow-sm ${isCollapsed ? 'w-20' : 'w-24 xl:w-72'}`}>
      {/* Toggle Area */}
      <div className={`h-20 xl:h-24 shrink-0 flex items-center justify-center pt-4 transition-all duration-300`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/60 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-all duration-300 active:scale-95 cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ArrowRight01Icon size={20} /> : <ArrowLeft01Icon size={20} />}
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
