import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "How does the pitch swiping and matching process work?",
    answer: "Founders build interactive pitch profiles, complete with product demos and video pitches. Investors, co-founders, and partners swipe right on projects they find compelling, initiating an instant match and a direct channel of communication once a connection is established."
  },
  {
    question: "Who can see my startup's video pitches and confidential decks?",
    answer: "You have complete control over your privacy. You can toggle your startup profile between public discovery and private modes. Your detailed financial metrics, pitches, and direct calendar remain secure and are only visible to verified matches or members you explicitly approve."
  },
  {
    question: "How does the founders scheduler feature work?",
    answer: "The Founders Scheduler lets you customize your availability, set buffer times, and sync with your calendar. Once matched on the Swipe Deck, other members can book direct video calls, pitch reviews, or advisory sessions with you instantly."
  },
  {
    question: "How does the Community Feed benefit founders and builders?",
    answer: "The Community Feed is a collaborative space to share real-time updates, request feedback on your technical stack, post open roles, and announce fundraising milestones, facilitating organic ecosystem discovery outside of structured swiping."
  },
  {
    question: "Can I update my pitch deck dynamically?",
    answer: "Yes. Using the integrated Pitch Editor in your founder dashboard, you can update your business model, traction statistics, team details, and video links instantly. Your profile on the active Swipe Deck is updated in real-time."
  }
];

export const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="w-full py-24 md:py-32 bg-[#0B0B0D] relative z-10 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                        Common <span className="font-serif italic font-light text-[#EAB308]">Questions</span>
                    </h2>
                    <p className="text-zinc-400 font-light">Everything you need to know about our platform.</p>
                </div>
                
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-[#161618] border border-white/5 rounded-[1.5rem] overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full p-6 sm:p-7 flex items-center justify-between text-left transition-all hover:bg-[#1C1C1E] cursor-pointer"
                            >
                                <span className="font-serif text-lg sm:text-xl font-normal text-white pr-4">{faq.question}</span>
                                <div className={`p-1.5 rounded-full border border-white/5 flex-shrink-0 transition-colors ${openIndex === index ? 'bg-[#EAB308] text-black border-transparent' : 'text-zinc-400'}`}>
                                    {openIndex === index ? <Minus size={16} /> : <Plus size={16} />}
                                </div>
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-6 sm:px-7 pb-6 sm:pb-7 text-zinc-400 text-sm sm:text-base leading-relaxed font-light"
                                    >
                                        {faq.answer}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
