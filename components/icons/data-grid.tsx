'use client';

import { motion } from 'framer-motion';

interface DataGridIconProps {
  className?: string;
  animate?: boolean;
}

export function DataGridIcon({ className = '', animate = true }: DataGridIconProps) {
  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.08, duration: 0.8, ease: "easeInOut" as any },
        opacity: { delay: i * 0.08, duration: 0.2 }
      }
    })
  };

  const dotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.5 + i * 0.05,
        duration: 0.4,
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
      {/* Horizontal Lines */}
      {[12, 22, 32, 42, 52].map((y, i) => (
        <PathComponent
          key={`h-${y}`}
          d={`M 12 ${y} L 52 ${y}`}
          stroke="currentColor"
          strokeWidth="0.5"
          strokeOpacity="0.3"
          custom={i}
          variants={animate ? lineVariants : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
      ))}
      
      {/* Vertical Lines */}
      {[12, 22, 32, 42, 52].map((x, i) => (
        <PathComponent
          key={`v-${x}`}
          d={`M ${x} 12 L ${x} 52`}
          stroke="currentColor"
          strokeWidth="0.5"
          strokeOpacity="0.3"
          custom={i + 5}
          variants={animate ? lineVariants : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
      ))}
      
      {/* Intersection Dots */}
      {[12, 22, 32, 42, 52].map((y, yi) =>
        [12, 22, 32, 42, 52].map((x, xi) => (
          <CircleComponent
            key={`dot-${x}-${y}`}
            cx={x}
            cy={y}
            r="1"
            fill="currentColor"
            opacity="0.4"
            custom={yi * 5 + xi}
            variants={animate ? dotVariants : undefined}
            initial={animate ? "hidden" : undefined}
            animate={animate ? "visible" : undefined}
          />
        ))
      )}
      
      {/* Highlight Dots */}
      <CircleComponent
        cx="32"
        cy="32"
        r="2"
        fill="currentColor"
        opacity="0.8"
        custom={0}
        variants={animate ? dotVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <CircleComponent
        cx="22"
        cy="22"
        r="1.5"
        fill="currentColor"
        opacity="0.6"
        custom={1}
        variants={animate ? dotVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <CircleComponent
        cx="42"
        cy="42"
        r="1.5"
        fill="currentColor"
        opacity="0.6"
        custom={2}
        variants={animate ? dotVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
    </svg>
  );
}
