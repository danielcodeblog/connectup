import React, { useState } from 'react';
import { motion } from "motion/react";
import { Mail, ChevronLeft, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';
import { StorageService } from '../services/storageService';
import authImage from '../src/assets/images/com.png';

interface AdminAuthScreenProps {
  onComplete: (role: UserRole, email?: string) => void;
  onBackHome: () => void;
}

const InputField = ({ 
  icon: Icon, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = false,
  autoComplete,
  className = "",
  label
}: any) => (
  <div className={`relative group ${className}`}>
     {label && <label className="block text-sm font-medium text-zinc-500 mb-1.5 ml-1">{label}</label>}
     <input 
        type={type} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="w-full h-16 px-6 bg-white/5 backdrop-blur-lg border border-zinc-800 hover:border-yellow-400 rounded-sm text-zinc-900 placeholder-zinc-400 focus:bg-white/20 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all duration-200 font-medium text-lg shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
     />
  </div>
);

const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder = "Password",
  autoComplete,
  label
}: { value: string, onChange: (val: string) => void, placeholder?: string, autoComplete?: string, label?: string }) => {
  const [show, setShow] = useState(false);
  return (
      <div className="relative group">
          {label && <label className="block text-sm font-medium text-zinc-500 mb-1.5 ml-1">{label}</label>}
          <div className="relative">
              <input 
                  type={show ? "text" : "password"} 
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  required
                  autoComplete={autoComplete}
                  className="w-full h-16 pl-6 pr-12 bg-white/5 backdrop-blur-lg border border-zinc-800 hover:border-yellow-400 rounded-sm text-zinc-900 placeholder-zinc-400 focus:bg-white/20 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all duration-200 font-medium text-lg shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
              />
              <button 
                  type="button" 
                  onClick={() => setShow(!show)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer z-20 focus:outline-none"
              >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
          </div>
      </div>
  );
};

const SideVisual = ({ className = "md:col-span-5" }: { className?: string }) => {
  return (
    <div className={`hidden md:flex ${className} relative flex-col justify-center items-center overflow-hidden h-full select-none bg-[#FDFCF8] transition-colors duration-500`}>
       <div className="relative z-10 w-full h-full">
          <img 
             src={authImage} 
             className="w-full h-full object-cover" 
             alt="ConnectUp Collage"
             referrerPolicy="no-referrer"
          />
       </div>
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    </div>
  );
};

export const AdminAuthScreen: React.FC<AdminAuthScreenProps> = ({ onComplete, onBackHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdminLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const inputEmail = email.trim();
    if (!inputEmail) {
      setErrorMsg('Please enter an administrator email address.');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setErrorMsg('Please enter an administrator password.');
      setIsLoading(false);
      return;
    }

    const cleanEmail = inputEmail.toLowerCase();

    try {
      // 1. Try server-side admin login first (which validates credentials and verifies profiles.role === 'ADMIN' in DB)
      try {
        const loginRes = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password })
        });
        const loginData = await loginRes.json().catch(() => ({}));
        if (loginRes.ok && loginData?.token) {
          localStorage.setItem('connectup_admin_session_token', loginData.token);
          localStorage.setItem('connectup_logged_in', 'true');
          onComplete(UserRole.ADMIN, cleanEmail);
          setIsLoading(false);
          return;
        } else if (loginRes.status === 403) {
          setErrorMsg(loginData.error || 'Access Denied: Your account does not have an ADMIN role in the database.');
          setIsLoading(false);
          return;
        }
      } catch (srvErr) {
        console.warn("Direct server admin login check:", srvErr);
      }

      // 2. Direct Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: inputEmail,
        password
      });

      if (error || !data?.user) {
        setErrorMsg(error?.message || 'Invalid administrator email or password.');
        setIsLoading(false);
        return;
      }

      // 3. Strictly check role from database table alone
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      const userRole = (dbProfile?.role || '').toUpperCase();

      if (userRole !== 'ADMIN') {
        await supabase.auth.signOut();
        setErrorMsg(`Access Denied: Account "${cleanEmail}" does not have the ADMIN role in the database.`);
        setIsLoading(false);
        return;
      }

      if (data.session?.access_token) {
        localStorage.setItem('connectup_admin_session_token', data.session.access_token);
      }
      localStorage.setItem('connectup_logged_in', 'true');
      onComplete(UserRole.ADMIN, cleanEmail);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white relative overflow-y-hidden">
      {/* Main Card */}
      <div className="w-full h-screen overflow-hidden flex flex-col md:grid md:grid-cols-10 relative z-10">
        
        {/* Left Column (Form Controls) */}
        <div className="col-span-12 md:col-span-5 p-6 sm:p-14 lg:p-18 flex flex-col justify-between flex-1 h-full overflow-y-auto md:overflow-y-hidden no-scrollbar bg-white md:border-r md:border-zinc-100 shadow-[0_24px_60px_rgba(0,0,0,0.05)]">
          
          {/* Logo & Header */}
          <div className="flex items-center justify-between mb-8 select-none">
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer group"
            >
              <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
            <div className="flex items-center">
              <span className="font-display font-black text-xl tracking-tight text-zinc-900 blur-[3px]">
                Connect<span className="text-brand-primary">Up.</span>
              </span>
            </div>
            <div className="w-12" />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <motion.form 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleAdminLoginSubmit} 
              className="w-full max-w-sm mx-auto"
            >
              {/* Greetings */}
              <div className="mb-8 text-left">
                <h2 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-zinc-900 leading-tight">
                  Admin Sign In
                </h2>
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-500/10 text-red-600 dark:text-red-400 rounded-none text-xs font-semibold flex items-center border border-red-200/50 dark:border-red-800/30 mb-4">
                  <AlertCircle size={16} className="mr-2 shrink-0" /> {errorMsg}
                </div>
              )}

              <div className="space-y-4">
                <InputField 
                  icon={Mail} 
                  type="email" 
                  placeholder="admin@connectup.com" 
                  value={email} 
                  onChange={setEmail} 
                  required 
                  autoComplete="email" 
                  label="Admin Work Email" 
                />
                <PasswordInput 
                  value={password} 
                  onChange={setPassword} 
                  autoComplete="current-password" 
                  label="Password" 
                />
              </div>

              <div className="mt-14 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <Button 
                  type="submit"
                  disabled={isLoading}
                  variant="primary"
                  size="lg"
                  fullWidth={true}
                  className=""
                >
                  {isLoading ? <Loader2 className="animate-spin size-4" /> : 'Sign In'}
                </Button>
              </div>
            </motion.form>
          </div>

        </div>

        {/* Right Column - SideVisual */}
        <SideVisual className="md:col-span-5 hidden md:flex" />

      </div>
    </div>
  );
};

export default AdminAuthScreen;
