'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Badge, Button, Skeleton, Textarea } from '@loquia/ui';
import { useServices } from '@/lib/services-context';
import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';

export default function AccessRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('admin.request');
  const locale = useLocale();
  const services = useServices();
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const { data: request, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'access-request', id],
    queryFn: () => services.admin.getAccessRequest(id),
  });

  async function approve() {
    const session = await services.auth.getSession();
    if (!session) return;
    const result = await services.admin.approveAccessRequest(id, session.user.id);
    if (result.ok) {
      setMessage(t('approved'));
      refetch();
    }
  }

  async function reject() {
    const session = await services.auth.getSession();
    if (!session) return;
    const result = await services.admin.rejectAccessRequest(id, session.user.id, { reason });
    if (result.ok) {
      setMessage(t('rejected'));
      setRejecting(false);
      refetch();
    }
  }

  if (isLoading) return <Skeleton className="h-64" />;
  if (!request) return <p className="text-muted-foreground">—</p>;

  const pending = request.status === 'pending';

  return (
    <div>
      <Link
        href="/admin/access-requests"
        className="mb-3.5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-iris hover:text-iris-strong"
      >
        <ArrowLeft className="size-3.5" /> {t('detail')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[clamp(23px,2.5vw,30px)] font-bold tracking-[-0.03em] text-ink">{request.name}</h1>
            <Badge
              variant={
                request.status === 'approved'
                  ? 'success'
                  : request.status === 'rejected'
                    ? 'destructive'
                    : 'warning'
              }
            >
              {request.status}
            </Badge>
          </div>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">{request.email}</p>
        </div>

        {pending && !rejecting && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void approve()}>
              <Check className="size-3.5" /> {t('approve')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRejecting(true)}>
              <X className="size-3.5" /> {t('reject')}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(120px,100%),1fr))] gap-px bg-border">
          <Field label="Empresa" value={request.company} />
          <Field label="Cargo" value={request.role} />
          <Field label="Idioma" value={request.preferredLocale} />
          <Field label="Criada" value={formatDate(request.createdAt, locale)} />
        </dl>

        <div className="border-t border-border px-[18px] py-3.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Use case</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">{request.useCase}</p>
        </div>

        {request.rejectionReason && (
          <div className="border-t border-border px-[18px] py-3.5">
            <p className="rounded-md bg-danger-soft p-3 text-sm text-danger">{request.rejectionReason}</p>
          </div>
        )}

        {message && (
          <div className="border-t border-border px-[18px] py-3.5">
            <p role="status" className="rounded-md bg-sage-soft p-3 text-sm text-sage">
              {message}
            </p>
          </div>
        )}

        {pending && rejecting && (
          <div className="space-y-2 border-t border-border px-[18px] py-3.5">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('rejectReason')}
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" disabled={reason.length < 3} onClick={() => void reject()}>
                <X className="size-3.5" /> {t('reject')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRejecting(false)}>
                —
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-[18px] py-3.5">
      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{label}</dt>
      <dd className="mt-1.5 text-[13.5px] font-semibold text-ink">{value}</dd>
    </div>
  );
}
