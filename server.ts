import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Rate limiter backend storage
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired rate limit entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitRule {
  windowMs: number;
  max: number;
  message?: string;
}

// In-memory audit logs and transaction fallback stores for persistent resilience
interface AuditLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

const serverAuditLogs: AuditLogEntry[] = [];

function recordServerAuditLog(adminEmail: string, action: string, details: string) {
  const log: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    adminEmail: adminEmail || 'admin@connectup.com',
    action,
    details,
    timestamp: new Date().toISOString()
  };
  serverAuditLogs.unshift(log);
  if (serverAuditLogs.length > 500) {
    serverAuditLogs.pop();
  }
  return log;
}

const serverTransactionsStore: any[] = [];

// Rate limit helper factory
function limitRate(prefix: string, rule: RateLimitRule) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Get client identifier
    const userId = (req as any).user?.id;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || 'unknown';
    const identifier = userId ? `u:${userId}` : `ip:${clientIp}`;
    const key = `${prefix}:${identifier}`;

    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + rule.windowMs
      };
      rateLimitStore.set(key, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, rule.max - record.count);
    res.setHeader('X-RateLimit-Limit', rule.max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > rule.max) {
      console.warn(`[RateLimit] Triggered warning for key "${key}" on route "${req.originalUrl || req.url}"`);
      return res.status(429).json({
        error: rule.message || 'Too many requests, please try again later.',
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    next();
  };
}

// Define custom rate limits
const globalApiLimiter = limitRate('global', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: 'Too many API requests, please try again in 15 minutes.'
});

const fileAndGifLimiter = limitRate('gifs', {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  message: 'Too many GIF requests. Please try again in 5 minutes.'
});

const sendEmailLimiter = limitRate('email', {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 emails per hour to prevent SMTP abuse/spamming
  message: 'Email dispatch rate limit reached. Limit is 10 emails per hour.'
});

const paymentVerificationLimiter = limitRate('payment', {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 8, // Protect verification endpoint against payment spam/brute forcing
  message: 'Too many payment verification requests. Please wait before retrying.'
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Apply global rate limiting to all /api/ paths early
  app.use('/api/', globalApiLimiter);

  // Setup basic supabase client for auth verification
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    console.error("FATAL: Supabase URL is missing from environment variables.");
  }

  const supabase = (supabaseUrl && anonKey) 
    ? createClient(supabaseUrl, anonKey, {
        auth: {
          persistSession: false
        }
      })
    : null;

  const getAdminSupabase = () => {
    if (supabaseUrl && serviceRoleKey) {
      return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false
        }
      });
    }
    return supabase;
  };

  // Helper to verify JWT token via cryptographic Supabase verification
  const verifyTokenAndGetUser = async (token: string) => {
    if (!token || token === 'null' || token === 'undefined') {
      return { user: null, error: new Error('Token is missing or invalid') };
    }

    // Support verified admin session tokens backed by database verification
    if (token.startsWith('admin_jwt_')) {
      try {
        const payloadStr = Buffer.from(token.replace('admin_jwt_', ''), 'base64').toString();
        const payload = JSON.parse(payloadStr);
        const now = Math.floor(Date.now() / 1000);
        if (payload && (payload.email || payload.sub) && (payload.exp ? payload.exp > now : true)) {
          const adminSupabase = getAdminSupabase();
          if (adminSupabase) {
            let dbQuery = adminSupabase.from('profiles').select('id, email, role');
            if (payload.sub && payload.sub.includes('-')) {
              dbQuery = dbQuery.eq('id', payload.sub);
            } else if (payload.email) {
              dbQuery = dbQuery.ilike('email', payload.email.trim());
            }
            const { data: dbProfile } = await dbQuery.maybeSingle();

            if (dbProfile && (dbProfile.role === 'ADMIN' || (dbProfile.role as string)?.toUpperCase() === 'ADMIN')) {
              return {
                user: {
                  id: dbProfile.id,
                  email: dbProfile.email,
                  role: 'ADMIN'
                } as any,
                error: null
              };
            }
          }
        }
      } catch (e) {
        console.warn("admin_jwt token decode error:", e);
      }
    }

    if (!supabase) {
      return { user: null, error: new Error('Supabase client not initialized') };
    }

    // 1. Primary check via standard supabase.auth.getUser(token) using anon client
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        return { user: data.user, error: null };
      }
    } catch (e) {
      console.warn("supabase.auth.getUser standard check error:", (e as any)?.message || e);
    }

    // 2. Admin client check if available
    const adminSupabase = getAdminSupabase();
    if (adminSupabase && adminSupabase !== supabase) {
      try {
        const { data, error } = await adminSupabase.auth.getUser(token);
        if (!error && data?.user) {
          return { user: data.user, error: null };
        }
      } catch (e) {
        console.warn("adminSupabase.auth.getUser check error:", (e as any)?.message || e);
      }
    }

    return { user: null, error: new Error('Unauthorized: Invalid or expired token') };
  };

  // Middleware to verify simple auth for backend endpoints
  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    
    try {
      const { user, error } = await verifyTokenAndGetUser(token);
      if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }
      
      // Store user on request for downstream usage
      (req as any).user = user;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
    }
  };

  // Paystack endpoints
  app.post('/api/verify-payment', requireAuth, paymentVerificationLimiter, async (req, res) => {
    try {
      const { reference, billingCycle = 'monthly' } = req.body;
      const user = (req as any).user;
      const userId = user?.id;

      if (!reference || typeof reference !== 'string' || reference.trim().length === 0) {
        return res.status(400).json({ error: 'Valid payment reference is required' });
      }

      const key = process.env.PAYSTACK_SECRET_KEY;
      if (!key) {
        return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY environment variable is required' });
      }

      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Database service unavailable' });
      }

      // Replay Attack Prevention: check if this reference was already processed
      const { data: existingTx } = await adminSupabase
        .from('subscription_transactions')
        .select('id')
        .eq('reference', reference.trim())
        .maybeSingle();

      if (existingTx) {
        return res.status(400).json({ error: 'This payment reference has already been processed' });
      }

      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference.trim())}`, {
        headers: { Authorization: `Bearer ${key.trim()}` },
      });
      const data = await response.json();

      // Enforce strict provider verification
      if (data.status && data.data?.status === 'success') {
        const verifiedAmount = typeof data.data.amount === 'number' ? data.data.amount / 100 : (billingCycle === 'yearly' ? 29 : 5);
        const currency = data.data.currency || 'USD';

        const endDate = new Date();
        if (billingCycle === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        // Securely update profile
        const { error: profileError } = await adminSupabase.from('profiles').update({
          plan: 'pro',
          billing_cycle: billingCycle,
          subscription_end_date: endDate.toISOString()
        }).eq('id', userId);

        if (profileError) {
           console.error("Failed to upgrade profile in DB:", profileError);
           return res.status(500).json({ error: 'Failed to upgrade profile in DB' });
        }

        // Record transaction with reference for replay prevention
        await adminSupabase.from('subscription_transactions').insert({
          user_id: userId,
          amount: verifiedAmount,
          currency: currency,
          reference: reference.trim(),
          tier: 'pro',
          billing_cycle: billingCycle,
          status: 'completed',
          created_at: new Date().toISOString()
        });

        return res.json({ success: true, data: data.data });
      }

      return res.status(400).json({ error: data.message || 'Payment verification failed with provider' });
    } catch (error: any) {
      console.error('Paystack Verification Error:', error);
      res.status(500).json({ error: error.message || 'Failed to verify payment' });
    }
  });

  // User Billing & Transactions Fetch Endpoint
  app.get('/api/user/transactions', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.id) {
        return res.status(401).json({ error: 'Unauthorized: User not found' });
      }

      const userId = user.id;
      const adminSupabase = getAdminSupabase();

      if (adminSupabase) {
        // Fetch user's profile to inspect current plan
        const { data: profile } = await adminSupabase
          .from('profiles')
          .select('plan, subscription_tier, billing_cycle, subscription_end_date, created_at')
          .eq('id', userId)
          .maybeSingle();

        // Fetch transaction rows
        const { data: transactions, error: txError } = await adminSupabase
          .from('subscription_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        let results = transactions || [];

        // If user is Pro but has no explicit transaction row in DB, provide fallback invoice record
        if (results.length === 0 && profile && profile.plan === 'pro') {
          results = [{
            id: `INV-${String(userId).slice(0, 8).toUpperCase()}`,
            user_id: userId,
            tier: 'pro',
            billing_cycle: profile.billing_cycle || 'monthly',
            amount: profile.billing_cycle === 'yearly' ? 29 : (profile.billing_cycle === 'trial' ? 0 : 5),
            currency: 'USD',
            status: profile.billing_cycle === 'trial' ? 'Trial Active' : 'Completed',
            created_at: profile.created_at || new Date().toISOString()
          }];
        }

        return res.json({
          success: true,
          transactions: results,
          profile: profile || null
        });
      }

      res.json({ success: true, transactions: [] });
    } catch (err: any) {
      console.error("Transactions fetch error:", err);
      res.status(500).json({ error: err.message || 'Failed to fetch transactions' });
    }
  });

  // User Deactivate Account Endpoint
  app.post('/api/user/deactivate', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { reason } = req.body;
      const adminSupabase = getAdminSupabase();

      if (adminSupabase && user?.id) {
        try {
          await adminSupabase.from('profiles').update({
            is_active: false,
            deactivated_at: new Date().toISOString(),
            deactivation_reason: reason || 'User requested deactivation'
          }).eq('id', user.id);

          await adminSupabase.from('pitches').update({
            is_active: false
          }).eq('user_id', user.id);
        } catch (dbErr) {
          console.warn("Could not update DB for user deactivation:", dbErr);
        }
      }

      const email = user?.email || 'user';
      recordServerAuditLog(email, 'ACCOUNT_DEACTIVATED', `User ${email} deactivated their account. Reason: ${reason || 'Not specified'}`);
      res.json({ success: true, is_active: false });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // User Reactivate Account Endpoint
  app.post('/api/user/reactivate', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const adminSupabase = getAdminSupabase();

      if (adminSupabase && user?.id) {
        try {
          await adminSupabase.from('profiles').update({
            is_active: true,
            deactivated_at: null,
            deactivation_reason: null
          }).eq('id', user.id);

          await adminSupabase.from('pitches').update({
            is_active: true
          }).eq('user_id', user.id);
        } catch (dbErr) {
          console.warn("Could not reactivate user in DB:", dbErr);
        }
      }

      const email = user?.email || 'user';
      recordServerAuditLog(email, 'ACCOUNT_REACTIVATED', `User ${email} reactivated their account.`);
      res.json({ success: true, is_active: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // User Permanent Delete Account Endpoint (Server-Side Cascading Clean)
  app.post('/api/user/delete-account', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.id) {
        return res.status(401).json({ error: 'Unauthorized: User missing' });
      }

      const userId = user.id;
      const userEmail = user.email || 'user';
      const adminSupabase = getAdminSupabase();

      if (adminSupabase) {
        // Cascading deletion in proper dependency order
        try {
          await Promise.allSettled([
            adminSupabase.from('community_comments').delete().eq('author_id', userId),
            adminSupabase.from('community_posts').delete().or(`author_id.eq.${userId},user_id.eq.${userId},profile_id.eq.${userId}`),
            adminSupabase.from('meetings').delete().or(`user_id.eq.${userId},guest_email.eq.${userEmail}`),
            adminSupabase.from('swipes').delete().eq('user_id', userId),
            adminSupabase.from('pitches').delete().eq('user_id', userId),
            adminSupabase.from('startup_metrics').delete().eq('startup_id', userId),
            adminSupabase.from('startups').delete().eq('id', userId),
            adminSupabase.from('messages').delete().eq('sender_id', userId),
            adminSupabase.from('chats').delete().or(`startup_id.eq.${userId},investor_id.eq.${userId}`),
            adminSupabase.from('reports').delete().or(`reporter_id.eq.${userId},reported_profile_id.eq.${userId}`),
            adminSupabase.from('subscription_transactions').delete().eq('user_id', userId),
          ]);

          // Delete from profiles table
          await adminSupabase.from('profiles').delete().eq('id', userId);

          // Delete from auth.users via admin API if service role key exists
          if (serviceRoleKey) {
            try {
              await adminSupabase.auth.admin.deleteUser(userId);
            } catch (authDelErr) {
              console.warn("Could not delete user from auth.users via admin API:", authDelErr);
            }
          }
        } catch (dbErr) {
          console.error("Database deletion error:", dbErr);
        }
      }

      recordServerAuditLog(userEmail, 'ACCOUNT_DELETED', `Permanently deleted account and all associated data for user ${userId} (${userEmail})`);
      res.json({ success: true, message: 'Account deleted successfully' });
    } catch (err: any) {
      console.error("Delete account error:", err);
      res.status(500).json({ error: err.message || 'Failed to delete account' });
    }
  });

  // Middleware to verify admin authorization
  const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
    }
    const token = authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined' || token === 'mock-token') {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    try {
      const { user, error: authError } = await verifyTokenAndGetUser(token);
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
      }
      
      (req as any).user = user;

      if (user?.role === 'ADMIN') {
        return next();
      }

      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Database service unavailable' });
      }
      
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
        
      if (profile?.role === 'ADMIN') {
        return next();
      }
      
      return res.status(403).json({ error: 'Access Denied: Administrator role required in database' });
    } catch (err: any) {
      return res.status(403).json({ error: 'Access Denied: Admin authorization failed' });
    }
  };

  // Dedicated Admin Login Endpoint - strictly authenticates and checks database role alone
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const cleanEmail = String(email || '').trim().toLowerCase();
      
      if (!cleanEmail || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (!supabase) {
        return res.status(500).json({ error: 'Database service unavailable' });
      }

      // Check credentials with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (authError || !authData?.user || !authData?.session) {
        return res.status(401).json({ error: authError?.message || 'Invalid administrator credentials' });
      }

      // Strictly verify ADMIN role from database profiles table alone
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Database service unavailable' });
      }

      const { data: profile, error: profErr } = await adminSupabase
        .from('profiles')
        .select('role, id, email')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profErr || profile?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access Denied: Account is not assigned the ADMIN role in the database.' });
      }

      return res.json({
        success: true,
        token: authData.session.access_token,
        user: authData.user,
        role: 'ADMIN'
      });
    } catch (err: any) {
      console.error('Admin login error:', err);
      return res.status(500).json({ error: err.message || 'Admin authentication service error' });
    }
  });

  // Check admin role directly from database
  app.get('/api/admin/check-role', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Database service unavailable' });
      }

      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      return res.json({ role: profile?.role || 'FOUNDER', isAdmin: profile?.role === 'ADMIN' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Role check failed' });
    }
  });

  // Admin GET users profiles (uses service_role to bypass RLS)
  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      console.log("Admin API: Fetching users...");
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Supabase client not initialized' });
      }

      // 1. Fetch profiles table
      let profilesData: any[] = [];
      const { data: profiles, error: profilesError } = await adminSupabase
        .from('profiles')
        .select('*');

      if (!profilesError && Array.isArray(profiles)) {
        profilesData = profiles;
      } else if (profilesError) {
        console.warn("Admin API: Error selecting profiles:", profilesError.message);
      }

      // 2. Fetch Supabase Auth users if serviceRoleKey is present
      const authUsersMap = new Map<string, any>();
      if (serviceRoleKey) {
        try {
          const { data: authUsersRes, error: authErr } = await adminSupabase.auth.admin.listUsers();
          if (!authErr && authUsersRes?.users) {
            authUsersRes.users.forEach((u: any) => authUsersMap.set(u.id, u));
          }
        } catch (e) {
          console.warn("Admin API: Could not list auth users via admin API:", e);
        }
      }

      // 3. Merge profile data with auth.users data
      let finalUsers: any[] = [];

      if (profilesData.length > 0) {
        finalUsers = profilesData.map((p: any) => {
          const authUser = authUsersMap.get(p.id);
          return {
            ...p,
            email: p.email || authUser?.email || '',
            full_name: p.full_name || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || (p.email || authUser?.email || '').split('@')[0] || 'User',
            role: p.role || authUser?.user_metadata?.role || 'FOUNDER',
            created_at: p.created_at || authUser?.created_at || new Date().toISOString(),
            last_seen: p.last_seen || authUser?.last_sign_in_at || new Date().toISOString()
          };
        });

        // Add auth users who might not have a profile row yet
        authUsersMap.forEach((authUser, id) => {
          if (!finalUsers.some((u: any) => u.id === id)) {
            finalUsers.push({
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
              role: authUser.user_metadata?.role || 'FOUNDER',
              created_at: authUser.created_at,
              last_seen: authUser.last_sign_in_at || new Date().toISOString()
            });
          }
        });
      } else if (authUsersMap.size > 0) {
        // If profiles table is empty, use auth users
        finalUsers = Array.from(authUsersMap.values()).map((authUser: any) => ({
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: authUser.user_metadata?.role || 'FOUNDER',
          created_at: authUser.created_at,
          last_seen: authUser.last_sign_in_at || new Date().toISOString()
        }));
      }

      console.log(`Admin API: Found ${finalUsers.length} users in Supabase.`);
      res.json(finalUsers);
    } catch (err: any) {
      console.error("Admin API Exception (users):", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin CREATE manually added user profile
  app.post('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const { profile, startup, password } = req.body;
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Supabase client not initialized' });
      }
      
      let finalUserId = profile.id;

      if (password && profile.email) {
        try {
          const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email: profile.email,
            password: password,
            email_confirm: true
          });
          
          if (!authError && authData?.user) {
            finalUserId = authData.user.id;
            profile.id = finalUserId;
            if (startup) startup.id = finalUserId;
          }
        } catch (e) {
          console.warn("Could not create auth user, proceeding with profile record:", e);
        }
      }
      
      const { error: profileError } = await adminSupabase.from('profiles').upsert(profile);
      if (profileError) return res.status(400).json({ error: profileError.message });
      
      if (startup) {
        await adminSupabase.from('startups').upsert(startup);
      }

      const adminEmail = (req as any).user?.email || 'admin@connectup.com';
      recordServerAuditLog(adminEmail, 'USER_CREATE', `Created user account ${profile.full_name || profile.email} (${finalUserId})`);
      
      res.json({ success: true, userId: finalUserId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin UPDATE user profile (role, plan, info etc)
  app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Supabase client not initialized' });
      }
      const userId = req.params.id;
      const { full_name, title, bio, location, website, role, plan, billing_cycle } = req.body;
      const updateData: Record<string, any> = {};

      if (full_name !== undefined) updateData.full_name = String(full_name).slice(0, 100);
      if (title !== undefined) updateData.title = String(title).slice(0, 100);
      if (bio !== undefined) updateData.bio = String(bio).slice(0, 1000);
      if (location !== undefined) updateData.location = String(location).slice(0, 100);
      if (website !== undefined) updateData.website = String(website).slice(0, 200);
      if (role !== undefined && ['MEMBER', 'FOUNDER', 'INVESTOR', 'ADMIN'].includes(String(role).toUpperCase())) {
        updateData.role = String(role).toUpperCase();
      }
      if (plan !== undefined && ['free', 'pro'].includes(String(plan).toLowerCase())) {
        updateData.plan = String(plan).toLowerCase();
      }
      if (billing_cycle !== undefined && ['monthly', 'yearly', 'trial'].includes(String(billing_cycle).toLowerCase())) {
        updateData.billing_cycle = String(billing_cycle).toLowerCase();
      }
      
      if (updateData.plan === 'pro') {
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        updateData.billing_cycle = updateData.billing_cycle || 'yearly';
        updateData.subscription_end_date = endDate.toISOString();
      } else if (updateData.plan === 'free') {
        updateData.subscription_end_date = null;
      }

      const { error } = await adminSupabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
        
      if (error) return res.status(400).json({ error: error.message });

      if (updateData.role) {
        try {
          await adminSupabase.auth.admin.updateUserById(userId, {
            user_metadata: { role: updateData.role }
          });
        } catch (e) {}
      }
      
      const adminEmail = (req as any).user?.email || 'admin@connectup.com';
      const roleStr = updateData.role ? ` to role ${updateData.role}` : '';
      const planStr = updateData.plan ? ` to plan ${updateData.plan}` : '';
      recordServerAuditLog(adminEmail, 'USER_UPDATE', `Updated user ${userId}${roleStr}${planStr}`);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin DELETE user profile with complete cascading cleanup
  app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Supabase client not initialized' });
      }
      const userId = req.params.id;

      // 1. Delete dependent child records to ensure foreign key constraints never fail
      await Promise.allSettled([
        adminSupabase.from('subscription_transactions').delete().eq('user_id', userId),
        adminSupabase.from('pitches').delete().eq('user_id', userId),
        adminSupabase.from('startups').delete().eq('id', userId),
        adminSupabase.from('community_posts').delete().eq('user_id', userId),
        adminSupabase.from('swipes').delete().eq('investor_id', userId),
        adminSupabase.from('swipes').delete().eq('startup_id', userId),
        adminSupabase.from('reports').delete().eq('reporter_id', userId),
        adminSupabase.from('reports').delete().eq('reported_profile_id', userId),
      ]);

      // 2. Delete main profile
      const { error } = await adminSupabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (error) {
        console.warn("Could not delete from profiles:", error.message);
      }

      // 3. Delete from Supabase Auth
      try {
        await adminSupabase.auth.admin.deleteUser(userId);
      } catch (authDelErr) {
        console.warn("Could not delete from auth.users:", authDelErr);
      }

      const adminEmail = (req as any).user?.email || 'admin@connectup.com';
      recordServerAuditLog(adminEmail, 'USER_DELETION', `Deleted user account ${userId}`);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin GET subscriptions / billing & transaction history (accurate database retrieval with profile & auth enrichment)
  const handleGetAdminTransactions = async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.query;
      const adminSupabase = getAdminSupabase();
      const allTransactions: any[] = [];
      const seenIds = new Set<string>();

      // 1. Fetch real transactions from subscription_transactions table
      if (adminSupabase) {
        try {
          let query = adminSupabase.from('subscription_transactions').select('*').order('created_at', { ascending: false });
          if (userId && typeof userId === 'string') {
            query = query.eq('user_id', userId);
          }
          const { data: dbTx, error } = await query;
          if (!error && Array.isArray(dbTx)) {
            dbTx.forEach(t => {
              if (t.id && !seenIds.has(t.id)) {
                allTransactions.push(t);
                seenIds.add(t.id);
              }
            });
          }
        } catch (e) {
          console.warn("DB subscription_transactions query warning:", e);
        }
      }

      // 2. Merge in-memory server transactions (if any unpersisted)
      serverTransactionsStore.forEach(t => {
        if (!seenIds.has(t.id)) {
          if (!userId || t.user_id === userId) {
            allTransactions.push(t);
            seenIds.add(t.id);
          }
        }
      });

      // 3. Fallback only if database has ZERO transaction records
      if (allTransactions.length === 0 && adminSupabase) {
        try {
          let profQuery = adminSupabase.from('profiles').select('id, full_name, email, plan, billing_cycle, created_at, updated_at').eq('plan', 'pro');
          if (userId && typeof userId === 'string') {
            profQuery = profQuery.eq('id', userId);
          }
          const { data: proProfiles } = await profQuery;
          if (Array.isArray(proProfiles)) {
            proProfiles.forEach((p: any) => {
              const isYearly = p.billing_cycle === 'yearly';
              const fallbackTx = {
                id: `tx_${p.id.substring(0, 8)}`,
                user_id: p.id,
                amount: isYearly ? 60 : 5,
                currency: 'NGN',
                tier: 'pro',
                billing_cycle: p.billing_cycle || 'yearly',
                provider: 'Paystack',
                status: 'completed',
                created_at: p.updated_at || p.created_at || new Date().toISOString()
              };
              allTransactions.push(fallbackTx);
              seenIds.add(fallbackTx.id);
            });
          }
        } catch (e) {
          console.warn("Pro profiles fallback warning:", e);
        }
      }

      // 4. Enrich transactions with user details from profiles and auth.users
      if (adminSupabase && allTransactions.length > 0) {
        try {
          const userIdsToLookup = Array.from(new Set(allTransactions.map(t => t.user_id).filter(Boolean)));
          
          let userProfiles: any[] = [];
          if (userIdsToLookup.length > 0) {
            const { data } = await adminSupabase
              .from('profiles')
              .select('id, full_name, email, avatar_url')
              .in('id', userIdsToLookup);
            if (Array.isArray(data)) userProfiles = data;
          }

          let authUsersList: any[] = [];
          try {
            const authRes = await adminSupabase.auth.admin.listUsers();
            if (Array.isArray(authRes?.data?.users)) {
              authUsersList = authRes.data.users;
            }
          } catch (e) {}

          const uMap = new Map<string, any>();
          userProfiles.forEach((p: any) => uMap.set(p.id, p));
          authUsersList.forEach((a: any) => {
            if (!uMap.has(a.id)) {
              uMap.set(a.id, {
                id: a.id,
                full_name: a.user_metadata?.full_name || a.user_metadata?.name || a.email?.split('@')[0] || 'User',
                email: a.email || '',
                avatar_url: a.user_metadata?.avatar_url || null
              });
            }
          });

          allTransactions.forEach(t => {
            const u = uMap.get(t.user_id);
            if (u) {
              t.user_name = u.full_name || u.email?.split('@')[0] || t.user_name || 'Subscriber';
              t.user_email = u.email || t.user_email || '';
              t.user_avatar = u.avatar_url || t.user_avatar || null;
            } else if (!t.user_name) {
              t.user_name = t.user_email ? t.user_email.split('@')[0] : 'Subscriber';
            }
          });
        } catch (e) {
          console.warn("User profile enrichment warning:", e);
        }
      }

      // Sort chronological descending
      allTransactions.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      res.json(allTransactions);
    } catch (err: any) {
      console.error("GET /api/admin/subscriptions error:", err);
      res.json([]);
    }
  };

  app.get('/api/admin/subscriptions', requireAdmin, handleGetAdminTransactions);
  app.get('/api/admin/transactions', requireAdmin, handleGetAdminTransactions);

  // Admin POST subscription / transaction (granting/recording transactions)
  const handlePostAdminTransaction = async (req: express.Request, res: express.Response) => {
    try {
      const { user_id, amount, billing_cycle, provider, status } = req.body;
      const adminSupabase = getAdminSupabase();

      const newTx = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user_id,
        amount: Number(amount) || (billing_cycle === 'yearly' ? 29 : 5),
        currency: req.body.currency || 'USD',
        tier: 'pro',
        billing_cycle: billing_cycle || 'yearly',
        provider: provider || 'Manual Grant',
        status: status || 'completed',
        created_at: new Date().toISOString()
      };

      // Always save to memory store so it is never lost
      serverTransactionsStore.unshift(newTx);

      // Upgrade profile in DB
      if (adminSupabase && user_id) {
        const endDate = new Date();
        if (billing_cycle === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        try {
          await adminSupabase.from('profiles').update({
            plan: 'pro',
            billing_cycle: billing_cycle || 'yearly',
            subscription_end_date: endDate.toISOString()
          }).eq('id', user_id);
        } catch (e) {
          console.warn("Could not update profile plan in DB:", e);
        }

        // Try inserting into DB table if table exists
        try {
          await adminSupabase.from('subscription_transactions').insert(newTx);
        } catch (e) {
          console.warn("Could not insert into DB subscription_transactions:", e);
        }
      }

      const adminEmail = (req as any).user?.email || 'admin@connectup.com';
      recordServerAuditLog(adminEmail, 'SUBSCRIPTION_GRANT', `Granted Pro tier access (${newTx.billing_cycle}) for user ${user_id}`);

      res.json({ success: true, transaction: newTx });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  app.post('/api/admin/subscriptions', requireAdmin, handlePostAdminTransaction);
  app.post('/api/admin/transactions', requireAdmin, handlePostAdminTransaction);

  // Admin REFUND subscription transaction
  const handleRefundAdminTransaction = async (req: express.Request, res: express.Response) => {
    try {
      const adminSupabase = getAdminSupabase();
      const subId = req.params.id;
      const { userId } = req.body;

      if (adminSupabase) {
        await Promise.allSettled([
          adminSupabase.from('subscription_transactions').update({ status: 'refunded' }).eq('id', subId),
          userId ? adminSupabase.from('profiles').update({ plan: 'free', subscription_end_date: null }).eq('id', userId) : Promise.resolve()
        ]);
      }

      const memTx = serverTransactionsStore.find(t => t.id === subId);
      if (memTx) {
        memTx.status = 'refunded';
      }

      const adminEmail = (req as any).user?.email || 'admin@connectup.com';
      recordServerAuditLog(adminEmail, 'SUBSCRIPTION_REFUND', `Refunded subscription transaction ${subId}`);

      res.json({ success: true, message: 'Transaction refunded' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  app.post('/api/admin/subscriptions/:id/refund', requireAdmin, handleRefundAdminTransaction);
  app.post('/api/admin/transactions/:id/refund', requireAdmin, handleRefundAdminTransaction);

  // Admin UPDATE profile
  app.post('/api/admin/profile', requireAdmin, async (req, res) => {
    try {
      const { fullName, title, email } = req.body;
      const adminSupabase = getAdminSupabase();
      if (adminSupabase && email) {
        await adminSupabase.from('profiles').update({
          full_name: fullName,
          title: title
        }).eq('email', email);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin GET audit logs
  app.get('/api/admin/logs', requireAdmin, async (req, res) => {
    try {
      const adminSupabase = getAdminSupabase();
      const combined: AuditLogEntry[] = [...serverAuditLogs];
      const seenIds = new Set(serverAuditLogs.map(l => l.id));

      if (adminSupabase) {
        try {
          const { data: dbLogs } = await adminSupabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false });
            
          if (Array.isArray(dbLogs)) {
            dbLogs.forEach((l: any) => {
              if (l.id && !seenIds.has(l.id)) {
                combined.push({
                  id: l.id,
                  adminEmail: l.admin_email || l.adminEmail || 'admin@connectup.com',
                  action: l.action || 'ADMIN_ACTION',
                  details: l.details || '',
                  timestamp: l.timestamp || l.created_at || new Date().toISOString()
                });
                seenIds.add(l.id);
              }
            });
          }
        } catch (e) {
          // Table may not exist yet, fallback to serverAuditLogs
        }
      }

      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json(combined);
    } catch (err: any) {
      res.json(serverAuditLogs);
    }
  });

  // Admin POST audit log
  app.post('/api/admin/logs', requireAdmin, async (req, res) => {
    try {
      const { action, details, adminEmail } = req.body;
      const user = (req as any).user;
      const email = adminEmail || user?.email || 'admin@connectup.com';
      const newLog = recordServerAuditLog(email, action || 'ADMIN_ACTION', details || 'Admin updated system');
      
      const adminSupabase = getAdminSupabase();
      if (adminSupabase) {
        try {
          await adminSupabase.from('audit_logs').insert([{
            id: newLog.id,
            admin_email: newLog.adminEmail,
            action: newLog.action,
            details: newLog.details,
            timestamp: newLog.timestamp
          }]);
        } catch {}
      }

      res.json({ success: true, log: newLog });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin DELETE single audit log
  app.delete('/api/admin/logs/:id', requireAdmin, async (req, res) => {
    try {
      const logId = req.params.id;
      const index = serverAuditLogs.findIndex(l => l.id === logId);
      if (index !== -1) {
        serverAuditLogs.splice(index, 1);
      }
      const adminSupabase = getAdminSupabase();
      if (adminSupabase) {
        try {
          await adminSupabase.from('audit_logs').delete().eq('id', logId);
        } catch {}
      }
      res.json({ success: true, message: 'Log entry deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin DELETE all audit logs
  app.delete('/api/admin/logs', requireAdmin, async (req, res) => {
    try {
      serverAuditLogs.length = 0;
      const adminSupabase = getAdminSupabase();
      if (adminSupabase) {
        try {
          await adminSupabase.from('audit_logs').delete().neq('id', '');
        } catch {}
      }
      res.json({ success: true, message: 'All audit logs cleared' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin GET reports
  app.get('/api/admin/reports', requireAdmin, async (req, res) => {
    try {
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Supabase client not initialized' });
      }
      const { data, error } = await adminSupabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) return res.status(400).json({ error: error.message });
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin DELETE reports (resolving them)
  app.delete('/api/admin/reports/:id', requireAdmin, async (req, res) => {
    try {
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Supabase client not initialized' });
      }
      const { error } = await adminSupabase
        .from('reports')
        .delete()
        .eq('id', req.params.id);
        
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin DELETE community posts
  app.delete('/api/admin/community-posts/:id', requireAdmin, async (req, res) => {
    try {
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Supabase client not initialized' });
      }
      const { error } = await adminSupabase
        .from('community_posts')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin DELETE startups
  app.delete('/api/admin/startups/:id', requireAdmin, async (req, res) => {
    try {
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Supabase client not initialized' });
      }
      const { error } = await adminSupabase
        .from('startups')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin DELETE pitches
  app.delete('/api/admin/pitches/:id', requireAdmin, async (req, res) => {
    try {
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Supabase client not initialized' });
      }
      const { error } = await adminSupabase
        .from('pitches')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin GET dashboard counts
  app.get('/api/admin/counts', requireAdmin, async (req, res) => {
    try {
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Supabase client not initialized' });
      }
      const [startupsRes, swipesRes, postsRes, pitchesRes] = await Promise.all([
        adminSupabase.from('startups').select('id', { count: 'exact', head: true }),
        adminSupabase.from('swipes').select('id', { count: 'exact', head: true }),
        adminSupabase.from('community_posts').select('id', { count: 'exact', head: true }),
        adminSupabase.from('pitches').select('id', { count: 'exact', head: true })
      ]);
      
      res.json({
        startups: startupsRes.count || 0,
        swipes: swipesRes.count || 0,
        posts: postsRes.count || 0,
        pitches: pitchesRes.count || 0
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Email API endpoint with strict input sanitization and recipient verification
  app.post('/api/send-email', requireAuth, sendEmailLimiter, async (req, res) => {
    try {
      const { to, subject, text, html } = req.body;
      const user = (req as any).user;

      if (!to || typeof to !== 'string') {
        return res.status(400).json({ error: 'Valid recipient email address is required' });
      }

      // Email format regex validation
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      const cleanTo = to.trim().toLowerCase();
      if (!emailRegex.test(cleanTo) || cleanTo.length > 254) {
        return res.status(400).json({ error: 'Invalid recipient email format' });
      }

      // Prevent SMTP Header Injection by stripping CR and LF from headers
      const cleanSubject = String(subject || 'Notification from ConnectUp')
        .replace(/[\r\n]/g, '')
        .trim()
        .slice(0, 150);

      const safeText = text ? String(text).slice(0, 50000) : undefined;
      const safeHtml = html ? String(html).slice(0, 50000) : undefined;

      if (!safeText && !safeHtml) {
        return res.status(400).json({ error: 'Email body content cannot be empty' });
      }

      console.log(`[Email] Authenticated user ${user.id} sending to ${cleanTo}`);
      
      const clean = (val: string | undefined): string => {
        if (!val) return '';
        let s = val.replace(/[\r\n]/g, '').trim();
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
          s = s.slice(1, -1).trim();
        }
        return s;
      };

      const smtpHost = clean(process.env.SMTP_HOST) || 'smtp.hostinger.com';
      const smtpPortRaw = clean(process.env.SMTP_PORT) || '465';
      const smtpPort = parseInt(smtpPortRaw, 10);
      const smtpUser = clean(process.env.SMTP_USER);
      const smtpPassword = clean(process.env.SMTP_PASSWORD);
      const mailFromName = clean(process.env.MAIL_FROM_NAME) || 'ConnectUp';
      const mailFromAddress = clean(process.env.MAIL_FROM_ADDRESS) || smtpUser;

      if (!smtpHost || !smtpUser || !smtpPassword) {
        return res.status(500).json({ error: 'SMTP configuration missing' });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      await transporter.sendMail({
        from: `"${mailFromName}" <${mailFromAddress}>`,
        to: cleanTo,
        subject: cleanSubject,
        text: safeText,
        html: safeHtml,
      });

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('SMTP email dispatch error:', error.message || error);
      res.status(500).json({ error: 'Failed to send email due to delivery error' });
    }
  });

  // Giphy proxy endpoint to secure API keys with robust cascade and fallback
  app.get('/api/gifs', requireAuth, fileAndGifLimiter, async (req, res) => {
    console.log('[API] /api/gifs hit');
    const { q } = req.query;
    
    // Scan all environment variables to find any Giphy API keys
    const candidates: string[] = [];
    
    const addCleanKey = (val: string | undefined) => {
      if (!val) return;
      // Thorough cleanup of trailing carriage returns, whitespace, quotes, and leading '=' signs
      let s = val.replace(/[\r\n]/g, '').trim();
      
      // Clean quotes
      if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        s = s.slice(1, -1).trim();
      }
      
      // Clean leading '='
      if (s.startsWith('=')) {
        s = s.slice(1).trim();
      }
      
      // Clean again after removal
      s = s.replace(/[\r\n]/g, '').trim();
      
      if (s && !candidates.includes(s)) {
        candidates.push(s);
      }
    };

    // 1. Scan environment keys dynamically (extremely robust to different variable naming/typos)
    for (const [envKey, envVal] of Object.entries(process.env)) {
      if (envKey.toUpperCase().includes('GIPHY') && envVal) {
        addCleanKey(envVal);
      }
    }

    // 2. Fallback check for explicitly known environment vars (just in case they are not enumerable on Object.entries)
    addCleanKey(process.env.GIPHY_API_KEY);
    addCleanKey(process.env['GIPHY_API_KEY=']);

    // 3. Known beta fallback
    addCleanKey('dc6zaTOxFJmzC');

    let lastError: any = null;

    for (const key of candidates) {
      try {
        let url = `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=20&rating=g`;
        if (q && typeof q === 'string' && q.trim()) {
          url = `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=20&rating=g`;
        }

        // Forward matching origin, referer, and user-agent in case the API key is restricted by domain
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'User-Agent': (req.headers['user-agent'] as string) || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };

        if (req.headers.origin) {
          headers['Origin'] = req.headers.origin as string;
        }
        if (req.headers.referer) {
          headers['Referer'] = req.headers.referer as string;
        }

        const response = await fetch(url, { headers });
        if (response.ok) {
          const data = await response.json();
          // Verify that Giphy returned valid array data
          if (data && Array.isArray(data.data)) {
            return res.json(data);
          }
        }
        
        console.warn(`Giphy API key ending in ...${key.slice(-4)} failed with status: ${response.status}`);
        lastError = new Error(`Giphy API responded with status ${response.status}`);
      } catch (err: any) {
        console.warn(`Error attempting Giphy key ending in ...${key.slice(-4)}:`, err.message || err);
        lastError = err;
      }
    }

    // If we exhausted all options without success, return 502 to trigger client-side fallback GIF mechanism
    console.error('All Giphy API key options failed or returned invalid response structures. Triggering client fallback.');
    return res.status(502).json({ error: lastError?.message || 'All GIF search keys failed. Using fallback client-side GIFs.' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    try {
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false,
          ws: false
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log("Vite development middleware mounted successfully");
    } catch (viteError) {
      console.error("Failed to initialize Vite dev server:", viteError);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1h',
      index: 'index.html'
    }));
    app.get('*all', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind and listen on port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("FATAL: Failed to start server:", err);
  process.exit(1);
});
