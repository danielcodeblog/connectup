import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, RotateCcw, Check, Sparkles, AlertCircle, HelpCircle, 
  ChevronRight, ArrowLeft, Crown, HelpCircle as HintIcon, Info, RefreshCw,
  Sun, Moon, Lightbulb, Grid3X3, KeyRound, Type, Delete, ArrowRight
} from 'lucide-react';

// ==========================================
// TYPES & CONSTANTS
// ==========================================

interface PuzzleState {
  pinpoint: 'unplayed' | 'completed';
  crossclimb: 'unplayed' | 'completed';
  queens: 'unplayed' | 'completed';
  connections: 'unplayed' | 'completed';
  tango: 'unplayed' | 'completed';
  wordle: 'unplayed' | 'completed';
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
  }
];

// ------------------------------------------
// TANGO GAME DATA
// ------------------------------------------
interface TangoPuzzle {
  id: number;
  name: string;
  size: number;
  givens: [number, number, 'S' | 'M'][];
  equalPairs: [number, number, number, number][];
  oppositePairs: [number, number, number, number][];
  solution: ('S' | 'M')[][];
}

const TANGO_PUZZLES: TangoPuzzle[] = [
  {
    id: 1,
    name: "Solar Flare",
    size: 4,
    givens: [
      [0, 0, 'S'],
      [1, 3, 'S'],
      [3, 1, 'M']
    ],
    equalPairs: [
      [2, 0, 2, 1],
      [2, 2, 2, 3],
      [3, 0, 3, 1],
      [3, 2, 3, 3]
    ],
    oppositePairs: [
      [0, 1, 1, 1],
      [0, 2, 1, 2]
    ],
    solution: [
      ['S', 'M', 'S', 'M'],
      ['M', 'S', 'M', 'S'],
      ['S', 'S', 'M', 'M'],
      ['M', 'M', 'S', 'S']
    ]
  },
  {
    id: 2,
    name: "Eclipse",
    size: 4,
    givens: [
      [0, 0, 'M'],
      [1, 3, 'S'],
      [3, 2, 'S']
    ],
    equalPairs: [
      [0, 1, 0, 2],
      [1, 1, 1, 2]
    ],
    oppositePairs: [
      [2, 0, 3, 0],
      [2, 3, 3, 3]
    ],
    solution: [
      ['M', 'S', 'S', 'M'],
      ['S', 'M', 'M', 'S'],
      ['M', 'S', 'M', 'S'],
      ['S', 'M', 'S', 'M']
    ]
  },
  {
    id: 3,
    name: "Equinox",
    size: 4,
    givens: [
      [0, 3, 'S'],
      [1, 0, 'M'],
      [3, 3, 'S']
    ],
    equalPairs: [
      [0, 1, 0, 2],
      [1, 1, 1, 2],
      [2, 0, 2, 1],
      [3, 0, 3, 1]
    ],
    oppositePairs: [
      [1, 0, 2, 0]
    ],
    solution: [
      ['S', 'M', 'M', 'S'],
      ['M', 'S', 'S', 'M'],
      ['S', 'S', 'M', 'M'],
      ['M', 'M', 'S', 'S']
    ]
  }
];

// ------------------------------------------
// WORDLE GAME DATA
// ------------------------------------------
interface WordlePuzzle {
  id: number;
  word: string;
  hint: string;
  category: string;
}

const WORDLE_PUZZLES: WordlePuzzle[] = [
  {
    id: 1,
    word: "PIVOT",
    hint: "A strategic shift in business direction or product vision to capture market opportunity",
    category: "Startup Strategy"
  },
  {
    id: 2,
    word: "ANGEL",
    hint: "An early-stage accredited investor who backs founders before major venture rounds",
    category: "Venture Capital"
  },
  {
    id: 3,
    word: "SCALE",
    hint: "Rapidly expanding product reach, team, and revenue while improving unit economics",
    category: "Growth & Traction"
  },
  {
    id: 4,
    word: "PITCH",
    hint: "A presentation where founders showcase problem, product, and metrics to secure capital",
    category: "Fundraising"
  },
  {
    id: 5,
    word: "FUNDS",
    hint: "Pooled venture capital vehicles deployed by general partners into high-growth bets",
    category: "Financing"
  },
  {
    id: 6,
    word: "YIELD",
    hint: "The financial return or productivity generated from deployed capital and operational efforts",
    category: "Unit Economics"
  }
];

// ==========================================
// MAIN MASTER EXPORT
// ==========================================

export const VentureConnections = () => {
  const [activeGame, setActiveGame] = useState<null | 'pinpoint' | 'crossclimb' | 'queens' | 'connections' | 'tango' | 'wordle'>(null);
  const [completedGames, setCompletedGames] = useState<PuzzleState>({
    pinpoint: 'unplayed',
    crossclimb: 'unplayed',
    queens: 'unplayed',
    connections: 'unplayed',
    tango: 'unplayed',
    wordle: 'unplayed'
  });

  const [completedPuzzles, setCompletedPuzzles] = useState<Record<string, number[]>>({
    pinpoint: [],
    crossclimb: [],
    queens: [],
    connections: [],
    tango: [],
    wordle: []
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

  const handleSolvePuzzle = useCallback((game: 'pinpoint' | 'crossclimb' | 'queens' | 'connections' | 'tango' | 'wordle', id: number) => {
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
      else if (game === 'tango') total = TANGO_PUZZLES.length;
      else if (game === 'wordle') total = WORDLE_PUZZLES.length;

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
  const handleSolveTango = useCallback((id: number) => handleSolvePuzzle('tango', id), [handleSolvePuzzle]);
  const handleSolveWordle = useCallback((id: number) => handleSolvePuzzle('wordle', id), [handleSolvePuzzle]);

  const handleBackToMain = () => {
    setActiveGame(null);
  };

  // Render game list matching LinkedIn screenshot visual style
  if (activeGame === null) {
    const isPinpointAll = completedPuzzles.pinpoint?.length === PINPOINT_PUZZLES.length;
    const isCrossclimbAll = completedPuzzles.crossclimb?.length === CROSSCLIMB_PUZZLES.length;
    const isQueensAll = completedPuzzles.queens?.length === QUEENS_PUZZLES.length;
    const isConnectionsAll = completedPuzzles.connections?.length === CONNECTIONS_PUZZLES.length;
    const isTangoAll = (completedPuzzles.tango?.length || 0) === TANGO_PUZZLES.length;
    const isWordleAll = (completedPuzzles.wordle?.length || 0) === WORDLE_PUZZLES.length;

    return (
      <div className="bg-black rounded-2xl p-6 border border-zinc-800/80 shadow-2xl flex flex-col relative overflow-y-auto max-h-[calc(100vh-32px)] text-white">
        {/* Title Block */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-yellow-500/25 rounded-2xl border border-yellow-500/20">
              <Target className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Today's puzzles</h2>
              <p className="text-xs text-white/50">Daily brain teasers for professionals</p>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
        </div>

        {/* Puzzle Selector Rows - styled like the screenshot */}
        <div className="space-y-3">
          {/* 1. Pinpoint */}
          <button 
            onClick={() => setActiveGame('pinpoint')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {/* Blue Map/Target Pinpoint Icon */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-900/40 relative">
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                {isPinpointAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] sm:text-sm text-white group-hover:text-yellow-400 transition-colors">Pinpoint</span>
                  <span className="text-[10px] sm:text-[11px] text-white/40 font-medium">#809</span>
                </div>
                <p className="text-[11px] sm:text-xs text-white/50 mt-0.5">
                  {isPinpointAll ? '🎉 All completed!' : `${completedPuzzles.pinpoint.length}/${PINPOINT_PUZZLES.length} puzzles solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 2. Crossclimb */}
          <button 
            onClick={() => setActiveGame('crossclimb')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {/* Cyan Stair/Ladder Crossclimb Icon */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-cyan-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-cyan-900/40 relative">
                <div className="flex flex-col gap-0.5 items-end rotate-12">
                  <div className="w-2.5 h-[3px] sm:w-3.5 sm:h-1 bg-white rounded-sm" />
                  <div className="w-1.5 h-[3px] sm:w-2.5 sm:h-1 bg-white rounded-sm" />
                  <div className="w-1 h-[3px] sm:w-1.5 sm:h-1 bg-white rounded-sm" />
                </div>
                {isCrossclimbAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] sm:text-sm text-white group-hover:text-yellow-400 transition-colors">Crossclimb</span>
                  <span className="text-[10px] sm:text-[11px] text-white/40 font-medium">#809</span>
                </div>
                <p className="text-[11px] sm:text-xs text-white/50 mt-0.5">
                  {isCrossclimbAll ? '🎉 All completed!' : `${completedPuzzles.crossclimb.length}/${CROSSCLIMB_PUZZLES.length} ladders solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 3. Queens */}
          <button 
            onClick={() => setActiveGame('queens')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {/* Purple Crown Queens Icon */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-900/40 relative">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                {isQueensAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] sm:text-sm text-white group-hover:text-yellow-400 transition-colors">Queens</span>
                  <span className="text-[10px] sm:text-[11px] text-white/40 font-medium">#809</span>
                </div>
                <p className="text-[11px] sm:text-xs text-white/50 mt-0.5">
                  {isQueensAll ? '🎉 All completed!' : `${completedPuzzles.queens.length}/${QUEENS_PUZZLES.length} boards solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 4. Connections */}
          <button 
            onClick={() => setActiveGame('connections')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {/* Amber Node Connections Icon */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500 flex items-center justify-center text-black shrink-0 shadow-lg shadow-amber-900/40 relative">
                <div className="grid grid-cols-2 gap-0.5 sm:gap-1 p-1">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-black/80" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-black/80" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-black/80" />
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-black/80" />
                </div>
                {isConnectionsAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] sm:text-sm text-white group-hover:text-yellow-400 transition-colors">Connections</span>
                  <span className="text-[10px] sm:text-[11px] text-white/40 font-medium">#101</span>
                </div>
                <p className="text-[11px] sm:text-xs text-white/50 mt-0.5">
                  {isConnectionsAll ? '🎉 All completed!' : `${completedPuzzles.connections.length}/${CONNECTIONS_PUZZLES.length} connections solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 5. Tango */}
          <button 
            onClick={() => setActiveGame('tango')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {/* Sun/Moon Tango Icon */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-900/40 relative">
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-100" />
                {isTangoAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] sm:text-sm text-white group-hover:text-yellow-400 transition-colors">Tango</span>
                  <span className="text-[10px] sm:text-[11px] text-white/40 font-medium">#42</span>
                </div>
                <p className="text-[11px] sm:text-xs text-white/50 mt-0.5">
                  {isTangoAll ? '🎉 All completed!' : `${completedPuzzles.tango?.length || 0}/${TANGO_PUZZLES.length} grids balanced`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 6. Wordle */}
          <button 
            onClick={() => setActiveGame('wordle')}
            className="w-full flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {/* Emerald Letter Tile Wordle Icon */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-900/40 relative">
                <Type className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                {isWordleAll && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] sm:text-sm text-white group-hover:text-yellow-400 transition-colors">Wordle</span>
                  <span className="text-[10px] sm:text-[11px] text-white/40 font-medium">#365</span>
                </div>
                <p className="text-[11px] sm:text-xs text-white/50 mt-0.5">
                  {isWordleAll ? '🎉 All completed!' : `${completedPuzzles.wordle?.length || 0}/${WORDLE_PUZZLES.length} words guessed`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Footer info line */}
        <div className="mt-4 pt-3 border-t border-white/5 text-center text-[11px] text-white/40">
          <span>Puzzles refresh daily</span>
        </div>
      </div>
    );
  }

  // Active games rendered in-place with easy go-back headers
  return (
    <div className="bg-black rounded-2xl p-6 border border-zinc-800/80 shadow-2xl flex flex-col relative overflow-y-auto max-h-[calc(100vh-32px)] text-white">
      {/* Header with back button */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
        <button 
          onClick={handleBackToMain}
          className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Puzzles</span>
        </button>
        <span className="text-[11px] font-black uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5 text-yellow-400">
          Playing {activeGame}
        </span>
      </div>

      {activeGame === 'pinpoint' && (
        <PinpointGame 
          completedList={completedPuzzles.pinpoint}
          onSolve={handleSolvePinpoint} 
        />
      )}

      {activeGame === 'crossclimb' && (
        <CrossclimbGame 
          completedList={completedPuzzles.crossclimb}
          onSolve={handleSolveCrossclimb} 
        />
      )}

      {activeGame === 'queens' && (
        <QueensGame 
          completedList={completedPuzzles.queens}
          onSolve={handleSolveQueens} 
        />
      )}

      {activeGame === 'connections' && (
        <ConnectionsGame 
          completedList={completedPuzzles.connections}
          onSolve={handleSolveConnections} 
        />
      )}

      {activeGame === 'tango' && (
        <TangoGame 
          completedList={completedPuzzles.tango || []}
          onSolve={handleSolveTango} 
        />
      )}

      {activeGame === 'wordle' && (
        <WordleGame 
          completedList={completedPuzzles.wordle || []}
          onSolve={handleSolveWordle} 
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
        <h3 className="font-bold text-sm text-white">Pinpoint Guessing — Puzzle {puzzleIndex + 1}</h3>
        <p className="text-[11px] text-white/50">Guess the single category linking all five clue words below.</p>
      </div>

      {/* Clues board */}
      <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-2 overflow-y-auto max-h-60">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Clues revealed ({currentClueCount}/5)</span>
        <div className="space-y-2 pt-1">
          {Array.from({ length: currentClueCount }).map((_, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={i} 
              className="flex items-center gap-2 text-xs font-bold bg-white/5 p-2 rounded-lg border border-white/5"
            >
              <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center text-[10px]">{i + 1}</span>
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
        <div className="space-y-2 overflow-y-auto max-h-56">
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
      <div className="bg-white/5 p-2 rounded-xl text-[10px] text-white/60 leading-relaxed border border-white/5">
        <span className="font-bold text-yellow-400 block mb-0.5">Quick Play Instructions:</span>
        Tap cell to cycle: <span className="text-white font-bold">👑 Crown</span> → <span className="text-white font-bold">❌ Safe indicator</span> → Empty.
      </div>

      {/* Grid Container */}
      <div className="flex justify-center py-2">
        <div className="grid grid-cols-5 gap-1.5 p-2 bg-black/40 rounded-2xl border border-white/10 shadow-inner">
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
// 5. TANGO (SUN & MOON BALANCE) SUB-GAME COMPONENT
// ==========================================

const TangoGame = memo(({ 
  completedList, 
  onSolve 
}: { 
  completedList: number[]; 
  onSolve: (id: number) => void; 
}) => {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = TANGO_PUZZLES[puzzleIndex];

  // Grid of cells: 4x4
  const [grid, setGrid] = useState<('S' | 'M' | null)[][]>(() => 
    Array(4).fill(null).map(() => Array(4).fill(null))
  );
  const [isSolved, setIsSolved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  // Set of locked given coordinates: "r,c"
  const givensMap = useMemo(() => {
    const map = new Map<string, 'S' | 'M'>();
    puzzle.givens.forEach(([r, c, s]) => map.set(`${r},${c}`, s));
    return map;
  }, [puzzle.givens]);

  // Load puzzle state on change or solved update
  useEffect(() => {
    const isCompleted = completedList.includes(puzzle.id);
    if (isCompleted) {
      setGrid(puzzle.solution.map(row => [...row]));
      setIsSolved(true);
      setFeedback("Brilliant! All suns & moons are perfectly balanced with every rule satisfied.");
      setErrorStatus(null);
    } else {
      // Initialize with givens
      const initialGrid: ('S' | 'M' | null)[][] = Array(4).fill(null).map(() => Array(4).fill(null));
      puzzle.givens.forEach(([r, c, s]) => {
        initialGrid[r][c] = s;
      });
      setGrid(initialGrid);
      setIsSolved(false);
      setFeedback(null);
      setErrorStatus(null);
    }
  }, [puzzleIndex, completedList, puzzle.id, puzzle.givens, puzzle.solution]);

  // Toggle cell: null -> 'S' -> 'M' -> null (only if not a given cell)
  const handleCellClick = (r: number, c: number) => {
    if (isSolved || givensMap.has(`${r},${c}`)) return;

    setGrid(prev => {
      const next = prev.map(row => [...row]);
      const current = next[r][c];
      if (current === null) next[r][c] = 'S';
      else if (current === 'S') next[r][c] = 'M';
      else next[r][c] = null;
      return next;
    });
    setFeedback(null);
    setErrorStatus(null);
  };

  const handleVerify = () => {
    // 1. Check if all cells are filled
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!grid[r][c]) {
          setErrorStatus("Grid incomplete! Fill all cells with Suns or Moons.");
          return;
        }
      }
    }

    // 2. Check no 3 in a row (horizontal)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c <= 1; c++) {
        if (grid[r][c] && grid[r][c] === grid[r][c + 1] && grid[r][c] === grid[r][c + 2]) {
          setErrorStatus(`Three consecutive ${grid[r][c] === 'S' ? 'Suns' : 'Moons'} in row ${r + 1}!`);
          return;
        }
      }
    }

    // 3. Check no 3 in a column (vertical)
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r <= 1; r++) {
        if (grid[r][c] && grid[r][c] === grid[r + 1][c] && grid[r][c] === grid[r + 2][c]) {
          setErrorStatus(`Three consecutive ${grid[r][c] === 'S' ? 'Suns' : 'Moons'} in column ${c + 1}!`);
          return;
        }
      }
    }

    // 4. Check row counts (2 Suns, 2 Moons)
    for (let r = 0; r < 4; r++) {
      const suns = grid[r].filter(v => v === 'S').length;
      const moons = grid[r].filter(v => v === 'M').length;
      if (suns !== 2 || moons !== 2) {
        setErrorStatus(`Row ${r + 1} must contain exactly 2 Suns and 2 Moons.`);
        return;
      }
    }

    // 5. Check column counts (2 Suns, 2 Moons)
    for (let c = 0; c < 4; c++) {
      let suns = 0;
      let moons = 0;
      for (let r = 0; r < 4; r++) {
        if (grid[r][c] === 'S') suns++;
        if (grid[r][c] === 'M') moons++;
      }
      if (suns !== 2 || moons !== 2) {
        setErrorStatus(`Column ${c + 1} must contain exactly 2 Suns and 2 Moons.`);
        return;
      }
    }

    // 6. Check equal relations (=)
    for (const [r1, c1, r2, c2] of puzzle.equalPairs) {
      if (grid[r1][c1] !== grid[r2][c2]) {
        setErrorStatus("Constraint violation: Cells linked by '=' must be the same symbol!");
        return;
      }
    }

    // 7. Check opposite relations (x)
    for (const [r1, c1, r2, c2] of puzzle.oppositePairs) {
      if (grid[r1][c1] === grid[r2][c2]) {
        setErrorStatus("Constraint violation: Cells linked by '×' must have opposite symbols!");
        return;
      }
    }

    // Success!
    setIsSolved(true);
    setFeedback("Brilliant! All suns & moons are perfectly balanced with every rule satisfied.");
    setErrorStatus(null);
    onSolve(puzzle.id);
  };

  const handleReset = () => {
    const initialGrid: ('S' | 'M' | null)[][] = Array(4).fill(null).map(() => Array(4).fill(null));
    puzzle.givens.forEach(([r, c, s]) => {
      initialGrid[r][c] = s;
    });
    setGrid(initialGrid);
    setIsSolved(false);
    setFeedback(null);
    setErrorStatus(null);
  };

  // Helper to test if a pair is equal or opposite
  const getRelation = (r1: number, c1: number, r2: number, c2: number) => {
    const isEqual = puzzle.equalPairs.some(
      ([ar1, ac1, ar2, ac2]) =>
        (ar1 === r1 && ac1 === c1 && ar2 === r2 && ac2 === c2) ||
        (ar1 === r2 && ac1 === c2 && ar2 === r1 && ac2 === c1)
    );
    if (isEqual) return '=';

    const isOpposite = puzzle.oppositePairs.some(
      ([ar1, ac1, ar2, ac2]) =>
        (ar1 === r1 && ac1 === c1 && ar2 === r2 && ac2 === c2) ||
        (ar1 === r2 && ac1 === c2 && ar2 === r1 && ac2 === c1)
    );
    if (isOpposite) return '×';

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Puzzle Tabs */}
      <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none border-b border-white/5">
        {TANGO_PUZZLES.map((p, idx) => {
          const isCompleted = completedList.includes(p.id);
          const isActive = puzzleIndex === idx;
          return (
            <button
              key={p.id}
              onClick={() => setPuzzleIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer
                ${isActive 
                  ? 'bg-amber-600 text-white shadow-md' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
            >
              <span>{p.name}</span>
              {isCompleted && <span className="text-emerald-400 text-[10px]">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Description & Rules Toggle */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-sm text-white">Tango — {puzzle.name}</h3>
          <p className="text-[11px] text-white/50">Fill the grid with Suns ☀️ and Moons 🌙 to achieve equilibrium.</p>
        </div>
        <button
          onClick={() => setShowRules(prev => !prev)}
          className="text-amber-400 hover:text-amber-300 text-[11px] flex items-center gap-1 underline cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Rules</span>
        </button>
      </div>

      {/* Rules Banner */}
      {showRules && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200/90 space-y-1">
          <p className="font-bold text-amber-300 text-xs">How to play Tango:</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-white/70">
            <li>Fill every cell with either a Sun (☀️) or Moon (🌙).</li>
            <li>No 3 of the same symbol in a row or column (no ☀️☀️☀️ or 🌙🌙🌙).</li>
            <li>Each row and column must have exactly 2 Suns and 2 Moons.</li>
            <li><span className="font-bold text-amber-300">=</span> means connected cells must be the same symbol.</li>
            <li><span className="font-bold text-rose-300">×</span> means connected cells must be opposite symbols.</li>
          </ul>
        </div>
      )}

      {/* Tango Board Layout */}
      <div className="flex flex-col items-center justify-center p-3 bg-white/[0.02] rounded-2xl border border-white/5">
        <div className="relative inline-block">
          {Array.from({ length: 4 }).map((_, r) => (
            <div key={r} className="flex flex-col">
              {/* Row of cells with horizontal relation markers */}
              <div className="flex items-center">
                {Array.from({ length: 4 }).map((_, c) => {
                  const val = grid[r][c];
                  const isGiven = givensMap.has(`${r},${c}`);
                  const hRel = c < 3 ? getRelation(r, c, r, c + 1) : null;

                  return (
                    <React.Fragment key={c}>
                      <button
                        onClick={() => handleCellClick(r, c)}
                        disabled={isGiven || isSolved}
                        className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl border flex items-center justify-center transition-all relative select-none
                          ${isGiven 
                            ? 'bg-white/10 border-white/20 cursor-default' 
                            : 'cursor-pointer hover:border-white/40 active:scale-95'
                          }
                          ${val === 'S' 
                            ? 'bg-amber-500/25 border-amber-500/60 shadow-lg shadow-amber-900/30' 
                            : val === 'M' 
                            ? 'bg-sky-500/25 border-sky-500/60 shadow-lg shadow-sky-900/30' 
                            : 'bg-white/5 border-white/10'
                          }
                        `}
                      >
                        {val === 'S' && <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />}
                        {val === 'M' && <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-sky-300" />}
                        {isGiven && (
                          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-white/40" />
                        )}
                      </button>

                      {/* Horizontal relation sign */}
                      {c < 3 && (
                        <div className="w-4 flex items-center justify-center">
                          {hRel === '=' && (
                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-1 rounded border border-emerald-500/30">=</span>
                          )}
                          {hRel === '×' && (
                            <span className="text-xs font-black text-rose-400 bg-rose-500/20 px-1 rounded border border-rose-500/30">×</span>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Vertical relation signs between rows */}
              {r < 3 && (
                <div className="flex items-center h-4">
                  {Array.from({ length: 4 }).map((_, c) => {
                    const vRel = getRelation(r, c, r + 1, c);
                    return (
                      <React.Fragment key={c}>
                        <div className="w-11 sm:w-13 flex items-center justify-center">
                          {vRel === '=' && (
                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-1 rounded border border-emerald-500/30">=</span>
                          )}
                          {vRel === '×' && (
                            <span className="text-xs font-black text-rose-400 bg-rose-500/20 px-1 rounded border border-rose-500/30">×</span>
                          )}
                        </div>
                        {c < 3 && <div className="w-4" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Messages */}
      {feedback && (
        <div className="p-3 rounded-xl text-xs font-semibold border flex items-center gap-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-300">
          <Check className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorStatus && (
        <div className="p-3 rounded-xl text-xs font-semibold border flex items-center gap-2 bg-rose-500/10 border-rose-500/20 text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorStatus}</span>
        </div>
      )}

      {/* Footer controls */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-white/40 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          Click cell to cycle ☀️ → 🌙
        </span>

        <div className="flex gap-2">
          <button 
            onClick={handleReset}
            disabled={completedList.includes(puzzle.id)}
            className="text-white/50 hover:text-white text-xs hover:underline transition-all font-bold disabled:opacity-30 disabled:no-underline"
          >
            Reset
          </button>

          {!isSolved && (
            <button
              onClick={handleVerify}
              className="py-1.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wider uppercase rounded-lg cursor-pointer transition-all active:scale-95"
            >
              Verify
            </button>
          )}
        </div>
      </div>
    </div>
  );
});


// ==========================================
// 6. WORDLE (VENTURE KEYWORD GUESS) SUB-GAME COMPONENT
// ==========================================

const WordleGame = memo(({ 
  completedList, 
  onSolve 
}: { 
  completedList: number[]; 
  onSolve: (id: number) => void; 
}) => {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = WORDLE_PUZZLES[puzzleIndex];

  // Persistent user attempts per puzzle id
  const [savedAttempts, setSavedAttempts] = useState<Record<number, string[]>>(() => {
    try {
      const stored = localStorage.getItem('connectup_wordle_saved_attempts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shakeRow, setShakeRow] = useState(false);

  // Sync state when puzzleIndex or savedAttempts change
  useEffect(() => {
    const attempts = savedAttempts[puzzle.id];
    if (attempts && attempts.length > 0) {
      setGuesses(attempts);
      const won = attempts.includes(puzzle.word);
      const lost = attempts.length >= 6 && !won;
      setIsWon(won);
      setIsLost(lost);
      setCurrentGuess("");
      if (won) {
        setFeedback(`Target unlocked! Solved in ${attempts.length} ${attempts.length === 1 ? 'guess' : 'guesses'}.`);
      } else if (lost) {
        setFeedback(`Target was "${puzzle.word}".`);
      } else {
        setFeedback(null);
      }
    } else if (completedList.includes(puzzle.id)) {
      setGuesses([puzzle.word]);
      setCurrentGuess("");
      setIsWon(true);
      setIsLost(false);
      setFeedback(`Target unlocked! "${puzzle.word}" is solved.`);
    } else {
      setGuesses([]);
      setCurrentGuess("");
      setIsWon(false);
      setIsLost(false);
      setShowHint(false);
      setFeedback(null);
    }
  }, [puzzleIndex, puzzle.id, puzzle.word, completedList, savedAttempts]);

  // Evaluate guess against target word
  const evaluateGuess = useCallback((guess: string, target: string) => {
    const res: ('correct' | 'present' | 'absent')[] = Array(5).fill('absent');
    const targetArr = target.split('');
    const guessArr = guess.split('');
    const letterPool: Record<string, number> = {};

    // 1st pass: exact matches
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] === targetArr[i]) {
        res[i] = 'correct';
        targetArr[i] = '#';
      }
    }

    // Pool remaining target letters
    for (let i = 0; i < 5; i++) {
      if (targetArr[i] !== '#') {
        letterPool[targetArr[i]] = (letterPool[targetArr[i]] || 0) + 1;
      }
    }

    // 2nd pass: misplaced letters
    for (let i = 0; i < 5; i++) {
      if (res[i] !== 'correct') {
        const char = guessArr[i];
        if (letterPool[char] && letterPool[char] > 0) {
          res[i] = 'present';
          letterPool[char]--;
        }
      }
    }

    return res;
  }, []);

  // Compute key statuses across all submitted guesses
  const keyStatuses = useMemo(() => {
    const map: Record<string, 'correct' | 'present' | 'absent'> = {};

    guesses.forEach(g => {
      const evaluation = evaluateGuess(g, puzzle.word);
      g.split('').forEach((char, idx) => {
        const status = evaluation[idx];
        const prev = map[char];
        if (prev === 'correct') return;
        if (status === 'correct') {
          map[char] = 'correct';
        } else if (status === 'present') {
          map[char] = 'present';
        } else if (!prev) {
          map[char] = 'absent';
        }
      });
    });

    return map;
  }, [guesses, puzzle.word, evaluateGuess]);

  const handleCharInput = useCallback((char: string) => {
    if (isWon || isLost) return;
    setFeedback(null);
    setCurrentGuess(prev => prev.length < 5 ? prev + char.toUpperCase() : prev);
  }, [isWon, isLost]);

  const handleBackspace = useCallback(() => {
    if (isWon || isLost) return;
    setFeedback(null);
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [isWon, isLost]);

  const handleSubmit = useCallback(() => {
    if (isWon || isLost) return;
    if (currentGuess.length !== 5) {
      setFeedback("Word must be 5 letters!");
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    const nextGuesses = [...guesses, currentGuess];
    setGuesses(nextGuesses);

    // Save to persistent storage
    const updatedMap = { ...savedAttempts, [puzzle.id]: nextGuesses };
    setSavedAttempts(updatedMap);
    try {
      localStorage.setItem('connectup_wordle_saved_attempts', JSON.stringify(updatedMap));
    } catch {
      // ignore
    }

    if (currentGuess === puzzle.word) {
      setIsWon(true);
      setFeedback(`Bravo! You solved "${puzzle.word}" in ${nextGuesses.length} ${nextGuesses.length === 1 ? 'try' : 'tries'}! 🎉`);
      onSolve(puzzle.id);
    } else if (nextGuesses.length >= 6) {
      setIsLost(true);
      setFeedback(`Out of attempts! The target keyword was "${puzzle.word}".`);
    } else {
      setFeedback(null);
    }

    setCurrentGuess("");
  }, [currentGuess, guesses, isWon, isLost, onSolve, puzzle.id, puzzle.word, savedAttempts]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleBackspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleCharInput(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCharInput, handleBackspace, handleSubmit]);

  const handleReset = () => {
    setGuesses([]);
    setCurrentGuess("");
    setIsWon(false);
    setIsLost(false);
    setShowHint(false);
    setFeedback(null);

    // Clear saved attempts for this specific puzzle so player can replay
    const updated = { ...savedAttempts };
    delete updated[puzzle.id];
    setSavedAttempts(updated);
    try {
      localStorage.setItem('connectup_wordle_saved_attempts', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleNextWord = () => {
    if (puzzleIndex < WORDLE_PUZZLES.length - 1) {
      setPuzzleIndex(prev => prev + 1);
    }
  };

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  return (
    <div className="space-y-4">
      {/* Puzzle Tabs */}
      <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none border-b border-white/5">
        {WORDLE_PUZZLES.map((p, idx) => {
          const isCompleted = completedList.includes(p.id);
          const isActive = puzzleIndex === idx;
          return (
            <button
              key={p.id}
              onClick={() => setPuzzleIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer
                ${isActive 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
            >
              <span>Word {idx + 1}</span>
              {isCompleted && <span className="text-emerald-300 text-[10px]">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Header and Hint Toggle */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-sm text-white">Venture Wordle #{puzzle.id}</h3>
          <p className="text-[11px] text-white/50">{puzzle.category} • Guess the 5-letter term in 6 tries.</p>
        </div>
        <button
          onClick={() => setShowHint(prev => !prev)}
          className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center gap-1 underline cursor-pointer"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>{showHint ? "Hide Clue" : "Hint Clue"}</span>
        </button>
      </div>

      {/* Hint Clue Banner */}
      {showHint && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-200/90 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-300">Category Clue: </span>
            <span>{puzzle.hint}</span>
          </div>
        </div>
      )}

      {/* Wordle Grid (6 rows of 5 tiles) */}
      <div className="flex flex-col items-center gap-1.5 py-1">
        {Array.from({ length: 6 }).map((_, rowIdx) => {
          const isSubmitted = rowIdx < guesses.length;
          const isCurrent = rowIdx === guesses.length && !isWon && !isLost;
          const submittedWord = isSubmitted ? guesses[rowIdx] : "";
          const evaluation = isSubmitted ? evaluateGuess(submittedWord, puzzle.word) : [];

          return (
            <div 
              key={rowIdx} 
              className={`flex gap-1.5 transition-transform ${isCurrent && shakeRow ? 'animate-bounce' : ''}`}
            >
              {Array.from({ length: 5 }).map((_, colIdx) => {
                let char = "";
                let status: 'correct' | 'present' | 'absent' | 'typing' | 'empty' = 'empty';

                if (isSubmitted) {
                  char = submittedWord[colIdx];
                  status = evaluation[colIdx];
                } else if (isCurrent) {
                  char = currentGuess[colIdx] || "";
                  status = char ? 'typing' : 'empty';
                }

                return (
                  <div
                    key={colIdx}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center font-black text-base sm:text-lg tracking-wider uppercase transition-all duration-200 select-none
                      ${status === 'correct' 
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/40' 
                        : status === 'present' 
                        ? 'bg-amber-500 border-amber-400 text-black shadow-md shadow-amber-950/40' 
                        : status === 'absent' 
                        ? 'bg-zinc-800/90 border-zinc-700 text-zinc-400' 
                        : status === 'typing' 
                        ? 'bg-white/15 border-white/60 text-white scale-[1.04]' 
                        : 'bg-white/5 border-white/10 text-white/20'
                      }
                    `}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-between gap-2 ${
          isLost 
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
            : isWon 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
        }`}>
          <div className="flex items-center gap-1.5">
            {isLost ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
            <span>{feedback}</span>
          </div>

          {/* Action buttons on win/loss */}
          {(isWon || isLost) && (
            <div className="flex items-center gap-2 shrink-0">
              {puzzleIndex < WORDLE_PUZZLES.length - 1 && (
                <button
                  onClick={handleNextWord}
                  className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] rounded-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <span>Next Word</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* On-screen QWERTY Keyboard */}
      <div className="flex flex-col items-center gap-1 pt-1 touch-manipulation">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1 justify-center w-full max-w-sm">
            {row.map((key) => {
              const status = keyStatuses[key];
              const isEnter = key === 'ENTER';
              const isBackspace = key === 'BACKSPACE';

              let keyStyle = "bg-white/10 border-white/10 text-white hover:bg-white/20";
              if (status === 'correct') {
                keyStyle = "bg-emerald-600 border-emerald-500 text-white font-black";
              } else if (status === 'present') {
                keyStyle = "bg-amber-500 border-amber-400 text-black font-black";
              } else if (status === 'absent') {
                keyStyle = "bg-zinc-800/80 border-zinc-700/80 text-zinc-500";
              }

              return (
                <button
                  key={key}
                  onClick={() => {
                    if (isEnter) handleSubmit();
                    else if (isBackspace) handleBackspace();
                    else handleCharInput(key);
                  }}
                  className={`h-9 sm:h-10 rounded-lg border text-[11px] sm:text-xs font-bold transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center
                    ${isEnter ? 'px-2 sm:px-3 bg-white/20 hover:bg-white/30 text-white font-black' : isBackspace ? 'px-2 sm:px-2.5 bg-white/20 hover:bg-white/30 text-white' : 'flex-1 max-w-[34px] sm:max-w-[38px]'}
                    ${keyStyle}
                  `}
                >
                  {isBackspace ? <Delete className="w-4 h-4" /> : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer controls */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
        <span className="text-white/40 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-emerald-400" />
          Type letters or tap keys
        </span>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            className="text-white/60 hover:text-white hover:underline transition-all font-bold cursor-pointer"
          >
            {isWon || isLost ? 'Play Again' : 'Reset Word'}
          </button>
        </div>
      </div>
    </div>
  );
});
