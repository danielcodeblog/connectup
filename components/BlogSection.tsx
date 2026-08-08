import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Calendar, User, Clock, ArrowLeft } from 'lucide-react';
import investorsAndFounders from '@/src/assets/images/investors_and_founders_1_1785147760772.jpg';
import ventureTech from '@/src/assets/images/venture_connection_tech_1784549043938.jpg';
import smartMatching from '@/src/assets/images/smart_matching_investment_1784549068657.jpg';
import goldenGate from '@/src/assets/images/golden_gate_bridge_1785141940553.jpg';
import worldModelAi from '@/src/assets/images/world_model_ai_1785704586218.jpg';

const blogs: any[] = [
  {
    id: 1,
    company: 'OMMAX x SINGULIER',
    title: 'OMMAX x Singulier join forces to create Europe’s leading AI management consulting platform',
    excerpt: 'A landmark transaction uniting 600+ AI practitioners to accelerate enterprise digital transformation across European markets.',
    content: `
      <h2>A Landmark European AI Consolidation</h2>
      <p>We are thrilled to announce that portfolio company OMMAX has joined forces with Singulier to establish Europe's premier AI-first management consulting platform. This strategic union combines deep digital execution expertise with world-class advisory capabilities.</p>
      <p>Since our early-stage backing, OMMAX has scaled revenues significantly, partnering with premier private equity sponsors and global enterprises to unlock value through artificial intelligence and automation strategies.</p>
      <blockquote>"This transaction marks a pivotal moment for European tech leadership, proving that specialized AI consulting can scale rapidly across international borders."</blockquote>
      <h3>Key Highlights of the Transaction</h3>
      <ul>
        <li><strong>Expanded Reach:</strong> Over 600 AI specialists across London, Munich, Paris, and Zurich.</li>
        <li><strong>Comprehensive AI Suite:</strong> End-to-end capabilities from generative AI roadmap design to proprietary data pipeline engineering.</li>
        <li><strong>Sustained Value Creation:</strong> Deep integration with European sponsors to optimize portfolio company operations.</li>
      </ul>
      <p>We congratulate the leadership teams at both companies as they pioneer the next era of European enterprise tech transformation.</p>
    `,
    category: 'Portfolio Exit',
    badge: 'PORTFOLIO EXIT',
    author: 'Sarah Chen',
    date: 'Oct 22, 2026',
    readTime: '4 min read',
    image: investorsAndFounders,
  },
  {
    id: 2,
    company: 'SARONIC x NVIDIA',
    title: 'Saronic x NVIDIA collaborate to power autonomous surface vessel artificial intelligence',
    excerpt: 'Integrating real-time edge computing on autonomous naval vessels to enable tactical autonomy at sea.',
    content: `
      <h2>Powering Next-Gen Maritime Autonomy</h2>
      <p>Saronic Technologies has officially announced a multi-year strategic partnership with NVIDIA to bring accelerated computing and real-time sensor fusion to autonomous maritime defense vessels.</p>
      <p>By embedding advanced robotics edge platforms directly into Saronic's surface vessels, defense units can process terabytes of sonar, radar, and optical imagery at zero latency directly at sea.</p>
      <h3>Strategic Impact & Innovation</h3>
      <ul>
        <li><strong>Edge AI at Scale:</strong> Onboard multi-modal neural network processing without relying on high-latency satellite feeds.</li>
        <li><strong>Swarm Intelligence:</strong> Coordinated fleet navigation permitting multi-vessel tactical maneuvers.</li>
        <li><strong>Rapid Deployment:</strong> Modular hardware integration allowing field upgrades in under 15 minutes.</li>
      </ul>
      <p>As early backers of Saronic, we are immensely proud to see their vision of modern maritime sovereignty become reality alongside world-class technology partners.</p>
    `,
    category: 'Defense Tech',
    badge: 'PORTFOLIO NEWS',
    author: 'Marcus Vance',
    date: 'Oct 14, 2026',
    readTime: '6 min read',
    image: ventureTech,
  },
  {
    id: 3,
    company: 'AMI LABS',
    title: 'AMI Labs raises $1B Series A to develop world-model AI architecture',
    excerpt: 'Pioneering causal AI models beyond traditional LLMs, backed by top venture capital partners globally.',
    content: `
      <h2>Building World Models Beyond Token Prediction</h2>
      <p>AMI Labs has closed a landmark $1 Billion Series A round to pioneer a new paradigm in artificial intelligence: World-Model Architecture. Moving beyond token prediction, AMI Labs' architectures learn physical commonsense and causal reasoning.</p>
      <p>Led by Turing Award winner Yann LeCun and a team of world-renowned researchers, AMI Labs is building foundation models capable of planning, spatial reasoning, and real-time physical interaction.</p>
      <blockquote>"True intelligence requires understanding how the physical world works, not just predicting the next word in a sentence."</blockquote>
      <h3>Why World Models Matter</h3>
      <ul>
        <li><strong>Causal Reasoning:</strong> Enables AI agents to predict consequences before taking actions in robotics and complex industrial settings.</li>
        <li><strong>Energy Efficiency:</strong> Requires up to 80% fewer compute resources for complex logical planning compared to standard auto-regressive models.</li>
        <li><strong>Universal Application:</strong> From autonomous manufacturing to breakthrough drug discovery simulations.</li>
      </ul>
      <p>ConnectUp is proud to participate in this syndicate alongside global technology leaders to shape the future of artificial general intelligence.</p>
    `,
    category: 'AI Research',
    badge: 'PORTFOLIO HIGHLIGHT',
    author: 'Elena Rodriguez',
    date: 'Oct 02, 2026',
    readTime: '7 min read',
    image: worldModelAi,
  },
  {
    id: 4,
    company: 'HARMATTAN DEFENSE',
    title: 'Harmattan closes $80M Series B to scale software-defined defense systems',
    excerpt: 'Expanding transatlantic manufacturing capabilities for resilient, jam-proof defense hardware.',
    content: `
      <h2>Scaling Resilient Defense Infrastructure</h2>
      <p>Harmattan has finalized an $80 Million Series B round led by premier transatlantic defense technology investors. The capital injection will expand manufacturing capacity for Harmattan's flagship autonomous defense systems.</p>
      <p>With ongoing geopolitical shifts, modern defense requires software-defined, rapidly deployable hardware capable of operating in satellite-denied or heavily jammed electronic environments.</p>
      <h3>Key Focus Areas for Series B</h3>
      <ul>
        <li><strong>Production Scaling:</strong> Tripling European manufacturing footprint to deliver hardware on accelerated timelines.</li>
        <li><strong>Electronic Warfare Resilience:</strong> Next-gen mesh networking that maintains unit cohesion under signal jamming.</li>
        <li><strong>Dual-Use Potential:</strong> Adapting sensor arrays for civilian disaster recovery and search-and-rescue missions.</li>
      </ul>
      <p>We continue to support Harmattan's dedicated engineering team as they redefine critical infrastructure protection and strategic autonomy.</p>
    `,
    category: 'Strategic Tech',
    badge: 'PORTFOLIO NEWS',
    author: 'David Kim',
    date: 'Sep 21, 2026',
    readTime: '5 min read',
    image: goldenGate,
  }
];

export const BlogSection: React.FC = () => {
  const [selectedBlog, setSelectedBlog] = useState<typeof blogs[0] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (selectedBlog) {
      document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedBlog]);

  return (
    <div className="w-full py-20 sm:py-28 bg-white text-zinc-900 relative overflow-hidden" ref={(el) => { if(el) el.id = 'blog'; }}>
      <div className="max-w-none mx-auto px-4 sm:px-10 lg:px-16 w-full relative z-10">

        {selectedBlog ? (
          /* Detailed View */
          <div className="w-full">
            <button 
              onClick={() => setSelectedBlog(null)}
              className="text-zinc-900 hover:text-black transition-colors mb-12 font-bold cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft size={18} /> Back to News
            </button>

            <div
              className="w-full rounded-none border border-zinc-200 overflow-hidden bg-white shadow-[0_15px_50px_rgba(0,0,0,0.04)]"
            >
              <div className="relative h-[55vh] min-h-[380px]">
                <img 
                  src={selectedBlog.image} 
                  alt={selectedBlog.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 md:p-14">
                  <span className="px-4 py-1.5 rounded-full bg-[#FFBF00] text-zinc-900 text-[10px] font-bold uppercase tracking-widest mb-5 inline-block">
                    {selectedBlog.category}
                  </span>
                  <h2 className="font-serif text-3xl md:text-5xl font-normal text-white tracking-tight leading-[1.1] max-w-5xl">
                    {selectedBlog.title}
                  </h2>
                </div>
              </div>

              <div className="p-8 md:p-14 max-w-5xl mx-auto">
                <div className="flex flex-wrap items-center gap-8 mb-12 text-zinc-500 text-sm pb-10 border-b border-zinc-200">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-[#CFB53B]" />
                    <span className="font-semibold text-zinc-900">{selectedBlog.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-[#CFB53B]" />
                    <span>{selectedBlog.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-[#CFB53B]" />
                    <span>{selectedBlog.readTime}</span>
                  </div>
                </div>

                <div 
                  className="prose prose-zinc prose-yellow max-w-none text-zinc-700 leading-relaxed text-lg prose-headings:text-zinc-900 prose-headings:font-normal prose-headings:font-serif prose-headings:tracking-tight prose-p:mb-6 prose-blockquote:border-l-[#FFBF00] prose-blockquote:bg-zinc-50 prose-blockquote:border prose-blockquote:border-zinc-200 prose-blockquote:p-8 prose-blockquote:rounded-[2.5rem] prose-blockquote:not-italic prose-blockquote:text-xl prose-blockquote:font-serif prose-blockquote:font-light"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Animated Blog Header Title */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex justify-center mb-10 sm:mb-16 px-2 sm:px-6"
            >
              <h2 className="text-5xl sm:text-7xl md:text-8xl font-display font-black text-center tracking-tighter uppercase">
                <motion.span 
                  initial={{ rotate: -15, opacity: 0, scale: 0.8 }}
                  whileInView={{ rotate: 0, opacity: 1, scale: 1 }}
                  whileHover={{ rotate: 6, scale: 1.06 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, type: 'spring', stiffness: 200, damping: 15 }}
                  className="inline-block text-zinc-950 cursor-pointer origin-center"
                >
                  Blog
                </motion.span>
              </h2>
            </motion.div>

            {/* Carousel Matching Image Exactly */}
            <div className="relative group/carousel px-2 sm:px-6">
            
            {/* Left Scroll Button */}
            <button 
              onClick={() => scroll('left')}
              className="absolute -left-2 sm:left-1 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/90 backdrop-blur-md shadow-xl border border-zinc-200 text-zinc-700 flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Previous card"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Right Scroll Button */}
            <button 
              onClick={() => scroll('right')}
              className="absolute -right-2 sm:right-1 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white shadow-xl border border-zinc-200 text-zinc-900 flex items-center justify-center hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Next card"
            >
              <ChevronRight size={22} />
            </button>

            {/* Carousel Row */}
            <div 
              ref={scrollRef}
              className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-none scroll-smooth py-2 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="group cursor-pointer relative w-[310px] sm:w-[370px] md:w-[410px] h-[480px] sm:h-[530px] shrink-0 snap-start rounded-none overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 bg-zinc-950 border border-zinc-200"
                  onClick={() => setSelectedBlog(blog)}
                >
                  {/* Card Background Image */}
                  <img
                    src={blog.image}
                    alt={blog.title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  
                  {/* Dark Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent transition-opacity duration-300 group-hover:from-black" />

                  {/* Bottom Text Details */}
                  <div className="relative z-10 h-full p-6 sm:p-8 flex flex-col justify-end text-white">
                    <div className="space-y-2.5">
                      {/* Main Title */}
                      <h3 className="font-sans text-xl sm:text-2xl font-normal leading-snug text-white group-hover:text-white transition-colors line-clamp-3">
                        {blog.title}
                      </h3>

                      {/* Thin Separator Line */}
                      <div className="w-10 h-[1px] bg-white/60 my-3 group-hover:w-16 group-hover:bg-white transition-all duration-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

      </div>
    </div>
  );
};



