import React, { useState } from "react";
import { FlutedGlass } from "@paper-design/shaders-react";

const companyName = "ConnectUp";

const ConnectUpLogo = ({ className }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-1 cursor-pointer p-0 select-none ${className}`}>
      <span className="font-[800] text-2xl tracking-tighter">
        <span className="text-white">connect</span>
        <span className="text-zinc-950">up</span>
      </span>
    </div>
  );
};

const footerLinks = [
  {
    title: "Company",
    links: [
      { name: "About", href: "#about" },
      { name: "Blogs", href: "#blog" },
      { name: "Contact", href: "#contact" },
      { name: "Privacy", href: "#" },
    ],
  },
  {
    title: "Social",
    links: [
      { name: "X", href: "#" },
      { name: "Facebook", href: "#" },
      { name: "Instagram", href: "#" },
      { name: "LinkedIn", href: "#" },
    ],
  },
];

interface FooterSection5Props {
  onNavigate?: (page: 'home' | 'about' | 'blog' | 'founders' | 'pricing' | 'contact') => void;
  onLegalView?: (view: 'privacy' | 'terms') => void;
}

export default function FooterSection5({ onNavigate, onLegalView }: FooterSection5Props) {
  const [complaint, setComplaint] = useState("");

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, name: string, href: string) => {
    e.preventDefault();
    if (name === "Features" || name === "Solution" || name === "About") {
      onNavigate?.('about');
    } else if (name === "Pricing") {
      onNavigate?.('pricing');
    } else if (name === "Blogs" || name === "Blog") {
      onNavigate?.('blog');
    } else if (name === "Founders") {
      onNavigate?.('founders');
    } else if (name === "Contact") {
      onNavigate?.('contact');
    } else if (name === "Terms") {
      onLegalView?.('terms');
    } else if (name === "Privacy") {
      onLegalView?.('privacy');
    } else if (href.startsWith("#")) {
      const targetId = href.replace("#", "");
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <footer className="w-full bg-[#EAB308] relative overflow-hidden antialiased [font-synthesis:none] border-t border-black/10">
      {/* Accent gradient line at the top of the footer */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 via-black/10 to-transparent z-20" />

      {/* Main Panel Section */}
      <div className="relative w-full bg-[#EAB308] z-10 min-h-[350px]">
        {/* Background Shader */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <FlutedGlass
            size={0.89}
            shape="lines"
            angle={0}
            distortionShape="prism"
            distortion={0.5}
            shift={0}
            blur={0}
            edges={0.25}
            stretch={0}
            scale={1.11}
            fit="cover"
            highlights={0.3}
            shadows={0.3}
            grainMixer={0.1}
            grainOverlay={0.1}
            colorBack="#00000000"
            colorHighlight="#FFFFFF"
            colorShadow="#000000"
            className="w-full h-full bg-transparent"
          />
        </div>

        {/* Ambient Warm and Deep Shading Background Gradient Glows */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-gradient-to-br from-white/30 via-amber-600/10 to-transparent blur-[90px] pointer-events-none z-0" />
        <div className="absolute bottom-12 right-1/4 translate-x-1/2 w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-amber-600/10 via-white/20 to-transparent blur-[80px] pointer-events-none z-0" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16 md:py-20 flex flex-col justify-between gap-16">
          <div className="flex flex-col md:flex-row justify-between gap-16 md:gap-8 items-start">
            {/* Left Side */}
            <div className="flex flex-col justify-between max-w-[300px] w-full relative z-10">
              <div className="flex flex-col">
                {/* Brand Logo */}
                <ConnectUpLogo className="mb-4" />
                <h2 className="text-white/90 text-lg md:text-xl font-light leading-snug max-w-[280px]">
                  Redefining capital formation <br />
                  <span className="font-extrabold text-white">
                    for the next generation.
                  </span>
                </h2>
                <p className="text-zinc-900/60 text-sm mt-3 font-medium leading-relaxed max-w-[280px]">
                  Empowering founders, syndicates, and modern builders with the premium tools to access, organize, and accelerate institutional-grade capital globally.
                </p>
              </div>
            </div>

            {/* Right Side - Links */}
            <div className="flex flex-row flex-wrap md:flex-nowrap gap-10 md:gap-16 lg:mt-0 mt-6 justify-center items-center md:items-start text-center md:text-left">
              {footerLinks.map((section) => {
                const mid = Math.ceil(section.title.length / 2);
                const firstHalf = section.title.slice(0, mid);
                const secondHalf = section.title.slice(mid);
                return (
                  <div key={section.title} className="flex flex-col gap-6 items-center md:items-start">
                    <h3 className="font-extrabold text-lg md:text-xl tracking-wider uppercase">
                      <span className="text-white">{firstHalf}</span>
                      <span className="text-zinc-950">{secondHalf}</span>
                    </h3>
                    <ul className="flex flex-col gap-4 md:gap-5">
                      {section.links.map((link) => (
                        <li key={link.name}>
                          <a
                            href={link.href}
                            onClick={(e) => handleLinkClick(e, link.name, link.href)}
                            className="text-white/80 hover:text-white hover:underline transition-all text-base md:text-[17px] font-semibold"
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
            <p className="font-medium text-zinc-950/60 text-xs md:text-[13px]">
              © 2026 {companyName}. All rights reserved.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const mailtoLink = `mailto:support@connectupng.com?subject=Complaint&body=${encodeURIComponent(complaint)}`;
                  window.location.href = mailtoLink;
                }}
                className="relative w-full max-w-[320px]"
              >
                <input
                  type="text"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Send a concern..."
                  className="w-full bg-white/10 border border-black/10 rounded-xl px-5 py-4 text-base text-white placeholder-white/60 outline-none transition-all focus:ring-2 focus:ring-white/20 pr-20"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 bg-zinc-950 text-white rounded-lg px-5 text-sm font-bold hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}