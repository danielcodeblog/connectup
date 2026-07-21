"use client"

import React from "react"

export function ShaderBackground({ children, className, paused }: { children?: React.ReactNode, className?: string, paused?: boolean }) {
  return (
    <div className={className || "min-h-[650px] w-full relative overflow-hidden h-full flex flex-col items-center justify-center font-sans"}>
      {/* Fast CSS Static Background Gradient */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'conic-gradient(from 180deg at 50% 50%, #0D0D0F 0deg, #1A1A1E 120deg, #EAB3080F 240deg, #121214 360deg)',
          filter: 'blur(80px)'
        }}
      />
      
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  )
}
