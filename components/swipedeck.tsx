

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, FileText, RefreshCcw, Check, MessageCircle, Flame, User, Flag, Volume2, VolumeX, AlertTriangle, Play, Pause
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { StorageService } from '../services/storageService';
import { Startup } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { CircleLoader } from './CircleLoader';
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
  const [isSwiping, setIsSwiping] = useState(false);
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
    setIsMuted(true);
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
    const success = await StorageService.submitReport(reportCard, reportReason);
    setIsSubmittingReport(false);
    if (success) {
      setReportCard(null);
      setReportReason('');
      alert("Report submitted successfully. Thank you for keeping ConnectUp safe.");
    } else {
      alert("Failed to submit report. Please try again.");
    }
  };

  return (
    <div className="h-full w-full bg-[#FFFCF0] flex flex-col font-sans relative overflow-hidden overscroll-none">

      {activeTab === 'community' ? (
        <div className="flex-1 overflow-hidden pt-24 pb-32 bg-transparent overscroll-none">
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
          {isRefreshing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50 p-8 text-center bg-[#FFFCF0]">
              <CircleLoader size="lg" />
              <p className="text-sm font-semibold text-zinc-900 mt-4 font-display">Curating startups...</p>
              <p className="text-xs text-zinc-500 mt-1">Finding matching investment opportunities</p>
            </div>
          )}

          {cards.length === 0 && !isRefreshing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 text-center animate-in fade-in duration-500">
              <RefreshCcw 
                size={78} 
                className="p-6 text-brand-primary bg-white border border-zinc-200 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_16px_48px_rgba(234,179,8,0.22)] hover:border-brand-primary/45 hover:scale-110 active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer mb-8 hover:rotate-180" 
                onClick={() => refreshData(true)}
              />
              <h2 className="text-3xl sm:text-4xl font-display font-[950] tracking-tight text-zinc-900 mb-3 leading-none transition-all duration-300 pointer-events-none select-none">All Caught Up</h2>
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
                  isSecond={isSecond}
                  isSwipingNext={isSwiping}
                  onSwiping={setIsSwiping}
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
            className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 opacity-40 blur-2xl scale-110">
              {matchedStartup.imageUrl && <img src={matchedStartup.imageUrl} className="w-full h-full object-cover" alt="" />}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-zinc-50/80 to-zinc-50" />
            
            <div className="relative z-10 flex flex-col items-center w-full max-w-xl px-6 text-center">
              <motion.h2 
                initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: -2, opacity: 1 }}
                className="text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-primary via-zinc-800 to-brand-primary italic mb-12 drop-shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              >
                IT'S A MATCH!
              </motion.h2>

              <div className="flex items-center justify-center mb-12 gap-4">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-zinc-200">
                  {userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : <User size={30} className="m-auto text-zinc-900" />}
                </div>
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                  <Flame size={20} className="text-white fill-brand-primary" />
                </div>
                <div className="w-24 h-24 rounded-full border-4 border-brand-primary shadow-2xl overflow-hidden bg-zinc-200">
                  <img src={matchedStartup.founder.avatarUrl} className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="mb-12">
                <h3 className="text-4xl font-display font-black text-zinc-900 mb-2 drop-shadow-md">{matchedStartup.name}</h3>
                <p className="text-zinc-600 font-medium text-sm tracking-wide">{matchedStartup.industry} • {matchedStartup.fundingStage}</p>
              </div>

              <div className="w-full space-y-3">
                <button onClick={handleSendMessage} className="w-full py-3 bg-zinc-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                   <MessageCircle size={20} /> Send Message
                </button>
                <button onClick={() => setMatchedStartup(null)} className="w-full py-3 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200 font-bold rounded-2xl">
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-4 sm:inset-12 md:inset-20 z-[80] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="absolute top-4 right-4 z-[90]">
              <button onClick={handleCloseMemo} className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 flex items-center justify-center transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="p-6 max-w-2xl mx-auto space-y-6">
                {/* Header & Bio */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 text-zinc-900 shadow-xl">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-bold uppercase">{memoCard.industry}</span>
                    <span className="px-2.5 py-1 bg-amber-400/20 text-amber-700 rounded-lg text-xs font-extrabold uppercase">{memoCard.fundingStage}</span>
                    {memoCard.valuationCap && (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">Valuation Cap: ${memoCard.valuationCap.toLocaleString()}</span>
                    )}
                  </div>
                  <h2 className="text-3xl font-display font-extrabold mb-2 text-zinc-900">{memoCard.name}</h2>
                  <p className="text-amber-600 font-bold text-sm leading-relaxed mb-4">{memoCard.oneLiner}</p>
                  <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-wrap font-normal">{memoCard.description}</p>
                  
                  {/* Tags */}
                  {memoCard.tags && memoCard.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-zinc-100">
                      {memoCard.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-md text-[11px] font-semibold">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {memoCard.socialMediaUrl && (
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                      <a href={memoCard.socialMediaUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 font-bold text-xs hover:underline flex items-center gap-1">
                        🌐 Official Website & Pitch Links →
                      </a>
                    </div>
                  )}
                </div>

                {/* Key Financials & Traction Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">Target Ask</div>
                    <div className="text-xl font-display font-black text-zinc-900">${memoCard.askAmount?.toLocaleString()}</div>
                  </div>
                  {memoCard.metrics?.mrr ? (
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                      <div className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">Monthly Revenue</div>
                      <div className="text-xl font-display font-black text-emerald-600">${memoCard.metrics.mrr.toLocaleString()}/mo</div>
                    </div>
                  ) : null}
                  {memoCard.metrics?.users ? (
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
                      <div className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">Active Users</div>
                      <div className="text-xl font-display font-black text-blue-600">{memoCard.metrics.users.toLocaleString()}</div>
                    </div>
                  ) : null}
                </div>
                
                {/* Funding History */}
                {memoCard.fundingHistory && memoCard.fundingHistory.length > 0 && (
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl">
                    <div className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-4">Funding & Cap Table History</div>
                    <div className="space-y-3">
                      {memoCard.fundingHistory.map((round, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b border-zinc-100 last:border-0 pb-3 last:pb-0">
                          <div>
                            <div className="font-extrabold text-zinc-900 text-sm">{round.round}</div>
                            <div className="text-xs text-zinc-500 font-medium">{round.investor}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-amber-600">{round.amount}</div>
                            <div className="text-[11px] text-zinc-400 font-medium">{round.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team & Founder Directory Details */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-zinc-900 px-1 text-sm uppercase tracking-wider text-zinc-400">Directory Founder & Key Team</h4>
                  <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-zinc-200 shadow-xl">
                    <img src={memoCard.founder.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} className="w-14 h-14 rounded-2xl object-cover border border-zinc-100 shadow-xs" />
                    <div>
                      <div className="font-extrabold text-zinc-900 text-base">{memoCard.founder.name}</div>
                      <div className="text-xs text-zinc-500 font-medium">{memoCard.founder.role} • {memoCard.founder.location || 'San Francisco, CA'}</div>
                    </div>
                  </div>

                  {memoCard.team && memoCard.team.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {memoCard.team.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-200/80">
                          <img src={member.avatarUrl} className="w-10 h-10 rounded-xl object-cover" />
                          <div className="min-w-0">
                            <div className="font-bold text-zinc-900 text-xs truncate">{member.name}</div>
                            <div className="text-[11px] text-zinc-500 truncate">{member.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
            className="absolute inset-0 z-[110] bg-zinc-950 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white border border-zinc-200 rounded-[2.5rem] w-full max-w-sm p-8 flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.1)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 opacity-90" />
              
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-2xl font-display font-black tracking-tight text-zinc-900 leading-none">Report Profile</h3>
              </div>
              
              <p className="text-[13px] font-medium text-zinc-500 leading-relaxed mb-6">
                Please specify the issue with <span className="text-zinc-900 font-bold">{reportCard.name}</span>. Your report will be processed immediately.
              </p>
              
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe details here..."
                rows={4}
                className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 transition-all min-h-[120px] mb-6 resize-none"
              />

              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={handleCancelReport}
                  className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest pl-[0.1em] text-zinc-400 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-900 hover:bg-zinc-50 active:scale-[0.98] transition-all cursor-pointer"
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

const SwipeCard = ({ 
  card, 
  isTop, 
  isSecond,
  isSwipingNext,
  onSwiping,
  isMuted, 
  onToggleMute, 
  onSwipe, 
  onOpenMemo, 
  onReport 
}: { 
  card: Startup, 
  isTop: boolean, 
  isSecond?: boolean,
  isSwipingNext?: boolean,
  onSwiping?: (swiping: boolean) => void,
  isMuted: boolean, 
  onToggleMute: () => void, 
  onSwipe: (dir: 'left' | 'right') => void, 
  onOpenMemo: () => void, 
  onReport: (card: Startup) => void 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(!isTop);
  const [flashIcon, setFlashIcon] = useState<'play' | 'pause' | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerFlash = (type: 'play' | 'pause') => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    setFlashIcon(type);
    flashTimeoutRef.current = setTimeout(() => setFlashIcon(null), 500);
  };

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);

  const startPosRef = useRef({ x: 0, y: 0 });
  const lastDownTimeRef = useRef<number>(0);

  const startTap = (e: React.PointerEvent) => {
    if (!isTop) return;
    if (e.button !== 0) return; // Only primary clicks
    
    startPosRef.current = { x: e.clientX, y: e.clientY };
    lastDownTimeRef.current = Date.now();
  };

  const handleRelease = (e: React.PointerEvent) => {
    if (!isTop) return;
    
    const elapsed = Date.now() - lastDownTimeRef.current;
    // Check if it's a quick release and they haven't dragged away
    if (elapsed < 250) {
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
  };

  const isVideo = !!card.videoUrl && isTop;

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
      onDragStart={() => {
        if (isTop && onSwiping) onSwiping(true);
      }}
      onDragEnd={isTop ? (_, info) => {
        if (onSwiping) onSwiping(false);
        if (info.offset.x > 100) onSwipe('right');
        else if (info.offset.x < -100) onSwipe('left');
      } : undefined}
      onPointerDown={isTop ? startTap : undefined}
      onPointerUp={isTop ? handleRelease : undefined}
      className={`absolute inset-0 w-full h-full bg-zinc-900 overflow-hidden select-none shadow-lg ${
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
            preload="metadata"
            onPlayingChange={(isPlayingNow) => {
              setIsPaused(!isPlayingNow);
            }}
          />
        ) : card.imageUrl ? (
          <img src={card.imageUrl} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
             <span className="text-white/20 font-display font-black text-6xl tracking-widest uppercase">{card.name ? card.name[0] : ''}</span>
          </div>
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

      <div className="absolute inset-0 z-30 flex flex-col justify-end p-6 pb-6 md:pb-12 pointer-events-none">
        {/* Bottom Info and Actions Container */}
        <div className="flex items-end justify-between w-full pointer-events-auto md:mb-20">
          <div className="flex flex-col gap-2 flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-brand-primary/90 text-zinc-900 rounded text-[10px] font-bold uppercase">{card.industry}</span>
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white rounded text-[10px] font-bold uppercase">{card.fundingStage}</span>
            </div>
            <h2 className="text-3xl font-display font-black text-white drop-shadow-md leading-tight">{card.name}</h2>
            <p className="text-white/90 text-sm font-medium line-clamp-2 drop-shadow-sm">{card.oneLiner}</p>
          </div>
          <div className="flex flex-col gap-4 shrink-0">
            <button 
              onPointerDown={(e) => { e.stopPropagation(); isTop && onToggleMute(); }} 
              className="flex flex-col items-center group cursor-pointer text-white hover:text-white/85 transition-colors animate-in fade-in zoom-in duration-350"
              title={isMuted ? "Unmute" : "Mute"}
            >
              <div className="flex items-center justify-center text-white drop-shadow-lg group-active:scale-90 transition-transform pointer-events-auto h-10 w-10 bg-black/35 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/50 hover:border-white/20">
                {isMuted ? <VolumeX size={18} strokeWidth={2} /> : <Volume2 size={18} strokeWidth={2} />}
              </div>
            </button>

            <button 
              onPointerDown={(e) => { e.stopPropagation(); isTop && onOpenMemo(); }} 
              className="flex flex-col items-center group cursor-pointer text-white hover:text-white/85 transition-colors"
              title="Memo"
            >
              <div className="flex items-center justify-center text-white drop-shadow-lg group-active:scale-90 transition-transform pointer-events-auto h-10 w-10 bg-black/35 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/50 hover:border-white/20">
                <FileText size={18} strokeWidth={2} />
              </div>
            </button>

            <button 
              onPointerDown={(e) => { e.stopPropagation(); isTop && onReport(card); }} 
              className="flex flex-col items-center group cursor-pointer text-white hover:text-white/85 transition-colors"
              title="Report Profile"
            >
              <div className="flex items-center justify-center text-white drop-shadow-lg group-active:scale-90 transition-transform pointer-events-auto h-10 w-10 bg-black/35 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/50 hover:border-white/20">
                <Flag size={18} strokeWidth={2} className="text-red-400 group-hover:text-red-300" />
              </div>
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

