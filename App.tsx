/// <reference types="vite/client" />
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, Users, MessageCircle, Settings, ChevronRight, 
  Lock, Bell, Languages, ChevronLeft, User, KeyRound, Shield,  MapPin, Mail, Loader2, Check, Building2, Receipt, Download, Banknote, ArrowRight, Calendar, Clock, X, UserMinus, AlertTriangle, AlertCircle, Compass, Inbox, ScrollText, Home, Search, Plus, Power, Award, BellRing, Eye
} from 'lucide-react';
import { UserRole, AppState, Startup } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { SplashScreen } from './components/SplashScreen';
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
// @ts-ignore
import { PaystackButton } from 'react-paystack';


// Modern Settings Layout
const SettingsLayout = ({ title, onBack, children }: { title: string, onBack?: () => void, children?: React.ReactNode }) => (
  <div className="h-full bg-[#FFFCF0] flex flex-col animate-in fade-in duration-700 overflow-y-auto pb-32 safe-area-top text-zinc-900 relative">
     {/* Theme Background */}
     <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-5%] right-[-5%] w-[70%] h-[50%] bg-brand-primary/20 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[0%] left-[-5%] w-[60%] h-[60%] bg-brand-primary/10 rounded-full blur-[120px] opacity-10"></div>
     </div>

     <div className="px-3 py-3 sm:px-10 sm:py-6 sticky top-0 z-30 flex items-center bg-[#FFFCF0]/85 backdrop-blur-3xl border-b border-zinc-200">
        {onBack && (
          <button onClick={onBack} className="mr-3 sm:mr-6 p-2.5 sm:p-3 bg-white rounded-xl sm:rounded-2xl transition-all hover:scale-105 active:scale-95 text-zinc-900 shadow-sm border border-zinc-200 hover:shadow-md cursor-pointer">
            <ChevronLeft size={18} className="sm:size-[20px]" />
          </button>
        )}
          <div>
          <h2 className="text-xl sm:text-4xl font-display font-[900] tracking-tighter text-zinc-900 leading-none">{title}</h2>
        </div>
     </div>
     <div className="px-3 py-4 sm:px-10 sm:py-10 lg:p-16 space-y-6 sm:space-y-12 max-w-[1600px] mx-auto w-full relative z-10">
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
                        }`}>{notification.sender}</h4>
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
  const [appState, setAppState] = useState<AppState>('INITIALIZING');
  const [role, setRole] = useState<UserRole>(UserRole.INVESTOR);
  const [currentView, setCurrentView] = useState<string>('home'); // 'home' | 'messages' | 'settings'
  const [activeStartupIdForChat, setActiveStartupIdForChat] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [globalLegalView, setGlobalLegalView] = useState<'privacy' | 'terms' | null>(null);
  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [communityRefreshTrigger, setCommunityRefreshTrigger] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
  const [settingsPath, setSettingsPath] = useState<'root' | 'profile' | 'security' | 'password' | 'chat-prefs' | 'terms' | 'privacy' | 'subscription'>('root');
  const [chatSounds, setChatSounds] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [newPassword, setNewPassword] = useState('');
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
  }>({
    name: '',
    title: '',
    email: '',
    location: '',
    avatarUrl: '',
    plan: 'free',
    billingCycle: null,
    subscriptionEndDate: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
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
      
      // Enforce transaction-based plan verification
      const verifiedPlan = await StorageService.performDataCheck();
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
                  }, 4000);
                  
                  if (chatSounds) {
                      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.m4a');
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
          setAppState('LANDING');
          return;
        }
        
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData?.session) {
          setAppState('LANDING');
          return;
        }

        const userRole = await StorageService.checkUserRole(sessionData.session.user.id);
        if (userRole) {
          setRole(userRole);
          if (sessionData.session.user.email) {
            setUserProfile(prev => ({ ...prev, email: sessionData.session.user.email }));
          }
          setCurrentUserId(sessionData.session.user.id);
          setAppState('SPLASH'); 
        } else {
          setAppState('AUTH');
        }
      } catch (e) {
        console.error("Initialization error:", e);
        setAppState('LANDING');
      }
    };
    
    if (appState === 'INITIALIZING') {
      initialize();
    }
  }, [appState]);

  const handleSplashFinish = useCallback(async () => {
    setAppState('MAIN_APP');
    setCurrentView('home');
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

    setAppState('MAIN_APP');
    setCurrentView('home');
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

  const handleSaveProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await StorageService.updateUserProfile({
        name: userProfile.name,
        title: userProfile.title,
        avatarUrl: userProfile.avatarUrl,
        location: userProfile.location,
        email: userProfile.email
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
    if (currentView === 'community') return 1;
    if (currentView === 'messages') return 3;
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

  const handlePaystackSuccess = useCallback(async (reference: any) => {
    if (!userProfile) return;
    setIsProcessing(true);
    const amount = billingCycle === 'monthly' ? 6 : 60;
    
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
      }
    };
    fetchTransactions();
  }, [currentView, settingsPath]);

  const mainContent = useMemo(() => {
    if (currentView === 'community') {
      if (!userProfile || userProfile.plan !== 'pro') {
        return (
          <div className="relative h-full w-full bg-slate-50/50">
            <div className="absolute inset-0 overflow-hidden opacity-30 select-none pointer-events-none pb-24 blur-[2px]">
                <CommunityFeed 
                    userProfile={userProfile || { id: 'temp', name: 'Temp', title: '', email: '', role: 'founder' }} 
                    onMessage={handleCommunityMessage} 
                    onViewProfile={setSelectedCommunityProfileId} 
                    refreshTrigger={communityRefreshTrigger}
                    onAddPost={() => setIsCreatingPost(true)}
                />
            </div>
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center pb-24">
              <div className="bg-white/20 backdrop-blur-2xl p-8 rounded-[32px] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] border border-white/50 max-w-sm flex flex-col items-center">
                <div className="w-16 h-16 bg-white/50 backdrop-blur rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f512/512.gif" alt="Lock" className="w-10 h-10 object-contain drop-shadow-sm" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-zinc-900">Community Access</h3>
                <p className="text-zinc-500 text-sm mb-6 leading-relaxed">Join the conversation with thousands of founders and investors. Upgrade to Pro to unlock.</p>
                <button 
                  onClick={() => {
                    setSettingsPath('subscription');
                    setCurrentView('settings');
                  }}
                  className="w-full py-3.5 px-8 bg-black text-white rounded-xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-xl shadow-black/5 flex items-center justify-center gap-2"
                >
                  <span>View Pro Plans</span>
                  <ArrowRight size={18} />
                </button>
              </div>
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
              onAddPost={() => setIsCreatingPost(true)}
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
            /> 
        );
    }
    
    if (currentView === 'settings') {
      if (settingsPath === 'subscription' && userProfile) {
        const isProPlan = userProfile.plan === 'pro'; 
        const expiryDate = userProfile.subscriptionEndDate ? new Date(userProfile.subscriptionEndDate) : null;

        return (
          <SettingsLayout title="Subscription" onBack={() => setSettingsPath('root')}>
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-3xl sm:rounded-[3rem] p-1 shadow-xl sm:shadow-2xl shadow-zinc-200/50 border border-zinc-100 w-full max-w-6xl mx-auto overflow-hidden"
             >
               <div className="bg-zinc-50/50 p-6 sm:p-20 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#EAB308]/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
                  <div className="relative z-10 w-fit mx-auto px-4 py-1.5 rounded-full bg-white border border-zinc-200 text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm">
                    {isProPlan ? 'Active Membership' : 'Free Access Level'}
                  </div>
                  <h3 className="text-3xl sm:text-7xl font-[900] text-zinc-950 mb-3 sm:mb-4 tracking-tighter">{isProPlan ? 'Platinum Pro' : 'Free Tier'}</h3>
                  <p className="text-zinc-500 max-w-2xl mx-auto text-sm sm:text-xl leading-relaxed font-light">
                    {isProPlan 
                      ? `Your elite status is secured ${expiryDate ? `until ${expiryDate.toLocaleDateString()}` : 'indefinitely'}. Explore the full potential of high-frequency capital formation.` 
                      : 'Join the top 5% of founders and investors who use predictive matching to close rounds faster.'}
                  </p>

                  {!isProPlan && (
                    <div className="mt-8 sm:mt-12 flex justify-center">
                       <div className="flex bg-zinc-200/50 p-1.5 rounded-2xl sm:rounded-3xl relative z-10 w-full max-w-sm border border-zinc-200">
                          <button onClick={() => setBillingCycle('monthly')} className={`flex-1 px-4 py-2.5 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all ${billingCycle === 'monthly' ? 'bg-white text-zinc-950 shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}>Monthly</button>
                          <button onClick={() => setBillingCycle('yearly')} className={`flex-1 px-4 py-2.5 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all ${billingCycle === 'yearly' ? 'bg-white text-zinc-950 shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}>Yearly <span className="text-emerald-500 font-black ml-1 uppercase text-[8px] tracking-[0.05em] sm:tracking-widest">2 MONTHS FREE</span></button>
                       </div>
                    </div>
                  )}
               </div>

               <div className="p-5 sm:p-16 bg-white">
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-start">
                  <div className="space-y-8">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Premium Benefits</h4>
                    <div className="space-y-2">
                    {[
                      ['Full Profile & Video Pitch Deck', true, true],
                      ['Full Community Feed Access', false, true],
                      ['Direct Messaging & Network Expansion', false, true],
                      ['Priority Founder & Investor Support', false, true],
                      ['Advanced Analytics & Profile Views', false, true],
                      ['Early Access to New Features', false, true],
                    ].map(([feature, free, pro]) => (
                      <div key={feature as string} className="flex items-center gap-4 sm:gap-6 py-4 sm:py-5 border-b border-zinc-100 last:border-0 group">
                         <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${pro ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-50 text-zinc-300'}`}>
                           {pro ? <Check size={14} strokeWidth={4} /> : <X size={14} strokeWidth={4} />}
                         </div>
                         <span className="flex-1 font-bold text-zinc-800 text-sm sm:text-lg tracking-tight group-hover:translate-x-1 transition-transform">{feature}</span>
                         <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                           <span className={free ? 'text-emerald-500' : 'text-zinc-300'}>{free ? 'Free' : ''}</span>
                         </div>
                      </div>
                    ))}
                    </div>
                  </div>

                  <div className="space-y-6 sm:space-y-8 lg:sticky lg:top-8">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Upgrade Now</h4>
                    <div className="bg-zinc-50 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-zinc-100 shadow-inner">
                        {!isProPlan ? (
                          <>
                            <div className="mb-8">
                              <span className="text-3xl sm:text-5xl font-black text-zinc-950 tracking-tighter">${billingCycle === 'monthly' ? '6' : '5'}</span>
                              <span className="text-base sm:text-xl text-zinc-400 font-light ml-2">/ month</span>
                              {billingCycle === 'yearly' && <p className="text-emerald-500 text-xs sm:text-sm font-black mt-2 uppercase tracking-widest">Billed Annually ($60)</p>}
                            </div>
                            <PaystackButton
                              {...{
                                email: userProfile.email,
                                amount: (billingCycle === 'monthly' ? 6 : 60) * 1600 * 100,
                                publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_sample',
                                text: isProcessing ? 'Processing...' : 'Secure Pro Access',
                                onSuccess: (reference: any) => handlePaystackSuccess(reference),
                                onClose: () => setIsProcessing(false),
                                className: "w-full py-4 sm:py-6 px-6 sm:px-10 bg-brand-primary text-black rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_20px_50px_-12px_rgba(234,179,8,0.4)] cursor-pointer"
                              }}
                              disabled={isProcessing}
                            />
                            <p className="mt-8 text-center text-xs text-zinc-400 leading-relaxed font-medium">
                              Secure payment via Paystack. Cancel anytime. <br /> VAT included in all pricing.
                            </p>
                          </>
                        ) : (
                          <div className="text-center py-2 sm:py-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 animate-bounce-subtle">
                               <Check size={32} className="sm:size-[40px]" strokeWidth={3} />
                            </div>
                            <h5 className="text-xl sm:text-2xl font-black text-zinc-950 mb-2">You're All Set!</h5>
                            <p className="text-sm sm:text-zinc-500 mb-6 sm:mb-8 font-light">Your Pro subscription is fully managed and active.</p>
                            <button 
                              onClick={() => setIsCancelModalOpen(true)} 
                              disabled={isProcessing}
                              className="w-full py-4 px-6 bg-zinc-200/50 text-zinc-600 rounded-xl sm:rounded-2xl font-black hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 border border-zinc-200 disabled:opacity-50 text-sm sm:text-base cursor-pointer">
                              Manage Plan
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
               </div>
             </motion.div>

             {transactions.length > 0 && (
               <div className="max-w-6xl mx-auto w-full mt-10 sm:mt-20">
                  <div className="flex items-end justify-between mb-4 sm:mb-8 border-b border-zinc-200 pb-4 sm:pb-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400">Billing Archives</h4>
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">{transactions.length} Invoices</span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {transactions.map((tx: any, idx) => (
                      <motion.div 
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white border border-zinc-100 rounded-3xl p-6 flex flex-col gap-6 hover:shadow-xl hover:shadow-zinc-200/50 transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-brand-primary group-hover:text-black transition-all">
                            <Receipt size={20} />
                          </div>
                          <span className={`text-[10px] px-3 py-1 font-black rounded-full uppercase tracking-widest ${
                            tx.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-lg font-black text-zinc-950 tracking-tight">Pro Plan ({tx.billing_cycle})</p>
                          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">
                            {new Date(tx.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="pt-4 border-t border-zinc-50 flex justify-between items-center">
                          <span className="text-2xl font-black text-zinc-950">${tx.amount}</span>
                          <button className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-950 flex items-center gap-2 transition-colors">
                            PDF <Download size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
               </div>
             )}

             <AnimatePresence>
                {isCancelModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsCancelModalOpen(false)}
                      className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 30 }}
                      className="relative bg-white rounded-3xl sm:rounded-[3rem] p-6 sm:p-12 max-w-md w-full shadow-2xl overflow-hidden text-center"
                    >
                      <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8">
                        <AlertTriangle size={36} />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-[900] text-zinc-950 mb-3 sm:mb-4 tracking-tighter">Pause Subscription?</h3>
                      <p className="text-xs sm:text-sm text-zinc-500 mb-6 sm:mb-10 leading-relaxed font-light">
                        Are you sure you want to cancel your Pro membership? You'll lose access to elite predictive matching and the global community feed.
                      </p>
                      <div className="flex flex-col gap-4">
                         <button 
                          onClick={handleCancelSubscription}
                          className="w-full py-4 sm:py-5 bg-red-600 text-white rounded-xl sm:rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-200 text-sm sm:text-base cursor-pointer"
                        >
                          Cancel Subscription
                        </button>
                        <button 
                          onClick={() => setIsCancelModalOpen(false)}
                          className="w-full py-4 sm:py-5 bg-zinc-100 text-zinc-900 rounded-xl sm:rounded-2xl font-black hover:bg-zinc-200 transition-all text-sm sm:text-base cursor-pointer"
                        >
                          Keep My Access
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
             </AnimatePresence>
          </SettingsLayout>
        );
      }

      if (settingsPath === 'chat-prefs') {
        return (
          <SettingsLayout title="Chat Settings" onBack={() => setSettingsPath('root')}>
             <div className="max-w-4xl mx-auto w-full space-y-12">
               <div className="grid md:grid-cols-2 gap-8">
                  {[
                      { 
                        label: "Sound Effects", 
                        sub: "Play sounds for new messages", 
                        icon: BellRing, 
                        active: chatSounds, 
                        onToggle: () => setChatSounds(!chatSounds),
                        color: "bg-brand-primary/10 text-brand-primary"
                      },
                    { 
                      label: "Read Receipts", 
                      sub: "Show when you've seen messages", 
                      icon: Eye, 
                      active: readReceipts, 
                      onToggle: () => setReadReceipts(!readReceipts),
                      color: "bg-emerald-50 text-emerald-600"
                    }
                  ].map((pref, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-zinc-100 shadow-xl shadow-zinc-200/30 flex flex-col items-center text-center group transition-all hover:border-zinc-200"
                    >
                       <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2rem] ${pref.color} flex items-center justify-center mb-6 sm:mb-8 shadow-inner group-hover:scale-110 transition-transform`}>
                          <pref.icon size={24} className="sm:size-[32px]" strokeWidth={2.5} />
                       </div>
                       <h5 className="text-xl sm:text-2xl font-[900] text-zinc-950 tracking-tighter mb-2">{pref.label}</h5>
                       <p className="text-xs sm:text-sm text-zinc-400 font-light mb-6 sm:mb-10 leading-relaxed">{pref.sub}</p>
                       
                       <button 
                        onClick={pref.onToggle}
                        className={`w-24 h-11 rounded-full p-1.5 transition-all duration-500 relative ${pref.active ? 'bg-zinc-950' : 'bg-zinc-100'}`}
                       >
                          <div className={`h-full aspect-square bg-white rounded-full shadow-lg transition-all duration-500 absolute top-1.5 ${pref.active ? 'left-[calc(100%-2.5rem)]' : 'left-1.5'}`}></div>
                       </button>
                    </motion.div>
                  ))}
               </div>
             </div>
          </SettingsLayout>
        );
      }

      if (settingsPath === 'password') {
        return (
          <SettingsLayout title="Change Password" onBack={() => setSettingsPath('root')}>
            <form onSubmit={handleUpdatePassword} className="max-w-md mx-auto w-full space-y-6 bg-white p-6 sm:p-8 rounded-3xl sm:rounded-[3rem] border border-zinc-100 shadow-xl">
                <div className="space-y-3">
                    <label className="text-xs sm:text-sm font-black text-zinc-950 uppercase tracking-[0.2em]">New Password</label>
                    <input 
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-base sm:text-lg font-bold text-zinc-950 placeholder:text-zinc-300 outline-none focus:border-zinc-950 transition-all"
                        placeholder="Enter new password"
                     />
                </div>
                <button 
                  type="submit"
                  disabled={passwordUpdating}
                  className="w-full py-4 sm:py-5 bg-brand-primary text-black rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-brand-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                >
                  {passwordUpdating ? <Loader2 className="animate-spin text-black" size={24}/> : 'Update Password'}
                </button>
            </form>
          </SettingsLayout>
        );
      }
      if (settingsPath === 'terms') {
        return (
          <SettingsLayout title="Terms of Service" onBack={() => setSettingsPath('root')}>
             <div className="max-w-4xl mx-auto w-full bg-white rounded-3xl sm:rounded-[3rem] p-6 sm:p-20 shadow-xl sm:shadow-2xl shadow-zinc-200/50 border border-zinc-100 relative overflow-hidden">
                <div className="relative z-10 space-y-8 sm:space-y-16">
                  <header className="space-y-3 sm:space-y-4 border-b border-zinc-100 pb-8 sm:pb-12">
                    <h2 className="text-3xl sm:text-6xl font-[900] text-zinc-950 tracking-tighter leading-none">Terms & <br/> Conditions</h2>
                    <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-[10px] sm:text-xs">Revised May 2026</p>
                  </header>
                  
                  <div className="space-y-8 sm:space-y-12 text-zinc-600 leading-relaxed font-light text-base sm:text-lg">
                    {[
                      { title: "Acceptance", content: "By using connectup, you agree to these terms. Our platform provides a networking environment for capital and innovation." },
                      { title: "Accounts", content: "You are responsible for your account security. Notify us immediately of any unauthorized use." },
                      { title: "Conduct", content: "Any misuse of the platform or data is prohibited. We maintain a professional environment for all members." },
                      { title: "Ownership", content: "Platform code, designs, and data remain the exclusive property of connectup." }
                    ].map((section, i) => (
                      <section key={i} className="space-y-3 sm:space-y-4 group">
                        <h3 className="text-zinc-950 font-black text-lg sm:text-xl tracking-tight flex items-center gap-3 sm:gap-4">
                          <span className="text-zinc-300 group-hover:text-brand-primary transition-colors">0{i+1}</span>
                          {section.title}
                        </h3>
                        <p className="pl-6 sm:pl-10 border-l border-zinc-100 group-hover:border-brand-primary transition-colors">{section.content}</p>
                      </section>
                    ))}
                  </div>


                </div>
             </div>
          </SettingsLayout>
        );
      }
      if (settingsPath === 'privacy') {
        return (
          <SettingsLayout title="Privacy Policy" onBack={() => setSettingsPath('root')}>
             <div className="max-w-4xl mx-auto w-full bg-white rounded-3xl sm:rounded-[3rem] p-6 sm:p-20 shadow-xl sm:shadow-2xl shadow-zinc-200/50 border border-zinc-100 relative overflow-hidden">
                <div className="relative z-10 space-y-8 sm:space-y-16">
                  <header className="space-y-3 sm:space-y-4 border-b border-zinc-100 pb-8 sm:pb-12">
                    <h2 className="text-3xl sm:text-6xl font-[900] text-zinc-950 tracking-tighter leading-none">Your <br/> Privacy</h2>
                    <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-[10px] sm:text-xs">How we protect your data</p>
                  </header>
                  
                  <div className="space-y-8 sm:space-y-12 text-zinc-600 leading-relaxed font-light text-base sm:text-lg">
                    <p className="italic text-base sm:text-xl text-zinc-400">"We respect your privacy and handle your data with care."</p>
                    
                    {[
                      { title: "Data Collection", content: "We only collect data necessary to provide our service, such as your profile information and professional details." },
                      { title: "How We Use Data", content: "Your data is used to facilitate matches and power platform features. We do not sell your personal information." },
                      { title: "Your Rights", content: "You have full control over your data. You can request access, corrections, or deletion at any time." }
                    ].map((section, i) => (
                      <section key={i} className="space-y-3 sm:space-y-4 group">
                        <div className="flex items-center gap-4 sm:gap-6">
                           <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-950 font-black group-hover:bg-brand-primary group-hover:text-black transition-all shrink-0 animate-in zoom-in">0{i+1}</div>
                           <h3 className="text-lg sm:text-2xl font-black text-zinc-950 tracking-tight leading-tight">{section.title}</h3>
                        </div>
                        <p className="pl-14 sm:pl-18 font-light">{section.content}</p>
                      </section>
                    ))}
                  </div>


                </div>
             </div>
          </SettingsLayout>
        );
      }
      if (settingsPath === 'security') {
        return (
          <SettingsLayout title="Security" onBack={() => setSettingsPath('root')}>
             <div className="max-w-4xl mx-auto w-full bg-white rounded-3xl sm:rounded-[3rem] p-6 sm:p-20 shadow-xl sm:shadow-2xl shadow-zinc-200/50 border border-zinc-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-[100px] -ml-48 -mt-48 pointer-events-none" />
                
                <div className="relative z-10 space-y-8 sm:space-y-20">
                  <div className="flex flex-col-reverse md:flex-row md:items-end gap-6 sm:gap-8 border-b border-zinc-100 pb-8 sm:pb-16 mt-4 sm:mt-0">
                     <div className="flex-1 space-y-3 sm:space-y-4">
                        <h2 className="text-3xl sm:text-6xl font-[900] text-zinc-950 tracking-tighter leading-none text-balance">Platform <br/> Security</h2>
                        <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-[10px] sm:text-xs">How we keep connectup safe</p>
                     </div>
                     <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-2xl sm:rounded-[2.5rem] bg-zinc-950 flex items-center justify-center text-brand-primary shadow-xl sm:shadow-2xl shadow-brand-primary/20 shrink-0 animate-in zoom-in">
                        <Shield size={32} className="sm:size-[48px]" strokeWidth={2.5} />
                     </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-8 sm:gap-12 text-zinc-600 leading-relaxed font-light text-base sm:text-lg">
                    {[
                      { title: "Secure Data", icon: KeyRound, content: "All data transfers are encrypted using industry-standard TLS protocols." },
                      { title: "Authentication", icon: Lock, content: "We use secure token-based authentication to protect your account access." },
                      { title: "Privacy Control", icon: Shield, content: "Database permissions ensure you only see data you're authorized to access." },
                      { title: "Audit Logging", icon: Eye, content: "System events are logged and monitored to detect and prevent unauthorized access." }
                    ].map((feature, i) => (
                      <div key={i} className="flex gap-4 sm:gap-0 sm:flex-col items-start sm:space-y-6">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-950 shrink-0">
                           <feature.icon size={22} className="sm:size-[28px]" />
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                           <h3 className="text-zinc-950 font-black text-lg sm:text-xl tracking-tight leading-tight">{feature.title}</h3>
                           <p className="text-xs sm:text-sm font-light leading-relaxed text-zinc-500">{feature.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-50 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-zinc-100 text-center">
                    <p className="text-xs sm:text-sm text-zinc-500 font-light leading-relaxed">
                      "Security is not a feature, it is our foundational constant."
                    </p>
                  </div>
                </div>
             </div>
          </SettingsLayout>
        );
      }
      if (settingsPath === 'profile') {
        return (
          <SettingsLayout title="Edit Profile" onBack={() => setSettingsPath('root')}>
             <div className="max-w-4xl mx-auto w-full space-y-12">
               <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div 
                      className="w-40 h-40 sm:w-56 sm:h-56 rounded-[4rem] bg-white p-1.5 mb-8 relative cursor-pointer shadow-2xl border border-zinc-100 overflow-hidden transition-all hover:scale-[1.02]" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {userProfile.avatarUrl ? (
                        <img src={userProfile.avatarUrl} className="w-full h-full object-cover rounded-[3.8rem]" alt="Profile" />
                      ) : (
                        <div className="w-full h-full rounded-[3.8rem] bg-zinc-50 flex items-center justify-center text-zinc-200">
                           <User size={80} strokeWidth={1} />
                        </div>
                      )}
                      
                      <motion.div 
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-[3.8rem] transition-opacity"
                      >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black mb-2">
                           <Plus size={24} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Upload</span>
                      </motion.div>

                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-10 rounded-[3.8rem]">
                          <div className="flex flex-col items-center gap-3">
                             <Loader2 className="animate-spin text-brand-primary" size={32} />
                             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Processing</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
               </div>

               <form onSubmit={handleSaveProfile} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                    {[
                      { label: "Identity", sub: "Legal or professional name", icon: User, val: userProfile.name, set: (v: string) => setUserProfile({...userProfile, name: v}), placeholder: "John Doe" }, 
                      { label: role === UserRole.FOUNDER ? "Professional Title" : "Designation", sub: "Displayed in community", icon: Award, val: userProfile.title, set: (v: string) => setUserProfile({...userProfile, title: v}), placeholder: "e.g. Lead Technologist" },
                      { label: "Jurisdiction", sub: "Primary operation base", icon: MapPin, val: userProfile.location, set: (v: string) => setUserProfile({...userProfile, location: v}), placeholder: "San Francisco, CA" },
                      { label: "Communication", sub: "Contact for notifications", icon: Mail, val: userProfile.email, set: (v: string) => setUserProfile({...userProfile, email: v}), placeholder: "contact@domain.com" }
                    ].map((field, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="space-y-4"
                      >
                        <div className="flex flex-col ml-1">
                          <label className="text-xs sm:text-sm font-black text-zinc-950 uppercase tracking-[0.2em]">{field.label}</label>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{field.sub}</span>
                        </div>
                        <div className="relative group">
                          <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-brand-primary transition-colors">
                            <field.icon size={20} strokeWidth={2.5} />
                          </div>
                          <input 
                            type="text" 
                            disabled={field.label === 'Communication'}
                            value={field.val} 
                            placeholder={field.placeholder}
                            onChange={e => field.set(e.target.value)} 
                            className="w-full bg-white border-2 border-zinc-100 rounded-2xl sm:rounded-3xl pl-12 sm:pl-16 pr-4 sm:pr-8 py-3.5 sm:py-5 text-sm sm:text-lg font-bold text-zinc-950 placeholder:text-zinc-200 outline-none focus:border-zinc-950 focus:shadow-xl focus:shadow-zinc-200/50 transition-all disabled:opacity-50 disabled:bg-zinc-50" 
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="pt-6 sm:pt-8 border-t border-zinc-100 flex flex-col items-center">
                    <button 
                      type="submit"
                      disabled={isSaving} 
                      className="w-full max-w-sm py-4 sm:py-6 px-8 sm:px-12 bg-brand-primary text-black rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl hover:bg-brand-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl sm:shadow-2xl shadow-brand-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                    >
                      {isSaving ? <Loader2 className="animate-spin text-black" /> : 'Save Changes'}
                    </button>
                  </div>
               </form>
             </div>
          </SettingsLayout>
        );
      }
      return (
        <SettingsLayout title="Settings">
           <div className="flex flex-col gap-6 sm:gap-12 pb-20">
             {/* Profile Hero Section */}
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="relative overflow-hidden group rounded-2xl sm:rounded-[3.5rem] bg-white text-zinc-900 border border-zinc-100 px-4 py-8 sm:p-12 shadow-xl sm:shadow-2xl shadow-zinc-400/5 animate-in fade-in"
             >
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 blur-[120px] -mr-48 -mt-48 rounded-full group-hover:bg-brand-primary/20 transition-all duration-1000 animate-pulse pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-primary/5 blur-[100px] -ml-32 -mb-32 rounded-full pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-10">
                   <div className="relative shrink-0">
                      <div className="w-24 h-24 sm:w-44 sm:h-44 rounded-2xl sm:rounded-[3rem] bg-zinc-50 p-1 relative overflow-hidden shadow-xl border border-zinc-200">
                        {userProfile.avatarUrl ? (
                          <img src={userProfile.avatarUrl} className="w-full h-full object-cover rounded-[1.8rem] sm:rounded-[2.8rem]" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300 bg-zinc-50">
                            <User size={48} className="sm:size-[64px]" strokeWidth={1} />
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => setSettingsPath('profile')}
                        className="absolute -bottom-1 -right-1 w-9 h-9 sm:w-12 sm:h-12 bg-zinc-900 text-white rounded-xl sm:rounded-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl cursor-pointer"
                      >
                        <Plus size={18} className="sm:size-6" strokeWidth={3} />
                      </button>
                   </div>

                   <div className="flex-1 text-center md:text-left min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-2 sm:gap-4 mb-2">
                        <h4 className="text-2xl sm:text-5xl font-[900] text-zinc-900 tracking-tighter leading-tight truncate max-w-full">{userProfile.name || 'Member'}</h4>
                        {userProfile.plan === 'pro' && (
                          <div className="px-4 py-1 sm:px-5 sm:py-2 bg-brand-primary text-black text-[9px] sm:text-[10px] font-black uppercase rounded-full sm:rounded-2xl shadow-lg shadow-brand-primary/20 border border-black/5 shrink-0">PRO</div>
                        )}
                      </div>
                      <p className="text-zinc-400 font-black text-xs sm:text-sm tracking-[0.3em] uppercase mb-5 sm:mb-8">{userProfile.title || 'Perspective Visionary'}</p>
                      
                      <div className="flex flex-wrap justify-center md:justify-start gap-2.5 sm:gap-4">
                        <div className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center gap-2 sm:gap-3 shrink-0 max-w-full">
                           <MapPin size={14} className="text-brand-primary sm:size-[16px]" />
                           <span className="text-xs sm:text-sm font-bold text-zinc-600 truncate max-w-[140px] sm:max-w-none">{userProfile.location || 'Global Citizen'}</span>
                        </div>
                        <div className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center gap-2 sm:gap-3 truncate max-w-full shrink-0">
                           <Mail size={14} className="text-brand-primary sm:size-[16px]" />
                           <span className="text-xs sm:text-sm font-bold text-zinc-600 truncate">{userProfile.email}</span>
                        </div>
                      </div>
                   </div>
                </div>
             </motion.div>

             {/* Mobile Settings Bento-inspired Design */}
             <div className="block sm:hidden space-y-4">
                {/* Primary Card: Subscription */}
                <button 
                  onClick={() => setSettingsPath('subscription')}
                  className="w-full relative overflow-hidden group bg-brand-primary p-6 rounded-3xl text-left shadow-lg shadow-brand-primary/10 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-black/10 blur-2xl -mr-16 -mt-16 rounded-full" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-950/60">Subscription Tier</span>
                      <h4 className="text-2xl font-black text-zinc-950 tracking-tighter mt-1">{userProfile.plan === 'pro' ? 'Pro Member' : 'Free Tier'}</h4>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center">
                      <Banknote size={24} className="text-zinc-950" strokeWidth={2.5} />
                    </div>
                  </div>
                </button>

                {/* Secondary List: Other settings */}
                <div className="space-y-3">
                  {[
                    { label: 'Profile', description: 'Personal details', path: 'profile', icon: User, color: 'bg-zinc-100 text-zinc-500' },
                    { label: 'Security', description: 'Change password & credentials', path: 'password', icon: Lock, color: 'bg-zinc-100 text-zinc-500' },
                    { label: 'Alerts', description: 'Notification settings', path: 'chat-prefs', icon: MessageCircle, color: 'bg-zinc-100 text-zinc-500' },
                    { label: 'Privacy', description: 'Data & cookies', path: 'privacy', icon: Shield, color: 'bg-zinc-100 text-zinc-500' },
                    { label: 'Legal', description: 'Terms & conditions', path: 'terms', icon: ScrollText, color: 'bg-zinc-100 text-zinc-500' },
                  ].map((item) => (
                    <button 
                      key={item.path}
                      onClick={() => setSettingsPath(item.path as any)}
                      className="w-full p-5 bg-white rounded-3xl border border-zinc-100 shadow-sm text-left flex items-center gap-5 cursor-pointer active:scale-[0.98] transition-transform group"
                    >
                      <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all`}>
                        <item.icon size={22} strokeWidth={2.5} />
                      </div>
                      <div>
                        <span className="text-zinc-950 font-black text-sm block">{item.label}</span>
                        <span className="text-zinc-400 text-xs font-medium mt-0.5 block">{item.description}</span>
                      </div>
                      <ChevronRight size={18} className="ml-auto text-zinc-500" />
                    </button>
                  ))}
                </div>
             </div>

             {/* Desktop Bento Grid Design */}
             <div className="hidden sm:grid grid-cols-3 gap-6">
                {/* 1. Subscription - Col span 2 */}
                <button 
                  onClick={() => setSettingsPath('subscription')}
                  className="col-span-2 relative overflow-hidden group bg-brand-primary p-10 rounded-[3rem] text-left shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between min-h-[220px]"
                >
                  <div className="absolute top-0 right-0 w-80 h-80 bg-black/5 blur-3xl -mr-24 -mt-24 rounded-full group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute bottom-0 right-12 w-48 h-48 bg-white/10 blur-2xl -mr-12 -mb-12 rounded-full" />
                  
                  <div className="relative flex justify-between items-start w-full">
                    <div>
                      <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-950/60">Subscription Tier</span>
                      <h4 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tighter mt-1 leading-none">
                        {userProfile.plan === 'pro' ? 'Pro Member' : 'Free Tier'}
                      </h4>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-black/10 flex items-center justify-center shadow-inner">
                      <Banknote size={28} className="text-zinc-950" strokeWidth={2.5} />
                    </div>
                  </div>

                  <div className="relative mt-8 flex sm:flex-row flex-col justify-between items-start sm:items-end w-full gap-4">
                    <div>
                      <p className="text-zinc-950/70 text-sm font-medium max-w-[320px]">
                        {userProfile.plan === 'pro' 
                          ? 'Thank you for supporting us! You have complete access to unlimited conversation lines and active workflows.'
                          : 'Unlock higher usage limits, advanced tools, and prioritized AI pipelines with a Premium plan.'
                        }
                      </p>
                    </div>
                    <span className="shrink-0 px-5 py-2.5 bg-zinc-950 text-white text-xs font-black uppercase rounded-2xl hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-950/20 active:scale-95">
                      {userProfile.plan === 'pro' ? 'Manage Billing' : 'Upgrade Plan'}
                    </span>
                  </div>
                </button>

                {/* 2. Security (Password Update) - Col span 1 */}
                <button 
                  onClick={() => setSettingsPath('password')}
                  className="col-span-1 p-8 bg-white rounded-[3rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-zinc-50 text-zinc-500 border border-zinc-100 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all shadow-sm">
                    <Lock size={26} strokeWidth={2.5} />
                  </div>
                  <h5 className="text-lg font-black text-zinc-950 tracking-tight group-hover:text-brand-primary transition-colors">Security</h5>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-medium max-w-[180px]">Change credentials & secure session parameters</p>
                </button>

                {/* 3. Alerts (Notifications) - Col span 1 */}
                <button 
                  onClick={() => setSettingsPath('chat-prefs')}
                  className="col-span-1 p-8 bg-white rounded-[3rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-zinc-50 text-zinc-500 border border-zinc-100 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all shadow-sm">
                    <MessageCircle size={26} strokeWidth={2.5} />
                  </div>
                  <h5 className="text-lg font-black text-zinc-950 tracking-tight group-hover:text-brand-primary transition-colors">Alert Prefs</h5>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-medium max-w-[180px]">Manage message logs and notification settings</p>
                </button>

                {/* 4. Privacy - Col span 1 */}
                <button 
                  onClick={() => setSettingsPath('privacy')}
                  className="col-span-1 p-8 bg-white rounded-[3rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-zinc-50 text-zinc-500 border border-zinc-100 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all shadow-sm">
                    <Shield size={26} strokeWidth={2.5} />
                  </div>
                  <h5 className="text-lg font-black text-zinc-950 tracking-tight group-hover:text-brand-primary transition-colors">Data Privacy</h5>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-medium max-w-[180px]">Control personal information and telemetry cookies</p>
                </button>

                {/* 5. Terms of Service - Col span 1 */}
                <button 
                  onClick={() => setSettingsPath('terms')}
                  className="col-span-1 p-8 bg-white rounded-[3rem] border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-zinc-50 text-zinc-500 border border-zinc-100 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all shadow-sm">
                    <ScrollText size={26} strokeWidth={2.5} />
                  </div>
                  <h5 className="text-lg font-black text-zinc-950 tracking-tight group-hover:text-brand-primary transition-colors">Legal Terms</h5>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-medium max-w-[180px]">Review the operational framework agreement</p>
                </button>
             </div>

              {/* Mobile Account Control Redesign */}
              <div className="block sm:hidden mt-6 pb-0 space-y-3">
                 
                 <button 
                   onClick={handleLogout}
                   className="w-full p-5 bg-zinc-950 rounded-3xl text-white text-left flex items-center gap-5 cursor-pointer active:scale-[0.98] transition-all shadow-lg shadow-zinc-950/10 group"
                 >
                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                     <Power size={22} className="text-white" strokeWidth={2.5} />
                   </div>
                   <div>
                     <span className="font-black text-sm block">Logout</span>
                   </div>
                   <ChevronRight size={18} className="ml-auto text-zinc-500" />
                 </button>

                 <button 
                   onClick={() => setIsConfirmingDelete(true)}
                   className="w-full p-5 bg-red-600 rounded-3xl text-left flex items-center gap-5 cursor-pointer active:scale-[0.98] transition-all group shadow-lg shadow-red-600/20"
                 >
                   <div className="w-12 h-12 rounded-2xl bg-black/15 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                     <AlertTriangle size={22} strokeWidth={2.5} />
                   </div>
                   <div>
                     <span className="text-white font-black text-sm block">Erase Account</span>
                   </div>
                   <ChevronRight size={18} className="ml-auto text-red-200" />
                 </button>
              </div>

             {/* Desktop Account Control Design */}
             <div className="hidden sm:block pt-8 border-t border-zinc-200/50">
               <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.4em] ml-6 pb-6">Account Control</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-center p-10 bg-zinc-100 rounded-[3rem] border border-zinc-200 hover:bg-zinc-950 hover:text-white transition-all group flex flex-col items-center justify-center cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white text-zinc-950 flex items-center justify-center mb-6 group-hover:bg-white/10 group-hover:text-white transition-all shadow-sm">
                      <Power size={32} strokeWidth={2.5} />
                    </div>
                    <h5 className="text-2xl font-black tracking-tight group-hover:text-brand-primary transition-colors">Logout</h5>
                  </button>
                  <button 
                    onClick={() => setIsConfirmingDelete(true)}
                    className="w-full text-center p-10 bg-red-50/50 rounded-[3rem] border border-red-100 hover:bg-red-600 hover:text-white transition-all group flex flex-col items-center justify-center cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white text-red-600 flex items-center justify-center mb-6 group-hover:bg-white/10 group-hover:text-white transition-all shadow-sm">
                      <AlertTriangle size={32} strokeWidth={2.5} />
                    </div>
                    <h5 className="text-2xl font-black tracking-tight group-hover:text-white transition-colors">Delete Account</h5>
                  </button>
               </div>
             </div>
           </div>

           {/* Delete Account Confirmation Modal */}
           {isConfirmingDelete && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeletingAccount && setIsConfirmingDelete(false)}></div>
                  <div className="relative bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-300">
                     <button 
                        onClick={() => !isDeletingAccount && setIsConfirmingDelete(false)}
                        className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                     >
                        <X size={20} />
                     </button>
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
                           className="w-full h-14 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 hover:shadow-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl border border-red-700 disabled:opacity-50"
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
        <SwipeDeck onMatch={handleMatch} userProfile={userProfile} /> 
    ) : ( 
        <FounderDashboard 
            userProfile={userProfile} 
            onConnect={handleConnect} 
            isEditingDeck={isEditingDeck}
            onEditStateChange={setIsEditingDeck}
            onPostCreationStateChange={setIsCreatingPost}
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


  return (
    <div className={`min-h-screen bg-surface flex selection:bg-brand-primary selection:text-white ${appState === 'LANDING' ? '' : (currentView === 'messages' ? 'h-screen overflow-hidden' : 'md:h-screen md:overflow-hidden')}`}>
      <div className={`w-full bg-surface relative flex flex-col font-sans ${appState === 'LANDING' ? 'min-h-screen' : (currentView === 'messages' ? 'h-screen overflow-hidden' : 'min-h-screen md:h-screen md:overflow-hidden')}`}>
        {appState === 'INITIALIZING' ? (
          <div className="fixed inset-0 bg-[#0D0D0F] flex items-center justify-center">
             <div className="w-12 h-12 border-4 border-white/5 border-t-[#EAB308] rounded-full animate-spin" />
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
                <div className="absolute top-[-20%] left-[-10%] w-[140%] h-[80%] bg-brand-primary/10 rounded-[50%] blur-[40px] lg:blur-[120px] opacity-20 lg:animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[70%] bg-brand-primary/10 rounded-full blur-[30px] lg:blur-[100px] opacity-10 lg:animate-pulse lg:animation-delay-2000"></div>
            </div>

            <main className="flex-1 overflow-hidden pt-0 pb-0 bg-transparent relative z-10 w-full">
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

            {isCreatingPost && (
              <CreatePostModal 
                userProfile={userProfile} 
                onClose={() => setIsCreatingPost(false)} 
                onPostCreated={() => {
                  setCommunityRefreshTrigger(prev => prev + 1);
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
                />
            )}

            {/* Limelight Navigation Bar */}
            <div className={`fixed bottom-6 md:bottom-8 left-0 right-0 z-50 pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] w-full md:w-fit md:mx-auto flex justify-center pb-safe md:pb-0 px-4 ${
              currentView === 'messages'
                ? `md:hidden ${isChatOpen ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`
                : (isChatOpen || isEditingDeck || isCreatingPost || isMeetingModalOpen || isConfirmingDelete || selectedCommunityProfileId 
                    ? 'translate-y-32 md:translate-y-32 md:opacity-0 md:pointer-events-none' 
                    : 'translate-y-0 opacity-100')
            }`}>
                  <LimelightNav 
                    activeIndex={viewIndex}
                    items={[
                      { id: 'home', icon: <Home />, label: 'Home', onClick: () => handleNavClick('home') },
                      { id: 'community', icon: <Users />, label: 'Community', onClick: () => handleNavClick('community') },
                      { 
                        id: 'plus', 
                        icon: <Plus className={userProfile?.plan === 'pro' ? 'text-brand-primary' : 'opacity-20'} />, 
                        label: 'Create', 
                        onClick: () => userProfile?.plan === 'pro' && setIsCreatingPost(true) 
                      },
                      { 
                        id: 'messages', 
                        icon: <MessageCircle />, 
                        label: 'Chat', 
                        onClick: () => handleNavClick('messages'),
                        badge: hasUnreadMessages
                      },
                      { id: 'settings', icon: <Settings />, label: 'Settings', onClick: () => handleNavClick('settings') },
                    ]}
                    className="bg-zinc-900/40 backdrop-blur-3xl border-white/10 shadow-2xl rounded-full h-12 sm:h-20 w-[95%] max-w-lg md:max-w-3xl md:min-w-[500px]"
                  />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
