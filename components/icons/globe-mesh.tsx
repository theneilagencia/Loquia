'use client';

import { motion } from 'framer-motion';

interface GlobeMeshIconProps {
  className?: string;
  animate?: boolean;
}

export function GlobeMeshIcon({ className = '', animate = true }: GlobeMeshIconProps) {
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.1, duration: 1.5, ease: "easeInOut" as any },
        opacity: { delay: i * 0.1, duration: 0.3 }
      }
    })
  };

  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.5,
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1] as any
      }
    }
  };

  const PathComponent = animate ? motion.path : 'path';
  const CircleComponent = animate ? motion.circle : 'circle';

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width="100%"
      height="100%"
    >
      {/* Outer Circle */}
      <CircleComponent
        cx="32"
        cy="32"
        r="28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        variants={animate ? circleVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      
      {/* Vertical Lines (Longitude) */}
      <PathComponent
        d="M 32 4 Q 20 32 32 60"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
        custom={0}
        variants={animate ? pathVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <PathComponent
        d="M 32 4 Q 44 32 32 60"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
        custom={1}
        variants={animate ? pathVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      
      {/* Horizontal Lines (Latitude) */}
      <PathComponent
        d="M 8 32 Q 32 28 56 32"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
        custom={2}
        variants={animate ? pathVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <PathComponent
        d="M 12 20 Q 32 18 52 20"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
        custom={3}
        variants={animate ? pathVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <PathComponent
        d="M 12 44 Q 32 46 52 44"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
        custom={4}
        variants={animate ? pathVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      
      {/* Center Dot */}
      <CircleComponent
        cx="32"
        cy="32"
        r="2"
        fill="currentColor"
        opacity="0.6"
        variants={animate ? circleVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      
      {/* Connection Points */}
      <CircleComponent cx="32" cy="4" r="1.5" fill="currentColor" opacity="0.5" />
      <CircleComponent cx="32" cy="60" r="1.5" fill="currentColor" opacity="0.5" />
      <CircleComponent cx="8" cy="32" r="1.5" fill="currentColor" opacity="0.5" />
      <CircleComponent cx="56" cy="32" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
