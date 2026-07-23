"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the type for a single review
type Review = {
  id: string | number;
  name: string;
  affiliation: string;
  quote: string;
  imageSrc: string;
  thumbnailSrc: string;
};

// Define the props for the slider component
interface FounderSliderProps {
  founders: Review[];
  /** Optional class name for the container */
  className?: string;
}

/**
 * A reusable, animated founder slider component.
 * It uses framer-motion for animations and is styled with
 * shadcn/ui theme variables.
 */
export const FounderSlider = ({
  founders,
  className,
}: FounderSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!founders || founders.length === 0) {
    return null;
  }

  // 'direction' helps framer-motion understand slide direction (next vs. prev)
  const [direction, setDirection] = useState<"left" | "right">("right");

  const activeFounder = founders[currentIndex];

  if (!activeFounder) {
    return null;
  }

  const handleNext = () => {
    setDirection("right");
    setCurrentIndex((prev) => (prev + 1) % founders.length);
  };

  const handlePrev = () => {
    setDirection("left");
    setCurrentIndex((prev) => (prev - 1 + founders.length) % founders.length);
  };

  const handleThumbnailClick = (index: number) => {
    // Determine direction for animation
    setDirection(index > currentIndex ? "right" : "left");
    setCurrentIndex(index);
  };

  // Get the next 3 founders for the thumbnails, excluding the current one
  const thumbnailFounders = founders
    .filter((_, i) => i !== currentIndex)
    .slice(0, 3);

  // Animation variants for the main image
  const imageVariants = {
    enter: (direction: "left" | "right") => ({
      y: direction === "right" ? "100%" : "-100%",
      opacity: 0,
    }),
    center: { y: 0, opacity: 1 },
    exit: (direction: "left" | "right") => ({
      y: direction === "right" ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  // Animation variants for the text content
  const textVariants = {
    enter: (direction: "left" | "right") => ({
      x: direction === "right" ? 50 : -50,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: "left" | "right") => ({
      x: direction === "right" ? -50 : 50,
      opacity: 0,
    }),
  };

  return (
    <div
      className={cn(
        "relative w-full min-h-[750px] md:min-h-[720px] overflow-hidden bg-white/80 backdrop-blur-2xl border border-white/80 text-zinc-950 p-10 md:p-16 shadow-2xl",
        className
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
        {/* === Left Column: Meta and Thumbnails === */}
        <div className="md:col-span-2 flex flex-col justify-between order-2 md:order-1">
          <div className="flex flex-row md:flex-col justify-between md:justify-start space-x-4 md:space-x-0 md:space-y-4">
            {/* Pagination */}
            <span className="text-base text-zinc-500 font-mono font-bold">
              {String(currentIndex + 1).padStart(2, "0")} /{" "}
              {String(founders.length).padStart(2, "0")}
            </span>
            {/* Vertical "Founders' Comments" Text */}
            <h2 className="text-base font-bold tracking-widest uppercase [writing-mode:vertical-rl] md:rotate-180 hidden md:block text-zinc-700">
              Founders
            </h2>
          </div>

          {/* Thumbnail Navigation */}
          <div className="flex space-x-3 mt-8 md:mt-0">
            {thumbnailFounders.map((founder) => {
              // Find the original index to navigate to
              const originalIndex = founders.findIndex(
                (r) => r.id === founder.id
              );
              return (
                <button
                  key={founder.id}
                  onClick={() => handleThumbnailClick(originalIndex)}
                  className="overflow-hidden rounded-xl w-28 h-32 md:w-36 md:h-44 opacity-80 hover:opacity-100 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 focus:ring-offset-white border border-zinc-200 shadow-md"
                  aria-label={`View comment from ${founder.name}`}
                >
                  <img
                    src={founder.thumbnailSrc}
                    alt={founder.name}
                    className="w-full h-full object-cover transition-all"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* === Center Column: Main Image === */}
        <div className="md:col-span-6 relative h-96 min-h-[450px] md:min-h-[580px] order-1 md:order-2">
          <AnimatePresence initial={false} custom={direction}>
              <motion.img
              key={currentIndex}
              src={activeFounder.imageSrc}
              alt={activeFounder.name}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }} // Cubic bezier for smooth ease
              className="absolute inset-0 w-full h-full object-cover rounded-2xl transition-all border border-zinc-200 shadow-[0_12px_30px_rgba(0,0,0,0.1)]"
            />
          </AnimatePresence>
        </div>

        {/* === Right Column: Text and Navigation === */}
        <div className="md:col-span-4 flex flex-col justify-between md:pl-8 order-3 md:order-3">
          {/* Text Content */}
          <div className="relative overflow-hidden pt-4 md:pt-16 min-h-[240px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              >
                <p className="text-base font-extrabold tracking-wider uppercase text-zinc-950">
                  {activeFounder.affiliation}
                </p>
                <h3 className="text-3xl md:text-4xl font-bold mt-2 text-zinc-950 font-serif">
                  {activeFounder.name}
                </h3>
                <blockquote className="mt-6 text-2xl md:text-3xl lg:text-4xl font-medium leading-tight text-amber-700 font-serif">
                  "{activeFounder.quote}"
                </blockquote>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-3 mt-8 md:mt-0">
            <button
              className="inline-flex items-center justify-center rounded-full w-14 h-14 border border-zinc-300 text-zinc-800 bg-white/60 hover:bg-white hover:text-zinc-950 transition-colors cursor-pointer active:scale-95 shadow-sm backdrop-blur-sm"
              onClick={handlePrev}
              aria-label="Previous Founder"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              className="inline-flex items-center justify-center rounded-full w-14 h-14 bg-zinc-950 text-white hover:bg-zinc-800 hover:scale-105 shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all cursor-pointer active:scale-95 font-medium"
              onClick={handleNext}
              aria-label="Next Founder"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
