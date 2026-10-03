import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { StorageService } from '../services/storageService';
import { CommunityPost, Startup } from '../types';
import { 
  X, MapPin, BriefcaseBusiness, CalendarDays, Heart, 
  MessageSquareText, UserPlus, UserCheck, MessageCircle, 
  Mail, Globe, BadgeCheck, Share2, ArrowUpRight
} from 'lucide-react';
import { CircleLoader } from './CircleLoader';

interface UserProfileViewProps {
  userId: string;
  onClose: () => void;
  onMessage?: (userId: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ userId, onClose, onMessage }) => {
  const [profile, setProfile] = useState<any>(null);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const myId = await StorageService.getCurrentUserId();
      setCurrentUserId(myId);

      let targetUserId = userId;
      if (targetUserId === 'me') {
        if (!myId) throw new Error("Not authenticated");
        targetUserId = myId;
      }

      const [profileData, startupData, postsData, followersData, followingData] = await Promise.all([
        StorageService.getUserProfile(targetUserId),
        StorageService.getStartupByUserId(targetUserId),
        StorageService.getPostsByUserId(targetUserId),
        StorageService.getFollowers(targetUserId),
        StorageService.getFollowing(targetUserId)
      ]);

      setProfile(profileData);
      setStartup(startupData);
      setPosts(postsData);
      setFollowers(followersData);
      setFollowing(followingData);
      
      const isFollowingStatus = await StorageService.checkIsFollowing(targetUserId);
      setIsFollowing(isFollowingStatus);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (isFollowing) {
      const success = await StorageService.unfollowUser(userId);
      if (success) setIsFollowing(false);
    } else {
      const success = await StorageService.followUser(userId);
      if (success) setIsFollowing(true);
    }
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    const success = await StorageService.likePost(postId, !isLiked);
    if (success) {
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        isLiked: !isLiked,
        likes: Math.max(0, p.likes + (!isLiked ? 1 : -1))
      } : p));
    }
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + '/profile?id=' + (profile?.id || userId));
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div 
        onClick={onClose} 
        className="fixed inset-0 z-[100] bg-zinc-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 cursor-pointer"
      >
        <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center cursor-default bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl">
          <CircleLoader size="lg" />
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mt-4">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div 
        onClick={onClose} 
        className="fixed inset-0 z-[100] bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      >
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 flex flex-col items-center gap-4 max-w-sm text-center shadow-2xl cursor-default"
        >
          <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
            <X size={24} />
          </div>
          <h3 className="text-xl font-bold text-zinc-950 dark:text-white">Profile Unavailable</h3>
          <p className="text-zinc-500 text-xs leading-relaxed">The user profile does not exist or has been archived.</p>
          <button onClick={onClose} className="w-full py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-xs font-bold mt-2 cursor-pointer shadow-xs">Close</button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUserId === (userId === 'me' ? currentUserId : userId);

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] bg-zinc-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 touch-pan-y"
    >
      <motion.div 
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[88vh] rounded-t-[32px] sm:rounded-3xl overflow-y-auto overscroll-y-contain shadow-2xl text-zinc-950 dark:text-white flex flex-col touch-pan-y scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Cover Header Banner */}
        <div className="relative h-32 sm:h-40 bg-gradient-to-r from-amber-500/20 via-zinc-900/10 to-amber-500/30 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 shrink-0 overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Top Bar Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={handleShareProfile}
              className="p-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 shadow-xs border border-white/40 dark:border-zinc-700 transition-colors cursor-pointer"
              title="Share profile"
            >
              <Share2 size={16} />
            </button>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 shadow-xs border border-white/40 dark:border-zinc-700 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
          {copiedLink && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-zinc-950 text-white text-[11px] font-bold rounded-lg shadow-md animate-in fade-in">
              Profile link copied!
            </div>
          )}
        </div>

        {/* Profile Card Body */}
        <div className="px-6 sm:px-8 pb-32 sm:pb-12 pt-0 -mt-14 relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="relative">
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white dark:border-zinc-900 shadow-lg" 
                  alt={profile.name}
                  loading="eager"
                  fetchPriority="high"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-zinc-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 flex items-center justify-center text-zinc-400 shadow-lg">
                  <UserPlus size={36} />
                </div>
              )}
              {profile.plan === 'pro' && (
                <div className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-zinc-950 rounded-xl shadow-xs" title="Verified Pro">
                  <BadgeCheck size={18} strokeWidth={2.5} />
                </div>
              )}
            </div>

            {/* Actions for other user */}
            {!isOwnProfile ? (
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={handleFollow}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isFollowing 
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200' 
                      : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800'
                  }`}
                >
                  {isFollowing ? 'Connected' : 'Connect'}
                </button>
                <button 
                  onClick={() => onMessage?.(userId === 'me' ? currentUserId || '' : userId)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs transition-all bg-amber-400 hover:bg-amber-300 text-zinc-950 cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
                >
                  <MessageCircle size={15} />
                  <span>Direct Message</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 font-semibold flex items-center gap-1">
                <span>Personal Portfolio</span>
              </div>
            )}
          </div>

          {/* User Details */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-display font-black text-zinc-950 dark:text-white tracking-tight">{profile.name}</h1>
              {profile.plan === 'pro' && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                  PRO
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">{profile.title || 'Venture Partner & Entrepreneur'}</p>
            
            {/* Unboxed metadata line with typographic separators */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {profile.location && (
                <>
                  <span className="flex items-center gap-1"><MapPin size={13} /> {profile.location}</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>{followers.length} Followers</span>
              <span aria-hidden="true">·</span>
              <span>{following.length} Following</span>
              {posts.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{posts.length} Insights</span>
                </>
              )}
            </div>
          </div>

          {/* Startup Highlight Card if available */}
          {startup && (
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-600 dark:text-amber-400 uppercase text-[10px] tracking-wider">Associated Venture</span>
                <span className="font-semibold text-zinc-500">{startup.fundingStage}</span>
              </div>
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white">{startup.name}</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{startup.oneLiner}</p>
              {startup.askAmount && (
                <div className="pt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Seeking <strong className="text-zinc-950 dark:text-white font-bold">${Number(startup.askAmount).toLocaleString()}</strong> in active financing
                </div>
              )}
            </div>
          )}

          {/* Posts & Insights Feed */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recent Insights</h4>
            {posts.length === 0 ? (
              <div className="p-8 text-center bg-zinc-50/50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
                No published insights yet.
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <div key={post.id} className="p-4 rounded-2xl bg-white dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{post.author}</span>
                      <span>{post.time}</span>
                    </div>
                    <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    {post.imageUrl && (
                      <img src={post.imageUrl} className="w-full max-h-64 object-cover rounded-xl border border-zinc-200 dark:border-zinc-700" alt="" />
                    )}
                    <div className="flex items-center gap-6 pt-1 text-xs text-zinc-500">
                      <button 
                        onClick={() => handleLikePost(post.id, post.isLiked)}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer ${post.isLiked ? 'text-red-500 font-bold' : 'hover:text-red-500'}`}
                      >
                        <Heart size={15} className={post.isLiked ? 'fill-current' : ''} />
                        <span>{post.likes}</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <MessageSquareText size={15} />
                        <span>{post.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserProfileView;
