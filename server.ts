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
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
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

  // Giphy proxy endpoint to secure API keys
  app.get('/api/gifs', requireAuth, async (req, res) => {
    try {
      const { q } = req.query;
      const apiKey = process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC';
      
      let url = `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20&rating=g`;
      if (q && typeof q === 'string' && q.trim()) {
        url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&limit=20&rating=g`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Giphy API responded with status ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching GIFs from proxy:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch GIFs' });
    }
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
