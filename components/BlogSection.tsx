import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Calendar, User, Clock } from 'lucide-react';
import regeneratedImage from '@/src/assets/images/regenerated_image_1782595459649.jpg';

const blogs = [
  {
    id: 1,
    title: "The Future of Professional Networking in 2026",
    excerpt: "Discover how AI and decentralized platforms are reshaping the way connect and collaborate globally.",
    content: `
      <p>The landscape of professional networking is undergoing its most significant transformation since the inception of LinkedIn. As we move deeper into 2026, several key trends are emerging that redefine how professionals connect and build meaningful relationships.</p>
      <h3>The AI Colleague</h3>
      <p>AI is no longer just a tool; it's a participant in our professional lives. Autonomous agents now handle initial introductions, filtering for strategic alignment and shared values before a human ever enters the conversation.</p>
      <blockquote>"Networking in 2026 is less about the number of connections and more about the quality of alignment."</blockquote>
      <h3>Decentralized Identity</h3>
      <p>With the rise of Web3 protocols, professionals are taking back ownership of their professional graph. Your reputation is now portable, verified on-chain, and independent of any single platform's algorithm.</p>
      <p>This shift allows for more meritocratic discovery, where obscure but highly skilled experts can be found based on their verified contributions rather than their social media presence.</p>
    `,
    category: "Insights",
    author: "Elena Rodriguez",
    date: "May 12, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=60&w=800&auto=format&fit=crop&sat=-100"
  },
  {
    id: 2,
    title: "10 Tips for Crafting a Winning Pitch Deck",
    excerpt: "Learn the secrets behind pitch decks that secured millions in seed funding from top-tier VCs.",
    content: `
      <p>Securing venture capital in a crowded market requires more than just a good idea; it requires a compelling narrative backed by undeniable data. Here are the top strategies used by the most successful startups of the last year.</p>
      <h3>1. The "Why Now" Slide</h3>
      <p>Investors aren't just looking for a good business; they're looking for a timed opportunity. Why is your solution essential <i>right now</i>? Is it a shift in regulation, a technological breakthrough, or a change in consumer behavior?</p>
      <h3>2. Frictionless Financials</h3>
      <p>Don't hide your numbers in complex spreadsheets. Your deck should highlight unit economics, CAC/LTV ratios, and a clear path to profitability with surgical precision.</p>
      <h3>3. The Execution Moat</h3>
      <p>Ideas are cheap. Show why your team is specifically equipped to win this market. Highlight previous exits, deep domain expertise, and unique operational advantages.</p>
    `,
    category: "Guides",
    author: "Marcus Chen",
    date: "May 08, 2026",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=60&w=800&auto=format&fit=crop&sat=-100"
  },
  {
    id: 3,
    title: "The Rise of the Founders Scheduler: Reclaiming Your Calendar",
    excerpt: "Learn how modern builders are avoiding booking fatigue and structuring high-efficiency pitch windows.",
    content: `
      <p>In the high-stakes journey of fundraising and recruiting, a founder's calendar is their most precious resource. Traditional booking tools often lead to fragmented days, back-to-back meetings, and mental exhaustion. Enter the Founders Scheduler—a dedicated scheduling framework tailored specifically for high-velocity matchmaking.</p>
      <h3>1. Unified Availability Blocks</h3>
      <p>Instead of leaving your whole week open, define highly focused "pitch days" or "office hours". Grouping meetings together keeps your contextual focus sharp and leaves long, uninterrupted blocks for actual product building.</p>
      <h3>2. Proactive Buffer Times</h3>
      <p>Never schedule meetings back-to-back without a 10-minute buffer. High-energy pitches require a moment of mental resets, note-taking, and reflection before diving into the next conversation.</p>
      <h3>3. Frictionless Platform Booking</h3>
      <p>By integrating booking directly into the swipe-and-match ecosystem, ConnectUp eliminates the awkward email dance of "what time works for you?". One swipe, one match, and a meeting is secured in seconds.</p>
    `,
    category: "Productivity",
    author: "Sophia Patel",
    date: "June 27, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=60&w=800&auto=format&fit=crop&sat=-100"
  },
  {
    id: 4,
    title: "The Art of the 30-Second Founder Video Pitch",
    excerpt: "Attention spans are shorter than ever. Learn how to hook potential co-founders and investors instantly.",
    content: `
      <p>In the age of rapid matching, the traditional 30-slide pitch deck is losing its crown to high-impact, short-form video pitches. Here is how to condense your vision into a stellar 30 seconds that drives swipes and builds connections.</p>
      <h3>1. The Instant Hook (0-5 Seconds)</h3>
      <p>Do not start with your name or title. Start with a massive problem statement or a mind-bending stat. Grab the viewer by the collar immediately.</p>
      <h3>2. The Core Solution (5-20 Seconds)</h3>
      <p>Explain your product simply enough that a 10-year-old understands. Focus on the core benefit and the proprietary technology or 'unfair advantage' you possess.</p>
      <h3>3. The Ask & Call to Action (20-30 Seconds)</h3>
      <p>Conclude with what you are looking for—be it a Technical Co-Founder, Seed Investment, or beta users—and tell them to swipe right to match and talk instantly.</p>
    `,
    category: "Guides",
    author: "David Vance",
    date: "June 25, 2026",
    readTime: "5 min read",
    image: regeneratedImage
  }
];



export const BlogSection: React.FC = () => {
  const [selectedBlog, setSelectedBlog] = useState<typeof blogs[0] | null>(null);

  useEffect(() => {
    if (selectedBlog) {
      document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedBlog]);

  return (
    <div className="w-full py-24 sm:py-32 bg-[#0B0B0D]" ref={(el) => { if(el) el.id = 'blog'; }}>
      <div className="max-w-none mx-auto px-4 sm:px-12 lg:px-20 w-full">
        {!selectedBlog && (
          <div className="mb-20">
            <span className="text-xs tracking-[0.25em] font-bold uppercase text-[#EAB308] mb-5 block">Our Journal</span>
          </div>
        )}

        {selectedBlog ? (
          /* Detailed View */
          <div className="w-full">
            <button 
              onClick={() => setSelectedBlog(null)}
              className="text-zinc-500 hover:text-white transition-colors mb-12 font-medium cursor-pointer"
            >
              ← Back to Journal
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-[2rem] border border-white/5 overflow-hidden bg-[#161618]"
            >
              <div className="relative h-[55vh] min-h-[380px]">
                <img 
                  src={selectedBlog.image} 
                  alt={selectedBlog.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 md:p-14">
                  <span className="px-4 py-1.5 rounded-full bg-[#EAB308] text-black text-[10px] font-bold uppercase tracking-widest mb-5 inline-block">
                    {selectedBlog.category}
                  </span>
                  <h2 className="font-serif text-3xl md:text-5xl font-normal text-white tracking-tight leading-[1.1] max-w-5xl">
                    {selectedBlog.title}
                  </h2>
                </div>
              </div>

              <div className="p-8 md:p-14 max-w-5xl mx-auto">
                <div className="flex flex-wrap items-center gap-8 mb-12 text-zinc-400 text-sm pb-10 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-[#EAB308]" />
                    <span className="font-medium text-white">{selectedBlog.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-[#EAB308]" />
                    <span>{selectedBlog.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-[#EAB308]" />
                    <span>{selectedBlog.readTime}</span>
                  </div>
                </div>

                <div 
                  className="prose prose-invert prose-yellow max-w-none text-zinc-300 leading-relaxed text-lg prose-headings:text-white prose-headings:font-normal prose-headings:font-serif prose-headings:tracking-tight prose-p:mb-6 prose-blockquote:border-l-[#EAB308] prose-blockquote:bg-black/25 prose-blockquote:p-8 prose-blockquote:rounded-2rem prose-blockquote:not-italic prose-blockquote:text-xl prose-blockquote:font-serif prose-blockquote:font-light"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                />
              </div>
            </motion.div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {blogs.map((blog, index) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.6 }}
                className="group cursor-pointer flex flex-col h-[460px] rounded-[2rem] bg-[#161618] border border-white/5 hover:border-white/10 transition-all hover:bg-[#1A1A1D] overflow-hidden"
                onClick={() => setSelectedBlog(blog)}
              >
                <div className="relative h-1/2 overflow-hidden w-full">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest border border-white/5">
                      {blog.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 sm:p-7 flex flex-col h-1/2 justify-between">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-normal text-white mb-2 leading-snug group-hover:text-[#EAB308] transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    
                    <p className="text-zinc-400 text-xs sm:text-sm font-light leading-relaxed line-clamp-2 sm:line-clamp-3">
                      {blog.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-white/80 group-hover:text-white text-sm font-semibold group-hover:gap-3.5 transition-all w-fit">
                    Read Article
                    <ArrowRight size={16} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};


