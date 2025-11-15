'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { Navbar } from '@/components/layout/navbar';
import { GlowButton, GlowCard } from '@/components/glow';
import { Plus, Copy, Edit, Eye } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export default function CampaignsPage() {
  const t = useTranslations('campaigns');
  const tCommon = useTranslations('common');
  const { locale } = useParams();
  const router = useRouter();
  const { isReadOnly } = useUserRole();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setCampaigns(data);
    }
    setLoading(false);
  }

  async function handleDuplicate(e: React.MouseEvent, campaignId: string) {
    e.preventDefault();
    e.stopPropagation();
    
    setDuplicating(campaignId);
    
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/duplicate`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to duplicate campaign');
      }

      const duplicated = await res.json();
      
      // Recarregar lista de campanhas
      await loadCampaigns();
      
      // Redirecionar para a campanha duplicada
      router.push(`/${locale}/campaigns/${duplicated.id}/edit`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDuplicating(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          {!isReadOnly && (
            <Link href={`/${locale}/campaigns/new`}>
              <GlowButton className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>{t('newCampaign')}</span>
              </GlowButton>
            </Link>
          )}
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">{t('noCampaigns')}</p>
            {!isReadOnly && (
              <Link href={`/${locale}/campaigns/new`}>
                <GlowButton>{t('createFirst')}</GlowButton>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="relative">
                <Link href={`/${locale}/campaigns/${campaign.id}/insights`}>
                  <GlowCard glow className="h-full cursor-pointer hover:scale-105 transition-transform">
                    <h3 className="text-xl font-semibold text-white mb-2">{campaign.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{campaign.platform}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">{t('budget')}</span>
                        <span className="text-white font-medium">${campaign.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">{t('spent')}</span>
                        <span className="text-white font-medium">${campaign.spent.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">{t('impressions')}</span>
                        <span className="text-white font-medium">{campaign.impressions.toLocaleString()}</span>
                      </div>
                    </div>
                  </GlowCard>
                </Link>
                
                {/* Botões de ação */}
                {!isReadOnly && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Link href={`/${locale}/campaigns/${campaign.id}/edit`}>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        title={t('edit')}
                      >
                        <Edit className="w-4 h-4 text-white" />
                      </button>
                    </Link>
                    <button
                      onClick={(e) => handleDuplicate(e, campaign.id)}
                      disabled={duplicating === campaign.id}
                      className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg transition-colors"
                      title={t('duplicate')}
                    >
                      {duplicating === campaign.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
