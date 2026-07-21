import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, Copy, Check } from 'lucide-react';

export const LandingContact = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  const contactCards = [
    {
      id: 'email',
      label: 'Email',
      value: 'hello@quillow.edu',
      href: 'mailto:hello@quillow.edu',
      icon: Mail,
      circleBg: 'bg-[#FFF9DD]', // soft yellow
      iconColor: 'text-zinc-950',
    },
  ];

  return (
    <section id="contact" className="w-full py-24 bg-white relative overflow-hidden">
      {/* Decorative subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 flex flex-col items-center">
        {/* Contact Information Badge */}
        <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase bg-[#FFF9DD] text-zinc-900 border border-zinc-950/10 mb-5 shadow-sm">
          CONTACT INFORMATION
        </div>

        {/* Title */}
        <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 text-center max-w-2xl leading-tight mb-16">
          Get in touch with our team
        </h2>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {contactCards.map((card) => {
            const IconComponent = card.icon;
            const isCopied = copiedText === card.label;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="group relative bg-white border-[1.5px] border-zinc-950 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[220px] shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Round icon holder */}
                <div className={`w-14 h-14 rounded-full ${card.circleBg} border-[1.5px] border-zinc-950 flex items-center justify-center mb-6 shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                  <IconComponent className={`w-6 h-6 ${card.iconColor} stroke-[2]`} />
                </div>

                {/* Main Link/Value */}
                <a
                  href={card.href}
                  target={card.id === 'location' ? '_blank' : undefined}
                  rel={card.id === 'location' ? 'noopener noreferrer' : undefined}
                  className="font-sans text-[17px] md:text-lg font-bold text-zinc-950 hover:underline hover:text-amber-600 transition-colors duration-150 mb-3 block"
                >
                  {card.value}
                </a>

                {/* Sub-action panel */}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => handleCopy(card.value, card.label)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-all cursor-pointer"
                    title={`Copy ${card.label}`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
