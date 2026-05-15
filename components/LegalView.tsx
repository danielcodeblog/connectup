
import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ShieldCheck, FileText, Lock, Globe, Eye } from 'lucide-react';

interface LegalViewProps {
  type: 'privacy' | 'terms';
  onBack: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ type, onBack }) => {
  const isPrivacy = type === 'privacy';

  return (
    <div className="fixed inset-0 z-[100] bg-[#FFFCF0] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-4 bg-[#FFFCF0]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-white/5 text-white transition-all active:scale-95">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-display font-black tracking-tighter text-white">
          {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24 max-w-2xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Hero Section */}
          <div className="bg-white/5 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl border border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-10 blur-3xl -translate-y-12 translate-x-12"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                {isPrivacy ? <ShieldCheck size={32} className="text-white" /> : <FileText size={32} className="text-white" />}
              </div>
              <h2 className="text-3xl font-display font-black mb-2 tracking-tight">
                {isPrivacy ? 'Your Security is Our Priority' : 'Usage Guidelines'}
              </h2>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Last updated: June 2024</p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-6">
            <section className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center">
                   <Lock size={16} />
                </div>
                <h3 className="font-bold text-lg text-white">1. Introduction</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Welcome to ConnectUp. {isPrivacy ? 
                  'Our commitment to your privacy is unwavering. This policy outlines how we handle your data with transparency and care.' : 
                  'By using our platform, you agree to these terms. Please read them carefully to understand your rights and responsibilities.'}
              </p>
            </section>

            <section className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-white/10 text-blue-400 flex items-center justify-center">
                   <Eye size={16} />
                </div>
                <h3 className="font-bold text-lg text-white">{isPrivacy ? '2. Data Collection' : '2. Intellectual Property'}</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {isPrivacy ? 
                  'We only collect information essential to your experience: profile details, pitch decks (if shared), and professional background. We never sell your personal data to third parties.' : 
                  'All content shared on ConnectUp remains the property of its respective owners. However, by posting, you grant us a limited license to display it within the platform ecosystem.'}
              </p>
            </section>

            <section className="bg-white/5 rounded-[32px] p-6 border border-white/10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-white/10 text-orange-400 flex items-center justify-center">
                   <Globe size={16} />
                </div>
                <h3 className="font-bold text-lg text-white">{isPrivacy ? '3. Cookie Policy' : '3. Prohibited Conduct'}</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {isPrivacy ? 
                  'We use minimal cookies for authentication and platform stability. You can manage these preferences in your browser settings at any time.' : 
                  'Users are prohibited from sharing misleading financial data, harassing others, or attempting to scrape platform metadata. Violation results in immediate account termination.'}
              </p>
            </section>

            <div className="p-8 text-center bg-white/5 rounded-[40px] border border-dashed border-white/10">
               <p className="text-xs text-zinc-400 font-medium">
                 Have questions? Reach out to us at <span className="text-white font-bold">legal@connectup.io</span>
               </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
