
import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import gsap from 'gsap';
import { ArrowRight, Play, Pause, ChevronRight, Sparkles } from 'lucide-react';
import { ParallaxComponent } from './ui/component';

interface HomeViewProps {
  onNavigate: (page: 'home' | 'about' | 'blog' | 'founders' | 'contact') => void;
  onLoginClick: () => void;
  showVideo: boolean;
}

export const LandingHome = ({ onNavigate, onLoginClick, showVideo }: HomeViewProps) => {
  useEffect(() => {
    const elements = document.querySelectorAll('.hero-anim');
    gsap.fromTo(elements, 
      { opacity: 0, y: 40, filter: 'blur(10px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, stagger: 0.15, ease: 'expo.out', delay: 0.8 }
    );
  }, []);

  return (
    <div className="w-full relative bg-[#0A0A0C]">
      <ParallaxComponent />
    </div>
  );
};

