import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Calendar, User, Clock } from 'lucide-react';
import regeneratedImage from '@/src/assets/images/regenerated_image_1782595459649.jpg';
import blogArtOfSwipe from '@/src/assets/images/blog_art_of_swipe_1782696240936.jpg';
import blogMatchDeckPitch from '@/src/assets/images/blog_match_deck_pitch_1782696256365.jpg';
import blogAlgorithmicPrecision from '@/src/assets/images/blog_algorithmic_precision_1782696272353.jpg';

const blogs: any[] = [
  {
    id: 1,
    title: 'The Art of the Swipe: Crafting the Perfect Founder Profile',
    excerpt: 'In a world of infinite choices, your profile is your first impression. Learn how to optimize your bio, highlight your traction, and stand out to the right investors.',
    content: `
      <h2>The Art of the Swipe</h2>
      <p>In a world of infinite choices, your profile is your first impression. Learn how to optimize your bio, highlight your traction, and stand out to the right investors.</p>
      <p>Building a compelling narrative is key. Investors are not just looking for a good idea; they're looking for a team that can execute. Your profile should scream competence, passion, and resilience.</p>
      <blockquote>"Your profile is not just a resume; it's the trailer to your startup's blockbuster movie."</blockquote>
      <h3>Key Elements of a Winning Profile</h3>
      <ul>
        <li><strong>Clarity:</strong> What do you do, and why does it matter?</li>
        <li><strong>Traction:</strong> Numbers speak louder than words.</li>
        <li><strong>Vision:</strong> Where is this going in 5 years?</li>
      </ul>
      <p>Remember, the goal is not to appeal to everyone, but to the *right* someone. Be authentic, be bold, and let your passion shine through.</p>
    `,
    category: 'Founder Tips',
    author: 'Sarah Chen',
    date: 'Oct 12, 2026',
    readTime: '5 min read',
    image: blogArtOfSwipe,
  },
  {
    id: 2,
    title: 'Match, Deck, Pitch: The ConnectUp Investment Funnel',
    excerpt: 'Navigating the journey from a mutual swipe to a signed term sheet. We break down the crucial stages of engaging with VCs on our platform.',
    content: `
      <h2>Match, Deck, Pitch</h2>
      <p>Navigating the journey from a mutual swipe to a signed term sheet. We break down the crucial stages of engaging with VCs on our platform.</p>
      <p>The initial match is just the beginning. The real work starts when you send over your deck. Is it tailored to their thesis? Does it answer their unasked questions?</p>
      <h3>The ConnectUp Funnel</h3>
      <ol>
        <li><strong>The Match:</strong> Mutual interest established. Keep the momentum going.</li>
        <li><strong>The Deck:</strong> A concise, compelling narrative of your business.</li>
        <li><strong>The Pitch:</strong> The human element. Your chance to prove you can lead.</li>
      </ol>
      <p>Don't drop the ball after the match. Be responsive, be prepared, and treat every interaction as a step towards partnership.</p>
    `,
    category: 'Fundraising',
    author: 'Marcus Vance',
    date: 'Oct 05, 2026',
    readTime: '8 min read',
    image: blogMatchDeckPitch,
  },
  {
    id: 3,
    title: 'Algorithmic Precision: How We Pair You with the Right Capital',
    excerpt: 'Take a peek under the hood of ConnectUp\'s matching engine. Discover how we use data to align founder visions with investor theses.',
    content: `
      <h2>Algorithmic Precision</h2>
      <p>Take a peek under the hood of ConnectUp's matching engine. Discover how we use data to align founder visions with investor theses.</p>
      <p>We don't just rely on serendipity. Our algorithms analyze thousands of data points—from market focus and stage preference to behavioral patterns—to ensure that when you swipe right, it counts.</p>
      <h3>Beyond the Surface</h3>
      <p>We look beyond the self-reported data. By analyzing engagement metrics and historical success rates, we continually refine our matching model to increase the probability of a successful partnership.</p>
      <blockquote>"Data is the new serendipity."</blockquote>
    `,
    category: 'Product & Tech',
    author: 'Elena Rodriguez',
    date: 'Sep 28, 2026',
    readTime: '6 min read',
    image: blogAlgorithmicPrecision,
  },
  {
    id: 4,
    title: 'The Future of Seed Funding: Trends to Watch in 2027',
    excerpt: 'As the macroeconomic landscape shifts, so do seed valuations and expectations. A comprehensive look at what early-stage founders need to know.',
    content: `
      <h2>The Future of Seed Funding</h2>
      <p>As the macroeconomic landscape shifts, so do seed valuations and expectations. A comprehensive look at what early-stage founders need to know.</p>
      <p>The days of easy capital are evolving. Investors are increasingly looking for sustainable growth models and clearer paths to profitability, even at the seed stage.</p>
      <h3>Trends to Watch</h3>
      <ul>
        <li><strong>Focus on Unit Economics:</strong> Growth at all costs is out. Sustainable margins are in.</li>
        <li><strong>The Rise of Specialized Funds:</strong> Generalist funds are facing stiff competition from thesis-driven micro-VCs.</li>
        <li><strong>Geographic Agnosticism:</strong> Great companies can be built anywhere, and capital is flowing accordingly.</li>
      </ul>
      <p>Stay adaptable and focus on building a resilient business model that can weather economic cycles.</p>
    `,
    category: 'Market Insights',
    author: 'David Kim',
    date: 'Sep 15, 2026',
    readTime: '10 min read',
    image: regeneratedImage,
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
    <div className="w-full py-24 sm:py-32 bg-white text-zinc-900 border-y border-zinc-200/50" ref={(el) => { if(el) el.id = 'blog'; }}>
      <div className="max-w-none mx-auto px-4 sm:px-12 lg:px-20 w-full">
        {/* Aesthetic Water Drop Divider as a top border line */}
        

        {!selectedBlog && (
          <div className="mb-20 text-center">
            <span className="text-xs tracking-[0.25em] font-extrabold uppercase text-[#EAB308] mb-5 block">Our Blog</span>
          </div>
        )}

        {selectedBlog ? (
          /* Detailed View */
          <div className="w-full">
            <button 
              onClick={() => setSelectedBlog(null)}
              className="text-zinc-500 hover:text-zinc-900 transition-colors mb-12 font-semibold cursor-pointer flex items-center gap-2"
            >
              ← Back to Blog
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
                  <span className="px-4 py-1.5 rounded-full bg-[#EAB308] text-zinc-900 text-[10px] font-bold uppercase tracking-widest mb-5 inline-block">
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
                    <User size={18} className="text-[#B45309]" />
                    <span className="font-semibold text-zinc-900">{selectedBlog.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-[#B45309]" />
                    <span>{selectedBlog.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-[#B45309]" />
                    <span>{selectedBlog.readTime}</span>
                  </div>
                </div>

                <div 
                  className="prose prose-zinc prose-yellow max-w-none text-zinc-700 leading-relaxed text-lg prose-headings:text-zinc-900 prose-headings:font-normal prose-headings:font-serif prose-headings:tracking-tight prose-p:mb-6 prose-blockquote:border-l-[#EAB308] prose-blockquote:bg-zinc-50 prose-blockquote:border prose-blockquote:border-zinc-200 prose-blockquote:p-8 prose-blockquote:rounded-[2.5rem] prose-blockquote:not-italic prose-blockquote:text-xl prose-blockquote:font-serif prose-blockquote:font-light"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {blogs.map((blog, index) => (
              <div
                key={blog.id}
                className="group cursor-pointer flex flex-col h-[460px] rounded-none bg-white border border-zinc-200 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:bg-zinc-50/50 transition-all hover:border-zinc-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.05)] overflow-hidden"
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
                    <span className="px-3.5 py-1 rounded-none bg-[#EAB308] text-zinc-950 text-[9px] font-bold uppercase tracking-widest border border-amber-400">
                      {blog.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 sm:p-7 flex flex-col h-1/2 justify-between transition-colors bg-zinc-950 text-white rounded-none border-t border-zinc-800">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-normal mb-2 leading-snug transition-colors line-clamp-2 text-white group-hover:text-[#EAB308]">
                      {blog.title}
                    </h3>
                    
                    <p className="text-xs sm:text-sm font-light leading-relaxed line-clamp-2 sm:line-clamp-3 text-zinc-400">
                      {blog.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3.5 transition-all w-fit text-zinc-400 group-hover:text-white">
                    Read Article
                    <ArrowRight size={16} className="text-[#EAB308]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};


