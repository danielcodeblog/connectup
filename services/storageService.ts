import { Startup, ChatSession, Message, UserRole, CommunityPost, CommunityComment, Reaction, SubscriptionTier, Meeting, BillingCycle, SubscriptionTransaction } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Helper for UUIDs
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface StorageInitStatus {
    success: boolean;
    missingTables?: string[];
    isMock?: boolean;
}

let initPromise: Promise<StorageInitStatus> | null = null;
let _isMock = false;

const MOCK_PROFILE = {
    name: 'Demo User',
    title: 'Angel Investor',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    location: 'San Francisco, CA',
    email: 'demo@connectup.com',
    subscriptionTier: 'Pro' as SubscriptionTier,
    role: UserRole.INVESTOR,
    subscriptionEndDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    billingCycle: 'monthly' as BillingCycle
};

const MOCK_STARTUPS: Startup[] = [
    {
        id: 's2',
        name: 'EcoSync',
        oneLiner: 'Smart grid optimization for renewable energy.',
        description: 'Using AI to balance power grids with high renewable penetration.',
        industry: 'CleanTech',
        fundingStage: 'Pre-Seed',
        askAmount: 500000,
        valuationCap: 4000000,
        imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
        tags: ['AI', 'Energy', 'Sustainability'],
        founder: {
            name: 'Sarah Chen',
            role: 'Founder',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
            location: 'Austin, TX',
            subscriptionTier: 'Free'
        },
        metrics: { views: 120, likes: 30 }
    },
    {
        id: 's1',
        name: 'Novus',
        oneLiner: 'Autonomous drone delivery network for medical supplies.',
        description: 'Building the next generation of logistics infrastructure for urgent medical deliveries.',
        industry: 'Logistics',
        fundingStage: 'Seed',
        askAmount: 2000000,
        valuationCap: 12000000,
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        tags: ['Robotics', 'Healthcare', 'AI'],
        founder: {
            name: 'Alex Rivera',
            role: 'CEO',
            avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
            location: 'Boston, MA',
            subscriptionTier: 'Pro'
        },
        metrics: { views: 540, likes: 120 }
    }
];

const MOCK_CHATS: ChatSession[] = [
    {
        id: 'c1',
        startupId: 's1',
        startupName: 'Novus',
        subtitle: 'Alex Rivera',
        avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
        lastMessage: 'Let’s schedule a demo call.',
        timestamp: new Date().toISOString(),
        unread: 1
    }
];

const MOCK_MESSAGES: Message[] = [
    {
        id: 'm1',
        senderId: 's1',
        text: 'Hi there! Saw you viewed our deck. Happy to answer any questions.',
        type: 'text',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isMe: false
    }
];

const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
    {
        id: 'p1',
        authorId: 's1',
        author: 'Alex Rivera',
        role: 'Founder @ Novus',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
        authorVerified: true,
        content: 'Just secured our lead investor for the Seed round! 🚀 #milestone',
        tags: ['Fundraising', 'Wins'],
        likes: 45,
        comments: 12,
        time: '2h ago',
        isLiked: false,
        isFollowingAuthor: false,
        commentsList: []
    }
];

export const StorageService = {
  
  isMockMode: () => _isMock,

  init: (): Promise<StorageInitStatus> => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        if (!isSupabaseConfigured) {
            _isMock = true;
            return { success: false, isMock: true };
        }
        try {
            const { error: profileError } = await supabase.from('profiles').select('id').limit(1);
            
            if (profileError) {
                if (profileError.message && (profileError.message.includes('fetch') || profileError.message.includes('network'))) {
                     console.warn("Supabase unreachable (Network Error). Switching to Mock Mode.");
                     _isMock = true;
                     return { success: false, isMock: true };
                }
                
                // Handle Refresh Token error during initial check
                if (profileError.message?.includes('Refresh Token Not Found') || profileError.message?.includes('invalid_grant')) {
                    console.warn("Auth session corrupted during init. Clearing...");
                    await supabase.auth.signOut().catch(() => {});
                    // We don't switch to mock mode here, we just let the app handle the missing session
                }

                if (profileError.code !== '42P01' && profileError.code !== 'PGRST116') {
                     console.warn(`Supabase Connection Warning:`, profileError.message);
                     // Only switch to mock if it's a real connection issue, not just an auth issue
                     if (!profileError.message?.includes('JWT')) {
                        _isMock = true;
                        return { success: false, isMock: true }; 
                     }
                }
            }

            const tablesToCheck = ['meetings', 'subscription_transactions', 'community_posts', 'chats', 'messages', 'community_comments', 'community_likes'];
            const missingTables: string[] = [];
            
            for (const table of tablesToCheck) {
                const { error } = await supabase.from(table).select('id').limit(1);
                if (error && error.code === '42P01') {
                    missingTables.push(table);
                }
            }

            if (missingTables.length > 0) {
                console.warn("Database schema incomplete. Missing tables:", missingTables);
                return { success: true, missingTables };
            }

            return { success: true };
        } catch (e: any) {
            console.error("Supabase Connection Exception:", e);
            _isMock = true;
            return { success: false, isMock: true };
        }
    })();

    return initPromise;
  },

  getCurrentUserId: async (): Promise<string | null> => {
      if (_isMock) return 'mock-user-123';
      try {
          const { data } = await supabase.auth.getUser();
          return data.user?.id || null;
      } catch {
          return null;
      }
  },

  checkUserRole: async (userId: string): Promise<UserRole | null> => {
    if (_isMock) return UserRole.INVESTOR;
    try {
        const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
        if (error) return null;
        const rawRole = data?.role as string;
        if (rawRole) return rawRole.toUpperCase() as UserRole;
        return null;
    } catch (e) { return null; }
  },

  getUserProfile: async (userId: string) => {
    if (_isMock) return MOCK_PROFILE;
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('full_name, title, avatar_url, location, email, subscription_tier, role, subscription_end_date, billing_cycle')
            .eq('id', userId)
            .maybeSingle();
        if (error || !data) return null;
        return {
            name: data.full_name,
            title: data.title,
            avatarUrl: data.avatar_url,
            location: data.location,
            email: data.email,
            subscriptionTier: (data.subscription_tier as SubscriptionTier) || 'Free',
            role: (data.role as string)?.toUpperCase() as UserRole,
            subscriptionEndDate: data.subscription_end_date,
            billingCycle: data.billing_cycle
        };
    } catch (e) { return null; }
  },

  updateUserProfile: async (updates: Partial<{ name: string, title: string, location: string, avatarUrl: string, subscriptionTier: SubscriptionTier, role: UserRole }>) => {
    if (_isMock) { Object.assign(MOCK_PROFILE, updates); return; }
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.full_name = updates.name;
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.location) dbUpdates.location = updates.location;
        if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
        if (updates.subscriptionTier) dbUpdates.subscription_tier = updates.subscriptionTier;
        if (updates.role) dbUpdates.role = updates.role;
        await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
    } catch (e) { console.error(e); }
  },

  uploadVideo: async (file: File): Promise<string | null> => {
    if (_isMock) return URL.createObjectURL(file);
    try {
        const uid = (await supabase.auth.getUser()).data.user?.id;
        if (!uid) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${uid}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage.from('videos').upload(filePath, file, { upsert: true });
        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            // Fallback to images bucket if videos bucket doesn't exist
            const { error: fallbackError } = await supabase.storage.from('images').upload(filePath, file, { upsert: true });
            if (fallbackError) {
                console.error("Fallback upload error:", fallbackError);
                return null;
            }
            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            return data.publicUrl;
        }
        const { data } = supabase.storage.from('videos').getPublicUrl(filePath);
        return data.publicUrl;
    } catch (e) { 
        console.error("Upload exception:", e);
        return null; 
    }
  },

  uploadProfilePicture: async (file: File, userId?: string): Promise<string | null> => {
    if (_isMock) return URL.createObjectURL(file);
    try {
        const uid = userId || (await supabase.auth.getUser()).data.user?.id;
        if (!uid) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${uid}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
        if (uploadError) return null;
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    } catch (e) { return null; }
  },

  completeUserProfile: async (userId: string, email: string, role: UserRole, details: { name: string, title: string, location: string, avatarUrl?: string }) => {
    if (_isMock) return;
    try {
        const profileData = {
            id: userId,
            email: email,
            full_name: details.name || email.split('@')[0],
            title: details.title,
            role: role, 
            location: details.location,
            avatar_url: details.avatarUrl || null,
            updated_at: new Date().toISOString()
        };
        await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
    } catch (e) { console.error(e); }
  },

  handleSuccessfulSubscription: async (data: { tier: SubscriptionTier, reference: string, amount: number, billingCycle: BillingCycle }) => {
      if (_isMock) { MOCK_PROFILE.subscriptionTier = data.tier; return; }
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('subscription_transactions').insert({
              user_id: user.id,
              tier: data.tier,
              reference: data.reference,
              amount: data.amount,
              currency: 'NGN', 
              billing_cycle: data.billingCycle,
              status: 'success',
              created_at: new Date().toISOString()
          });
          const now = new Date();
          const endDate = new Date(now);
          if (data.billingCycle === 'monthly') endDate.setMonth(now.getMonth() + 1);
          else endDate.setFullYear(now.getFullYear() + 1);
          await supabase.from('profiles').update({
              subscription_tier: data.tier,
              subscription_status: 'active',
              subscription_end_date: endDate.toISOString(),
              billing_cycle: data.billingCycle
          }).eq('id', user.id);
      } catch (e) { console.error(e); }
  },

  cancelSubscription: async () => {
      if (_isMock) { MOCK_PROFILE.subscriptionTier = 'Free'; return; }
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('profiles').update({
              subscription_tier: 'Free',
              subscription_status: 'inactive',
              subscription_end_date: null,
              billing_cycle: null
          }).eq('id', user.id);
      } catch (e) { console.error(e); }
  },

  getSubscriptionHistory: async (userId: string): Promise<SubscriptionTransaction[]> => {
    if (_isMock) return [];
    try {
        const { data } = await supabase.from('subscription_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return (data || []).map((t: any) => ({
            id: t.id,
            userId: t.user_id,
            reference: t.reference,
            amount: t.amount,
            currency: t.currency,
            tier: t.tier,
            billingCycle: t.billing_cycle,
            status: t.status,
            createdAt: t.created_at
        }));
    } catch (e) { return []; }
  },

  deleteAccount: async (): Promise<boolean> => {
    if (_isMock) return true;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        const userId = user.id;
        const cleanupTasks = [
            supabase.from('community_posts').delete().or(`author_id.eq.${userId},user_id.eq.${userId},profile_id.eq.${userId}`),
            supabase.from('meetings').delete().eq('user_id', userId),
            supabase.from('swipes').delete().eq('user_id', userId),
            supabase.from('subscription_transactions').delete().eq('user_id', userId),
            supabase.from('startups').delete().eq('id', userId), 
            supabase.from('messages').delete().eq('sender_id', userId),
            supabase.from('chats').delete().or(`startup_id.eq.${userId},investor_id.eq.${userId}`)
        ];
        await Promise.allSettled(cleanupTasks);
        const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
        if (profileError) throw profileError;
        await supabase.auth.signOut();
        return true;
    } catch (e) {
        console.error("Delete Account Error:", e);
        await supabase.auth.signOut();
        return true;
    }
  },

  resetSwipes: async () => {
      if (_isMock) return;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              await supabase.from('swipes').delete().eq('user_id', user.id);
          }
      } catch (e) {
          console.error("Reset Swipes Error:", e);
      }
  },

  getStartups: async (): Promise<Startup[]> => {
      if (_isMock) {
          return [...MOCK_STARTUPS].sort((a: Startup, b: Startup) => {
              if (a.founder.subscriptionTier === 'Pro' && b.founder.subscriptionTier !== 'Pro') return 1;
              if (a.founder.subscriptionTier !== 'Pro' && b.founder.subscriptionTier === 'Pro') return -1;
              return 0;
          });
      }
      try {
          const { data: { user } } = await supabase.auth.getUser();
          let swipedIds: string[] = [];
          if (user) {
              const { data: swipes } = await supabase.from('swipes').select('startup_id').eq('user_id', user.id);
              if (swipes && swipes.length > 0) swipedIds = swipes.map((s: any) => s.startup_id);
          }
          let query = supabase.from('startups').select('*').order('created_at', { ascending: false }).limit(20);
          if (swipedIds.length > 0) query = query.not('id', 'in', `(${swipedIds.join(',')})`);
          const { data: startupData, error: startupError } = await query;
          if (startupError || !startupData) return [];
          const userIds = startupData.map((s: any) => s.id);
          if (userIds.length === 0) return [];
          const [profileResult, metricsResult] = await Promise.all([
             supabase.from('profiles').select('id, full_name, title, avatar_url, location, subscription_tier').in('id', userIds),
             supabase.from('startup_metrics').select('*').in('startup_id', userIds)
          ]);
          const profileMap = new Map((profileResult.data || []).map((p: any) => [p.id, p]));
          const metricsMap = new Map((metricsResult.data || []).map((m: any) => [m.startup_id, m]));
          const startups = startupData.map((s: any) => {
              const founder: any = profileMap.get(s.id) || {};
              const metrics: any = metricsMap.get(s.id) || {};
              let valCap = s.valuation_cap;
              if (!valCap && s.tags) {
                  const vcTag = s.tags.find((t: string) => t.startsWith('vc:'));
                  if (vcTag) valCap = parseInt(vcTag.split(':')[1]);
              }
              return {
                  id: s.id,
                  name: s.name,
                  oneLiner: s.one_liner || '',
                  description: s.description || '',
                  industry: s.industry || 'Tech',
                  fundingStage: s.funding_stage || 'Seed',
                  askAmount: s.ask_amount || 0,
                  valuationCap: valCap,
                  videoUrl: s.video_url,
                  tags: (s.tags || []).filter((t: string) => !t.startsWith('vc:')), 
                  founder: {
                      name: founder.full_name || 'Founder',
                      role: founder.title || 'CEO',
                      avatarUrl: founder.avatar_url || '',
                      location: founder.location,
                      subscriptionTier: founder.subscription_tier || 'Free'
                  },
                  metrics: { views: metrics.views || 0, likes: metrics.likes || 0 }
              } as Startup;
          });

          // Priority matching: Pro founders appear at the end of the array (shown first in the deck)
          return startups.sort((a: Startup, b: Startup) => {
              if (a.founder.subscriptionTier === 'Pro' && b.founder.subscriptionTier !== 'Pro') return 1;
              if (a.founder.subscriptionTier !== 'Pro' && b.founder.subscriptionTier === 'Pro') return -1;
              return 0;
          });
      } catch (e) { return []; }
  },

  getMyStartup: async (): Promise<Startup | null> => {
      if (_isMock) return null;
      try {
          let { data: { user } } = await supabase.auth.getUser();
          if (!user) return null;
          const { data, error } = await supabase.from('startups').select('*').eq('id', user.id).maybeSingle();
          if (error || !data) return null;
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          const profile = profileData as any;
          return {
              id: data.id,
              name: data.name,
              oneLiner: data.one_liner,
              description: data.description,
              industry: data.industry,
              fundingStage: data.funding_stage,
              askAmount: data.ask_amount,
              valuationCap: data.valuation_cap || 0,
              videoUrl: data.video_url,
              tags: (data.tags || []),
              founder: {
                  name: profile?.full_name || 'Founder',
                  role: profile?.title || 'Founder',
                  avatarUrl: profile?.avatar_url || '',
                  location: profile?.location,
                  subscriptionTier: profile?.subscription_tier
              },
              metrics: { views: 0, likes: 0 }
          } as Startup;
      } catch (e) { return null; }
  },

  saveStartup: async (startup: Startup) => {
      if (_isMock) return;
      try {
          let { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const payload = {
               id: user.id, 
               name: startup.name,
               one_liner: startup.oneLiner,
               description: startup.description,
               industry: startup.industry,
               funding_stage: startup.fundingStage,
               ask_amount: startup.askAmount,
               video_url: startup.videoUrl,
               tags: startup.tags, 
          };
          const { error } = await supabase.from('startups').upsert(payload);
          if (error) throw error;
      } catch (e) { 
          console.error('saveStartup error:', e); 
          throw e;
      }
  },

  processSwipe: async (startupId: string, direction: 'left' | 'right') => {
      if (_isMock) return;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('swipes').insert({
              user_id: user.id,
              startup_id: startupId,
              direction: direction,
              created_at: new Date().toISOString()
          });
      } catch (e) { console.error(e); }
  },

  getStartupByUserId: async (userId: string): Promise<Startup | null> => {
      if (_isMock) return MOCK_STARTUPS.find(s => s.id === userId) || null;
      try {
          const { data, error } = await supabase.from('startups').select('*').eq('id', userId).maybeSingle();
          if (error || !data) return null;
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
          const profile = profileData as any;
          return {
              id: data.id,
              name: data.name,
              oneLiner: data.one_liner,
              description: data.description,
              industry: data.industry,
              fundingStage: data.funding_stage,
              askAmount: data.ask_amount,
              valuationCap: data.valuation_cap || 0,
              videoUrl: data.video_url,
              tags: (data.tags || []),
              founder: {
                  name: profile?.full_name || 'Founder',
                  role: profile?.title || 'Founder',
                  avatarUrl: profile?.avatar_url || '',
                  location: profile?.location,
                  subscriptionTier: profile?.subscription_tier
              },
              metrics: { views: 0, likes: 0 }
          } as Startup;
      } catch (e) { return null; }
  },

  getPostsByUserId: async (userId: string): Promise<CommunityPost[]> => {
      if (_isMock) return MOCK_COMMUNITY_POSTS.filter(p => p.authorId === userId);
      try {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: posts, error } = await supabase
            .from('community_posts')
            .select('*')
            .eq('author_id', userId)
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          if (!posts || posts.length === 0) return [];
          
          const postIds = posts.map((p: any) => p.id);
          const { data: comments } = await supabase
            .from('community_comments')
            .select('id, post_id, user_id, content, created_at')
            .in('post_id', postIds);
            
          const commentAuthorIds = [...new Set(comments?.map((c: any) => c.user_id) || [])];
          const allProfileIds = [...new Set([userId, ...commentAuthorIds])];
          
          const { data: profiles } = await supabase.from('profiles').select('id, full_name, title, avatar_url').in('id', allProfileIds);
          const profileMap = new Map<string, any>(profiles?.map((p: any) => [p.id, p]) || []);
          
          let userLikes = new Set<string>();
          let userFollows = new Set<string>();
          if (user) {
              const [likesRes, followsRes] = await Promise.all([
                  supabase.from('community_likes').select('post_id').eq('user_id', user.id),
                  supabase.from('follows').select('following_id').eq('follower_id', user.id)
              ]);
              if (likesRes.data) userLikes = new Set(likesRes.data.map((l: any) => l.post_id));
              if (followsRes.data) userFollows = new Set(followsRes.data.map((f: any) => f.following_id));
          }
          
          return posts.map((p: any) => {
              const profile = profileMap.get(userId);
              const postComments = (comments || [])
                .filter((c: any) => c.post_id === p.id)
                .map((c: any) => {
                    const commentProfile = profileMap.get(c.user_id);
                    return {
                        id: c.id,
                        authorId: c.user_id,
                        author: commentProfile?.full_name || 'Anonymous',
                        avatar: commentProfile?.avatar_url || '',
                        content: c.content,
                        time: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recently'
                    };
                });

              return {
                  id: p.id,
                  authorId: userId,
                  author: profile?.full_name || 'Anonymous',
                  role: profile?.title || 'Member',
                  avatar: profile?.avatar_url || '',
                  authorVerified: false,
                  content: p.content,
                  imageUrl: p.image_url,
                  tags: p.tags || [],
                  likes: p.likes || 0,
                  comments: postComments.length,
                  time: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recently',
                  isLiked: userLikes.has(p.id),
                  isFollowingAuthor: userFollows.has(userId),
                  commentsList: postComments
              };
          });
      } catch (e) { return []; }
  },

  getCommunityPosts: async (page: number = 0, limit: number = 10): Promise<CommunityPost[]> => {
      if (_isMock) {
          const start = page * limit;
          return MOCK_COMMUNITY_POSTS.slice(start, start + limit);
      }
      try {
          const { data: { user } } = await supabase.auth.getUser();
          
          const start = page * limit;
          const end = start + limit - 1;

          const { data: posts, error } = await supabase
            .from('community_posts')
            .select('*')
            .order('created_at', { ascending: false })
            .range(start, end);
            
          if (error) throw error;
          if (!posts || posts.length === 0) return [];
          
          const postIds = posts.map((p: any) => p.id);
          const authorIds = [...new Set(posts.map((p: any) => p.author_id || p.user_id || p.profile_id))];
          
          // Fetch comments
          const { data: comments } = await supabase
            .from('community_comments')
            .select('id, post_id, author_id, content, created_at')
            .in('post_id', postIds);
            
          const commentAuthorIds = [...new Set(comments?.map((c: any) => c.author_id) || [])];
          const allProfileIds = [...new Set([...authorIds, ...commentAuthorIds])];
          
          const { data: profiles } = await supabase.from('profiles').select('id, full_name, title, avatar_url').in('id', allProfileIds);
          const profileMap = new Map<string, any>(profiles?.map((p: any) => [p.id, p]) || []);
          
          // Fetch current user's likes and follows if logged in
          let userLikes = new Set<string>();
          let userFollows = new Set<string>();
          
          if (user) {
              const [likesRes, followsRes] = await Promise.all([
                  supabase.from('community_likes').select('post_id').eq('user_id', user.id),
                  supabase.from('follows').select('following_id').eq('follower_id', user.id)
              ]);
              
              if (likesRes.data) userLikes = new Set(likesRes.data.map((l: any) => l.post_id));
              if (followsRes.data) userFollows = new Set(followsRes.data.map((f: any) => f.following_id));
          }
          
          return posts.map((p: any) => {
              const authorId = p.author_id || p.user_id || p.profile_id;
              const profile = profileMap.get(authorId);
              
              const postComments = (comments || [])
                .filter((c: any) => c.post_id === p.id)
                .map((c: any) => {
                    const commentProfile = profileMap.get(c.author_id);
                    return {
                        id: c.id,
                        authorId: c.author_id,
                        author: commentProfile?.full_name || 'Anonymous',
                        avatar: commentProfile?.avatar_url || '',
                        content: c.content,
                        time: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recently'
                    };
                });

              return {
                  id: p.id,
                  authorId: authorId,
                  author: profile?.full_name || 'Anonymous',
                  role: profile?.title || 'Member',
                  avatar: profile?.avatar_url || '',
                  authorVerified: false,
                  content: p.content,
                  imageUrl: p.image_url,
                  tags: p.tags || [],
                  likes: p.likes || 0,
                  comments: postComments.length,
                  time: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recently',
                  isLiked: userLikes.has(p.id),
                  isFollowingAuthor: userFollows.has(authorId),
                  commentsList: postComments
              };
          });
      } catch (e: any) { 
          return [];
      }
  },

  createCommunityPost: async (content: string, tags: string[], author: any, image?: File) => {
      if (_isMock) {
          const newPost = {
              id: `mock_post_${Date.now()}`,
              authorId: 'mock-user-123',
              author: author.name,
              role: author.title,
              avatar: author.avatarUrl,
              content,
              imageUrl: image ? URL.createObjectURL(image) : undefined,
              tags,
              likes: 0,
              comments: 0,
              time: 'Just now',
              isLiked: false,
              authorVerified: false,
              commentsList: []
          };
          MOCK_COMMUNITY_POSTS.unshift(newPost);
          return { success: true, post: newPost };
      }
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("User not authenticated");

          let imageUrl = null;
          if (image) {
              const fileExt = image.name.split('.').pop();
              const path = `posts/${user.id}-${Date.now()}.${fileExt}`;
              await supabase.storage.from('images').upload(path, image);
              const { data } = supabase.storage.from('images').getPublicUrl(path);
              imageUrl = data.publicUrl;
          }

          const payload = {
              author_id: user.id, 
              content,
              tags,
              image_url: imageUrl,
              created_at: new Date().toISOString()
          };
          
          const { data, error } = await supabase.from('community_posts').insert(payload).select().single();

          if (error) {
              throw error;
          }

          return { 
              success: true, 
              post: {
                  id: data.id,
                  authorId: user.id,
                  author: author.name,
                  role: author.title,
                  avatar: author.avatarUrl,
                  content: data.content,
                  imageUrl: data.image_url,
                  tags: data.tags,
                  likes: 0,
                  comments: 0,
                  time: 'Just now',
                  isLiked: false,
                  authorVerified: false,
                  commentsList: []
              } as CommunityPost 
          };
      } catch (e: any) { 
          return { success: false, error: e.message || e.toString() };
      }
  },

  deleteCommunityPost: async (postId: string): Promise<boolean> => {
      if (_isMock) {
          const idx = MOCK_COMMUNITY_POSTS.findIndex(p => p.id === postId);
          if (idx !== -1) MOCK_COMMUNITY_POSTS.splice(idx, 1);
          return true;
      }
      try { 
          const { error } = await supabase.from('community_posts').delete().eq('id', postId);
          if (error) {
              console.error('Error deleting community post:', error);
              throw error;
          }
          return true;
      } catch(e) { 
          console.error('Failed to delete post:', e);
          return false; 
      }
  },

  addCommentToPost: async (postId: string, content: string, author: any): Promise<{ success: boolean, comment?: CommunityComment, error?: string }> => {
      if (_isMock) {
          const newComment: CommunityComment = {
              id: `mock_comment_${Date.now()}`,
              authorId: 'mock-user-123',
              author: author?.name || 'Anonymous',
              avatar: author?.avatarUrl || '',
              content,
              time: 'Just now'
          };
          const post = MOCK_COMMUNITY_POSTS.find(p => p.id === postId);
          if (post) {
              post.commentsList = post.commentsList || [];
              post.commentsList.push(newComment);
              post.comments++;
          }
          return { success: true, comment: newComment };
      }
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("User not authenticated");
          
          console.log("Adding comment to DB:", postId, content, user.id);
          const { data, error } = await supabase.from('community_comments').insert({
              post_id: postId,
              author_id: user.id,
              content: content,
              created_at: new Date().toISOString()
          }).select().single();

          if (error) {
              console.error("Supabase error adding comment:", error);
              throw error;
          }

          console.log("Comment added successfully:", data);
          return {
              success: true,
              comment: {
                  id: data.id,
                  authorId: user.id,
                  author: author?.name || 'Anonymous',
                  avatar: author?.avatarUrl || '',
                  content: data.content,
                  time: 'Just now'
              }
          };
      } catch (e: any) {
          console.error("Error in addCommentToPost:", e);
          return { success: false, error: e.message || "Unknown error" };
      }
  },

  deleteComment: async (commentId: string): Promise<boolean> => {
      if (_isMock) {
          for (const post of MOCK_COMMUNITY_POSTS) {
              if (post.commentsList) {
                  const idx = post.commentsList.findIndex(c => c.id === commentId);
                  if (idx !== -1) {
                      post.commentsList.splice(idx, 1);
                      post.comments--;
                      return true;
                  }
              }
          }
          return false;
      }
      try {
          const { error } = await supabase.from('community_comments').delete().eq('id', commentId);
          if (error) throw error;
          return true;
      } catch (e) {
          console.error("Error in deleteComment:", e);
          return false;
      }
  },

  likePost: async (postId: string, isLiked: boolean): Promise<boolean> => {
      if (_isMock) {
          const post = MOCK_COMMUNITY_POSTS.find(p => p.id === postId);
          if (post) {
              post.isLiked = isLiked;
              post.likes += isLiked ? 1 : -1;
          }
          return true;
      }
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return false;

          if (isLiked) {
              await supabase.from('community_likes').insert({ post_id: postId, user_id: user.id });
              const { data: post } = await supabase.from('community_posts').select('likes').eq('id', postId).single();
              if (post) {
                  await supabase.from('community_posts').update({ likes: (post.likes || 0) + 1 }).eq('id', postId);
              }
          } else {
              await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', user.id);
              const { data: post } = await supabase.from('community_posts').select('likes').eq('id', postId).single();
              if (post) {
                  await supabase.from('community_posts').update({ likes: Math.max(0, (post.likes || 0) - 1) }).eq('id', postId);
              }
          }
          return true;
      } catch (e) {
          return false;
      }
  },

  getFollowers: async (userId: string): Promise<any[]> => {
      if (_isMock) return [];
      try {
          const { data: follows } = await supabase.from('follows').select('follower_id').eq('following_id', userId);
          if (!follows || follows.length === 0) return [];
          const followerIds = follows.map((f: any) => f.follower_id);
          const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', followerIds);
          return profiles || [];
      } catch (e) { return []; }
  },

  getFollowing: async (userId: string): Promise<any[]> => {
      if (_isMock) return [];
      try {
          const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
          if (!follows || follows.length === 0) return [];
          const followingIds = follows.map((f: any) => f.following_id);
          const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', followingIds);
          return profiles || [];
      } catch (e) { return []; }
  },

  followUser: async (userId: string): Promise<boolean> => {
      if (_isMock) return true;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return false;
          const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
          if (error && error.code !== '23505') throw error; // Ignore duplicate follow error
          return true;
      } catch (e) {
          return false;
      }
  },

  unfollowUser: async (userId: string): Promise<boolean> => {
      if (_isMock) return true;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return false;
          const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
          if (error) throw error;
          return true;
      } catch (e) {
          return false;
      }
  },

  checkIsFollowing: async (followingId: string): Promise<boolean> => {
      if (_isMock) return false;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return false;
          const { data, error } = await supabase
              .from('follows')
              .select('id')
              .eq('follower_id', user.id)
              .eq('following_id', followingId)
              .maybeSingle();
          return !!data;
      } catch (e) {
          return false;
      }
  },

  getMeetings: async (): Promise<Meeting[]> => {
      if (_isMock) return [];
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];
          const { data } = await supabase.from('meetings').select('*').eq('user_id', user.id);
          return (data || []).map((m: any) => ({
              id: m.id,
              title: m.title,
              guestName: m.guest_name,
              guestEmail: m.guest_email,
              guestAvatar: m.guest_avatar,
              date: m.start_time,
              duration: m.duration,
              type: m.type,
              status: m.status
          }));
      } catch (e) { return []; }
  },

  createMeeting: async (meeting: Partial<Meeting>) => {
      if (_isMock) return;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("User not authenticated");
          
          const startTime = new Date(meeting.date!);
          const endTime = new Date(startTime.getTime() + (meeting.duration || 30) * 60000);

          const { error } = await supabase.from('meetings').insert({
              user_id: user.id,
              title: meeting.title,
              guest_name: meeting.guestName,
              guest_email: meeting.guestEmail,
              guest_avatar: meeting.guestAvatar,
              start_time: meeting.date,
              end_time: endTime.toISOString(),
              duration: meeting.duration,
              type: meeting.type,
              status: meeting.status || 'confirmed'
          });
          if (error) throw error;
      } catch (e) { 
          throw e; 
      }
  },

  updateMeeting: async (id: string, meeting: Partial<Meeting>) => {
      if (_isMock) return;
      try {
          const startTime = new Date(meeting.date!);
          const endTime = new Date(startTime.getTime() + (meeting.duration || 30) * 60000);

          const { error } = await supabase.from('meetings').update({
              title: meeting.title,
              guest_name: meeting.guestName,
              guest_email: meeting.guestEmail,
              guest_avatar: meeting.guestAvatar,
              start_time: meeting.date,
              end_time: endTime.toISOString(),
              duration: meeting.duration,
              type: meeting.type
          }).eq('id', id);
          if (error) throw error;
      } catch (e) { throw e; }
  },

  deleteMeeting: async (id: string) => {
      if (_isMock) return;
      try { 
          const { error } = await supabase.from('meetings').delete().eq('id', id); 
          if (error) throw error;
      } catch(e) { throw e; }
  },

  ensureConnection: async (targetId: string): Promise<string | null> => {
      if (_isMock) return 'c1';
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return null;
          const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          let startupId = user.id, investorId = targetId;
          if (myProfile?.role === 'INVESTOR') { startupId = targetId; investorId = user.id; }
          const { data: existingChat } = await supabase.from('chats').select('id').eq('startup_id', startupId).eq('investor_id', investorId).maybeSingle();
          if (existingChat) return existingChat.id;
          const { data: newChat, error } = await supabase.from('chats').insert({ id: generateUUID(), startup_id: startupId, investor_id: investorId, updated_at: new Date().toISOString() }).select('id').single();
          if (error) return null;
          return newChat.id;
      } catch (e) { return null; }
  },

  getChats: async (): Promise<ChatSession[]> => {
      if (_isMock) return MOCK_CHATS;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];
          const { data: rawChats, error } = await supabase.from('chats').select('*').or(`startup_id.eq.${user.id},investor_id.eq.${user.id}`).order('updated_at', { ascending: false });
          if (error || !rawChats || rawChats.length === 0) return [];
          const investorIds = rawChats.map(c => c.investor_id);
          const startupIds = rawChats.map(c => c.startup_id);
          const allProfileIds = [...new Set([...investorIds, ...startupIds])];
          const chatIds = rawChats.map(c => c.id);
          const [profilesResult, startupsResult, lastMsgsResult, unreadResult] = await Promise.all([
             supabase.from('profiles').select('id, full_name, avatar_url, title, role').in('id', allProfileIds),
             supabase.from('startups').select('id, name, image_url').in('id', startupIds),
             supabase.from('messages').select('chat_id, content, type, created_at').in('chat_id', chatIds).order('created_at', { ascending: false }),
             supabase.from('messages').select('chat_id').in('chat_id', chatIds).neq('sender_id', user.id).neq('status', 'read')
          ]);
          const profileMap = new Map<string, any>((profilesResult.data || []).map((p: any) => [p.id, p]));
          const startupMap = new Map<string, any>((startupsResult.data || []).map((s: any) => [s.id, s]));
          const lastMsgMap = new Map();
          (lastMsgsResult.data || []).forEach((m: any) => { if (!lastMsgMap.has(m.chat_id)) lastMsgMap.set(m.chat_id, m.content || (m.type === 'image' ? 'Image' : 'Message')); });
          
          const unreadMap = new Map();
          (unreadResult.data || []).forEach((m: any) => {
              unreadMap.set(m.chat_id, (unreadMap.get(m.chat_id) || 0) + 1);
          });

          return rawChats.map((c: any) => {
              const isMeInvestor = c.investor_id === user.id;
              let partnerName = 'Unknown', partnerAvatar = '', partnerSubtitle = '';
              if (isMeInvestor) {
                  const founder = profileMap.get(c.startup_id);
                  const startup = startupMap.get(c.startup_id);
                  partnerName = founder?.full_name || startup?.name || 'Founder';
                  partnerAvatar = founder?.avatar_url || startup?.image_url;
                  partnerSubtitle = startup?.name || 'Startup';
              } else {
                  const investor = profileMap.get(c.investor_id);
                  partnerName = investor?.full_name || 'Investor';
                  partnerAvatar = investor?.avatar_url;
                  partnerSubtitle = investor?.title || 'Investor';
              }
              return { 
                  id: c.id, 
                  startupId: isMeInvestor ? c.startup_id : c.investor_id, 
                  startupName: partnerName, 
                  subtitle: partnerSubtitle, 
                  avatarUrl: partnerAvatar || '', 
                  lastMessage: lastMsgMap.get(c.id) || 'Matched! Say hello.', 
                  timestamp: c.updated_at, 
                  unread: unreadMap.get(c.id) || 0 
              };
          });
      } catch (e) { return []; }
  },

  getMessages: async (chatId: string): Promise<Message[]> => {
      if (_isMock) return MOCK_MESSAGES;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          const { data } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
          return (data || []).map((m: any) => ({ 
              id: m.id, 
              senderId: m.sender_id, 
              text: m.content, 
              type: m.type || 'text', 
              timestamp: m.created_at, 
              isMe: m.sender_id === user?.id, 
              reactions: m.reactions || [], 
              fileName: m.file_name, 
              fileSize: m.file_size, 
              duration: m.duration,
              status: m.status
          }));
      } catch (e) { return []; }
  },

  subscribeToMessages: (chatId: string, callback: (payload: any) => void) => {
      if (_isMock) return { unsubscribe: () => {} };
      return supabase.channel(`chat:${chatId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, (payload) => { if (payload.eventType === 'INSERT') callback({ type: 'INSERT', message: payload.new }); else if (payload.eventType === 'UPDATE') callback({ type: 'UPDATE', message: payload.new }); else if (payload.eventType === 'DELETE') callback({ type: 'DELETE', id: payload.old.id }); }).subscribe();
  },

  subscribeToGlobalMessages: (callback: (message: any) => void) => {
      if (_isMock) return { unsubscribe: () => {} };
      return supabase.channel('global-messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => { callback(payload.new); }).subscribe();
  },

  addMessage: async (message: Message, chatId: string): Promise<Message | null> => {
      if (_isMock) { const newMsg = { ...message, id: `mock_msg_${Date.now()}` }; MOCK_MESSAGES.push(newMsg); return newMsg; }
      try {
          const { data: { user } } = await supabase.auth.getUser();
          const userId = user?.id || 'anon';
          const { data, error } = await supabase.from('messages').insert({ 
              id: generateUUID(), 
              chat_id: chatId, 
              sender_id: userId, 
              content: message.text, 
              type: message.type, 
              file_name: message.fileName, 
              file_size: message.fileSize, 
              duration: message.duration,
              status: 'sent'
          }).select().single();
          if (error) throw error;
          await supabase.from('chats').update({ updated_at: data.created_at }).eq('id', chatId);
          return { 
              id: data.id, 
              senderId: data.sender_id, 
              text: data.content, 
              type: data.type, 
              timestamp: data.created_at, 
              isMe: true, 
              reactions: data.reactions || [], 
              fileName: data.file_name, 
              fileSize: data.file_size, 
              duration: data.duration,
              status: data.status
          };
      } catch (e) { return null; }
  },

  markMessageAsRead: async (messageId: string): Promise<boolean> => {
      if (_isMock) return true;
      try {
          const { error } = await supabase
              .from('messages')
              .update({ status: 'read' })
              .eq('id', messageId)
              .neq('status', 'read');
          return !error;
      } catch (e) { return false; }
  },

  markAllMessagesAsRead: async (chatId: string): Promise<boolean> => {
      if (_isMock) return true;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return false;
          const { error } = await supabase
              .from('messages')
              .update({ status: 'read' })
              .eq('chat_id', chatId)
              .neq('sender_id', user.id)
              .neq('status', 'read');
          return !error;
      } catch (e) { return false; }
  },

  sendTypingStatus: async (chatId: string, isTyping: boolean) => {
      if (_isMock) return;
      const channel = supabase.channel(`chat:${chatId}`);
      await channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { isTyping }
      });
  },

  subscribeToTypingStatus: (chatId: string, callback: (payload: any) => void) => {
      if (_isMock) return { unsubscribe: () => {} };
      const channel = supabase.channel(`chat:${chatId}`);
      return channel.on('broadcast', { event: 'typing' }, (payload) => {
          callback(payload.payload);
      }).subscribe();
  }
};