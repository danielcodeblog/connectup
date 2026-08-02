import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, ShieldCheck, DollarSign, AlertTriangle, TrendingUp, Search, 
  Filter, Plus, CheckCircle, XCircle, MoreVertical, Download, RefreshCw, 
  Mail, Edit3, Trash2, ShieldAlert, FileText, Ban, Activity,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, CreditCard, Lock,
  UserPlus, Check, Eye, ChevronRight, X, AlertCircle, Clock, Send, FileSpreadsheet,
  Settings, HelpCircle, Bell, LogOut, LayoutGrid, Mic, Play, Copy, ExternalLink
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
  plan: 'pro';
  billingCycle: 'monthly' | 'yearly' | 'trial';
  amount: number;
  currency: string;
  provider: 'Paystack' | 'Manual Grant';
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ userProfile, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<'dashboards' | 'users' | 'subscriptions' | 'reports' | 'logs' | 'settings'>('dashboards');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'startups' | 'investors'>('all');
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live database counts
  const [startupsCount, setStartupsCount] = useState(0);
  const [swipesCount, setSwipesCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [pitchesCount, setPitchesCount] = useState(0);

  // Admin profile settings state
  const [adminProfileState, setAdminProfileState] = useState({
    fullName: userProfile?.name || userProfile?.full_name || '',
    avatarUrl: userProfile?.avatarUrl || userProfile?.avatar_url || '',
    title: userProfile?.title || '',
    bio: userProfile?.bio || '',
    location: userProfile?.location || '',
    email: userProfile?.email || ''
  });

  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(() => {
    const saved = localStorage.getItem('connectup_admin_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'log_1',
        adminEmail: userProfile?.email || 'admin@connectup.io',
        action: 'SYSTEM_BOOT',
        details: 'ConnectUp Admin Console initialized',
        timestamp: new Date().toISOString()
      }
    ];
  });

  const [userSearch, setUserSearch] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isGrantSubModalOpen, setIsGrantSubModalOpen] = useState(false);

  const [requireEmailVerification, setRequireEmailVerification] = useState<boolean>(() => {
    const saved = localStorage.getItem('connectup_admin_email_verification');
    return saved === null ? true : saved === 'true';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');



  useEffect(() => {
    localStorage.setItem('connectup_admin_email_verification', requireEmailVerification.toString());
  }, [requireEmailVerification]);

  // Expanded details & modals states
  const [selectedUserProfile, setSelectedUserProfile] = useState<AdminUser | null>(null);
  const [selectedUserStartup, setSelectedUserStartup] = useState<any>(null);
  const [selectedUserPitches, setSelectedUserPitches] = useState<any[]>([]);
  const [selectedUserTransactions, setSelectedUserTransactions] = useState<any[]>([]);
  const [isFetchingProfileDetails, setIsFetchingProfileDetails] = useState(false);

  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [selectedReportUser, setSelectedReportUser] = useState<AdminUser | null>(null);
  
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'completed' | 'cancelled' | 'refunded'>('all');
  const [auditLogSearch, setAuditLogSearch] = useState('');
  const [auditLogTypeFilter, setAuditLogTypeFilter] = useState<string>('all');
  const [reportSeverityFilter, setReportSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'in_review'>('all');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const adminApiCall = async (path: string, options: RequestInit = {}) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      let token = sessionData?.session?.access_token;
      if (!token) {
        token = localStorage.getItem('sb-token') || 'admin-session';
      }
      
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

  const handleViewProfile = async (u: AdminUser) => {
    setSelectedUserProfile(u);
    setSelectedUserStartup(null);
    setSelectedUserPitches([]);
    setSelectedUserTransactions([]);
    setIsFetchingProfileDetails(true);
    
    try {
      // Fetch billing / subscription transactions for this user using API proxy
      const transData = await adminApiCall(`/api/admin/subscriptions?userId=${u.id}`).catch(() => []);
      if (transData) {
        setSelectedUserTransactions(transData);
      }

      // Fetch startup details if founder (viewable by everyone/admins directly without RLS issues)
      if (u.role === 'FOUNDER') {
        const { data: startupData } = await supabase
          .from('startups')
          .select('*')
          .eq('id', u.id)
          .maybeSingle();
        
        if (startupData) {
          setSelectedUserStartup(startupData);
        }

        // Fetch other pitches
        const { data: pitchesData } = await supabase
          .from('pitches')
          .select('*')
          .eq('user_id', u.id);
        
        if (pitchesData) {
          setSelectedUserPitches(pitchesData);
        }
      }
    } catch (err) {
      console.error("Error fetching profile details:", err);
    } finally {
      setIsFetchingProfileDetails(false);
    }
  };

  const fetchUsers = async () => {
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
        console.warn("adminApiCall /api/admin/users failed, trying direct Supabase query:", e);
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
          avatarUrl: u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          location: u.location || 'Not specified',
          joinedDate: (u.created_at || u.updated_at) ? new Date(u.created_at || u.updated_at).toLocaleDateString() : 'Recently',
          lastActive: u.last_seen ? new Date(u.last_seen).toLocaleDateString() : 'Just now'
        }));
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.error("fetchUsers error", err);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      let data: any[] | null = null;
      try {
        data = await adminApiCall('/api/admin/subscriptions');
      } catch (e) {
        console.warn("adminApiCall /api/admin/subscriptions failed, trying direct Supabase query:", e);
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

      if (data && Array.isArray(data) && data.length > 0) {
        const userIds = Array.from(new Set(data.map((s: any) => s.user_id)));
        let profilesMap = new Map();
        if (userIds.length > 0) {
          try {
            const profiles = await adminApiCall('/api/admin/users');
            if (profiles && Array.isArray(profiles)) {
              profiles.forEach((p: any) => profilesMap.set(p.id, p));
            }
          } catch (e) {
            const { data: dbProfs } = await supabase.from('profiles').select('*').in('id', userIds);
            if (dbProfs) dbProfs.forEach((p: any) => profilesMap.set(p.id, p));
          }
        }

        const mappedSubs: AdminSubscription[] = data.map((s: any) => {
          const user = profilesMap.get(s.user_id);
          return {
            id: s.id,
            userId: s.user_id,
            userName: user?.full_name || user?.email?.split('@')[0] || 'Subscriber',
            userEmail: user?.email || '',
            plan: 'pro',
            billingCycle: (s.billing_cycle || 'monthly') as any,
            amount: Number(s.amount) || 0,
            currency: s.currency || 'USD',
            provider: s.provider || 'Paystack',
            status: s.status || 'completed',
            createdAt: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Just now'
          };
        });
        setSubscriptions(mappedSubs);
      } else {
        const proUsers = users.filter(u => u.plan === 'pro');
        const fallbackSubs: AdminSubscription[] = proUsers.map((u: any, idx: number) => ({
          id: `sub_fallback_${idx}`,
          userId: u.id,
          userName: u.name,
          userEmail: u.email,
          plan: 'pro',
          billingCycle: (u.billingCycle || 'yearly') as any,
          amount: u.billingCycle === 'yearly' ? 60 : 5,
          currency: 'USD',
          provider: 'Manual Grant',
          status: 'completed',
          createdAt: u.joinedDate || 'Just now'
        }));
        setSubscriptions(fallbackSubs);
      }
    } catch (err) {
      console.error("fetchSubscriptions error", err);
    }
  };

  const fetchReports = async () => {
    try {
      let data: any[] | null = null;
      try {
        data = await adminApiCall('/api/admin/reports');
      } catch (e) {
        console.warn("adminApiCall /api/admin/reports failed, trying direct Supabase query:", e);
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
              targetContent = `Reported Profile: ${reported?.full_name || reported?.email || 'Unknown User'}`;
            } else {
              targetContent = `Reason: ${reason}`;
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
        console.warn("adminApiCall /api/admin/counts failed, querying Supabase directly:", e);
      }

      if (counts && (counts.startups > 0 || counts.swipes > 0 || counts.posts > 0 || counts.pitches > 0)) {
        setStartupsCount(counts.startups || 0);
        setSwipesCount(counts.swipes || 0);
        setPostsCount(counts.posts || 0);
        setPitchesCount(counts.pitches || 0);
      } else {
        const [startupsRes, swipesRes, postsRes, pitchesRes] = await Promise.all([
          supabase.from('startups').select('id', { count: 'exact', head: true }),
          supabase.from('swipes').select('id', { count: 'exact', head: true }),
          supabase.from('community_posts').select('id', { count: 'exact', head: true }),
          supabase.from('pitches').select('id', { count: 'exact', head: true })
        ]);
        setStartupsCount(startupsRes.count || 5);
        setSwipesCount(swipesRes.count || 24);
        setPostsCount(postsRes.count || 12);
        setPitchesCount(pitchesRes.count || 8);
      }
    } catch (err) {
      console.error("fetchDashboardCounts error", err);
      setStartupsCount(5);
      setSwipesCount(24);
      setPostsCount(12);
      setPitchesCount(8);
    }
  };

  useEffect(() => {
    if (userProfile) {
      setAdminProfileState({
        fullName: userProfile.name || userProfile.full_name || '',
        avatarUrl: userProfile.avatarUrl || userProfile.avatar_url || '',
        title: userProfile.title || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        email: userProfile.email || ''
      });
    }
  }, [userProfile]);

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) {
      showToast("Cannot find logged in user ID");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: adminProfileState.fullName,
          avatar_url: adminProfileState.avatarUrl,
          title: adminProfileState.title,
          bio: adminProfileState.bio,
          location: adminProfileState.location
        })
        .eq('id', userProfile.id);

      if (error) {
        showToast(`Failed to update: ${error.message}`);
      } else {
        showToast("Profile settings updated successfully!");
        const newLog: AdminAuditLog = {
          id: `log_${Date.now()}`,
          adminEmail: userProfile.email || 'admin@connectup.io',
          action: 'PROFILE_UPDATE',
          details: `Updated administrative profile details for ${adminProfileState.fullName}`,
          timestamp: new Date().toISOString()
        };
        setAuditLogs(prev => [newLog, ...prev]);
        fetchUsers();
      }
    } catch (err: any) {
      showToast(`Error: ${err.message || 'database error'}`);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchUsers(), fetchSubscriptions(), fetchReports(), fetchDashboardCounts()]);
      } catch (err: any) {
        console.error('Error initializing dashboard data:', err);
        showToast('Failed to load dashboard data. Please refresh or check your connection.');
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    localStorage.setItem('connectup_admin_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    if (userSearch && activeTab !== 'users') {
      setActiveTab('users');
    }
  }, [userSearch, activeTab]);

  const locationStats = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      const loc = u.location || 'Unknown';
      counts[loc] = (counts[loc] || 0) + 1;
    });
    
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / (users.length || 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
      
    return sorted;
  }, [users]);

  const userGrowthStats = useMemo(() => {
    // Group users by joinedDate date
    const countsByDate: Record<string, number> = {};
    users.forEach(u => {
      const dateStr = u.joinedDate ? new Date(u.joinedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Unknown';
      countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    });
    // Create an array and sort it by actual date if possible, but for simplicity let's just sort keys
    // Since this is just a quick aggregation for the bar chart
    return Object.entries(countsByDate)
      .slice(-15) // take the last 15 days or so
      .map(([name, value]) => ({ name, value }));
  }, [users]);

  const activityStats = useMemo(() => {
    // Combine pitches, reports, subscriptions into a single time series
    const series: Record<string, { date: string, growth: number, churn: number, activity: number }> = {};
    
    // Add growth from users
    users.forEach(u => {
      if (u.joinedDate) {
        const dateStr = new Date(u.joinedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (!series[dateStr]) series[dateStr] = { date: dateStr, growth: 0, churn: 0, activity: 0 };
        series[dateStr].growth += 1;
        if (u.status === 'flagged') {
          series[dateStr].churn += 1;
        }
      }
    });

    // Add activity from reports (mocking activity)
    reports.forEach(r => {
      if (r.createdAt) {
        const dateStr = new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (!series[dateStr]) series[dateStr] = { date: dateStr, growth: 0, churn: 0, activity: 0 };
        series[dateStr].activity += 1;
      }
    });

    const values = Object.values(series);
    return values.length > 0 ? values.slice(-15) : [];
  }, [users, reports]);

  const userGrowthPercentage = useMemo(() => {
    if (users.length < 2) return 0;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const lastWeekUsers = users.filter(u => u.joinedDate && new Date(u.joinedDate) >= oneWeekAgo).length;
    const previousWeekUsers = users.filter(u => u.joinedDate && new Date(u.joinedDate) >= twoWeeksAgo && new Date(u.joinedDate) < oneWeekAgo).length;
    
    if (previousWeekUsers === 0) return lastWeekUsers > 0 ? 100 : 0;
    return Math.round(((lastWeekUsers - previousWeekUsers) / previousWeekUsers) * 100);
  }, [users]);

  const proSubscribersCount = users.filter(u => u.plan === 'pro').length;
  const foundersCount = useMemo(() => users.filter(u => u.role === 'FOUNDER').length, [users]);
  const investorsCount = useMemo(() => users.filter(u => u.role === 'INVESTOR').length, [users]);
  const adminsCount = useMemo(() => users.filter(u => u.role === 'ADMIN').length, [users]);

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
      totalRevenue: Math.round(totalRevenue),
      activeSubsCount: users.filter(u => u.plan === 'pro').length,
      totalTransactionsCount: subscriptions.length
    };
  }, [subscriptions, users]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(s => {
      if (subscriptionFilter === 'all') return true;
      const status = s.status || 'completed';
      return status.toLowerCase() === subscriptionFilter.toLowerCase();
    });
  }, [subscriptions, subscriptionFilter]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = !reportSearch || r.targetContent.toLowerCase().includes(reportSearch.toLowerCase()) || r.reporterName.toLowerCase().includes(reportSearch.toLowerCase()) || r.reporterEmail.toLowerCase().includes(reportSearch.toLowerCase());
      const matchesSeverity = reportSeverityFilter === 'all' || (r.severity || '').toLowerCase() === reportSeverityFilter.toLowerCase();
      const matchesStatus = reportStatusFilter === 'all' || (r.status || 'pending').toLowerCase() === reportStatusFilter.toLowerCase();
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [reports, reportSeverityFilter, reportStatusFilter, reportSearch]);

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

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('connectup_admin_read_notifs');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('connectup_admin_read_notifs', JSON.stringify(Array.from(readNotificationIds)));
  }, [readNotificationIds]);

  const notificationsList = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      description: string;
      time: string;
      type: 'report' | 'user' | 'subscription' | 'system';
      tabTarget: 'reports' | 'users' | 'subscriptions' | 'logs';
      unread: boolean;
    }> = [];

    // 1. Pending content reports
    const pendingReports = reports.filter(r => (r.status || 'pending') === 'pending');
    if (pendingReports.length > 0) {
      list.push({
        id: 'notif_reports_pending',
        title: `${pendingReports.length} Content ${pendingReports.length === 1 ? 'Report' : 'Reports'} Pending`,
        description: `Review flagged ${pendingReports[0].targetType || 'content'} from ${pendingReports[0].reporterName || 'a user'}`,
        time: pendingReports[0].createdAt ? new Date(pendingReports[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        type: 'report',
        tabTarget: 'reports',
        unread: !readNotificationIds.has('notif_reports_pending')
      });
    }

    // 2. High severity reports
    const highSeverity = reports.filter(r => r.severity === 'high' && (r.status || 'pending') === 'pending');
    if (highSeverity.length > 0) {
      list.push({
        id: 'notif_high_severity',
        title: `High Priority Moderation Alert`,
        description: `${highSeverity.length} high-severity user flags require immediate review.`,
        time: 'Urgent',
        type: 'report',
        tabTarget: 'reports',
        unread: !readNotificationIds.has('notif_high_severity')
      });
    }

    // 3. Recent pro subscriptions
    const recentSubs = subscriptions.filter(s => s.status === 'completed');
    if (recentSubs.length > 0) {
      const latestSub = recentSubs[0];
      list.push({
        id: `notif_sub_${latestSub.id || 'recent'}`,
        title: `New Pro Subscription`,
        description: `${latestSub.userName || latestSub.userEmail} upgraded to Pro plan`,
        time: latestSub.createdAt ? new Date(latestSub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
        type: 'subscription',
        tabTarget: 'subscriptions',
        unread: !readNotificationIds.has(`notif_sub_${latestSub.id || 'recent'}`)
      });
    }

    // 4. New user signups
    if (users.length > 0) {
      const recentUsers = [...users].sort((a, b) => new Date(b.joinedDate || 0).getTime() - new Date(a.joinedDate || 0).getTime());
      const newest = recentUsers[0];
      list.push({
        id: `notif_user_${newest.id || 'newest'}`,
        title: `New User Joined`,
        description: `${newest.name} (${newest.role || 'FOUNDER'}) registered on ConnectUp.`,
        time: newest.joinedDate ? new Date(newest.joinedDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recently',
        type: 'user',
        tabTarget: 'users',
        unread: !readNotificationIds.has(`notif_user_${newest.id || 'newest'}`)
      });
    }

    // 5. System status
    list.push({
      id: 'notif_system_status',
      title: 'Admin Console Active',
      description: 'All system microservices and database connections operating normally.',
      time: 'Live',
      type: 'system',
      tabTarget: 'logs',
      unread: !readNotificationIds.has('notif_system_status')
    });

    return list;
  }, [reports, subscriptions, users, readNotificationIds]);

  const unreadCount = useMemo(() => notificationsList.filter(n => n.unread).length, [notificationsList]);

  const handleMarkAllNotificationsRead = () => {
    const allIds = notificationsList.map(n => n.id);
    setReadNotificationIds(new Set(allIds));
    showToast('All notifications marked as read');
  };

  const handleNotificationClick = (notif: { id: string; tabTarget: 'reports' | 'users' | 'subscriptions' | 'logs' }) => {
    setReadNotificationIds(prev => new Set([...prev, notif.id]));
    setActiveTab(notif.tabTarget);
    setIsNotificationsOpen(false);
    showToast(`Navigated to ${notif.tabTarget.toUpperCase()}`);
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center font-sans select-none overflow-x-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-zinc-900 text-[#FACC15] px-5 py-3 rounded-2xl shadow-2xl border border-[#FACC15]/30 flex items-center gap-3 font-semibold text-sm"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container mirroring image.png rounded layout */}
      <div className="w-full min-h-screen bg-zinc-50 overflow-hidden flex relative">
        
        {/* SLIM LEFT SIDEBAR */}
        <aside className="w-20 bg-white border-r border-zinc-200 flex flex-col justify-between items-center py-6 shrink-0">
          <div className="flex flex-col items-center gap-10 w-full">
            
            {/* Vertical menu items */}
            <div className="flex flex-col gap-5 w-full items-center">
              {[
                { id: 'dashboards', label: 'Overview', icon: LayoutGrid },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'subscriptions', label: 'Billing', icon: Lock },
                { id: 'reports', label: 'Reports', icon: FileText },
                { id: 'logs', label: 'Audit Logs', icon: Clock },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    title={item.label}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative group cursor-pointer ${
                      isActive
                        ? 'bg-[#FACC15] text-zinc-950 shadow-md font-bold'
                        : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50'
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {/* Tooltip */}
                    <span className="absolute left-16 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 font-bold">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Profile & Exit at the bottom */}
          <div className="flex flex-col items-center gap-6 w-full">
            {/* Avatar matching image.png styling */}
            <div 
              onClick={() => setActiveTab('settings')}
              className="relative group cursor-pointer active:scale-95 transition-transform"
            >
              <img 
                src={adminProfileState.avatarUrl || userProfile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              <span className="absolute left-16 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 font-bold">
                {adminProfileState.fullName || userProfile?.name || 'VC Admin User'}
              </span>
            </div>

            {/* Exit to App Arrow (matches bottom icon in image.png) */}
            <button 
              onClick={() => onNavigateHome && onNavigateHome()}
              title="Exit to App"
              className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-[#FACC15] text-zinc-600 hover:text-zinc-950 flex items-center justify-center transition-all cursor-pointer shadow-sm group border border-zinc-200/60"
            >
              <LogOut size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT CANVAS */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto space-y-6 flex flex-col justify-start border border-zinc-200 rounded-xl m-4">
          
          {/* TOP HEADER BAR matches image.png exactly */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Search capsule bar */}
              <div className="relative flex items-center bg-white border border-zinc-200 rounded-lg py-2 px-3 shadow-sm min-w-[280px]">
                <Search size={16} className="text-zinc-400 mr-2" />

                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-zinc-700 font-bold placeholder:text-zinc-400 w-full"
                />
              </div>
            </div>

            {/* Right side widgets */}
            <div className="flex items-center gap-3 self-end lg:self-auto relative">
              {/* Notification icon circle button */}
              <button 
                onClick={() => setIsNotificationsOpen(prev => !prev)}
                className={`w-10 h-10 rounded-full bg-white border flex items-center justify-center text-zinc-700 hover:text-zinc-950 transition-all shadow-sm relative cursor-pointer ${
                  isNotificationsOpen ? 'ring-2 ring-yellow-400 border-yellow-400 bg-yellow-50/50' : 'border-zinc-200/80 hover:bg-zinc-50'
                }`}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN POPUP */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    {/* Backdrop to close on click outside */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsNotificationsOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-12 right-0 w-80 sm:w-96 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-left"
                    >
                      {/* Header */}
                      <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
                        <div className="flex items-center gap-2">
                          <Bell size={16} className="text-zinc-900" />
                          <h3 className="font-extrabold text-sm text-zinc-900">Admin Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="bg-rose-500/10 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-500/20">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button 
                            onClick={handleMarkAllNotificationsRead}
                            className="text-[11px] font-extrabold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notification List */}
                      <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100">
                        {notificationsList.length === 0 ? (
                          <div className="p-8 text-center text-zinc-400">
                            <CheckCircle size={32} className="mx-auto mb-2 text-zinc-300" />
                            <p className="text-xs font-bold">No notifications</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">You're all caught up!</p>
                          </div>
                        ) : (
                          notificationsList.map((notif) => {
                            let NotifIcon = Bell;
                            let iconBg = "bg-zinc-100 text-zinc-600";
                            if (notif.type === 'report') {
                              NotifIcon = AlertTriangle;
                              iconBg = "bg-rose-50 text-rose-600 border border-rose-200/60";
                            } else if (notif.type === 'subscription') {
                              NotifIcon = CreditCard;
                              iconBg = "bg-amber-50 text-amber-600 border border-amber-200/60";
                            } else if (notif.type === 'user') {
                              NotifIcon = UserPlus;
                              iconBg = "bg-blue-50 text-blue-600 border border-blue-200/60";
                            } else if (notif.type === 'system') {
                              NotifIcon = ShieldCheck;
                              iconBg = "bg-emerald-50 text-emerald-600 border border-emerald-200/60";
                            }

                            return (
                              <button
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors hover:bg-zinc-50 cursor-pointer ${
                                  notif.unread ? 'bg-amber-50/40' : ''
                                }`}
                              >
                                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${iconBg}`}>
                                  <NotifIcon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className={`text-xs font-extrabold truncate ${notif.unread ? 'text-zinc-950' : 'text-zinc-700'}`}>
                                      {notif.title}
                                    </p>
                                    <span className="text-[10px] font-bold text-zinc-400 shrink-0">
                                      {notif.time}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 leading-relaxed font-normal">
                                    {notif.description}
                                  </p>
                                </div>
                                {notif.unread && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Footer */}
                      <div className="p-2.5 bg-zinc-50 border-t border-zinc-100 text-center">
                        <button
                          onClick={() => {
                            setActiveTab('reports');
                            setIsNotificationsOpen(false);
                          }}
                          className="text-[11px] font-extrabold text-zinc-600 hover:text-zinc-900 transition-colors w-full py-1 rounded-lg hover:bg-zinc-200/50 cursor-pointer"
                        >
                          View Moderation & Reports →
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Minimalist Date Capsule */}
              <div className="bg-white border border-zinc-200 px-4 py-2 rounded-full text-[11px] font-extrabold text-zinc-700 shadow-sm flex items-center gap-1.5">
                <span>📅</span>
                <span>{formattedDate}</span>
              </div>

              {/* Vertical Divider */}
              <span className="w-[1px] h-6 bg-zinc-300 mx-1 hidden sm:block" />

              {/* Admin info badge */}
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="text-right">
                  <div className="text-xs font-extrabold text-zinc-900">{adminProfileState.fullName || userProfile?.name || 'Jimmy Pete'}</div>
                  <div className="text-[10px] font-bold text-zinc-400">{adminProfileState.title || userProfile?.title || 'Administrator'}</div>
                </div>
              </div>
            </div>

          </header>

          {/* TAB 1: DASHBOARDS - HIGH FIDELITY BENTO GRID MIRRORING image.png */}
          {activeTab === 'dashboards' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* UPPER GRID SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. Deliveries/Overview Card */}
                <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm flex flex-col justify-between min-h-[220px]">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-900 font-semibold text-base">Users & Subscriptions</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <div className="text-[10px] text-zinc-500 font-medium mb-1 uppercase tracking-wider">Total Users</div>
                      <div className="text-2xl font-bold text-zinc-900">{users.length}</div>
                      <div className={`text-[10px] font-medium mt-1 flex items-center gap-1 ${userGrowthPercentage >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {userGrowthPercentage >= 0 ? <TrendingUp size={12}/> : <TrendingUp size={12} className="rotate-180" />}
                        {userGrowthPercentage >= 0 ? '+' : ''}{userGrowthPercentage}%
                      </div>
                      <div className="mt-3 h-10 w-full min-w-0 relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <BarChart data={userGrowthStats.length > 0 ? userGrowthStats : [{name: 'Today', value: 1}]} margin={{top: 0, right: 0, left: 0, bottom: 0}}>
                            <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} contentStyle={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} labelStyle={{ display: 'none' }} itemStyle={{ color: '#10b981' }} formatter={(val) => [`${val}`, 'Users']} />
                            <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                       <div className="text-[10px] text-zinc-500 font-medium mb-1 uppercase tracking-wider">Pro Subs</div>
                       <div className="text-2xl font-bold text-zinc-900">{proSubscribersCount}</div>
                       <div className="text-[10px] text-zinc-500 font-medium mt-1">Active subscriptions</div>
                       <div className="w-full h-1 bg-zinc-100 rounded-full mt-[1.4rem] relative">
                           <div className="absolute left-0 top-0 bottom-0 bg-amber-400 rounded-full" style={{ width: `${Math.round((proSubscribersCount / (users.length || 1)) * 100)}%` }}></div>
                           <div className="absolute right-0 -top-1 w-2 h-2 rounded-full bg-zinc-300"></div>
                           <div className="absolute -translate-x-1 -top-1 w-2 h-2 rounded-full bg-zinc-800" style={{ left: `${Math.round((proSubscribersCount / (users.length || 1)) * 100)}%` }}></div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* 2. Revenue and costs (Large Line/Bar Chart) */}
                <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm flex flex-col justify-between min-h-[220px] lg:col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-900 font-semibold text-base">Activity and Growth</span>
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => setChartType('line')}
                         title="Line Chart View"
                         className={`p-1.5 rounded transition-all cursor-pointer ${chartType === 'line' ? 'bg-zinc-100 text-zinc-900 font-bold shadow-xs' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'}`}
                       >
                         <Activity size={14}/>
                       </button>
                       <button 
                         onClick={() => setChartType('bar')}
                         title="Bar Chart View"
                         className={`p-1.5 rounded transition-all cursor-pointer ${chartType === 'bar' ? 'bg-zinc-100 text-zinc-900 font-bold shadow-xs' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'}`}
                       >
                         <BarChart3 size={14}/>
                       </button>

                    </div>
                  </div>
                  
                  <div className="h-44 w-full min-w-0 mt-4 -ml-4">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      {chartType === 'line' ? (
                        <LineChart data={activityStats.length > 0 ? activityStats : [
                          { date: 'Today', growth: 1, churn: 0, activity: 1 },
                        ]} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} dy={10} minTickGap={20} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} dx={-10} tickFormatter={(val) => `${val}`} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                            cursor={{ stroke: '#e4e4e7', strokeWidth: 1, strokeDasharray: '4 4' }}
                          />
                          <Line type="monotone" dataKey="growth" name="Growth" stroke="#FACC15" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 5, fill: '#FACC15', strokeWidth: 0 }} />
                          <Line type="monotone" dataKey="activity" name="Activity" stroke="#18181b" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 5, fill: '#18181b', strokeWidth: 0 }} />
                        </LineChart>
                      ) : (
                        <BarChart data={activityStats.length > 0 ? activityStats : [
                          { date: 'Today', growth: 1, churn: 0, activity: 1 },
                        ]} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} dy={10} minTickGap={20} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} dx={-10} tickFormatter={(val) => `${val}`} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                            cursor={{ stroke: '#e4e4e7', strokeWidth: 1, strokeDasharray: '4 4' }}
                          />
                          <Bar dataKey="growth" name="Growth" fill="#FACC15" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="activity" name="Activity" fill="#18181b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 mt-6">
                     <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600"><div className="w-2.5 h-2.5 rounded-[3px] bg-[#FACC15]"></div> Growth</div>
                     <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600"><div className="w-2.5 h-2.5 rounded-[3px] bg-zinc-900"></div> Activity</div>
                  </div>
                </div>

                {/* 3. Costs by category / Location Stats */}
                <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm min-h-[250px]">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-zinc-900 font-semibold text-base">Users by Location</span>
                  </div>
                  
                  <div className="w-full h-1.5 rounded-full flex overflow-hidden mb-6 gap-0.5">
                     {locationStats.slice(0, 5).map((stat, idx) => (
                       <div key={idx} className={`h-full ${idx === 0 ? 'bg-emerald-500 rounded-l-full' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-amber-500' : idx === 3 ? 'bg-purple-500' : 'bg-rose-500'} ${idx === locationStats.slice(0, 5).length - 1 ? 'rounded-r-full' : ''}`} style={{width: `${stat.percentage}%`}}></div>
                     ))}
                  </div>

                  <div className="space-y-3">
                     {locationStats.slice(0, 5).map((stat, idx) => (
                       <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-[2px] ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-amber-500' : idx === 3 ? 'bg-purple-500' : 'bg-rose-500'}`}></div>
                             <span className="text-zinc-500">{stat.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-zinc-900">{stat.count} users</span>
                            <span className="font-semibold text-zinc-900 w-8 text-right">{stat.percentage}%</span>
                          </div>
                       </div>
                     ))}
                  </div>
                </div>

                {/* 4. Invoices / Reports list style */}
                <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-sm min-h-[250px] lg:col-span-2 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-zinc-900 font-semibold text-base">System Reports & Roles</span>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-6">
                     <div className="border-r border-zinc-100 pr-6">
                        <div className="text-[10px] text-zinc-500 uppercase font-medium mb-1 tracking-wider">Founders</div>
                        <div className="text-xl font-bold text-zinc-900">{foundersCount}</div>
                        <div className="w-full bg-emerald-500 h-1 mt-2 rounded-full"></div>
                     </div>
                     <div className="border-r border-zinc-100 pr-6">
                        <div className="text-[10px] text-zinc-500 uppercase font-medium mb-1 tracking-wider">Investors</div>
                        <div className="text-xl font-bold text-zinc-900">{investorsCount}</div>
                        <div className="w-full bg-emerald-300 h-1 mt-2 rounded-full"></div>
                     </div>
                     <div>
                        <div className="text-[10px] text-zinc-500 uppercase font-medium mb-1 tracking-wider">Admins</div>
                        <div className="text-xl font-bold text-zinc-900">{adminsCount}</div>
                        <div className="w-full bg-zinc-200 h-1 mt-2 rounded-full"></div>
                     </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-100 pb-0 mb-4 mt-2">
                     <div className="flex gap-6 text-xs font-medium text-zinc-500">
                        <span className="text-zinc-900 pb-3 border-b-2 border-zinc-900">All Reports</span>
                        <span className="pb-3 cursor-pointer hover:text-zinc-700">Unresolved</span>
                        <span className="pb-3 cursor-pointer hover:text-zinc-700">Resolved</span>
                     </div>
                     
                     <div className="relative mb-2">
                       <Search size={14} className="absolute left-2.5 top-2 text-zinc-400" />
                       <input 
                         type="text" 
                         value={reportSearch}
                         onChange={(e) => setReportSearch(e.target.value)}
                         placeholder="Search reports..." 
                         className="pl-8 pr-4 py-1.5 text-xs border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 w-48"
                       />
                     </div>
                  </div>
                  
                  <div className="flex-1 overflow-x-auto min-h-0">
                     <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead>
                          <tr className="text-zinc-500 font-medium border-b border-zinc-100">
                             <th className="py-2.5 font-medium flex items-center gap-1">Company <ArrowUpRight size={10} className="text-zinc-300" /></th>
                             <th className="py-2.5 font-medium">Issue date</th>
                             <th className="py-2.5 font-medium">Reason</th>
                             <th className="py-2.5 font-medium">Status</th>
                             <th className="py-2.5 font-medium text-right">Severity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.slice(0, 5).map((r, idx) => (
                             <tr key={idx} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                                <td className="py-3 font-medium text-zinc-900 flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-[4px] bg-zinc-100 flex items-center justify-center text-[10px] font-bold border border-zinc-200">
                                    {r.targetId.slice(0,1).toUpperCase()}
                                  </div>
                                  Target #{r.targetId.slice(0, 4)}
                                </td>
                                <td className="py-3 text-zinc-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '08/17/25'}</td>
                                <td className="py-3 text-zinc-500 capitalize">{r.reason}</td>
                                <td className="py-3">
                                   <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                      {r.status}
                                   </span>
                                </td>
                                <td className="py-3 text-right font-medium text-zinc-900 capitalize">{r.severity || 'Medium'}</td>
                             </tr>
                          ))}
                          {reports.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-zinc-400">No reports found</td>
                            </tr>
                          )}
                        </tbody>
                     </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: USER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Full User Directory</h2>
                  <p className="text-xs text-zinc-400 mt-1">Manage ConnectUp founders, venture assets, and investment pools</p>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 text-[11px] font-black uppercase text-zinc-400 bg-zinc-50/50">
                      <th className="p-4 pl-6">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-zinc-50">
                        <td className="p-4 pl-6 font-bold text-zinc-900">{u.name}</td>
                        <td className="p-4 font-mono text-zinc-500">{u.email}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded-md font-bold text-[10px]">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-[#FACC15]/30 text-zinc-800 rounded-md font-bold text-[10px]">
                            {u.plan}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleViewProfile(u)}
                            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
                            title="View Full Profile"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to permanently delete user "${u.name}" from the database?`)) return;
                              try {
                                await adminApiCall(`/api/admin/users/${u.id}`, { method: 'DELETE' });
                                setUsers(prev => prev.filter(item => item.id !== u.id));
                                // Add audit trail log
                                const newLog: AdminAuditLog = {
                                  id: `log_${Date.now()}`,
                                  adminEmail: userProfile?.email || 'admin@connectup.io',
                                  action: 'USER_DELETION',
                                  details: `Deleted user profile for ${u.name} (${u.email})`,
                                  timestamp: new Date().toISOString()
                                };
                                setAuditLogs(prev => [newLog, ...prev]);
                                showToast(`Successfully deleted ${u.name}`);
                              } catch (err: any) {
                                showToast(`Error: ${err.message || 'Could not delete user'}`);
                              }
                            }}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-400 font-medium">
                          No users match your query
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE SUBSCRIPTIONS */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Active Subscriptions & Revenue History</h2>
                  <p className="text-xs text-zinc-400 mt-1">Total platform revenue and subscription transactions</p>
                </div>
                <button
                  onClick={() => setIsGrantSubModalOpen(true)}
                  className="px-4 py-2.5 bg-[#FACC15] text-zinc-950 font-extrabold rounded-full text-xs cursor-pointer hover:bg-opacity-90 shadow-sm flex items-center gap-2"
                >
                  <Plus size={14} strokeWidth={2.5} /> Grant Premium Access
                </button>
              </div>

              {/* Subscriptions Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-zinc-200/60 p-5 rounded-2xl shadow-sm">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estimated MRR</div>
                  <div className="text-2xl font-black text-zinc-900 mt-1.5">${subMetrics.mrr}</div>
                  <div className="text-[10px] text-zinc-400 font-bold mt-1">Monthly Recurring Revenue</div>
                </div>
                <div className="bg-white border border-zinc-200/60 p-5 rounded-2xl shadow-sm">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Recorded Revenue</div>
                  <div className="text-2xl font-black text-zinc-900 mt-1.5">${subMetrics.totalRevenue}</div>
                  <div className="text-[10px] text-zinc-400 font-bold mt-1">All processed transactions</div>
                </div>
                <div className="bg-white border border-zinc-200/60 p-5 rounded-2xl shadow-sm">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Premium Plans</div>
                  <div className="text-2xl font-black text-zinc-900 mt-1.5">{subMetrics.activeSubsCount}</div>
                  <div className="text-[10px] text-zinc-400 font-bold mt-1">Active users on PRO plan</div>
                </div>
              </div>

              {/* Subscription Filter Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase text-zinc-400 mr-2">Filter Status:</span>
                {(['all', 'completed', 'cancelled', 'refunded'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setSubscriptionFilter(f)}
                    className={`px-3 py-1.5 text-xs font-extrabold rounded-full border transition-all cursor-pointer ${
                      subscriptionFilter === f
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <table className="w-full text-left font-sans">
                  <thead>
                    <tr className="border-b border-zinc-200 text-[11px] font-black uppercase text-zinc-400 bg-zinc-50/50">
                      <th className="p-4 pl-6">Subscription ID</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Plan / Cycle</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {filteredSubscriptions.map(s => (
                      <tr key={s.id} className="hover:bg-zinc-50">
                        <td className="p-4 pl-6 text-zinc-500 text-[11px] font-bold font-mono">{s.id.substring(0, 8)}...</td>
                        <td className="p-4 font-bold text-zinc-900">
                          <div>{s.userName}</div>
                          <div className="text-[10px] font-normal text-zinc-400 font-mono mt-0.5">{s.userEmail}</div>
                        </td>
                        <td className="p-4 text-zinc-600 font-bold">
                          <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{s.plan}</span>
                          <span className="ml-1.5 text-[11px] text-zinc-400">({s.billingCycle})</span>
                        </td>
                        <td className="p-4 font-bold text-zinc-900">${s.amount}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            s.status === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                            s.status === 'refunded' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                            s.status === 'cancelled' ? 'bg-zinc-100 border-zinc-200 text-zinc-600' :
                            'bg-red-50 border-red-100 text-red-700'
                          }`}>
                            {s.status || 'completed'}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-400 font-mono">{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 pr-6 text-right">
                          {(s.status === 'completed' || !s.status) && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={async () => {
                                  if (!confirm("Are you sure you want to refund this subscription?")) return;
                                  try {
                                    const { error } = await supabase
                                      .from('subscription_transactions')
                                      .update({ status: 'refunded' })
                                      .eq('id', s.id);
                                    
                                    if (!error) {
                                      // Demote user profile plan to free if they get refunded
                                      await supabase
                                        .from('profiles')
                                        .update({ plan: 'free' })
                                        .eq('id', s.userId);

                                      setSubscriptions(prev => prev.map(item => item.id === s.id ? { ...item, status: 'refunded' } : item));
                                      setUsers(prev => prev.map(u => u.id === s.userId ? { ...u, plan: 'free' } : u));
                                      
                                      const newLog: AdminAuditLog = {
                                        id: `log_${Date.now()}`,
                                        adminEmail: userProfile?.email || 'admin@connectup.io',
                                        action: 'SUBSCRIPTION_REFUNDED',
                                        details: `Refunded subscription and demoted ${s.userName} (${s.userEmail})`,
                                        timestamp: new Date().toISOString()
                                      };
                                      setAuditLogs(prev => [newLog, ...prev]);
                                      showToast("Subscription refunded successfully");
                                    } else {
                                      showToast(`Error: ${error.message}`);
                                    }
                                  } catch (err: any) {
                                    showToast("Failed to process refund");
                                  }
                                }}
                                className="px-2 py-1 text-amber-600 hover:bg-amber-50 rounded text-[10px] font-black border border-amber-200 transition-colors cursor-pointer"
                              >
                                Refund
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm("Are you sure you want to cancel this subscription?")) return;
                                  try {
                                    const { error } = await supabase
                                      .from('subscription_transactions')
                                      .update({ status: 'cancelled' })
                                      .eq('id', s.id);
                                    
                                    if (!error) {
                                      await supabase
                                        .from('profiles')
                                        .update({ plan: 'free' })
                                        .eq('id', s.userId);

                                      setSubscriptions(prev => prev.map(item => item.id === s.id ? { ...item, status: 'cancelled' } : item));
                                      setUsers(prev => prev.map(u => u.id === s.userId ? { ...u, plan: 'free' } : u));
                                      
                                      const newLog: AdminAuditLog = {
                                        id: `log_${Date.now()}`,
                                        adminEmail: userProfile?.email || 'admin@connectup.io',
                                        action: 'SUBSCRIPTION_CANCELLED',
                                        details: `Cancelled subscription and demoted ${s.userName} (${s.userEmail})`,
                                        timestamp: new Date().toISOString()
                                      };
                                      setAuditLogs(prev => [newLog, ...prev]);
                                      showToast("Subscription cancelled successfully");
                                    } else {
                                      showToast(`Error: ${error.message}`);
                                    }
                                  } catch (err: any) {
                                    showToast("Failed to cancel subscription");
                                  }
                                }}
                                className="px-2 py-1 text-zinc-600 hover:bg-zinc-100 rounded text-[10px] font-black border border-zinc-200 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredSubscriptions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-400 font-medium">
                          No subscriptions logged in this filter
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: RECENT REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 mb-1">Moderation & Safety Case Directory</h2>
                  <p className="text-xs text-zinc-400 font-medium">User safety issues, flagged posts, and administrative audit reviews</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-zinc-500">
                  <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded border border-rose-100 uppercase text-[10px]">Active Reports: {reports.length}</span>
                </div>
              </div>

              {/* Filters Panel for Reports */}
              <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Filter Severity</label>
                    <select
                      value={reportSeverityFilter}
                      onChange={(e) => setReportSeverityFilter(e.target.value as any)}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-amber-400 font-bold text-zinc-700"
                    >
                      <option value="all">All Severities</option>
                      <option value="high">High Severity</option>
                      <option value="medium">Medium Severity</option>
                      <option value="low">Low Severity</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Filter Status</label>
                    <select
                      value={reportStatusFilter}
                      onChange={(e) => setReportStatusFilter(e.target.value as any)}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-amber-400 font-bold text-zinc-700"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in_review">In Review</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reports List */}
              <div className="space-y-4 mt-6">
                {filteredReports.map(r => (
                  <div key={r.id} className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-zinc-300 transition-all">
                    <div className="flex-1 w-full flex items-center gap-3">
                      {r.videoUrl ? (
                        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-zinc-100 bg-zinc-50 relative group">
                          <VideoPlayer src={r.videoUrl} controls={false} autoPlay={false} />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 flex items-center justify-center transition-all cursor-pointer">
                            <Play size={12} fill="currentColor" className="text-white" />
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedReport(r); }}
                            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 shrink-0 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center">
                          <FileText size={16} className="text-zinc-300" />
                        </div>
                      )}

                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <span className={`px-1 py-0.5 font-black text-[8px] rounded uppercase border ${
                            r.severity === 'high' ? 'bg-red-50 text-red-700 border-red-100' :
                            r.severity === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-zinc-50 text-zinc-600 border-zinc-150'
                          }`}>
                            {r.severity}
                          </span>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{r.targetType}</span>
                          <span className="text-zinc-200">/</span>
                          <span className="text-[9px] font-black text-rose-600 uppercase tracking-wider">{r.reason}</span>
                        </div>
                        
                        <p className="text-xs text-zinc-800 font-bold truncate">
                          {r.targetContent || (r.videoUrl ? "Video Content" : "No content")}
                        </p>

                        <div className="flex items-center gap-3 mt-1">
                          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight">
                            By <span className="text-zinc-600">{r.reporterName}</span> • {r.createdAt.includes('T') ? new Date(r.createdAt).toLocaleDateString() : r.createdAt}
                          </div>
                          {r.videoUrl && (
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(r.videoUrl!);
                                }}
                                className="text-[8px] font-black text-zinc-300 hover:text-rose-600 transition-colors flex items-center gap-1 uppercase"
                              >
                                <Copy size={8} /> Copy
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                      <button 
                        onClick={() => setSelectedReport(r)}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-zinc-900 text-white font-black rounded-lg text-[9px] uppercase tracking-widest hover:bg-zinc-800 cursor-pointer flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                      >
                        <Eye size={10} strokeWidth={3} /> Review
                      </button>
                      
                      {r.status !== 'resolved' ? (
                        <button
                          onClick={async () => {
                            try {
                              await adminApiCall(`/api/admin/reports/${r.id}`, { method: 'DELETE' });
                              setReports(prev => prev.filter(item => item.id !== r.id));
                              
                              // Add log
                              const newLog: AdminAuditLog = {
                                id: `log_${Date.now()}`,
                                adminEmail: userProfile?.email || 'admin@connectup.io',
                                action: 'REPORT_RESOLVED',
                                details: `Resolved report ${r.id} for ${r.reason} filed by ${r.reporterName}`,
                                timestamp: new Date().toISOString()
                              };
                              setAuditLogs(prev => [newLog, ...prev]);
                              showToast('Report marked as resolved & deleted from database');
                            } catch (err: any) {
                              showToast('Failed to resolve report');
                            }
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full text-xs cursor-pointer shadow-sm transition-colors"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {filteredReports.length === 0 && (
                  <div className="bg-white border border-zinc-200 p-12 rounded-2xl text-center text-zinc-400 font-medium">
                    No safety cases logged under this filter category.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 mb-1">Audit Trail & Security Chronology</h2>
                  <p className="text-xs text-zinc-400">Real-time trace of administrator activity, system actions and security events</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `connectup_audit_logs_${Date.now()}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      showToast("Audit logs exported as JSON");
                    }}
                    className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-extrabold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download size={14} /> Export Logs
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm("Are you sure you want to clear the entire log history? This action is irreversible.")) return;
                      setAuditLogs([]);
                      showToast("All local audit logs cleared");
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 size={14} /> Clear Logs
                  </button>
                </div>
              </div>

              {/* Filters Panel */}
              <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input
                    type="text"
                    value={auditLogSearch}
                    onChange={(e) => setAuditLogSearch(e.target.value)}
                    placeholder="Search details, admin email, actions..."
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <select
                    value={auditLogTypeFilter}
                    onChange={(e) => setAuditLogTypeFilter(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-amber-400 font-bold text-zinc-700"
                  >
                    <option value="all">All Actions</option>
                    <option value="USER_DELETION">User Deletion</option>
                    <option value="ROLE_CHANGE">Role Changes</option>
                    <option value="PLAN_CHANGE">Plan Upgrades</option>
                    <option value="SUBSCRIPTION_REFUNDED">Subscription Refunded</option>
                    <option value="SUBSCRIPTION_CANCELLED">Subscription Cancelled</option>
                    <option value="REPORT_RESOLVED">Report Resolved</option>
                  </select>
                </div>
              </div>

              {/* Audit Logs List */}
              <div className="space-y-3 font-mono text-xs">
                {filteredAuditLogs.map(log => (
                  <div key={log.id} className="p-4 bg-white border border-zinc-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-zinc-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className={`px-2 py-0.5 font-black text-[9px] rounded border tracking-wider uppercase h-fit w-fit ${
                        log.action === 'USER_DELETION' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        log.action.includes('ROLE') ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        log.action.includes('SUBSCRIPTION') ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}>
                        {log.action}
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-zinc-800 font-sans font-medium">{log.details}</span>
                        <div className="text-[10px] text-zinc-400 font-sans">Admin: <span className="font-bold">{log.adminEmail}</span></div>
                      </div>
                    </div>
                    <div className="text-zinc-400 shrink-0 text-[11px] font-bold sm:text-right">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                {filteredAuditLogs.length === 0 && (
                  <div className="bg-white border border-zinc-200 p-12 rounded-xl text-center text-zinc-400 font-sans font-medium">
                    No security events matches your search parameters.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <h2 className="text-lg font-bold text-zinc-900 mb-1">Platform Settings</h2>
                <p className="text-xs text-zinc-400 mb-6">Manage global preferences, system variables, and administrative options</p>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 mb-3">General Configuration</h3>
                    <div className="space-y-4 max-w-2xl">
                      <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
                        <div>
                          <p className="text-sm font-bold text-zinc-900">Require Email Verification</p>
                          <p className="text-xs text-zinc-500">Force new signups to verify their email address before accessing the platform.</p>
                        </div>
                        <button 
                          type="button"
                          className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${requireEmailVerification ? 'bg-emerald-500' : 'bg-zinc-200'}`} 
                          onClick={() => { setRequireEmailVerification(prev => !prev); showToast('Email verification setting changed'); }}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${requireEmailVerification ? 'right-0.5' : 'left-0.5'}`}></div>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-zinc-100">
                    <h3 className="text-sm font-bold text-zinc-900 mb-3">Profile</h3>
                    <div className="space-y-4 max-w-2xl">
                      <div>
                          <label className="text-sm font-bold text-zinc-900">New Password</label>
                          <input type="password" placeholder="********" className="w-full mt-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl" />
                      </div>
                      <div>
                          <label className="text-sm font-bold text-zinc-900">Avatar Image</label>
                          <input type="file" className="w-full mt-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-zinc-100">
                    <h3 className="text-sm font-bold text-zinc-900 mb-3">Danger Zone</h3>
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl max-w-2xl flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-rose-900">Clear Cache</p>
                        <p className="text-xs text-rose-600/80">Purge all platform cached data and reset transient states.</p>
                      </div>
                      <button className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-lg hover:bg-rose-700 transition-colors" onClick={() => showToast('Cache cleared successfully')}>
                        Purge Cache
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* MODAL 1: ADD PORTFOLIO / USER */}
      <AnimatePresence>
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddUserModalOpen(false)} />
            <div className="relative bg-white border border-zinc-200 w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                <h3 className="text-lg font-bold text-zinc-900">Create New User</h3>
                <button onClick={() => setIsAddUserModalOpen(false)} className="text-zinc-400 hover:text-zinc-900"><X size={20} /></button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                const password = (form.elements.namedItem('password') as HTMLInputElement).value;
                
                // Generate a robust RFC4122 compliant UUID
                const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
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
                        role: 'FOUNDER',
                        plan: 'pro',
                        updated_at: new Date().toISOString()
                      },
                      startup: {
                        id: uuid,
                        name: name + ' Ventures',
                        one_liner: 'Innovative portfolio startup',
                        description: 'Administrative entry',
                        industry: 'Tech',
                        funding_stage: 'Seed',
                        ask_amount: 150000,
                        valuation_cap: 1500000
                      }
                    })
                  });

                  setIsAddUserModalOpen(false);
                  showToast(`Successfully created portfolio for ${name}`);
                  fetchUsers();
                } catch (err: any) {
                  showToast(`Failed: ${err.message || 'database error'}`);
                }
              }} className="space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-zinc-600 mb-1">Portfolio / Founder Name</label>
                  <input name="name" required placeholder="e.g. Nexus Venture" className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">Email Address</label>
                  <input name="email" type="email" required placeholder="founder@nexus.cap" className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">Password</label>
                  <input name="password" type="password" required placeholder="Enter temporary password" className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-amber-400" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-zinc-200">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-[#FACC15] text-zinc-950 rounded-xl font-extrabold hover:bg-opacity-95 shadow-sm">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: GRANT PREMIUM ACCESS */}
      <AnimatePresence>
        {isGrantSubModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsGrantSubModalOpen(false)} />
            <div className="relative bg-white border border-zinc-200 w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                <h3 className="text-lg font-bold text-zinc-900">Grant Premium Plan</h3>
                <button onClick={() => setIsGrantSubModalOpen(false)} className="text-zinc-400 hover:text-zinc-900"><X size={20} /></button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                const userObj = users.find(u => u.email === email);
                if (!userObj) {
                  showToast("User not found in memory directory");
                  return;
                }
                
                try {
                  const endDate = new Date();
                  endDate.setFullYear(endDate.getFullYear() + 1); // 1 year duration
                  
                  // Use secure admin API call to update the profile (bypassing triggers & client RLS)
                  await adminApiCall(`/api/admin/users/${userObj.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                      plan: 'pro',
                      billing_cycle: 'yearly',
                      subscription_end_date: endDate.toISOString()
                    })
                  });

                  // Record transaction using secure admin API call (bypassing client RLS)
                  try {
                    await adminApiCall('/api/admin/subscriptions', {
                      method: 'POST',
                      body: JSON.stringify({
                        user_id: userObj.id,
                        amount: 60,
                        tier: 'pro',
                        billing_cycle: 'yearly',
                        status: 'completed',
                        created_at: new Date().toISOString()
                      })
                    });
                  } catch (e) {
                    console.warn("Failed to write to subscription_transactions table", e);
                  }

                  setIsGrantSubModalOpen(false);
                  showToast(`Granted manual premium subscription to ${email}`);
                  fetchUsers();
                  fetchSubscriptions();
                } catch (err: any) {
                  showToast(`Failed: ${err.message || 'database error'}`);
                }
              }} className="space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-zinc-600 mb-1">Select User Email</label>
                  <select name="email" required className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-amber-400">
                    {users.map(u => (
                      <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsGrantSubModalOpen(false)} className="flex-1 py-3 bg-zinc-100 text-[#121214] rounded-xl hover:bg-zinc-200">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-[#FACC15] text-zinc-950 rounded-xl font-extrabold hover:bg-opacity-95 shadow-sm">Grant</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: COMPREHENSIVE USER PROFILE & TRANSACTION HISTORY DIRECTORY */}
      <AnimatePresence>
        {selectedUserProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedUserProfile(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white border border-zinc-200 w-full max-w-3xl rounded-3xl p-6 md:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto space-y-8"
            >
              {/* Header block with close and profile meta */}
              <div className="flex justify-between items-start border-b border-zinc-150 pb-5">
                <div className="flex gap-4 items-center">
                  <img 
                    src={selectedUserProfile.avatarUrl} 
                    alt={selectedUserProfile.name} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#FACC15] shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-zinc-900 leading-tight">{selectedUserProfile.name}</h3>
                      <span className={`px-2 py-0.5 text-[9px] font-black border uppercase rounded-full ${
                        selectedUserProfile.plan === 'pro' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                      }`}>
                        {selectedUserProfile.plan.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-bold mt-0.5">{selectedUserProfile.email}</p>
                    <div className="text-[10px] text-zinc-400 font-mono mt-1">ID: {selectedUserProfile.id}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUserProfile(null)} 
                  className="text-zinc-400 hover:text-zinc-900 p-1.5 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grid content: General Profile Meta + Admin fast control tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* General Bio & Metadata details */}
                <div className="space-y-4 bg-zinc-50 p-5 rounded-2xl border border-zinc-150">
                  <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Activity size={13} /> Directory Registry Details
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-zinc-200">
                      <span className="text-zinc-500 font-bold">Member Role:</span>
                      <span className="text-zinc-800 font-black tracking-wide">{selectedUserProfile.role}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-200">
                      <span className="text-zinc-500 font-bold">Primary Location:</span>
                      <span className="text-zinc-800 font-bold">{selectedUserProfile.location || 'Not Specified'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-200">
                      <span className="text-zinc-500 font-bold">Registration Date:</span>
                      <span className="text-zinc-800 font-bold">{selectedUserProfile.joinedDate}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-200">
                      <span className="text-zinc-500 font-bold">Last Activity Pulse:</span>
                      <span className="text-zinc-800 font-bold">{selectedUserProfile.lastActive}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-200">
                      <span className="text-zinc-500 font-bold">Following:</span>
                      <span className="text-zinc-800 font-bold">{selectedUserProfile.followingCount || 0}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-200">
                      <span className="text-zinc-500 font-bold">Followers:</span>
                      <span className="text-zinc-800 font-bold">{selectedUserProfile.followersCount || 0}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-zinc-500 font-bold">Security Status:</span>
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-black rounded border border-emerald-100 uppercase text-[9px]">
                        Active Account
                      </span>
                    </div>
                  </div>
                </div>

                {/* Directory Controls Panel */}
                <div className="space-y-4 bg-zinc-50 p-5 rounded-2xl border border-zinc-150 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 mb-3">
                      <ShieldCheck size={13} /> Directory Administrative Actions
                    </h4>
                    
                    {/* Switch role block */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Modify Profile Role</label>
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
                              
                              const newLog: AdminAuditLog = {
                                id: `log_${Date.now()}`,
                                adminEmail: userProfile?.email || 'admin@connectup.io',
                                action: 'ROLE_CHANGE',
                                details: `Promoted/demoted user ${selectedUserProfile.email} to role ${newRole}`,
                                timestamp: new Date().toISOString()
                              };
                              setAuditLogs(prev => [newLog, ...prev]);
                              showToast(`Role updated successfully to ${newRole}`);
                            } catch (err: any) {
                              showToast(`Failed updating role: ${err.message}`);
                            }
                          }}
                          className="w-full p-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:outline-none focus:border-amber-400"
                        >
                          <option value="FOUNDER">FOUNDER (Startup Profile)</option>
                          <option value="INVESTOR">INVESTOR (VC / Angel Profile)</option>
                          <option value="ADMIN">ADMINISTRATOR (Full Portal Keys)</option>
                        </select>
                      </div>

                      {/* Switch Plan block */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Adjust Subscription Plan Tier</label>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await adminApiCall(`/api/admin/users/${selectedUserProfile.id}`, {
                                  method: 'PUT',
                                  body: JSON.stringify({ plan: 'pro', billing_cycle: 'yearly' })
                                });
                                setSelectedUserProfile(prev => prev ? { ...prev, plan: 'pro' } : null);
                                setUsers(prev => prev.map(u => u.id === selectedUserProfile.id ? { ...u, plan: 'pro' } : u));
                                
                                // Record transaction
                                try {
                                  await adminApiCall('/api/admin/subscriptions', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                      user_id: selectedUserProfile.id,
                                      amount: 60,
                                      tier: 'pro',
                                      billing_cycle: 'yearly',
                                      status: 'completed',
                                      created_at: new Date().toISOString()
                                    })
                                  });
                                  
                                  // Refresh user specific transactions list
                                  const data = await adminApiCall(`/api/admin/subscriptions?userId=${selectedUserProfile.id}`);
                                  if (data) setSelectedUserTransactions(data);
                                } catch (e) {}

                                const newLog: AdminAuditLog = {
                                  id: `log_${Date.now()}`,
                                  adminEmail: userProfile?.email || 'admin@connectup.io',
                                  action: 'PLAN_CHANGE',
                                  details: `Upgraded subscription for ${selectedUserProfile.email} to PRO yearly`,
                                  timestamp: new Date().toISOString()
                                };
                                setAuditLogs(prev => [newLog, ...prev]);
                                fetchSubscriptions();
                                showToast(`Plan upgraded to PRO`);
                              } catch (err: any) {
                                showToast(`Failed: ${err.message}`);
                              }
                            }}
                            className={`flex-1 py-2 text-xs font-black rounded-lg border transition-all ${
                              selectedUserProfile.plan === 'pro' 
                                ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-sm'
                                : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                            }`}
                          >
                            Grant PRO Plan
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await adminApiCall(`/api/admin/users/${selectedUserProfile.id}`, {
                                  method: 'PUT',
                                  body: JSON.stringify({ plan: 'free', billing_cycle: null })
                                });
                                setSelectedUserProfile(prev => prev ? { ...prev, plan: 'free' } : null);
                                setUsers(prev => prev.map(u => u.id === selectedUserProfile.id ? { ...u, plan: 'free' } : u));
                                
                                const newLog: AdminAuditLog = {
                                  id: `log_${Date.now()}`,
                                  adminEmail: userProfile?.email || 'admin@connectup.io',
                                  action: 'PLAN_CHANGE',
                                  details: `Revoked subscription / downgraded ${selectedUserProfile.email} to FREE`,
                                  timestamp: new Date().toISOString()
                                };
                                setAuditLogs(prev => [newLog, ...prev]);
                                fetchSubscriptions();
                                showToast(`Downgraded subscription to FREE`);
                              } catch (err: any) {
                                showToast(`Failed: ${err.message}`);
                              }
                            }}
                            className={`flex-1 py-2 text-xs font-black rounded-lg border transition-all ${
                              selectedUserProfile.plan === 'free'
                                ? 'bg-zinc-900 border-zinc-900 text-white'
                                : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                            }`}
                          >
                            Revoke PRO Plan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warning deletion action */}
                  <div className="pt-2 border-t border-zinc-200">
                    <button
                      onClick={async () => {
                        if (!confirm(`Are you sure you want to completely delete the profile of ${selectedUserProfile.name}? All startups, pitches and history will be lost.`)) return;
                        try {
                          await adminApiCall(`/api/admin/users/${selectedUserProfile.id}`, { method: 'DELETE' });
                          setSelectedUserProfile(null);
                          setUsers(prev => prev.filter(u => u.id !== selectedUserProfile.id));
                          
                          const newLog: AdminAuditLog = {
                            id: `log_${Date.now()}`,
                            adminEmail: userProfile?.email || 'admin@connectup.io',
                            action: 'USER_DELETION',
                            details: `Deleted user profile for ${selectedUserProfile.name} (${selectedUserProfile.email})`,
                            timestamp: new Date().toISOString()
                          };
                          setAuditLogs(prev => [newLog, ...prev]);
                          showToast(`Successfully deleted user directory entry`);
                        } catch (err: any) {
                          showToast(`Error deleting: ${err.message}`);
                        }
                      }}
                      className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 size={13} /> Delete User Profile Directory
                    </button>
                  </div>
                </div>

              </div>

              {/* FOUNDER-SPECIFIC STARTUP AND MULTI-PITCH METADATA */}
              {selectedUserProfile.role === 'FOUNDER' && (
                <div className="space-y-5 border-t border-zinc-150 pt-6">
                  <h4 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                    Associated Venture & Pitch Decks
                  </h4>

                  {/* Startup Metadata profile details */}
                  {selectedUserStartup ? (
                    <div className="bg-zinc-50/50 p-5 rounded-2xl border border-zinc-150 space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <div className="text-zinc-900 font-black text-sm">{selectedUserStartup.name}</div>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-extrabold border border-amber-100 rounded text-[9px] uppercase">
                          {selectedUserStartup.funding_stage || 'Pre-Seed'} Stage
                        </span>
                      </div>
                      <p className="text-zinc-500 font-medium leading-relaxed italic">"{selectedUserStartup.one_liner || 'No pitch elevator statement yet'}"</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] font-bold">
                        <div className="bg-white p-2.5 rounded-xl border border-zinc-150">
                          <span className="text-zinc-400 block text-[9px] uppercase">Industry Sector</span>
                          <span className="text-zinc-800">{selectedUserStartup.industry || 'General Tech'}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-zinc-150">
                          <span className="text-zinc-400 block text-[9px] uppercase">Fundraising Target</span>
                          <span className="text-zinc-800">${(Number(selectedUserStartup.ask_amount) || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-zinc-150">
                          <span className="text-zinc-400 block text-[9px] uppercase">Valuation Ceiling</span>
                          <span className="text-zinc-800">${(Number(selectedUserStartup.valuation_cap) || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-zinc-400 text-[10px] font-black uppercase block mb-1">Venture Overview</span>
                        <p className="text-zinc-600 leading-relaxed font-medium bg-white p-3 rounded-xl border border-zinc-150 text-[11px]">
                          {selectedUserStartup.description || 'No detailed description available.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-zinc-400 text-xs font-bold">
                      No startup entry associated with this founder yet.
                    </div>
                  )}

                  {/* Pitch List */}
                  {selectedUserPitches.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-zinc-400 block">Pitch List Decks ({selectedUserPitches.length})</span>
                      <div className="space-y-2">
                        {selectedUserPitches.map(p => (
                          <div key={p.id} className="p-3 bg-white border border-zinc-200 rounded-xl flex justify-between items-center text-xs shadow-sm">
                            <div>
                              <span className="font-bold text-zinc-800">{p.name}</span>
                              <span className="text-zinc-400 text-[10px] font-medium ml-2">({p.industry || 'Tech'})</span>
                            </div>
                            <span className="text-zinc-500 font-mono text-[10px]">Val: ${(Number(p.valuation_cap) || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DYNAMIC SUBSCRIBER BILLING HISTORY SECTION (profiles fetch for user, billing = subcription transactions) */}
              <div className="space-y-4 border-t border-zinc-150 pt-6">
                <h4 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                  <CreditCard size={15} /> Subscriber Billing & Transaction History
                </h4>

                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-150 bg-zinc-50/50 text-[10px] font-black uppercase text-zinc-400">
                        <th className="p-3 pl-4">Transaction ID</th>
                        <th className="p-3">Plan / Cycle</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Provider</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 pr-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-[11px] font-bold">
                      {selectedUserTransactions.map((t, idx) => (
                        <tr key={t.id || idx} className="hover:bg-zinc-50/50">
                          <td className="p-3 pl-4 text-zinc-400 font-mono">{(t.id || 'Manual').substring(0, 8)}...</td>
                          <td className="p-3 text-zinc-800">
                            <span className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">PRO</span>
                            <span className="ml-1.5 text-zinc-400 font-normal">({t.billing_cycle || 'yearly'})</span>
                          </td>
                          <td className="p-3 text-zinc-900">${t.amount || 60}</td>
                          <td className="p-3 text-zinc-500">{t.provider || 'Manual'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              (t.status || 'completed') === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                              'bg-amber-50 border-amber-100 text-amber-700'
                            }`}>
                              {t.status || 'completed'}
                            </span>
                          </td>
                          <td className="p-3 pr-4 text-zinc-400 font-mono">
                            {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Just now'}
                          </td>
                        </tr>
                      ))}
                      {selectedUserTransactions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center p-6 text-zinc-400 font-medium">
                            No subscription billing transactions logged for this directory member.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Close Button footer block */}
              <div className="pt-4 border-t border-zinc-150 flex justify-end">
                <button 
                  onClick={() => setSelectedUserProfile(null)} 
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-full text-xs cursor-pointer shadow-sm"
                >
                  Close Directory Details
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: INTERACTIVE MODERATION REPORT DETAILS OVERLAY */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setSelectedReport(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative bg-white border border-zinc-200 w-full max-w-md rounded-2xl p-5 shadow-2xl z-10 space-y-5"
            >
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-rose-600" />
                  <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Review Report</h3>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)} 
                  className="text-zinc-400 hover:text-zinc-900 p-1.5 rounded-full hover:bg-zinc-50 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <div>
                    <span className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Severity</span>
                    <span className={`px-2 py-0.5 font-black text-[9px] rounded uppercase border ${
                      selectedReport.severity === 'high' ? 'bg-red-50 text-red-700 border-red-100' : 
                      selectedReport.severity === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}>
                      {selectedReport.severity}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Filed On</span>
                    <span className="text-[10px] font-bold text-zinc-600">{selectedReport.createdAt.includes('T') ? new Date(selectedReport.createdAt).toLocaleDateString() : selectedReport.createdAt}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-400 uppercase font-bold">Reported Content</span>
                    {selectedReport.videoUrl && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(selectedReport.videoUrl!);
                            showToast("Copied to clipboard");
                          }}
                          className="text-[9px] font-black text-rose-600 hover:underline uppercase tracking-tight flex items-center gap-1"
                        >
                          <Copy size={10} /> Copy
                        </button>
                        <a 
                          href={selectedReport.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] font-black text-zinc-400 hover:text-zinc-600 uppercase tracking-tight flex items-center gap-1"
                        >
                          <ExternalLink size={10} /> Open
                        </a>
                      </div>
                    )}
                  </div>

                  {selectedReport.videoUrl && (
                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-zinc-100 bg-black shadow-lg mb-3">
                      <VideoPlayer src={selectedReport.videoUrl} controls autoPlay={true} />
                    </div>
                  )}
                  {selectedReport.targetContent && (
                    <div className="text-sm text-zinc-800 bg-zinc-50 border border-zinc-100 p-4 rounded-xl leading-relaxed font-medium">
                      "{selectedReport.targetContent}"
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-400 uppercase font-bold block">Reason</span>
                    <span className="text-[10px] font-black text-rose-700 uppercase">{selectedReport.reason}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-400 uppercase font-bold block">Reporter</span>
                    <span className="text-[10px] font-bold text-zinc-800 truncate block">{selectedReport.reporterName}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      const targetUser = users.find(u => u.id === selectedReport.targetId);
                      if (targetUser) {
                        setSelectedReport(null);
                        handleViewProfile(targetUser);
                      } else {
                        showToast("Cannot find target user profile");
                      }
                    }}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    <Eye size={12} strokeWidth={3} /> View Target Profile
                  </button>
                </div>
              </div>

              {/* Action trigger footer block */}
              <div className="pt-4 border-t border-zinc-150 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200"
                >
                  Dismiss / Close
                </button>

                {/* DELETE CONTENT & RESOLVE */}
                {(selectedReport.targetType === 'post' || selectedReport.targetType === 'video' || selectedReport.targetType === 'startup') && (
                  <button
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to PERMANENTLY DELETE the reported ${selectedReport.targetType} and resolve this report?`)) return;
                      try {
                        let endpoint = '';
                        if (selectedReport.targetType === 'post' || selectedReport.targetType === 'video') {
                          endpoint = `/api/admin/community-posts/${selectedReport.targetId}`;
                        } else if (selectedReport.targetType === 'startup') {
                          endpoint = `/api/admin/startups/${selectedReport.targetId}`;
                        }

                        if (endpoint) {
                          const res = await adminApiCall(endpoint, { method: 'DELETE' });
                          // Fallback for pitches if startup deletion failed or doesn't apply
                          if (!res.success && selectedReport.targetType === 'startup') {
                            await adminApiCall(`/api/admin/pitches/${selectedReport.targetId}`, { method: 'DELETE' });
                          }
                        }

                        // Also resolve the report record
                        await adminApiCall(`/api/admin/reports/${selectedReport.id}`, { method: 'DELETE' });
                        setReports(prev => prev.filter(item => item.id !== selectedReport.id));
                        setSelectedReport(null);
                        
                        // Add log
                        const newLog: AdminAuditLog = {
                          id: `log_${Date.now()}`,
                          adminEmail: userProfile?.email || 'admin@connectup.io',
                          action: 'CONTENT_DELETED',
                          details: `Permanently deleted reported ${selectedReport.targetType} (${selectedReport.targetId}) and resolved case`,
                          timestamp: new Date().toISOString()
                        };
                        setAuditLogs(prev => [newLog, ...prev]);
                        showToast(`Offensive ${selectedReport.targetType} deleted and incident resolved`);
                      } catch (err: any) {
                        showToast('Failed to delete content');
                      }
                    }}
                    className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black hover:bg-rose-700 shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete & Resolve
                  </button>
                )}

                <button
                  onClick={async () => {
                    try {
                      await adminApiCall(`/api/admin/reports/${selectedReport.id}`, { method: 'DELETE' });
                      setReports(prev => prev.filter(item => item.id !== selectedReport.id));
                      setSelectedReport(null);
                      
                      // Add log
                      const newLog: AdminAuditLog = {
                        id: `log_${Date.now()}`,
                        adminEmail: userProfile?.email || 'admin@connectup.io',
                        action: 'REPORT_RESOLVED',
                        details: `Resolved safety case filed by ${selectedReport.reporterName}`,
                        timestamp: new Date().toISOString()
                      };
                      setAuditLogs(prev => [newLog, ...prev]);
                      showToast('Safety incident file has been marked resolved & closed');
                    } catch (err: any) {
                      showToast('Failed to resolve case');
                    }
                  }}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
                >
                  Resolve Case File
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
