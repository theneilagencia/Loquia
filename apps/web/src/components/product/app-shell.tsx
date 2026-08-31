'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Home, LogOut, Mic, Search, Settings, Video } from 'lucide-react';
import type { Session } from '@loquia/domain';
import { cn } from '@loquia/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { useServices } from '@/lib/services-context';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LocaleSwitcher } from '@/components/ui/locale-switcher';
import { MiniRecorder } from './mini-recorder';
import { CommandPalette } from './command-palette';

// Sidebar navigation — labels only, mirroring the dark rail in the design.
const NAV = [
  { href: '/app', labelKey: 'home', exact: true },
  { href: '/app/meetings', labelKey: 'meetings' },
  { href: '/app/upload', labelKey: 'upload' },
  { href: '/app/settings', labelKey: 'settings' },
];

// Compact bottom tab bar shown below the md breakpoint.
const MOBILE_TABS = [
  { href: '/app', labelKey: 'home', icon: Home, exact: true },
  { href: '/app/meetings', labelKey: 'meetings', icon: Video },
  { href: '/app/record', labelKey: 'record', icon: Mic },
  { href: '/app/settings', labelKey: 'settings', icon: Settings },
];

/** Open the command palette by replaying its ⌘K shortcut (no new state wiring). */
function openPalette() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
}

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  const common = useTranslations('common');
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

  const initials = session?.user.name
    ? session.user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '—';

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Persistent dark rail (design §21). */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-5 bg-inverse-surface p-4 text-inverse-fg md:flex">
        <Link href="/app" className="flex items-center gap-2 px-2 py-1.5 text-inverse-fg">
          <Logo />
        </Link>

        <Link
          href="/app/record"
          className="flex items-center gap-2.5 rounded-[10px] bg-iris px-3.5 py-3 text-sm font-semibold text-white transition-colors hover:bg-iris/90"
        >
          <span className="size-2 rounded-full bg-white" />
          {t('record')}
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between rounded-[9px] px-3 py-2.5 text-sm transition-colors',
                isActive(item.href, item.exact)
                  ? 'bg-white/10 font-medium text-inverse-fg'
                  : 'font-medium text-inverse-fg/65 hover:bg-white/5 hover:text-inverse-fg',
              )}
            >
              <span>{t(item.labelKey)}</span>
            </Link>
          ))}
          {session?.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center justify-between rounded-[9px] px-3 py-2.5 text-sm transition-colors',
                isActive('/admin')
                  ? 'bg-white/10 font-medium text-inverse-fg'
                  : 'font-medium text-inverse-fg/65 hover:bg-white/5 hover:text-inverse-fg',
              )}
            >
              <span>{t('admin')}</span>
            </Link>
          )}
        </nav>

        <div className="flex-1" />

        {/* Persistent mini-recorder lives in the rail (design). */}
        <MiniRecorder />

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between gap-2">
            <LocaleSwitcher />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                type="button"
                onClick={logout}
                className="grid size-9 place-items-center rounded-md text-inverse-fg/65 transition-colors hover:bg-white/5 hover:text-inverse-fg"
                aria-label={t('logout')}
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
          {session && (
            <div className="flex items-center gap-2.5 px-1">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-iris text-[11px] font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-inverse-fg">
                  {session.user.name}
                </p>
                <p className="truncate text-[11.5px] text-inverse-fg/45">
                  {session.workspace.name}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile dark bar. */}
        <div className="sticky top-0 z-40 flex items-center gap-3 bg-inverse-surface px-4 py-3 text-inverse-fg md:hidden">
          <Link href="/app" className="flex items-center gap-2 text-inverse-fg">
            <Logo />
          </Link>
          <span className="flex-1" />
          <LocaleSwitcher />
          <ThemeToggle />
        </div>

        {/* Content topbar: search + settings + admin. */}
        <header className="top-0 z-30 flex flex-wrap items-center gap-3 border-b border-border bg-canvas/85 px-[clamp(20px,2.6vw,36px)] py-3 backdrop-blur-[14px] md:sticky">
          <button
            type="button"
            onClick={openPalette}
            className="flex min-w-0 max-w-[420px] flex-1 items-center gap-2.5 rounded-[10px] border border-border bg-surface px-3.5 py-2.5 text-left text-sm text-faint transition-colors hover:border-border-strong"
          >
            <Search className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{common('search')}</span>
            <span className="rounded-[5px] border border-border px-1.5 py-0.5 font-mono text-[11px]">
              ⌘K
            </span>
          </button>
          <span className="flex-1" />
          <Link
            href="/app/settings"
            className="rounded-lg border border-border bg-surface px-3.5 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            {t('settings')}
          </Link>
          {session?.isAdmin && (
            <Link
              href="/admin"
              className="rounded-lg border border-border-strong bg-surface px-3.5 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-canvas"
            >
              {t('admin')}
            </Link>
          )}
        </header>

        <main className="w-full max-w-[1240px] px-[clamp(20px,2.6vw,36px)] pb-24 pt-6 md:pb-12 md:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar. */}
      <nav
        aria-label={t('product')}
        className="fixed inset-x-0 bottom-0 z-[60] grid grid-cols-4 border-t border-border bg-canvas/90 px-1 pb-2 pt-1.5 backdrop-blur-[14px] md:hidden"
      >
        {MOBILE_TABS.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-[52px] flex-col items-center justify-center gap-1 text-[11px] transition-colors',
                active ? 'font-semibold text-iris' : 'text-muted-foreground',
              )}
            >
              <tab.icon className="size-5" />
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </nav>

      <CommandPalette />
    </div>
  );
}
