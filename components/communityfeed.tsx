import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { CommunityPost, UserRole } from '../types';
import { 
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, 
  PlusSquare, Play, Volume2, VolumeX, Loader2, 
  UserPlus, UserCheck, Trash2, ChevronLeft, ChevronRight, X,
  Image as ImageIcon, Plus, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './Card';

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
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    StorageService.getCurrentUserId().then(id => setCurrentUserId(id));
    loadPosts(0);
  }, [refreshTrigger]);

  useEffect(() => {
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

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, loadingMore, page]);

  const loadPosts = async (pageNum: number = 0) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const data = await StorageService.getCommunityPosts(pageNum, 10);
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
      setPosts(posts.map(p => p.id === postId ? { 
        ...p, 
        isLiked: !isLiked, 
        likes: p.likes + (!isLiked ? 1 : -1) 
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="w-8 h-8 animate-spin-fast text-brand-primary" />
        <p className="text-zinc-500 font-medium">Loading community feed...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden font-sans text-zinc-900">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 bg-[#FFFCF0] pointer-events-none">
          {/* Solid Curved Yellow Header Background */}
          <div className="absolute top-0 left-0 right-0 h-[280px] bg-[#FFF2C2] rounded-b-[100%] scale-x-150 origin-top"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-y-auto no-scrollbar p-4 md:p-8" ref={scrollContainerRef}>
        <div className="max-w-2xl mx-auto space-y-8 pb-32 w-full">
        
        {/* Posts Feed */}
        <div className="space-y-8">
          {posts.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-white border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                {/* Post Header */}
                <div className="flex items-start justify-between p-4 pb-3 sm:p-6 sm:pb-4">
                  <div 
                    className="flex items-center gap-4 cursor-pointer group"
                    onClick={() => onViewProfile && onViewProfile(post.authorId)}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-zinc-50 group-hover:ring-brand-primary/20 transition-all">
                        {post.avatar ? (
                          <img src={post.avatar} className="w-full h-full object-cover" alt={post.author} />
                        ) : (
                          <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold">
                            {post.author?.[0]}
                          </div>
                        )}
                      </div>
                      {post.authorVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 group-hover:text-brand-primary transition-colors leading-tight">
                        {post.author}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5">
                        <span>{post.role}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                        <span>{post.time}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {currentUserId !== post.authorId ? (
                      <button 
                        onClick={() => handleFollow(post.authorId, !!post.isFollowingAuthor)}
                        className={`p-2 rounded-full transition-all ${
                          post.isFollowingAuthor 
                            ? 'bg-zinc-100 text-zinc-500' 
                            : 'bg-zinc-900 text-white hover:bg-zinc-800'
                        }`}
                        title={post.isFollowingAuthor ? 'Unfollow' : 'Follow'}
                      >
                        {post.isFollowingAuthor ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      </button>
                    ) : (
                      <button 
                        onClick={() => setPostToDelete(post.id)}
                        className="p-1.5 text-zinc-300 hover:text-red-500 transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-4 sm:px-6 space-y-3 sm:space-y-4">
                  <p className="text-zinc-700 text-[15px] leading-relaxed font-medium">
                    {post.content}
                  </p>
                  
                  {post.imageUrl && (
                    <div className="rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100">
                      <img 
                        src={post.imageUrl} 
                        className="w-full max-h-[500px] object-cover hover:scale-[1.02] transition-transform duration-700" 
                        alt="Post content" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/5 px-2.5 py-1 rounded-full border border-brand-primary/10">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="flex items-center gap-4 sm:gap-6 px-4 py-2 sm:px-4 sm:py-3 mt-2 sm:mt-3 border-t border-zinc-50">
                  <button 
                    onClick={() => handleLike(post.id, post.isLiked)}
                    className={`flex items-center gap-2 text-xs font-bold transition-all active:scale-90 hover:scale-105 px-3 py-1.5 rounded-full ${
                      post.isLiked ? 'text-red-500 bg-red-50' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <Heart className={`w-4 h-4 transition-transform ${post.isLiked ? 'fill-red-500 stroke-red-500' : ''}`} />
                    <span>{post.likes}</span>
                  </button>
                  
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-2 text-xs font-bold transition-all active:scale-90 hover:scale-105 px-3 py-1.5 rounded-full ${
                      expandedComments[post.id] ? 'text-brand-primary bg-brand-primary/10' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <MessageCircle className={`w-4 h-4 transition-transform ${expandedComments[post.id] ? 'fill-brand-primary/10' : ''}`} />
                    <span>{post.comments}</span>
                  </button>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {expandedComments[post.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zinc-50/50 border-t border-zinc-50"
                    >
                      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                        {/* Comment Input */}
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-200">
                            {userProfile.avatarUrl ? (
                              <img src={userProfile.avatarUrl} className="w-full h-full object-cover" alt="Me" />
                            ) : (
                              <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-500">
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
                              className="w-full bg-white border border-zinc-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-primary transition-colors pr-10"
                            />
                            <button 
                              onClick={() => handleCommentSubmit(post.id)}
                              disabled={isSubmittingComment[post.id] || !commentInputs[post.id]?.trim()}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand-primary disabled:text-zinc-300 transition-colors"
                            >
                              {isSubmittingComment[post.id] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-5">
                          {post.commentsList && post.commentsList.length > 0 ? (
                            post.commentsList.map(comment => (
                              <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-100">
                                  {comment.avatar ? (
                                    <img src={comment.avatar} className="w-full h-full object-cover" alt={comment.author} />
                                  ) : (
                                    <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                      {comment.author?.[0]}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="bg-white rounded-2xl rounded-tl-none p-3 border border-zinc-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-bold text-zinc-900">{comment.author}</span>
                                      <span className="text-[10px] text-zinc-400">{comment.time}</span>
                                    </div>
                                    <p className="text-xs text-zinc-600 leading-relaxed">
                                      {comment.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-xs text-zinc-400 font-medium italic">No comments yet. Be the first to share your thoughts!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
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
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border-2 border-black p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 border-2 border-red-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-2">Delete Post?</h3>
            <p className="text-zinc-500 mb-6">This action cannot be undone. The post will be permanently removed from the community feed.</p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setPostToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 font-bold text-zinc-700 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors border-2 border-transparent"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="flex-1 py-3 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none flex items-center justify-center"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin-fast" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
});

export default CommunityFeed;

