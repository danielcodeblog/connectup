import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { ArrowRight, Calendar, User, Clock } from 'lucide-react';

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
    title: "Scaling Your Startup: From Zero to One",
    excerpt: "Building a modular architecture for your product can save months of technical debt as you grow.",
    content: `
      <p>Scaling a startup is often described as building a plane while flying it. However, the most successful engineering teams know that a solid foundation early on prevents a catastrophic crash later.</p>
      <h3>Modular Monoliths</h3>
      <p>While microservices are popular, starting with a well-structured modular monolith is often significantly more efficient for early-stage teams. It reduces operational overhead while allowing for easy separation as the team grows.</p>
      <h3>The Cost of Technical Debt</h3>
      <p>Technical debt isn't always bad, but it must be managed like financial debt. We examine how to track "repayment" schedules for architectural shortcuts taken during the MVP phase.</p>
      <p>By implementing strict linting, automated testing, and standardized documentation from day one, companies like Stripe and Vercel were able to scale their engineering output exponentially without their velocity dropping.</p>
    `,
    category: "Engineering",
    author: "Sarah Smith",
    date: "May 01, 2026",
    readTime: "12 min read",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=60&w=800&auto=format&fit=crop&sat=-100"
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
    <div className="w-full py-20 sm:py-32 bg-[#0D0D0F]" ref={(el) => { if(el) el.id = 'blog'; }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        {!selectedBlog && (
          <div className="mb-24">
            <span className="text-xs tracking-[0.3em] font-black uppercase text-[#EAB308] mb-6 block">Our Journal</span>
            <h2 className="text-5xl sm:text-7xl md:text-8xl font-[900] text-white leading-[0.9] tracking-tighter mb-8">
              Insights & <span className="italic font-display font-light text-white/70">Guides</span>
            </h2>
          </div>
        )}

        {selectedBlog ? (
          /* Detailed View */
          <div className="w-full">
            <button 
              onClick={() => setSelectedBlog(null)}
              className="text-zinc-500 hover:text-white transition-colors mb-12 font-medium"
            >
              ← Back
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-[3rem] border border-white/5 overflow-hidden bg-white/5"
            >
              <div className="relative h-[60vh] min-h-[400px]">
                <img 
                  src={selectedBlog.image} 
                  alt={selectedBlog.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F]/90 via-[#0D0D0F]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-10 md:p-16">
                  <span className="px-4 py-1.5 rounded-full bg-[#EAB308] text-black text-xs font-bold uppercase tracking-wider mb-6 inline-block">
                    {selectedBlog.category}
                  </span>
                  <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] max-w-4xl">
                    {selectedBlog.title}
                  </h2>
                </div>
              </div>

              <div className="p-10 md:p-16 max-w-4xl mx-auto">
                <div className="flex flex-wrap items-center gap-8 mb-12 text-zinc-400 text-sm pb-10 border-b border-white/10">
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
                  className="prose prose-invert prose-yellow max-w-none text-zinc-300 leading-relaxed text-lg prose-headings:text-white prose-headings:font-black prose-headings:tracking-tighter prose-p:mb-6 prose-blockquote:border-l-[#EAB308] prose-blockquote:bg-white/5 prose-blockquote:p-8 prose-blockquote:rounded-3xl prose-blockquote:not-italic prose-blockquote:text-xl prose-blockquote:font-medium"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                />
              </div>
            </motion.div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog, index) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group cursor-pointer flex flex-col h-full p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                onClick={() => setSelectedBlog(blog)}
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-8">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-white/10">
                      {blog.category}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 leading-snug group-hover:text-[#EAB308] transition-colors">
                  {blog.title}
                </h3>
                
                <p className="text-zinc-400 text-base mb-8 flex-grow font-light">
                  {blog.excerpt}
                </p>

                <div className="flex items-center gap-3 text-[#EAB308] font-semibold mt-auto group-hover:gap-4 transition-all w-fit">
                  Read Article
                  <ArrowRight size={18} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};


