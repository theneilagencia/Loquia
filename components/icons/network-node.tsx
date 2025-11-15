'use client';

import { motion } from 'framer-motion';

interface NetworkNodeIconProps {
  className?: string;
  animate?: boolean;
}

export function NetworkNodeIcon({ className = '', animate = true }: NetworkNodeIconProps) {
  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.1, duration: 1, ease: "easeInOut" as any },
        opacity: { delay: i * 0.1, duration: 0.3 }
      }
    })
  };

  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.3 + i * 0.1,
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1] as any
      }
    })
  };

  const PathComponent = animate ? motion.path : 'path';
  const CircleComponent = animate ? motion.circle : 'circle';

  return (
    <svg width="100%" height="100%"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Connection Lines */}
      <PathComponent
        d="M 32 32 L 32 12"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
        custom={0}
        variants={animate ? lineVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <PathComponent
        d="M 32 32 L 52 20"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
        custom={1}
        variants={animate ? lineVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <PathComponent
        d="M 32 32 L 52 44"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
        custom={2}
        variants={animate ? lineVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <PathComponent
        d="M 32 32 L 32 52"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
        custom={3}
        variants={animate ? lineVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <PathComponent
        d="M 32 32 L 12 44"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
        custom={4}
        variants={animate ? lineVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <PathComponent
        d="M 32 32 L 12 20"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
        custom={5}
        variants={animate ? lineVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      
      {/* Outer Nodes */}
      <CircleComponent
        cx="32"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
        custom={0}
        variants={animate ? circleVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <CircleComponent
        cx="52"
        cy="20"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
        custom={1}
        variants={animate ? circleVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <CircleComponent
        cx="52"
        cy="44"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
        custom={2}
        variants={animate ? circleVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <CircleComponent
        cx="32"
        cy="52"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
        custom={3}
        variants={animate ? circleVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <CircleComponent
        cx="12"
        cy="44"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
        custom={4}
        variants={animate ? circleVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <CircleComponent
        cx="12"
        cy="20"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
        custom={5}
        variants={animate ? circleVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      
      {/* Center Node */}
      <CircleComponent
        cx="32"
        cy="32"
        r="5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
        custom={6}
        variants={animate ? circleVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <CircleComponent
        cx="32"
        cy="32"
        r="2"
        fill="currentColor"
        opacity="0.8"
        custom={7}
        variants={animate ? circleVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
    </svg>
  );
}
