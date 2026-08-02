import React, { useState } from 'react';
import { motion } from "motion/react";
import { Mail, Lock, ShieldCheck, KeyRound, AlertCircle, Loader2, ChevronLeft, Shield, Eye, EyeOff } from 'lucide-react';
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
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = false,
  autoComplete,
  label
}: any) => (
  <div className="relative group">
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

const SideVisual = ({ className = "md:col-span-7" }: { className?: string }) => {
  return (
    <div className={`hidden md:flex ${className} relative flex-col justify-center items-center overflow-hidden h-full select-none bg-[#FDFCF8] transition-colors duration-500`}>
       <div className="relative z-10 w-full h-full">
          <img 
             src={authImage} 
             className="w-full h-full object-cover" 
             alt="ConnectUp Admin Collage"
             referrerPolicy="no-referrer"
          />
       </div>
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    </div>
  );
};

export const AdminAuthScreen: React.FC<AdminAuthScreenProps> = ({ onComplete, onBackHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecurityKey, setAdminSecurityKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLocked = StorageService.getAdminSignupDisabled();

  const MASTER_ADMIN_EMAILS = ['admin@connectup.com', 'danielsamuel1662@gmail.com', 'wavy7551@gmail.com'];

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
    const isMasterEmail = MASTER_ADMIN_EMAILS.includes(cleanEmail);

    if (isLocked) {
      const isMasterPass = password === 'admin123' || adminSecurityKey === 'admin123' || adminSecurityKey === 'admin';

      if (!isMasterEmail && !isMasterPass) {
        setErrorMsg('🔒 Public Admin Portal Access has been restricted. Only authorized master administrators can log in.');
        setIsLoading(false);
        return;
      }
    }

    if (StorageService.isMockMode()) {
      if (isMasterEmail || password === 'admin123' || adminSecurityKey === 'admin123' || adminSecurityKey === 'admin') {
        onComplete(UserRole.ADMIN, cleanEmail);
      } else {
        setErrorMsg('🔒 Access Denied: This account does not have administrator privileges.');
      }
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: inputEmail,
        password
      });

      if (error || !data.user) {
        // Fallback for master default credentials in dev if Supabase user is not yet created
        if (isMasterEmail && (password === 'admin123' || adminSecurityKey === 'admin123' || adminSecurityKey === 'admin')) {
          onComplete(UserRole.ADMIN, cleanEmail);
          setIsLoading(false);
          return;
        }
        setErrorMsg(error?.message || 'Invalid administrator credentials or password.');
        setIsLoading(false);
        return;
      }

      // Check if logged-in user is actually an admin
      const userRole = await StorageService.checkUserRole(data.user.id);
      const authenticatedEmail = data.user.email?.toLowerCase() || '';
      const isAdmin = userRole === UserRole.ADMIN || MASTER_ADMIN_EMAILS.includes(authenticatedEmail);

      if (!isAdmin) {
        // BLOCK NON-ADMIN USER
        await supabase.auth.signOut();
        setErrorMsg(`🔒 Access Denied: Account "${authenticatedEmail}" is a regular user and is blocked from admin login.`);
        setIsLoading(false);
        return;
      }

      onComplete(UserRole.ADMIN, authenticatedEmail);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white relative overflow-y-hidden font-sans">
      <div className="w-full h-screen overflow-hidden flex flex-col md:grid md:grid-cols-10 relative z-10">
        
        {/* Left Column (Form Controls) */}
        <div className="col-span-12 md:col-span-5 p-10 sm:p-14 lg:p-18 flex flex-col justify-between flex-1 h-full overflow-y-auto no-scrollbar bg-white md:border-r md:border-zinc-100 shadow-[0_24px_60px_rgba(0,0,0,0.05)]">
           
           {/* Header */}
           <div className="flex items-center justify-center mb-6 select-none">
               <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  <ShieldCheck size={14} />
                  <span>Admin Portal</span>
               </div>
           </div>

           <div className="flex-1 flex flex-col justify-center my-auto">
              <motion.form 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleAdminLoginSubmit} 
                  className="w-full max-w-sm mx-auto"
              >
                  <div className="mb-6 text-left">
                    <h2 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-zinc-900 leading-tight">
                      Admin Sign In
                    </h2>
                  </div>

                  {isLocked && (
                    <div className="p-3.5 bg-amber-500/10 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-2 border border-amber-500/30 mb-4">
                      <Lock size={16} className="shrink-0 text-amber-600" />
                      <span>🔒 Public Admin Sign-ups are currently turned OFF.</span>
                    </div>
                  )}

                  {errorMsg && (
                      <div className="p-4 bg-red-500/10 text-red-600 rounded-lg text-xs font-semibold flex items-center border border-red-200 mb-4">
                          <AlertCircle size={16} className="mr-2 shrink-0" /> {errorMsg}
                      </div>
                  )}

                  <div className="space-y-4">
                      <InputField 
                        type="email" 
                        placeholder="admin@connectup.com" 
                        value={email} 
                        onChange={setEmail} 
                        autoComplete="email" 
                        label="Admin Email Address" 
                      />
                      <PasswordInput 
                        value={password} 
                        onChange={setPassword} 
                        autoComplete="current-password" 
                        label="Admin Password" 
                      />
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      <button 
                         type="submit"
                         disabled={isLoading}
                         className="px-10 py-4 bg-[#FACC15] hover:bg-[#FACC15]/90 text-zinc-950 font-black rounded-full transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(250,204,21,0.2)] hover:shadow-[0_6px_16px_rgba(250,204,21,0.3)] active:scale-[0.98] text-base w-full flex items-center justify-center gap-2 select-none disabled:opacity-50 border border-[#EAB308]/40"
                      >
                          {isLoading ? <Loader2 className="animate-spin size-4" /> : 'Sign In as Administrator'}
                      </button>
                  </div>



                  <div className="mt-8 text-center text-xs">
                      <button 
                         type="button" 
                         onClick={onBackHome} 
                         className="font-bold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                      >
                         ← Return to Main Site
                      </button>
                  </div>
              </motion.form>
           </div>


        </div>

        {/* Right Column (Side Visual) */}
        <SideVisual className="md:col-span-5" />

      </div>
    </div>
  );
};
