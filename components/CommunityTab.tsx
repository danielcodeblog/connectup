import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { CommunityPost } from '../types';
import { Heart, MessageSquareText, SendHorizontal, LoaderCircle, UserPlus, UserCheck, MessageCircle, ImagePlus, X, Plus, RefreshCw, Trash2 } from 'lucide-react';

export const CommunityTab = React.memo(({ userProfile, onMessage, onViewProfile }: { userProfile: any, onMessage?: (authorId: string) => void, onViewProfile?: (userId: string) => void }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = React.useRef<HTMLDivElement>(null);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [visibleComments, setVisibleComments] = useState<Record<string, boolean>>({});
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmingDeletePost, setIsConfirmingDeletePost] = useState(false);
  const [isConfirmingDeleteComment, setIsConfirmingDeleteComment] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{postId: string, commentId: string} | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const startTouchY = React.useRef(0);
  const PULL_THRESHOLD = 80;

  useEffect(() => {
    StorageService.getCurrentUserId().then(id => setCurrentUserId(id));
    loadPosts(0);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPosts(nextPage);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, hasMore, loading, loadingMore, page]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const loadPosts = async (pageNum: number = 0) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const data = await StorageService.getCommunityPosts(pageNum, 10);
    
    if (pageNum === 0) {
      setPosts(data);
    } else {
      setPosts(prev => {
        // Filter out duplicates just in case
        const existingIds = new Set(prev.map(p => p.id));
        const newPosts = data.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
    }

    setHasMore(data.length === 10);
    
    if (pageNum === 0) setLoading(false);
    else setLoadingMore(false);
  };

  const handleRefresh = async () => {
    setPage(0);
    await loadPosts(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      startTouchY.current = e.touches[0].pageY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPulling && !isRefreshing) {
      const diff = e.touches[0].pageY - startTouchY.current;
      if (diff > 0) setPullDistance(Math.min(diff * 0.4, 150));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      handleRefresh().finally(() => setIsRefreshing(false));
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  const handleCreatePost = async () => {
    if (userProfile.subscriptionTier !== 'Pro') {
        alert("Community posting is a Pro feature. Please upgrade to post.");
        return;
    }
    if (!newPostContent.trim()) return;
    setIsPosting(true);
    const tags = newPostTags.split(',').map(t => t.trim()).filter(t => t !== '');
    const { success, post } = await StorageService.createCommunityPost(newPostContent, tags, {
        name: userProfile.name,
        title: userProfile.title,
        avatarUrl: userProfile.avatarUrl
    }, selectedImage || undefined);
    if (success && post) {
        setPosts([post, ...posts]);
        setNewPostContent('');
        setNewPostTags('');
        setSelectedImage(null);
        setImagePreview(null);
        setIsPostModalOpen(false);
        setIsExpanded(false);
    }
    setIsPosting(false);
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    const success = await StorageService.likePost(postId, !isLiked);
    if (success) {
      setPosts(posts.map(p => p.id === postId ? { ...p, isLiked: !isLiked, likes: p.likes + (!isLiked ? 1 : -1) } : p));
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

  const handleMessage = async (authorId: string) => {
    if (onMessage) {
        onMessage(authorId);
    } else {
        const chatId = await StorageService.ensureConnection(authorId);
        if (chatId) {
            alert('Opening chat...');
        }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (userProfile.subscriptionTier !== 'Pro') {
        alert("Commenting is a Pro feature. Please upgrade to comment.");
        return;
    }
    const content = newComment[postId];
    if (!content) return;
    console.log("Adding comment:", postId, content, userProfile);
    const { success, comment, error } = await StorageService.addCommentToPost(postId, content, userProfile);
    console.log("Add comment result:", success, comment, error);
    if (success && comment) {
      setPosts(posts.map(p => p.id === postId ? { ...p, commentsList: [...(p.commentsList || []), comment], comments: p.comments + 1 } : p));
      setNewComment({ ...newComment, [postId]: '' });
    } else {
        console.error("Failed to add comment:", error);
        alert("Failed to add comment: " + (error || "Unknown error"));
    }
  };

  const handleDeletePost = async (postId: string) => {
      setPostToDelete(postId);
      setIsConfirmingDeletePost(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    const success = await StorageService.deleteCommunityPost(postToDelete);
    if (success) {
      setPosts(prev => prev.filter(p => p.id !== postToDelete));
      setIsConfirmingDeletePost(false);
      setPostToDelete(null);
    } else {
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
      setCommentToDelete({postId, commentId});
      setIsConfirmingDeleteComment(true);
  };

  const confirmDeleteComment = async () => {
      if (!commentToDelete) return;
      const {postId, commentId} = commentToDelete;
      const success = await StorageService.deleteComment(commentId);
      if (success) {
          setPosts(posts.map(p => p.id === postId ? { ...p, commentsList: p.commentsList?.filter(c => c.id !== commentId), comments: Math.max(0, p.comments - 1) } : p));
          setIsConfirmingDeleteComment(false);
          setCommentToDelete(null);
      } else {
          alert('Failed to delete comment.');
      }
  };

  if (loading) return (
    <div className="space-y-6 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-zinc-200"></div>
            <div className="space-y-2">
              <div className="h-3 w-24 bg-zinc-200 rounded"></div>
              <div className="h-2 w-16 bg-zinc-100 rounded"></div>
            </div>
          </div>
          <div className="h-4 w-full bg-zinc-100 rounded mb-2"></div>
          <div className="h-4 w-2/3 bg-zinc-100 rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div 
      ref={scrollContainerRef}
      className="h-full overflow-y-auto relative no-scrollbar"
      onScroll={(e) => {
          // Optional: handle scroll events if needed
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator (Snapchat Style) */}
      <div 
        className={`absolute left-0 right-0 flex flex-col items-center pointer-events-none z-0 transition-opacity duration-300 ${isRefreshing || isPulling ? 'opacity-100' : 'opacity-0'}`} 
        style={{ 
            top: 0, 
            height: Math.max(pullDistance, isRefreshing ? 80 : 0),
            backgroundColor: '#FFF2C2',
            borderBottomLeftRadius: '40px',
            borderBottomRightRadius: '40px',
            overflow: 'hidden'
        }}
      >
        <div 
            className="flex flex-col items-center justify-center h-full pt-4"
            style={{ 
                transform: `scale(${Math.min(0.5 + (pullDistance / PULL_THRESHOLD) * 0.5, 1.1)})`,
                opacity: Math.min(pullDistance / 40, 1)
            }}
        >
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg mb-2 rotate-12">
                <RefreshCw 
                    size={24} 
                    className={`text-[#FFD000] ${isRefreshing ? 'animate-spin' : ''}`} 
                    style={{ transform: !isRefreshing ? `rotate(${pullDistance * 3}deg)` : 'none' }} 
                />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] pl-[0.2em] text-black/40">
                {pullDistance > PULL_THRESHOLD ? 'Release to Refresh' : 'Pull to Connect'}
            </span>
        </div>
      </div>

      <div 
        className="space-y-6 relative p-4 transition-transform duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) max-w-2xl mx-auto"
        style={{ transform: isPulling ? `translateY(${pullDistance}px)` : (isRefreshing ? `translateY(80px)` : 'none') }}
      >
        <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-display font-black text-zinc-900 tracking-tight">Community Feed</h2>
        </div>

        {/* Inline Post Creation */}
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full h-16 flex items-center justify-center bg-white rounded-3xl border-2 border-dashed border-zinc-200 hover:border-black transition-all hover:bg-zinc-50"
          >
            <Plus size={24} className="text-zinc-400" />
          </button>
        ) : (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 mb-6 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-zinc-900">Create Post</h3>
              <button onClick={() => setIsExpanded(false)} className="text-zinc-400 hover:text-black">
                <X size={20} />
              </button>
            </div>
            <textarea
              value={newPostContent}
              onChange={e => setNewPostContent(e.target.value)}
              className="w-full bg-zinc-50 rounded-2xl p-4 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder="What's on your mind?"
              rows={3}
            />
            
            {imagePreview && (
              <div className="relative mb-4 inline-block">
                <img src={imagePreview} className="max-h-64 rounded-2xl object-cover border border-zinc-100" alt="Preview" />
                <button 
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-black text-white rounded-full shadow-lg hover:bg-zinc-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="file"
                id="post-image"
                className="hidden"
                accept="image/*"
                onChange={handleImageSelect}
              />
              <label 
                htmlFor="post-image"
                className="p-2 bg-zinc-100 rounded-full cursor-pointer hover:bg-zinc-200 transition-colors"
              >
                <ImagePlus size={20} className="text-zinc-600" />
              </label>
              <input
                value={newPostTags}
                onChange={e => setNewPostTags(e.target.value)}
                className="flex-1 bg-zinc-100 rounded-full px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="Tags (comma separated)"
              />
              <button 
                onClick={handleCreatePost}
                disabled={isPosting || !newPostContent.trim()}
                className="px-5 py-1.5 bg-black text-white rounded-full text-sm font-bold disabled:opacity-50 hover:bg-zinc-800 transition-colors"
              >
                {isPosting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}

      <div className="relative">
        {posts.map(post => (
          <div key={post.id} className={`bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 mb-6 ${userProfile.subscriptionTier !== 'Pro' ? 'blur-sm select-none pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="flex items-center gap-3 cursor-pointer group" 
                onClick={() => onViewProfile && onViewProfile(post.authorId)}
              >
                {post.avatar ? <img src={post.avatar} className="w-10 h-10 rounded-full object-cover border border-zinc-100 group-hover:border-brand-primary/50 transition-colors" alt={post.author} /> : <div className="w-10 h-10 rounded-full bg-zinc-200 border border-zinc-100 group-hover:border-brand-primary/50 transition-colors" />}
                <div>
                  <h4 className="font-bold text-sm group-hover:text-brand-primary transition-colors">{post.author}</h4>
                  <p className="text-xs text-zinc-500">{post.role}</p>
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                  {currentUserId === post.authorId ? (
                    <button 
                      onClick={() => handleDeletePost(post.id)} 
                      className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                      title="Delete Post"
                    >
                        <Trash2 size={16} />
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleFollow(post.authorId, !!post.isFollowingAuthor)} 
                        className={`p-2 rounded-full transition-colors ${post.isFollowingAuthor ? 'bg-brand-primary text-black' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        title={post.isFollowingAuthor ? 'Unfollow' : 'Follow'}
                      >
                          {post.isFollowingAuthor ? <UserCheck size={16} /> : <UserPlus size={16} />}
                      </button>
                      <button onClick={() => handleMessage(post.authorId)} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 text-zinc-600">
                          <MessageCircle size={16} />
                      </button>
                    </>
                  )}
              </div>
            </div>
            <p className="text-sm text-zinc-800 mb-4">{post.content}</p>
            {post.imageUrl && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-zinc-100">
                <img src={post.imageUrl} className="w-full max-h-96 object-cover" alt="Post content" referrerPolicy="no-referrer" />
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <button onClick={() => handleLike(post.id, post.isLiked)} className={`flex items-center gap-1 ${post.isLiked ? 'text-red-500' : ''}`}>
                <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} /> {post.likes}
              </button>
              <button onClick={() => setVisibleComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))} className="flex items-center gap-1">
                <MessageSquareText size={18} /> {post.comments}
              </button>
            </div>
            {visibleComments[post.id] && (
              <div className="mt-4 space-y-2">
                  {(post.commentsList || []).length === 0 && <p className="text-xs text-zinc-400">No comments yet.</p>}
                  {(post.commentsList || []).map(comment => (
                  <div key={comment.id} className="flex gap-2 text-sm bg-zinc-50 p-2 rounded-lg group">
                      {comment.avatar ? <img src={comment.avatar} className="w-6 h-6 rounded-full object-cover" alt={comment.author} /> : <div className="w-6 h-6 rounded-full bg-zinc-200" />}
                      <div className="flex-1">
                          <span className="font-bold text-xs">{comment.author} </span>
                          <span className="text-[10px] text-zinc-400">{comment.time}</span>
                          <p>{comment.content}</p>
                      </div>
                      {currentUserId === comment.authorId && (
                          <button onClick={() => handleDeleteComment(post.id, comment.id)} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={14} />
                          </button>
                      )}
                  </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                  <input 
                      value={newComment[post.id] || ''}
                      onChange={e => setNewComment({ ...newComment, [post.id]: e.target.value })}
                      onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment(post.id);
                      }}
                      className="flex-1 bg-zinc-100 rounded-full px-4 py-2 text-sm"
                      placeholder="Write a comment..."
                  />
                  <button onClick={() => handleAddComment(post.id)} className="p-2 bg-black text-white rounded-full"><SendHorizontal size={16} /></button>
                  </div>
              </div>
            )}
          </div>
        ))}
        {userProfile.subscriptionTier !== 'Pro' && posts.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full font-bold shadow-lg text-sm">
              Upgrade to Pro to view community
            </div>
          </div>
        )}
      </div>
      
      {/* Infinite Scroll Observer Target */}
      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {loadingMore && <LoaderCircle className="animate-spin text-brand-primary" />}
        {!hasMore && posts.length > 0 && <p className="text-xs text-zinc-400">No more posts to load.</p>}
      </div>

      {/* Delete Post Confirmation Modal */}
      {isConfirmingDeletePost && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsConfirmingDeletePost(false)}></div>
             <div className="relative bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                   <Trash2 size={32} />
                </div>
                <h2 className="text-2xl font-display font-bold text-zinc-900 text-center mb-3">Delete Post?</h2>
                <p className="text-zinc-500 text-sm text-center mb-8 leading-relaxed">
                   This action is permanent. The post will be removed from the community.
                </p>
                <div className="space-y-3">
                   <button 
                      onClick={confirmDeletePost}
                      className="w-full h-14 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                   >
                      Yes, Delete Post
                   </button>
                   <button 
                      onClick={() => setIsConfirmingDeletePost(false)}
                      className="w-full h-14 bg-zinc-100 text-zinc-900 font-bold rounded-2xl hover:bg-zinc-200 transition-all"
                   >
                      Cancel
                   </button>
                </div>
             </div>
          </div>
      )}

      {/* Delete Comment Confirmation Modal */}
      {isConfirmingDeleteComment && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsConfirmingDeleteComment(false)}></div>
             <div className="relative bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                   <Trash2 size={32} />
                </div>
                <h2 className="text-2xl font-display font-bold text-zinc-900 text-center mb-3">Delete Comment?</h2>
                <p className="text-zinc-500 text-sm text-center mb-8 leading-relaxed">
                   This action is permanent. The comment will be removed.
                </p>
                <div className="space-y-3">
                   <button 
                      onClick={confirmDeleteComment}
                      className="w-full h-14 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                   >
                      Yes, Delete Comment
                   </button>
                   <button 
                      onClick={() => setIsConfirmingDeleteComment(false)}
                      className="w-full h-14 bg-zinc-100 text-zinc-900 font-bold rounded-2xl hover:bg-zinc-200 transition-all"
                   >
                      Cancel
                   </button>
                </div>
             </div>
          </div>
      )}
      </div>
    </div>
  );
});
