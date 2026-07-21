
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import gsap from 'gsap';
import { Mail, Lock, User, ArrowRight, ChevronLeft, ChevronRight, Lightbulb, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Camera, MapPin, Landmark } from 'lucide-react';
import { Button } from './Button';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';
import { StorageService } from '../services/storageService';
import authImage from '../src/assets/images/com.png';

interface AuthScreenProps {
  onComplete: (role: UserRole, email?: string) => void;
  onViewLegal?: (type: 'privacy' | 'terms') => void;
  onBackHome?: () => void;
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

// SideVisual for Laptop/Desktop views with architectural illustration
const SideVisual = ({ className = "md:col-span-7" }: { className?: string }) => {
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
       
       {/* Decorative subtle texture or elements if needed */}
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    </div>
  );
};

const AuthScreen: React.FC<AuthScreenProps> = React.memo(({ onComplete, onViewLegal, onBackHome }) => {
  const [view, setView] = useState<AuthView>('auth');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.INVESTOR);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
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

  // Turn Supabase auth anomalies/errors into highly actionable, user-friendly feedback
  const getFriendlyErrorMessage = (error: any): string => {
    if (!error) return "An unexpected error occurred. Please try again.";
    const msg = error.message || String(error);
    const lower = msg.toLowerCase();
    
    if (lower.includes("invalid login credentials") || lower.includes("incorrect email or password")) {
      return "Incorrect password or email address. Please verify your details or use the Reset Password feature.";
    }
    if (lower.includes("email not confirmed")) {
      return "Please confirm your login email. We've sent a link to activate your account.";
    }
    if (lower.includes("user already registered") || lower.includes("already exists")) {
      return "This email is already in use. Please sign in instead.";
    }
    if (lower.includes("password should be at least")) {
      return "Security requirement: password must be at least 6 characters long.";
    }
    if (lower.includes("network error") || lower.includes("failed to fetch")) {
      return "Network connection issue. Please verify you are online and try again.";
    }
    if (lower.includes("too many requests") || lower.includes("rate limit") || lower.includes("over rate limit")) {
      return "Too many registration or login attempts. Please wait a minute and retry.";
    }
    return msg;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();
    
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Local client-side form safety verification
    if (!trimmedEmail) {
        setErrorMsg("Please provide your email address.");
        setIsLoading(false);
        return;
    }
    if (!emailRegex.test(trimmedEmail)) {
        setErrorMsg("Please enter a valid email address (e.g., mail@example.com).");
        setIsLoading(false);
        return;
    }
    if (!password) {
        setErrorMsg("Password cannot be blank.");
        setIsLoading(false);
        return;
    }

    // MOCK MODE HANDLER: Prevent network call if database is unavailable
    if (StorageService.isMockMode()) {
        onComplete(UserRole.INVESTOR, trimmedEmail || 'demo@connectup.com');
        setIsLoading(false);
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password
        });

        if (error) throw error;
        if (data.user) {
            const role = await StorageService.checkUserRole(data.user.id);
            if (role) {
                onComplete(role, trimmedEmail);
            } else {
                navigateTo('auth', false); 
            }
        }
    } catch (err: any) {
        setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
        setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      clearMessages();

      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Local client-side form safety verification
      if (!trimmedName) {
          setErrorMsg("Please provide your full name to set up your profile.");
          setIsLoading(false);
          return;
      }
      if (!trimmedEmail) {
          setErrorMsg("Please enter an email address.");
          setIsLoading(false);
          return;
      }
      if (!emailRegex.test(trimmedEmail)) {
          setErrorMsg("Please enter a valid email address structure (e.g., mail@example.com).");
          setIsLoading(false);
          return;
      }
      if (!password || password.length < 6) {
          setErrorMsg("For security, your password must contain at least 6 characters.");
          setIsLoading(false);
          return;
      }
      if (!termsAccepted) {
          setErrorMsg("Please accept the Terms of Service and Privacy Policy to create your account.");
          setIsLoading(false);
          return;
      }

      // MOCK MODE HANDLER
      if (StorageService.isMockMode()) {
          onComplete(selectedRole, trimmedEmail || 'demo@connectup.com');
          setIsLoading(false);
          return;
      }

      try {
          // SQL TRIGGER COMPATIBILITY:
          // The `data` object here corresponds to `raw_user_meta_data` in Postgres.
          // The trigger I provided looks for: 'full_name', 'role', 'title', 'location'.
          const metadata = {
              full_name: trimmedName,
              role: selectedRole, // FOUNDER or INVESTOR
              title: title,
              location: location
          };

          const { data, error } = await supabase.auth.signUp({
              email: trimmedEmail,
              password,
              options: { data: metadata }
          });

          if (error) throw error;
          
          if (data.user && data.session) {
              // Session active: We can safely write to DB and Upload files
              await attemptProfileSetup(data.user.id, trimmedEmail);
              onComplete(selectedRole, trimmedEmail);
          } else if (data.user && !data.session) {
              // No session: Email confirmation likely required. 
              setSuccessMsg("Account registration success! Check your email to confirm activation.");
          }

      } catch (err: any) {
          console.error("Signup Flow Error:", err);
          setErrorMsg(getFriendlyErrorMessage(err));
      } finally {
          setIsLoading(false);
      }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      clearMessages();
      
      if (StorageService.isMockMode()) {
          setSuccessMsg("Password reset email sent (Mock Mode).");
          setIsLoading(false);
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
        {/* Soft Atmospheric Gradients */}
        <img 
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=10&w=600" 
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          alt=""
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black"></div>
        <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-brand-primary/20 rounded-none blur-[120px]"
        />
        <motion.div 
            animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-500/10 rounded-none blur-[100px]"
        />
        
        {/* Subtle Noise/Grain */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-multiply pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    </div>
  );

  const renderCard = (children: React.ReactNode, subtitle?: string) => (
      <div className="h-full w-full relative z-10 flex flex-col items-center justify-center px-6 overflow-y-hidden py-20">
          {onBackHome && (
              <button 
                  onClick={onBackHome} 
                  className="absolute top-6 left-6 flex items-center justify-center w-12 h-12 bg-white/5 border border-white/10 rounded-none hover:bg-white/10 transition-colors z-50 text-white"
                  title="Go back home"
              >
                  <ChevronLeft size={24} />
              </button>
          )}
          <div className="w-full max-w-sm flex flex-col items-center">
              <div className="text-center mb-12 w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <h1 className="text-4xl font-display font-bold tracking-tighter leading-none select-none text-white">
                       Connect<span className="text-brand-primary">Up.</span>
                    </h1>
                  </motion.div>
                  {subtitle && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="text-zinc-400 text-sm font-medium"
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
         {onBackHome && (
             <button 
                 onClick={onBackHome} 
                 className="absolute top-6 left-6 flex items-center justify-center w-12 h-12 bg-white/5 border border-white/10 rounded-none hover:bg-white/10 transition-colors z-50 text-white"
                 title="Go back home"
             >
                 <ChevronLeft size={24} />
             </button>
         )}
         {/* Immersive Background */}
         <div ref={bgRef} className="absolute inset-0 overflow-hidden pointer-events-none">
             <img 
               src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=10&w=600" 
               className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay"
               alt=""
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-black"></div>
             
             {/* Dynamic Light Orbs */}
             <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-primary/10 rounded-none blur-[120px]"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-none blur-[100px]"></div>
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
                    className="w-full h-16 bg-zinc-900 rounded-none text-white font-bold text-lg transition-all shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-center justify-center group relative overflow-hidden ring-1 ring-zinc-200 hover:bg-white hover:text-black"
                 >
                    <span className="relative z-10 flex items-center">
                        Get Started
                        <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-500" />
                    </span>
                 </motion.button>
             </div>
 
             {/* Footer Legal Links */}
             <div className="mt-24 flex items-center gap-6 opacity-30 hover:opacity-70 transition-opacity">
                <button 
                    onClick={() => onViewLegal?.('privacy')}
                    className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-brand-primary text-zinc-900"
                >
                    Privacy
                </button>
                <button 
                    onClick={() => onViewLegal?.('terms')}
                    className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-brand-primary text-zinc-900"
                >
                    Terms
                </button>
             </div>
         </div>
      </div>
    );
  }

  if (view === 'auth') {
      return (
        <div className="min-h-screen w-full bg-white relative overflow-y-hidden">

          {/* Main Card */}
          <div className="w-full h-screen overflow-hidden flex flex-col md:grid md:grid-cols-10 relative z-10">
             
             {/* Left Column (Form Controls) */}
             <div className="col-span-12 md:col-span-5 p-6 sm:p-14 lg:p-18 flex flex-col justify-between flex-1 h-full overflow-y-auto md:overflow-y-hidden no-scrollbar bg-white md:border-r md:border-zinc-100 shadow-[0_24px_60px_rgba(0,0,0,0.05)]">
                 {/* Logo and Back Button */}
                <div className="flex items-center justify-between mb-8 select-none">
                    {onBackHome && (
                        <button 
                            onClick={onBackHome}
                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors group cursor-pointer"
                        >
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Home</span>
                        </button>
                    )}
                    <div className="flex items-center">
                       <span className="font-display font-black text-xl tracking-tight text-zinc-900 blur-[3px]">Connect<span className="text-brand-primary">Up.</span></span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                   <AnimatePresence mode="wait">
                      {isLogin ? (
                          <motion.form 
                              key="login"
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -15 }}
                              transition={{ duration: 0.25 }}
                              onSubmit={handleLoginSubmit} 
                              className="w-full max-w-sm mx-auto"
                          >
                             {/* Greetings */}
                             <div className="mb-8 text-left">
                               <h2 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-zinc-900 leading-tight">
                                 Sign In
                               </h2>
                             </div>

                             {errorMsg && (
                                 <div className="p-4 bg-red-500/10 text-red-600 dark:text-red-400 rounded-none text-xs font-semibold flex items-center border border-red-200/50 dark:border-red-800/30 mb-4">
                                     <AlertCircle size={16} className="mr-2 shrink-0" /> {errorMsg}
                                 </div>
                             )}

                             <div className="space-y-4">
                                 <InputField icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} required autoComplete="email" label="Email Address" />
                                 <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" label="Password" />
                             </div>
                             
                             <div className="flex items-center justify-start text-xs sm:text-sm mt-4 select-none">
                                <button 
                                   type="button" 
                                   onClick={() => navigateTo('forgotPassword')} 
                                   className="font-bold text-zinc-500 hover:text-brand-primary transition-colors cursor-pointer uppercase tracking-widest text-[10px]"
                                >
                                   Forgot Password?
                                </button>
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

                             <div className="mt-8 text-center text-sm">
                                 <span className="text-zinc-500">Don't have an account? </span>
                                 <button 
                                    type="button" 
                                    onClick={() => setIsLogin(false)} 
                                    className="font-bold text-brand-primary hover:underline cursor-pointer"
                                 >
                                    Sign Up
                                 </button>
                             </div>
                          </motion.form>
                      ) : (
                          <motion.form 
                              key="signup"
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -15 }}
                              transition={{ duration: 0.25 }}
                              onSubmit={handleSignupSubmit} 
                              className="w-full max-w-sm mx-auto"
                          >
                             {/* Greetings */}
                             <div className="mb-6 text-left">
                               <h2 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-zinc-900 leading-tight">
                                 Sign Up
                               </h2>
                             </div>

                             {errorMsg && (
                                 <div className="p-4 bg-red-500/10 text-red-600 dark:text-red-400 rounded-none text-xs font-semibold flex items-center border border-red-200/50 dark:border-red-800/30 mb-4">
                                     <AlertCircle size={16} className="mr-2 shrink-0" /> {errorMsg}
                                 </div>
                             )}
                             {successMsg && (
                                 <div className="p-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-none text-xs font-semibold flex items-center border border-green-200/50 dark:border-green-800/30 mb-4">
                                     <CheckCircle2 size={16} className="mr-2 shrink-0" /> {successMsg}
                                 </div>
                             )}

                             <div className="flex p-1 bg-zinc-100 rounded-none border border-zinc-200/80 mb-4 font-display">
                                 <button 
                                    type="button" 
                                    onClick={() => setSelectedRole(UserRole.FOUNDER)} 
                                    className={`flex-1 py-2 rounded-none text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${selectedRole === UserRole.FOUNDER ? 'bg-brand-primary text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
                                 >
                                    Founder
                                 </button>
                                 <button 
                                    type="button" 
                                    onClick={() => setSelectedRole(UserRole.INVESTOR)} 
                                    className={`flex-1 py-2 rounded-none text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${selectedRole === UserRole.INVESTOR ? 'bg-brand-primary text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
                                 >
                                    Investor
                                 </button>
                             </div>
                
                             <div className="space-y-4">
                                 <InputField icon={User} placeholder="Full Name" value={name} onChange={setName} required autoComplete="name" label="Full Name" />
                                 <InputField icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} required autoComplete="email" label="Email Address" />
                                 <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" label="Password" />
                                 
                                 <div className="pt-2 flex items-start space-x-2">
                                     <input 
                                         type="checkbox" 
                                         id="terms" 
                                         checked={termsAccepted} 
                                         onChange={(e) => setTermsAccepted(e.target.checked)}
                                         className="mt-0.5 w-4 h-4 rounded border-zinc-200 bg-zinc-100 text-brand-primary focus:ring-brand-primary/10 accent-brand-primary cursor-pointer"
                                     />
                                     <label htmlFor="terms" className="text-xs text-zinc-500 select-none leading-normal font-medium">
                                         I accept the <button type="button" onClick={() => onViewLegal?.('terms')} className="text-brand-primary font-bold hover:underline">Terms of Service</button> and <button type="button" onClick={() => onViewLegal?.('privacy')} className="text-brand-primary font-bold hover:underline">Privacy Policy</button>.
                                     </label>
                                 </div>
                             </div>
                
                             <div className="mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                                     <button 
                                        type="submit"
                                        disabled={isLoading || !termsAccepted}
                                        className="px-10 py-4.5 bg-brand-primary hover:bg-zinc-900 hover:text-white text-black font-bold rounded-sm transition-all duration-200 cursor-pointer shadow-[0_8px_20px_rgba(234,179,8,0.15)] hover:shadow-[0_12px_24px_rgba(234,179,8,0.25)] active:scale-95 text-lg w-full flex items-center justify-center gap-2 select-none disabled:opacity-50"
                                     >
                                         {isLoading ? <Loader2 className="animate-spin size-4" /> : 'Join ConnectUp'}
                                     </button>
                             </div>

                             <div className="mt-8 text-center text-sm">
                                 <span className="text-zinc-500">Already have an account? </span>
                                 <button 
                                    type="button" 
                                    onClick={() => setIsLogin(true)} 
                                    className="font-bold text-brand-primary hover:underline cursor-pointer"
                                 >
                                    Sign In
                                 </button>
                             </div>
                          </motion.form>
                      )}
                   </AnimatePresence>
                </div>
             </div>

             {/* Right Column (Illustration) */}
             <SideVisual className="md:col-span-5" />
          </div>
        </div>
      );
  }

  if (view === 'forgotPassword') {
      return (
        <div className="min-h-screen w-full bg-white relative overflow-y-hidden">

          {/* Main Card */}
          <div className="w-full h-screen overflow-hidden flex flex-col md:grid md:grid-cols-10 relative z-10">
             
             {/* Left Column (Form Controls) */}
             <div className="col-span-12 md:col-span-5 p-10 sm:p-14 lg:p-18 flex flex-col justify-between flex-1 h-full overflow-y-hidden no-scrollbar bg-white md:border-r md:border-zinc-100 shadow-[0_24px_60px_rgba(0,0,0,0.05)]">
                {/* Logo and Back Button */}
                <div className="flex items-center justify-between mb-8 select-none">
                    {onBackHome && (
                        <button 
                            onClick={onBackHome}
                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors group cursor-pointer"
                        >
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Home</span>
                        </button>
                    )}
                    <div className="flex items-center">
                       <span className="font-display font-black text-xl tracking-tight text-zinc-900 blur-[3px]">Connect<span className="text-brand-primary">Up.</span></span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <form onSubmit={handleForgotPassword} className="w-full">
                       {/* Greetings */}
                       <div className="mb-8 text-left">
                         <h2 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-zinc-900 leading-tight">
                           Reset Password
                          </h2>
                         <p className="text-zinc-400 text-sm mt-2 font-medium">
                           Enter your email address below and we'll send you a link to reset your password.
                         </p>
                       </div>

                        {errorMsg && (
                            <div className="p-4 bg-red-500/10 text-red-600 rounded-none text-xs font-semibold flex items-center border border-red-200/50 mb-4">
                                <AlertCircle size={16} className="mr-2 shrink-0" /> {errorMsg}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-4 bg-green-500/10 text-green-600 rounded-none text-xs font-semibold flex items-center border border-green-200/50 mb-4">
                                <CheckCircle2 size={16} className="mr-2 shrink-0" /> {successMsg}
                            </div>
                        )}

                        <div className="space-y-4">
                           <InputField 
                              icon={Mail} 
                              type="email" 
                              placeholder="Email Address" 
                              value={email} 
                              onChange={setEmail} 
                              required
                              label="Email Address"
                           />
                        </div>

                        <div className="mt-14 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                             <Button 
                                type="submit" 
                                disabled={isLoading} 
                                variant="primary"
                                size="lg"
                                fullWidth={false}
                                className="w-full sm:w-auto"
                             >
                                 {isLoading ? <Loader2 className="animate-spin size-4" /> : 'Send Reset Link'}
                             </Button>

                            <button 
                               type="button" 
                               onClick={() => { clearMessages(); navigateTo('auth', true); }} 
                               className="text-sm font-bold text-zinc-500 hover:text-zinc-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                                <ChevronLeft size={16} /> Back to Login
                            </button>
                        </div>
                    </form>
                </div>
             </div>

             {/* Right Column (Illustration) */}
             <SideVisual className="md:col-span-5" />
          </div>
        </div>
      );
  }

  return null;
});

export default AuthScreen;