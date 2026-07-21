import React, { useState, useEffect } from 'react';
import { 
  User, Lock, CreditCard, Bell, Mail, Users, 
  Download, Plus, Check, ExternalLink, Shield, Eye, Camera,
  ArrowRight, Globe, MapPin, BadgeCheck, Trash2, LogOut,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SettingsTabs } from './SettingsTabs';
import { Card } from './Card';

interface SettingsViewProps {
  userProfile: any;
  transactions: any[];
  billingCycle: 'monthly' | 'yearly' | 'free';
  setBillingCycle: (cycle: 'monthly' | 'yearly' | 'free') => void;
  onUpdateProfile: (data: any) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdatePassword: (e: React.FormEvent) => void;
  passwordState: {
    new: string;
    setNew: (v: string) => void;
    confirm: string;
    setConfirm: (v: string) => void;
    updating: boolean;
  };
  notificationState: {
    sounds: boolean;
    setSounds: (v: boolean) => void;
    readReceipts: boolean;
    setReadReceipts: (v: boolean) => void;
  };
  onLogout: () => void;
  onDeleteAccount?: () => void;
  onCancelSubscription?: () => void;
  paystackButton?: React.ReactNode;
  isPro?: boolean;
  role?: 'founder' | 'investor';
  hasUsedTrial?: boolean;
  onStartFreeTrial?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  transactions,
  billingCycle,
  setBillingCycle,
  onUpdateProfile,
  onAvatarChange,
  onUpdatePassword,
  passwordState,
  notificationState,
  onLogout,
  onDeleteAccount,
  onCancelSubscription,
  paystackButton,
  isPro,
  role,
  hasUsedTrial,
  onStartFreeTrial
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [localProfile, setLocalProfile] = useState(userProfile);

  useEffect(() => {
    setLocalProfile(userProfile);
  }, [userProfile]);

  const tabs = [
    { id: 'profile', label: 'My Profile' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'password', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'terms', label: 'Terms of Service' },
    { id: 'privacy', label: 'Privacy Policy' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'subscription':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="space-y-10">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Subscription Plan</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 max-w-md">Choose the perfect tier to accelerate your networking and capital growth journey.</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-1.5 rounded-2xl flex w-full sm:w-auto sm:inline-flex shadow-inner border border-zinc-200/50 dark:border-zinc-800">
                  <button 
                    onClick={() => setBillingCycle('free')} 
                    className={`flex-1 sm:flex-initial text-center px-3 sm:px-8 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 ${billingCycle === 'free' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-md scale-[1.02]' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    Free
                  </button>
                  <button 
                    onClick={() => setBillingCycle('monthly')} 
                    className={`flex-1 sm:flex-initial text-center px-3 sm:px-8 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 ${billingCycle === 'monthly' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-md scale-[1.02]' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    Monthly
                  </button>
                  <button 
                    onClick={() => setBillingCycle('yearly')} 
                    className={`flex-1 sm:flex-initial text-center px-3 sm:px-8 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 ${billingCycle === 'yearly' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-md scale-[1.02]' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      Annual
                      <span className="bg-[#EAB308] text-black text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm">
                        -50%
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Current active plan status header box */}
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Your Current Plan</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-bold text-zinc-900 dark:text-white">
                      {userProfile?.plan === 'pro' 
                        ? (userProfile?.billingCycle === 'trial' ? 'Pro Connect (7-Day Free Trial)' : 'Pro Connect') 
                        : 'Free Access'}
                    </span>
                    {userProfile?.plan === 'pro' && (
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                        Active
                      </span>
                    )}
                  </div>
                  {userProfile?.plan === 'pro' && userProfile?.subscriptionEndDate && (
                    <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-1.5">
                      Renews/Ends on: {new Date(userProfile.subscriptionEndDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {userProfile?.plan === 'pro' && (
                  <button 
                    onClick={onCancelSubscription}
                    className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Free Card */}
                <div 
                  onClick={() => setBillingCycle('free')}
                  className={`group relative p-8 rounded-[36px] border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${billingCycle === 'free' ? 'border-zinc-900 dark:border-white bg-white dark:bg-zinc-900 shadow-2xl' : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-600'}`}
                >
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-xl font-black text-zinc-900 dark:text-white">Free Plan</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-zinc-900 dark:text-white">$0</div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase">forever</div>
                        </div>
                      </div>
                      <div className="space-y-6 flex-1">
                        <ul className="space-y-4 pt-2">
                          {['Limited Community Access', 'Basic Profile', 'No Verified Pro badge'].map((f, i) => (
                            <li key={i} className="flex items-center gap-3 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                              <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                <Check size={12} className="text-zinc-500" />
                              </div>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Free Trial Card */}
                <div 
                  onClick={() => {
                    if (!hasUsedTrial && !isPro) {
                      onStartFreeTrial?.();
                    }
                  }}
                  className={`group relative p-8 rounded-[36px] border-2 transition-all overflow-hidden flex flex-col justify-between ${
                    userProfile?.billingCycle === 'trial' 
                      ? 'border-amber-500 dark:border-amber-400 bg-white dark:bg-zinc-900 shadow-2xl' 
                      : !isPro && !hasUsedTrial 
                        ? 'border-zinc-100 hover:border-amber-500 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 cursor-pointer hover:shadow-lg' 
                        : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/10 dark:bg-zinc-900/10 opacity-60'
                  }`}
                >
                  <div className="relative z-10 flex flex-col h-full justify-between w-full">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="bg-amber-400/20 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 inline-block">
                            PRO TRIAL
                          </span>
                          <h4 className="text-xl font-black text-zinc-900 dark:text-white">Pro Trial</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-zinc-900 dark:text-white">$0</div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase">7 Days</div>
                        </div>
                      </div>
                      
                      <ul className="space-y-4 pt-2">
                        {['7-Day Full Pro Access', 'Direct Messaging', 'Verified Pro badge', 'No credit card required'].map((f, i) => (
                          <li key={i} className="flex items-center gap-3 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                            <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                              <Check size={12} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8">
                      {userProfile?.billingCycle === 'trial' ? (
                        <div className="w-full py-3 bg-amber-500 text-zinc-950 text-center font-black rounded-xl shadow-md text-xs">
                          Active Trial
                        </div>
                      ) : hasUsedTrial ? (
                        <div className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-450 text-center font-black rounded-xl text-xs border border-zinc-200/30 dark:border-zinc-700/50">
                          Trial Already Used
                        </div>
                      ) : isPro ? (
                        <div className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-450 text-center font-black rounded-xl text-xs border border-zinc-200/30 dark:border-zinc-700/50">
                          Pro Active
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartFreeTrial?.();
                          }}
                          className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-zinc-900 font-black rounded-xl transition-all shadow-md text-xs cursor-pointer"
                        >
                          Start Free Trial
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Monthly Card */}
                <div 
                  onClick={() => setBillingCycle('monthly')}
                  className={`group relative p-8 rounded-[36px] border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${billingCycle === 'monthly' ? 'border-zinc-900 dark:border-white bg-white dark:bg-zinc-900 shadow-2xl' : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-600'}`}
                >
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-xl font-black text-zinc-900 dark:text-white">Monthly Plan</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-zinc-900 dark:text-white">$5.00</div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase">per month</div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <ul className="space-y-4 pt-2">
                          {['Full Community Access', 'Direct Messaging', 'Verified Pro badge', 'Priority Support'].map((f, i) => (
                            <li key={i} className="flex items-center gap-3 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                              <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20 flex-shrink-0">
                                <Check size={12} className="text-black" />
                              </div>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Annual Card */}
                <div 
                  onClick={() => setBillingCycle('yearly')}
                  className={`group relative p-8 rounded-[36px] border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${billingCycle === 'yearly' ? 'border-zinc-900 dark:border-white bg-white dark:bg-zinc-900 shadow-2xl' : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-600'}`}
                >
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-xl font-black text-zinc-900 dark:text-white">Annual Plan</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-zinc-900 dark:text-white">$29.00</div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase">per year</div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <ul className="space-y-4 pt-2">
                          {['Full Community Access', 'Direct Messaging', 'Verified Pro badge', 'Priority Support'].map((f, i) => (
                            <li key={i} className="flex items-center gap-3 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                              <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20 flex-shrink-0">
                                <Check size={12} className="text-black" />
                              </div>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-center">
                {billingCycle === 'free' ? (
                  <button 
                    onClick={onCancelSubscription}
                    className="px-10 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Downgrade to Free
                  </button>
                ) : (
                  <div className="w-full max-w-sm">
                    {paystackButton}
                  </div>
                )}
              </div>
            </section>

          </div>
        );
      case 'terms':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="space-y-4">
              <h3 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Terms of Service</h3>
              <p className="text-zinc-500">Last updated: July 2024</p>
            </header>
            <div className="prose dark:prose-invert max-w-none space-y-8">
              {[
                { title: "Acceptance", content: "By using connectup, you agree to these terms. Our platform provides a networking environment for capital and innovation." },
                { title: "Accounts", content: "You are responsible for your account security. Notify us immediately of any unauthorized use." },
                { title: "Conduct", content: "Any misuse of the platform or data is prohibited. We maintain a professional environment for all members." },
                { title: "Ownership", content: "Platform code, designs, and data remain the exclusive property of connectup." }
              ].map((section, i) => (
                <section key={i} className="space-y-4">
                  <h4 className="text-xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white">
                    <span className="text-brand-primary">0{i+1}</span>
                    {section.title}
                  </h4>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed pl-8 border-l-2 border-zinc-100 dark:border-zinc-800">{section.content}</p>
                </section>
              ))}
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="space-y-4">
              <h3 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Privacy Policy</h3>
              <p className="text-zinc-500">Your privacy is our foundational constant.</p>
            </header>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { 
                  title: "Data Collection", 
                  content: "We only collect data necessary to provide our service, such as your profile information and professional details.", 
                  icon: Shield,
                  bgImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600"
                },
                { 
                  title: "How We Use Data", 
                  content: "Your data is used to facilitate matches and power platform features. We do not sell your personal information.", 
                  icon: Lock,
                  bgImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600"
                },
                { 
                  title: "Your Rights", 
                  content: "You have full control over your data. You can request access, corrections, or deletion at any time.", 
                  icon: Eye,
                  bgImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600"
                },
                { 
                  title: "Security", 
                  content: "We use secure token-based authentication and TLS encryption to protect your account access.", 
                  icon: Shield,
                  bgImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600"
                }
              ].map((section, i) => (
                <div key={i} className="group relative p-8 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 space-y-4 overflow-hidden transition-all duration-300 hover:shadow-lg">
                  {/* Background Image with elegant overlay */}
                  <div className="absolute inset-0 z-0 pointer-events-none transition-transform duration-700 group-hover:scale-110">
                    <img 
                      src={section.bgImage} 
                      alt="" 
                      className="w-full h-full object-cover opacity-[0.05] dark:opacity-[0.12] mix-blend-multiply dark:mix-blend-overlay"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/80 via-transparent to-transparent dark:from-zinc-900/80" />
                  </div>

                  <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white shadow-sm">
                      <section.icon size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{section.title}</h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Public Profile</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">This information will be displayed publicly.</p>
                  </div>
                  <div className="flex flex-col items-center sm:flex-row gap-6">
                        <input 
                            type="file" 
                            id="avatar-upload" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={onAvatarChange}
                        />
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-4 border-white dark:border-zinc-900 shadow-2xl relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                       {userProfile.avatarUrl ? (
                         <img src={userProfile.avatarUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" loading="eager" fetchPriority="high" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                           <User size={48} className="text-yellow-500" />
                         </div>
                       )}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Camera className="text-yellow-500" size={24} />
                       </div>
                     </div>
                  </div>
                </div>

                  <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Full Name</label>
                    <input 
                      type="text" 
                      value={localProfile.name} 
                      onChange={(e) => setLocalProfile({...localProfile, name: e.target.value})}
                      className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-900/5 dark:focus:ring-white/5 focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold text-zinc-900 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">
                      {role === 'founder' ? 'Founder Title' : 'Investor Title'}
                    </label>
                    <input 
                      type="text" 
                      value={localProfile.title} 
                      onChange={(e) => setLocalProfile({...localProfile, title: e.target.value})}
                      className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-900/5 dark:focus:ring-white/5 focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold text-zinc-900 dark:text-white" 
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500" size={16} />
                        <input 
                          type="text" 
                          value={localProfile.location} 
                          onChange={(e) => setLocalProfile({...localProfile, location: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 sm:pl-12 sm:pr-6 sm:py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-900/5 dark:focus:ring-white/5 focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold text-zinc-900 dark:text-white" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Email Address</label>
                      <input 
                        type="email" 
                        value={localProfile.email} 
                        onChange={(e) => setLocalProfile({...localProfile, email: e.target.value})}
                        className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-900/5 dark:focus:ring-white/5 focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold text-zinc-900 dark:text-white" 
                      />
                    </div>
                  </div>

                    <button 
                      onClick={() => onUpdateProfile(localProfile)}
                      className="w-full sm:w-auto px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl text-sm font-black hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                      Save Changes
                    </button>
                 </div>
              </section>
          </div>
        );
      case 'password':
        return (
          <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Change Password</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Keep your account secure with a strong password.</p>
            <form onSubmit={onUpdatePassword} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">New Password</label>
                 <input 
                  type="password" 
                  value={passwordState.new}
                  onChange={(e) => passwordState.setNew(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/5 focus:border-zinc-900 dark:focus:border-white outline-none transition-all" 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Confirm Password</label>
                 <input 
                  type="password" 
                  value={passwordState.confirm}
                  onChange={(e) => passwordState.setConfirm(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/5 focus:border-zinc-900 dark:focus:border-white outline-none transition-all" 
                 />
               </div>
               <button 
                type="submit"
                disabled={passwordState.updating}
                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:bg-black dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
               >
                 {passwordState.updating ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Update Password'}
               </button>
            </form>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Notification Preferences</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Control how you receive updates and alerts.</p>
                </div>
                <div className="space-y-4">
                   {[
                     { label: 'Sound Effects', sub: 'Play sounds for new messages', active: notificationState.sounds, onToggle: notificationState.setSounds },
                     { label: 'Read Receipts', sub: 'Show when you\'ve seen messages', active: notificationState.readReceipts, onToggle: notificationState.setReadReceipts },
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm">
                        <div className="space-y-1">
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.label}</span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.sub}</p>
                        </div>
                        <button 
                          onClick={() => item.onToggle(!item.active)}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative ${item.active ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                        >
                          <div className={`w-4 h-4 bg-white dark:bg-zinc-900 rounded-full shadow-sm transition-transform duration-300 ${item.active ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                     </div>
                   ))}
                </div>
             </section>
          </div>
        );
      default:
        return <div className="py-20 text-center text-zinc-400">Coming soon...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF9] dark:bg-[#0D0D0F] flex flex-col p-4 sm:p-8 lg:p-12 pb-28 md:pb-12 transition-colors duration-700">
      <div className="max-w-[1400px] mx-auto w-full space-y-8">
        {/* Header */}
        <header className="flex flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-start gap-3">
              <h1 className="text-4xl font-display font-black text-zinc-900 dark:text-white tracking-tight">Settings</h1>
              {isPro && (
                <div className="flex items-center gap-1 px-3 py-1 bg-brand-primary text-black rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg shadow-brand-primary/20">
                  <BadgeCheck size={14} />
                  Pro
                </div>
              )}
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="p-3 bg-red-50 text-red-600 rounded-full hover:scale-105 active:scale-95 transition-all"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* Content Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl shadow-black/[0.03] border border-zinc-100 dark:border-zinc-800 flex flex-col lg:flex-row min-h-[700px] relative">
          <div className="w-full lg:w-72 sticky top-0 lg:top-8 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md lg:backdrop-blur-none lg:bg-zinc-50/50 lg:dark:bg-zinc-900/50 border-b lg:border-b-0 lg:border-r border-zinc-100 dark:border-zinc-800 rounded-t-[32px] lg:rounded-l-[32px] lg:rounded-tr-none flex flex-col justify-between self-start">
            <div className="p-4 sm:p-6 lg:p-8 lg:pt-12">
              <SettingsTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </div>
          <div className="flex-1 p-8 sm:p-12 bg-white dark:bg-zinc-900 rounded-b-[32px] lg:rounded-r-[32px] lg:rounded-bl-none">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
