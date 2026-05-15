"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  // 'direction' helps framer-motion understand slide direction (next vs. prev)
  const [direction, setDirection] = useState<"left" | "right">("right");

  const activeFounder = founders[currentIndex];

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
        "relative w-full min-h-[650px] md:min-h-[600px] overflow-hidden bg-[#0D0D0F] text-white p-8 md:p-12",
        className
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
        {/* === Left Column: Meta and Thumbnails === */}
        <div className="md:col-span-3 flex flex-col justify-between order-2 md:order-1">
          <div className="flex flex-row md:flex-col justify-between md:justify-start space-x-4 md:space-x-0 md:space-y-4">
            {/* Pagination */}
            <span className="text-sm text-white/40 font-mono">
              {String(currentIndex + 1).padStart(2, "0")} /{" "}
              {String(founders.length).padStart(2, "0")}
            </span>
            {/* Vertical "Founders' Comments" Text */}
            <h2 className="text-sm font-medium tracking-widest uppercase [writing-mode:vertical-rl] md:rotate-180 hidden md:block text-white/40">
              Founders
            </h2>
          </div>

          {/* Thumbnail Navigation */}
          <div className="flex space-x-2 mt-8 md:mt-0">
            {thumbnailFounders.map((founder) => {
              // Find the original index to navigate to
              const originalIndex = founders.findIndex(
                (r) => r.id === founder.id
              );
              return (
                <button
                  key={founder.id}
                  onClick={() => handleThumbnailClick(originalIndex)}
                  className="overflow-hidden rounded-md w-16 h-20 md:w-20 md:h-24 opacity-40 hover:opacity-100 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-[#EAB308] focus:ring-offset-2 focus:ring-offset-black"
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
        <div className="md:col-span-4 relative h-80 min-h-[400px] md:min-h-[500px] order-1 md:order-2">
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
              className="absolute inset-0 w-full h-full object-cover rounded-lg transition-all"
            />
          </AnimatePresence>
        </div>

        {/* === Right Column: Text and Navigation === */}
        <div className="md:col-span-5 flex flex-col justify-between md:pl-8 order-3 md:order-3">
          {/* Text Content */}
          <div className="relative overflow-hidden pt-4 md:pt-24 min-h-[200px]">
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
                <p className="text-sm font-medium text-[#EAB308]">
                  {activeFounder.affiliation}
                </p>
                <h3 className="text-xl font-semibold mt-1 text-white">
                  {activeFounder.name}
                </h3>
                <blockquote className="mt-6 text-2xl md:text-3xl font-medium leading-snug text-white">
                  "{activeFounder.quote}"
                </blockquote>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-2 mt-8 md:mt-0">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-12 h-12 border-white/10 text-white bg-white/5 hover:bg-white/10"
              onClick={handlePrev}
              aria-label="Previous Founder"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="rounded-full w-12 h-12 bg-[#EAB308] text-black hover:bg-[#EAB308]/90"
              onClick={handleNext}
              aria-label="Next Founder"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
