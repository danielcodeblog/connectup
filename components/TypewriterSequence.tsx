import React, { useState, useEffect, useRef } from 'react';

export interface TypewriterSegment {
  text: string;
  className?: string;
}

interface TypewriterSequenceProps {
  segments: TypewriterSegment[];
  speed?: number; // ms per character
  delay?: number; // initial delay before starting (ms)
  className?: string;
  cursorColor?: string;
  once?: boolean;
  disableAnimation?: boolean;
}

export const TypewriterSequence: React.FC<TypewriterSequenceProps> = ({
  segments,
  speed = 25,
  delay = 150,
  className = '',
  cursorColor = 'bg-[#EAB308]',
  once = true,
  disableAnimation = false,
}) => {
  const totalLength = segments.reduce((sum, seg) => sum + seg.text.length, 0);
  const [charIndex, setCharIndex] = useState(disableAnimation ? totalLength : 0);
  const [isStarted, setIsStarted] = useState(disableAnimation);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (disableAnimation) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsStarted(true);
          if (once && containerRef.current) {
            observer.unobserve(containerRef.current);
          }
        }
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [once, disableAnimation]);

  useEffect(() => {
    if (disableAnimation || !isStarted) return;

    let timer: NodeJS.Timeout;
    const startTimeout = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current++;
        setCharIndex(current);
        if (current >= totalLength) {
          clearInterval(interval);
        }
      }, speed);

      timer = interval as unknown as NodeJS.Timeout;
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (timer) clearInterval(timer);
    };
  }, [isStarted, totalLength, speed, delay, disableAnimation]);

  let cumulative = 0;

  return (
    <span ref={containerRef} className={className}>
      {segments.map((segment, index) => {
        const segStart = cumulative;
        const segEnd = segStart + segment.text.length;
        cumulative = segEnd;

        if (charIndex <= segStart) {
          return null;
        }

        const isCurrentlyTypingThisSegment =
          charIndex > segStart && charIndex < segEnd;
        const visibleLength = Math.min(
          segment.text.length,
          charIndex - segStart
        );
        const visibleText = segment.text.slice(0, visibleLength);

        const isLastSegment = index === segments.length - 1;
        const isFinished = charIndex >= totalLength;

        return (
          <span key={index} className={segment.className}>
            {visibleText}
            {(isCurrentlyTypingThisSegment ||
              (isLastSegment && !isFinished && charIndex > segStart)) && (
              <span
                className={`inline-block w-[2px] h-[0.9em] ${cursorColor} align-baseline ml-0.5 animate-pulse`}
              />
            )}
          </span>
        );
      })}
    </span>
  );
};
