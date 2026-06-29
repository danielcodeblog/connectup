import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, FileText, RefreshCcw, Check, MessageCircle, Flame, User, Flag, Volume2, VolumeX, AlertTriangle, Play, Pause
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { StorageService } from '../services/storageService';
import { Startup } from '../types';
import { VideoPlayer } from './VideoPlayer';
import CommunityFeed from './communityfeed';
import UserProfileView from './UserProfileView';

interface SwipeDeckProps {
  onMatch?: (startup: Startup) => void;
  userProfile?: { name?: string, avatarUrl?: string, title?: string };
}

// Main discovery swipe interface for investors
const SwipeDeck: React.FC<SwipeDeckProps> = React.memo(({ onMatch, userProfile }) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'community'>('discover');
  const [cards, setCards] = useState<Startup[]>([]);
  const [currentInfoOpen, setCurrentInfoOpen] = useState(false);
  const [memoCard, setMemoCard] = useState<Startup | null>(null); 
  const [reportCard, setReportCard] = useState<Startup | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [matchedStartup, setMatchedStartup] = useState<Startup | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  // Initial Load
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async (resetSwipes = false) => {
    setIsRefreshing(true);
    if (resetSwipes) {
       await StorageService.resetSwipes();
    }
    const data = await StorageService.getStartups();
    setCards(data);
    setIsRefreshing(false);
  };

  const handleSwipe = useCallback((direction: 'left' | 'right', startup: Startup) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(direction === 'right' ? 20 : 10);
    }

    StorageService.processSwipe(startup.id, direction);
    
    if (direction === 'right') {
      // Automatically register the connection so it registers on messages immediately in the background
      StorageService.ensureConnection(startup.id).then((chatId) => {
         console.log("Automatic swipe-match connection registered:", chatId);
      });
      setMatchedStartup(startup);
    }

    setCards(prev => prev.filter(c => c.id !== startup.id));
  }, []);

  const handleOpenMemo = (card: Startup) => {
    setMemoCard(card);
    setCurrentInfoOpen(true);
  };

  const handleCloseMemo = () => {
    setCurrentInfoOpen(false);
    setTimeout(() => setMemoCard(null), 300);
  };

  const handleSendMessage = () => {
    if (matchedStartup && onMatch) onMatch(matchedStartup);
    setMatchedStartup(null);
  };

  const handleOpenReport = (card: Startup) => {
    setReportCard(card);
    setReportReason('');
  };

  const handleCancelReport = () => {
    setReportCard(null);
    setReportReason('');
  };

  const handleSubmitReport = async () => {
    if (!reportCard || !reportReason.trim()) return;
    setIsSubmittingReport(true);
    await StorageService.submitReport(reportCard.id, reportReason);
    setIsSubmittingReport(false);
    setReportCard(null);
    setReportReason('');
  };

  return (
    <div className="h-full w-full bg-[#FFFCF0] flex flex-col font-sans relative overflow-hidden">


      {activeTab === 'community' ? (
        <div className="flex-1 overflow-hidden pt-24 pb-32 bg-transparent">
          <div className="max-w-4xl mx-auto h-full">
            <CommunityFeed 
              userProfile={userProfile} 
              onMessage={(authorId) => {
                StorageService.ensureConnection(authorId).then(chatId => {
                  if (chatId && onMatch) {
                    onMatch({ id: authorId, name: 'User' } as any); 
                  }
                });
              }} 
              onViewProfile={setSelectedProfileId} 
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 relative w-full h-full bg-transparent overflow-hidden">
          {cards.length === 0 && !isRefreshing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 text-center animate-in fade-in duration-500">
              <RefreshCcw 
                size={78} 
                className="p-6 text-brand-primary bg-white border border-zinc-200/60 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_48px_rgba(234,179,8,0.22)] hover:border-brand-primary/45 hover:scale-110 active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer mb-8 hover:rotate-180" 
                onClick={() => refreshData(true)}
              />
              <h2 className="text-3xl sm:text-4xl font-display font-[950] tracking-tight text-zinc-900 mb-3 leading-none transition-all duration-300 pointer-events-none select-none">All Caught Up</h2>
              <p className="text-zinc-500/90 text-sm sm:text-base max-w-sm mx-auto mb-10 leading-relaxed font-sans font-medium px-4 tracking-tight select-none">You've curated your feed perfectly. We will notify you dynamic new opportunities matching your profile go active.</p>
            </div>
          )}

          <AnimatePresence>
            {cards.map((card, index) => {
              const isTop = index === cards.length - 1;
              const isSecond = index === cards.length - 2;
              if (!isTop && !isSecond) return null;
              
              return (
                <SwipeCard 
                  key={card.id} 
                  card={card} 
                  isTop={isTop} 
                  isMuted={isMuted}
                  onToggleMute={() => setIsMuted(prev => !prev)}
                  onSwipe={(dir) => handleSwipe(dir, card)}
                  onOpenMemo={() => handleOpenMemo(card)}
                  onReport={() => handleOpenReport(card)}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* MATCH OVERLAY */}
      <AnimatePresence>
        {matchedStartup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 opacity-40 blur-2xl scale-110">
              {matchedStartup.imageUrl && <img src={matchedStartup.imageUrl} className="w-full h-full object-cover" alt="" />}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-zinc-950/80 to-zinc-950" />
            
            <div className="relative z-10 flex flex-col items-center w-full max-w-xl px-6 text-center">
              <motion.h2 
                initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: -2, opacity: 1 }}
                className="text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-primary via-white to-brand-primary italic mb-12 drop-shadow-[0_4px_12px_rgba(234,179,8,0.25)]"
              >
                IT'S A MATCH!
              </motion.h2>

              <div className="flex items-center justify-center mb-12 gap-4">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-zinc-200">
                  {userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : <User size={30} className="m-auto text-zinc-900" />}
                </div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-[#FFFCF0]">
                  <Flame size={20} className="text-black fill-brand-primary" />
                </div>
                <div className="w-24 h-24 rounded-full border-4 border-brand-primary shadow-2xl overflow-hidden bg-zinc-200">
                  <img src={matchedStartup.founder.avatarUrl} className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="mb-12">
                <h3 className="text-4xl font-display font-black text-white mb-2 drop-shadow-md">{matchedStartup.name}</h3>
                <p className="text-zinc-300 font-medium text-sm tracking-wide">{matchedStartup.industry} • {matchedStartup.fundingStage}</p>
              </div>

              <div className="w-full space-y-3">
                <button onClick={handleSendMessage} className="w-full py-3 bg-brand-primary text-zinc-900 font-bold rounded-2xl flex items-center justify-center gap-2">
                  <MessageCircle size={20} /> Send Message
                </button>
                <button onClick={() => setMatchedStartup(null)} className="w-full py-3 bg-zinc-200 text-zinc-600 font-bold rounded-2xl">
                  Keep Swiping
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MEMO OVERLAY */}
      <AnimatePresence>
        {currentInfoOpen && memoCard && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-[80] bg-black flex flex-col"
          >
            <div className="absolute top-4 w-full z-[90] flex justify-center">
              <button onClick={handleCloseMemo} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
              <div className="p-6 max-w-2xl mx-auto pt-20">
                <div className="bg-zinc-900 rounded-3xl p-6 text-white mb-6">
                  <div className="flex gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold uppercase">{memoCard.industry}</span>
                    <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded text-[10px] font-bold uppercase">{memoCard.fundingStage}</span>
                  </div>
                  <h2 className="text-3xl font-display font-bold mb-2">{memoCard.name}</h2>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">{memoCard.oneLiner}</p>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{memoCard.description}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-sm mb-6">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Asks For</div>
                  <div className="text-2xl font-display font-bold text-white">${memoCard.askAmount?.toLocaleString()}</div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-white px-1">Founder</h4>
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 shadow-sm">
                    <img src={memoCard.founder.avatarUrl} className="w-12 h-12 rounded-2xl object-cover" />
                    <div>
                      <div className="font-bold text-white">{memoCard.founder.name}</div>
                      <div className="text-xs text-zinc-400">{memoCard.founder.role} • {memoCard.founder.location}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REPORT MODAL */}
      <AnimatePresence>
        {reportCard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] bg-black/75 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-black border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 opacity-90" />
              
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-2xl font-display font-black tracking-tight text-white leading-none">Report Profile</h3>
              </div>
              
              <p className="text-[13px] font-medium text-zinc-400 leading-relaxed mb-6">
                Please specify the issue with <span className="text-white font-bold">{reportCard.name}</span>. Your report will be processed immediately.
              </p>
              
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe details here..."
                rows={4}
                className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 transition-all min-h-[120px] mb-6 resize-none"
              />

              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={handleCancelReport}
                  className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest pl-[0.1em] text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitReport}
                  disabled={!reportReason.trim() || isSubmittingReport}
                  className="flex-1 h-12 bg-red-500 text-white hover:bg-red-400 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-2xl font-black text-xs uppercase tracking-widest pl-[0.1em] shadow-[0_8px_20px_rgba(239,68,68,0.15)] hover:shadow-[0_12px_28px_rgba(239,68,68,0.25)] disabled:shadow-none active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmittingReport ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : 'Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedProfileId && (
        <UserProfileView userId={selectedProfileId} onClose={() => setSelectedProfileId(null)} />
      )}
    </div>
  );
});

const SwipeCard = ({ card, isTop, isMuted, onToggleMute, onSwipe, onOpenMemo, onReport }: { card: Startup, isTop: boolean, isMuted: boolean, onToggleMute: () => void, onSwipe: (dir: 'left' | 'right') => void, onOpenMemo: () => void, onReport: (card: Startup) => void }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [flashIcon, setFlashIcon] = useState<'play' | 'pause' | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerFlash = (type: 'play' | 'pause') => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    setFlashIcon(type);
    flashTimeoutRef.current = setTimeout(() => setFlashIcon(null), 500);
  };

  useEffect(() => {
    if (isTop) {
      setIsPaused(false);
    }
  }, [isTop]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);

  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const lastDownTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  const startHold = (e: React.PointerEvent) => {
    if (!isTop) return;
    if (e.button !== 0) return; // Only primary clicks
    
    setHoldProgress(0);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    lastDownTimeRef.current = Date.now();

    const startTime = Date.now();
    const duration = 6000; // 6 seconds total
    const threshold = 1500; // 1.5 seconds threshold before showing overlay
    
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setHoldProgress(progress);
      
      if (elapsed >= threshold) {
        setIsHolding(true);
      }
      
      if (progress >= 1) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      }
    }, 50);

    holdTimerRef.current = setTimeout(() => {
      onReport(card);
      cancelHold();
    }, duration);
  };

  const cancelHold = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  const handleRelease = (e: React.PointerEvent) => {
    if (!isTop) return;
    
    const elapsed = Date.now() - lastDownTimeRef.current;
    // Check if it's a quick release and they haven't held for long or dragged away
    if (elapsed < 250 && holdTimerRef.current) {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      if (dx < 10 && dy < 10) {
        setIsPaused(prev => {
          const next = !prev;
          triggerFlash(next ? 'pause' : 'play');
          return next;
        });
      }
    }
    cancelHold();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!holdTimerRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 10 || dy > 10) {
      cancelHold();
    }
  };

  const isVideo = !!card.videoUrl;

  return (
    <motion.div
      style={{ 
        x: isTop ? x : 0, 
        rotate: isTop ? rotate : 0, 
        opacity: isTop ? opacity : 0.6 
      }}
      animate={{
        scale: isTop ? 1 : 0.95,
        y: isTop ? 0 : 8,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25
      }}
      drag={isTop ? "x" : undefined}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 500, bounceDamping: 32 }}
      onDragStart={isTop ? cancelHold : undefined}
      onDragEnd={isTop ? (_, info) => {
        if (info.offset.x > 100) onSwipe('right');
        else if (info.offset.x < -100) onSwipe('left');
      } : undefined}
      onPointerDown={isTop ? startHold : undefined}
      onPointerUp={isTop ? handleRelease : undefined}
      onPointerLeave={isTop ? cancelHold : undefined}
      onPointerCancel={isTop ? cancelHold : undefined}
      onPointerMove={isTop ? handlePointerMove : undefined}
      className={`absolute inset-0 w-full h-full bg-zinc-900 overflow-hidden select-none ${
        isTop ? 'cursor-grab active:cursor-grabbing touch-none z-20' : 'pointer-events-none z-10'
      }`}
    >
      <div className="absolute inset-0 w-full h-full bg-zinc-900">
        {isVideo ? (
          <VideoPlayer 
            key={card.id} 
            src={card.videoUrl} 
            className="w-full h-full object-cover" 
            autoPlay={false} 
            playing={isTop && !isPaused}
            muted={isMuted} 
            loop 
            controls={true} 
            disableIntersectionObserver={true}
            onPlayingChange={(isPlayingNow) => {
              setIsPaused(!isPlayingNow);
            }}
          />
        ) : (
          <img 
            onLoad={() => setImageLoaded(true)}
            src={card.imageUrl} 
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
            alt={card.name} 
          />
        )}
        
        {/* Overlays */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />



        {/* Swipe Feedback */}
        {isTop && (
          <>
            <motion.div style={{ opacity: likeOpacity }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
               <div className="p-6 rounded-full bg-brand-primary text-black shadow-2xl border-4 border-black"><Check size={48} strokeWidth={4} /></div>
            </motion.div>
            <motion.div style={{ opacity: nopeOpacity }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
               <div className="p-6 rounded-full bg-white text-black shadow-2xl border-4 border-black"><X size={48} strokeWidth={4} /></div>
            </motion.div>
          </>
        )}
      </div>

      {/* 6-Second Hold to Report Overlay */}
      <AnimatePresence>
        {isTop && isHolding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md z-50 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className="stroke-zinc-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className="stroke-brand-primary transition-all duration-75"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - holdProgress)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="flex flex-col items-center">
                <Flag size={32} className="text-brand-primary fill-brand-primary animate-pulse mb-1" />
                <span className="text-[10px] font-mono text-zinc-400 font-bold">
                  {Math.max(0, Math.ceil(6 - holdProgress * 6))}s
                </span>
              </div>
            </div>
            
            <p className="text-white text-sm font-display font-black tracking-widest uppercase mt-6">
              Keep holding to report profile...
            </p>
            <p className="text-zinc-400 text-xs mt-1">
              Release to cancel
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-30 flex flex-col justify-end p-6 pb-26 pointer-events-none">
        {/* Bottom Actions Container */}
        <div className="flex items-end justify-end w-full pointer-events-auto">
          <div className="flex flex-col gap-4">
            {isVideo && (
              <button 
                onPointerDown={(e) => { e.stopPropagation(); isTop && onToggleMute(); }} 
                className="flex flex-col items-center gap-1 group cursor-pointer text-white hover:text-white/85 transition-colors animate-in fade-in zoom-in duration-350"
                title={isMuted ? "Unmute Pitch" : "Mute Pitch"}
              >
                <div className="flex items-center justify-center text-white drop-shadow-lg group-active:scale-90 transition-transform pointer-events-auto h-10 w-10 bg-black/35 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/50 hover:border-white/20">
                  {isMuted ? <VolumeX size={18} strokeWidth={2} /> : <Volume2 size={18} strokeWidth={2} />}
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md">
                  {isMuted ? "Unmute" : "Mute"}
                </span>
              </button>
            )}

            <button 
              onPointerDown={(e) => { e.stopPropagation(); isTop && onOpenMemo(); }} 
              className="flex flex-col items-center gap-1 group cursor-pointer text-white hover:text-white/85 transition-colors"
            >
              <div className="flex items-center justify-center text-white drop-shadow-lg group-active:scale-90 transition-transform pointer-events-auto h-10 w-10 bg-black/35 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/50 hover:border-white/20">
                <FileText size={18} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">Memo</span>
            </button>
          </div>
        </div>
      </div>
      <ImagePreloader imageUrl={card.imageUrl} isTop={isTop} />
    </motion.div>
  );
};

export default SwipeDeck;


// --- Helper component to preload images ---
const ImagePreloader = ({ imageUrl, isTop }: { imageUrl: string, isTop: boolean }) => {
  useEffect(() => {
    if (!isTop && imageUrl) {
      const img = new Image();
      img.src = imageUrl;
    }
  }, [isTop, imageUrl]);

  return null;
};

