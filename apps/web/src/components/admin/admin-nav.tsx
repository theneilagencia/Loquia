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
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors',
              active
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
