import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { CommunityPost, Startup, UserRole } from '../types';
import { X, MapPin, BriefcaseBusiness, CalendarDays, Heart, MessageSquareText, UserPlus, UserCheck, MessageCircle, LoaderCircle, Globe } from 'lucide-react';

interface UserProfileViewProps {
  userId: string;
  onClose: () => void;
  onMessage?: (userId: string) => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ userId, onClose, onMessage }) => {
  const [profile, setProfile] = useState<any>(null);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      let targetUserId = userId;
      if (targetUserId === 'me') {
        const currentId = await StorageService.getCurrentUserId();
        if (!currentId) throw new Error("Not authenticated");
        targetUserId = currentId;
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
      
      // Check if following
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

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4">
          <LoaderCircle className="animate-spin-fast text-brand-primary" size={32} />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
            <X size={32} />
          </div>
          <h3 className="text-xl font-bold">Profile Not Found</h3>
          <p className="text-zinc-500 text-sm">The user you are looking for does not exist or has been removed.</p>
          <button onClick={onClose} className="w-full py-3 bg-black text-white rounded-full font-bold mt-2">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[32px] sm:rounded-[32px] overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Header */}
        <div className="relative p-6 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-zinc-900">Profile</h2>
          <button onClick={onClose} className="p-2 bg-zinc-100 rounded-full text-zinc-600 hover:bg-zinc-200">
            <X size={20} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-4 mb-6">
            {profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                className="w-20 h-20 rounded-full object-cover" 
                alt={profile.name} 
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500">
                <UserPlus size={32} />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{profile.name}</h1>
              <p className="text-sm text-zinc-500">{profile.title}</p>
              <div className="flex gap-4 mt-2 text-sm font-bold">
                <span>{followers.length} <span className="text-zinc-500 font-normal">Followers</span></span>
                <span>{following.length} <span className="text-zinc-500 font-normal">Following</span></span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleFollow}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isFollowing ? 'bg-zinc-100 text-zinc-900' : 'bg-black text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button 
              onClick={() => onMessage && onMessage(userId)}
              className="px-6 py-2.5 bg-zinc-100 rounded-xl text-zinc-900 font-bold text-sm"
            >
              Message
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 space-y-6">
          {startup && (
            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-zinc-400 uppercase mb-2">Startup</p>
              <p className="font-bold text-zinc-900">{startup.name}</p>
              <p className="text-sm text-zinc-600">{startup.oneLiner}</p>
            </div>
          )}

            <div>
            <p className="text-xs font-bold text-zinc-400 uppercase mb-4">Posts</p>
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="border-b border-zinc-100 pb-4 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    {post.avatar ? (
                      <img src={post.avatar} className="w-10 h-10 rounded-full object-cover" alt={post.author} />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500">
                        <UserPlus size={20} />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{post.author}</p>
                      <p className="text-xs text-zinc-500">{post.time}</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-800 mb-3">{post.content}</p>
                  {post.imageUrl && (
                    <img src={post.imageUrl} className="w-full rounded-2xl mb-3 border border-zinc-100" alt="Post" />
                  )}
                  <div className="flex items-center gap-6 text-zinc-400">
                    <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                      <Heart size={16} /> <span className="text-xs">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                      <MessageSquareText size={16} /> <span className="text-xs">{post.comments}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
