
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
    <div className="fixed inset-0 z-[150] flex flex-col bg-[#FFFCF0] animate-in fade-in duration-300 overflow-y-auto pb-32 safe-area-top text-zinc-900">
      <div className="px-6 py-4 sm:px-10 sm:py-8 sticky top-0 z-30 flex items-center bg-[#FFFCF0]/95 backdrop-blur-md border-b border-zinc-200/60 mt-safe">
        <button onClick={onBack} className="mr-6 p-4 -ml-2 bg-white rounded-full transition-all hover:scale-105 active:scale-95 text-zinc-800 shadow-sm border border-zinc-200/80 hover:bg-zinc-100">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl sm:text-4xl font-[900] tracking-tighter text-zinc-900 leading-none">{title}</h2>
        </div>
      </div>

      <div className="p-6 sm:p-10 lg:p-16 space-y-12 max-w-7xl mx-auto w-full relative z-10 h-full overflow-y-auto">
        {isPrivacy ? (
          <div className="max-w-4xl mx-auto w-full bg-white rounded-[3rem] p-8 sm:p-20 min-h-[75vh] shadow-[0_20px_50px_rgba(234,179,8,0.06)] border border-zinc-100 relative overflow-hidden">
            <div className="relative z-10 space-y-16">
              <header className="space-y-4 border-b border-zinc-100 pb-12">
                <h2 className="text-4xl sm:text-6xl font-[900] text-zinc-900 tracking-tighter leading-none">Your <br/> Privacy</h2>
                <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-xs">How we protect your data</p>
              </header>
              <div className="space-y-12 text-zinc-600 leading-relaxed font-light text-lg">
                <p className="italic text-xl text-amber-600 font-medium">"We respect your privacy and handle your data with care."</p>
                {[
                  { title: "Data Collection", content: "We only collect data necessary to provide our service, such as your profile information and professional details." },
                  { title: "How We Use Data", content: "Your data is used to facilitate matches and power platform features. We do not sell your personal information." },
                  { title: "Your Rights", content: "You have full control over your data. You can request access, corrections, or deletion at any time." }
                ].map((section, i) => (
                  <section key={i} className="space-y-4 group">
                    <h3 className="text-zinc-900 font-black text-xl tracking-tight flex items-center gap-4">
                      <span className="text-amber-500/30 group-hover:text-amber-500 transition-colors">0{i+1}</span>
                      {section.title}
                    </h3>
                    <p className="pl-10 border-l border-zinc-150 group-hover:border-amber-400 transition-colors">{section.content}</p>
                  </section>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full bg-white rounded-[3rem] p-8 sm:p-20 min-h-[75vh] shadow-[0_20px_50px_rgba(234,179,8,0.06)] border border-zinc-100 relative overflow-hidden">
            <div className="relative z-10 space-y-16">
              <header className="space-y-4 border-b border-zinc-100 pb-12">
                <h2 className="text-4xl sm:text-6xl font-[900] text-zinc-900 tracking-tighter leading-none">Terms & <br/> Conditions</h2>
                <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-xs">Revised May 2026</p>
              </header>
              <div className="space-y-12 text-zinc-600 leading-relaxed font-light text-lg">
                {[
                  { title: "Acceptance", content: "By using connectup, you agree to these terms. Our platform provides a networking environment for capital and innovation." },
                  { title: "Accounts", content: "You are responsible for your account security. Notify us immediately of any unauthorized use." },
                  { title: "Conduct", content: "Any misuse of the platform or data is prohibited. We maintain a professional environment for all members." },
                  { title: "Ownership", content: "Platform code, designs, and data remain the exclusive property of connectup." }
                ].map((section, i) => (
                  <section key={i} className="space-y-4 group">
                    <h3 className="text-zinc-900 font-black text-xl tracking-tight flex items-center gap-4">
                      <span className="text-amber-500/30 group-hover:text-amber-500 transition-colors">0{i+1}</span>
                      {section.title}
                    </h3>
                    <p className="pl-10 border-l border-zinc-150 group-hover:border-amber-400 transition-colors">{section.content}</p>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

