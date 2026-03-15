

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, ArrowUpRight, Info,
  Scan, Check, Filter, SendHorizontal, BriefcaseBusiness, ChevronLeft, RotateCw, BadgeCheck, MessageCircle, LayoutGrid, Users, Flame, Globe, Crown
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { Startup } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { CommunityTab } from './CommunityTab';
import { UserProfileView } from './UserProfileView';

interface SwipeDeckProps {
  onMatch?: (startup: Startup) => void;
  userProfile?: { name?: string, avatarUrl?: string, title?: string, subscriptionTier?: string };
}

export const SwipeDeck: React.FC<SwipeDeckProps> = React.memo(({ onMatch, userProfile }) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'community'>('discover');
  // Discover/Swipe State
  const [cards, setCards] = useState<Startup[]>([]);
  const [history, setHistory] = useState<Startup[]>([]); 
  const [currentInfoOpen, setCurrentInfoOpen] = useState(false);
  const [isExitingMemo, setIsExitingMemo] = useState(false);
  const [memoCard, setMemoCard] = useState<Startup | null>(null); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [matchedStartup, setMatchedStartup] = useState<Startup | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [swipeCount, setSwipeCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  
  // Animation & Gesture State
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const dragStartTimeRef = useRef<number>(0);

  // Memo Gesture State
  const [memoDragX, setMemoDragX] = useState(0);
  const [isMemoDragging, setIsMemoDragging] = useState(false);
  // Changed to track X and Y for directional locking
  const memoDragStartRef = useRef<{ x: number, y: number } | null>(null);
  const memoDragStartTimeRef = useRef<number>(0);
  const memoContentRef = useRef<HTMLDivElement>(null);
  
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
    // Simulate slight delay for effect if data loads too fast
    await new Promise(resolve => setTimeout(resolve, 600));
    setCards(data);
    setHistory([]);
    setSwipeCount(0);
    setIsRefreshing(false);
  };

  const activeIndex = cards.length - 1;
  const activeCard = cards[activeIndex];

  // Reset state when active card changes
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    dragStartRef.current = null;
  }, [activeCard?.id]);

  // --- DECK GESTURE HANDLERS ---

  const handlePanStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
    dragStartTimeRef.current = Date.now();
  };

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (!dragStartRef.current) return;
    
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    
    setDragOffset({ x: dx, y: dy * 0.2 }); // damp vertical
  }, []);

  const handlePanEnd = useCallback(() => {
    if (!dragStartRef.current) return;

    const dx = dragOffset.x;
    const timeElapsed = Date.now() - dragStartTimeRef.current;
    const velocity = Math.abs(dx) / (timeElapsed || 1);

    const screenWidth = window.innerWidth;
    const distThreshold = screenWidth * 0.25; 
    const flickVelocityThreshold = 0.3; 
    const flickDistThreshold = 20; 

    const isFlick = velocity > flickVelocityThreshold && Math.abs(dx) > flickDistThreshold;
    const isDrag = Math.abs(dx) > distThreshold;

    if (isFlick || isDrag) {
       const direction = dx > 0 ? 'right' : 'left';
       confirmSwipe(direction, velocity);
    } else {
       setDragOffset({ x: 0, y: 0 });
    }

    setIsDragging(false);
    dragStartRef.current = null;
  }, [dragOffset.x]);

  // Global Event Listeners for Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { if (isDragging) handlePanMove(e.clientX, e.clientY); };
    const handleMouseUp = () => { if (isDragging) handlePanEnd(); };
    const handleTouchMove = (e: TouchEvent) => { if (isDragging) handlePanMove(e.touches[0].clientX, e.touches[0].clientY); };
    const handleTouchEnd = () => { if (isDragging) handlePanEnd(); };

    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);
    };

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handlePanMove, handlePanEnd]);


  // --- MEMO HANDLERS ---
  const handleOpenMemo = () => {
    if (activeCard) {
      setMemoCard(activeCard);
      setCurrentInfoOpen(true);
      setIsExitingMemo(false);
      setMemoDragX(0);
    }
  };

  const handleCloseMemo = () => {
    setIsExitingMemo(true);
    setTimeout(() => {
      setCurrentInfoOpen(false);
      setIsExitingMemo(false);
      setMemoCard(null);
      setMemoDragX(0);
    }, 400); 
  };

  const handleMemoTouchStart = (e: React.TouchEvent) => {
      // Capture start position for X and Y to calculate angle
      memoDragStartRef.current = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      };
      memoDragStartTimeRef.current = Date.now();
      setIsMemoDragging(false); // Reset dragging state
  };

  const handleMemoTouchMove = (e: React.TouchEvent) => {
      if (!memoDragStartRef.current) return;
      
      const dx = e.touches[0].clientX - memoDragStartRef.current.x;
      const dy = e.touches[0].clientY - memoDragStartRef.current.y;
      
      // Directional Locking:
      // Only treat as a swipe if horizontal movement is significantly larger than vertical movement.
      // This prevents the swipe from triggering while the user is scrolling down the content.
      if (!isMemoDragging) {
         if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
             setIsMemoDragging(true);
         }
      }

      if (isMemoDragging) {
         // Prevent default only if we are sure it's a swipe (handled via CSS touch-action usually, but state helps logic)
         setMemoDragX(dx);
      }
  };

  const handleMemoTouchEnd = () => {
      if (!memoDragStartRef.current) return;

      if (isMemoDragging) {
          const dx = memoDragX;
          const timeElapsed = Date.now() - memoDragStartTimeRef.current;
          const velocity = Math.abs(dx) / (timeElapsed || 1);
          
          // Dismiss condition: Swipe Left
          // Threshold: dragged left more than 100px OR flicked left fast
          const isDismiss = (dx < -100) || (dx < -40 && velocity > 0.4);

          if (isDismiss) {
              // Haptic Feedback
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  navigator.vibrate(15);
              }

              // Animate out to the left
              setMemoDragX(-window.innerWidth); 
              
              setTimeout(() => {
                  setCurrentInfoOpen(false);
                  setMemoCard(null);
                  setMemoDragX(0);
                  setIsMemoDragging(false);
                  memoDragStartRef.current = null;
              }, 300);
          } else {
              // Snap back
              setMemoDragX(0);
              setIsMemoDragging(false);
          }
      }

      memoDragStartRef.current = null;
  };

  // --- ACTIONS ---
  const confirmSwipe = useCallback((direction: 'left' | 'right', velocity: number = 0) => {
    if (userProfile?.subscriptionTier !== 'Pro' && swipeCount >= 5) {
        setShowPaywall(true);
        setDragOffset({ x: 0, y: 0 });
        return;
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
       navigator.vibrate(direction === 'right' ? 20 : 10);
    }

    const endX = direction === 'right' ? window.innerWidth + 200 : -window.innerWidth - 200;
    const endY = dragOffset.y * 0.5; 

    setDragOffset({ x: endX, y: endY });

    setTimeout(() => {
      setCards(prevCards => {
          const cardThatWasSwiped = prevCards[prevCards.length - 1];
          if (cardThatWasSwiped) {
              setHistory(prev => [...prev, cardThatWasSwiped]);
              StorageService.processSwipe(cardThatWasSwiped.id, direction);
              if (direction === 'right') {
                setMatchedStartup(cardThatWasSwiped);
              }
          }
          const newCards = [...prevCards];
          newCards.pop();
          return newCards;
      });
      setSwipeCount(prev => prev + 1);
      setDragOffset({ x: 0, y: 0 });
    }, 300); 
  }, [dragOffset.y, userProfile?.subscriptionTier, swipeCount]);

  const handleSendMessage = () => {
    if (matchedStartup && onMatch) onMatch(matchedStartup);
    setMatchedStartup(null);
  };

  const rotate = dragOffset.x * 0.035; 
  const visibleCards = cards.slice(-2); // Show fewer cards for better performance with video

  return (
    <div className="h-full bg-[#FFFCF0] flex flex-col font-sans relative overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 bg-[#FFFCF0] pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[60%] bg-brand-primary/30 rounded-[50%] blur-3xl opacity-60 animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-purple-200/30 rounded-full blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>
      <div className="absolute top-0 left-0 right-0 z-[50] safe-area-top pt-6 flex justify-center pointer-events-none">
          <div className="text-lg font-display font-bold text-white tracking-tighter">
            Connect<span className="text-yellow-400">Up</span>
          </div>
      </div>

      {activeTab === 'community' ? (
          <div className="flex-1 overflow-y-auto pt-24 pb-32 px-4 bg-zinc-950">
              <div className="max-w-4xl mx-auto">
                  <CommunityTab userProfile={userProfile} onMessage={(authorId) => {
                      // For investors, we might want a different behavior or just use the same onMatch logic if it's a startup author
                      // But for now, let's just use the alert or a simple connection
                      StorageService.ensureConnection(authorId).then(chatId => {
                          if (chatId && onMatch) {
                              // We reuse onMatch to signal the app to open the chat
                              onMatch({ id: authorId, name: 'User' } as any); 
                          }
                      });
                  }} onViewProfile={setSelectedProfileId} />
              </div>
          </div>
      ) : (
          <>
            {/* --- EMPTY STATE --- */}
      {cards.length === 0 && !matchedStartup && (
        <div className="w-full max-w-xl mx-auto h-full flex flex-col items-center justify-center relative z-10 bg-transparent text-zinc-900 overflow-hidden animate-in fade-in duration-500">
           
           {/* Ambient Background */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-100/40 via-transparent to-transparent pointer-events-none"></div>
           <div className="absolute top-0 w-full h-64 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none"></div>

           {/* Radar / Scanner Visual */}
           <div className="relative mb-12">
               {/* Core Scanner */}
               <div className="w-40 h-40 rounded-full border border-zinc-200/50 flex items-center justify-center relative z-20 bg-white/50 backdrop-blur-xl shadow-2xl">
                   <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/50 to-transparent opacity-50"></div>
                   <Scan size={48} className="text-brand-primary drop-shadow-[0_0_20px_rgba(255,208,0,0.6)]" strokeWidth={1.5} />
               </div>

               {/* Ripple Effects */}
               <div className="absolute inset-0 border border-white/5 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-50"></div>
               <div className="absolute inset-0 -m-8 border border-white/5 rounded-full opacity-30"></div>
               <div className="absolute inset-0 -m-16 border border-white/5 rounded-full opacity-10"></div>
               
               {/* Scanning Line */}
               <div className="absolute inset-0 -m-20 rounded-full animate-spin-slow opacity-30 pointer-events-none">
                  <div className="w-full h-1/2 bg-gradient-to-r from-transparent via-brand-primary/10 to-transparent blur-xl"></div>
               </div>
           </div>

           {/* Text Content */}
           <div className="relative z-20 text-center px-6">
               <h2 className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 mb-3 tracking-tighter">
                 All Caught Up
               </h2>
               <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-xs mx-auto mb-10">
                  You've swiped through today's top deal flow.<br/>
                  Check back soon for new startups.
               </p>

               {/* Action Button */}
               <button 
                 onClick={() => refreshData(true)} 
                 disabled={isRefreshing}
                 className="group relative px-8 py-4 bg-black text-white font-bold rounded-full text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(0,0,0,0.1)] overflow-hidden disabled:opacity-70 disabled:scale-100"
               >
                 <span className="relative z-10 flex items-center gap-2">
                    <RotateCw size={14} className={`transition-transform duration-700 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh Feed'}
                 </span>
                 <div className="absolute inset-0 bg-brand-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
               </button>
           </div>
        </div>
      )}

      {/* --- CARD STACK CONTAINER --- */}
      <div className="flex-1 relative w-full h-full bg-transparent flex items-center justify-center overflow-hidden sm:p-6">
        <div className="relative w-full h-full sm:aspect-[9/16] sm:w-auto sm:max-w-full mx-auto">
        {visibleCards.map((card, index) => {
            const stackIndex = visibleCards.length - 1 - index;
            const isTopCard = stackIndex === 0;
            const isBackCard = stackIndex === 1;
            
            let cardStyle: React.CSSProperties = {};
            
            if (isTopCard) {
                cardStyle = {
                    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotate}deg)`,
                    zIndex: 20,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    touchAction: 'none',
                };
            } else if (isBackCard) {
                const scale = 0.96 + (Math.min(Math.abs(dragOffset.x), window.innerWidth) / window.innerWidth) * 0.04;
                cardStyle = {
                    transform: `scale(${scale})`,
                    zIndex: 10,
                    opacity: 1, // Keep back card fully opaque for smoother transition
                    filter: 'brightness(0.5)' // Dim back card
                };
            } else {
                cardStyle = { transform: `scale(0.9)`, zIndex: 0, opacity: 0 };
            }

            return (
              <div 
                key={card.id}
                onMouseDown={isTopCard ? (e) => handlePanStart(e.clientX, e.clientY) : undefined}
                onTouchStart={isTopCard ? (e) => handlePanStart(e.touches[0].clientX, e.touches[0].clientY) : undefined}
                className={`absolute inset-0 w-full h-full sm:rounded-3xl bg-zinc-900 overflow-hidden shadow-2xl transition-transform duration-300 ease-out origin-bottom ${isTopCard && isDragging ? '!transition-none' : ''}`}
                style={cardStyle}
              >
                 {/* FULL MEDIA AREA */}
                 <div className="absolute inset-0 w-full h-full bg-black">
                     {card.videoUrl ? (
                        <VideoPlayer 
                          src={card.videoUrl}
                          /* Removed poster to prevent cover image display */
                          className="w-full h-full object-cover"
                          autoPlay={isTopCard} 
                          muted={!isTopCard} // Mute back card  
                          loop={true}
                          controls={false} // Explicitly disable controls in feed
                        />
                     ) : card.imageUrl ? (
                         <img src={card.imageUrl} className="w-full h-full object-cover" alt={card.name} />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                             <span className="text-4xl font-display font-black text-white/20">{card.name}</span>
                         </div>
                     )}
                     
                     {/* GRADIENT OVERLAYS */}
                     <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"></div>
                     <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none"></div>

                     {/* Swipe Feedback Icons */}
                     {isTopCard && (
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 transition-opacity duration-200" style={{ opacity: Math.abs(dragOffset.x) / 100 }}>
                            {dragOffset.x > 0 ? (
                                <div className="p-6 rounded-full bg-brand-primary text-black shadow-[0_0_50px_rgba(255,208,0,0.5)] scale-125 border-4 border-black"><Check size={48} strokeWidth={4} /></div>
                            ) : (
                                <div className="p-6 rounded-full bg-white text-black shadow-2xl scale-125 border-4 border-black"><X size={48} strokeWidth={4} /></div>
                            )}
                        </div>
                     )}
                 </div>
                 
                 {/* INFO & ACTION LAYER - TIKTOK STYLE */}
                 <div className="absolute inset-0 z-30 flex flex-col justify-end pointer-events-none" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                    
                    {/* Increased Bottom Padding to 'lift' content up */}
                    <div className="flex items-end justify-between px-4 pb-36 sm:pb-40 w-full">
                    
                        {/* Left Column: Text Info */}
                        <div className="flex-1 mr-4 pointer-events-auto space-y-2 pb-1">
                            
                             {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                            </div>

                            {/* Title & Description */}
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight drop-shadow-lg mb-1">
                                {card.name}
                                </h2>
                            </div>

                            {/* Stats/Badges Row (Compact) */}
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-right pt-1">
                                {/* Founder */}
                                <div className="flex items-center gap-2 bg-zinc-900/60 backdrop-blur-md rounded-xl p-1.5 pr-3 border border-white/10 shrink-0">
                                    <img src={card.founder.avatarUrl} className="w-6 h-6 rounded-full object-cover border border-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[7px] font-bold text-zinc-400 uppercase">Founder</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[9px] font-bold text-white leading-none">{card.founder.name}</span>
                                            {/* VERIFIED BADGE FOR PRO ONLY */}
                                            {card.founder.subscriptionTier === 'Pro' && (
                                                <BadgeCheck size={10} className="text-brand-primary fill-black" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Raise */}
                                <div className="flex flex-col justify-center bg-zinc-900/60 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/10 shrink-0">
                                    <span className="text-[7px] font-bold text-zinc-400 uppercase">Asking</span>
                                    <span className="text-[10px] font-bold text-brand-primary">
                                        ${card.askAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                        </div>

                        {/* Right Column: Actions (TikTok style) */}
                        <div className="flex flex-col gap-6 items-center pointer-events-auto pb-0 shrink-0">
                             
                             {/* Memo Button */}
                             <button onClick={handleOpenMemo} className="group flex flex-col items-center gap-1">
                                 <div className="w-12 h-12 rounded-full bg-zinc-900/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform">
                                     <Info size={24} strokeWidth={2.5} />
                                 </div>
                                 <span className="text-[10px] font-bold text-white drop-shadow-md">Memo</span>
                             </button>

                             {/* Profile/More could go here in future */}
                        </div>

                    </div>
                 </div>
              </div>
            );
        })}
        </div>
      </div>

      {/* --- MEMO OVERLAY --- */}
      {currentInfoOpen && memoCard && (
         <div 
            className={`absolute inset-0 z-[60] bg-zinc-950 flex flex-col ${isExitingMemo ? 'animate-slide-out-left' : 'animate-slide-up'}`}
            style={{ 
               transform: memoDragX !== 0 ? `translateX(${memoDragX}px)` : undefined,
               transition: isMemoDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' 
            }}
            onTouchStart={handleMemoTouchStart}
            onTouchMove={handleMemoTouchMove}
            onTouchEnd={handleMemoTouchEnd}
         >
             {/* Floating Close Button - Centered */}
             <div className="absolute top-0 w-full z-50 pt-safe-top flex justify-center mt-2 pointer-events-none">
                 <button 
                    onClick={handleCloseMemo} 
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 flex items-center justify-center pointer-events-auto hover:bg-black/60 transition-all shadow-lg"
                 >
                    <X size={20} />
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto pb-32 no-scrollbar bg-black" ref={memoContentRef}>
                 <div className="relative w-full aspect-video bg-zinc-900">
                     {memoCard.videoUrl ? (
                        <VideoPlayer 
                            src={memoCard.videoUrl} 
                            /* Removed poster to prevent cover image display */
                            className="w-full h-full object-cover" 
                            autoPlay 
                            muted 
                            loop 
                            controls={true} // Enable controls for Memo view
                        />
                     ) : memoCard.imageUrl ? (
                         <img src={memoCard.imageUrl} className="w-full h-full object-cover" alt="" />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                             <span className="text-4xl font-display font-black text-white/20">{memoCard.name}</span>
                         </div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-100 pointer-events-none"></div>
                 </div>

                 <div className="max-w-3xl mx-auto mt-6 relative z-10 px-6 pb-12">
                    <div className="bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-white/10 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 blur-[60px] rounded-full pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="flex items-center space-x-2 mb-3">
                                <span className="px-2 py-0.5 bg-white/10 text-zinc-300 border border-white/5 text-[10px] font-bold uppercase rounded-md">{memoCard.industry}</span>
                                <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase rounded-md">{memoCard.fundingStage}</span>
                            </div>
                            <h1 className="text-3xl font-display font-bold text-white leading-tight mb-2">{memoCard.name}</h1>
                            <p className="text-zinc-400 text-sm font-medium leading-relaxed">{memoCard.oneLiner}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-6">
                        <div className="bg-zinc-800/50 border border-white/5 rounded-3xl p-6 text-center shadow-lg">
                             <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Asking Amount</div>
                             <div className="text-xl font-display font-bold text-white tracking-tight break-words">
                                {memoCard.askAmount ? `$${memoCard.askAmount.toLocaleString()}` : 'N/A'}
                             </div>
                        </div>
                    </div>


                 </div>
             </div>
         </div>
      )}

      {/* --- MATCH OVERLAY --- */}
      {matchedStartup && (
        <div className="absolute inset-0 z-[70] bg-black flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-300">
           {/* Dynamic Background */}
           <div className="absolute inset-0 opacity-40">
               {matchedStartup.imageUrl ? (
                   <img src={matchedStartup.imageUrl} className="w-full h-full object-cover blur-2xl scale-110" />
               ) : (
                   <div className="w-full h-full bg-gradient-to-br from-brand-primary/20 to-zinc-900 blur-2xl scale-110"></div>
               )}
           </div>
           <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/95"></div>

           {/* Content Container */}
           <div className="relative z-10 flex flex-col items-center w-full max-w-xl px-6 text-center pt-10">
               
               {/* Match Text */}
               <div className="mb-12 relative animate-in zoom-in duration-500">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-brand-primary/20 blur-[50px] rounded-full animate-pulse"></div>
                    <h2 className="text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-primary via-[#FFF] to-brand-primary italic tracking-tighter transform -rotate-2 drop-shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                        IT'S A<br/>MATCH!
                    </h2>
               </div>

               {/* Avatars Interaction */}
               <div className="flex items-center justify-center mb-16 relative h-32 w-full">
                    
                    {/* Avatars Container */}
                    <div className="relative flex items-center justify-center">
                        {/* User Avatar - Left */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 transform -translate-x-3 -rotate-3 animate-in slide-in-from-left-12 duration-700 bg-zinc-800">
                            {userProfile?.avatarUrl ? (
                                <img src={userProfile.avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white font-bold text-2xl">
                                    {userProfile?.name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>

                        {/* Connection Icon - Center */}
                        <div className="absolute z-30 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-black transform scale-100 animate-in zoom-in duration-300 delay-300">
                            <Flame size={20} className="text-black fill-brand-primary" />
                        </div>

                        {/* Startup Avatar - Right */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-brand-primary shadow-[0_0_30px_rgba(255,208,0,0.4)] overflow-hidden relative z-20 transform translate-x-3 rotate-3 animate-in slide-in-from-right-12 duration-700 bg-zinc-800">
                             {matchedStartup.founder.avatarUrl ? (
                                <img src={matchedStartup.founder.avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white font-bold text-2xl">
                                    {matchedStartup.founder.name?.charAt(0) || 'F'}
                                </div>
                            )}
                        </div>
                    </div>
               </div>

               {/* Startup Name */}
               <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                   <p className="text-zinc-400 font-medium text-xs uppercase tracking-widest mb-2">You connected with</p>
                   <h3 className="text-3xl font-display font-bold text-white leading-none">{matchedStartup.name}</h3>
                   <p className="text-zinc-500 text-sm mt-1">{matchedStartup.industry} • {matchedStartup.fundingStage}</p>
               </div>

               {/* Actions */}
               <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    <button 
                       onClick={handleSendMessage} 
                       className="w-full py-4 bg-brand-primary text-black font-bold rounded-full text-base shadow-[0_0_20px_rgba(255,208,0,0.3)] hover:shadow-[0_0_30px_rgba(255,208,0,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                    >
                       <MessageCircle size={20} className="group-hover:-rotate-12 transition-transform" /> 
                       Send Message
                    </button>
                    <button 
                       onClick={() => setMatchedStartup(null)} 
                       className="w-full py-4 bg-white/5 text-zinc-400 font-bold text-sm border border-white/5 rounded-full hover:bg-white/10 hover:text-white transition-colors"
                    >
                       Keep Swiping
                    </button>
               </div>

           </div>
        </div>
      )}
          </>
      )}
      
      {selectedProfileId && (
          <UserProfileView 
            userId={selectedProfileId} 
            onClose={() => setSelectedProfileId(null)} 
            onMessage={(uid) => {
                setSelectedProfileId(null);
                // For investors, we can just use the same logic as onMatch if it's a startup
                StorageService.ensureConnection(uid).then(chatId => {
                    if (chatId && onMatch) {
                        onMatch({ id: uid, name: 'User' } as any);
                    }
                });
            }}
          />
      )}

      {showPaywall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary rounded-full blur-[80px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                  <div className="relative z-10 text-center">
                      <div className="w-16 h-16 bg-brand-primary/20 text-brand-primary rounded-full flex items-center justify-center mb-6 mx-auto">
                          <Crown size={32} />
                      </div>
                      <h2 className="text-2xl font-display font-bold text-zinc-900 mb-3">Out of Swipes!</h2>
                      <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                          You've reached your daily limit of 5 swipes. Upgrade to Pro for unlimited investor matches and priority matching.
                      </p>
                      <button 
                          onClick={() => setShowPaywall(false)}
                          className="w-full h-14 bg-black text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                          Got it
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
});
