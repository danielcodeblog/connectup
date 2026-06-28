
export interface FounderData {
  id: number;
  name: string;
  title: string;
  tagline: string;
  seeking: string;
  industry: string;
  stage: string;
  members: number;
  image: string;
}

export const FOUNDERS: FounderData[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    title: 'AI/ML Startup',
    tagline: 'Building autonomous solutions for healthcare diagnostics.',
    seeking: '$500K - $1M',
    industry: 'HealthTech',
    stage: 'Seed',
    members: 3,
    image: 'linear-gradient(135deg, #EAB308 0%, #FFA500 100%)'
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    title: 'FinTech Revolution',
    tagline: 'Democratizing algorithmic trading for retail investors.',
    seeking: '$1M - $2.5M',
    industry: 'FinTech',
    stage: 'Series A',
    members: 12,
    image: 'linear-gradient(135deg, #EAB308 0%, #FF8C00 100%)'
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    title: 'Sustainable Logistics',
    tagline: 'Zero-emission last-mile delivery network leveraging e-bikes.',
    seeking: '$750K',
    industry: 'Logistics',
    stage: 'Pre-Seed',
    members: 5,
    image: 'linear-gradient(135deg, #EAB308 0%, #D4AF37 100%)'
  },
  {
    id: 4,
    name: 'David Kim',
    title: 'Web3 Gaming',
    tagline: 'True asset ownership in massive multiplayer universes.',
    seeking: '$2M',
    industry: 'Gaming',
    stage: 'Seed',
    members: 8,
    image: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)'
  },
  {
    id: 5,
    name: 'Aisha Patel',
    title: 'EdTech Platform',
    tagline: 'Personalized AI tutors for K-12 students in emerging markets.',
    seeking: '$300K',
    industry: 'EdTech',
    stage: 'Pre-Seed',
    members: 2,
    image: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)'
  }
];
