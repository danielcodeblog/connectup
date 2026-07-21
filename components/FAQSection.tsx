import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

const faqs: any[] = [
    {
        question: 'What is ConnectUp?',
        answer: 'ConnectUp is a platform designed to connect startup founders with early-stage investors, fostering meaningful partnerships through smart matching and streamlined communication.'
    },
    {
        question: 'How do you match founders with investors?',
        answer: 'Our proprietary algorithm analyzes multiple data points including industry focus, stage preferences, and historical investment patterns to surface the most relevant connections for both parties.'
    },
    {
        question: 'Is my pitch deck secure?',
        answer: 'Absolutely. Your pitch deck and confidential information are only shared with investors after a mutual match is established, ensuring you maintain control over who sees your data.'
    },
    {
        question: 'How much does it cost?',
        answer: 'We offer a free basic tier for founders to create profiles and browse the investor directory. Premium features, including direct messaging and advanced analytics, are available through our subscription plans.'
    },
    {
        question: 'Can I cancel my subscription at any time?',
        answer: 'Yes, you can upgrade, downgrade, or cancel your subscription at any time from your account settings.'
    }
];

export const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="w-full py-24 md:py-32 bg-white relative z-10 px-6 border-t border-zinc-100">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal tracking-tight text-zinc-900 mb-4">
                        Common <span className="italic font-light text-[#EAB308]">Questions</span>
                    </h2>
                    <p className="text-zinc-500 text-base sm:text-lg max-w-xl mx-auto font-light leading-relaxed">
                        Everything you need to know about our platform.
                    </p>
                </div>

                
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-zinc-50 border border-zinc-200/80 rounded-[1.5rem] overflow-hidden transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-zinc-300 hover:bg-zinc-100/50">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full p-6 sm:p-7 flex items-center justify-between text-left transition-all hover:bg-zinc-100/20 cursor-pointer"
                            >
                                <span className="font-serif text-lg sm:text-xl font-normal text-zinc-900 pr-4">{faq.question}</span>
                                <div className={`p-1.5 rounded-full border border-zinc-200 flex-shrink-0 transition-colors ${openIndex === index ? 'bg-[#EAB308] text-zinc-950 border-transparent' : 'text-zinc-500'}`}>
                                    {openIndex === index ? <Minus size={16} /> : <Plus size={16} />}
                                </div>
                            </button>
                            {openIndex === index && (
                                <div className="px-6 sm:px-7 pb-6 sm:pb-7 text-zinc-600 text-sm sm:text-base leading-relaxed font-light">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
