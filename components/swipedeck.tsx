

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, ScrollText, Scan, Check, MessageCircle, Flame, User, RefreshCcw
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [matchedStartup, setMatchedStartup] = useState<Startup | null>(null);
  consxxt [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

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

  return (
    <div className="h-full bg-[#FFFCF0] flex flex-col font-sans relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 bg-[#FFFCF0] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] bg-brand-primary/20 rounded-[50%] blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-brand-primary/10 rounded-full blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <div className="absolute top-0 left-0 right-0 z-[50] safe-area-top pt-16 flex justify-center pointer-events-none">
          <div className="text-base sm:text-lg font-display font-bold text-zinc-900 tracking-tighter">
            Connect<span className="text-brand-primary">Up</span>
          </div>
      </div>

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
                size={64} 
                className="text-brand-primary mb-6 animate-pulse cursor-pointer hover:scale-110 transition-transform" 
                onClick={() => refreshData(true)}
              />
              <h2 className="text-2xl font-display font-black text-black mb-2">All Caught Up</h2>
              <p className="text-black/60 text-sm max-w-xs mx-auto mb-8">You've seen all the startups currently matching your profile.</p>
            </div>
          )}

          <AnimatePresence>
            {cards.map((card, index) => (
              <SwipeCard 
                key={card.id} 
                card={card} 
                isTop={index === cards.length - 1} 
                onSwipe={(dir) => handleSwipe(dir, card)}
                onOpenMemo={() => handleOpenMemo(card)}
              />
            ))}
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
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/95" />
            
            <div className="relative z-10 flex flex-col items-center w-full max-w-xl px-6 text-center">
              <motion.h2 
                initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: -2, opacity: 1 }}
                className="text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-primary via-zinc-900 to-brand-primary italic mb-12"
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
                <h3 className="text-3xl font-display font-bold text-zinc-900 mb-1">{matchedStartup.name}</h3>
                <p className="text-zinc-500 text-sm">{matchedStartup.industry} • {matchedStartup.fundingStage}</p>
              </div>

              <div className="w-full space-y-3">
                <button onClick={handleSendMessage} className="w-full py-4 bg-brand-primary text-zinc-900 font-bold rounded-full flex items-center justify-center gap-2">
                  <MessageCircle size={20} /> Send Message
                </button>
                <button onClick={() => setMatchedStartup(null)} className="w-full py-4 bg-zinc-200 text-zinc-600 font-bold rounded-full">
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
              <div className="relative w-full aspect-video bg-black overflow-hidden">
                {memoCard.videoUrl ? (
                  <VideoPlayer src={memoCard.videoUrl} className="w-full h-full object-cover" autoPlay muted loop controls />
                ) : (
                  <img src={memoCard.imageUrl} className="w-full h-full object-cover" alt="" />
                )}
              </div>
              <div className="p-6 max-w-2xl mx-auto">
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

      {selectedProfileId && (
        <UserProfileView userId={selectedProfileId} onClose={() => setSelectedProfileId(null)} />
      )}
    </div>
  );
});

const SwipeCard = ({ card, isTop, onSwipe, onOpenMemo }: { card: Startup, isTop: boolean, onSwipe: (dir: 'left' | 'right') => void, onOpenMemo: () => void }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);

  if (!isTop) {
    return (
      <div className="absolute inset-0 w-full h-full bg-zinc-900 overflow-hidden pointer-events-none">
        {card.imageUrl && <img src={card.imageUrl} className="w-full h-full object-cover opacity-60" alt="" />}
        <div className="absolute inset-0 bg-black/40" />
      </div>
    );
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) onSwipe('right');
        else if (info.offset.x < -100) onSwipe('left');
      }}
      className="absolute inset-0 w-full h-full bg-zinc-900 overflow-hidden cursor-grab active:cursor-grabbing z-20 touch-none"
    >
      <div className="absolute inset-0 w-full h-full bg-zinc-100">
        {card.videoUrl ? (
          <VideoPlayer key={card.id} src={card.videoUrl} className="w-full h-full object-cover" autoPlay muted loop controls={false} />
        ) : (
          <img src={card.imageUrl} className="w-full h-full object-cover" alt={card.name} />
        )}
        
        {/* Overlays */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

        {/* Swipe Feedback */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
           <div className="p-6 rounded-full bg-brand-primary text-black shadow-2xl border-4 border-black"><Check size={48} strokeWidth={4} /></div>
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
           <div className="p-6 rounded-full bg-white text-black shadow-2xl border-4 border-black"><X size={48} strokeWidth={4} /></div>
        </motion.div>
      </div>
      
      <div className="absolute inset-0 z-30 flex flex-col justify-end p-6 pb-26">
        <div className="flex items-end justify-between w-full">
          <div className="flex-1 mr-4">
            <h2 className="text-3xl font-display font-black text-white leading-tight drop-shadow-xl mb-3">{card.name}</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-zinc-900/60 backdrop-blur-md rounded-xl p-1.5 pr-3 border border-white/10">
                <img src={card.founder.avatarUrl} className="w-6 h-6 rounded-full object-cover" />
                <span className="text-[10px] font-bold text-white">{card.founder.name}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onOpenMemo(); }} 
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform">
              <ScrollText size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">Memo</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeDeck;

