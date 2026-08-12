import { cn } from '@loquia/ui';

/**
 * Loquia convergence mark (brandbook): three dispersed signals on the left
 * resolving into a single direction on the right, ending in a solid dot.
 * Signals in Iris with decreasing opacity (100/55/30%); final vector and dot
 * in Ink. Never a microphone, speech balloon, brain, robot, sparkle, etc.
 */
export function LogoSymbol({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 24"
      className={cn('h-6 w-8', className)}
      fill="none"
      role="img"
      aria-label="Loquia"
    >
      <g stroke="rgb(var(--iris))" strokeWidth="2.4" strokeLinecap="round">
        <path d="M3 5 L17 12" opacity="1" />
        <path d="M3 12 L17 12" opacity="0.55" />
        <path d="M3 19 L17 12" opacity="0.3" />
      </g>
      {/* Ink parts follow the surrounding text colour so the mark reads on both
          light surfaces and the inverse-surface sidebar. */}
      <path d="M17 12 L25 12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="27.5" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold', className)}>
      <LogoSymbol className="h-6 w-8 shrink-0" />
      <span className="text-lg tracking-[-0.02em]">Loquia</span>
    </span>
  );
}
