
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
    // Entrance animations removed for "no slow loading"
  }, []);

  return (
    <div className="w-full relative bg-gradient-to-b from-yellow-400 to-white">
      <ParallaxComponent />
    </div>
  );
};