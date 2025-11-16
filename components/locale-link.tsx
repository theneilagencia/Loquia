'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ReactNode } from 'react';

interface LocaleLinkProps {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}

export function LocaleLink({ href, className, style, children }: LocaleLinkProps) {
  const locale = useLocale();
  
  // Se o href já começa com /, adiciona o locale
  // Se não, usa como está
  const finalHref = href.startsWith('/') ? `/${locale}${href}` : href;

  return (
    <Link href={finalHref} className={className} style={style}>
      {children}
    </Link>
  );
}
