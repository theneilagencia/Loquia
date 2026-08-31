'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { cn } from '@loquia/ui';
import { Link } from '@/i18n/navigation';

const ITEMS = [
  { href: '/admin', key: 'overview', exact: true },
  { href: '/admin/access-requests', key: 'accessRequests' },
  { href: '/admin/users', key: 'users' },
  { href: '/admin/workspaces', key: 'workspaces' },
  { href: '/admin/invitations', key: 'invitations' },
  { href: '/admin/audit', key: 'audit' },
];

export function AdminNav() {
  const t = useTranslations('admin');
  const pathname = usePathname().replace(/^\/[a-z]{2}-[A-Z]{2}/, '');
  return (
    <nav className="flex w-fit max-w-full flex-wrap gap-0.5 overflow-x-auto rounded-lg border border-border bg-surface p-[3px] shadow-card">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'whitespace-nowrap rounded-md px-3.5 py-[7px] text-[12.5px] font-semibold transition-colors',
              active
                ? 'bg-ink text-canvas'
                : 'text-muted-foreground hover:bg-canvas hover:text-ink',
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
