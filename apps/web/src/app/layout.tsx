import type { ReactNode } from 'react';
import './globals.css';

/**
 * Root layout is intentionally minimal — the <html>/<body> live in
 * [locale]/layout.tsx so the `lang` attribute reflects the active locale
 * (standard next-intl App Router pattern).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
