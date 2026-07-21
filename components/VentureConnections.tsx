import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, RotateCcw, Check, Sparkles, AlertCircle, HelpCircle, 
  ChevronRight, ArrowLeft, Crown, HelpCircle as HintIcon, Info, RefreshCw
} from 'lucide-react';

// ==========================================
// TYPES & CONSTANTS
// ==========================================

interface PuzzleState {
  pinpoint: 'unplayed' | 'completed';
  crossclimb: 'unplayed' | 'completed';
  queens: 'unplayed' | 'completed';
  connections: 'unplayed' | 'completed';
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
    correctCategory: "Venture Capital Firms",
    clues: [
      "Known for early backing of Apple, Google, and Airbnb",
      "Founded by Don Valentine in 1972",
      "A redwood tree is their famous green logo",
      "Managed the legendary WhatsApp investment",
      "Sequoia Capital"
    ],
    options: ["Venture Capital Firms", "SaaS Software Solutions", "Startup Incubators", "Investment Banks"]
  },
  {
    id: 2,
    correctCategory: "SaaS Sales Metrics",
    clues: [
      "Crucial metric for subscription-based business models",
      "Often contrasted with Customer Acquisition Cost (CAC)",
      "Represents the total predictable revenue in a month",
      "Acronyms include MRR, Churn, and LTV",
      "SaaS Key Performance Indicators"
    ],
    options: ["SaaS Sales Metrics", "Digital Advertising Formats", "Hardware Specs", "Developer Operations"]
  },
  {
    id: 3,
    correctCategory: "Generative AI Concepts",
    clues: [
      "Uses neural net architectures with self-attention",
      "Key components are weights, tokens, and context window",
      "Often customized via retrieval-augmented generation (RAG)",
      "Pioneered by researchers in the 2017 paper 'Attention Is All You Need'",
      "Transformers & Large Language Models"
    ],
    options: ["Generative AI Concepts", "SQL Query Execution", "Agile Project Frameworks", "Cybersecurity Firewalls"]
  },
  {
    id: 4,
    correctCategory: "Cloud Service Providers",
    clues: [
      "Global distributed servers hosting serverless compute and databases",
      "Known for high scalability, edge networks, and load balancers",
      "Includes storage solutions like S3 buckets and Cloud Storage",
      "Features services like EC2, Compute Engine, and Lambda",
      "Amazon Web Services, Google Cloud, and Microsoft Azure"
    ],
    options: ["Cloud Service Providers", "Payment Gateways", "NoSQL Databases", "Container Registries"]
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
    name: "The Venture Runway",
    steps: [
      { word: "BULL", clue: "An optimistic market sentiment favoring growth" },
      { word: "BELL", clue: "The NYSE opening sound to start trading" },
      { word: "BELT", clue: "Tightening this is necessary when runway is low" },
      { word: "BEST", clue: "The ideal product-market fit every founder seeks" }
    ],
    startingScramble: ["BEST", "BULL", "BELT", "BELL"]
  },
  {
    id: 2,
    name: "Code and Capital",
    steps: [
      { word: "CODE", clue: "The building blocks of software" },
      { word: "COPE", clue: "How founders deal with intense burn rate stress" },
      { word: "CAPE", clue: "An investor's protective limit or capitalization prefix" },
      { word: "CAPS", clue: "Valuation limits set in convertible notes" }
    ],
    startingScramble: ["CAPS", "CODE", "CAPE", "COPE"]
  },
  {
    id: 3,
    name: "The Scaling Loop",
    steps: [
      { word: "FLOW", clue: "State of peak software developer productivity" },
      { word: "GLOW", clue: "The radiant pride of announcing a fresh seed round" },
      { word: "GROW", clue: "What every venture-backed startup is pressured to do" },
      { word: "SLOW", clue: "The growth rate that alarms aggressive venture investors" }
    ],
    startingScramble: ["GROW", "FLOW", "SLOW", "GLOW"]
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
    name: "Venture Terms & SaaS Metrics",
    categories: [
      {
        title: "PITCH DECK SLIDES",
        words: ["PROBLEM", "SOLUTION", "TRACTION", "TEAM"],
        color: "border-yellow-500",
        bgColor: "bg-yellow-500/20",
        textColor: "text-yellow-300"
      },
      {
        title: "FUNDING ROUNDS",
        words: ["SEED", "SERIES A", "SERIES B", "BRIDGE"],
        color: "border-emerald-500",
        bgColor: "bg-emerald-500/20",
        textColor: "text-emerald-300"
      },
      {
        title: "SAAS ANALYTICS METRICS",
        words: ["CHURN", "MRR", "LTV", "CAC"],
        color: "border-blue-500",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-300"
      },
      {
        title: "ASSOCIATED WITH 'UNICORNS'",
        words: ["STARTUP", "HORN", "MYTH", "PEGASUS"],
        color: "border-purple-500",
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-300"
      }
    ]
  },
  {
    id: 2,
    name: "Software Stack & Engineering",
    categories: [
      {
        title: "FRONTEND FRAMEWORKS",
        words: ["REACT", "ANGULAR", "VUE", "SVELTE"],
        color: "border-yellow-500",
        bgColor: "bg-yellow-500/20",
        textColor: "text-yellow-300"
      },
      {
        title: "POPULAR DATABASES",
        words: ["POSTGRES", "MONGO", "REDIS", "SQLITE"],
        color: "border-emerald-500",
        bgColor: "bg-emerald-500/20",
        textColor: "text-emerald-300"
      },
      {
        title: "SERVERLESS & HOSTING",
        words: ["VERCEL", "NETLIFY", "HEROKU", "RENDER"],
        color: "border-blue-500",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-300"
      },
      {
        title: "DEVELOPER SLANG",
        words: ["BOOT", "BUG", "PATCH", "PING"],
        color: "border-purple-500",
        bgColor: "bg-purple-500/20",
        textColor: "text-purple-300"
      }
    ]
  },
  {
    id: 3,
    name: "Startup Culture & Operations",
    categories: [
      {
        title: "COMMON WORKPLACES",
        words: ["OFFICE", "HOME", "CAFE", "GARAGE"],
        color: "border-yellow-500",
        bgColor: "bg-yellow-500/20",
        textColor: "text-yellow-300"
      },
      {
        title: "STARTUP COMP/BENEFITS",
        words: ["EQUITY", "STOCKS", "BONUS", "HEALTH"],
        color: "border-emerald-500",
        bgColor: "bg-emerald-500/20",
        textColor: "text-emerald-300"
      },
      {
        title: "ACQUISITION CHANNELS",
        words: ["SEO", "EMAIL", "SOCIAL", "SEARCH"],
        color: "border-blue-500",
        bgColor: "bg-blue-500/20",
        textColor: "text-blue-300"
      },
      {
        title: "THINGS TO 'PIVOT'",
        words: ["STARTUP", "CAREER", "TABLE", "CAMERA"],
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
  const [activeGame, setActiveGame] = useState<null | 'pinpoint' | 'crossclimb' | 'queens' | 'connections'>(null);
  const [completedGames, setCompletedGames] = useState<PuzzleState>({
    pinpoint: 'unplayed',
    crossclimb: 'unplayed',
    queens: 'unplayed',
    connections: 'unplayed'
  });

  const [completedPuzzles, setCompletedPuzzles] = useState<Record<string, number[]>>({
    pinpoint: [],
    crossclimb: [],
    queens: [],
    connections: []
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

  const handleSolvePuzzle = useCallback((game: 'pinpoint' | 'crossclimb' | 'queens' | 'connections', id: number) => {
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

  const handleBackToMain = () => {
    setActiveGame(null);
  };

  // Render game list matching LinkedIn screenshot visual style
  if (activeGame === null) {
    const isPinpointAll = completedPuzzles.pinpoint.length === PINPOINT_PUZZLES.length;
    const isCrossclimbAll = completedPuzzles.crossclimb.length === CROSSCLIMB_PUZZLES.length;
    const isQueensAll = completedPuzzles.queens.length === QUEENS_PUZZLES.length;
    const isConnectionsAll = completedPuzzles.connections.length === CONNECTIONS_PUZZLES.length;

    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl flex flex-col relative overflow-hidden text-white">
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
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              {/* Blue Map/Target Pinpoint Icon */}
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-900/40 relative">
                <Target className="w-5 h-5" />
                {isPinpointAll && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[9px] font-bold">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm text-white group-hover:text-yellow-400 transition-colors">Pinpoint</span>
                  <span className="text-[11px] text-white/40 font-medium">#809</span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  {isPinpointAll ? '🎉 All completed!' : `${completedPuzzles.pinpoint.length}/${PINPOINT_PUZZLES.length} puzzles solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 2. Crossclimb */}
          <button 
            onClick={() => setActiveGame('crossclimb')}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              {/* Cyan Stair/Ladder Crossclimb Icon */}
              <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-cyan-900/40 relative">
                <div className="flex flex-col gap-0.5 items-end rotate-12">
                  <div className="w-3.5 h-1 bg-white rounded-sm" />
                  <div className="w-2.5 h-1 bg-white rounded-sm" />
                  <div className="w-1.5 h-1 bg-white rounded-sm" />
                </div>
                {isCrossclimbAll && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[9px] font-bold">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm text-white group-hover:text-yellow-400 transition-colors">Crossclimb</span>
                  <span className="text-[11px] text-white/40 font-medium">#809</span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  {isCrossclimbAll ? '🎉 All completed!' : `${completedPuzzles.crossclimb.length}/${CROSSCLIMB_PUZZLES.length} ladders solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 3. Queens */}
          <button 
            onClick={() => setActiveGame('queens')}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              {/* Purple Crown Queens Icon */}
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-900/40 relative">
                <Crown className="w-5 h-5 text-white" />
                {isQueensAll && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[9px] font-bold">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm text-white group-hover:text-yellow-400 transition-colors">Queens</span>
                  <span className="text-[11px] text-white/40 font-medium">#809</span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  {isQueensAll ? '🎉 All completed!' : `${completedPuzzles.queens.length}/${QUEENS_PUZZLES.length} boards solved`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 4. Connections */}
          <button 
            onClick={() => setActiveGame('connections')}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              {/* Amber Node Connections Icon */}
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black shrink-0 shadow-lg shadow-amber-900/40 relative">
                <div className="grid grid-cols-2 gap-1 p-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-black/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-black/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-black/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-black/80" />
                </div>
                {isConnectionsAll && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border border-black flex items-center justify-center text-[9px] font-bold">✓</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm text-white group-hover:text-yellow-400 transition-colors">Connections</span>
                  <span className="text-[11px] text-white/40 font-medium">#101</span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  {isConnectionsAll ? '🎉 All completed!' : `${completedPuzzles.connections.length}/${CONNECTIONS_PUZZLES.length} connections solved`}
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
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl flex flex-col relative overflow-hidden text-white">
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
      <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-2">
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
