
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import gsap from 'gsap';
import { Mail, Lock, User, ArrowRight, ChevronLeft, Lightbulb, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Camera, MapPin, Landmark } from 'lucide-react';
import { Button } from './Button';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';
import { StorageService } from '../services/storageService';

interface AuthScreenProps {
  onComplete: (role: UserRole, email?: string) => void;
}

type AuthView = 'welcome' | 'auth' | 'forgotPassword';

// --- UI COMPONENTS ---

const InputField = ({ 
  icon: Icon, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = false,
  autoComplete
}: any) => (
  <div className="relative group">
     <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
        <Icon size={20} className="text-zinc-400 group-focus-within:text-brand-primary transition-colors" />
     </div>
     <input 
        type={type} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="w-full h-14 sm:h-16 pl-14 pr-5 bg-white border border-zinc-100 rounded-[24px] text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/5 transition-all duration-200 font-medium text-base shadow-sm"
     />
  </div>
);

const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder = "Password",
  autoComplete
}: { value: string, onChange: (val: string) => void, placeholder?: string, autoComplete?: string }) => {
  const [show, setShow] = useState(false);
  return (
      <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Lock size={20} className="text-zinc-400 group-focus-within:text-brand-primary transition-colors" />
          </div>
          <input 
              type={show ? "text" : "password"} 
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              required
              autoComplete={autoComplete}
              className="w-full h-14 sm:h-16 pl-14 pr-14 bg-white border border-zinc-100 rounded-[24px] text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/5 transition-all duration-200 font-medium text-base shadow-sm"
          />
          <button 
              type="button"
              onClick={() => setShow(!show)}
              className="absolute inset-y-0 right-0 pr-5 flex items-center text-zinc-400 hover:text-zinc-900 cursor-pointer z-20 focus:outline-none"
          >
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
      </div>
  );
};

export const AuthScreen: React.FC<AuthScreenProps> = React.memo(({ onComplete }) => {
  const [view, setView] = useState<AuthView>('welcome');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.INVESTOR);
  
  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const navigateTo = (newView: AuthView, loginState?: boolean) => {
    clearMessages();
    if (loginState !== undefined) setIsLogin(loginState);
    setView(newView);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const attemptProfileSetup = async (userId: string, userEmail: string) => {
      let avatarUrl = undefined;
      // Ensure we have a session before trying to upload
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && avatarFile) {
          try {
             const uploadedUrl = await StorageService.uploadProfilePicture(avatarFile, userId);
             if (uploadedUrl) avatarUrl = uploadedUrl;
          } catch (e) {
             console.error("Avatar upload failed, continuing with profile setup", e);
          }
      }

      // Explicitly write profile data via the API to ensure consistency
      // This acts as a fallback if the DB Trigger fails or has latency
      await StorageService.completeUserProfile(userId, userEmail, selectedRole, {
          name: name || userEmail.split('@')[0],
          title: title, 
          location: location, 
          avatarUrl: avatarUrl
      });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();
    
    // MOCK MODE HANDLER: Prevent network call if database is unavailable
    if (StorageService.isMockMode()) {
        setTimeout(() => {
            onComplete(UserRole.INVESTOR, email || 'demo@connectup.com');
            setIsLoading(false);
        }, 800);
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw new Error("Incorrect email or password.");
        if (data.user) {
            const role = await StorageService.checkUserRole(data.user.id);
            if (role) {
                onComplete(role, email);
            } else {
                navigateTo('auth', false); 
            }
        }
    } catch (err: any) {
        setErrorMsg(err.message || "Login failed");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      clearMessages();

      // MOCK MODE HANDLER
      if (StorageService.isMockMode()) {
          setTimeout(() => {
              onComplete(selectedRole, email || 'demo@connectup.com');
              setIsLoading(false);
          }, 800);
          return;
      }

      try {
          // SQL TRIGGER COMPATIBILITY:
          // The `data` object here corresponds to `raw_user_meta_data` in Postgres.
          // The trigger I provided looks for: 'full_name', 'role', 'title', 'location'.
          const metadata = {
              full_name: name,
              role: selectedRole, // FOUNDER or INVESTOR
              title: title,
              location: location,
              subscription_tier: 'Free'
          };

          const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: { data: metadata }
          });

          if (error) throw error;
          
          if (data.user && data.session) {
              // Session active: We can safely write to DB and Upload files
              await attemptProfileSetup(data.user.id, email);
              onComplete(selectedRole, email);
          } else if (data.user && !data.session) {
              // No session: Email confirmation likely required. 
              setSuccessMsg("Account created! Please check your email to confirm.");
          }

      } catch (err: any) {
          console.error("Signup Flow Error:", err);
          setErrorMsg(err.message || "Signup failed");
      } finally {
          setIsLoading(false);
      }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      clearMessages();
      
      if (StorageService.isMockMode()) {
          setTimeout(() => {
              setSuccessMsg("Password reset email sent (Mock Mode).");
              setIsLoading(false);
          }, 800);
          return;
      }

      try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin,
          });
          if (error) throw error;
          setSuccessMsg("Password reset email sent.");
      } catch (err: any) {
          setErrorMsg(err.message || "Failed to send reset email.");
      } finally {
          setIsLoading(false);
      }
  };

  // --- Background Animation ---

  const renderBackground = () => (
    <div className="absolute inset-0 z-0 bg-black overflow-hidden pointer-events-none">
        {/* Deep Atmospheric Gradients */}
        <div className="absolute inset-0 bg-[#0A0A0A]"></div>
        <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-brand-primary/20 rounded-full blur-[120px]"
        />
        <motion.div 
            animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-500/10 rounded-full blur-[100px]"
        />
        
        {/* Subtle Noise/Grain */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    </div>
  );

  const renderCard = (children: React.ReactNode, title: string, subtitle?: string, onBack?: () => void) => (
      <div className="h-full w-full relative z-10 flex flex-col items-center justify-center px-6 overflow-y-auto py-20">
          {onBack && (
              <button 
                  onClick={onBack}
                  className="absolute top-12 left-8 flex items-center text-white/50 hover:text-white transition-colors font-medium text-sm tracking-tight group z-20"
              >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mr-3 border border-white/10 group-hover:bg-white/10 transition-all backdrop-blur-md">
                      <ChevronLeft size={18} />
                  </div>
                  Back
              </button>
          )}

          <div className="w-full max-w-sm flex flex-col items-center">
              <div className="text-center mb-12 w-full">
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-display font-bold tracking-tighter text-white mb-4"
                  >
                    {title}
                  </motion.h2>
                  {subtitle && (
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-white/40 font-medium leading-tight max-w-[280px] mx-auto"
                    >
                        {subtitle}
                    </motion.p>
                  )}
              </div>
              <div className="w-full">
                  {children}
              </div>
          </div>
      </div>
  );

  // --- VIEW RENDERING ---

  const welcomeRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLHeadingElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === 'welcome' && welcomeRef.current) {
      const ctx = gsap.context(() => {
        // Entrance Timeline
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
        
        tl.fromTo(bgRef.current, 
          { scale: 1.1, opacity: 0 }, 
          { scale: 1, opacity: 1, duration: 2 }
        )
        .fromTo(logoRef.current, 
          { y: 50, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 1.2 }, 
          "-=1.2"
        )
        .fromTo(buttonsRef.current?.children || [], 
          { y: 50, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 1, stagger: 0.2 }, 
          "-=0.8"
        );

        // Floating animation for the logo
        gsap.to(logoRef.current, {
          y: "-=15",
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }, welcomeRef);

      return () => ctx.revert();
    }
  }, [view]);

  if (view === 'welcome') {
    return (
      <div ref={welcomeRef} className="h-full w-full relative flex flex-col items-center justify-center overflow-hidden bg-black text-white">
         {/* Immersive Background */}
         <div ref={bgRef} className="absolute inset-0 overflow-hidden pointer-events-none">
             <img 
               src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=2000" 
               className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
               alt=""
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-black"></div>
             
             {/* Dynamic Light Orbs */}
             <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-primary/10 rounded-full blur-[120px]"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px]"></div>
         </div>
         
         <div className="relative z-10 w-full max-w-lg px-10 flex flex-col items-center">
             {/* Logo Section */}
             <div className="mb-24 md:mb-32 py-4">
                 <h1 ref={logoRef} className="text-6xl md:text-8xl font-display font-bold tracking-tighter leading-none select-none">
                    Connect<span className="text-brand-primary">Up.</span>
                 </h1>
             </div>

             {/* Action Buttons */}
             <div ref={buttonsRef} className="w-full max-w-sm space-y-5">
                 <motion.button 
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigateTo('auth', false)}
                    className="w-full h-16 bg-white rounded-2xl text-black font-bold text-lg transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center group relative overflow-hidden"
                 >
                    <span className="relative z-10 flex items-center">
                        Create Account
                        <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-500" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                 </motion.button>
                 
                 <motion.button 
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigateTo('auth', true)}
                    className="w-full h-16 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl text-white font-bold text-lg transition-all flex items-center justify-center group"
                 >
                    Sign In
                 </motion.button>
             </div>

             {/* Micro-copy */}
             <div className="mt-24 opacity-20 hover:opacity-100 transition-opacity duration-1000">
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Founded in Excellence</p>
             </div>
         </div>
      </div>
    );
  }

  if (view === 'auth') {
      return (
        <div className="h-full w-full relative overflow-hidden bg-black">
            {renderBackground()}
            {renderCard(
                <AnimatePresence mode="wait">
                    {isLogin ? (
                        <motion.form 
                            key="login"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            onSubmit={handleLoginSubmit} 
                            className="space-y-4"
                        >
                            {errorMsg && (
                                <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-xs font-bold flex items-center border border-red-500/20 backdrop-blur-md">
                                    <AlertCircle size={16} className="mr-2" /> {errorMsg}
                                </div>
                            )}
                            <div className="space-y-3">
                                <InputField icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} required autoComplete="email" className="!bg-white/5 !border-white/10 !text-white !placeholder-white/20" />
                                <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
                            </div>
                            
                            <div className="flex justify-end">
                                <button type="button" onClick={() => navigateTo('forgotPassword')} className="text-xs font-bold text-white/30 hover:text-white transition-colors">
                                    Forgot Password?
                                </button>
                            </div>
              
                            <div className="pt-4">
                                <Button fullWidth size="lg" disabled={isLoading} className="shadow-2xl h-14 text-lg bg-brand-primary !text-black hover:bg-brand-primary/90 rounded-2xl font-bold">
                                    {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                                </Button>
                            </div>
                            <div className="text-center pt-4">
                                <button type="button" onClick={() => setIsLogin(false)} className="text-sm font-bold text-white/40 hover:text-white transition-colors">
                                    New here? <span className="text-brand-primary">Create an account</span>
                                </button>
                            </div>
                        </motion.form>
                    ) : (
                        <motion.form 
                            key="signup"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            onSubmit={handleSignupSubmit} 
                            className="space-y-4"
                        >
                            {errorMsg && (
                                <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-xs font-bold flex items-center border border-red-500/20 backdrop-blur-md">
                                    <AlertCircle size={16} className="mr-2" /> {errorMsg}
                                </div>
                            )}
                            {successMsg && (
                                <div className="p-4 bg-green-500/10 text-green-400 rounded-2xl text-xs font-bold flex items-center border border-green-500/20 backdrop-blur-md">
                                    <CheckCircle2 size={16} className="mr-2" /> {successMsg}
                                </div>
                            )}

                            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 mb-6">
                                <button type="button" onClick={() => setSelectedRole(UserRole.FOUNDER)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRole === UserRole.FOUNDER ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>Founder</button>
                                <button type="button" onClick={() => setSelectedRole(UserRole.INVESTOR)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRole === UserRole.INVESTOR ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>Investor</button>
                            </div>
              
                            <div className="space-y-3">
                                <InputField icon={User} placeholder="Full Name" value={name} onChange={setName} required autoComplete="name" />
                                <InputField icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} required autoComplete="email" />
                                <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
                            </div>
              
                            <div className="pt-4">
                                <Button fullWidth size="lg" disabled={isLoading} className="shadow-2xl h-14 text-lg bg-brand-primary !text-black hover:bg-brand-primary/90 rounded-2xl font-bold">
                                    {isLoading ? <Loader2 className="animate-spin" /> : 'Join ConnectUp'}
                                </Button>
                            </div>
                            <div className="text-center pt-4">
                                <button type="button" onClick={() => setIsLogin(true)} className="text-sm font-bold text-white/40 hover:text-white transition-colors">
                                    Already a member? <span className="text-brand-primary">Sign in</span>
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>,
                isLogin ? "Welcome Back" : "Join the Elite",
                isLogin ? "Sign in to continue your journey." : undefined,
                () => navigateTo('welcome')
            )}
        </div>
      );
  }

  if (view === 'forgotPassword') {
      return (
        <div className="h-full w-full relative overflow-hidden bg-black">
            {renderBackground()}
            {renderCard(
                <form onSubmit={handleForgotPassword} className="space-y-4">
                    {errorMsg && (
                        <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-xs font-bold flex items-center border border-red-500/20 backdrop-blur-md">
                            <AlertCircle size={16} className="mr-2" /> {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-4 bg-green-500/10 text-green-400 rounded-2xl text-xs font-bold flex items-center border border-green-500/20 backdrop-blur-md">
                            <CheckCircle2 size={16} className="mr-2" /> {successMsg}
                        </div>
                    )}
                    <InputField 
                       icon={Mail} 
                       type="email" 
                       placeholder="Email Address" 
                       value={email} 
                       onChange={setEmail} 
                       required
                    />
                    <div className="pt-4">
                        <Button fullWidth size="lg" disabled={isLoading} className="h-14 bg-brand-primary text-black hover:bg-brand-primary/90 rounded-2xl font-bold">
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
                        </Button>
                    </div>
                </form>,
                "Reset Access",
                "Enter your email to recover your account.",
                () => navigateTo('auth', true)
            )}
        </div>
      );
  }

  return null;
});

export default AuthScreen;
