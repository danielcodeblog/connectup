/// <reference types="vite/client" />
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { 
  LayoutDashboard, Users, MessageSquare, Settings, LogOut, ChevronRight, 
  Shield, Bell, Globe, ChevronLeft, User, KeyRound, 
  MapPin, Mail, CheckCircle2, Volume2, Loader2, CreditCard, Check, Building2, Receipt, Download, Crown, ArrowRight, Calendar, Clock, X, Trash2, AlertTriangle, AlertCircle, Compass, Inbox, FileText
} from 'lucide-react';
import { UserRole, AppState, Startup, SubscriptionTier, SubscriptionTransaction } from './types';
import { SplashScreen } from './components/SplashScreen';
import { Button } from './components/Button';
import { StorageService } from './services/storageService';
import { supabase } from './services/supabaseClient';

// Rename imports for clarity if needed
const CalendarIcon = Calendar;
const CreditCardIcon = CreditCard;

// Lazy Load Heavy Components for Performance
const FounderDashboard = React.lazy(() => import('./components/FounderDashboard').then(module => ({ default: module.FounderDashboard })));
const CommunityTab = React.lazy(() => import('./components/CommunityTab').then(module => ({ default: module.CommunityTab })));
const SwipeDeck = React.lazy(() => import('./components/SwipeDeck').then(module => ({ default: module.SwipeDeck })));
const ChatInterface = React.lazy(() => import('./components/ChatInterface').then(module => ({ default: module.ChatInterface })));
const AuthScreen = React.lazy(() => import('./components/AuthScreen'));
const Onboarding = React.lazy(() => import('./components/Onboarding').then(module => ({ default: module.Onboarding })));
const UserProfileView = React.lazy(() => import('./components/UserProfileView').then(module => ({ default: module.UserProfileView })));

// Paystack Type Definition
declare var PaystackPop: any;

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
console.log('PAYSTACK_PUBLIC_KEY:', PAYSTACK_PUBLIC_KEY);

// Modern Floating Nav Item
const NavItem = React.memo(({ 
  icon: Icon, 
  active, 
  onClick,
  theme = 'light',
  label,
  badge
}: { 
  icon: React.ElementType, 
  active: boolean, 
  onClick: () => void,
  theme?: 'light' | 'dark',
  label: string,
  badge?: boolean
}) => (
  <button
    onClick={onClick}
    className="relative flex-1 flex flex-col items-center justify-center py-2 transition-all duration-300 active:scale-90 cursor-pointer focus:outline-none z-10"
    aria-label={label}
  >
    <div className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${active ? 'scale-110 -translate-y-1' : 'scale-100 translate-y-0'}`}>
      <Icon 
        size={24} 
        strokeWidth={active ? 2.5 : 2}
        className={`transition-colors duration-300 ${
          theme === 'dark' 
            ? (active ? 'text-white' : 'text-white/40 hover:text-white/70') 
            : (active ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600')
        }`}
      />
      {badge && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black animate-pulse"></div>
      )}
    </div>
    <div className={`mt-1 w-1 h-1 rounded-full transition-all duration-500 ${active ? 'bg-brand-primary scale-100 opacity-100' : 'bg-transparent scale-0 opacity-0'}`} />
  </button>
));

NavItem.displayName = 'NavItem';

// Modern Settings Layout
const SettingsLayout = ({ title, onBack, children }: { title: string, onBack?: () => void, children?: React.ReactNode }) => (
  <div className="h-full bg-gradient-to-br from-[#FFFBEB] via-[#FFF5E1] to-white flex flex-col animate-in slide-in-from-right duration-500 overflow-y-auto pb-44 safe-area-top text-zinc-900 relative">
     {/* Theme Background */}
     <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[60%] bg-[#FFEFB5]/50 rounded-[50%] blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-[#FFE4D6]/50 rounded-full blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
     </div>

     <div className="px-6 py-6 sticky top-0 z-20 flex items-center bg-white/60 backdrop-blur-xl border-b border-white/20">
        {onBack && (
          <button onClick={onBack} className="mr-4 p-2 -ml-2 hover:bg-white/50 rounded-full transition-colors text-zinc-900 shadow-sm border border-transparent hover:border-zinc-100">
            <ChevronLeft size={20} />
          </button>
        )}
        <h2 className="text-2xl font-display font-bold tracking-tight text-zinc-900">{title}</h2>
     </div>
     <div className="p-6 space-y-6 max-w-2xl mx-auto w-full relative z-10">
        {children}
     </div>
  </div>
);

// Notification Toast Component
const NotificationToast = React.memo(({ 
    notification, 
    onClick, 
    onDismiss 
}: { 
    notification: { sender: string, avatar?: string, message: string, userId: string, type?: 'error' | 'message' } | null, 
    onClick: () => void, 
    onDismiss: () => void 
}) => {
    if (!notification) return null;

    return (
        <div className="fixed top-4 left-4 right-4 z-[60] flex justify-center animate-in slide-in-from-top-4 duration-500">
            <div 
                className={`backdrop-blur-xl border shadow-2xl rounded-full p-2 pr-5 flex items-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform max-w-md w-full ${notification.type === 'error' ? 'bg-red-50/90 border-red-200' : 'bg-white/90 border-white/50'}`}
                onClick={onClick}
            >
                {notification.avatar ? (
                     <img src={notification.avatar} className="w-10 h-10 rounded-full object-cover border border-zinc-100" alt="" loading="lazy" />
                ) : notification.type === 'error' ? (
                     <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertCircle size={20} /></div>
                ) : (
                     <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500"><Bell size={20} /></div>
                )}
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <h4 className={`font-bold text-sm truncate ${notification.type === 'error' ? 'text-red-800' : 'text-zinc-900'}`}>{notification.sender}</h4>
                        <span className={`text-[10px] font-medium ${notification.type === 'error' ? 'text-red-400' : 'text-zinc-400'}`}>Now</span>
                    </div>
                    <p className={`text-xs truncate ${notification.type === 'error' ? 'text-red-600' : 'text-zinc-500'}`}>{notification.message}</p>
                </div>
                {notification.type !== 'error' && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full shrink-0"></div>}
            </div>
        </div>
    );
});

NotificationToast.displayName = 'NotificationToast';

const App = () => {
  const [appState, setAppState] = useState<AppState>('ONBOARDING');
  const [role, setRole] = useState<UserRole>(UserRole.INVESTOR);
  const [currentView, setCurrentView] = useState<string>('home'); // 'home' | 'messages' | 'settings' | 'community'
  const [activeStartupIdForChat, setActiveStartupIdForChat] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedCommunityProfileId, setSelectedCommunityProfileId] = useState<string | null>(null);

  // Notifications State
  const [notification, setNotification] = useState<{ sender: string, avatar?: string, message: string, userId: string, type?: 'error' | 'message' } | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const notificationTimeoutRef = useRef<any>(null);

  // Settings State
  const [settingsPath, setSettingsPath] = useState<'root' | 'profile' | 'security' | 'password' | 'chat-prefs' | 'subscription' | 'terms' | 'privacy'>('root');
  const [chatSounds, setChatSounds] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Subscription UI State
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [billingHistory, setBillingHistory] = useState<SubscriptionTransaction[]>([]);

  const [userProfile, setUserProfile] = useState<{
    name: string;
    title: string;
    email: string;
    location: string;
    avatarUrl: string;
    subscriptionTier: SubscriptionTier;
    subscriptionEndDate?: string;
    billingCycle?: 'monthly' | 'yearly';
  }>({
    name: '',
    title: '',
    email: '',
    location: '',
    avatarUrl: '',
    subscriptionTier: 'Free'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Storage and Check Connection
  useEffect(() => {
    const init = async () => {
       // StorageService.init() is now a singleton promise, so calling it here starts/waits for the check
       const status = await StorageService.init();
       
       if (!status.success && !status.isMock) {
           setNotification({
               sender: "Database Error",
               message: "Failed to connect to Supabase. Check credentials.",
               userId: "sys",
               type: 'error'
           });
       } else if (status.missingTables && status.missingTables.length > 0) {
           setNotification({
               sender: "Schema Update Required",
               message: `Missing tables: ${status.missingTables.join(', ')}. Please run SQL schema.`,
               userId: "sys",
               type: 'error'
           });
           // Auto-dismiss after 6s for schema errors so user sees it
           if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
           notificationTimeoutRef.current = setTimeout(() => setNotification(null), 6000);
           return; 
       } else if (status.isMock && StorageService.isMockMode()) {
           // Graceful degradation notification (Optional)
           // setNotification({
           //    sender: "Offline Mode",
           //    message: "Running in mock mode due to network status.",
           //    userId: "sys",
           //    type: 'message'
           // });
       }
    };
    init();
  }, []);

  // Fetch real profile data based on Role
  useEffect(() => {
    const loadProfile = async () => {
      if (appState !== 'MAIN_APP') return;
      
      let uid = currentUserId;
      let email = userProfile.email;

      // In Mock Mode, handle session manually if not set
      if (StorageService.isMockMode() && !uid) {
         uid = 'mock-user-123'; 
         setCurrentUserId(uid);
         email = 'demo@connectup.com';
      } else if (!uid) {
          try {
             const { data, error } = await supabase.auth.getSession();
             if (error) {
                if (error.message?.includes('Refresh Token Not Found')) {
                    await supabase.auth.signOut().catch(() => {});
                    handleLogout();
                    return;
                }
                throw error;
             }
             if (!data.session) {
               console.warn("Session expired or invalid during profile load");
               handleLogout();
               return;
             }
             uid = data.session.user.id;
             email = data.session.user.email || '';
             setCurrentUserId(uid);
          } catch(e) {
             // Handle network errors during profile load if somehow we aren't in mock mode
             console.error("Profile load error", e);
          }
      }
      
      if (!uid) return;

      const profile = await StorageService.getUserProfile(uid);
      
      if (profile) {
        let currentProfile = profile;
        if (profile.subscriptionEndDate && new Date(profile.subscriptionEndDate) < new Date() && profile.subscriptionTier !== 'Free') {
            await StorageService.cancelSubscription();
            currentProfile = { ...profile, subscriptionTier: 'Free', subscriptionEndDate: undefined };
        }

        if (currentProfile.role && currentProfile.role !== role) {
           setRole(currentProfile.role);
        }

        setUserProfile(prev => ({
           ...prev,
           name: currentProfile.name || '',
           title: currentProfile.title || '',
           avatarUrl: currentProfile.avatarUrl || '',
           location: currentProfile.location || '',
           email: email || prev.email,
           subscriptionTier: currentProfile.subscriptionTier || 'Free',
           subscriptionEndDate: currentProfile.subscriptionEndDate,
           billingCycle: currentProfile.billingCycle as 'monthly' | 'yearly'
        }));
      }
    };
    loadProfile();
  }, [appState, role, currentUserId]);

  // Global Message Subscription
  useEffect(() => {
      if (appState !== 'MAIN_APP' || !currentUserId) return;

      const sub = StorageService.subscribeToGlobalMessages(async (msg) => {
          if (msg.sender_id === currentUserId) return;

          if (currentView !== 'messages') {
              setHasUnreadMessages(true);
              
              const profile = await StorageService.getUserProfile(msg.sender_id);
              if (profile) {
                  const content = msg.content || (msg.type === 'image' ? 'Sent an image' : 'Sent a message');
                  
                  setNotification({
                      sender: profile.name,
                      avatar: profile.avatarUrl,
                      message: content,
                      userId: msg.sender_id,
                      type: 'message' 
                  });

                  if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
                  notificationTimeoutRef.current = setTimeout(() => {
                      setNotification(null);
                  }, 4000);
                  
                  if (chatSounds) {
                      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.m4a');
                      audio.volume = 0.5;
                      audio.play().catch(() => {});
                  }
              }
          }
      });

      return () => {
          sub.unsubscribe();
      };
  }, [appState, currentUserId, currentView, chatSounds]);

  useEffect(() => {
    if (settingsPath === 'subscription' && userProfile.subscriptionTier === 'Pro' && currentUserId) {
       StorageService.getSubscriptionHistory(currentUserId).then(setBillingHistory);
    }
  }, [settingsPath, userProfile.subscriptionTier, currentUserId]);

  const handleSplashFinish = useCallback(async () => {
    try {
      // 1. Wait for Storage Service to determine connectivity status
      // This prevents "Failed to fetch" if Supabase is unreachable and we try to getSession() too early
      await StorageService.init();

      // 2. FORCE MOCK MODE CHECK: If network failed during init, bypass real auth check
      if (StorageService.isMockMode()) {
          const hasOnboarded = localStorage.getItem('hasOnboarded');
          if (!hasOnboarded) {
              setAppState('ONBOARDING');
          } else {
             // For simplicity in mock mode, auto-login as demo user if session check fails/skips
             handleAuthComplete(UserRole.INVESTOR, 'demo@connectup.com'); 
          }
          return;
      }

      // 3. Robust Session Check with Try/Catch
      let sessionData = null;
      try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
              // Specifically handle the refresh token error
              if (error.message?.includes('Refresh Token Not Found') || error.message?.includes('invalid_grant')) {
                  console.warn("Stale session detected, clearing...");
                  await supabase.auth.signOut().catch(() => {});
                  localStorage.clear(); // Nuclear option to clear all stale auth data
                  setAppState('AUTH');
                  return;
              }
              throw error;
          }
          sessionData = data;
      } catch (sessionError: any) {
          console.warn("Session check failed, reverting to Auth screen", sessionError);
          // If session check fails (e.g. network blip after init passed), we go to Auth
          // (StorageService.init() catches most network errors, but this is a safety net)
          await supabase.auth.signOut().catch(() => {});
          setAppState('AUTH');
          return;
      }

      if (!sessionData?.session) {
        await supabase.auth.signOut().catch(() => {});
        const hasOnboarded = localStorage.getItem('hasOnboarded');
        setAppState(hasOnboarded ? 'AUTH' : 'ONBOARDING');
        return;
      }

      const userRole = await StorageService.checkUserRole(sessionData.session.user.id);
      if (userRole) {
        handleAuthComplete(userRole, sessionData.session.user.email);
      } else {
        await supabase.auth.signOut().catch(() => {});
        setAppState('AUTH');
      }
    } catch (e) {
       console.error("Critical Splash Error:", e);
       await supabase.auth.signOut().catch(() => {});
       setAppState('AUTH');
    }
  }, []);

  const handleOnboardingFinish = useCallback(() => {
    localStorage.setItem('hasOnboarded', 'true');
    setAppState('AUTH');
  }, []);

  const handleAuthComplete = useCallback((selectedRole: UserRole, email?: string) => {
    setRole(selectedRole);
    if (email) {
      setUserProfile(prev => ({ ...prev, email }));
    }
    setAppState('MAIN_APP');
    setCurrentView('home');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out warning:", e);
    }
    // RESET STATE TO PREVENT PROFILE MIX-UP
    setCurrentUserId(null);
    setUserProfile({
      name: '',
      title: '',
      email: '',
      location: '',
      avatarUrl: '',
      subscriptionTier: 'Free'
    });
    setBillingHistory([]);
    setAppState('AUTH');
    setSettingsPath('root');
    setActiveStartupIdForChat(null);
    setIsCreatingPost(false);
    setHasUnreadMessages(false);
    setNotification(null);
  }, []);

  const handleDeleteAccount = useCallback(async () => {
      setIsDeletingAccount(true);
      try {
          const success = await StorageService.deleteAccount();
          if (success) {
              // RESET STATE
              setCurrentUserId(null);
              setUserProfile({
                  name: '',
                  title: '',
                  email: '',
                  location: '',
                  avatarUrl: '',
                  subscriptionTier: 'Free'
              });
              setBillingHistory([]);
              
              setAppState('AUTH');
              setSettingsPath('root');
              setIsConfirmingDelete(false);
          } else {
              alert("Could not delete account. Please try again later.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsDeletingAccount(false);
      }
  }, []);

  const handleSaveProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await StorageService.updateUserProfile({
        name: userProfile.name,
        title: userProfile.title,
        avatarUrl: userProfile.avatarUrl,
        location: userProfile.location
      });
      setTimeout(() => {
        setIsSaving(false);
        setSettingsPath('root');
      }, 500);
    } catch (error) {
      setIsSaving(false);
    }
  }, [userProfile]);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setIsUploadingAvatar(true);
        const file = e.target.files[0];
        const url = await StorageService.uploadProfilePicture(file);
        if (url) {
            setUserProfile(prev => ({ ...prev, avatarUrl: url }));
            await StorageService.updateUserProfile({ avatarUrl: url });
        }
        setIsUploadingAvatar(false);
    }
  }, []);

  const handlePaystackPayment = useCallback(async (tier: SubscriptionTier) => {
    if (tier === 'Free') {
        setIsUpgrading(true);
        try {
            await StorageService.cancelSubscription();
            setUserProfile(prev => ({ 
                ...prev, 
                subscriptionTier: 'Free', 
                billingCycle: undefined, 
                subscriptionEndDate: undefined 
            }));
            alert("Subscription has been cancelled.");
        } catch (e) {
            alert("Could not cancel subscription.");
        } finally {
            setIsUpgrading(false);
        }
        return;
    }

    if (typeof PaystackPop === 'undefined') {
        alert("Payment gateway is initializing.");
        return;
    }

    if (!userProfile.email) {
        alert("User email is required.");
        return;
    }

    if (!PAYSTACK_PUBLIC_KEY) {
        alert("Payment gateway is not configured. Please contact support.");
        setIsUpgrading(false);
        return;
    }

    setIsUpgrading(true);
    const amount = billingCycle === 'monthly' ? 1000000 : 8500000; 
    
    try {
        const handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: userProfile.email,
            amount: amount, 
            currency: 'NGN', 
            ref: ''+Math.floor((Math.random() * 1000000000) + 1),
            callback: function(transaction: any) {
                StorageService.handleSuccessfulSubscription({
                    tier: tier,
                    reference: transaction.reference,
                    amount: amount,
                    billingCycle: billingCycle
                })
                    .then(() => {
                        const now = new Date();
                        const endDate = new Date(now);
                        if (billingCycle === 'monthly') endDate.setMonth(now.getMonth() + 1);
                        else endDate.setFullYear(now.getFullYear() + 1);

                        setUserProfile(prev => ({ 
                            ...prev, 
                            subscriptionTier: tier,
                            billingCycle: billingCycle,
                            subscriptionEndDate: endDate.toISOString()
                        }));
                        setIsUpgrading(false);
                        alert(`Payment Successful!`);
                        if (currentUserId) StorageService.getSubscriptionHistory(currentUserId).then(setBillingHistory);
                    })
                    .catch(() => {
                        setIsUpgrading(false);
                    });
            },
            onClose: function() {
                setIsUpgrading(false);
            }
        });
        handler.openIframe();
    } catch (e) {
        alert("Unable to load payment window.");
        setIsUpgrading(false);
    }
  }, [userProfile.email, billingCycle, currentUserId]);

  const handleMatch = useCallback((startup: Startup) => {
    setActiveStartupIdForChat(startup.id);
    setCurrentView('messages');
    setIsCreatingPost(false); // Reset
  }, []);

  const handleNavClick = useCallback((view: string) => {
    setCurrentView(view);
    setIsCreatingPost(false); // Reset
    if (view === 'messages') {
        setHasUnreadMessages(false);
    }
    if (view !== 'messages') {
      setActiveStartupIdForChat(null);
      setIsChatOpen(false);
    }
  }, []);

  const handleNotificationClick = useCallback(() => {
      if (notification && notification.type !== 'error') {
          setActiveStartupIdForChat(notification.userId); 
          setCurrentView('messages');
          setNotification(null);
          setHasUnreadMessages(false);
          setIsCreatingPost(false); // Reset
      } else if (notification?.type === 'error') {
          setNotification(null); // Dismiss error on click
      }
  }, [notification]);

  const navTheme = useMemo(() => {
      return 'light' as 'light' | 'dark';
  }, []);

  const viewIndex = useMemo(() => {
    if (currentView === 'home') return 0;
    if (currentView === 'community') return 1;
    if (currentView === 'messages') return 2;
    return 3;
  }, [currentView]);

  const handleConnect = useCallback((targetId: string) => {
      setActiveStartupIdForChat(targetId);
      setCurrentView('messages');
  }, []);

  const handleUpgrade = useCallback(() => {
      setCurrentView('settings');
      setSettingsPath('subscription');
  }, []);

  const handleCommunityMessage = useCallback((uid: string) => {
      setSelectedCommunityProfileId(null);
      setActiveStartupIdForChat(uid);
      setCurrentView('messages');
  }, []);

  const mainContent = useMemo(() => {
    if (currentView === 'messages') {
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-brand-primary" /></div>}>
            <ChatInterface 
            role={role} 
            activeStartupId={activeStartupIdForChat} 
            soundEnabled={chatSounds}
            readReceiptsEnabled={readReceipts}
            onChatStateChange={setIsChatOpen}
            />
        </Suspense>
      );
    }
    
    if (currentView === 'community') {
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-brand-primary" /></div>}>
            <CommunityTab userProfile={userProfile} onMessage={handleConnect} onViewProfile={setSelectedCommunityProfileId} />
        </Suspense>
      );
    }
    
    if (currentView === 'settings') {
      if (settingsPath === 'subscription') {
         const isPro = userProfile.subscriptionTier === 'Pro';
         const currentBillingDate = userProfile.subscriptionEndDate ? new Date(userProfile.subscriptionEndDate) : null;
         const currentAmount = userProfile.billingCycle === 'yearly' ? '₦85,000' : '₦10,000';
         return (
            <SettingsLayout title="Membership" onBack={() => setSettingsPath('root')}>
               {!isPro && (
                   <div className="relative overflow-hidden rounded-[32px] bg-black text-white p-8 mb-8 shadow-xl animate-in slide-in-from-bottom-4 duration-700">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary rounded-full blur-[80px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                      <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                              <Crown size={24} className="text-brand-primary" />
                              <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">{role === 'INVESTOR' ? 'CONNECT UP INVESTOR' : 'CONNECT UP ELITE'}</span>
                          </div>
                          <h3 className="text-3xl font-display font-bold mb-2">{role === 'INVESTOR' ? 'Supercharge Your Deal Flow' : 'Supercharge Your Raise'}</h3>
                          <div className="space-y-2 mb-6">
                          </div>
                          <div className="inline-flex bg-zinc-900 p-1 rounded-full relative border border-zinc-700">
                              <button onClick={() => setBillingCycle('monthly')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all relative z-10 ${billingCycle === 'monthly' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>Monthly</button>
                              <button onClick={() => setBillingCycle('yearly')} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all relative z-10 flex items-center ${billingCycle === 'yearly' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>Yearly <span className="ml-2 text-[10px] bg-brand-primary text-black px-2 py-0.5 rounded-full font-bold">-20%</span></button>
                              <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ${billingCycle === 'monthly' ? 'translate-x-0' : 'translate-x-full left-[4px]'}`}></div>
                          </div>
                      </div>
                   </div>
               )}
               {isPro && (
                   <div className="mb-8 animate-in fade-in duration-500">
                       <div className="bg-white border border-zinc-200 rounded-[32px] p-6 shadow-sm relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><Crown size={120} className="text-black" /></div>
                           <div className="relative z-10">
                               <div className="flex justify-between items-start mb-6">
                                   <div><span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Current Plan</span><h2 className="text-3xl font-display font-bold text-zinc-900">Pro Member</h2></div>
                                   <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center border border-green-100"><div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></div> Active</div>
                               </div>
                               <div className="grid grid-cols-2 gap-4 mb-6">
                                   <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100"><div className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><CalendarIcon size={10} /> Next Billing</div><div className="text-sm font-bold text-zinc-900">{currentBillingDate ? currentBillingDate.toLocaleDateString() : 'N/A'}</div></div>
                                   <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100"><div className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><CreditCardIcon size={10} /> Amount</div><div className="text-sm font-bold text-zinc-900">{currentAmount}</div></div>
                               </div>
                               <div className="flex items-center justify-between pt-4 border-t border-zinc-100"><div className="flex items-center text-sm font-medium text-zinc-600"><CreditCardIcon size={16} className="mr-2 text-zinc-400" /> Paystack</div></div>
                           </div>
                       </div>
                   </div>
               )}
               {!isPro && (
                   <div className="grid grid-cols-1 gap-6 mb-10">
                       <div className={`relative group transition-all duration-300 hover:-translate-y-1 ${userProfile.subscriptionTier === 'Pro' ? 'ring-2 ring-brand-primary rounded-[32px]' : ''}`}>
                           <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-yellow-400 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                           <div className="relative bg-white border border-zinc-100 rounded-[32px] p-6 shadow-xl overflow-hidden">
                               <div className="flex justify-between items-start mb-6"><div><h3 className="text-2xl font-display font-bold text-zinc-900">Pro</h3></div><div className="text-right"><span className="text-3xl font-display font-bold text-zinc-900">₦{billingCycle === 'monthly' ? '10,000' : '85,000'}</span><span className="text-zinc-400 text-xs block font-medium">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span></div></div>
                                <div className="space-y-4 mb-8">
                                    {(role === 'INVESTOR' ? [
                                        'Unlimited Startup Access',
                                        'Priority Startup Matching',
                                        'Exclusive Community Access'
                                    ] : [
                                        'Unlimited Investor Matches', 
                                        'Verified Founder Status',
                                        'Priority Investor Matching',
                                        'Community Access'
                                    ]).map((feat, i) => (
                                        <div key={i} className="flex items-center text-sm text-zinc-600 font-medium">
                                            <div className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center mr-3 shrink-0">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            {feat}
                                        </div>
                                    ))}
                                </div>
                               <button onClick={() => handlePaystackPayment('Pro')} disabled={userProfile.subscriptionTier === 'Pro' || isUpgrading} className="w-full h-14 bg-black text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-lg flex items-center justify-center disabled:opacity-50 group/btn">{isUpgrading && userProfile.subscriptionTier !== 'Pro' ? <Loader2 className="animate-spin" /> : userProfile.subscriptionTier === 'Pro' ? 'Current Plan' : <span className="flex items-center">Upgrade Now <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" /></span>}</button>
                           </div>
                       </div>
                   </div>
               )}
               {isPro && billingHistory.length > 0 && (
                   <div className="mb-8">
                       <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 px-2">Billing History</h4>
                       <div className="bg-white border border-zinc-200 rounded-[24px] overflow-hidden">
                           {billingHistory.map((txn) => (
                               <div key={txn.id} className="flex items-center justify-between p-4 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors"><div className="flex items-center"><div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mr-3 text-zinc-400"><Receipt size={18} /></div><div><div className="text-sm font-bold text-zinc-900">{txn.tier} Subscription</div><div className="text-[10px] text-zinc-500 font-medium">{new Date(txn.createdAt).toLocaleDateString()}</div></div></div><div className="text-right"><div className="text-sm font-bold text-zinc-900">-₦{(txn.amount / 100).toLocaleString()}</div><div className="text-[10px] text-green-600 font-bold uppercase flex items-center justify-end gap-1"><CheckCircle2 size={8} /> {txn.status}</div></div></div>
                           ))}
                       </div>
                   </div>
               )}
            </SettingsLayout>
         );
      }
      if (settingsPath === 'chat-prefs') {
        return (
          <SettingsLayout title="Chat Settings" onBack={() => setSettingsPath('root')}>
             <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-1 shadow-sm border border-white/60">
                <div className="p-5 border-b border-zinc-50/50 flex items-center justify-between">
                   <div className="flex items-center"><div className="w-10 h-10 rounded-2xl bg-zinc-50 text-black flex items-center justify-center mr-4"><Volume2 size={20} /></div><span className="font-semibold text-sm text-zinc-900">In-App Sounds</span></div>
                   <button onClick={() => setChatSounds(!chatSounds)} className={`w-12 h-7 rounded-full transition-colors relative ${chatSounds ? 'bg-black' : 'bg-zinc-200'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${chatSounds ? 'left-6' : 'left-1'}`}></div></button>
                </div>
                <div className="p-5 flex items-center justify-between">
                   <div className="flex items-center"><div className="w-10 h-10 rounded-2xl bg-zinc-50 text-black flex items-center justify-center mr-4"><CheckCircle2 size={20} /></div><span className="font-semibold text-sm text-zinc-900">Read Receipts</span></div>
                   <button onClick={() => setReadReceipts(!readReceipts)} className={`w-12 h-7 rounded-full transition-colors relative ${readReceipts ? 'bg-black' : 'bg-zinc-200'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${readReceipts ? 'left-6' : 'left-1'}`}></div></button>
                </div>
             </div>
          </SettingsLayout>
        );
      }
      if (settingsPath === 'terms') {
        return (
          <SettingsLayout title="Terms of Service" onBack={() => setSettingsPath('root')}>
             <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/60 text-sm text-zinc-700 space-y-4">
                <h2 className="text-lg font-bold text-black mb-2">Terms of Service</h2>
                <p>Welcome to our platform. By accessing or using our service, you agree to be bound by these terms.</p>
                <h3 className="font-bold text-black mt-4">1. Acceptance of Terms</h3>
                <p>By creating an account, you agree to these terms and conditions.</p>
                <h3 className="font-bold text-black mt-4">2. User Responsibilities</h3>
                <p>You are responsible for maintaining the confidentiality of your account and password.</p>
                <h3 className="font-bold text-black mt-4">3. Content</h3>
                <p>You retain all rights to the content you post, but grant us a license to use it to provide the service.</p>
             </div>
          </SettingsLayout>
        );
      }
      if (settingsPath === 'privacy') {
        return (
          <SettingsLayout title="Privacy Policy" onBack={() => setSettingsPath('root')}>
             <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/60 text-sm text-zinc-700 space-y-4">
                <h2 className="text-lg font-bold text-black mb-2">Privacy Policy</h2>
                <p>Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p>
                <h3 className="font-bold text-black mt-4">1. Information We Collect</h3>
                <p>We collect information you provide directly to us, such as your name, email, and profile details.</p>
                <h3 className="font-bold text-black mt-4">2. How We Use Information</h3>
                <p>We use the information to provide, maintain, and improve our services, and to communicate with you.</p>
                <h3 className="font-bold text-black mt-4">3. Data Security</h3>
                <p>We implement reasonable security measures to protect your personal information.</p>
             </div>
          </SettingsLayout>
        );
      }
      if (settingsPath === 'profile') {
        return (
          <SettingsLayout title="Edit Profile" onBack={() => setSettingsPath('root')}>
             <div className="flex flex-col items-center mb-8">
                <div className="w-28 h-28 rounded-full bg-white p-1 mb-3 relative group cursor-pointer shadow-lg" onClick={() => fileInputRef.current?.click()}>
                   {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover rounded-full" alt="Profile" /> : <div className="w-full h-full rounded-full bg-zinc-100 flex items-center justify-center"><User size={40} className="text-zinc-300" /></div>}
                   {isUploadingAvatar && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-10"><Loader2 className="animate-spin text-white" size={32} /></div>}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="text-sm font-bold text-black">{isUploadingAvatar ? 'Uploading...' : 'Change Photo'}</button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
             </div>
             <form onSubmit={handleSaveProfile} className="space-y-5">
                {[{ label: "Full Name", icon: User, val: userProfile.name, set: (v: string) => setUserProfile({...userProfile, name: v}) }, { label: role === UserRole.FOUNDER ? "Role" : "Title", icon: Shield, val: userProfile.title, set: (v: string) => setUserProfile({...userProfile, title: v}) }].map((field, i) => (
                  <div key={i} className="space-y-1.5"><label className="text-xs font-bold uppercase text-zinc-400 ml-1">{field.label}</label><div className="flex items-center bg-white/80 border border-white/60 rounded-2xl px-4 py-3 focus-within:border-black shadow-sm"><field.icon size={18} className="text-zinc-400 mr-3" /><input type="text" value={field.val} onChange={e => field.set(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-zinc-900" /></div></div>
                ))}
                <div className="pt-6"><Button fullWidth size="lg" disabled={isSaving} className="shadow-lg h-14 bg-black text-white">{isSaving ? 'Saving...' : 'Save Profile'}</Button></div>
             </form>
             <div className="pt-6 border-t border-zinc-100 mt-6">
             </div>
          </SettingsLayout>
        );
      }
      return (
        <SettingsLayout title="Settings">
           <section>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 px-1">Account</h3>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 overflow-hidden shadow-sm">
                 <button onClick={() => setSettingsPath('profile')} className="w-full flex items-center justify-between p-5 border-b border-zinc-50/50 hover:bg-white/50 group"><div className="flex items-center"><div className="w-10 h-10 rounded-2xl bg-zinc-50 text-black flex items-center justify-center mr-4"><User size={18} /></div><span className="font-semibold text-sm text-zinc-900">Personal Info</span></div><ChevronRight size={18} className="text-zinc-300 group-hover:text-black" /></button>
                 <button onClick={() => setSettingsPath('subscription')} className="w-full flex items-center justify-between p-5 border-b border-zinc-50/50 hover:bg-white/50 group"><div className="flex items-center"><div className="w-10 h-10 rounded-2xl bg-zinc-50 text-black flex items-center justify-center mr-4"><CreditCard size={18} /></div><span className="font-semibold text-sm text-zinc-900">Membership</span></div><ChevronRight size={18} className="text-zinc-300 group-hover:text-black" /></button>
                 <button onClick={() => setSettingsPath('chat-prefs')} className="w-full flex items-center justify-between p-5 hover:bg-white/50 group"><div className="flex items-center"><div className="w-10 h-10 rounded-2xl bg-zinc-50 text-black flex items-center justify-center mr-4"><MessageSquare size={18} /></div><span className="font-semibold text-sm text-zinc-900">Chat Settings</span></div><ChevronRight size={18} className="text-zinc-300 group-hover:text-black" /></button>
                  </div>
           </section>
           
           <section className="mt-8">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 px-1">Legal</h3>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 overflow-hidden shadow-sm">
                 <button onClick={() => setSettingsPath('terms')} className="w-full flex items-center justify-between p-5 border-b border-zinc-50/50 hover:bg-white/50 group"><div className="flex items-center"><div className="w-10 h-10 rounded-2xl bg-zinc-50 text-black flex items-center justify-center mr-4"><FileText size={18} /></div><span className="font-semibold text-sm text-zinc-900">Terms of Service</span></div><ChevronRight size={18} className="text-zinc-300 group-hover:text-black" /></button>
                 <button onClick={() => setSettingsPath('privacy')} className="w-full flex items-center justify-between p-5 hover:bg-white/50 group"><div className="flex items-center"><div className="w-10 h-10 rounded-2xl bg-zinc-50 text-black flex items-center justify-center mr-4"><Shield size={18} /></div><span className="font-semibold text-sm text-zinc-900">Privacy Policy</span></div><ChevronRight size={18} className="text-zinc-300 group-hover:text-black" /></button>
              </div>
           </section>

           <section className="mt-8">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 px-1">Danger Zone</h3>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 overflow-hidden shadow-sm">
                 <button onClick={() => setIsConfirmingDelete(true)} className="w-full flex items-center justify-between p-5 hover:bg-red-50 group transition-colors">
                    <div className="flex items-center text-red-600">
                       <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mr-4 group-hover:bg-red-100 transition-colors"><Trash2 size={18} /></div>
                       <span className="font-semibold text-sm">Delete Account</span>
                    </div>
                    <ChevronRight size={18} className="text-red-200 group-hover:text-red-500" />
                 </button>
              </div>
           </section>
           
           <Button variant="outline" fullWidth size="lg" onClick={handleLogout} className="mt-8 shadow-sm h-14" icon={LogOut}>Sign Out</Button>

           {/* Delete Account Confirmation Modal */}
           {isConfirmingDelete && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeletingAccount && setIsConfirmingDelete(false)}></div>
                  <div className="relative bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-300">
                     <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <AlertTriangle size={32} />
                     </div>
                     <h2 className="text-2xl font-display font-bold text-zinc-900 text-center mb-3">Delete Account?</h2>
                     <p className="text-zinc-500 text-sm text-center mb-8 leading-relaxed">
                        This action is permanent. All your data, startups, and conversations will be lost forever.
                     </p>
                     <div className="space-y-3">
                        <button 
                           onClick={handleDeleteAccount}
                           disabled={isDeletingAccount}
                           className="w-full h-14 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                           {isDeletingAccount ? <Loader2 size={20} className="animate-spin" /> : "Yes, Delete Everything"}
                        </button>
                        <button 
                           onClick={() => setIsConfirmingDelete(false)}
                           disabled={isDeletingAccount}
                           className="w-full h-14 bg-zinc-100 text-zinc-900 font-bold rounded-2xl hover:bg-zinc-200 transition-all"
                        >
                           Cancel
                        </button>
                     </div>
                  </div>
               </div>
           )}
        </SettingsLayout>
      );
    }

    return role === UserRole.INVESTOR ? (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-brand-primary" /></div>}>
            <SwipeDeck onMatch={handleMatch} userProfile={userProfile} /> 
        </Suspense>
    ) : ( 
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-brand-primary" /></div>}>
            <FounderDashboard 
                userProfile={userProfile} 
                onConnect={handleConnect} 
                onUpgrade={handleUpgrade} 
                isEditingDeck={isEditingDeck}
                onEditStateChange={setIsEditingDeck}
                onPostCreationStateChange={setIsCreatingPost}
            /> 
        </Suspense>
    );
  }, [
      currentView, 
      role, 
      userProfile, 
      activeStartupIdForChat, 
      chatSounds, 
      readReceipts, 
      settingsPath, 
      isEditingDeck, 
      isCreatingPost, 
      handleSaveProfile, 
      handleAvatarChange, 
      handlePaystackPayment, 
      handleLogout, 
      isConfirmingDelete, 
      isDeletingAccount, 
      handleDeleteAccount, 
      handleMatch, 
      handleConnect, 
      handleUpgrade,
      billingCycle,
      isUpgrading,
      billingHistory,
      isUploadingAvatar,
      isSaving
  ]);


  return (
    <div className="min-h-screen bg-[#f8f8f8] flex justify-center">
      <div className="w-full max-w-[1600px] bg-[#FFFCF0] shadow-2xl border-x border-zinc-100/50 relative overflow-hidden flex flex-col h-screen font-sans selection:bg-brand-primary selection:text-white">
        {appState === 'SPLASH' ? (
          <SplashScreen onFinish={handleSplashFinish} />
        ) : appState === 'ONBOARDING' ? (
          <Suspense fallback={<div className="flex items-center justify-center h-screen bg-zinc-50"><Loader2 className="animate-spin text-brand-primary" /></div>}>
              <Onboarding onFinish={handleOnboardingFinish} />
          </Suspense>
        ) : appState === 'AUTH' ? (
          <Suspense fallback={<div className="flex items-center justify-center h-screen bg-zinc-50"><Loader2 className="animate-spin text-brand-primary" /></div>}>
              <AuthScreen onComplete={handleAuthComplete} />
          </Suspense>
        ) : (
          <>
            {/* Global Atmospheric Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none fixed">
                <div className="absolute top-[-20%] left-[-10%] w-[140%] h-[80%] bg-brand-primary/10 rounded-[50%] blur-[120px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[70%] bg-orange-200/10 rounded-full blur-[100px] opacity-10 animate-pulse animation-delay-2000"></div>
            </div>

            <main className="flex-1 overflow-hidden pt-0 pb-0 bg-transparent relative z-10 w-full">
              {mainContent}
            </main>

            {/* Global Notification Toast */}
            <NotificationToast 
                notification={notification} 
                onClick={handleNotificationClick} 
                onDismiss={() => setNotification(null)} 
            />

            {selectedCommunityProfileId && (
                <UserProfileView 
                  userId={selectedCommunityProfileId} 
                  onClose={() => setSelectedCommunityProfileId(null)} 
                  onMessage={handleCommunityMessage}
                />
            )}

            {/* Standard Bottom Navigation Bar */}
            <div className={`fixed bottom-0 md:bottom-8 left-0 right-0 z-50 pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isChatOpen || isEditingDeck || isCreatingPost ? 'translate-y-32' : 'translate-y-0'}`}>
                <nav 
                  className="pointer-events-auto w-full md:w-fit md:mx-auto h-16 md:h-20 bg-white/30 backdrop-blur-2xl border-t md:border border-white/20 md:rounded-full transition-all duration-200 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] pb-safe md:pb-0 md:px-4"
                >
                  <div className="relative w-full md:min-w-[480px] max-w-2xl mx-auto h-full grid grid-cols-4 items-center px-2">
                      {/* Sliding Background Pill */}
                      <div 
                        className="absolute h-[48px] rounded-[24px] top-1/2 -translate-y-1/2 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-zinc-200"
                        style={{ 
                          width: 'calc(25% - 16px)', 
                          left: `calc(${viewIndex} * 25% + 8px)`
                        }}
                      />
                      
                      <NavItem 
                        label="Home"
                        icon={role === UserRole.INVESTOR ? Compass : LayoutDashboard} 
                        active={currentView === 'home'} 
                        onClick={() => handleNavClick('home')} 
                        theme={navTheme}
                      />
                      <NavItem 
                        label="Community"
                        icon={Globe} 
                        active={currentView === 'community'} 
                        onClick={() => handleNavClick('community')} 
                        theme={navTheme}
                      />
                      <NavItem 
                        label="Messages"
                        icon={Inbox} 
                        active={currentView === 'messages'} 
                        onClick={() => handleNavClick('messages')} 
                        theme={navTheme}
                        badge={hasUnreadMessages}
                      />
                      <NavItem 
                        label="Settings"
                        icon={User} 
                        active={currentView === 'settings'} 
                        onClick={() => handleNavClick('settings')} 
                        theme={navTheme}
                      />
                  </div>
                </nav>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
