import { Manrope, Geist_Mono } from 'next/font/google';

/** Interface font — Manrope Variable (brandbook). Exposed as `--font-sans`. */
export const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

/** Mono font — Geist Mono (timestamps, JSON, system labels, export preview). */
export const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});
