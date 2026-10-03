import React, { useState, useEffect } from 'react';
import { 
  User, Lock, CreditCard, Bell, Mail, Users, 
  Download, Plus, Check, ExternalLink, Shield, Eye, EyeOff, Camera,
  ArrowRight, Globe, MapPin, BadgeCheck, Trash2, LogOut,
  AlertCircle, Briefcase, KeyRound, Sparkles, UserMinus,
  PauseCircle, PlayCircle, AlertTriangle, RefreshCw, X, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SettingsTabs, SettingsTabItem } from './SettingsTabs';
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
  initialTab?: string;
  isDeactivated?: boolean;
  onDeactivateAccount?: (reason?: string) => Promise<boolean> | void;
  onReactivateAccount?: () => Promise<boolean> | void;
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
  onStartFreeTrial,
  initialTab = 'profile',
  isDeactivated = false,
  onDeactivateAccount,
  onReactivateAccount
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [localProfile, setLocalProfile] = useState(userProfile);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Account Lifecycle & Deactivation State
  const [isDeactivatedLocal, setIsDeactivatedLocal] = useState<boolean>(() => {
    return isDeactivated || userProfile?.isDeactivated || userProfile?.isActive === false || false;
  });
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('Taking a temporary break');
  const [deactivationFeedback, setDeactivationFeedback] = useState('');
  const [confirmAgreement, setConfirmAgreement] = useState(false);
  const [isSubmittingDeactivation, setIsSubmittingDeactivation] = useState(false);
  const [isSubmittingReactivation, setIsSubmittingReactivation] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    setLocalProfile(userProfile);
    if (userProfile?.isDeactivated !== undefined) {
      setIsDeactivatedLocal(userProfile.isDeactivated || userProfile.isActive === false);
    }
  }, [userProfile]);

  useEffect(() => {
    if (isDeactivated !== undefined) {
      setIsDeactivatedLocal(isDeactivated);
    }
  }, [isDeactivated]);

  const handleSaveProfile = () => {
    onUpdateProfile(localProfile);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  const handleConfirmDeactivate = async () => {
    setIsSubmittingDeactivation(true);
    try {
      const fullReason = deactivationReason + (deactivationFeedback.trim() ? ` - ${deactivationFeedback.trim()}` : '');
      if (onDeactivateAccount) {
        await onDeactivateAccount(fullReason);
      }
      setIsDeactivatedLocal(true);
      setIsDeactivateModalOpen(false);
      setActionNotice({
        message: 'Your account has been deactivated. Your profile & pitches are now hidden from discovery.',
        type: 'success'
      });
      setTimeout(() => setActionNotice(null), 5000);
    } catch (e: any) {
      setActionNotice({
        message: e?.message || 'Could not deactivate account. Please try again.',
        type: 'error'
      });
      setTimeout(() => setActionNotice(null), 5000);
    } finally {
      setIsSubmittingDeactivation(false);
    }
  };

  const handleConfirmReactivate = async () => {
    setIsSubmittingReactivation(true);
    try {
      if (onReactivateAccount) {
        await onReactivateAccount();
      }
      setIsDeactivatedLocal(false);
      setActionNotice({
        message: '🎉 Welcome back! Your account has been reactivated and is now visible to members.',
        type: 'success'
      });
      setTimeout(() => setActionNotice(null), 5000);
    } catch (e: any) {
      setActionNotice({
        message: e?.message || 'Could not reactivate account. Please try again.',
        type: 'error'
      });
      setTimeout(() => setActionNotice(null), 5000);
    } finally {
      setIsSubmittingReactivation(false);
    }
  };

  const tabs: SettingsTabItem[] = [
    { id: 'profile', label: 'My Profile', description: 'Public identity & credentials' },
    { id: 'subscription', label: 'Subscription', description: 'Plans, billing & perks', badge: isPro ? 'PRO' : undefined },
    { id: 'password', label: 'Security', description: 'Password & account protection' },
    { id: 'notifications', label: 'Notifications', description: 'Alerts & message sounds' },
    { id: 'account', label: 'Account Lifecycle', description: 'Deactivation & visibility', badge: isDeactivatedLocal ? 'PAUSED' : undefined },
    { id: 'terms', label: 'Terms of Service', description: 'Platform guidelines & rules' },
    { id: 'privacy', label: 'Privacy Policy', description: 'Data handling & rights' },
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
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-50 via-amber-50/20 to-zinc-50 dark:from-zinc-900/80 dark:via-amber-950/20 dark:to-zinc-900/80 border border-amber-300/40 dark:border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                      Your Current Plan
                    </span>
                    {userProfile?.plan === 'pro' && (
                      <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        Active & Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
                      {userProfile?.plan === 'pro' 
                        ? (userProfile?.billingCycle === 'trial' 
                            ? 'Pro Connect (7-Day Free Trial)' 
                            : userProfile?.billingCycle === 'yearly'
                              ? 'Pro Connect (Annual Subscription)'
                              : 'Pro Connect (Monthly Subscription)') 
                        : 'Free Access Tier'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    {userProfile?.plan === 'pro' && userProfile?.subscriptionEndDate ? (
                      <p className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        Renews / Active until: <strong className="text-zinc-800 dark:text-zinc-200">{new Date(userProfile.subscriptionEndDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                      </p>
                    ) : (
                      <p>Standard networking tier. Upgrade to unlock verified Pro features, unlimited direct messaging & 2 startup listings.</p>
                    )}
                  </div>
                </div>
                {userProfile?.plan === 'pro' && (
                  <button 
                    onClick={onCancelSubscription}
                    className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Free Card */}
                <div 
                  onClick={() => setBillingCycle('free')}
                  className={`group relative p-8 rounded-[36px] border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                    billingCycle === 'free' 
                      ? 'border-zinc-900 dark:border-white bg-white dark:bg-zinc-900 shadow-2xl' 
                      : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          {userProfile?.plan !== 'pro' && (
                            <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 inline-block">
                              CURRENT PLAN
                            </span>
                          )}
                          <h4 className="text-xl font-black text-zinc-900 dark:text-white">Free Plan</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-zinc-900 dark:text-white">$0</div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase">forever</div>
                        </div>
                      </div>
                      <div className="space-y-6 flex-1">
                        <ul className="space-y-4 pt-2">
                          {['1 Startup Pitch Listing', 'Standard Profile', 'Limited Community Access', 'No Verified Pro badge'].map((f, i) => (
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
                            {userProfile?.billingCycle === 'trial' ? 'ACTIVE PLAN' : 'PRO TRIAL'}
                          </span>
                          <h4 className="text-xl font-black text-zinc-900 dark:text-white">Pro Trial</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-zinc-900 dark:text-white">$0</div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase">7 Days</div>
                        </div>
                      </div>
                      
                      <ul className="space-y-4 pt-2">
                        {['7-Day Full Pro Access', '2 Startup Pitch Listings', 'Verified Pro badge', 'Direct Messaging'].map((f, i) => (
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
                  className={`group relative p-8 rounded-[36px] border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                    billingCycle === 'monthly' 
                      ? 'border-amber-400 dark:border-amber-400 bg-white dark:bg-zinc-900 shadow-2xl ring-2 ring-amber-400/20' 
                      : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          {userProfile?.plan === 'pro' && userProfile?.billingCycle === 'monthly' && (
                            <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 inline-block">
                              YOUR ACTIVE PLAN
                            </span>
                          )}
                          <h4 className="text-xl font-black text-zinc-900 dark:text-white">Monthly Plan</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-zinc-900 dark:text-white">$5.00</div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase">per month</div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <ul className="space-y-4 pt-2">
                          {['2 Pitch / Startup Listings', 'Full Community Access', 'Direct Messaging', 'Verified Pro badge', 'Priority Matching'].map((f, i) => (
                            <li key={i} className="flex items-center gap-3 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                              <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-md flex-shrink-0">
                                <Check size={12} className="text-black stroke-[3]" />
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
                  className={`group relative p-8 rounded-[36px] border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                    billingCycle === 'yearly' 
                      ? 'border-[#FFBF00] bg-white dark:bg-zinc-900 shadow-2xl ring-2 ring-amber-400/30' 
                      : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          {userProfile?.plan === 'pro' && userProfile?.billingCycle === 'yearly' ? (
                            <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 inline-block">
                              YOUR ACTIVE PLAN
                            </span>
                          ) : (
                            <span className="bg-[#FFBF00] text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 inline-block">
                              BEST VALUE (-50%)
                            </span>
                          )}
                          <h4 className="text-xl font-black text-zinc-900 dark:text-white">Annual Plan</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-zinc-900 dark:text-white">$29.00</div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase">per year</div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <ul className="space-y-4 pt-2">
                          {['2 Pitch / Startup Listings', 'Full Community Access', 'Direct Messaging', 'Verified Pro badge', 'Priority Matching', 'Save $31/year'].map((f, i) => (
                            <li key={i} className="flex items-center gap-3 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                              <div className="w-5 h-5 rounded-full bg-[#FFBF00] flex items-center justify-center shadow-md flex-shrink-0">
                                <Check size={12} className="text-black stroke-[3]" />
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

              {/* Action Button Section */}
              <div className="mt-8 flex flex-col items-center justify-center gap-4">
                {billingCycle === 'free' ? (
                  userProfile?.plan === 'pro' ? (
                    <button 
                      onClick={onCancelSubscription}
                      className="px-10 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
                    >
                      Downgrade to Free
                    </button>
                  ) : (
                    <div className="py-3 px-6 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl font-bold text-sm">
                      You are currently on the Free Access Plan
                    </div>
                  )
                ) : (
                  <div className="w-full max-w-sm">
                    {paystackButton}
                  </div>
                )}
              </div>

              {/* Billing History & Transactions Table */}
              <div className="pt-8 border-t border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                      <span>Billing History & Invoices</span>
                      {((transactions && transactions.length > 0) || userProfile?.plan === 'pro') && (
                        <span className="bg-amber-400/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                          {(transactions && transactions.length > 0 ? transactions.length : 1)} Record{((transactions && transactions.length > 0 ? transactions.length : 1) > 1 ? 's' : '')}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-zinc-500">Record of your subscription payments, upgrades, and receipts</p>
                  </div>
                </div>

                {(() => {
                  const displayTxs = (transactions && transactions.length > 0) 
                    ? transactions 
                    : (userProfile?.plan === 'pro' 
                        ? [{
                            id: 'INV-' + (userProfile?.id ? String(userProfile.id).slice(0, 8).toUpperCase() : 'PRO-1'),
                            tier: 'pro',
                            billing_cycle: userProfile?.billingCycle || 'monthly',
                            amount: userProfile?.billingCycle === 'yearly' ? 29 : (userProfile?.billingCycle === 'trial' ? 0 : 5),
                            currency: 'USD',
                            status: userProfile?.billingCycle === 'trial' ? 'Trial Active' : 'Completed',
                            created_at: new Date().toISOString()
                          }]
                        : []);

                  if (displayTxs.length === 0) {
                    return (
                      <div className="p-8 rounded-3xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800 text-center space-y-2">
                        <CreditCard size={28} className="mx-auto text-zinc-400" />
                        <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No payment transactions yet</div>
                        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                          You are currently on the Free Access tier. When you upgrade to Pro Connect, your receipts and billing history will appear here.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/80 dark:border-zinc-800">
                            <tr>
                              <th className="p-4 font-bold uppercase tracking-wider">Date & Invoice</th>
                              <th className="p-4 font-bold uppercase tracking-wider">Plan & Cycle</th>
                              <th className="p-4 font-bold uppercase tracking-wider">Amount</th>
                              <th className="p-4 font-bold uppercase tracking-wider">Payment Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                            {displayTxs.map((tx, idx) => (
                              <tr key={tx.id || idx} className="hover:bg-amber-50/30 dark:hover:bg-zinc-800/40 transition-colors">
                                <td className="p-4">
                                  <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                    {tx.created_at ? new Date(tx.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                                  </div>
                                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                                    {tx.id ? String(tx.id).slice(0, 18) : `TX-${idx + 1001}`}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="font-bold text-zinc-900 dark:text-white capitalize">
                                    {tx.tier === 'pro' ? 'Pro Connect' : (tx.tier || 'Pro Plan')}
                                  </div>
                                  <div className="text-[11px] text-zinc-500 capitalize">
                                    {tx.billing_cycle === 'yearly' ? 'Annual Billing ($29/yr)' : tx.billing_cycle === 'trial' ? '7-Day Free Trial' : 'Monthly Billing ($5/mo)'}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="text-sm font-black text-zinc-950 dark:text-white">
                                    ${Number(tx.amount || 0).toFixed(2)}
                                  </span>
                                  <span className="text-[10px] font-bold text-zinc-400 ml-1">
                                    {tx.currency || 'USD'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {tx.status || 'Paid & Active'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
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
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Header */}
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                <User size={14} />
                <span>Account Identity</span>
              </div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Public Profile</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                This information is displayed on your ConnectUp networking card, swipe deck, and founder community profile.
              </p>
            </div>

            {/* Profile Avatar Zone */}
            <div className="p-6 bg-zinc-50/70 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group shrink-0">
                <input 
                  type="file" 
                  id="avatar-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={onAvatarChange}
                />
                <div 
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 shadow-sm cursor-pointer relative"
                >
                  {localProfile?.avatarUrl || localProfile?.avatar_url || localProfile?.avatar ? (
                    <img 
                      src={localProfile.avatarUrl || localProfile.avatar_url || localProfile.avatar} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      alt={localProfile.name || 'User'} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 font-black text-3xl">
                      {(localProfile?.name || localProfile?.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera size={22} className="text-amber-400" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="absolute -bottom-1 -right-1 p-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Upload image"
                >
                  <Camera size={14} />
                </button>
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <h4 className="text-base font-bold text-zinc-900 dark:text-white">Profile Photo</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                  Upload a high-resolution photo. Recommended square PNG, JPG, or WEBP under 5MB.
                </p>
                <div className="pt-2 flex items-center gap-3 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Change Photo
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} className="text-amber-500" />
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={localProfile.name || ''} 
                  onChange={(e) => setLocalProfile({...localProfile, name: e.target.value})}
                  placeholder="e.g. Alex Chen"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase size={13} className="text-amber-500" />
                  {role === 'founder' ? 'Founder Title / Role' : 'Professional Title'}
                </label>
                <input 
                  type="text" 
                  value={localProfile.title || ''} 
                  onChange={(e) => setLocalProfile({...localProfile, title: e.target.value})}
                  placeholder={role === 'founder' ? 'e.g. Founder & CEO' : 'e.g. Partner, Venture Fund'}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={13} className="text-amber-500" />
                  Location
                </label>
                <input 
                  type="text" 
                  value={localProfile.location || ''} 
                  onChange={(e) => setLocalProfile({...localProfile, location: e.target.value})}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={13} className="text-amber-500" />
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={localProfile.email || ''} 
                  onChange={(e) => setLocalProfile({...localProfile, email: e.target.value})}
                  placeholder="e.g. alex@startup.com"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none transition-all" 
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 pb-16 sm:pb-4 flex items-center gap-4">
              <button 
                onClick={handleSaveProfile}
                className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-black transition-all shadow-md active:scale-95 cursor-pointer ${
                  saveSuccess 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check size={16} />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      case 'password':
        return (
          <div className="max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Header */}
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                <Lock size={14} />
                <span>Account Protection</span>
              </div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Security & Credentials</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Keep your account secure with a strong password.
              </p>
            </div>

            <form onSubmit={onUpdatePassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
                    value={passwordState.new}
                    onChange={(e) => passwordState.setNew(e.target.value)}
                    placeholder="Enter at least 8 characters"
                    className="w-full pl-4 pr-11 py-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none transition-all" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    value={passwordState.confirm}
                    onChange={(e) => passwordState.setConfirm(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-4 pr-11 py-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none transition-all" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5">
                <p className="font-bold text-zinc-700 dark:text-zinc-300">Password requirements:</p>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordState.new.length >= 8 ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                  <span>Minimum 8 characters length</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordState.new && passwordState.new === passwordState.confirm ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                  <span>Passwords match</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={passwordState.updating || !passwordState.new || passwordState.new !== passwordState.confirm}
                className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer active:scale-95"
              >
                {passwordState.updating ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Header */}
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                <Bell size={14} />
                <span>Preferences</span>
              </div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Notification Settings</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Control audio chimes, read receipts, and alert prompts.
              </p>
            </div>

            <div className="space-y-4 max-w-2xl">
              {[
                { 
                  label: 'Audio Sound Effects', 
                  sub: 'Play an acoustic chime when receiving new direct messages or match alerts', 
                  active: notificationState.sounds, 
                  onToggle: notificationState.setSounds,
                  icon: Bell
                },
                { 
                  label: 'Read Receipts', 
                  sub: 'Allow matched founders and investors to see when you have read their messages', 
                  active: notificationState.readReceipts, 
                  onToggle: notificationState.setReadReceipts,
                  icon: Eye
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 rounded-2xl shadow-xs">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                      <item.icon size={18} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.label}</span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">{item.sub}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => item.onToggle(!item.active)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 relative shrink-0 cursor-pointer ${
                      item.active ? 'bg-amber-400' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-zinc-950 rounded-full shadow-sm transition-transform duration-200 ${
                      item.active ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'account':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Header */}
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                <UserMinus size={14} />
                <span>Account Lifecycle & Privacy</span>
              </div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Account Deactivation</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Temporarily pause your presence and visibility on ConnectUp without losing any of your saved data, chats, or investor connections.
              </p>
            </div>

            {/* Current Status Box */}
            <div className={`p-6 rounded-3xl border transition-all ${
              isDeactivatedLocal
                ? 'bg-amber-500/10 border-amber-400/40 dark:bg-amber-950/20 dark:border-amber-500/30'
                : 'bg-emerald-500/10 border-emerald-400/40 dark:bg-emerald-950/20 dark:border-emerald-500/30'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isDeactivatedLocal 
                      ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400' 
                      : 'bg-emerald-400/20 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {isDeactivatedLocal ? <PauseCircle size={24} /> : <CheckCircle2 size={24} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">
                        Account Status: {isDeactivatedLocal ? 'Deactivated (Paused)' : 'Active & Discoverable'}
                      </h4>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isDeactivatedLocal 
                          ? 'bg-amber-400 text-zinc-950' 
                          : 'bg-emerald-500 text-white'
                      }`}>
                        {isDeactivatedLocal ? 'Hidden' : 'Live'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
                      {isDeactivatedLocal 
                        ? 'Your account is currently paused. Your profile and startup pitches are hidden from the discovery swipe deck, searches, and directories. You can reactivate anytime with one click.'
                        : 'Your account is active. Founders and investors can view your profile, match on swipe cards, and message you directly.'}
                    </p>
                  </div>
                </div>

                {isDeactivatedLocal && (
                  <button
                    type="button"
                    onClick={handleConfirmReactivate}
                    disabled={isSubmittingReactivation}
                    className="self-start sm:self-center px-6 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isSubmittingReactivation ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <PlayCircle size={15} />
                    )}
                    <span>Reactivate Account Now</span>
                  </button>
                )}
              </div>
            </div>

            {/* Deactivation vs Deletion Explanation Cards */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="p-6 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm">
                  <PauseCircle size={18} className="text-amber-500" />
                  <span>Deactivation (Reversible)</span>
                </div>
                <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Your startup pitch & cards are hidden from discovery.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>All messages, contacts, and pitch decks are preserved safely.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Inbound email alerts and push sounds are silenced.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Instant reactivation anytime by clicking "Reactivate".</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm">
                  <Trash2 size={18} className="text-red-500" />
                  <span>Permanent Deletion (Irreversible)</span>
                </div>
                <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <span>Permanently wipes all profile data, pitches, and meetings.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <span>Deletes all conversations and mutual matches forever.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <span>Cancels active subscription tier with no undo possible.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Interactive Deactivation Form */}
            {!isDeactivatedLocal ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-zinc-50/50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-6">
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">
                    Ready to take a break?
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Select a reason to help us improve, then confirm your account deactivation below.
                  </p>
                </div>

                <div className="space-y-4 max-w-xl">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Reason for Deactivation
                    </label>
                    <select
                      value={deactivationReason}
                      onChange={(e) => setDeactivationReason(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none transition-all cursor-pointer"
                    >
                      <option value="Taking a temporary break">Taking a temporary break from networking</option>
                      <option value="Already found co-founder / investor">Already closed round or found partner</option>
                      <option value="Focusing on product development">Focusing on product / stealth mode</option>
                      <option value="Privacy and security concerns">Privacy & personal time</option>
                      <option value="Too many notifications or messages">Too many messages or notifications</option>
                      <option value="Other reason">Other reason</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={deactivationFeedback}
                      onChange={(e) => setDeactivationFeedback(e.target.value)}
                      placeholder="Tell us what we could do better, or any details regarding your pause..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-sm font-medium text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDeactivateModalOpen(true)}
                      className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <PauseCircle size={16} />
                      <span>Deactivate My Account</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 rounded-3xl bg-amber-500/10 border border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">
                    Want to resume connecting?
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Your profile and startup cards will immediately reappear in the swipe deck.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmReactivate}
                  disabled={isSubmittingReactivation}
                  className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReactivation ? <RefreshCw size={14} className="animate-spin" /> : <PlayCircle size={16} />}
                  <span>Reactivate Account</span>
                </button>
              </div>
            )}

            {/* Danger Zone: Permanent Deletion Section */}
            {onDeleteAccount && (
              <div className="pt-8 border-t border-zinc-200/80 dark:border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldAlert size={14} />
                  <span>Permanent Danger Zone</span>
                </div>
                <div className="p-6 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-red-900 dark:text-red-200">
                      Permanently Delete Account
                    </h5>
                    <p className="text-xs text-red-700/80 dark:text-red-300/70 max-w-md">
                      Once deleted, all your data, messages, and uploaded files are deleted permanently and cannot be recovered.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onDeleteAccount}
                    className="self-start sm:self-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                  >
                    <Trash2 size={14} />
                    <span>Delete Account Permanently</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return <div className="py-20 text-center text-zinc-400">Coming soon...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF9] dark:bg-[#0D0D0F] flex flex-col p-4 sm:p-8 lg:p-10 pb-28 md:pb-12 transition-colors duration-500">
      <div className="max-w-[1400px] mx-auto w-full space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                Settings
              </h1>
              {isPro ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 text-zinc-950 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs">
                  <BadgeCheck size={14} className="fill-zinc-950 text-amber-400" />
                  Pro Member
                </div>
              ) : (
                <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-[11px] font-bold uppercase tracking-wider">
                  Free Member
                </div>
              )}
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100/80 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-900/40 dark:text-red-400 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </header>

        {/* Content Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-[28px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-zinc-200/80 dark:border-zinc-800 flex flex-col lg:flex-row min-h-[720px] relative overflow-hidden">
          {/* Left Navigation Sidebar */}
          <div className="w-full lg:w-80 shrink-0 bg-zinc-50/70 dark:bg-zinc-900/50 border-b lg:border-b-0 lg:border-r border-zinc-200/70 dark:border-zinc-800 flex flex-col justify-between">
            <div className="p-4 sm:p-6 lg:p-7 space-y-5">
              {/* User Mini Profile Widget */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 shadow-xs flex items-center gap-3">
                {localProfile?.avatarUrl || localProfile?.avatar_url || localProfile?.avatar || userProfile?.avatarUrl ? (
                  <img
                    src={localProfile?.avatarUrl || localProfile?.avatar_url || localProfile?.avatar || userProfile?.avatarUrl}
                    alt={localProfile?.name || 'User'}
                    className="w-11 h-11 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {(localProfile?.name || localProfile?.email || userProfile?.name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-sm text-zinc-900 dark:text-white truncate">
                      {localProfile?.name || userProfile?.name || 'Founder'}
                    </p>
                    {isPro && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Pro Member" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5 font-medium">
                    {localProfile?.email || userProfile?.email || 'user@connectup.com'}
                  </p>
                </div>
              </div>

              {/* Enhanced Settings Tabs */}
              <SettingsTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Account Lifecycle & Deactivation Widget (Selected Sidebar Footer - White Background with Red & Yellow Buttons) */}
            <div className="p-4 sm:p-5 m-3 sm:m-4 rounded-2xl bg-white dark:bg-zinc-850/90 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isDeactivatedLocal ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Account Status
                  </span>
                </div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  isDeactivatedLocal 
                    ? 'bg-amber-50 text-amber-800 border-amber-300/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60' 
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60'
                }`}>
                  {isDeactivatedLocal ? 'Deactivated' : 'Active'}
                </span>
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                {isDeactivatedLocal 
                  ? 'Your profile & startups are paused and hidden from swipe discovery.' 
                  : 'Profile is discoverable. You can pause visibility or deactivate anytime.'}
              </p>

              {isDeactivatedLocal ? (
                <button
                  type="button"
                  onClick={handleConfirmReactivate}
                  disabled={isSubmittingReactivation}
                  className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-red-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-400/25 active:scale-95 cursor-pointer border border-amber-500/80 disabled:opacity-50"
                >
                  {isSubmittingReactivation ? <RefreshCw size={13} className="animate-spin text-red-700" /> : <PlayCircle size={14} className="text-red-700" />}
                  <span>Reactivate Account</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDeactivateModalOpen(true)}
                  className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-amber-300 hover:text-amber-200 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer border border-red-700 hover:border-red-800"
                >
                  <PauseCircle size={14} className="text-amber-300" />
                  <span>Deactivate Account</span>
                </button>
              )}

              {onDeleteAccount && (
                <div className="pt-1 text-center border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={onDeleteAccount}
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={11} className="text-red-500" />
                    <span>Permanent Deletion</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Content Panel */}
          <div 
            className="flex-1 p-6 sm:p-10 lg:p-12 pb-36 sm:pb-12 bg-white dark:bg-zinc-900 overflow-y-auto overscroll-y-contain touch-pan-y scroll-smooth"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Global In-Settings Action Notification */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] max-w-md w-full px-4 pointer-events-none"
          >
            <div className={`p-4 rounded-2xl shadow-xl border backdrop-blur-md flex items-center gap-3 pointer-events-auto ${
              actionNotice.type === 'error'
                ? 'bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                : 'bg-zinc-900/95 dark:bg-zinc-800/95 border-zinc-800 dark:border-zinc-700 text-white'
            }`}>
              {actionNotice.type === 'error' ? (
                <AlertTriangle size={18} className="text-red-500 shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="text-amber-400 shrink-0" />
              )}
              <p className="text-xs font-bold flex-1 leading-snug">{actionNotice.message}</p>
              <button
                type="button"
                onClick={() => setActionNotice(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Deactivation Modal */}
      {isDeactivateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs" 
            onClick={() => !isSubmittingDeactivation && setIsDeactivateModalOpen(false)} 
          />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 pointer-events-auto space-y-5">
            <button 
              onClick={() => !isSubmittingDeactivation && setIsDeactivateModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer rounded-full"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/40">
              <UserMinus size={26} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">Deactivate Account?</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Your profile & startup pitches will immediately be hidden from swipe discovery and public listings. Your data remains completely safe.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-bold">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>What happens next:</span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                • Pitch cards paused & removed from active feed<br />
                • Chats, contacts, and bookmarks preserved<br />
                • You can reactivate anytime in seconds
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                Reason for leaving (Optional)
              </label>
              <select
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="Taking a temporary break">Taking a temporary break</option>
                <option value="Already closed round / found partner">Already closed round / found partner</option>
                <option value="Stealth mode / product focus">Stealth mode / product focus</option>
                <option value="Privacy reasons">Privacy & personal time</option>
                <option value="Other">Other reason</option>
              </select>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={isSubmittingDeactivation}
                className="w-full py-3.5 bg-zinc-900 hover:bg-black dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-zinc-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmittingDeactivation ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Deactivating...</span>
                  </>
                ) : (
                  <>
                    <PauseCircle size={15} />
                    <span>Confirm & Deactivate Account</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsDeactivateModalOpen(false)}
                disabled={isSubmittingDeactivation}
                className="w-full py-3 bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-600 dark:text-zinc-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Keep Account Active
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
