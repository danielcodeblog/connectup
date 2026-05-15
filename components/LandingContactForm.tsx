
import React, { useRef } from 'react';
import gsap from 'gsap';

export const LandingContactForm = () => {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formRef.current) {
      gsap.to(formRef.current, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
      formRef.current.reset();
      console.log("Form submitted");
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    gsap.to(e.currentTarget, { borderColor: '#EAB308', backgroundColor: 'rgba(255, 255, 255, 0.05)', duration: 0.3 });
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    gsap.to(e.currentTarget, { borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.02)', duration: 0.3 });
  };

  const handleHover = (e: React.MouseEvent<HTMLButtonElement>) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2, ease: 'back.out' });
  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: 'power2.out' });

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-[10px] font-black tracking-widest uppercase mb-2 text-white/40">NAME</label>
        <input 
          required
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full border border-white/10 rounded-2xl px-5 py-4 font-medium outline-none transition-all duration-300 focus:border-[#EAB308] focus:bg-black bg-white/5 text-white placeholder-white/20 shadow-inner"
          placeholder="e.g. Sarah Connor"
        />
      </div>
      <div>
        <label className="block text-[10px] font-black tracking-widest uppercase mb-2 text-white/40">EMAIL</label>
        <input 
          required
          type="email"
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full border border-white/10 rounded-2xl px-5 py-4 font-medium outline-none transition-all duration-300 focus:border-[#EAB308] focus:bg-black bg-white/5 text-white placeholder-white/20 shadow-inner"
          placeholder="e.g. sarah@skynet.com"
        />
      </div>
      <div>
        <label className="block text-[10px] font-black tracking-widest uppercase mb-2 text-white/40">MESSAGE</label>
        <textarea 
          required
          rows={4}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full border border-white/10 rounded-2xl px-5 py-4 font-medium outline-none transition-all duration-300 focus:border-[#EAB308] focus:bg-black bg-white/5 text-white placeholder-white/20 shadow-inner resize-none"
          placeholder="How can we help you?"
        />
      </div>
      <button 
        type="submit"
        onMouseEnter={handleHover}
        onMouseLeave={handleLeave}
        className="w-full bg-[#EAB308] text-black px-8 py-5 rounded-2xl font-[800] text-lg hover:bg-[#CA8A04] transition-colors"
      >
        Send Message
      </button>
    </form>
  )
};
