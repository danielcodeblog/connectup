import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { CommunityPost, UserRole } from '../types';
import { 
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, 
  PlusSquare, Play, Volume2, VolumeX, Loader2, 
  UserPlus, UserCheck, Trash2, ChevronLeft, ChevronRight, X,
  Image as ImageIcon, Plus, Check, RotateCcw,
  Settings, BarChart2, Smile, Share2, Repeat2,
  Shield, Globe, Target, Quote, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './Card';
import { StatusIndicator } from './StatusIndicator';
import { VentureConnections } from './VentureConnections';
import { CreatePostModal } from './CreatePostModal';
import connectupBannerImg from '../src/assets/images/connectup_final.png';

const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "It's not about ideas. It's about making ideas happen.", author: "Scott Belsky" },
  { text: "If you are not embarrassed by the first version of your product, you’ve launched too late.", author: "Reid Hoffman" },
  { text: "Ideas are easy. Implementation is hard.", author: "Guy Kawasaki" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Make every detail perfect and limit the number of details to perfect.", author: "Jack Dorsey" },
  { text: "Move fast and break things.", author: "Mark Zuckerberg" },
  { text: "Chase the vision, not the money, the money will end up following you.", author: "Tony Hsieh" },
  { text: "Empower people.", author: "Bill Gates" },
];

interface CommunityFeedProps {
  userProfile: any;
  onMessage?: (authorId: string) => void;
  onViewProfile?: (userId: string) => void;
  refreshTrigger?: number;
  onAddPost?: () => void;
  onQuotePost?: (post: CommunityPost) => void;
  initialTab?: 'for-you' | 'following' | 'bookmarks' | 'profile';
}

const CommunityFeed = ({ 
  userProfile, 
  onMessage, 
  onViewProfile,
  refreshTrigger = 0,
  onAddPost,
  onQuotePost,
  initialTab = 'for-you'
}: CommunityFeedProps) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pull to Refresh State
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startTouchY = useRef(0);
  const PULL_THRESHOLD = 80;

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{commentId: string, postId: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'recent' | 'liked'>('recent');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'for-you' | 'following' | 'bookmarks' | 'profile'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [postMenuOpen, setPostMenuOpen] = useState<string | null>(null);
  const [reportPost, setReportPost] = useState<any | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const [reposts, setReposts] = useState<Record<string, number>>({});
  const [reposted, setReposted] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  const handleOpenReport = (post: any) => {
    setReportPost(post);
    setReportReason('');
    setPostMenuOpen(null);
  };

  const handleCancelReport = () => {
    setReportPost(null);
    setReportReason('');
  };

  const handleSubmitReport = async () => {
    if (!reportPost || !reportReason.trim()) return;
    setIsSubmittingReport(true);
    const success = await StorageService.submitPostReport(reportPost, reportReason);
    setIsSubmittingReport(false);
    if (success) {
      setReportPost(null);
      setReportReason('');
      alert("Report submitted successfully.");
    } else {
      alert("Failed to submit report.");
    }
  };

  // Filtered Posts Calculation
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (activeTab === 'following' && !p.isFollowingAuthor) {
        return false;
      }
      if (activeTab === 'bookmarks' && !bookmarked[p.id] && !p.isBookmarked) {
        return false;
      }
      if (activeTab === 'profile' && p.authorId !== currentUserId) {
        return false;
      }
      if (selectedTag) {
        const tagLower = selectedTag.toLowerCase();
        const hasTagInArray = p.tags?.some(t => t.toLowerCase() === tagLower);
        const hasTagInContent = p.content?.toLowerCase().includes(`#${tagLower}`);
        return hasTagInArray || hasTagInContent;
      }
      return true;
    });
  }, [posts, activeTab, selectedTag, bookmarked, currentUserId]);

  // Topics Header State (Synced with Supabase community_topics table & localStorage)
  const [topics, setTopics] = useState<string[]>([]);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [activeTopicModal, setActiveTopicModal] = useState<string | null>(null);

  useEffect(() => {
    const loadTopics = async () => {
      const dbTopics = await StorageService.getCommunityTopics();
      setTopics(dbTopics);
    };
    loadTopics();
  }, []);

  const handleAddTopic = async (topicName: string) => {
    const clean = topicName.trim().replace(/^#/, '');
    if (!clean) return;
    const updated = await StorageService.addCommunityTopic(clean);
    setTopics(updated);
    setSelectedTag(clean);
    setShowAddTopicModal(false);
    setNewTopicInput('');
  };

  const handleRemoveTopic = async (e: React.MouseEvent, topicToRemove: string) => {
    e.stopPropagation();
    const updated = await StorageService.deleteCommunityTopic(topicToRemove);
    setTopics(updated);
    if (selectedTag?.toLowerCase() === topicToRemove.toLowerCase()) {
      setSelectedTag(null);
    }
  };

  // Topics Scrollable Navigation Controls
  const topicsBarRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const checkScroll = () => {
    if (topicsBarRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = topicsBarRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
    }
  };

  useEffect(() => {
    const el = topicsBarRef.current;
    if (!el) return;
    
    checkScroll();
    
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        checkScroll();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [topics]);

  const scrollContainer = (direction: 'left' | 'right') => {
    if (topicsBarRef.current) {
      const scrollAmount = 220;
      topicsBarRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!topicsBarRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - topicsBarRef.current.offsetLeft);
    setScrollLeftPos(topicsBarRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !topicsBarRef.current) return;
    e.preventDefault();
    const x = e.pageX - topicsBarRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    topicsBarRef.current.scrollLeft = scrollLeftPos - walk;
    checkScroll();
  };

  // Twitter Specific Interaction Mocks
  const [quickPostContent, setQuickPostContent] = useState('');
  const [quickSelectedImage, setQuickSelectedImage] = useState<File | null>(null);
  const [quickImagePreview, setQuickImagePreview] = useState<string | null>(null);
  const [isQuickPosting, setIsQuickPosting] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQuickSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQuickImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateQuickPost = async () => {
    if (!quickPostContent.trim()) return;
    setIsQuickPosting(true);
    try {
      const { success, post } = await StorageService.createCommunityPost(quickPostContent, [], {
        name: userProfile?.name || 'User',
        title: userProfile?.title || 'Member',
        avatarUrl: userProfile?.avatarUrl
      }, quickSelectedImage || undefined);
      
      if (success && post) {
        setPosts(prev => [post, ...prev]);
        setQuickPostContent('');
        setQuickSelectedImage(null);
        setQuickImagePreview(null);
        const dbTopics = await StorageService.getCommunityTopics();
        setTopics(dbTopics);
      }
    } catch (error) {
      console.error("Error creating quick post:", error);
    } finally {
      setIsQuickPosting(false);
    }
  };
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    StorageService.getCurrentUserId().then(id => setCurrentUserId(id));
    setPage(0);
    loadPosts(0);
    StorageService.getCommunityTopics().then(dbTopics => setTopics(dbTopics));
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
    if (pageNum === 0) {
      if (!isPulling) setLoading(true);
      else setIsRefreshing(true);
    }
    else setLoadingMore(true);

    try {
      const [data, bmPosts] = await Promise.all([
        StorageService.getCommunityPosts(pageNum, 20, sortBy, selectedTag),
        StorageService.getBookmarkedPosts()
      ]);

      const bmMap: Record<string, boolean> = {};
      data.forEach(p => {
        if (p.isBookmarked) bmMap[p.id] = true;
      });
      bmPosts.forEach(p => {
        bmMap[p.id] = true;
      });
      setBookmarked(prev => ({ ...prev, ...bmMap }));

      // Merge bookmarked posts into feed list
      const combined = [...data];
      const existingIds = new Set(data.map(p => p.id));
      bmPosts.forEach(p => {
        if (!existingIds.has(p.id)) {
          combined.push(p);
        }
      });

      if (pageNum === 0) {
        setPosts(combined);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = combined.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      }
      setHasMore(data.length === 20);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      if (pageNum === 0) {
        setLoading(false);
        setIsRefreshing(false);
      }
      else setLoadingMore(false);
    }
  };

  // --- Pull to Refresh ---

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0) {
        startTouchY.current = e.touches[0].pageY;
        setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPulling && !isRefreshing && !loading) {
        const diff = e.touches[0].pageY - startTouchY.current;
        if (diff > 0) setPullDistance(Math.min(diff * 0.4, 150));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= PULL_THRESHOLD) {
      loadPosts(0);
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  const handleBookmark = async (postId: string) => {
    const isCurrentlyBookmarked = !!bookmarked[postId];
    const newBookmarkedState = !isCurrentlyBookmarked;
    setBookmarked(prev => ({ ...prev, [postId]: newBookmarkedState }));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isBookmarked: newBookmarkedState } : p));
    await StorageService.toggleBookmarkPost(postId, newBookmarkedState);
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
        setPosts(prev => prev.map(p => p.authorId === authorId ? { ...p, isFollowingAuthor: false } : p));
      }
    } else {
      const success = await StorageService.followUser(authorId);
      if (success) {
        setPosts(prev => prev.map(p => p.authorId === authorId ? { ...p, isFollowingAuthor: true } : p));
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

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    setIsDeleting(true);
    try {
      const { commentId, postId } = commentToDelete;
      const success = await StorageService.deleteCommunityComment(commentId);
      if (success) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              comments: Math.max(0, p.comments - 1),
              commentsList: (p.commentsList || []).filter(c => c.id !== commentId)
            };
          }
          return p;
        }));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsDeleting(false);
      setCommentToDelete(null);
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
  };  // Dynamic News Selection
  const dailyNews = useMemo(() => {
    const STARTUP_NEWS_POOL = [
      { category: 'Startup News · LIVE', title: 'Nigerian Fintech "Flux" secures $15M Series B to expand across West Africa.' },
      { category: 'Tech Ecosystem', title: 'Nairobi emerges as the leading AI innovation hub in Sub-Saharan Africa.' },
      { category: 'Venture Capital', title: 'Why early-stage seed rounds are seeing a massive resurgence this quarter.' },
      { category: 'Policy Update', title: 'New "Startup Act" passed in Ghana to provide tax relief for tech founders.' },
      { category: 'Acquisition', title: 'South African solar startup acquired for $80M by global energy giant.' },
      { category: 'Talent', title: 'The rise of remote developer hubs in Lagos and Cairo.' },
      { category: 'Sustainability', title: 'Tunisian agritech startup raises $2M to combat regional water scarcity.' },
      { category: 'Innovation', title: 'Moroccan crypto exchange granted first provisional license by central bank.' },
      { category: 'Growth', title: 'E-commerce platform "Zando" reports 300% YoY growth in active users.' },
      { category: 'Infrastructure', title: 'New undersea fiber cable lands in Luanda, promising 10Gbps connectivity.' }
    ];
    const day = currentDate.getDate();
    // Update every 30 seconds
    const rotationIndex = Math.floor(currentDate.getTime() / (30 * 1000));
    const index = (day + rotationIndex) % (STARTUP_NEWS_POOL.length - 3);
    return STARTUP_NEWS_POOL.slice(index, index + 4);
  }, [currentDate]);

  // Dynamic Quality Income Niches
  const incomeNiches = useMemo(() => {
    const NICHE_POOL = [
        { title: 'AI Automation Agency', income: 'High', demand: 'Surging' },
        { title: 'SaaS Micro-Acquisitions', income: 'High', demand: 'Growing' },
        { title: 'Niche Content Subscriptions', income: 'Medium', demand: 'Stable' },
        { title: 'Remote DevOps Consulting', income: 'High', demand: 'Rising' },
        { title: 'B2B Newsletter Monetization', income: 'Medium', demand: 'Steady' },
    ];
    const day = currentDate.getDate();
    // Update every 30 seconds
    const rotationIndex = Math.floor(currentDate.getTime() / (30 * 1000));
    const index = (day + rotationIndex) % (NICHE_POOL.length - 2);
    return NICHE_POOL.slice(index, index + 3);
  }, [currentDate]);

  const STEPS_TO_SCALE = [
    { step: "1", title: "Product-Market Fit", desc: "Validate core value proposition." },
    { step: "2", title: "Automate Sales", desc: "Build repeatable funnel and CRM." },
    { step: "3", title: "Hire Leadership", desc: "Delegate operations and strategy." },
    { step: "4", title: "Optimize Margins", desc: "Scale efficiency and reduce costs." },
  ];

  return (
    <div className="flex justify-center items-start w-full max-w-full min-h-screen gap-x-8 bg-zinc-50/70 dark:bg-zinc-950 font-sans text-zinc-950 dark:text-zinc-100 selection:bg-amber-500/20">
      
      {/* Main Feed Lane */}
      <div 
        className="w-full max-w-[750px] flex flex-col bg-white dark:bg-zinc-900 min-h-screen relative border-x border-zinc-200/70 dark:border-zinc-800 order-1 animate-in fade-in duration-300 overflow-x-hidden shadow-xs"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header - Sticky */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800 shrink-0 w-full overflow-hidden">
          <div className="px-5 pt-3 pb-2.5 flex items-center justify-between">
            <h1 className="text-xl font-display font-black tracking-tight text-zinc-950 dark:text-white px-1 select-none">
              Connect<span className="text-amber-500">Up</span> <span className="text-xs font-semibold text-zinc-400 font-sans tracking-normal ml-1">Ecosystem</span>
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddTopicModal(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/80 cursor-pointer"
                title="Add a discussion topic"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Topic</span>
              </button>
              {onAddPost && (
                <button
                  onClick={onAddPost}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>New Post</span>
                </button>
              )}
            </div>
          </div>

          {/* Twitter-style Combined Top Navigation Tabs */}
          <div className="relative w-full">
            <div 
              ref={topicsBarRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 px-5 bg-zinc-50/70 dark:bg-zinc-900/70 border-t border-zinc-200/50 dark:border-zinc-800/80 w-full scroll-smooth select-none cursor-grab ${
                isMouseDown ? 'cursor-grabbing' : ''
              }`}
            >
              <button 
                onClick={() => { setActiveTab('for-you'); setSelectedTag(null); }}
                className={`px-3.5 py-1 rounded-xl text-xs font-bold relative flex items-center justify-center select-none cursor-pointer shrink-0 transition-all ${
                  activeTab === 'for-you' && !selectedTag
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span>For You</span>
              </button>

              <button 
                onClick={() => { setActiveTab('following'); setSelectedTag(null); }}
                className={`px-3.5 py-1 rounded-xl text-xs font-bold relative flex items-center justify-center select-none cursor-pointer shrink-0 transition-all ${
                  activeTab === 'following' && !selectedTag
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span>Following</span>
              </button>

              <button 
                onClick={() => { setActiveTab('bookmarks'); setSelectedTag(null); }}
                className={`px-3.5 py-1 rounded-xl text-xs font-bold relative flex items-center justify-center select-none cursor-pointer shrink-0 transition-all ${
                  activeTab === 'bookmarks' && !selectedTag
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span>Bookmarks</span>
              </button>

              {/* Vertical Divider */}
              <div className="h-3.5 w-[1px] bg-zinc-200 dark:bg-zinc-700 shrink-0 mx-1" />

              <div className="flex items-center gap-1 shrink-0 text-amber-600 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider pl-0.5 pr-0.5 select-none">
                <span>Topics:</span>
              </div>

              {topics.length === 0 ? (
                <button
                  onClick={() => setShowAddTopicModal(true)}
                  className="px-2.5 py-0.5 text-xs text-zinc-500 hover:text-zinc-800 italic border border-dashed border-zinc-300 rounded-full shrink-0 flex items-center gap-1 cursor-pointer transition-colors bg-white/60"
                >
                  <span>+ Add your first topic</span>
                </button>
              ) : (
                topics.map(topic => {
                  const isSelected = selectedTag?.toLowerCase() === topic.toLowerCase();
                  return (
                    <div
                      key={topic}
                      onClick={() => setSelectedTag(isSelected ? null : topic)}
                      className={`group px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border select-none ${
                        isSelected
                          ? "bg-amber-400 text-zinc-950 border-amber-400 font-extrabold shadow-sm scale-[1.02]"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      <span>#{topic}</span>
                      <button
                        onClick={(e) => handleRemoveTopic(e, topic)}
                        className={`p-0.5 rounded-full transition-colors ${
                          isSelected
                            ? "hover:bg-amber-500/50 text-zinc-950"
                            : "opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600 hover:bg-zinc-200"
                        }`}
                        title={`Remove #${topic} topic`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>


          </div>

        <div className="flex flex-col w-full h-full pb-32" style={{ 
          transform: isPulling ? `translateY(${pullDistance}px)` : (isRefreshing ? `translateY(${PULL_THRESHOLD}px)` : 'none'), 
          transition: isPulling ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}>
          
          {/* Pull to Refresh Indicator */}
          <div className="absolute top-0 left-0 w-full h-[80px] -translate-y-full flex items-center justify-center pointer-events-none">
             {isRefreshing ? (
                <RotateCcw className="w-5 h-5 text-amber-500 animate-spin" />
             ) : (
                <div 
                  className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center shadow-sm transition-transform text-zinc-400"
                  style={{ transform: `rotate(${Math.min(pullDistance * 3, 180)}deg)` }}
                >
                  <RotateCcw className="w-4 h-4" />
                </div>
             )}
          </div>


          {loading && posts.length > 0 && (
            <div className="flex items-center justify-center py-6 border-b border-zinc-900/20">
              <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
            </div>
          )}

          {/* Posts Timeline */}
          <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800 min-h-[800px]">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-3.5 sm:gap-4 p-4 sm:p-5 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors duration-150 bg-white dark:bg-zinc-900"
                >
                  {/* Left Column: Avatar & Verified Badge */}
                  <div className="flex flex-col items-center shrink-0">
                    <div 
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden cursor-pointer relative bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 shadow-xs"
                      onClick={() => onViewProfile && onViewProfile(post.authorId)}
                    >
                      {post.avatar ? (
                        <img src={post.avatar} className="w-full h-full object-cover hover:opacity-90 transition-opacity" alt={post.author} />
                      ) : (
                        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-sm">
                          {post.author?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                    {post.authorVerified && (
                      <div className="mt-1.5">
                        <Check className="w-4 h-4 text-amber-500 fill-current stroke-[3.5]" />
                      </div>
                    )}
                  </div>

                  {/* Right Column: Meta + Content + Actions */}
                  <div className="flex-1 min-w-0">
                    {/* Header line info */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0 text-[14px] sm:text-[15px] flex-nowrap overflow-hidden">
                        <span 
                          className="font-bold text-zinc-950 dark:text-white hover:underline cursor-pointer truncate shrink-0 max-w-[120px] sm:max-w-[180px]"
                          onClick={() => onViewProfile && onViewProfile(post.authorId)}
                        >
                          {post.author || 'Member'}
                        </span>
                        
                        <span className="text-zinc-400 shrink-0">·</span>
                        
                        <span className="text-zinc-400 text-[13px] shrink-0" title={post.time}>
                          {post.time}
                        </span>

                        {currentUserId !== post.authorId && (
                          <>
                            <span className="text-zinc-400 text-[13px] shrink-0">·</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollow(post.authorId, post.isFollowingAuthor);
                              }}
                              className={`text-[13px] font-bold transition-colors shrink-0 cursor-pointer ${
                                post.isFollowingAuthor 
                                  ? 'text-zinc-400 hover:text-red-500' 
                                  : 'text-amber-500 hover:text-amber-400'
                              }`}
                            >
                              {post.isFollowingAuthor ? 'Following' : 'Follow'}
                            </button>
                          </>
                        )}
                      </div>

                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPostMenuOpen(postMenuOpen === post.id ? null : post.id);
                          }}
                          className="w-7 h-7 flex-none rounded-xl text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center -mr-1 cursor-pointer"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {postMenuOpen === post.id && (
                          <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200/80 dark:border-zinc-800 py-1 z-50">
                            {currentUserId === post.authorId ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPostToDelete(post.id);
                                  setPostMenuOpen(null);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenReport(post);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 cursor-pointer"
                              >
                                <Shield size={13} /> Report
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content Text */}
                    <p className="text-zinc-800 dark:text-zinc-200 text-[14.5px] leading-relaxed select-text whitespace-pre-line mb-3 pr-2 text-left">
                      {post.content}
                    </p>

                    {/* Quoted Post Rendering */}
                    {post.quotedPost && (
                      <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50/70 dark:bg-zinc-800/40 mb-3 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer mr-1 text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <img src={post.quotedPost.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                          <div className="flex items-center gap-1">
                            <span id="quoted-post-author-name" className="text-xs font-bold text-zinc-950 dark:text-white hover:underline transition-all">
                              {post.quotedPost.author}
                            </span>
                            {post.quotedPost.authorVerified && <Check className="w-3 h-3 text-amber-500 fill-amber-500" />}
                          </div>
                          <span className="text-xs text-zinc-400">·</span>
                          <span className="text-xs text-zinc-400">{post.quotedPost.time}</span>
                        </div>
                        <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-3">
                          {post.quotedPost.content}
                        </p>
                        {post.quotedPost.imageUrl && (
                          <div className="mt-2 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden max-h-[200px]">
                             <img src={post.quotedPost.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Optional tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.map(tag => (
                          <span 
                            key={tag} 
                            onClick={() => setSelectedTag(tag)}
                            className="text-[13px] font-bold text-amber-500 dark:text-amber-400 hover:underline cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Integrated Post Image */}
                    {post.imageUrl && (
                      <div className="rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 max-h-[512px] mb-3 shadow-xs mr-1">
                        <img 
                          src={post.imageUrl} 
                          className="w-full object-cover max-h-[512px] hover:opacity-95 transition-opacity" 
                          alt="Post media" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Feed Action Bar */}
                    <div className="flex items-center justify-between max-w-sm text-zinc-500 dark:text-zinc-400 pt-1">
                      
                      {/* Comments */}
                      <button 
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 group hover:text-amber-500 transition-colors cursor-pointer"
                      >
                        <div className="p-2 rounded-xl group-hover:bg-amber-500/10 active:scale-95 transition-all">
                          <MessageCircle size={17} />
                        </div>
                        <span className="text-xs font-semibold tabular-nums">{post.comments}</span>
                      </button>

                      {/* Repost */}
                      <button 
                        onClick={() => onQuotePost?.(post)}
                        className={`flex items-center group transition-colors cursor-pointer ${post.isReposted ? 'text-emerald-500' : 'hover:text-emerald-500'}`}
                      >
                        <div className="p-2 rounded-xl group-hover:bg-emerald-500/10 active:scale-95 transition-all">
                          <Repeat2 size={17} className={post.isReposted ? 'stroke-[2.5px]' : ''} />
                        </div>
                      </button>

                      {/* Likes */}
                      <button 
                        onClick={() => handleLike(post.id, post.isLiked)}
                        className={`flex items-center gap-1.5 group transition-colors cursor-pointer ${post.isLiked ? 'text-amber-500' : 'hover:text-amber-500'}`}
                      >
                        <div className={`p-2 rounded-xl group-hover:bg-amber-500/10 active:scale-95 transition-all`}>
                          <Heart size={17} className={post.isLiked ? 'fill-amber-500' : ''} />
                        </div>
                        <span className="text-xs font-semibold tabular-nums">{post.likes}</span>
                      </button>

                      {/* Bookmark */}
                      <button 
                        onClick={() => handleBookmark(post.id)}
                        className={`flex items-center gap-1.5 group transition-colors cursor-pointer ${bookmarked[post.id] ? 'text-amber-500' : 'hover:text-amber-500'}`}
                      >
                        <div className={`p-2 rounded-xl group-hover:bg-amber-500/10 active:scale-95 transition-all`}>
                          <Bookmark size={17} className={bookmarked[post.id] ? 'fill-amber-500' : ''} />
                        </div>
                      </button>

                    </div>

                    {/* Integrated Comments Thread */}
                    <AnimatePresence>
                      {expandedComments[post.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-transparent mt-2 mr-1"
                        >
                          <div className="pt-2 pb-1 space-y-3">
                            <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl p-3 border border-zinc-200/70 dark:border-zinc-800">
                              
                              {post.commentsList && post.commentsList.length > 0 ? (
                                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar pb-3">
                                  {post.commentsList.map(comment => (
                                    <div key={comment.id} className="flex gap-2.5 text-left pt-3 first:pt-0">
                                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-zinc-200 dark:bg-zinc-700">
                                        {comment.avatar ? (
                                          <img src={comment.avatar} className="w-full h-full object-cover" alt={comment.author} />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-zinc-500">
                                            {comment.author?.[0] || 'U'}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-zinc-950 dark:text-white">{comment.author}</span>
                                            <span className="text-[10px] text-zinc-400">·</span>
                                            <span className="text-[10px] text-zinc-400">{comment.time}</span>
                                          </div>
                                          
                                          {currentUserId === comment.authorId && (
                                            <button 
                                              onClick={() => setCommentToDelete({ commentId: comment.id, postId: post.id })}
                                              className="p-1 hover:text-red-500 text-zinc-400 transition-colors cursor-pointer"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          )}
                                        </div>
                                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed pr-1 font-normal text-left">
                                          {comment.content}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-zinc-400">
                                  <p className="text-[11px] font-semibold">No replies yet. Share your thoughts.</p>
                                </div>
                              )}

                              {/* Comment Form */}
                              <div className="flex gap-2.5 pt-3">
                                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                  {userProfile?.avatarUrl ? (
                                    <img src={userProfile.avatarUrl} className="w-full h-full object-cover" alt="Me" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                      {userProfile?.name?.[0] || 'U'}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 relative">
                                  <input 
                                    type="text" 
                                    placeholder="Post your reply..."
                                    value={commentInputs[post.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl px-3.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 text-zinc-950 dark:text-white placeholder-zinc-400 shadow-xs pr-10"
                                  />
                                  <button 
                                    onClick={() => handleCommentSubmit(post.id)}
                                    disabled={isSubmittingComment[post.id] || !commentInputs[post.id]?.trim()}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-amber-500 disabled:text-zinc-300 dark:disabled:text-zinc-600 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                  >
                                    {isSubmittingComment[post.id] ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Send className="w-3.5 h-3.5 fill-current text-amber-500" />
                                    )}
                                  </button>
                                </div>
                              </div>

                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-3 px-4 bg-white dark:bg-zinc-900"
              >
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  {activeTab === 'bookmarks' ? <Bookmark className="w-5 h-5 text-zinc-400" /> : <PlusSquare className="w-5 h-5 text-zinc-400" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-950 dark:text-white">
                    {activeTab === 'bookmarks' ? 'No bookmarked posts' : 'No posts found'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 max-w-xs">
                    {activeTab === 'bookmarks'
                      ? 'Save posts by clicking the bookmark icon to review deal signals here.'
                      : 'Be the first to share an insight with the founder ecosystem!'}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Infinite Scroll trigger area */}
          <div ref={observerTarget} className="h-16 flex items-center justify-center border-t border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            {loadingMore && <Loader2 className="w-5 h-5 animate-spin text-amber-500" />}
          </div>

        </div>
      </div>
      
      {/* Right Sidebar - Startup News & Games (Desktop/Laptop only) */}
      <div className="hidden lg:flex flex-col w-[350px] shrink-0 sticky top-4 self-start h-fit max-h-[calc(100vh-32px)] py-4 px-4 overflow-y-auto no-scrollbar order-2 border-l border-white/10 space-y-4 z-30">
        <VentureConnections />
        
        {/* ConnectUp Promo Banner under games */}
        <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-xs">
          <img 
            src={connectupBannerImg} 
            alt="ConnectUp - Connecting the future with ConnectUp" 
            className="w-full h-auto rounded-xl object-cover hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      </div>


      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-transparent" onClick={() => !isDeleting && setPostToDelete(null)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-3 border border-red-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-zinc-950 dark:text-white">Delete Post?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-5">This action cannot be undone. This post will be permanently removed from the community feed.</p>
            <div className="flex gap-2.5 w-full">
              <button 
                onClick={() => setPostToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center shadow-xs cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Comment Confirmation Modal */}
      {commentToDelete && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-transparent" onClick={() => !isDeleting && setCommentToDelete(null)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-3 border border-red-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-zinc-950 dark:text-white">Delete Reply?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-5">This will remove your reply from this discussion thread.</p>
            <div className="flex gap-2.5 w-full">
              <button 
                onClick={() => setCommentToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteComment}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center shadow-xs cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddTopicModal && (
        <div className="fixed inset-0 z-[120] bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-zinc-200/80 dark:border-zinc-800 relative">
            <button
              onClick={() => setShowAddTopicModal(false)}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 bg-amber-400/10 text-amber-500 rounded-xl">
                <MessageCircle className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="font-display font-bold text-xl text-zinc-950 dark:text-white">Add Discussion Topic</h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
              Create a new topic hashtag for founders and investors to talk about.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTopic(newTopicInput);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Topic Hashtag Name
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-zinc-400 font-bold text-base">#</span>
                  <input
                    type="text"
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    placeholder="e.g. Web3, Bootstrapping, CleanTech"
                    className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 font-sans"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTopicModal(false)}
                  className="flex-1 py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTopicInput.trim()}
                  className="flex-1 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Talk About Topic Modal */}
      {activeTopicModal && (
        <CreatePostModal
          userProfile={userProfile}
          initialTopic={activeTopicModal}
          onClose={() => setActiveTopicModal(null)}
          onPostCreated={(newPost) => {
            setPosts(prev => [newPost, ...prev]);
            setActiveTopicModal(null);
          }}
        />
      )}

      {/* Report Modal */}
      <AnimatePresence>
        {reportPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[2rem] w-full max-w-sm p-6 flex flex-col shadow-2xl relative"
            >
              <h3 className="text-xl font-bold text-zinc-900 mb-4">Report Post</h3>
              <p className="text-sm text-zinc-500 mb-4">Are you sure you want to report this post?</p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Reason for reporting..."
                className="w-full p-3 border border-zinc-200 rounded-xl mb-4 text-sm"
              />
              <div className="flex gap-2">
                <button onClick={handleCancelReport} className="flex-1 py-2 bg-zinc-100 rounded-xl font-bold">Cancel</button>
                <button onClick={handleSubmitReport} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold" disabled={isSubmittingReport}>Submit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(CommunityFeed);