import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LandingContactForm = ({ lightMode = false }: { lightMode?: boolean }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    console.log("Form submitted with:", formData);
  };

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center py-12 px-4"
      >
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-6",
          lightMode 
            ? "bg-[#B45309]/10 border border-[#B45309]/20 text-[#B45309]"
            : "bg-[#EAB308]/10 border border-[#EAB308]/20 text-[#EAB308]"
        )}>
          <Check className="h-8 w-8 stroke-[2.5]" />
        </div>
        <h3 className={cn(
          "font-serif text-2xl font-normal mb-3",
          lightMode ? "text-zinc-900" : "text-white"
        )}>
          Message Received
        </h3>
        <p className={cn(
          "text-sm max-w-sm leading-relaxed font-light mb-8",
          lightMode ? "text-zinc-600" : "text-zinc-400"
        )}>
          Thank you for reaching out, <span className={lightMode ? "text-zinc-900 font-semibold" : "text-white font-medium"}>{formData.name}</span>. Our team will align with you within 24 hours.
        </p>
        <button
          onClick={() => {
            setIsSubmitted(false);
            setFormData({ name: '', email: '', message: '' });
          }}
          className={cn(
            "text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer",
            lightMode ? "text-[#B45309] hover:text-zinc-900" : "text-[#EAB308] hover:text-white"
          )}
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={cn(
          "block text-[10px] font-bold tracking-widest uppercase mb-2.5",
          lightMode ? "text-zinc-500" : "text-zinc-400"
        )}>
          Name
        </label>
        <input 
          required
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={cn(
            "w-full rounded-xl px-5 py-4 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#EAB308]/20",
            lightMode 
              ? "bg-zinc-50 border border-zinc-200 text-zinc-950 placeholder-zinc-400 focus:bg-white focus:border-[#EAB308]"
              : "bg-[#1C1C1E] border border-white/5 text-white placeholder-zinc-600 focus:border-[#EAB308]"
          )}
          placeholder="Sarah Connor"
        />
      </div>

      <div>
        <label className={cn(
          "block text-[10px] font-bold tracking-widest uppercase mb-2.5",
          lightMode ? "text-zinc-500" : "text-zinc-400"
        )}>
          Email Address
        </label>
        <input 
          required
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={cn(
            "w-full rounded-xl px-5 py-4 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#EAB308]/20",
            lightMode 
              ? "bg-zinc-50 border border-zinc-200 text-zinc-950 placeholder-zinc-400 focus:bg-white focus:border-[#EAB308]"
              : "bg-[#1C1C1E] border border-white/5 text-white placeholder-zinc-600 focus:border-[#EAB308]"
          )}
          placeholder="sarah@skynet.com"
        />
      </div>

      <div>
        <label className={cn(
          "block text-[10px] font-bold tracking-widest uppercase mb-2.5",
          lightMode ? "text-zinc-500" : "text-zinc-400"
        )}>
          Message
        </label>
        <textarea 
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className={cn(
            "w-full rounded-xl px-5 py-4 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#EAB308]/20 resize-none",
            lightMode 
              ? "bg-zinc-50 border border-zinc-200 text-zinc-950 placeholder-zinc-400 focus:bg-white focus:border-[#EAB308]"
              : "bg-[#1C1C1E] border border-white/5 text-white placeholder-zinc-600 focus:border-[#EAB308]"
          )}
          placeholder="How can we help you align?"
        />
      </div>

      <button 
        type="submit"
        className={cn(
          "w-full active:scale-[0.99] hover:scale-[1.01] py-4 rounded-full font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center bg-[#EAB308] text-zinc-950 hover:bg-yellow-400 shadow-lg shadow-yellow-500/10"
        )}
      >
        <span>Send Message</span>
      </button>
    </form>
  );
};
