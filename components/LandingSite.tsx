import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, ThumbsDown, Flame, Users, Briefcase, ChevronRight, Menu, X, ArrowRight, TrendingUp, Sparkles, Building2, Shield, Rocket, Mail, LogIn, User, Play, Pause } from 'lucide-react';
import gsap from 'gsap';
import { ShaderBackground } from './ui/hero-shader';
import { FounderSlider } from './ui/founder-slider-1';
import { NavHeader } from './ui/nav-header';
import ImageMask from './ui/image-mask';
import { BlogSection } from './BlogSection';
import { FAQSection } from './FAQSection';

import { LandingHome } from './LandingHome';
import { LandingAbout } from './LandingAbout';
import { LandingContactForm } from './LandingContactForm';

const reviews = [
  {
    id: 1,
    name: "Olugbenga Agboola",
    affiliation: "Founder, Flutterwave",
    quote: "Build something investors can already see customers using.",
    imageSrc: "https://www.lagoonhospitals.com/wp-content/uploads/2022/11/GB.jpg",
    thumbnailSrc: "https://www.lagoonhospitals.com/wp-content/uploads/2022/11/GB.jpg",
  },
  {
    id: 2,
    name: "Shola Akinlade",
    affiliation: "Founder, Paystack",
    quote: "Clarity in storytelling matters.",
    imageSrc: "https://fastly.restofworld.org/uploads/2022/05/Africa-SholaAkinladePressKit-EDITED.png?width=300&dpr=2&crop=1:1",
    thumbnailSrc: "https://fastly.restofworld.org/uploads/2022/05/Africa-SholaAkinladePressKit-EDITED.png?width=300&dpr=2&crop=1:1",
  },
  {
    id: 3,
    name: "Iyinoluwa Aboyeji",
    affiliation: "Founder, Future Africa",
    quote: "Investors invest in people first before products.",
    imageSrc: "https://fastly.restofworld.org/uploads/2022/05/Africa-IyinoluwaAboyejiCourtesy-EDITED.png?width=300&dpr=2&crop=1:1",
    thumbnailSrc: "https://fastly.restofworld.org/uploads/2022/05/Africa-IyinoluwaAboyejiCourtesy-EDITED.png?width=300&dpr=2&crop=1:1",
  },
];

interface LandingSiteProps {
  onLoginClick: () => void;
}

export default function LandingSite({ onLoginClick }: LandingSiteProps) {
    const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'blog' | 'founders' | 'contact'>('home');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const contentRef = useRef<HTMLDivElement>(null);
    const [showVideo, setShowVideo] = useState(false);
  
    useEffect(() => {
      // Check if we are on mobile/tablet to disable heavy features
      setShowVideo(true);
    }, []);
  
    // Initial floating blob animations removed as they were hidden
    useEffect(() => {
      // No-op
    }, []);
  
    // Page transition animations
    useEffect(() => {
      if (contentRef.current) {
        gsap.fromTo(contentRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
        );
      }
    }, []);
  
    const [isScrolled, setIsScrolled] = useState(false);
  
    useEffect(() => {
      const handleScroll = () => {
        const scrollPos = window.scrollY;
        setIsScrolled(scrollPos > 50);
      };
  
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Use IntersectionObserver for active section tracking
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            if (sectionId && sectionId !== currentPage) {
                setCurrentPage(sectionId as any);
            }
          }
        });
      }, {
        rootMargin: '-30% 0px -70% 0px' // Adjust to trigger when section reaches top part of screen
      });
  
      const sections = ['home', 'about', 'blog', 'founders', 'contact'];
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }, [currentPage]);
  
    const navigateTo = (page: 'home' | 'about' | 'blog' | 'founders' | 'contact') => {
      setCurrentPage(page);
      setIsMobileMenuOpen(false);
      const element = document.getElementById(page);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2, ease: 'back.out(1.7)' });
  };
  
  const handleButtonLeave = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: 'power2.out' });
  };

  return (
    <ShaderBackground className="font-poppins bg-surface text-white min-h-screen flex flex-col relative selection:bg-[#EAB308] selection:text-black">
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 bg-[#141417]/95 backdrop-blur-none lg:backdrop-blur-3xl z-[100] flex flex-col p-8 rounded-[3rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header in mobile menu */}
            <div className="flex items-center justify-between mb-12">
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo('home');
                }}
              >
                <span className="font-[800] text-2xl tracking-tighter">
                  <span className="text-white inline">connect</span>
                  <span className="text-[#EAB308]">up</span>
                </span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white active:scale-95 transition-all hover:bg-white/10"
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-3">
              {(['home', 'about', 'blog', 'founders', 'contact'] as const).map((page, index) => (
                <motion.button
                  key={page}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateTo(page as any);
                  }}
                  className={`flex items-center justify-between w-full font-[800] text-2xl capitalize px-7 py-6 rounded-[2rem] border transition-all active:scale-[0.98] ${
                    (currentPage === page && page !== 'founders') 
                      ? 'text-[#EAB308] border-[#EAB308]/20 bg-[#EAB308]/5' 
                      : 'text-white/60 border-white/5 bg-white/5 shadow-sm'
                  }`}
                >
                  <span>{page}</span>
                  <ChevronRight size={20} className={(currentPage === page && page !== 'founders') ? 'opacity-100' : 'opacity-20'} />
                </motion.button>
              ))}
            </nav>

            {/* Action Area */}
            <div className="mt-auto pt-10">
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLoginClick();
                }}
                className="w-full bg-[#EAB308] text-black py-6 rounded-[2rem] font-[900] text-xl shadow-2xl shadow-[#EAB308]/20 active:scale-95 transition-transform"
              >
                Login to Platform
              </button>
              <div className="flex items-center justify-center gap-3 mt-8 opacity-20">
                <div className="w-1 h-1 rounded-full bg-white" />
                <p className="text-center text-white text-[10px] font-black uppercase tracking-[0.4em]">
                  Encrypted Sync
                </p>
                <div className="w-1 h-1 rounded-full bg-white" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 sm:px-6 pointer-events-none">
        {/* Desktop Navbar - Hidden on Mobile */}
        <div className={`hidden md:flex max-w-7xl mx-auto h-20 transition-all duration-500 ease-out items-center justify-between px-6 pointer-events-auto ${
          isScrolled 
            ? 'rounded-full border border-white/10 bg-[#0D0D0F]/80 backdrop-blur-xl shadow-2xl' 
            : 'rounded-[2rem] border border-white/5 bg-white/5 backdrop-blur-lg'
        }`}>
          
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer relative z-10"
            onClick={() => navigateTo('home')}
          >
            <span className="font-[800] text-2xl tracking-tighter transition-colors">
              <span className="text-white inline">connect</span>
              <span className="text-[#EAB308]">up</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavHeader 
              pages={['home', 'about', 'blog', 'founders', 'contact']}
              currentPage={currentPage}
              onNavigate={navigateTo}
            />
          </div>

          <div className="hidden md:flex items-center gap-4 text-nowrap">
             <button 
              onClick={onLoginClick}
              className="px-8 py-3 rounded-full font-black text-sm bg-zinc-900 text-white hover:bg-[#EAB308] hover:text-black transition-all hover:scale-105 active:scale-95 shadow-xl"
             >
               Login
             </button>
          </div>
        </div>

        {/* Mobile Navbar - Simple & Integrated */}
        <div className="md:hidden flex items-center justify-between pointer-events-auto">
          <div 
            className="flex items-center gap-2 cursor-pointer p-4"
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigateTo('home');
            }}
          >
            <span className="font-[800] text-2xl tracking-tighter">
              <span className="text-white inline">connect</span>
              <span className="text-[#EAB308]">up</span>
            </span>
          </div>

          <div className="flex items-center pr-4">
            <User 
              onClick={onLoginClick}
              size={28} 
              strokeWidth={2.5}
              className="text-white cursor-pointer transition-all active:scale-95 hover:text-[#EAB308]"
            />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main ref={contentRef} className="flex-1 w-full flex flex-col">
        <section id="home" className="w-full">
            <LandingHome onNavigate={navigateTo} onLoginClick={onLoginClick} showVideo={showVideo} />
        </section>
        <section id="about" className="w-full">
            <LandingAbout />
        </section>
        <section id="blog" className="w-full">
            <BlogSection />
        </section>
        <section id="founders" className="w-full min-h-screen flex items-center justify-center relative z-10 px-4 sm:px-6 py-16 md:py-32 overflow-hidden bg-zinc-900/10">
          <div className="max-w-7xl mx-auto w-full">
            <FounderSlider founders={reviews} className="bg-black/40 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-xl" />
          </div>
        </section>
        <FAQSection />
      </main>

      {/* Footer */}
      <footer className="bg-transparent py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          {/* Contact Section */}
          <div id="contact" className="w-full">
            <div className="grid lg:grid-cols-2 gap-12 sm:gap-20 items-center">
              <div className="max-w-xl text-center lg:text-left mx-auto lg:mx-0">
                <h2 className="text-4xl sm:text-5xl md:text-7xl font-[900] mb-8 text-white leading-[1.1] tracking-tighter">
                  Let's scale <br />
                  <span className="text-[#EAB308] italic font-display font-light">together.</span>
                </h2>
                <p className="text-lg sm:text-xl font-light text-white/60 mb-10 sm:mb-12 leading-relaxed">
                  Join the elite network of founders and investors who are redefining capital formation for the next decade.
                </p>
                <div className="flex justify-center lg:justify-start">
                  <div className="flex items-center gap-4 text-white hover:text-[#EAB308] transition-colors cursor-pointer group w-fit">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#EAB308]/30 transition-all">
                      <Mail size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Email Us</p>
                      <p className="text-base sm:text-lg font-bold">hello@connectup.com</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Container */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-10 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#EAB308]/5 blur-3xl -mr-32 -mt-32 rounded-full group-hover:bg-[#EAB308]/10 transition-all duration-700" />
                <LandingContactForm />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-10 pt-12 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="font-[900] text-2xl tracking-tighter uppercase italic">
                <span className="text-white">connect</span>
                <span className="text-[#EAB308]">up</span>
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm font-bold uppercase tracking-widest text-white/40">
            </div>

            <div className="text-xs text-white/40 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} ConnectUp / All Rights Reserved
            </div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scaleX {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}} />
    </ShaderBackground>
  );
}


