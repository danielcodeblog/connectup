"use client"; 

import React, { useRef, useState } from "react";
import { motion } from "motion/react";

export function NavHeader({
  pages,
  currentPage,
  onNavigate,
}: {
  pages: string[];
  currentPage: string;
  onNavigate: (page: string) => void;
}) {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  return (
    <ul
      className="relative mx-auto hidden lg:flex w-fit"
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
    >
      {pages.map((page) => (
        <Tab 
          key={page} 
          setPosition={setPosition} 
          isActive={currentPage === page}
          onClick={() => onNavigate(page)}
        >
          {page}
        </Tab>
      ))}

      <Cursor position={position} />
    </ul>
  );
}

const Tab = ({
  children,
  setPosition,
  isActive,
  onClick,
}: {
  children: React.ReactNode;
  setPosition: any;
  isActive: boolean;
  onClick: () => void;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return;

        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      onClick={onClick}
      className={`relative z-10 block cursor-pointer px-3 py-1.5 text-sm capitalize transition-colors md:px-5 md:py-2 md:text-sm font-semibold ${
        isActive ? "text-[#EAB308]" : "text-white hover:text-white/80"
      }`}
    >
      {children}
    </li>
  );
};

const Cursor = ({ position }: { position: any }) => {
  return (
    <motion.li
      animate={position}
      className="absolute z-0 h-9 md:h-9 rounded-full bg-white/10"
    />
  );
};
