'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { GlowCard } from '@/components/glow';

interface Campaign {
  id: string;
  name: string;
  goal?: string;
  description?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  platform: string;
  status: string;
}

export default function EditCampaignPage() {
  const t = useTranslations('campaigns');
  const tCommon = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/campaigns/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setCampaign(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/campaigns/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update campaign');
      }

      router.push(`/${locale}/campaigns`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Campaign, value: any) => {
    setCampaign(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) return <div className="text-white">{tCommon('loading')}</div>;
  if (!campaign) return <div className="text-red-400">{t('notFound')}</div>;

  return (
    <div className="space-y-6">
      <PageHeader title={t('editCampaign')} />
      <GlowCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('name')} *
            </label>
            <input
              type="text"
              required
              value={campaign.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('goal')}
            </label>
            <input
              type="text"
              value={campaign.goal || ''}
              onChange={(e) => handleChange('goal', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('description')}
            </label>
            <textarea
              rows={4}
              value={campaign.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('budget')}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={campaign.budget || ''}
              onChange={(e) => handleChange('budget', parseFloat(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('startDate')}
              </label>
              <input
                type="date"
                value={campaign.start_date || ''}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('endDate')}
              </label>
              <input
                type="date"
                value={campaign.end_date || ''}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('platform')} *
            </label>
            <select
              required
              value={campaign.platform}
              onChange={(e) => handleChange('platform', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="google">Google Ads</option>
              <option value="meta">Meta Ads</option>
              <option value="tiktok">TikTok Ads</option>
              <option value="linkedin">LinkedIn Ads</option>
              <option value="x">X (Twitter) Ads</option>
              <option value="youtube">YouTube Ads</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('status')} *
            </label>
            <select
              required
              value={campaign.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="draft">{t('statusDraft')}</option>
              <option value="active">{t('statusActive')}</option>
              <option value="paused">{t('statusPaused')}</option>
              <option value="completed">{t('statusCompleted')}</option>
              <option value="archived">{t('statusArchived')}</option>
            </select>
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {saving ? tCommon('saving') : tCommon('save')}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {tCommon('cancel')}
            </button>
          </div>
        </form>
      </GlowCard>
    </div>
  );
}
