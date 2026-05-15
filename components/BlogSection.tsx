import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Calendar, User, Clock, Share2, Bookmark } from 'lucide-react';

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
    <div className="w-full min-h-screen flex items-center justify-center py-24 bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        {!selectedBlog && (
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 sm:mb-20 gap-8 text-center md:text-left">
            <div className="max-w-2xl">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-[1.1]">
                Latest from our <span className="text-[#EAB308] italic font-display font-light">Journal</span>
              </h2>
              <p className="text-zinc-400 text-lg sm:text-xl leading-relaxed font-light">
                Stay updated with the latest trends in technology, entrepreneurship, and professional growth.
              </p>
            </div>
          </div>
        )}

        {selectedBlog ? (
          <div className="w-full">
            <button 
              onClick={() => setSelectedBlog(null)}
              className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors mb-8 group w-fit"
            >
              <div className="p-2 rounded-full bg-white/5 group-hover:bg-[#EAB308] group-hover:text-black transition-colors">
                <ArrowRight size={18} className="rotate-180" />
              </div>
              <span className="font-semibold">Back to all articles</span>
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-[#0F0F11] rounded-[2.5rem] border border-white/10 overflow-hidden"
            >
              <div className="relative h-[40vh] md:h-[60vh] min-h-[300px]">
                <img 
                  src={selectedBlog.image} 
                  alt={selectedBlog.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F11] to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-12 md:right-12">
                  <span className="px-4 py-1.5 rounded-full bg-[#EAB308] text-black text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                    {selectedBlog.category}
                  </span>
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight max-w-4xl">
                    {selectedBlog.title}
                  </h2>
                </div>
              </div>

              <div className="p-8 md:p-12 lg:p-16 max-w-4xl mx-auto">
                <div className="flex flex-wrap items-center gap-6 mb-12 text-zinc-500 text-sm pb-8 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <span>{selectedBlog.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{selectedBlog.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{selectedBlog.readTime}</span>
                  </div>
                  <div className="flex-grow md:flex md:justify-end gap-3 mt-4 md:mt-0">
                    <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <Share2 size={18} />
                    </button>
                    <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <Bookmark size={18} />
                    </button>
                  </div>
                </div>

                <div 
                  className="prose prose-invert prose-yellow max-w-none 
                  text-zinc-400 leading-relaxed text-lg
                  prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                  prose-p:mb-6 prose-blockquote:border-l-[#EAB308] prose-blockquote:bg-white/5 prose-blockquote:p-6 prose-blockquote:rounded-2xl prose-blockquote:not-italic"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                />
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {blogs.map((blog, index) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group cursor-pointer flex flex-col h-full"
                onClick={() => setSelectedBlog(blog)}
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-3xl mb-6 border border-white/5 shadow-sm bg-zinc-900">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-1.5 rounded-full bg-black/60 sm:backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-white/10 shadow-sm">
                      {blog.category}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#EAB308] transition-colors leading-tight">
                  {blog.title}
                </h3>
                
                <p className="text-zinc-400 line-clamp-2 mb-6 flex-grow">
                  {blog.excerpt}
                </p>

                <div className="flex items-center gap-2 text-white font-semibold group-hover:gap-4 transition-all mt-auto pt-4">
                  Read More
                  <ArrowRight size={18} className="text-[#EAB308]" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

