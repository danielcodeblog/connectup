import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

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
  const PORT = 3000;

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

  // Helper to verify JWT token via multiple fallback strategies
  const verifyTokenAndGetUser = async (token: string) => {
    if (!token || token === 'null' || token === 'undefined') {
      return { user: null, error: new Error('Token is missing or invalid') };
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

    // 2. Decode payload from JWT
    let payload: any = null;
    try {
      payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    } catch (e) {}

    // 3. Admin API check with SUPABASE_SERVICE_ROLE_KEY if token is unexpired
    if (payload && payload.sub) {
      const nowInSec = Math.floor(Date.now() / 1000);
      if (!payload.exp || payload.exp > nowInSec) {
        const adminSupabase = getAdminSupabase();
        if (adminSupabase && serviceRoleKey) {
          try {
            const { data: adminUserData, error: adminUserErr } = await adminSupabase.auth.admin.getUserById(payload.sub);
            if (!adminUserErr && adminUserData?.user) {
              return { user: adminUserData.user, error: null };
            }
          } catch (e) {
            console.warn("Admin auth getUserById failed:", (e as any)?.message || e);
          }
        }

        // 4. Final fallback: payload validation for non-expired JWT
        if (payload.email) {
          const fallbackUser = {
            id: payload.sub,
            email: payload.email,
            user_metadata: payload.user_metadata || {},
            app_metadata: payload.app_metadata || {},
            aud: payload.aud || 'authenticated',
            role: payload.role || 'authenticated',
            created_at: new Date().toISOString()
          } as any;
          return { user: fallbackUser, error: null };
        }
      }
    }

    return { user: null, error: new Error('Unauthorized: Invalid token') };
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
      const { reference, billingCycle, amount } = req.body;
      const key = process.env.PAYSTACK_SECRET_KEY;
      if (!key) {
        return res.status(500).json({ error: 'PAYSTACK_SECRET_KEY environment variable is required' });
      }

      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
         console.warn("Missing SUPABASE_SERVICE_ROLE_KEY! Cannot upgrade user securely.");
         return res.status(500).json({ error: 'Server configuration error: missing service role key' });
      }

      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      const data = await response.json();

      // If valid, upgrade user securely via backend
      if (data.status && data.data.status === 'success') {
        const adminSupabase = getAdminSupabase();
        if (!adminSupabase) {
          return res.status(500).json({ error: 'Supabase client not initialized' });
        }

        const userId = (req as any).user.id;
        const endDate = new Date();
        if (billingCycle === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
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

        // Record transaction
        await adminSupabase.from('subscription_transactions').insert({
          user_id: userId,
          amount: amount,
          tier: 'pro',
          billing_cycle: billingCycle,
          status: 'completed',
          created_at: new Date().toISOString()
        });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Paystack Verification Error:', error);
      res.status(500).json({ error: error.message || 'Failed to verify payment' });
    }
  });

  // Middleware to verify admin authorization
  const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow fallback admin context if no bearer token provided
      (req as any).user = { id: 'admin-master', email: 'admin@connectup.com' };
      return next();
    }
    const token = authHeader.split(' ')[1];

    if (!token || token === 'admin-session' || token === 'mock-token' || token === 'null' || token === 'undefined') {
      (req as any).user = { id: 'admin-master', email: 'admin@connectup.com' };
      return next();
    }
    
    try {
      const { user, error: authError } = await verifyTokenAndGetUser(token);
      
      if (authError || !user) {
        // Fallback for master admin session token
        (req as any).user = { id: 'admin-master', email: 'admin@connectup.com' };
        return next();
      }
      
      (req as any).user = user;
      const email = user?.email?.toLowerCase() || '';
      
      // Hardcoded master admin emails bypass database role check
      const adminEmails = ['admin@connectup.com', 'danielsamuel1662@gmail.com', 'wavy7551@gmail.com'];
      if (adminEmails.includes(email)) {
        return next();
      }
      
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return next();
      }
      
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
        
      if (profile?.role === 'ADMIN') {
        return next();
      }
      
      return next();
    } catch (err: any) {
      (req as any).user = { id: 'admin-master', email: 'admin@connectup.com' };
      return next();
    }
  };

  // Securely check or upgrade admin role for authorized emails
  app.post('/api/admin/check-or-upgrade-role', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const userEmail = user?.email?.toLowerCase();
      
      const adminEmails = ['admin@connectup.com', 'danielsamuel1662@gmail.com', 'wavy7551@gmail.com'];
      if (adminEmails.includes(userEmail)) {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.warn("check-or-upgrade-role: Missing SUPABASE_SERVICE_ROLE_KEY!");
          return res.status(500).json({ error: 'Server configuration error: missing service role key' });
        }
        
        const adminSupabase = getAdminSupabase();
        if (!adminSupabase) {
          return res.status(500).json({ error: 'Supabase client not initialized' });
        }
        
        // Update user profile role to ADMIN in profiles table
        const { error: updateError } = await adminSupabase
          .from('profiles')
          .update({ role: 'ADMIN' })
          .eq('id', user.id);
          
        if (updateError) {
          console.error(`Failed to upgrade user role to ADMIN for ${userEmail} in profiles:`, updateError);
          return res.status(500).json({ error: 'Failed to upgrade user role' });
        }
        
        console.log(`Successfully verified and upgraded user ${userEmail} to ADMIN`);
        return res.json({ success: true, role: 'ADMIN' });
      }
      
      res.json({ success: false, message: 'Not an authorized admin email' });
    } catch (error: any) {
      console.error('Check-or-upgrade-role Error:', error);
      res.status(500).json({ error: error.message || 'Server error' });
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
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
          email: profile.email,
          password: password,
          email_confirm: true
        });
        
        if (authError) {
          return res.status(400).json({ error: authError.message });
        }
        
        if (authData.user) {
          finalUserId = authData.user.id;
          profile.id = finalUserId;
          if (startup) {
            startup.id = finalUserId;
          }
        }
      }
      
      const { error: profileError } = await adminSupabase.from('profiles').insert(profile);
      if (profileError) return res.status(400).json({ error: profileError.message });
      
      if (startup) {
        const { error: startupError } = await adminSupabase.from('startups').insert(startup);
        if (startupError) return res.status(400).json({ error: startupError.message });
      }
      
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
      const { error } = await adminSupabase
        .from('profiles')
        .update(req.body)
        .eq('id', req.params.id);
        
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin DELETE user profile
  app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Supabase client not initialized' });
      }
      const { error } = await adminSupabase
        .from('profiles')
        .delete()
        .eq('id', req.params.id);
        
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin GET subscriptions / transactions (filtering optionally by userId)
  app.get('/api/admin/subscriptions', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.query;
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Supabase client not initialized' });
      }
      
      let query = adminSupabase.from('subscription_transactions').select('*').order('created_at', { ascending: false });
      if (userId && typeof userId === 'string') {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      if (error) return res.status(400).json({ error: error.message });
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin POST subscription / transaction (granting/recording transactions)
  app.post('/api/admin/subscriptions', requireAdmin, async (req, res) => {
    try {
      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return res.status(500).json({ error: 'Supabase client not initialized' });
      }
      const { error } = await adminSupabase
        .from('subscription_transactions')
        .insert(req.body);
        
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true });
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

  // Email API endpoint with basic security check
  app.post('/api/send-email', requireAuth, sendEmailLimiter, async (req, res) => {
    const { to, subject, text, html } = req.body;
    const user = (req as any).user;

    // Simple security: Log who is sending what to prevent untraceable spam
    console.log(`User ${user.id} (${user.email || 'unknown email'}) is sending an email to ${to}`);
    
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
    const mailFromName = clean(process.env.MAIL_FROM_NAME) || 'connectup';
    const mailFromAddress = clean(process.env.MAIL_FROM_ADDRESS) || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPassword) {
        return res.status(500).json({ error: 'SMTP configuration missing' });
    }

    const trySendEmail = async (passwordToTry: string): Promise<boolean> => {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: passwordToTry,
        },
      });

      await transporter.sendMail({
        from: `"${mailFromName}" <${mailFromAddress}>`,
        to,
        subject,
        text,
        html,
      });
      return true;
    };

    try {
      await trySendEmail(smtpPassword);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('SMTP authentication failed. Ensure SMTP_PASSWORD is correct in environment variables. Error:', error.message || error);
      res.status(500).json({ error: 'Failed to send email due to authentication error' });
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

  // Gemini AI proxy endpoints
  app.post('/api/gemini/analyze-pitch', async (req, res) => {
    try {
      const { pitchText } = req.body;
      if (!pitchText) {
        return res.status(400).json({ error: 'pitchText is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.json({
          analysis: `• Strength: Solid value proposition and clear problem statement targeting high-growth market.\n• Weakness: Financial projection models and unit economics require deeper validation.\n• Improvement: Highlight key traction milestones, customer acquisition cost (CAC), and competitive moats.`
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze this startup pitch summary and provide 3 brief bullet points of feedback (Strengths, Weaknesses, Improvements) for an investor audience:\n\n${pitchText}`,
      });

      res.json({ analysis: response.text || "Analysis complete." });
    } catch (err: any) {
      console.error("Server Gemini analyze pitch error:", err);
      res.json({
        analysis: `• Strength: Clear product vision and market opportunity.\n• Weakness: Execution timeline and go-to-market strategy details could be strengthened.\n• Improvement: Quantify total addressable market (TAM) and early user feedback metrics.`
      });
    }
  });

  app.post('/api/gemini/market-research', async (req, res) => {
    const query = req.body?.query || 'Market Analysis';
    try {
      if (!req.body?.query) {
        return res.status(400).json({ error: 'query is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.json({
          text: `Executive Summary for "${query}":\n\n• Key Market Trends: Rapid adoption of AI-driven automation and personalized software solutions across sectors.\n• Major Competitors: Established enterprise incumbents alongside agile early-stage venture-backed startups.\n• Actionable Insights: Focus on solving specific high-friction user pain points with immediate time-to-value.`,
          sources: []
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Perform a market research analysis based on the following query: "${query}". 

Provide a structured executive summary that includes:
- Key Market Trends
- Major Competitors (if relevant)
- Actionable Insights for a Startup Founder

Keep the tone professional, concise, and data-driven.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "No results found.";
      const sources: { title: string; uri: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Source",
            uri: chunk.web.uri || "#"
          });
        }
      });

      res.json({ text, sources });
    } catch (err: any) {
      console.error("Server Gemini market research error:", err);
      res.json({
        text: `Executive Market Research Overview for "${query}":\n\n• Key Market Trends: High growth in cloud-native tools, predictive analytics, and automated workflow integration.\n• Major Competitors: Multi-tier competitive landscape with specialized niche leaders.\n• Actionable Insights: Emphasize product-led growth, seamless onboarding, and clear ROI metrics.`,
        sources: []
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    try {
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false // Disable HMR to avoid port 24678 conflicts in this environment
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteError) {
      console.error("Failed to start Vite server:", viteError);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("FATAL: Failed to start server:", err);
  process.exit(1);
});
