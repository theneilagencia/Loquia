'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Input, Skeleton } from '@loquia/ui';
import { Check, Copy, Eye, EyeOff, RefreshCw, Trash2 } from 'lucide-react';
import { useServices } from '@/lib/services-context';

/** Strong, human-typable provisional password (no ambiguous characters). */
function genPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  const arr = new Uint32Array(length);
  (globalThis.crypto ?? crypto).getRandomValues(arr);
  for (let i = 0; i < length; i += 1) out += chars[arr[i]! % chars.length];
  return out;
}

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const services = useServices();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => services.admin.listUsers(),
  });

  // Create-user form state.
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [password, setPassword] = useState(() => genPassword());
  const [showPw, setShowPw] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string; link: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    services.auth.getSession().then((s) => setMeId(s?.user.id ?? null)).catch(() => {});
  }, [services]);

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    } catch {
      /* clipboard blocked — the field is selectable as a fallback */
    }
  }

  async function act(fn: () => Promise<unknown>) {
    await fn();
    refetch();
  }
  async function actor() {
    return (await services.auth.getSession())?.user.id ?? 'u1';
  }

  async function onDelete(id: string, email: string) {
    setRowError(null);
    if (!window.confirm(t('userActions.confirmDelete', { email }))) return;
    const result = await services.admin.deleteUser(id, await actor());
    if (!result.ok) {
      setRowError(t('userActions.deleteError'));
      return;
    }
    refetch();
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('createUser.emailInvalid'));
      return;
    }
    setSubmitting(true);
    const actor = (await services.auth.getSession())?.user.id ?? 'u1';
    const result = await services.admin.createUser(actor, { email, name: name || undefined, role, password });
    setSubmitting(false);
    if (!result.ok) {
      setError(t('createUser.error'));
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/${locale}/activate-account/${result.value.inviteToken}`;
    setCreated({ email, password: result.value.provisionalPassword, link });
    setEmail('');
    setName('');
    setRole('member');
    setPassword(genPassword());
    refetch();
  }

  function CopyButton({ id, value }: { id: string; value: string }) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => void copy(id, value)}>
        {copied === id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        <span className="ml-1.5">{copied === id ? t('createUser.copied') : t('createUser.copy')}</span>
      </Button>
    );
  }

  return (
    <div>
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Loquia · Admin</div>
      <h1 className="mb-6 text-[clamp(23px,2.5vw,30px)] font-bold tracking-[-0.03em] text-ink">{t('users')}</h1>

      {/* Create user */}
      <div className="mb-4 rounded-xl border border-border bg-surface p-6 shadow-card">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">{t('createUser.title')}</h2>
        <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1 space-y-1.5">
            <label className="text-sm font-medium text-ink">{t('createUser.email')}</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@company.com" />
          </div>
          <div className="min-w-40 flex-1 space-y-1.5">
            <label className="text-sm font-medium text-ink">{t('createUser.name')}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Souza" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">{t('createUser.role')}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="member">{t('roles.member')}</option>
              <option value="admin">{t('roles.admin')}</option>
            </select>
          </div>
          <div className="min-w-52 flex-1 space-y-1.5">
            <label className="text-sm font-medium text-ink">{t('createUser.password')}</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? t('createUser.hide') : t('createUser.show')}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-faint hover:text-ink"
                >
                  {showPw ? <EyeOff className="size-[17px]" /> : <Eye className="size-[17px]" />}
                </button>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => setPassword(genPassword())} aria-label={t('createUser.generate')}>
                <RefreshCw className="size-3.5" />
                <span className="ml-1.5 hidden sm:inline">{t('createUser.generate')}</span>
              </Button>
            </div>
          </div>
          <Button type="submit" disabled={submitting}>{t('createUser.submit')}</Button>
        </form>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        {created && (
          <div className="mt-4 rounded-[10px] border border-success/40 bg-success-soft p-4">
            <p className="text-[13.5px] font-semibold text-ink">
              {t('createUser.created')} — <span className="font-normal text-muted-foreground">{created.email}</span>
            </p>
            <div className="mt-3 grid gap-3">
              <div>
                <div className="mb-1 text-[11.5px] font-mono uppercase tracking-[0.1em] text-muted-foreground">{t('createUser.provisionalPassword')}</div>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-canvas px-2.5 py-2 text-[13.5px] text-ink">{created.password}</code>
                  <CopyButton id="pw" value={created.password} />
                </div>
              </div>
              <div>
                <div className="mb-1 text-[11.5px] font-mono uppercase tracking-[0.1em] text-muted-foreground">{t('createUser.inviteLink')}</div>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-canvas px-2.5 py-2 text-[13px] text-ink">{created.link}</code>
                  <CopyButton id="link" value={created.link} />
                </div>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">{t('createUser.hint')}</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          {(data ?? []).map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-3.5 transition-colors hover:bg-canvas">
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-semibold tracking-[-0.008em] text-ink">{u.name}</p>
                <p className="mt-1 truncate text-[12.5px] text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{t(`roles.${u.role}`)}</Badge>
                <Badge variant={u.status === 'active' ? 'success' : 'outline'}>{u.status}</Badge>
                {u.status === 'active' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void act(async () => services.admin.setUserStatus(u.id, 'suspended', await actor()))}
                  >
                    {t('userActions.suspend')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void act(async () => services.admin.setUserStatus(u.id, 'active', await actor()))}
                  >
                    {t('userActions.activate')}
                  </Button>
                )}
                {u.role === 'member' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void act(async () => services.admin.setUserRole(u.id, 'admin', await actor()))}
                  >
                    {t('userActions.makeAdmin')}
                  </Button>
                ) : (
                  u.role === 'admin' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void act(async () => services.admin.setUserRole(u.id, 'member', await actor()))}
                    >
                      {t('userActions.makeMember')}
                    </Button>
                  )
                )}
                {u.role !== 'owner' && u.id !== meId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t('userActions.delete')}
                    className="text-danger hover:bg-danger-soft hover:text-danger"
                    onClick={() => void onDelete(u.id, u.email)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {rowError && <p className="mt-3 text-sm text-danger">{rowError}</p>}
    </div>
  );
}
