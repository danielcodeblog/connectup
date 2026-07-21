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
import { MenuToggleIcon } from './ui/menu-toggle-icon';

import { LandingHome } from './LandingHome';
import { LogoMarquee } from './LogoMarquee';
import { LandingAbout } from './LandingAbout';
import { LandingWhy } from './LandingWhy';
import { LandingContactForm } from './LandingContactForm';
import { Pricing } from './Pricing';
import FooterSection5 from './ui/footer-section-5';

const AnimatedHamburger = ({ isOpen, toggle }: { isOpen: boolean, toggle: () => void }) => (
  <button
    onClick={toggle}
    className={`flex flex-col gap-1.5 transition-all p-3 rounded-full hover:bg-white/5 active:scale-95 relative z-[1100]
      ${isOpen ? "text-[#EAB308]" : "text-white"}
    `}
    aria-label="Toggle Menu"
  >
    {/* Top Line */}
    <div
      className={`h-[2px] bg-current transition-all duration-500 ${
        isOpen ? "w-6 rotate-45 translate-y-[8px]" : "w-6"
      }`}
    />
    {/* Middle Line */}
    <div
      className={`h-[2px] bg-current transition-all duration-500 ${
        isOpen ? "opacity-0 w-0" : "w-4 ml-auto"
      }`}
    />
    {/* Bottom Line */}
    <div
      className={`h-[2px] bg-current transition-all duration-500 ${
        isOpen ? "w-6 -rotate-45 -translate-y-[8px]" : "w-6"
      }`}
    />
  </button>
);

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
  onLegalView?: (view: 'privacy' | 'terms') => void;
}

export default function LandingSite({ onLoginClick, onLegalView }: LandingSiteProps) {
    const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'why' | 'blog' | 'founders' | 'pricing' | 'contact'>('home');
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
  
    // Page transition animations removed for faster loading
    useEffect(() => {
      // No-op
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
  
      const sections = ['home', 'about', 'why', 'founders', 'pricing', 'blog'];
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }, [currentPage]);
  
    useEffect(() => {
      if (isMobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      return () => {
        document.body.style.overflow = '';
      };
    }, [isMobileMenuOpen]);

    const navigateTo = (page: 'home' | 'about' | 'why' | 'blog' | 'founders' | 'pricing' | 'contact') => {
      setCurrentPage(page);
      setIsMobileMenuOpen(false);
      const element = document.getElementById(page);
      if (element) {
        if (page === 'home') {
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else {
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "instant",
          });
        }
      }
    };

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    // scale effect removed for "no slow loading"
  };
  
  const handleButtonLeave = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    // scale effect removed for "no slow loading"
  };

  return (
    <ShaderBackground paused={isMobileMenuOpen} className="font-poppins bg-[#0D0D0F] text-white min-h-screen flex flex-col relative selection:bg-[#EAB308] selection:text-black overflow-x-hidden max-w-full">
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-[100] bg-[#0D0D0F] flex flex-col pt-4 px-4 md:px-16 md:pt-8 pb-8 overflow-y-auto lg:hidden"
          >
            {/* Header in mobile menu */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5 md:mb-12 md:pb-8">
              <div 
                className="flex items-center gap-2 cursor-pointer p-0"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo('home');
                }}
              >
                <span className="font-[800] text-2xl md:text-3xl tracking-tighter">
                  <span className="text-white inline">connect</span>
                  <span className="text-[#EAB308]">up</span>
                </span>
              </div>
              <AnimatedHamburger isOpen={isMobileMenuOpen} toggle={() => setIsMobileMenuOpen(false)} />
            </div>

            {/* Navigation Links */}
            <nav 
              className="flex flex-col items-center justify-start sm:justify-center flex-1 gap-4 mt-6 px-2 md:gap-8 md:mt-8 md:px-12 pt-2 sm:pt-6 md:pt-0"
            >
              {(['home', 'about', 'why', 'founders', 'pricing', 'blog'] as const).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    navigateTo(page);
                  }}
                  className="block w-full text-center text-4xl sm:text-5xl md:text-7xl font-sans font-black text-white hover:text-[#EAB308] transition-colors tracking-tighter leading-none uppercase"
                >
                  {page}.
                </button>
              ))}
            </nav>

            {/* Action Button at bottom */}
            <div
              className="pt-10 flex justify-center w-full pb-12"
            >
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLoginClick();
                }}
                className="inline-block px-14 py-6 bg-[#EAB308] text-black rounded-full font-black uppercase tracking-[0.2em] text-sm transition-transform shadow-[0_20px_50px_rgba(234,179,8,0.3)] cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      {!isMobileMenuOpen && (
        <nav className="fixed top-0 left-0 right-0 z-[90] px-4 py-4 sm:px-6 pointer-events-none">
          {/* Desktop Navbar - Hidden on Mobile */}
          <div className={`hidden lg:flex max-w-7xl mx-auto h-20 transition-all duration-500 ease-out items-center justify-between px-6 pointer-events-auto ${
            isScrolled 
              ? 'rounded-full border border-white/10 bg-[#0D0D0F]/80 backdrop-blur-xl shadow-2xl' 
              : 'rounded-[2rem] border border-transparent bg-transparent'
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
            <div className="hidden lg:flex items-center gap-1">
              <NavHeader 
                pages={['home', 'about', 'why', 'founders', 'pricing', 'blog']}
                currentPage={currentPage}
                onNavigate={navigateTo}
              />
            </div>

            <div className="hidden lg:flex items-center gap-4 text-nowrap">
               <button 
                onClick={onLoginClick}
                className="px-8 py-3 rounded-full font-black text-sm bg-zinc-900 text-white hover:bg-[#EAB308] hover:text-black transition-all hover:scale-105 active:scale-95 shadow-xl"
               >
                 Login
               </button>
            </div>
          </div>

          {/* Mobile Navbar - Simple & Integrated */}
          <div 
            id="landing-mobile-navbar"
            className={`lg:hidden flex items-center justify-between pointer-events-auto transition-all duration-300 ease-out ${
              isScrolled 
                ? 'rounded-full border border-white/10 bg-[#0D0D0F]/80 backdrop-blur-xl shadow-2xl px-2' 
                : 'rounded-none border border-transparent bg-transparent px-0'
            }`}
          >
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

            <div className="flex items-center gap-4 pr-4">
              <AnimatedHamburger isOpen={isMobileMenuOpen} toggle={() => setIsMobileMenuOpen(true)} />
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main ref={contentRef} className="flex-1 w-full flex flex-col overflow-x-hidden max-w-full">
        <section id="home" className="w-full">
            <LandingHome onNavigate={navigateTo} onLoginClick={onLoginClick} showVideo={showVideo} />
        </section>
        <LogoMarquee />
        <section id="about" className="w-full">
            <LandingAbout />
        </section>
        <section id="why" className="w-full">
            <LandingWhy />
        </section>
        <section id="founders" className="w-full min-h-screen flex items-center justify-center relative z-10 px-4 sm:px-6 py-16 md:py-32 overflow-hidden bg-[#FDF8E7] border-t border-amber-200/40">
          <div className="max-w-7xl mx-auto w-full">
            <FounderSlider founders={reviews} className="rounded-[2.5rem] border-amber-400/25 shadow-[0_20px_50px_rgba(234,179,8,0.15)]" />
          </div>
        </section>
        <section id="pricing" className="w-full relative z-10 overflow-hidden max-w-full bg-white">
          <Pricing onPlanSelect={onLoginClick} />
        </section>
        <section id="blog" className="w-full">
            <BlogSection />
        </section>
        <FAQSection />
      </main>

      {/* Footer */}
      <FooterSection5 onNavigate={navigateTo} onLegalView={onLegalView} />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scaleX {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}} />
    </ShaderBackground>
  );
}


