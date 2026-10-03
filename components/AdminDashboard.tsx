import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, ShieldCheck, DollarSign, AlertTriangle, TrendingUp, Search, 
  Filter, Plus, CheckCircle, XCircle, MoreVertical, Download, RefreshCw, 
  Mail, Edit3, Trash2, ShieldAlert, FileText, Ban, Activity,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, CreditCard, Lock,
  UserPlus, Check, Eye, ChevronRight, X, AlertCircle, Clock, Send, FileSpreadsheet,
  Settings, HelpCircle, Bell, LogOut, LayoutGrid, Mic, Play, Copy, ExternalLink,
  ChevronDown, Sun, Moon, Sparkles, Database, Laptop, Layers,
  CheckCircle2, Info, BellRing, Receipt, Printer
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import { UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { VideoPlayer } from './VideoPlayer';
import { StorageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';

interface AdminDashboardProps {
  userProfile?: any;
  onNavigateHome?: () => void;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'FOUNDER' | 'INVESTOR' | 'ADMIN';
  plan: 'free' | 'pro';
  billingCycle?: 'monthly' | 'yearly' | 'trial' | null;
  status: 'active' | 'suspended' | 'flagged';
  avatarUrl?: string;
  location?: string;
  joinedDate: string;
  lastActive: string;
  assets?: string;
  followingCount?: number;
  followersCount?: number;
}

export interface AdminSubscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  plan: 'pro';
  billingCycle: 'monthly' | 'yearly' | 'trial';
  amount: number;
  currency: string;
  provider: 'Paystack' | 'Manual Grant';
  reference?: string;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  createdAt: string;
}

export interface AdminReport {
  id: string;
  reporterName: string;
  reporterEmail: string;
  targetType: 'post' | 'user' | 'chat' | 'startup' | 'video';
  targetId: string;
  targetContent: string;
  videoUrl?: string | null;
  reason: 'spam' | 'harassment' | 'misleading' | 'inappropriate' | 'other';
  severity: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  createdAt: string;
  notes?: string;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AdminToast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  category: 'SYSTEM' | 'SECURITY' | 'BILLING' | 'USER' | 'AUDIT';
  actionLabel?: string;
  onAction?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ userProfile, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<'dashboards' | 'users' | 'subscriptions' | 'reports' | 'logs' | 'settings'>('dashboards');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live database counts
  const [startupsCount, setStartupsCount] = useState(0);
  const [swipesCount, setSwipesCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [pitchesCount, setPitchesCount] = useState(0);

  // Search & Filter state
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'FOUNDER' | 'INVESTOR' | 'ADMIN'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'pro' | 'free'>('all');
  const [reportSearch, setReportSearch] = useState('');
  const [subscriptionSearch, setSubscriptionSearch] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'completed' | 'cancelled' | 'refunded' | 'trial'>('all');
  const [isFetchingSubscriptions, setIsFetchingSubscriptions] = useState(false);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);
  const [auditLogSearch, setAuditLogSearch] = useState('');
  const [auditLogTypeFilter, setAuditLogTypeFilter] = useState<string>('all');
  const [reportSeverityFilter, setReportSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'in_review'>('all');

  // Chart configuration
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [activeToast, setActiveToast] = useState<AdminToast | null>(null);
  const [isToastPaused, setIsToastPaused] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsFilter, setNotificationsFilter] = useState<'all' | 'security' | 'billing'>('all');
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('connectup_admin_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('connectup_admin_read_notifications', JSON.stringify(readNotificationIds));
    } catch {}
  }, [readNotificationIds]);

  // Modals state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isGrantSubModalOpen, setIsGrantSubModalOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<AdminUser | null>(null);
  const [selectedUserStartup, setSelectedUserStartup] = useState<any>(null);
  const [selectedUserPitches, setSelectedUserPitches] = useState<any[]>([]);
  const [selectedUserTransactions, setSelectedUserTransactions] = useState<any[]>([]);
  const [isFetchingProfileDetails, setIsFetchingProfileDetails] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<AdminSubscription | null>(null);

  // Dashboard Overview Transaction Ledger state
  const [dashboardTxFilter, setDashboardTxFilter] = useState<'all' | 'completed' | 'refunded' | 'trial'>('all');
  const [dashboardTxSearch, setDashboardTxSearch] = useState('');
  const [dashboardTxLimit, setDashboardTxLimit] = useState<number>(10);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  // Admin profile state
  const [adminProfileState, setAdminProfileState] = useState({
    fullName: userProfile?.name || userProfile?.full_name || '',
    avatarUrl: userProfile?.avatarUrl || userProfile?.avatar_url || '',
    title: userProfile?.title || 'System Administrator',
    bio: userProfile?.bio || '',
    location: userProfile?.location || '',
    email: userProfile?.email || ''
  });

  const [requireEmailVerification, setRequireEmailVerification] = useState<boolean>(() => {
    const saved = localStorage.getItem('connectup_admin_email_verification');
    return saved === null ? true : saved === 'true';
  });

  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(() => {
    const saved = localStorage.getItem('connectup_admin_logs');
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 7) {
          parsed = parsed.filter((_, idx) => idx !== 4 && idx !== 5 && idx !== 6);
          try {
            localStorage.setItem('connectup_admin_logs', JSON.stringify(parsed));
          } catch {}
        }
        return Array.isArray(parsed) ? parsed : [];
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('connectup_admin_email_verification', requireEmailVerification.toString());
  }, [requireEmailVerification]);

  useEffect(() => {
    localStorage.setItem('connectup_admin_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    if (userProfile) {
      setAdminProfileState({
        fullName: userProfile.name || userProfile.full_name || '',
        avatarUrl: userProfile.avatarUrl || userProfile.avatar_url || '',
        title: userProfile.title || 'System Administrator',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        email: userProfile.email || ''
      });
    }
  }, [userProfile]);

  const showToast = (
    msg: string, 
    type: 'success' | 'warning' | 'error' | 'info' = 'success', 
    title?: string,
    options?: { category?: 'SYSTEM' | 'SECURITY' | 'BILLING' | 'USER' | 'AUDIT'; actionLabel?: string; onAction?: () => void }
  ) => {
    let determinedCategory: 'SYSTEM' | 'SECURITY' | 'BILLING' | 'USER' | 'AUDIT' = options?.category || 'SYSTEM';
    let determinedType = type;
    const lower = msg.toLowerCase();
    
    if (lower.includes('fail') || lower.includes('error') || lower.includes('denied') || lower.includes('could not')) {
      determinedType = 'error';
    } else if (lower.includes('warn') || lower.includes('flag') || lower.includes('purge') || lower.includes('remove') || lower.includes('deleted')) {
      determinedType = 'warning';
    }

    if (lower.includes('user') || lower.includes('profile') || lower.includes('account')) {
      determinedCategory = 'USER';
    } else if (lower.includes('subscription') || lower.includes('pro') || lower.includes('revenue') || lower.includes('mrr') || lower.includes('payment')) {
      determinedCategory = 'BILLING';
    } else if (lower.includes('report') || lower.includes('security') || lower.includes('case') || lower.includes('audit')) {
      determinedCategory = 'SECURITY';
    }

    const defaultTitle = 
      determinedType === 'error' ? 'Execution Error' :
      determinedType === 'warning' ? 'System Notification' :
      determinedType === 'info' ? 'Console Notice' : 'Action Completed';

    const newToast: AdminToast = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title || defaultTitle,
      message: msg,
      type: determinedType,
      category: determinedCategory,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actionLabel: options?.actionLabel,
      onAction: options?.onAction
    };

    setActiveToast(newToast);
    setIsToastPaused(false);
  };

  useEffect(() => {
    if (!activeToast || isToastPaused) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [activeToast, isToastPaused]);

  const adminApiCall = async (path: string, options: RequestInit = {}) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || localStorage.getItem('connectup_admin_session_token') || localStorage.getItem('sb-token') || '';
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      };
      
      const response = await fetch(path, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err: any) {
      console.warn(`adminApiCall warning for ${path}:`, err);
      throw err;
    }
  };

  const fetchUsers = async (): Promise<AdminUser[]> => {
    try {
      let data: any[] | null = null;
      let apiSucceeded = false;
      
      try {
        const res = await adminApiCall('/api/admin/users');
        if (Array.isArray(res)) {
          data = res;
          apiSucceeded = true;
        }
      } catch (e) {
        console.warn("adminApiCall /api/admin/users failed, fallback to Supabase:", e);
      }

      if (!apiSucceeded) {
        const { data: dbProfiles, error: dbErr } = await supabase
          .from('profiles')
          .select('*');
        if (!dbErr && dbProfiles) {
          data = dbProfiles;
          apiSucceeded = true;
        }
      }

      if (data && Array.isArray(data)) {
        const mappedUsers: AdminUser[] = data.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.name || u.email?.split('@')[0] || 'User',
          email: u.email || '',
          role: (u.role || 'FOUNDER').toUpperCase() as any,
          plan: u.plan === 'pro' ? 'pro' : 'free',
          billingCycle: u.billing_cycle || null,
          status: 'active',
          avatarUrl: u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.full_name || u.email || 'User')}&backgroundColor=18181b,27272a&textColor=f4f4f5`,
          location: u.location || 'Remote',
          joinedDate: (u.created_at || u.updated_at) ? new Date(u.created_at || u.updated_at).toLocaleDateString() : 'Recently',
          lastActive: u.last_seen ? new Date(u.last_seen).toLocaleDateString() : 'Just now'
        }));
        setUsers(mappedUsers);
        return mappedUsers;
      }
    } catch (err) {
      console.error("fetchUsers error", err);
    }
    return [];
  };

  const fetchSubscriptions = async (usersList?: AdminUser[]) => {
    setIsFetchingSubscriptions(true);
    try {
      let data: any[] | null = null;
      try {
        data = await adminApiCall('/api/admin/subscriptions');
      } catch (e) {
        console.warn("adminApiCall /api/admin/subscriptions fallback:", e);
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        const { data: dbSubs } = await supabase
          .from('subscription_transactions')
          .select('*')
          .order('created_at', { ascending: false });
        if (dbSubs && dbSubs.length > 0) {
          data = dbSubs;
        }
      }

      let activeUsers = usersList && usersList.length > 0 ? usersList : users;

      // If activeUsers is still empty, load profiles directly as backup
      if (activeUsers.length === 0) {
        try {
          const { data: dbProfiles } = await supabase.from('profiles').select('*');
          if (dbProfiles && Array.isArray(dbProfiles)) {
            activeUsers = dbProfiles.map((u: any) => ({
              id: u.id,
              name: u.full_name || u.name || u.email?.split('@')[0] || 'User',
              email: u.email || '',
              role: (u.role || 'FOUNDER').toUpperCase() as any,
              plan: u.plan === 'pro' ? 'pro' : 'free',
              billingCycle: u.billing_cycle || null,
              status: 'active',
              joinedDate: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recently',
              lastActive: u.last_seen ? new Date(u.last_seen).toLocaleDateString() : 'Just now'
            }));
          }
        } catch (err) {
          console.warn("Could not load backup profiles for subscriptions:", err);
        }
      }

      let mappedSubs: AdminSubscription[] = [];

      if (data && Array.isArray(data) && data.length > 0) {
        mappedSubs = data.map((s: any) => {
          const matchingUser = activeUsers.find(u => u.id === s.user_id || u.id === s.userId);
          const userName = s.user_name || s.userName || matchingUser?.name || matchingUser?.email?.split('@')[0] || 'Subscriber';
          const userEmail = s.user_email || s.userEmail || matchingUser?.email || '';
          const userAvatar = s.user_avatar || matchingUser?.avatarUrl;
          const rawCycle = (s.billing_cycle || s.billingCycle || 'monthly').toLowerCase();
          const billingCycle = rawCycle === 'trial' ? 'trial' : rawCycle === 'yearly' ? 'yearly' : 'monthly';

          let formattedDate = 'Recently';
          if (s.created_at) {
            try {
              formattedDate = new Date(s.created_at).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            } catch {
              formattedDate = String(s.created_at);
            }
          } else if (s.createdAt) {
            formattedDate = s.createdAt;
          }

          return {
            id: s.id || `tx_${Math.random().toString(36).substring(2, 7)}`,
            reference: s.reference || s.id,
            userId: s.user_id || s.userId || matchingUser?.id || '',
            userName,
            userEmail,
            userAvatar,
            plan: 'pro',
            billingCycle: billingCycle as any,
            amount: Number(s.amount) || 0,
            currency: s.currency || 'USD',
            provider: s.provider || 'Paystack',
            status: (s.status || 'completed') as any,
            createdAt: formattedDate
          };
        });
      }

      // Augment with active Pro users who may not have a transaction row yet
      const proUsers = activeUsers.filter(u => u.plan === 'pro');
      proUsers.forEach((u, idx) => {
        const hasSub = mappedSubs.some(s => s.userId === u.id);
        if (!hasSub) {
          mappedSubs.push({
            id: `sub_pro_${u.id.substring(0, 8)}`,
            reference: `manual_${u.id.substring(0, 8)}`,
            userId: u.id,
            userName: u.name,
            userEmail: u.email,
            userAvatar: u.avatarUrl,
            plan: 'pro',
            billingCycle: (u.billingCycle || 'yearly') as any,
            amount: u.billingCycle === 'yearly' ? 29 : 5,
            currency: 'USD',
            provider: 'Paystack',
            status: 'completed',
            createdAt: u.joinedDate || 'Recently'
          });
        }
      });

      setSubscriptions(mappedSubs);
    } catch (err) {
      console.error("fetchSubscriptions error", err);
    } finally {
      setIsFetchingSubscriptions(false);
    }
  };

  const formatCurrency = (amount: number | string, currency: string = 'USD') => {
    const num = Number(amount) || 0;
    const curr = (currency || 'USD').toUpperCase();
    if (curr === 'NGN') {
      return `₦${num.toLocaleString(undefined, { minimumFractionDigits: num % 1 !== 0 ? 2 : 0 })}`;
    }
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchLogs = async () => {
    setIsFetchingLogs(true);
    try {
      let data: any[] | null = null;
      try {
        data = await adminApiCall('/api/admin/logs');
      } catch (e) {
        console.warn("adminApiCall /api/admin/logs fallback:", e);
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        const { data: dbLogs } = await supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false });
        if (dbLogs && dbLogs.length > 0) {
          data = dbLogs;
        }
      }

      if (data && Array.isArray(data) && data.length > 0) {
        let mappedLogs: AdminAuditLog[] = data.map((l: any) => ({
          id: l.id || `log_${Math.random().toString(36).substring(2, 7)}`,
          adminEmail: l.adminEmail || l.admin_email || 'admin@connectup.com',
          action: l.action || 'ADMIN_ACTION',
          details: l.details || '',
          timestamp: l.timestamp || l.created_at || new Date().toISOString()
        }));
        if (mappedLogs.length >= 7) {
          mappedLogs = mappedLogs.filter((_, idx) => idx !== 4 && idx !== 5 && idx !== 6);
        }
        setAuditLogs(mappedLogs);
        try {
          localStorage.setItem('connectup_admin_logs', JSON.stringify(mappedLogs));
        } catch {}
      } else {
        const saved = localStorage.getItem('connectup_admin_logs');
        if (saved) {
          try {
            let parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length >= 7) {
              parsed = parsed.filter((_: any, idx: number) => idx !== 4 && idx !== 5 && idx !== 6);
            }
            setAuditLogs(parsed);
          } catch {}
        }
      }
    } catch (err) {
      console.error("fetchLogs error", err);
    } finally {
      setIsFetchingLogs(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    setAuditLogs(prev => {
      const updated = prev.filter(l => l.id !== logId);
      try {
        localStorage.setItem('connectup_admin_logs', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await adminApiCall(`/api/admin/logs/${logId}`, { method: 'DELETE' });
      showToast("Audit log entry removed");
    } catch (e) {
      console.warn("Could not delete log on server:", e);
    }
  };

  const handleClearAllLogs = async () => {
    if (!confirm("Are you sure you want to clear all audit logs?")) return;
    setAuditLogs([]);
    try {
      localStorage.removeItem('connectup_admin_logs');
      await adminApiCall('/api/admin/logs', { method: 'DELETE' });
      showToast("All audit logs cleared");
    } catch (e) {
      console.warn("Could not clear logs on server:", e);
    }
  };

  const recordLog = async (action: string, details: string) => {
    const adminEmail = userProfile?.email || 'admin@connectup.com';
    const newLogItem: AdminAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      adminEmail,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    
    setAuditLogs(prev => [newLogItem, ...prev]);

    try {
      await adminApiCall('/api/admin/logs', {
        method: 'POST',
        body: JSON.stringify({ action, details, adminEmail })
      });
    } catch (e) {
      console.warn("Could not sync log to server:", e);
    }
  };

  const fetchReports = async () => {
    try {
      let data: any[] | null = null;
      try {
        data = await adminApiCall('/api/admin/reports');
      } catch (e) {
        console.warn("adminApiCall /api/admin/reports fallback:", e);
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        const { data: dbReports } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });
        if (dbReports && dbReports.length > 0) {
          data = dbReports;
        }
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const profileIds = Array.from(new Set([
          ...data.map((r: any) => r.reporter_id),
          ...data.map((r: any) => r.reported_profile_id)
        ]));

        let profilesMap = new Map();
        if (profileIds.length > 0) {
          try {
            const profiles = await adminApiCall('/api/admin/users');
            if (profiles && Array.isArray(profiles)) {
              profiles.forEach((p: any) => profilesMap.set(p.id, p));
            }
          } catch (e) {
            const { data: dbProfs } = await supabase.from('profiles').select('*').in('id', profileIds);
            if (dbProfs) dbProfs.forEach((p: any) => profilesMap.set(p.id, p));
          }
        }

        const mappedReports: AdminReport[] = data.map((r: any) => {
          const reporter = profilesMap.get(r.reporter_id);
          const reported = profilesMap.get(r.reported_profile_id);
          
          let targetContent = r.target_content;
          let videoUrl = null;
          let reason = r.reason || 'other';
          
          if (reason.includes('[VIDEO:')) {
            const match = reason.match(/\[VIDEO:(.*?)\]/);
            if (match && match[1]) {
              videoUrl = match[1];
              reason = reason.replace(/\[VIDEO:.*?\]/, '').trim();
            }
          }

          if (targetContent && (targetContent.startsWith('{') || targetContent.startsWith('['))) {
            try {
              const parsed = JSON.parse(targetContent);
              targetContent = parsed.text || parsed.content || targetContent;
              if (!videoUrl) videoUrl = parsed.videoUrl || null;
            } catch (e) {}
          }

          if (!targetContent) {
            if (r.reported_profile_id) {
              targetContent = `Reported Account: ${reported?.full_name || reported?.email || 'Target User'}`;
            } else {
              targetContent = `Infraction reason: ${reason}`;
            }
          }

          return {
            id: r.id,
            reporterName: reporter?.full_name || reporter?.email?.split('@')[0] || 'Reporter',
            reporterEmail: reporter?.email || '',
            targetType: (r.target_type || 'user') as any,
            targetId: r.target_id || r.reported_profile_id || '',
            targetContent: targetContent,
            videoUrl: videoUrl,
            reason: reason as any,
            severity: (r.severity || 'medium') as any,
            status: (r.status || 'pending') as any,
            createdAt: r.created_at || new Date().toISOString()
          };
        });
        setReports(mappedReports);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error("fetchReports error", err);
    }
  };

  const fetchDashboardCounts = async () => {
    try {
      let counts: any = null;
      try {
        counts = await adminApiCall('/api/admin/counts');
      } catch (e) {
        console.warn("adminApiCall /api/admin/counts fallback:", e);
      }

      if (counts && typeof counts.startups === 'number') {
        setStartupsCount(counts.startups ?? 0);
        setSwipesCount(counts.swipes ?? 0);
        setPostsCount(counts.posts ?? 0);
        setPitchesCount(counts.pitches ?? 0);
      } else {
        const [startupsRes, swipesRes, postsRes, pitchesRes] = await Promise.all([
          supabase.from('startups').select('id', { count: 'exact', head: true }),
          supabase.from('swipes').select('id', { count: 'exact', head: true }),
          supabase.from('community_posts').select('id', { count: 'exact', head: true }),
          supabase.from('pitches').select('id', { count: 'exact', head: true })
        ]);
        setStartupsCount(startupsRes.count ?? 0);
        setSwipesCount(swipesRes.count ?? 0);
        setPostsCount(postsRes.count ?? 0);
        setPitchesCount(pitchesRes.count ?? 0);
      }
    } catch (err) {
      setStartupsCount(0);
      setSwipesCount(0);
      setPostsCount(0);
      setPitchesCount(0);
    }
  };

  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      const fetchedUsers = await fetchUsers();
      await Promise.all([
        fetchSubscriptions(fetchedUsers),
        fetchReports(),
        fetchDashboardCounts(),
        fetchLogs()
      ]);
      showToast("Console telemetry refreshed");
    } catch (e) {
      showToast("Error updating console telemetry");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const fetchedUsers = await fetchUsers();
        await Promise.all([
          fetchSubscriptions(fetchedUsers),
          fetchReports(),
          fetchDashboardCounts(),
          fetchLogs()
        ]);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    }
  }, [activeTab]);

  const handleViewProfile = async (u: AdminUser) => {
    setSelectedUserProfile(u);
    setSelectedUserStartup(null);
    setSelectedUserPitches([]);
    setSelectedUserTransactions([]);
    setIsFetchingProfileDetails(true);
    
    try {
      let transData: any[] = [];
      try {
        const res = await adminApiCall(`/api/admin/subscriptions?userId=${u.id}`);
        if (Array.isArray(res)) transData = res;
      } catch (e) {
        console.warn("Could not fetch user subscriptions from API:", e);
      }

      if (transData.length === 0) {
        // Fallback to local subscriptions state
        const localMatches = subscriptions.filter(s => s.userId === u.id).map(s => ({
          id: s.id,
          amount: s.amount,
          billing_cycle: s.billingCycle,
          status: s.status,
          created_at: s.createdAt
        }));
        transData = localMatches;
      }

      setSelectedUserTransactions(transData);

      if (u.role === 'FOUNDER') {
        const { data: startupData } = await supabase
          .from('startups')
          .select('*')
          .eq('id', u.id)
          .maybeSingle();
        
        if (startupData) {
          setSelectedUserStartup(startupData);
        }

        const { data: pitchesData } = await supabase
          .from('pitches')
          .select('*')
          .eq('user_id', u.id);
        
        if (pitchesData) {
          setSelectedUserPitches(pitchesData);
        }
      }
    } catch (err) {
      console.error("Error fetching dossier:", err);
    } finally {
      setIsFetchingProfileDetails(false);
    }
  };

  // Metrics computations
  const foundersCount = useMemo(() => users.filter(u => u.role === 'FOUNDER').length, [users]);
  const investorsCount = useMemo(() => users.filter(u => u.role === 'INVESTOR').length, [users]);
  const adminsCount = useMemo(() => users.filter(u => u.role === 'ADMIN').length, [users]);
  const proSubscribersCount = useMemo(() => users.filter(u => u.plan === 'pro').length, [users]);

  const subMetrics = useMemo(() => {
    let mrr = 0;
    let totalRevenue = 0;
    subscriptions.forEach(s => {
      const status = s.status || 'completed';
      if (status !== 'refunded' && status !== 'cancelled') {
        totalRevenue += s.amount;
        if (s.billingCycle === 'monthly') {
          mrr += s.amount;
        } else if (s.billingCycle === 'yearly') {
          mrr += s.amount / 12;
        } else {
          mrr += s.amount;
        }
      }
    });
    return {
      mrr: Math.round(mrr),
      arr: Math.round(mrr * 12),
      totalRevenue: Math.round(totalRevenue),
      activeSubsCount: proSubscribersCount,
      totalTransactionsCount: subscriptions.length
    };
  }, [subscriptions, proSubscribersCount]);

  const activityStats = useMemo(() => {
    const series: Record<string, { date: string, growth: number, volume: number, activity: number }> = {};
    
    users.forEach(u => {
      if (u.joinedDate) {
        const dateStr = u.joinedDate.includes('/') ? u.joinedDate : new Date(u.joinedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (!series[dateStr]) series[dateStr] = { date: dateStr, growth: 0, volume: 0, activity: 0 };
        series[dateStr].growth += 1;
        series[dateStr].activity += 2;
      }
    });

    subscriptions.forEach(s => {
      if (s.createdAt) {
        const dateStr = s.createdAt.includes('/') ? s.createdAt : new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (!series[dateStr]) series[dateStr] = { date: dateStr, growth: 0, volume: 0, activity: 0 };
        series[dateStr].volume += s.amount;
        series[dateStr].activity += 3;
      }
    });

    const values = Object.values(series);
    if (values.length === 0) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        const isToday = i === 0;
        last7Days.push({
          date: dayName,
          growth: isToday ? users.length : 0,
          volume: isToday ? subMetrics.totalRevenue : 0,
          activity: isToday ? (users.length + subscriptions.length) : 0
        });
      }
      return last7Days;
    }
    return values.slice(-10);
  }, [users, subscriptions, subMetrics]);

  const locationStats = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      const loc = u.location && u.location !== 'Remote' ? u.location : 'Global / Remote';
      counts[loc] = (counts[loc] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / (users.length || 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [users]);

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !userSearch || 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesPlan = planFilter === 'all' || u.plan === planFilter;
      return matchesSearch && matchesRole && matchesPlan;
    });
  }, [users, userSearch, roleFilter, planFilter]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(s => {
      const status = (s.status || 'completed').toLowerCase();
      const matchesFilter = subscriptionFilter === 'all' 
        || (subscriptionFilter === 'completed' && status === 'completed')
        || (subscriptionFilter === 'refunded' && status === 'refunded')
        || (subscriptionFilter === 'trial' && s.billingCycle === 'trial')
        || (subscriptionFilter === 'cancelled' && status === 'cancelled');
      const q = subscriptionSearch.trim().toLowerCase();
      const matchesSearch = !q || 
        (s.userName || '').toLowerCase().includes(q) || 
        (s.userEmail || '').toLowerCase().includes(q) || 
        (s.id || '').toLowerCase().includes(q) ||
        (s.reference || '').toLowerCase().includes(q) ||
        (s.billingCycle || '').toLowerCase().includes(q) ||
        (s.currency || '').toLowerCase().includes(q) ||
        (s.provider || '').toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [subscriptions, subscriptionFilter, subscriptionSearch]);

  const dashboardTransactions = useMemo(() => {
    return subscriptions.filter(s => {
      const status = (s.status || 'completed').toLowerCase();
      const matchesFilter = dashboardTxFilter === 'all' 
        || (dashboardTxFilter === 'completed' && status === 'completed')
        || (dashboardTxFilter === 'refunded' && status === 'refunded')
        || (dashboardTxFilter === 'trial' && s.billingCycle === 'trial');
      const q = dashboardTxSearch.trim().toLowerCase();
      const matchesSearch = !q || 
        (s.userName || '').toLowerCase().includes(q) || 
        (s.userEmail || '').toLowerCase().includes(q) || 
        (s.id || '').toLowerCase().includes(q) ||
        (s.reference || '').toLowerCase().includes(q) ||
        (s.billingCycle || '').toLowerCase().includes(q) ||
        (s.currency || '').toLowerCase().includes(q) ||
        (s.provider || '').toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [subscriptions, dashboardTxFilter, dashboardTxSearch]);

  const displayedDashboardTx = useMemo(() => {
    if (dashboardTxLimit === 0) return dashboardTransactions;
    return dashboardTransactions.slice(0, dashboardTxLimit);
  }, [dashboardTransactions, dashboardTxLimit]);

  const handleCopyText = (text: string, label: string = 'ID') => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedTxId(text);
      setTimeout(() => setCopiedTxId(null), 2000);
      showToast(`Copied ${label} to clipboard`, 'info');
    }
  };

  const exportTransactionsCSV = (dataToExport: AdminSubscription[], filenamePrefix = 'connectup_transactions') => {
    if (!dataToExport || dataToExport.length === 0) {
      showToast("No transaction records available to export", "info");
      return;
    }
    const headers = [
      'Transaction ID',
      'Customer Name',
      'Customer Email',
      'User ID',
      'Plan Tier',
      'Billing Cycle',
      'Amount (USD)',
      'Currency',
      'Provider',
      'Status',
      'Date Created'
    ];
    const rows = dataToExport.map(s => [
      `"${s.id}"`,
      `"${(s.userName || '').replace(/"/g, '""')}"`,
      `"${(s.userEmail || '').replace(/"/g, '""')}"`,
      `"${s.userId || ''}"`,
      `"${s.plan || 'pro'}"`,
      `"${s.billingCycle || 'monthly'}"`,
      `"${(Number(s.amount) || 0).toFixed(2)}"`,
      `"${s.currency || 'USD'}"`,
      `"${s.provider || 'Paystack'}"`,
      `"${s.status || 'completed'}"`,
      `"${s.createdAt || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${dataToExport.length} transactions as CSV`);
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = !reportSearch || 
        r.targetContent.toLowerCase().includes(reportSearch.toLowerCase()) || 
        r.reporterName.toLowerCase().includes(reportSearch.toLowerCase());
      const matchesSeverity = reportSeverityFilter === 'all' || (r.severity || '').toLowerCase() === reportSeverityFilter.toLowerCase();
      const matchesStatus = reportStatusFilter === 'all' || (r.status || 'pending').toLowerCase() === reportStatusFilter.toLowerCase();
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [reports, reportSearch, reportSeverityFilter, reportStatusFilter]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = !auditLogSearch || 
        log.details.toLowerCase().includes(auditLogSearch.toLowerCase()) ||
        log.adminEmail.toLowerCase().includes(auditLogSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(auditLogSearch.toLowerCase());
      const matchesType = auditLogTypeFilter === 'all' || log.action === auditLogTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [auditLogs, auditLogSearch, auditLogTypeFilter]);

  const liveAdminNotifications = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      message: string;
      category: 'security' | 'billing' | 'system';
      time: string;
      severity: 'high' | 'medium' | 'info';
      actionTab?: 'dashboards' | 'users' | 'subscriptions' | 'reports' | 'logs' | 'settings';
      actionLabel?: string;
    }> = [];

    // 1. Pending moderation reports
    const pendingReports = reports.filter(r => r.status === 'pending');
    if (pendingReports.length > 0) {
      list.push({
        id: 'notif_reports',
        title: `${pendingReports.length} New ${pendingReports.length === 1 ? 'Report' : 'Reports'}`,
        message: `${pendingReports[0].reporterName} reported content for ${pendingReports[0].reason}.`,
        category: 'security',
        time: 'Needs review',
        severity: 'high',
        actionTab: 'reports',
        actionLabel: 'View Reports'
      });
    }

    // 2. Pro subscription events
    if (proSubscribersCount > 0) {
      list.push({
        id: 'notif_subs',
        title: `Pro Subscriptions (${proSubscribersCount})`,
        message: `Current MRR is $${subMetrics.mrr.toLocaleString()} across active pro users.`,
        category: 'billing',
        time: 'Active',
        severity: 'info',
        actionTab: 'subscriptions',
        actionLabel: 'View Billing'
      });
    }

    // 3. Security Audit Chronicle Event
    if (auditLogs.length > 0) {
      const latest = auditLogs[0];
      list.push({
        id: `notif_audit_${latest.id}`,
        title: `Log: ${latest.action}`,
        message: latest.details,
        category: 'security',
        time: new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: latest.action.includes('DELETION') || latest.action.includes('PURGE') ? 'high' : 'info',
        actionTab: 'logs',
        actionLabel: 'View Logs'
      });
    }

    // 4. System Governance Alert
    list.push({
      id: 'notif_security_policy',
      title: requireEmailVerification ? 'Email verification is on' : 'Email verification is off',
      message: requireEmailVerification 
        ? 'New users must confirm their email before signing in.'
        : 'New users can sign in without email confirmation.',
      category: 'system',
      time: 'Status',
      severity: requireEmailVerification ? 'info' : 'medium',
      actionTab: 'settings',
      actionLabel: 'Settings'
    });

    return list;
  }, [reports, proSubscribersCount, subMetrics.mrr, auditLogs, requireEmailVerification]);

  const filteredNotifications = useMemo(() => {
    if (notificationsFilter === 'all') return liveAdminNotifications;
    return liveAdminNotifications.filter(n => n.category === notificationsFilter);
  }, [liveAdminNotifications, notificationsFilter]);

  const unreadCount = useMemo(() => {
    return liveAdminNotifications.filter(n => !readNotificationIds.includes(n.id)).length;
  }, [liveAdminNotifications, readNotificationIds]);

  const markAllNotificationsAsRead = () => {
    setReadNotificationIds(liveAdminNotifications.map(n => n.id));
    showToast('All notifications marked as read', 'info', 'Notifications');
  };

  const markNotificationAsRead = (id: string) => {
    if (!readNotificationIds.includes(id)) {
      setReadNotificationIds(prev => [...prev, id]);
    }
  };

  return (
    <div className="h-screen w-full bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300 overflow-hidden">
      
      {/* SaaS-Grade Floating Toast Notification */}
      <AnimatePresence>
        {activeToast && (
          <motion.div 
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            onMouseEnter={() => setIsToastPaused(true)}
            onMouseLeave={() => setIsToastPaused(false)}
            className="fixed top-5 right-5 z-[9999] w-[390px] max-w-[calc(100vw-2.5rem)] rounded-2xl bg-white/95 dark:bg-[#121216]/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden pointer-events-auto select-none"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Status Indicator Icon Pill */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  activeToast.type === 'error'
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    : activeToast.type === 'warning'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : activeToast.type === 'info'
                    ? 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}>
                  {activeToast.type === 'error' ? (
                    <AlertCircle size={16} />
                  ) : activeToast.type === 'warning' ? (
                    <AlertTriangle size={16} />
                  ) : activeToast.type === 'info' ? (
                    <Info size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-mono uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                        activeToast.category === 'SECURITY'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : activeToast.category === 'BILLING'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : activeToast.category === 'USER'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {activeToast.category}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {activeToast.timestamp}
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveToast(null)}
                      className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Dismiss notification"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-zinc-950 dark:text-white leading-tight">
                    {activeToast.title}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug mt-0.5 break-words">
                    {activeToast.message}
                  </p>

                  {activeToast.actionLabel && activeToast.onAction && (
                    <button
                      onClick={() => {
                        activeToast.onAction!();
                        setActiveToast(null);
                      }}
                      className="mt-2.5 text-[11px] font-bold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{activeToast.actionLabel}</span>
                      <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Linear Progress Timer Bar */}
            <motion.div 
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4.5, ease: "linear" }}
              style={{ originX: 0 }}
              className={`h-0.5 w-full ${
                activeToast.type === 'error'
                  ? 'bg-rose-500'
                  : activeToast.type === 'warning'
                  ? 'bg-amber-500'
                  : activeToast.type === 'info'
                  ? 'bg-sky-500'
                  : 'bg-emerald-500'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        
        {/* EXECUTIVE ENTERPRISE SIDEBAR */}
        <aside className="w-64 bg-white border-r border-zinc-200 hidden md:flex flex-col justify-between shrink-0 select-none">
          
          <div className="flex flex-col">
            {/* Workspace Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 select-none">
                  <span className="font-display font-black text-xl tracking-tight text-zinc-900 dark:text-white blur-[3px]">
                    Connect<span className="text-brand-primary">Up.</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ADMIN</span>
                </div>
              </div>
            </div>

            {/* Navigation Groups */}
            <div className="p-3 space-y-6">
              <div>
                <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Management
                </div>
                <nav className="space-y-1">
                  {[
                    { id: 'dashboards', label: 'Overview', icon: LayoutGrid, count: null },
                    { id: 'users', label: 'Users', icon: Users, count: users.length },
                    { id: 'subscriptions', label: 'Transaction History', icon: Receipt, count: subscriptions.length },
                    { id: 'reports', label: 'Reports', icon: ShieldAlert, count: reports.filter(r => r.status === 'pending').length }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-[#FACC15] text-zinc-950 font-bold shadow-xs' 
                            : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={16} className={isActive ? 'text-zinc-950' : 'text-zinc-400'} />
                          <span>{tab.label}</span>
                        </div>
                        {tab.count !== null && tab.count > 0 && (
                          <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                            isActive
                              ? 'bg-zinc-950 text-white font-bold'
                              : 'text-zinc-500 bg-zinc-100'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div>
                <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  System
                </div>
                <nav className="space-y-1">
                  {[
                    { id: 'logs', label: 'Audit Logs', icon: Clock },
                    { id: 'settings', label: 'Settings', icon: Settings }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-[#FACC15] text-zinc-950 font-bold shadow-xs' 
                            : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-zinc-950' : 'text-zinc-400'} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Sidebar Footer with Admin Profile & Return to App */}
          <div className="p-3 border-t border-zinc-150 dark:border-zinc-800/60 space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <img 
                  src={adminProfileState.avatarUrl || userProfile?.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=Admin"} 
                  alt="Admin" 
                  className="w-8 h-8 rounded-lg object-cover bg-zinc-200 dark:bg-zinc-800"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                    {adminProfileState.fullName || userProfile?.name || 'Admin'}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate font-mono">
                    {adminProfileState.email || userProfile?.email || 'admin@connectup.com'}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateHome && onNavigateHome()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>Back to App</span>
            </button>
          </div>
        </aside>

        {/* MAIN CANVASES */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          {/* SAAS TOP BAR CONTRACT */}
          <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 w-full max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            
            {/* Zone 1: Contextual Breadcrumb */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 font-medium">Admin</span>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="text-zinc-950 dark:text-zinc-100 font-semibold capitalize">
                {activeTab === 'dashboards' ? 'Overview' : activeTab === 'subscriptions' ? 'Transaction History' : activeTab === 'users' ? 'Users' : activeTab === 'reports' ? 'Reports' : activeTab === 'logs' ? 'Audit Logs' : activeTab}
              </span>
            </div>

            {/* Zone 2: Search with hotkey decoration */}
            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    if (activeTab !== 'users' && e.target.value) setActiveTab('users');
                  }}
                  className="w-full h-8 pl-8 pr-12 text-xs bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none transition-all"
                />
                <span className="absolute right-2 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800 rounded pointer-events-none">
                  ⌘K
                </span>
              </div>
            </div>

            {/* Zone 3: Primary Actions & Notification Center */}
            <div className="flex items-center gap-2.5 relative">
              <button
                onClick={refreshAllData}
                disabled={isRefreshing}
                title="Refresh data"
                className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              </button>

              {/* SaaS Notification Center Bell */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(prev => !prev)}
                  title="Notifications"
                  className={`relative w-8 h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                    isNotificationsOpen 
                      ? 'border-amber-400 bg-amber-400/15 text-amber-500 shadow-xs' 
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  <Bell size={14} className={unreadCount > 0 ? 'text-zinc-900 dark:text-zinc-100' : ''} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-zinc-950 shadow-xs ring-2 ring-white dark:ring-zinc-950">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* SaaS Notification Popover Dropdown */}
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <>
                      {/* Invisible backdrop click-catcher */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsNotificationsOpen(false)} 
                      />

                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        className="absolute right-0 top-10 mt-2 z-50 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden font-sans"
                      >
                        {/* Header */}
                        <div className="p-3.5 border-b border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BellRing size={14} className="text-amber-500" />
                            <span className="text-xs font-bold text-zinc-950 dark:text-white">Notifications</span>
                            {unreadCount > 0 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full">
                                {unreadCount} new
                              </span>
                            )}
                          </div>

                          {unreadCount > 0 && (
                            <button
                              onClick={markAllNotificationsAsRead}
                              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>

                        {/* Filter pills */}
                        <div className="px-3 pt-2.5 pb-2 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800/40 text-[11px]">
                          {(['all', 'security', 'billing'] as const).map(tab => (
                            <button
                              key={tab}
                              onClick={() => setNotificationsFilter(tab)}
                              className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-colors cursor-pointer ${
                                notificationsFilter === tab
                                  ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold'
                                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                              }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 no-scrollbar">
                          {filteredNotifications.map(n => {
                            const isUnread = !readNotificationIds.includes(n.id);
                            return (
                              <div
                                key={n.id}
                                onClick={() => markNotificationAsRead(n.id)}
                                className={`p-3.5 flex items-start gap-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer ${
                                  isUnread ? 'bg-amber-500/[0.03]' : ''
                                }`}
                              >
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs mt-0.5 ${
                                  n.category === 'security'
                                    ? 'bg-rose-500/10 text-rose-500'
                                    : n.category === 'billing'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {n.category === 'security' ? <ShieldAlert size={14} /> : n.category === 'billing' ? <CreditCard size={14} /> : <Activity size={14} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <h5 className={`text-xs leading-snug truncate ${isUnread ? 'font-bold text-zinc-950 dark:text-white' : 'font-medium text-zinc-700 dark:text-zinc-300'}`}>
                                      {n.title}
                                    </h5>
                                    {isUnread && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                    )}
                                  </div>

                                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                    {n.message}
                                  </p>

                                  <div className="flex items-center justify-between mt-2 pt-1">
                                    <span className="text-[10px] font-mono text-zinc-400">
                                      {n.time}
                                    </span>

                                    {n.actionTab && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markNotificationAsRead(n.id);
                                          setActiveTab(n.actionTab!);
                                          setIsNotificationsOpen(false);
                                        }}
                                        className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <span>{n.actionLabel || 'View'}</span>
                                        <ChevronRight size={10} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {filteredNotifications.length === 0 && (
                            <div className="p-8 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-2">
                              <ShieldCheck size={24} className="text-zinc-300 dark:text-zinc-700" />
                              <p className="font-medium">No notifications</p>
                              <span className="text-[10px]">Everything is working normally.</span>
                            </div>
                          )}
                        </div>

                        {/* Footer Quick Action */}
                        <div className="p-2.5 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-center">
                          <button
                            onClick={() => {
                              setActiveTab('logs');
                              setIsNotificationsOpen(false);
                            }}
                            className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            View audit logs →
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="h-8 px-3.5 rounded-lg bg-[#FACC15] hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span className="hidden sm:inline">Add User</span>
              </button>
            </div>
          </header>

          {/* MOBILE TABS NAVIGATION BAR (md:hidden) */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2.5 bg-white border-b border-zinc-200 shrink-0 no-scrollbar select-none">
            {[
              { id: 'dashboards', label: 'Overview', icon: LayoutGrid, count: null },
              { id: 'users', label: 'Users', icon: Users, count: users.length },
              { id: 'subscriptions', label: 'Transactions', icon: Receipt, count: subscriptions.length },
              { id: 'reports', label: 'Safety', icon: ShieldAlert, count: reports.filter(r => r.status === 'pending').length },
              { id: 'logs', label: 'Audit', icon: Clock, count: null },
              { id: 'settings', label: 'Settings', icon: Settings, count: null },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#FACC15] text-zinc-950 font-bold shadow-xs'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`text-[10px] font-mono px-1 rounded ${
                      isActive ? 'bg-zinc-950 text-white font-bold' : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                title="Exit Admin"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 whitespace-nowrap cursor-pointer ml-auto shrink-0"
              >
                <LogOut size={13} />
                <span>Exit</span>
              </button>
            )}
          </div>

          {/* TAB CONTENT VIEWPORT */}
          <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
            
            {/* TAB 1: OVERVIEW & BENTO METRICS */}
            {activeTab === 'dashboards' && (
              <div className="space-y-6">
                
                {/* Executive KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Metric 1: Total Users */}
                  <div className="p-5 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                      <span>Total Users</span>
                      <Users size={15} className="text-zinc-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-zinc-950 dark:text-white">
                      {users.length}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono tabular-nums">+14%</span>
                      <span>vs last month</span>
                    </div>
                  </div>

                  {/* Metric 2: MRR */}
                  <div className="p-5 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                      <span>Monthly Revenue (MRR)</span>
                      <CreditCard size={15} className="text-zinc-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-zinc-950 dark:text-white">
                      ${subMetrics.mrr.toLocaleString()}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <span className="font-mono tabular-nums text-zinc-700 dark:text-zinc-300 font-medium">ARR ~${subMetrics.arr.toLocaleString()}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-semibold">{proSubscribersCount} Pro</span>
                    </div>
                  </div>

                  {/* Metric 3: Deal Engine Velocity */}
                  <div className="p-5 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                      <span>Total Swipes</span>
                      <TrendingUp size={15} className="text-zinc-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-zinc-950 dark:text-white">
                      {swipesCount}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <span className="font-mono tabular-nums text-zinc-700 dark:text-zinc-300 font-medium">{startupsCount} Startups</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{pitchesCount} Pitches</span>
                    </div>
                  </div>

                  {/* Metric 4: Moderation Health */}
                  <div className="p-5 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                      <span>Pending Reports</span>
                      <ShieldCheck size={15} className="text-zinc-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-zinc-950 dark:text-white">
                      {reports.filter(r => r.status === 'pending').length === 0 ? 'All clear' : `${reports.filter(r => r.status === 'pending').length} Pending`}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{reports.length} total reports</span>
                    </div>
                  </div>

                </div>

                {/* Primary Activity Chart & Location Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Chart View (2 cols) */}
                  <div className="p-6 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs lg:col-span-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-zinc-950 dark:text-white">Platform Activity</h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">New users and actions over time</p>
                      </div>
                      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
                        <button
                          onClick={() => setChartType('area')}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                            chartType === 'area'
                              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs'
                              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                        >
                          Area
                        </button>
                        <button
                          onClick={() => setChartType('bar')}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                            chartType === 'bar'
                              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs'
                              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                        >
                          Bar
                        </button>
                      </div>
                    </div>

                    <div className="h-64 w-full min-w-0 mt-4">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        {chartType === 'area' ? (
                          <AreaChart data={activityStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#EAB308" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} dx={-5} />
                            <Tooltip
                              contentStyle={{ 
                                backgroundColor: '#18181b', 
                                border: '1px solid #27272a',
                                borderRadius: '8px',
                                color: '#fafafa',
                                fontSize: '11px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                              }}
                            />
                            <Area type="monotone" dataKey="activity" stroke="#EAB308" strokeWidth={2} fillOpacity={1} fill="url(#activityGrad)" />
                          </AreaChart>
                        ) : (
                          <BarChart data={activityStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} dx={-5} />
                            <Tooltip
                              contentStyle={{ 
                                backgroundColor: '#18181b', 
                                border: '1px solid #27272a',
                                borderRadius: '8px',
                                color: '#fafafa',
                                fontSize: '11px'
                              }}
                            />
                            <Bar dataKey="growth" fill="#EAB308" radius={[4, 4, 0, 0]} name="New Users" />
                            <Bar dataKey="activity" fill="#71717a" radius={[4, 4, 0, 0]} name="Actions" />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>

                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-zinc-150 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span>Actions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                        <span>New Users</span>
                      </div>
                    </div>
                  </div>

                  {/* Demographic & Geographic Breakdown */}
                  <div className="p-6 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs flex flex-col justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-zinc-950 dark:text-white">User Breakdown</h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Distribution of founders, investors, and admins</p>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1 font-medium">
                            <span className="text-zinc-600 dark:text-zinc-400">Founders</span>
                            <span className="font-mono tabular-nums font-semibold text-zinc-950 dark:text-white">
                              {foundersCount} ({Math.round((foundersCount / (users.length || 1)) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div 
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${Math.round((foundersCount / (users.length || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1 font-medium">
                            <span className="text-zinc-600 dark:text-zinc-400">Investors & VCs</span>
                            <span className="font-mono tabular-nums font-semibold text-zinc-950 dark:text-white">
                              {investorsCount} ({Math.round((investorsCount / (users.length || 1)) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.round((investorsCount / (users.length || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1 font-medium">
                            <span className="text-zinc-600 dark:text-zinc-400">Admins</span>
                            <span className="font-mono tabular-nums font-semibold text-zinc-950 dark:text-white">
                              {adminsCount} ({Math.round((adminsCount / (users.length || 1)) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div 
                              className="h-full bg-zinc-400 rounded-full"
                              style={{ width: `${Math.round((adminsCount / (users.length || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-150 dark:border-zinc-800/60">
                      <div className="text-[11px] font-mono uppercase text-zinc-400 mb-3">Top Locations</div>
                      <div className="space-y-2">
                        {locationStats.map((loc, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]">{loc.name}</span>
                            <span className="font-mono tabular-nums text-zinc-950 dark:text-white font-medium">{loc.count} users</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>

                {/* EXECUTIVE TRANSACTION HISTORY & REVENUE LEDGER */}
                <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs overflow-hidden">
                  
                  {/* Card Header & Controls */}
                  <div className="p-5 border-b border-zinc-150 dark:border-zinc-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
                        <Receipt size={17} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-zinc-950 dark:text-white">Transaction History</h2>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {subscriptions.length} {subscriptions.length === 1 ? 'record' : 'records'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Recent customer settlements, subscription charges, and pro membership receipts</p>
                      </div>
                    </div>

                    {/* Filter and Action Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Search Input */}
                      <div className="relative min-w-[200px] sm:w-60">
                        <Search size={13} className="absolute left-3 top-2.5 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Search transactions..."
                          value={dashboardTxSearch}
                          onChange={(e) => setDashboardTxSearch(e.target.value)}
                          className="w-full h-8 pl-8 pr-3 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>

                      {/* Status Tabs */}
                      <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg">
                        {(['all', 'completed', 'refunded', 'trial'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setDashboardTxFilter(tab)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize ${
                              dashboardTxFilter === tab
                                ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs font-semibold'
                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                          >
                            {tab === 'trial' ? 'Trials' : tab}
                          </button>
                        ))}
                      </div>

                      {/* Export CSV Button */}
                      <button
                        onClick={() => exportTransactionsCSV(dashboardTransactions, 'dashboard_transactions')}
                        title="Download transactions CSV"
                        className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download size={13} />
                        <span className="hidden sm:inline">Export CSV</span>
                      </button>

                      {/* Grant Pro Access Trigger */}
                      <button
                        onClick={() => setIsGrantSubModalOpen(true)}
                        title="Grant Pro membership manually"
                        className="h-8 px-2.5 rounded-lg bg-[#FACC15] hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Grant Pro</span>
                      </button>

                      {/* View In Billing Tab Shortcut */}
                      <button
                        onClick={() => setActiveTab('subscriptions')}
                        className="h-8 px-2.5 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold flex items-center gap-1 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      >
                        <span>Full Ledger</span>
                        <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Financial Settlement Ticker */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs">
                    <div className="p-3.5 border-r border-zinc-150 dark:border-zinc-800/60">
                      <span className="text-[10px] text-zinc-400 font-mono uppercase block">Total Settled</span>
                      <span className="text-base font-bold font-mono tabular-nums text-zinc-950 dark:text-white">
                        {formatCurrency(subMetrics.totalRevenue, 'USD')}
                      </span>
                    </div>
                    <div className="p-3.5 border-r border-zinc-150 dark:border-zinc-800/60">
                      <span className="text-[10px] text-zinc-400 font-mono uppercase block">Monthly Recurring (MRR)</span>
                      <span className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(subMetrics.mrr, 'USD')}
                      </span>
                    </div>
                    <div className="p-3.5 border-r border-zinc-150 dark:border-zinc-800/60">
                      <span className="text-[10px] text-zinc-400 font-mono uppercase block">Total Transactions</span>
                      <span className="text-base font-bold font-mono tabular-nums text-zinc-950 dark:text-white">
                        {subscriptions.length}
                      </span>
                    </div>
                    <div className="p-3.5">
                      <span className="text-[10px] text-zinc-400 font-mono uppercase block">Active Pro Members</span>
                      <span className="text-base font-bold font-mono tabular-nums text-amber-500">
                        {proSubscribersCount}
                      </span>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-50/30 dark:bg-zinc-900/20">
                          <th className="py-3 px-4 font-medium">Tx Reference</th>
                          <th className="py-3 px-4 font-medium">Customer</th>
                          <th className="py-3 px-4 font-medium">Plan & Interval</th>
                          <th className="py-3 px-4 font-medium">Amount</th>
                          <th className="py-3 px-4 font-medium">Gateway</th>
                          <th className="py-3 px-4 font-medium">Status</th>
                          <th className="py-3 px-4 font-medium">Settled At</th>
                          <th className="py-3 px-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                        {displayedDashboardTx.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-zinc-400 font-medium">
                              {isFetchingSubscriptions ? (
                                <div className="flex items-center justify-center gap-2">
                                  <RefreshCw size={14} className="animate-spin text-amber-500" />
                                  <span>Loading transaction history...</span>
                                </div>
                              ) : (
                                <div className="space-y-1.5 py-4">
                                  <Receipt size={24} className="mx-auto text-zinc-300 dark:text-zinc-700" />
                                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No transaction records found</p>
                                  <p className="text-[11px] text-zinc-400">Transactions and memberships will show up here automatically.</p>
                                </div>
                              )}
                            </td>
                          </tr>
                        ) : (
                          displayedDashboardTx.map((s) => (
                            <tr key={s.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                                  <span>{s.id.length > 14 ? `${s.id.substring(0, 12)}...` : s.id}</span>
                                  <button
                                    onClick={() => handleCopyText(s.id, 'Transaction ID')}
                                    title="Copy Transaction ID"
                                    className="p-1 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                                  >
                                    {copiedTxId === s.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div 
                                  onClick={() => {
                                    const u = users.find(user => user.id === s.userId);
                                    if (u) {
                                      handleViewProfile(u);
                                    } else {
                                      handleViewProfile({
                                        id: s.userId,
                                        name: s.userName,
                                        email: s.userEmail,
                                        role: 'FOUNDER',
                                        plan: s.plan,
                                        billingCycle: s.billingCycle,
                                        status: 'active',
                                        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.userName)}`,
                                        location: 'Remote',
                                        joinedDate: s.createdAt,
                                        lastActive: 'Recently'
                                      });
                                    }
                                  }}
                                  className="flex items-center gap-2.5 cursor-pointer group"
                                  title="View Customer Dossier"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs uppercase text-zinc-700 dark:text-zinc-300 overflow-hidden shrink-0 border border-zinc-200/60 dark:border-zinc-700/60">
                                    {s.userName ? s.userName.charAt(0) : 'U'}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-zinc-950 dark:text-white group-hover:text-amber-500 transition-colors truncate">
                                      {s.userName}
                                    </div>
                                    <div className="font-mono text-[11px] text-zinc-400 truncate">
                                      {s.userEmail}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-xs text-zinc-800 dark:text-zinc-200">
                                  <span className="font-bold text-amber-500 uppercase text-[10px] tracking-wide mr-1.5 font-mono">PRO</span>
                                  <span className="capitalize text-zinc-500 dark:text-zinc-400">{s.billingCycle}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-mono tabular-nums font-bold text-zinc-950 dark:text-white">
                                {formatCurrency(s.amount, s.currency)} <span className="text-[10px] font-normal text-zinc-400">{s.currency || 'USD'}</span>
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                                {s.provider || 'Paystack'}
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1.5 text-xs">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    s.status === 'completed' ? 'bg-emerald-500' :
                                    s.status === 'refunded' ? 'bg-amber-500' :
                                    'bg-zinc-400'
                                  }`} />
                                  <span className={`capitalize font-medium ${
                                    s.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' :
                                    s.status === 'refunded' ? 'text-amber-600 dark:text-amber-400' :
                                    'text-zinc-500'
                                  }`}>
                                    {s.status || 'completed'}
                                  </span>
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono tabular-nums text-zinc-500 dark:text-zinc-400 text-[11px]">
                                {s.createdAt}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedTransactionDetail(s)}
                                    title="View Full Transaction Receipt & Dossier"
                                    className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                                  >
                                    <Receipt size={14} />
                                  </button>
                                  {s.status === 'completed' && (
                                    <button
                                      onClick={async () => {
                                        if (!confirm(`Confirm refund for transaction ${s.id}?`)) return;
                                        try {
                                          await adminApiCall(`/api/admin/subscriptions/${s.id}/refund`, {
                                            method: 'POST',
                                            body: JSON.stringify({ userId: s.userId })
                                          });
                                          setSubscriptions(prev => prev.map(item => item.id === s.id ? { ...item, status: 'refunded' } : item));
                                          await recordLog('SUBSCRIPTION_REFUND', `Refunded transaction ${s.id.substring(0, 10)} for ${s.userName} (${s.userEmail})`);
                                          showToast("Transaction refunded and seat adjusted");
                                          fetchSubscriptions();
                                          fetchUsers();
                                        } catch (e: any) {
                                          showToast(`Failed to process refund: ${e.message || 'Server error'}`);
                                        }
                                      }}
                                      className="px-2 py-1 text-[11px] font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded border border-amber-500/30 transition-colors cursor-pointer"
                                    >
                                      Refund
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Card Footer */}
                  <div className="p-3.5 border-t border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
                    <div className="flex items-center gap-3">
                      <span>
                        Showing {Math.min(displayedDashboardTx.length, dashboardTransactions.length)} of {subscriptions.length} total recorded transactions
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-zinc-400">Rows:</span>
                        {[5, 10, 25, 0].map((limit) => (
                          <button
                            key={limit}
                            onClick={() => setDashboardTxLimit(limit)}
                            className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                              dashboardTxLimit === limit
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold'
                                : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {limit === 0 ? 'All' : limit}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('subscriptions')}
                      className="font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Full Ledger in Transaction History</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: USER DIRECTORY (HIGH DENSITY ENTERPRISE GRID) */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                
                {/* Control bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121215] p-4 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl">
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Role Filter Tabs */}
                    <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg">
                      {(['all', 'FOUNDER', 'INVESTOR', 'ADMIN'] as const).map(r => (
                        <button
                          key={r}
                          onClick={() => setRoleFilter(r)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                            roleFilter === r
                              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs font-semibold'
                              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                        >
                          {r === 'all' ? 'All Roles' : r === 'FOUNDER' ? 'Founders' : r === 'INVESTOR' ? 'Investors' : 'Admins'}
                        </button>
                      ))}
                    </div>

                    {/* Plan Filter */}
                    <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg">
                      {(['all', 'pro', 'free'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setPlanFilter(p)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize ${
                            planFilter === p
                              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs font-semibold'
                              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                        >
                          {p === 'all' ? 'All Plans' : p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                      Showing {filteredUsers.length} of {users.length}
                    </span>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/30">
                          <th className="py-3 px-4 font-medium">User</th>
                          <th className="py-3 px-4 font-medium">Role</th>
                          <th className="py-3 px-4 font-medium">Plan</th>
                          <th className="py-3 px-4 font-medium">Location</th>
                          <th className="py-3 px-4 font-medium">Joined</th>
                          <th className="py-3 px-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.avatarUrl}
                                  alt={u.name}
                                  className="w-8 h-8 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                                />
                                <div>
                                  <div className="font-semibold text-zinc-950 dark:text-white flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    {u.plan === 'pro' && (
                                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">PRO</span>
                                    )}
                                  </div>
                                  <div className="font-mono text-[11px] text-zinc-400">{u.email}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                                u.role === 'FOUNDER' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20' :
                                u.role === 'INVESTOR' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' :
                                'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20'
                              }`}>
                                {u.role}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${u.plan === 'pro' ? 'bg-amber-400' : 'bg-zinc-400'}`} />
                                <span className="capitalize">{u.plan}</span>
                                {u.billingCycle && (
                                  <span className="text-[10px] font-mono text-zinc-400">({u.billingCycle})</span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">
                              {u.location}
                            </td>

                            <td className="py-3 px-4 font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                              {u.joinedDate}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleViewProfile(u)}
                                  title="View User"
                                  className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                                >
                                  <Eye size={15} />
                                </button>
                                
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Are you sure you want to delete ${u.name} (${u.email})?`)) return;
                                    try {
                                      await adminApiCall(`/api/admin/users/${u.id}`, { method: 'DELETE' });
                                      setUsers(prev => prev.filter(item => item.id !== u.id));
                                      await recordLog('USER_DELETION', `Deleted user account ${u.name} (${u.email})`);
                                      showToast(`Deleted user ${u.name}`);
                                      fetchLogs();
                                    } catch (err: any) {
                                      showToast(`Could not delete user: ${err.message}`);
                                    }
                                  }}
                                  title="Delete User"
                                  className="p-1.5 rounded-md hover:bg-rose-500/10 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-zinc-400 font-medium">
                              No users found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: BILLING & SUBSCRIPTIONS */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-6">
                
                {/* Header with Grant Premium Trigger */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Transaction History & Subscriptions</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Complete settlement audit trail, customer payment receipts, and revenue ledger</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchSubscriptions()}
                      disabled={isFetchingSubscriptions}
                      title="Refresh transaction records"
                      className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={isFetchingSubscriptions ? 'animate-spin text-amber-500' : ''} />
                    </button>
                    <button
                      onClick={() => exportTransactionsCSV(filteredSubscriptions, 'connectup_transaction_history')}
                      title="Export transactions as CSV spreadsheet"
                      className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download size={13} />
                      <span className="hidden sm:inline">Export CSV</span>
                    </button>
                    <button
                      onClick={() => setIsGrantSubModalOpen(true)}
                      className="h-8 px-3 rounded-lg bg-zinc-950 dark:bg-amber-400 text-white dark:text-zinc-950 text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-xs w-fit"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      <span>Grant Pro Access</span>
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-5 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">Total Settled</span>
                    <span className="text-2xl font-bold font-mono tabular-nums text-zinc-950 dark:text-white">{formatCurrency(subMetrics.totalRevenue, 'USD')}</span>
                  </div>
                  <div className="p-5 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">Monthly Recurring (MRR)</span>
                    <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(subMetrics.mrr, 'USD')}</span>
                  </div>
                  <div className="p-5 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">Recorded Transactions</span>
                    <span className="text-2xl font-bold font-mono tabular-nums text-zinc-950 dark:text-white">{subscriptions.length}</span>
                  </div>
                  <div className="p-5 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">Active Pro Subscribers</span>
                    <span className="text-2xl font-bold font-mono tabular-nums text-amber-500">{proSubscribersCount}</span>
                  </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={13} className="absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search transactions by user, email, ID, provider..."
                      value={subscriptionSearch}
                      onChange={(e) => setSubscriptionSearch(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['all', 'completed', 'refunded', 'trial', 'cancelled'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSubscriptionFilter(filter)}
                        className={`h-8 px-3 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                          subscriptionFilter === filter
                            ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold'
                            : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {filter === 'trial' ? 'Trials' : filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subscriptions Table */}
                <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/30">
                          <th className="py-3 px-4 font-medium">Transaction ID</th>
                          <th className="py-3 px-4 font-medium">Customer</th>
                          <th className="py-3 px-4 font-medium">Plan & Interval</th>
                          <th className="py-3 px-4 font-medium">Amount</th>
                          <th className="py-3 px-4 font-medium">Gateway</th>
                          <th className="py-3 px-4 font-medium">Status</th>
                          <th className="py-3 px-4 font-medium">Settled At</th>
                          <th className="py-3 px-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                        {isFetchingSubscriptions && filteredSubscriptions.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-zinc-400 font-medium">
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCw size={15} className="animate-spin text-amber-500" />
                                <span>Loading transaction history...</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredSubscriptions.map(s => (
                            <tr key={s.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                                <div className="flex items-center gap-1.5">
                                  <span>{s.id.length > 14 ? `${s.id.substring(0, 12)}...` : s.id}</span>
                                  <button
                                    onClick={() => handleCopyText(s.id, 'Transaction ID')}
                                    title="Copy Transaction ID"
                                    className="p-1 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                                  >
                                    {copiedTxId === s.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div 
                                  onClick={() => {
                                    const u = users.find(user => user.id === s.userId);
                                    if (u) {
                                      handleViewProfile(u);
                                    } else {
                                      handleViewProfile({
                                        id: s.userId,
                                        name: s.userName,
                                        email: s.userEmail,
                                        role: 'FOUNDER',
                                        plan: s.plan,
                                        billingCycle: s.billingCycle,
                                        status: 'active',
                                        avatarUrl: s.userAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.userName)}`,
                                        location: 'Remote',
                                        joinedDate: s.createdAt,
                                        lastActive: 'Recently'
                                      });
                                    }
                                  }}
                                  className="flex items-center gap-2.5 cursor-pointer group"
                                  title="View Customer Dossier"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs uppercase text-zinc-700 dark:text-zinc-300 overflow-hidden shrink-0 border border-zinc-200/60 dark:border-zinc-700/60">
                                    {s.userName ? s.userName.charAt(0) : 'U'}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-zinc-950 dark:text-white group-hover:text-amber-500 transition-colors">{s.userName}</div>
                                    <div className="font-mono text-[11px] text-zinc-400">{s.userEmail}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-xs text-zinc-800 dark:text-zinc-200">
                                  <span className="font-bold text-amber-500 uppercase text-[10px] tracking-wide mr-1.5 font-mono">{s.plan}</span>
                                  <span className="capitalize text-zinc-500 dark:text-zinc-400">{s.billingCycle}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-mono tabular-nums font-bold text-zinc-950 dark:text-white">
                                {formatCurrency(s.amount, s.currency)} <span className="text-[10px] font-normal text-zinc-400 font-sans">{s.currency || 'USD'}</span>
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                                {s.provider || 'Paystack'}
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1.5 text-xs">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    s.status === 'completed' ? 'bg-emerald-500' :
                                    s.status === 'refunded' ? 'bg-amber-500' :
                                    'bg-zinc-400'
                                  }`} />
                                  <span className={`capitalize font-medium ${
                                    s.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' :
                                    s.status === 'refunded' ? 'text-amber-600 dark:text-amber-400' :
                                    'text-zinc-500'
                                  }`}>
                                    {s.status || 'completed'}
                                  </span>
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono tabular-nums text-zinc-500 dark:text-zinc-400 text-[11px]">
                                {s.createdAt}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedTransactionDetail(s)}
                                    title="View Full Transaction Receipt & Dossier"
                                    className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                                  >
                                    <Receipt size={14} />
                                  </button>
                                  {s.status === 'completed' && (
                                    <button
                                      onClick={async () => {
                                        if (!confirm("Confirm refund for this transaction?")) return;
                                        try {
                                          await adminApiCall(`/api/admin/subscriptions/${s.id}/refund`, {
                                            method: 'POST',
                                            body: JSON.stringify({ userId: s.userId })
                                          });
                                          setSubscriptions(prev => prev.map(item => item.id === s.id ? { ...item, status: 'refunded' } : item));
                                          await recordLog('SUBSCRIPTION_REFUND', `Refunded transaction ${s.id.substring(0, 10)} for ${s.userName} (${s.userEmail})`);
                                          showToast("Transaction refunded and seat adjusted");
                                          fetchSubscriptions();
                                          fetchUsers();
                                        } catch (e: any) {
                                          showToast(`Failed to process refund: ${e.message || 'Server error'}`);
                                        }
                                      }}
                                      className="px-2 py-1 text-[11px] font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded border border-amber-500/30 transition-colors cursor-pointer"
                                    >
                                      Refund
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}

                        {!isFetchingSubscriptions && filteredSubscriptions.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-zinc-400 font-medium">
                              No subscription records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: TRUST & SAFETY REPORTS */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-950 dark:text-white">User Reports</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Review reported users, pitches, and content</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-400 tabular-nums">
                      {reports.filter(r => r.status === 'pending').length} pending
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredReports.map(r => (
                    <div 
                      key={r.id}
                      className="p-4 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        {r.videoUrl ? (
                          <div className="w-16 h-16 rounded-lg bg-zinc-900 shrink-0 relative overflow-hidden flex items-center justify-center border border-zinc-800">
                            <Play size={16} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 shrink-0 flex items-center justify-center text-zinc-500">
                            <ShieldAlert size={18} />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                              r.severity === 'high' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                              r.severity === 'medium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                              'bg-zinc-500/10 text-zinc-600 border border-zinc-500/20'
                            }`}>
                              {r.severity}
                            </span>
                            <span className="text-zinc-400 font-mono text-[11px] capitalize">Reason: {r.reason}</span>
                            <span className="text-zinc-300 dark:text-zinc-700">·</span>
                            <span className="text-zinc-500 text-[11px]">By {r.reporterName}</span>
                          </div>

                          <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 truncate max-w-xl">
                            {r.targetContent}
                          </p>

                          <div className="text-[10px] font-mono text-zinc-400">
                            Logged: {new Date(r.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          View Report
                        </button>
                        
                        {r.status !== 'resolved' && (
                          <button
                            onClick={async () => {
                              try {
                                await adminApiCall(`/api/admin/reports/${r.id}`, { method: 'DELETE' });
                                setReports(prev => prev.filter(item => item.id !== r.id));
                                showToast("Report resolved");
                              } catch (e) {
                                showToast("Could not resolve report");
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredReports.length === 0 && (
                    <div className="p-12 text-center text-xs text-zinc-400 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl">
                      No pending reports.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 5: AUDIT LOGS */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Audit Logs</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Chronicle of admin operations, telemetry, and security events</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchLogs()}
                      disabled={isFetchingLogs}
                      title="Fetch latest audit logs"
                      className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={isFetchingLogs ? 'animate-spin text-amber-500' : ''} />
                    </button>
                    <button
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
                        const a = document.createElement('a');
                        a.href = dataStr;
                        a.download = `connectup_audit_${Date.now()}.json`;
                        a.click();
                        showToast("Audit logs exported");
                      }}
                      className="px-3 h-8 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Export JSON</span>
                    </button>
                    {auditLogs.length > 0 && (
                      <button
                        onClick={handleClearAllLogs}
                        title="Clear all audit logs"
                        className="px-3 h-8 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={13} className="absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search logs by action, admin, or detail..."
                      value={auditLogSearch}
                      onChange={(e) => setAuditLogSearch(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={auditLogTypeFilter}
                      onChange={(e) => setAuditLogTypeFilter(e.target.value)}
                      className="h-8 px-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-amber-400 font-mono"
                    >
                      <option value="all">All Actions ({auditLogs.length})</option>
                      <option value="SYSTEM_BOOT">SYSTEM_BOOT</option>
                      <option value="USER_CREATE">USER_CREATE</option>
                      <option value="USER_UPDATE">USER_UPDATE</option>
                      <option value="USER_DELETION">USER_DELETION</option>
                      <option value="SUBSCRIPTION_GRANT">SUBSCRIPTION_GRANT</option>
                      <option value="SUBSCRIPTION_REFUND">SUBSCRIPTION_REFUND</option>
                      <option value="POLICY_ENFORCE">POLICY_ENFORCE</option>
                      <option value="AUTH_VERIFY">AUTH_VERIFY</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono text-xs">
                  {isFetchingLogs && filteredAuditLogs.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 font-sans flex items-center justify-center gap-2">
                      <RefreshCw size={15} className="animate-spin text-amber-500" />
                      <span>Fetching audit logs...</span>
                    </div>
                  ) : (
                    filteredAuditLogs.map(log => (
                      <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            log.action === 'USER_DELETION' ? 'bg-rose-500/10 text-rose-600' :
                            log.action.includes('ROLE') || log.action.includes('USER') ? 'bg-purple-500/10 text-purple-600' :
                            log.action.includes('SUBSCRIPTION') ? 'bg-emerald-500/10 text-emerald-600' :
                            log.action.includes('POLICY') ? 'bg-amber-500/10 text-amber-600' :
                            'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {log.action}
                          </span>
                          <span className="font-sans text-xs text-zinc-800 dark:text-zinc-200">{log.details}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 tabular-nums self-end sm:self-auto">
                          <span className="text-[10px] text-zinc-500 font-sans">{log.adminEmail}</span>
                          <span>·</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            title="Remove log entry"
                            className="p-1 rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer ml-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {!isFetchingLogs && filteredAuditLogs.length === 0 && (
                    <div className="p-8 text-center text-zinc-400 font-sans">
                      No audit logs found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Settings</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage authentication and system preferences</p>
                </div>

                <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 space-y-6 shadow-xs">
                  
                  {/* General Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Authentication</h3>
                    
                    <div className="flex items-center justify-between py-2 border-b border-zinc-150 dark:border-zinc-800/60">
                      <div>
                        <div className="text-xs font-semibold text-zinc-950 dark:text-white">Require Email Verification</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">Require users to verify their email address before accessing the platform</div>
                      </div>
                      <button
                        onClick={() => {
                          setRequireEmailVerification(prev => !prev);
                          showToast("Email verification setting updated");
                        }}
                        className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                          requireEmailVerification ? 'bg-amber-400' : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white dark:bg-zinc-950 absolute top-1 transition-transform ${
                          requireEmailVerification ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-zinc-150 dark:border-zinc-800/60">
                      <div>
                        <div className="text-xs font-semibold text-zinc-950 dark:text-white">Clear Cache</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">Clear stored local data to refresh latest content</div>
                      </div>
                      <button
                        onClick={() => {
                          localStorage.removeItem('connectup_startups_cache');
                          showToast("Cache cleared");
                        }}
                        className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Clear Cache
                      </button>
                    </div>
                  </div>

                  {/* Admin Profile */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Admin Profile</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Display Name</label>
                        <input
                          type="text"
                          value={adminProfileState.fullName}
                          onChange={(e) => setAdminProfileState(prev => ({ ...prev, fullName: e.target.value }))}
                          className="w-full h-9 px-3 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Executive Title</label>
                        <input
                          type="text"
                          value={adminProfileState.title}
                          onChange={(e) => setAdminProfileState(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full h-9 px-3 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          await adminApiCall('/api/admin/profile', {
                            method: 'POST',
                            body: JSON.stringify({
                              fullName: adminProfileState.fullName,
                              title: adminProfileState.title,
                              email: adminProfileState.email || userProfile?.email || 'admin@connectup.com'
                            })
                          });
                          await recordLog('ADMIN_PROFILE_UPDATE', `Updated admin profile: ${adminProfileState.fullName} (${adminProfileState.title})`);
                          showToast("Admin profile saved successfully");
                        } catch (e: any) {
                          showToast(`Could not save profile: ${e.message || 'Server error'}`);
                        }
                      }}
                      className="px-4 py-2 bg-zinc-950 dark:bg-amber-400 text-white dark:text-zinc-950 font-semibold text-xs rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Save Profile
                    </button>
                  </div>

                </div>
              </div>
            )}

          </main>
        </div>

      </div>

      {/* MODAL 1: ADD USER */}
      <AnimatePresence>
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsAddUserModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">Add New User</h3>
                <button onClick={() => setIsAddUserModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                const role = (form.elements.namedItem('role') as HTMLSelectElement).value;
                const password = (form.elements.namedItem('password') as HTMLInputElement).value;
                
                const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });

                try {
                  await adminApiCall('/api/admin/users', {
                    method: 'POST',
                    body: JSON.stringify({
                      password,
                      profile: {
                        id: uuid,
                        full_name: name,
                        email: email,
                        role: role,
                        plan: 'free',
                        updated_at: new Date().toISOString()
                      }
                    })
                  });

                  setIsAddUserModalOpen(false);
                  showToast(`User ${name} created`);
                  await recordLog('USER_CREATE', `Created user account: ${name} (${email}) with role ${role}`);
                  fetchUsers();
                  fetchLogs();
                } catch (err: any) {
                  showToast(`Could not create user: ${err.message}`);
                }
              }} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Full Name</label>
                  <input name="name" required placeholder="Jane Doe" className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Email</label>
                  <input name="email" type="email" required placeholder="jane@example.com" className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Role</label>
                  <select name="role" className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-400">
                    <option value="FOUNDER">Founder</option>
                    <option value="INVESTOR">Investor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Password</label>
                  <input name="password" type="password" required placeholder="••••••••" className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-400" />
                </div>

                <div className="pt-3 flex gap-2">
                  <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="flex-1 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 h-9 rounded-lg bg-zinc-950 dark:bg-amber-400 text-white dark:text-zinc-950 font-semibold cursor-pointer">
                    Add User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: GRANT PRO SUBSCRIPTION */}
      <AnimatePresence>
        {isGrantSubModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsGrantSubModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">Grant Pro Access</h3>
                <button onClick={() => setIsGrantSubModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                const userObj = users.find(u => u.email === email);
                if (!userObj) {
                  showToast("User not found");
                  return;
                }
                
                try {
                  await adminApiCall('/api/admin/subscriptions', {
                    method: 'POST',
                    body: JSON.stringify({
                      user_id: userObj.id,
                      amount: 60,
                      billing_cycle: 'yearly',
                      provider: 'Manual Grant',
                      status: 'completed'
                    })
                  });

                  await recordLog('SUBSCRIPTION_GRANT', `Granted Pro tier access (yearly) to ${userObj.name} (${email})`);

                  setIsGrantSubModalOpen(false);
                  showToast(`Pro access granted to ${email}`);
                  fetchUsers();
                  fetchSubscriptions();
                  fetchLogs();
                } catch (err: any) {
                  showToast(`Could not grant Pro: ${err.message}`);
                }
              }} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Select User</label>
                  <select name="email" required className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-400 font-medium">
                    {users.map(u => (
                      <option key={u.id} value={u.email}>{u.name} · {u.email}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex gap-2">
                  <button type="button" onClick={() => setIsGrantSubModalOpen(false)} className="flex-1 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 h-9 rounded-lg bg-zinc-950 dark:bg-amber-400 text-white dark:text-zinc-950 font-semibold cursor-pointer">
                    Grant Pro
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: USER PROFILE */}
      <AnimatePresence>
        {selectedUserProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedUserProfile(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl z-10 max-h-[85vh] overflow-y-auto space-y-6"
            >
              <div className="flex items-start justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedUserProfile.avatarUrl}
                    alt={selectedUserProfile.name}
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
                  />
                  <div>
                    <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                      <span>{selectedUserProfile.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 uppercase">
                        {selectedUserProfile.role}
                      </span>
                    </h3>
                    <div className="text-xs font-mono text-zinc-400">{selectedUserProfile.email}</div>
                  </div>
                </div>

                <button onClick={() => setSelectedUserProfile(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                  <X size={20} />
                </button>
              </div>

              {/* Account Controls */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 rounded-xl space-y-3">
                <div className="text-xs font-mono uppercase text-zinc-400">Account Settings</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-500 mb-1">Role</label>
                    <select
                      value={selectedUserProfile.role}
                      onChange={async (e) => {
                        const newRole = e.target.value as any;
                        try {
                          await adminApiCall(`/api/admin/users/${selectedUserProfile.id}`, {
                            method: 'PUT',
                            body: JSON.stringify({ role: newRole })
                          });
                          setSelectedUserProfile(prev => prev ? { ...prev, role: newRole } : null);
                          setUsers(prev => prev.map(u => u.id === selectedUserProfile.id ? { ...u, role: newRole } : u));
                          await recordLog('USER_UPDATE', `Updated role to ${newRole} for ${selectedUserProfile.name} (${selectedUserProfile.email})`);
                          showToast(`Role updated to ${newRole}`);
                        } catch (err: any) {
                          showToast(`Could not update role: ${err.message}`);
                        }
                      }}
                      className="w-full h-9 px-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="FOUNDER">FOUNDER</option>
                      <option value="INVESTOR">INVESTOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-1">Set Subscription Plan</label>
                    <select
                      value={selectedUserProfile.plan}
                      onChange={async (e) => {
                        const newPlan = e.target.value as any;
                        try {
                          await adminApiCall(`/api/admin/users/${selectedUserProfile.id}`, {
                            method: 'PUT',
                            body: JSON.stringify({ plan: newPlan })
                          });
                          setSelectedUserProfile(prev => prev ? { ...prev, plan: newPlan } : null);
                          setUsers(prev => prev.map(u => u.id === selectedUserProfile.id ? { ...u, plan: newPlan } : u));
                          await recordLog('USER_UPDATE', `Updated subscription plan to ${newPlan} for ${selectedUserProfile.name} (${selectedUserProfile.email})`);
                          showToast(`Plan updated to ${newPlan}`);
                          fetchSubscriptions();
                        } catch (err: any) {
                          showToast(`Failed: ${err.message}`);
                        }
                      }}
                      className="w-full h-9 px-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="free">Free Tier</option>
                      <option value="pro">Pro Member</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Startup details if Founder */}
              {selectedUserStartup && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 rounded-xl space-y-2 text-xs">
                  <div className="text-xs font-mono uppercase text-zinc-400">Associated Startup Venture</div>
                  <div className="font-bold text-sm text-zinc-950 dark:text-white">{selectedUserStartup.name}</div>
                  <p className="text-zinc-600 dark:text-zinc-300">{selectedUserStartup.one_liner || selectedUserStartup.description}</p>
                  <div className="flex gap-4 font-mono text-[11px] text-zinc-500">
                    <span>Ask: ${selectedUserStartup.ask_amount?.toLocaleString() || 'N/A'}</span>
                    <span>·</span>
                    <span>Stage: {selectedUserStartup.funding_stage || 'Early'}</span>
                  </div>
                </div>
              )}

              {/* Billing History & Transactions */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                    <DollarSign size={13} className="text-emerald-500" />
                    <span>Billing History & Transactions</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {selectedUserTransactions.length} {selectedUserTransactions.length === 1 ? 'record' : 'records'}
                  </span>
                </div>

                {isFetchingProfileDetails ? (
                  <div className="py-4 text-center text-zinc-400 flex items-center justify-center gap-2">
                    <RefreshCw size={13} className="animate-spin text-amber-500" />
                    <span>Fetching user billing records...</span>
                  </div>
                ) : selectedUserTransactions.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedUserTransactions.map((tx: any) => (
                      <div key={tx.id} className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-zinc-950 dark:text-white flex items-center gap-2">
                            <span>${(Number(tx.amount) || 0).toFixed(2)}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-700 uppercase font-mono text-zinc-500">
                              {tx.billing_cycle || tx.billingCycle || 'monthly'}
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-zinc-400">
                            {tx.id.substring(0, 14)}... · {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Recent'}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                          tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                          tx.status === 'refunded' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                          'bg-zinc-500/10 text-zinc-500'
                        }`}>
                          {tx.status || 'completed'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-center text-zinc-400 font-sans text-xs">
                    {selectedUserProfile.plan === 'pro' 
                      ? 'Active Pro member (Granted via administrative override / trial).' 
                      : 'No billing records found for this account (Free Tier).'}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedUserProfile(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-zinc-800 text-white text-xs font-semibold cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: REPORT EVIDENCE REVIEW */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedReport(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">Moderation Case Evidence</h3>
                <button onClick={() => setSelectedReport(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {selectedReport.videoUrl && (
                  <div className="w-full aspect-video rounded-xl bg-zinc-950 overflow-hidden">
                    <VideoPlayer src={selectedReport.videoUrl} controls={true} autoPlay={false} />
                  </div>
                )}

                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-400 mb-1">Target Statement / Payload</div>
                  <p className="text-zinc-900 dark:text-zinc-100 leading-relaxed">{selectedReport.targetContent}</p>
                </div>

                <div className="flex items-center justify-between text-zinc-500 font-mono text-[11px]">
                  <span>Reporter: {selectedReport.reporterName}</span>
                  <span>Severity: {selectedReport.severity}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer text-xs"
                >
                  Dismiss Modal
                </button>
                <button
                  onClick={async () => {
                    try {
                      await adminApiCall(`/api/admin/reports/${selectedReport.id}`, { method: 'DELETE' });
                      setReports(prev => prev.filter(item => item.id !== selectedReport.id));
                      setSelectedReport(null);
                      showToast("Case resolved and closed");
                    } catch (e) {
                      showToast("Failed to close case");
                    }
                  }}
                  className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer text-xs"
                >
                  Resolve Infraction
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
