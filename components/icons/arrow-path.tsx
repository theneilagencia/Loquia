'use client';

import { motion } from 'framer-motion';

interface ArrowPathIconProps {
  className?: string;
  animate?: boolean;
  direction?: 'right' | 'left' | 'up' | 'down';
}

export function ArrowPathIcon({ 
  className = '', 
  animate = true,
  direction = 'right' 
}: ArrowPathIconProps) {
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.8, ease: "easeInOut" as any },
        opacity: { duration: 0.3 }
      }
    }
  };

  const arrowVariants = {
    rest: { x: 0 },
    hover: {
      x: direction === 'right' ? 4 : direction === 'left' ? -4 : 0,
      y: direction === 'down' ? 4 : direction === 'up' ? -4 : 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as any
      }
    }
  };

  const rotations = {
    right: 0,
    down: 90,
    left: 180,
    up: 270
  };

  const PathComponent = animate ? motion.path : 'path';
  const GComponent = animate ? motion.g : 'g';

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="rest"
      whileHover="hover"
      style={{ transformOrigin: 'center' }}
    >
      <GComponent
        variants={animate ? arrowVariants : undefined}
        style={{ 
          transform: `rotate(${rotations[direction]}deg)`,
          transformOrigin: 'center'
        }}
      >
        {/* Arrow Line */}
        <PathComponent
          d="M 4 12 L 20 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          variants={animate ? pathVariants : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
        
        {/* Arrow Head */}
        <PathComponent
          d="M 14 6 L 20 12 L 14 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={animate ? pathVariants : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate ? "visible" : undefined}
        />
      </GComponent>
    </motion.svg>
  );
}
