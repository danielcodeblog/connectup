import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Setup basic supabase client for auth verification
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Middleware to verify simple auth for backend endpoints
  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    
    try {
      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Verify JWT properly with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
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
  app.post('/api/verify-payment', requireAuth, async (req, res) => {
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
        const adminSupabase = createClient(
          process.env.VITE_SUPABASE_URL || '', 
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

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
          plan_name: 'pro',
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

  // Email API endpoint with basic security check
  app.post('/api/send-email', requireAuth, async (req, res) => {
    const { to, subject, text, html } = req.body;
    const user = (req as any).user;

    // Simple security: Log who is sending what to prevent untraceable spam
    console.log(`User ${user.id} (${user.email || 'unknown email'}) is sending an email to ${to}`);
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        return res.status(500).json({ error: 'SMTP configuration missing' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    try {
      await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
        to,
        subject,
        text,
        html,
      });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  // Giphy proxy endpoint to secure API keys with robust cascade and fallback
  app.get('/api/gifs', requireAuth, async (req, res) => {
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
