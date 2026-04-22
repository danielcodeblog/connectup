
export enum UserRole {
  FOUNDER = 'FOUNDER',
  INVESTOR = 'INVESTOR'
}

export type AppState = 'SPLASH' | 'ONBOARDING' | 'AUTH' | 'MAIN_APP';

// UI Types (Domain Entities)

export interface FundingRound {
  id: string;
  round: string;
  amount: string;
  date: string;
  investor: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
}

export interface StartupMetrics {
  mrr?: number;
  users?: number;
  growth?: number;
  shares?: number;
  views?: number;
  likes?: number;
}

export interface FounderProfile {
  name: string;
  avatarUrl: string;
  role: string;
  email?: string;
  location?: string;
}

export interface Startup {
  id: string;
  name: string;
  oneLiner: string;
  description: string;
  industry: string;
  fundingStage: string;
  askAmount: number;
  valuationCap?: number;
  imageUrl?: string;
  videoUrl?: string;
  tags: string[];
  founder: FounderProfile;
  metrics: StartupMetrics;
  fundingHistory?: FundingRound[];
  team?: TeamMember[];
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[]; // List of user IDs who reacted
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  type: 'text' | 'audio' | 'document' | 'image';
  duration?: number;
  fileName?: string;
  fileSize?: string;
  timestamp: Date | string;
  isMe: boolean;
  reactions?: Reaction[];
  status?: 'sent' | 'delivered' | 'read';
}

export interface ChatSession {
  id: string;
  startupId?: string; // Optional because it might be an investor-investor chat in future
  startupName: string;
  investorName?: string;
  subtitle?: string; // e.g. "Founder @ StartupName" or "Investor Title"
  avatarUrl: string;
  founderAvatarUrl?: string;
  lastMessage: string;
  timestamp: Date | string;
  unread: number;
}

export interface CommunityComment {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  author: string;
  role: string;
  avatar: string;
  authorVerified: boolean;
  content: string;
  imageUrl?: string;
  tags: string[];
  likes: number;
  comments: number;
  time: string;
  isLiked: boolean;
  isFollowingAuthor?: boolean;
  commentsList?: CommunityComment[];
}

export interface Meeting {
  id: string;
  title: string;
  guestName: string;
  guestEmail?: string;
  guestAvatar?: string;
  date: string; // ISO String
  duration: number; // minutes
  type: 'Video' | 'Phone' | 'In-Person';
  status: 'confirmed' | 'pending' | 'completed';
  meetingLink?: string;
}
