import { cn } from '@loquia/ui';

/** Loquia wordmark. Reconstructed brand mark (brandbook handoff was absent). */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold', className)}>
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 6c0-1.1.9-2 2-2h9a5 5 0 0 1 0 10H9l-4 4V6Z"
            fill="currentColor"
            opacity="0.9"
          />
        </svg>
      </span>
      <span className="text-lg tracking-tight">Loquia</span>
    </span>
  );
}
