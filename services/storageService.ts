import { Startup, ChatSession, Message, UserRole, CommunityPost, CommunityComment, Reaction, Meeting } from '../types';
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

const handleSupabaseError = (e: any, methodName: string) => {
    const errorMsg = e?.message?.toLowerCase() || '';
    if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
        if (!_isMock) {
            console.warn(`Supabase network error in ${methodName}. Switching to Mock Mode.`);
            _isMock = true;
        }
        return true; // Handled
    }
    console.error(`Error in ${methodName}:`, e);
    return false;
};

export const normalizeVideoUrl = (url: string | null): string => {
    if (!url) return '';
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith('blob:')) return trimmedUrl;
    
    // Handle Supabase signed URLs
    if (trimmedUrl.includes('/object/sign/')) {
        return trimmedUrl.replace('/object/sign/', '/object/public/').split('?')[0];
    }

    // Handle Google Drive links
    if (trimmedUrl.includes('drive.google.com')) {
        const match = trimmedUrl.match(/\/d\/(.+?)\/(view|edit)?/);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
    }

    // Check if it's a common video platform link without protocol
    const videoPlatforms = ['youtube.com', 'youtu.be', 'vimeo.com', 'facebook.com', 'twitch.tv', 'streamable.com'];
    const isPlatform = videoPlatforms.some(p => trimmedUrl.toLowerCase().includes(p));

    if (!trimmedUrl.startsWith('http')) {
        if (isPlatform || trimmedUrl.includes('.') && !trimmedUrl.includes(' ')) {
            return `https://${trimmedUrl}`;
        }
        // If it doesn't look like a URL, assume it's a Supabase storage path
        try {
            return supabase.storage.from('videos').getPublicUrl(trimmedUrl).data.publicUrl;
        } catch (e) {
            return trimmedUrl;
        }
    }
    return trimmedUrl;
};

const MOCK_PROFILE = {
    name: 'Demo User',
    title: 'Angel Investor',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    location: 'San Francisco, CA',
    email: 'demo@connectup.com',
    role: UserRole.INVESTOR
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
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-solar-panels-on-a-sunny-day-4437-large.mp4',
        tags: ['AI', 'Energy', 'Sustainability'],
        founder: {
            name: 'Sarah Chen',
            role: 'Founder',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
            location: 'Austin, TX'
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
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-drone-flying-over-a-forest-1186-large.mp4',
        tags: ['Robotics', 'Healthcare', 'AI'],
        founder: {
            name: 'Alex Rivera',
            role: 'CEO',
            avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
            location: 'Boston, MA'
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
            // Test connection with a simple query
            const { error: profileError } = await supabase.from('profiles').select('id').limit(1);
            
            if (profileError) {
                const errorMsg = profileError.message?.toLowerCase() || '';
                if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
                     console.warn("Supabase unreachable (Network Error/Failed to fetch). Switching to Mock Mode.");
                     _isMock = true;
                     return { success: false, isMock: true };
                }
                
                // Handle Refresh Token error during initial check
                if (profileError.message?.includes('Refresh Token Not Found') || profileError.message?.includes('invalid_grant')) {
                    console.warn("Auth session corrupted during init. Clearing...");
                    await supabase.auth.signOut().catch(() => {});
                }

                if (profileError.code !== '42P01' && profileError.code !== 'PGRST116') {
                     console.warn(`Supabase Connection Warning:`, profileError.message);
                     if (!profileError.message?.includes('JWT')) {
                        _isMock = true;
                        return { success: false, isMock: true }; 
                     }
                }
            }

            const tablesToCheck = ['profiles', 'startups', 'meetings', 'community_posts', 'chats', 'messages', 'community_comments', 'community_likes', 'swipes', 'follows'];
            const missingTables: string[] = [];
            
            for (const table of tablesToCheck) {
                try {
                    const { error } = await supabase.from(table).select('id').limit(1);
                    if (error) {
                        if (error.code === '42P01') {
                            missingTables.push(table);
                        } else if (error.message && (error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network'))) {
                            console.warn(`Fetch error checking table ${table}. Switching to Mock Mode.`);
                            _isMock = true;
                            return { success: false, isMock: true };
                        }
                    }
                } catch (e) {
                    console.warn(`Exception checking table ${table}:`, e);
                    _isMock = true;
                    return { success: false, isMock: true };
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
      await StorageService.init();
      if (_isMock) return 'mock-user-123';
      try {
          const { data } = await supabase.auth.getUser();
          return data.user?.id || null;
      } catch {
          return null;
      }
  },

  checkUserRole: async (userId: string): Promise<UserRole | null> => {
    await StorageService.init();
    if (_isMock) return UserRole.INVESTOR;
    try {
        const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
        if (error) {
            handleSupabaseError(error, 'checkUserRole');
            return null;
        }
        const rawRole = data?.role as string;
        if (rawRole) return rawRole.toUpperCase() as UserRole;
        return null;
    } catch (e) { 
        handleSupabaseError(e, 'checkUserRole');
        return null; 
    }
  },

  getUserProfile: async (userId: string) => {
    await StorageService.init();
    if (_isMock) return MOCK_PROFILE;
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('full_name, title, avatar_url, location, email, role')
            .eq('id', userId)
            .maybeSingle();
        if (error) {
            handleSupabaseError(error, 'getUserProfile');
            return null;
        }
        if (!data) return null;
        return {
            name: data.full_name,
            title: data.title,
            avatarUrl: data.avatar_url,
            location: data.location,
            email: data.email,
            role: (data.role as string)?.toUpperCase() as UserRole
        };
    } catch (e) { 
        handleSupabaseError(e, 'getUserProfile');
        return null; 
    }
  },

  updateUserProfile: async (updates: Partial<{ name: string, title: string, location: string, avatarUrl: string, role: UserRole }>) => {
    await StorageService.init();
    if (_isMock) { Object.assign(MOCK_PROFILE, updates); return; }
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.full_name = updates.name;
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.location) dbUpdates.location = updates.location;
        if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
        if (updates.role) dbUpdates.role = updates.role;
        const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
        if (error) handleSupabaseError(error, 'updateUserProfile');
    } catch (e) { 
        handleSupabaseError(e, 'updateUserProfile'); 
    }
  },

  uploadVideo: async (file: File): Promise<string | null> => {
    await StorageService.init();
    if (file.size > 50 * 1024 * 1024) {
        alert("Video file is too large. Please upload a video smaller than 50MB.");
        return null;
    }
    if (_isMock) return URL.createObjectURL(file);
    try {
        const userRes = await supabase.auth.getUser();
        const uid = userRes.data.user?.id;
        if (!uid) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${uid}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('videos').upload(filePath, file, { 
            upsert: true,
            cacheControl: '3600' 
        });
        if (uploadError) {
            // If it's a network error, switch to mock mode for this session
            if (uploadError.message?.toLowerCase().includes('fetch')) {
                console.warn("Supabase upload unreachable (Failed to fetch). Switching to Mock Mode.");
                _isMock = true;
                return URL.createObjectURL(file);
            }

            console.error("Supabase upload error:", uploadError);

            // Fallback to images bucket if videos bucket doesn't exist
            const { error: fallbackError } = await supabase.storage.from('images').upload(filePath, file, { upsert: true });
            if (fallbackError) {
                if (fallbackError.message?.toLowerCase().includes('fetch')) {
                    console.warn("Fallback upload unreachable (Failed to fetch). Switching to Mock Mode.");
                    _isMock = true;
                    return URL.createObjectURL(file);
                }
                console.error("Fallback upload error:", fallbackError);
                return null;
            }
            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            return data.publicUrl;
        }
        const { data } = supabase.storage.from('videos').getPublicUrl(filePath);
        return data.publicUrl;
    } catch (e: any) { 
        console.error("Upload exception:", e);
        if (e.message?.toLowerCase().includes('fetch')) {
            _isMock = true;
            return URL.createObjectURL(file);
        }
        return null; 
    }
  },

  uploadProfilePicture: async (file: File, userId?: string): Promise<string | null> => {
    await StorageService.init();
    if (_isMock) return URL.createObjectURL(file);
    try {
        const uid = userId || (await supabase.auth.getUser()).data.user?.id;
        if (!uid) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${uid}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
        if (uploadError) {
            console.error("Avatar upload error:", uploadError);
            if (uploadError.message?.toLowerCase().includes('fetch')) {
                _isMock = true;
                return URL.createObjectURL(file);
            }
            return null;
        }
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    } catch (e: any) { 
        console.error("Avatar upload exception:", e);
        if (e.message?.toLowerCase().includes('fetch')) {
            _isMock = true;
            return URL.createObjectURL(file);
        }
        return null; 
    }
  },

  completeUserProfile: async (userId: string, email: string, role: UserRole, details: { name: string, title: string, location: string, avatarUrl?: string }) => {
    await StorageService.init();
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


  deleteAccount: async (): Promise<boolean> => {
    await StorageService.init();
    if (_isMock) return true;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        const userId = user.id;
        const cleanupTasks = [
            supabase.from('community_posts').delete().or(`author_id.eq.${userId},user_id.eq.${userId},profile_id.eq.${userId}`),
            supabase.from('meetings').delete().eq('user_id', userId),
            supabase.from('swipes').delete().eq('user_id', userId),
            supabase.from('startups').delete().eq('id', userId), 
            supabase.from('messages').delete().eq('sender_id', userId),
            supabase.from('chats').delete().or(`startup_id.eq.${userId},investor_id.eq.${userId}`)
        ];
        await Promise.allSettled(cleanupTasks);
        const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
        if (profileError) {
            handleSupabaseError(profileError, 'deleteAccount');
            throw profileError;
        }
        await supabase.auth.signOut();
        return true;
    } catch (e) {
        if (!handleSupabaseError(e, 'deleteAccount')) {
            console.error("Delete Account Error:", e);
        }
        await supabase.auth.signOut();
        return true;
    }
  },

  resetSwipes: async () => {
      await StorageService.init();
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
      await StorageService.init();
      if (_isMock) {
          return [...MOCK_STARTUPS];
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
             supabase.from('profiles').select('id, full_name, title, avatar_url, location').in('id', userIds),
             supabase.from('startup_metrics').select('*').in('startup_id', userIds)
          ]);
          const profileMap = new Map((profileResult.data || []).map((p: any) => [p.id, p]));
          const metricsMap = new Map((metricsResult.data || []).map((m: any) => [m.startup_id, m]));
          const startups = await Promise.all(startupData.map(async (s: any) => {
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
                  videoUrl: normalizeVideoUrl(s.video_url),
                  tags: (s.tags || []).filter((t: string) => !t.startsWith('vc:')), 
                  founder: {
                      name: founder.full_name || 'Founder',
                      role: founder.title || 'CEO',
                      avatarUrl: founder.avatar_url || '',
                      location: founder.location
                  },
                  metrics: { views: metrics.views || 0, likes: metrics.likes || 0 }
              } as Startup;
          }));

          return startups;
      } catch (e) { return []; }
  },

  getMyStartup: async (): Promise<Startup | null> => {
      await StorageService.init();
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
              videoUrl: normalizeVideoUrl(data.video_url),
              tags: (data.tags || []),
              founder: {
                  name: profile?.full_name || 'Founder',
                  role: profile?.title || 'Founder',
                  avatarUrl: profile?.avatar_url || '',
                  location: profile?.location
              },
              metrics: { views: 0, likes: 0 }
          } as Startup;
      } catch (e) { return null; }
  },

  saveStartup: async (startup: Startup) => {
      await StorageService.init();
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
          if (error) {
              handleSupabaseError(error, 'saveStartup');
              throw error;
          }
      } catch (e) { 
          if (!handleSupabaseError(e, 'saveStartup')) {
              throw e;
          }
      }
  },

  processSwipe: async (startupId: string, direction: 'left' | 'right') => {
      await StorageService.init();
      if (_isMock) return;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { error } = await supabase.from('swipes').insert({
              user_id: user.id,
              startup_id: startupId,
              direction: direction,
              created_at: new Date().toISOString()
          });
          if (error) handleSupabaseError(error, 'processSwipe');
      } catch (e) { 
          handleSupabaseError(e, 'processSwipe'); 
      }
  },

  getStartupByUserId: async (userId: string): Promise<Startup | null> => {
      await StorageService.init();
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
              videoUrl: normalizeVideoUrl(data.video_url),
              tags: (data.tags || []),
              founder: {
                  name: profile?.full_name || 'Founder',
                  role: profile?.title || 'Founder',
                  avatarUrl: profile?.avatar_url || '',
                  location: profile?.location
              },
              metrics: { views: 0, likes: 0 }
          } as Startup;
      } catch (e) { return null; }
  },

  getPostsByUserId: async (userId: string): Promise<CommunityPost[]> => {
      await StorageService.init();
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
      await StorageService.init();
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
            .select('id, post_id, user_id, content, created_at')
            .in('post_id', postIds);
            
          const commentAuthorIds = [...new Set(comments?.map((c: any) => c.user_id) || [])];
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
          if (e.message && (e.message.toLowerCase().includes('fetch') || e.message.toLowerCase().includes('network'))) {
              _isMock = true;
          }
          return [];
      }
  },

  createCommunityPost: async (content: string, tags: string[], author: any, image?: File) => {
      await StorageService.init();
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
              handleSupabaseError(error, 'createCommunityPost');
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
      await StorageService.init();
      if (_isMock) {
          const idx = MOCK_COMMUNITY_POSTS.findIndex(p => p.id === postId);
          if (idx !== -1) MOCK_COMMUNITY_POSTS.splice(idx, 1);
          return true;
      }
      try { 
          const { error } = await supabase.from('community_posts').delete().eq('id', postId);
          if (error) {
              handleSupabaseError(error, 'deleteCommunityPost');
              throw error;
          }
          return true;
      } catch(e) { 
          if (!handleSupabaseError(e, 'deleteCommunityPost')) {
              throw e;
          }
          return false; 
      }
  },

  addCommentToPost: async (postId: string, content: string, author: any): Promise<{ success: boolean, comment?: CommunityComment, error?: string }> => {
      await StorageService.init();
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
              user_id: user.id,
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
      await StorageService.init();
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
      await StorageService.init();
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
      await StorageService.init();
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
      await StorageService.init();
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
      await StorageService.init();
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
      await StorageService.init();
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
      await StorageService.init();
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
      await StorageService.init();
      if (_isMock) return [];
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];
          const { data } = await supabase.from('meetings').select('*').or(`investor_id.eq.${user.id},startup_id.eq.${user.id}`);
          return (data || []).map((m: any) => ({
              id: m.id,
              title: m.title,
              guestName: m.guest_name,
              guestEmail: m.guest_email,
              guestAvatar: m.guest_avatar,
              date: m.start_time,
              duration: m.duration,
              type: m.type,
              status: m.status,
              meetingLink: m.meeting_link
          }));
      } catch (e) { return []; }
  },

  createMeeting: async (meeting: Partial<Meeting>) => {
      await StorageService.init();
      if (_isMock) return;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("User not authenticated");
          
          const startTime = new Date(meeting.date!);
          const endTime = new Date(startTime.getTime() + (meeting.duration || 30) * 60000);

          const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          
          // Determine who is the investor and who is the startup
          // This assumes meeting.guestName/Email/Avatar refers to the OTHER party
          // We need a targetId for the other party. Let's assume it's passed in some way or we have to infer it.
          // For now, let's just use the user.id as one of them and a dummy for the other if not provided.
          // Actually, the Meeting interface doesn't have targetId. 
          // Let's assume the caller provides startup_id and investor_id in the meeting object if they want it to be precise.
          
          const payload: any = {
              title: meeting.title,
              guest_name: meeting.guestName,
              guest_email: meeting.guestEmail,
              guest_avatar: meeting.guestAvatar,
              start_time: meeting.date,
              end_time: endTime.toISOString(),
              duration: meeting.duration,
              type: meeting.type,
              status: meeting.status || 'confirmed',
              meeting_link: meeting.meetingLink
          };

          if (myProfile?.role === 'INVESTOR') {
              payload.investor_id = user.id;
              payload.startup_id = (meeting as any).targetId || user.id; // Fallback
          } else {
              payload.startup_id = user.id;
              payload.investor_id = (meeting as any).targetId || user.id; // Fallback
          }

          const { error } = await supabase.from('meetings').insert(payload);
          if (error) {
              handleSupabaseError(error, 'createMeeting');
              throw error;
          }
      } catch (e) { 
          if (!handleSupabaseError(e, 'createMeeting')) {
              throw e;
          }
      }
  },

  updateMeeting: async (id: string, meeting: Partial<Meeting>) => {
      await StorageService.init();
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
          if (error) {
              handleSupabaseError(error, 'updateMeeting');
              throw error;
          }
      } catch (e) { 
          if (!handleSupabaseError(e, 'updateMeeting')) {
              throw e;
          }
      }
  },

  deleteMeeting: async (id: string) => {
      await StorageService.init();
      if (_isMock) return;
      try { 
          const { error } = await supabase.from('meetings').delete().eq('id', id); 
          if (error) {
              handleSupabaseError(error, 'deleteMeeting');
              throw error;
          }
      } catch(e) { 
          if (!handleSupabaseError(e, 'deleteMeeting')) {
              throw e;
          }
      }
  },

  ensureConnection: async (targetId: string): Promise<string | null> => {
      await StorageService.init();
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
      await StorageService.init();
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
      await StorageService.init();
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

  subscribeToMessages: (chat_id: string, callback: (payload: any) => void) => {
      if (_isMock) return { unsubscribe: () => {} };
      // Use a unique channel name to avoid "already subscribed" errors when multiple components listen
      const channelId = `chat:${chat_id}:${generateUUID().substring(0, 8)}`;
      const channel = supabase.channel(channelId);
      
      channel.on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'messages', 
          filter: `chat_id=eq.${chat_id}` 
      }, (payload) => { 
          if (payload.eventType === 'INSERT') callback({ type: 'INSERT', message: payload.new }); 
          else if (payload.eventType === 'UPDATE') callback({ type: 'UPDATE', message: payload.new }); 
          else if (payload.eventType === 'DELETE') callback({ type: 'DELETE', id: payload.old.id }); 
      });

      channel.subscribe();
      
      return {
          unsubscribe: () => {
              supabase.removeChannel(channel);
          }
      };
  },

  subscribeToGlobalMessages: (callback: (message: any) => void) => {
      if (_isMock) return { unsubscribe: () => {} };
      const channelId = `global-messages:${generateUUID().substring(0, 8)}`;
      const channel = supabase.channel(channelId);
      
      channel.on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
      }, (payload) => { 
          callback(payload.new); 
      });

      channel.subscribe();

      return {
          unsubscribe: () => {
              supabase.removeChannel(channel);
          }
      };
  },

  addMessage: async (message: Message, chatId: string): Promise<Message | null> => {
      await StorageService.init();
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
      await StorageService.init();
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
      await StorageService.init();
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
      await StorageService.init();
      if (_isMock) return;
      // We use a temporary channel for the broadcast send
      const channel = supabase.channel(`typing-send:${chatId}`);
      await channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
              await channel.send({
                  type: 'broadcast',
                  event: 'typing',
                  payload: { isTyping }
              });
              supabase.removeChannel(channel);
          }
      });
  },

  subscribeToTypingStatus: (chat_id: string, callback: (payload: any) => void) => {
      if (_isMock) return { unsubscribe: () => {} };
      const channelId = `typing:${chat_id}:${generateUUID().substring(0, 8)}`;
      const channel = supabase.channel(channelId);
      
      channel.on('broadcast', { event: 'typing' }, (payload) => {
          callback(payload.payload);
      });
      
      channel.subscribe();

      return {
          unsubscribe: () => {
              supabase.removeChannel(channel);
          }
      };
  }
};