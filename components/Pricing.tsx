import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Check, Star, X } from "lucide-react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";

// Custom light-weight media query hook to keep code self-contained and clean
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

export interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: { text: string; included: boolean }[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}

interface PricingProps {
  plans?: PricingPlan[];
  title?: string;
  description?: string;
  onPlanSelect?: (plan: PricingPlan) => void;
}

const DEFAULT_PLANS: PricingPlan[] = [
  {
    name: "Free Access",
    price: "0",
    yearlyPrice: "0",
    period: "Month",
    description: "Standard networking and active deal exploration for both founders and investors.",
    buttonText: "Get Started Free",
    href: "#",
    isPopular: false,
    features: [
      { text: "Standard Profile Listing", included: true },
      { text: "Limited direct messaging", included: true },
      { text: "Basic matching & swipe deck", included: true },
      { text: "Verified Pro badge (Founder/Investor)", included: false },
      { text: "Interactive strategy & pitch guides", included: false },
    ],
  },
  {
    name: "Pro Connect",
    price: "5",
    yearlyPrice: "89.99",
    period: "Month",
    description: "Unleash elite matchmaking, custom pitch insights, and priority partner discovery.",
    buttonText: "Upgrade to Pro",
    href: "#",
    isPopular: true,
    features: [
      { text: "Standard Profile Listing", included: true },
      { text: "Full Community Feed Access", included: true },
      { text: "Verified Pro badge (Founder/Investor)", included: true },
      { text: "Interactive strategy & pitch guides", included: true },
    ],
  },
  {
    name: "Pro Trial",
    price: "0",
    yearlyPrice: "0",
    period: "7 Days",
    description: "Experience all Pro features completely free for one week as a founder or investor.",
    buttonText: "Start Free Trial",
    href: "#",
    isPopular: false,
    features: [
      { text: "Standard Profile Listing", included: true },
      { text: "Unlimited direct messaging & networking", included: true },
      { text: "Full Community Feed Access", included: true },
      { text: "Verified Pro badge (Founder/Investor)", included: true },
      { text: "7 days of full Pro access", included: true },
    ],
  },
];

export function Pricing({
  plans = DEFAULT_PLANS,
  title = "Pricing Plan",
  description = "Choose the plan that works for you. All plans include access to our platform, direct messaging, and secure capital matching.",
  onPlanSelect,
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#EAB308", "#ffffff", "#3f3f46"],
        ticks: 150,
        gravity: 1.1,
        decay: 0.95,
        startVelocity: 25,
        shapes: ["circle"],
      });
    }
  };

  return (
    <div className="container mx-auto py-24 px-4 sm:px-6 relative z-10 max-w-7xl w-full overflow-hidden md:overflow-visible">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase font-sans">
          {title}
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto whitespace-pre-line font-light">
          {description}
        </p>
      </div>

      {/* Premium Capsule Segment Billing Toggle */}
      <div className="flex justify-center mb-16 select-none">
        <div className="bg-[#161618] border border-white/5 p-1 rounded-full flex items-center relative shadow-inner">
          <button
            onClick={() => handleToggle(false)}
            className={cn(
              "relative px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-colors duration-300 cursor-pointer z-10",
              isMonthly ? "text-black" : "text-zinc-400 hover:text-white"
            )}
          >
            {isMonthly && (
              <motion.span
                layoutId="activeBilling"
                className="absolute inset-0 bg-[#EAB308] rounded-full -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            Monthly
          </button>

          <button
            onClick={() => handleToggle(true)}
            className={cn(
              "relative px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-colors duration-300 cursor-pointer z-10 flex items-center gap-1.5",
              !isMonthly ? "text-black" : "text-zinc-400 hover:text-white"
            )}
          >
            {!isMonthly && (
              <motion.span
                layoutId="activeBilling"
                className="absolute inset-0 bg-[#EAB308] rounded-full -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <span>Yearly</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase transition-colors duration-300",
              !isMonthly ? "bg-black/10 text-black" : "bg-[#EAB308]/10 text-[#EAB308]"
            )}>
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid / Scrollable Container on Mobile */}
      <div className="w-full overflow-hidden md:overflow-visible py-2">
        <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 gap-4 lg:gap-6 w-full max-w-6xl mx-auto items-stretch pt-4 pb-8 md:pb-0 px-4 md:px-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {plans.map((plan, index) => {
            const isCustom = plan.price.toLowerCase() === "custom" || isNaN(Number(plan.price));
            const planPriceValue = isMonthly ? Number(plan.price) : Number(plan.yearlyPrice);

            return (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                whileInView={
                  isDesktop
                    ? {
                        y: plan.isPopular ? -8 : 0,
                        opacity: 1,
                        scale: plan.isPopular ? 1.02 : 1.0,
                      }
                    : { y: 0, opacity: 1 }
                }
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  type: "spring",
                  stiffness: 110,
                  damping: 22,
                  delay: index * 0.08,
                }}
                className={cn(
                  "w-[85vw] max-w-[320px] sm:max-w-[360px] md:w-full shrink-0 snap-center md:shrink rounded-[2rem] border p-6 sm:p-8 md:p-6 lg:p-9 flex flex-col justify-between relative transition-all duration-300 bg-[#161618] hover:bg-[#1A1A1D]/90",
                  plan.isPopular 
                    ? "border-[#EAB308] shadow-2xl shadow-[#EAB308]/5 ring-1 ring-[#EAB308]/30 z-10 order-first md:order-none" 
                    : "border-white/5 z-0"
                )}
              >
              {/* No most popular badge */}
              
              <div className="flex-1 flex flex-col text-left">
                {/* Suno-Style Serif Title */}
                <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-white mb-2">
                  {plan.name}
                </h3>
                
                <p className="text-sm text-zinc-400 font-light leading-relaxed mb-6">
                  {plan.description}
                </p>

                {/* Suno Price Display */}
                <div className="my-4 flex items-baseline gap-x-1.5">
                  {isCustom ? (
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase font-sans">
                      {plan.price}
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-sans">
                        <NumberFlow
                          value={planPriceValue}
                          format={{
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: planPriceValue % 1 === 0 ? 0 : 2,
                            maximumFractionDigits: planPriceValue % 1 === 0 ? 0 : 2,
                          }}
                        />
                      </span>
                      <span className="text-zinc-500 font-medium text-sm">
                        / {isMonthly ? "month" : "month"}
                      </span>
                    </>
                  )}
                </div>

                {!isMonthly && !isCustom && planPriceValue > 0 && (
                  <p className="text-xs text-[#EAB308] font-medium mb-8">
                    Saves ${(Number(plan.price) * 12 - Number(plan.yearlyPrice)).toFixed(2)} by billing yearly!
                  </p>
                )}
                
                <div className="mt-4 mb-8">
                  <button
                    onClick={() => {
                      if (onPlanSelect) {
                        onPlanSelect(plan);
                      }
                    }}
                    className={cn(
                      "w-full py-3.5 rounded-full font-semibold text-sm transition-all duration-200 cursor-pointer text-center block",
                      plan.isPopular
                        ? "bg-[#FAF7F2] text-black hover:bg-[#FAF7F2]/90 hover:scale-[1.01] active:scale-[0.99]"
                        : "bg-[#27272A] text-white hover:bg-[#3F3F46] hover:scale-[1.01] active:scale-[0.99]"
                    )}
                  >
                    {plan.buttonText}
                  </button>
                </div>

                <ul className="space-y-4 flex-1 mb-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-zinc-300 text-sm font-light">
                      {feature.included ? (
                        <div className="text-[#10B981] mt-1 flex-shrink-0">
                          <Check className="h-4 w-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="text-zinc-600 mt-1 flex-shrink-0">
                          <X className="h-4 w-4 stroke-[2]" />
                        </div>
                      )}
                      <span className={cn(
                        "text-left leading-tight",
                        feature.included ? "text-zinc-300" : "text-zinc-500 line-through decoration-zinc-800"
                      )}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
