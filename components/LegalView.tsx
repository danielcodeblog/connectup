
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { ShaderBackground } from './ui/hero-shader';

interface LegalViewProps {
  type: 'privacy' | 'terms';
  onBack: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ type, onBack }) => {
  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';

  return (
    <ShaderBackground className="fixed inset-0 z-[150] flex flex-col animate-in fade-in duration-700 overflow-y-auto pb-32 safe-area-top text-white">
      <div className="px-6 py-4 sm:px-10 sm:py-8 sticky top-0 z-30 flex items-center bg-[#0D0D0F]/80 backdrop-blur-3xl border-b border-white/10 mt-safe">
        <button onClick={onBack} className="mr-6 p-4 -ml-2 bg-white/5 rounded-full transition-all hover:scale-105 active:scale-95 text-white shadow-sm border border-white/10 hover:bg-white/10">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl sm:text-4xl font-[900] tracking-tighter text-white leading-none">{title}</h2>
        </div>
      </div>

      <div className="p-6 sm:p-10 lg:p-16 space-y-12 max-w-7xl mx-auto w-full relative z-10 h-full overflow-y-auto">
        {isPrivacy ? (
          <div className="max-w-4xl mx-auto w-full bg-black/40 backdrop-blur-3xl rounded-[3rem] p-8 sm:p-20 shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="relative z-10 space-y-16">
              <header className="space-y-4 border-b border-white/10 pb-12">
                <h2 className="text-4xl sm:text-6xl font-[900] text-white tracking-tighter leading-none">Your <br/> Privacy</h2>
                <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-xs">How we protect your data</p>
              </header>
              <div className="space-y-12 text-white/50 leading-relaxed font-light text-lg">
                <p className="italic text-xl text-white/60">"We respect your privacy and handle your data with care."</p>
                {[
                  { title: "Data Collection", content: "We only collect data necessary to provide our service, such as your profile information and professional details." },
                  { title: "How We Use Data", content: "Your data is used to facilitate matches and power platform features. We do not sell your personal information." },
                  { title: "Your Rights", content: "You have full control over your data. You can request access, corrections, or deletion at any time." }
                ].map((section, i) => (
                  <section key={i} className="space-y-4 group">
                    <h3 className="text-white font-black text-xl tracking-tight flex items-center gap-4">
                      <span className="text-white/20 group-hover:text-brand-primary transition-colors">0{i+1}</span>
                      {section.title}
                    </h3>
                    <p className="pl-10 border-l border-white/10 group-hover:border-brand-primary transition-colors">{section.content}</p>
                  </section>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full bg-black/40 backdrop-blur-3xl rounded-[3rem] p-8 sm:p-20 shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="relative z-10 space-y-16">
              <header className="space-y-4 border-b border-white/10 pb-12">
                <h2 className="text-4xl sm:text-6xl font-[900] text-white tracking-tighter leading-none">Terms & <br/> Conditions</h2>
                <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-xs">Revised May 2026</p>
              </header>
              <div className="space-y-12 text-white/50 leading-relaxed font-light text-lg">
                {[
                  { title: "Acceptance", content: "By using connectup, you agree to these terms. Our platform provides a networking environment for capital and innovation." },
                  { title: "Accounts", content: "You are responsible for your account security. Notify us immediately of any unauthorized use." },
                  { title: "Conduct", content: "Any misuse of the platform or data is prohibited. We maintain a professional environment for all members." },
                  { title: "Ownership", content: "Platform code, designs, and data remain the exclusive property of connectup." }
                ].map((section, i) => (
                  <section key={i} className="space-y-4 group">
                    <h3 className="text-white font-black text-xl tracking-tight flex items-center gap-4">
                      <span className="text-white/20 group-hover:text-brand-primary transition-colors">0{i+1}</span>
                      {section.title}
                    </h3>
                    <p className="pl-10 border-l border-white/10 group-hover:border-brand-primary transition-colors">{section.content}</p>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ShaderBackground>
  );
};

