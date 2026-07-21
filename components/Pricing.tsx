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
    yearlyPrice: "29",
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const centerPopularCard = () => {
      // Only run this on mobile/tablet (less than lg screens where horizontal scroll is active)
      if (window.innerWidth >= 1024) return;

      if (containerRef.current) {
        const container = containerRef.current;
        const popularIndex = plans.findIndex(p => p.isPopular);
        const targetIndex = popularIndex !== -1 ? popularIndex : 1;
        const popularCard = container.children[targetIndex] as HTMLElement;
        if (popularCard) {
          const containerRect = container.getBoundingClientRect();
          const cardRect = popularCard.getBoundingClientRect();
          const scrollAmount = container.scrollLeft + (cardRect.left - containerRect.left) - (container.clientWidth - cardRect.width) / 2;
          container.scrollLeft = scrollAmount;
        }
      }
    };

    // Run on mount
    centerPopularCard();

    // Small timeouts to ensure DOM elements have fully painted and sized
    const timer1 = setTimeout(centerPopularCard, 50);
    const timer2 = setTimeout(centerPopularCard, 200);

    window.addEventListener("resize", centerPopularCard);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", centerPopularCard);
    };
  }, [plans]);

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
    <div className="container mx-auto py-24 sm:py-32 px-4 sm:px-6 relative z-10 max-w-[1400px] w-full overflow-hidden md:overflow-visible text-zinc-900 bg-white">
      {/* Aesthetic Water Drop Divider as a top border line */}
      

      <div className="text-center space-y-4 mb-16">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal tracking-tight text-zinc-900">
          Flexible <span className="italic font-light text-zinc-700">Pricing</span>
        </h2>
        <p className="text-zinc-600 text-base sm:text-lg max-w-xl mx-auto whitespace-pre-line font-light leading-relaxed">
          {description}
        </p>
      </div>

      {/* Premium Capsule Segment Billing Toggle */}
      <div className="flex justify-center mb-16 select-none">
        <div className="bg-zinc-100 border border-zinc-200/80 p-1 rounded-full flex items-center relative shadow-inner">
          <button
            onClick={() => handleToggle(false)}
            className={cn(
              "relative px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-colors duration-300 cursor-pointer z-10",
              isMonthly ? "text-zinc-950 font-black" : "text-zinc-500 hover:text-zinc-900"
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
              !isMonthly ? "text-zinc-950 font-black" : "text-zinc-500 hover:text-zinc-900"
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
          </button>
        </div>
      </div>

      {/* Plans Grid / Scrollable Container on Mobile */}
      <div className="w-full overflow-hidden lg:overflow-visible py-8">
        <div ref={containerRef} className="relative flex flex-row overflow-x-auto snap-x snap-mandatory gap-6 w-full pt-4 pb-8 px-4 lg:grid lg:grid-cols-3 lg:gap-10 lg:w-auto lg:px-6 lg:pb-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {plans.map((plan, index) => {
            const isCustom = plan.price.toLowerCase() === "custom" || isNaN(Number(plan.price));
            const planPriceValue = isMonthly ? Number(plan.price) : Number(plan.yearlyPrice);

            return (
              <div
                key={index}
                className={cn(
                  "w-[85vw] max-w-[385px] sm:max-w-[420px] lg:w-full shrink-0 snap-center lg:snap-align-none lg:shrink rounded-[1.8rem] sm:rounded-[2.2rem] border p-6 sm:p-8 lg:p-9 flex flex-col justify-between relative transition-all duration-500 min-h-[560px] md:min-h-[600px] lg:min-h-[640px]",
                  plan.isPopular 
                    ? "bg-[#EAB308] text-zinc-950 border-amber-400 shadow-[0_20px_50px_rgba(234,179,8,0.3)] z-10" 
                    : "bg-gradient-to-b from-white to-amber-50/20 border-zinc-200 hover:border-zinc-300 shadow-[0_10px_30px_rgba(0,0,0,0.03)] z-0 text-zinc-900"

                )}
              >
                {/* Popular Pill */}
              
              <div className={cn(
                "flex-1 flex flex-col",
                plan.isPopular ? "text-center items-center" : "text-left items-start"
              )}>
                {/* Suno-Style Serif Title */}
                <h3 className={cn(
                  "font-serif text-2xl sm:text-3xl font-normal tracking-tight mb-2",
                  plan.isPopular ? "text-zinc-950 text-center font-semibold" : "text-zinc-900"
                )}>
                  {plan.name}
                </h3>
                
                <p className={cn(
                  "text-xs sm:text-sm font-light leading-relaxed mb-6",
                  plan.isPopular ? "text-zinc-800 text-center max-w-xs mx-auto" : "text-zinc-500"
                )}>
                  {plan.description}
                </p>

                {/* Suno Price Display */}
                <div className={cn(
                  "my-4 flex items-baseline gap-x-1.5 border-b pb-4",
                  plan.isPopular ? "border-zinc-950/10 justify-center w-full" : "border-zinc-200 w-full"
                )}>
                  {isCustom ? (
                    <span className={cn(
                      "text-3xl sm:text-4xl font-black tracking-tight uppercase font-sans",
                      plan.isPopular ? "text-zinc-950" : "text-zinc-900"
                    )}>
                      {plan.price}
                    </span>
                  ) : (
                    <>
                      <span className={cn(
                        "text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-sans",
                        plan.isPopular ? "text-zinc-950" : "text-zinc-900"
                      )}>
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
                      <span className={plan.isPopular ? "text-zinc-800 font-medium text-xs sm:text-sm" : "text-zinc-500 font-medium text-xs sm:text-sm"}>
                        / {isMonthly ? "month" : "month"}
                      </span>
                    </>
                  )}
                </div>

                {!isMonthly && !isCustom && planPriceValue > 0 && (
                  <p className={cn("text-xs font-semibold mb-6", plan.isPopular ? "text-zinc-900 text-center" : "text-[#EAB308]")}>
                    Save ${Number(plan.price) * 12 - Number(plan.yearlyPrice)} / year
                  </p>
                )}
                
                <div className="mt-2 mb-8 w-full">
                  <button
                    onClick={() => {
                      if (onPlanSelect) {
                        onPlanSelect(plan);
                      }
                    }}
                    className={cn(
                      "w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer text-center block hover:scale-[1.02] active:scale-[0.98]",
                      plan.isPopular
                        ? "bg-zinc-950 text-white hover:bg-zinc-900 shadow-md"
                        : "bg-zinc-950 text-white hover:bg-zinc-900 border border-transparent shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
                    )}
                  >
                    {plan.buttonText}
                  </button>
                </div>

                <ul className={cn("space-y-4 flex-1 mb-4 w-full", plan.isPopular ? "max-w-xs mx-auto text-left" : "")}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm font-light">
                      {feature.included ? (
                        <div className={plan.isPopular ? "text-zinc-950 mt-1 flex-shrink-0" : "text-[#EAB308] mt-1 flex-shrink-0"}>
                           <Check className="h-4 w-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className={plan.isPopular ? "text-zinc-700 mt-1 flex-shrink-0" : "text-zinc-300 mt-1 flex-shrink-0"}>
                           <X className="h-4 w-4 stroke-[2]" />
                        </div>
                      )}
                      <span className={cn(
                        "text-left leading-relaxed transition-colors duration-300",
                        feature.included 
                          ? (plan.isPopular ? "text-zinc-900" : "text-zinc-700") 
                          : (plan.isPopular ? "text-zinc-800/60 line-through decoration-zinc-950/20" : "text-zinc-400 line-through decoration-zinc-200")
                      )}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
         })}
      </div>
      </div>
    </div>
  );
}
