import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { CommunityPost, UserRole } from '../types';
import { 
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, 
  PlusSquare, Play, Volume2, VolumeX, Loader2, 
  UserPlus, UserCheck, Trash2, ChevronLeft, ChevronRight, X,
  Image as ImageIcon, Plus, Check, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './Card';
import { StatusIndicator } from './StatusIndicator';

interface CommunityFeedProps {
  userProfile: any;
  onMessage?: (authorId: string) => void;
  onViewProfile?: (userId: string) => void;
  refreshTrigger?: number;
  onAddPost?: () => void;
}

const CommunityFeed: React.FC<CommunityFeedProps> = React.memo(({ 
  userProfile, 
  onMessage, 
  onViewProfile,
  refreshTrigger = 0,
  onAddPost
}) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'recent' | 'liked'>('recent');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    StorageService.getCurrentUserId().then(id => setCurrentUserId(id));
    setPage(0);
    loadPosts(0);
  }, [refreshTrigger, sortBy, selectedTag]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPosts(nextPage);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, page]);

  const loadPosts = async (pageNum: number = 0) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const data = await StorageService.getCommunityPosts(pageNum, 10, sortBy, selectedTag);
      if (pageNum === 0) {
        setPosts(data);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = data.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      }
      setHasMore(data.length === 10);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      if (pageNum === 0) setLoading(false);
      else setLoadingMore(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    const success = await StorageService.likePost(postId, !isLiked);
    if (success) {
      setPosts(prev => prev.map(p => p.id === postId ? { 
        ...p, 
        isLiked: !isLiked, 
        likes: Math.max(0, p.likes + (!isLiked ? 1 : -1)) 
      } : p));
    }
  };

  const handleFollow = async (authorId: string, isFollowing: boolean) => {
    if (isFollowing) {
      const success = await StorageService.unfollowUser(authorId);
      if (success) {
        setPosts(posts.map(p => p.authorId === authorId ? { ...p, isFollowingAuthor: false } : p));
      }
    } else {
      const success = await StorageService.followUser(authorId);
      if (success) {
        setPosts(posts.map(p => p.authorId === authorId ? { ...p, isFollowingAuthor: true } : p));
      }
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      const success = await StorageService.deleteCommunityPost(postToDelete);
      if (success) {
        setPosts(posts.filter(p => p.id !== postToDelete));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleCommentSubmit = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content || !content.trim()) return;

    setIsSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const result = await StorageService.addCommentToPost(postId, content, userProfile);
      if (result.success && result.comment) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              comments: p.comments + 1,
              commentsList: [result.comment!, ...(p.commentsList || [])]
            };
          }
          return p;
        }));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black/50 backdrop-blur-sm">
        <div className="relative flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          >
            <h1 className="text-3xl font-display font-black tracking-tighter text-white text-center">
              Connect<span className="text-brand-primary">Pulse</span>
            </h1>
          </motion.div>
          
          <div className="mt-8 w-32 h-[2px] bg-zinc-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full bg-brand-primary"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden font-sans text-zinc-900 bg-[#FFFCF0]">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-zinc-200/[0.2] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[60%] bg-brand-primary/25 rounded-full blur-[100px]"></div>
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-brand-primary/15 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[30%] left-[10%] w-[50%] h-[50%] bg-zinc-200/[0.3] rounded-full blur-[110px]"></div>
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-[90px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent)]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-y-auto no-scrollbar" ref={scrollContainerRef}>
        <div className="max-w-2xl mx-auto w-full px-4 pt-0 pb-32 space-y-6">
          
          {/* Enhanced Feed Header - Sticky */}
          <div className="sticky top-0 z-30 bg-[#FFFCF0]/80 backdrop-blur-md py-2 -mx-4 px-4 border-b border-zinc-200 transition-all">
            <div className="flex flex-col items-center justify-center gap-2 text-center max-w-2xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-zinc-900">
                  Community <span className="text-brand-primary">Pulse</span>
                </h1>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white backdrop-blur-sm border border-zinc-200 rounded-2xl p-1 shadow-sm">
                  <button 
                    onClick={() => setSortBy('recent')}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'recent' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-600'}`}
                  >
                    Recent
                  </button>
                  <button 
                    onClick={() => loadPosts(0)}
                    disabled={loading}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${loading ? 'text-brand-primary opacity-50 cursor-not-allowed' : 'text-zinc-500 hover:text-zinc-600'}`}
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {loading && posts.length > 0 && (
              <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in duration-500">
                <div className="relative flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <h1 className="text-3xl font-display font-black tracking-tighter text-zinc-900 text-center">
                      Connect<span className="text-brand-primary">Pulse</span>
                    </h1>
                  </motion.div>
                  
                  <div className="mt-8 w-32 h-[2px] bg-zinc-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-full h-full bg-brand-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedTag && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Filtered by:</span>
                <button 
                  onClick={() => setSelectedTag(null)}
                  className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-primary/20 hover:bg-brand-primary/20 transition-all"
                >
                  {selectedTag}
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        
          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map(post => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                   <Card className="bg-white border border-zinc-100 shadow-sm overflow-hidden rounded-[24px] hover:shadow-lg hover:border-zinc-200 transition-all duration-300 group">
                    {/* Post Header */}
                    <div className="flex items-start justify-between p-5 pb-3">
                      <div 
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => onViewProfile && onViewProfile(post.authorId)}
                      >
                        <div className="relative">
                          <div className="w-11 h-11 rounded-xl overflow-hidden ring-4 ring-zinc-50 transition-all duration-500 group-hover:ring-zinc-100">
                            {post.avatar ? (
                              <img src={post.avatar} className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700" alt={post.author} />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center text-zinc-500 font-black text-lg">
                                {post.author?.[0] || 'U'}
                              </div>
                            )}
                          </div>
                          {post.authorVerified && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center border-2 border-white shadow-md">
                              <Check className="w-3.5 h-3.5 text-black stroke-[4]" />
                            </div>
                          )}
                          
                          <div className="absolute -bottom-1 -right-1 z-10 border-4 border-white rounded-full bg-white scale-90">
                            <StatusIndicator lastSeen={post?.lastSeen || ''} size="sm" variant="dot" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-black text-zinc-900 group-hover:text-brand-primary transition-colors leading-tight text-[15px] tracking-tight">
                            {post.author || 'Member'}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {currentUserId !== post.authorId ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleFollow(post.authorId, !!post.isFollowingAuthor); }}
                            className={`p-2.5 rounded-xl transition-all duration-300 ${
                              post.isFollowingAuthor 
                                ? 'bg-zinc-100 text-zinc-500 rotate-0' 
                                : 'bg-zinc-900 text-white hover:bg-brand-primary hover:text-black shadow-lg'
                            }`}
                            title={post.isFollowingAuthor ? 'Unfollow' : 'Follow'}
                          >
                            {post.isFollowingAuthor ? <UserCheck className="w-4.5 h-4.5" /> : <UserPlus className="w-4.5 h-4.5" />}
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPostToDelete(post.id); }}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Post"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="px-5 space-y-3">
                      <p className="text-zinc-700 text-[15px] leading-relaxed font-medium selection:bg-brand-primary/20">
                        {post.content}
                      </p>
                      
                      {post.imageUrl && (
                        <div className="rounded-[24px] overflow-hidden bg-zinc-50 border border-zinc-100 shadow-inner group-hover:shadow-md transition-all duration-500">
                          <img 
                            src={post.imageUrl} 
                            className="w-full max-h-[450px] object-cover group-hover:scale-[1.03] transition-transform duration-1000" 
                            alt="Post content" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      
                    <div className="flex items-center py-2">
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                            {post.tags.map(tag => (
                                <span key={tag} className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-[12px] hover:bg-brand-primary hover:text-black transition-colors cursor-default">
                                #{tag}
                                </span>
                            ))}
                            </div>
                        )}
                    </div>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center gap-4 px-5 py-3 mt-1 border-t border-zinc-100">
                      <button 
                        onClick={() => handleLike(post.id, post.isLiked)}
                        className={`flex items-center gap-2 text-xs font-black transition-all active:scale-90 hover:scale-105 px-4 py-2 rounded-[16px] ${
                          post.isLiked ? 'text-red-500 bg-red-50' : 'text-zinc-500 hover:bg-zinc-100'
                        }`}
                      >
                        <Heart className={`w-4 h-4 transition-transform ${post.isLiked ? 'fill-red-500 stroke-red-500' : ''}`} />
                        <span>{post.likes}</span>
                      </button>
                      
                      <button 
                        onClick={() => toggleComments(post.id)}
                        className={`flex items-center gap-2 text-xs font-black transition-all active:scale-90 hover:scale-105 px-4 py-2 rounded-[16px] ${
                          expandedComments[post.id] ? 'text-brand-primary bg-brand-primary/10' : 'text-zinc-500 hover:bg-zinc-100'
                        }`}
                      >
                        <MessageCircle className={`w-4 h-4 transition-transform ${expandedComments[post.id] ? 'fill-brand-primary' : ''}`} />
                        <span>{post.comments}</span>
                      </button>

                      <div className="flex-1"></div>
                    </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {expandedComments[post.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-transparent border-t border-white/10"
                      >
                        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                          {/* Comments List */}
                          <div className="space-y-4">
                            {post.commentsList && post.commentsList.length > 0 ? (
                              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                                {post.commentsList.map(comment => (
                                  <div key={comment.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10">
                                      {comment.avatar ? (
                                        <img src={comment.avatar} className="w-full h-full object-cover" alt={comment.author} />
                                      ) : (
                                        <div className="w-full h-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                          {comment.author?.[0]}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="bg-white/5 rounded-2xl rounded-tl-none p-3 border border-white/10 shadow-sm">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm font-bold text-white">{comment.author}</span>
                                          <span className="text-[10px] font-bold text-zinc-500">{comment.time}</span>
                                        </div>
                                        <p className="text-xs text-zinc-400 leading-relaxed">
                                          {comment.content}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6 bg-white/5 rounded-[16px] border border-dashed border-white/10">
                                <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">No pulse yet. Be the first.</p>
                              </div>
                            )}
                          </div>

                          {/* Comment Input at Bottom */}
                          <div className="flex gap-3 pt-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-white/5 shadow-sm ring-1 ring-white/10">
                              {userProfile.avatarUrl ? (
                                <img src={userProfile.avatarUrl} className="w-full h-full object-cover" alt="Me" />
                              ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center text-[10px] font-black text-zinc-400">
                                  {userProfile.name?.[0]}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 relative">
                              <input 
                                type="text"
                                placeholder="Add a comment..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                                className="w-full bg-black border-2 border-white/10 rounded-2xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-brand-primary/50 focus:bg-white/5 transition-all pr-12 shadow-sm text-white placeholder-zinc-500"
                              />
                              <button 
                                onClick={() => handleCommentSubmit(post.id)}
                                disabled={isSubmittingComment[post.id] || !commentInputs[post.id]?.trim()}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-brand-primary disabled:text-zinc-300 transition-all hover:scale-110 active:scale-90"
                              >
                                {isSubmittingComment[post.id] ? (
                                  <Loader2 className="w-4 h-4 animate-spin-fast" />
                                ) : (
                                  <Send className="w-4 h-4 fill-zinc-400 stroke-zinc-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400">
                <PlusSquare className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">No posts found</p>
              </div>
            </motion.div>
          )}
          </div>
        </div>

        {/* Loading More Indicator */}
        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          {loadingMore && <Loader2 className="w-6 h-6 animate-spin-fast text-brand-primary" />}
          {!hasMore && posts.length > 0 && (
            <p className="text-sm text-zinc-500 font-medium">You've reached the end of the feed.</p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setPostToDelete(null)}></div>
          <div className="relative w-full max-w-sm bg-zinc-900 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-white/10 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4 border border-red-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-white">Delete Post?</h3>
            <p className="text-zinc-400 mb-6">This action cannot be undone. The post will be permanently removed from the community feed.</p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setPostToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 font-bold text-white bg-white/10 rounded-xl hover:bg-white/20 transition-colors border border-transparent"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="flex-1 py-3 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm active:scale-95 flex items-center justify-center"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin-fast" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CommunityFeed;

