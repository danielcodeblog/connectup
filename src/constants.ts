
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
  avatarUrl?: string;
  location?: string;
  mrr?: string;
}

export const FOUNDERS: FounderData[] = [
  {
    id: 1,
    name: "Elena Rostova",
    title: "Founder & CEO, NeuralPulse AI",
    tagline: "Autonomous real-time edge AI for predictive medical diagnostics and patient monitoring.",
    seeking: "$2.5M Seed",
    industry: "HealthTech / AI",
    stage: "Seed",
    members: 8,
    location: "San Francisco, CA",
    mrr: "$45K MRR",
    image: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    name: "Marcus Vance",
    title: "Co-Founder, FluxEnergy",
    tagline: "Next-gen solid-state battery architecture quadrupling EV range with zero thermal runaway risk.",
    seeking: "$5.0M Series A",
    industry: "CleanTech / Hardware",
    stage: "Series A",
    members: 14,
    location: "Austin, TX",
    mrr: "$120K MRR",
    image: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    name: "Aria Chen",
    title: "CEO & Founder, QuantumShield",
    tagline: "Post-quantum cryptographic key distribution infrastructure for enterprise financial networks.",
    seeking: "$3.8M Seed",
    industry: "Cybersecurity / FinTech",
    stage: "Seed",
    members: 11,
    location: "Boston, MA",
    mrr: "$68K MRR",
    image: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    name: "David O'Connor",
    title: "Co-Founder, HyperScale Logistics",
    tagline: "AI-driven autonomous freight routing and port optimization reducing carbon emissions by 35%.",
    seeking: "$1.8M Pre-Seed",
    industry: "Supply Chain / Logistics",
    stage: "Pre-Seed",
    members: 6,
    location: "Seattle, WA",
    mrr: "$28K MRR",
    image: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: 5,
    name: "Sophia Martinez",
    title: "Founder, BioSynth AI",
    tagline: "Generative protein design platform accelerating biopharmaceutical drug discovery from years to weeks.",
    seeking: "$4.2M Seed",
    industry: "BioTech / DeepTech",
    stage: "Seed",
    members: 9,
    location: "Cambridge, MA",
    mrr: "$85K MRR",
    image: "linear-gradient(135deg, #DB2777 0%, #EC4899 100%)",
    avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80"
  }
];
