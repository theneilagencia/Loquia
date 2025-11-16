'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface LocaleLinkProps {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}

export function LocaleLink({ href, className, style, children }: LocaleLinkProps) {
  const pathname = usePathname();
  
  // Extrair locale da URL atual (ex: /pt/pricing -> pt)
  const locale = pathname?.split('/')[1] || 'pt';
  
  // Se o href já começa com /, adiciona o locale
  // Se não, usa como está
  const finalHref = href.startsWith('/') ? `/${locale}${href}` : href;

  return (
    <Link href={finalHref} className={className} style={style}>
      {children}
    </Link>
  );
}
