/**
 * Shared Tailwind preset mapping the reconciled Loquia design tokens
 * (tokens.css) to Tailwind color utilities. Tokens are RGB channel triplets so
 * opacity modifiers (bg-iris/10) work. Both the friendly shadcn-style names and
 * the canonical handoff names (canvas/surface/ink/iris/sage/amber/danger) are
 * exposed.
 */
const c = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1200px' },
    },
    extend: {
      screens: {
        xs: '430px',
      },
      colors: {
        // Canonical handoff tokens
        canvas: c('canvas'),
        surface: c('surface'),
        track: c('track'),
        ink: { DEFAULT: c('ink'), hover: c('ink-hover') },
        faint: c('faint'),
        dim: c('dim'),
        disabled: c('disabled'),
        'border-strong': c('border-strong'),
        inverse: { surface: c('inverse-surface'), fg: c('inverse-fg') },
        iris: {
          DEFAULT: c('iris'),
          strong: c('iris-strong'),
          soft: c('iris-soft'),
          line: c('iris-line'),
          tint: c('iris-tint'),
        },
        sage: { DEFAULT: c('sage'), soft: c('sage-soft') },
        amber: { DEFAULT: c('amber'), soft: c('amber-soft'), ink: c('amber-ink') },
        danger: { DEFAULT: c('danger'), soft: c('danger-soft') },

        // shadcn-style semantic aliases (so existing component classes map to
        // the correct reconciled values without a global rename).
        border: c('border'),
        input: c('border'),
        ring: c('iris'),
        background: c('canvas'),
        foreground: c('ink'),
        primary: { DEFAULT: c('iris'), foreground: c('inverse-fg') },
        secondary: { DEFAULT: c('track'), foreground: c('ink') },
        muted: { DEFAULT: c('track'), foreground: c('muted') },
        accent: { DEFAULT: c('iris-soft'), foreground: c('iris-strong') },
        destructive: { DEFAULT: c('danger'), foreground: c('surface') },
        success: { DEFAULT: c('sage'), foreground: c('surface') },
        warning: { DEFAULT: c('amber'), foreground: c('surface') },
        card: { DEFAULT: c('surface'), foreground: c('ink') },
        popover: { DEFAULT: c('surface'), foreground: c('ink') },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 6px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--ink) / 0.04), 0 8px 24px -18px rgb(var(--ink) / 0.24)',
        elevate: '0 20px 40px -28px rgb(var(--ink) / 0.34)',
        modal: '0 40px 90px -40px rgb(var(--ink) / 0.6)',
      },
      keyframes: {
        'loq-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'loq-rise': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'loq-pulse': {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'loq-in': 'loq-in 0.18s cubic-bezier(.2,.7,.3,1)',
        'loq-rise': 'loq-rise 0.28s cubic-bezier(.2,.7,.3,1)',
        'loq-pulse': 'loq-pulse 1s ease-in-out infinite',
        // Back-compat aliases used by existing components.
        'fade-in': 'loq-in 0.18s cubic-bezier(.2,.7,.3,1)',
        pulsebar: 'loq-pulse 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
