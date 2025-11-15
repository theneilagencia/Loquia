'use client';

import { motion } from 'framer-motion';

interface CrystalPrismIconProps {
  className?: string;
  animate?: boolean;
}

export function CrystalPrismIcon({ className = '', animate = true }: CrystalPrismIconProps) {
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.12, duration: 1.3, ease: "easeInOut" as any },
        opacity: { delay: i * 0.12, duration: 0.3 }
      }
    })
  };

  const polygonVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.6,
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1] as any
      }
    }
  };

  const PathComponent = animate ? motion.path : 'path';
  const PolygonComponent = animate ? motion.polygon : 'polygon';

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Diamond */}
      <PolygonComponent
        points="32,8 52,32 32,56 12,32"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        fill="none"
        variants={animate ? polygonVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      
      {/* Inner Diamond */}
      <PolygonComponent
        points="32,18 42,32 32,46 22,32"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.5"
        fill="none"
        variants={animate ? polygonVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      
      {/* Vertical Center Line */}
      <PathComponent
        d="M 32 8 L 32 56"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
        custom={0}
        variants={animate ? pathVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      
      {/* Horizontal Center Line */}
      <PathComponent
        d="M 12 32 L 52 32"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
        custom={1}
        variants={animate ? pathVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      
      {/* Diagonal Lines */}
      <PathComponent
        d="M 32 8 L 52 32"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeOpacity="0.2"
        custom={2}
        variants={animate ? pathVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <PathComponent
        d="M 52 32 L 32 56"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeOpacity="0.2"
        custom={3}
        variants={animate ? pathVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <PathComponent
        d="M 32 56 L 12 32"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeOpacity="0.2"
        custom={4}
        variants={animate ? pathVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      <PathComponent
        d="M 12 32 L 32 8"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeOpacity="0.2"
        custom={5}
        variants={animate ? pathVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
      />
      
      {/* Center Point */}
      <motion.circle
        cx="32"
        cy="32"
        r="2.5"
        fill="currentColor"
        opacity="0.7"
        initial={animate ? { scale: 0 } : undefined}
        animate={animate ? { scale: 1 } : undefined}
        transition={animate ? { delay: 0.8, duration: 0.5 } : undefined}
      />
      
      {/* Corner Points */}
      <circle cx="32" cy="8" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="52" cy="32" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="32" cy="56" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="12" cy="32" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
