import { Startup, ChatSession, Message, UserRole, CommunityPost, CommunityComment, Reaction, Meeting } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { EncryptionService } from './encryptionService';

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
        console.warn(`Supabase connectivity issue in ${methodName}. Check your network.`);
        // We don't switch _isMock permanently here anymore to allow transient recoverability
        return true; 
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
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=60',
    location: 'San Francisco, CA',
    email: 'demo@connectup.com',
    role: UserRole.INVESTOR,
    plan: 'free'
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
        imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=60',
        videoUrl: 'https://v1.bg.pixabay.com/video/2022/10/05/133682-757421319_tiny.mp4',
        tags: ['AI', 'Energy', 'Sustainability'],
        founder: {
            name: 'Sarah Chen',
            role: 'Founder',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=60',
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
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=60',
        videoUrl: 'https://v1.bg.pixabay.com/video/2019/04/23/23011-332304856_tiny.mp4',
        tags: ['Robotics', 'Healthcare', 'AI'],
        founder: {
            name: 'Alex Rivera',
            role: 'CEO',
            avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=60',
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
        avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=60',
        lastMessage: 'Let’s schedule a demo call.',
        timestamp: new Date().toISOString(),
        unread: 1
    }
];

const MOCK_MESSAGES: any[] = [
    {
        id: 'm1',
        chatId: 'c1',
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
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=60',
        authorVerified: true,
        content: 'Just secured our lead investor for the Seed round! 🚀 #milestone',
        tags: ['Fundraising', 'Wins'],
        likes: 45,
        comments: 12,
        time: '2h ago',
        isLiked: false,
        isFollowingAuthor: true,
        commentsList: []
    },
    {
        id: 'p2',
        authorId: 's2',
        author: 'Sarah Chen',
        role: 'Founder @ EcoSync',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=60',
        authorVerified: true,
        content: 'Looking for a Lead Engineer with experience in smart grids. RT appreciated! ⚡️',
        tags: ['Hiring', 'CleanTech'],
        likes: 28,
        comments: 5,
        time: '5h ago',
        isLiked: false,
        isFollowingAuthor: true,
        commentsList: []
    },
    {
        id: 'p3',
        authorId: 'user_unknown',
        author: 'John Doe',
        role: 'Tech Enthusiast',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=60',
        authorVerified: false,
        content: 'Africa is the next frontier for AI. Change my mind. 🌍',
        tags: ['AI', 'AfricaTech'],
        likes: 156,
        comments: 42,
        time: '8h ago',
        isLiked: false,
        isFollowingAuthor: false,
        commentsList: []
    }
];

export const StorageService = {
  
  isMockMode: () => _isMock,

  sendEmail: async (toEmail: string, subject: string, text: string, html?: string) => {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        await fetch('/api/send-email', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ to: toEmail, subject, text, html }),
        });
    } catch (e) {
        console.error("Failed to send email to " + toEmail + ":", e);
    }
  },

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

            // Optimized table check: We only check 'profiles' to establish connectivity.
            // Full schema validation is redundant for end users on every load.
            const tablesToCheck = ['profiles'];
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

            // Still return success even if other tables might be missing (they will be caught on use)
            if (missingTables.length > 0) {
                console.warn("Database schema incomplete. Initial table missing:", missingTables);
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
            .select('*')
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
            role: (data.role as string)?.toUpperCase() as UserRole,
            plan: (data.plan === 'pro' || data.subscription_tier === 'pro' || data.subscription_tier === 'Pro') ? 'pro' : 'free', // Strict check for pro status
            billingCycle: data.billing_cycle,
            subscriptionEndDate: data.subscription_end_date
        };
    } catch (e) { 
        handleSupabaseError(e, 'getUserProfile');
        return null; 
    }
  },

  updateUserProfile: async (updates: Partial<{ 
    name: string, 
    title: string, 
    location: string, 
    avatarUrl: string, 
    email: string, 
    role: UserRole, 
    plan: string,
    billingCycle: string | null,
    subscriptionEndDate: string | null
  }>) => {
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
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.role) dbUpdates.role = updates.role;
        
        if (updates.billingCycle !== undefined) dbUpdates.billing_cycle = updates.billingCycle;
        if (updates.subscriptionEndDate !== undefined) dbUpdates.subscription_end_date = updates.subscriptionEndDate;
        
        if (updates.plan) {
            dbUpdates.plan = updates.plan;
            dbUpdates.subscription_tier = updates.plan === 'pro' ? 'pro' : 'free';
            dbUpdates.subscription_status = updates.plan === 'pro' ? 'active' : 'inactive';
        }
        
        const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
        if (error) handleSupabaseError(error, 'updateUserProfile');
    } catch (e) { 
        handleSupabaseError(e, 'updateUserProfile'); 
    }
  },

  getTransactions: async () => {
    await StorageService.init();
    if (_isMock) return [];
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const { data, error } = await supabase
            .from('subscription_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) {
            handleSupabaseError(error, 'getTransactions');
            return [];
        }
        return data || [];
    } catch (e) {
        handleSupabaseError(e, 'getTransactions');
        return [];
    }
  },

  recordTransaction: async (amount: number, planType: string, cycle: string) => {
    await StorageService.init();
    if (_isMock) return;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase.from('subscription_transactions').insert({
            user_id: user.id,
            amount: amount,
            currency: 'USD',
            status: 'completed',
            tier: planType,
            billing_cycle: cycle
        });
        if (error) handleSupabaseError(error, 'recordTransaction');
    } catch (e) {
        handleSupabaseError(e, 'recordTransaction');
    }
  },

  performDataCheck: async () => {
    await StorageService.init();
    if (_isMock) return;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: profile } = await supabase.from('profiles').select('plan, subscription_end_date').eq('id', user.id).maybeSingle();
        
        // If plan is null or invalid, set to 'free'
        if (!profile || !profile.plan || (profile.plan !== 'pro' && profile.plan !== 'free')) {
            await supabase.from('profiles').update({ 
                plan: 'free',
                subscription_tier: 'free',
                subscription_status: 'inactive'
            }).eq('id', user.id);
            return 'free';
        }

        // Check for subscription expiry
        if (profile.plan === 'pro' && profile.subscription_end_date) {
            const expiryDate = new Date(profile.subscription_end_date);
            if (expiryDate < new Date()) {
                // Subscription expired, demote to Free
                await supabase.from('profiles').update({ 
                    plan: 'free',
                    subscription_tier: 'free',
                    subscription_status: 'inactive',
                    billing_cycle: null
                }).eq('id', user.id);
                return 'free';
            }
        }

        // If plan is 'pro', check for at least one successful transaction
        if (profile.plan === 'pro') {
            const { data: txs } = await supabase
                .from('subscription_transactions')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .eq('tier', 'pro')
                .limit(1);
            
            if (!txs || txs.length === 0) {
                // No transaction found for Pro user, demote to Free
                await supabase.from('profiles').update({ 
                    plan: 'free',
                    subscription_tier: 'free',
                    subscription_status: 'inactive'
                }).eq('id', user.id);
                return 'free';
            }
        }
        return profile.plan;
    } catch (e) {
        console.error("Data check failed:", e);
        return 'free';
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
    return StorageService.uploadFile(file, 'avatars');
  },

  uploadFile: async (file: File, bucket: string = 'images'): Promise<string | null> => {
    await StorageService.init();
    if (_isMock) return URL.createObjectURL(file);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
        if (uploadError) {
            console.error(`Upload error in ${bucket}:`, uploadError);
            return null;
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    } catch (e) { 
        console.error("Upload exception:", e);
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

  updatePresence: async () => {
    await StorageService.init();
    if (_isMock) return;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        await supabase
            .from('profiles')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', user.id);
    } catch (e) {
        console.error("Presence update error:", e);
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
          if (swipedIds.length > 0) {
              query = query.not('id', 'in', swipedIds);
          }
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
          const [profileData, metricsData] = await Promise.all([
             supabase.from('profiles').select('*').eq('id', user.id).single(),
             supabase.from('startup_metrics').select('*').eq('startup_id', user.id).maybeSingle()
          ]);
          const profile = profileData.data as any;
          const metrics = metricsData.data as any;
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
              metrics: { views: metrics?.views || 0, likes: metrics?.likes || 0 }
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
      if (_isMock) {
          const startup = MOCK_STARTUPS.find(s => s.id === startupId);
          if (startup && direction === 'right') {
              if (!startup.metrics) startup.metrics = { views: 0, likes: 1 };
              else startup.metrics.likes = (startup.metrics.likes || 0) + 1;
          }
          return;
      }
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
          const [profileData, metricsData] = await Promise.all([
             supabase.from('profiles').select('*').eq('id', userId).single(),
             supabase.from('startup_metrics').select('*').eq('startup_id', userId).maybeSingle()
          ]);
          const profile = profileData.data as any;
          const metrics = metricsData.data as any;
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
              metrics: { views: metrics?.views || 0, likes: metrics?.likes || 0 }
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
          const quotedPostIds = posts.map((p: any) => p.quoted_post_id).filter(Boolean);
          const { data: comments } = await supabase
            .from('community_comments')
            .select('id, post_id, author_id, content, created_at')
            .in('post_id', postIds);
            
          const commentAuthorIds = [...new Set(comments?.map((c: any) => c.author_id) || [])];
          const allProfileIds = [...new Set([userId, ...commentAuthorIds])];
          
          const { data: profiles } = await supabase.from('profiles').select('*').in('id', allProfileIds);
          const profileMap = new Map<string, any>(profiles?.map((p: any) => [p.id, p]) || []);

          // Fetch quoted posts if any
          let quotedPostsMap = new Map<string, any>();
          if (quotedPostIds.length > 0) {
              const { data: qpData } = await supabase.from('community_posts').select('*').in('id', quotedPostIds);
              if (qpData) {
                  const qpAuthorIds = qpData.map((qp: any) => qp.author_id || qp.user_id || qp.profile_id);
                  const { data: qpProfiles } = await supabase.from('profiles').select('*').in('id', qpAuthorIds);
                  const qpProfileMap = new Map(qpProfiles?.map((p: any) => [p.id, p]) || []);
                  
                  qpData.forEach((qp: any) => {
                      const qpAuthorId = qp.author_id || qp.user_id || qp.profile_id;
                      const qpProfile = qpProfileMap.get(qpAuthorId);
                      quotedPostsMap.set(qp.id, {
                          id: qp.id,
                          authorId: qpAuthorId,
                          author: qpProfile?.full_name || 'User',
                          role: qpProfile?.title || 'Member',
                          avatar: qpProfile?.avatar_url || '',
                          authorVerified: !!qpProfile?.is_verified,
                          content: qp.content,
                          imageUrl: qp.image_url,
                          tags: qp.tags,
                          likes: qp.likes || 0,
                          time: new Date(qp.created_at).toLocaleDateString(),
                      });
                  });
              }
          }
          
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
                    const commentProfile = profileMap.get(c.author_id);
                    return {
                        id: c.id,
                        authorId: c.author_id,
                        author: commentProfile?.full_name || 'Member',
                        avatar: commentProfile?.avatar_url || '',
                        content: c.content,
                        time: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recently'
                    };
                });

              return {
                  id: p.id,
                  authorId: userId,
                  author: profile?.full_name || 'Member',
                  role: profile?.title,
                  avatar: profile?.avatar_url || '',
                  authorVerified: !!profile?.is_verified,
                  content: p.content,
                  imageUrl: p.image_url,
                  tags: p.tags || [],
                  likes: p.likes || 0,
                  reposts: p.reposts || 0,
                  comments: postComments.length,
                  time: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recently',
                  isLiked: userLikes.has(p.id),
                  isReposted: false,
                  isFollowingAuthor: userFollows.has(userId),
                  quotedPostId: p.quoted_post_id,
                  quotedPost: p.quoted_post_id ? quotedPostsMap.get(p.quoted_post_id) : undefined,
                  commentsList: postComments,
                  lastSeen: profile?.last_seen,
                  location: profile?.location
              };
          });
      } catch (e) { return []; }
  },

  getPostById: async (postId: string): Promise<CommunityPost | undefined> => {
      await StorageService.init();
      if (_isMock) {
          return MOCK_COMMUNITY_POSTS.find(p => p.id === postId);
      }
      try {
          const { data, error } = await supabase.from('community_posts').select('*').eq('id', postId).single();
          if (error || !data) return undefined;
          
          const profileId = data.author_id || data.user_id || data.profile_id;
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', profileId).single();
          
          return {
              id: data.id,
              authorId: profileId,
              author: profile?.full_name || 'Member',
              role: profile?.title,
              avatar: profile?.avatar_url || '',
              authorVerified: !!profile?.is_verified,
              content: data.content,
              imageUrl: data.image_url,
              tags: data.tags || [],
              likes: data.likes || 0,
              reposts: data.reposts || 0,
              time: data.created_at ? new Date(data.created_at).toLocaleDateString() : 'Recently',
              isLiked: false,
              isReposted: false,
              isFollowingAuthor: false,
          } as CommunityPost;
      } catch (e) {
          return undefined;
      }
  },

  getCommunityPosts: async (page: number = 0, limit: number = 10, sortBy: 'recent' | 'liked' = 'recent', tag?: string | null): Promise<CommunityPost[]> => {
      await StorageService.init();
      if (_isMock) {
          let list = [...MOCK_COMMUNITY_POSTS];
          
          if (tag) {
              list = list.filter(p => p.tags?.some(t => t.toLowerCase() === tag.toLowerCase()));
          }
          
          if (sortBy === 'liked') {
              list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          } else {
              // Mock order for 'recent' is just the array order as we prepend
          }
          
          const start = page * limit;
          return list.slice(start, start + limit);
      }
      try {
          const { data: { user } } = await supabase.auth.getUser();
          
          const start = page * limit;
          const end = start + limit - 1;

          let query = supabase
            .from('community_posts')
            .select('*');
            
          if (tag) {
              query = query.contains('tags', [tag]);
          }
          
          if (sortBy === 'liked') {
              query = query.order('likes', { ascending: false });
          } else {
              query = query.order('created_at', { ascending: false });
          }
          
          const { data: posts, error } = await query.range(start, end);
            
          if (error) throw error;
          if (!posts || posts.length === 0) return [];
          
          const postIds = posts.map((p: any) => p.id);
          const quotedPostIds = posts.map((p: any) => p.quoted_post_id).filter(Boolean);
          const authorIds = [...new Set(posts.map((p: any) => p.author_id || p.user_id || p.profile_id))];
          
          // Fetch quoted posts if any
          let quotedPostsMap = new Map<string, any>();
          if (quotedPostIds.length > 0) {
              const { data: qpData } = await supabase.from('community_posts').select('*').in('id', quotedPostIds);
              if (qpData) {
                  // We also need authors for these quoted posts
                  const qpAuthorIds = qpData.map((qp: any) => qp.author_id || qp.user_id || qp.profile_id);
                  const { data: qpProfiles } = await supabase.from('profiles').select('*').in('id', qpAuthorIds);
                  const qpProfileMap = new Map(qpProfiles?.map((p: any) => [p.id, p]) || []);
                  
                  qpData.forEach((qp: any) => {
                      const qpAuthorId = qp.author_id || qp.user_id || qp.profile_id;
                      const qpProfile = qpProfileMap.get(qpAuthorId);
                      quotedPostsMap.set(qp.id, {
                          id: qp.id,
                          authorId: qpAuthorId,
                          author: qpProfile?.full_name || 'User',
                          role: qpProfile?.title || 'Member',
                          avatar: qpProfile?.avatar_url || '',
                          authorVerified: !!qpProfile?.is_verified,
                          content: qp.content,
                          imageUrl: qp.image_url,
                          tags: qp.tags,
                          likes: qp.likes || 0,
                          time: new Date(qp.created_at).toLocaleDateString(),
                      });
                  });
              }
          }

          // Fetch comments
          const { data: comments } = await supabase
            .from('community_comments')
            .select('id, post_id, author_id, content, created_at')
            .in('post_id', postIds);
            
          const commentAuthorIds = [...new Set(comments?.map((c: any) => c.author_id) || [])];
          const allProfileIds = [...new Set([...authorIds, ...commentAuthorIds])];
          
          const { data: profiles } = await supabase.from('profiles').select('*').in('id', allProfileIds);
          console.log('Profiles fetched:', profiles);
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
                        author: commentProfile?.full_name || 'Member',
                        avatar: commentProfile?.avatar_url || '',
                        content: c.content,
                        time: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recently'
                    };
                });

              return {
                  id: p.id,
                  authorId: authorId,
                  author: profile?.full_name || 'Member',
                  role: profile?.title,
                  avatar: profile?.avatar_url || '',
                  authorVerified: !!profile?.is_verified,
                  content: p.content,
                  imageUrl: p.image_url,
                  tags: p.tags || [],
                  likes: p.likes || 0,
                  comments: postComments.length,
                  time: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recently',
                  isLiked: userLikes.has(p.id),
                  isFollowingAuthor: userFollows.has(authorId),
                  quotedPostId: p.quoted_post_id,
                  quotedPost: p.quoted_post_id ? quotedPostsMap.get(p.quoted_post_id) : undefined,
                  reposts: p.reposts || 0,
                  commentsList: postComments,
                  lastSeen: profile?.last_seen,
                  location: profile?.location
              };
          });
      } catch (e: any) { 
          if (e.message && (e.message.toLowerCase().includes('fetch') || e.message.toLowerCase().includes('network'))) {
              _isMock = true;
          }
          return [];
      }
  },

  getCommunityPulseTags: async (): Promise<string[]> => {
      await StorageService.init();
      if (_isMock) {
          const tags = new Set<string>();
          MOCK_COMMUNITY_POSTS.forEach(p => p.tags?.forEach(t => tags.add(t)));
          return Array.from(tags).slice(0, 10);
      }
      try {
          const { data, error } = await supabase
            .from('community_posts')
            .select('tags')
            .not('tags', 'is', null);
            
          if (error) throw error;
          if (!data) return [];
          
          const tagSet = new Set<string>();
          data.forEach((row: any) => {
              if (row.tags && Array.isArray(row.tags)) {
                  row.tags.forEach((tag: string) => {
                      if (tag && tag.trim()) {
                          tagSet.add(tag);
                      }
                  });
              }
          });
          
          const sortedTags = Array.from(tagSet).sort();
          return sortedTags.length > 0 ? sortedTags.slice(0, 20) : ['Funding', 'AI', 'Growth', 'Hiring', 'Pitch', 'MVP', 'Web3', 'SaaS'];
      } catch (e) {
          console.error("Error fetching tags:", e);
          return ['Funding', 'AI', 'Growth', 'Hiring', 'Pitch', 'MVP', 'Web3', 'SaaS'];
      }
  },

  createCommunityPost: async (content: string, tags: string[], author: any, image?: File, quotedPostId?: string) => {
      await StorageService.init();
      if (_isMock) {
          const quotedPost = quotedPostId ? MOCK_COMMUNITY_POSTS.find(p => p.id === quotedPostId) : undefined;
          const newPost: CommunityPost = {
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
              reposts: 0,
              time: 'Just now',
              isLiked: false,
              authorVerified: false,
              quotedPostId,
              quotedPost,
              commentsList: []
          };
          MOCK_COMMUNITY_POSTS.unshift(newPost);
          if (quotedPostId) {
             const idx = MOCK_COMMUNITY_POSTS.findIndex(p => p.id === quotedPostId);
             if (idx !== -1) {
                 MOCK_COMMUNITY_POSTS[idx].reposts = (MOCK_COMMUNITY_POSTS[idx].reposts || 0) + 1;
             }
          }
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

          const payload: any = {
              author_id: user.id, 
              content,
              tags,
              image_url: imageUrl,
              likes: 0,
              created_at: new Date().toISOString()
          };

          if (quotedPostId) {
              payload.quoted_post_id = quotedPostId;
              
              // Increment repost count on the original post
              const { data: originalPost } = await supabase
                  .from('community_posts')
                  .select('reposts')
                  .eq('id', quotedPostId)
                  .single();
                  
              if (originalPost) {
                  await supabase
                      .from('community_posts')
                      .update({ reposts: (originalPost.reposts || 0) + 1 })
                      .eq('id', quotedPostId);
              }
          }
          
          const { data, error } = await supabase.from('community_posts').insert(payload).select().single();

          if (error) {
              handleSupabaseError(error, 'createCommunityPost');
              throw error;
          }

          let quotedPost = undefined;
          if (quotedPostId) {
             const res = await StorageService.getPostById(quotedPostId);
             quotedPost = res;
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
                  likes: data.likes || 0,
                  comments: 0,
                  reposts: data.reposts || 0,
                  time: 'Just now',
                  isLiked: false,
                  authorVerified: false,
                  quotedPostId: data.quoted_post_id,
                  quotedPost: quotedPost,
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

  deleteCommunityComment: async (commentId: string): Promise<boolean> => {
      await StorageService.init();
      if (_isMock) {
          MOCK_COMMUNITY_POSTS.forEach(post => {
              if (post.commentsList) {
                  const idx = post.commentsList.findIndex(c => c.id === commentId);
                  if (idx !== -1) {
                      post.commentsList.splice(idx, 1);
                      post.comments = Math.max(0, post.comments - 1);
                  }
              }
          });
          return true;
      }
      try {
          const { error } = await supabase.from('community_comments').delete().eq('id', commentId);
          if (error) {
              handleSupabaseError(error, 'deleteCommunityComment');
              return false;
          }
          return true;
      } catch (e: any) {
          handleSupabaseError(e, 'deleteCommunityComment');
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
              author_id: user.id,
              content: content,
              created_at: new Date().toISOString()
          }).select().single();

          if (error) {
              console.error("Supabase error adding comment:", error);
              throw error;
          }

          console.log("Comment added successfully:", data);

          // Send email to post author
          (async () => {
            const { data: post } = await supabase.from('community_posts').select('author_id, user_id, profile_id').eq('id', postId).single();
            const authorId = post?.author_id || post?.user_id || post?.profile_id;
            if (authorId) {
                const { data: profile } = await supabase.from('profiles').select('email').eq('id', authorId).single();
                if (profile?.email) {
                    await StorageService.sendEmail(profile.email, "New Comment!", `You have a new comment on your post: "${content}"`);
                }
            }
          })();
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
              post.likes = Math.max(0, post.likes + (isLiked ? 1 : -1));
          }
          return true;
      }
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return false;

          if (isLiked) {
              const { error } = await supabase.from('community_likes').insert({ post_id: postId, user_id: user.id });
              if (error && error.code !== '23505') throw error;
              
              if (!error || error.code === '23505') {
                  const { data: postData } = await supabase.from('community_posts').select('likes').eq('id', postId).single();
                  const currentLikes = postData?.likes || 0;
                  await supabase.from('community_posts').update({ likes: currentLikes + 1 }).eq('id', postId);
              }
          } else {
              const { error } = await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', user.id);
              if (error) throw error;
              
              const { data: postData } = await supabase.from('community_posts').select('likes').eq('id', postId).single();
              const currentLikes = postData?.likes || 0;
              await supabase.from('community_posts').update({ likes: Math.max(0, currentLikes - 1) }).eq('id', postId);
          }
          return true;
      } catch (e) {
          console.error("Error in likePost:", e);
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
          
          // Try more complex query first
          let { data, error } = await supabase.from('meetings').select('*').or(`investor_id.eq.${user.id},startup_id.eq.${user.id},user_id.eq.${user.id}`);
          
          if (error) {
              console.warn("Meeting query failed, falling back to basic user_id query:", error.message);
              // Fallback to basic query if columns are missing
              const fallback = await supabase.from('meetings').select('*').eq('user_id', user.id);
              data = fallback.data;
          }

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
              user_id: user.id,
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
              payload.startup_id = (meeting as any).targetId || user.id;
          } else {
              payload.startup_id = user.id;
              payload.investor_id = (meeting as any).targetId || user.id;
          }

          let { error } = await supabase.from('meetings').insert(payload);
          
          if (error && error.message.includes('column') && (error.message.includes('investor_id') || error.message.includes('startup_id'))) {
              console.warn("Retrying meeting insert without investor_id/startup_id columns");
              const safePayload = { ...payload };
              delete safePayload.investor_id;
              delete safePayload.startup_id;
              const retry = await supabase.from('meetings').insert(safePayload);
              error = retry.error;
          }

          if (error) {
              handleSupabaseError(error, 'createMeeting');
              throw error;
          }

          // Send Email Notification if requested (implied by guestEmail presence)
          if (meeting.guestEmail) {
              const profile = await StorageService.getUserProfile(user.id);
              const userName = profile?.name || "User";
              const formattedDate = new Date(meeting.date!).toLocaleString();
              
              StorageService.sendEmail(
                  meeting.guestEmail,
                  `Meeting Scheduled: ${meeting.title}`,
                  `Hi ${meeting.guestName},\n\n${userName} has scheduled a meeting with you.\n\nTitle: ${meeting.title}\nDate: ${formattedDate}\nType: ${meeting.type}\n\nSee you there!`,
                  `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
                    <h2 style="color: #000; font-size: 24px; font-weight: 800; tracking-tight: -0.05em;">Meeting Scheduled</h2>
                    <p>Hi <strong>${meeting.guestName}</strong>,</p>
                    <p><strong>${userName}</strong> has scheduled a meeting with you on <strong>ConnectUp</strong>.</p>
                    <div style="background-color: #FFFCF0; padding: 24px; border-radius: 24px; border: 1px solid #FFF2C2; margin: 24px 0;">
                      <p style="margin: 0 0 10px 0;"><strong>Title:</strong> ${meeting.title}</p>
                      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
                      <p style="margin: 0;"><strong>Type:</strong> ${meeting.type}</p>
                      ${meeting.meetingLink ? `<p style="margin: 10px 0 0 0;"><strong>Link:</strong> <a href="${meeting.meetingLink}" style="color: #000; font-weight: bold;">Join Meeting</a></p>` : ''}
                    </div>
                    <p style="color: #71717a; font-size: 13px;">Don't forget to add this to your calendar.</p>
                    <hr style="border: none; border-top: 1px solid #f4f4f4; margin: 24px 0;" />
                    <p style="font-size: 12px; color: #a1a1aa;">Sent via ConnectUp - The Founder-Investor Network</p>
                  </div>`
              ).catch(e => console.error("Email send background failed:", e));
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

          // Send Email Update if guestEmail is present
          if (meeting.guestEmail) {
             const userRes = await supabase.auth.getUser();
             const uid = userRes.data.user?.id;
             if (uid) {
                const profile = await StorageService.getUserProfile(uid);
                const userName = profile?.name || "User";
                const formattedDate = new Date(meeting.date!).toLocaleString();
                
                StorageService.sendEmail(
                    meeting.guestEmail,
                    `Meeting Updated: ${meeting.title}`,
                    `Hi ${meeting.guestName},\n\nThe meeting "${meeting.title}" has been updated.\n\nNew Date: ${formattedDate}\nType: ${meeting.type}`,
                    `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
                        <h2 style="color: #000; font-size: 24px; font-weight: 800; tracking-tight: -0.05em;">Meeting Updated</h2>
                        <p>Hi <strong>${meeting.guestName}</strong>,</p>
                        <p>The meeting with <strong>${userName}</strong> has been updated on <strong>ConnectUp</strong>.</p>
                        <div style="background-color: #f7fee7; padding: 24px; border-radius: 24px; border: 1px solid #d9f99d; margin: 24px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Title:</strong> ${meeting.title}</p>
                        <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
                        <p style="margin: 0;"><strong>Type:</strong> ${meeting.type}</p>
                        </div>
                        <p style="color: #71717a; font-size: 13px;">Please check your schedule for any conflicts.</p>
                        <hr style="border: none; border-top: 1px solid #f4f4f4; margin: 24px 0;" />
                        <p style="font-size: 12px; color: #a1a1aa;">Sent via ConnectUp - The Founder-Investor Network</p>
                    </div>`
                ).catch(e => console.error("Email update send background failed:", e));
             }
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
      if (_isMock) {
          const startup = MOCK_STARTUPS.find(s => s.id === targetId);
          const newChatId = `c_${targetId}`;
          const existing = MOCK_CHATS.find(c => c.startupId === targetId);
          if (existing) return existing.id;

          if (startup) {
              MOCK_CHATS.push({
                  id: newChatId,
                  startupId: targetId,
                  startupName: startup.name,
                  subtitle: startup.founder?.name || 'Founder',
                  avatarUrl: startup.founder?.avatarUrl || '',
                  lastMessage: 'You are now connected!',
                  timestamp: new Date().toISOString(),
                  unread: 0
              });
              MOCK_MESSAGES.push({
                  id: `mock_msg_${Date.now()}`,
                  chatId: newChatId,
                  senderId: targetId,
                  text: `Hi! We paired up on ConnectUp. I would love to tell you more about ${startup.name} and share our deck!`,
                  type: 'text',
                  timestamp: new Date().toISOString(),
                  isMe: false
              });
              return newChatId;
          }
          return 'c1';
      }
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || user.id === targetId) return null;
          const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          let startupId = user.id, investorId = targetId;
          if (myProfile?.role === 'INVESTOR') { startupId = targetId; investorId = user.id; }
          const { data: existingChat } = await supabase.from('chats').select('id').eq('startup_id', startupId).eq('investor_id', investorId).maybeSingle();
          if (existingChat) return existingChat.id;
          
          const chatId = generateUUID();
          const { data: newChat, error } = await supabase.from('chats').insert({ id: chatId, startup_id: startupId, investor_id: investorId, updated_at: new Date().toISOString() }).select('id');
          if (error) return null;
          
          // Let's add an automatic connection message so it immediately shows up in chats list
          try {
              const senderId = targetId; // the person being connected with (usually the startup founder if investor swiped right)
              const welcomePayload = {
                  id: generateUUID(),
                  chat_id: chatId,
                  sender_id: senderId,
                  content: `Connected! Let's schedule a time to discuss.`,
                  type: 'text',
                  status: 'sent',
                  created_at: new Date().toISOString()
              };
              await supabase.from('messages').insert(welcomePayload);
          } catch (msgErr) {
              console.warn("Could not insert automatic welcome message:", msgErr);
          }
          
          return chatId;
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
             supabase.from('profiles').select('id, full_name, avatar_url, title, role, email').in('id', allProfileIds),
             supabase.from('startups').select('id, name').in('id', startupIds),
             supabase.from('messages').select('chat_id, content, type, created_at').in('chat_id', chatIds).order('created_at', { ascending: false }),
             supabase.from('messages').select('chat_id').in('chat_id', chatIds).neq('sender_id', user.id).neq('status', 'read')
          ]);
          
          if (profilesResult.error) handleSupabaseError(profilesResult.error, 'getChats-profiles');
          if (startupsResult.error) handleSupabaseError(startupsResult.error, 'getChats-startups');

          const profileMap = new Map<string, any>((profilesResult.data || []).map((p: any) => [p.id, p]));
          const startupMap = new Map<string, any>((startupsResult.data || []).map((s: any) => [s.id, s]));
          const lastMsgMap = new Map();
          (lastMsgsResult.data || []).forEach((m: any) => { if (!lastMsgMap.has(m.chat_id)) lastMsgMap.set(m.chat_id, m.content || (m.type === 'image' ? 'Image' : 'Message')); });
          
          const unreadMap = new Map();
          (unreadResult.data || []).forEach((m: any) => {
              unreadMap.set(m.chat_id, (unreadMap.get(m.chat_id) || 0) + 1);
          });

          const getAvatarUrl = (path: string | null) => {
            if (!path) return '';
            if (path.startsWith('http')) return path;
            if (path.startsWith('blob:')) return path;
            try {
              return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
            } catch (e) {
              return path;
            }
          };

          const getStartupImageUrl = (path: string | null) => {
            if (!path) return '';
            if (path.startsWith('http')) return path;
            try {
              return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
            } catch (e) {
              return path;
            }
          };

          return await Promise.all(rawChats.map(async (c: any) => {
              const partnerId = c.investor_id === user.id ? c.startup_id : c.investor_id;
              const partnerProfile = profileMap.get(partnerId);
              const partnerStartup = startupMap.get(partnerId);

              // Prioritize Profile info for "Real Details" (Person's name and image)
              const realName = partnerProfile?.full_name || partnerStartup?.name || partnerProfile?.email?.split('@')[0] || 'User';
              const realAvatar = getAvatarUrl(partnerProfile?.avatar_url) || getStartupImageUrl(partnerStartup?.image_url) || '';
              
              // Use realName (full_name) as the primary display name, regardless of entrepreneur status
              let displayName = realName;
              let displaySubtitle = '';

              if (partnerProfile) {
                  if (partnerStartup) {
                      // Partner is a founder
                      displaySubtitle = partnerStartup.name || 'Startup Founder';
                      if (realName === partnerStartup.name) {
                          displaySubtitle = 'Founder';
                      }
                  } else {
                      // Partner is an investor
                      displaySubtitle = partnerProfile.title || (partnerProfile.role === 'INVESTOR' ? 'Investor' : 'Member');
                  }
              } else if (partnerStartup) {
                  // Only have startup info
                  displaySubtitle = 'Startup';
              }
              
              const peerKey = null;
              let plainLastMsg = lastMsgMap.get(c.id) || 'Matched! Say hello.';
              if (plainLastMsg.startsWith('E2EE::')) {
                  plainLastMsg = await EncryptionService.decryptMessage(plainLastMsg, peerKey);
              }

              return { 
                  id: c.id, 
                  startupId: partnerId, 
                  startupName: displayName, 
                  investorName: realName,
                  subtitle: displaySubtitle || 'Active now', 
                  avatarUrl: realAvatar, 
                  founderAvatarUrl: getAvatarUrl(partnerProfile?.avatar_url) || realAvatar,
                  lastMessage: plainLastMsg, 
                  peerPublicKey: null,
                  timestamp: c.updated_at, 
                  unread: unreadMap.get(c.id) || 0,
                  lastSeen: partnerProfile?.last_seen
              };
          }));
      } catch (e) { return []; }
  },

  getMessages: async (chatId: string, peerPublicKey?: string): Promise<Message[]> => {
      await StorageService.init();
      if (_isMock) {
          // Filter mock messages by chatId
          return MOCK_MESSAGES.filter((m: any) => m.chatId === chatId);
      }
      try {
          const { data: { user } } = await supabase.auth.getUser();
          
          let peerKey = null;

          const { data, error } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
          
          if (error) {
              handleSupabaseError(error, 'getMessages');
              return [];
          }

          return await Promise.all((data || []).map(async (m: any) => {
              let plainText = m.content;
              if (m.type === 'text' && plainText && plainText.startsWith('E2EE::')) {
                  plainText = await EncryptionService.decryptMessage(plainText, peerKey || null);
              }

              return { 
                  id: m.id, 
                  senderId: m.sender_id, 
                  text: plainText, 
                  type: m.type || 'text', 
                  timestamp: m.created_at, 
                  isMe: m.sender_id === user?.id, 
                  reactions: m.reactions || [], 
                  fileName: m.file_name, 
                  fileSize: m.file_size, 
                  duration: m.duration,
                  status: m.status
              };
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

  addMessage: async (message: Message, chatId: string, peerPublicKey?: string): Promise<Message | null> => {
      await StorageService.init();
      if (_isMock) { 
          const newMsg = { ...message, id: `mock_msg_${Date.now()}`, chatId }; 
          MOCK_MESSAGES.push(newMsg); 
          return newMsg; 
      }
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
              console.error("User not authenticated in addMessage");
              return null;
          }
          const userId = user.id;
          
          let peerKey = null;
          
          let encryptedContent = message.text;
          if (message.type === 'text' && message.text) {
              encryptedContent = await EncryptionService.encryptMessage(message.text, peerKey);
          }

          const messageId = generateUUID();
          const payload: any = { 
              id: messageId, 
              chat_id: chatId, 
              sender_id: userId, 
              content: encryptedContent, 
              type: message.type || 'text', 
              file_name: message.fileName || null, 
              file_size: message.fileSize || null, 
              duration: message.duration || null,
              status: 'sent'
          };
          
          let { data, error } = await supabase.from('messages').insert(payload).select();
          
          // Dynamic retry loop if columns are missing from the schema cache (PGRST204)
          let safePayload = { ...payload };
          let retryCount = 0;
          while (error && (error.code === 'PGRST204' || (error.message && error.message.includes('Could not find') && error.message.includes('column')))) {
              const match = error.message.match(/Could not find the '([^']+)' column/);
              if (match && match[1] && safePayload[match[1]] !== undefined && retryCount < 5) {
                  const columnToRemove = match[1];
                  console.warn(`Dynamic retry: Removing missing column [${columnToRemove}] from payload.`);
                  delete safePayload[columnToRemove];
                  retryCount++;
                  const retry = await supabase.from('messages').insert(safePayload).select();
                  data = retry.data;
                  error = retry.error;
              } else {
                  break;
              }
          }

          if (error) {
              console.error("Supabase error in addMessage (insert):", error);
              throw error;
          }
          
          const insertedRow = (data && data.length > 0) ? data[0] : {
              ...payload,
              created_at: new Date().toISOString()
          };
          
          try {
              await supabase.from('chats').update({ updated_at: insertedRow.created_at || new Date().toISOString() }).eq('id', chatId);
          } catch (chatUpdateError) {
              console.warn("Could not update chat timestamp (not critical):", chatUpdateError);
          }

          // Send email Notification
          (async () => {
              try {
                  const { data: chat } = await supabase.from('chats').select('startup_id, investor_id').eq('id', chatId).maybeSingle();
                  if (chat) {
                      const recipientId = chat.startup_id === userId ? chat.investor_id : chat.startup_id;
                      const { data: profile } = await supabase.from('profiles').select('email').eq('id', recipientId).maybeSingle();
                      if (profile?.email) {
                          await StorageService.sendEmail(profile.email, "New Message!", `You have a new message: "${message.text}"`);
                      }
                  }
              } catch (err) {
                  console.warn("Non-blocking notification email error:", err);
              }
          })();

          return { 
              id: insertedRow.id || messageId, 
              senderId: insertedRow.sender_id || userId, 
              text: message.text, 
              type: insertedRow.type || 'text', 
              timestamp: insertedRow.created_at || new Date().toISOString(), 
              isMe: true, 
              reactions: insertedRow.reactions || [], 
              fileName: insertedRow.file_name, 
              fileSize: insertedRow.file_size, 
              duration: insertedRow.duration,
              status: insertedRow.status || 'sent'
          };
      } catch (e) { 
          console.error("Error adding message to DB:", e);
          return null; 
      }
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

  submitReport: async (reportedProfileId: string, reason: string): Promise<boolean> => {
      await StorageService.init();
      if (_isMock) return true;
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return false;

          const { error } = await supabase.from('reports').insert({
              reporter_id: user.id,
              reported_profile_id: reportedProfileId,
              reason: reason
          });
          
          return !error;
      } catch (e) {
          console.error("Error submitting report:", e);
          return false;
      }
  }
};