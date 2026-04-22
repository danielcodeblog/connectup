/// <reference types="vite/client" />
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { 
  LayoutDashboard, Users, MessageCircle, Settings, ChevronRight, 
  Lock, Bell, Languages, ChevronLeft, User, KeyRound, 
  MapPin, Mail, Loader2, Check, Building2, Receipt, Download, Crown, ArrowRight, Calendar, Clock, X, UserMinus, AlertTriangle, AlertCircle, Compass, Inbox, ScrollText, Home, Search, Plus, Power, Award, BellRing, Eye
} from 'lucide-react';
import { UserRole, AppState, Startup } from './types';
import { motion } from 'motion/react';
import { SplashScreen } from './components/SplashScreen';
import { Button } from './components/Button';
import { StorageService } from './services/storageService';
import { supabase } from './services/supabaseClient';

// Rename imports for clarity if needed
const CalendarIcon = Calendar;

// Lazy Load Heavy Components for Performance
const FounderDashboard = React.lazy(() => import('./components/founderdashboard'));
const SwipeDeck = React.lazy(() => import('./components/swipedeck'));
const ChatInterface = React.lazy(() => import('./components/ChatInterface'));
const CommunityFeed = React.lazy(() => import('./components/communityfeed'));
const AuthScreen = React.lazy(() => import('./components/AuthScreen'));
const Onboarding = React.lazy(() => import('./components/Onboarding'));
const UserProfileView = React.lazy(() => import('./components/UserProfileView'));
import { CreatePostModal } from './components/CreatePostModal';


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
    <div className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${active ? 'scale-110 -translate-y-0.5' : 'scale-100 translate-y-0'}`}>
      <Icon 
        size={20} 
        strokeWidth={active ? 2.5 : 2}
        className={`sm:size-[22px] transition-colors duration-300 ${
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
  <div className="h-full bg-surface flex flex-col animate-in fade-in duration-500 overflow-y-auto pb-24 safe-area-top text-zinc-900 relative">
     {/* Theme Background */}
     <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] bg-orange-200/10 rounded-full blur-[100px] opacity-30"></div>
     </div>

     <div className="px-4 py-3 sm:px-5 sm:py-5 sticky top-0 z-20 flex items-center bg-surface/80 backdrop-blur-xl border-b border-zinc-100/50">
        {onBack && (
          <button onClick={onBack} className="mr-4 p-2 -ml-1 bg-white rounded-xl transition-all hover:scale-105 active:scale-95 text-zinc-900 shadow-sm border border-zinc-100">
            <ChevronLeft size={18} />
          </button>
        )}
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-black tracking-tighter text-zinc-900">{title}</h2>
          {!onBack && <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Preferences</p>}
        </div>
     </div>
     <div className="p-4 sm:p-5 space-y-4 max-w-3xl mx-auto w-full relative z-10">
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
  const [appState, setAppState] = useState<AppState>('SPLASH');
  const [role, setRole] = useState<UserRole>(UserRole.INVESTOR);
  const [currentView, setCurrentView] = useState<string>('home'); // 'home' | 'messages' | 'settings'
  const [activeStartupIdForChat, setActiveStartupIdForChat] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [communityRefreshTrigger, setCommunityRefreshTrigger] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [selectedCommunityProfileId, setSelectedCommunityProfileId] = useState<string | null>(null);

  // Notifications State
  const [notification, setNotification] = useState<{ sender: string, avatar?: string, message: string, userId: string, type?: 'error' | 'message' } | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const notificationTimeoutRef = useRef<any>(null);

  // Settings State
  const [settingsPath, setSettingsPath] = useState<'root' | 'profile' | 'security' | 'password' | 'chat-prefs' | 'terms' | 'privacy'>('root');
  const [chatSounds, setChatSounds] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // User Profile State
  const [userProfile, setUserProfile] = useState<{
    name: string;
    title: string;
    email: string;
    location: string;
    avatarUrl: string;
  }>({
    name: '',
    title: '',
    email: '',
    location: '',
    avatarUrl: '',
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

      const profile = await StorageService.getUserProfile(uid);
      
      if (profile) {
        let currentProfile = profile;

        if (currentProfile.role && currentProfile.role !== role) {
           setRole(currentProfile.role);
        }

        setUserProfile(prev => ({
           ...prev,
           name: currentProfile.name || '',
           title: currentProfile.title || '',
           avatarUrl: currentProfile.avatarUrl || '',
           location: currentProfile.location || '',
           email: email || prev.email
        }));
      }
    };
    loadProfile();
  }, [appState, role, currentUserId]);

  // Refs for subscription consistency
  const currentViewRef = useRef(currentView);
  const chatSoundsRef = useRef(chatSounds);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    chatSoundsRef.current = chatSounds;
  }, [chatSounds]);

  // Global Message Subscription
  useEffect(() => {
      if (appState !== 'MAIN_APP' || !currentUserId) return;

      const sub = StorageService.subscribeToGlobalMessages(async (msg) => {
          if (msg.sender_id === currentUserId) return;

          if (currentViewRef.current !== 'messages') {
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
                  
                  if (chatSoundsRef.current) {
                      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.m4a');
                      audio.volume = 0.5;
                      
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
  }, [appState, currentUserId]);

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
    if (currentView === 'messages') return 3;
    return 4;
  }, [currentView]);

  const handleConnect = useCallback((targetId: string) => {
      setActiveStartupIdForChat(targetId);
      setCurrentView('messages');
  }, []);

  const handleCommunityMessage = useCallback((uid: string) => {
      setSelectedCommunityProfileId(null);
      setActiveStartupIdForChat(uid);
      setCurrentView('messages');
  }, []);

  const mainContent = useMemo(() => {
    if (currentView === 'community') {
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin-fast text-brand-primary" /></div>}>
            <CommunityFeed 
                userProfile={userProfile} 
                onMessage={handleCommunityMessage} 
                onViewProfile={setSelectedCommunityProfileId} 
                refreshTrigger={communityRefreshTrigger}
                onAddPost={() => setIsCreatingPost(true)}
            />
        </Suspense>
      );
    }

    if (currentView === 'messages') {
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin-fast text-brand-primary" /></div>}>
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
    
    if (currentView === 'home') {
        return role === UserRole.INVESTOR ? (
            <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin-fast text-brand-primary" /></div>}>
                <SwipeDeck onMatch={handleMatch} userProfile={userProfile} /> 
            </Suspense>
        ) : ( 
            <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin-fast text-brand-primary" /></div>}>
                <FounderDashboard 
                    userProfile={userProfile} 
                    onConnect={handleConnect} 
                    isEditingDeck={isEditingDeck}
                    onEditStateChange={setIsEditingDeck}
                    onPostCreationStateChange={setIsCreatingPost}
                    onMeetingModalStateChange={setIsMeetingModalOpen}
                /> 
            </Suspense>
        );
    }
    
    if (currentView === 'settings') {
      if (settingsPath === 'chat-prefs') {
        return (
          <SettingsLayout title="Chat Settings" onBack={() => setSettingsPath('root')}>
             <div className="bg-white rounded-3xl p-1 shadow-sm border border-zinc-100">
                <div className="p-4 border-b border-zinc-50 flex items-center justify-between">
                   <div className="flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 text-zinc-900 flex items-center justify-center mr-3 border border-zinc-100">
                        <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}>
                          <BellRing size={20} />
                        </motion.div>
                      </div>
                      <div>
                        <span className="font-bold text-sm text-zinc-900 block leading-tight">In-App Sounds</span>
                        <span className="text-[10px] text-zinc-500 font-medium">Play sounds for new messages</span>
                      </div>
                   </div>
                   <button 
                    onClick={() => setChatSounds(!chatSounds)} 
                    className={`w-12 h-7 rounded-full transition-all duration-300 relative ${chatSounds ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                   >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${chatSounds ? 'left-6' : 'left-1'}`}></div>
                   </button>
                </div>
                <div className="p-4 flex items-center justify-between">
                   <div className="flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 text-zinc-900 flex items-center justify-center mr-3 border border-zinc-100">
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
                          <Eye size={20} />
                        </motion.div>
                      </div>
                      <div>
                        <span className="font-bold text-sm text-zinc-900 block leading-tight">Read Receipts</span>
                        <span className="text-[10px] text-zinc-500 font-medium">Let others know when you've seen messages</span>
                      </div>
                   </div>
                   <button 
                    onClick={() => setReadReceipts(!readReceipts)} 
                    className={`w-12 h-7 rounded-full transition-all duration-300 relative ${readReceipts ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                   >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${readReceipts ? 'left-6' : 'left-1'}`}></div>
                   </button>
                </div>
             </div>
          </SettingsLayout>
        );
      }
      if (settingsPath === 'terms') {
        return (
          <SettingsLayout title="Terms of Service" onBack={() => setSettingsPath('root')}>
             <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-sm border border-white/60 text-xs text-zinc-700 space-y-3">
                <h2 className="text-base font-bold text-black mb-1">Terms of Service</h2>
                <p>Welcome to our platform. By accessing or using our service, you agree to be bound by these terms.</p>
                <h3 className="font-bold text-black mt-3">1. Acceptance of Terms</h3>
                <p>By creating an account, you agree to these terms and conditions.</p>
                <h3 className="font-bold text-black mt-3">2. User Responsibilities</h3>
                <p>You are responsible for maintaining the confidentiality of your account and password.</p>
                <h3 className="font-bold text-black mt-3">3. Content</h3>
                <p>You retain all rights to the content you post, but grant us a license to use it to provide the service.</p>
             </div>
          </SettingsLayout>
        );
      }
      if (settingsPath === 'privacy') {
        return (
          <SettingsLayout title="Privacy Policy" onBack={() => setSettingsPath('root')}>
             <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-sm border border-white/60 text-xs text-zinc-700 space-y-3">
                <h2 className="text-base font-bold text-black mb-1">Privacy Policy</h2>
                <p>Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p>
                <h3 className="font-bold text-black mt-3">1. Information We Collect</h3>
                <p>We collect information you provide directly to us, such as your name, email, and profile details.</p>
                <h3 className="font-bold text-black mt-3">2. How We Use Information</h3>
                <p>We use the information to provide, maintain, and improve our services, and to communicate with you.</p>
                <h3 className="font-bold text-black mt-3">3. Data Security</h3>
                <p>We implement reasonable security measures to protect your personal information.</p>
             </div>
          </SettingsLayout>
        );
      }
      if (settingsPath === 'profile') {
        return (
          <SettingsLayout title="Edit Profile" onBack={() => setSettingsPath('root')}>
             <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-white p-1 mb-4 relative cursor-pointer shadow-xl border border-zinc-100 overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                    {userProfile.avatarUrl ? (
                      <img src={userProfile.avatarUrl} className="w-full h-full object-cover rounded-[22px]" alt="Profile" />
                    ) : (
                      <div className="w-full h-full rounded-[22px] bg-zinc-50 flex items-center justify-center">
                        <User size={32} className="text-zinc-200" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[22px]">
                      <Plus size={24} className="text-white" />
                    </div>
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-[22px]">
                        <Loader2 className="animate-spin text-zinc-900" size={24} />
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-full text-[10px] font-black uppercase tracking-wider text-zinc-900 transition-colors"
                >
                  {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
             </div>
             <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {[{ label: "Full Name", icon: () => <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }}><User size={18} className="text-zinc-400 mr-3 shrink-0" /></motion.div>, val: userProfile.name, set: (v: string) => setUserProfile({...userProfile, name: v}), placeholder: "e.g. John Doe" }, 
                    { label: role === UserRole.FOUNDER ? "Role" : "Title", icon: () => <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 3 }}><Award size={18} className="text-zinc-400 mr-3 shrink-0" /></motion.div>, val: userProfile.title, set: (v: string) => setUserProfile({...userProfile, title: v}), placeholder: "e.g. CEO & Founder" },
                    { label: "Location", icon: () => <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }}><MapPin size={18} className="text-zinc-400 mr-3 shrink-0" /></motion.div>, val: userProfile.location, set: (v: string) => setUserProfile({...userProfile, location: v}), placeholder: "e.g. San Francisco, CA" }
                  ].map((field, i) => (
                    <div key={i} className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{field.label}</label>
                      <div className="flex items-center bg-white border border-zinc-100 rounded-xl px-4 py-3 focus-within:border-zinc-900 focus-within:ring-4 focus-within:ring-zinc-900/5 transition-all shadow-sm">
                        <field.icon />
                        <input 
                          type="text" 
                          value={field.val} 
                          placeholder={field.placeholder}
                          onChange={e => field.set(e.target.value)} 
                          className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-zinc-900 placeholder:text-zinc-300" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <Button 
                    fullWidth 
                    size="lg" 
                    disabled={isSaving} 
                    className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] h-14 bg-zinc-900 text-white rounded-xl font-black text-base"
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : 'Update Profile'}
                  </Button>
                </div>
             </form>
          </SettingsLayout>
        );
      }
      return (
        <SettingsLayout title="Settings">
           <div className="flex flex-col gap-6 pb-8">
             {/* Profile Section */}
             <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200">
                  {userProfile.avatarUrl ? (
                    <img src={userProfile.avatarUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-zinc-900">{userProfile.name || 'Set Name'}</h4>
                  <p className="text-sm text-zinc-500">{userProfile.title || 'Add Title'}</p>
                </div>
                <button 
                  onClick={() => setSettingsPath('profile')}
                  className="px-4 py-2 bg-zinc-100 text-zinc-900 text-xs font-bold rounded-full hover:bg-zinc-200 transition-colors"
                >
                  Edit
                </button>
             </div>

             {/* Account Section */}
             <div>
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-4">Account</h3>
               <div className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-100 overflow-hidden shadow-sm">
                  {[
                    { label: 'Privacy & Security', path: 'privacy', icon: Lock },
                    { label: 'Chat Preferences', path: 'chat-prefs', icon: MessageCircle },
                  ].map((item) => (
                    <button 
                      key={item.path}
                      onClick={() => setSettingsPath(item.path as any)}
                      className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className="text-zinc-900" />
                        <span className="font-medium text-zinc-900">{item.label}</span>
                      </div>
                      <ChevronRight size={18} className="text-zinc-400" />
                    </button>
                  ))}
               </div>
             </div>

             {/* About Section */}
             <div>
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-4">About</h3>
               <div className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-100 overflow-hidden shadow-sm">
                  {[
                    { label: 'Terms of Service', path: 'terms', icon: ScrollText },
                  ].map((item) => (
                    <button 
                      key={item.path}
                      onClick={() => setSettingsPath(item.path as any)}
                      className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className="text-zinc-900" />
                        <span className="font-medium text-zinc-900">{item.label}</span>
                      </div>
                      <ChevronRight size={18} className="text-zinc-400" />
                    </button>
                  ))}
               </div>
             </div>

             {/* Login Section */}
             <div>
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-4">Login</h3>
               <div className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-100 overflow-hidden shadow-sm">
                  <button 
                    onClick={handleLogout}
                    className="w-full p-4 text-left text-zinc-900 font-medium hover:bg-zinc-50 transition-colors"
                  >
                    Log Out
                  </button>
                  <button 
                    onClick={() => setIsConfirmingDelete(true)}
                    className="w-full p-4 text-left text-red-600 font-medium hover:bg-red-50 transition-colors"
                  >
                    Delete Account
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
      handleLogout, 
      isConfirmingDelete, 
      isDeletingAccount, 
      handleDeleteAccount, 
      handleMatch, 
      handleConnect, 
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
              <Suspense fallback={<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"><Loader2 className="animate-spin text-white w-8 h-8" /></div>}>
                <UserProfileView 
                  userId={selectedCommunityProfileId} 
                  onClose={() => setSelectedCommunityProfileId(null)} 
                  onMessage={handleCommunityMessage}
                />
              </Suspense>
            )}

            {/* Standard Bottom Navigation Bar */}
            <div className={`fixed bottom-0 md:bottom-6 left-0 right-0 z-50 pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isChatOpen || isEditingDeck || isCreatingPost || isMeetingModalOpen || isConfirmingDelete || selectedCommunityProfileId ? 'translate-y-32' : 'translate-y-0'}`}>
                <nav 
                  className="pointer-events-auto w-full md:w-fit md:mx-auto h-12 md:h-16 bg-white/40 backdrop-blur-3xl border-t md:border border-white/40 md:rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] pb-safe md:pb-0 md:px-4 flex items-center"
                >
                  <div className="relative w-full md:min-w-[500px] max-w-3xl mx-auto h-full grid grid-cols-5 items-center px-1">
                      {/* Sliding Background Pill */}
                      <div 
                        className="absolute h-[32px] md:h-[40px] rounded-[16px] md:rounded-[20px] top-1/2 -translate-y-1/2 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-zinc-200"
                        style={{ 
                          width: 'calc(20% - 8px)', 
                          left: `calc(${viewIndex} * 20% + 4px)`
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
                        icon={Users} 
                        active={currentView === 'community'} 
                        onClick={() => handleNavClick('community')} 
                        theme={navTheme}
                      />

                      <div className="flex justify-center">
                        <button 
                          onClick={() => setIsCreatingPost(true)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 shadow-lg ${
                            currentView === 'community' 
                              ? 'bg-zinc-900 text-white scale-110' 
                              : 'bg-zinc-100 text-zinc-400 opacity-50 pointer-events-none'
                          }`}
                        >
                          <Plus size={20} className="sm:size-6" strokeWidth={3} />
                        </button>
                      </div>
                      
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
