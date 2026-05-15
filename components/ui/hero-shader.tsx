"use client"

import React, { useEffect, useRef, useState } from "react"
import { MeshGradient } from "@paper-design/shaders-react"

interface ShaderBackgroundProps {
  children: React.ReactNode
}

export function ShaderBackground({ children, className }: { children?: React.ReactNode, className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [shouldRender, setShouldRender] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  useEffect(() => {
    const handleMouseEnter = () => setIsActive(true)
    const handleMouseLeave = () => setIsActive(false)

    const container = containerRef.current
    if (container) {
      container.addEventListener("mouseenter", handleMouseEnter)
      container.addEventListener("mouseleave", handleMouseLeave)
    }

    return () => {
      if (container) {
        container.removeEventListener("mouseenter", handleMouseEnter)
        container.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className={className || "min-h-[650px] w-full relative overflow-hidden h-full flex flex-col items-center justify-center font-sans"}>
      {/* Fast CSS Fallback Gradient */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'conic-gradient(from 180deg at 50% 50%, #0D0D0F 0deg, #1A1A1E 120deg, #EAB30833 240deg, #121214 360deg)',
          filter: 'blur(80px)'
        }}
      />
      
      {/* Background Shaders */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {shouldRender && (
          <MeshGradient
            className="absolute inset-0 w-full h-full"
            colors={["#0D0D0F", "#1A1A1E", "#EAB308", "#121214"]}
            speed={0.15}
          />
        )}
      </div>

      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  )
}
