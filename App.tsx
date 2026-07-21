/// <reference types="vite/client" />
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, Users, MessageCircle, Settings, ChevronRight, 
  Lock, Bell, Languages, ChevronLeft, User, KeyRound, Shield,  MapPin, Mail, Loader2, Check, Building2, Receipt, Download, Banknote, ArrowRight, Calendar, Clock, X, UserMinus, AlertTriangle, AlertCircle, Compass, Inbox, ScrollText, Home, Search, Plus, Power, Award, BellRing, Eye, LifeBuoy, BadgeCheck, Sun, Moon
} from 'lucide-react';
import { UserRole, AppState, Startup } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { SplashScreen } from './components/SplashScreen';
import { CircleLoader } from './components/CircleLoader';
import { Button } from './components/Button';
import { StorageService } from './services/storageService';
import { supabase } from './services/supabaseClient';
import LandingSite from './components/LandingSite';
import FounderDashboard from './components/founderdashboard';
import SwipeDeck from './components/swipedeck';
import ChatInterface from './components/ChatInterface';
import CommunityFeed from './components/communityfeed';
import AuthScreen from './components/AuthScreen';
import UserProfileView from './components/UserProfileView';
import { CreatePostModal } from './components/CreatePostModal';
import { LimelightNav } from './components/LimelightNav';
import { LegalView } from './components/LegalView';
import { SideNav } from './components/SideNav';
import { SettingsView } from './components/SettingsView';
// @ts-ignore
import { PaystackButton } from 'react-paystack';
import authImage from './src/assets/images/com.png';
import comImage from './src/assets/images/kio.jpg';



// Notification Toast Component
const NotificationToast = React.memo(({ 
    notification, 
    onClick, 
    onDismiss 
}: { 
    notification: { sender: string, avatar?: string, message: string, userId: string, type?: 'error' | 'message' | 'system' } | null, 
    onClick: () => void, 
    onDismiss: () => void 
}) => {
    if (!notification) return null;

    return (
        <motion.div 
            key="notification-toast"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.8, bottom: 0.1 }}
            onDragEnd={(_, info) => {
                if (info.offset.y < -50) {
                    onDismiss();
                }
            }}
            className="fixed top-4 left-4 right-4 z-[60] flex justify-center cursor-grab active:cursor-grabbing"
        >
            <div 
                className={`backdrop-blur-xl border shadow-2xl rounded-full p-2 pr-5 flex items-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform max-w-md w-full ${
                    notification.type === 'error' ? 'bg-red-50/90 border-red-200' : 
                    notification.type === 'system' ? 'bg-emerald-50/90 border-emerald-200' : 
                    'bg-white/90 border-white/50'
                }`}
                onClick={(e) => {
                    // Prevent click when dragging
                    if (e.defaultPrevented) return;
                    onClick();
                }}
            >
                {notification.avatar ? (
                     <img src={notification.avatar} className="w-10 h-10 rounded-full object-cover border border-zinc-100" alt="" loading="lazy" />
                ) : notification.type === 'error' ? (
                     <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertCircle size={20} /></div>
                ) : notification.type === 'system' ? (
                     <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><Check size={20} /></div>
                ) : (
                     <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500"><Bell size={20} /></div>
                )}
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <h4 className={`font-bold text-sm truncate ${
                            notification.type === 'error' ? 'text-red-800' : 
                            notification.type === 'system' ? 'text-emerald-800' : 
                            'text-zinc-900'
                        }`}>Notification</h4>
                        <span className={`text-[10px] font-medium ${
                            notification.type === 'error' ? 'text-red-400' : 
                            notification.type === 'system' ? 'text-emerald-400' : 
                            'text-zinc-400'
                        }`}>Now</span>
                    </div>
                    <p className={`text-xs truncate ${
                        notification.type === 'error' ? 'text-red-600' : 
                        notification.type === 'system' ? 'text-emerald-600' : 
                        'text-zinc-500'
                    }`}>{notification.message}</p>
                </div>
                {notification.type === 'message' && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full shrink-0"></div>}
            </div>
        </motion.div>
    );
});

NotificationToast.displayName = 'NotificationToast';

const App = () => {
  const [appState, setAppState] = useState<AppState>(() => {
    if (localStorage.getItem('connectup_logged_in') === 'true') {
      return 'MAIN_APP';
    }
    return 'INITIALIZING';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('connectup_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('connectup_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('connectup_cached_role') as UserRole) || UserRole.INVESTOR;
  });
  const [currentView, setCurrentView] = useState<string>(() => {
    return localStorage.getItem('connectup_current_view') || 'home';
  });
  const [activeStartupIdForChat, setActiveStartupIdForChat] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [globalLegalView, setGlobalLegalView] = useState<'privacy' | 'terms' | null>(null);
  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postToQuote, setPostToQuote] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'free'>('monthly');
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [communityRefreshTrigger, setCommunityRefreshTrigger] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Persist view state to localStorage
  useEffect(() => {
    localStorage.setItem('connectup_current_view', currentView);
  }, [currentView]);

  // Presence Update Interval - ONLY during MAIN_APP
  useEffect(() => {
    if (appState !== 'MAIN_APP' || !currentUserId) return;

    const update = () => StorageService.updatePresence();
    update();
    const interval = setInterval(update, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [appState, currentUserId]);

  const [selectedCommunityProfileId, setSelectedCommunityProfileId] = useState<string | null>(null);

  // Notifications State
  const [notification, setNotification] = useState<{ sender: string, avatar?: string, message: string, userId: string, type?: 'error' | 'message' | 'system' } | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const notificationTimeoutRef = useRef<any>(null);

  // Auto-cleanup notification timer on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Settings State
  const [settingsPath, setSettingsPath] = useState<'root' | 'profile' | 'security' | 'password' | 'chat-prefs' | 'terms' | 'privacy' | 'subscription' | 'support'>('root');
  const [chatSounds, setChatSounds] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  
  // User Profile State
  const [userProfile, setUserProfile] = useState<{
    name: string;
    title: string;
    email: string;
    location: string;
    avatarUrl: string;
    plan?: string;
    billingCycle?: string | null;
    subscriptionEndDate?: string | null;
  }>(() => {
    try {
      const cached = localStorage.getItem('connectup_cached_profile');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return {
      name: '',
      title: '',
      email: '',
      location: '',
      avatarUrl: '',
      plan: 'free',
      billingCycle: null,
      subscriptionEndDate: null,
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize role to localStorage
  useEffect(() => {
    localStorage.setItem('connectup_cached_role', role);
  }, [role]);

  // Synchronize userProfile to localStorage
  useEffect(() => {
    if (userProfile && (userProfile.name || userProfile.email)) {
      localStorage.setItem('connectup_cached_profile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  // Background Session Verification (when we bypass INITIALIZING to MAIN_APP optimistically)
  useEffect(() => {
    const verifySession = async () => {
      if (appState === 'MAIN_APP' && !currentUserId) {
        try {
          await StorageService.init();
          if (StorageService.isMockMode()) {
            setCurrentUserId('mock-user-123');
            return;
          }
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session) {
            console.warn("Session invalid during optimistic load background check. Logging out...");
            handleLogout();
            return;
          }
          setCurrentUserId(sessionData.session.user.id);
        } catch (e) {
          console.error("Background session check exception:", e);
        }
      }
    };
    verifySession();
  }, [appState, currentUserId]);

  // Wrapped create post callback to enforce Pro membership
  const handleOpenCreatePost = useCallback((quotePost: any = null) => {
    if (userProfile?.plan === 'pro') {
      if (quotePost) {
        setPostToQuote(quotePost);
      } else {
        setPostToQuote(null);
      }
      setIsCreatingPost(true);
    } else {
      setNotification({
        sender: "Premium Feature",
        message: "Creating new posts is exclusive to Pro members.",
        userId: "sys",
        type: 'system'
      });
    }
  }, [userProfile, setNotification]);

  // Initialize Storage and Check Connection
  useEffect(() => {
    const init = async () => {
       try {
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
                   sender: "Schema Error",
                   message: `Missing tables: ${status.missingTables.join(', ')}.`,
                   userId: "sys",
                   type: 'error'
               });
           }
       } catch (e: any) {
           console.error("Storage initialization failed", e);
           setNotification({
               sender: "Network Error",
               message: e.message || "Failed to reach the database.",
               userId: "sys",
               type: 'error'
           });
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
      
      // Enforce transaction-based plan verification
      const verifiedPlan = await StorageService.performDataCheck();
      console.log("Is mock mode:", StorageService.isMockMode());
      const profile = await StorageService.getUserProfile(uid);
      
      if (profile) {
        let currentProfile = profile;
        if (verifiedPlan) currentProfile.plan = verifiedPlan;

        if (currentProfile.role && currentProfile.role !== role) {
           setRole(currentProfile.role);
        }

        setUserProfile(prev => ({
           ...prev,
           name: currentProfile.name || prev.name || '',
           title: currentProfile.title || prev.title || '',
           avatarUrl: currentProfile.avatarUrl || prev.avatarUrl || '',
           location: currentProfile.location || prev.location || '',
           email: email || prev.email,
           plan: currentProfile.plan || prev.plan
        }));

        try {
          const txs = await StorageService.getTransactions();
          const hasTrialTx = txs.some(tx => tx.billing_cycle === 'trial');
          const identifier = uid || email || 'guest';
          const hasLocalStorageTrial = localStorage.getItem(`trial_used_${identifier}`) === 'true';
          setHasUsedTrial(hasTrialTx || hasLocalStorageTrial);
        } catch (err) {
          console.error("Error loading trial status:", err);
        }
      } else if (email) {
          // Fallback if profile row is missing but user is authenticated
          setUserProfile(prev => ({
              ...prev,
              name: prev.name || email.split('@')[0],
              email: email
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
                  }, 3000);
                  
                  if (chatSounds) {
                      const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3');
                      audio.volume = 0.5;
                      audio.onerror = () => console.warn("Audio failed to load, skipping sound");
                      
                      // Handle play promise to avoid "interrupted by pause" error
                      const playPromise = audio.play();
                      if (playPromise !== undefined) {
                          playPromise.catch(() => {
                              // Silently catch interruptions or autoplay blocks
                          });
                      }
                  }
              }
          }
      });

      return () => {
          sub.unsubscribe();
      };
  }, [appState, currentUserId, currentView, chatSounds]);

  // Initializing Auth
  useEffect(() => {
    const initialize = async () => {
      try {
        await StorageService.init();
        
        if (StorageService.isMockMode()) {
          const isMockLoggedIn = localStorage.getItem('connectup_logged_in') === 'true';
          if (isMockLoggedIn) {
            setCurrentUserId('mock-user-123');
            setAppState('MAIN_APP');
            return;
          }
          setAppState('LANDING');
          return;
        }
        
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData?.session) {
          localStorage.removeItem('connectup_logged_in');
          if (appState === 'INITIALIZING') {
            setAppState('LANDING');
          }
          return;
        }

        const userRole = await StorageService.checkUserRole(sessionData.session.user.id);
        if (userRole) {
          setRole(userRole);
          if (sessionData.session.user.email) {
            setUserProfile(prev => ({ ...prev, email: sessionData.session.user.email }));
          }
          setCurrentUserId(sessionData.session.user.id);
          localStorage.setItem('connectup_logged_in', 'true');
          setAppState('MAIN_APP'); // Directly load MAIN_APP to eliminate the splash transition delay
        } else {
          setAppState('AUTH');
        }
      } catch (e) {
        console.error("Initialization error:", e);
        localStorage.removeItem('connectup_logged_in');
        if (appState === 'INITIALIZING') {
          setAppState('LANDING');
        }
      }
    };
    
    if (appState === 'INITIALIZING') {
      initialize();
    }
  }, [appState]);

  const handleSplashFinish = useCallback(async () => {
    setAppState('MAIN_APP');
    // Respect persisted view
    const savedView = localStorage.getItem('connectup_current_view');
    if (savedView) {
      setCurrentView(savedView);
    }
  }, []);

  const handleAuthComplete = useCallback(async (selectedRole: UserRole, email?: string) => {
    setRole(selectedRole);
    if (email) {
      setUserProfile(prev => ({ ...prev, email }));
    }
    
    if (StorageService.isMockMode()) {
      setCurrentUserId('mock-user-123');
    } else {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        setCurrentUserId(sessionData.session.user.id);
      }
    }

    localStorage.setItem('connectup_logged_in', 'true');
    setAppState('MAIN_APP');
    setCurrentView('home');
    localStorage.setItem('connectup_current_view', 'home');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      if (!StorageService.isMockMode()) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn("Sign out warning:", e);
    }
    // RESET STATE TO PREVENT PROFILE MIX-UP
    setCurrentUserId(null);
    localStorage.removeItem('connectup_logged_in');
    localStorage.removeItem('connectup_cached_profile');
    localStorage.removeItem('connectup_cached_role');
    setUserProfile({
      name: '',
      title: '',
      email: '',
      location: '',
      avatarUrl: '',
    });
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
              localStorage.removeItem('connectup_logged_in');
              localStorage.removeItem('connectup_cached_profile');
              localStorage.removeItem('connectup_cached_role');
              setUserProfile({
                  name: '',
                  title: '',
                  email: '',
                  location: '',
                  avatarUrl: '',
              });
              
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

  const handleUpdatePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        setNotification({
             sender: "Error",
             message: "Passwords do not match.",
             userId: "sys",
             type: 'error'
        });
        return;
    }
    setPasswordUpdating(true);
    try {
        if (StorageService.isMockMode()) {
            setNotification({
                 sender: "Password",
                 message: "Password updated successfully (Mock Mode).",
                 userId: "sys",
                 type: 'system'
            });
            setSettingsPath('root');
            setNewPassword('');
            setConfirmPassword('');
            return;
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setNotification({
             sender: "Password",
             message: "Password updated successfully.",
             userId: "sys",
             type: 'system'
        });
        setSettingsPath('root');
        setNewPassword('');
        setConfirmPassword('');
    } catch (e: any) {
        console.error(e);
        setNotification({
             sender: "Error",
             message: e.message || "Failed to update password.",
             userId: "sys",
             type: 'error'
        });
    } finally {
        setPasswordUpdating(false);
    }
  }, [newPassword]);

  const handleSaveProfile = useCallback(async (updatedProfile?: any) => {
    setIsSaving(true);
    try {
      const profileToSave = updatedProfile || userProfile;
      await StorageService.updateUserProfile({
        name: profileToSave.name,
        title: profileToSave.title,
        avatarUrl: profileToSave.avatarUrl,
        location: profileToSave.location,
        email: profileToSave.email
      });
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
      setIsSaving(false);
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
      if (notification && notification.type === 'message') {
          setActiveStartupIdForChat(notification.userId); 
          setCurrentView('messages');
          setNotification(null);
          setHasUnreadMessages(false);
          setIsCreatingPost(false); // Reset
      } else {
          setNotification(null); // Just dismiss for error/system clicks
      }
  }, [notification]);

  const viewIndex = useMemo(() => {
    if (currentView === 'home') return 0;
    if (currentView === 'messages') return 1;
    if (currentView === 'community') return 3;
    return 4;
  }, [currentView]);

  const handleConnect = useCallback((targetId: string) => {
      if (targetId === currentUserId) return;
      setActiveStartupIdForChat(targetId);
      setCurrentView('messages');
  }, [currentUserId]);

  const handleCommunityMessage = useCallback((uid: string) => {
      if (uid === currentUserId) return;
      setSelectedCommunityProfileId(null);
      setActiveStartupIdForChat(uid);
      setCurrentView('messages');
  }, [currentUserId]);

  const handleStartFreeTrial = useCallback(async () => {
    if (!userProfile) return;
    if (hasUsedTrial) {
      setNotification({
        sender: "Subscription",
        message: "You have already used your 1-week free trial. Please select a plan to continue.",
        userId: "sys",
        type: 'error'
      });
      return;
    }
    setIsProcessing(true);
    
    // Calculate end date (7 days from now)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    try {
      await StorageService.updateUserProfile({
        plan: 'pro',
        billingCycle: 'trial',
        subscriptionEndDate: endDate.toISOString()
      });
      
      // Record a transaction of $0 for the trial to pass performDataCheck
      await StorageService.recordTransaction(0, 'pro', 'trial');

      // Set trial_used in localStorage to prevent starting again
      const identifier = currentUserId || userProfile.email || 'guest';
      localStorage.setItem(`trial_used_${identifier}`, 'true');
      setHasUsedTrial(true);

      setUserProfile(prev => prev ? ({ 
        ...prev, 
        plan: 'pro',
        billingCycle: 'trial',
        subscriptionEndDate: endDate.toISOString()
      }) : null);
      setNotification({
        sender: "Subscription",
        message: "Your 1-week free trial has started!",
        userId: "sys",
        type: 'system'
      });
      setSettingsPath('root');
    } catch (e) {
      console.error('Free trial start error:', e);
      setNotification({
        sender: "Error",
        message: "Failed to start free trial. Please try again later.",
        userId: "sys",
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [userProfile, hasUsedTrial, currentUserId, setNotification, setHasUsedTrial]);

  const handlePaystackSuccess = useCallback(async (reference: any) => {
    if (!userProfile) return;
    setIsProcessing(true);
    const amount = billingCycle === 'monthly' ? 5 : 60;
    
    // Calculate end date
    const endDate = new Date();
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    if (StorageService.isMockMode()) {
       await StorageService.updateUserProfile({
         plan: 'pro',
         billingCycle: billingCycle,
         subscriptionEndDate: endDate.toISOString()
       });
       setUserProfile(prev => prev ? ({ 
         ...prev, 
         plan: 'pro',
         billingCycle: billingCycle,
         subscriptionEndDate: endDate.toISOString()
       }) : null);
       setIsProcessing(false);
       setSettingsPath('root');
       return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      // Verify payment on server
      const verifyRes = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reference: reference.reference, billingCycle, amount }),
      });
      
      if (!verifyRes.ok) {
        throw new Error(`Payment verification server error: ${verifyRes.status}`);
      }

      const verifyData = await verifyRes.json();
      
      if (verifyData.status && verifyData.data.status === 'success') {
          // Backend has already securely updated the database
          // Just update our local React state
          setUserProfile(prev => prev ? ({ 
            ...prev, 
            plan: 'pro',
            billingCycle: billingCycle,
            subscriptionEndDate: endDate.toISOString()
          }) : null);
          
          // Refresh local transactions view
          const txs = await StorageService.getTransactions();
          setTransactions(txs);
          
          setNotification({
            sender: "Success",
            message: "You are now on the Pro Plan! Enjoy premium features.",
            userId: "sys",
            type: 'system'
          });
      } else {
          throw new Error("Payment verification failed");
      }
    } catch (e) {
      console.error('Subscription update error:', e);
      setNotification({
        sender: "Error",
        message: "Payment verification failed. Please contact support.",
        userId: "sys",
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [billingCycle, userProfile, setNotification]);

  const handleSubscribe = useCallback(() => {
    setNotification({
        sender: "Payment",
        message: "Redirecting to secure gateway...",
        userId: "sys",
        type: 'system'
    });
  }, [setNotification]);

  const handleCancelSubscription = useCallback(async () => {
    setIsCancelModalOpen(false);
    setIsProcessing(true);
    try {
      await StorageService.updateUserProfile({ 
        plan: 'free',
        billingCycle: null,
        subscriptionEndDate: null
      });
      setUserProfile(prev => ({ 
        ...prev, 
        plan: 'free',
        billingCycle: null,
        subscriptionEndDate: null
      }));
      setNotification({
        sender: "Subscription",
        message: "Your subscription has been cancelled.",
        userId: "sys",
        type: 'system'
      });
    } catch (e) {
      console.error('Subscription cancellation error:', e);
      setNotification({
        sender: "Error",
        message: "Failed to cancel subscription. Please contact support.",
        userId: "sys",
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [setIsProcessing, setUserProfile]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (currentView === 'settings' && settingsPath === 'subscription') {
        const txs = await StorageService.getTransactions();
        setTransactions(txs);
        
        const hasTrialTx = txs.some(tx => tx.billing_cycle === 'trial');
        const identifier = currentUserId || userProfile?.email || 'guest';
        const hasLocalStorageTrial = localStorage.getItem(`trial_used_${identifier}`) === 'true';
        setHasUsedTrial(hasTrialTx || hasLocalStorageTrial);
      }
    };
    fetchTransactions();
  }, [currentView, settingsPath, currentUserId, userProfile?.email]);

  const mainContent = useMemo(() => {
    if (currentView === 'community') {
      if (!userProfile || userProfile.plan !== 'pro') {
        return (
          <div className="relative h-full w-full flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            {/* Background Image of the ConnectUp Collage */}
            <div className="absolute inset-0 z-0">
              <img 
                src={comImage} 
                alt="ConnectUp Community Collage" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/35" />
            </div>

            {/* Content card centered with vibrant yellow branding details */}
            <div className="relative z-10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md p-8 rounded-[32px] shadow-2xl border border-amber-400/40 dark:border-amber-400/30 max-w-sm flex flex-col items-center transition-all hover:scale-[1.01] hover:shadow-amber-500/10 hover:border-amber-400/60">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-900/40 shadow-inner">
                <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f512/512.gif" alt="Lock" className="w-10 h-10 object-contain drop-shadow-sm opacity-90" />
              </div>
              <h3 className="text-xl font-display font-black tracking-tight mb-2 text-zinc-900 dark:text-zinc-100">Community Access</h3>
              <p className="text-zinc-600 dark:text-zinc-300 text-sm mb-6 leading-relaxed font-medium">Join the conversation with thousands of founders and investors. Upgrade to Pro to unlock.</p>
              <button 
                onClick={() => {
                  setSettingsPath('subscription');
                  setCurrentView('settings');
                }}
                className="w-full py-3.5 px-8 bg-amber-400 hover:bg-amber-300 text-zinc-900 rounded-xl font-extrabold transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Pro Plans</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        );
      }
      return (
          <CommunityFeed 
              userProfile={userProfile} 
              onMessage={handleCommunityMessage} 
              onViewProfile={setSelectedCommunityProfileId} 
              refreshTrigger={communityRefreshTrigger}
              onAddPost={() => handleOpenCreatePost()}
              onQuotePost={(post) => handleOpenCreatePost(post)}
          />
      );
    }

    if (currentView === 'messages') {
      return (
          <ChatInterface 
          role={role} 
          activeStartupId={activeStartupIdForChat} 
          soundEnabled={chatSounds}
          readReceiptsEnabled={readReceipts}
          onChatStateChange={setIsChatOpen}
          onViewProfile={setSelectedCommunityProfileId}
          onClose={() => handleNavClick('home')}
          />
      );
    }
    
    if (currentView === 'home') {
        return role === UserRole.INVESTOR ? (
            <SwipeDeck onMatch={handleMatch} userProfile={userProfile} /> 
        ) : ( 
            <FounderDashboard 
                userProfile={userProfile} 
                onConnect={handleConnect} 
                isEditingDeck={isEditingDeck}
                onEditStateChange={setIsEditingDeck}
                onPostCreationStateChange={setIsCreatingPost}
                onMeetingModalStateChange={setIsMeetingModalOpen}
                onNavigateHome={() => setCurrentView('home')}
            /> 
        );
    }
    
    if (currentView === 'settings') {
      return (
        <SettingsView
          userProfile={userProfile}
          transactions={transactions}
          billingCycle={billingCycle}
          setBillingCycle={setBillingCycle}
          onUpdateProfile={handleSaveProfile}
          onAvatarChange={handleAvatarChange}
          onUpdatePassword={handleUpdatePassword}
          passwordState={{
            new: newPassword,
            setNew: setNewPassword,
            confirm: confirmPassword,
            setConfirm: setConfirmPassword,
            updating: passwordUpdating
          }}
          notificationState={{
            sounds: chatSounds,
            setSounds: setChatSounds,
            readReceipts: readReceipts,
            setReadReceipts: setReadReceipts
          }}
          onLogout={handleLogout}
          onDeleteAccount={() => setIsConfirmingDelete(true)}
          isPro={userProfile?.plan === 'pro'}
          role={role as any}
          onCancelSubscription={handleCancelSubscription}
          hasUsedTrial={hasUsedTrial}
          onStartFreeTrial={handleStartFreeTrial}
          paystackButton={
            userProfile?.plan !== 'pro' && (
              <PaystackButton
                {...{
                  email: userProfile.email,
                  amount: (billingCycle === 'monthly' ? 500 : billingCycle === 'yearly' ? 2900 : 0) * 1400,
                  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
                  text: isProcessing ? 'Processing...' : 'Continue to Payment',
                  onSuccess: (reference: any) => handlePaystackSuccess(reference),
                  onClose: () => setIsProcessing(false),
                  className: "w-full py-4 sm:py-[18px] rounded-xl font-bold text-base transition-all shadow-md border bg-zinc-900 text-white border-zinc-800 hover:bg-black hover:scale-[1.01] active:text-white active:scale-[0.98] cursor-pointer shadow-lg shadow-zinc-200 flex items-center justify-center gap-2"
                }}
                disabled={isProcessing}
              />
            )
          }
        />
      );
    }


               





    return role === UserRole.INVESTOR ? (
        <SwipeDeck onMatch={handleMatch} userProfile={userProfile} /> 
    ) : ( 
        <FounderDashboard 
            userProfile={userProfile} 
            onConnect={handleConnect} 
            isEditingDeck={isEditingDeck}
            onEditStateChange={setIsEditingDeck}
            onPostCreationStateChange={setIsCreatingPost}
            onMeetingModalStateChange={setIsMeetingModalOpen}
            onNavigateHome={() => setCurrentView('home')}
        /> 
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
      handleLogout, 
      isConfirmingDelete, 
      isDeletingAccount, 
      handleDeleteAccount, 
      handleMatch, 
      handleConnect, 
      isUploadingAvatar,
      isSaving,
      billingCycle,
      handleUpdatePassword,
      newPassword,
      setNewPassword,
      passwordUpdating
  ]);


  const isLockedView = appState !== 'LANDING' && (currentView === 'home' || currentView === 'messages');

  return (
    <div className={`${appState === 'LANDING' || appState === 'AUTH' || appState === 'SPLASH' || appState === 'INITIALIZING' ? 'bg-white dark:bg-[#0D0D0F]' : 'bg-[#FFFCF0] dark:bg-[#0D0D0F]'} flex selection:bg-brand-primary/20 selection:text-brand-primary ${appState === 'LANDING' ? 'min-h-screen' : isLockedView ? 'h-[100dvh] w-full overflow-hidden overscroll-none' : 'min-h-screen w-full relative'} relative transition-colors duration-700 font-sans`}>
      {appState !== 'LANDING' && appState !== 'AUTH' && appState !== 'SPLASH' && appState !== 'INITIALIZING' && (
        <>
          {/* Ambient glassmorphic glowing spheres to elevate the sidebar's glass reflection */}
          <div className="absolute top-12 left-[-180px] w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[130px] pointer-events-none z-0" />
          <div className="absolute bottom-12 left-[-150px] w-[400px] h-[400px] bg-[#EAB308]/10 rounded-full blur-[110px] pointer-events-none z-0" />
          <div className="absolute top-[20%] right-[-200px] w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[150px] pointer-events-none z-0" />
          
          <SideNav 
            currentView={currentView} 
            onViewChange={setCurrentView} 
            userProfile={userProfile}
            onPostClick={() => handleOpenCreatePost()}
          />
        </>
      )}
      <div className={`w-full bg-transparent relative flex flex-col font-sans ${
        appState === 'LANDING' 
          ? 'min-h-screen' 
          : isLockedView ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'
      }`}>
        {appState === 'INITIALIZING' && StorageService.isMockMode() === false ? (
          <div className="flex h-screen w-full items-center justify-center">
            <CircleLoader size="lg" />
          </div>
        ) : appState === 'LANDING' ? (
          <>
            <LandingSite onLoginClick={() => setAppState('AUTH')} onLegalView={setGlobalLegalView} />
            {globalLegalView && (
              <LegalView type={globalLegalView} onBack={() => setGlobalLegalView(null)} />
            )}
          </>
        ) : appState === 'SPLASH' ? (
          <SplashScreen onFinish={handleSplashFinish} />
        ) : appState === 'AUTH' ? (
          <>
            <AuthScreen onComplete={handleAuthComplete} onViewLegal={setGlobalLegalView} onBackHome={() => setAppState('LANDING')} />
            {globalLegalView && (
              <LegalView type={globalLegalView} onBack={() => setGlobalLegalView(null)} />
            )}
          </>
        ) : (
          <>
            {/* Global Atmospheric Background - Optimized for mobile/tablet */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none fixed">
                <div className="absolute top-[-20%] left-[-10%] w-[140%] h-[80%] bg-brand-primary/10 rounded-[50%] blur-[40px] lg:blur-[140px] opacity-20 lg:animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[70%] bg-brand-primary/10 rounded-full blur-[30px] lg:blur-[120px] opacity-10 lg:animate-blob lg:animation-delay-2000"></div>
                <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-brand-primary/5 rounded-full blur-[100px] opacity-5 lg:animate-blob lg:animation-delay-4000"></div>
            </div>

            <main className={`flex-1 pt-0 ${isLockedView ? 'pb-[72px] md:pb-0' : 'pb-20 md:pb-0'} bg-transparent relative z-10 w-full max-w-[1920px] mx-auto`}>
              {mainContent}
            </main>

            {/* Global Notification Toast */}
            <AnimatePresence>
              {notification && (
                <NotificationToast 
                    notification={notification} 
                    onClick={handleNotificationClick} 
                    onDismiss={() => setNotification(null)} 
                />
              )}
            </AnimatePresence>

           {/* Delete Account Confirmation Modal */}
           {isConfirmingDelete && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeletingAccount && setIsConfirmingDelete(false)}></div>
                   <div className="relative bg-white border border-zinc-200 w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-300 pointer-events-auto">
                     <button 
                        onClick={() => !isDeletingAccount && setIsConfirmingDelete(false)}
                        className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                     >
                        <X size={20} />
                     </button>
                     <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto border border-red-100">
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
                           className="w-full h-14 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 hover:shadow-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl border border-red-700 disabled:opacity-50"
                        >
                           {isDeletingAccount ? <Loader2 className="animate-spin" /> : 'Yes, Delete Everything'}
                        </button>
                        <button 
                           onClick={() => setIsConfirmingDelete(false)}
                           disabled={isDeletingAccount}
                           className="w-full h-14 bg-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-200 active:scale-[0.98] transition-all"
                        >
                           Cancel
                        </button>
                     </div>
                  </div>
               </div>
           )}

            {isCreatingPost && (
              <CreatePostModal 
                userProfile={userProfile} 
                onClose={() => {
                  setIsCreatingPost(false);
                  setPostToQuote(null);
                }} 
                quotedPost={postToQuote}
                onPostCreated={() => {
                  setCommunityRefreshTrigger(prev => prev + 1);
                  setPostToQuote(null);
                  if (currentView !== 'community') {
                    setCurrentView('community');
                  }
                }}
              />
            )}

            {selectedCommunityProfileId && (
                <UserProfileView 
                  userId={selectedCommunityProfileId} 
                  onClose={() => setSelectedCommunityProfileId(null)} 
                  onMessage={handleCommunityMessage}
                />
            )}

            {/* Limelight Navigation Bar */}
            <div className={`fixed bottom-2 md:bottom-2 left-0 right-0 z-50 pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] w-full md:w-fit md:mx-auto flex justify-center pb-safe md:pb-0 px-4 lg:hidden ${
              currentView === 'messages'
                ? `${isChatOpen ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`
                : (isChatOpen || isEditingDeck || isCreatingPost || isMeetingModalOpen || isConfirmingDelete || selectedCommunityProfileId 
                    ? 'translate-y-32 md:translate-y-32 md:opacity-0 md:pointer-events-none' 
                    : 'translate-y-0 opacity-100')
            }`}>
                  <LimelightNav 
                    activeIndex={viewIndex}
                    items={[
                      { id: 'home', icon: <Home />, label: 'Home', onClick: () => handleNavClick('home') },
                      { 
                        id: 'messages', 
                        icon: <MessageCircle />, 
                        label: 'Chat', 
                        onClick: () => handleNavClick('messages'),
                        badge: hasUnreadMessages
                      },
                      { 
                        id: 'plus', 
                        icon: <Plus className={userProfile?.plan === 'pro' ? 'text-brand-primary' : 'opacity-20'} />, 
                        label: 'Create', 
                        onClick: () => handleOpenCreatePost() 
                      },
                      { id: 'community', icon: <Users />, label: 'Community', onClick: () => handleNavClick('community') },
                      { id: 'settings', icon: <Settings />, label: 'Settings', onClick: () => handleNavClick('settings') },
                    ]}
                    className="bg-white/20 dark:bg-black/20 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_12px_40px_0_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.4)] rounded-full h-12 sm:h-20 w-[95%] max-w-lg md:max-w-3xl md:min-w-[500px]"
                  />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;