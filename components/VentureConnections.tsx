import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, RotateCcw, Check, Sparkles, AlertCircle, HelpCircle, 
  ChevronRight, ArrowLeft, Crown, HelpCircle as HintIcon, Info, RefreshCw,
  Sun, Moon, Zap, Type, PieChart, Flame, GitFork, Trophy, Play, Footprints
} from 'lucide-react';

// ==========================================
// TYPES & CONSTANTS
// ==========================================

export type GameType = 'pinpoint' | 'crossclimb' | 'queens' | 'connections' | 'wordle' | 'tango' | 'pitch' | 'equity' | 'zip';

interface PuzzleState {
  pinpoint: 'unplayed' | 'completed';
  crossclimb: 'unplayed' | 'completed';
  queens: 'unplayed' | 'completed';
  connections: 'unplayed' | 'completed';
  wordle: 'unplayed' | 'completed';
  tango: 'unplayed' | 'completed';
  pitch: 'unplayed' | 'completed';
  equity: 'unplayed' | 'completed';
  zip: 'unplayed' | 'completed';
}

// ------------------------------------------
// PINPOINT GAME DATA
// ------------------------------------------
interface PinpointPuzzle {
  id: number;
  correctCategory: string;
  clues: string[];
  options: string[];
}

const PINPOINT_PUZZLES: PinpointPuzzle[] = [
  {
    id: 1,
    correctCategory: "Silicon Valley Titans",
    clues: [
      "Known for 'move fast and break things'",
      "Acquired Instagram and WhatsApp",
      "Rebranded to a metaverse-focused name in 2021",
      "Founded in a Harvard dorm room",
      "Meta (formerly Facebook)"
    ],
    options: ["Silicon Valley Titans", "Hardware Manufacturers", "Venture Capitalists", "E-commerce Giants"]
  },
  {
    id: 2,
    correctCategory: "Startup Exits",
    clues: [
      "Process of offering shares to the public for the first time",
      "Requires a prospectus and SEC approval",
      "Often involves a 'roadshow' to pitch to investors",
      "Examples include SnowFlake and Airbnb in 2020",
      "Initial Public Offering (IPO)"
    ],
    options: ["Startup Exits", "Bootstrapping Strategies", "Agile Methodologies", "Marketing Funnels"]
  },
  {
    id: 3,
    correctCategory: "Term Sheet Clauses",
    clues: [
      "Protects investors from dilution in future down rounds",
      "Can be 'full ratchet' or 'weighted average'",
      "Adjusts the conversion price of preferred stock",
      "A heavily negotiated term in venture deals",
      "Anti-Dilution Provision"
    ],
    options: ["Term Sheet Clauses", "SaaS Pricing Models", "Cloud Security Protocols", "Employee Perks"]
  },
  {
    id: 4,
    correctCategory: "Famous Tech Hubs",
    clues: [
      "Located in the southern part of the San Francisco Bay Area",
      "Home to Stanford University and Sand Hill Road",
      "Birthplace of companies like HP, Intel, and Apple",
      "Synonymous with the global tech industry",
      "Silicon Valley"
    ],
    options: ["Famous Tech Hubs", "Financial Districts", "Crypto Valleys", "Manufacturing Centers"]
  },
  {
    id: 5,
    correctCategory: "Unicorn Startups",
    clues: [
      "Pioneered online payments and developer-friendly APIs",
      "Founded by Irish brothers Patrick and John Collison",
      "Valued over $50B in venture funding rounds",
      "Powers online payments for millions of businesses worldwide",
      "Stripe"
    ],
    options: ["Unicorn Startups", "Legacy Banks", "Social Networks", "Cloud Infrastructure"]
  },
  {
    id: 6,
    correctCategory: "AI Foundations",
    clues: [
      "Architecture introduced in Google's landmark 'Attention Is All You Need' paper",
      "Powers modern Large Language Models like GPT-4 and Gemini",
      "Replaced traditional recurrent neural networks for NLP",
      "Utilizes self-attention mechanisms for parallel processing",
      "Transformer Architecture"
    ],
    options: ["AI Foundations", "Database Systems", "Operating Systems", "Networking Protocols"]
  },
  {
    id: 7,
    correctCategory: "Growth Metrics",
    clues: [
      "Represents the average dollar amount generated per active user",
      "Calculated as Total Revenue divided by Total Active Users",
      "Crucial for evaluating monetisation efficiency in SaaS and Consumer Tech",
      "Abbreviated as ARPU",
      "Average Revenue Per User"
    ],
    options: ["Growth Metrics", "Legal Compliance", "Hardware Specifications", "Security Audits"]
  }
];

// ------------------------------------------
// QUEENS GAME DATA
// ------------------------------------------
interface QueensPuzzle {
  id: number;
  board: number[][];
  solution: Set<string>;
}

const QUEENS_PUZZLES: QueensPuzzle[] = [
  {
    id: 1,
    board: [
      [0, 0, 1, 1, 1],
      [0, 3, 2, 1, 1],
      [0, 2, 2, 2, 4],
      [3, 3, 2, 4, 4],
      [3, 3, 3, 4, 4]
    ],
    solution: new Set(["0,3", "1,0", "2,2", "3,4", "4,1"])
  },
  {
    id: 2,
    board: [
      [0, 0, 0, 1, 1],
      [2, 0, 1, 1, 1],
      [2, 2, 3, 3, 1],
      [2, 2, 4, 3, 3],
      [4, 4, 4, 4, 3]
    ],
    solution: new Set(["0,4", "1,1", "2,3", "3,0", "4,2"])
  },
  {
    id: 3,
    board: [
      [0, 0, 1, 1, 2],
      [0, 0, 1, 1, 2],
      [3, 0, 1, 2, 2],
      [3, 3, 4, 4, 2],
      [3, 3, 4, 4, 4]
    ],
    solution: new Set(["0,0", "1,2", "2,4", "3,1", "4,3"])
  },
  {
    id: 4,
    board: [
      [1, 1, 2, 2, 4],
      [1, 1, 2, 2, 4],
      [1, 1, 2, 3, 4],
      [0, 1, 0, 3, 3],
      [0, 0, 0, 3, 3]
    ],
    solution: new Set(["0,2", "1,4", "2,1", "3,3", "4,0"])
  },
  {
    id: 5,
    board: [
      [1, 1, 1, 3, 3],
      [1, 1, 1, 3, 3],
      [0, 2, 2, 2, 4],
      [0, 0, 2, 2, 4],
      [0, 0, 4, 4, 4]
    ],
    solution: new Set(["0,3", "1,1", "2,4", "3,2", "4,0"])
  }
];

const QUEENS_REGION_COLORS = [
  "bg-amber-500/25 border-amber-500/40 text-amber-300",
  "bg-blue-500/25 border-blue-500/40 text-blue-300",
  "bg-emerald-500/25 border-emerald-500/40 text-emerald-300",
  "bg-purple-500/25 border-purple-500/40 text-purple-300",
  "bg-rose-500/25 border-rose-500/40 text-rose-300"
];

// ------------------------------------------
// CROSSCLIMB GAME DATA
// ------------------------------------------
interface WordLadderStep {
  word: string;
  clue: string;
}

interface CrossclimbPuzzle {
  id: number;
  name: string;
  steps: WordLadderStep[];
  startingScramble: string[];
}

const CROSSCLIMB_PUZZLES: CrossclimbPuzzle[] = [
  {
    id: 1,
    name: "The Founder's Journey",
    steps: [
      { word: "SEED", clue: "The earliest stage of venture funding" },
      { word: "SEND", clue: "What a founder does with a pitch deck email" },
      { word: "SAND", clue: "A material heavily associated with Silicon Valley's Sand Hill Road" },
      { word: "BAND", clue: "A group of co-founders working closely together" }
    ],
    startingScramble: ["SAND", "SEED", "BAND", "SEND"]
  },
  {
    id: 2,
    name: "Code and Capital",
    steps: [
      { word: "CODE", clue: "The foundational building blocks of software" },
      { word: "CORE", clue: "The central, most important feature of a product" },
      { word: "CURE", clue: "What a disruptive health-tech startup aims to find" },
      { word: "PURE", clue: "A company that focuses solely on one specific product is a ___ play" }
    ],
    startingScramble: ["CURE", "CODE", "PURE", "CORE"]
  },
  {
    id: 3,
    name: "The Scaling Loop",
    steps: [
      { word: "BURN", clue: "The rate at which a startup spends its venture capital" },
      { word: "TURN", clue: "When a startup decides to pivot its business model" },
      { word: "TORN", clue: "How a founder feels when choosing between two term sheets" },
      { word: "HORN", clue: "What a startup unicorn has on its head" }
    ],
    startingScramble: ["TORN", "BURN", "HORN", "TURN"]
  },
  {
    id: 4,
    name: "Market Velocity",
    steps: [
      { word: "FUND", clue: "Capital pooled by venture capitalists" },
      { word: "FIND", clue: "What investors do when searching for top founders" },
      { word: "FINE", clue: "A high quality or acceptable pitch" },
      { word: "LINE", clue: "A sequence of code or a queue of investors" }
    ],
    startingScramble: ["FINE", "FUND", "LINE", "FIND"]
  },
  {
    id: 5,
    name: "Tech Stack Ascent",
    steps: [
      { word: "DATA", clue: "Raw information used for business analytics" },
      { word: "DATE", clue: "A milestone scheduled on a startup roadmap" },
      { word: "RATE", clue: "The speed of growth or interest percentage" },
      { word: "RACE", clue: "The fast-paced competition to win market share" }
    ],
    startingScramble: ["RATE", "DATA", "RACE", "DATE"]
  }
];

// ------------------------------------------
// VENTURE CONNECTIONS GAME DATA
// ------------------------------------------
interface Category {
  title: string;
  words: string[];
  color: string;
  bgColor: string;
  textColor: string;
}

interface Puzzle {
  id: number;
  name: string;
  categories: Category[];
}

const CONNECTIONS_PUZZLES: Puzzle[] = [
  {
    id: 1,
    name: "The Cap Table",
    categories: [
      {
        title: "STARTUP ROLES",
        words: ["FOUNDER", "INVESTOR", "ADVISOR", "EMPLOYEE"],
        color: "border-yellow-500",
        bgColor: "bg-yellow-500/20",
        textColor: "text-yellow-300"
      },
      {
        title: "VALUATION TERMS",
        words: ["PRE-MONEY", "POST-MONEY", "CAP", "DISCOUNT"],
        color: "border-emerald-500",
        bgColor: "bg-emerald-500/20",
        textColor: "text-emerald-300"
      },
      {
        title: "TYPES OF ROUNDS",
        words: ["ANGEL", "PRE-SEED", "SERIES A", "MEZZANINE"],
        color: "border-blue-500",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-300"
      },
      {
        title: "EQUITY INSTRUMENTS",
        words: ["OPTIONS", "WARRANTS", "SAFE", "RSU"],
        color: "border-purple-500",
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-300"
      }
    ]
  },
  {
    id: 2,
    name: "Growth & Marketing",
    categories: [
      {
        title: "GROWTH TACTICS",
        words: ["VIRAL", "REFERRAL", "ORGANIC", "PAID"],
        color: "border-yellow-500",
        bgColor: "bg-yellow-500/20",
        textColor: "text-yellow-300"
      },
      {
        title: "USER METRICS",
        words: ["MAU", "DAU", "ARPU", "NPS"],
        color: "border-emerald-500",
        bgColor: "bg-emerald-500/20",
        textColor: "text-emerald-300"
      },
      {
        title: "GO-TO-MARKET",
        words: ["INBOUND", "OUTBOUND", "CHANNEL", "DIRECT"],
        color: "border-blue-500",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-300"
      },
      {
        title: "FUNNEL STAGES",
        words: ["AWARENESS", "INTEREST", "DECISION", "ACTION"],
        color: "border-purple-500",
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-300"
      }
    ]
  },
  {
    id: 3,
    name: "Product & Engineering",
    categories: [
      {
        title: "DEV METHODOLOGIES",
        words: ["AGILE", "SCRUM", "KANBAN", "WATERFALL"],
        color: "border-yellow-500",
        bgColor: "bg-yellow-500/20",
        textColor: "text-yellow-300"
      },
      {
        title: "PRODUCT MILESTONES",
        words: ["MVP", "BETA", "LAUNCH", "V2"],
        color: "border-emerald-500",
        bgColor: "bg-emerald-500/20",
        textColor: "text-emerald-300"
      },
      {
        title: "TECH INFRASTRUCTURE",
        words: ["CLOUD", "SERVER", "DATABASE", "API"],
        color: "border-blue-500",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-300"
      },
      {
        title: "DESIGN ELEMENTS",
        words: ["WIREFRAME", "MOCKUP", "PROTOTYPE", "UI/UX"],
        color: "border-purple-500",
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-300"
      }
    ]
  },
  {
    id: 4,
    name: "Venture Capital & Deal Flow",
    categories: [
      {
        title: "STAGES OF FUNDING",
        words: ["SEED", "SERIES A", "SERIES B", "GROWTH"],
        color: "border-yellow-500",
        bgColor: "bg-yellow-500/20",
        textColor: "text-yellow-300"
      },
      {
        title: "PITCH DECK SLIDES",
        words: ["PROBLEM", "SOLUTION", "TRACTION", "TAM"],
        color: "border-emerald-500",
        bgColor: "bg-emerald-500/20",
        textColor: "text-emerald-300"
      },
      {
        title: "VC DUE DILIGENCE",
        words: ["CAP TABLE", "METRICS", "FINANCIALS", "IP"],
        color: "border-blue-500",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-300"
      },
      {
        title: "EXIT PATHWAYS",
        words: ["ACQUISITION", "IPO", "SPAC", "BUYOUT"],
        color: "border-purple-500",
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-300"
      }
    ]
  },
  {
    id: 5,
    name: "AI & Machine Learning",
    categories: [
      {
        title: "AI MODEL TYPES",
        words: ["LLM", "CNN", "RNN", "TRANSFORMER"],
        color: "border-yellow-500",
        bgColor: "bg-yellow-500/20",
        textColor: "text-yellow-300"
      },
      {
        title: "TRAINING CONCEPTS",
        words: ["WEIGHTS", "BIAS", "EPOCH", "DATASET"],
        color: "border-emerald-500",
        bgColor: "bg-emerald-500/20",
        textColor: "text-emerald-300"
      },
      {
        title: "POPULAR FRAMEWORKS",
        words: ["PYTORCH", "KERAS", "JAX", "TENSORFLOW"],
        color: "border-blue-500",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-300"
      },
      {
        title: "AI APPLICATION AREAS",
        words: ["VISION", "NLP", "ROBOTICS", "SPEECH"],
        color: "border-purple-500",
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-300"
      }
    ]
  },
  {
    id: 6,
    name: "Fintech & Web3",
    categories: [
      {
        title: "PAYMENT METHODS",
        words: ["ACH", "SWIFT", "STRIPE", "WIRE"],
        color: "border-yellow-500",
        bgColor: "bg-yellow-500/20",
        textColor: "text-yellow-300"
      },
      {
        title: "DEFI CONCEPTS",
        words: ["STAKING", "SWAP", "LENDING", "YIELD"],
        color: "border-emerald-500",
        bgColor: "bg-emerald-500/20",
        textColor: "text-emerald-300"
      },
      {
        title: "BANKING INFRASTRUCTURE",
        words: ["NEOBANK", "LEDGER", "ESCROW", "CLEARING"],
        color: "border-blue-500",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-300"
      },
      {
        title: "BLOCKCHAIN BASICS",
        words: ["BLOCK", "HASH", "NODE", "WALLET"],
        color: "border-purple-500",
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-300"
      }
    ]
  },
  {
    id: 7,
    name: "Metrics & Performance",
    categories: [
      {
        title: "REVENUE METRICS",
        words: ["ARR", "MRR", "LTV", "GMV"],
        color: "border-yellow-500",
        bgColor: "bg-yellow-500/20",
        textColor: "text-yellow-300"
      },
      {
        title: "SPEND & BURN",
        words: ["CAC", "RUNWAY", "COGS", "OPEX"],
        color: "border-emerald-500",
        bgColor: "bg-emerald-500/20",
        textColor: "text-emerald-300"
      },
      {
        title: "USER RETENTION",
        words: ["CHURN", "NET RETENTION", "COHORT", "STICKINESS"],
        color: "border-blue-500",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-300"
      },
      {
        title: "PROFITABILITY",
        words: ["EBITDA", "MARGIN", "GROSS PROFIT", "FREE CASH"],
        color: "border-purple-500",
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-300"
      }
    ]
  },
  {
    id: 8,
    name: "Corporate & Legal",
    categories: [
      {
        title: "ENTITY STRUCTURES",
        words: ["C-CORP", "LLC", "S-CORP", "PARTNERSHIP"],
        color: "border-yellow-500",
        bgColor: "bg-yellow-500/20",
        textColor: "text-yellow-300"
      },
      {
        title: "LEGAL DEALS",
        words: ["NDA", "TERM SHEET", "APA", "BYLAWS"],
        color: "border-emerald-500",
        bgColor: "bg-emerald-500/20",
        textColor: "text-emerald-300"
      },
      {
        title: "INTELLECTUAL PROPERTY",
        words: ["PATENT", "TRADEMARK", "COPYRIGHT", "TRADE SECRET"],
        color: "border-blue-500",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-300"
      },
      {
        title: "GOVERNANCE ROLES",
        words: ["CHAIR", "DIRECTOR", "OBSERVER", "SECRETARY"],
        color: "border-purple-500",
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-300"
      }
    ]
  }
];

// ==========================================
// MAIN MASTER EXPORT
// ==========================================

export const VentureConnections = () => {
  const [activeGame, setActiveGame] = useState<null | GameType>(null);
  const [completedGames, setCompletedGames] = useState<PuzzleState>({
    pinpoint: 'unplayed',
    crossclimb: 'unplayed',
    queens: 'unplayed',
    connections: 'unplayed',
    wordle: 'unplayed',
    tango: 'unplayed',
    pitch: 'unplayed',
    equity: 'unplayed',
    zip: 'unplayed'
  });

  const [completedPuzzles, setCompletedPuzzles] = useState<Record<string, number[]>>({
    pinpoint: [],
    crossclimb: [],
    queens: [],
    connections: [],
    wordle: [],
    tango: [],
    pitch: [],
    equity: [],
    zip: []
  });

  // State persists completions in local storage
  useEffect(() => {
    const saved = localStorage.getItem('connectup_puzzles_completed');
    if (saved) {
      try {
        setCompletedGames(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
    const savedSubs = localStorage.getItem('connectup_sub_puzzles_completed');
    if (savedSubs) {
      try {
        setCompletedPuzzles(JSON.parse(savedSubs));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleSolvePuzzle = useCallback((game: GameType, id: number) => {
    setCompletedPuzzles(prev => {
      const alreadySolved = prev[game] || [];
      if (alreadySolved.includes(id)) return prev;
      const updatedList = [...alreadySolved, id];
      const updated = { ...prev, [game]: updatedList };
      localStorage.setItem('connectup_sub_puzzles_completed', JSON.stringify(updated));

      // Check if all puzzles for this game are completed
      let total = 1;
      if (game === 'pinpoint') total = PINPOINT_PUZZLES.length;
      else if (game === 'crossclimb') total = CROSSCLIMB_PUZZLES.length;
      else if (game === 'queens') total = QUEENS_PUZZLES.length;
      else if (game === 'connections') total = CONNECTIONS_PUZZLES.length;
      else if (game === 'wordle') total = WORDLE_PUZZLES.length;
      else if (game === 'tango') total = TANGO_PUZZLES.length;
      else if (game === 'pitch') total = PITCH_TRIVIA_PUZZLES.length;
      else if (game === 'equity') total = EQUITY_PUZZLES.length;
      else if (game === 'zip') total = ZIP_PATH_PUZZLES.length;

      if (updatedList.length >= total) {
        setCompletedGames(prevGames => {
          const updatedGames = { ...prevGames, [game]: 'completed' as const };
          localStorage.setItem('connectup_puzzles_completed', JSON.stringify(updatedGames));
          return updatedGames;
        });
      }

      return updated;
    });
  }, []);

  const handleSolvePinpoint = useCallback((id: number) => handleSolvePuzzle('pinpoint', id), [handleSolvePuzzle]);
  const handleSolveCrossclimb = useCallback((id: number) => handleSolvePuzzle('crossclimb', id), [handleSolvePuzzle]);
  const handleSolveQueens = useCallback((id: number) => handleSolvePuzzle('queens', id), [handleSolvePuzzle]);
  const handleSolveConnections = useCallback((id: number) => handleSolvePuzzle('connections', id), [handleSolvePuzzle]);
  const handleSolveWordle = useCallback((id: number) => handleSolvePuzzle('wordle', id), [handleSolvePuzzle]);
  const handleSolveTango = useCallback((id: number) => handleSolvePuzzle('tango', id), [handleSolvePuzzle]);
  const handleSolvePitch = useCallback((id: number) => handleSolvePuzzle('pitch', id), [handleSolvePuzzle]);
  const handleSolveEquity = useCallback((id: number) => handleSolvePuzzle('equity', id), [handleSolvePuzzle]);
  const handleSolveZip = useCallback((id: number) => handleSolvePuzzle('zip', id), [handleSolvePuzzle]);

  const handleBackToMain = () => {
    setActiveGame(null);
  };

  // Render game list matching LinkedIn screenshot visual style
  if (activeGame === null) {
    const isPinpointAll = (completedPuzzles.pinpoint?.length || 0) === PINPOINT_PUZZLES.length;
    const isCrossclimbAll = (completedPuzzles.crossclimb?.length || 0) === CROSSCLIMB_PUZZLES.length;
    const isQueensAll = (completedPuzzles.queens?.length || 0) === QUEENS_PUZZLES.length;
    const isConnectionsAll = (completedPuzzles.connections?.length || 0) === CONNECTIONS_PUZZLES.length;
    const isWordleAll = (completedPuzzles.wordle?.length || 0) === WORDLE_PUZZLES.length;
    const isTangoAll = (completedPuzzles.tango?.length || 0) === TANGO_PUZZLES.length;
    const isPitchAll = (completedPuzzles.pitch?.length || 0) === PITCH_TRIVIA_PUZZLES.length;
    const isEquityAll = (completedPuzzles.equity?.length || 0) === EQUITY_PUZZLES.length;
    const isZipAll = (completedPuzzles.zip?.length || 0) === ZIP_PATH_PUZZLES.length;

    return (
      <div className="bg-black rounded-2xl p-6 border border-zinc-800 flex flex-col relative overflow-hidden text-white shadow-xl">
        {/* Title Block */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Today's puzzles</h2>
              <p className="text-xs text-zinc-400">Daily brain teasers for professionals</p>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
        </div>

        {/* Puzzle Selector Rows */}
        <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
          {/* 1. Pinpoint */}
          <button 
            onClick={() => setActiveGame('pinpoint')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-zinc-700 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm relative">
                <Target className="w-4 h-4" />
                {isPinpointAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] text-white group-hover:text-amber-400 transition-colors">Pinpoint</span>
                  <span className="text-[10px] text-zinc-500 font-medium">#809</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isPinpointAll ? '🎉 All completed!' : `${completedPuzzles.pinpoint?.length || 0}/${PINPOINT_PUZZLES.length} puzzles solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 2. Crossclimb */}
          <button 
            onClick={() => setActiveGame('crossclimb')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-zinc-700 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-cyan-600 flex items-center justify-center text-white shrink-0 shadow-sm relative">
                <div className="flex flex-col gap-0.5 items-end rotate-12">
                  <div className="w-2.5 h-[3px] bg-white rounded-sm" />
                  <div className="w-1.5 h-[3px] bg-white rounded-sm" />
                  <div className="w-1 h-[3px] bg-white rounded-sm" />
                </div>
                {isCrossclimbAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] text-white group-hover:text-amber-400 transition-colors">Crossclimb</span>
                  <span className="text-[10px] text-zinc-500 font-medium">#809</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isCrossclimbAll ? '🎉 All completed!' : `${completedPuzzles.crossclimb?.length || 0}/${CROSSCLIMB_PUZZLES.length} ladders solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 3. Queens */}
          <button 
            onClick={() => setActiveGame('queens')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-zinc-700 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm relative">
                <Crown className="w-4 h-4 text-white" />
                {isQueensAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] text-white group-hover:text-amber-400 transition-colors">Queens</span>
                  <span className="text-[10px] text-zinc-500 font-medium">#809</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isQueensAll ? '🎉 All completed!' : `${completedPuzzles.queens?.length || 0}/${QUEENS_PUZZLES.length} boards solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 4. Connections */}
          <button 
            onClick={() => setActiveGame('connections')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-zinc-700 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-500 flex items-center justify-center text-black shrink-0 shadow-sm relative">
                <div className="grid grid-cols-2 gap-0.5 p-1">
                  <div className="w-2 h-2 rounded-full bg-black/80" />
                  <div className="w-2 h-2 rounded-full bg-black/80" />
                  <div className="w-2 h-2 rounded-full bg-black/80" />
                  <div className="w-2 h-2 rounded-full bg-black/80" />
                </div>
                {isConnectionsAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] text-white group-hover:text-amber-400 transition-colors">Connections</span>
                  <span className="text-[10px] text-zinc-500 font-medium">#101</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isConnectionsAll ? '🎉 All completed!' : `${completedPuzzles.connections?.length || 0}/${CONNECTIONS_PUZZLES.length} connections solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 5. Foundery Wordle */}
          <button 
            onClick={() => setActiveGame('wordle')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-zinc-700 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm relative">
                <Type className="w-4 h-4 text-white" />
                {isWordleAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] text-white group-hover:text-amber-400 transition-colors">Foundery Wordle</span>
                  <span className="text-[10px] text-zinc-500 font-medium">#204</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isWordleAll ? '🎉 All completed!' : `${completedPuzzles.wordle?.length || 0}/${WORDLE_PUZZLES.length} words solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 6. Tango Duals */}
          <button 
            onClick={() => setActiveGame('tango')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-zinc-700 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-sm relative">
                <Sun className="w-4 h-4 text-white" />
                {isTangoAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] text-white group-hover:text-amber-400 transition-colors">Tango Duals</span>
                  <span className="text-[10px] text-zinc-500 font-medium">#112</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isTangoAll ? '🎉 All completed!' : `${completedPuzzles.tango?.length || 0}/${TANGO_PUZZLES.length} duals solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 7. Pitch Rush */}
          <button 
            onClick={() => setActiveGame('pitch')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-zinc-700 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-500/20 relative">
                <Footprints className="w-4 h-4 text-white animate-pulse" />
                {isPitchAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] text-white group-hover:text-amber-400 transition-colors">Pitch Rush</span>
                  <span className="text-[10px] text-zinc-500 font-medium">#088</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isPitchAll ? '🎉 All completed!' : `${completedPuzzles.pitch?.length || 0}/${PITCH_TRIVIA_PUZZLES.length} questions solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 8. Equity Split */}
          <button 
            onClick={() => setActiveGame('equity')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-zinc-700 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm relative">
                <PieChart className="w-4 h-4 text-white" />
                {isEquityAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] text-white group-hover:text-amber-400 transition-colors">Equity Split</span>
                  <span className="text-[10px] text-zinc-500 font-medium">#045</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isEquityAll ? '🎉 All completed!' : `${completedPuzzles.equity?.length || 0}/${EQUITY_PUZZLES.length} splits solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 9. Zip Path */}
          <button 
            onClick={() => setActiveGame('zip')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-zinc-700 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-sm relative">
                <GitFork className="w-4 h-4 text-white" />
                {isZipAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] text-white group-hover:text-amber-400 transition-colors">Zip Path</span>
                  <span className="text-[10px] text-zinc-500 font-medium">#077</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isZipAll ? '🎉 All completed!' : `${completedPuzzles.zip?.length || 0}/${ZIP_PATH_PUZZLES.length} routes solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

      </div>
    );
  }

  // Active games rendered in-place with easy go-back headers
  return (
    <div className="bg-black rounded-2xl p-6 border border-zinc-800 flex flex-col relative overflow-hidden text-white shadow-xl">
      {/* Header with back button */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-zinc-800">
        <button 
          onClick={handleBackToMain}
          className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Puzzles</span>
        </button>
        <span className="text-[11px] font-black uppercase bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-amber-400">
          Playing {activeGame}
        </span>
      </div>

      {activeGame === 'pinpoint' && (
        <PinpointGame 
          completedList={completedPuzzles.pinpoint || []}
          onSolve={handleSolvePinpoint} 
        />
      )}

      {activeGame === 'crossclimb' && (
        <CrossclimbGame 
          completedList={completedPuzzles.crossclimb || []}
          onSolve={handleSolveCrossclimb} 
        />
      )}

      {activeGame === 'queens' && (
        <QueensGame 
          completedList={completedPuzzles.queens || []}
          onSolve={handleSolveQueens} 
        />
      )}

      {activeGame === 'connections' && (
        <ConnectionsGame 
          completedList={completedPuzzles.connections || []}
          onSolve={handleSolveConnections} 
        />
      )}

      {activeGame === 'wordle' && (
        <WordleGame 
          completedList={completedPuzzles.wordle || []}
          onSolve={handleSolveWordle} 
        />
      )}

      {activeGame === 'tango' && (
        <TangoGame 
          completedList={completedPuzzles.tango || []}
          onSolve={handleSolveTango} 
        />
      )}

      {activeGame === 'pitch' && (
        <PitchTriviaGame 
          completedList={completedPuzzles.pitch || []}
          onSolve={handleSolvePitch} 
        />
      )}

      {activeGame === 'equity' && (
        <EquityGame 
          completedList={completedPuzzles.equity || []}
          onSolve={handleSolveEquity} 
        />
      )}

      {activeGame === 'zip' && (
        <ZipPathGame 
          completedList={completedPuzzles.zip || []}
          onSolve={handleSolveZip} 
        />
      )}
    </div>
  );
};


// ==========================================
// 1. PINPOINT SUB-GAME COMPONENT
// ==========================================

const PinpointGame = memo(({ 
  completedList, 
  onSolve 
}: { 
  completedList: number[]; 
  onSolve: (id: number) => void; 
}) => {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [currentClueCount, setCurrentClueCount] = useState(1);
  const [attemptsRemaining, setAttemptsRemaining] = useState(4);
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const puzzle = PINPOINT_PUZZLES[puzzleIndex];

  // Synchronize state when selected puzzle changes or completions update
  useEffect(() => {
    const isCompleted = completedList.includes(puzzle.id);
    if (isCompleted) {
      setCurrentClueCount(5);
      setIsWon(true);
      setIsLost(false);
      setSelectedGuess(puzzle.correctCategory);
      setFeedback("Excellent work! You have solved this puzzle.");
    } else {
      setCurrentClueCount(1);
      setIsWon(false);
      setIsLost(false);
      setSelectedGuess(null);
      setFeedback(null);
      setAttemptsRemaining(4);
    }
  }, [puzzleIndex, completedList, puzzle.id, puzzle.correctCategory]);

  const handleNextClue = () => {
    if (currentClueCount < 5) {
      setCurrentClueCount(prev => prev + 1);
    }
  };

  const handleGuessSubmit = () => {
    if (!selectedGuess) return;

    if (selectedGuess === puzzle.correctCategory) {
      setIsWon(true);
      setFeedback("Excellent work! That is the perfect category.");
      onSolve(puzzle.id);
    } else {
      setAttemptsRemaining(prev => {
        const next = prev - 1;
        if (next === 0) {
          setIsLost(true);
          setFeedback(`Incorrect. The correct answer was: "${puzzle.correctCategory}"`);
        } else {
          setFeedback("Not quite correct. Try another category or reveal more clues!");
        }
        return next;
      });
    }
  };

  const handleReset = () => {
    setCurrentClueCount(1);
    setAttemptsRemaining(4);
    setIsWon(false);
    setIsLost(false);
    setSelectedGuess(null);
    setFeedback(null);
  };

  return (
    <div className="space-y-4">
      {/* Puzzle Tabs */}
      <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none border-b border-white/5">
        {PINPOINT_PUZZLES.map((p, idx) => {
          const isCompleted = completedList.includes(p.id);
          const isActive = puzzleIndex === idx;
          return (
            <button
              key={p.id}
              onClick={() => setPuzzleIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
            >
              <span>Puzzle {idx + 1}</span>
              {isCompleted && <span className="text-emerald-400 text-[10px]">✓</span>}
            </button>
          );
        })}
      </div>

      <div>
        <h3 className="font-bold text-sm text-zinc-900">Pinpoint Guessing — Puzzle {puzzleIndex + 1}</h3>
        <p className="text-[11px] text-zinc-500">Guess the single category linking all five clue words below.</p>
      </div>

      {/* Clues board */}
      <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200/80 space-y-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Clues revealed ({currentClueCount}/5)</span>
        <div className="space-y-2 pt-1">
          {Array.from({ length: currentClueCount }).map((_, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={i} 
              className="flex items-center gap-2 text-xs font-bold bg-white p-2 rounded-lg border border-zinc-200/80 text-zinc-800 shadow-xs"
            >
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
              <span>{puzzle.clues[i]}</span>
            </motion.div>
          ))}
        </div>

        {currentClueCount < 5 && !isWon && !isLost && (
          <button
            onClick={handleNextClue}
            className="w-full mt-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all"
          >
            Reveal Next Clue
          </button>
        )}
      </div>

      {/* Options selector */}
      {!isWon && !isLost && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Select your category guess</span>
          <div className="grid grid-cols-1 gap-2">
            {puzzle.options.map((opt) => (
              <button
                key={opt}
                onClick={() => setSelectedGuess(opt)}
                className={`py-2 px-3 rounded-lg border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer
                  ${selectedGuess === opt 
                    ? 'bg-blue-600 border-blue-400 text-white' 
                    : 'bg-white/5 border-white/5 text-white/80 hover:bg-white/10'
                  }`}
              >
                <span>{opt}</span>
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selectedGuess === opt ? 'border-white bg-white/20' : 'border-white/20'}`}>
                  {selectedGuess === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback box */}
      {feedback && (
        <div className={`p-3 rounded-xl text-xs font-semibold border flex items-center gap-2 ${isWon ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
          {isWon ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback}</span>
        </div>
      )}

      {/* Action panel */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-white/50">Attempts:</span>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < attemptsRemaining ? 'bg-blue-500' : 'bg-white/15'}`} />
          ))}
        </div>

        <div className="flex gap-2">
          {isWon || isLost ? (
            <button
              onClick={handleReset}
              disabled={completedList.includes(puzzle.id)}
              className="py-1.5 px-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          ) : (
            <button
              onClick={handleGuessSubmit}
              disabled={!selectedGuess}
              className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-xs font-bold tracking-wider uppercase text-white transition-all"
            >
              Guess
            </button>
          )}
        </div>
      </div>
    </div>
  );
});


// ==========================================
// 2. CROSSCLIMB SUB-GAME COMPONENT
// ==========================================

const CrossclimbGame = memo(({ 
  completedList, 
  onSolve 
}: { 
  completedList: number[]; 
  onSolve: (id: number) => void; 
}) => {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const puzzle = CROSSCLIMB_PUZZLES[puzzleIndex];

  // Synchronize state when selected puzzle changes or completions update
  useEffect(() => {
    const isCompleted = completedList.includes(puzzle.id);
    if (isCompleted) {
      setWords(puzzle.steps.map(step => step.word));
      setIsSolved(true);
      setFeedback("Perfect! The word ladder sequence is aligned with the definitions.");
    } else {
      setWords([...puzzle.startingScramble]);
      setIsSolved(false);
      setFeedback(null);
    }
    setSelectedIndex(null);
  }, [puzzleIndex, completedList, puzzle.id, puzzle.startingScramble, puzzle.steps]);

  const handleWordSwap = (index: number) => {
    if (isSolved) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else {
      if (selectedIndex === index) {
        setSelectedIndex(null);
        return;
      }
      // Swap words
      const newWords = [...words];
      const temp = newWords[selectedIndex];
      newWords[selectedIndex] = newWords[index];
      newWords[index] = temp;
      setWords(newWords);
      setSelectedIndex(null);

      // Check if sequence matches target solution order exactly
      const solved = puzzle.steps.every((step, idx) => step.word === newWords[idx]);
      if (solved) {
        setIsSolved(true);
        setFeedback("Perfect! The word ladder sequence is aligned with the definitions.");
        onSolve(puzzle.id);
      }
    }
  };

  const handleReset = () => {
    setWords([...puzzle.startingScramble]);
    setSelectedIndex(null);
    setIsSolved(false);
    setFeedback(null);
  };

  return (
    <div className="space-y-4">
      {/* Puzzle Tabs */}
      <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none border-b border-white/5">
        {CROSSCLIMB_PUZZLES.map((p, idx) => {
          const isCompleted = completedList.includes(p.id);
          const isActive = puzzleIndex === idx;
          return (
            <button
              key={p.id}
              onClick={() => setPuzzleIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer
                ${isActive 
                  ? 'bg-cyan-600 text-white shadow-md' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
            >
              <span>Ladder {idx + 1}</span>
              {isCompleted && <span className="text-emerald-400 text-[10px]">✓</span>}
            </button>
          );
        })}
      </div>

      <div>
        <h3 className="font-bold text-sm text-white">Crossclimb Ladder — {puzzle.name}</h3>
        <p className="text-[11px] text-white/50">Re-arrange the words on the ladder so each step changes exactly one letter, matching the clues.</p>
      </div>

      {/* Ladder Column */}
      <div className="space-y-3 relative">
        {/* Connection bridge indicators between steps */}
        <div className="absolute left-[54px] top-8 bottom-8 w-1 bg-gradient-to-b from-cyan-600/50 to-indigo-600/50 z-0" />

        {words.map((word, i) => {
          const matchingClue = puzzle.steps[i];
          const isSelected = selectedIndex === i;

          return (
            <motion.div 
              key={i} 
              layout
              className="relative z-10 flex items-center gap-4 group"
            >
              {/* Interactive word block */}
              <button
                onClick={() => handleWordSwap(i)}
                className={`w-28 py-3 rounded-xl border font-mono font-black text-sm tracking-widest text-center cursor-pointer transition-all active:scale-95
                  ${isSolved 
                    ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300' 
                    : isSelected 
                      ? 'bg-cyan-500 border-cyan-400 text-black shadow-lg shadow-cyan-500/20' 
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                  }`}
              >
                {word}
              </button>

              {/* Clue/Trivia indicator */}
              <div className="flex-1 text-xs text-white/70 leading-relaxed bg-white/5 border border-white/5 p-2 rounded-xl">
                <span className="text-[9px] font-bold text-white/40 uppercase block mb-0.5">Clue #{i+1}</span>
                {matchingClue ? matchingClue.clue : 'No Clue'}
              </div>
            </motion.div>
          );
        })}
      </div>

      {feedback && (
        <div className="p-3 rounded-xl text-xs font-semibold border flex items-center gap-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-300">
          <Check className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Help Instructions & Reset button */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
        <span className="text-white/40 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          Click two words to swap them
        </span>
        <button 
          onClick={handleReset}
          disabled={completedList.includes(puzzle.id)}
          className="text-white/50 hover:text-white hover:underline transition-all font-bold disabled:opacity-30 disabled:no-underline"
        >
          Reset Ladder
        </button>
      </div>
    </div>
  );
});


// ==========================================
// 3. QUEENS (STAR BATTLE) SUB-GAME COMPONENT
// ==========================================

const QueensGame = memo(({ 
  completedList, 
  onSolve 
}: { 
  completedList: number[]; 
  onSolve: (id: number) => void; 
}) => {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  
  // Grid represented as 5x5 containing: null (empty), 'X' (marked safe), 'Q' (queen/crown)
  const [grid, setGrid] = useState<(null | 'X' | 'Q')[][]>(
    Array(5).fill(null).map(() => Array(5).fill(null))
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isSolved, setIsSolved] = useState(false);

  const puzzle = QUEENS_PUZZLES[puzzleIndex];

  // Load grid when selected puzzle changes or completions update
  useEffect(() => {
    const isCompleted = completedList.includes(puzzle.id);
    if (isCompleted) {
      const solvedGrid = Array(5).fill(null).map((_, r) => 
        Array(5).fill(null).map((_, c) => 
          puzzle.solution.has(`${r},${c}`) ? 'Q' : 'X'
        )
      );
      setGrid(solvedGrid);
      setIsSolved(true);
      setFeedback("Congratulations! Excellent logic. The grid matches all Star-Battle criteria.");
      setErrorStatus(null);
    } else {
      setGrid(Array(5).fill(null).map(() => Array(5).fill(null)));
      setIsSolved(false);
      setFeedback(null);
      setErrorStatus(null);
    }
  }, [puzzleIndex, completedList, puzzle.id, puzzle.solution]);

  // Cycle cells: null -> 'Q' -> 'X' -> null
  const handleCellClick = (r: number, c: number) => {
    if (isSolved) return;

    setGrid(prev => {
      const next = prev.map(row => [...row]);
      const current = next[r][c];
      if (current === null) next[r][c] = 'Q';
      else if (current === 'Q') next[r][c] = 'X';
      else next[r][c] = null;
      return next;
    });
    setFeedback(null);
  };

  // Real-time violation checker
  const violations = useMemo(() => {
    const queenPositions: [number, number][] = [];
    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 'Q') queenPositions.push([r, c]);
      });
    });

    const rowCounts: Record<number, number> = {};
    const colCounts: Record<number, number> = {};
    const regionCounts: Record<number, number> = {};
    const touchingPairs: Set<string> = new Set();

    queenPositions.forEach(([r, c]) => {
      rowCounts[r] = (rowCounts[r] || 0) + 1;
      colCounts[c] = (colCounts[c] || 0) + 1;
      const region = puzzle.board[r][c];
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

    // Check adjacent touches (diagonally/orthogonally)
    for (let i = 0; i < queenPositions.length; i++) {
      for (let j = i + 1; j < queenPositions.length; j++) {
        const [r1, c1] = queenPositions[i];
        const [r2, c2] = queenPositions[j];
        if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) {
          touchingPairs.add(`${r1},${c1}`);
          touchingPairs.add(`${r2},${c2}`);
        }
      }
    }

    return {
      rowCounts,
      colCounts,
      regionCounts,
      touchingPairs,
      totalQueens: queenPositions.length
    };
  }, [grid, puzzle.board]);

  // Validation feedback on verify
  const handleVerify = () => {
    const { rowCounts, colCounts, regionCounts, touchingPairs, totalQueens } = violations;

    if (totalQueens !== 5) {
      setErrorStatus(`Place exactly 5 crowns on the board. Currently placed: ${totalQueens}`);
      return;
    }

    // Check row/col violations
    const badRow = Object.values(rowCounts).some(v => v > 1);
    const badCol = Object.values(colCounts).some(v => v > 1);
    const badRegion = Object.values(regionCounts).some(v => v > 1);
    const hasTouch = touchingPairs.size > 0;

    if (badRow || badCol || badRegion || hasTouch) {
      setErrorStatus("Rules violated! Verify crown adjacencies, rows, and region regions.");
      return;
    }

    // Check against solution set for robustness
    const isCorrect = Array.from(puzzle.solution).every(coord => {
      const [r, c] = coord.split(',').map(Number);
      return grid[r][c] === 'Q';
    });

    if (!isCorrect) {
      setErrorStatus("There is an issue with your placement. Review and try again!");
      return;
    }

    // Success! Solved correctly
    setIsSolved(true);
    setFeedback("Congratulations! Excellent logic. The grid matches all Star-Battle criteria.");
    setErrorStatus(null);
    onSolve(puzzle.id);
  };

  const handleReset = () => {
    setGrid(Array(5).fill(null).map(() => Array(5).fill(null)));
    setFeedback(null);
    setErrorStatus(null);
    setIsSolved(false);
  };

  return (
    <div className="space-y-4">
      {/* Puzzle Tabs */}
      <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none border-b border-white/5">
        {QUEENS_PUZZLES.map((p, idx) => {
          const isCompleted = completedList.includes(p.id);
          const isActive = puzzleIndex === idx;
          return (
            <button
              key={p.id}
              onClick={() => setPuzzleIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer
                ${isActive 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
            >
              <span>Board {idx + 1}</span>
              {isCompleted && <span className="text-emerald-400 text-[10px]">✓</span>}
            </button>
          );
        })}
      </div>

      <div>
        <h3 className="font-bold text-sm text-white">Queens Star-Battle — Board {puzzleIndex + 1}</h3>
        <p className="text-[11px] text-white/50">Place exactly 1 Crown in each row, column, and colored region. Crowns cannot touch, even diagonally.</p>
      </div>

      {/* Rules cheat-sheet */}
      <div className="bg-zinc-50 p-2 rounded-xl text-[10px] text-zinc-600 leading-relaxed border border-zinc-200/80">
        <span className="font-bold text-amber-600 block mb-0.5">Quick Play Instructions:</span>
        Tap cell to cycle: <span className="text-zinc-900 font-bold">👑 Crown</span> → <span className="text-zinc-900 font-bold">❌ Safe indicator</span> → Empty.
      </div>

      {/* Grid Container */}
      <div className="flex justify-center py-2">
        <div className="grid grid-cols-5 gap-1.5 p-2 bg-zinc-100 rounded-2xl border border-zinc-200 shadow-inner">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const region = puzzle.board[r][c];
              const regionColorClass = QUEENS_REGION_COLORS[region];
              
              // Determine if cell is highlighting active error
              const { rowCounts, colCounts, regionCounts, touchingPairs } = violations;
              const hasRowViol = (rowCounts[r] || 0) > 1;
              const hasColViol = (colCounts[c] || 0) > 1;
              const hasRegViol = (regionCounts[region] || 0) > 1;
              const isTouching = touchingPairs.has(`${r},${c}`);
              
              const isViolated = (cell === 'Q') && (hasRowViol || hasColViol || hasRegViol || isTouching);

              return (
                <button
                   id={`queens-cell-${r}-${c}`}
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-base transition-all relative border cursor-pointer select-none
                    ${regionColorClass}
                    ${isViolated ? '!border-rose-500 !bg-rose-500/20' : ''}
                    hover:scale-105 active:scale-95
                  `}
                >
                  {cell === 'Q' && (
                    <motion.div 
                      initial={{ scale: 0.5, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className={`${isViolated ? 'text-rose-400' : 'text-yellow-400'} drop-shadow-sm`}
                    >
                      👑
                    </motion.div>
                  )}
                  {cell === 'X' && (
                    <span className="text-white/20 font-bold text-xs select-none">❌</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Validation status / success */}
      {errorStatus && (
        <div className="p-2.5 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorStatus}</span>
        </div>
      )}

      {feedback && (
        <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-1.5">
          <Check className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Action panel */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <button 
          onClick={handleReset}
          disabled={completedList.includes(puzzle.id)}
          className="text-white/50 hover:text-white text-xs hover:underline transition-all font-bold disabled:opacity-30 disabled:no-underline"
        >
          Reset Board
        </button>

        {!isSolved && (
          <button
            onClick={handleVerify}
            className="py-1.5 px-4 bg-yellow-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-all cursor-pointer"
          >
            Verify Solution
          </button>
        )}
      </div>
    </div>
  );
});


// ==========================================
// 4. CONNECTIONS SUB-GAME COMPONENT
// ==========================================

const ConnectionsGame = memo(({ 
  completedList, 
  onSolve 
}: { 
  completedList: number[]; 
  onSolve: (id: number) => void; 
}) => {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [solvedCategories, setSolvedCategories] = useState<Category[]>([]);
  const [mistakesRemaining, setMistakesRemaining] = useState(4);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [shake, setShake] = useState(false);

  const currentPuzzle = CONNECTIONS_PUZZLES[currentPuzzleIndex];

  // Synchronize state when selected puzzle changes or completions update
  useEffect(() => {
    const isCompleted = completedList.includes(currentPuzzle.id);
    if (isCompleted) {
      setSolvedCategories([...currentPuzzle.categories]);
      setSelectedWords([]);
      setMistakesRemaining(4);
      setFeedback({ message: "Excellent work! You solved this connections puzzle.", isError: false });
    } else {
      setSolvedCategories([]);
      setSelectedWords([]);
      setMistakesRemaining(4);
      setFeedback(null);
    }
  }, [currentPuzzleIndex, completedList, currentPuzzle.id, currentPuzzle.categories]);

  const activeWords = useMemo(() => {
    const solvedWordSet = new Set(solvedCategories.flatMap(c => c.words));
    const remaining = currentPuzzle.categories
      .flatMap(c => c.words)
      .filter(word => !solvedWordSet.has(word));

    return [...remaining].sort((a, b) => a.localeCompare(b));
  }, [currentPuzzle, solvedCategories]);

  const handleWordClick = (word: string) => {
    if (feedback) setFeedback(null);
    if (selectedWords.includes(word)) {
      setSelectedWords(prev => prev.filter(w => w !== word));
    } else {
      if (selectedWords.length >= 4) {
        setFeedback({ message: "You can only select up to 4 words!", isError: true });
        return;
      }
      setSelectedWords(prev => [...prev, word]);
    }
  };

  const handleSubmit = () => {
    if (selectedWords.length !== 4) {
      setFeedback({ message: "Select exactly 4 words!", isError: true });
      return;
    }

    const matchingCategory = currentPuzzle.categories.find(category =>
      category.words.every(word => selectedWords.includes(word))
    );

    if (matchingCategory) {
      const nextSolved = [...solvedCategories, matchingCategory];
      setSolvedCategories(nextSolved);
      setSelectedWords([]);
      setFeedback({ message: `Correct: ${matchingCategory.title}!`, isError: false });

      if (nextSolved.length === currentPuzzle.categories.length) {
        onSolve(currentPuzzle.id);
      }
    } else {
      let maxMatch = 0;
      currentPuzzle.categories.forEach(cat => {
        const matchCount = cat.words.filter(w => selectedWords.includes(w)).length;
        if (matchCount > maxMatch) maxMatch = matchCount;
      });

      setMistakesRemaining(prev => {
        const next = prev - 1;
        if (next === 0) {
          setFeedback({ message: "Game over! Click reset to try again.", isError: true });
        } else if (maxMatch === 3) {
          setFeedback({ message: "One away...", isError: true });
        } else {
          setFeedback({ message: "Not a valid group!", isError: true });
        }
        return next;
      });

      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleReset = () => {
    setSelectedWords([]);
    setSolvedCategories([]);
    setMistakesRemaining(4);
    setFeedback(null);
  };

  const gameWon = solvedCategories.length === currentPuzzle.categories.length;
  const gameLost = mistakesRemaining <= 0;

  return (
    <div className="space-y-4">
      {/* Puzzle Tabs */}
      <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none border-b border-white/5">
        {CONNECTIONS_PUZZLES.map((p, idx) => {
          const isCompleted = completedList.includes(p.id);
          const isActive = currentPuzzleIndex === idx;
          return (
            <button
              key={p.id}
              onClick={() => setCurrentPuzzleIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer
                ${isActive 
                  ? 'bg-amber-500 text-black shadow-md' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
            >
              <span>Venture {idx + 1}</span>
              {isCompleted && <span className="text-emerald-400 text-[10px]">✓</span>}
            </button>
          );
        })}
      </div>

      <div>
        <h3 className="font-bold text-sm text-white">Venture Connections — {currentPuzzle.name}</h3>
        <p className="text-[11px] text-white/50">Group words into categories of four based on their core SaaS / startup connection.</p>
      </div>

      {/* Solved blocks */}
      <div className="space-y-2">
        {solvedCategories.map((category) => (
          <motion.div
            key={category.title}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full py-2.5 px-3 rounded-xl border ${category.color} ${category.bgColor} flex flex-col items-center justify-center text-center`}
          >
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${category.textColor}`}>
              {category.title}
            </span>
            <span className="text-xs font-bold tracking-wide text-white mt-0.5">
              {category.words.join(" • ")}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Active Grid */}
      {!gameWon && !gameLost && (
        <motion.div 
          animate={shake ? { x: [-6, 6, -6, 6, -4, 4, -2, 2, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 gap-2"
        >
          {activeWords.map((word) => {
            const isSelected = selectedWords.includes(word);
            return (
              <button
                key={word}
                onClick={() => handleWordClick(word)}
                className={`py-3 px-2 rounded-xl border font-bold text-xs tracking-tight transition-all text-center flex items-center justify-center cursor-pointer min-h-[48px] select-none
                  ${isSelected 
                    ? 'bg-yellow-500 border-yellow-400 text-black shadow-md shadow-yellow-500/10' 
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 active:scale-95'
                  }`}
              >
                {word}
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Game status messaging */}
      {feedback && (
        <div className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${feedback.isError ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
          {feedback.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Actions footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-white/50">Mistakes:</span>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < mistakesRemaining ? 'bg-yellow-500' : 'bg-white/15'}`} />
          ))}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleReset}
            disabled={completedList.includes(currentPuzzle.id)}
            className="text-white/50 hover:text-white text-xs hover:underline transition-all font-bold disabled:opacity-30 disabled:no-underline"
          >
            Reset
          </button>

          {!gameWon && !gameLost && (
            <button
              onClick={handleSubmit}
              disabled={selectedWords.length !== 4}
              className="py-1 px-3 bg-yellow-500 text-black font-extrabold text-[11px] uppercase tracking-widest rounded-lg disabled:opacity-40 cursor-pointer"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ==========================================
// 5. FOUNDERY WORDLE SUB-GAME COMPONENT
// ==========================================

interface WordlePuzzle {
  id: number;
  word: string;
  hint: string;
}

const WORDLE_PUZZLES: WordlePuzzle[] = [
  { id: 1, word: "PITCH", hint: "What founders deliver to investors in 3 minutes" },
  { id: 2, word: "SCALE", hint: "Growing revenue exponentially without proportional costs" },
  { id: 3, word: "ANGEL", hint: "Early-stage investor backing pre-seed founders" }
];

const WordleGame = memo(({ completedList, onSolve }: { completedList: number[]; onSolve: (id: number) => void }) => {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = WORDLE_PUZZLES[puzzleIndex];
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setGuesses([]);
    setCurrentGuess("");
    setGameWon(completedList.includes(puzzle.id));
    setGameLost(false);
    setFeedback(completedList.includes(puzzle.id) ? "🎉 Word solved!" : null);
  }, [puzzleIndex, completedList, puzzle.id]);

  const handleKeyInput = (char: string) => {
    if (gameWon || gameLost) return;
    if (char === "ENTER") {
      if (currentGuess.length !== 5) {
        setFeedback("Word must be 5 letters!");
        return;
      }
      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      if (currentGuess === puzzle.word) {
        setGameWon(true);
        setFeedback("🎉 Excellent! You guessed the startup word!");
        onSolve(puzzle.id);
      } else if (newGuesses.length >= 6) {
        setGameLost(true);
        setFeedback(`Game Over! The word was ${puzzle.word}`);
      } else {
        setFeedback(null);
      }
      setCurrentGuess("");
    } else if (char === "DEL" || char === "BACKSPACE") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[A-Z]$/.test(char)) {
      setCurrentGuess(prev => prev + char);
    }
  };

  const getTileColor = (guess: string, index: number) => {
    const char = guess[index];
    if (puzzle.word[index] === char) return "bg-emerald-600 border-emerald-500 text-white font-black";
    if (puzzle.word.includes(char)) return "bg-amber-500 border-amber-400 text-black font-black";
    return "bg-zinc-800 border-zinc-700 text-zinc-400 font-bold";
  };

  const keyboardRows = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L"],
    ["ENTER","Z","X","C","V","B","N","M","DEL"]
  ];

  return (
    <div className="space-y-4 text-white">
      {/* Level bar */}
      <div className="flex items-center justify-between bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">Wordle Word #{puzzle.id}</span>
        </div>
        <div className="flex gap-1">
          {WORDLE_PUZZLES.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setPuzzleIndex(idx)}
              className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg cursor-pointer ${
                puzzleIndex === idx ? 'bg-emerald-500 text-black' : completedList.includes(p.id) ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              #{p.id}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-sm font-bold text-white">Foundery Daily Word</h3>
        <p className="text-xs text-zinc-400">Hint: <span className="text-amber-400 font-medium">{puzzle.hint}</span></p>
      </div>

      {/* 6 Grid Rows */}
      <div className="flex flex-col items-center gap-1.5 py-2">
        {Array.from({ length: 6 }).map((_, rowIndex) => {
          const guess = guesses[rowIndex];
          const isCurrentRow = rowIndex === guesses.length && !gameWon && !gameLost;

          return (
            <div key={rowIndex} className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, colIndex) => {
                let char = "";
                let tileStyle = "bg-zinc-900/60 border-zinc-800 text-white";

                if (guess) {
                  char = guess[colIndex] || "";
                  tileStyle = getTileColor(guess, colIndex);
                } else if (isCurrentRow) {
                  char = currentGuess[colIndex] || "";
                  if (char) tileStyle = "bg-zinc-800 border-zinc-600 text-white";
                }

                return (
                  <div 
                    key={colIndex}
                    className={`w-10 h-10 sm:w-11 sm:h-11 border rounded-lg flex items-center justify-center text-sm sm:text-base tracking-wider uppercase select-none transition-all ${tileStyle}`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {feedback && (
        <div className={`p-2 rounded-xl text-center text-xs font-bold border ${gameWon ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-zinc-800 border-zinc-700 text-amber-300'}`}>
          {feedback}
        </div>
      )}

      {/* Onscreen Keyboard */}
      <div className="flex flex-col gap-1.5 items-center pt-2">
        {keyboardRows.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1 justify-center w-full">
            {row.map(key => (
              <button
                key={key}
                onClick={() => handleKeyInput(key)}
                className={`py-2 px-1.5 sm:px-2 rounded-md font-bold text-[11px] sm:text-xs cursor-pointer select-none transition-all active:scale-95 ${
                  key.length > 1 ? 'bg-zinc-800 text-zinc-300 min-w-[38px]' : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800 flex-1 max-w-[32px]'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});


// ==========================================
// 6. TANGO DUALS SUB-GAME COMPONENT
// ==========================================

interface TangoPuzzle {
  id: number;
  size: number;
  initial: (null | 'sun' | 'moon')[][];
  solution: ('sun' | 'moon')[][];
}

const TANGO_PUZZLES: TangoPuzzle[] = [
  {
    id: 1,
    size: 4,
    initial: [
      ['sun', null, null, 'moon'],
      [null, 'moon', null, null],
      [null, null, 'sun', null],
      ['moon', null, null, 'sun']
    ],
    solution: [
      ['sun', 'sun', 'moon', 'moon'],
      ['moon', 'moon', 'sun', 'sun'],
      ['moon', 'sun', 'sun', 'moon'],
      ['moon', 'sun', 'moon', 'sun']
    ]
  },
  {
    id: 2,
    size: 4,
    initial: [
      [null, 'sun', null, null],
      ['moon', null, null, 'sun'],
      [null, null, 'moon', null],
      [null, 'moon', 'sun', null]
    ],
    solution: [
      ['sun', 'sun', 'moon', 'moon'],
      ['moon', 'moon', 'sun', 'sun'],
      ['sun', 'moon', 'moon', 'sun'],
      ['moon', 'moon', 'sun', 'sun']
    ]
  }
];

const TangoGame = memo(({ completedList, onSolve }: { completedList: number[]; onSolve: (id: number) => void }) => {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = TANGO_PUZZLES[puzzleIndex];
  const [grid, setGrid] = useState<(null | 'sun' | 'moon')[][]>(puzzle.initial);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setGrid(puzzle.initial);
    setFeedback(completedList.includes(puzzle.id) ? "🎉 Board solved!" : null);
  }, [puzzleIndex, completedList, puzzle.id]);

  const handleCellClick = (r: number, c: number) => {
    if (puzzle.initial[r][c] !== null) return;
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      const current = next[r][c];
      if (current === null) next[r][c] = 'sun';
      else if (current === 'sun') next[r][c] = 'moon';
      else next[r][c] = null;
      return next;
    });
  };

  const verifySolution = () => {
    let isCorrect = true;
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        if (grid[r][c] !== puzzle.solution[r][c]) {
          isCorrect = false;
          break;
        }
      }
    }

    if (isCorrect) {
      setFeedback("🎉 Outstanding! Dual grid balanced perfectly!");
      onSolve(puzzle.id);
    } else {
      setFeedback("Almost! Ensure equal Suns ☀️ & Moons 🌙 with no 3-in-a-row.");
    }
  };

  return (
    <div className="space-y-4 text-white">
      <div className="flex items-center justify-between bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-bold">Tango Dual Board #{puzzle.id}</span>
        </div>
        <div className="flex gap-1">
          {TANGO_PUZZLES.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setPuzzleIndex(idx)}
              className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg cursor-pointer ${
                puzzleIndex === idx ? 'bg-rose-500 text-white' : completedList.includes(p.id) ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              #{p.id}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-300 leading-relaxed">
        <span className="font-bold text-rose-400 block mb-0.5">Rules:</span>
        Tap cell to cycle: ☀️ Sun → 🌙 Moon → Empty. Each row and column must contain equal Suns and Moons with no 3-in-a-row.
      </div>

      <div className="flex justify-center my-4">
        <div className="grid grid-cols-4 gap-2 bg-zinc-900 p-3 rounded-2xl border border-zinc-800 shadow-inner">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isFixed = puzzle.initial[r][c] !== null;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold transition-all cursor-pointer ${
                    isFixed 
                      ? 'bg-zinc-800/90 border-2 border-zinc-700 text-white shadow-xs' 
                      : 'bg-black/50 hover:bg-zinc-800 border border-zinc-800 active:scale-95'
                  }`}
                >
                  {cell === 'sun' && '☀️'}
                  {cell === 'moon' && '🌙'}
                </button>
              );
            })
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-2.5 rounded-xl text-center text-xs font-bold border bg-zinc-900 border-zinc-800 text-rose-300">
          {feedback}
        </div>
      )}

      <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
        <button 
          onClick={() => setGrid(puzzle.initial)}
          className="text-xs text-zinc-400 hover:text-white font-bold"
        >
          Reset Board
        </button>
        <button
          onClick={verifySolution}
          className="py-1.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] uppercase tracking-widest rounded-lg cursor-pointer shadow-sm"
        >
          Verify Board
        </button>
      </div>
    </div>
  );
});


// ==========================================
// 7. PITCH RUSH TRIVIA SUB-GAME COMPONENT
// ==========================================

interface PitchTriviaPuzzle {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const PITCH_TRIVIA_PUZZLES: PitchTriviaPuzzle[] = [
  {
    id: 1,
    question: "What is Y Combinator's standard funding deal terms for batch startups?",
    options: ["$125k for 7% plus $375k MFN SAFE", "$500k for 20% fixed equity", "$1M uncapped convertible note", "$250k grant with no equity"],
    correctIndex: 0,
    explanation: "YC's standard deal includes $125k on a post-money SAFE for 7% and $375k on an MFN SAFE."
  },
  {
    id: 2,
    question: "What does ARR stand for in SaaS metrics?",
    options: ["Annual Recurring Revenue", "Average Return Rate", "Adjusted Realized Revenue", "Automated Retention Ratio"],
    correctIndex: 0,
    explanation: "ARR stands for Annual Recurring Revenue, a fundamental metric for subscription SaaS businesses."
  },
  {
    id: 3,
    question: "Which milestone is typically celebrated as reaching 'Unicorn' status?",
    options: ["$1 Billion valuation", "$100 Million ARR", "$10 Billion valuation", "Passing IPO filing"],
    correctIndex: 0,
    explanation: "Coined by Aileen Lee in 2013, a Unicorn is a private startup valued at $1 Billion or more."
  }
];

const PitchTriviaGame = memo(({ completedList, onSolve }: { completedList: number[]; onSolve: (id: number) => void }) => {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = PITCH_TRIVIA_PUZZLES[puzzleIndex];
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  useEffect(() => {
    setSelectedOpt(null);
  }, [puzzleIndex]);

  const handleSelectOption = (idx: number) => {
    setSelectedOpt(idx);
    if (idx === puzzle.correctIndex) {
      onSolve(puzzle.id);
    }
  };

  return (
    <div className="space-y-4 text-white">
      <div className="flex items-center justify-between bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <Footprints className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-bold">Pitch Trivia Question #{puzzle.id}</span>
        </div>
        <div className="flex gap-1">
          {PITCH_TRIVIA_PUZZLES.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setPuzzleIndex(idx)}
              className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg cursor-pointer ${
                puzzleIndex === idx ? 'bg-orange-500 text-black' : completedList.includes(p.id) ? 'bg-orange-950 text-orange-300 border border-orange-800' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              #{p.id}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 space-y-3">
        <h3 className="text-sm font-bold text-white leading-snug">{puzzle.question}</h3>

        <div className="space-y-2 pt-1">
          {puzzle.options.map((option, idx) => {
            const isChosen = selectedOpt === idx;
            const isCorrect = idx === puzzle.correctIndex;
            let btnStyle = "bg-zinc-800/80 border-zinc-700 text-zinc-200 hover:bg-zinc-700/80";

            if (selectedOpt !== null) {
              if (isCorrect) btnStyle = "bg-emerald-600 border-emerald-500 text-white font-bold";
              else if (isChosen) btnStyle = "bg-rose-600 border-rose-500 text-white font-bold";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={selectedOpt !== null}
                className={`w-full p-3 rounded-xl border text-xs text-left font-medium transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
              >
                <span>{option}</span>
                {selectedOpt !== null && isCorrect && <Check className="w-4 h-4 text-white shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {selectedOpt !== null && (
        <div className={`p-3 rounded-xl text-xs border leading-relaxed ${selectedOpt === puzzle.correctIndex ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
          <span className="font-bold block mb-1">
            {selectedOpt === puzzle.correctIndex ? "🎉 Correct!" : "Not quite!"}
          </span>
          <span>{puzzle.explanation}</span>
        </div>
      )}
    </div>
  );
});


// ==========================================
// 8. EQUITY SPLIT SUB-GAME COMPONENT
// ==========================================

interface EquityPuzzle {
  id: number;
  title: string;
  targetPercentages: {
    founderA: number;
    founderB: number;
    investor: number;
    pool: number;
  };
  clues: string[];
}

const EQUITY_PUZZLES: EquityPuzzle[] = [
  {
    id: 1,
    title: "Series A Cap Table Split",
    targetPercentages: { founderA: 40, founderB: 30, investor: 20, pool: 10 },
    clues: [
      "Founder A holds 40%",
      "Founder B holds 30%",
      "Lead Investor owns 20%",
      "ESOP Pool is set to 10%"
    ]
  },
  {
    id: 2,
    title: "Seed Round Cap Table",
    targetPercentages: { founderA: 45, founderB: 35, investor: 15, pool: 5 },
    clues: [
      "Founder A has 45%",
      "Founder B has 35%",
      "Investor holds 15%",
      "Remaining 5% is allocated to ESOP Pool"
    ]
  }
];

const EquityGame = memo(({ completedList, onSolve }: { completedList: number[]; onSolve: (id: number) => void }) => {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = EQUITY_PUZZLES[puzzleIndex];

  const [founderA, setFounderA] = useState(25);
  const [founderB, setFounderB] = useState(25);
  const [investor, setInvestor] = useState(25);
  const [pool, setPool] = useState(25);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setFounderA(25);
    setFounderB(25);
    setInvestor(25);
    setPool(25);
    setFeedback(completedList.includes(puzzle.id) ? "🎉 Cap Table balanced!" : null);
  }, [puzzleIndex, completedList, puzzle.id]);

  const total = founderA + founderB + investor + pool;

  const handleValidate = () => {
    const target = puzzle.targetPercentages;
    if (
      founderA === target.founderA &&
      founderB === target.founderB &&
      investor === target.investor &&
      pool === target.pool
    ) {
      setFeedback("🎉 Spot on! Cap table mathematically balanced!");
      onSolve(puzzle.id);
    } else {
      setFeedback("Check the targets! Sum must equal 100% and match clue allocations.");
    }
  };

  return (
    <div className="space-y-4 text-white">
      <div className="flex items-center justify-between bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold">{puzzle.title}</span>
        </div>
        <div className="flex gap-1">
          {EQUITY_PUZZLES.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setPuzzleIndex(idx)}
              className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg cursor-pointer ${
                puzzleIndex === idx ? 'bg-indigo-600 text-white' : completedList.includes(p.id) ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              #{p.id}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 space-y-1 text-xs">
        <span className="font-bold text-indigo-400">Target Cap Table Clues:</span>
        <ul className="list-disc list-inside text-zinc-300 space-y-0.5 text-[11px]">
          {puzzle.clues.map((clue, idx) => (
            <li key={idx}>{clue}</li>
          ))}
        </ul>
      </div>

      {/* Sliders */}
      <div className="space-y-3 bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-blue-400">Founder A: {founderA}%</span>
          <input 
            type="range" min="0" max="100" step="5" value={founderA} 
            onChange={e => setFounderA(Number(e.target.value))}
            className="w-36 accent-blue-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-purple-400">Founder B: {founderB}%</span>
          <input 
            type="range" min="0" max="100" step="5" value={founderB} 
            onChange={e => setFounderB(Number(e.target.value))}
            className="w-36 accent-purple-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-400">Investor: {investor}%</span>
          <input 
            type="range" min="0" max="100" step="5" value={investor} 
            onChange={e => setInvestor(Number(e.target.value))}
            className="w-36 accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-amber-400">Option Pool: {pool}%</span>
          <input 
            type="range" min="0" max="100" step="5" value={pool} 
            onChange={e => setPool(Number(e.target.value))}
            className="w-36 accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Total Bar */}
        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400">Total Equity:</span>
          <span className={`text-xs font-black px-2 py-0.5 rounded ${total === 100 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
            {total}% / 100%
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-2.5 rounded-xl text-center text-xs font-bold border bg-zinc-900 border-zinc-800 text-indigo-300">
          {feedback}
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          onClick={handleValidate}
          className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] uppercase tracking-widest rounded-lg cursor-pointer shadow-sm"
        >
          Validate Cap Table
        </button>
      </div>
    </div>
  );
});


// ==========================================
// 9. ZIP PATH SUB-GAME COMPONENT
// ==========================================

interface ZipPathPuzzle {
  id: number;
  gridSize: number;
  endpoints: { id: number; color: string; r1: number; c1: number; r2: number; c2: number }[];
}

const ZIP_PATH_PUZZLES: ZipPathPuzzle[] = [
  {
    id: 1,
    gridSize: 3,
    endpoints: [
      { id: 1, color: 'bg-emerald-500', r1: 0, c1: 0, r2: 2, c2: 0 },
      { id: 2, color: 'bg-blue-500', r1: 0, c1: 2, r2: 2, c2: 2 }
    ]
  }
];

const ZipPathGame = memo(({ completedList, onSolve }: { completedList: number[]; onSolve: (id: number) => void }) => {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = ZIP_PATH_PUZZLES[puzzleIndex];
  const [connected, setConnected] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setConnected([]);
    setFeedback(completedList.includes(puzzle.id) ? "🎉 Route connected!" : null);
  }, [puzzleIndex, completedList, puzzle.id]);

  const toggleConnect = (id: number) => {
    setConnected(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (next.length === puzzle.endpoints.length) {
        setFeedback("🎉 All tech routes synced successfully!");
        onSolve(puzzle.id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4 text-white">
      <div className="flex items-center justify-between bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold">Zip Route Connector #{puzzle.id}</span>
        </div>
        <div className="flex gap-1">
          {ZIP_PATH_PUZZLES.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setPuzzleIndex(idx)}
              className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg cursor-pointer ${
                puzzleIndex === idx ? 'bg-teal-600 text-white' : completedList.includes(p.id) ? 'bg-teal-950 text-teal-300 border border-teal-800' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              #{p.id}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-300">
        Tap matching colored node pairs to connect their startup data pipeline.
      </div>

      <div className="space-y-2 py-2">
        {puzzle.endpoints.map(ep => {
          const isConnected = connected.includes(ep.id);
          return (
            <div key={ep.id} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${ep.color}`} />
                <span className="text-xs font-bold">Pipeline #{ep.id}</span>
              </div>
              <button
                onClick={() => toggleConnect(ep.id)}
                className={`py-1 px-3 text-xs font-extrabold rounded-lg cursor-pointer transition-all ${
                  isConnected ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {isConnected ? 'Connected ✓' : 'Connect Pipeline'}
              </button>
            </div>
          );
        })}
      </div>

      {feedback && (
        <div className="p-2.5 rounded-xl text-center text-xs font-bold border bg-zinc-900 border-zinc-800 text-teal-300">
          {feedback}
        </div>
      )}
    </div>
  );
});
