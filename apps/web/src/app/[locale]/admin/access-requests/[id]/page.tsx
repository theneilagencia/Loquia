'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Badge, Button, Card, CardContent, Skeleton, Textarea } from '@loquia/ui';
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
    <div className="space-y-6">
      <Link
        href="/admin/access-requests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {t('detail')}
      </Link>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold">{request.name}</h1>
              <p className="text-sm text-muted-foreground">{request.email}</p>
            </div>
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

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Empresa" value={request.company} />
            <Field label="Cargo" value={request.role} />
            <Field label="Idioma" value={request.preferredLocale} />
            <Field label="Criada" value={formatDate(request.createdAt, locale)} />
          </dl>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Use case</p>
            <p className="mt-1 text-sm">{request.useCase}</p>
          </div>

          {request.rejectionReason && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {request.rejectionReason}
            </p>
          )}

          {message && (
            <p role="status" className="rounded-md bg-success/10 p-3 text-sm text-success">
              {message}
            </p>
          )}

          {pending && (
            <div className="space-y-3 border-t border-border pt-4">
              {rejecting ? (
                <div className="space-y-2">
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
              ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
