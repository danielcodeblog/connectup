import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "How does the matching process work?",
    answer: "Our engine analyzes your technical stack, funding requirements, and industry focus to pair you with partners who explicitly match your criteria, not just anyone in the sector."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We treat security as a core product feature, utilizing enterprise-grade encryption for all data transmission and storage."
  },
  {
    question: "What is the vetting process for investors?",
    answer: "Every investor on ConnectUp undergoes a rigorous verification process, confirming their investment thesis, past track record, and current capital deployment focus."
  },
  {
    question: "Can I control who sees my pitch?",
    answer: "Absolutely. We put privacy first. Your pitch and company details remain strictly confidential and anonymous until you purposefully approve a match."
  }
];

export const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="w-full py-24 md:py-32 bg-transparent relative z-10 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-[900] tracking-tighter text-white mb-6">
                        Common <span className="text-[#EAB308] italic">Questions</span>
                    </h2>
                    <p className="text-xl text-white/60">Everything you need to know about the platform.</p>
                </div>
                
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full p-8 flex items-center justify-between text-left transition-all hover:bg-white/5"
                            >
                                <span className="font-bold text-lg text-white">{faq.question}</span>
                                <div className={`p-2 rounded-full border border-white/10 transition-colors ${openIndex === index ? 'bg-[#EAB308] text-black' : 'text-white'}`}>
                                    {openIndex === index ? <Minus size={18} /> : <Plus size={18} />}
                                </div>
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-8 pb-8 text-white/70 leading-relaxed"
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
