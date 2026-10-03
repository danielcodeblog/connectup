import React from 'react';

interface StatusIndicatorProps {
    lastSeen: string | null;
    size?: 'sm' | 'md';
    variant?: 'dot' | 'full';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ lastSeen, size = 'sm', variant = 'full' }) => {
    if (!lastSeen) return null;

    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    // Online if activity in last 5 minutes
    const isOnline = (now.getTime() - lastSeenDate.getTime()) < 300000; 

    if (variant === 'dot') {
        return (
            <div className={`rounded-full ${isOnline ? 'bg-green-500' : 'bg-zinc-400'} ${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
        );
    }

    return (
        <div className={`flex items-center gap-1.5 ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
            <div className={`rounded-full ${isOnline ? 'bg-green-500' : 'bg-zinc-400'} ${size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} />
            {isOnline ? (
                <span className="text-green-600 font-medium">Online</span>
            ) : (
                <span className="text-zinc-500 font-medium">
                    {lastSeenDate.toLocaleDateString() === now.toLocaleDateString() 
                        ? lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : lastSeenDate.toLocaleDateString()
                    }
                </span>
            )}
        </div>
    );
};
