import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Send } from 'lucide-react';

export const LandingContactForm = () => {
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
        <div className="w-16 h-16 rounded-full bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center text-[#EAB308] mb-6">
          <Check className="h-8 w-8 stroke-[2.5]" />
        </div>
        <h3 className="font-serif text-2xl font-normal text-white mb-3">
          Message Received
        </h3>
        <p className="text-zinc-400 text-sm max-w-sm leading-relaxed font-light mb-8">
          Thank you for reaching out, <span className="text-white font-medium">{formData.name}</span>. Our team will align with you within 24 hours.
        </p>
        <button
          onClick={() => {
            setIsSubmitted(false);
            setFormData({ name: '', email: '', message: '' });
          }}
          className="text-xs text-[#EAB308] font-bold uppercase tracking-widest hover:text-white transition-colors cursor-pointer"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-[10px] font-bold tracking-widest uppercase mb-2.5 text-zinc-400">
          Name
        </label>
        <input 
          required
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-[#1C1C1E] border border-white/5 rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 focus:border-[#EAB308] focus:ring-1 focus:ring-[#EAB308]/20 placeholder-zinc-600"
          placeholder="Sarah Connor"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold tracking-widest uppercase mb-2.5 text-zinc-400">
          Email Address
        </label>
        <input 
          required
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full bg-[#1C1C1E] border border-white/5 rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 focus:border-[#EAB308] focus:ring-1 focus:ring-[#EAB308]/20 placeholder-zinc-600"
          placeholder="sarah@skynet.com"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold tracking-widest uppercase mb-2.5 text-zinc-400">
          Message
        </label>
        <textarea 
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full bg-[#1C1C1E] border border-white/5 rounded-xl px-5 py-4 text-white text-sm outline-none transition-all duration-200 focus:border-[#EAB308] focus:ring-1 focus:ring-[#EAB308]/20 placeholder-zinc-600 resize-none"
          placeholder="How can we help you align?"
        />
      </div>

      <button 
        type="submit"
        className="w-full bg-[#FAF7F2] text-black hover:bg-[#FAF7F2]/90 active:scale-[0.99] hover:scale-[1.01] py-4 rounded-full font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center"
      >
        <span>Send Message</span>
      </button>
    </form>
  );
};
