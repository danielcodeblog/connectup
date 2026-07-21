import React from 'react';
import { User, CreditCard, Lock, Bell, Shield, Eye } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
}

interface SettingsTabsProps {
  tabs: Tab[];
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
    <div className="flex flex-col lg:flex-col lg:gap-1 overflow-x-auto lg:overflow-visible no-scrollbar mb-8 lg:mb-0">
      <div className="flex lg:flex-col items-center lg:items-stretch gap-1 border-b lg:border-b-0 border-zinc-100 dark:border-zinc-800">
        {tabs.map((tab) => {
          const Icon = tabIcons[tab.id] || User;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-3 px-6 py-4 lg:py-3 lg:px-4 text-sm font-medium transition-all relative whitespace-nowrap lg:rounded-xl lg:text-left ${
                activeTab === tab.id
                  ? 'text-zinc-900 dark:text-white lg:bg-white lg:dark:bg-zinc-800 lg:shadow-sm lg:border lg:border-zinc-100 lg:dark:border-zinc-700/80'
                  : 'text-zinc-400 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 lg:hover:bg-zinc-100/50 lg:dark:hover:bg-zinc-800/30'
              }`}
            >
              <Icon size={16} className={`shrink-0 ${activeTab === tab.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`} />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white lg:hidden" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
