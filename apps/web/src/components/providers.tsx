'use client';

import type { ReactNode } from 'react';
import { ServicesProvider } from '@/lib/services-context';
import { ThemeProvider } from '@/lib/theme';
import { QueryProvider } from '@/lib/query';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <ServicesProvider>{children}</ServicesProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
