'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { GlowCard } from '@/components/glow';
import { useUserRole } from '@/hooks/useUserRole';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  platform: string;
  status: string;
}

interface Approval {
  id: string;
  status: string;
  comments?: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
}

export default function ApprovalPage() {
  const t = useTranslations('approvals');
  const tCommon = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { isClient, loading: roleLoading } = useUserRole();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/campaigns/${params.id}`).then(r => r.json()),
      fetch(`/api/campaigns/${params.id}/approvals`).then(r => r.json()),
    ]).then(([campaignData, approvalsData]) => {
      setCampaign(campaignData);
      setApprovals(approvalsData);
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [params.id]);

  const handleApproval = async (status: 'approved' | 'rejected') => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/campaigns/${params.id}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comments }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit approval');
      }

      router.push(`/${locale}/campaigns`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading || roleLoading) {
    return <div className="text-white">{tCommon('loading')}</div>;
  }

  if (!campaign) {
    return <div className="text-red-400">{t('notFound')}</div>;
  }

  const hasApproved = approvals.some(a => a.status === 'approved');
  const hasRejected = approvals.some(a => a.status === 'rejected');
  const canApprove = isClient && !hasApproved && !hasRejected;

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} />

      {/* Informações da Campanha */}
      <GlowCard>
        <h2 className="text-2xl font-bold text-white mb-4">{campaign.name}</h2>
        {campaign.description && (
          <p className="text-gray-300 mb-4">{campaign.description}</p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">{t('platform')}:</span>
            <span className="text-white ml-2">{campaign.platform}</span>
          </div>
          {campaign.budget && (
            <div>
              <span className="text-gray-400">{t('budget')}:</span>
              <span className="text-white ml-2">
                ${campaign.budget.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </GlowCard>

      {/* Status de Aprovação */}
      {(hasApproved || hasRejected) && (
        <div className={`border-l-4 px-6 py-4 ${
          hasApproved 
            ? 'bg-green-500/10 border-green-500' 
            : 'bg-red-500/10 border-red-500'
        }`}>
          <p className={`font-medium ${
            hasApproved ? 'text-green-400' : 'text-red-400'
          }`}>
            {hasApproved ? t('approved') : t('rejected')}
          </p>
        </div>
      )}

      {/* Formulário de Aprovação */}
      {canApprove && (
        <GlowCard>
          <h3 className="text-xl font-semibold text-white mb-4">
            {t('approveOrReject')}
          </h3>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('comments')}
            </label>
            <textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={t('commentsPlaceholder')}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleApproval('approved')}
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {submitting ? tCommon('loading') : t('approve')}
            </button>
            <button
              onClick={() => handleApproval('rejected')}
              disabled={submitting}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {submitting ? tCommon('loading') : t('reject')}
            </button>
          </div>
        </GlowCard>
      )}

      {/* Histórico de Aprovações */}
      {approvals.length > 0 && (
        <GlowCard>
          <h3 className="text-xl font-semibold text-white mb-4">
            {t('history')}
          </h3>
          <div className="space-y-3">
            {approvals.map((approval) => (
              <div
                key={approval.id}
                className="border-l-2 border-gray-700 pl-4 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    approval.status === 'approved'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {approval.status === 'approved' ? t('approved') : t('rejected')}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(approval.created_at).toLocaleString()}
                  </span>
                </div>
                {approval.comments && (
                  <p className="text-gray-400 text-sm mt-2">{approval.comments}</p>
                )}
              </div>
            ))}
          </div>
        </GlowCard>
      )}
    </div>
  );
}
