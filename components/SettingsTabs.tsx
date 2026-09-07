import React from 'react';
import { User, CreditCard, Lock, Bell, Shield, Eye, ChevronRight } from 'lucide-react';

export interface SettingsTabItem {
  id: string;
  label: string;
  description?: string;
  badge?: string;
}

interface SettingsTabsProps {
  tabs: SettingsTabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

const tabIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  profile: User,
  subscription: CreditCard,
  password: Lock,
  notifications: Bell,
  terms: Shield,
  privacy: Eye,
};

export const SettingsTabs: React.FC<SettingsTabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="w-full">
      {/* Mobile: Horizontal Pill Scroller */}
      <div className="flex lg:hidden overflow-x-auto no-scrollbar gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800 -mx-2 px-2">
        {tabs.map((tab) => {
          const Icon = tabIcons[tab.id] || User;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                  : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/70 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-amber-400 dark:text-amber-500' : 'text-zinc-400'} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400 text-zinc-950 font-black">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop: Vertical Navigation Cards */}
      <div className="hidden lg:flex flex-col gap-1.5 w-full">
        {tabs.map((tab) => {
          const Icon = tabIcons[tab.id] || User;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all duration-200 group cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-zinc-200/80 dark:border-zinc-700/70 text-zinc-950 dark:text-white ring-1 ring-zinc-950/5'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 hover:text-zinc-950 dark:hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-amber-400/20 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex flex-col min-w-0 leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold truncate">{tab.label}</span>
                    {tab.badge && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-amber-400 text-zinc-950 font-black tracking-wide shrink-0">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  {tab.description && (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5 font-medium">
                      {tab.description}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight
                size={16}
                className={`shrink-0 transition-transform duration-200 ${
                  isActive
                    ? 'text-zinc-900 dark:text-white translate-x-0 opacity-100'
                    : 'text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
