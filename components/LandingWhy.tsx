import React from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingWhyProps {
  onLoginClick?: () => void;
}

export const LandingWhy = ({ onLoginClick }: LandingWhyProps) => {
  return (
    <div className="w-full bg-white text-zinc-900 font-sans py-12 sm:py-20 px-4 sm:px-8 lg:px-16 border-y border-zinc-200/80">
      <div className="max-w-7xl mx-auto border border-zinc-200 bg-[#FAFAFA] shadow-sm rounded-2xl overflow-hidden">
        
        {/* Header Section */}
        <div className="p-8 sm:p-12 md:p-16 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white border-b border-zinc-200">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#D97706] mb-2 block">Why Choose ConnectUp</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-950 max-w-2xl leading-[1.15]">
              Connecting visionary founders with strategic venture capital
            </h2>
          </div>
          <div>
            <button 
              onClick={onLoginClick}
              className="inline-flex items-center gap-2.5 bg-[#FACC15] hover:bg-amber-400 text-zinc-950 px-6 py-3 rounded-full text-sm sm:text-base font-bold transition-all shadow-xs cursor-pointer group whitespace-nowrap"
            >
              <span>Log In</span>
              <div className="w-6 h-6 rounded-full bg-zinc-950/10 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
              </div>
            </button>
          </div>
        </div>

        {/* 3-Column Grid with Hairline Dividers */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          
          {/* COLUMN 1 */}
          <div className="flex flex-col border-b md:border-b-0 md:border-r border-zinc-200">
            {/* Top Text Block */}
            <div className="p-8 sm:p-10 flex flex-col gap-3 min-h-[220px] bg-white">
              <span className="text-[#D97706] font-mono text-base font-bold">01</span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
                High-Signal Matching
              </h3>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                Smart deal flow filtering pairs founders directly with thesis-aligned VCs, eliminating cold pitch noise and speeding up rounds.
              </p>
            </div>

            {/* Bottom Illustration Block */}
            <div className="p-8 sm:p-12 flex-1 flex items-center justify-center border-t border-zinc-200 bg-[#F9FAFB] min-h-[300px]">
              <div className="relative w-full max-w-[280px] aspect-4/3 flex items-center justify-center">
                {/* SVG Isometric Puzzle Assembly Illustration */}
                <svg viewBox="0 0 320 240" fill="none" className="w-full h-auto drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
                  {/* Scattered Puzzle Pieces on Left */}
                  <g className="opacity-90">
                    {/* Piece 1 */}
                    <path d="M40 70 L65 55 L85 68 L60 82 Z" stroke="#3F3F46" strokeWidth="1.5" fill="#FFFFFF" />
                    <path d="M40 70 L40 78 L60 90 L60 82 Z" stroke="#3F3F46" strokeWidth="1.5" fill="#E4E4E7" />
                    <path d="M60 82 L60 90 L85 76 L85 68 Z" stroke="#3F3F46" strokeWidth="1.5" fill="#D4D4D8" />
                    
                    {/* Piece 2 */}
                    <path d="M25 110 L50 95 L72 108 L47 123 Z" stroke="#3F3F46" strokeWidth="1.5" fill="#FFFFFF" />
                    <path d="M25 110 L25 118 L47 131 L47 123 Z" stroke="#3F3F46" strokeWidth="1.5" fill="#E4E4E7" />
                    
                    {/* Piece 3 */}
                    <path d="M65 130 L90 115 L110 128 L85 143 Z" stroke="#3F3F46" strokeWidth="1.5" fill="#FFFFFF" />
                    <path d="M85 143 L85 151 L110 136 L110 128 Z" stroke="#3F3F46" strokeWidth="1.5" fill="#D4D4D8" />

                    {/* Piece 4 */}
                    <path d="M50 160 L72 146 L92 158 L70 172 Z" stroke="#3F3F46" strokeWidth="1.5" fill="#FFFFFF" />
                  </g>

                  {/* Curved Arrow */}
                  <path d="M105 135 C 125 138, 135 145, 145 150" stroke="#71717A" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                  <path d="M142 145 L148 152 L140 153" stroke="#71717A" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Solved Isometric Grid Board on Right */}
                  <g>
                    {/* Base Grid Board */}
                    <path d="M150 180 L230 130 L300 170 L220 220 Z" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.75" />
                    <path d="M150 180 L150 188 L220 228 L220 220 Z" fill="#E4E4E7" stroke="#27272A" strokeWidth="1.75" />
                    <path d="M220 220 L220 228 L300 178 L300 170 Z" fill="#D4D4D8" stroke="#27272A" strokeWidth="1.75" />

                    {/* Grid Internal Lines */}
                    <path d="M170 167 L240 123 M190 155 L260 111 M210 142 L280 98" stroke="#A1A1AA" strokeWidth="1" strokeDasharray="2 2" />
                    <path d="M170 192 L240 148 M190 205 L260 161 M210 217 L280 173" stroke="#A1A1AA" strokeWidth="1" strokeDasharray="2 2" />

                    {/* Assembled Puzzle Pattern Highlights */}
                    <path d="M170 167 L210 142 L250 165 L210 190 Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.25" />
                    <path d="M210 142 L250 117 L285 138 L245 163 Z" fill="#FAFAFA" stroke="#3F3F46" strokeWidth="1.25" />
                    <path d="M210 190 L250 165 L285 186 L245 211 Z" fill="#E4E4E7" stroke="#3F3F46" strokeWidth="1.25" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* COLUMN 2 */}
          <div className="flex flex-col border-b md:border-b-0 md:border-r border-zinc-200">
            {/* Top Text Block */}
            <div className="p-8 sm:p-10 flex flex-col gap-3 min-h-[220px] bg-white">
              <span className="text-[#D97706] font-mono text-base font-bold">02</span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
                Verified Dealrooms
              </h3>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                Streamlined due diligence with verified traction metrics, pitch decks, and investor updates in one secure space.
              </p>
            </div>

            {/* Bottom Illustration Block */}
            <div className="p-8 sm:p-12 flex-1 flex items-center justify-center border-t border-zinc-200 bg-[#F9FAFB] min-h-[300px]">
              <div className="relative w-full max-w-[280px] aspect-4/3 flex items-center justify-center">
                {/* SVG Isometric Approved/Rejected Stamp Cards */}
                <svg viewBox="0 0 320 240" fill="none" className="w-full h-auto drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
                  {/* Card 1 (Front Left) - REJECTED */}
                  <g className="transform transition-transform hover:-translate-y-1 duration-300">
                    <path d="M20 160 L100 110 L155 140 L75 190 Z" fill="#FFFFFF" stroke="#3F3F46" strokeWidth="1.5" />
                    <path d="M20 160 L20 166 L75 196 L75 190 Z" fill="#E4E4E7" stroke="#3F3F46" strokeWidth="1.5" />
                    <path d="M75 190 L75 196 L155 146 L155 140 Z" fill="#D4D4D8" stroke="#3F3F46" strokeWidth="1.5" />
                    
                    {/* Stamp Banner */}
                    <path d="M28 150 L85 115 L105 126 L48 161 Z" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.25" />
                    <text x="36" y="152" fill="#DC2626" fontSize="8" fontWeight="bold" fontFamily="sans-serif" transform="rotate(-30 36 152)">MISMATCH</text>

                    {/* Lines */}
                    <path d="M50 170 L95 142 M55 176 L115 138" stroke="#D4D4D8" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="132" cy="148" r="3" fill="#EF4444" />
                  </g>

                  {/* Card 2 (Middle) - REJECTED */}
                  <g className="transform transition-transform hover:-translate-y-1 duration-300">
                    <path d="M85 115 L165 65 L220 95 L140 145 Z" fill="#FFFFFF" stroke="#3F3F46" strokeWidth="1.5" />
                    <path d="M85 115 L85 121 L140 151 L140 145 Z" fill="#E4E4E7" stroke="#3F3F46" strokeWidth="1.5" />
                    <path d="M140 145 L140 151 L220 101 L220 95 Z" fill="#D4D4D8" stroke="#3F3F46" strokeWidth="1.5" />
                    
                    {/* Stamp Banner */}
                    <path d="M93 105 L150 70 L170 81 L113 116 Z" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.25" />
                    <text x="101" y="107" fill="#DC2626" fontSize="8" fontWeight="bold" fontFamily="sans-serif" transform="rotate(-30 101 107)">MISMATCH</text>

                    {/* Lines */}
                    <path d="M115 125 L160 97 M120 131 L180 93" stroke="#D4D4D8" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="197" cy="103" r="3" fill="#EF4444" />
                  </g>

                  {/* Card 3 (Back Right) - APPROVED */}
                  <g className="transform transition-transform hover:-translate-y-1 duration-300">
                    <path d="M150 70 L230 20 L285 50 L205 100 Z" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.75" />
                    <path d="M150 70 L150 76 L205 106 L205 100 Z" fill="#E4E4E7" stroke="#27272A" strokeWidth="1.75" />
                    <path d="M205 100 L205 106 L285 56 L285 50 Z" fill="#D4D4D8" stroke="#27272A" strokeWidth="1.75" />
                    
                    {/* Stamp Banner */}
                    <path d="M158 60 L215 25 L235 36 L178 71 Z" fill="#DCFCE7" stroke="#22C55E" strokeWidth="1.25" />
                    <text x="166" y="62" fill="#15803D" fontSize="8" fontWeight="bold" fontFamily="sans-serif" transform="rotate(-30 166 62)">VERIFIED</text>

                    {/* Lines */}
                    <path d="M180 80 L225 52 M185 86 L245 48" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="262" cy="58" r="4" fill="#22C55E" />
                    <path d="M260 58 L261.5 59.5 L264 56.5" stroke="#FFFFFF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* COLUMN 3 */}
          <div className="flex flex-col">
            {/* Top Text Block */}
            <div className="p-8 sm:p-10 flex flex-col gap-3 min-h-[220px] bg-white">
              <span className="text-[#D97706] font-mono text-base font-bold">03</span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
                Global Venture Network
              </h3>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                Connect across top global startup hubs to build international investor syndicates and expand into new markets.
              </p>
            </div>

            {/* Bottom Illustration Block */}
            <div className="p-8 sm:p-12 flex-1 flex items-center justify-center border-t border-zinc-200 bg-[#F9FAFB] min-h-[300px]">
              <div className="relative w-full max-w-[280px] aspect-4/3 flex items-center justify-center">
                {/* SVG Context-Aware Hub Diagram */}
                <svg viewBox="0 0 320 240" fill="none" className="w-full h-auto drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
                  {/* Connector Lines */}
                  <path d="M160 115 L100 55" stroke="#A1A1AA" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M160 115 L220 55" stroke="#A1A1AA" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M160 115 L100 175" stroke="#A1A1AA" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M160 115 L220 175" stroke="#A1A1AA" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* Central Node Hub */}
                  <g>
                    <path d="M135 120 L160 105 L185 120 L160 135 Z" fill="#FFFFFF" stroke="#D97706" strokeWidth="2" />
                    <circle cx="160" cy="120" r="12" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
                    {/* Lightning / Shield Icon inside */}
                    <path d="M160 113 L155 121 L160 121 L159 127 L165 119 L160 119 Z" fill="#D97706" />
                  </g>

                  {/* TOP-LEFT NODE: FOUNDERS */}
                  <g>
                    <circle cx="100" cy="55" r="18" fill="#FFFFFF" stroke="#3F3F46" strokeWidth="1.5" />
                    <path d="M92 61 L92 53 L100 48 L108 53 L108 61 Z" fill="#F4F4F5" stroke="#3F3F46" strokeWidth="1.25" />
                    <rect x="96" y="54" width="8" height="7" fill="#E4E4E7" stroke="#3F3F46" strokeWidth="1" />
                    <text x="100" y="30" fill="#3F3F46" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">FOUNDERS</text>
                  </g>

                  {/* TOP-RIGHT NODE: INVESTORS */}
                  <g>
                    <circle cx="220" cy="55" r="18" fill="#FFFFFF" stroke="#3F3F46" strokeWidth="1.5" />
                    <circle cx="220" cy="50" r="4" fill="#E4E4E7" stroke="#3F3F46" strokeWidth="1.25" />
                    <path d="M212 62 C 212 57, 228 57, 228 62" stroke="#3F3F46" strokeWidth="1.25" fill="#F4F4F5" />
                    <text x="220" y="30" fill="#3F3F46" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">INVESTORS</text>
                  </g>

                  {/* BOTTOM-LEFT NODE: SYNDICATES */}
                  <g>
                    <circle cx="100" cy="175" r="18" fill="#FFFFFF" stroke="#3F3F46" strokeWidth="1.5" />
                    <path d="M92 181 L92 173 L100 168 L108 173 L108 181 Z" fill="#F4F4F5" stroke="#3F3F46" strokeWidth="1.25" />
                    <text x="100" y="206" fill="#3F3F46" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">SYNDICATES</text>
                  </g>

                  {/* BOTTOM-RIGHT NODE: CAPITAL */}
                  <g>
                    <circle cx="220" cy="175" r="18" fill="#FFFFFF" stroke="#3F3F46" strokeWidth="1.5" />
                    <path d="M214 175 A 6 6 0 1 0 226 175 A 6 6 0 1 0 214 175" stroke="#3F3F46" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
                    <rect x="216" y="172" width="8" height="7" rx="1" fill="#E4E4E7" stroke="#3F3F46" strokeWidth="1.25" />
                    <text x="220" y="206" fill="#3F3F46" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">CAPITAL</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};



