'use client';

import { motion } from 'framer-motion';

interface PrecisionGearIconProps {
  className?: string;
  animate?: boolean;
}

export function PrecisionGearIcon({ className = '', animate = true }: PrecisionGearIconProps) {
  const rotateVariants = {
    hidden: { rotate: 0, opacity: 0 },
    visible: {
      rotate: 360,
      opacity: 1,
      transition: {
        rotate: { duration: 20, ease: "linear" as any, repeat: Infinity },
        opacity: { duration: 0.5 }
      }
    }
  };

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.15, duration: 1.2, ease: "easeInOut" as any },
        opacity: { delay: i * 0.15, duration: 0.3 }
      }
    })
  };

  const GComponent = animate ? motion.g : 'g';
  const PathComponent = animate ? motion.path : 'path';
  const CircleComponent = animate ? motion.circle : 'circle';

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <GComponent
        variants={animate ? rotateVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
        style={{ transformOrigin: '32px 32px' }}
      >
        {/* Outer Hexagon */}
        <PathComponent
          d="M 32 8 L 48 18 L 48 38 L 32 48 L 16 38 L 16 18 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.4"
          custom={0}
          variants={animate ? pathVariants : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
        
        {/* Inner Hexagon */}
        <PathComponent
          d="M 32 16 L 42 22 L 42 34 L 32 40 L 22 34 L 22 22 Z"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.5"
          custom={1}
          variants={animate ? pathVariants : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
        
        {/* Connecting Lines */}
        <PathComponent d="M 32 8 L 32 16" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" custom={2} />
        <PathComponent d="M 48 18 L 42 22" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" custom={3} />
        <PathComponent d="M 48 38 L 42 34" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" custom={4} />
        <PathComponent d="M 32 48 L 32 40" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" custom={5} />
        <PathComponent d="M 16 38 L 22 34" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" custom={6} />
        <PathComponent d="M 16 18 L 22 22" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" custom={7} />
      </GComponent>
      
      {/* Center Circle */}
      <CircleComponent
        cx="32"
        cy="32"
        r="6"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      
      {/* Center Dot */}
      <CircleComponent
        cx="32"
        cy="32"
        r="2"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  );
}
