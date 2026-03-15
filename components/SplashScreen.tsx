
import React, { useEffect, useState } from 'react';

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Reduced timeouts for faster perception
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 800); // Was 2000

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 1200); // Was 2600

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 bg-[#FFFCF0] z-50 flex flex-col items-center justify-center transition-opacity duration-500 ease-out perspective-container ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=2000" 
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
            alt=""
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-[-20%] left-[-10%] w-[140%] h-[80%] bg-brand-primary/30 rounded-[50%] blur-[120px] opacity-60 animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[70%] bg-orange-200/30 rounded-full blur-[100px] opacity-50 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Logo Area */}
      <div className="relative z-10 animate-in fade-in zoom-in duration-1000 flex flex-col items-center">
          <div className="w-32 h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center mb-8 border border-white/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="text-5xl font-display font-black text-zinc-900 relative z-10">C<span className="text-brand-primary">U</span></div>
          </div>
          <h1 className="text-6xl font-display font-bold tracking-tighter">
             <span className="text-zinc-900">Connect <span className="text-brand-primary">Up</span></span>
          </h1>
          <div className="mt-4 flex gap-1">
              {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
              ))}
          </div>
      </div>

      <style>{`
        .perspective-container {
            perspective: 1000px;
        }
      `}</style>
    </div>
  );
};
