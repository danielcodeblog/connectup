import React, { useState } from 'react';
import { 
  Home01Icon, 
  Chat01Icon, 
  UserGroupIcon, 
  Settings02Icon,
  Bookmark02Icon,
  UserCircleIcon,
} from 'hugeicons-react';
import { Feather, MoreHorizontal, Plus } from 'lucide-react';

interface SideNavProps {
  currentView: string;
  onViewChange: (view: any) => void;
  onPostClick?: () => void;
  userProfile?: any;
}

export const SideNav: React.FC<SideNavProps> = ({ currentView, onViewChange, onPostClick, userProfile }) => {
  const isCommunity = currentView === 'community' || currentView === 'bookmarks' || currentView === 'profile';
  const isCollapsed = !isCommunity;
  const isActiveProfile = currentView === 'profile';
  const isPro = userProfile?.plan === 'pro';

  const navItems = [
    { id: 'home', icon: Home01Icon, label: 'Dashboard' },
    { id: 'community', icon: UserGroupIcon, label: 'Community' },
    { id: 'bookmarks', icon: Bookmark02Icon, label: 'Bookmarks' },
    { id: 'messages', icon: Chat01Icon, label: 'Messages' },
    { id: 'profile', icon: UserCircleIcon, label: 'Profile' },
    { id: 'settings', icon: Settings02Icon, label: 'Settings' },
  ];

  return (
    <div className={`hidden lg:flex flex-col bg-[#FFFCF0] h-screen sticky top-0 left-0 z-50 transition-all duration-300 ease-in-out backdrop-blur-3xl shadow-sm ${isCollapsed ? 'w-20' : 'w-20 xl:w-68'}`}>
      {/* Nav Items Container */}
      <nav className={`flex-1 flex flex-col justify-between py-6 m-2 rounded-[2.5rem] bg-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),0_8px_32px_rgba(0,0,0,0.02)] ${isCollapsed ? 'px-2' : 'px-3'}`}>
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center justify-center xl:justify-start gap-3.5 py-3 px-3 rounded-full transition-all duration-200 group relative ${
                  isCommunity
                    ? isActive 
                      ? 'bg-zinc-100 text-zinc-900 font-black shadow-xs' 
                      : 'text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900 font-semibold'
                    : isActive 
                      ? 'bg-zinc-50 text-zinc-950 shadow-xl shadow-black/[0.02] border border-zinc-100' 
                      : 'text-zinc-950 hover:bg-zinc-100/50 hover:text-black'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all duration-200 shrink-0 flex items-center justify-center ${
                  isCommunity
                    ? isActive ? 'text-yellow-500 scale-110' : 'text-zinc-950 group-hover:text-black'
                    : isActive ? 'bg-brand-primary text-white scale-105 shadow-xl shadow-brand-primary/30' : 'bg-transparent text-zinc-950 group-hover:text-black'
                }`}>
                  <item.icon 
                    size={22} 
                    className="shrink-0"
                  />
                </div>
                
                {!isCollapsed && (
                  <span className={`text-base hidden xl:block tracking-tight ${
                    isActive ? 'font-black text-zinc-950' : 'font-semibold text-zinc-950 group-hover:text-black'
                  }`}>
                    {item.label}
                  </span>
                )}

                {/* Tooltip for collapsed view or non-active items */}
                {(isCollapsed || (!isActive && !isCommunity)) && (
                  <div className={`absolute left-full ml-6 px-3 py-2 bg-white text-zinc-900 border border-zinc-100 text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 whitespace-nowrap z-50 translate-x-[-10px] group-hover:translate-x-0 shadow-xl ${!isCollapsed && 'xl:hidden'}`}>
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white border-l border-b border-zinc-100 rotate-45" />
                  </div>
                )}
              </button>
            );
          })}

          {/* X Style Big Post Button */}
          {onPostClick && (
            <div className="pt-2">
              <button
                onClick={onPostClick}
                className={`w-full flex items-center justify-center xl:justify-start gap-3 py-3 px-3.5 rounded-full font-bold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer ${
                  isPro || isCommunity
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-black shadow-yellow-400/20' 
                    : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:bg-zinc-200 shadow-black/5'
                }`}
              >
                <Plus size={22} className="shrink-0" />
                {!isCollapsed && (
                  <span className="hidden xl:block text-base font-black tracking-tight">
                    Post
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* X Style Bottom Profile Card for Community */}
        {isCommunity && (
          <div className="pt-4 mt-auto border-t border-zinc-100/80">
            <button 
              onClick={() => onViewChange('profile')}
              className={`w-full flex items-center justify-between py-2 px-2.5 rounded-full hover:bg-zinc-100/80 transition-all duration-200 group text-left ${
                isActiveProfile ? 'bg-zinc-100/90 ring-1 ring-zinc-200' : ''
              }`}
              title="View Profile"
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                {userProfile?.avatar_url || userProfile?.avatarUrl || userProfile?.avatar || userProfile?.photoURL || userProfile?.imageUrl ? (
                  <img 
                    src={userProfile.avatar_url || userProfile.avatarUrl || userProfile.avatar || userProfile.photoURL || userProfile.imageUrl} 
                    alt={userProfile.full_name || userProfile.name || 'User'} 
                    className="w-9 h-9 rounded-full object-cover border border-zinc-200/80 shadow-xs shrink-0 group-hover:ring-2 group-hover:ring-yellow-400/50 transition-all" 
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 text-zinc-950 font-black flex items-center justify-center shrink-0 shadow-sm text-sm group-hover:ring-2 group-hover:ring-yellow-400/50 transition-all">
                    {(userProfile?.full_name || userProfile?.name || userProfile?.email || 'F')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:block overflow-hidden leading-snug">
                  <p className="font-extrabold text-sm text-zinc-900 truncate">
                    {userProfile?.full_name || userProfile?.name || 'Founder'}
                  </p>
                  <p className="text-xs text-zinc-400 font-medium truncate">
                    @{userProfile?.email ? userProfile.email.split('@')[0] : 'founder'}
                  </p>
                </div>
              </div>
              <MoreHorizontal size={20} className="text-zinc-400 group-hover:text-zinc-700 hidden xl:block shrink-0" />
            </button>
          </div>
        )}
      </nav>
    </div>
  );
};

