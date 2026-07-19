/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'motion/react';

// Create a context so nested children can access smooth mouse and scroll positions if they want to build custom parallax
interface ParallaxContextProps {
  smoothScrollY: MotionValue<number>;
  smoothMouseX: MotionValue<number>;
  smoothMouseY: MotionValue<number>;
}

const ParallaxContext = createContext<ParallaxContextProps | null>(null);

export const useParallax = () => {
  const ctx = useContext(ParallaxContext);
  if (!ctx) {
    throw new Error('useParallax must be used inside a ParallaxWrapper');
  }
  return ctx;
};

interface ParallaxWrapperProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export function ParallaxWrapper({
  children,
  className = '',
  intensity = 'medium'
}: ParallaxWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Base motion values
  const scrollY = useMotionValue(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out values using spring physics for realistic weight and momentum
  const smoothScrollY = useSpring(scrollY, { damping: 20, stiffness: 70 });
  const smoothMouseX = useSpring(mouseX, { damping: 30, stiffness: 100 });
  const smoothMouseY = useSpring(mouseY, { damping: 30, stiffness: 100 });

  useEffect(() => {
    // 1. Locate the closest scrollable container (usually the main element)
    const currentEl = containerRef.current;
    if (!currentEl) return;

    const scrollContainer = currentEl.closest('.overflow-y-auto') || currentEl.parentElement;
    if (!scrollContainer) return;

    const handleScroll = () => {
      scrollY.set(scrollContainer.scrollTop);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    // Initialize
    scrollY.set(scrollContainer.scrollTop);

    // 2. Track screen mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Normalized between -0.5 and 0.5
      mouseX.set((e.clientX / innerWidth) - 0.5);
      mouseY.set((e.clientY / innerHeight) - 0.5);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Intensity multipliers
  const m = intensity === 'low' ? 0.4 : intensity === 'high' ? 1.6 : 1.0;

  // Background Grid scroll-parallax
  // The grid moves slightly slower than content, giving an illusion of deep background distance
  const gridY = useTransform(smoothScrollY, y => -y * 0.12 * m);

  // Decorative floating ambient orbs - shift based on BOTH scroll and cursor location
  const orb1TranslateX = useTransform(smoothMouseX, x => x * -100 * m);
  const orb1TranslateY = useTransform(
    [smoothMouseY, smoothScrollY],
    ([yVal, scrollVal]) => (yVal as number) * -100 * m + (scrollVal as number) * 0.25 * m
  );

  const orb2TranslateX = useTransform(smoothMouseX, x => x * 120 * m);
  const orb2TranslateY = useTransform(
    [smoothMouseY, smoothScrollY],
    ([yVal, scrollVal]) => (yVal as number) * 80 * m + (scrollVal as number) * 0.15 * m
  );

  const orb3TranslateX = useTransform(smoothMouseX, x => x * -60 * m);
  const orb3TranslateY = useTransform(
    [smoothMouseY, smoothScrollY],
    ([yVal, scrollVal]) => (yVal as number) * 120 * m + (scrollVal as number) * 0.35 * m
  );

  return (
    <ParallaxContext.Provider value={{ smoothScrollY, smoothMouseX, smoothMouseY }}>
      <div 
        ref={containerRef} 
        className={`relative w-full h-full min-h-[inherit] overflow-hidden ${className}`}
      >
        {/* PARALLAX BACKGROUND GRID */}
        <motion.div 
          style={{ y: gridY }}
          className="absolute inset-0 select-none pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        >
          {/* Subtle geometric dot grid pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1.5px,transparent_1.5px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
        </motion.div>

        {/* PARALLAX GLOW ORBS */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
          {/* Violet Orb (Top Right) */}
          <motion.div
            style={{ x: orb1TranslateX, y: orb1TranslateY }}
            className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-violet-400/15 dark:bg-violet-500/10 blur-[100px] md:blur-[130px] transition-colors duration-500"
          />

          {/* Indigo/Emerald Orb (Bottom Left) */}
          <motion.div
            style={{ x: orb2TranslateX, y: orb2TranslateY }}
            className="absolute bottom-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-400/10 dark:bg-emerald-500/5 blur-[120px] md:blur-[150px] transition-colors duration-500"
          />

          {/* Rose/Pink Orb (Middle Right) */}
          <motion.div
            style={{ x: orb3TranslateX, y: orb3TranslateY }}
            className="absolute top-[35%] right-[-15%] w-[35vw] h-[35vw] rounded-full bg-rose-400/10 dark:bg-rose-500/5 blur-[90px] md:blur-[120px] transition-colors duration-500"
          />
        </div>

        {/* FOREGROUND CONTENT */}
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </div>
    </ParallaxContext.Provider>
  );
}

/**
 * Interactive 3D tilt card that rotates subtly on hover to follow the cursor.
 * Features a gliding ambient reflection glare layer.
 */
interface ParallaxCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  tiltRange?: number;
  glareIntensity?: number;
  perspective?: number;
  scaleOnHover?: number;
  className?: string;
}

export function ParallaxCard({
  children,
  tiltRange = 8,
  glareIntensity = 0.25,
  perspective = 1000,
  scaleOnHover = 1.02,
  className = '',
  ...props
}: ParallaxCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Local cursor states for tilt calculations
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    
    // Normalized position within card bounds (from -0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Calculate rotation angles (tilt range multiplier)
    setRotateX(-y * tiltRange); // vertical coordinate controls horizontal axis rotation
    setRotateY(x * tiltRange);  // horizontal coordinate controls vertical axis rotation

    // Calculate position for reflection glare (0% to 100%)
    setGlareX((x + 0.5) * 100);
    setGlareY((y + 0.5) * 100);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlareX(50);
    setGlareY(50);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-all duration-300 ease-out select-none ${className}`}
      style={{
        perspective: `${perspective}px`,
        transform: isHovered 
          ? `scale(${scaleOnHover}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` 
          : 'scale(1) rotateX(0deg) rotateY(0deg)',
        transformStyle: 'preserve-3d',
      }}
      {...props}
    >
      {/* Glare/Shine Effect Overlay */}
      {glareIntensity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] z-50 overflow-hidden mix-blend-overlay transition-opacity duration-300"
          style={{
            opacity: isHovered ? glareIntensity : 0,
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 65%)`
          }}
        />
      )}

      {/* Child elements rendered in 3D space */}
      <div style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Inline text or asset element that drifts at a custom scroll speed
 * relative to the page container.
 */
interface ParallaxElementProps {
  children: React.ReactNode;
  speed?: number; // positive = faster than scroll, negative = slower than scroll
  className?: string;
}

export function ParallaxElement({
  children,
  speed = 0.2,
  className = ''
}: ParallaxElementProps) {
  const { smoothScrollY } = useParallax();
  
  // Drive the element's offset directly from scroll position
  const y = useTransform(smoothScrollY, (s: number) => s * speed);

  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
