import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  PlayIcon, 
  StopIcon, 
  RotateLeft01Icon, 
  PencilEdit02Icon, 
  CheckmarkCircle01Icon,
  Video01Icon,
  MagicWand01Icon
} from 'hugeicons-react';
import { IconWrapper } from './IconWrapper';
import { cn } from '../lib/utils';

const pitchFormulas = [
  {
    name: "The Tech Disruptor",
    tagline: "High impact, direct challenge to status quo.",
    hook: "Most developers waste 15 hours a week manually configuring API layers. It's tedious, slow, and expensive.",
    solution: "We built ConnectUp—an automated interface engine that creates clean, secure backend endpoints in one click.",
    ask: "We're launching our beta next week. Match with us to get early access and co-build the future."
  },
  {
    name: "The Mission Driven",
    tagline: "Focused on human connection and community values.",
    hook: "In a world of 8 billion people, finding a business partner who shares your exact core values is like finding a needle in a haystack.",
    solution: "ConnectUp is a discovery-first match platform where founders and investors swipe based on alignment, not vanity metrics.",
    ask: "We are currently raising our pre-seed round. Match if you're ready to back the next generation of builders."
  },
  {
    name: "The SaaS Utility",
    tagline: "Clear problem-solving utility focus.",
    hook: "Traditional cold pitching is dead. Less than 2% of cold emails ever get a reply, wasting precious founder time.",
    solution: "ConnectUp changes the game by introducing direct swipe-to-pitch matching, video intros, and integrated scheduling.",
    ask: "We're looking for visionary design partners. Match to lock in lifetime pricing and early access."
  }
];

export const PitchSimulator: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  
  const [hookText, setHookText] = useState(pitchFormulas[0].hook);
  const [solutionText, setSolutionText] = useState(pitchFormulas[0].solution);
  const [askText, setAskText] = useState(pitchFormulas[0].ask);

  useEffect(() => {
    if (!isEditing && !isPlaying) {
      setHookText(pitchFormulas[activeIdx].hook);
      setSolutionText(pitchFormulas[activeIdx].solution);
      setAskText(pitchFormulas[activeIdx].ask);
    }
  }, [activeIdx, isEditing, isPlaying]);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= 30) {
            setIsPlaying(false);
            return 30;
          }
          return prev + 0.1;
        });
      }, 100);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const handleStart = () => {
    if (currentTime >= 30) {
      setCurrentTime(0);
    }
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const getActiveSection = () => {
    if (currentTime < 5) return 'hook';
    if (currentTime < 20) return 'solution';
    return 'ask';
  };

  const currentSection = getActiveSection();
  const progressPercent = (currentTime / 30) * 100;

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-zinc-100 relative overflow-hidden group flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-100 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h3 className="text-xl font-display font-black text-zinc-900">30s Pitch Teleprompter</h3>
          </div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Pro Script Assistant</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={isPlaying}
            className={cn(
              "h-11 w-11 flex items-center justify-center rounded-xl border transition-all cursor-pointer disabled:opacity-30",
              isEditing 
                ? "bg-brand-primary text-zinc-900 border-brand-primary shadow-lg shadow-brand-primary/20"
                : "bg-zinc-50 text-zinc-500 border-zinc-100 hover:bg-zinc-100"
            )}
            title={isEditing ? "Save" : "Edit Script"}
          >
            <IconWrapper icon={PencilEdit02Icon} size={18} />
          </button>
        </div>
      </div>

      <div className="relative z-10 mb-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-display">
              <span className={cn("text-5xl font-black tracking-tighter transition-colors", isPlaying ? "text-brand-primary" : "text-zinc-900")}>
                {currentTime.toFixed(1)}
              </span>
              <span className="text-zinc-300 text-xl font-black mt-2">/ 30.0s</span>
            </div>
          </div>
          
          <div className={cn(
            "text-[10px] uppercase font-black tracking-[0.2em] px-5 py-2.5 rounded-full transition-all duration-500 shadow-sm",
            currentSection === 'hook' ? "bg-zinc-900 text-white" :
            currentSection === 'solution' ? "bg-zinc-900 text-white" :
            "bg-brand-primary text-zinc-900"
          )}>
            {currentSection === 'hook' ? "1. THE HOOK (0-5s)" : 
             currentSection === 'solution' ? "2. THE SOLUTION (5-20s)" : 
             "3. THE ASK (20-30s)"}
          </div>
        </div>

        <div className="bg-zinc-950 rounded-[32px] p-8 min-h-[260px] flex items-center relative overflow-hidden shadow-2xl border border-zinc-900">
           {/* Animated Teleprompter Scanline */}
           <motion.div 
             animate={{ x: isPlaying ? ["-100%", "200%"] : "-100%" }}
             transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
             className="absolute inset-y-0 w-32 bg-white/5 blur-2xl pointer-events-none"
           />
           
           {/* Active line indicator */}
           <div className="absolute left-0 w-1 bg-brand-primary transition-all duration-300" style={{ 
             top: currentSection === 'hook' ? '15%' : currentSection === 'solution' ? '45%' : '75%',
             height: '20%'
           }} />

          {isEditing ? (
            <div className="w-full space-y-6 relative z-10">
              <div className="group">
                <span className="text-[9px] uppercase tracking-widest font-black text-zinc-500 block mb-2 group-focus-within:text-brand-primary transition-colors">Hook (0-5s)</span>
                <textarea
                  value={hookText}
                  onChange={(e) => setHookText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 h-16 resize-none transition-all"
                />
              </div>
              <div className="group">
                <span className="text-[9px] uppercase tracking-widest font-black text-zinc-500 block mb-2 group-focus-within:text-brand-primary transition-colors">Solution (5-20s)</span>
                <textarea
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 h-20 resize-none transition-all"
                />
              </div>
              <div className="group">
                <span className="text-[9px] uppercase tracking-widest font-black text-zinc-500 block mb-2 group-focus-within:text-brand-primary transition-colors">Ask & CTA (20-30s)</span>
                <textarea
                  value={askText}
                  onChange={(e) => setAskText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 h-20 resize-none transition-all"
                />
              </div>
            </div>
          ) : (
            <div className="font-display text-2xl sm:text-3xl leading-snug tracking-tight text-white/20 transition-all duration-500 relative z-10 w-full">
              <div className={cn("transition-all duration-500 mb-4", currentSection === 'hook' ? "text-white scale-105 origin-left" : "blur-[1px]")}>
                {hookText}
              </div>
              <div className={cn("transition-all duration-500 mb-4", currentSection === 'solution' ? "text-white scale-105 origin-left" : "blur-[1px]")}>
                {solutionText}
              </div>
              <div className={cn("transition-all duration-500", currentSection === 'ask' ? "text-white scale-105 origin-left" : "blur-[1px]")}>
                {askText}
              </div>
            </div>
          )}
        </div>

        <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden relative mt-8 border border-zinc-200/50">
          <div 
            className="h-full bg-brand-primary rounded-full transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(234,179,8,0.4)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 relative z-10 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
        <div className="flex items-center gap-3">
          {!isPlaying ? (
            <button
              onClick={handleStart}
              disabled={isEditing}
              className="h-12 px-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-lg"
            >
              <IconWrapper icon={PlayIcon} size={14} className="text-brand-primary" />
              {currentTime > 0 ? "Resume" : "Start Pitch"}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="h-12 px-8 rounded-xl bg-brand-primary text-zinc-900 text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all active:scale-95 cursor-pointer shadow-lg shadow-brand-primary/20"
            >
              <IconWrapper icon={StopIcon} size={14} />
              Pause
            </button>
          )}

          {(currentTime > 0 || isPlaying) && (
            <button
              onClick={handleReset}
              className="h-12 w-12 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-900 transition-colors cursor-pointer flex items-center justify-center"
              title="Reset"
            >
              <IconWrapper icon={RotateLeft01Icon} size={18} />
            </button>
          )}
        </div>

        <div className="hidden sm:flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-[10px] text-zinc-900 font-black uppercase tracking-widest">
            <IconWrapper icon={Video01Icon} size={12} className="text-brand-primary" />
            <span>Target: ~70 words</span>
          </div>
          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Pace: 140 WPM Avg.</span>
        </div>
      </div>
    </div>
  );
};
