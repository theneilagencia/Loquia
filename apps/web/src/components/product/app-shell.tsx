'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  LogOut,
  Mic,
  Search,
  Settings,
  Upload,
  Video,
} from 'lucide-react';
import type { Session } from '@loquia/domain';
import { cn } from '@loquia/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { useServices } from '@/lib/services-context';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';
import { MiniRecorder } from './mini-recorder';
import { CommandPalette } from './command-palette';

const NAV = [
  { href: '/app', labelKey: 'home', icon: Home, exact: true },
  { href: '/app/meetings', labelKey: 'meetings', icon: Video },
  { href: '/app/record', labelKey: 'record', icon: Mic },
  { href: '/app/upload', labelKey: 'upload', icon: Upload },
  { href: '/app/settings', labelKey: 'settings', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  const services = useServices();
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    services.auth.getSession().then(setSession);
  }, [services]);

  function isActive(href: string, exact?: boolean) {
    const path = pathname.replace(/^\/[a-z]{2}-[A-Z]{2}/, '');
    return exact ? path === href : path.startsWith(href);
  }

  async function logout() {
    await services.auth.logout();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar on inverse-surface (decisions §21 / design-tokens). */}
      <aside className="hidden w-60 shrink-0 flex-col bg-inverse-surface p-4 text-inverse-fg md:flex">
        <Link href="/app" className="mb-6 px-2 text-inverse-fg">
          <Logo />
        </Link>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive(item.href, item.exact)
                  ? 'bg-white/10 font-medium text-inverse-fg'
                  : 'text-inverse-fg/70 hover:bg-white/5 hover:text-inverse-fg',
              )}
            >
              <item.icon className="size-4" /> {t(item.labelKey)}
            </Link>
          ))}
          {session?.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive('/admin')
                  ? 'bg-white/10 font-medium text-inverse-fg'
                  : 'text-inverse-fg/70 hover:bg-white/5 hover:text-inverse-fg',
              )}
            >
              <LayoutDashboard className="size-4" /> {t('admin')}
            </Link>
          )}
        </nav>
        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
          </div>
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="grid size-10 place-items-center rounded-md text-inverse-fg/70 transition-colors hover:bg-white/5 hover:text-inverse-fg"
              aria-label={t('logout')}
            >
              <LogOut className="size-4" />
            </button>
          </div>
          {session && (
            <p className="truncate px-1 text-xs text-inverse-fg/60">{session.user.email}</p>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 md:hidden">
          <Link href="/app">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <div className="mx-auto hidden w-full max-w-5xl items-center gap-2 px-6 pt-4 text-xs text-muted-foreground md:flex">
          <Search className="size-3.5" />
          <span>⌘K / Ctrl+K — {t('home')}</span>
        </div>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>

      <MiniRecorder />
      <CommandPalette />
    </div>
  );
}
